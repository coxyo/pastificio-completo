// routes/cx3.js - Gestione chiamate 3CX completa
import express from 'express';
import { protect } from '../middleware/auth.js';
import Cliente from '../models/Cliente.js';
import Chiamata from '../models/Chiamata.js';
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

      // Salva chiamata nel database
      try {
        const chiamata = new Chiamata({
          callId,
          numero: numeroClean,
          numeroOriginale: numero,
          cliente: cliente._id,
          timestamp: timestamp || new Date(),
          source: source || '3cx-extension',
          esito: 'in_arrivo',
          durata: 0
        });
        await chiamata.save();
        logger.info('✅ Chiamata salvata nel database', { 
          chiamataId: chiamata._id 
        });
      } catch (dbError) {
        logger.warn('⚠️ Errore salvataggio chiamata (non critico)', { 
          error: dbError.message 
        });
      }

      // Costruisci payload per frontend
      const payload = {
        callId,
        numero: numeroClean,
        numeroOriginale: numero,
        timestamp: timestamp || new Date().toISOString(),
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
          totaleSpesoStorico: cliente.totaleSpesoStorico,
          numeroOrdini: cliente.numeroOrdini
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

      // Salva chiamata anche per cliente sconosciuto
      try {
        const chiamata = new Chiamata({
          callId,
          numero: numeroClean,
          numeroOriginale: numero,
          cliente: null,
          timestamp: timestamp || new Date(),
          source: source || '3cx-extension',
          esito: 'sconosciuto',
          durata: 0
        });
        await chiamata.save();
        logger.info('✅ Chiamata sconosciuto salvata', { 
          chiamataId: chiamata._id 
        });
      } catch (dbError) {
        logger.warn('⚠️ Errore salvataggio chiamata (non critico)', { 
          error: dbError.message 
        });
      }

      // Invia notifica anche per cliente sconosciuto
      const payload = {
        callId,
        numero: numeroClean,
        numeroOriginale: numero,
        timestamp: timestamp || new Date().toISOString(),
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
 * @route   GET /api/cx3/history
 * @desc    Ottiene storico chiamate (opzionale: filtrato per cliente)
 * @access  Privato
 */
router.get('/history', protect, async (req, res) => {
  try {
    const { clienteId, limit = 10, page = 1, from, to } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Costruisci query
    const query = {};

    if (clienteId) {
      query.cliente = clienteId;
    }

    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    // Recupera chiamate
    const chiamate = await Chiamata.find(query)
      .populate('cliente', 'nome cognome codiceCliente telefono cellulare')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totale = await Chiamata.countDocuments(query);

    logger.info('✅ Storico chiamate recuperato', {
      totale,
      risultati: chiamate.length,
      clienteId: clienteId || 'tutti'
    });

    res.json({
      chiamate,
      totale,
      pagina: parseInt(page),
      totalePagine: Math.ceil(totale / parseInt(limit))
    });

  } catch (error) {
    logger.error('❌ Errore recupero storico chiamate', { 
      error: error.message 
    });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/cx3/chiamate/:id
 * @desc    Ottiene dettagli singola chiamata
 * @access  Privato
 */
router.get('/chiamate/:id', protect, async (req, res) => {
  try {
    const chiamata = await Chiamata.findById(req.params.id)
      .populate('cliente', 'nome cognome codiceCliente telefono email');

    if (!chiamata) {
      return res.status(404).json({ error: 'Chiamata non trovata' });
    }

    res.json(chiamata);

  } catch (error) {
    logger.error('❌ Errore recupero chiamata', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/cx3/chiamate/:id
 * @desc    Aggiorna chiamata (es. aggiungi note, esito, durata)
 * @access  Privato
 */
router.put('/chiamate/:id', protect, async (req, res) => {
  try {
    const { note, esito, durata } = req.body;

    const chiamata = await Chiamata.findByIdAndUpdate(
      req.params.id,
      { note, esito, durata },
      { new: true, runValidators: true }
    );

    if (!chiamata) {
      return res.status(404).json({ error: 'Chiamata non trovata' });
    }

    logger.info('✅ Chiamata aggiornata', { 
      chiamataId: chiamata._id,
      esito,
      note: note ? 'presente' : 'assente'
    });

    res.json(chiamata);

  } catch (error) {
    logger.error('❌ Errore aggiornamento chiamata', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/cx3/statistiche
 * @desc    Ottiene statistiche chiamate
 * @access  Privato
 */
router.get('/statistiche', protect, async (req, res) => {
  try {
    const { from, to } = req.query;

    const query = {};
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const totaleChiamate = await Chiamata.countDocuments(query);
    const chiamateRisposte = await Chiamata.countDocuments({ 
      ...query, 
      esito: { $in: ['risposta', 'completato'] } 
    });
    const chiamateNonRisposte = await Chiamata.countDocuments({ 
      ...query, 
      esito: 'non_risposta' 
    });
    const chiamateSconosciuti = await Chiamata.countDocuments({ 
      ...query, 
      cliente: null 
    });

    // Chiamate per giorno (ultimi 30 giorni)
    const trentaGiorniFa = new Date();
    trentaGiorniFa.setDate(trentaGiorniFa.getDate() - 30);

    const chiamatePerGiorno = await Chiamata.aggregate([
      { $match: { timestamp: { $gte: trentaGiorniFa } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const stats = {
      totaleChiamate,
      chiamateRisposte,
      chiamateNonRisposte,
      chiamateSconosciuti,
      tassoRisposta: totaleChiamate > 0 
        ? ((chiamateRisposte / totaleChiamate) * 100).toFixed(1) 
        : 0,
      chiamatePerGiorno
    };

    logger.info('✅ Statistiche chiamate calcolate', { 
      totaleChiamate,
      periodo: from || to ? 'personalizzato' : 'tutto'
    });

    res.json(stats);

  } catch (error) {
    logger.error('❌ Errore calcolo statistiche chiamate', { 
      error: error.message 
    });
    res.status(500).json({ error: error.message });
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
      numeroOriginale: numeroTest,
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
        totaleSpesoStorico: 1500,
        numeroOrdini: 15
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
      history: '/api/cx3/history',
      chiamate: '/api/cx3/chiamate/:id',
      statistiche: '/api/cx3/statistiche',
      test: '/api/cx3/test',
      status: '/api/cx3/status'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
