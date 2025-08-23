// routes/fatture.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  creaFattura,
  creaFatturaDaOrdine,
  getFatture,
  getFattura,
  aggiornafattura,
  registraPagamento,
  annullaFattura,
  getStatistiche,
  generaPdf,
  eliminafattura
} from '../controllers/fatturaController.js';
import logger from '../config/logger.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

// Log delle richieste
router.use((req, res, next) => {
  logger.debug(`Richiesta ${req.method} su ${req.originalUrl}`, {
    userId: req.user?.id,
    ip: req.ip
  });
  next();
});

/**
 * @route   POST /api/fatture
 * @desc    Crea una nuova fattura
 * @access  Private
 */
router.post('/', creaFattura);

/**
 * @route   POST /api/fatture/da-ordine/:id
 * @desc    Crea una fattura da un ordine esistente
 * @access  Private
 */
router.post('/da-ordine/:id', creaFatturaDaOrdine);

/**
 * @route   GET /api/fatture
 * @desc    Ottiene tutte le fatture con paginazione e filtri
 * @access  Private
 */
router.get('/', getFatture);

/**
 * @route   GET /api/fatture/statistiche
 * @desc    Ottiene statistiche di fatturazione
 * @access  Private
 */
router.get('/statistiche', getStatistiche);

/**
 * @route   GET /api/fatture/:id
 * @desc    Ottiene una fattura specifica
 * @access  Private
 */
router.get('/:id', getFattura);

/**
 * @route   PUT /api/fatture/:id
 * @desc    Aggiorna una fattura
 * @access  Private
 */
router.put('/:id', aggiornafattura);

/**
 * @route   POST /api/fatture/:id/pagamenti
 * @desc    Registra un pagamento per una fattura
 * @access  Private
 */
router.post('/:id/pagamenti', registraPagamento);

/**
 * @route   PUT /api/fatture/:id/annulla
 * @desc    Annulla una fattura
 * @access  Private/Admin
 */
router.put('/:id/annulla', authorize('admin'), annullaFattura);

/**
 * @route   GET /api/fatture/:id/pdf
 * @desc    Genera PDF di una fattura
 * @access  Private
 */
router.get('/:id/pdf', generaPdf);

/**
 * @route   DELETE /api/fatture/:id
 * @desc    Elimina una fattura (solo bozze o admin)
 * @access  Private
 */
router.delete('/:id', eliminafattura);

export default router;