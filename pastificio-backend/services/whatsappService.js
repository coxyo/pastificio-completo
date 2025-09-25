// services/whatsappService.js - VERSIONE SEMPLIFICATA E FUNZIONANTE
import logger from '../config/logger.js';

class WhatsAppService {
  constructor() {
    this.ready = true;
    this.numeroAziendale = '3898879833'; // Numero del pastificio
  }

  isReady() { 
    return true; 
  }
  
  async inviaMessaggio(numero, messaggio) {
    try {
      // Sistema semplificato - genera solo il link WhatsApp
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
    logger.info('WhatsApp Service inizializzato in modalità manuale');
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

export default new WhatsAppService();