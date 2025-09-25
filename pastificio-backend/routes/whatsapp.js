// routes/whatsapp.js
import express from 'express';
import whatsappService from '../services/whatsappService.js';
import logger from '../config/logger.js';

const router = express.Router();

// GET /api/whatsapp/status
router.get('/status', async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    logger.error('Errore recupero stato WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp/info
router.get('/info', async (req, res) => {
  try {
    const info = whatsappService.getInfo();
    res.json({
      success: true,
      info: info
    });
  } catch (error) {
    logger.error('Errore recupero info WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/send
router.post('/send', async (req, res) => {
  try {
    const { numero, messaggio } = req.body;
    
    if (!numero || !messaggio) {
      return res.status(400).json({
        success: false,
        error: 'Numero e messaggio sono obbligatori'
      });
    }
    
    const result = await whatsappService.inviaMessaggio(numero, messaggio);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Errore invio messaggio WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/send-template
router.post('/send-template', async (req, res) => {
  try {
    const { numero, template, variabili } = req.body;
    
    if (!numero || !template) {
      return res.status(400).json({
        success: false,
        error: 'Numero e template sono obbligatori'
      });
    }
    
    const result = await whatsappService.inviaMessaggioConTemplate(numero, template, variabili);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Errore invio template WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/send-order-confirmation
router.post('/send-order-confirmation', async (req, res) => {
  try {
    const { ordine } = req.body;
    
    if (!ordine || !ordine.cliente || !ordine.cliente.telefono) {
      return res.status(400).json({
        success: false,
        error: 'Dati ordine incompleti'
      });
    }
    
    // Prepara i dettagli dell'ordine
    const dettagliOrdine = ordine.prodotti
      .map(p => `• ${p.nome}: ${p.quantita}`)
      .join('\n');
    
    const variabili = {
      dataRitiro: new Date(ordine.dataRitiro).toLocaleDateString('it-IT'),
      oraRitiro: ordine.oraRitiro || '10:00',
      dettagliOrdine: dettagliOrdine,
      totale: ordine.totale?.toFixed(2) || '0.00'
    };
    
    const result = await whatsappService.inviaMessaggioConTemplate(
      ordine.cliente.telefono,
      'conferma_ordine',
      variabili
    );
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Errore invio conferma ordine WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/restart
router.post('/restart', async (req, res) => {
  try {
    await whatsappService.restart();
    res.json({
      success: true,
      message: 'WhatsApp service riavviato'
    });
  } catch (error) {
    logger.error('Errore riavvio WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;