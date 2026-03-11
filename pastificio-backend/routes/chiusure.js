// routes/chiusure.js
import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import chiusureController from '../controllers/chiusureController.js';

const router = express.Router();

// ── Route PUBBLICA per il bot WhatsApp (senza autenticazione) ─────────────

// GET /api/chiusure/bot?data=YYYY-MM-DD
// Ritorna se una data è giorno di chiusura (usato dal bot VPS)
router.get('/bot', chiusureController.verificaChiusura);

// Tutte le altre route richiedono autenticazione
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