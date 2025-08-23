import Fornitore from '../models/fornitore.js';
import { Ingrediente } from '../models/magazzino.js';
import logger from '../config/logger.js';
import { io } from '../server.js';

/**
 * @description Ottiene tutti i fornitori con filtri opzionali
 * @route GET /api/fornitori
 * @access Private
 */
export const getFornitori = async (req, res) => {
  try {
    const {
      search,
      categoria,
      attivo,
      sort = 'nome',
      order = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    // Costruisci il filtro
    const filter = {};
    
    if (search) {
      filter.$or = [
        { nome: { $regex: search, $options: 'i' } },
        { partitaIva: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (categoria) {
      filter.categorieProdotti = categoria;
    }
    
    if (attivo !== undefined) {
      filter.attivo = attivo === 'true';
    }

    // Calcola il numero totale di documenti per la paginazione
    const totalDocs = await Fornitore.countDocuments(filter);
    
    // Esegui la query con paginazione e ordinamento
    const fornitori = await Fornitore.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    res.status(200).json({
      success: true,
      count: fornitori.length,
      totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
      currentPage: Number(page),
      data: fornitori
    });
  } catch (err) {
    logger.error(`Errore getFornitori: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei fornitori'
    });
  }
};

/**
 * @description Ottiene un singolo fornitore per ID
 * @route GET /api/fornitori/:id
 * @access Private
 */
export const getFornitore = async (req, res) => {
  try {
    const fornitore = await Fornitore.findById(req.params.id);
    
    if (!fornitore) {
      return res.status(404).json({
        success: false,
        error: 'Fornitore non trovato'
      });
    }
    
    // Ottieni anche gli ingredienti associati a questo fornitore
    const ingredienti = await Ingrediente.find({ 
      fornitorePreferito: req.params.id 
    }).select('nome categoria quantita unitaMisura prezzoUnitario');
    
    res.status(200).json({
      success: true,
      data: fornitore,
      ingredienti
    });
  } catch (err) {
    logger.error(`Errore getFornitore: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del fornitore'
    });
  }
};

/**
 * @description Crea un nuovo fornitore
 * @route POST /api/fornitori
 * @access Private
 */
export const createFornitore = async (req, res) => {
  try {
    const fornitore = await Fornitore.create(req.body);
    
    // Notifica via WebSocket
    io.emit('fornitore_update', {
      action: 'create_fornitore',
      fornitore: fornitore
    });
    
    logger.info(`Nuovo fornitore creato: ${fornitore.nome} da ${req.user.nome}`);
    
    res.status(201).json({
      success: true,
      data: fornitore
    });
  } catch (err) {
    logger.error(`Errore createFornitore: ${err.message}`);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione del fornitore'
    });
  }
};

/**
 * @description Aggiorna un fornitore esistente
 * @route PUT /api/fornitori/:id
 * @access Private
 */
export const updateFornitore = async (req, res) => {
  try {
    const fornitore = await Fornitore.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!fornitore) {
      return res.status(404).json({
        success: false,
        error: 'Fornitore non trovato'
      });
    }
    
    // Notifica via WebSocket
    io.emit('fornitore_update', {
      action: 'update_fornitore',
      fornitore: fornitore
    });
    
    logger.info(`Fornitore aggiornato: ${fornitore.nome} da ${req.user.nome}`);
    
    res.status(200).json({
      success: true,
      data: fornitore
    });
  } catch (err) {
    logger.error(`Errore updateFornitore: ${err.message}`);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento del fornitore'
    });
  }
};

/**
 * @description Elimina un fornitore
 * @route DELETE /api/fornitori/:id
 * @access Private
 */
export const deleteFornitore = async (req, res) => {
  try {
    // Verifica se ci sono ingredienti associati al fornitore
    const ingredientiCount = await Ingrediente.countDocuments({ 
      fornitorePreferito: req.params.id 
    });
    
    if (ingredientiCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Il fornitore ha ${ingredientiCount} ingredienti associati. Non è possibile eliminarlo.`
      });
    }
    
    const fornitore = await Fornitore.findByIdAndDelete(req.params.id);
    
    if (!fornitore) {
      return res.status(404).json({
        success: false,
        error: 'Fornitore non trovato'
      });
    }
    
    // Notifica via WebSocket
    io.emit('fornitore_update', {
      action: 'delete_fornitore',
      id: req.params.id
    });
    
    logger.info(`Fornitore eliminato: ${fornitore.nome} da ${req.user.nome}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    logger.error(`Errore deleteFornitore: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione del fornitore'
    });
  }
};

/**
 * @description Ottiene fornitori per categoria
 * @route GET /api/fornitori/categoria/:categoria
 * @access Private
 */
export const getFornitoriByCategoria = async (req, res) => {
  try {
    const fornitori = await Fornitore.findByCategoria(req.params.categoria);
    
    res.status(200).json({
      success: true,
      count: fornitori.length,
      data: fornitori
    });
  } catch (err) {
    logger.error(`Errore getFornitoriByCategoria: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei fornitori per categoria'
    });
  }
};

/**
 * @description Ottiene solo i fornitori attivi
 * @route GET /api/fornitori/attivi
 * @access Private
 */
export const getFornitoriAttivi = async (req, res) => {
  try {
    const fornitori = await Fornitore.findAttivi();
    
    res.status(200).json({
      success: true,
      count: fornitori.length,
      data: fornitori
    });
  } catch (err) {
    logger.error(`Errore getFornitoriAttivi: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei fornitori attivi'
    });
  }
};