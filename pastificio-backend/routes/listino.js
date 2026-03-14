// routes/listino.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import { generaListinoPDF } from '../controllers/listinoController.js';

const router = express.Router();

/**
 * @route   GET /api/listino/pdf
 * @desc    Genera e scarica il listino prezzi PDF aggiornato dal database
 * @access  Privato
 */
router.get('/pdf', protect, generaListinoPDF);

export default router;