// routes/ordini.js - ✅ VERSIONE COMPLETA CON GIACENZE E LIMITI
import express from 'express';
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';
import LimiteGiornaliero from '../models/LimiteGiornaliero.js'; // ✅ NUOVO
import { protect } from '../middleware/auth.js';
import { aggiornaGiacenzeOrdine } from '../middleware/aggiornaGiacenze.js';
import logger from '../config/logger.js';

const router = express.Router();

// GET /api/ordini - Ottieni tutti gli ordini
router.get('/', async (req, res) => {
  try {
    const { data, stato, cliente, limit = 1000 } = req.query;
    
    let filter = {};
    
    if (data) {
      const startDate = new Date(data);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(data);
      endDate.setHours(23, 59, 59, 999);
      
      filter.dataRitiro = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    if (stato) {
      filter.stato = stato;
    }
    
    if (cliente) {
      filter.cliente = cliente;
    }
    
    const ordini = await Ordine.find(filter)
      .populate('cliente', 'nome cognome telefono email codiceCliente')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    logger.info(`✅ Recuperati ${ordini.length} ordini`);
    
    res.json({
      success: true,
      count: ordini.length,
      data: ordini
    });
  } catch (error) {
    logger.error('❌ Errore recupero ordini:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero ordini',
      error: error.message
    });
  }
});

// GET /api/ordini/:id - Ottieni ordine singolo
router.get('/:id', async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.id)
      .populate('cliente', 'nome cognome telefono email codiceCliente');
    
    if (!ordine) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }
    
    res.json({
      success: true,
      data: ordine
    });
  } catch (error) {
    logger.error('❌ Errore recupero ordine:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero ordine',
      error: error.message
    });
  }
});

// POST /api/ordini - Crea nuovo ordine (CON GIACENZE E LIMITI)
router.post('/', async (req, res, next) => {
  try {
    logger.info('📥 Ricevuta richiesta creazione ordine');
    
    const ordineData = req.body;
    
    // ✅ NUOVO: Verifica limiti giornalieri PRIMA di salvare
    if (ordineData.dataRitiro && ordineData.prodotti) {
      const verificaLimiti = await LimiteGiornaliero.verificaOrdine(
        ordineData.dataRitiro,
        ordineData.prodotti
      );
      
      if (!verificaLimiti.ok) {
        logger.warn(`⚠️ Ordine supera limiti per ${ordineData.dataRitiro}:`, verificaLimiti.errori);
        
        return res.status(400).json({
          success: false,
          message: 'Ordine supera i limiti di capacità produttiva',
          erroriLimiti: verificaLimiti.errori,
          limiti: verificaLimiti.limiti
        });
      }
    }
    
    // Verifica cliente
    let clienteId = null;
    if (ordineData.cliente) {
      if (typeof ordineData.cliente === 'string') {
        clienteId = ordineData.cliente;
      } else if (ordineData.cliente._id) {
        clienteId = ordineData.cliente._id;
      }
      
      // Verifica esistenza cliente
      if (clienteId) {
        const clienteEsiste = await Cliente.findById(clienteId);
        if (!clienteEsiste) {
          logger.warn(`⚠️ Cliente non trovato: ${clienteId}`);
          clienteId = null;
        }
      }
    }
    
    // Prepara dati ordine
    const nuovoOrdineData = {
      ...ordineData,
      cliente: clienteId,
      numeroOrdine: `ORD${Date.now().toString().slice(-8)}`,
      stato: ordineData.stato || 'nuovo',
      totale: ordineData.totale || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Crea ordine
    const nuovoOrdine = new Ordine(nuovoOrdineData);
    await nuovoOrdine.save();
    
    logger.info(`✅ Ordine creato: ${nuovoOrdine.numeroOrdine} - €${nuovoOrdine.totale}`);
    
    // ✅ NUOVO: Aggiorna contatori limiti dopo salvataggio
    if (nuovoOrdine.dataRitiro && nuovoOrdine.prodotti) {
      await LimiteGiornaliero.aggiornaDopoOrdine(nuovoOrdine.dataRitiro, nuovoOrdine.prodotti);
      logger.info(`📊 Limiti aggiornati per ordine ${nuovoOrdine._id}`);
    }
    
    // ✅ SALVA IN res.locals PER MIDDLEWARE GIACENZE
    res.locals.ordineCreato = nuovoOrdine;
    
    // Popola cliente per risposta
    await nuovoOrdine.populate('cliente', 'nome cognome telefono email codiceCliente');
    
    // Notifica WebSocket
    if (global.io) {
      global.io.emit('ordine-creato', {
        ordine: nuovoOrdine,
        timestamp: new Date()
      });
    }
    
    // ✅ PASSA AL MIDDLEWARE GIACENZE
    next();
    
  } catch (error) {
    logger.error('❌ Errore creazione ordine:', error);
    res.status(500).json({
      success: false,
      message: 'Errore creazione ordine',
      error: error.message
    });
  }
}, aggiornaGiacenzeOrdine, (req, res) => {
  // ✅ RISPOSTA FINALE DOPO AGGIORNAMENTO GIACENZE
  res.status(201).json({
    success: true,
    message: 'Ordine creato con successo',
    data: res.locals.ordineCreato
  });
});

// PUT /api/ordini/:id - Aggiorna ordine (CON VERIFICA LIMITI)
router.put('/:id', async (req, res) => {
  try {
    const ordineData = req.body;
    
    const ordineEsistente = await Ordine.findById(req.params.id);
    
    if (!ordineEsistente) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }
    
    // ✅ NUOVO: Se cambia data o prodotti, verifica limiti
    if (ordineData.dataRitiro || ordineData.prodotti) {
      const dataVerifica = ordineData.dataRitiro || ordineEsistente.dataRitiro;
      const prodottiVerifica = ordineData.prodotti || ordineEsistente.prodotti;
      
      // Rimuovi quantità vecchio ordine dai contatori
      await LimiteGiornaliero.aggiornaDopoOrdine(
        ordineEsistente.dataRitiro,
        ordineEsistente.prodotti.map(p => ({
          ...p.toObject(),
          quantita: -p.quantita // Sottrai
        }))
      );
      
      // Verifica con nuovo ordine
      const verificaLimiti = await LimiteGiornaliero.verificaOrdine(dataVerifica, prodottiVerifica);
      
      if (!verificaLimiti.ok) {
        // Ripristina quantità vecchio ordine
        await LimiteGiornaliero.aggiornaDopoOrdine(ordineEsistente.dataRitiro, ordineEsistente.prodotti);
        
        return res.status(400).json({
          success: false,
          message: 'Modifica supera i limiti di capacità produttiva',
          erroriLimiti: verificaLimiti.errori,
          limiti: verificaLimiti.limiti
        });
      }
      
      // Aggiungi quantità nuovo ordine
      await LimiteGiornaliero.aggiornaDopoOrdine(dataVerifica, prodottiVerifica);
    }
    
    // Gestisci cliente
    let clienteId = null;
    if (ordineData.cliente) {
      if (typeof ordineData.cliente === 'string') {
        clienteId = ordineData.cliente;
      } else if (ordineData.cliente._id) {
        clienteId = ordineData.cliente._id;
      }
    }
    
    const ordineAggiornato = await Ordine.findByIdAndUpdate(
      req.params.id,
      {
        ...ordineData,
        cliente: clienteId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('cliente', 'nome cognome telefono email codiceCliente');
    
    if (!ordineAggiornato) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }
    
    logger.info(`✅ Ordine aggiornato: ${ordineAggiornato.numeroOrdine}`);
    
    // Notifica WebSocket
    if (global.io) {
      global.io.emit('ordine-aggiornato', {
        ordine: ordineAggiornato,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Ordine aggiornato',
      data: ordineAggiornato
    });
  } catch (error) {
    logger.error('❌ Errore aggiornamento ordine:', error);
    res.status(500).json({
      success: false,
      message: 'Errore aggiornamento ordine',
      error: error.message
    });
  }
});

// DELETE /api/ordini/:id - Elimina ordine (E RIPRISTINA LIMITI)
router.delete('/:id', async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.id);
    
    if (!ordine) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }
    
    // ✅ NUOVO: Ripristina limiti sottraendo quantità
    if (ordine.dataRitiro && ordine.prodotti) {
      await LimiteGiornaliero.aggiornaDopoOrdine(
        ordine.dataRitiro,
        ordine.prodotti.map(p => ({
          ...p.toObject(),
          quantita: -p.quantita // Sottrai per ripristinare
        }))
      );
      logger.info(`📊 Limiti ripristinati dopo eliminazione ordine ${ordine._id}`);
    }
    
    await ordine.deleteOne();
    
    logger.info(`🗑️ Ordine eliminato: ${ordine.numeroOrdine}`);
    
    // Notifica WebSocket
    if (global.io) {
      global.io.emit('ordine-eliminato', {
        ordineId: req.params.id,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Ordine eliminato'
    });
  } catch (error) {
    logger.error('❌ Errore eliminazione ordine:', error);
    res.status(500).json({
      success: false,
      message: 'Errore eliminazione ordine',
      error: error.message
    });
  }
});

// GET /api/ordini/statistiche/giornaliere - Statistiche giornaliere
router.get('/statistiche/giornaliere', async (req, res) => {
  try {
    const { data } = req.query;
    const dataTarget = data ? new Date(data) : new Date();
    
    const startDate = new Date(dataTarget);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dataTarget);
    endDate.setHours(23, 59, 59, 999);
    
    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    const statistiche = {
      totaleOrdini: ordini.length,
      totaleIncasso: ordini.reduce((sum, o) => sum + (o.totale || 0), 0),
      ordiniCompletati: ordini.filter(o => o.stato === 'completato').length,
      ordiniInLavorazione: ordini.filter(o => o.stato === 'in_lavorazione').length,
      ordiniNuovi: ordini.filter(o => o.stato === 'nuovo').length,
      ordiniAnnullati: ordini.filter(o => o.stato === 'annullato').length,
      mediaOrdine: ordini.length > 0 ? ordini.reduce((sum, o) => sum + (o.totale || 0), 0) / ordini.length : 0
    };
    
    res.json({
      success: true,
      data: statistiche
    });
  } catch (error) {
    logger.error('❌ Errore statistiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore calcolo statistiche',
      error: error.message
    });
  }
});

export default router;