// services/whatsappService.js
// ✅ VERSIONE WHATSAPP WEB AUTO-OPEN (Usa browser esistente)
import logger from '../config/logger.js';

class WhatsAppServiceWebOpen {
  constructor() {
    this.numeroAziendale = '3898879833';
    this.connected = true; // Sempre true (usa browser già collegato)
  }

  async initialize() {
    logger.info('🔌 WhatsApp Web Auto-Open attivato');
    logger.info('💡 Usa il browser WhatsApp Web già collegato');
    logger.info('📱 Numero: ' + this.numeroAziendale);
    return Promise.resolve();
  }

  async inviaMessaggio(numero, messaggio) {
    try {
      // Normalizza numero
      let numeroClean = numero.toString().replace(/\D/g, '');
      
      // Aggiungi prefisso Italia se manca
      if (!numeroClean.startsWith('39')) {
        numeroClean = '39' + numeroClean;
      }

      // Genera link WhatsApp Web
      const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${numeroClean}&text=${encodeURIComponent(messaggio)}`;

      logger.info(`📤 Link WhatsApp Web generato per ${numeroClean}`);
      logger.info(`🔗 ${whatsappWebUrl}`);

      return {
        success: true,
        messageId: `${Date.now()}`,
        numero: numeroClean,
        whatsappWebUrl: whatsappWebUrl,
        autoOpen: true,
        timestamp: new Date().toISOString(),
        method: 'whatsapp-web-auto-open'
      };

    } catch (error) {
      logger.error('❌ Errore generazione link WhatsApp Web:', error);
      return {
        success: false,
        error: error.message
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
    return null; // Non serve QR
  }

  getStatus() {
    return {
      connected: true,
      status: 'connected',
      numero: this.numeroAziendale,
      method: 'whatsapp-web-auto-open',
      initialized: true
    };
  }

  getInfo() {
    return {
      service: 'WhatsApp Web Auto-Open',
      version: '1.0.0',
      connected: true,
      numero: this.numeroAziendale,
      description: 'Usa browser WhatsApp Web già collegato'
    };
  }

  isReady() {
    return true; // Sempre pronto
  }

  async disconnect() {
    logger.info('✅ WhatsApp Web Auto-Open - nessuna disconnessione necessaria');
  }

  async restart() {
    logger.info('🔄 WhatsApp Web Auto-Open - riavvio non necessario');
  }
}

const whatsappService = new WhatsAppServiceWebOpen();
export default whatsappService;

export const initialize = () => whatsappService.initialize();
export const inviaMessaggio = (numero, messaggio) => whatsappService.inviaMessaggio(numero, messaggio);
export const inviaMessaggioConTemplate = (numero, template, variabili) => whatsappService.inviaMessaggioConTemplate(numero, template, variabili);
export const getQRCode = () => whatsappService.getQRCode();
export const getStatus = () => whatsappService.getStatus();
export const getInfo = () => whatsappService.getInfo();
export const isReady = () => whatsappService.isReady();
export const disconnect = () => whatsappService.disconnect();
export const restart = () => whatsappService.restart();