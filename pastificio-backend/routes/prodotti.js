// routes/prodotti.js
import express from 'express';
import prodottiController from '../controllers/prodottiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ✅ ROUTES PUBBLICHE (senza autenticazione - per visualizzazione menu)
router.get('/disponibili', prodottiController.getDisponibili);
router.get('/categoria/:categoria', prodottiController.getByCategoria);

// ✅ TUTTE LE ALTRE ROUTES RICHIEDONO AUTENTICAZIONE
router.use(protect);

/**
 * @route   GET /api/prodotti
 * @desc    Ottiene tutti i prodotti (con filtri opzionali)
 * @query   categoria, disponibile, attivo
 * @access  Privato
 */
router.get('/', prodottiController.getAll);

/**
 * @route   GET /api/prodotti/statistiche
 * @desc    Ottiene statistiche sui prodotti
 * @access  Privato
 */
router.get('/statistiche', prodottiController.getStatistiche);

/**
 * @route   GET /api/prodotti/:id
 * @desc    Ottiene un singolo prodotto per ID
 * @access  Privato
 */
router.get('/:id', prodottiController.getById);

/**
 * @route   GET /api/prodotti/:id/calcola-prezzo
 * @desc    Calcola il prezzo per quantità e unità specificate
 * @query   quantita, unita, variante (opzionale)
 * @access  Privato
 */
router.get('/:id/calcola-prezzo', prodottiController.calcolaPrezzo);

/**
 * @route   POST /api/prodotti
 * @desc    Crea un nuovo prodotto
 * @access  Privato (Admin)
 */
router.post('/', prodottiController.create);

/**
 * @route   PUT /api/prodotti/:id
 * @desc    Aggiorna un prodotto esistente
 * @access  Privato (Admin)
 */
router.put('/:id', prodottiController.update);

/**
 * @route   PATCH /api/prodotti/:id/disponibilita
 * @desc    Aggiorna solo la disponibilità del prodotto
 * @body    { disponibile: boolean }
 * @access  Privato
 */
router.patch('/:id/disponibilita', prodottiController.updateDisponibilita);

/**
 * @route   PATCH /api/prodotti/:id/prezzo
 * @desc    Aggiorna solo il prezzo del prodotto
 * @body    { prezzoKg?: number, prezzoPezzo?: number }
 * @access  Privato (Admin)
 */
router.patch('/:id/prezzo', prodottiController.updatePrezzo);

/**
 * @route   DELETE /api/prodotti/:id
 * @desc    Disattiva un prodotto (soft delete)
 * @access  Privato (Admin)
 */
router.delete('/:id', prodottiController.delete);

/**
 * @route   DELETE /api/prodotti/:id/force
 * @desc    Elimina definitivamente un prodotto
 * @access  Privato (Admin)
 */
router.delete('/:id/force', prodottiController.deleteForce);

export default router;