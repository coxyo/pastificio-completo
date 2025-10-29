// routes/cx3.js - Gestione chiamate 3CX
import express from 'express';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';
import pusherService from '../services/pusherService.js';

const router = express.Router();

/**
 * @route   POST /api/cx3/incoming
 * @desc    Riceve notifica di chiamata in arrivo da Chrome Extension
 * @access  Public (ma solo da extension)
 */
router.post('/incoming', async (req, res) => {
  const { callId, numero, timestamp, source } = req.body;
  
  logger.info('📞 Chiamata in arrivo da 3CX', {
    callId,
    numero,
    timestamp,
    source
  });

  try {
    // Rimuovi spazi e formatta numero
    const numeroClean = numero.replace(/\s+/g, '');
    
    // Cerca cliente per numero (telefono o cellulare)
    const cliente = await Cliente.findOne({
      $or: [
        { telefono: numeroClean },
        { cellulare: numeroClean },
        { telefono: numero },
        { cellulare: numero }
      ]
    });

    if (cliente) {
      logger.info('✅ Cliente trovato', {
        clienteId: cliente._id,
        nome: cliente.nome,
        cognome: cliente.cognome,
        codiceCliente: cliente.codiceCliente
      });

      // Costruisci payload per frontend
      const payload = {
        callId,
        numero: numeroClean,
        timestamp,
        source,
        cliente: {
          _id: cliente._id,
          codiceCliente: cliente.codiceCliente,
          nome: cliente.nome,
          cognome: cliente.cognome,
          ragioneSociale: cliente.ragioneSociale,
          telefono: cliente.telefono,
          cellulare: cliente.cellulare,
          email: cliente.email,
          indirizzo: cliente.indirizzo,
          citta: cliente.citta,
          provincia: cliente.provincia,
          cap: cliente.cap,
          note: cliente.note,
          livelloFedelta: cliente.livelloFedelta,
          punti: cliente.punti,
          totaleSpesoStorico: cliente.totaleSpesoStorico
        }
      };

      // Invia notifica Pusher a frontend
      try {
        await pusherService.trigger('chiamate', 'nuova-chiamata', payload);
        
        logger.info('✅ Notifica Pusher inviata', {
          channel: 'chiamate',
          event: 'nuova-chiamata',
          clienteId: cliente._id
        });
      } catch (pusherError) {
        logger.error('❌ Errore invio Pusher', { error: pusherError.message });
      }

      res.json({
        success: true,
        clienteTrovato: true,
        cliente: payload.cliente
      });

    } else {
      logger.warn('⚠️ Cliente NON trovato', {
        numero: numeroClean,
        numeroOriginale: numero
      });

      // Invia notifica anche per cliente sconosciuto
      const payload = {
        callId,
        numero: numeroClean,
        timestamp,
        source,
        cliente: null
      };

      try {
        await pusherService.trigger('chiamate', 'nuova-chiamata', payload);
        
        logger.info('✅ Notifica cliente sconosciuto inviata', {
          numero: numeroClean
        });
      } catch (pusherError) {
        logger.error('❌ Errore invio Pusher', { error: pusherError.message });
      }

      res.json({
        success: true,
        clienteTrovato: false,
        numero: numeroClean
      });
    }

  } catch (error) {
    logger.error('❌ Errore gestione chiamata 3CX', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/cx3/test
 * @desc    Endpoint per testare chiamata simulata
 * @access  Public
 */
router.post('/test', async (req, res) => {
  const numeroTest = req.body.numero || '+393331234567';
  
  logger.info('🧪 TEST: Simulazione chiamata in arrivo', { numero: numeroTest });

  try {
    const payload = {
      callId: `CX3-TEST-${Date.now()}`,
      numero: numeroTest,
      timestamp: new Date().toISOString(),
      source: 'test-manual',
      cliente: {
        _id: 'test-id',
        codiceCliente: 'CL250001',
        nome: 'Mario',
        cognome: 'Rossi',
        telefono: numeroTest,
        email: 'mario.rossi@example.com',
        citta: 'Assemini',
        livelloFedelta: 'oro',
        punti: 250,
        totaleSpesoStorico: 1500
      }
    };

    await pusherService.trigger('chiamate', 'nuova-chiamata', payload);
    
    logger.info('✅ Chiamata test inviata', { success: true });

    res.json({
      success: true,
      message: 'Chiamata test inviata con successo',
      payload
    });

  } catch (error) {
    logger.error('❌ Errore test chiamata', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cx3/status
 * @desc    Verifica stato del servizio
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    service: '3CX Integration',
    status: 'active',
    endpoints: {
      incoming: '/api/cx3/incoming',
      test: '/api/cx3/test',
      status: '/api/cx3/status'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;