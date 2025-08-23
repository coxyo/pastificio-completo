// services/smsService.js
import twilio from 'twilio';
import logger from '../config/logger.js';

class SMSService {
  constructor() {
    // Configura Twilio se hai le credenziali
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
      this.enabled = true;
    } else {
      logger.warn('SMS Service: Twilio non configurato');
      this.enabled = false;
    }
  }

  async sendSMS({ to, message }) {
    if (!this.enabled) {
      logger.info(`SMS simulato a ${to}: ${message}`);
      return { success: true, simulated: true };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to
      });

      logger.info(`SMS inviato a ${to}`, { messageId: result.sid });
      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };

    } catch (error) {
      logger.error('Errore invio SMS:', error);
      throw error;
    }
  }

  async sendBulkSMS(messages) {
    const results = [];
    
    for (const msg of messages) {
      try {
        const result = await this.sendSMS(msg);
        results.push({ ...msg, ...result });
      } catch (error) {
        results.push({ 
          ...msg, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  // Verifica credito SMS (se supportato dal provider)
  async checkBalance() {
    if (!this.enabled) {
      return { available: true, balance: 'unlimited (simulato)' };
    }

    try {
      // Implementa controllo credito se disponibile
      return { available: true };
    } catch (error) {
      logger.error('Errore controllo credito SMS:', error);
      return { available: false, error: error.message };
    }
  }
}

export default new SMSService();