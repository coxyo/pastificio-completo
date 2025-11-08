// routes/cx3.js - VERSIONE AGGIORNATA CON STORICO
import express from 'express';
import Cliente from '../models/Cliente.js';
import ChiamataStorico from '../models/ChiamataStorico.js';
import logger from '../config/logger.js';
import pusherService from '../services/pusherService.js';

const router = express.Router();

/**
 * @route   POST /api/cx3/incoming
 * @desc    Riceve notifica di chiamata in arrivo + salva storico
 * @access  Public
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
    // Pulisci numero
    const numeroClean = numero.replace(/\s+/g, '');
    
    // Cerca cliente
    const cliente = await Cliente.findOne({
      $or: [
        { telefono: numeroClean },
        { cellulare: numeroClean },
        { telefono: numero },
        { cellulare: numero }
      ]
    });

    // ✅ NUOVO: Salva chiamata in storico
    const chiamataData = {
      callId: callId || `call_${Date.now()}`,
      numero: numero,
      numeroNormalizzato: numeroClean,
      cliente: cliente?._id || null,
      dataOraChiamata: timestamp ? new Date(timestamp) : new Date(),
      stato: 'ricevuta',
      source: source || '3cx_extension'
    };
    
    const chiamataStorico = new ChiamataStorico(chiamataData);
    await chiamataStorico.save();
    
    logger.info('✅ Chiamata salvata in storico', {
      chiamataId: chiamataStorico._id,
      clienteId: cliente?._id
    });

    // Prepara payload Pusher
    const payload = {
      callId: chiamataStorico._id.toString(),
      callIdOriginale: callId,
      numero: numeroClean,
      timestamp,
      source,
      cliente: cliente ? {
        _id: cliente._id,
        codiceCliente: cliente.codiceCliente,
        nome: cliente.nome,
        cognome: cliente.cognome,
        ragioneSociale: cliente.ragioneSociale,
        telefono: cliente.telefono,
        cellulare: cliente.cellulare,
        email: cliente.email,
        livelloFedelta: cliente.livelloFedelta,
        punti: cliente.punti,
        totaleSpesoStorico: cliente.totaleSpesoStorico
      } : null,
      // ✅ NUOVO: Aggiungi note automatiche
      noteAutomatiche: chiamataStorico.noteAutomatiche || []
    };

    // Invia notifica Pusher
    try {
      await pusherService.trigger('chiamate', 'nuova-chiamata', payload);
      
      logger.info('✅ Notifica Pusher inviata con note automatiche', {
        channel: 'chiamate',
        event: 'nuova-chiamata',
        clienteId: cliente?._id,
        noteCount: chiamataStorico.noteAutomatiche.length
      });
    } catch (pusherError) {
      logger.error('❌ Errore invio Pusher', { error: pusherError.message });
    }

    res.json({
      success: true,
      clienteTrovato: !!cliente,
      cliente: payload.cliente,
      chiamataId: chiamataStorico._id,
      noteAutomatiche: chiamataStorico.noteAutomatiche
    });

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
 * @route   GET /api/cx3/history
 * @desc    Ottiene storico chiamate per cliente
 * @access  Private
 */
router.get('/history', async (req, res) => {
  try {
    const { clienteId, numero, limit = 20, offset = 0 } = req.query;
    
    const query = {};
    
    if (clienteId) {
      query.cliente = clienteId;
    }
    
    if (numero) {
      const numeroClean = numero.replace(/\s+/g, '');
      query.numeroNormalizzato = numeroClean;
    }
    
    const chiamate = await ChiamataStorico.find(query)
      .populate('cliente', 'nome cognome telefono email livelloFedelta')
      .populate('ordineCollegato', 'totale stato dataRitiro')
      .sort({ dataOraChiamata: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();
    
    const totale = await ChiamataStorico.countDocuments(query);
    
    res.json({
      success: true,
      data: chiamate,
      pagination: {
        totale,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totale > (parseInt(offset) + parseInt(limit))
      }
    });
    
  } catch (error) {
    logger.error('❌ Errore recupero storico chiamate', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cx3/stats
 * @desc    Statistiche chiamate per cliente
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    const { clienteId } = req.query;
    
    if (!clienteId) {
      return res.status(400).json({
        success: false,
        error: 'clienteId richiesto'
      });
    }
    
    const stats = await ChiamataStorico.getStatisticheCliente(clienteId);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('❌ Errore calcolo statistiche', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/cx3/:chiamataId/esito
 * @desc    Aggiorna esito chiamata (quando ordine viene creato)
 * @access  Private
 */
router.patch('/:chiamataId/esito', async (req, res) => {
  try {
    const { chiamataId } = req.params;
    const { esitoChiamata, ordineCollegato, note, durata } = req.body;
    
    const chiamata = await ChiamataStorico.findByIdAndUpdate(
      chiamataId,
      {
        $set: {
          esitoChiamata,
          ordineCollegato,
          note,
          durata,
          stato: 'risposta'
        }
      },
      { new: true }
    );
    
    if (!chiamata) {
      return res.status(404).json({
        success: false,
        error: 'Chiamata non trovata'
      });
    }
    
    logger.info('✅ Esito chiamata aggiornato', {
      chiamataId,
      esitoChiamata,
      ordineCollegato
    });
    
    res.json({
      success: true,
      data: chiamata
    });
    
  } catch (error) {
    logger.error('❌ Errore aggiornamento esito', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/cx3/test
 * @desc    Test chiamata simulata
 * @access  Public
 */
router.post('/test', async (req, res) => {
  const numeroTest = req.body.numero || '+393408208314';
  
  logger.info('🧪 TEST: Simulazione chiamata in arrivo', { numero: numeroTest });

  try {
    const cliente = await Cliente.findOne({
      $or: [
        { telefono: numeroTest.replace(/\s+/g, '') },
        { cellulare: numeroTest.replace(/\s+/g, '') }
      ]
    });
    
    // Crea chiamata test
    const chiamataTest = new ChiamataStorico({
      callId: `test_${Date.now()}`,
      numero: numeroTest,
      numeroNormalizzato: numeroTest.replace(/\s+/g, ''),
      cliente: cliente?._id || null,
      dataOraChiamata: new Date(),
      stato: 'ricevuta',
      source: 'test-manual'
    });
    
    await chiamataTest.save();

    const payload = {
      callId: chiamataTest._id.toString(),
      numero: numeroTest.replace(/\s+/g, ''),
      timestamp: new Date().toISOString(),
      source: 'test-manual',
      cliente: cliente ? {
        _id: cliente._id,
        codiceCliente: cliente.codiceCliente,
        nome: cliente.nome,
        cognome: cliente.cognome,
        telefono: cliente.telefono,
        email: cliente.email,
        livelloFedelta: cliente.livelloFedelta,
        punti: cliente.punti
      } : null,
      noteAutomatiche: chiamataTest.noteAutomatiche || []
    };

    await pusherService.trigger('chiamate', 'nuova-chiamata', payload);
    
    logger.info('✅ Chiamata test inviata', { success: true });

    res.json({
      success: true,
      message: 'Chiamata test inviata con successo',
      payload,
      chiamataId: chiamataTest._id
    });

  } catch (error) {
    logger.error('❌ Errore test chiamata', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;