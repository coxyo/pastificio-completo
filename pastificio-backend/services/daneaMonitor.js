// services/daneaMonitor.js - SISTEMA IMPORT AUTOMATICO FATTURE DANEA
// ✅ Monitora cartella XML Danea in tempo reale
// ✅ Parse fatture elettroniche
// ✅ Match intelligente prodotti
// ✅ Aggiornamento magazzino automatico
// ✅ Notifiche WhatsApp

import chokidar from 'chokidar';
import { parseString } from 'xml2js';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import Movimento from '../models/Movimento.js';
import Prodotto from '../models/Prodotto.js';
import whatsappService from './whatsappService.js';

const parseXML = promisify(parseString);

class DaneaMonitorService {
  constructor() {
    this.watcher = null;
    this.isRunning = false;
    this.stats = {
      fattureProcessate: 0,
      prodottiCaricati: 0,
      prodottiNonRiconosciuti: 0,
      errori: 0,
      ultimoProcessamento: null
    };
    
    // ✅ PERCORSO CONFIGURATO - Cartella export manuale Danea
    this.DANEA_FOLDER = 'C:/Danea/Export/InArrivo';
    
    // Cartella backup fatture processate
    this.PROCESSED_FOLDER = path.join(this.DANEA_FOLDER, '../processati');
    
    console.log('🏭 [DaneaMonitor] Servizio inizializzato');
    console.log(`📂 Cartella monitorata: ${this.DANEA_FOLDER}`);
  }

  // ✅ AVVIA MONITORING
  start() {
    if (this.isRunning) {
      console.log('⚠️ [DaneaMonitor] Servizio già in esecuzione');
      return;
    }

    console.log('🚀 [DaneaMonitor] Avvio monitoring cartella Danea...');

    try {
      // Verifica che la cartella esista
      if (!fs.existsSync(this.DANEA_FOLDER)) {
        console.error(`❌ [DaneaMonitor] Cartella non trovata: ${this.DANEA_FOLDER}`);
        console.log('💡 Configura il percorso corretto in daneaMonitor.js');
        return;
      }

      // Crea cartella processati se non esiste
      if (!fs.existsSync(this.PROCESSED_FOLDER)) {
        fs.mkdirSync(this.PROCESSED_FOLDER, { recursive: true });
        console.log(`📁 Creata cartella: ${this.PROCESSED_FOLDER}`);
      }

      // Inizializza watcher
      this.watcher = chokidar.watch(this.DANEA_FOLDER, {
        persistent: true,
        ignoreInitial: false, // Processa anche file esistenti
        awaitWriteFinish: {
          stabilityThreshold: 2000, // Aspetta 2s che il file sia stabile
          pollInterval: 100
        },
        depth: 0, // Solo file nella cartella principale
        ignored: /(^|[\/\\])\../ // Ignora file nascosti
      });

      // Event: nuovo file rilevato
      this.watcher.on('add', async (filePath) => {
        if (path.extname(filePath).toLowerCase() === '.xml') {
          console.log(`\n📥 [DaneaMonitor] Nuovo file XML: ${path.basename(filePath)}`);
          await this.processaFattura(filePath);
        }
      });

      // Event: errore watcher
      this.watcher.on('error', (error) => {
        console.error('❌ [DaneaMonitor] Errore watcher:', error);
        this.stats.errori++;
      });

      this.isRunning = true;
      console.log('✅ [DaneaMonitor] Monitoring attivo!');
      console.log('👀 In attesa di nuove fatture XML...\n');

    } catch (error) {
      console.error('❌ [DaneaMonitor] Errore avvio:', error);
      this.stats.errori++;
    }
  }

  // ✅ FERMA MONITORING
  stop() {
    if (!this.isRunning) return;

    console.log('🛑 [DaneaMonitor] Arresto monitoring...');
    if (this.watcher) {
      this.watcher.close();
    }
    this.isRunning = false;
    console.log('✅ [DaneaMonitor] Monitoring arrestato');
  }

  // ✅ PROCESSA SINGOLA FATTURA
  async processaFattura(filePath) {
    const nomeFile = path.basename(filePath);
    
    try {
      console.log(`📄 Lettura file: ${nomeFile}`);
      
      // 1. Leggi XML
      const xmlContent = fs.readFileSync(filePath, 'utf-8');
      
      // 2. Parse XML
      const result = await parseXML(xmlContent);
      
      if (!result.FatturaElettronica) {
        console.warn('⚠️ File XML non è una fattura elettronica valida');
        return;
      }

      const fattura = result.FatturaElettronica;
      const header = fattura.FatturaElettronicaHeader[0];
      const body = fattura.FatturaElettronicaBody[0];

      // 3. Estrai dati fornitore
      const cedente = header.CedentePrestatore[0];
      const fornitore = cedente.DatiAnagrafici[0].Anagrafica[0];
      const nomeFornitore = fornitore.Denominazione 
        ? fornitore.Denominazione[0] 
        : `${fornitore.Nome[0]} ${fornitore.Cognome[0]}`;

      // 4. Estrai dati documento
      const datiDoc = body.DatiGenerali[0].DatiGeneraliDocumento[0];
      const numeroFattura = datiDoc.Numero[0];
      const dataFattura = datiDoc.Data[0];

      console.log(`\n🏭 Fornitore: ${nomeFornitore}`);
      console.log(`📋 Fattura n. ${numeroFattura} del ${dataFattura}`);

      // 5. Estrai righe prodotti
      const righe = body.DatiBeniServizi[0].DettaglioLinee || [];
      
      console.log(`📦 Trovate ${righe.length} righe prodotto\n`);

      let prodottiCaricati = 0;
      let prodottiNonRiconosciuti = 0;

      // 6. Processa ogni riga
      for (const riga of righe) {
        const descrizione = riga.Descrizione[0];
        const quantita = parseFloat(riga.Quantita[0]);
        const prezzoUnitario = parseFloat(riga.PrezzoUnitario[0]);
        const prezzoTotale = parseFloat(riga.PrezzoTotale[0]);
        
        // Codice articolo (se presente)
        const codiceArticolo = riga.CodiceArticolo 
          ? riga.CodiceArticolo[0].CodiceValore[0]
          : null;

        console.log(`  📦 ${descrizione}`);
        console.log(`     Quantità: ${quantita} | Prezzo: €${prezzoUnitario} | Totale: €${prezzoTotale}`);
        if (codiceArticolo) {
          console.log(`     Codice: ${codiceArticolo}`);
        }

        // 7. Match prodotto
        const prodottoMagazzino = await this.matchProdotto({
          descrizione,
          codiceArticolo,
          fornitore: nomeFornitore
        });

        if (prodottoMagazzino) {
          // 8. Crea movimento carico
          await this.creaMovimentoCarico({
            prodotto: prodottoMagazzino,
            quantita,
            prezzoUnitario,
            prezzoTotale,
            fornitore: nomeFornitore,
            numeroFattura,
            dataFattura,
            descrizioneOriginale: descrizione,
            codiceArticolo,
            fileXML: nomeFile
          });

          console.log(`     ✅ Caricato in magazzino: ${prodottoMagazzino.nome}`);
          prodottiCaricati++;

        } else {
          console.log(`     ⚠️ Prodotto NON riconosciuto`);
          prodottiNonRiconosciuti++;
          
          // Salva per revisione manuale
          await this.salvaProdottoNonRiconosciuto({
            descrizione,
            codiceArticolo,
            fornitore: nomeFornitore,
            numeroFattura,
            dataFattura
          });
        }
        
        console.log(''); // Riga vuota
      }

      // 9. Aggiorna statistiche
      this.stats.fattureProcessate++;
      this.stats.prodottiCaricati += prodottiCaricati;
      this.stats.prodottiNonRiconosciuti += prodottiNonRiconosciuti;
      this.stats.ultimoProcessamento = new Date();

      // 10. Invia notifica WhatsApp
      await this.inviaNotificaFattura({
        fornitore: nomeFornitore,
        numeroFattura,
        dataFattura,
        righe: righe.length,
        prodottiCaricati,
        prodottiNonRiconosciuti
      });

      // 11. Sposta XML in processati
      const destinazione = path.join(this.PROCESSED_FOLDER, nomeFile);
      fs.renameSync(filePath, destinazione);
      console.log(`📁 File spostato in: ${path.basename(this.PROCESSED_FOLDER)}`);

      console.log(`\n✅ Fattura processata completamente!`);
      console.log(`   Caricati: ${prodottiCaricati} | Non riconosciuti: ${prodottiNonRiconosciuti}\n`);

    } catch (error) {
      console.error(`❌ Errore processamento ${nomeFile}:`, error.message);
      this.stats.errori++;
      
      // Notifica errore
      await whatsappService.sendMessage(
        process.env.WHATSAPP_NOTIF_NUMBER || '3898879833',
        `❌ ERRORE import fattura!\n\n` +
        `File: ${nomeFile}\n` +
        `Errore: ${error.message}`
      );
    }
  }

  // ✅ MATCH INTELLIGENTE PRODOTTO
  async matchProdotto({ descrizione, codiceArticolo, fornitore }) {
    try {
      // 1. Match per codice articolo (se presente)
      if (codiceArticolo) {
        const prodotto = await Prodotto.findOne({
          'fornitori.codice': codiceArticolo
        });
        if (prodotto) {
          console.log(`     💡 Match per codice: ${codiceArticolo}`);
          return prodotto;
        }
      }

      // 2. Match per parole chiave nella descrizione
      const keywords = this.estraiParoleChiave(descrizione);
      
      for (const keyword of keywords) {
        const prodotto = await Prodotto.findOne({
          nome: new RegExp(keyword, 'i')
        });
        if (prodotto) {
          console.log(`     💡 Match per keyword: "${keyword}"`);
          return prodotto;
        }
      }

      // 3. Match fuzzy (parziale)
      const primaParola = descrizione.split(' ')[0];
      if (primaParola.length > 3) {
        const prodotto = await Prodotto.findOne({
          nome: new RegExp(primaParola, 'i')
        });
        if (prodotto) {
          console.log(`     💡 Match fuzzy: "${primaParola}"`);
          return prodotto;
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Errore match prodotto:', error);
      return null;
    }
  }

  // ✅ ESTRAI PAROLE CHIAVE
  estraiParoleChiave(descrizione) {
    // Parole comuni da ignorare
    const stopWords = [
      'da', 'di', 'in', 'per', 'con', 'kg', 'gr', 'lt', 'pz', 'pezzi',
      'confezione', 'conf', 'busta', 'sacco', 'sacchetto'
    ];

    return descrizione
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Rimuovi punteggiatura
      .split(/\s+/)
      .filter(parola => {
        return parola.length > 3 && !stopWords.includes(parola);
      })
      .sort((a, b) => b.length - a.length) // Più lunghe prima
      .slice(0, 3); // Top 3
  }

  // ✅ CREA MOVIMENTO CARICO MAGAZZINO
  async creaMovimentoCarico(dati) {
    try {
      const movimento = new Movimento({
        tipo: 'carico',
        prodotto: dati.prodotto._id,
        quantita: dati.quantita,
        unita: dati.prodotto.unita,
        prezzoUnitario: dati.prezzoUnitario,
        valore: dati.prezzoTotale,
        fornitore: dati.fornitore,
        numeroDocumento: dati.numeroFattura,
        dataDocumento: new Date(dati.dataFattura),
        note: `Import automatico fattura ${dati.numeroFattura}\n` +
              `Descrizione originale: ${dati.descrizioneOriginale}\n` +
              `${dati.codiceArticolo ? `Codice: ${dati.codiceArticolo}\n` : ''}` +
              `File: ${dati.fileXML}`,
        fonte: 'Danea EasyFatt',
        automatico: true,
        dataMovimento: new Date()
      });

      await movimento.save();

      // Aggiorna giacenza prodotto
      dati.prodotto.giacenza += dati.quantita;
      await dati.prodotto.save();

      console.log(`     💾 Movimento salvato: +${dati.quantita} ${dati.prodotto.unita}`);

      return movimento;

    } catch (error) {
      console.error('❌ Errore creazione movimento:', error);
      throw error;
    }
  }

  // ✅ SALVA PRODOTTO NON RICONOSCIUTO
  async salvaProdottoNonRiconosciuto(dati) {
    try {
      // Salva in una collection dedicata per revisione manuale
      const ProdottoSconosciuto = mongoose.model('ProdottoSconosciuto', {
        descrizione: String,
        codiceArticolo: String,
        fornitore: String,
        numeroFattura: String,
        dataFattura: Date,
        dataRilevamento: { type: Date, default: Date.now },
        stato: { type: String, default: 'pending' } // pending, associato, ignorato
      });

      await ProdottoSconosciuto.create(dati);

    } catch (error) {
      console.error('❌ Errore salvataggio prodotto sconosciuto:', error);
    }
  }

  // ✅ INVIA NOTIFICA WHATSAPP
  async inviaNotificaFattura(dati) {
    try {
      let messaggio = `📥 *NUOVA FATTURA IMPORTATA*\n\n`;
      messaggio += `🏭 Fornitore: ${dati.fornitore}\n`;
      messaggio += `📋 Fattura: ${dati.numeroFattura}\n`;
      messaggio += `📅 Data: ${dati.dataFattura}\n`;
      messaggio += `📦 Righe totali: ${dati.righe}\n\n`;
      messaggio += `✅ Caricati: ${dati.prodottiCaricati} prodotti\n`;
      
      if (dati.prodottiNonRiconosciuti > 0) {
        messaggio += `⚠️ Non riconosciuti: ${dati.prodottiNonRiconosciuti}\n`;
        messaggio += `\n💡 Verifica nel gestionale`;
      } else {
        messaggio += `\n🎉 Tutti i prodotti riconosciuti!`;
      }

      await whatsappService.sendMessage(
        process.env.WHATSAPP_NOTIF_NUMBER || '3898879833',
        messaggio
      );

    } catch (error) {
      console.error('❌ Errore invio notifica WhatsApp:', error);
    }
  }

  // ✅ STATISTICHE
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      cartella: this.DANEA_FOLDER,
      cartellaProcessati: this.PROCESSED_FOLDER
    };
  }
}

// Singleton
const daneaMonitor = new DaneaMonitorService();

export default daneaMonitor;
