// routes/pusher.js - Endpoint per triggerare eventi Pusher dall'estensione Chrome
// ✅ FIX CORS: Aggiunto header X-API-KEY agli allowed headers
import express from 'express';
import Pusher from 'pusher';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';

const router = express.Router();

// ✅ FIX CORS: Middleware per permettere X-API-KEY
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY, X-Extension-Version');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ✅ Inizializza Pusher con le credenziali
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true
});

// ✅ API Key per autenticazione estensione Chrome
const EXTENSION_API_KEY = process.env.EXTENSION_API_KEY || 'pastificio-chiamate-2025';

// ✅ Middleware per verificare API key (endpoint pubblico, no JWT)
const verificaApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== EXTENSION_API_KEY) {
    logger.warn('Tentativo di accesso a Pusher trigger con API key invalida', {
      ip: req.ip,
      apiKey: apiKey ? 'presente ma invalida' : 'assente'
    });
    return res.status(401).json({ 
      success: false, 
      message: 'API key non valida' 
    });
  }
  
  next();
};

/**
 * @route   POST /api/pusher/trigger
 * @desc    Triggera un evento Pusher (usato dall'estensione Chrome)
 * @access  Pubblico con API key
 */
router.post('/trigger', verificaApiKey, async (req, res) => {
  try {
    const { channel, event, data } = req.body;
    
    if (!channel || !event || !data) {
      return res.status(400).json({
        success: false,
        message: 'Parametri mancanti: channel, event, data sono obbligatori'
      });
    }
    
    logger.info(`📡 Pusher trigger richiesto: ${channel}/${event}`, {
      numero: data.numero,
      source: data.source,
      extensionVersion: req.headers['x-extension-version']
    });
    
    // ✅ Se è una chiamata, cerca il cliente associato
    let clienteInfo = null;
    if (event === 'nuova-chiamata' && data.numero) {
      try {
        // Normalizza numero per ricerca
        const numeroNorm = data.numero.replace(/\s+/g, '').replace(/[^\d+]/g, '');
        
        // Cerca cliente con diverse varianti del numero
        const varianti = [
          numeroNorm,
          numeroNorm.replace('+39', ''),
          '+39' + numeroNorm.replace('+39', ''),
          '0039' + numeroNorm.replace('+39', '').replace('0039', '')
        ];
        
        const cliente = await Cliente.findOne({
          $or: varianti.map(v => ({ telefono: { $regex: v.replace(/[+]/g, '\\+'), $options: 'i' } }))
        });
        
        if (cliente) {
          clienteInfo = {
            _id: cliente._id,
            nome: cliente.nome,
            cognome: cliente.cognome,
            codiceCliente: cliente.codiceCliente,
            telefono: cliente.telefono,
            email: cliente.email,
            livelloFedelta: cliente.livelloFedelta,
            tags: cliente.tags
          };
          
          logger.info(`✅ Cliente trovato per numero ${data.numero}:`, {
            nome: `${cliente.nome} ${cliente.cognome}`,
            codice: cliente.codiceCliente
          });
        } else {
          logger.info(`ℹ️ Nessun cliente trovato per numero ${data.numero}`);
        }
      } catch (clienteError) {
        logger.warn('Errore ricerca cliente:', clienteError.message);
      }
    }
    
    // ✅ Arricchisci i dati con info cliente
    const dataArricchiti = {
      ...data,
      cliente: clienteInfo,
      timestamp: data.timestamp || new Date().toISOString(),
      processedAt: new Date().toISOString()
    };
    
    // ✅ Triggera evento Pusher
    await pusher.trigger(channel, event, dataArricchiti);
    
    logger.info(`✅ Evento Pusher inviato: ${channel}/${event}`, {
      numero: data.numero,
      clienteTrovato: !!clienteInfo
    });
    
    res.json({
      success: true,
      message: 'Evento inviato con successo',
      channel,
      event,
      clienteTrovato: !!clienteInfo,
      clienteNome: clienteInfo ? `${clienteInfo.nome} ${clienteInfo.cognome}` : null
    });
    
  } catch (error) {
    logger.error('Errore trigger Pusher:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/pusher/status
 * @desc    Verifica stato connessione Pusher
 * @access  Pubblico
 */
router.get('/status', async (req, res) => {
  try {
    // Test connessione Pusher
    const testChannel = 'test-channel';
    const testEvent = 'test-event';
    
    await pusher.trigger(testChannel, testEvent, { test: true, timestamp: new Date() });
    
    res.json({
      success: true,
      status: 'connected',
      cluster: process.env.PUSHER_CLUSTER || 'eu',
      appId: process.env.PUSHER_APP_ID ? 'configured' : 'missing'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: error.message
    });
  }
});

export default router;
