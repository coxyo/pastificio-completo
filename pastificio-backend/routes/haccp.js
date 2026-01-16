// routes/haccp.js
import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Tutte le route protette da autenticazione
router.use(protect);

// ✅ NUOVO: Endpoint per dashboard HACCP
router.get('/dashboard', async (req, res) => {
  try {
    // Restituisci dati mock per dashboard
    res.json({
      success: true,
      data: {
        registrazioni: {
          totali: 0,
          conformi: 0,
          nonConformi: 0,
          daVerificare: 0
        },
        ultimiControlli: {
          frigoriferi: [],
          congelatori: [],
          abbattitori: []
        },
        statistiche: {
          totaleRegistrazioni: 0,
          conformi: 0,
          nonConformi: 0
        }
      }
    });
  } catch (error) {
    console.error('Errore caricamento dashboard:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore caricamento dashboard' 
    });
  }
});

// ✅ Endpoint per verificare se già registrato oggi
router.get('/check-registrazione', async (req, res) => {
  try {
    const { data } = req.query;
    
    res.json({ 
      success: true,
      giaRegistrato: false,
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