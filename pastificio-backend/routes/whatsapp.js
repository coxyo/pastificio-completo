// routes/whatsapp.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import * as whatsappService from '../services/whatsappService.js';
import logger from '../config/logger.js';

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(protect);

// GET /api/whatsapp/status
router.get('/status', async (req, res) => {
  try {
    const status = await whatsappService.getStatus();
    res.json(status);
  } catch (err) {
    logger.error('Errore status WhatsApp:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/invia-messaggio
router.post('/invia-messaggio', async (req, res) => {
  try {
    const { telefono, messaggio } = req.body;
    if (!telefono || !messaggio) {
      return res.status(400).json({ error: 'telefono e messaggio richiesti' });
    }
    const result = await whatsappService.inviaMessaggio(telefono, messaggio);
    res.json(result);
  } catch (err) {
    logger.error('Errore invio messaggio WhatsApp:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/invia-conferma-ordine
router.post('/invia-conferma-ordine', async (req, res) => {
  try {
    const { telefono, nomeCliente, prodotti, totale, dataRitiro, orarioRitiro, numeroOrdine } = req.body;
    if (!telefono) {
      return res.status(400).json({ error: 'telefono richiesto' });
    }
    const result = await whatsappService.inviaMessaggioConTemplate('conferma-ordine', telefono, {
      nomeCliente, prodotti, totale, dataRitiro, orarioRitiro, numeroOrdine
    });
    res.json(result);
  } catch (err) {
    logger.error('Errore conferma ordine WhatsApp:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/invia-ordine-pronto
router.post('/invia-ordine-pronto', async (req, res) => {
  try {
    const { telefono, nomeCliente } = req.body;
    if (!telefono) {
      return res.status(400).json({ error: 'telefono richiesto' });
    }
    const result = await whatsappService.inviaMessaggioConTemplate('ordine-pronto', telefono, { nomeCliente });
    res.json(result);
  } catch (err) {
    logger.error('Errore ordine pronto WhatsApp:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/invia-promemoria
router.post('/invia-promemoria', async (req, res) => {
  try {
    const { telefono, nomeCliente, dataRitiro, orarioRitiro } = req.body;
    if (!telefono) {
      return res.status(400).json({ error: 'telefono richiesto' });
    }
    const result = await whatsappService.inviaMessaggioConTemplate('promemoria-giorno-prima', telefono, {
      nomeCliente, dataRitiro, orarioRitiro
    });
    res.json(result);
  } catch (err) {
    logger.error('Errore promemoria WhatsApp:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/annulla-risposta
// Chiamato dal frontend quando l'operatore apre il popup → bot non risponde automaticamente
router.post('/annulla-risposta', async (req, res) => {
  try {
    const { telefono } = req.body;
    if (!telefono) {
      return res.status(400).json({ error: 'telefono richiesto' });
    }
    const result = await whatsappService.annullaRisposta(telefono);
    res.json(result);
  } catch (err) {
    logger.error('Errore annulla risposta WhatsApp:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;