// services/whatsappService.js
// ✅ PROXY verso bot WhatsApp sul VPS Hetzner
// Non usa più Baileys locale - tutto passa dal VPS
import logger from '../config/logger.js';

const BOT_URL = process.env.WHATSAPP_BOT_URL || 'http://89.167.119.31:3000';
const BOT_API_KEY = process.env.WHATSAPP_BOT_API_KEY || 'pastificio-bot-2026';

let _connected = false;
let _lastCheck = 0;

// Helper per chiamare il bot VPS
async function callBot(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BOT_API_KEY
      },
      signal: AbortSignal.timeout(10000) // 10s timeout
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${BOT_URL}${endpoint}`, options);
    const data = await response.json();
    return data;
  } catch (err) {
    logger.warn(`WhatsApp VPS non raggiungibile: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Controlla stato connessione (con cache 30s)
async function checkConnection() {
  const now = Date.now();
  if (now - _lastCheck < 30000) return _connected;
  
  try {
    const data = await callBot('/health');
    _connected = data.bot === 'connesso';
    _lastCheck = now;
    return _connected;
  } catch (err) {
    _connected = false;
    _lastCheck = now;
    return false;
  }
}

// ========== API PUBBLICA (compatibile con codice esistente) ==========

export async function initialize() {
  logger.info('🔌 WhatsApp Web Auto-Open attivato');
  logger.info('💡 Usa il browser WhatsApp Web già collegato');
  logger.info('📱 Numero: 3898879833');
  
  await checkConnection();
  
  if (_connected) {
    logger.info('✅ WhatsApp VPS connesso e pronto');
  } else {
    logger.warn('⚠️ WhatsApp VPS non raggiungibile - i messaggi verranno accodati');
  }
}

export function isReady() {
  // Controlla in background senza bloccare
  checkConnection().catch(() => {});
  return _connected;
}

export function getStatus() {
  return {
    connected: _connected,
    status: _connected ? 'connected' : 'disconnected',
    numero: '3898879833',
    source: 'vps-bot',
    botUrl: BOT_URL
  };
}

export function getQRCode() {
  return null; // QR gestito dal VPS
}

export function getInfo() {
  return {
    platform: 'VPS Hetzner',
    botUrl: BOT_URL,
    connected: _connected
  };
}

// Invio messaggio - compatibile con tutti i chiamanti esistenti
export async function inviaMessaggio(numero, messaggio) {
  try {
    if (!numero || !messaggio) {
      return { success: false, error: 'Numero e messaggio obbligatori' };
    }

    // Pulisci numero
    let tel = String(numero).replace(/[\s\+\-\(\)]/g, '');
    
    // Aggiungi prefisso Italia se manca
    if (tel.startsWith('3') && tel.length === 10) {
      tel = '39' + tel;
    }

    const data = await callBot('/api/invia-messaggio', 'POST', {
      telefono: tel,
      messaggio: messaggio
    });

    if (data.success) {
      logger.info(`✅ WhatsApp inviato a ${tel}`);
    } else {
      logger.error(`❌ WhatsApp fallito a ${tel}: ${data.error}`);
    }

    return data;
  } catch (err) {
    logger.error(`❌ Errore invio WhatsApp: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Template messaggi - compatibile con schedulerWhatsApp
const TEMPLATES = {
  'promemoria-giorno-prima': (v) => [
    '🔔 *Promemoria Ritiro - Pastificio Nonna Claudia*',
    '',
    `Le ricordiamo il suo ordine per domani ${v.dataRitiro || ''} alle ${v.oraRitiro || '10:00'}.`,
    '',
    v.prodottiBreve ? '*Prodotti:*\n' + v.prodottiBreve + '\n' : '',
    '📍 Via Carmine 20/B, Assemini',
    '📞 070 944382',
    '',
    'A presto! 🍝'
  ].filter(Boolean).join('\n'),

  'ordine-pronto': (v) => [
    '🎉 *Il suo ordine è pronto!*',
    '',
    'Il suo ordine è pronto per il ritiro!',
    '',
    '📍 Via Carmine 20/B, Assemini',
    '📞 070 944382',
    '',
    'Vi aspettiamo! 🍝'
  ].join('\n'),

  'conferma-ordine': (v) => [
    '✅ *Conferma Ordine - Pastificio Nonna Claudia*',
    '',
    'Il suo ordine è stato confermato!',
    '',
    v.prodottiBreve ? '*Prodotti:*\n' + v.prodottiBreve + '\n' : '',
    v.totale ? `*Totale: €${Number(v.totale).toFixed(2)}*\n` : '',
    v.dataRitiro ? `📅 Ritiro: ${v.dataRitiro} alle ${v.oraRitiro || '10:00'}\n` : '',
    '📍 Via Carmine 20/B, Assemini',
    '📞 070 944382',
    '',
    'Grazie per aver scelto il Pastificio Nonna Claudia!'
  ].filter(Boolean).join('\n'),

  'report-giornaliero': (v) => [
    '📊 *Report Giornaliero*',
    '',
    `📅 ${v.data || new Date().toLocaleDateString('it-IT')}`,
    `📦 Ordini: ${v.totaleOrdini || 0}`,
    `💰 Incasso: €${v.totaleIncasso || '0.00'}`,
    '',
    v.dettagli || '',
    '',
    'Pastificio Nonna Claudia 🍝'
  ].filter(Boolean).join('\n'),

  'auguri-natale': () => [
    '🎄 *Buon Natale dal Pastificio Nonna Claudia!* 🎄',
    '',
    'Vi auguriamo un sereno Natale!',
    'Per ordini delle feste, contattateci al 070 944382.',
    '',
    '📍 Via Carmine 20/B, Assemini',
    'Auguri! 🍝🎁'
  ].join('\n'),

  'auguri-pasqua': () => [
    '🐣 *Buona Pasqua dal Pastificio Nonna Claudia!* 🐣',
    '',
    'Vi auguriamo una felice Pasqua!',
    'Per ordini, contattateci al 070 944382.',
    '',
    '📍 Via Carmine 20/B, Assemini',
    'Auguri! 🍝'
  ].join('\n')
};

export function generaMessaggioDaTemplate(templateName, variabili = {}) {
  const template = TEMPLATES[templateName];
  if (!template) {
    logger.warn(`Template WhatsApp non trovato: ${templateName}`);
    return `Messaggio dal Pastificio Nonna Claudia - ${templateName}`;
  }
  return template(variabili);
}

export async function inviaMessaggioConTemplate(numero, templateName, variabili = {}) {
  const messaggio = generaMessaggioDaTemplate(templateName, variabili);
  return inviaMessaggio(numero, messaggio);
}

export async function testConnection() {
  const connected = await checkConnection();
  return {
    success: true,
    connected,
    source: 'vps-bot',
    botUrl: BOT_URL
  };
}

export async function disconnect() {
  logger.info('WhatsApp disconnect richiesto - bot gira sul VPS');
  return { success: true, message: 'Bot gira sul VPS, usa systemctl per gestirlo' };
}

export async function restart() {
  logger.info('WhatsApp restart richiesto - bot gira sul VPS');
  return { success: true, message: 'Bot gira sul VPS: ssh root@89.167.119.31 → systemctl restart whatsapp-bot' };
}

// Default export per compatibilità
export default {
  initialize,
  isReady,
  getStatus,
  getQRCode,
  getInfo,
  inviaMessaggio,
  inviaMessaggioConTemplate,
  generaMessaggioDaTemplate,
  testConnection,
  disconnect,
  restart
};