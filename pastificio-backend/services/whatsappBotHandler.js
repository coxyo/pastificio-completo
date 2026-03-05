// services/whatsappBotHandler.js
// Integrazione bot FAQ con Baileys, lookup cliente MongoDB, notifiche operatori

import logger from '../config/logger.js';
import Cliente from '../models/Cliente.js';
import pusherService from './pusherService.js';
import { processaMessaggio, testoNotificaOperatori } from './whatsappBotService.js';

// ═══════════════════════════════════════════════════════════════════════════
// NUMERI OPERATORI (da variabili d'ambiente)
// ═══════════════════════════════════════════════════════════════════════════

function getNumeriOperatori() {
  const numeri = [];
  if (process.env.WHATSAPP_MAURIZIO) numeri.push(process.env.WHATSAPP_MAURIZIO);
  if (process.env.WHATSAPP_FRANCESCA) numeri.push(process.env.WHATSAPP_FRANCESCA);
  if (process.env.WHATSAPP_VALENTINA) numeri.push(process.env.WHATSAPP_VALENTINA);
  return numeri;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICHE IN-MEMORY (per endpoint /stats)
// ═══════════════════════════════════════════════════════════════════════════

const botStats = {
  totaleMessaggi: 0,
  perTipo: {},
  escalation: 0,
  ultimiMessaggi: [],   // Ultimi 50 per monitor frontend
  avviato: new Date().toISOString(),
};

function aggiornaStats(entry) {
  botStats.totaleMessaggi++;
  const tipo = entry.intent?.tipo || 'sconosciuto';
  botStats.perTipo[tipo] = (botStats.perTipo[tipo] || 0) + 1;
  if (entry.escalation) botStats.escalation++;

  // Mantieni ultimi 50 messaggi
  botStats.ultimiMessaggi.unshift(entry);
  if (botStats.ultimiMessaggi.length > 50) botStats.ultimiMessaggi.pop();
}

// ═══════════════════════════════════════════════════════════════════════════
// LOOKUP CLIENTE DA MONGODB
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cerca un cliente nel DB a partire dal JID WhatsApp (es. "393398879833@s.whatsapp.net").
 * Match sugli ultimi 9 digit del telefono (robusto rispetto al formato salvato).
 *
 * @param {string} jid - JID WhatsApp del mittente
 * @returns {Promise<Object|null>} Documento Cliente MongoDB o null
 */
async function trovaClliente(jid) {
  try {
    // Estrai solo i digit dal JID (es. "393398879833@s.whatsapp.net" → "393398879833")
    const digitJid = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '');

    // Ultimi 9 digit sono il numero nazionale (es. "398879833")
    const ultimi9 = digitJid.slice(-9);

    if (!ultimi9 || ultimi9.length < 8) return null;

    // Cerca nel DB: il campo telefono può essere salvato in vari formati
    // Es: "3398879833", "+393398879833", "0338887833", ecc.
    const clienti = await Cliente.find({ attivo: true })
      .select('nome cognome telefono ragioneSociale tipo')
      .limit(100)
      .lean();

    const trovato = clienti.find(c => {
      if (!c.telefono) return false;
      const digitDb = c.telefono.replace(/\D/g, '');
      return digitDb.endsWith(ultimi9);
    });

    return trovato || null;
  } catch (err) {
    logger.error('Errore lookup cliente WhatsApp:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICA OPERATORI VIA WHATSAPP + PUSHER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Invia la notifica di escalation agli operatori su WhatsApp e via Pusher.
 *
 * @param {Object} sock - Istanza socket Baileys
 * @param {string} numeroPulito - Numero mittente senza @s.whatsapp.net
 * @param {string} testoOriginale
 * @param {Object|null} cliente - Documento MongoDB cliente
 * @param {string} motivo
 */
async function notificaOperatori(sock, numeroPulito, testoOriginale, cliente, motivo) {
  const nomeCliente = cliente
    ? (cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome || ''}`.trim())
    : null;

  const testo = testoNotificaOperatori(numeroPulito, testoOriginale, nomeCliente, motivo);

  // ── 1. Notifica WhatsApp agli operatori ──
  const numeriOperatori = getNumeriOperatori();
  for (const numero of numeriOperatori) {
    try {
      const jidOperatore = `${numero.replace(/\D/g, '')}@s.whatsapp.net`;
      await sock.sendMessage(jidOperatore, { text: testo });
      logger.info(`✅ Notifica escalation inviata a ${numero}`);
    } catch (err) {
      logger.error(`❌ Errore invio notifica a ${numero}:`, err);
    }
  }

  // ── 2. Notifica Pusher al gestionale ──
  try {
    await pusherService.trigger('operatori', 'nuovo-messaggio-bot', {
      numero: numeroPulito,
      nomeCliente,
      testoOriginale,
      motivo,
      timestamp: new Date().toISOString(),
      tipo: 'escalation',
    });
    logger.info('📡 Notifica Pusher escalation inviata');
  } catch (err) {
    logger.error('Errore notifica Pusher:', err);
    // Non blocchiamo il flusso per errori Pusher
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPALE — da chiamare nel listener messages.upsert
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gestisce un messaggio WhatsApp in arrivo con il bot FAQ.
 * Da chiamare nel listener messages.upsert di whatsappService.js.
 *
 * Esempio di utilizzo in whatsappService.js:
 * ```js
 * import { gestisciMessaggioBot } from './whatsappBotHandler.js';
 *
 * this.sock.ev.on('messages.upsert', async ({ messages }) => {
 *   const msg = messages[0];
 *   if (!msg.key.fromMe && msg.message) {
 *     const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
 *     logger.info(`📨 Messaggio ricevuto da ${msg.key.remoteJid}: ${text}`);
 *
 *     // ← AGGIUNGERE QUESTA RIGA:
 *     await gestisciMessaggioBot(this.sock, msg);
 *   }
 * });
 * ```
 *
 * @param {Object} sock - Istanza socket Baileys (this.sock)
 * @param {Object} msg  - Messaggio Baileys da messages.upsert
 */
export async function gestisciMessaggioBot(sock, msg) {
  // Ignora messaggi propri, notifiche di stato, messaggi senza testo
  if (msg.key.fromMe) return;
  if (!msg.message) return;

  const jid = msg.key.remoteJid;
  if (!jid || jid.includes('@g.us')) return; // Ignora gruppi

  const testo = (
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    ''
  ).trim();

  if (!testo) return; // Ignora messaggi senza testo (immagini, audio, ecc.)

  // Numero pulito per log e lookup
  const numeroPulito = jid.replace('@s.whatsapp.net', '');

  logger.info(`🤖 Bot: elaboro messaggio da ${numeroPulito}: "${testo.substring(0, 80)}"`);

  // ── Lookup cliente ──
  const cliente = await trovaClliente(jid);
  const nomeCliente = cliente
    ? (cliente.tipo === 'azienda'
        ? cliente.ragioneSociale
        : `${cliente.nome} ${cliente.cognome || ''}`.trim())
    : null;

  if (nomeCliente) {
    logger.info(`👤 Cliente riconosciuto: ${nomeCliente}`);
  }

  // ── Processa il messaggio ──
  let risultato;
  try {
    risultato = await processaMessaggio(testo, {
      nomeCliente,
      botEnabled: process.env.BOT_ENABLED !== 'false',
    });
  } catch (err) {
    logger.error('Errore processaMessaggio:', err);
    // Fallback sicuro: escalation senza risposta automatica
    risultato = {
      risposta: null,
      intent: { tipo: 'errore', prodotto: null, confidenza: 0 },
      escalation: true,
      motivo: 'errore_bot',
    };
  }

  const { risposta, intent, escalation, motivo } = risultato;

  // ── Log statistiche ──
  const entry = {
    timestamp: new Date().toISOString(),
    numero: numeroPulito,
    nomeCliente,
    testo: testo.substring(0, 200),
    intent,
    escalation,
    motivo,
    rispostaInviata: !!risposta,
  };
  aggiornaStats(entry);

  // ── Notifica Pusher per TUTTI i messaggi (non solo escalation) ──
  // Così il monitor frontend vede l'attività in tempo reale
  try {
    await pusherService.trigger('operatori', 'messaggio-bot', {
      ...entry,
      tipo: escalation ? 'escalation' : 'faq_automatica',
    });
  } catch (err) {
    // Non critico
    logger.warn('Pusher messaggio-bot non inviato:', err.message);
  }

  // ── Invia risposta automatica (se presente) ──
  if (risposta) {
    try {
      await sock.sendMessage(jid, { text: risposta });
      logger.info(`✅ Risposta bot inviata a ${numeroPulito} (intent: ${intent.tipo})`);
    } catch (err) {
      logger.error(`❌ Errore invio risposta bot a ${numeroPulito}:`, err);
    }
  }

  // ── Notifica operatori se escalation ──
  if (escalation && motivo !== 'bot_disabilitato') {
    // Piccolo delay per non sovraccaricare l'API Baileys
    setTimeout(async () => {
      try {
        await notificaOperatori(sock, numeroPulito, testo, cliente, motivo);
      } catch (err) {
        logger.error('Errore notificaOperatori:', err);
      }
    }, 1000);
  }
}

// Esporta anche le stats per l'endpoint /api/whatsapp-bot/stats
export { botStats };