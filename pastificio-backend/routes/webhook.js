// routes/webhook.js - BACKEND
// Route per gestire chiamate entranti da 3CX Extension
// ✅ VERSIONE CORRETTA CON NORMALIZZAZIONE NUMERO

import express from 'express';
import Pusher from 'pusher';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';

const router = express.Router();

// ===== INIZIALIZZA PUSHER =====
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true
});

// ✅ FUNZIONE HELPER: NORMALIZZA NUMERO TELEFONO
function normalizzaNumero(numero) {
  if (!numero) return null;
  
  // Rimuovi tutti i caratteri tranne cifre e +
  let clean = numero.replace(/[^\d+]/g, '');
  
  // Se inizia con +39, prendi solo i primi 13 caratteri (formato IT standard)
  if (clean.startsWith('+39')) {
    clean = clean.substring(0, 13);
  }
  
  // Se inizia con 39 senza +, prendi primi 12 caratteri
  if (clean.startsWith('39') && !clean.startsWith('+')) {
    clean = clean.substring(0, 12);
  }
  
  // Rimuovi il + per uniformità database
  const senzaPrefisso = clean.replace(/^\+/, '');
  
  logger.info('🔄 Normalizzazione numero', {
    originale: numero,
    pulito: clean,
    perDatabase: senzaPrefisso
  });
  
  return senzaPrefisso;
}

/**
 * POST /api/webhook/chiamata-entrante
 * Riceve chiamate dalla extension 3CX
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
    
    // ✅ NORMALIZZA IL NUMERO PRIMA DELLA RICERCA
    const numeroNormalizzato = normalizzaNumero(numero);
    
    if (!numeroNormalizzato) {
      return res.status(400).json({
        success: false,
        error: 'Numero telefono non valido'
      });
    }
    
    // ===== CERCA CLIENTE NEL DATABASE =====
    let clienteTrovato = null;
    
    try {
      // Cerca con numero normalizzato (pattern matching multiplo)
      const escapedNumero = numeroNormalizzato.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      clienteTrovato = await Cliente.findOne({
        $or: [
          { telefono: numeroNormalizzato },
          { telefono: `+${numeroNormalizzato}` },
          { telefono: { $regex: escapedNumero, $options: 'i' } },
          // Fallback: ultimi 10 cifre (numero senza prefisso internazionale)
          { telefono: { $regex: numeroNormalizzato.slice(-10), $options: 'i' } }
        ],
        attivo: true
      });
      
      logger.info('🔍 Ricerca cliente completata', {
        numeroOriginale: numero,
        numeroNormalizzato: numeroNormalizzato,
        trovato: !!clienteTrovato,
        clienteId: clienteTrovato?._id
      });
      
    } catch (searchError) {
      logger.error('❌ Errore ricerca cliente:', searchError);
      // Continua anche se la ricerca fallisce
    }
    
    // ===== PREPARA DATI POPUP =====
    const popupData = {
      numero: numeroNormalizzato, // ✅ USA NUMERO NORMALIZZATO
      numeroOriginale: numero,    // ✅ Mantieni originale per debug
      timestamp: timestamp || new Date().toISOString(),
      callId: callId || `CALL_${numeroNormalizzato}_${Date.now()}`,
      source: source || '3cx',
      cliente: clienteTrovato ? {
        _id: clienteTrovato._id,
        nome: clienteTrovato.nome,
        cognome: clienteTrovato.cognome,
        telefono: clienteTrovato.telefono,
        email: clienteTrovato.email,
        codice: clienteTrovato.codice,
        punti: clienteTrovato.punti,
        livello: clienteTrovato.livello,
        totaleFatturato: clienteTrovato.totaleFatturato,
        numeroOrdini: clienteTrovato.numeroOrdini,
        dataUltimoOrdine: clienteTrovato.dataUltimoOrdine,
        note: clienteTrovato.note
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
      numeroOriginale: numero,
      numeroNormalizzato: numeroNormalizzato,
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
    const numeroNormalizzato = normalizzaNumero(numeroTest);
    
    const testData = {
      numero: numeroNormalizzato,
      numeroOriginale: numeroTest,
      timestamp: new Date().toISOString(),
      callId: 'test-' + Date.now(),
      source: 'test-manual',
      cliente: null
    };
    
    // Cerca cliente per test
    const cliente = await Cliente.findOne({
      telefono: { $regex: numeroNormalizzato.slice(-10), $options: 'i' }
    });
    
    if (cliente) {
      testData.cliente = {
        _id: cliente._id,
        nome: cliente.nome,
        cognome: cliente.cognome,
        telefono: cliente.telefono,
        email: cliente.email
      };
    }
    
    // Invia evento Pusher
    await pusher.trigger('chiamate', 'nuova-chiamata', testData);
    
    logger.info('✅ Test webhook inviato', testData);
    
    res.json({
      success: true,
      message: 'Evento test inviato',
      data: testData
    });
    
  } catch (error) {
    logger.error('❌ Errore test webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
