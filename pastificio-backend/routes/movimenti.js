// routes/movimenti.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import Movimento from '../models/movimento.js';
import logger from '../config/logger.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

// POST nuovo movimento
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/movimenti - Nuovo movimento:', req.body);
    console.log('Utente autenticato:', req.user);
    
    // Assicurati che utenteId sia impostato correttamente
    const movimentoData = {
      ...req.body,
      utenteId: req.user._id || req.user.id,
      dataRegistrazione: new Date()
    };
    
    // Rimuovi utenteId vuoto se presente nel body
    if (movimentoData.utenteId === '' || movimentoData.utenteId === null) {
      delete movimentoData.utenteId;
      movimentoData.utenteId = req.user._id || req.user.id;
    }
    
    console.log('Dati movimento da salvare:', movimentoData);
    
    const movimento = new Movimento(movimentoData);
    await movimento.save();
    
    console.log('Movimento salvato:', movimento._id);
    
    // Emetti via WebSocket a tutti i client connessi
    if (req.io) {
      req.io.emit('movimento:aggiornamento', {
        tipo: 'nuovo',
        movimento: movimento
      });
    }
    
    res.status(201).json({
      success: true,
      data: movimento
    });
  } catch (error) {
    console.error('Errore creazione movimento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione del movimento: ' + error.message
    });
  }
});

// GET tutti i movimenti con filtri e paginazione
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/movimenti - Recupero movimenti...');
    
    const {
      page = 1,
      limit = 50,
      tipo,
      dataInizio,
      dataFine,
      prodotto,
      fornitore,
      cliente
    } = req.query;

    // Costruisci query
    const query = {};
    
    if (tipo) query.tipo = tipo;
    if (prodotto) query.prodotto = new RegExp(prodotto, 'i');
    if (fornitore) query.fornitore = new RegExp(fornitore, 'i');
    if (cliente) query.cliente = new RegExp(cliente, 'i');
    
    // Filtro date
    if (dataInizio || dataFine) {
      query.dataRegistrazione = {};
      if (dataInizio) query.dataRegistrazione.$gte = new Date(dataInizio);
      if (dataFine) query.dataRegistrazione.$lte = new Date(dataFine);
    }

    // Calcola skip per paginazione
    const skip = (page - 1) * limit;

    // Esegui query
    const [movimenti, total] = await Promise.all([
      Movimento.find(query)
        .sort({ dataRegistrazione: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('utenteId', 'username nome'),
      Movimento.countDocuments(query)
    ]);

    console.log(`Recuperati ${movimenti.length} movimenti su ${total} totali`);

    res.json({
      success: true,
      data: movimenti,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Errore recupero movimenti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei movimenti'
    });
  }
});

// GET singolo movimento
router.get('/:id', async (req, res) => {
  try {
    const movimento = await Movimento.findById(req.params.id)
      .populate('utenteId', 'username nome');

    if (!movimento) {
      return res.status(404).json({
        success: false,
        error: 'Movimento non trovato'
      });
    }

    res.json({
      success: true,
      data: movimento
    });
  } catch (error) {
    console.error('Errore recupero movimento:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT aggiorna movimento
router.put('/:id', async (req, res) => {
  try {
    const movimento = await Movimento.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dataAggiornamento: new Date() },
      { new: true, runValidators: true }
    );

    if (!movimento) {
      return res.status(404).json({
        success: false,
        error: 'Movimento non trovato'
      });
    }

    console.log(`Movimento aggiornato: ${movimento._id}`);

    // Notifica via WebSocket
    if (req.io) {
      req.io.emit('movimento:aggiornamento', {
        tipo: 'aggiornamento',
        movimento: movimento
      });
    }

    res.json({
      success: true,
      data: movimento
    });
  } catch (error) {
    console.error('Errore aggiornamento movimento:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE elimina movimento
router.delete('/:id', async (req, res) => {
  try {
    const movimento = await Movimento.findByIdAndDelete(req.params.id);

    if (!movimento) {
      return res.status(404).json({
        success: false,
        error: 'Movimento non trovato'
      });
    }

    console.log(`Movimento eliminato: ${movimento._id}`);

    // Notifica via WebSocket
    if (req.io) {
      req.io.emit('movimento:aggiornamento', {
        tipo: 'eliminazione',
        movimentoId: req.params.id
      });
    }

    res.json({
      success: true,
      message: 'Movimento eliminato con successo'
    });
  } catch (error) {
    console.error('Errore eliminazione movimento:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET statistiche movimenti
router.get('/stats/riassunto', async (req, res) => {
  try {
    const { dataInizio, dataFine } = req.query;
    
    const matchQuery = {};
    if (dataInizio || dataFine) {
      matchQuery.dataRegistrazione = {};
      if (dataInizio) matchQuery.dataRegistrazione.$gte = new Date(dataInizio);
      if (dataFine) matchQuery.dataRegistrazione.$lte = new Date(dataFine);
    }

    const statistiche = await Movimento.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$tipo',
          totaleQuantita: { $sum: '$quantita' },
          totaleValore: { $sum: '$valoreTotale' },
          numeroMovimenti: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: statistiche
    });
  } catch (error) {
    console.error('Errore calcolo statistiche:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;