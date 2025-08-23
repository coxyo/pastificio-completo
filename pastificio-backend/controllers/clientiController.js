// controllers/clientiController.js
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

// @desc    Ottieni tutti i clienti
// @route   GET /api/clienti
// @access  Private
export const getClienti = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      cerca,
      tipo,
      attivo
    } = req.query;

    // Costruisci query
    const query = {};
    
    if (cerca) {
      query.$or = [
        { nome: { $regex: cerca, $options: 'i' } },
        { cognome: { $regex: cerca, $options: 'i' } },
        { ragioneSociale: { $regex: cerca, $options: 'i' } },
        { email: { $regex: cerca, $options: 'i' } },
        { telefono: { $regex: cerca, $options: 'i' } }
      ];
    }

    if (tipo) {
      query.tipo = tipo;
    }

    if (attivo !== undefined && attivo !== '') {
      query.attivo = attivo === 'true';
    }

    // Paginazione
    const skip = (page - 1) * limit;

    // Query
    const clienti = await Cliente.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');

    const totalClienti = await Cliente.countDocuments(query);

    res.json({
      success: true,
      clienti,
      totalClienti,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalClienti / limit)
    });

  } catch (error) {
    logger.error('Errore recupero clienti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei clienti'
    });
  }
};

// @desc    Ottieni singolo cliente
// @route   GET /api/clienti/:id
// @access  Private
export const getCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente non trovato'
      });
    }

    res.json({
      success: true,
      cliente
    });

  } catch (error) {
    logger.error('Errore recupero cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del cliente'
    });
  }
};

// @desc    Crea nuovo cliente
// @route   POST /api/clienti
// @access  Private
export const creaCliente = async (req, res) => {
  try {
    // Aggiungi utente che ha creato il cliente
    req.body.creatoDA = req.user.id;

    const cliente = await Cliente.create(req.body);

    res.status(201).json({
      success: true,
      cliente
    });

  } catch (error) {
    logger.error('Errore creazione cliente:', error);
    
    // Gestisci errori di validazione
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    // Gestisci duplicati
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email o telefono già esistente'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Errore nella creazione del cliente'
    });
  }
};

// @desc    Aggiorna cliente
// @route   PUT /api/clienti/:id
// @access  Private
export const aggiornaCliente = async (req, res) => {
  try {
    // Rimuovi campi che non dovrebbero essere aggiornati
    delete req.body._id;
    delete req.body.createdAt;
    delete req.body.punti; // I punti si aggiungono con endpoint dedicato

    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente non trovato'
      });
    }

    res.json({
      success: true,
      cliente
    });

  } catch (error) {
    logger.error('Errore aggiornamento cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento del cliente'
    });
  }
};

// @desc    Elimina cliente (soft delete)
// @route   DELETE /api/clienti/:id
// @access  Private (Admin)
export const eliminaCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente non trovato'
      });
    }

    // Soft delete - imposta attivo a false
    cliente.attivo = false;
    await cliente.save();

    res.json({
      success: true,
      message: 'Cliente disattivato con successo'
    });

  } catch (error) {
    logger.error('Errore eliminazione cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione del cliente'
    });
  }
};

// @desc    Ottieni statistiche cliente
// @route   GET /api/clienti/:id/statistiche
// @access  Private
export const getStatisticheCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente non trovato'
      });
    }

    // Qui puoi implementare la logica per recuperare statistiche dettagliate
    // Per ora restituiamo quelle base dal cliente
    const statistiche = {
      cliente: {
        nome: cliente.nome,
        cognome: cliente.cognome,
        ragioneSociale: cliente.ragioneSociale,
        tipo: cliente.tipo
      },
      statistiche: cliente.statistiche,
      livelloFedelta: cliente.livelloFedelta,
      punti: cliente.punti,
      ultimiOrdini: [], // Da implementare con query su ordini
      prodottiPreferiti: [] // Da implementare con aggregazione
    };

    res.json({
      success: true,
      ...statistiche
    });

  } catch (error) {
    logger.error('Errore recupero statistiche cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche'
    });
  }
};

// @desc    Aggiungi punti fedeltà
// @route   POST /api/clienti/:id/punti
// @access  Private
export const aggiungiPunti = async (req, res) => {
  try {
    const { punti, motivo } = req.body;

    if (!punti || punti <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Specificare un numero di punti valido'
      });
    }

    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente non trovato'
      });
    }

    await cliente.aggiungiPunti(punti, motivo);

    res.json({
      success: true,
      cliente,
      message: `Aggiunti ${punti} punti con successo`
    });

  } catch (error) {
    logger.error('Errore aggiunta punti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiunta dei punti'
    });
  }
};

// @desc    Ottieni top clienti
// @route   GET /api/clienti/top
// @access  Private
export const getClientiTop = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const clienti = await Cliente.find({ attivo: true })
      .sort({ 'statistiche.totaleSpeso': -1 })
      .limit(parseInt(limit))
      .select('nome cognome ragioneSociale tipo statistiche livelloFedelta punti');

    res.json({
      success: true,
      clienti
    });

  } catch (error) {
    logger.error('Errore recupero top clienti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei top clienti'
    });
  }
};

// @desc    Ottieni ordini di un cliente
// @route   GET /api/clienti/:id/ordini
// @access  Private
export const getOrdiniCliente = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const Ordine = mongoose.models.Ordine || (await import('../models/ordine.js')).default;
    
    const ordini = await Ordine.find({ cliente: req.params.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .populate('creatoDa', 'nome cognome');

    const totale = await Ordine.countDocuments({ cliente: req.params.id });

    res.json({
      success: true,
      ordini,
      totale,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totale / limit)
    });

  } catch (error) {
    logger.error('Errore recupero ordini cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero degli ordini'
    });
  }
};

export default {
  getClienti,
  getCliente,
  creaCliente,
  aggiornaCliente,
  eliminaCliente,
  getStatisticheCliente,
  aggiungiPunti,
  getClientiTop,
  getOrdiniCliente
};