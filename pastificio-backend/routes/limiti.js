// routes/limiti.js - ✅ VERSIONE CORRETTA
import express from 'express';
import { protect } from '../middleware/auth.js';
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import logger from '../config/logger.js';

const router = express.Router();

// Tutte le route protette
router.use(protect);

/**
 * @route   GET /api/limiti
 * @desc    Ottieni tutti i limiti
 * @access  Privato
 */
router.get('/', async (req, res) => {
  try {
    const { data, attivo } = req.query;
    
    let query = {};
    
    if (data) {
      const inizioGiorno = new Date(data);
      inizioGiorno.setHours(0, 0, 0, 0);
      
      const fineGiorno = new Date(data);
      fineGiorno.setHours(23, 59, 59, 999);
      
      query.data = { $gte: inizioGiorno, $lte: fineGiorno };
    }
    
    if (attivo !== undefined) {
      query.attivo = attivo === 'true';
    }
    
    const limiti = await LimiteGiornaliero.find(query).sort({ data: 1, prodotto: 1 });
    
    res.json({
      success: true,
      count: limiti.length,
      data: limiti
    });
    
  } catch (error) {
    logger.error('Errore GET /limiti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero limiti',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/limiti
 * @desc    Crea nuovo limite
 * @access  Privato
 */
router.post('/', async (req, res) => {
  try {
    const limite = new LimiteGiornaliero(req.body);
    await limite.save();
    
    logger.info(`✅ Limite creato: ${limite.prodotto || limite.categoria} per ${limite.data.toLocaleDateString()}`);
    
    res.status(201).json({
      success: true,
      data: limite
    });
    
  } catch (error) {
    logger.error('Errore POST /limiti:', error);
    res.status(400).json({
      success: false,
      message: 'Errore creazione limite',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/limiti/:id
 * @desc    Aggiorna limite
 * @access  Privato
 */
router.put('/:id', async (req, res) => {
  try {
    const limite = await LimiteGiornaliero.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!limite) {
      return res.status(404).json({
        success: false,
        message: 'Limite non trovato'
      });
    }
    
    logger.info(`✅ Limite aggiornato: ${limite._id}`);
    
    res.json({
      success: true,
      data: limite
    });
    
  } catch (error) {
    logger.error('Errore PUT /limiti/:id:', error);
    res.status(400).json({
      success: false,
      message: 'Errore aggiornamento limite',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/limiti/:id
 * @desc    Elimina limite
 * @access  Privato
 */
router.delete('/:id', async (req, res) => {
  try {
    const limite = await LimiteGiornaliero.findByIdAndDelete(req.params.id);
    
    if (!limite) {
      return res.status(404).json({
        success: false,
        message: 'Limite non trovato'
      });
    }
    
    logger.info(`🗑️ Limite eliminato: ${limite._id}`);
    
    res.json({
      success: true,
      message: 'Limite eliminato'
    });
    
  } catch (error) {
    logger.error('Errore DELETE /limiti/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Errore eliminazione limite',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/limiti/verifica
 * @desc    Verifica se ordine supera limiti
 * @access  Privato
 */
router.post('/verifica', async (req, res) => {
  try {
    const { dataRitiro, prodotti } = req.body;
    
    if (!dataRitiro || !prodotti) {
      return res.status(400).json({
        success: false,
        message: 'dataRitiro e prodotti sono obbligatori'
      });
    }
    
    const risultato = await LimiteGiornaliero.verificaOrdine(dataRitiro, prodotti);
    
    res.json({
      success: true,
      ...risultato
    });
    
  } catch (error) {
    logger.error('Errore POST /limiti/verifica:', error);
    res.status(500).json({
      success: false,
      message: 'Errore verifica limiti',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/limiti/bulk
 * @desc    Crea limiti in massa (es: per festività)
 * @access  Privato
 */
router.post('/bulk', async (req, res) => {
  try {
    const { limiti } = req.body;
    
    if (!Array.isArray(limiti)) {
      return res.status(400).json({
        success: false,
        message: 'Formato non valido: limiti deve essere un array'
      });
    }
    
    // ✅ FIX: Nome variabile corretto senza spazio
    const limitiCreati = await LimiteGiornaliero.insertMany(limiti);
    
    logger.info(`✅ Creati ${limitiCreati.length} limiti in massa`);
    
    res.status(201).json({
      success: true,
      count: limitiCreati.length,
      data: limitiCreati
    });
    
  } catch (error) {
    logger.error('Errore POST /limiti/bulk:', error);
    res.status(400).json({
      success: false,
      message: 'Errore creazione limiti in massa',
      error: error.message
    });
  }
});

export default router;