// routes/prodotti.js - ✅ AGGIORNATO CON RICETTE E COSTI
import express from 'express';
import prodottiController from '../controllers/prodottiController.js';
import pdfListinoService from '../services/pdfListinoService.js';
import { protect } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// ✅ ROUTES PUBBLICHE (senza autenticazione)
router.get('/disponibili', prodottiController.getDisponibili);
router.get('/categoria/:categoria', prodottiController.getByCategoria);

// ✅ ROUTE EXPORT PDF LISTINO
router.get('/export/pdf', async (req, res) => {
  try {
    const options = {
      disponibiliOnly: req.query.disponibiliOnly !== 'false',
      includiVarianti: req.query.includiVarianti === 'true',
      includiDescrizioni: req.query.includiDescrizioni === 'true',
      includiAllergeni: req.query.includiAllergeni === 'true'
    };
    const pdfDoc = await pdfListinoService.generaListinoPDF(options);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="listino-prezzi-${new Date().toISOString().split('T')[0]}.pdf"`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    logger.error('Errore generazione PDF listino:', error);
    res.status(500).json({ success: false, message: 'Errore generazione PDF', error: error.message });
  }
});

router.get('/export/pdf/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    const pdfDoc = await pdfListinoService.generaListinoCategoriaPDF(categoria);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="listino-${categoria.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf"`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore', error: error.message });
  }
});

// ⚠️ AUTH TEMPORANEAMENTE DISABILITATA PER TEST
// router.use(protect);

// ✅ ROUTE CONFIGURAZIONE COSTI GLOBALE
router.get('/configurazione-costi', prodottiController.getConfigurazioneCosti);
router.put('/configurazione-costi', prodottiController.updateConfigurazioneCosti);

// ✅ ROUTE INGREDIENTI DISPONIBILI (per dropdown ricetta)
router.get('/ingredienti-disponibili', prodottiController.getIngredientiDisponibili);

// ✅ ROUTE TABELLA COMPARATIVA
router.get('/comparativa', prodottiController.getComparativa);

// ✅ TUTTE LE ALTRE ROUTES
router.get('/', prodottiController.getAll);
router.get('/statistiche', prodottiController.getStatistiche);
router.get('/:id', prodottiController.getById);
router.get('/:id/calcola-prezzo', prodottiController.calcolaPrezzo);

// ✅ NUOVE ROUTE RICETTA
router.get('/:id/ricetta', prodottiController.getRicetta);
router.put('/:id/ricetta', prodottiController.updateRicetta);
router.post('/:id/ricalcola-costi', prodottiController.ricalcolaCosti);

router.post('/', prodottiController.create);
router.put('/:id', prodottiController.update);
router.patch('/:id/disponibilita', prodottiController.updateDisponibilita);
router.patch('/:id/prezzo', prodottiController.updatePrezzo);
router.delete('/:id', prodottiController.delete);
router.delete('/:id/force', prodottiController.deleteForce);

export default router;