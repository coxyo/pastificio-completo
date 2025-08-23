// pastificio-backend/routes/reports.js
import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/email', protect, async (req, res) => {
  try {
    const { to, subject, data } = req.body;
    
    // Log per debug
    console.log('Report email richiesto:', { to, subject });
    
    // Qui puoi implementare l'invio email reale se vuoi
    // Per ora restituiamo successo
    
    res.json({ 
      success: true, 
      message: 'Report preparato con successo' 
    });
  } catch (error) {
    console.error('Errore report:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;