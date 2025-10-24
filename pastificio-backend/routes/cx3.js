// routes/cx3.js - AGGIORNATO CON SISTEMA CHIAMATE COMPLETO
import express from 'express';
import { protect } from '../middleware/auth.js';
import cx3Controller from '../controllers/cx3Controller.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * @route   POST /api/cx3/webhook
 * @desc    Webhook 3CX per eventi chiamate
 * @access  Public (ma con verifica IP/token se necessario)
 */
router.post('/webhook', cx3Controller.handleWebhook);

/**
 * @route   GET /api/cx3/history
 * @desc    Ottiene storico chiamate
 * @access  Privato
 */
router.get('/history', protect, cx3Controller.getHistory);

/**
 * @route   GET /api/cx3/stats
 * @desc    Ottiene statistiche chiamate
 * @access  Privato
 */
router.get('/stats', protect, cx3Controller.getStatistiche);

/**
 * @route   PUT /api/cx3/chiamate/:id
 * @desc    Aggiorna note/follow-up chiamata
 * @access  Privato
 */
router.put('/chiamate/:id', protect, cx3Controller.updateChiamata);

/**
 * @route   GET /api/cx3/chiamate/:id
 * @desc    Ottiene dettagli singola chiamata
 * @access  Privato
 */
router.get('/chiamate/:id', protect, async (req, res) => {
  try {
    const { default: Chiamata } = await import('../models/Chiamata.js');
    
    const chiamata = await Chiamata.findById(req.params.id)
      .populate('cliente', 'nome cognome telefono email codiceCliente')
      .populate('user', 'nome cognome username');

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        error: 'Chiamata non trovata'
      });
    }

    res.json({
      success: true,
      chiamata
    });

  } catch (error) {
    logger.error('[GET CHIAMATA] Errore:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/cx3/chiamate/:id
 * @desc    Elimina chiamata
 * @access  Privato (solo admin)
 */
router.delete('/chiamate/:id', protect, async (req, res) => {
  try {
    const { default: Chiamata } = await import('../models/Chiamata.js');
    
    const chiamata = await Chiamata.findById(req.params.id);

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        error: 'Chiamata non trovata'
      });
    }

    await chiamata.deleteOne();

    res.json({
      success: true,
      message: 'Chiamata eliminata'
    });

  } catch (error) {
    logger.error('[DELETE CHIAMATA] Errore:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cx3/chiamate/cliente/:clienteId
 * @desc    Ottiene chiamate per cliente specifico
 * @access  Privato
 */
router.get('/chiamate/cliente/:clienteId', protect, async (req, res) => {
  try {
    const { default: Chiamata } = await import('../models/Chiamata.js');
    const { clienteId } = req.params;
    const { limit = 10 } = req.query;

    const chiamate = await Chiamata.find({ cliente: clienteId })
      .sort({ dataOraInizio: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: chiamate.length,
      chiamate
    });

  } catch (error) {
    logger.error('[GET CHIAMATE CLIENTE] Errore:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cx3/chiamate/numero/:numero
 * @desc    Ottiene chiamate per numero telefono
 * @access  Privato
 */
router.get('/chiamate/numero/:numero', protect, async (req, res) => {
  try {
    const { default: Chiamata } = await import('../models/Chiamata.js');
    const { numero } = req.params;
    const { limit = 10 } = req.query;

    const chiamate = await Chiamata.findByNumero(numero, parseInt(limit));

    res.json({
      success: true,
      count: chiamate.length,
      chiamate
    });

  } catch (error) {
    logger.error('[GET CHIAMATE NUMERO] Errore:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/cx3/chiamate/:id/follow-up
 * @desc    Marca chiamata come follow-up completato
 * @access  Privato
 */
router.post('/chiamate/:id/follow-up', protect, async (req, res) => {
  try {
    const { default: Chiamata } = await import('../models/Chiamata.js');
    
    const chiamata = await Chiamata.findById(req.params.id);

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        error: 'Chiamata non trovata'
      });
    }

    chiamata.followUpCompletato = true;
    await chiamata.save();

    res.json({
      success: true,
      chiamata
    });

  } catch (error) {
    logger.error('[FOLLOW-UP] Errore:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;