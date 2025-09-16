// services/whatsappService.js - TWILIO REALE
import twilio from 'twilio';
import logger from '../config/logger.js';

class WhatsAppService {
  constructor() {
    // Usa le credenziali dal .env
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACb3be7d8f44ad3333a326ec2e43aac57b5';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '8ee0ca191092c20d015e03cdea3b9621';
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    
    try {
      this.client = twilio(this.accountSid, this.authToken);
      this.ready = true;
      this.connectionStatus = 'twilio_active';
      logger.info('Twilio WhatsApp configurato con successo');
    } catch (error) {
      logger.error('Errore configurazione Twilio:', error);
      this.client = null;
      this.ready = false;
      this.connectionStatus = 'error';
    }
  }

  isReady() { 
    return this.ready; 
  }
  
  getStatus() {
    return {
      connected: this.ready,
      status: this.connectionStatus,
      provider: 'Twilio WhatsApp Business'
    };
  }

  async initialize() {
    logger.info('Twilio WhatsApp Service inizializzato');
    return this.ready;
  }

  async inviaMessaggio(numero, messaggio) {
    if (!this.ready || !this.client) {
      logger.error('Twilio non pronto');
      return { success: false, error: 'Servizio WhatsApp non disponibile' };
    }

    try {
      // Pulisci e formatta il numero
      let numeroClean = numero.toString().replace(/\D/g, '');
      
      // Aggiungi prefisso Italia se necessario
      if (numeroClean.length === 10 && !numeroClean.startsWith('39')) {
        numeroClean = '39' + numeroClean;
      }
      
      // Formato WhatsApp
      const toNumber = numeroClean.startsWith('whatsapp:') 
        ? numeroClean 
        : `whatsapp:+${numeroClean}`;
      
      logger.info(`Invio messaggio WhatsApp a ${toNumber}`);
      
      // Invia con Twilio
      const result = await this.client.messages.create({
        from: this.fromNumber,
        to: toNumber,
        body: messaggio
      });
      
      logger.info(`✅ WhatsApp inviato con successo: ${result.sid}`);
      return { 
        success: true, 
        messageId: result.sid,
        status: result.status 
      };
      
    } catch (error) {
      logger.error('❌ Errore invio WhatsApp Twilio:', error);
      return { 
        success: false, 
        error: error.message || 'Errore invio messaggio' 
      };
    }
  }

  async inviaMessaggioConTemplate(numero, templateNome, variabili = {}) {
    const templates = {
      'conferma-ordine': `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

✅ *ORDINE CONFERMATO* ✅

Gentile {{nomeCliente}},
grazie per il tuo ordine!

📋 *RIEPILOGO:*
{{prodotti}}

💰 *TOTALE:* €{{totale}}
📅 *RITIRO:* {{dataRitiro}}
⏰ *ORA:* {{oraRitiro}}

📍 *DOVE:* Via Carmine 20/B, Assemini (CA)

{{note}}

📞 *INFO:* 389 887 9833

Grazie e a presto! 😊`,

      'promemoria': `🔔 *PROMEMORIA RITIRO* 🔔

Ciao {{nomeCliente}}!

Ti ricordiamo il ritiro del tuo ordine:
📅 {{dataRitiro}}
⏰ Ore {{oraRitiro}}

📍 Via Carmine 20/B, Assemini

Ti aspettiamo! 😊`,

      'ordine-pronto': `✅ *ORDINE PRONTO!* ✅

{{nomeCliente}}, il tuo ordine è pronto!

⏰ Ti aspettiamo alle {{oraRitiro}}
📍 Via Carmine 20/B, Assemini

A presto! 🍝`
    };
    
    let messaggio = templates[templateNome] || templates['conferma-ordine'];
    
    // Sostituisci variabili
    Object.keys(variabili).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      messaggio = messaggio.replace(regex, variabili[key] || '');
    });
    
    return await this.inviaMessaggio(numero, messaggio);
  }

  async inviaMessaggioBroadcast(numeri, messaggio, options = {}) {
    const risultati = [];
    const { delay = 2000 } = options;
    
    logger.info(`Invio broadcast a ${numeri.length} numeri`);
    
    for (const numero of numeri) {
      try {
        const result = await this.inviaMessaggio(numero, messaggio);
        risultati.push({ numero, ...result });
        
        // Pausa tra messaggi per evitare rate limits
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        logger.error(`Errore broadcast per ${numero}:`, error);
        risultati.push({ numero, success: false, error: error.message });
      }
    }
    
    const successi = risultati.filter(r => r.success).length;
    logger.info(`Broadcast completato: ${successi}/${numeri.length} inviati`);
    
    return risultati;
  }

  async verificaNumero(numero) {
    try {
      if (!this.ready || !this.client) {
        return { success: false, error: 'Servizio non disponibile' };
      }
      
      // Per Twilio sandbox, tutti i numeri sono validi
      // In produzione puoi usare Lookup API
      return {
        numero: numero,
        valido: true,
        registrato: true
      };
    } catch (error) {
      logger.error('Errore verifica numero:', error);
      return { success: false, error: error.message };
    }
  }

  getInfo() {
    return {
      connected: this.ready,
      status: this.connectionStatus,
      provider: 'Twilio WhatsApp Business',
      accountSid: this.accountSid ? this.accountSid.substring(0, 10) + '...' : 'Non configurato',
      fromNumber: this.fromNumber
    };
  }

  disconnect() {
    logger.info('Twilio disconnect (non necessario)');
  }

  async restart() {
    logger.info('Twilio restart (non necessario)');
    return this.ready;
  }
}

// Esporta istanza singleton
const whatsappService = new WhatsAppService();
export default whatsappService;