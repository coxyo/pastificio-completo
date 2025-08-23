// controllers/ingredientiController.js
import Ingrediente from '../models/ingrediente.js';
import logger from '../config/logger.js';

// Ottieni tutti gli ingredienti
export const getIngredienti = async (req, res) => {
  try {
    const { 
      categoria, 
      attivo, 
      sottoScorta,
      allergenico,
      cerca, 
      limit = 100, 
      page = 1,
      sort = 'nome'
    } = req.query;
    
    // Costruisci filtro
    const query = {};
    
    if (categoria) query.categoria = categoria;
    if (attivo !== undefined) query.attivo = attivo === 'true';
    if (allergenico !== undefined) query.allergenico = allergenico === 'true';
    if (cerca) {
      query.$or = [
        { nome: { $regex: cerca, $options: 'i' } },
        { descrizione: { $regex: cerca, $options: 'i' } },
        { codice: { $regex: cerca, $options: 'i' } }
      ];
    }
    
    // Esegui query base
    let queryBuilder = Ingrediente.find(query);
    
    // Se richiesto solo sotto scorta
    if (sottoScorta === 'true') {
      const ingredienti = await queryBuilder.exec();
      const sottoScortaIngredienti = ingredienti.filter(ing => {
        const quantitaTotale = ing.quantitaTotaleLotti;
        return quantitaTotale < ing.scorteMinime;
      });
      
      return res.json({
        success: true,
        count: sottoScortaIngredienti.length,
        data: sottoScortaIngredienti
      });
    }
    
    // Query normale con paginazione
    const total = await Ingrediente.countDocuments(query);
    
    const ingredienti = await queryBuilder
      .populate('fornitoriPrimari', 'ragioneSociale')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: ingredienti.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: ingredienti
    });
    
  } catch (error) {
    logger.error(`Errore recupero ingredienti: ${error.message}`, {
      service: 'ingredientiController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero degli ingredienti'
    });
  }
};

// Ottieni singolo ingrediente
export const getIngrediente = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.findById(req.params.id)
      .populate('fornitoriPrimari', 'ragioneSociale contatti');
    
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        error: 'Ingrediente non trovato'
      });
    }
    
    res.json({
      success: true,
      data: ingrediente
    });
    
  } catch (error) {
    logger.error(`Errore recupero ingrediente: ${error.message}`, {
      service: 'ingredientiController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dell\'ingrediente'
    });
  }
};

// Crea nuovo ingrediente
export const createIngrediente = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.create({
      ...req.body,
      createdBy: req.user.id
    });
    
    logger.info(`Nuovo ingrediente creato: ${ingrediente.nome}`, {
      service: 'ingredientiController',
      userId: req.user.id,
      ingredienteId: ingrediente._id
    });
    
    res.status(201).json({
      success: true,
      data: ingrediente
    });
    
  } catch (error) {
    logger.error(`Errore creazione ingrediente: ${error.message}`, {
      service: 'ingredientiController',
      error: error.stack
    });
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Esiste già un ingrediente con questo codice o barcode'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione dell\'ingrediente'
    });
  }
};

// Aggiorna ingrediente
export const updateIngrediente = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    );
    
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        error: 'Ingrediente non trovato'
      });
    }
    
    logger.info(`Ingrediente aggiornato: ${ingrediente.nome}`, {
      service: 'ingredientiController',
      userId: req.user.id,
      ingredienteId: ingrediente._id
    });
    
    res.json({
      success: true,
      data: ingrediente
    });
    
  } catch (error) {
    logger.error(`Errore aggiornamento ingrediente: ${error.message}`, {
      service: 'ingredientiController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento dell\'ingrediente'
    });
  }
};

// Elimina ingrediente
export const deleteIngrediente = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.findById(req.params.id);
    
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        error: 'Ingrediente non trovato'
      });
    }
    
    // Soft delete - disattiva invece di eliminare
    ingrediente.attivo = false;
    await ingrediente.save();
    
    logger.info(`Ingrediente disattivato: ${ingrediente.nome}`, {
      service: 'ingredientiController',
      userId: req.user.id,
      ingredienteId: ingrediente._id
    });
    
    res.json({
      success: true,
      data: {}
    });
    
  } catch (error) {
    logger.error(`Errore eliminazione ingrediente: ${error.message}`, {
      service: 'ingredientiController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione dell\'ingrediente'
    });
  }
};

// Aggiungi lotto
export const aggiungiLotto = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.findById(req.params.id);
    
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        error: 'Ingrediente non trovato'
      });
    }
    
    ingrediente.lotti.push({
      ...req.body,
      dataAcquisto: new Date()
    });
    
    await ingrediente.save();
    
    logger.info(`Lotto aggiunto a ingrediente: ${ingrediente.nome}`, {
      service: 'ingredientiController',
      userId: req.user.id,
      ingredienteId: ingrediente._id,
      lotto: req.body.codice
    });
    
    res.json({
      success: true,
      data: ingrediente
    });
    
  } catch (error) {
    logger.error(`Errore aggiunta lotto: ${error.message}`, {
      service: 'ingredientiController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiunta del lotto'
    });
  }
};

// Ottieni ingredienti sotto scorta
export const getIngredientiSottoScorta = async (req, res) => {
  try {
    const ingredienti = await Ingrediente.getInSottoSoglia();
    
    res.json({
      success: true,
      count: ingredienti.length,
      data: ingredienti
    });
    
  } catch (error) {
    logger.error(`Errore recupero ingredienti sotto scorta: ${error.message}`, {
      service: 'ingredientiController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero degli ingredienti sotto scorta'
    });
  }
};

// Ottieni ingredienti in scadenza
export const getIngredientiInScadenza = async (req, res) => {
  try {
    const { giorni = 30 } = req.query;
    const ingredienti = await Ingrediente.getInScadenza(parseInt(giorni));
    
    res.json({
      success: true,
      count: ingredienti.length,
      data: ingredienti
    });
    
  } catch (error) {
    logger.error(`Errore recupero ingredienti in scadenza: ${error.message}`, {
      service: 'ingredientiController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero degli ingredienti in scadenza'
    });
  }
};

export default {
  getIngredienti,
  getIngrediente,
  createIngrediente,
  updateIngrediente,
  deleteIngrediente,
  aggiungiLotto,
  getIngredientiSottoScorta,
  getIngredientiInScadenza
};