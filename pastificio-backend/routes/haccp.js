// routes/haccp.js
// ✅ VERSIONE COMPLETA CON TUTTE LE ROUTE HACCP + AUTOMAZIONE TEMPERATURE
// Aggiornato: 16/01/2026

import express from 'express';
import { protect, optionalAuth } from '../middleware/auth.js';
import haccpController from '../controllers/haccpController.js';
import RegistrazioneHACCP from '../models/RegistrazioneHACCP.js';
import logger from '../config/logger.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

// ============================================
// DASHBOARD
// ============================================

/**
 * @route   GET /api/haccp/dashboard
 * @desc    Dashboard HACCP con statistiche e riepilogo
 * @access  Privato
 */
router.get('/dashboard', haccpController.getDashboardHACCP);

/**
 * @route   GET /api/haccp/registrazioni
 * @desc    Ottiene tutte le registrazioni HACCP
 * @access  Privato
 */
router.get('/registrazioni', haccpController.getRegistrazioni);

// ============================================
// TEMPERATURE (CCP1, CCP2, CCP5)
// ============================================

/**
 * @route   POST /api/haccp/temperatura
 * @desc    Registra nuova temperatura (frigo/congelatore/abbattitore)
 * @access  Privato
 * @note    Supporta flag 'automatico' per registrazioni automatiche settimanali
 */
router.post('/temperatura', async (req, res) => {
  try {
    const { dispositivo, temperatura, tipo, automatico, note } = req.body;

    if (!dispositivo || temperatura === undefined || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Dati mancanti: dispositivo, temperatura e tipo sono richiesti'
      });
    }

    // Determina conformità in base al tipo
    let conforme = true;
    let limiti = { min: null, max: null };

    // Normalizza il tipo per il confronto
    const tipoLower = tipo.toLowerCase();

    if (tipoLower.includes('frigorifero') || tipoLower.includes('frigo')) {
      limiti = { min: 0, max: 4 };
      conforme = temperatura >= 0 && temperatura <= 4;
    } else if (tipoLower.includes('congelatore')) {
      limiti = { min: -22, max: -18 };
      conforme = temperatura >= -22 && temperatura <= -18;
    } else if (tipoLower.includes('abbattitore')) {
      limiti = { min: -40, max: -30 };
      conforme = temperatura >= -40 && temperatura <= -30;
    }

    const nuovaRegistrazione = new RegistrazioneHACCP({
      tipo,
      dataOra: new Date(),
      valori: {
        temperatura,
        dispositivo,
        limiti,
        automatico: automatico || false
      },
      conforme,
      operatore: req.user?.nome || (automatico ? 'Sistema Automatico' : 'Operatore'),
      note: note || (automatico ? 'Registrazione automatica settimanale (Martedì)' : '')
    });

    await nuovaRegistrazione.save();

    logger.info(`🌡️ Temperatura registrata: ${dispositivo} = ${temperatura}°C (${conforme ? '✅ conforme' : '❌ NON conforme'})${automatico ? ' [AUTO]' : ''}`);

    res.status(201).json({
      success: true,
      message: 'Temperatura registrata',
      data: nuovaRegistrazione
    });

  } catch (error) {
    logger.error('Errore registrazione temperatura:', error);
    res.status(500).json({
      success: false,
      message: 'Errore registrazione temperatura'
    });
  }
});

/**
 * @route   GET /api/haccp/temperature/:dispositivo
 * @desc    Storico temperature per dispositivo
 * @access  Privato
 */
router.get('/temperature/:dispositivo', haccpController.getStoricoTemperature);

// ============================================
// ROUTE PER AUTOMAZIONE TEMPERATURE (NUOVO)
// ============================================

/**
 * @route   GET /api/haccp/check-registrazione
 * @desc    Verifica se esistono già registrazioni temperature per una data specifica
 * @access  Privato
 */
router.get('/check-registrazione', async (req, res) => {
  try {
    const { data } = req.query;
    
    if (!data) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parametro data richiesto' 
      });
    }

    // Cerca registrazioni per la data specificata
    const inizioGiorno = new Date(data);
    inizioGiorno.setHours(0, 0, 0, 0);
    
    const fineGiorno = new Date(data);
    fineGiorno.setHours(23, 59, 59, 999);

    const registrazioni = await RegistrazioneHACCP.find({
      dataOra: {
        $gte: inizioGiorno,
        $lte: fineGiorno
      },
      tipo: { $regex: /temperatura/i }
    });

    // Se ci sono almeno 3 registrazioni di temperatura, consideriamo già registrato
    const giaRegistrato = registrazioni.length >= 3;

    logger.info(`🔍 Check registrazione HACCP per ${data}: ${registrazioni.length} trovate, giaRegistrato=${giaRegistrato}`);

    res.json({
      success: true,
      giaRegistrato,
      registrazioniTrovate: registrazioni.length,
      data
    });

  } catch (error) {
    logger.error('Errore verifica registrazione HACCP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore verifica registrazione' 
    });
  }
});

/**
 * @route   POST /api/haccp/segna-registrazione
 * @desc    Segna che la registrazione automatica è stata completata (per tracking)
 * @access  Privato
 */
router.post('/segna-registrazione', async (req, res) => {
  try {
    const { data } = req.body;
    
    logger.info(`✅ Registrazione HACCP automatica completata per ${data} da ${req.user?.nome || 'Sistema'}`);
    
    res.json({
      success: true,
      message: 'Registrazione segnata',
      data
    });

  } catch (error) {
    logger.error('Errore segna registrazione:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore' 
    });
  }
});

/**
 * @route   GET /api/haccp/temperature-settimana
 * @desc    Ottiene le temperature dell'ultima settimana per report
 * @access  Privato
 */
router.get('/temperature-settimana', async (req, res) => {
  try {
    const unaSettimanaFa = new Date();
    unaSettimanaFa.setDate(unaSettimanaFa.getDate() - 7);

    const temperature = await RegistrazioneHACCP.find({
      tipo: { $regex: /temperatura/i },
      dataOra: { $gte: unaSettimanaFa }
    }).sort({ dataOra: -1 });

    // Raggruppa per giorno
    const perGiorno = {};
    temperature.forEach(t => {
      const giorno = t.dataOra.toISOString().split('T')[0];
      if (!perGiorno[giorno]) {
        perGiorno[giorno] = [];
      }
      perGiorno[giorno].push({
        dispositivo: t.valori?.dispositivo || 'N/D',
        temperatura: t.valori?.temperatura,
        conforme: t.conforme,
        automatico: t.valori?.automatico || false,
        ora: t.dataOra.toISOString().split('T')[1].substring(0, 5)
      });
    });

    res.json({
      success: true,
      data: {
        totale: temperature.length,
        giorniConRegistrazioni: Object.keys(perGiorno).length,
        perGiorno
      }
    });

  } catch (error) {
    logger.error('Errore caricamento temperature settimana:', error);
    res.status(500).json({
      success: false,
      message: 'Errore caricamento dati'
    });
  }
});

/**
 * @route   POST /api/haccp/temperatura-bulk
 * @desc    Registra multiple temperature in una volta (per automazione)
 * @access  Privato
 */
router.post('/temperatura-bulk', async (req, res) => {
  try {
    const { temperature, automatico } = req.body;

    if (!temperature || !Array.isArray(temperature) || temperature.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array temperature richiesto'
      });
    }

    const registrazioni = [];

    for (const temp of temperature) {
      const { dispositivo, temperatura, tipo } = temp;

      // Determina conformità
      let conforme = true;
      let limiti = { min: null, max: null };
      const tipoLower = (tipo || '').toLowerCase();

      if (tipoLower.includes('frigorifero') || tipoLower.includes('frigo')) {
        limiti = { min: 0, max: 4 };
        conforme = temperatura >= 0 && temperatura <= 4;
      } else if (tipoLower.includes('congelatore')) {
        limiti = { min: -22, max: -18 };
        conforme = temperatura >= -22 && temperatura <= -18;
      } else if (tipoLower.includes('abbattitore')) {
        limiti = { min: -40, max: -30 };
        conforme = temperatura >= -40 && temperatura <= -30;
      }

      const nuovaRegistrazione = new RegistrazioneHACCP({
        tipo: tipo || 'temperatura_generico',
        dataOra: new Date(),
        valori: {
          temperatura,
          dispositivo,
          limiti,
          automatico: automatico || false
        },
        conforme,
        operatore: req.user?.nome || 'Sistema Automatico',
        note: automatico ? 'Registrazione automatica settimanale (Martedì)' : ''
      });

      await nuovaRegistrazione.save();
      registrazioni.push(nuovaRegistrazione);
    }

    logger.info(`🌡️ Bulk temperature registrate: ${registrazioni.length} dispositivi${automatico ? ' [AUTO]' : ''}`);

    res.status(201).json({
      success: true,
      message: `${registrazioni.length} temperature registrate`,
      data: registrazioni
    });

  } catch (error) {
    logger.error('Errore registrazione temperature bulk:', error);
    res.status(500).json({
      success: false,
      message: 'Errore registrazione temperature'
    });
  }
});

// ============================================
// CONTROLLO IGIENICO / PULIZIA
// ============================================

/**
 * @route   POST /api/haccp/controllo-igienico
 * @desc    Registra controllo pulizia e sanificazione
 * @access  Privato
 */
router.post('/controllo-igienico', haccpController.registraControlloIgienico);

/**
 * @route   POST /api/haccp/sanificazione
 * @desc    Registra sanificazione dettagliata
 * @access  Privato
 */
router.post('/sanificazione', haccpController.registraSanificazione);

// ============================================
// ABBATTIMENTO (CCP4)
// ============================================

/**
 * @route   POST /api/haccp/abbattimento
 * @desc    Registra ciclo abbattimento temperatura
 * @access  Privato
 */
router.post('/abbattimento', haccpController.registraAbbattimento);

// ============================================
// MATERIE PRIME (CCP1)
// ============================================

/**
 * @route   POST /api/haccp/materie-prime
 * @desc    Registra controllo materie prime in arrivo
 * @access  Privato
 */
router.post('/materie-prime', haccpController.registraMateriePrime);

// ============================================
// SCADENZE PRODOTTI
// ============================================

/**
 * @route   POST /api/haccp/scadenza-prodotto
 * @desc    Registra controllo scadenza prodotto
 * @access  Privato
 */
router.post('/scadenza-prodotto', haccpController.registraScadenzaProdotto);

// ============================================
// NON CONFORMITÀ
// ============================================

/**
 * @route   POST /api/haccp/non-conformita
 * @desc    Registra non conformità e azione correttiva
 * @access  Privato
 */
router.post('/non-conformita', haccpController.registraNonConformita);

export default router;