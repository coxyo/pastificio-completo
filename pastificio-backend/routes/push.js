// routes/push.js - ✅ NUOVO: API per Web Push Notifications
import express from 'express';
import { protect } from '../middleware/auth.js';
import PushSubscription from '../models/PushSubscription.js';
import logger from '../config/logger.js';

const router = express.Router();

// Tutte le route protette
router.use(protect);

// ═══════════════════════════════════════════════════════════════
// POST /api/push/subscribe - Registra subscription push
// ═══════════════════════════════════════════════════════════════
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, dispositivo, preferenze } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Subscription non valida: endpoint e keys obbligatori'
      });
    }

    // Upsert: aggiorna se endpoint già esiste, altrimenti crea
    const result = await PushSubscription.findOneAndUpdate(
      { 'subscription.endpoint': subscription.endpoint },
      {
        userId: req.user._id,
        username: req.user.nome || req.user.username || 'utente',
        dispositivo: dispositivo || detectDispositivo(req),
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        },
        preferenze: preferenze || {
          chiamate: true,
          alertCritici: true,
          nuoviOrdini: false,
          ordiniModificati: false
        },
        attiva: true,
        erroriConsecutivi: 0,
        ultimoUtilizzo: new Date()
      },
      { upsert: true, new: true }
    );

    logger.info(`✅ [PUSH] Subscription registrata: ${result.dispositivo} (${result.username})`);

    res.json({
      success: true,
      message: 'Notifiche push attivate!',
      subscription: {
        _id: result._id,
        dispositivo: result.dispositivo,
        preferenze: result.preferenze
      }
    });

  } catch (error) {
    logger.error('[PUSH] Errore subscribe:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/push/unsubscribe - Rimuovi subscription
// ═══════════════════════════════════════════════════════════════
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint obbligatorio'
      });
    }

    const result = await PushSubscription.findOneAndDelete({
      'subscription.endpoint': endpoint,
      userId: req.user._id
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Subscription non trovata'
      });
    }

    logger.info(`🔕 [PUSH] Subscription rimossa: ${result.dispositivo} (${result.username})`);

    res.json({
      success: true,
      message: 'Notifiche push disattivate'
    });

  } catch (error) {
    logger.error('[PUSH] Errore unsubscribe:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/push/subscriptions - Le mie subscription attive
// ═══════════════════════════════════════════════════════════════
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find({
      userId: req.user._id,
      attiva: true
    }).select('dispositivo preferenze createdAt ultimoUtilizzo').lean();

    res.json({
      success: true,
      count: subscriptions.length,
      subscriptions
    });

  } catch (error) {
    logger.error('[PUSH] Errore lista subscriptions:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// PUT /api/push/preferenze - Aggiorna preferenze notifiche
// ═══════════════════════════════════════════════════════════════
router.put('/preferenze', async (req, res) => {
  try {
    const { endpoint, preferenze } = req.body;

    if (!endpoint || !preferenze) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint e preferenze obbligatori'
      });
    }

    const sub = await PushSubscription.findOneAndUpdate(
      { 'subscription.endpoint': endpoint, userId: req.user._id },
      { preferenze },
      { new: true }
    );

    if (!sub) {
      return res.status(404).json({
        success: false,
        message: 'Subscription non trovata'
      });
    }

    logger.info(`✅ [PUSH] Preferenze aggiornate: ${sub.dispositivo} (${sub.username})`);

    res.json({
      success: true,
      message: 'Preferenze aggiornate',
      preferenze: sub.preferenze
    });

  } catch (error) {
    logger.error('[PUSH] Errore aggiorna preferenze:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/push/vapid-key - Ottieni VAPID public key (per il frontend)
// ═══════════════════════════════════════════════════════════════
router.get('/vapid-key', (req, res) => {
  const vapidKey = process.env.VAPID_PUBLIC_KEY;

  if (!vapidKey) {
    return res.status(503).json({
      success: false,
      message: 'VAPID key non configurata sul server'
    });
  }

  res.json({
    success: true,
    vapidPublicKey: vapidKey
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/push/status - Status sistema push
// ═══════════════════════════════════════════════════════════════
router.get('/status', async (req, res) => {
  try {
    const totale = await PushSubscription.countDocuments({ attiva: true });
    const perUtente = await PushSubscription.countDocuments({
      userId: req.user._id,
      attiva: true
    });

    res.json({
      success: true,
      vapidConfigurato: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
      subscriptionsTotali: totale,
      subscriptionsUtente: perUtente
    });

  } catch (error) {
    logger.error('[PUSH] Errore status:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/push/test - Invia notifica test (solo admin)
// ═══════════════════════════════════════════════════════════════
router.post('/test', async (req, res) => {
  try {
    const { default: pushService } = await import('../services/pushService.js');

    // Trova subscription dell'utente corrente
    const subscriptions = await PushSubscription.trovaPerUtente(req.user._id);

    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nessuna subscription attiva su questo dispositivo'
      });
    }

    const payload = {
      tipo: 'test',
      titolo: '🧪 Test Notifica',
      corpo: `Notifica di prova per ${req.user.nome || 'utente'}`,
      icona: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: `test-${Date.now()}`,
      data: {
        action: 'test'
      }
    };

    const risultato = await pushService.inviaNotifica(subscriptions, payload);

    res.json({
      success: true,
      message: `Notifica test inviata a ${risultato.inviate} dispositivi`,
      risultato
    });

  } catch (error) {
    logger.error('[PUSH] Errore test:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper: rileva tipo dispositivo da User-Agent
function detectDispositivo(req) {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  
  let device = 'PC';
  if (ua.includes('android') || ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('ipad') || ua.includes('tablet')) device = 'Tablet';
  
  let browser = 'Browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  
  return `${device} - ${browser}`;
}

export default router;