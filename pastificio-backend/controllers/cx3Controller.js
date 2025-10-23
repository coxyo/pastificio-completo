// pastificio-backend/src/controllers/cx3Controller.js
import cx3Service from '../services/cx3Service.js';
import Chiamata from '../models/Chiamata.js';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';

const cx3Controller = {
  
  /**
   * 🔵 CLICK-TO-CALL: Inizia chiamata
   */
  makeCall: async (req, res) => {
    try {
      const { numero, clienteId, clienteNome } = req.body;
      
      if (!numero) {
        return res.status(400).json({ 
          success: false, 
          message: 'Numero telefono obbligatorio' 
        });
      }
      
      logger.info('Controller: Click-to-call richiesto', { 
        numero, 
        clienteId, 
        userId: req.user?._id 
      });
      
      // Inizia chiamata tramite 3CX
      const result = await cx3Service.makeCall(numero, clienteId, clienteNome);
      
      if (!result.success) {
        return res.status(500).json(result);
      }
      
      // Cerca cliente da numero se non fornito
      let cliente = null;
      if (clienteId) {
        cliente = await Cliente.findById(clienteId);
      } else {
        cliente = await Chiamata.cercaClienteDaNumero(numero);
      }
      
      // Salva chiamata nel database
      const nuovaChiamata = new Chiamata({
        callId: result.callId,
        direzione: 'outbound',
        numero: numero.replace(/\s+/g, ''),
        cliente: cliente?._id || null,
        clienteNome: cliente?.nomeCompleto || clienteNome || 'Sconosciuto',
        interno: process.env.CX3_EXTENSION,
        stato: 'ringing',
        inizioChiamata: new Date(),
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip
        }
      });
      
      await nuovaChiamata.save();
      
      logger.info('Chiamata salvata in database', { 
        callId: result.callId,
        chiamataId: nuovaChiamata._id 
      });
      
      res.json({
        success: true,
        message: result.message,
        callId: result.callId,
        chiamata: nuovaChiamata,
        cliente: cliente ? {
          _id: cliente._id,
          nomeCompleto: cliente.nomeCompleto,
          telefono: cliente.telefono
        } : null
      });
      
    } catch (error) {
      logger.error('Errore click-to-call', { error: error.message });
      res.status(500).json({ 
        success: false, 
        message: 'Errore durante chiamata',
        error: error.message 
      });
    }
  },
  
  /**
   * 🔵 STATO INTERNO
   */
  getStatus: async (req, res) => {
    try {
      const status = await cx3Service.getExtensionStatus();
      
      res.json(status);
      
    } catch (error) {
      logger.error('Errore stato interno', { error: error.message });
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },
  
  /**
   * 🔵 STORICO CHIAMATE
   */
  getHistory: async (req, res) => {
    try {
      const { 
        limit = 50, 
        startDate, 
        endDate, 
        clienteId,
        direzione,
        stato
      } = req.query;
      
      // Costruisci filtri MongoDB
      const filtri = {};
      
      if (startDate) {
        filtri.inizioChiamata = { 
          $gte: new Date(startDate) 
        };
      }
      
      if (endDate) {
        filtri.inizioChiamata = {
          ...filtri.inizioChiamata,
          $lte: new Date(endDate)
        };
      }
      
      if (clienteId) {
        filtri.cliente = clienteId;
      }
      
      if (direzione) {
        filtri.direzione = direzione;
      }
      
      if (stato) {
        filtri.stato = stato;
      }
      
      // Query database
      const chiamate = await Chiamata.find(filtri)
        .populate('cliente', 'nomeCompleto telefono email')
        .populate('ordineCreato', 'numeroOrdine totale')
        .sort({ inizioChiamata: -1 })
        .limit(parseInt(limit));
      
      const totale = await Chiamata.countDocuments(filtri);
      
      res.json({
        success: true,
        chiamate,
        totale,
        filtri
      });
      
    } catch (error) {
      logger.error('Errore storico chiamate', { error: error.message });
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },
  
  /**
   * 🔵 TERMINA CHIAMATA
   */
  hangup: async (req, res) => {
    try {
      const { callId } = req.params;
      
      const result = await cx3Service.hangupCall(callId);
      
      if (result.success) {
        // Aggiorna stato in database
        const chiamata = await Chiamata.findOne({ callId });
        if (chiamata) {
          await chiamata.aggiornaStato('completed');
        }
      }
      
      res.json(result);
      
    } catch (error) {
      logger.error('Errore terminazione chiamata', { error: error.message });
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },
  
  /**
   * 🔵 METTI IN ATTESA
   */
  hold: async (req, res) => {
    try {
      const { callId } = req.params;
      
      const result = await cx3Service.holdCall(callId);
      
      res.json(result);
      
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },
  
  /**
   * 🔵 RIPRENDI CHIAMATA
   */
  unhold: async (req, res) => {
    try {
      const { callId } = req.params;
      
      const result = await cx3Service.unholdCall(callId);
      
      res.json(result);
      
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },
  
  /**
   * 🔵 TRASFERISCI CHIAMATA
   */
  transfer: async (req, res) => {
    try {
      const { callId } = req.params;
      const { destination } = req.body;
      
      if (!destination) {
        return res.status(400).json({ 
          success: false, 
          message: 'Destinazione obbligatoria' 
        });
      }
      
      const result = await cx3Service.transferCall(callId, destination);
      
      res.json(result);
      
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },
  
  /**
   * 🔵 WEBHOOK 3CX: Eventi chiamate
   */
  handleWebhook: async (req, res) => {
    try {
      const signature = req.headers['x-3cx-signature'];
      const payload = req.body;
      
      // Verifica autenticità webhook
      if (!cx3Service.verifyWebhookSignature(payload, signature)) {
        logger.warn('Webhook 3CX: Signature non valida');
        return res.status(401).json({ 
          success: false, 
          message: 'Signature non valida' 
        });
      }
      
      const { eventType, callId, data } = payload;
      
      logger.info('Webhook 3CX ricevuto', { eventType, callId });
      
      // Gestisci eventi
      switch (eventType) {
        case 'call.incoming':
          await handleIncomingCall(data);
          break;
          
        case 'call.answered':
          await handleCallAnswered(data);
          break;
          
        case 'call.ended':
          await handleCallEnded(data);
          break;
          
        case 'call.missed':
          await handleCallMissed(data);
          break;
          
        default:
          logger.info('Evento webhook non gestito', { eventType });
      }
      
      res.json({ success: true, received: true });
      
    } catch (error) {
      logger.error('Errore gestione webhook', { error: error.message });
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },
  
  /**
   * 🔵 DETTAGLIO CHIAMATA
   */
  getChiamata: async (req, res) => {
    try {
      const { id } = req.params;
      
      const chiamata = await Chiamata.findById(id)
        .populate('cliente', 'nomeCompleto telefono email statistiche')
        .populate('ordineCreato', 'numeroOrdine totale prodotti');
      
      if (!chiamata) {
        return res.status(404).json({ 
          success: false, 
          message: 'Chiamata non trovata' 
        });
      }
      
      res.json({
        success: true,
        chiamata
      });
      
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },
  
  /**
   * 🔵 AGGIORNA CHIAMATA
   */
  updateChiamata: async (req, res) => {
    try {
      const { id } = req.params;
      const { note, esito, tags } = req.body;
      
      const chiamata = await Chiamata.findById(id);
      
      if (!chiamata) {
        return res.status(404).json({ 
          success: false, 
          message: 'Chiamata non trovata' 
        });
      }
      
      if (note !== undefined) chiamata.note = note;
      if (esito !== undefined) chiamata.esito = esito;
      if (tags !== undefined) chiamata.tags = tags;
      
      await chiamata.save();
      
      logger.info('Chiamata aggiornata', { 
        chiamataId: id, 
        updates: { note, esito, tags } 
      });
      
      res.json({
        success: true,
        chiamata
      });
      
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },
  
  /**
   * 🔵 STATISTICHE CHIAMATE
   */
  getStatistiche: async (req, res) => {
    try {
      const { startDate, endDate, clienteId } = req.query;
      
      const filtri = {};
      
      if (startDate || endDate) {
        filtri.inizioChiamata = {};
        if (startDate) filtri.inizioChiamata.$gte = new Date(startDate);
        if (endDate) filtri.inizioChiamata.$lte = new Date(endDate);
      }
      
      if (clienteId) {
        filtri.cliente = clienteId;
      }
      
      const stats = await Chiamata.getStatistiche(filtri);
      
      res.json({
        success: true,
        statistiche: stats,
        filtri
      });
      
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },
  
  /**
   * 🔵 HEALTH CHECK
   */
  healthCheck: async (req, res) => {
    try {
      const health = await cx3Service.healthCheck();
      
      res.json(health);
      
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        status: 'error',
        error: error.message 
      });
    }
  }
};

/**
 * 🔹 HANDLER EVENTI WEBHOOK
 */

async function handleIncomingCall(data) {
  try {
    const { callId, callerNumber, extension } = data;
    
    // Cerca cliente
    const cliente = await Chiamata.cercaClienteDaNumero(callerNumber);
    
    // Crea record chiamata
    const chiamata = new Chiamata({
      callId,
      direzione: 'inbound',
      numero: callerNumber,
      cliente: cliente?._id || null,
      clienteNome: cliente?.nomeCompleto || 'Sconosciuto',
      interno: extension,
      stato: 'ringing',
      inizioChiamata: new Date()
    });
    
    await chiamata.save();
    
    logger.info('Chiamata in arrivo salvata', { 
      callId, 
      clienteNome: chiamata.clienteNome 
    });
    
    // TODO: Invia evento WebSocket al frontend per popup
    
  } catch (error) {
    logger.error('Errore gestione chiamata in arrivo', { error: error.message });
  }
}

async function handleCallAnswered(data) {
  try {
    const { callId } = data;
    
    const chiamata = await Chiamata.findOne({ callId });
    if (chiamata) {
      await chiamata.aggiornaStato('answered');
      logger.info('Chiamata risposta', { callId });
    }
    
  } catch (error) {
    logger.error('Errore gestione risposta chiamata', { error: error.message });
  }
}

async function handleCallEnded(data) {
  try {
    const { callId, duration } = data;
    
    const chiamata = await Chiamata.findOne({ callId });
    if (chiamata) {
      await chiamata.aggiornaStato('completed', duration);
      logger.info('Chiamata terminata', { callId, duration });
    }
    
  } catch (error) {
    logger.error('Errore gestione fine chiamata', { error: error.message });
  }
}

async function handleCallMissed(data) {
  try {
    const { callId } = data;
    
    const chiamata = await Chiamata.findOne({ callId });
    if (chiamata) {
      await chiamata.aggiornaStato('missed');
      logger.info('Chiamata persa', { callId });
      
      // TODO: Invia notifica push
    }
    
  } catch (error) {
    logger.error('Errore gestione chiamata persa', { error: error.message });
  }
}

export default cx3Controller;