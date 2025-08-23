// services/whatsappService.js
import axios from 'axios';
import logger from '../config/logger.js';

class WhatsAppService {
  constructor() {
    // Opzioni per WhatsApp Business API
    this.provider = process.env.WHATSAPP_PROVIDER || 'twilio'; // twilio, meta, waba
    
    // Configurazione Twilio WhatsApp
    if (this.provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      try {
        const twilio = (await import('twilio')).default;
        this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Sandbox Twilio
        this.enabled = true;
        logger.info('WhatsApp Service: Twilio configurato');
      } catch (error) {
        logger.warn('WhatsApp Service: Errore configurazione Twilio', error.message);
        this.enabled = false;
      }
    } 
    // Configurazione WhatsApp Business API diretta
    else if (this.provider === 'meta' && process.env.WHATSAPP_TOKEN) {
      this.apiUrl = 'https://graph.facebook.com/v17.0';
      this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      this.token = process.env.WHATSAPP_TOKEN;
      this.enabled = true;
      logger.info('WhatsApp Service: Meta API configurato');
    }
    // Configurazione servizi terzi (es: WhatsApp Business API providers)
    else if (this.provider === 'waba' && process.env.WABA_API_KEY) {
      this.apiUrl = process.env.WABA_API_URL;
      this.apiKey = process.env.WABA_API_KEY;
      this.enabled = true;
      logger.info('WhatsApp Service: WABA configurato');
    }
    else {
      logger.warn('WhatsApp Service: Non configurato - Messaggi simulati');
      this.enabled = false;
    }
  }

  async sendMessage({ to, message, mediaUrl = null }) {
    if (!this.enabled) {
      logger.info(`WhatsApp simulato a ${to}: ${message}`);
      return { success: true, simulated: true };
    }

    try {
      let result;

      switch (this.provider) {
        case 'twilio':
          result = await this.sendViaTwilio(to, message, mediaUrl);
          break;
        case 'meta':
          result = await this.sendViaMeta(to, message, mediaUrl);
          break;
        case 'waba':
          result = await this.sendViaWABA(to, message, mediaUrl);
          break;
      }

      logger.info(`WhatsApp inviato a ${to}`, result);
      return { success: true, ...result };

    } catch (error) {
      logger.error('Errore invio WhatsApp:', error);
      throw error;
    }
  }

  async sendViaTwilio(to, message, mediaUrl) {
    const messageData = {
      body: message,
      from: this.fromNumber,
      to: `whatsapp:${to.replace(/\D/g, '')}`
    };

    if (mediaUrl) {
      messageData.mediaUrl = [mediaUrl];
    }

    const result = await this.client.messages.create(messageData);
    return { messageId: result.sid, status: result.status };
  }

  async sendViaMeta(to, message, mediaUrl) {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''),
      type: mediaUrl ? 'image' : 'text'
    };

    if (mediaUrl) {
      data.image = { link: mediaUrl };
    } else {
      data.text = { body: message };
    }

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    return { messageId: response.data.messages[0].id };
  }

  async sendViaWABA(to, message, mediaUrl) {
    // Implementazione per provider WABA specifico
    const response = await axios.post(`${this.apiUrl}/send`, {
      to: to.replace(/\D/g, ''),
      message: message,
      media_url: mediaUrl
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return { messageId: response.data.id };
  }

  // Invia template pre-approvati (per WhatsApp Business)
  async sendTemplate({ to, templateName, params = [] }) {
    if (!this.enabled) {
      logger.info(`WhatsApp Template simulato a ${to}: ${templateName}`);
      return { success: true, simulated: true };
    }

    if (this.provider === 'meta') {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const data = {
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'it' },
          components: params.length > 0 ? [{
            type: 'body',
            parameters: params.map(p => ({ type: 'text', text: p }))
          }] : []
        }
      };

      const response = await axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      return { 
        success: true, 
        messageId: response.data.messages[0].id 
      };
    }

    // Per altri provider, usa il messaggio normale
    return this.sendMessage({ to, message: `Template: ${templateName}` });
  }

  // Invia menu interattivo
  async sendInteractiveMenu({ to, header, body, buttons }) {
    if (!this.enabled || this.provider !== 'meta') {
      return this.sendMessage({ to, message: body });
    }

    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''),
      type: 'interactive',
      interactive: {
        type: 'button',
        header: { type: 'text', text: header },
        body: { text: body },
        action: {
          buttons: buttons.map((btn, idx) => ({
            type: 'reply',
            reply: {
              id: `btn_${idx}`,
              title: btn.text
            }
          }))
        }
      }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    return { 
      success: true, 
      messageId: response.data.messages[0].id 
    };
  }

  // Invia catalogo prodotti
  async sendProductCatalog({ to, products }) {
    const message = products.map(p => 
      `*${p.nome}*\n${p.descrizione}\nPrezzo: €${p.prezzo}`
    ).join('\n\n');

    return this.sendMessage({ to, message });
  }

  // Verifica se il numero ha WhatsApp
  async checkWhatsApp(phoneNumber) {
    if (!this.enabled) {
      return { hasWhatsApp: true, simulated: true };
    }

    // Implementazione dipende dal provider
    // Per ora assumiamo che tutti i numeri abbiano WhatsApp
    return { hasWhatsApp: true };
  }

  // Gestione webhook per risposte
  async handleWebhook(data) {
    logger.info('WhatsApp webhook ricevuto:', data);
    
    // Gestisci le risposte dei clienti
    if (data.messages) {
      for (const message of data.messages) {
        // Emetti evento per gestire la risposta
        if (global.io) {
          global.io.emit('whatsapp:messaggio_ricevuto', {
            from: message.from,
            text: message.text?.body,
            timestamp: message.timestamp
          });
        }
      }
    }

    return { success: true };
  }
}

export default new WhatsAppService();