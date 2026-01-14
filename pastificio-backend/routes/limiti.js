// routes/limiti.js - VERSIONE COMPLETA
import express from 'express';
import { protect } from '../middleware/auth.js';
import limitiController from '../controllers/limitiController.js';
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

/**
 * @route   GET /api/limiti
 * @desc    Ottieni tutti i limiti attivi
 * @access  Privato
 */
router.get('/', async (req, res) => {
  try {
    const { data } = req.query;
    
    // Se non specificata, usa oggi
    const dataRicerca = data ? new Date(data) : new Date();
    dataRicerca.setHours(0, 0, 0, 0);
    
    console.log(`[LIMITI] GET tutti i limiti per data: ${dataRicerca.toISOString()}`);
    
    const limiti = await LimiteGiornaliero.find({
      data: dataRicerca,
      attivo: true
    }).sort({ prodotto: 1, categoria: 1 });
    
    console.log(`[LIMITI] Trovati ${limiti.length} limiti`);
    
    res.json({
      success: true,
      count: limiti.length,
      data: limiti
    });
    
  } catch (error) {
    console.error('[LIMITI] Errore GET limiti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei limiti',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/limiti
 * @desc    Crea nuovo limite
 * @access  Privato
 */
router.post('/', async (req, res) => {
  try {
    const { data, prodotto, categoria, limiteQuantita, unitaMisura, sogliAllerta } = req.body;
    
    if (!data || !limiteQuantita) {
      return res.status(400).json({
        success: false,
        message: 'Data e limite quantità sono obbligatori'
      });
    }
    
    if (!prodotto && !categoria) {
      return res.status(400).json({
        success: false,
        message: 'Specificare prodotto o categoria'
      });
    }
    
    const dataLimite = new Date(data);
    dataLimite.setHours(0, 0, 0, 0);
    
    console.log(`[LIMITI] POST nuovo limite:`, { prodotto, categoria, limiteQuantita });
    
    const limite = await LimiteGiornaliero.create({
      data: dataLimite,
      prodotto,
      categoria,
      limiteQuantita,
      unitaMisura: unitaMisura || 'Kg',
      sogliAllerta: sogliAllerta || 80,
      quantitaOrdinata: 0,
      attivo: true
    });
    
    console.log(`[LIMITI] Limite creato:`, limite._id);
    
    res.status(201).json({
      success: true,
      data: limite
    });
    
  } catch (error) {
    console.error('[LIMITI] Errore POST limite:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Limite già esistente per questo prodotto/categoria e data'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione del limite',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/limiti/:id
 * @desc    Aggiorna limite esistente
 * @access  Privato
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limiteQuantita, sogliAllerta, attivo } = req.body;
    
    console.log(`[LIMITI] PUT limite ${id}`);
    
    const limite = await LimiteGiornaliero.findById(id);
    
    if (!limite) {
      return res.status(404).json({
        success: false,
        message: 'Limite non trovato'
      });
    }
    
    if (limiteQuantita !== undefined) limite.limiteQuantita = limiteQuantita;
    if (sogliAllerta !== undefined) limite.sogliAllerta = sogliAllerta;
    if (attivo !== undefined) limite.attivo = attivo;
    
    await limite.save();
    
    console.log(`[LIMITI] Limite aggiornato`);
    
    res.json({
      success: true,
      data: limite
    });
    
  } catch (error) {
    console.error('[LIMITI] Errore PUT limite:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento del limite',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/limiti/:id
 * @desc    Elimina limite
 * @access  Privato
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[LIMITI] DELETE limite ${id}`);
    
    const limite = await LimiteGiornaliero.findByIdAndDelete(id);
    
    if (!limite) {
      return res.status(404).json({
        success: false,
        message: 'Limite non trovato'
      });
    }
    
    console.log(`[LIMITI] Limite eliminato`);
    
    res.json({
      success: true,
      message: 'Limite eliminato'
    });
    
  } catch (error) {
    console.error('[LIMITI] Errore DELETE limite:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione del limite',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/limiti/prodotto/:nome
 * @desc    Ottieni o crea limite giornaliero per prodotto
 * @access  Privato
 */
router.get('/prodotto/:nome', limitiController.getLimiteProdotto);

/**
 * @route   GET /api/limiti/ordini-prodotto/:nome
 * @desc    Ottieni ordini del giorno con prodotto specifico
 * @access  Privato
 */
router.get('/ordini-prodotto/:nome', limitiController.getOrdiniProdotto);

/**
 * @route   POST /api/limiti/vendita-diretta
 * @desc    Registra vendita diretta (senza ordine)
 * @access  Privato
 */
router.post('/vendita-diretta', limitiController.registraVenditaDiretta);

/**
 * @route   POST /api/limiti/reset-prodotto
 * @desc    Reset disponibilità prodotto a 0
 * @access  Privato
 */
router.post('/reset-prodotto', limitiController.resetProdotto);

export default router;