// services/whatsappService.js - VERSIONE BAILEYS DEFINITIVA
import pkg from 'baileys';
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = pkg;
import { Boom } from '@hapi/boom';
import logger from '../config/logger.js';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.ready = false;
    this.qrCode = null;
    this.connectionStatus = 'disconnected';
    this.authPath = path.join(__dirname, '..', '.baileys_auth');
  }

  async initialize() {
    try {
      logger.info('🚀 Inizializzazione WhatsApp Business con BAILEYS...');
      console.log('\n========================================');
      console.log('📱 USANDO BAILEYS - NON WHATSAPP-WEB.JS');
      console.log('========================================\n');
      
      // Crea cartella auth se non esiste
      if (!fs.existsSync(this.authPath)) {
        fs.mkdirSync(this.authPath, { recursive: true });
      }

      // Carica stato autenticazione
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
      
      // Crea connessione WhatsApp
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        defaultQueryTimeoutMs: 60000,
        browser: ['Pastificio Nonna Claudia', 'Chrome', '1.0.0']
      });

      // Gestione aggiornamento credenziali
      this.sock.ev.on('creds.update', saveCreds);

      // Gestione eventi connessione
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          // Genera QR Code
          logger.info('📱 QR Code ricevuto - SCANSIONA CON WHATSAPP!');
          console.log('\n========================================');
          console.log('📱 SCANSIONA IL QR CODE CON WHATSAPP');
          console.log('========================================');
          console.log('1. Apri WhatsApp sul telefono');
          console.log('2. Vai su Impostazioni > Dispositivi collegati');
          console.log('3. Tocca "Collega un dispositivo"');
          console.log('4. Scansiona il QR code nel terminale');
          console.log('========================================\n');
          
          // Salva QR per visualizzazione web
          try {
            this.qrCode = await qrcode.toDataURL(qr);
          } catch (err) {
            console.error('Errore generazione QR DataURL:', err);
          }
          this.connectionStatus = 'waiting_qr';
        }
        
        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
            ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
            : true;
            
          logger.warn('❌ Connessione WhatsApp chiusa');
          this.ready = false;
          this.connectionStatus = 'disconnected';
          
          if (shouldReconnect) {
            logger.info('🔄 Tentativo di riconnessione in 5 secondi...');
            setTimeout(() => this.initialize(), 5000);
          }
        } else if (connection === 'open') {
          logger.info('✅ WhatsApp CONNESSO con successo!');
          console.log('\n🎉🎉🎉 WHATSAPP CONNESSO CON BAILEYS! 🎉🎉🎉\n');
          this.ready = true;
          this.qrCode = null;
          this.connectionStatus = 'connected';
          
          // Notifica via socket se disponibile
          if (global.io) {
            global.io.emit('whatsapp:status', { connected: true });
          }
        }
      });

      // Gestione messaggi ricevuti
      this.sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.key.fromMe && msg.message) {
          const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
          logger.info(`📨 Messaggio ricevuto da ${msg.key.remoteJid}: ${text}`);
        }
      });
      
      return true;
    } catch (error) {
      logger.error('❌ Errore inizializzazione Baileys:', error);
      console.error('❌ ERRORE BAILEYS:', error.message);
      this.connectionStatus = 'error';
      return false;
    }
  }

  isReady() {
    return this.ready && this.sock !== null;
  }

  getQRCode() {
    return this.qrCode;
  }

  getStatus() {
    return {
      connected: this.ready,
      status: this.connectionStatus,
      hasQR: this.qrCode !== null
    };
  }

  async inviaMessaggio(numero, messaggio) {
    try {
      if (!this.isReady()) {
        logger.warn('WhatsApp non connesso - messaggio non inviato');
        throw new Error('WhatsApp Business non è connesso');
      }

      // Formatta il numero per WhatsApp
      let numeroFormattato = numero.replace(/\D/g, '');
      
      // Se è un numero italiano senza prefisso, aggiungi 39
      if (numeroFormattato.length === 10 && !numeroFormattato.startsWith('39')) {
        numeroFormattato = '39' + numeroFormattato;
      }
      
      // Formato WhatsApp JID
      const jid = numeroFormattato.includes('@s.whatsapp.net') 
        ? numeroFormattato 
        : `${numeroFormattato}@s.whatsapp.net`;
      
      logger.info(`📤 Invio messaggio WhatsApp a ${numero}...`);
      
      // Invia il messaggio
      const result = await this.sock.sendMessage(jid, { 
        text: messaggio 
      });
      
      logger.info(`✅ Messaggio WhatsApp inviato a ${numero}`);
      console.log(`✅ WhatsApp inviato a ${numero} - ID: ${result.key.id}`);
      
      return { 
        success: true, 
        messageId: result.key.id 
      };
      
    } catch (error) {
      logger.error('❌ Errore invio messaggio WhatsApp:', error);
      throw error;
    }
  }

  async inviaMessaggioConTemplate(numero, templateNome, variabili = {}) {
    try {
      // Template di base per ordini
      const templates = {
        'conferma-ordine': `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

✨ *ORDINE CONFERMATO* ✨

Gentile {{nomeCliente}},
grazie per aver scelto i nostri prodotti artigianali!

📋 *RIEPILOGO ORDINE:*
{{prodotti}}

💰 *TOTALE:* €{{totale}}

📅 *RITIRO:* {{dataRitiro}}
⏰ *ORA:* {{oraRitiro}}
📍 *DOVE:* Via Carmine 20/B, Assemini (CA)

{{note}}

📞 *INFO:* 389 887 9833
📱 *WhatsApp:* 389 887 9833

Grazie e a presto! 😊
_Pastificio Nonna Claudia_`,

        'promemoria-giorno-prima': `🍝 *PROMEMORIA ORDINE* 🍝

Ciao {{nomeCliente}}! 👋

Ti ricordiamo che domani potrai ritirare il tuo ordine:

📅 *{{dataRitiro}}*
⏰ *Ore {{oraRitiro}}*
📍 Via Carmine 20/B, Assemini (CA)

*I tuoi prodotti:*
{{prodottiBreve}}

Ti aspettiamo! 😊`,

        'ordine-pronto': `🍝 *ORDINE PRONTO!* 🍝

{{nomeCliente}}, il tuo ordine è *PRONTO* per il ritiro! 🎉

⏰ Ti aspettiamo alle *{{oraRitiro}}*
📍 Via Carmine 20/B, Assemini (CA)

Buon appetito! 🍽️`,

        'promemoria': `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

Promemoria: domani è previsto il ritiro del suo ordine.

📅 {{dataRitiro}} alle {{oraRitiro}}
📍 Via Carmine 20/B, Assemini (CA)

A domani! 😊`
      };
      
      let messaggio = templates[templateNome] || templates['conferma-ordine'];
      
      // Sostituisci le variabili
      Object.keys(variabili).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        messaggio = messaggio.replace(regex, variabili[key] || '');
      });
      
      // Invia il messaggio
      return await this.inviaMessaggio(numero, messaggio);
    } catch (error) {
      logger.error('Errore invio messaggio con template:', error);
      throw error;
    }
  }

  async inviaMessaggioBroadcast(numeri, messaggio, options = {}) {
    const risultati = [];
    const { delay = 2000, continueOnError = true } = options;
    
    for (const numero of numeri) {
      try {
        const result = await this.inviaMessaggio(numero, messaggio);
        risultati.push({ numero, success: true, result });
        
        // Delay tra messaggi per evitare ban
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        logger.error(`Errore invio a ${numero}:`, error);
        risultati.push({ numero, success: false, error: error.message });
        
        if (!continueOnError) {
          break;
        }
      }
    }
    
    return risultati;
  }

  async verificaNumero(numero) {
    try {
      if (!this.isReady()) {
        throw new Error('WhatsApp non è connesso');
      }
      
      // Formatta il numero
      let numeroFormattato = numero.replace(/\D/g, '');
      if (numeroFormattato.length === 10 && !numeroFormattato.startsWith('39')) {
        numeroFormattato = '39' + numeroFormattato;
      }
      
      const jid = `${numeroFormattato}@s.whatsapp.net`;
      
      // Verifica se il numero esiste su WhatsApp
      const [result] = await this.sock.onWhatsApp(jid);
      
      return {
        numero: numero,
        numeroFormattato: numeroFormattato,
        registrato: result?.exists || false
      };
    } catch (error) {
      logger.error('Errore verifica numero:', error);
      throw error;
    }
  }

  async getInfo() {
    try {
      if (!this.isReady()) {
        return {
          connected: false,
          status: this.connectionStatus
        };
      }
      
      const user = this.sock.user;
      return {
        connected: true,
        status: this.connectionStatus,
        info: {
          phoneNumber: user?.id?.split('@')[0],
          name: user?.name || 'Pastificio Nonna Claudia'
        }
      };
    } catch (error) {
      logger.error('Errore recupero info WhatsApp:', error);
      return {
        connected: false,
        status: 'error',
        error: error.message
      };
    }
  }

  disconnect() {
    try {
      if (this.sock) {
        this.sock.end();
        this.sock = null;
      }
      this.ready = false;
      this.qrCode = null;
      this.connectionStatus = 'disconnected';
      logger.info('WhatsApp disconnesso');
    } catch (error) {
      logger.error('Errore disconnessione WhatsApp:', error);
    }
  }

  async restart() {
    logger.info('Riavvio WhatsApp...');
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 2000));
    return await this.initialize();
  }
}

// Esporta l'istanza singleton
const whatsappService = new WhatsAppService();

// Esporta anche le funzioni direttamente per compatibilità
export const getQRCode = () => whatsappService.getQRCode();
export const getStatus = () => whatsappService.getStatus();
export const inviaMessaggio = (numero, messaggio) => whatsappService.inviaMessaggio(numero, messaggio);
export const inviaMessaggioConTemplate = (numero, template, variabili) => 
  whatsappService.inviaMessaggioConTemplate(numero, template, variabili);
export const inviaMessaggioBroadcast = (numeri, messaggio, options) => 
  whatsappService.inviaMessaggioBroadcast(numeri, messaggio, options);
export const verificaNumero = (numero) => whatsappService.verificaNumero(numero);
export const getInfo = () => whatsappService.getInfo();
export const initialize = () => whatsappService.initialize();
export const disconnect = () => whatsappService.disconnect();
export const restart = () => whatsappService.restart();
export const isReady = () => whatsappService.isReady();

export default whatsappService;