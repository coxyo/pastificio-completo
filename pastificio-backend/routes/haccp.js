// routes/haccp.js
// ✅ VERSIONE COMPLETA CON TUTTE LE ROUTE HACCP
import express from 'express';
import { protect } from '../middleware/auth.js';
import haccpController from '../controllers/haccpController.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

// ============================================
// DASHBOARD
// ============================================

/**
 * @route   GET /api/haccp/dashboard
 * @desc    Dashboard HACCP con statistiche e riepilogo
 * @access  Privato
 */
router.get('/dashboard', haccpController.getDashboardHACCP);

/**
 * @route   GET /api/haccp/registrazioni
 * @desc    Ottiene tutte le registrazioni HACCP
 * @access  Privato
 */
router.get('/registrazioni', haccpController.getRegistrazioni);

// ============================================
// TEMPERATURE (CCP1, CCP2, CCP5)
// ============================================

/**
 * @route   POST /api/haccp/temperatura
 * @desc    Registra nuova temperatura (frigo/congelatore)
 * @access  Privato
 */
router.post('/temperatura', haccpController.registraTemperatura);

/**
 * @route   GET /api/haccp/temperature/:dispositivo
 * @desc    Storico temperature per dispositivo
 * @access  Privato
 */
router.get('/temperature/:dispositivo', haccpController.getStoricoTemperature);

// ============================================
// CONTROLLO IGIENICO / PULIZIA
// ============================================

/**
 * @route   POST /api/haccp/controllo-igienico
 * @desc    Registra controllo pulizia e sanificazione
 * @access  Privato
 */
router.post('/controllo-igienico', haccpController.registraControlloIgienico);

/**
 * @route   POST /api/haccp/sanificazione
 * @desc    Registra sanificazione dettagliata
 * @access  Privato
 */
router.post('/sanificazione', haccpController.registraSanificazione);

// ============================================
// ABBATTIMENTO (CCP4)
// ============================================

/**
 * @route   POST /api/haccp/abbattimento
 * @desc    Registra ciclo abbattimento temperatura
 * @access  Privato
 */
router.post('/abbattimento', haccpController.registraAbbattimento);

// ============================================
// MATERIE PRIME (CCP1)
// ============================================

/**
 * @route   POST /api/haccp/materie-prime
 * @desc    Registra controllo materie prime in arrivo
 * @access  Privato
 */
router.post('/materie-prime', haccpController.registraMateriePrime);

// ============================================
// SCADENZE PRODOTTI
// ============================================

/**
 * @route   POST /api/haccp/scadenza-prodotto
 * @desc    Registra controllo scadenza prodotto
 * @access  Privato
 */
router.post('/scadenza-prodotto', haccpController.registraScadenzaProdotto);

// ============================================
// NON CONFORMITÀ
// ============================================

/**
 * @route   POST /api/haccp/non-conformita
 * @desc    Registra non conformità e azione correttiva
 * @access  Privato
 */
router.post('/non-conformita', haccpController.registraNonConformita);

export default router;