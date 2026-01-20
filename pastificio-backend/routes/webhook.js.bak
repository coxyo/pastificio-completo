// routes/webhook.js - v2.0 CON DEBOUNCE BACKEND
import express from 'express';
import cors from 'cors';
import Pusher from 'pusher';
import Cliente from '../models/Cliente.js';
import ChiamataStorico from '../models/ChiamataStorico.js';
import logger from '../config/logger.js';

const router = express.Router();

// ✅ CORS SPECIFICO PER WEBHOOK
const webhookCors = cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://pastificio-frontend-final.vercel.app',
    'https://pastificio-nonna-claudia.vercel.app'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
  credentials: true
});

router.use(webhookCors);

// ✅ ANTI-SPAM BACKEND: Cache chiamate recenti
const recentCalls = new Map(); // numero -> { timestamp, callId }
const DEBOUNCE_TIME = 3000; // 3 secondi

// ✅ Pulizia periodica cache (ogni minuto)
setInterval(() => {
  const now = Date.now();
  for (const [numero, data] of recentCalls.entries()) {
    if (now - data.timestamp > 60000) { // Rimuovi dopo 60 secondi
      recentCalls.delete(numero);
    }
  }
}, 60000);

// ===== INIZIALIZZA PUSHER =====
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true
});

/**
 * POST /api/webhook/chiamata-entrante
 * Riceve chiamate dalla extension 3CX + salva storico
 * ✅ CON DEBOUNCE BACKEND
 */
router.post('/chiamata-entrante', async (req, res) => {
  try {
    const { numero, timestamp, callId, source } = req.body;
    
    logger.info('📞 Webhook chiamata-entrante ricevuto', {
      numero,
      timestamp,
      callId,
      source: source || 'unknown'
    });
    
    // Validazione
    if (!numero) {
      return res.status(400).json({
        success: false,
        error: 'Numero mancante'
      });
    }
    
    // ✅ DEBOUNCE: Controlla se chiamata duplicata
    const now = Date.now();
    const numeroPulito = numero.replace(/[\s\-\(\)\+]/g, '');
    
    const lastCall = recentCalls.get(numeroPulito);
    if (lastCall && (now - lastCall.timestamp) < DEBOUNCE_TIME) {
      logger.warn('🚫 SPAM BLOCKED - Chiamata duplicata ignorata', {
        numero: numeroPulito,
        ultimaChiamata: new Date(lastCall.timestamp).toISOString(),
        tempoTrascorso: `${((now - lastCall.timestamp) / 1000).toFixed(1)}s`,
        soglia: `${DEBOUNCE_TIME / 1000}s`
      });
      
      return res.status(200).json({
        success: true,
        message: 'Chiamata duplicata ignorata (debounce)',
        duplicate: true,
        tempoTrascorso: now - lastCall.timestamp
      });
    }
    
    // ✅ Registra chiamata
    recentCalls.set(numeroPulito, {
      timestamp: now,
      callId: callId || `call_${now}`
    });
    
    logger.info('✅ Chiamata accettata (debounce OK)', {
      numero: numeroPulito,
      timestamp: new Date(now).toISOString()
    });
    
    // Normalizzazione numero
    const numeroNormalizzato = numeroPulito;
    
    logger.info('🔄 Normalizzazione numero', {
      originale: numero,
      pulito: numeroPulito,
      perDatabase: numeroNormalizzato
    });
    
    // ===== CERCA CLIENTE NEL DATABASE =====
    let clienteTrovato = null;
    
    try {
      clienteTrovato = await Cliente.findOne({
        $or: [
          { telefono: numeroNormalizzato },
          { cellulare: numeroNormalizzato },
          { telefono: { $regex: numeroNormalizzato.slice(-8), $options: 'i' } },
          { cellulare: { $regex: numeroNormalizzato.slice(-8), $options: 'i' } }
        ]
      });
      
      logger.info('🔍 Ricerca cliente completata', {
        numeroOriginale: numero,
        numeroNormalizzato: numeroNormalizzato,
        trovato: !!clienteTrovato,
        clienteId: clienteTrovato?._id
      });
      
    } catch (searchError) {
      logger.error('❌ Errore ricerca cliente:', searchError);
    }
    
    // ===== SALVA CHIAMATA IN STORICO =====
    let chiamataStorico;
    try {
      const chiamataData = {
        callId: callId || `call_${Date.now()}`,
        numero: numero,
        numeroNormalizzato: numeroNormalizzato,
        cliente: clienteTrovato?._id || null,
        dataOraChiamata: timestamp ? new Date(timestamp) : new Date(),
        stato: 'ricevuta',
        source: source || '3cx_extension'
      };
      
      chiamataStorico = new ChiamataStorico(chiamataData);
      await chiamataStorico.save();
      
      logger.info('✅ Chiamata salvata in storico', {
        chiamataId: chiamataStorico._id,
        clienteId: clienteTrovato?._id
      });
    } catch (storageError) {
      logger.error('⚠️ Errore salvataggio storico (continuo comunque)', storageError);
    }
    
    // ===== PREPARA DATI POPUP =====
    const popupData = {
      numero: numeroPulito,
      numeroOriginale: numero,
      timestamp: timestamp || new Date().toISOString(),
      callId: chiamataStorico?._id?.toString() || callId || 'unknown',
      source: source || '3cx_extension',
      cliente: clienteTrovato ? {
        _id: clienteTrovato._id,
        codiceCliente: clienteTrovato.codiceCliente,
        nome: clienteTrovato.nome,
        cognome: clienteTrovato.cognome,
        ragioneSociale: clienteTrovato.ragioneSociale,
        telefono: clienteTrovato.telefono,
        cellulare: clienteTrovato.cellulare,
        email: clienteTrovato.email,
        livelloFedelta: clienteTrovato.livelloFedelta,
        punti: clienteTrovato.punti,
        totaleSpesoStorico: clienteTrovato.totaleSpesoStorico
      } : null
    };
    
    // ===== INVIA EVENTO PUSHER =====
    try {
      await pusher.trigger('chiamate', 'nuova-chiamata', popupData);
      
      logger.info('✅ Evento Pusher inviato', {
        canale: 'chiamate',
        evento: 'nuova-chiamata',
        cliente: clienteTrovato?.nome || 'Sconosciuto',
        numeroNormalizzato: numeroNormalizzato
      });
      
    } catch (pusherError) {
      logger.error('❌ Errore invio Pusher:', pusherError);
      return res.status(500).json({
        success: false,
        error: 'Errore invio notifica Pusher',
        details: pusherError.message
      });
    }
    
    // ===== RISPOSTA SUCCESSO =====
    res.json({
      success: true,
      message: 'Evento Pusher inviato',
      callId: callId,
      chiamataId: chiamataStorico?._id,
      numeroOriginale: numero,
      numeroNormalizzato: numeroNormalizzato,
      clienteTrovato: !!clienteTrovato,
      cliente: clienteTrovato ? {
        nome: clienteTrovato.nome,
        cognome: clienteTrovato.cognome,
        telefono: clienteTrovato.telefono
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('❌ Errore webhook chiamata-entrante:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/webhook/health
 * Health check per webhook
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'webhook-chiamate',
    debounce: {
      enabled: true,
      time: `${DEBOUNCE_TIME / 1000}s`,
      activeCalls: recentCalls.size
    },
    pusher: {
      configured: !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET),
      cluster: process.env.PUSHER_CLUSTER || 'eu'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/webhook/test
 * Endpoint per testare il webhook senza 3CX
 */
router.post('/test', async (req, res) => {
  try {
    const numeroTest = req.body.numero || '+393408208314';
    
    logger.info('🧪 TEST: Simulazione chiamata in arrivo', { numero: numeroTest });

    // Cerca cliente
    const numeroNormalizzato = numeroTest.replace(/[\s\-\(\)\+]/g, '');
    const cliente = await Cliente.findOne({
      $or: [
        { telefono: numeroNormalizzato },
        { cellulare: numeroNormalizzato },
        { telefono: { $regex: numeroNormalizzato.slice(-8), $options: 'i' } },
        { cellulare: { $regex: numeroNormalizzato.slice(-8), $options: 'i' } }
      ]
    });
    
    // Crea chiamata test
    const chiamataTest = new ChiamataStorico({
      callId: `test_${Date.now()}`,
      numero: numeroTest,
      numeroNormalizzato: numeroNormalizzato,
      cliente: cliente?._id || null,
      dataOraChiamata: new Date(),
      stato: 'ricevuta',
      source: 'test-manual'
    });
    
    await chiamataTest.save();

    const testData = {
      numero: numeroTest,
      numeroOriginale: numeroTest,
      timestamp: new Date().toISOString(),
      callId: chiamataTest._id.toString(),
      source: 'test-manual',
      cliente: cliente ? {
        _id: cliente._id,
        codiceCliente: cliente.codiceCliente,
        nome: cliente.nome,
        cognome: cliente.cognome,
        telefono: cliente.telefono,
        email: cliente.email,
        livelloFedelta: cliente.livelloFedelta,
        punti: cliente.punti
      } : null
    };
    
    // Invia evento Pusher
    await pusher.trigger('chiamate', 'nuova-chiamata', testData);
    
    logger.info('✅ Test webhook inviato', testData);
    
    res.json({
      success: true,
      message: 'Evento test inviato',
      data: testData,
      chiamataId: chiamataTest._id
    });
    
  } catch (error) {
    logger.error('❌ Errore test webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/webhook/history
 * Ottiene storico chiamate
 */
router.get('/history', async (req, res) => {
  try {
    const { clienteId, numero, limit = 20, offset = 0 } = req.query;
    
    const query = {};
    
    if (clienteId) {
      query.cliente = clienteId;
    }
    
    if (numero) {
      const numeroClean = numero.replace(/[\s\-\(\)\+]/g, '');
      query.numeroNormalizzato = numeroClean;
    }
    
    const chiamate = await ChiamataStorico.find(query)
      .populate('cliente', 'nome cognome telefono email livelloFedelta')
      .populate('ordineCollegato', 'totale stato dataRitiro')
      .sort({ dataOraChiamata: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();
    
    const totale = await ChiamataStorico.countDocuments(query);
    
    res.json({
      success: true,
      data: chiamate,
      pagination: {
        totale,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totale > (parseInt(offset) + parseInt(limit))
      }
    });
    
  } catch (error) {
    logger.error('❌ Errore recupero storico chiamate', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/webhook/clear-cache
 * Svuota cache anti-spam (solo per debug)
 */
router.delete('/clear-cache', (req, res) => {
  const size = recentCalls.size;
  recentCalls.clear();
  
  logger.info('🗑️ Cache anti-spam svuotata', { chiamateRimosse: size });
  
  res.json({
    success: true,
    message: 'Cache svuotata',
    chiamateRimosse: size
  });
});

export default router;