// services/whatsappService.js - SOSTITUITO CON TWILIO
import twilio from 'twilio';
import logger from '../config/logger.js';

class WhatsAppService {
  constructor() {
    this.accountSid = 'ACb3be7d8f44ad3333a326ec2e43aac57b5';
    this.authToken = '8ee0ca191092c20d015e03cdea3b9621';
    this.client = twilio(this.accountSid, this.authToken);
    this.fromNumber = 'whatsapp:+14155238886';
    this.ready = true;
    this.connectionStatus = 'twilio_active';
  }

  isReady() { return true; }
  
  getStatus() {
    return {
      connected: true,
      status: 'twilio_active',
      provider: 'Twilio WhatsApp Business'
    };
  }

  async initialize() {
    logger.info('Twilio WhatsApp Service ready');
    return true;
  }

  async inviaMessaggio(numero, messaggio) {
    const numeroClean = numero.replace(/\D/g, '');
    const toNumber = numeroClean.startsWith('39') ? 
      `whatsapp:+${numeroClean}` : 
      `whatsapp:+39${numeroClean}`;
    
    const result = await this.client.messages.create({
      from: this.fromNumber,
      to: toNumber,
      body: messaggio
    });
    
    return { success: true, messageId: result.sid };
  }

  async inviaMessaggioConTemplate(numero, template, variabili) {
    return this.inviaMessaggio(numero, 'Messaggio da Twilio');
  }
  
  getInfo() {
    return { connected: true, status: 'twilio_active' };
  }
  
  disconnect() {}
  restart() { return Promise.resolve(true); }
}

const whatsappService = new WhatsAppService();
export default whatsappService;
