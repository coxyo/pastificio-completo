// services/whatsappService.js - ✅ AGGIORNATO con auto-send
import logger from '../config/logger.js';

class WhatsAppService {
  constructor() {
    this.ready = true;
    this.numeroAziendale = '3898879833'; // Numero del pastificio
  }

  isReady() { 
    return true; 
  }
  
  /**
   * Invia messaggio WhatsApp (genera link wa.me)
   * @param {string} numero - Numero telefono destinatario
   * @param {string} messaggio - Testo messaggio
   * @param {boolean} autoSend - Se true, aggiunge parametro per invio automatico
   */
  async inviaMessaggio(numero, messaggio, autoSend = false) {
    try {
      // Pulisci numero
      const numeroClean = numero.replace(/\D/g, '');
      const numeroWhatsApp = numeroClean.startsWith('39') ? numeroClean : '39' + numeroClean;
      const testoEncoded = encodeURIComponent(messaggio);
      
      // Genera URL base
      let whatsappUrl = `https://wa.me/${numeroWhatsApp}?text=${testoEncoded}`;
      
      // ✅ NUOVO: Aggiungi parametro auto_send per estensione Chrome
      if (autoSend) {
        whatsappUrl += '&app_absent=1&auto_send=true';
        logger.info(`📱 WhatsApp link con AUTO-SEND generato per ${numero}`);
      } else {
        logger.info(`📱 WhatsApp link generato per ${numero}`);
      }
      
      return { 
        success: true, 
        whatsappUrl: whatsappUrl,
        messageId: 'manual-' + Date.now(),
        numero: numeroWhatsApp,
        messaggio: messaggio,
        autoSend: autoSend
      };
    } catch (error) {
      logger.error('❌ Errore invio messaggio WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Invia messaggio usando template predefinito
   * @param {string} numero - Numero telefono
   * @param {string} template - Nome template
   * @param {object} variabili - Variabili per template
   * @param {boolean} autoSend - Auto-invio (default: false)
   */
  async inviaMessaggioConTemplate(numero, template, variabili = {}, autoSend = false) {
    const messaggio = this.generaMessaggioDaTemplate(template, variabili);
    return this.inviaMessaggio(numero, messaggio, autoSend);
  }
  
  /**
   * Genera messaggio da template
   */
  generaMessaggioDaTemplate(template, variabili) {
    let messaggio = '';
    
    switch(template) {
      case 'conferma_ordine':
        messaggio = `🎂 *PASTIFICIO NONNA CLAUDIA* 🎂\n\n` +
                   `✅ ORDINE CONFERMATO\n` +
                   `📅 Ritiro: ${variabili.dataRitiro || 'da definire'}\n` +
                   `⏰ Ora: ${variabili.oraRitiro || 'da definire'}\n\n` +
                   `📦 *DETTAGLI ORDINE:*\n${variabili.dettagliOrdine || ''}\n\n` +
                   `💰 Totale: €${variabili.totale || '0.00'}\n\n` +
                   `📍 Via Carmine 20/B, Assemini (CA)\n` +
                   `📞 389 887 9833\n\n` +
                   `Grazie per averci scelto! 🙏`;
        break;
        
      case 'promemoria_ritiro':
        messaggio = `📢 *PROMEMORIA RITIRO*\n\n` +
                   `Ciao ${variabili.nome || 'cliente'},\n\n` +
                   `Ti ricordiamo che il tuo ordine sarà pronto domani alle ore ${variabili.ora || '10:00'}\n\n` +
                   `📍 *Pastificio Nonna Claudia*\n` +
                   `Via Carmine 20/B, Assemini (CA)\n` +
                   `📞 389 887 9833\n\n` +
                   `Ci vediamo domani! 😊`;
        break;
        
      case 'ordine_pronto':
        messaggio = `✅ *ORDINE PRONTO!*\n\n` +
                   `Ciao ${variabili.nome || 'cliente'},\n\n` +
                   `Il tuo ordine ${variabili.numeroOrdine ? '#' + variabili.numeroOrdine : ''} è pronto per il ritiro! 🎉\n\n` +
                   `📍 Vi aspettiamo al Pastificio Nonna Claudia\n` +
                   `Via Carmine 20/B, Assemini (CA)\n` +
                   `📞 389 887 9833\n\n` +
                   `A presto! 😊`;
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
      numero: this.numeroAziendale,
      autoSendSupported: true
    }; 
  }
  
  getInfo() { 
    return { 
      connected: true, 
      mode: 'manual', 
      numero: this.numeroAziendale,
      description: 'Modalità link WhatsApp con supporto auto-send',
      autoSendSupported: true
    }; 
  }
  
  async initialize() { 
    logger.info('✅ WhatsApp Service inizializzato in modalità manuale + auto-send');
    return true; 
  }
  
  disconnect() {
    logger.info('🔌 WhatsApp Service disconnesso');
  }
  
  restart() { 
    logger.info('🔄 WhatsApp Service riavviato');
    return Promise.resolve(true); 
  }
}

export default new WhatsAppService();
