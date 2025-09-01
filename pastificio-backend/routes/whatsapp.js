const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Importa Twilio
const twilio = require('twilio');
const accountSid = 'ACb3be7d8f44ad3333a326ec2e43aac57b5';
const authToken = '8ee0ca191092c20d015e03cdea3b9621';
const client = twilio(accountSid, authToken);

// Endpoint per inviare messaggi
router.post('/send', protect, async (req, res) => {
  try {
    const { telefono, messaggio } = req.body;
    
    // Pulisci il numero
    const numeroClean = telefono.replace(/\D/g, '');
    const toNumber = numeroClean.startsWith('39') ? 
      `whatsapp:+${numeroClean}` : 
      `whatsapp:+39${numeroClean}`;
    
    // Invia con Twilio
    const result = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: toNumber,
      body: messaggio
    });
    
    console.log('Messaggio Twilio inviato:', result.sid);
    res.json({ success: true, messageId: result.sid });
    
  } catch (error) {
    console.error('Errore Twilio:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Status (ora ritorna sempre connesso con Twilio)
router.get('/status', protect, async (req, res) => {
  res.json({
    success: true,
    connected: true,
    status: 'twilio_active',
    provider: 'Twilio WhatsApp Sandbox'
  });
});

module.exports = router;