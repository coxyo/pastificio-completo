// routes/webhook.js - BACKEND
// Route per gestire chiamate entranti da 3CX Extension

import express from 'express';
import Pusher from 'pusher';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';

const router = express.Router();

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
        telefono: { $regex: numeroPulito, $options: 'i' } 
      });
      
      // Se non trovato, prova con ricerca parziale
      if (!clienteTrovato) {
        // Prova con ultimi 8 cifre (per numeri internazionali)
        const ultimeOttoCifre = numeroPulito.slice(-8);
        clienteTrovato = await Cliente.findOne({
          telefono: { $regex: ultimeOttoCifre, $options: 'i' }
        });
      }
      
      logger.info('🔍 Ricerca cliente completata', {
        numero: numeroPulito,
        trovato: !!clienteTrovato,
        clienteId: clienteTrovato?._id
      });
      
    } catch (searchError) {
      logger.error('❌ Errore ricerca cliente:', searchError);
      // Continua anche se la ricerca fallisce
    }
    
    // ===== PREPARA DATI POPUP =====
    const popupData = {
      numero: numero,
      numeroOriginale: numero,
      timestamp: timestamp || new Date().toISOString(),
      callId: callId || 'unknown',
      source: source || '3cx',
      cliente: clienteTrovato ? {
        _id: clienteTrovato._id,
        nome: clienteTrovato.nome,
        cognome: clienteTrovato.cognome,
        telefono: clienteTrovato.telefono,
        email: clienteTrovato.email,
        codice: clienteTrovato.codice,
        punti: clienteTrovato.punti,
        livello: clienteTrovato.livello,
        totaleFatturato: clienteTrovato.totaleFatturato,
        numeroOrdini: clienteTrovato.numeroOrdini,
        dataUltimoOrdine: clienteTrovato.dataUltimoOrdine,
        note: clienteTrovato.note
      } : null
    };
    
    // ===== INVIA EVENTO PUSHER =====
    try {
      await pusher.trigger('chiamate', 'nuova-chiamata', popupData);
      
      logger.info('✅ Evento Pusher inviato', {
        canale: 'chiamate',
        evento: 'nuova-chiamata',
        cliente: clienteTrovato?.nome || 'Sconosciuto',
        numero: numeroPulito
      });
      
    } catch (pusherError) {
      logger.error('❌ Errore invio Pusher:', pusherError);
      return res.status(500).json({
        success: false,
        error: 'Errore invio notifica Pusher',
        details: pusherError.message
      });
    }
    
    // ===== RISPOSTA SUCCESSO =====
    res.json({
      success: true,
      message: 'Evento Pusher inviato',
      callId: callId,
      cliente: clienteTrovato ? {
        nome: clienteTrovato.nome,
        cognome: clienteTrovato.cognome,
        telefono: clienteTrovato.telefono
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('❌ Errore webhook chiamata-entrante:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/webhook/health
 * Health check per webhook
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'webhook-chiamate',
    pusher: {
      configured: !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET),
      cluster: process.env.PUSHER_CLUSTER || 'eu'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/webhook/test
 * Endpoint per testare il webhook senza 3CX
 */
router.post('/test', async (req, res) => {
  try {
    const testData = {
      numero: req.body.numero || '+393271234567',
      timestamp: new Date().toISOString(),
      callId: 'test-' + Date.now(),
      source: 'test-manual'
    };
    
    // Invia evento Pusher
    await pusher.trigger('chiamate', 'nuova-chiamata', testData);
    
    logger.info('✅ Test webhook inviato', testData);
    
    res.json({
      success: true,
      message: 'Evento test inviato',
      data: testData
    });
    
  } catch (error) {
    logger.error('❌ Errore test webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;