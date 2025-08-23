import express from 'express';
import { getStatistiche, getProdottiPiuVenduti } from '../controllers/statisticheController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getStatistiche);
router.get('/prodotti-piu-venduti', protect, getProdottiPiuVenduti);

export default router;