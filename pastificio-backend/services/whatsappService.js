// services/whatsappService.js - VERSIONE ES MODULES NAMED EXPORTS
import logger from '../config/logger.js';

class WhatsAppService {
  constructor() {
    this.ready = true;
    this.numeroAziendale = '3898879833';
  }

  isReady() { 
    return true; 
  }
  
  async inviaMessaggio(numero, messaggio) {
    try {
      const numeroClean = numero.replace(/\D/g, '');
      const numeroWhatsApp = numeroClean.startsWith('39') ? numeroClean : '39' + numeroClean;
      const testoEncoded = encodeURIComponent(messaggio);
      const whatsappUrl = `https://wa.me/${numeroWhatsApp}?text=${testoEncoded}`;
      
      logger.info(`WhatsApp link generato per ${numero}`);
      
      return { 
        success: true, 
        whatsappUrl: whatsappUrl,
        messageId: 'manual-' + Date.now(),
        numero: numeroWhatsApp,
        messaggio: messaggio
      };
    } catch (error) {
      logger.error('Errore invio messaggio WhatsApp:', error);
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
        messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝\n\n` +
                   `✅ ORDINE CONFERMATO\n` +
                   `📅 Ritiro: ${variabili.dataRitiro || 'da definire'}\n` +
                   `⏰ Ora: ${variabili.oraRitiro || 'da definire'}\n\n` +
                   `📦 *DETTAGLI ORDINE:*\n${variabili.dettagliOrdine || ''}\n\n` +
                   `💰 Totale: €${variabili.totale || '0.00'}\n\n` +
                   `📍 Via Garibaldi 123, Milano\n` +
                   `📞 389 887 9833\n\n` +
                   `Grazie per averci scelto! 🙏`;
        break;
        
      case 'promemoria_ritiro':
        messaggio = `🔔 PROMEMORIA RITIRO\n\n` +
                   `Il suo ordine sarà pronto domani alle ${variabili.ora || '10:00'}\n` +
                   `📍 Pastificio Nonna Claudia`;
        break;
        
      case 'ordine_pronto':
        messaggio = `✅ Il suo ordine è PRONTO per il ritiro!\n` +
                   `📍 Vi aspettiamo in Via Garibaldi 123`;
        break;
        
      default:
        messaggio = variabili.messaggio || 'Messaggio dal Pastificio Nonna Claudia';
    }
    
    return messaggio;
  }
  
  getStatus() { 
    return { 
      connected: true, 
      status: 'manual-mode',
      numero: this.numeroAziendale 
    }; 
  }
  
  getInfo() { 
    return { 
      connected: true, 
      mode: 'manual', 
      numero: this.numeroAziendale,
      description: 'Modalità link WhatsApp - Click per aprire WhatsApp Web/App'
    }; 
  }
  
  async initialize() { 
    logger.info('✅ WhatsApp Service inizializzato in modalità manuale + auto-send');
    return true; 
  }
  
  disconnect() {
    logger.info('WhatsApp Service disconnesso');
  }
  
  restart() { 
    logger.info('WhatsApp Service riavviato');
    return Promise.resolve(true); 
  }
}

// ✅ ESPORTA ISTANZA SINGLETON
const instance = new WhatsAppService();

// ✅ NAMED EXPORTS (compatibile con import * as)
export const isReady = () => instance.isReady();
export const inviaMessaggio = (numero, messaggio) => instance.inviaMessaggio(numero, messaggio);
export const inviaMessaggioConTemplate = (numero, template, variabili) => instance.inviaMessaggioConTemplate(numero, template, variabili);
export const generaMessaggioDaTemplate = (template, variabili) => instance.generaMessaggioDaTemplate(template, variabili);
export const getStatus = () => instance.getStatus();
export const getInfo = () => instance.getInfo();
export const initialize = () => instance.initialize();
export const disconnect = () => instance.disconnect();
export const restart = () => instance.restart();

// ✅ EXPORT DEFAULT per retrocompatibilità
export default instance;
