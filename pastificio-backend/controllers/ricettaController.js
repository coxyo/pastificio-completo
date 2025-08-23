// controllers/ricettaController.js
import Ricetta from '../models/ricetta.js';
import Ingrediente from '../models/ingrediente.js';
import logger from '../config/logger.js';

// Get all recipes
export const getRicette = async (req, res) => {
  try {
    const { categoria, attivo } = req.query;
    const query = {};
    
    if (categoria) query.categoria = categoria;
    if (attivo !== undefined) query.attivo = attivo === 'true';
    
    const ricette = await Ricetta.find(query).populate('ingredienti.ingrediente');
    
    res.status(200).json({
      success: true,
      count: ricette.length,
      data: ricette
    });
  } catch (error) {
    logger.error(`Errore nel recupero ricette: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle ricette'
    });
  }
};

// Get single recipe
export const getRicetta = async (req, res) => {
  try {
    const ricetta = await Ricetta.findById(req.params.id).populate('ingredienti.ingrediente');
    
    if (!ricetta) {
      return res.status(404).json({
        success: false,
        error: 'Ricetta non trovata'
      });
    }
    
    res.status(200).json({
      success: true,
      data: ricetta
    });
  } catch (error) {
    logger.error(`Errore nel recupero ricetta: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero della ricetta'
    });
  }
};

// Create new recipe
export const createRicetta = async (req, res) => {
  try {
    const ricetta = await Ricetta.create(req.body);
    
    // Calcola il costo della ricetta
    await ricetta.calcolaCosto();
    await ricetta.save();
    
    res.status(201).json({
      success: true,
      data: ricetta
    });
  } catch (error) {
    logger.error(`Errore nella creazione ricetta: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update recipe
export const updateRicetta = async (req, res) => {
  try {
    let ricetta = await Ricetta.findById(req.params.id);
    
    if (!ricetta) {
      return res.status(404).json({
        success: false,
        error: 'Ricetta non trovata'
      });
    }
    
    ricetta = await Ricetta.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    // Ricalcola il costo
    await ricetta.populate('ingredienti.ingrediente');
    await ricetta.calcolaCosto();
    await ricetta.save();
    
    res.status(200).json({
      success: true,
      data: ricetta
    });
  } catch (error) {
    logger.error(`Errore nell'aggiornamento ricetta: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete recipe
export const deleteRicetta = async (req, res) => {
  try {
    const ricetta = await Ricetta.findById(req.params.id);
    
    if (!ricetta) {
      return res.status(404).json({
        success: false,
        error: 'Ricetta non trovata'
      });
    }
    
    await ricetta.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Errore nell'eliminazione ricetta: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nell'eliminazione della ricetta'
    });
  }
};

// Calcola costo ricetta
export const calcolaCostoRicetta = async (req, res) => {
  try {
    const ricetta = await Ricetta.findById(req.params.id).populate('ingredienti.ingrediente');
    
    if (!ricetta) {
      return res.status(404).json({
        success: false,
        error: 'Ricetta non trovata'
      });
    }
    
    const costo = await ricetta.calcolaCosto();
    await ricetta.save();
    
    res.status(200).json({
      success: true,
      data: {
        id: ricetta._id,
        nome: ricetta.nome,
        costo: costo
      }
    });
  } catch (error) {
    logger.error(`Errore nel calcolo costo ricetta: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel calcolo del costo della ricetta'
    });
  }
};