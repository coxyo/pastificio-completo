// services/whatsappService.js
// ✅ VERSIONE IBRIDA - QR + Istruzioni Pairing Manuale
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import QRCode from 'qrcode';
import logger from '../config/logger.js';

class WhatsAppServiceHybrid {
  constructor() {
    this.client = null;
    this.qrCode = null;
    this.pairingCode = null;
    this.connected = false;
    this.numeroAziendale = '393898879833';
    this.isInitialized = false;
  }

  async initialize() {
    try {
      logger.info('🔌 Inizializzazione WhatsApp Web.js...');
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './.wwebjs_auth'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      // ✅ EVENT: QR Code
      this.client.on('qr', async (qr) => {
        logger.info('📷 QR Code generato');
        
        // Mostra in terminal
        qrcode.generate(qr, { small: true });
        
        // Genera data URL
        this.qrCode = await QRCode.toDataURL(qr);
        logger.info('✅ QR Code disponibile su: /api/whatsapp-public/qr');
        logger.info('💡 ALTERNATIVA: Usa pairing code manuale dal telefono!');
      });

      // ✅ EVENT: Autenticazione
      this.client.on('authenticated', () => {
        logger.info('✅ WhatsApp autenticato!');
        this.qrCode = null;
        this.pairingCode = null;
      });

      // ✅ EVENT: Pronto
      this.client.on('ready', () => {
        this.connected = true;
        this.isInitialized = true;
        logger.info('✅ WhatsApp Web.js connesso e pronto!');
        logger.info(`📱 Numero: ${this.numeroAziendale}`);
      });

      // ✅ EVENT: Disconnesso
      this.client.on('disconnected', (reason) => {
        this.connected = false;
        logger.warn(`⚠️ WhatsApp disconnesso: ${reason}`);
      });

      // ✅ EVENT: Errori
      this.client.on('auth_failure', (msg) => {
        logger.error('❌ Autenticazione fallita:', msg);
        this.qrCode = null;
        this.pairingCode = null;
      });

      // Inizializza
      await this.client.initialize();
      
    } catch (error) {
      logger.error('❌ Errore inizializzazione WhatsApp:', error);
      throw error;
    }
  }

  async inviaMessaggio(numero, messaggio) {
    try {
      if (!this.connected) {
        logger.warn('⚠️ WhatsApp non connesso');
        return {
          success: false,
          error: 'WhatsApp non connesso. Collega dispositivo.',
          whatsappUrl: `https://wa.me/${numero}?text=${encodeURIComponent(messaggio)}`
        };
      }

      let numeroClean = numero.toString().replace(/\D/g, '');
      if (!numeroClean.startsWith('39')) {
        numeroClean = '39' + numeroClean;
      }

      const chatId = `${numeroClean}@c.us`;
      logger.info(`📤 Invio messaggio WhatsApp a ${numeroClean}...`);

      await this.client.sendMessage(chatId, messaggio);
      logger.info(`✅ Messaggio inviato con successo a ${numeroClean}`);

      return {
        success: true,
        messageId: `${Date.now()}`,
        numero: numeroClean,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Errore invio messaggio:', error);
      const numeroClean = numero.toString().replace(/\D/g, '');
      return {
        success: false,
        error: error.message,
        whatsappUrl: `https://wa.me/${numeroClean}?text=${encodeURIComponent(messaggio)}`
      };
    }
  }

  async inviaMessaggioConTemplate(numero, templateName, variabili = {}) {
    const templates = {
      'conferma-ordine': `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

✅ ORDINE CONFERMATO

Grazie ${variabili.nomeCliente}!
Il tuo ordine è stato confermato.

📅 Ritiro: ${variabili.dataRitiro}
⏰ Orario: ${variabili.oraRitiro}

${variabili.prodotti ? '📦 Prodotti:\n' + variabili.prodotti : ''}

${variabili.note ? '📝 Note: ' + variabili.note : ''}

💰 Totale: €${variabili.totale}

Ti aspettiamo! 😊
📍 Via Carmine 20/B, Assemini`,

      'ordine-pronto': `✅ *ORDINE PRONTO!*

${variabili.nomeCliente}, il tuo ordine è pronto! 🎉

⏰ Ti aspettiamo entro le ore di chiusura
📍 Via Carmine 20/B, Assemini

A presto! 😊`,

      'promemoria-giorno-prima': `🔔 *PROMEMORIA RITIRO*

Ciao ${variabili.nomeCliente}!

Ti ricordiamo che domani:

📅 ${variabili.dataRitiro}
⏰ ${variabili.oraRitiro}

Hai il ritiro del tuo ordine:

${variabili.prodottiBreve}

Ti aspettiamo! 😊
📍 Via Carmine 20/B, Assemini`
    };

    const messaggio = templates[templateName] || templates['ordine-pronto'];
    return await this.inviaMessaggio(numero, messaggio);
  }

  getQRCode() {
    return this.qrCode;
  }

  getPairingCode() {
    return this.pairingCode;
  }

  getStatus() {
    return {
      connected: this.connected,
      status: this.connected ? 'connected' : 'disconnected',
      numero: this.numeroAziendale,
      initialized: this.isInitialized,
      pairingCode: this.pairingCode
    };
  }

  getInfo() {
    return {
      service: 'WhatsApp Web.js',
      version: '1.0.0',
      connected: this.connected,
      numero: this.numeroAziendale
    };
  }

  isReady() {
    return this.connected && this.isInitialized;
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.connected = false;
      this.isInitialized = false;
      logger.info('✅ WhatsApp disconnesso');
    }
  }

  async restart() {
    logger.info('🔄 Riavvio WhatsApp...');
    await this.disconnect();
    await this.initialize();
  }
}

const whatsappService = new WhatsAppServiceHybrid();
export default whatsappService;

export const initialize = () => whatsappService.initialize();
export const inviaMessaggio = (numero, messaggio) => whatsappService.inviaMessaggio(numero, messaggio);
export const inviaMessaggioConTemplate = (numero, template, variabili) => whatsappService.inviaMessaggioConTemplate(numero, template, variabili);
export const getQRCode = () => whatsappService.getQRCode();
export const getPairingCode = () => whatsappService.getPairingCode();
export const getStatus = () => whatsappService.getStatus();
export const getInfo = () => whatsappService.getInfo();
export const isReady = () => whatsappService.isReady();
export const disconnect = () => whatsappService.disconnect();
export const restart = () => whatsappService.restart();