// routes/comunicazioni.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  inviaEmail,
  inviaSMS,
  inviaWhatsApp,
  webhookWhatsApp,
  inviaNotificaPush,
  getStoricoComuncazioni,
  getTemplates
} from '../controllers/comunicazioniController.js';

const router = express.Router();

// Webhook pubblico per WhatsApp (non richiede autenticazione)
router.post('/webhook/whatsapp', webhookWhatsApp);

// Tutte le altre route richiedono autenticazione
router.use(protect);

// Templates disponibili
router.get('/templates', getTemplates);

// Invio comunicazioni
router.post('/email', inviaEmail);
router.post('/sms', inviaSMS);
router.post('/whatsapp', inviaWhatsApp);
router.post('/push', inviaNotificaPush);

// Storico comunicazioni
router.get('/storico', getStoricoComuncazioni);

export default router;