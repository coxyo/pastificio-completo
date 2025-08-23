// services/whatsappService.js - VERSIONE REALE
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import logger from '../config/logger.js';

class WhatsAppService {
  constructor() {
    this.client = null;
    this.ready = false;
    this.qrCode = null;
    this.connectionStatus = 'disconnected';
  }

  async initialize() {
    try {
      logger.info('🚀 Inizializzazione WhatsApp Web REALE...');
      
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
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      // Gestione QR Code
      this.client.on('qr', async (qr) => {
        logger.info('📱 QR Code ricevuto - SCANSIONA CON WHATSAPP!');
        console.log('\n\n========================================');
        console.log('📱 SCANSIONA QUESTO QR CODE CON WHATSAPP:');
        console.log('========================================\n');
        
        // Mostra QR in console
        const qrTerminal = await import('qrcode-terminal');
        qrTerminal.default.generate(qr, { small: true });
        
        // Salva QR per eventuale visualizzazione web
        this.qrCode = await qrcode.toDataURL(qr);
        this.connectionStatus = 'waiting_qr';
        
        console.log('\n========================================');
        console.log('Apri WhatsApp sul telefono');
        console.log('Vai su Impostazioni > Dispositivi collegati');
        console.log('Clicca su "Collega un dispositivo"');
        console.log('Scansiona il QR code sopra');
        console.log('========================================\n');
      });

      // Quando il client è pronto
      this.client.on('ready', () => {
        logger.info('✅ WhatsApp Web CONNESSO e PRONTO!');
        console.log('\n🎉🎉🎉 WHATSAPP CONNESSO CON SUCCESSO! 🎉🎉🎉\n');
        this.ready = true;
        this.qrCode = null;
        this.connectionStatus = 'connected';
        
        // Notifica via socket
        if (global.io) {
          global.io.emit('whatsapp:status', { connected: true });
        }
      });

      // Gestione disconnessione
      this.client.on('disconnected', (reason) => {
        logger.warn('❌ WhatsApp disconnesso:', reason);
        this.ready = false;
        this.connectionStatus = 'disconnected';
        
        if (global.io) {
          global.io.emit('whatsapp:status', { connected: false });
        }
      });

      // Gestione autenticazione
      this.client.on('authenticated', () => {
        logger.info('🔐 WhatsApp autenticato con successo');
        console.log('🔐 Sessione WhatsApp salvata - non dovrai più scansionare il QR!');
        this.connectionStatus = 'authenticated';
      });

      // Gestione errori di autenticazione
      this.client.on('auth_failure', (msg) => {
        logger.error('❌ Autenticazione WhatsApp fallita:', msg);
        console.error('❌ ERRORE AUTENTICAZIONE - Riprova o elimina la cartella .wwebjs_auth');
        this.connectionStatus = 'auth_failed';
      });

      // Inizializza il client
      await this.client.initialize();
      
      return true;
    } catch (error) {
      logger.error('❌ Errore inizializzazione WhatsApp:', error);
      console.error('❌ ERRORE CRITICO:', error.message);
      this.connectionStatus = 'error';
      return false;
    }
  }

  isReady() {
    return this.ready && this.client !== null;
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
        throw new Error('WhatsApp non è connesso');
      }

      // Formatta il numero (rimuovi spazi, +, etc)
      let numeroFormattato = numero.replace(/\D/g, '');
      
      // Se il numero è italiano e non inizia con 39, aggiungi il prefisso
      if (numeroFormattato.length === 10 && !numeroFormattato.startsWith('39')) {
        numeroFormattato = '39' + numeroFormattato;
      }
      
      // Aggiungi @c.us per WhatsApp
      const chatId = numeroFormattato + '@c.us';
      
      logger.info(`📤 Invio messaggio WhatsApp a ${numero}...`);
      
      // Invia il messaggio
      const result = await this.client.sendMessage(chatId, messaggio);
      
      logger.info(`✅ Messaggio WhatsApp inviato a ${numero}`);
      console.log(`✅ WhatsApp inviato a ${numero}`);
      
      return { success: true, messageId: result.id };
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

Ti aspettiamo! 😊

📞 Per info: 389 887 9833`,

        'ordine-pronto': `🍝 *ORDINE PRONTO!* 🍝

{{nomeCliente}}, il tuo ordine è *PRONTO* per il ritiro! 🎉

⏰ Ti aspettiamo alle *{{oraRitiro}}*
📍 Via Carmine 20/B, Assemini (CA)

Buon appetito! 🍽️`,

        'promemoria': `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

Promemoria: domani è previsto il ritiro del suo ordine.

📅 {{dataRitiro}} alle {{oraRitiro}}
📍 Via Carmine 20/B, Assemini (CA)

A domani! 😊`,

        'auguri-festivita': `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

Caro/a {{nomeCliente}},

{{messaggioFestivita}}

🎊 Ti auguriamo {{auguri}}! 🎊

Per i tuoi ordini delle feste:
📞 389 887 9833
📱 WhatsApp: 389 887 9833
📍 Via Carmine 20/B, Assemini (CA)

_Pastificio Nonna Claudia_ ❤️`,

        'nuovo-prodotto': `🍝 *NOVITÀ IN PASTIFICIO!* 🍝

Ciao {{nomeCliente}}! 

Abbiamo una novità per te:
🆕 *{{nomeProdotto}}*

{{descrizioneProdotto}}

💰 Prezzo lancio: €{{prezzo}}

Prenota subito su WhatsApp! 📱
📞 389 887 9833

Ti aspettiamo in Via Carmine 20/B, Assemini (CA)

A presto! 😊`
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
      
      const chatId = numeroFormattato + '@c.us';
      const isRegistered = await this.client.isRegisteredUser(chatId);
      
      return {
        numero: numero,
        numeroFormattato: numeroFormattato,
        registrato: isRegistered
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
      
      const info = this.client.info;
      return {
        connected: true,
        status: this.connectionStatus,
        info: {
          phoneNumber: info?.wid?.user,
          platform: info?.platform,
          name: info?.pushname
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
      if (this.client) {
        this.client.destroy();
        this.client = null;
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