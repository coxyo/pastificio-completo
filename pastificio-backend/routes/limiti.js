// routes/limiti.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import limitiController from '../controllers/limitiController.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

/**
 * @route   GET /api/limiti/prodotto/:nome
 * @desc    Ottieni o crea limite giornaliero per prodotto
 * @access  Privato
 */
router.get('/prodotto/:nome', limitiController.getLimiteProdotto);

/**
 * @route   GET /api/limiti/ordini-prodotto/:nome
 * @desc    Ottieni ordini del giorno con prodotto specifico
 * @access  Privato
 */
router.get('/ordini-prodotto/:nome', limitiController.getOrdiniProdotto);

/**
 * @route   POST /api/limiti/vendita-diretta
 * @desc    Registra vendita diretta (senza ordine)
 * @access  Privato
 */
router.post('/vendita-diretta', limitiController.registraVenditaDiretta);

/**
 * @route   POST /api/limiti/reset-prodotto
 * @desc    Reset disponibilità prodotto a 0
 * @access  Privato
 */
router.post('/reset-prodotto', limitiController.resetProdotto);

export default router;