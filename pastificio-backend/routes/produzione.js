// routes/produzione.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import logger from '../config/logger.js';
import Ricetta from '../models/ricetta.js';
import PianoProduzione from '../models/pianoProduzione.js';
import Ingrediente from '../models/ingrediente.js';
import Movimento from '../models/movimento.js';
import mongoose from 'mongoose';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

/**
 * @route   GET /api/produzione/ricette
 * @desc    Ottiene la lista di tutte le ricette
 * @access  Privato
 */
router.get('/ricette', async (req, res) => {
  try {
    const { attivo } = req.query;
    const query = {};
    
    // Filtra per ricette attive se specificato
    if (attivo !== undefined) {
      query.attivo = attivo === 'true';
    }
    
    const ricette = await Ricetta.find(query)
      .populate('ingredienti.ingrediente', 'nome categoria unitaMisura prezzoUnitario')
      .sort({ categoria: 1, nome: 1 });
    
    logger.info(`Ricette recuperate: ${ricette.length}`, { service: 'produzione-api' });
    
    res.json({
      success: true,
      count: ricette.length,
      data: ricette
    });
  } catch (err) {
    logger.error(`Errore nel recupero ricette: ${err.message}`, { service: 'produzione-api' });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle ricette'
    });
  }
});

/**
 * @route   GET /api/produzione/ricette/:id
 * @desc    Ottiene i dettagli di una ricetta
 * @access  Privato
 */
router.get('/ricette/:id', async (req, res) => {
  try {
    const ricetta = await Ricetta.findById(req.params.id)
      .populate('ingredienti.ingrediente', 'nome categoria unitaMisura prezzoUnitario');
    
    if (!ricetta) {
      return res.status(404).json({
        success: false,
        error: 'Ricetta non trovata'
      });
    }
    
    res.json({
      success: true,
      data: ricetta
    });
  } catch (err) {
    logger.error(`Errore nel recupero ricetta: ${err.message}`, { service: 'produzione-api' });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero della ricetta'
    });
  }
});

/**
 * @route   POST /api/produzione/ricette
 * @desc    Crea una nuova ricetta
 * @access  Privato
 */
router.post('/ricette', async (req, res) => {
  try {
    const nuovaRicetta = new Ricetta(req.body);
    await nuovaRicetta.save();
    
    logger.info(`Ricetta creata: ${nuovaRicetta.nome}`, { service: 'produzione-api' });
    
    res.status(201).json({
      success: true,
      data: nuovaRicetta
    });
  } catch (err) {
    logger.error(`Errore nella creazione ricetta: ${err.message}`, { service: 'produzione-api' });
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * @route   PUT /api/produzione/ricette/:id
 * @desc    Aggiorna una ricetta esistente
 * @access  Privato
 */
router.put('/ricette/:id', async (req, res) => {
  try {
    const ricetta = await Ricetta.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!ricetta) {
      return res.status(404).json({
        success: false,
        error: 'Ricetta non trovata'
      });
    }
    
    logger.info(`Ricetta aggiornata: ${ricetta.nome}`, { service: 'produzione-api' });
    
    res.json({
      success: true,
      data: ricetta
    });
  } catch (err) {
    logger.error(`Errore nell'aggiornamento ricetta: ${err.message}`, { service: 'produzione-api' });
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * @route   GET /api/produzione/piani
 * @desc    Ottiene i piani di produzione filtrati per data
 * @access  Privato
 */
router.get('/piani', async (req, res) => {
  try {
    const { startDate, endDate, data, includePast } = req.query;
    const query = {};
    
    // Filtra per data singola se specificata
    if (data) {
      query.data = data;
    }
    // Altrimenti filtra per range di date se specificato
    else if (startDate && endDate) {
      query.data = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    // Escludi i piani passati se richiesto
    if (includePast === 'false') {
      query.data = { ...query.data, $gte: new Date().toISOString().split('T')[0] };
    }
    
    const piani = await PianoProduzione.find(query)
      .sort({ data: 1 })
      .populate({
        path: 'produzioni.ricetta',
        select: 'nome categoria costo tempoPreparazione'
      });
    
    logger.info(`Piani di produzione recuperati: ${piani.length}`, { service: 'produzione-api' });
    
    res.json({
      success: true,
      count: piani.length,
      data: piani
    });
  } catch (err) {
    logger.error(`Errore nel recupero piani produzione: ${err.message}`, { service: 'produzione-api' });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei piani di produzione'
    });
  }
});

/**
 * @route   GET /api/produzione/piani/:id
 * @desc    Ottiene i dettagli di un piano di produzione
 * @access  Privato
 */
router.get('/piani/:id', async (req, res) => {
  try {
    const piano = await PianoProduzione.findById(req.params.id)
      .populate({
        path: 'produzioni.ricetta',
        select: 'nome categoria costo tempoPreparazione'
      });
    
    if (!piano) {
      return res.status(404).json({
        success: false,
        error: 'Piano di produzione non trovato'
      });
    }
    
    res.json({
      success: true,
      data: piano
    });
  } catch (err) {
    logger.error(`Errore nel recupero piano produzione: ${err.message}`, { service: 'produzione-api' });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del piano di produzione'
    });
  }
});

/**
 * @route   POST /api/produzione/piani
 * @desc    Crea un nuovo piano di produzione
 * @access  Privato
 */
router.post('/piani', async (req, res) => {
  try {
    const nuovoPiano = new PianoProduzione(req.body);
    await nuovoPiano.save();
    
    logger.info(`Piano di produzione creato per la data: ${nuovoPiano.data}`, { service: 'produzione-api' });
    
    res.status(201).json({
      success: true,
      data: nuovoPiano
    });
  } catch (err) {
    logger.error(`Errore nella creazione piano produzione: ${err.message}`, { service: 'produzione-api' });
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * @route   PUT /api/produzione/piani/:id
 * @desc    Aggiorna un piano di produzione esistente
 * @access  Privato
 */
router.put('/piani/:id', async (req, res) => {
  try {
    const piano = await PianoProduzione.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!piano) {
      return res.status(404).json({
        success: false,
        error: 'Piano di produzione non trovato'
      });
    }
    
    logger.info(`Piano di produzione aggiornato: ${piano._id}`, { service: 'produzione-api' });
    
    res.json({
      success: true,
      data: piano
    });
  } catch (err) {
    logger.error(`Errore nell'aggiornamento piano produzione: ${err.message}`, { service: 'produzione-api' });
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * @route   GET /api/produzione/risorse
 * @desc    Ottiene le risorse disponibili per una data
 * @access  Privato
 */
router.get('/risorse', async (req, res) => {
  try {
    const { data } = req.query;
    
    // In un sistema reale, qui recupereresti le risorse dal database
    // Per ora restituiamo dei dati di esempio
    const risorse = {
      data,
      personaleDisponibile: 2,
      macchinariDisponibili: ['forno', 'impastatrice'],
      tipoGiornata: 'normale'
    };
    
    res.json({
      success: true,
      data: risorse
    });
  } catch (err) {
    logger.error(`Errore nel recupero risorse: ${err.message}`, { service: 'produzione-api' });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle risorse'
    });
  }
});

/**
 * @route   POST /api/magazzino/verifica-scorte
 * @desc    Verifica se ci sono scorte sufficienti per una ricetta e quantità
 * @access  Privato
 */
router.post('/verifica-scorte', async (req, res) => {
  try {
    const { ricettaId, quantita } = req.body;
    
    // Ottieni la ricetta con ingredienti
    const ricetta = await Ricetta.findById(ricettaId)
      .populate('ingredienti.ingrediente');
    
    if (!ricetta) {
      return res.status(404).json({
        success: false,
        error: 'Ricetta non trovata'
      });
    }
    
    // Verifica ogni ingrediente
    const verifiche = await Promise.all(ricetta.ingredienti.map(async (ing) => {
      const ingrediente = ing.ingrediente;
      const quantitaNecessaria = ing.quantita * quantita;
      
      // Ottieni le scorte attuali dell'ingrediente
      // In un sistema reale, qui dovresti accedere al tuo sistema di inventario
      const movimento = await Movimento.find({ 
        ingrediente: ingrediente._id 
      })
      .sort({ data: -1 })
      .limit(1);
      
      const scorteAttuali = movimento.length > 0 ? movimento[0].giacenzaFinale : 0;
      
      return {
        ingrediente: ingrediente._id,
        nome: ingrediente.nome,
        categoria: ingrediente.categoria,
        unitaMisura: ingrediente.unitaMisura,
        quantitaNecessaria,
        scorteAttuali,
        sufficiente: scorteAttuali >= quantitaNecessaria
      };
    }));
    
    // Filtra gli ingredienti con scorte insufficienti
    const ingredientiMancanti = verifiche.filter(v => !v.sufficiente);
    
    res.json({
      success: true,
      tutteScorteOk: ingredientiMancanti.length === 0,
      ingredientiMancanti
    });
  } catch (err) {
    logger.error(`Errore nella verifica scorte: ${err.message}`, { service: 'produzione-api' });
    res.status(500).json({
      success: false,
      error: 'Errore nella verifica delle scorte'
    });
  }
});

export default router;