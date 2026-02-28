// routes/alerts.js - Route API alert
import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import alertsController from '../controllers/alertsController.js';

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(protect);

/**
 * @route   GET /api/alerts
 * @desc    Lista alert con filtri (letto, tipo, priorita, giorni)
 * @access  Privato
 */
router.get('/', alertsController.getAlerts);

/**
 * @route   GET /api/alerts/count
 * @desc    Conteggio alert non letti (per badge campanella)
 * @access  Privato
 */
router.get('/count', alertsController.getCount);

/**
 * @route   GET /api/alerts/config
 * @desc    Ottiene configurazione alert
 * @access  Privato
 */
router.get('/config', alertsController.getConfig);

/**
 * @route   GET /api/alerts/status
 * @desc    Status sistema alert (cron jobs, conteggi)
 * @access  Privato
 */
router.get('/status', alertsController.getStatus);

/**
 * @route   PUT /api/alerts/read-all
 * @desc    Segna tutti gli alert come letti
 * @access  Privato
 */
router.put('/read-all', alertsController.segnaLettiTutti);

/**
 * @route   PUT /api/alerts/:id/read
 * @desc    Segna singolo alert come letto
 * @access  Privato
 */
router.put('/:id/read', alertsController.segnaLetto);

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Elimina singolo alert
 * @access  Privato
 */
router.delete('/:id', alertsController.eliminaAlert);

/**
 * @route   PUT /api/alerts/config
 * @desc    Aggiorna configurazione alert (solo admin)
 * @access  Admin
 */
router.put('/config', adminOnly, alertsController.updateConfig);

/**
 * @route   POST /api/alerts/check
 * @desc    Trigger manuale controlli (solo admin, per test)
 * @access  Admin
 */
router.post('/check', adminOnly, alertsController.triggerCheck);

export default router;