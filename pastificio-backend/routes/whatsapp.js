// routes/whatsapp.js - VERSIONE FINALE CON SUPPORTO TEMPLATE
import express from 'express';
import * as whatsappService from '../services/whatsappService.js';
import logger from '../config/logger.js';
import Ordine from '../models/Ordine.js';

const router = express.Router();

// GET /api/whatsapp/status
router.get('/status', async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      connected: status.connected || false,
      status: status.status || 'disconnected'
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

// GET /api/whatsapp/qr - QR Code per connessione
router.get('/qr', async (req, res) => {
  try {
    const qrCode = whatsappService.getQRCode ? whatsappService.getQRCode() : null;
    res.json({
      success: true,
      qrCode: qrCode,
      needsScan: qrCode !== null
    });
  } catch (error) {
    logger.error('Errore recupero QR:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/send - Endpoint UNIVERSALE con supporto template
router.post('/send', async (req, res) => {
  try {
    logger.info('📱 WhatsApp /send chiamato');
    
    const { numero, messaggio, to, message, template, variabili, autoSend } = req.body;
    
    let numeroFinale, messaggioFinale;
    
    // Formato 1: {numero, messaggio}
    if (numero && messaggio) {
      numeroFinale = numero;
      messaggioFinale = messaggio;
      logger.info('✅ Formato 1 rilevato: {numero, messaggio}');
    }
    // Formato 2: {to, message}
    else if (to && message) {
      numeroFinale = to;
      messaggioFinale = message;
      logger.info('✅ Formato 2 rilevato: {to, message}');
    }
    // Formato 3: {numero, template, variabili} ← SUPPORTO FRONTEND!
    else if (numero && template) {
      numeroFinale = numero;
      
      logger.info(`✅ Formato 3 rilevato: {numero, template="${template}", variabili}`);
      
      // Genera messaggio da template
      const templates = {
        'ordine_pronto': `✅ *ORDINE PRONTO!*\n\n${variabili?.nome || 'Cliente'}, il tuo ordine ${variabili?.numeroOrdine || ''} è pronto!\n\n⏰ Ti aspettiamo entro le ore di chiusura\n📍 Via Carmine 20/B, Assemini\n\nA presto! 😊`,
        
        'conferma_ordine': `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝\n\n✅ ORDINE CONFERMATO\n\nGrazie ${variabili?.nome || 'Cliente'}!\nIl tuo ordine ${variabili?.numeroOrdine || ''} è stato confermato.\n\nTi aspettiamo! 😊`,
        
        'promemoria': `🔔 *PROMEMORIA RITIRO*\n\nCiao ${variabili?.nome || 'Cliente'}!\n\nTi ricordiamo il ritiro del tuo ordine ${variabili?.numeroOrdine || ''}.\n\nA presto! 😊`
      };
      
      messaggioFinale = templates[template] || templates['ordine_pronto'];
    }
    else {
      logger.error('❌ Formato parametri non valido:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Parametri mancanti',
        hint: 'Invia: {numero, messaggio} oppure {numero, template, variabili}',
        received: Object.keys(req.body)
      });
    }
    
    if (!numeroFinale) {
      logger.error('❌ Numero telefono mancante');
      return res.status(400).json({
        success: false,
        error: 'Numero telefono mancante'
      });
    }
    
    logger.info(`📤 Generazione link WhatsApp per ${numeroFinale}`);
    
    // Genera link WhatsApp
    const result = await whatsappService.inviaMessaggio(numeroFinale, messaggioFinale);
    
    logger.info(`✅ Link WhatsApp generato: ${result.whatsappUrl}`);
    
    res.json({
      success: true,
      whatsappUrl: result.whatsappUrl,
      messageId: result.messageId,
      numero: numeroFinale,
      autoSend: autoSend || false,
      data: result
    });
  } catch (error) {
    logger.error('❌ Errore invio messaggio WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/invia-messaggio - Alias di /send
router.post('/invia-messaggio', async (req, res) => {
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
      success: result.success || true,
      whatsappUrl: result.whatsappUrl,
      messageId: result.messageId,
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

// POST /api/whatsapp/invia-conferma-ordine
router.post('/invia-conferma-ordine', async (req, res) => {
  try {
    const { ordine } = req.body;
    
    if (!ordine) {
      return res.status(400).json({
        success: false,
        error: 'Dati ordine mancanti'
      });
    }
    
    const telefono = ordine.telefono || ordine.cliente?.telefono;
    
    if (!telefono) {
      return res.status(400).json({
        success: false,
        error: 'Numero telefono mancante'
      });
    }
    
    const prodottiDettaglio = (ordine.prodotti || [])
      .map(p => `• ${p.nome}: ${p.quantita} ${p.unita || 'pz'}`)
      .join('\n');
    
    const variabili = {
      nomeCliente: ordine.nomeCliente || ordine.cliente?.nome || 'Cliente',
      dataRitiro: new Date(ordine.dataRitiro).toLocaleDateString('it-IT'),
      oraRitiro: ordine.oraRitiro || '10:00',
      prodotti: prodottiDettaglio,
      totale: (ordine.totale || 0).toFixed(2),
      note: ordine.note || ''
    };
    
    const result = await whatsappService.inviaMessaggioConTemplate(
      telefono,
      'conferma-ordine',
      variabili
    );
    
    res.json({
      success: result.success || true,
      whatsappUrl: result.whatsappUrl,
      messageId: result.messageId,
      data: result
    });
  } catch (error) {
    logger.error('Errore invio conferma ordine:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/invia-ordine-pronto/:ordineId
router.post('/invia-ordine-pronto/:ordineId', async (req, res) => {
  try {
    const { ordineId } = req.params;
    let ordine = req.body;
    
    if (!ordine || !ordine.telefono) {
      ordine = await Ordine.findById(ordineId);
      if (!ordine) {
        return res.status(404).json({
          success: false,
          error: 'Ordine non trovato'
        });
      }
    }
    
    const telefono = ordine.telefono || ordine.cliente?.telefono;
    
    if (!telefono) {
      return res.status(400).json({
        success: false,
        error: 'Numero telefono mancante'
      });
    }
    
    const variabili = {
      nomeCliente: ordine.nomeCliente || ordine.cliente?.nome || 'Cliente',
      oraRitiro: ordine.oraRitiro || '10:00'
    };
    
    const result = await whatsappService.inviaMessaggioConTemplate(
      telefono,
      'ordine-pronto',
      variabili
    );
    
    res.json({
      success: result.success || true,
      whatsappUrl: result.whatsappUrl,
      messageId: result.messageId,
      data: result
    });
  } catch (error) {
    logger.error('Errore invio ordine pronto:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/invia-promemoria/:ordineId
router.post('/invia-promemoria/:ordineId', async (req, res) => {
  try {
    const { ordineId } = req.params;
    let ordine = req.body;
    
    if (!ordine || !ordine.telefono) {
      ordine = await Ordine.findById(ordineId);
      if (!ordine) {
        return res.status(404).json({
          success: false,
          error: 'Ordine non trovato'
        });
      }
    }
    
    const telefono = ordine.telefono || ordine.cliente?.telefono;
    
    if (!telefono) {
      return res.status(400).json({
        success: false,
        error: 'Numero telefono mancante'
      });
    }
    
    const variabili = {
      nomeCliente: ordine.nomeCliente || ordine.cliente?.nome || 'Cliente',
      dataRitiro: new Date(ordine.dataRitiro).toLocaleDateString('it-IT'),
      oraRitiro: ordine.oraRitiro || '10:00',
      prodottiBreve: (ordine.prodotti || [])
        .slice(0, 3)
        .map(p => `• ${p.nome}`)
        .join('\n')
    };
    
    const result = await whatsappService.inviaMessaggioConTemplate(
      telefono,
      'promemoria-giorno-prima',
      variabili
    );
    
    res.json({
      success: result.success || true,
      whatsappUrl: result.whatsappUrl,
      messageId: result.messageId,
      data: result
    });
  } catch (error) {
    logger.error('Errore invio promemoria:', error);
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
    
    const result = await whatsappService.inviaMessaggioConTemplate(numero, template, variabili || {});
    
    res.json({
      success: result.success || true,
      whatsappUrl: result.whatsappUrl,
      messageId: result.messageId,
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
