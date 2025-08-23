// controllers/fornitoreController.js
import Fornitore from '../models/fornitore.js';
import OrdineFornitore from '../models/ordineFornitore.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

// Ottieni tutti i fornitori
export const getFornitori = async (req, res) => {
  try {
    const { 
      categoria, 
      attivo, 
      cerca, 
      limit = 50, 
      page = 1,
      sort = 'ragioneSociale'
    } = req.query;
    
    // Costruisci il filtro di query
    const query = {};
    
    if (categoria) {
      query.categorieMerceologiche = categoria;
    }
    
    if (attivo !== undefined) {
      query.attivo = attivo === 'true';
    }
    
    if (cerca) {
      query.$or = [
        { ragioneSociale: { $regex: cerca, $options: 'i' } },
        { partitaIva: { $regex: cerca, $options: 'i' } },
        { codiceFiscale: { $regex: cerca, $options: 'i' } }
      ];
    }
    
    // Conta i documenti totali per la paginazione
    const total = await Fornitore.countDocuments(query);
    
    // Costruisci l'oggetto sort
    const sortObj = {};
    sort.split(',').forEach(s => {
      const [field, order] = s.startsWith('-') 
        ? [s.substring(1), -1] 
        : [s, 1];
      sortObj[field] = order;
    });
    
    // Esegui la query con paginazione
    const fornitori = await Fornitore.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      count: fornitori.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: fornitori
    });
  } catch (error) {
    logger.error(`Errore nel recupero dei fornitori: ${error.message}`, {
      service: 'fornitoreController',
      error
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei fornitori'
    });
  }
};

// Ottieni un singolo fornitore
export const getFornitore = async (req, res) => {
  try {
    const fornitore = await Fornitore.findById(req.params.id);
    
    if (!fornitore) {
      return res.status(404).json({
        success: false,
        error: 'Fornitore non trovato'
      });
    }
    
    // Ottieni gli ultimi ordini se esistono
    const ordiniRecenti = await OrdineFornitore.find({ fornitore: fornitore._id })
      .sort({ dataOrdine: -1 })
      .limit(10);
    
    return res.status(200).json({
      success: true,
      data: {
        ...fornitore.toObject(),
        ordiniRecenti
      }
    });
  } catch (error) {
    logger.error(`Errore nel recupero del fornitore: ${error.message}`, {
      service: 'fornitoreController',
      error,
      id: req.params.id
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nel recupero del fornitore'
    });
  }
};

// Crea un nuovo fornitore
export const createFornitore = async (req, res) => {
  try {
    const fornitore = await Fornitore.create({
      ...req.body,
      createdBy: req.user.id
    });
    
    logger.info(`Nuovo fornitore creato: ${fornitore.ragioneSociale}`, {
      service: 'fornitoreController',
      userId: req.user.id,
      fornitoreId: fornitore._id
    });
    
    // Notifica WebSocket
    const io = req.app.get('io');
    io.emit('fornitore:created', fornitore);
    
    return res.status(201).json({
      success: true,
      data: fornitore
    });
  } catch (error) {
    logger.error(`Errore nella creazione del fornitore: ${error.message}`, {
      service: 'fornitoreController',
      error,
      userId: req.user.id
    });
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Esiste già un fornitore con questa ragione sociale o P.IVA'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Errore nella creazione del fornitore'
    });
  }
};

// Aggiorna un fornitore
export const updateFornitore = async (req, res) => {
  try {
    const fornitore = await Fornitore.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!fornitore) {
      return res.status(404).json({
        success: false,
        error: 'Fornitore non trovato'
      });
    }
    
    logger.info(`Fornitore aggiornato: ${fornitore.ragioneSociale}`, {
      service: 'fornitoreController',
      userId: req.user.id,
      fornitoreId: fornitore._id
    });
    
    // Notifica WebSocket
    const io = req.app.get('io');
    io.emit('fornitore:updated', fornitore);
    
    return res.status(200).json({
      success: true,
      data: fornitore
    });
  } catch (error) {
    logger.error(`Errore nell'aggiornamento del fornitore: ${error.message}`, {
      service: 'fornitoreController',
      error,
      userId: req.user.id,
      id: req.params.id
    });
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Esiste già un fornitore con questa ragione sociale o P.IVA'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento del fornitore'
    });
  }
};

// Elimina fornitore (soft delete)
export const deleteFornitore = async (req, res) => {
  try {
    const fornitore = await Fornitore.findByIdAndUpdate(
      req.params.id,
      { 
        attivo: false,
        deletedBy: req.user.id,
        deletedAt: new Date()
      },
      { new: true }
    );
    
    if (!fornitore) {
      return res.status(404).json({
        success: false,
        error: 'Fornitore non trovato'
      });
    }
    
    logger.info(`Fornitore disattivato: ${fornitore.ragioneSociale}`, {
      service: 'fornitoreController',
      userId: req.user.id,
      fornitoreId: fornitore._id
    });
    
    // Notifica WebSocket
    const io = req.app.get('io');
    io.emit('fornitore:deleted', { _id: fornitore._id });
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Errore eliminazione fornitore: ${error.message}`, {
      service: 'fornitoreController',
      error,
      userId: req.user.id,
      id: req.params.id
    });
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione del fornitore'
    });
  }
};

// Ottieni fornitori per categoria
export const getFornitoriByCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    const fornitori = await Fornitore.find({
      categorieMerceologiche: categoria,
      attivo: true
    }).sort('ragioneSociale');
    
    res.json({
      success: true,
      count: fornitori.length,
      data: fornitori
    });
  } catch (error) {
    logger.error(`Errore recupero fornitori per categoria: ${error.message}`, {
      service: 'fornitoreController',
      error,
      categoria: req.params.categoria
    });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei fornitori'
    });
  }
};

// Ottieni fornitori attivi
export const getFornitoriAttivi = async (req, res) => {
  try {
    const fornitori = await Fornitore.find({ attivo: true })
      .sort('ragioneSociale')
      .select('ragioneSociale partitaIva categorieMerceologiche contatti');
    
    res.json({
      success: true,
      count: fornitori.length,
      data: fornitori
    });
  } catch (error) {
    logger.error(`Errore recupero fornitori attivi: ${error.message}`, {
      service: 'fornitoreController',
      error
    });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei fornitori attivi'
    });
  }
};

// Ottieni le statistiche fornitori
export const getStatisticheFornitori = async (req, res) => {
  try {
    // Conta fornitori per categoria
    const perCategoria = await Fornitore.aggregate([
      { $match: { attivo: true } },
      { $unwind: '$categorieMerceologiche' },
      { $group: { _id: '$categorieMerceologiche', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Conta fornitori attivi/inattivi
    const perStato = await Fornitore.aggregate([
      { $group: { _id: '$attivo', count: { $sum: 1 } } }
    ]);
    
    // Conta totale fornitori
    const totale = await Fornitore.countDocuments();
    
    // Ottieni top fornitori per numero ordini (se OrdineFornitore esiste)
    let topFornitori = [];
    try {
      topFornitori = await OrdineFornitore.aggregate([
        { $match: { stato: { $ne: 'annullato' } } },
        { $group: { 
          _id: '$fornitore', 
          countOrdini: { $sum: 1 },
          totaleSpeso: { $sum: '$totale' }
        }},
        { $sort: { totaleSpeso: -1 } },
        { $limit: 5 },
        { $lookup: {
          from: 'fornitori',
          localField: '_id',
          foreignField: '_id',
          as: 'fornitoreInfo'
        }},
        { $unwind: '$fornitoreInfo' },
        { $project: {
          _id: 1,
          countOrdini: 1,
          totaleSpeso: 1,
          ragioneSociale: '$fornitoreInfo.ragioneSociale'
        }}
      ]);
    } catch (err) {
      logger.warn('OrdineFornitore collection non trovata', { error: err.message });
    }
    
    // Fornitori aggiunti di recente
    const fornitoriRecenti = await Fornitore.find({ attivo: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('ragioneSociale createdAt categorieMerceologiche');
    
    return res.status(200).json({
      success: true,
      data: {
        totale,
        attivi: perStato.find(s => s._id === true)?.count || 0,
        inattivi: perStato.find(s => s._id === false)?.count || 0,
        perCategoria,
        topFornitori,
        fornitoriRecenti
      }
    });
  } catch (error) {
    logger.error(`Errore nel recupero delle statistiche fornitori: ${error.message}`, {
      service: 'fornitoreController',
      error
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche fornitori'
    });
  }
};

// Ottieni gli ordini di un fornitore
export const getOrdiniFornitore = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const ordini = await OrdineFornitore.find({ fornitore: id })
      .sort({ dataOrdine: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('articoli.ingrediente', 'nome codice');
    
    const total = await OrdineFornitore.countDocuments({ fornitore: id });
    
    res.json({
      success: true,
      count: ordini.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: ordini
    });
  } catch (error) {
    logger.error(`Errore recupero ordini fornitore: ${error.message}`, {
      service: 'fornitoreController',
      error,
      fornitoreId: req.params.id
    });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero degli ordini'
    });
  }
};

export default {
  getFornitori,
  getFornitore,
  createFornitore,
  updateFornitore,
  deleteFornitore,
  getFornitoriByCategoria,
  getFornitoriAttivi,
  getStatisticheFornitori,
  getOrdiniFornitore
};