// routes/whatsapp.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import logger from '../config/logger.js';
import whatsappService from '../services/whatsappService.js';

const router = express.Router();

// Endpoint per visualizzare il QR code (NO AUTH per facilità)
router.get('/qr', async (req, res) => {
  try {
    const qrCode = whatsappService.getQRCode();
    const status = whatsappService.getStatus();
    
    if (qrCode) {
      res.send(`
        <html>
          <head>
            <title>WhatsApp QR - Pastificio</title>
            <meta http-equiv="refresh" content="5">
          </head>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;font-family:Arial;">
            <div style="text-align:center;background:white;padding:40px;border-radius:15px;box-shadow:0 0 30px rgba(0,0,0,0.1);">
              <h1>🍝 Pastificio Nonna Claudia</h1>
              <h2>📱 Connetti WhatsApp Business</h2>
              <img src="${qrCode}" style="width:350px;height:350px;border:5px solid #25D366;border-radius:10px;padding:10px;" />
              <p style="color:#666;margin-top:20px;">⏳ Scansiona il QR code con WhatsApp</p>
              <p style="color:#999;font-size:12px;">Auto-refresh ogni 5 secondi</p>
            </div>
          </body>
        </html>
      `);
    } else if (status.connected) {
      res.send(`
        <html>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;">
            <div style="text-align:center;padding:40px;background:white;border-radius:15px;box-shadow:0 0 30px rgba(0,0,0,0.1);">
              <h1 style="color:#25D366;">✅ WhatsApp Connesso!</h1>
              <p>Il servizio è attivo e funzionante</p>
              <p>Numero: ${status.info?.phoneNumber || 'N/A'}</p>
            </div>
          </body>
        </html>
      `);
    } else {
      res.send(`
        <html>
          <head>
            <meta http-equiv="refresh" content="5">
          </head>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;">
            <div style="text-align:center;padding:40px;">
              <h2>⏳ Inizializzazione WhatsApp...</h2>
              <p>Il QR code apparirà a breve</p>
              <p><button onclick="location.reload()">Ricarica</button></p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ottieni stato connessione
router.get('/status', protect, (req, res) => {
  const status = whatsappService.getStatus();
  res.json({
    success: true,
    ...status
  });
});

// Invia messaggio WhatsApp
router.post('/send', protect, async (req, res) => {
  try {
    const { telefono, messaggio, mediaUrl } = req.body;
    
    if (!telefono || !messaggio) {
      return res.status(400).json({
        success: false,
        error: 'Telefono e messaggio sono richiesti'
      });
    }
    
    const result = await whatsappService.inviaMessaggio(telefono, messaggio);
    
    logger.info(`WhatsApp inviato a ${telefono}`);
    
    res.json({
      success: true,
      message: 'Messaggio inviato con successo',
      ...result
    });
    
  } catch (error) {
    logger.error('Errore invio WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Invia messaggio con template
router.post('/send-template', protect, async (req, res) => {
  try {
    const { telefono, template, variabili } = req.body;
    
    const result = await whatsappService.inviaMessaggioConTemplate(
      telefono, 
      template, 
      variabili
    );
    
    res.json({
      success: true,
      message: 'Template inviato con successo',
      ...result
    });
    
  } catch (error) {
    logger.error('Errore invio template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Broadcast a lista clienti
router.post('/broadcast', protect, async (req, res) => {
  try {
    const { clienti, messaggio } = req.body;
    
    if (!clienti || !Array.isArray(clienti) || clienti.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista clienti richiesta'
      });
    }
    
    const numeri = clienti.map(c => c.telefono).filter(t => t);
    const risultati = await whatsappService.inviaMessaggioBroadcast(numeri, messaggio);
    
    res.json({
      success: true,
      message: `Broadcast completato`,
      risultati
    });
    
  } catch (error) {
    logger.error('Errore broadcast WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verifica numero WhatsApp
router.post('/check', protect, async (req, res) => {
  try {
    const { telefono } = req.body;
    
    const result = await whatsappService.verificaNumero(telefono);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    logger.error('Errore verifica numero:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Template messaggi
router.get('/templates', protect, (req, res) => {
  const templates = [
    {
      id: 'conferma-ordine',
      nome: 'Conferma Ordine',
      variabili: ['nomeCliente', 'prodotti', 'totale', 'dataRitiro', 'oraRitiro']
    },
    {
      id: 'promemoria',
      nome: 'Promemoria Ritiro',
      variabili: ['nomeCliente', 'dataRitiro', 'oraRitiro', 'prodottiBreve']
    },
    {
      id: 'ordine-pronto',
      nome: 'Ordine Pronto',
      variabili: ['nomeCliente', 'oraRitiro']
    }
  ];
  
  res.json({
    success: true,
    templates
  });
});

// Restart WhatsApp
router.post('/restart', protect, async (req, res) => {
  try {
    await whatsappService.restart();
    res.json({
      success: true,
      message: 'WhatsApp in riavvio...'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;