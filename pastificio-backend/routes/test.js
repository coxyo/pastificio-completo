// In routes/test.js (crea il file)
import express from 'express';
import whatsappService from '../services/whatsappService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Test invio WhatsApp diretto
router.post('/whatsapp', protect, async (req, res) => {
  try {
    const { to, message } = req.body;
    
    const result = await whatsappService.sendMessage({
      to: to,
      message: message || 'Test dal Pastificio Nonna Claudia! 🍝'
    });
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;