// routes/danea.js - API DANEA MONITOR
import express from 'express';
import { protect } from '../middleware/auth.js';
import daneaMonitor from '../services/daneaMonitor.js';

const router = express.Router();

/**
 * @route   GET /api/danea/status
 * @desc    Stato monitor Danea
 * @access  Privato
 */
router.get('/status', protect, (req, res) => {
  try {
    const stats = daneaMonitor.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/danea/start
 * @desc    Avvia monitor
 * @access  Privato
 */
router.post('/start', protect, (req, res) => {
  try {
    daneaMonitor.start();
    res.json({
      success: true,
      message: 'Monitor avviato'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/danea/stop
 * @desc    Ferma monitor
 * @access  Privato
 */
router.post('/stop', protect, (req, res) => {
  try {
    daneaMonitor.stop();
    res.json({
      success: true,
      message: 'Monitor fermato'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/danea/prodotti-sconosciuti
 * @desc    Lista prodotti non riconosciuti
 * @access  Privato
 */
router.get('/prodotti-sconosciuti', protect, async (req, res) => {
  try {
    const ProdottoSconosciuto = mongoose.model('ProdottoSconosciuto');
    const prodotti = await ProdottoSconosciuto.find({ stato: 'pending' })
      .sort({ dataRilevamento: -1 })
      .limit(50);

    res.json({
      success: true,
      data: prodotti
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
