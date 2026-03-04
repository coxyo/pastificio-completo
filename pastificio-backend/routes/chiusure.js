// routes/chiusure.js
import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import chiusureController from '../controllers/chiusureController.js';

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(protect);

// ── Lettura (tutti gli utenti autenticati) ──────────────────────────────────

// GET /api/chiusure - Lista chiusure personalizzate + config
router.get('/', chiusureController.getChiusure);

// GET /api/chiusure/config - Configurazione festività attive
router.get('/config', chiusureController.getConfigChiusure);

// GET /api/chiusure/verifica?data=YYYY-MM-DD
router.get('/verifica', chiusureController.verificaChiusura);

// GET /api/chiusure/prossimo-disponibile?data=YYYY-MM-DD
router.get('/prossimo-disponibile', chiusureController.prossimoGiornoDisponibile);

// GET /api/chiusure/mese?anno=2026&mese=12 - Tutte le date chiuse in un mese
router.get('/mese', chiusureController.getChiusureMese);

// ── Scrittura (solo admin) ──────────────────────────────────────────────────

// POST /api/chiusure - Crea nuova chiusura
router.post('/', adminOnly, chiusureController.creaChiusura);

// PUT /api/chiusure/config - Aggiorna configurazione festività
router.put('/config', adminOnly, chiusureController.aggiornaConfigChiusure);

// PUT /api/chiusure/:id - Modifica chiusura esistente
router.put('/:id', adminOnly, chiusureController.aggiornaChiusura);

// DELETE /api/chiusure/:id - Elimina chiusura
router.delete('/:id', adminOnly, chiusureController.eliminaChiusura);

export default router;