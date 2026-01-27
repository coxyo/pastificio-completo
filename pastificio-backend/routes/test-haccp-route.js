// routes/test-haccp-route.js
// FILE TEMPORANEO PER DEBUG - CANCELLARE DOPO!
import express from 'express';

const router = express.Router();

// ⚠️ ATTENZIONE: NO MIDDLEWARE protect - SOLO PER TEST!
router.post('/test-temperature', async (req, res) => {
  console.log('✅✅✅ TEST ROUTE RAGGIUNTA! ✅✅✅');
  console.log('📦 Body ricevuto:', JSON.stringify(req.body, null, 2));
  console.log('📋 Headers:', req.headers);
  
  res.json({ 
    success: true, 
    message: 'Route test funzionante! Il backend riceve correttamente.',
    bodyRicevuto: req.body
  });
});

export default router;