// routes/corrispettivi.js
// ✅ ROUTES COMPLETE PER CORRISPETTIVI CON IMPORT BULK
import express from 'express';
import { protect } from '../middleware/auth.js';
import corrispettiviController from '../controllers/corrispettiviController.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

/**
 * @route   GET /api/corrispettivi
 * @desc    Ottiene corrispettivi per mese/anno
 * @query   anno, mese
 * @access  Privato
 */
router.get('/', corrispettiviController.getCorrispettivi);

/**
 * @route   POST /api/corrispettivi
 * @desc    Crea/aggiorna corrispettivo giornaliero
 * @access  Privato
 */
router.post('/', corrispettiviController.creaCorrispettivo);

/**
 * @route   DELETE /api/corrispettivi/:id
 * @desc    Elimina un corrispettivo
 * @access  Privato
 */
router.delete('/:id', corrispettiviController.eliminaCorrispettivo);

/**
 * @route   POST /api/corrispettivi/chiusura-mensile
 * @desc    Chiude il mese e genera report
 * @access  Privato
 */
router.post('/chiusura-mensile', corrispettiviController.chiusuraMensile);

/**
 * @route   GET /api/corrispettivi/report/:anno
 * @desc    Report annuale corrispettivi
 * @access  Privato
 */
router.get('/report/:anno', corrispettiviController.reportAnnuale);

/**
 * @route   GET /api/corrispettivi/statistiche
 * @desc    Statistiche corrispettivi
 * @access  Privato
 */
router.get('/statistiche', corrispettiviController.getStatistiche);

/**
 * @route   POST /api/corrispettivi/import-bulk
 * @desc    Import massivo dati storici
 * @access  Privato
 */
router.post('/import-bulk', corrispettiviController.importBulk);

export default router;