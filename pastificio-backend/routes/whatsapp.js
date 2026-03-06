// routes/whatsapp.js
// Proxy verso il bot WhatsApp sul VPS Hetzner
import express from 'express';
import { protect } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

const BOT_URL = process.env.WHATSAPP_BOT_URL || 'http://89.167.119.31:3000';
const BOT_API_KEY = process.env.WHATSAPP_BOT_API_KEY || 'pastificio-bot-2026';

// Helper per chiamare il bot VPS
async function callBot(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': BOT_API_KEY
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${BOT_URL}${endpoint}`, options);
  return response.json();
}

// GET /api/whatsapp/status - Stato connessione
router.get('/status', protect, async (req, res) => {
  try {
    const data = await callBot('/api/status');
    res.json({
      success: true,
      connected: data.connected || false,
      status: data.connected ? 'connected' : 'disconnected',
      user: data.user || null,
      source: 'vps-bot'
    });
  } catch (err) {
    logger.error('Errore stato WhatsApp VPS:', err.message);
    res.json({
      success: false,
      connected: false,
      status: 'unreachable',
      error: err.message
    });
  }
});

// GET /api/whatsapp/qr - Non più necessario (QR gestito dal VPS)
router.get('/qr', protect, (req, res) => {
  res.json({
    success: true,
    message: 'QR non necessario. Il bot è connesso sul VPS.',
    connected: true
  });
});

// POST /api/whatsapp/invia-messaggio - Invio messaggio generico
router.post('/invia-messaggio', protect, async (req, res) => {
  try {
    const { numero, messaggio, telefono } = req.body;
    const tel = numero || telefono;

    if (!tel || !messaggio) {
      return res.status(400).json({ success: false, error: 'numero e messaggio sono obbligatori' });
    }

    const data = await callBot('/api/invia-messaggio', 'POST', {
      telefono: tel,
      messaggio
    });

    logger.info(`WhatsApp messaggio inviato a ${tel}`);
    res.json({ success: true, ...data });
  } catch (err) {
    logger.error('Errore invio WhatsApp:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/whatsapp/invia-conferma-ordine - Conferma ordine
router.post('/invia-conferma-ordine', protect, async (req, res) => {
  try {
    const { telefono, nomeCliente, prodotti, dataRitiro, orarioRitiro, totale } = req.body;

    if (!telefono || !nomeCliente) {
      return res.status(400).json({ success: false, error: 'telefono e nomeCliente obbligatori' });
    }

    const data = await callBot('/api/conferma-ordine', 'POST', {
      telefono,
      nomeCliente,
      prodotti,
      dataRitiro,
      orarioRitiro,
      totale
    });

    logger.info(`WhatsApp conferma ordine inviata a ${nomeCliente} (${telefono})`);
    res.json({ success: true, ...data });
  } catch (err) {
    logger.error('Errore conferma ordine WhatsApp:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/whatsapp/invia-ordine-pronto - Ordine pronto per ritiro
router.post('/invia-ordine-pronto', protect, async (req, res) => {
  try {
    const { telefono, nomeCliente } = req.body;

    if (!telefono || !nomeCliente) {
      return res.status(400).json({ success: false, error: 'telefono e nomeCliente obbligatori' });
    }

    const data = await callBot('/api/ordine-pronto', 'POST', {
      telefono,
      nomeCliente
    });

    logger.info(`WhatsApp ordine pronto inviato a ${nomeCliente} (${telefono})`);
    res.json({ success: true, ...data });
  } catch (err) {
    logger.error('Errore ordine pronto WhatsApp:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/whatsapp/invia-promemoria - Promemoria ritiro
router.post('/invia-promemoria', protect, async (req, res) => {
  try {
    const { telefono, nomeCliente, dataRitiro, orarioRitiro } = req.body;

    if (!telefono || !nomeCliente) {
      return res.status(400).json({ success: false, error: 'telefono e nomeCliente obbligatori' });
    }

    const data = await callBot('/api/promemoria', 'POST', {
      telefono,
      nomeCliente,
      dataRitiro,
      orarioRitiro
    });

    logger.info(`WhatsApp promemoria inviato a ${nomeCliente} (${telefono})`);
    res.json({ success: true, ...data });
  } catch (err) {
    logger.error('Errore promemoria WhatsApp:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/whatsapp/restart - Riavvia bot sul VPS
router.post('/restart', protect, async (req, res) => {
  res.json({
    success: true,
    message: 'Il bot gira sul VPS. Per riavviarlo: ssh root@89.167.119.31 → systemctl restart whatsapp-bot'
  });
});

export default router;