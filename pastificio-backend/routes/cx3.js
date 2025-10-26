// routes/cx3.js - Backend (ES6 Modules)
import express from 'express';
import Pusher from 'pusher';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Inizializza Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true
});

/**
 * @route   POST /api/cx3/test
 * @desc    Test chiamata Pusher
 * @access  Privato
 */
router.post('/test', protect, async (req, res) => {
  try {
    console.log('🧪 Test chiamata Pusher richiesto da:', req.user?.email || 'Unknown');

    // Dati chiamata test
    const testCallData = {
      callId: `test_${Date.now()}`,
      numero: '+393331234567',
      timestamp: new Date(),
      cliente: {
        nome: 'Mario',
        cognome: 'Rossi',
        telefono: '+393331234567',
        codiceCliente: 'CL250001'
      },
      tipo: 'inbound',
      durata: 0,
      stato: 'ringing'
    };

    // Invia evento Pusher
    await pusher.trigger('chiamate', 'nuova-chiamata', testCallData);

    console.log('✅ Evento Pusher inviato:', testCallData.callId);

    res.json({
      success: true,
      message: 'Chiamata test inviata via Pusher',
      data: testCallData,
      pusherEnabled: true,
      channel: 'chiamate',
      event: 'nuova-chiamata'
    });

  } catch (error) {
    console.error('❌ Errore test chiamata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/cx3/incoming
 * @desc    Webhook chiamate in arrivo da CX3
 * @access  Pubblico (con validazione opzionale)
 */
router.post('/incoming', async (req, res) => {
  try {
    const { callId, numero, cliente } = req.body;

    console.log('📞 Chiamata in arrivo da CX3:', { callId, numero });

    // Valida dati
    if (!callId || !numero) {
      return res.status(400).json({
        success: false,
        error: 'callId e numero sono richiesti'
      });
    }

    // Prepara dati chiamata
    const callData = {
      callId,
      numero,
      timestamp: new Date(),
      cliente: cliente || null,
      tipo: 'inbound',
      durata: 0,
      stato: 'ringing'
    };

    // Invia evento Pusher
    await pusher.trigger('chiamate', 'nuova-chiamata', callData);

    console.log('✅ Chiamata propagata via Pusher:', callId);

    res.json({
      success: true,
      message: 'Chiamata ricevuta e propagata',
      callId
    });

  } catch (error) {
    console.error('❌ Errore ricezione chiamata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cx3/history
 * @desc    Storico chiamate (placeholder)
 * @access  Privato
 */
router.get('/history', protect, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // TODO: Implementa query MongoDB per storico chiamate
    // Per ora restituisci array vuoto
    
    res.json({
      success: true,
      chiamate: [],
      total: 0,
      message: 'Storico chiamate - da implementare con MongoDB'
    });

  } catch (error) {
    console.error('❌ Errore recupero storico:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cx3/status
 * @desc    Status Pusher
 * @access  Pubblico
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    pusher: {
      enabled: true,
      cluster: process.env.PUSHER_CLUSTER || 'eu',
      key: process.env.PUSHER_KEY || 'NOT_SET'
    },
    timestamp: new Date()
  });
});

export default router;