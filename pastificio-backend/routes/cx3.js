// routes/cx3.js - Route per integrazione 3CX
import express from 'express';
import Cliente from '../models/Cliente.js';
import pusherService from '../services/pusherService.js';
import logger from '../config/logger.js';

const router = express.Router();
const processedCalls = new Map(); // Cache chiamate processate

/**
 * @route   POST /api/cx3/incoming
 * @desc    Riceve chiamate in arrivo da 3CX extension
 * @access  Pubblico (ma dovrebbe essere protetto in produzione)
 */
router.post('/incoming', async (req, res) => {
  try {
    const { callId, numero, cliente, timestamp, source } = req.body;
    
    logger.info('📞 Chiamata in arrivo da CX3:', { callId, numero, source });
    
    // ✅ DEDUPLICAZIONE SERVER-SIDE
    if (processedCalls.has(numero)) {
      const lastProcessed = processedCalls.get(numero);
      const timeDiff = Date.now() - lastProcessed;
      
      // Se ultima chiamata < 3 minuti fa, SKIP
      if (timeDiff < 180000) {
        logger.info('⏭️ Chiamata duplicata, skip:', numero, `(${Math.round(timeDiff/1000)}s fa)`);
        return res.json({ 
          success: true, 
          message: 'Chiamata già processata',
          skipped: true,
          timeSinceLastCall: timeDiff
        });
      }
    }
    
    // Aggiungi a processate
    processedCalls.set(numero, Date.now());
    
    // Pulizia automatica dopo 5 minuti
    setTimeout(() => {
      processedCalls.delete(numero);
      logger.debug('🗑️ Rimossa chiamata da cache:', numero);
    }, 300000);
    
    // ✅ Cerca cliente in database
    let clienteTrovato = null;
    try {
      clienteTrovato = await Cliente.findOne({ 
        $or: [
          { telefono: numero },
          { cellulare: numero },
          { telefono: numero.replace(/\+39/, '') }, // Prova senza prefisso
          { cellulare: numero.replace(/\+39/, '') }
        ]
      }).select('nome cognome codice telefono cellulare email punti livelloFedelta');
      
      if (clienteTrovato) {
        logger.info('✅ Cliente trovato in database:', {
          codice: clienteTrovato.codice,
          nome: clienteTrovato.nome,
          cognome: clienteTrovato.cognome
        });
      } else {
        logger.info('ℹ️ Cliente non trovato in database per numero:', numero);
      }
    } catch (dbError) {
      logger.error('❌ Errore ricerca cliente:', dbError);
      // Continua comunque senza cliente
    }
    
    // Prepara dati evento
    const eventoChiamata = {
      callId,
      numero,
      timestamp: timestamp || new Date().toISOString(),
      cliente: clienteTrovato ? {
        _id: clienteTrovato._id,
        codice: clienteTrovato.codice,
        nome: clienteTrovato.nome,
        cognome: clienteTrovato.cognome,
        telefono: clienteTrovato.telefono,
        cellulare: clienteTrovato.cellulare,
        email: clienteTrovato.email,
        punti: clienteTrovato.punti,
        livelloFedelta: clienteTrovato.livelloFedelta
      } : (cliente || {
        nome: 'Cliente',
        cognome: 'Sconosciuto'
      }),
      tipo: 'inbound',
      stato: 'ringing',
      source: source || '3cx-extension'
    };
    
    // ✅ Invia evento Pusher UNA SOLA VOLTA
    try {
      const pusher = pusherService.getPusher();
      await pusher.trigger('chiamate', 'nuova-chiamata', eventoChiamata);
      logger.info('✅ Chiamata propagata via Pusher:', callId);
    } catch (pusherError) {
      logger.error('❌ Errore invio Pusher:', pusherError);
      // Non bloccare la risposta se Pusher fallisce
    }
    
    // Risposta di successo
    res.json({ 
      success: true, 
      message: 'Chiamata ricevuta e propagata',
      callId,
      numero,
      clienteTrovato: !!clienteTrovato,
      cliente: clienteTrovato ? {
        codice: clienteTrovato.codice,
        nome: clienteTrovato.nome,
        cognome: clienteTrovato.cognome
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('❌ Errore gestione chiamata CX3:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   GET /api/cx3/status
 * @desc    Verifica stato endpoint CX3
 * @access  Pubblico
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    service: '3CX Integration',
    status: 'online',
    timestamp: new Date().toISOString(),
    processedCallsCount: processedCalls.size,
    uptime: process.uptime()
  });
});

/**
 * @route   GET /api/cx3/cache
 * @desc    Visualizza cache chiamate (solo development)
 * @access  Pubblico (ma solo in development)
 */
router.get('/cache', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      error: 'Endpoint disponibile solo in development'
    });
  }
  
  const cacheData = Array.from(processedCalls.entries()).map(([numero, timestamp]) => ({
    numero,
    timestamp: new Date(timestamp).toISOString(),
    age: Math.round((Date.now() - timestamp) / 1000) + 's'
  }));
  
  res.json({
    success: true,
    count: processedCalls.size,
    calls: cacheData
  });
});

/**
 * @route   POST /api/cx3/cache/clear
 * @desc    Pulisce cache chiamate (solo development)
 * @access  Pubblico (ma solo in development)
 */
router.post('/cache/clear', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      error: 'Endpoint disponibile solo in development'
    });
  }
  
  const count = processedCalls.size;
  processedCalls.clear();
  
  logger.info('🧹 Cache chiamate pulita manualmente');
  
  res.json({
    success: true,
    message: 'Cache pulita',
    clearedCount: count
  });
});

// Pulizia automatica cache ogni 10 minuti
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [numero, timestamp] of processedCalls.entries()) {
    if (now - timestamp > 600000) { // 10 minuti
      processedCalls.delete(numero);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.info(`🧹 Pulizia automatica cache: ${cleanedCount} chiamate rimosse`);
  }
}, 600000);

export default router;