// routes/prodotti.js - VERSIONE COMPLETA CON EXPORT PDF
import express from 'express';
import prodottiController from '../controllers/prodottiController.js';
import pdfListinoService from '../services/pdfListinoService.js';
import { protect } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// ✅ ROUTES PUBBLICHE (senza autenticazione - per visualizzazione menu)
router.get('/disponibili', prodottiController.getDisponibili);
router.get('/categoria/:categoria', prodottiController.getByCategoria);

// ✅ ROUTE EXPORT PDF LISTINO (protetta)
/**
 * @route   GET /api/prodotti/export/pdf
 * @desc    Genera e scarica PDF del listino prezzi
 * @query   disponibiliOnly, includiVarianti, includiDescrizioni, includiAllergeni
 * @access  Privato
 */
router.get('/export/pdf', protect, async (req, res) => {
  try {
    const options = {
      disponibiliOnly: req.query.disponibiliOnly !== 'false',
      includiVarianti: req.query.includiVarianti === 'true',
      includiDescrizioni: req.query.includiDescrizioni === 'true',
      includiAllergeni: req.query.includiAllergeni === 'true'
    };

    logger.info('Generazione listino PDF richiesta', options);

    const pdfDoc = await pdfListinoService.generaListinoPDF(options);

    // Headers per download PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename="listino-prezzi-${new Date().toISOString().split('T')[0]}.pdf"`
    );

    // Stream del PDF nella response
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

/**
 * @route   GET /api/prodotti/export/pdf/:categoria
 * @desc    Genera PDF listino per categoria specifica
 * @access  Privato
 */
router.get('/export/pdf/:categoria', protect, async (req, res) => {
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

// ✅ TUTTE LE ALTRE ROUTES RICHIEDONO AUTENTICAZIONE
router.use(protect);

/**
 * @route   GET /api/prodotti
 * @desc    Ottiene tutti i prodotti (con filtri opzionali)
 * @query   categoria, disponibile, attivo, search
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