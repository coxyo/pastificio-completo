// routes/webhook.js - BACKEND
// Route per gestire chiamate entranti da 3CX Extension

const express = require('express');
const router = express.Router();
const Pusher = require('pusher');
const Cliente = require('../models/Cliente');
const logger = require('../config/logger');

// ===== INIZIALIZZA PUSHER =====
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true
});

/**
 * POST /api/webhook/chiamata-entrante
 * Riceve chiamate dalla extension 3CX
 */
router.post('/chiamata-entrante', async (req, res) => {
  try {
    const { numero, timestamp, callId, source } = req.body;

    logger.info('📞 Webhook chiamata-entrante ricevuto', {
      numero,
      timestamp,
      callId,
      source: source || 'unknown'
    });

    // Validazione
    if (!numero) {
      return res.status(400).json({
        success: false,
        error: 'Numero mancante'
      });
    }

    // Pulisci numero (rimuovi spazi, trattini, ecc.)
    const numeroPulito = numero.replace(/[\s\-\(\)]/g, '');

    // ===== CERCA CLIENTE NEL DATABASE =====
    let clienteTrovato = null;

    try {
      // Cerca per numero esatto
      clienteTrovato = await Cliente.findOne({
        telefono: numeroPulito
      });

      // Fallback: cerca con varianti (+39, 0039, senza prefisso)
      if (!clienteTrovato) {
        const varianti = [
          numeroPulito.replace(/^\+39/, ''),  // Rimuovi +39
          numeroPulito.replace(/^0039/, ''),   // Rimuovi 0039
          `+39${numeroPulito}`,                // Aggiungi +39
          `0039${numeroPulito}`                // Aggiungi 0039
        ];

        for (const variante of varianti) {
          clienteTrovato = await Cliente.findOne({
            telefono: variante
          });
          if (clienteTrovato) break;
        }
      }

      if (clienteTrovato) {
        logger.info('✅ Cliente trovato', {
          id: clienteTrovato._id,
          nome: clienteTrovato.nome,
          cognome: clienteTrovato.cognome,
          codice: clienteTrovato.codiceCliente
        });
      } else {
        logger.info('⚠️ Cliente non trovato per numero:', numeroPulito);
      }

    } catch (dbError) {
      logger.error('❌ Errore ricerca cliente:', dbError);
      // Non bloccare il flusso se il DB fallisce
    }

    // ===== PREPARA DATI PER PUSHER =====
    const pusherData = {
      numero: numeroPulito,
      timestamp: timestamp || new Date().toISOString(),
      callId: callId || `call_${Date.now()}`,
      source: source || 'webhook',
      cliente: clienteTrovato ? {
        _id: clienteTrovato._id,
        nome: clienteTrovato.nome,
        cognome: clienteTrovato.cognome,
        telefono: clienteTrovato.telefono,
        email: clienteTrovato.email,
        codiceCliente: clienteTrovato.codiceCliente,
        citta: clienteTrovato.citta,
        livelloFedelta: clienteTrovato.livelloFedelta,
        punti: clienteTrovato.punti,
        totaleSpesoStorico: clienteTrovato.totaleSpesoStorico
      } : null
    };

    // ===== INVIA EVENTO PUSHER =====
    try {
      await pusher.trigger('chiamate', 'nuova-chiamata', pusherData);
      
      logger.info('✅ Evento Pusher inviato', {
        channel: 'chiamate',
        event: 'nuova-chiamata',
        hasCliente: !!clienteTrovato
      });

    } catch (pusherError) {
      logger.error('❌ Errore invio Pusher:', pusherError);
      
      return res.status(500).json({
        success: false,
        error: 'Errore invio notifica Pusher',
        details: pusherError.message
      });
    }

    // ===== RISPOSTA SUCCESS =====
    res.status(200).json({
      success: true,
      numero: numeroPulito,
      clienteTrovato: !!clienteTrovato,
      cliente: clienteTrovato ? {
        id: clienteTrovato._id,
        nome: `${clienteTrovato.nome} ${clienteTrovato.cognome}`,
        codice: clienteTrovato.codiceCliente
      } : null,
      pusherSent: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Errore webhook chiamata-entrante:', error);
    
    res.status(500).json({
      success: false,
      error: 'Errore interno server',
      message: error.message
    });
  }
});

/**
 * GET /api/webhook/test
 * Test route per verificare webhook
 */
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Webhook API attivo',
    pusher: {
      configured: !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY),
      cluster: process.env.PUSHER_CLUSTER || 'eu'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/webhook/test-pusher
 * Test invio Pusher manuale
 */
router.post('/test-pusher', async (req, res) => {
  try {
    const testData = {
      numero: '+393201234567',
      timestamp: new Date().toISOString(),
      callId: 'test_' + Date.now(),
      cliente: {
        _id: 'test123',
        nome: 'Mario',
        cognome: 'Rossi',
        telefono: '+393201234567',
        codiceCliente: 'CL250001',
        livelloFedelta: 'oro',
        punti: 150,
        totaleSpesoStorico: 250.50
      }
    };

    await pusher.trigger('chiamate', 'nuova-chiamata', testData);
    
    logger.info('✅ Test Pusher inviato');

    res.json({
      success: true,
      message: 'Test Pusher inviato',
      data: testData
    });

  } catch (error) {
    logger.error('❌ Errore test Pusher:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;