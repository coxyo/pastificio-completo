// routes/ordini.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';
import whatsappService from '../services/whatsappService.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
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

// GET /api/ordini/whatsapp-status
router.get('/whatsapp-status', async (req, res) => {
  try {
    const status = {
      isReady: whatsappService.isReady(),
      status: whatsappService.getStatus(),
      info: await whatsappService.getInfo()
    };
    
    logger.info('WhatsApp Status Check:', status);
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Errore verifica stato WhatsApp:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ordini
router.post('/', async (req, res) => {
  try {
    // Normalizza i dati
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

    // Rimuovi ID temporanei
    delete ordineData._id;
    delete ordineData.id;
    if (ordineData._id?.startsWith('temp_')) {
      delete ordineData._id;
    }

    const ordine = new Ordine(ordineData);
    await ordine.save();
    
    logger.info(`Nuovo ordine creato: ${ordine._id}`);
    
    // Invio WhatsApp automatico
    if (whatsappService && whatsappService.isReady() && ordine.telefono) {
      try {
        const listaProdotti = ordine.prodotti
          .map(p => `• ${p.nome}: ${p.quantita} ${p.unita || 'kg'} - €${(p.quantita * p.prezzo).toFixed(2)}`)
          .join('\n');
        
        const dataFormattata = new Date(ordine.dataRitiro).toLocaleDateString('it-IT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        await whatsappService.inviaMessaggioConTemplate(
          ordine.telefono,
          'conferma-ordine',
          {
            nomeCliente: ordine.nomeCliente,
            dataRitiro: dataFormattata,
            oraRitiro: ordine.oraRitiro,
            prodotti: listaProdotti,
            totale: ordine.totale || '0.00',
            note: ordine.note ? `\n📝 Note: ${ordine.note}` : ''
          }
        );
        
        logger.info(`WhatsApp inviato a ${ordine.telefono}`);
      } catch (whatsappError) {
        logger.error('Errore invio WhatsApp:', whatsappError);
      }
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

// GET /api/ordini/:id
router.get('/:id', async (req, res) => {
  try {
    // Se è un ID temporaneo, restituisci errore
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

// PUT /api/ordini/:id
router.put('/:id', async (req, res) => {
  try {
    const ordineId = req.params.id;
    let ordine;
    let isNew = false;
    
    // Se l'ID è temporaneo, crea nuovo ordine
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
      
      // Rimuovi ID temporaneo
      delete ordineData._id;
      delete ordineData.id;
      
      ordine = new Ordine(ordineData);
      await ordine.save();
      
      logger.info(`Nuovo ordine da temp ID: ${ordine._id}`);
      
      // Invio WhatsApp per nuovo ordine
      if (whatsappService && whatsappService.isReady() && ordine.telefono) {
        try {
          const listaProdotti = ordine.prodotti
            .map(p => `• ${p.nome}: ${p.quantita} ${p.unita || 'kg'} - €${(p.quantita * p.prezzo).toFixed(2)}`)
            .join('\n');
          
          const dataFormattata = new Date(ordine.dataRitiro).toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          await whatsappService.inviaMessaggioConTemplate(
            ordine.telefono,
            'conferma-ordine',
            {
              nomeCliente: ordine.nomeCliente,
              dataRitiro: dataFormattata,
              oraRitiro: ordine.oraRitiro,
              prodotti: listaProdotti,
              totale: ordine.totale || '0.00',
              note: ordine.note ? `\n📝 Note: ${ordine.note}` : ''
            }
          );
          
          logger.info(`WhatsApp inviato per nuovo ordine`);
        } catch (whatsappError) {
          logger.error('Errore invio WhatsApp:', whatsappError);
        }
      }
      
    } else {
      // Aggiorna ordine esistente
      ordine = await Ordine.findById(ordineId);
      if (!ordine) {
        return res.status(404).json({ success: false, error: 'Ordine non trovato' });
      }
      
      const vecchiaDataRitiro = ordine.dataRitiro;
      const vecchioOraRitiro = ordine.oraRitiro;
      
      // Normalizza prodotti
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
      
      // Notifica modifiche via WhatsApp
      if (whatsappService && whatsappService.isReady() && ordine.telefono) {
        const dataOraCambiata = 
          vecchiaDataRitiro?.getTime() !== ordine.dataRitiro?.getTime() ||
          vecchioOraRitiro !== ordine.oraRitiro;
        
        if (dataOraCambiata) {
          try {
            const dataFormattata = new Date(ordine.dataRitiro).toLocaleDateString('it-IT', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            const messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝\n\n` +
              `Gentile ${ordine.nomeCliente},\n` +
              `il suo ordine è stato modificato.\n\n` +
              `📅 *Nuova data ritiro:* ${dataFormattata}\n` +
              `⏰ *Nuovo orario:* ${ordine.oraRitiro}\n\n` +
              `Per info: 📞 389 887 9833`;
            
            await whatsappService.inviaMessaggio(ordine.telefono, messaggio);
            logger.info(`WhatsApp modifica inviato`);
          } catch (error) {
            logger.error('Errore invio WhatsApp:', error);
          }
        }
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
    // Se è un ID temporaneo, ignora
    if (req.params.id.startsWith('temp_')) {
      return res.json({ success: true, data: {} });
    }

    const ordine = await Ordine.findById(req.params.id);
    if (!ordine) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato' });
    }

    // Notifica cancellazione via WhatsApp
    if (whatsappService && whatsappService.isReady() && ordine.telefono) {
      try {
        const messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝\n\n` +
          `Gentile ${ordine.nomeCliente},\n` +
          `il suo ordine del ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')} ` +
          `è stato annullato.\n\n` +
          `Per info: 📞 389 887 9833`;
        
        await whatsappService.inviaMessaggio(ordine.telefono, messaggio);
        logger.info(`WhatsApp cancellazione inviato`);
      } catch (error) {
        logger.error('Errore invio WhatsApp:', error);
      }
    }

    await ordine.deleteOne();

    // Notifica WebSocket
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

    if (!whatsappService.isReady()) {
      return res.status(503).json({ 
        success: false, 
        error: 'WhatsApp non connesso. Verificare la connessione nel backend.' 
      });
    }

    if (!ordine.telefono) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numero di telefono mancante' 
      });
    }

    const dataFormattata = new Date(ordine.dataRitiro).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    await whatsappService.inviaMessaggioConTemplate(
      ordine.telefono,
      'promemoria',
      {
        nomeCliente: ordine.nomeCliente,
        dataRitiro: dataFormattata,
        oraRitiro: ordine.oraRitiro
      }
    );

    res.json({ success: true, message: 'Promemoria inviato' });
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

    if (!whatsappService.isReady()) {
      return res.status(503).json({ 
        success: false, 
        error: 'WhatsApp non connesso. Verificare la connessione nel backend.' 
      });
    }

    if (!ordine.telefono) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numero di telefono mancante' 
      });
    }

    await whatsappService.inviaMessaggioConTemplate(
      ordine.telefono,
      'ordine-pronto',
      {
        nomeCliente: ordine.nomeCliente,
        oraRitiro: ordine.oraRitiro
      }
    );

    // Aggiorna stato
    ordine.stato = 'pronto';
    await ordine.save();

    res.json({ success: true, message: 'Notifica inviata' });
    logger.info(`Ordine pronto notificato: ${ordine._id}`);
  } catch (error) {
    logger.error('Errore invio notifica:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;