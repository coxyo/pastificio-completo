import twilio from 'twilio';
import logger from '../config/logger.js';

const accountSid = 'ACb3be7d8f44ad3333a326ec2e43aac57b5';
const authToken = '8ee0ca191092c20d015e03cdea3b9621';
const fromNumber = 'whatsapp:+14155238886';

class WhatsAppService {
  constructor() {
    this.client = twilio(accountSid, authToken);
    this.ready = true;
  }

  isReady() { return true; }
  
  async inviaMessaggio(numero, messaggio) {
    const numeroClean = numero.replace(/\D/g, '');
    const toNumber = `whatsapp:+${numeroClean.startsWith('39') ? numeroClean : '39' + numeroClean}`;
    
    const result = await this.client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: messaggio
    });
    
    return { success: true, messageId: result.sid };
  }

  async inviaMessaggioConTemplate(n, t, v) { return this.inviaMessaggio(n, 'Ordine confermato'); }
  getStatus() { return { connected: true, status: 'twilio_active' }; }
  getInfo() { return { connected: true }; }
  async initialize() { return true; }
  disconnect() {}
  restart() { return Promise.resolve(true); }
}

export default new WhatsAppService();