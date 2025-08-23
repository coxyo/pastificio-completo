// routes/ingredienti.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import * as ingredientiController from '../controllers/ingredientiController.js';

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(protect);

// Routes base
router.route('/')
  .get(ingredientiController.getIngredienti)
  .post(ingredientiController.createIngrediente);

// Routes speciali
router.get('/sotto-scorta', ingredientiController.getIngredientiSottoScorta);
router.get('/in-scadenza', ingredientiController.getIngredientiInScadenza);

// Routes per singolo ingrediente
router.route('/:id')
  .get(ingredientiController.getIngrediente)
  .put(ingredientiController.updateIngrediente)
  .delete(ingredientiController.deleteIngrediente);

// Gestione lotti
router.post('/:id/lotti', ingredientiController.aggiungiLotto);

export default router;