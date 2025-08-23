// routes/magazzino.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import magazzinoController from '../controllers/magazzinoController.js';
import inventarioController from '../controllers/inventarioController.js';

const router = express.Router();

// Middleware di autenticazione
router.use(protect);

// Routes movimenti
router.post('/movimenti', magazzinoController.createMovimento);
router.get('/movimenti', magazzinoController.getMovimenti);
router.get('/movimenti/:id', magazzinoController.getMovimentoById);
router.put('/movimenti/:id', magazzinoController.updateMovimento);
router.delete('/movimenti/:id', magazzinoController.deleteMovimento);

// Routes giacenze e valore
router.get('/giacenze', magazzinoController.getGiacenze);
router.get('/valore', magazzinoController.getValore);
router.get('/dashboard', magazzinoController.getDashboard);
router.get('/stats', magazzinoController.getStats);

// Routes inventario
router.get('/inventario', inventarioController.getInventario);
router.get('/inventario/scorte-minime', inventarioController.verificaScorteMinime);
router.post('/inventario/scorte', inventarioController.setScorte);
router.get('/prodotti-sotto-scorta', magazzinoController.getProdottiSottoScorta);

// Routes statistiche
router.get('/statistiche', magazzinoController.getStatistiche);

export default router;