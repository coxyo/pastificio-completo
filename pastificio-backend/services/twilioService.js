const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.client = twilio(this.accountSid, this.authToken);
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
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
      
      console.log('✅ Messaggio Twilio inviato:', result.sid);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('❌ Errore Twilio:', error.message);
      return { success: false, error: error.message };
    }
  }

  async inviaConfermaOrdine(ordine) {
    const messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA*\n\n` +
      `✅ Ordine Confermato!\n\n` +
      `👤 Cliente: ${ordine.nomeCliente}\n` +
      `📦 Prodotti: ${ordine.prodotti.map(p => `${p.nome} x${p.quantita}`).join(', ')}\n` +
      `💰 Totale: €${ordine.totale}\n` +
      `📅 Ritiro: ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}\n` +
      `⏰ Ora: ${ordine.oraRitiro}\n\n` +
      `📍 Via Carmine 20/B, Assemini (CA)\n` +
      `📞 389 887 9833\n\n` +
      `_Messaggio inviato con Twilio WhatsApp Business_`;
    
    return this.inviaMessaggio(ordine.telefono, messaggio);
  }

  async inviaPromemoria(ordine) {
    const messaggio = `🔔 *PROMEMORIA RITIRO*\n\n` +
      `Ciao ${ordine.nomeCliente}!\n` +
      `Ti ricordiamo il ritiro del tuo ordine:\n\n` +
      `📅 Domani ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}\n` +
      `⏰ Ore ${ordine.oraRitiro}\n` +
      `📍 Via Carmine 20/B, Assemini\n\n` +
      `A domani! 😊`;
    
    return this.inviaMessaggio(ordine.telefono, messaggio);
  }
}

module.exports = new TwilioService();