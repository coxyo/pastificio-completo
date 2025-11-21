// routes/ordini.js
import express from 'express';
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';
import { protect } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// Applica protezione a tutte le route
router.use(protect);

/**
 * @route   POST /api/ordini
 * @desc    Crea un nuovo ordine
 * @access  Privato
 */
router.post('/', async (req, res) => {
  try {
    const { cliente, prodotti, dataRitiro, oraRitiro, note, totale, ordineDaViaggio } = req.body;

    logger.info('[ORDINE] Inizio creazione nuovo ordine');
    logger.info(`[ORDINE] Dati ricevuti: cliente=${cliente}, prodotti=${prodotti?.length}, dataRitiro=${dataRitiro}`);

    // Validazione input
    if (!cliente || !prodotti || prodotti.length === 0) {
      logger.warn('[ORDINE] Validazione fallita: dati mancanti');
      return res.status(400).json({ 
        message: 'Cliente e prodotti sono obbligatori',
        details: {
          cliente: !cliente ? 'mancante' : 'presente',
          prodotti: !prodotti ? 'mancante' : prodotti.length === 0 ? 'array vuoto' : 'presente'
        }
      });
    }

    // Verifica esistenza cliente
    const clienteEsistente = await Cliente.findById(cliente);
    if (!clienteEsistente) {
      logger.error(`[ORDINE] Cliente non trovato: ${cliente}`);
      return res.status(404).json({ message: 'Cliente non trovato' });
    }

    logger.info(`[INFO] Cliente esistente trovato: ${clienteEsistente.codiceCliente} - ${clienteEsistente.nomeCompleto}`);

    // Crea l'ordine
    const nuovoOrdine = new Ordine({
      cliente,
      prodotti,
      dataRitiro,
      oraRitiro,
      note,
      totale,
      ordineDaViaggio: ordineDaViaggio || false,
      stato: 'da_preparare',
      createdBy: req.user._id
    });

    logger.info('[ORDINE] Salvataggio ordine in database...');
    const ordineSalvato = await nuovoOrdine.save();
    
    logger.info(`[SUCCESS] Ordine creato con successo: ID=${ordineSalvato._id}`);

    // Popola il cliente per la risposta
    await ordineSalvato.populate('cliente');

    // Emetti evento WebSocket per aggiornamento real-time
    if (req.app.get('io')) {
      req.app.get('io').emit('nuovoOrdine', ordineSalvato);
      logger.info('[WEBSOCKET] Evento nuovoOrdine emesso');
    }

    res.status(201).json(ordineSalvato);

  } catch (error) {
    logger.error(`[ERROR] Errore creazione ordine: ${error.message}`);
    logger.error(error.stack);
    res.status(500).json({ 
      message: 'Errore nella creazione dell\'ordine',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ordini
 * @desc    Ottiene tutti gli ordini con filtri
 * @access  Privato
 */
router.get('/', async (req, res) => {
  try {
    const { dataInizio, dataFine, stato, cliente } = req.query;
    
    logger.info(`[ORDINI] Richiesta lista ordini: dataInizio=${dataInizio}, dataFine=${dataFine}, stato=${stato}`);

    // Costruisci query
    let query = {};

    if (dataInizio || dataFine) {
      query.dataRitiro = {};
      if (dataInizio) query.dataRitiro.$gte = new Date(dataInizio);
      if (dataFine) query.dataRitiro.$lte = new Date(dataFine);
    }

    if (stato) {
      query.stato = stato;
    }

    if (cliente) {
      query.cliente = cliente;
    }

    const ordini = await Ordine.find(query)
      .populate('cliente', 'nomeCompleto telefono email codiceCliente')
      .sort({ dataRitiro: 1, oraRitiro: 1 })
      .lean();

    logger.info(`[ORDINI] Trovati ${ordini.length} ordini`);

    res.json(ordini);

  } catch (error) {
    logger.error(`[ERROR] Errore recupero ordini: ${error.message}`);
    res.status(500).json({ 
      message: 'Errore nel recupero degli ordini',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ordini/:id
 * @desc    Ottiene un ordine per ID
 * @access  Privato
 */
router.get('/:id', async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.id)
      .populate('cliente')
      .lean();

    if (!ordine) {
      logger.warn(`[ORDINE] Ordine non trovato: ${req.params.id}`);
      return res.status(404).json({ message: 'Ordine non trovato' });
    }

    logger.info(`[ORDINE] Ordine recuperato: ${req.params.id}`);
    res.json(ordine);

  } catch (error) {
    logger.error(`[ERROR] Errore recupero ordine: ${error.message}`);
    res.status(500).json({ 
      message: 'Errore nel recupero dell\'ordine',
      error: error.message 
    });
  }
});

/**
 * @route   PUT /api/ordini/:id
 * @desc    Aggiorna un ordine
 * @access  Privato
 */
router.put('/:id', async (req, res) => {
  try {
    const { prodotti, dataRitiro, oraRitiro, note, stato, totale, ordineDaViaggio } = req.body;

    logger.info(`[ORDINE] Aggiornamento ordine: ${req.params.id}`);

    const ordine = await Ordine.findById(req.params.id);

    if (!ordine) {
      logger.warn(`[ORDINE] Ordine non trovato per aggiornamento: ${req.params.id}`);
      return res.status(404).json({ message: 'Ordine non trovato' });
    }

    // Aggiorna i campi se forniti
    if (prodotti !== undefined) ordine.prodotti = prodotti;
    if (dataRitiro !== undefined) ordine.dataRitiro = dataRitiro;
    if (oraRitiro !== undefined) ordine.oraRitiro = oraRitiro;
    if (note !== undefined) ordine.note = note;
    if (stato !== undefined) ordine.stato = stato;
    if (totale !== undefined) ordine.totale = totale;
    if (ordineDaViaggio !== undefined) ordine.ordineDaViaggio = ordineDaViaggio;

    ordine.updatedBy = req.user._id;

    const ordineAggiornato = await ordine.save();
    await ordineAggiornato.populate('cliente');

    logger.info(`[SUCCESS] Ordine aggiornato: ${req.params.id}`);

    // Emetti evento WebSocket
    if (req.app.get('io')) {
      req.app.get('io').emit('ordineAggiornato', ordineAggiornato);
      logger.info('[WEBSOCKET] Evento ordineAggiornato emesso');
    }

    res.json(ordineAggiornato);

  } catch (error) {
    logger.error(`[ERROR] Errore aggiornamento ordine: ${error.message}`);
    res.status(500).json({ 
      message: 'Errore nell\'aggiornamento dell\'ordine',
      error: error.message 
    });
  }
});

/**
 * @route   DELETE /api/ordini/:id
 * @desc    Elimina un ordine
 * @access  Privato
 */
router.delete('/:id', async (req, res) => {
  try {
    logger.info(`[ORDINE] Richiesta eliminazione ordine: ${req.params.id}`);

    const ordine = await Ordine.findById(req.params.id);

    if (!ordine) {
      logger.warn(`[ORDINE] Ordine non trovato per eliminazione: ${req.params.id}`);
      return res.status(404).json({ message: 'Ordine non trovato' });
    }

    await ordine.deleteOne();

    logger.info(`[SUCCESS] Ordine eliminato: ${req.params.id}`);

    // Emetti evento WebSocket
    if (req.app.get('io')) {
      req.app.get('io').emit('ordineEliminato', { _id: req.params.id });
      logger.info('[WEBSOCKET] Evento ordineEliminato emesso');
    }

    res.json({ message: 'Ordine eliminato con successo' });

  } catch (error) {
    logger.error(`[ERROR] Errore eliminazione ordine: ${error.message}`);
    res.status(500).json({ 
      message: 'Errore nell\'eliminazione dell\'ordine',
      error: error.message 
    });
  }
});

/**
 * @route   PATCH /api/ordini/:id/stato
 * @desc    Aggiorna solo lo stato di un ordine
 * @access  Privato
 */
router.patch('/:id/stato', async (req, res) => {
  try {
    const { stato } = req.body;

    if (!stato) {
      return res.status(400).json({ message: 'Stato obbligatorio' });
    }

    logger.info(`[ORDINE] Aggiornamento stato: ${req.params.id} -> ${stato}`);

    const ordine = await Ordine.findById(req.params.id);

    if (!ordine) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }

    ordine.stato = stato;
    ordine.updatedBy = req.user._id;

    const ordineAggiornato = await ordine.save();
    await ordineAggiornato.populate('cliente');

    logger.info(`[SUCCESS] Stato aggiornato: ${req.params.id}`);

    // Emetti evento WebSocket
    if (req.app.get('io')) {
      req.app.get('io').emit('statoOrdineAggiornato', ordineAggiornato);
    }

    res.json(ordineAggiornato);

  } catch (error) {
    logger.error(`[ERROR] Errore aggiornamento stato: ${error.message}`);
    res.status(500).json({ 
      message: 'Errore nell\'aggiornamento dello stato',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ordini/statistiche/giornaliere
 * @desc    Ottiene statistiche ordini giornalieri
 * @access  Privato
 */
router.get('/statistiche/giornaliere', async (req, res) => {
  try {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 1);

    const ordiniOggi = await Ordine.countDocuments({
      dataRitiro: {
        $gte: oggi,
        $lt: domani
      }
    });

    const totaleOggi = await Ordine.aggregate([
      {
        $match: {
          dataRitiro: {
            $gte: oggi,
            $lt: domani
          }
        }
      },
      {
        $group: {
          _id: null,
          totale: { $sum: '$totale' }
        }
      }
    ]);

    logger.info(`[STATISTICHE] Ordini oggi: ${ordiniOggi}, Totale: ${totaleOggi[0]?.totale || 0}`);

    res.json({
      ordini: ordiniOggi,
      totale: totaleOggi[0]?.totale || 0
    });

  } catch (error) {
    logger.error(`[ERROR] Errore statistiche: ${error.message}`);
    res.status(500).json({ 
      message: 'Errore nel calcolo delle statistiche',
      error: error.message 
    });
  }
});

export default router;
