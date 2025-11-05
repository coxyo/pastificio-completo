// routes/cx3.js - Gestione chiamate 3CX completa
// ✅ VERSIONE CORRETTA CON NORMALIZZAZIONE NUMERO

import express from 'express';
import { protect } from '../middleware/auth.js';
import Cliente from '../models/Cliente.js';
import Chiamata from '../models/Chiamata.js';
import logger from '../config/logger.js';
import pusherService from '../services/pusherService.js';

const router = express.Router();

// ✅ FUNZIONE HELPER: NORMALIZZA NUMERO TELEFONO (uguale a webhook.js)
function normalizzaNumero(numero) {
  if (!numero) return null;
  
  let clean = numero.replace(/[^\d+]/g, '');
  
  if (clean.startsWith('+39')) {
    clean = clean.substring(0, 13);
  }
  
  if (clean.startsWith('39') && !clean.startsWith('+')) {
    clean = clean.substring(0, 12);
  }
  
  const senzaPrefisso = clean.replace(/^\+/, '');
  
  logger.info('🔄 [CX3] Normalizzazione numero', {
    originale: numero,
    pulito: clean,
    perDatabase: senzaPrefisso
  });
  
  return senzaPrefisso;
}

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
    // ✅ NORMALIZZA IL NUMERO
    const numeroNormalizzato = normalizzaNumero(numero);
    
    if (!numeroNormalizzato) {
      return res.status(400).json({
        success: false,
        error: 'Numero telefono non valido'
      });
    }
    
    // Cerca cliente per numero normalizzato
    const cliente = await Cliente.findOne({
      $or: [
        { telefono: numeroNormalizzato },
        { telefono: `+${numeroNormalizzato}` },
        { cellulare: numeroNormalizzato },
        { cellulare: `+${numeroNormalizzato}` },
        // Fallback: ultimi 10 cifre
        { telefono: { $regex: numeroNormalizzato.slice(-10), $options: 'i' } },
        { cellulare: { $regex: numeroNormalizzato.slice(-10), $options: 'i' } }
      ],
      attivo: true
    });

    if (cliente) {
      logger.info('✅ Cliente trovato', {
        clienteId: cliente._id,
        nome: cliente.nome,
        cognome: cliente.cognome,
        codiceCliente: cliente.codiceCliente,
        numeroNormalizzato: numeroNormalizzato
      });

      // Salva chiamata nel database
      try {
        const chiamata = new Chiamata({
          callId,
          numero: numeroNormalizzato, // ✅ USA NORMALIZZATO
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
        numero: numeroNormalizzato, // ✅ USA NORMALIZZATO
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
          clienteId: cliente._id,
          numeroNormalizzato: numeroNormalizzato
        });
      } catch (pusherError) {
        logger.error('❌ Errore invio Pusher', { error: pusherError.message });
      }

      res.json({
        success: true,
        clienteTrovato: true,
        numeroOriginale: numero,
        numeroNormalizzato: numeroNormalizzato,
        cliente: payload.cliente
      });

    } else {
      logger.warn('⚠️ Cliente NON trovato', {
        numeroOriginale: numero,
        numeroNormalizzato: numeroNormalizzato
      });

      // Salva chiamata anche per cliente sconosciuto
      try {
        const chiamata = new Chiamata({
          callId,
          numero: numeroNormalizzato, // ✅ USA NORMALIZZATO
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
        numero: numeroNormalizzato, // ✅ USA NORMALIZZATO
        numeroOriginale: numero,
        timestamp: timestamp || new Date().toISOString(),
        source,
        cliente: null
      };

      try {
        await pusherService.trigger('chiamate', 'nuova-chiamata', payload);
        
        logger.info('✅ Notifica cliente sconosciuto inviata', {
          numeroNormalizzato: numeroNormalizzato
        });
      } catch (pusherError) {
        logger.error('❌ Errore invio Pusher', { error: pusherError.message });
      }

      res.json({
        success: true,
        clienteTrovato: false,
        numeroOriginale: numero,
        numeroNormalizzato: numeroNormalizzato
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

// ... (rest of the routes remain the same)

router.get('/history', protect, async (req, res) => {
  try {
    const { clienteId, limit = 10, page = 1, from, to } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (clienteId) query.cliente = clienteId;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }
    const chiamate = await Chiamata.find(query)
      .populate('cliente', 'nome cognome codiceCliente telefono cellulare')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const totale = await Chiamata.countDocuments(query);
    logger.info('✅ Storico chiamate recuperato', { totale, risultati: chiamate.length, clienteId: clienteId || 'tutti' });
    res.json({ chiamate, totale, pagina: parseInt(page), totalePagine: Math.ceil(totale / parseInt(limit)) });
  } catch (error) {
    logger.error('❌ Errore recupero storico chiamate', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.get('/chiamate/:id', protect, async (req, res) => {
  try {
    const chiamata = await Chiamata.findById(req.params.id).populate('cliente', 'nome cognome codiceCliente telefono email');
    if (!chiamata) return res.status(404).json({ error: 'Chiamata non trovata' });
    res.json(chiamata);
  } catch (error) {
    logger.error('❌ Errore recupero chiamata', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.put('/chiamate/:id', protect, async (req, res) => {
  try {
    const { note, esito, durata } = req.body;
    const chiamata = await Chiamata.findByIdAndUpdate(req.params.id, { note, esito, durata }, { new: true, runValidators: true });
    if (!chiamata) return res.status(404).json({ error: 'Chiamata non trovata' });
    logger.info('✅ Chiamata aggiornata', { chiamataId: chiamata._id, esito, note: note ? 'presente' : 'assente' });
    res.json(chiamata);
  } catch (error) {
    logger.error('❌ Errore aggiornamento chiamata', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

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
    const chiamateRisposte = await Chiamata.countDocuments({ ...query, esito: { $in: ['risposta', 'completato'] } });
    const chiamateNonRisposte = await Chiamata.countDocuments({ ...query, esito: 'non_risposta' });
    const chiamateSconosciuti = await Chiamata.countDocuments({ ...query, cliente: null });
    const trentaGiorniFa = new Date();
    trentaGiorniFa.setDate(trentaGiorniFa.getDate() - 30);
    const chiamatePerGiorno = await Chiamata.aggregate([
      { $match: { timestamp: { $gte: trentaGiorniFa } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const stats = {
      totaleChiamate, chiamateRisposte, chiamateNonRisposte, chiamateSconosciuti,
      tassoRisposta: totaleChiamate > 0 ? ((chiamateRisposte / totaleChiamate) * 100).toFixed(1) : 0,
      chiamatePerGiorno
    };
    logger.info('✅ Statistiche chiamate calcolate', { totaleChiamate, periodo: from || to ? 'personalizzato' : 'tutto' });
    res.json(stats);
  } catch (error) {
    logger.error('❌ Errore calcolo statistiche chiamate', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.post('/test', async (req, res) => {
  const numeroTest = req.body.numero || '+393408208314';
  const numeroNormalizzato = normalizzaNumero(numeroTest);
  logger.info('🧪 TEST: Simulazione chiamata in arrivo', { numeroOriginale: numeroTest, numeroNormalizzato: numeroNormalizzato });
  try {
    const cliente = await Cliente.findOne({ telefono: { $regex: numeroNormalizzato.slice(-10), $options: 'i' } });
    const payload = {
      callId: `CX3-TEST-${Date.now()}`,
      numero: numeroNormalizzato,
      numeroOriginale: numeroTest,
      timestamp: new Date().toISOString(),
      source: 'test-manual',
      cliente: cliente ? {
        _id: cliente._id, codiceCliente: cliente.codiceCliente, nome: cliente.nome, cognome: cliente.cognome,
        telefono: cliente.telefono, email: cliente.email, citta: cliente.citta, livelloFedelta: cliente.livelloFedelta,
        punti: cliente.punti, totaleSpesoStorico: cliente.totaleSpesoStorico, numeroOrdini: cliente.numeroOrdini
      } : null
    };
    await pusherService.trigger('chiamate', 'nuova-chiamata', payload);
    logger.info('✅ Chiamata test inviata', { success: true });
    res.json({ success: true, message: 'Chiamata test inviata con successo', payload });
  } catch (error) {
    logger.error('❌ Errore test chiamata', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status', (req, res) => {
  res.json({
    success: true, service: '3CX Integration', status: 'active',
    endpoints: { incoming: '/api/cx3/incoming', history: '/api/cx3/history', chiamate: '/api/cx3/chiamate/:id',
      statistiche: '/api/cx3/statistiche', test: '/api/cx3/test', status: '/api/cx3/status' },
    timestamp: new Date().toISOString()
  });
});

export default router;
