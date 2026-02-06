// routes/importFatture.js
// Route per l'import delle fatture XML da Danea EasyFatt

import express from 'express';
import { protect } from '../middleware/auth.js';
import importFattureController from '../controllers/importFattureController.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

/**
 * @route   POST /api/import-fatture/upload
 * @desc    Upload e parsing fatture XML
 * @access  Privato
 * @body    files.fatture - File XML (singolo o multiplo)
 */
router.post('/upload', importFattureController.uploadFatture);

/**
 * @route   POST /api/import-fatture/conferma
 * @desc    Conferma import fattura con mapping prodotti
 * @access  Privato
 * @body    { fattura, righe, fileInfo }
 */
router.post('/conferma', importFattureController.confermaImport);

/**
 * @route   GET /api/import-fatture
 * @desc    Lista fatture importate
 * @access  Privato
 * @query   page, limit, stato, fornitore, dataInizio, dataFine
 */
router.get('/', importFattureController.listaImportazioni);

/**
 * @route   GET /api/import-fatture/statistiche
 * @desc    Statistiche importazioni
 * @access  Privato
 */
router.get('/statistiche', importFattureController.statisticheImportazioni);

/**
 * @route   GET /api/import-fatture/mapping
 * @desc    Lista mapping prodotti fornitore
 * @access  Privato
 * @query   fornitore, page, limit
 */
router.get('/mapping', importFattureController.listaMapping);

/**
 * @route   GET /api/import-fatture/:id
 * @desc    Dettaglio singola importazione
 * @access  Privato
 */
router.get('/:id', importFattureController.dettaglioImportazione);

/**
 * @route   DELETE /api/import-fatture/:id
 * @desc    Annulla importazione (elimina movimenti collegati)
 * @access  Privato
 * @body    { motivo }
 */
router.delete('/:id', importFattureController.annullaImportazione);

/**
 * @route   PUT /api/import-fatture/mapping/:id
 * @desc    Modifica mapping prodotto
 * @access  Privato
 * @body    { ingredienteId }
 */
router.put('/mapping/:id', importFattureController.modificaMapping);

/**
 * @route   DELETE /api/import-fatture/mapping/:id
 * @desc    Elimina mapping prodotto
 * @access  Privato
 */
router.delete('/mapping/:id', importFattureController.eliminaMapping);

export default router;