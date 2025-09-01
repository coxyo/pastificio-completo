// routes/ordini.js - VERSIONE TWILIO
import express from 'express';
import { protect } from '../middleware/auth.js';
import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';
import twilio from 'twilio';

const router = express.Router();

// Inizializza Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || 'ACb3be7d8f44ad3333a326ec2e43aac57b5',
  process.env.TWILIO_AUTH_TOKEN || '8ee0ca191092c20d015e03cdea3b9621'
);
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

// Helper function per inviare WhatsApp con Twilio
async function inviaWhatsAppTwilio(telefono, messaggio) {
  try {
    const numeroClean = telefono.replace(/\D/g, '');
    const toNumber = numeroClean.startsWith('39') ? 
      `whatsapp:+${numeroClean}` : 
      `whatsapp:+39${numeroClean}`;
    
    const result = await twilioClient.messages.create({
      from: fromNumber,
      to: toNumber,
      body: messaggio
    });
    
    logger.info(`WhatsApp Twilio inviato: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    logger.error('Errore Twilio:', error);
    return { success: false, error: error.message };
  }
}

// Middleware di autenticazione
router.use(protect);

// GET /api/ordini
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.dataRitiro) filters.dataRitiro = req.query.dataRitiro;
    if (req.query.nomeCliente) filters.nomeCliente = new RegExp(req.query.nomeCliente, 'i');
    if (req.query.stato) filters.stato = req.query.stato;

    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.dataRitiro = 1;
      sort.oraRitiro = 1;
    }

    const ordini = await Ordine.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Ordine.countDocuments(filters);

    res.json({
      success: true,
      data: ordini,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

    logger.info(`Ordini recuperati: ${ordini.length}`);
  } catch (error) {
    logger.error('Errore recupero ordini:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ordini
router.post('/', async (req, res) => {
  try {
    const ordineData = {
      ...req.body,
      creatoDa: req.user._id,
      modificatoDa: req.user._id,
      prodotti: req.body.prodotti?.map(p => ({
        ...p,
        unita: p.unita || p.unitaMisura || 'kg',
        unitaMisura: p.unita || p.unitaMisura || 'kg',
        nome: p.nome?.replace(/\s*\(\d+.*?\)\s*$/, '').trim()
      }))
    };

    delete ordineData._id;
    delete ordineData.id;

    const ordine = new Ordine(ordineData);
    await ordine.save();
    
    logger.info(`Nuovo ordine creato: ${ordine._id}`);
    
    // Invio WhatsApp con Twilio
    if (ordine.telefono) {
      const listaProdotti = ordine.prodotti
        .map(p => `• ${p.nome}: ${p.quantita} ${p.unita || 'kg'} - €${(p.quantita * p.prezzo).toFixed(2)}`)
        .join('\n');
      
      const messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA*\n\n` +
        `✅ Ordine Confermato!\n\n` +
        `Cliente: ${ordine.nomeCliente}\n` +
        `Data: ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}\n` +
        `Ora: ${ordine.oraRitiro}\n\n` +
        `Prodotti:\n${listaProdotti}\n\n` +
        `💰 Totale: €${ordine.totale || '0.00'}\n` +
        `${ordine.note ? `\n📝 Note: ${ordine.note}` : ''}\n\n` +
        `📍 Via Carmine 20/B, Assemini`;
      
      await inviaWhatsAppTwilio(ordine.telefono, messaggio);
    }
    
    // Notifica WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('nuovo-ordine', { 
        id: ordine._id,
        cliente: ordine.nomeCliente,
        dataRitiro: ordine.dataRitiro,
        ordine: ordine
      });
    }

    res.status(201).json({ success: true, data: ordine });
    
  } catch (error) {
    logger.error('Errore creazione ordine:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/ordini/:id
router.put('/:id', async (req, res) => {
  try {
    const ordineId = req.params.id;
    let ordine;
    let isNew = false;
    
    if (ordineId.startsWith('temp_')) {
      isNew = true;
      
      const ordineData = {
        ...req.body,
        creatoDa: req.user._id,
        modificatoDa: req.user._id,
        prodotti: req.body.prodotti?.map(p => ({
          ...p,
          unita: p.unita || p.unitaMisura || 'kg',
          unitaMisura: p.unita || p.unitaMisura || 'kg',
          nome: p.nome?.replace(/\s*\(\d+.*?\)\s*$/, '').trim()
        }))
      };
      
      delete ordineData._id;
      delete ordineData.id;
      
      ordine = new Ordine(ordineData);
      await ordine.save();
      
      logger.info(`Nuovo ordine da temp ID: ${ordine._id}`);
      
    } else {
      ordine = await Ordine.findById(ordineId);
      if (!ordine) {
        return res.status(404).json({ success: false, error: 'Ordine non trovato' });
      }
      
      const vecchioStato = ordine.stato;
      
      if (req.body.prodotti) {
        req.body.prodotti = req.body.prodotti.map(p => ({
          ...p,
          unita: p.unita || p.unitaMisura || 'kg',
          unitaMisura: p.unita || p.unitaMisura || 'kg',
          nome: p.nome?.replace(/\s*\(\d+.*?\)\s*$/, '').trim()
        }));
      }
      
      Object.assign(ordine, req.body);
      ordine.modificatoDa = req.user._id;
      ordine.dataModifica = new Date();
      
      await ordine.save();
      
      // Notifica cambio stato con Twilio
      if (vecchioStato !== ordine.stato && ordine.stato === 'completato' && ordine.telefono) {
        const messaggio = `✅ *Ordine Pronto!*\n\n` +
          `${ordine.nomeCliente}, il tuo ordine è pronto per il ritiro!\n\n` +
          `📍 Via Carmine 20/B, Assemini`;
        
        await inviaWhatsAppTwilio(ordine.telefono, messaggio);
      }
    }
    
    // Notifica WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('ordine-aggiornato', { 
        id: ordine._id,
        cliente: ordine.nomeCliente,
        dataRitiro: ordine.dataRitiro,
        ordine: ordine,
        oldId: isNew ? ordineId : null
      });
    }
    
    res.json({ 
      success: true, 
      data: ordine,
      isNew: isNew,
      oldId: isNew ? ordineId : null
    });
    
  } catch (error) {
    logger.error('Errore aggiornamento ordine:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/ordini/:id
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id.startsWith('temp_')) {
      return res.json({ success: true, data: {} });
    }

    const ordine = await Ordine.findById(req.params.id);
    if (!ordine) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato' });
    }

    // Notifica cancellazione con Twilio
    if (ordine.telefono) {
      const messaggio = `❌ *Ordine Annullato*\n\n` +
        `${ordine.nomeCliente}, il tuo ordine del ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')} ` +
        `è stato annullato.\n\n` +
        `Per info: 📞 389 887 9833`;
      
      await inviaWhatsAppTwilio(ordine.telefono, messaggio);
    }

    await ordine.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.emit('ordine-eliminato', { id: req.params.id });
    }

    res.json({ success: true, data: {} });
    logger.info(`Ordine ${req.params.id} eliminato`);
  } catch (error) {
    logger.error('Errore eliminazione ordine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ordini/invio-promemoria/:id
router.post('/invio-promemoria/:id', async (req, res) => {
  try {
    if (req.params.id.startsWith('temp_')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Salvare prima l\'ordine' 
      });
    }

    const ordine = await Ordine.findById(req.params.id);
    if (!ordine) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato' });
    }

    if (!ordine.telefono) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numero di telefono mancante' 
      });
    }

    const messaggio = `🔔 *PROMEMORIA*\n\n` +
      `Ciao ${ordine.nomeCliente}!\n` +
      `Ti ricordiamo il ritiro del tuo ordine:\n\n` +
      `📅 ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}\n` +
      `⏰ Ore ${ordine.oraRitiro}\n` +
      `📍 Via Carmine 20/B, Assemini`;

    const result = await inviaWhatsAppTwilio(ordine.telefono, messaggio);

    res.json(result);
    logger.info(`Promemoria inviato per ${ordine._id}`);
  } catch (error) {
    logger.error('Errore invio promemoria:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ordini/invio-ordine-pronto/:id
router.post('/invio-ordine-pronto/:id', async (req, res) => {
  try {
    if (req.params.id.startsWith('temp_')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Salvare prima l\'ordine' 
      });
    }

    const ordine = await Ordine.findById(req.params.id);
    if (!ordine) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato' });
    }

    if (!ordine.telefono) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numero di telefono mancante' 
      });
    }

    const messaggio = `✅ *ORDINE PRONTO!*\n\n` +
      `${ordine.nomeCliente}, il tuo ordine è pronto per il ritiro!\n\n` +
      `⏰ Ti aspettiamo alle ${ordine.oraRitiro}\n` +
      `📍 Via Carmine 20/B, Assemini`;

    const result = await inviaWhatsAppTwilio(ordine.telefono, messaggio);

    // Aggiorna stato
    ordine.stato = 'pronto';
    await ordine.save();

    res.json(result);
    logger.info(`Ordine pronto notificato: ${ordine._id}`);
  } catch (error) {
    logger.error('Errore invio notifica:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ordini/whatsapp-status - Ritorna sempre attivo con Twilio
router.get('/whatsapp-status', async (req, res) => {
  res.json({
    success: true,
    data: {
      isReady: true,
      status: 'twilio_active',
      info: {
        provider: 'Twilio WhatsApp Business',
        connected: true
      }
    }
  });
});

// GET /api/ordini/:id
router.get('/:id', async (req, res) => {
  try {
    if (req.params.id.startsWith('temp_')) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID temporaneo non valido. Salvare prima l\'ordine.' 
      });
    }

    const ordine = await Ordine.findById(req.params.id);

    if (!ordine) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato' });
    }

    res.json({ success: true, data: ordine });
  } catch (error) {
    logger.error('Errore recupero ordine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;