// routes/haccp.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import haccpController from '../controllers/haccpController.js';

const router = express.Router();

// Middleware autenticazione per tutte le route
router.use(protect);

/**
 * @route   POST /api/haccp/temperatura
 * @desc    Registra temperatura frigorifero/congelatore
 * @access  Privato
 */
router.post('/temperatura', haccpController.registraTemperatura);

/**
 * @route   POST /api/haccp/controllo-igienico
 * @desc    Registra controllo igienico
 * @access  Privato
 */
router.post('/controllo-igienico', haccpController.registraControlloIgienico);

/**
 * @route   POST /api/haccp/scadenza
 * @desc    Registra controllo scadenza prodotto
 * @access  Privato
 */
router.post('/scadenza', haccpController.registraScadenzaProdotto);

/**
 * @route   POST /api/haccp/sanificazione
 * @desc    Registra sanificazione
 * @access  Privato
 */
router.post('/sanificazione', haccpController.registraSanificazione);

/**
 * @route   GET /api/haccp/dashboard
 * @desc    Dashboard HACCP completa
 * @access  Privato
 */
router.get('/dashboard', haccpController.getDashboardHACCP);

/**
 * @route   GET /api/haccp/temperature/:dispositivo
 * @desc    Storico temperature per dispositivo
 * @access  Privato
 */
router.get('/temperature/:dispositivo', haccpController.getStoricoTemperature);

export default router;