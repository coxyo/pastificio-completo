// routes/api.js
import express from 'express';
import { check, validationResult } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { cacheRoute } from '../middleware/cache.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import logger from '../config/logger.js';

// Import controllers
import { getOrdini, createOrdine, getOrdine } from '../controllers/ordiniController.js';
import { getInventario } from '../controllers/magazzinoController.js';
import { getProdotti } from '../controllers/produzioneController.js';

const router = express.Router();

// Apply rate limiting to all routes
router.use(apiLimiter);

// Public API Key middleware
const verifyApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key non fornita'
    });
  }
  
  // In a real app, you would validate the API key against the database
  // This is a simple example
  if (apiKey !== process.env.PUBLIC_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'API key non valida'
    });
  }
  
  next();
};

// Public endpoints (requiring API key)
router.get('/prodotti', verifyApiKey, cacheRoute(60 * 15), async (req, res) => {
  try {
    // Get all active recipes/products
    const prodotti = await Ricetta.find({ attivo: true })
      .select('nome categoria descrizione costoStimato')
      .lean();
    
    res.status(200).json({
      success: true,
      count: prodotti.length,
      data: prodotti
    });
  } catch (error) {
    logger.error(`API error in /prodotti: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei prodotti'
    });
  }
});

// Create order via API
router.post('/ordini', [
  verifyApiKey,
  check('nomeCliente').notEmpty().withMessage('Nome cliente richiesto'),
  check('telefono').notEmpty().withMessage('Telefono richiesto'),
  check('prodotti').isArray().withMessage('Prodotti devono essere un array'),
  check('dataRitiro').isISO8601().withMessage('Data ritiro in formato non valido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    // Add source information
    req.body.fonte = 'api';
    
    // Create order
    const result = await createOrdine(req.body);
    
    res.status(201).json({
      success: true,
      data: {
        id: result._id,
        numero: result.numero,
        dataCreazione: result.createdAt
      }
    });
  } catch (error) {
    logger.error(`API error in POST /ordini: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get order status
router.get('/ordini/:numero', verifyApiKey, async (req, res) => {
  try {
    const ordine = await Ordine.findOne({ numero: req.params.numero })
      .select('numero nomeCliente telefono stato dataRitiro oraRitiro prodotti totale createdAt updatedAt')
      .lean();
    
    if (!ordine) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }
    
    res.status(200).json({
      success: true,
      data: ordine
    });
  } catch (error) {
    logger.error(`API error in GET /ordini/:numero: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dell\'ordine'
    });
  }
});

// Protected API routes (requiring both API key and authentication)
router.get('/inventario', [verifyApiKey, protect], async (req, res) => {
  try {
    const ingredienti = await Ingrediente.find()
      .select('nome categoria unitaMisura quantitaDisponibile quantitaMinima updatedAt')
      .sort('nome')
      .lean();
    
    res.status(200).json({
      success: true,
      count: ingredienti.length,
      data: ingredienti
    });
  } catch (error) {
    logger.error(`API error in /inventario: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dell\'inventario'
    });
  }
});

// Get daily production plan
router.get('/produzione/giornaliera', [verifyApiKey, protect], async (req, res) => {
  try {
    const { data } = req.query;
    let queryDate = new Date();
    
    if (data) {
      queryDate = new Date(data);
    }
    
    // Format the date as YYYY-MM-DD
    const formattedDate = queryDate.toISOString().split('T')[0];
    
    const pianoProduzione = await PianoProduzione.find({
      data: {
        $gte: new Date(`${formattedDate}T00:00:00.000Z`),
        $lte: new Date(`${formattedDate}T23:59:59.999Z`)
      }
    })
    .populate('produzioni.ricetta', 'nome categoria')
    .populate('produzioni.operatore', 'username')
    .lean();
    
    res.status(200).json({
      success: true,
      count: pianoProduzione.length,
      data: pianoProduzione
    });
  } catch (error) {
    logger.error(`API error in /produzione/giornaliera: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del piano di produzione'
    });
  }
});

export default router;