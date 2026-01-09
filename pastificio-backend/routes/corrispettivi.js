// routes/corrispettivi.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import corrispettiviController from '../controllers/corrispettiviController.js';
import logger from '../config/logger.js';

const router = express.Router();

// PASSWORD DEDICATA CORRISPETTIVI
const PASSWORD_CORRISPETTIVI = 'corrispettivi2025';

/**
 * Middleware per verifica password corrispettivi
 */
const verificaPasswordCorrespettivi = (req, res, next) => {
  const passwordFornita = req.headers['x-corrispettivi-password'] || req.body.password;

  if (passwordFornita !== PASSWORD_CORRISPETTIVI) {
    logger.warn('⚠️ Tentativo accesso corrispettivi con password errata');
    return res.status(401).json({
      success: false,
      error: 'Password corrispettivi non valida'
    });
  }

  next();
};

// Tutte le route richiedono autenticazione base + password corrispettivi
router.use(protect);
router.use(verificaPasswordCorrespettivi);

/**
 * @route   POST /api/corrispettivi/registra
 * @desc    Registra corrispettivo giornaliero
 * @access  Privato + Password
 */
router.post('/registra', corrispettiviController.registraCorrespettivo);

/**
 * @route   PUT /api/corrispettivi/:id
 * @desc    Modifica corrispettivo
 * @access  Privato + Password
 */
router.put('/:id', corrispettiviController.modificaCorrespettivo);

/**
 * @route   GET /api/corrispettivi/mese/:anno/:mese
 * @desc    Ottieni corrispettivi di un mese
 * @access  Privato + Password
 */
router.get('/mese/:anno/:mese', corrispettiviController.getCorrespettiviMese);

/**
 * @route   GET /api/corrispettivi/anno/:anno
 * @desc    Ottieni statistiche anno
 * @access  Privato + Password
 */
router.get('/anno/:anno', corrispettiviController.getStatisticheAnno);

/**
 * @route   POST /api/corrispettivi/chiusura-mensile/:anno/:mese
 * @desc    Genera e invia chiusura mensile
 * @access  Privato + Password
 */
router.post('/chiusura-mensile/:anno/:mese', corrispettiviController.chiusuraMensile);

/**
 * @route   POST /api/corrispettivi/import
 * @desc    Import dati storici
 * @access  Privato + Password
 */
router.post('/import', corrispettiviController.importDatiStorici);

export default router;