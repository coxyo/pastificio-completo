<<<<<<< HEAD
// services/whatsappService.js - VERSIONE SEMPLIFICATA
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
    // Sistema semplificato - genera solo il link WhatsApp
    const numeroClean = numero.replace(/\D/g, '');
    const numeroWhatsApp = numeroClean.startsWith('39') ? numeroClean : '39' + numeroClean;
    const testoEncoded = encodeURIComponent(messaggio);
    const whatsappUrl = `https://wa.me/${numeroWhatsApp}?text=${testoEncoded}`;
    
    logger.info(`WhatsApp link generato per ${numero}`);
    
    return { 
      success: true, 
      whatsappUrl: whatsappUrl,
      messageId: 'manual-' + Date.now() 
    };
  }
  
  async inviaMessaggioConTemplate(numero, template, variabili) {
    const messaggio = `Ordine confermato - Pastificio Nonna Claudia\nRitiro: ${variabili.dataRitiro || 'oggi'}`;
    return this.inviaMessaggio(numero, messaggio);
  }
  
  getStatus() { 
    return { connected: true, status: 'manual-mode' }; 
  }
  
  getInfo() { 
    return { connected: true, mode: 'manual', numero: this.numeroAziendale }; 
  }
  
  async initialize() { 
    logger.info('WhatsApp Service in modalità manuale');
    return true; 
  }
  
=======
import logger from '../config/logger.js';
class WhatsAppService {
  isReady() { return true; }
  async inviaMessaggio(n, m) {
    logger.info(`Mock message to ${n}: ${m}`);
    return { success: true, messageId: 'mock-' + Date.now() };
  }
  async inviaMessaggioConTemplate(n, t, v) { 
    return this.inviaMessaggio(n, 'Mock'); 
  }
  getStatus() { return { connected: true, status: 'active' }; }
  getInfo() { return { connected: true }; }
  async initialize() { return true; }
>>>>>>> d62a9b18eb32db96b141b851886398197b0d6578
  disconnect() {}
  restart() { return Promise.resolve(true); }
}
export default new WhatsAppService();
