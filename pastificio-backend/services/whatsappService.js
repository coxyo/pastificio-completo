// services/whatsappService_BAILEYS.js
// ✅ VERSIONE BAILEYS - Invio Automatico Senza Click
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../config/logger.js';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WhatsAppServiceBaileys {
  constructor() {
    this.sock = null;
    this.qrCode = null;
    this.connected = false;
    this.numeroAziendale = '3898879833';
    this.authFolder = path.join(__dirname, '../.whatsapp-auth');
    this.connectionRetries = 0;
    this.maxRetries = 3;
    
    // Crea cartella auth se non esiste
    if (!fs.existsSync(this.authFolder)) {
      fs.mkdirSync(this.authFolder, { recursive: true });
      logger.info('📁 Cartella auth WhatsApp creata');
    }
  }

  async initialize() {
    try {
      logger.info('🔌 Inizializzazione Baileys WhatsApp...');
      
      // Carica stato autenticazione
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
      
      // Ottieni ultima versione Baileys
      const { version, isLatest } = await fetchLatestBaileysVersion();
      logger.info(`📱 Baileys version: ${version.join('.')}, isLatest: ${isLatest}`);
      
      // Crea socket WhatsApp
      this.sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        printQRInTerminal: true, // ✅ Mostra QR in Railway logs
        browser: ['Pastificio Nonna Claudia', 'Chrome', '10.0'],
        defaultQueryTimeoutMs: undefined,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false // Non mostrare "online"
      });
      
      // ✅ EVENT: Aggiornamento credenziali
      this.sock.ev.on('creds.update', saveCreds);
      
      // ✅ EVENT: Aggiornamento connessione
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // QR Code generato
        if (qr) {
          logger.info('📷 QR Code generato');
          this.qrCode = await QRCode.toDataURL(qr);
          logger.info('✅ QR Code disponibile su: /api/whatsapp/qr');
        }
        
        // Connessione stabilita
        if (connection === 'open') {
          this.connected = true;
          this.qrCode = null;
          this.connectionRetries = 0;
          logger.info('✅ WhatsApp connesso e pronto!');
        }
        
        // Connessione chiusa
        if (connection === 'close') {
          this.connected = false;
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          logger.warn(`⚠️ Connessione chiusa. Motivo: ${lastDisconnect?.error}`);
          
          if (shouldReconnect && this.connectionRetries < this.maxRetries) {
            this.connectionRetries++;
            logger.info(`🔄 Riconnessione tentativo ${this.connectionRetries}/${this.maxRetries}...`);
            setTimeout(() => this.initialize(), 3000);
          } else if (this.connectionRetries >= this.maxRetries) {
            logger.error('❌ Massimo numero di riconnessioni raggiunto. Riavvia il server.');
          } else {
            logger.error('❌ Logout rilevato. Scansiona nuovo QR code.');
            // Elimina credenziali vecchie
            if (fs.existsSync(this.authFolder)) {
              fs.rmSync(this.authFolder, { recursive: true, force: true });
              fs.mkdirSync(this.authFolder, { recursive: true });
            }
          }
        }
      });
      
      // ✅ EVENT: Messaggi in arrivo (per log/debug)
      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
          for (const msg of messages) {
            if (!msg.key.fromMe && msg.message) {
              const from = msg.key.remoteJid;
              const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
              logger.info(`📩 Messaggio ricevuto da ${from}: ${text.substring(0, 50)}...`);
            }
          }
        }
      });
      
      return true;
      
    } catch (error) {
      logger.error('❌ Errore inizializzazione Baileys:', error);
      throw error;
    }
  }

  isReady() {
    return this.connected && this.sock !== null;
  }

  getQRCode() {
    return this.qrCode;
  }

  getStatus() {
    return {
      connected: this.connected,
      status: this.connected ? 'connected' : (this.qrCode ? 'waiting-qr' : 'disconnected'),
      numero: this.numeroAziendale,
      hasQR: this.qrCode !== null
    };
  }

  getInfo() {
    return {
      connected: this.connected,
      mode: 'baileys-automatic',
      numero: this.numeroAziendale,
      description: 'Baileys WhatsApp Web - Invio automatico senza click',
      version: 'Baileys v6.7.8',
      qrAvailable: this.qrCode !== null
    };
  }

  async inviaMessaggio(numero, messaggio) {
    try {
      if (!this.isReady()) {
        logger.error('❌ WhatsApp non connesso! Scansiona QR code.');
        return {
          success: false,
          error: 'WhatsApp non connesso. Vai su /api/whatsapp/qr per scannerizzare.',
          needsQR: true
        };
      }
      
      // Normalizza numero
      const numeroClean = numero.replace(/\D/g, '');
      const numeroWhatsApp = numeroClean.startsWith('39') ? numeroClean : '39' + numeroClean;
      const jid = `${numeroWhatsApp}@s.whatsapp.net`;
      
      logger.info(`📤 Invio messaggio a ${numeroWhatsApp}...`);
      
      // ✅ INVIO AUTOMATICO BAILEYS
      const result = await this.sock.sendMessage(jid, {
        text: messaggio
      });
      
      logger.info(`✅ Messaggio inviato con successo a ${numeroWhatsApp}`);
      
      return {
        success: true,
        messageId: result.key.id,
        numero: numeroWhatsApp,
        timestamp: new Date(),
        delivered: true
      };
      
    } catch (error) {
      logger.error(`❌ Errore invio messaggio a ${numero}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async inviaMessaggioConTemplate(numero, template, variabili = {}) {
    const messaggio = this.generaMessaggioDaTemplate(template, variabili);
    return this.inviaMessaggio(numero, messaggio);
  }

  generaMessaggioDaTemplate(template, variabili) {
    let messaggio = '';
    
    switch(template) {
      case 'conferma_ordine':
      case 'conferma-ordine':
        messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝\n\n` +
                   `✅ ORDINE CONFERMATO\n` +
                   `📅 Ritiro: ${variabili.dataRitiro || 'da definire'}\n` +
                   `⏰ Ora: ${variabili.oraRitiro || '10:00'}\n\n` +
                   `📦 *PRODOTTI:*\n${variabili.prodotti || ''}\n\n` +
                   `📍 Via Carmine 20/B, Assemini (CA)\n` +
                   `📞 389 887 9833\n\n` +
                   `Grazie per averci scelto! 🙏`;
        break;
        
      case 'promemoria-giorno-prima':
      case 'promemoria_ritiro':
        messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝\n\n` +
                   `🔔 *PROMEMORIA RITIRO*\n\n` +
                   `Gentile ${variabili.nomeCliente || 'Cliente'},\n` +
                   `le ricordiamo il suo ordine per domani ${variabili.dataRitiro || ''} alle ore ${variabili.oraRitiro || '10:00'}.\n\n` +
                   `📦 *PRODOTTI:*\n${variabili.prodottiBreve || variabili.prodotti || 'I tuoi prodotti'}\n\n` +
                   `📍 *DOVE:* Via Carmine 20/B, Assemini (CA)\n` +
                   `📞 *Per info:* 389 887 9833\n\n` +
                   `Grazie e a presto!\n` +
                   `Pastificio Nonna Claudia`;
        break;
        
      case 'ordine-pronto':
      case 'ordine_pronto':
        messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝\n\n` +
                   `✅ *ORDINE PRONTO PER IL RITIRO*\n\n` +
                   `${variabili.nomeCliente || 'Cliente'}, il tuo ordine è pronto!\n\n` +
                   `⏰ Ti aspettiamo alle ore ${variabili.oraRitiro || 'di chiusura'}\n` +
                   `📍 Via Carmine 20/B, Assemini (CA)\n\n` +
                   `A presto! 😊`;
        break;
        
      default:
        messaggio = variabili.messaggio || 'Messaggio dal Pastificio Nonna Claudia';
    }
    
    return messaggio;
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.connected = false;
      this.qrCode = null;
      logger.info('👋 WhatsApp disconnesso');
    }
  }

  async restart() {
    logger.info('🔄 Riavvio WhatsApp...');
    await this.disconnect();
    await this.initialize();
    return true;
  }

  // ✅ Metodo per testare connessione
  async testConnection() {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'Non connesso'
      };
    }
    
    try {
      // Test: invia messaggio a te stesso
      await this.inviaMessaggio(this.numeroAziendale, '🧪 Test connessione Baileys OK!');
      return {
        success: true,
        message: 'Messaggio di test inviato al numero aziendale'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ✅ ESPORTA ISTANZA SINGLETON
const instance = new WhatsAppServiceBaileys();

// ✅ NAMED EXPORTS
export const isReady = () => instance.isReady();
export const inviaMessaggio = (numero, messaggio) => instance.inviaMessaggio(numero, messaggio);
export const inviaMessaggioConTemplate = (numero, template, variabili) => instance.inviaMessaggioConTemplate(numero, template, variabili);
export const generaMessaggioDaTemplate = (template, variabili) => instance.generaMessaggioDaTemplate(template, variabili);
export const getStatus = () => instance.getStatus();
export const getInfo = () => instance.getInfo();
export const getQRCode = () => instance.getQRCode();
export const initialize = () => instance.initialize();
export const disconnect = () => instance.disconnect();
export const restart = () => instance.restart();
export const testConnection = () => instance.testConnection();

// ✅ EXPORT DEFAULT
export default instance;