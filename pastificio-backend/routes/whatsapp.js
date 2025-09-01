// routes/whatsapp.js - VERSIONE TWILIO
import express from 'express';
import twilio from 'twilio';
import { protect } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// Inizializza client Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACb3be7d8f44ad3333a326ec2e43aac57b5';
const authToken = process.env.TWILIO_AUTH_TOKEN || '8ee0ca191092c20d015e03cdea3b9621';
const twilioClient = twilio(accountSid, authToken);
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

// POST /api/whatsapp/send
router.post('/send', protect, async (req, res) => {
  try {
    const { telefono, messaggio } = req.body;
    
    // Formatta il numero
    const numeroClean = telefono.replace(/\D/g, '');
    const toNumber = numeroClean.startsWith('39') ? 
      `whatsapp:+${numeroClean}` : 
      `whatsapp:+39${numeroClean}`;
    
    // Invia con Twilio
    const result = await twilioClient.messages.create({
      from: fromNumber,
      to: toNumber,
      body: messaggio
    });
    
    logger.info(`Messaggio Twilio inviato: ${result.sid} a ${telefono}`);
    res.json({ 
      success: true, 
      messageId: result.sid,
      provider: 'twilio'
    });
    
  } catch (error) {
    logger.error('Errore Twilio:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      provider: 'twilio'
    });
  }
});

// GET /api/whatsapp/status
router.get('/status', protect, async (req, res) => {
  try {
    // Con Twilio, il servizio è sempre "connesso" se le credenziali sono valide
    res.json({
      success: true,
      connected: true,
      status: 'twilio_active',
      provider: 'Twilio WhatsApp Business',
      info: {
        accountSid: accountSid.substring(0, 10) + '...',
        fromNumber: fromNumber
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      connected: false,
      status: 'error',
      error: error.message
    });
  }
});

// GET /api/whatsapp/qr - Non necessario con Twilio
router.get('/qr', protect, async (req, res) => {
  res.json({
    success: false,
    message: 'QR Code non necessario con Twilio. Il servizio è già configurato.',
    provider: 'twilio'
  });
});

// POST /api/whatsapp/invio-conferma/:ordineId
router.post('/invio-conferma/:ordineId', protect, async (req, res) => {
  try {
    const { ordineId } = req.params;
    const { ordine } = req.body;
    
    if (!ordine || !ordine.telefono) {
      return res.status(400).json({
        success: false,
        error: 'Dati ordine o telefono mancanti'
      });
    }
    
    const messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA*\n\n` +
      `✅ Ordine Confermato!\n\n` +
      `Cliente: ${ordine.nomeCliente}\n` +
      `Data: ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}\n` +
      `Ora: ${ordine.oraRitiro}\n` +
      `Totale: €${ordine.totale}\n\n` +
      `📍 Via Carmine 20/B, Assemini`;
    
    const numeroClean = ordine.telefono.replace(/\D/g, '');
    const toNumber = numeroClean.startsWith('39') ? 
      `whatsapp:+${numeroClean}` : 
      `whatsapp:+39${numeroClean}`;
    
    const result = await twilioClient.messages.create({
      from: fromNumber,
      to: toNumber,
      body: messaggio
    });
    
    res.json({ 
      success: true, 
      messageId: result.sid 
    });
    
  } catch (error) {
    logger.error('Errore invio conferma:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;