// pastificio-backend/routes/cx3.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import cx3Controller from '../controllers/cx3Controller.js';
import logger from '../config/logger.js';

const router = express.Router();

// ✅ ROUTE PUBBLICHE (prima del middleware protect)

/**
 * @route   GET /api/cx3/health
 * @desc    Verifica connessione 3CX
 * @access  Pubblico
 */
router.get('/health', cx3Controller.healthCheck);

/**
 * @route   POST /api/cx3/webhook
 * @desc    Riceve eventi da 3CX (chiamata in arrivo, terminata, etc.)
 * @access  Pubblico (ma verificato con signature)
 */
router.post('/webhook', cx3Controller.handleWebhook);

/**
 * @route   POST /api/cx3/call
 * @desc    Inizia chiamata verso numero (click-to-call)
 * @access  Pubblico (NO AUTH - uso interno)
 * @body    { numero, clienteId?, clienteNome? }
 */
router.post('/call', cx3Controller.makeCall);

// ✅ MIDDLEWARE AUTENTICAZIONE per tutte le altre route
router.use(protect);

// 🔒 ROUTE PROTETTE (richiedono autenticazione)

/**
 * @route   GET /api/cx3/status
 * @desc    Ottiene stato corrente interno 3CX
 * @access  Privato
 */
router.get('/status', cx3Controller.getStatus);

/**
 * @route   GET /api/cx3/history
 * @desc    Storico chiamate
 * @access  Privato
 * @query   limit, startDate, endDate, clienteId
 */
router.get('/history', cx3Controller.getHistory);

/**
 * @route   POST /api/cx3/hangup/:callId
 * @desc    Termina chiamata attiva
 * @access  Privato
 */
router.post('/hangup/:callId', cx3Controller.hangup);

/**
 * @route   POST /api/cx3/hold/:callId
 * @desc    Metti in attesa chiamata
 * @access  Privato
 */
router.post('/hold/:callId', cx3Controller.hold);

/**
 * @route   POST /api/cx3/unhold/:callId
 * @desc    Riprendi chiamata in attesa
 * @access  Privato
 */
router.post('/unhold/:callId', cx3Controller.unhold);

/**
 * @route   POST /api/cx3/transfer/:callId
 * @desc    Trasferisci chiamata
 * @access  Privato
 * @body    { destination }
 */
router.post('/transfer/:callId', cx3Controller.transfer);

/**
 * @route   GET /api/cx3/chiamate/:id
 * @desc    Dettaglio chiamata singola
 * @access  Privato
 */
router.get('/chiamate/:id', cx3Controller.getChiamata);

/**
 * @route   PUT /api/cx3/chiamate/:id
 * @desc    Aggiorna note/esito chiamata
 * @access  Privato
 * @body    { note?, esito?, tags? }
 */
router.put('/chiamate/:id', cx3Controller.updateChiamata);

/**
 * @route   GET /api/cx3/stats
 * @desc    Statistiche chiamate
 * @access  Privato
 * @query   startDate, endDate, clienteId
 */
router.get('/stats', cx3Controller.getStatistiche);

export default router;