// routes/whatsappBot.js
// API admin per testing e configurazione FAQ Bot WhatsApp

import express from 'express';
import { protect } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { classificaIntent, processaMessaggio } from '../services/whatsappBotService.js';
import { botStats } from '../services/whatsappBotHandler.js';
import logger from '../config/logger.js';

const router = express.Router();

// Tutte le route richiedono autenticazione + ruolo admin
router.use(protect);
router.use(checkRole('admin'));

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/whatsapp-bot/test-intent
// Testa la classificazione dell'intent senza inviare nulla
// Body: { testo: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/test-intent', async (req, res) => {
  try {
    const { testo } = req.body;

    if (!testo || typeof testo !== 'string' || testo.trim().length === 0) {
      return res.status(400).json({
        success: false,
        messaggio: 'Campo "testo" obbligatorio',
      });
    }

    const inizio = Date.now();
    const intent = await classificaIntent(testo.trim());
    const durata = Date.now() - inizio;

    logger.info(`[BOT-TEST] Intent testato: "${testo.substring(0, 60)}" → ${intent.tipo}`);

    return res.json({
      success: true,
      testo: testo.trim(),
      intent,
      durataMsClassificazione: durata,
    });
  } catch (err) {
    logger.error('Errore test-intent:', err);
    return res.status(500).json({
      success: false,
      messaggio: 'Errore durante la classificazione',
      errore: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/whatsapp-bot/test-risposta
// Genera la risposta completa di test (senza inviare su WhatsApp)
// Body: { testo: string, nomeCliente?: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/test-risposta', async (req, res) => {
  try {
    const { testo, nomeCliente = null } = req.body;

    if (!testo || typeof testo !== 'string' || testo.trim().length === 0) {
      return res.status(400).json({
        success: false,
        messaggio: 'Campo "testo" obbligatorio',
      });
    }

    const inizio = Date.now();
    const risultato = await processaMessaggio(testo.trim(), {
      nomeCliente,
      botEnabled: true, // In test mode ignora il kill switch
    });
    const durata = Date.now() - inizio;

    logger.info(`[BOT-TEST] Risposta generata per: "${testo.substring(0, 60)}" → ${risultato.intent.tipo}`);

    return res.json({
      success: true,
      testo: testo.trim(),
      nomeCliente,
      intent: risultato.intent,
      risposta: risultato.risposta,
      escalation: risultato.escalation,
      motivo: risultato.motivo,
      durataMs: durata,
      anteprima: risultato.risposta
        ? {
            caratteri: risultato.risposta.length,
            righe: risultato.risposta.split('\n').length,
            estratto: risultato.risposta.substring(0, 100) + (risultato.risposta.length > 100 ? '...' : ''),
          }
        : null,
    });
  } catch (err) {
    logger.error('Errore test-risposta:', err);
    return res.status(500).json({
      success: false,
      messaggio: 'Errore durante la generazione della risposta',
      errore: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/whatsapp-bot/stats
// Statistiche messaggi: totali, per tipo, escalation rate, ultimi messaggi
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitN = Math.min(parseInt(limit, 10) || 20, 50);

    const totale = botStats.totaleMessaggi;
    const escalationRate = totale > 0
      ? ((botStats.escalation / totale) * 100).toFixed(1)
      : '0.0';

    const faqRate = totale > 0
      ? (((totale - botStats.escalation) / totale) * 100).toFixed(1)
      : '0.0';

    return res.json({
      success: true,
      stats: {
        avviato: botStats.avviato,
        totaleMessaggi: totale,
        escalation: botStats.escalation,
        faqAutomatiche: totale - botStats.escalation,
        escalationRate: `${escalationRate}%`,
        faqRate: `${faqRate}%`,
        perTipo: botStats.perTipo,
        botAbilitato: process.env.BOT_ENABLED !== 'false',
      },
      ultimiMessaggi: botStats.ultimiMessaggi.slice(0, limitN),
    });
  } catch (err) {
    logger.error('Errore stats bot:', err);
    return res.status(500).json({
      success: false,
      messaggio: 'Errore recupero statistiche',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/whatsapp-bot/toggle
// Attiva/disattiva il bot runtime (senza restart)
// Body: { abilitato: boolean }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/toggle', (req, res) => {
  try {
    const { abilitato } = req.body;
    if (typeof abilitato !== 'boolean') {
      return res.status(400).json({
        success: false,
        messaggio: 'Campo "abilitato" (boolean) obbligatorio',
      });
    }

    process.env.BOT_ENABLED = abilitato ? 'true' : 'false';
    logger.info(`[BOT] Bot ${abilitato ? 'abilitato' : 'disabilitato'} da admin ${req.user?.username}`);

    return res.json({
      success: true,
      botAbilitato: abilitato,
      messaggio: `Bot ${abilitato ? 'abilitato' : 'disabilitato'} con successo`,
    });
  } catch (err) {
    logger.error('Errore toggle bot:', err);
    return res.status(500).json({ success: false, messaggio: 'Errore toggle bot' });
  }
});

export default router;