// routes/chiamate.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import chiamateController from '../controllers/chiamateController.js';

const router = express.Router();

// ✅ NUOVO 10/12/2025: Endpoint PUBBLICO per estensione Chrome (PRIMA del middleware auth)
/**
 * @route   POST /api/chiamate/webhook
 * @desc    Registra chiamata da estensione Chrome (pubblico con API key)
 * @access  Pubblico (con X-API-KEY header)
 * @header  X-API-KEY: chiave segreta condivisa con estensione
 */
router.post('/webhook', chiamateController.webhookChiamata);

// Middleware di autenticazione per tutte le altre route
router.use(protect);

/**
 * @route   GET /api/chiamate/tags/all
 * @desc    Ottieni tutti i tag unici utilizzati
 * @access  Privato
 * @note    Questa route DEVE essere prima di /:id per evitare conflitti
 */
router.get('/tags/all', chiamateController.getAllTags);

/**
 * @route   GET /api/chiamate
 * @desc    Ottieni tutte le chiamate con filtri opzionali
 * @access  Privato
 * @query   ?dataInizio=YYYY-MM-DD&dataFine=YYYY-MM-DD&tag=tag1,tag2&esito=risposto&clienteId=xxx&numeroTelefono=xxx&limit=100&skip=0&sort=-dataChiamata
 */
router.get('/', chiamateController.getChiamate);

/**
 * @route   GET /api/chiamate/:id
 * @desc    Ottieni una singola chiamata per ID
 * @access  Privato
 */
router.get('/:id', chiamateController.getChiamataById);

/**
 * @route   POST /api/chiamate
 * @desc    Crea una nuova chiamata
 * @access  Privato
 * @body    { numeroTelefono, cliente, esito, note, tags, ordineGenerato }
 */
router.post('/', chiamateController.creaChiamata);

/**
 * @route   PUT /api/chiamate/:id
 * @desc    Aggiorna una chiamata esistente
 * @access  Privato
 * @body    { esito, note, tags, durataChiamata, ordineGenerato }
 */
router.put('/:id', chiamateController.aggiornaChiamata);

/**
 * @route   POST /api/chiamate/:id/tags
 * @desc    Aggiungi tag a una chiamata
 * @access  Privato
 * @body    { tags: ['tag1', 'tag2'] }
 */
router.post('/:id/tags', chiamateController.aggiungiTag);

/**
 * @route   DELETE /api/chiamate/:id/tags
 * @desc    Rimuovi tag da una chiamata
 * @access  Privato
 * @body    { tags: ['tag1', 'tag2'] }
 */
router.delete('/:id/tags', chiamateController.rimuoviTag);

/**
 * @route   DELETE /api/chiamate/:id
 * @desc    Elimina una chiamata
 * @access  Privato
 */
router.delete('/:id', chiamateController.eliminaChiamata);

export default router;
