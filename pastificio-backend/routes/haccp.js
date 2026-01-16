// routes/haccp.js
import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Tutte le route protette da autenticazione
router.use(protect);

// ✅ Endpoint per verificare se già registrato oggi
router.get('/check-registrazione', async (req, res) => {
  try {
    const { data } = req.query;
    
    // Per ora restituisci sempre false (deve sempre mostrare)
    // In futuro puoi salvare su MongoDB
    
    res.json({ 
      success: true,
      giaRegistrato: false, // ✅ Sempre false = mostra sempre popup
      data: data
    });
    
  } catch (error) {
    console.error('Errore check registrazione:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore verifica registrazione' 
    });
  }
});

// ✅ Endpoint per salvare temperatura
router.post('/temperatura', async (req, res) => {
  try {
    const { dispositivo, temperatura, tipo, automatico, note } = req.body;
    
    console.log('📊 Temperatura ricevuta:', {
      dispositivo,
      temperatura,
      tipo,
      automatico,
      note,
      data: new Date().toISOString()
    });
    
    // TODO: Salvare su MongoDB (per ora solo log)
    
    res.json({
      success: true,
      message: 'Temperatura registrata con successo',
      data: {
        dispositivo,
        temperatura,
        tipo,
        automatico,
        note,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Errore salvataggio temperatura:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore salvataggio temperatura' 
    });
  }
});

// ✅ Endpoint per segnare registrazione completata
router.post('/segna-registrazione', async (req, res) => {
  try {
    const { data } = req.body;
    
    console.log('✅ Registrazione HACCP completata per data:', data);
    
    // TODO: Salvare su MongoDB
    
    res.json({
      success: true,
      message: 'Registrazione completata',
      data: data
    });
    
  } catch (error) {
    console.error('Errore segna registrazione:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore conferma registrazione' 
    });
  }
});

export default router;