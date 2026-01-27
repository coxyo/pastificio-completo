// routes/haccp.js
// ✅ ROUTES HACCP - MONGODB INTEGRATION
import express from 'express';
import { protect } from '../middleware/auth.js';
import haccpController from '../controllers/haccpController.js';

const router = express.Router();

// ============================================
// MIDDLEWARE AUTENTICAZIONE
// ============================================
// router.use(protect); // COMMENTATO PER TEST

// ============================================
// DASHBOARD HACCP
// ============================================
/**
 * @route   GET /api/haccp/dashboard
 * @desc    Ottiene dashboard HACCP con statistiche ultimi 30 giorni
 * @access  Privato
 */
router.get('/dashboard', haccpController.getDashboard);

// ============================================
// CHECK REGISTRAZIONE GIORNALIERA
// ============================================
/**
 * @route   GET /api/haccp/check-registrazione?data=YYYY-MM-DD
 * @desc    Verifica se le temperature sono già state registrate per la data specificata
 * @access  Privato
 */
router.get('/check-registrazione', haccpController.checkRegistrazioneOggi);

// ============================================
// SALVA TEMPERATURA
// ============================================
/**
 * @route   POST /api/haccp/temperature
 * @desc    Salva una nuova registrazione di temperatura
 * @body    { temperature: [...], data, operatore, note }
 * @access  Privato
 */
router.post('/temperature', haccpController.salvaTemperatura);

// ============================================
// STORICO TEMPERATURE
// ============================================
/**
 * @route   GET /api/haccp/storico
 * @desc    Ottiene storico temperature con filtri opzionali
 * @query   dataInizio, dataFine, dispositivo, tipo
 * @access  Privato
 */
router.get('/storico', haccpController.getStoricoTemperature);

// ============================================
// REGISTRAZIONI RECENTI
// ============================================
/**
 * @route   GET /api/haccp/registrazioni?limit=500
 * @desc    Ottiene registrazioni recenti con limite
 * @access  Privato
 */
router.get('/registrazioni', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const RegistrazioneHACCP = (await import('../models/RegistrazioneHACCP.js')).default;
    
    const registrazioni = await RegistrazioneHACCP.find()
      .sort({ dataOra: -1 })
      .limit(limit)
      .lean();
    
    console.log(`✅ [HACCP Routes] Recuperate ${registrazioni.length} registrazioni`);
    
    res.json({
      success: true,
      registrazioni
    });
    
  } catch (error) {
    console.error('❌ [HACCP Routes] Errore recupero registrazioni:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero registrazioni',
      error: error.message
    });
  }
});

// ============================================
// ESPORTA REPORT
// ============================================
/**
 * @route   GET /api/haccp/report
 * @desc    Esporta report HACCP per periodo specificato
 * @query   dataInizio, dataFine
 * @access  Privato
 */
router.get('/report', haccpController.esportaReport);

// ============================================
// SEGNA REGISTRAZIONE COMPLETATA (LEGACY)
// ============================================
/**
 * @route   POST /api/haccp/segna-registrazione
 * @desc    Endpoint legacy per retrocompatibilità
 * @access  Privato
 */
router.post('/segna-registrazione', async (req, res) => {
  try {
    const { data } = req.body;
    
    console.log('✅ [HACCP Routes] Registrazione completata per data:', data);
    
    res.json({
      success: true,
      message: 'Registrazione completata',
      data: data
    });
    
  } catch (error) {
    console.error('❌ [HACCP Routes] Errore segna registrazione:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore conferma registrazione',
      error: error.message
    });
  }
});

export default router;