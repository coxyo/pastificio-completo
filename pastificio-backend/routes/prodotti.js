// routes/prodotti.js - VERSIONE CON AUTH DISABILITATA TEMPORANEAMENTE
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

    logger.info('Generazione listino PDF richiesta', options);

    const pdfDoc = await pdfListinoService.generaListinoPDF(options);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename="listino-prezzi-${new Date().toISOString().split('T')[0]}.pdf"`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();

    logger.info('Listino PDF inviato con successo');

  } catch (error) {
    logger.error('Errore generazione PDF listino:', error);
    res.status(500).json({
      success: false,
      message: 'Errore generazione PDF',
      error: error.message
    });
  }
});

router.get('/export/pdf/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    
    const pdfDoc = await pdfListinoService.generaListinoCategoriaPDF(categoria);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename="listino-${categoria.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf"`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();

    logger.info(`Listino PDF categoria ${categoria} inviato`);

  } catch (error) {
    logger.error('Errore generazione PDF categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Errore generazione PDF categoria',
      error: error.message
    });
  }
});

// ⚠️ AUTH TEMPORANEAMENTE DISABILITATA PER TEST
// router.use(protect);

// ✅ TUTTE LE ALTRE ROUTES (ora pubbliche temporaneamente)
router.get('/', prodottiController.getAll);
router.get('/statistiche', prodottiController.getStatistiche);
router.get('/:id', prodottiController.getById);
router.get('/:id/calcola-prezzo', prodottiController.calcolaPrezzo);
router.post('/', prodottiController.create);
router.put('/:id', prodottiController.update);
router.patch('/:id/disponibilita', prodottiController.updateDisponibilita);
router.patch('/:id/prezzo', prodottiController.updatePrezzo);
router.delete('/:id', prodottiController.delete);
router.delete('/:id/force', prodottiController.deleteForce);

export default router;