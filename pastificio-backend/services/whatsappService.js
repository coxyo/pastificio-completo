// services/twilioService.js
import twilio from 'twilio';
import logger from '../config/logger.js';

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACb3be7d8f44ad3333a326ec2e43aac57b5';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '8ee0ca191092c20d015e03cdea3b9621';
    this.client = twilio(this.accountSid, this.authToken);
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    this.ready = true; // Twilio è sempre pronto se le credenziali sono valide
  }

  isReady() {
    return this.ready;
  }

  getStatus() {
    return {
      connected: true,
      status: 'twilio_active',
      provider: 'Twilio'
    };
  }

  async initialize() {
    // Con Twilio non serve inizializzazione
    logger.info('Twilio WhatsApp Service inizializzato');
    return true;
  }

  async inviaMessaggio(telefono, messaggio) {
    try {
      const numeroClean = telefono.replace(/\D/g, '');
      const toNumber = numeroClean.startsWith('39') ? 
        `whatsapp:+${numeroClean}` : 
        `whatsapp:+39${numeroClean}`;
      
      const result = await this.client.messages.create({
        from: this.fromNumber,
        to: toNumber,
        body: messaggio
      });
      
      logger.info(`✅ Messaggio Twilio inviato: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      logger.error('❌ Errore Twilio:', error.message);
      throw error;
    }
  }

  async inviaMessaggioConTemplate(numero, templateNome, variabili = {}) {
    const templates = {
      'conferma-ordine': `🍝 *PASTIFICIO NONNA CLAUDIA*

✅ *ORDINE CONFERMATO*

Cliente: {{nomeCliente}}
Data: {{dataRitiro}}
Ora: {{oraRitiro}}

Prodotti:
{{prodotti}}

💰 Totale: €{{totale}}

📍 Via Carmine 20/B, Assemini
📞 389 887 9833

{{note}}`,

      'promemoria': `🔔 *PROMEMORIA RITIRO*

Ciao {{nomeCliente}}!
Ti ricordiamo il tuo ordine:

📅 {{dataRitiro}}
⏰ Ore {{oraRitiro}}

Ti aspettiamo!`,

      'ordine-pronto': `✅ *ORDINE PRONTO!*

{{nomeCliente}}, il tuo ordine è pronto!

⏰ Ti aspettiamo alle {{oraRitiro}}
📍 Via Carmine 20/B, Assemini`
    };
    
    let messaggio = templates[templateNome] || templates['conferma-ordine'];
    
    Object.keys(variabili).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      messaggio = messaggio.replace(regex, variabili[key] || '');
    });
    
    return await this.inviaMessaggio(numero, messaggio);
  }

  async inviaMessaggioBroadcast(numeri, messaggio, options = {}) {
    const risultati = [];
    const { delay = 2000 } = options;
    
    for (const numero of numeri) {
      try {
        const result = await this.inviaMessaggio(numero, messaggio);
        risultati.push({ numero, success: true, result });
        
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        risultati.push({ numero, success: false, error: error.message });
      }
    }
    
    return risultati;
  }

  async getInfo() {
    return {
      connected: true,
      status: 'twilio_active',
      info: {
        provider: 'Twilio WhatsApp Business',
        accountSid: this.accountSid.substring(0, 10) + '...',
        fromNumber: this.fromNumber
      }
    };
  }

  disconnect() {
    // Con Twilio non serve disconnessione
    logger.info('Twilio service - disconnect chiamato (non necessario)');
  }

  restart() {
    // Con Twilio non serve restart
    logger.info('Twilio service - restart chiamato (non necessario)');
    return Promise.resolve(true);
  }
}

const twilioService = new TwilioService();

export default twilioService;