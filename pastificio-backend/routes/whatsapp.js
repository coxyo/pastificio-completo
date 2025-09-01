const express = require('express');
const router = express.Router();
const twilioService = require('../services/twilioService');
const { protect } = require('../middleware/auth');

// Test invio messaggio
router.post('/send', protect, async (req, res) => {
  try {
    const { telefono, messaggio } = req.body;
    const result = await twilioService.inviaMessaggio(telefono, messaggio);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Conferma ordine
router.post('/conferma-ordine/:ordineId', protect, async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.ordineId);
    if (!ordine) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    const result = await twilioService.inviaConfermaOrdine(ordine);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;