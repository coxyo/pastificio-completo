// routes/fornitori.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import Fornitore from '../models/Fornitore.js';
import logger from '../config/logger.js';

const router = express.Router();

// GET tutti i fornitori
router.get('/', protect, async (req, res) => {
  try {
    const { attivo = true, categoria } = req.query;
    
    const filter = {};
    if (attivo !== undefined) filter.attivo = attivo === 'true';
    if (categoria) filter.categoriaForniture = categoria;

    const fornitori = await Fornitore.find(filter).sort({ ragioneSociale: 1 });
    
    res.json({ success: true, data: fornitori });
  } catch (error) {
    logger.error('Errore recupero fornitori:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET fornitore singolo
router.get('/:id', protect, async (req, res) => {
  try {
    const fornitore = await Fornitore.findById(req.params.id);
    
    if (!fornitore) {
      return res.status(404).json({ success: false, error: 'Fornitore non trovato' });
    }
    
    res.json({ success: true, data: fornitore });
  } catch (error) {
    logger.error('Errore recupero fornitore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST nuovo fornitore
router.post('/', protect, async (req, res) => {
  try {
    const fornitore = new Fornitore(req.body);
    await fornitore.save();
    
    logger.info(`Nuovo fornitore creato: ${fornitore.ragioneSociale}`);
    
    res.status(201).json({ success: true, data: fornitore });
  } catch (error) {
    logger.error('Errore creazione fornitore:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT aggiorna fornitore
router.put('/:id', protect, async (req, res) => {
  try {
    const fornitore = await Fornitore.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!fornitore) {
      return res.status(404).json({ success: false, error: 'Fornitore non trovato' });
    }
    
    logger.info(`Fornitore aggiornato: ${fornitore.ragioneSociale}`);
    
    res.json({ success: true, data: fornitore });
  } catch (error) {
    logger.error('Errore aggiornamento fornitore:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE elimina fornitore (soft delete)
router.delete('/:id', protect, async (req, res) => {
  try {
    const fornitore = await Fornitore.findByIdAndUpdate(
      req.params.id,
      { attivo: false },
      { new: true }
    );
    
    if (!fornitore) {
      return res.status(404).json({ success: false, error: 'Fornitore non trovato' });
    }
    
    logger.info(`Fornitore disattivato: ${fornitore.ragioneSociale}`);
    
    res.json({ success: true, message: 'Fornitore disattivato' });
  } catch (error) {
    logger.error('Errore eliminazione fornitore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;