// fatture-watcher.js
// Watcher locale per import automatico fatture XML Danea EasyFatt
// Gira sul PC Windows come servizio, monitora la cartella Fatture
// e carica automaticamente ogni nuovo XML sul backend del gestionale.
//
// Installazione: vedi installa-watcher.bat
// Log: watcher.log nella stessa cartella

import chokidar from 'chokidar';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// CONFIGURAZIONE - modifica solo questi valori se necessario
// ============================================================
const CONFIG = {
  // Cartella da monitorare
  CARTELLA_FATTURE: 'C:\\Users\\coxyo\\pastificio-completo\\Fatture',

  // URL backend Railway
  BACKEND_URL: 'https://pastificio-completo-production.up.railway.app/api',

  // Credenziali per autenticazione automatica
  USERNAME: 'maurizio',
PASSWORD: 'maurizio8547',

  // Cartella dove spostare i file processati
  CARTELLA_PROCESSATI: 'C:\\Users\\coxyo\\pastificio-completo\\Fatture\\processati',

  // Attendi X millisecondi che il file sia stabile prima di processarlo
  // (evita di leggere file ancora in scrittura da Danea)
  STABILITA_MS: 3000,

  // File di log
  LOG_FILE: path.join(__dirname, 'watcher.log'),
};
// ============================================================

// ---- LOGGING ----

function log(livello, messaggio) {
  const ora = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
  const riga = `[${ora}] [${livello}] ${messaggio}`;
  console.log(riga);
  try {
    fs.appendFileSync(CONFIG.LOG_FILE, riga + '\n');
  } catch (_) {}
}

// ---- TOKEN JWT ----

let tokenCache = null;
let tokenScadenza = null;

async function ottieniToken() {
  // Riusa il token se non e' scaduto (margine 5 minuti)
  if (tokenCache && tokenScadenza && Date.now() < tokenScadenza - 300000) {
    return tokenCache;
  }

  log('INFO', 'Login al gestionale...');

  const risposta = await fetch(`${CONFIG.BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: CONFIG.USERNAME,
      password: CONFIG.PASSWORD
    })
  });

  if (!risposta.ok) {
    throw new Error(`Login fallito: ${risposta.status} ${risposta.statusText}`);
  }

  const dati = await risposta.json();

  if (!dati.token && !dati.data?.token) {
    throw new Error('Token non ricevuto nella risposta login');
  }

  tokenCache = dati.token || dati.data?.token;
  // Token JWT tipicamente dura 24h; lo rinnova dopo 23h
  tokenScadenza = Date.now() + 23 * 60 * 60 * 1000;

  log('INFO', 'Login riuscito. Token valido per 23 ore.');
  return tokenCache;
}

// ---- PROCESSA SINGOLO FILE XML ----

async function processaFile(filePath) {
  const nomeFile = path.basename(filePath);
  log('INFO', `Nuovo file rilevato: ${nomeFile}`);

  try {
    // Verifica che il file esista ancora (potrebbe essere stato spostato)
    if (!fs.existsSync(filePath)) {
      log('WARN', `File scomparso prima del processing: ${nomeFile}`);
      return;
    }

    const token = await ottieniToken();

    // Leggi il file
    const contenutoFile = fs.readFileSync(filePath);

    // Prepara FormData (stesso formato del browser)
    const form = new FormData();
    form.append('fatture', contenutoFile, {
      filename: nomeFile,
      contentType: 'text/xml'
    });

    // Step 1: Upload e parsing
    log('INFO', `Invio ${nomeFile} al backend per parsing...`);

    const rispostaUpload = await fetch(`${CONFIG.BACKEND_URL}/import-fatture/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });

    if (!rispostaUpload.ok) {
      const errTesto = await rispostaUpload.text();
      throw new Error(`Upload fallito (${rispostaUpload.status}): ${errTesto.substring(0, 200)}`);
    }

    const datiUpload = await rispostaUpload.json();

    if (!datiUpload.success) {
      throw new Error(`Upload error: ${datiUpload.error}`);
    }

    const risultati = datiUpload.data?.risultati || [];

    // Gestisci ogni fattura trovata nel file (di solito 1, ma può essere ZIP con più file)
    for (const risultato of risultati) {
      await gestisciRisultatoFattura(risultato, token, nomeFile);
    }

    // Sposta il file in processati
    await spostaFileProcessato(filePath, nomeFile);

  } catch (errore) {
    log('ERROR', `Errore processing ${nomeFile}: ${errore.message}`);

    // Invia notifica errore al backend (che la girera' via Pusher + WhatsApp)
    try {
      const token = await ottieniToken().catch(() => null);
      if (token) {
        await fetch(`${CONFIG.BACKEND_URL}/import-fatture/notifica-errore`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nomeFile,
            errore: errore.message
          })
        });
      }
    } catch (_) {}
  }
}

// ---- GESTISCE IL RISULTATO DI UNA SINGOLA FATTURA ----

async function gestisciRisultatoFattura(risultato, token, nomeFileOriginale) {
  const nomeFile = risultato.file || nomeFileOriginale;

  // File duplicato: gia' importato in precedenza
  if (risultato.stato === 'duplicato') {
    log('WARN', `Fattura duplicata ignorata: ${nomeFile} - ${risultato.messaggio}`);
    return;
  }

  // Errore parsing
  if (risultato.stato === 'errore') {
    log('ERROR', `Errore parsing ${nomeFile}: ${risultato.messaggio}`);
    return;
  }

  // Fattura analizzata correttamente - procedi con l'import automatico
  if (risultato.stato === 'analizzato') {
    const fornitore = risultato.fornitore;
    const fattura = risultato.fattura;
    const righe = risultato.righe || [];
    const nomeFornitore = fornitore?.ragioneSociale ||
      `${fornitore?.nome || ''} ${fornitore?.cognome || ''}`.trim() ||
      'Fornitore sconosciuto';

    log('INFO', `Fattura analizzata: ${nomeFornitore} - N. ${fattura?.numero} - ${righe.length} righe`);

    // Chiama l'endpoint auto-import (conferma automatica)
    const rispostaConferma = await fetch(`${CONFIG.BACKEND_URL}/import-fatture/auto-import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fattura: {
          ...fattura,
          fornitore,
          documento: {
            numero: fattura?.numero,
            data: fattura?.data,
            tipoDocumento: fattura?.tipoDocumento
          },
          importoTotale: risultato.totali?.totale || 0,
          imponibile: risultato.totali?.imponibile || 0,
          imposta: risultato.totali?.iva || 0,
          ddt: risultato.ddt || []
        },
        righe,
        fileInfo: risultato.fileInfo || { nome: nomeFile, hash: null },
        sorgente: 'watcher_automatico'
      })
    });

    if (!rispostaConferma.ok) {
      const errTesto = await rispostaConferma.text();
      throw new Error(`Auto-import fallito (${rispostaConferma.status}): ${errTesto.substring(0, 200)}`);
    }

    const datiConferma = await rispostaConferma.json();

    if (!datiConferma.success) {
      throw new Error(`Auto-import error: ${datiConferma.error}`);
    }

    const stats = datiConferma.data?.statistiche || {};
    log('INFO', [
      `Import completato: ${nomeFornitore}`,
      `Importate: ${stats.righeImportate || 0}`,
      `Ignorate: ${stats.righeIgnorate || 0}`,
      `Non riconosciute: ${stats.righeNonRiconosciute || 0}`
    ].join(' | '));
  }
}

// ---- SPOSTA FILE IN PROCESSATI ----

async function spostaFileProcessato(filePath, nomeFile) {
  try {
    // Crea cartella processati se non esiste
    if (!fs.existsSync(CONFIG.CARTELLA_PROCESSATI)) {
      fs.mkdirSync(CONFIG.CARTELLA_PROCESSATI, { recursive: true });
    }

    // Aggiungi timestamp al nome per evitare conflitti
    const ora = new Date();
    const timestamp = [
      ora.getFullYear(),
      String(ora.getMonth() + 1).padStart(2, '0'),
      String(ora.getDate()).padStart(2, '0'),
      '_',
      String(ora.getHours()).padStart(2, '0'),
      String(ora.getMinutes()).padStart(2, '0')
    ].join('');

    const nomeDestinazione = `${timestamp}_${nomeFile}`;
    const pathDestinazione = path.join(CONFIG.CARTELLA_PROCESSATI, nomeDestinazione);

    fs.renameSync(filePath, pathDestinazione);
    log('INFO', `File spostato in processati: ${nomeDestinazione}`);

  } catch (errore) {
    log('WARN', `Impossibile spostare file: ${errore.message} - rimane nella cartella originale`);
  }
}

// ---- AVVIO WATCHER ----

async function avvia() {
  log('INFO', '=== WATCHER FATTURE DANEA - AVVIO ===');
  log('INFO', `Cartella monitorata: ${CONFIG.CARTELLA_FATTURE}`);
  log('INFO', `Backend: ${CONFIG.BACKEND_URL}`);

  // Crea cartella se non esiste
  if (!fs.existsSync(CONFIG.CARTELLA_FATTURE)) {
    fs.mkdirSync(CONFIG.CARTELLA_FATTURE, { recursive: true });
    log('INFO', `Cartella creata: ${CONFIG.CARTELLA_FATTURE}`);
  }

  // Test login iniziale
  try {
    await ottieniToken();
    log('INFO', 'Connessione al gestionale verificata.');
  } catch (errore) {
    log('ERROR', `ATTENZIONE: Login fallito all'avvio - ${errore.message}`);
    log('ERROR', 'Verifica USERNAME e PASSWORD in fatture-watcher.js');
    // Non bloccare l'avvio: riprova al prossimo file
  }

  // Avvia watcher
  const watcher = chokidar.watch(CONFIG.CARTELLA_FATTURE, {
    persistent: true,
    ignoreInitial: true,         // Non processare file gia' presenti all'avvio
    awaitWriteFinish: {
      stabilityThreshold: CONFIG.STABILITA_MS,
      pollInterval: 200
    },
    depth: 0,                    // Solo file nella cartella radice (non sottocartelle)
    ignored: [
      /(^|[/\\])\../,            // File nascosti
      CONFIG.CARTELLA_PROCESSATI // Sottocartella processati
    ]
  });

  watcher.on('add', (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.xml' || ext === '.zip') {
      processaFile(filePath);
    }
  });

  watcher.on('error', (errore) => {
    log('ERROR', `Errore watcher: ${errore.message}`);
  });

  log('INFO', 'Watcher attivo. In attesa di nuovi file XML...');
  log('INFO', 'Copia i file XML Danea in: ' + CONFIG.CARTELLA_FATTURE);
}

avvia().catch((err) => {
  log('ERROR', `Errore fatale all'avvio: ${err.message}`);
  process.exit(1);
});