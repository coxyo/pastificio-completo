// controllers/cx3Controller.js - AGGIORNAMENTO con gestione chiamate

import Chiamata from '../models/Chiamata.js';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';

/**
 * WEBHOOK 3CX - Riceve eventi chiamate
 * 
 * Eventi supportati:
 * - call.ringing (chiamata in arrivo)
 * - call.answered (chiamata risposta)
 * - call.ended (chiamata terminata)
 * - call.missed (chiamata persa)
 */
export const handleWebhook = async (req, res) => {
  try {
    const evento = req.body;
    
    logger.info('[3CX WEBHOOK] Evento ricevuto:', {
      tipo: evento.eventType,
      callId: evento.callId,
      numero: evento.callerNumber || evento.calledNumber
    });

    // Gestisci evento in base al tipo
    switch (evento.eventType) {
      case 'call.ringing':
      case 'call.inbound':
        await handleIncomingCall(evento);
        break;

      case 'call.answered':
        await handleAnsweredCall(evento);
        break;

      case 'call.ended':
      case 'call.hangup':
        await handleEndedCall(evento);
        break;

      case 'call.missed':
        await handleMissedCall(evento);
        break;

      case 'call.outbound':
        await handleOutgoingCall(evento);
        break;

      default:
        logger.warn('[3CX WEBHOOK] Evento non gestito:', evento.eventType);
    }

    // Rispondi sempre 200 OK a 3CX
    res.status(200).json({
      success: true,
      message: 'Webhook ricevuto',
      eventType: evento.eventType
    });

  } catch (error) {
    logger.error('[3CX WEBHOOK] Errore:', error);
    
    // Rispondi sempre 200 anche in caso di errore
    // per non far riprovare 3CX continuamente
    res.status(200).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Gestione chiamata in arrivo
 */
async function handleIncomingCall(evento) {
  try {
    const numeroChiamante = pulisciNumero(evento.callerNumber);
    const numeroChiamato = pulisciNumero(evento.calledNumber);

    logger.info('[CHIAMATA IN ARRIVO]', {
      callId: evento.callId,
      da: numeroChiamante,
      a: numeroChiamato
    });

    // Cerca cliente per numero
    const cliente = await Cliente.findOne({
      telefono: { $regex: numeroChiamante.slice(-9), $options: 'i' }
    });

    // Crea record chiamata
    const chiamata = new Chiamata({
      callId: evento.callId,
      tipo: 'inbound',
      numeroChiamante,
      numeroChiamato,
      cliente: cliente?._id,
      clienteNome: cliente ? `${cliente.nome} ${cliente.cognome}` : null,
      estensione: evento.extension,
      stato: 'ringing',
      dataOraInizio: new Date(),
      cx3Data: {
        didNumber: evento.didNumber,
        queueName: evento.queueName
      },
      noteAutomatiche: cliente 
        ? `Cliente: ${cliente.codiceCliente} - ${cliente.nome} ${cliente.cognome}`
        : `Chiamata da numero sconosciuto: ${numeroChiamante}`
    });

    await chiamata.save();

    // Emetti evento WebSocket per popup frontend
    if (global.io) {
      global.io.emit('chiamata:inbound', {
        callId: evento.callId,
        numero: numeroChiamante,
        cliente: cliente ? {
          id: cliente._id,
          nome: cliente.nome,
          cognome: cliente.cognome,
          telefono: cliente.telefono,
          email: cliente.email,
          codiceCliente: cliente.codiceCliente,
          livelloFedelta: cliente.livelloFedelta,
          punti: cliente.punti
        } : null,
        timestamp: new Date()
      });

      logger.info('[WEBSOCKET] Evento chiamata:inbound emesso', {
        callId: evento.callId,
        hasCliente: !!cliente
      });
    }

    logger.info('[CHIAMATA IN ARRIVO] Record creato:', chiamata._id);

  } catch (error) {
    logger.error('[CHIAMATA IN ARRIVO] Errore:', error);
    throw error;
  }
}

/**
 * Gestione chiamata risposta
 */
async function handleAnsweredCall(evento) {
  try {
    logger.info('[CHIAMATA RISPOSTA]', {
      callId: evento.callId
    });

    const chiamata = await Chiamata.findOne({ callId: evento.callId });

    if (!chiamata) {
      logger.warn('[CHIAMATA RISPOSTA] Chiamata non trovata:', evento.callId);
      return;
    }

    await chiamata.aggiornaStato('answered', {
      dataOraRisposta: new Date()
    });

    // Emetti evento WebSocket
    if (global.io) {
      global.io.emit('chiamata:answered', {
        callId: evento.callId,
        timestamp: new Date()
      });
    }

    logger.info('[CHIAMATA RISPOSTA] Aggiornata:', chiamata._id);

  } catch (error) {
    logger.error('[CHIAMATA RISPOSTA] Errore:', error);
    throw error;
  }
}

/**
 * Gestione chiamata terminata
 */
async function handleEndedCall(evento) {
  try {
    logger.info('[CHIAMATA TERMINATA]', {
      callId: evento.callId,
      durata: evento.duration
    });

    const chiamata = await Chiamata.findOne({ callId: evento.callId });

    if (!chiamata) {
      logger.warn('[CHIAMATA TERMINATA] Chiamata non trovata:', evento.callId);
      return;
    }

    await chiamata.aggiornaStato('ended', {
      dataOraFine: new Date(),
      durataChiamata: evento.duration || 0
    });

    // Emetti evento WebSocket
    if (global.io) {
      global.io.emit('chiamata:ended', {
        callId: evento.callId,
        durata: chiamata.durataChiamata,
        timestamp: new Date()
      });
    }

    logger.info('[CHIAMATA TERMINATA] Aggiornata:', {
      id: chiamata._id,
      durata: chiamata.durataFormattata
    });

  } catch (error) {
    logger.error('[CHIAMATA TERMINATA] Errore:', error);
    throw error;
  }
}

/**
 * Gestione chiamata persa
 */
async function handleMissedCall(evento) {
  try {
    logger.info('[CHIAMATA PERSA]', {
      callId: evento.callId,
      numero: evento.callerNumber
    });

    const chiamata = await Chiamata.findOne({ callId: evento.callId });

    if (!chiamata) {
      // Crea record se non esiste
      const numeroChiamante = pulisciNumero(evento.callerNumber);
      const cliente = await Cliente.findOne({
        telefono: { $regex: numeroChiamante.slice(-9), $options: 'i' }
      });

      const nuovaChiamata = new Chiamata({
        callId: evento.callId,
        tipo: 'inbound',
        numeroChiamante,
        numeroChiamato: pulisciNumero(evento.calledNumber),
        cliente: cliente?._id,
        clienteNome: cliente ? `${cliente.nome} ${cliente.cognome}` : null,
        stato: 'missed',
        esito: 'persa',
        dataOraInizio: new Date(),
        dataOraFine: new Date(),
        richiedeFollowUp: true,
        noteAutomatiche: 'Chiamata persa - richiamare'
      });

      await nuovaChiamata.save();

      // Emetti evento WebSocket per alert
      if (global.io) {
        global.io.emit('chiamata:missed', {
          callId: evento.callId,
          numero: numeroChiamante,
          cliente: cliente ? {
            id: cliente._id,
            nome: cliente.nome,
            cognome: cliente.cognome
          } : null,
          timestamp: new Date()
        });
      }

      logger.info('[CHIAMATA PERSA] Record creato:', nuovaChiamata._id);
      return;
    }

    await chiamata.aggiornaStato('missed', {
      dataOraFine: new Date(),
      esito: 'persa',
      richiedeFollowUp: true
    });

    // Emetti evento WebSocket
    if (global.io) {
      global.io.emit('chiamata:missed', {
        callId: evento.callId,
        numero: chiamata.numeroChiamante,
        cliente: chiamata.cliente ? {
          id: chiamata.cliente,
          nome: chiamata.clienteNome
        } : null,
        timestamp: new Date()
      });
    }

    logger.info('[CHIAMATA PERSA] Aggiornata:', chiamata._id);

  } catch (error) {
    logger.error('[CHIAMATA PERSA] Errore:', error);
    throw error;
  }
}

/**
 * Gestione chiamata in uscita
 */
async function handleOutgoingCall(evento) {
  try {
    const numeroChiamato = pulisciNumero(evento.calledNumber);
    
    logger.info('[CHIAMATA IN USCITA]', {
      callId: evento.callId,
      a: numeroChiamato
    });

    // Cerca cliente
    const cliente = await Cliente.findOne({
      telefono: { $regex: numeroChiamato.slice(-9), $options: 'i' }
    });

    const chiamata = new Chiamata({
      callId: evento.callId,
      tipo: 'outbound',
      numeroChiamante: pulisciNumero(evento.callerNumber),
      numeroChiamato,
      cliente: cliente?._id,
      clienteNome: cliente ? `${cliente.nome} ${cliente.cognome}` : null,
      estensione: evento.extension,
      stato: 'ringing',
      dataOraInizio: new Date()
    });

    await chiamata.save();

    logger.info('[CHIAMATA IN USCITA] Record creato:', chiamata._id);

  } catch (error) {
    logger.error('[CHIAMATA IN USCITA] Errore:', error);
    throw error;
  }
}

/**
 * Utility: pulisci numero telefono
 */
function pulisciNumero(numero) {
  if (!numero) return '';
  return numero.replace(/[\s\-\(\)]/g, '');
}

/**
 * API: Ottieni storico chiamate
 */
export const getHistory = async (req, res) => {
  try {
    const {
      limit = 50,
      startDate,
      endDate,
      clienteId,
      tipo,
      stato,
      esito
    } = req.query;

    const filtri = {};

    if (startDate || endDate) {
      filtri.dataOraInizio = {};
      if (startDate) filtri.dataOraInizio.$gte = new Date(startDate);
      if (endDate) filtri.dataOraInizio.$lte = new Date(endDate);
    }

    if (clienteId) filtri.cliente = clienteId;
    if (tipo) filtri.tipo = tipo;
    if (stato) filtri.stato = stato;
    if (esito) filtri.esito = esito;

    const chiamate = await Chiamata.findRecenti(parseInt(limit), filtri);

    res.json({
      success: true,
      count: chiamate.length,
      chiamate
    });

  } catch (error) {
    logger.error('[GET HISTORY] Errore:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * API: Ottieni statistiche chiamate
 */
export const getStatistiche = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      clienteId
    } = req.query;

    const dataInizio = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dataFine = endDate ? new Date(endDate) : new Date();

    const filtri = {};
    if (clienteId) filtri.cliente = clienteId;

    const stats = await Chiamata.getStatistiche(dataInizio, dataFine, filtri);

    res.json({
      success: true,
      periodo: {
        da: dataInizio,
        a: dataFine
      },
      statistiche: stats
    });

  } catch (error) {
    logger.error('[GET STATISTICHE] Errore:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * API: Aggiorna note chiamata
 */
export const updateChiamata = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, tags, followUpData, followUpNote } = req.body;

    const chiamata = await Chiamata.findById(id);

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        error: 'Chiamata non trovata'
      });
    }

    if (note) chiamata.note = note;
    if (tags) chiamata.tags = tags;
    if (followUpData) {
      chiamata.richiedeFollowUp = true;
      chiamata.followUpData = new Date(followUpData);
      if (followUpNote) chiamata.followUpNote = followUpNote;
    }

    await chiamata.save();

    res.json({
      success: true,
      chiamata
    });

  } catch (error) {
    logger.error('[UPDATE CHIAMATA] Errore:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  handleWebhook,
  getHistory,
  getStatistiche,
  updateChiamata
};