// controllers/ordineFornitoreController.js
import OrdineFornitore from '../models/ordineFornitore.js';
import Ingrediente from '../models/ingrediente.js';
import Fornitore from '../models/fornitore.js';
import Movimento from '../models/movimento.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

// Ottieni tutti gli ordini ai fornitori
export const getOrdini = async (req, res) => {
  try {
    const { 
      fornitore, 
      stato, 
      dataInizio, 
      dataFine, 
      limit = 50, 
      page = 1,
      sort = '-dataOrdine'
    } = req.query;
    
    // Costruisci il filtro di query
    const query = {};
    
    if (fornitore) {
      query.fornitore = fornitore;
    }
    
    if (stato) {
      query.stato = stato;
    }
    
    if (dataInizio || dataFine) {
      query.dataOrdine = {};
      
      if (dataInizio) {
        query.dataOrdine.$gte = new Date(dataInizio);
      }
      
      if (dataFine) {
        // Aggiungi un giorno alla data fine per includerla completamente
        const dateFineObj = new Date(dataFine);
        dateFineObj.setDate(dateFineObj.getDate() + 1);
        query.dataOrdine.$lt = dateFineObj;
      }
    }
    
    // Conta i documenti totali per la paginazione
    const total = await OrdineFornitore.countDocuments(query);
    
    // Costruisci l'oggetto sort
    const sortObj = {};
    sort.split(',').forEach(s => {
     const [field, order] = s.startsWith('-') 
        ? [s.substring(1), -1] 
        : [s, 1];
      sortObj[field] = order;
    });
    
    // Esegui la query con paginazione
    const ordini = await OrdineFornitore.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('fornitore', 'ragioneSociale')
      .populate('utente', 'nome cognome');
    
    return res.status(200).json({
      success: true,
      count: ordini.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: ordini
    });
  } catch (error) {
    logger.error(`Errore nel recupero degli ordini: ${error.message}`, {
      service: 'ordineFornitoreController',
      error
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nel recupero degli ordini'
    });
  }
};

// Ottieni un singolo ordine
export const getOrdine = async (req, res) => {
  try {
    const ordine = await OrdineFornitore.findById(req.params.id)
      .populate('fornitore')
      .populate('utente', 'nome cognome')
      .populate('prodotti.ingrediente');
    
    if (!ordine) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: ordine
    });
  } catch (error) {
    logger.error(`Errore nel recupero dell'ordine: ${error.message}`, {
      service: 'ordineFornitoreController',
      error,
      id: req.params.id
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nel recupero dell\'ordine'
    });
  }
};

// Crea un nuovo ordine
export const createOrdine = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Validazione dei dati di input
    const { fornitore, prodotti, ...altriDati } = req.body;
    
    // Verifica fornitore
    const fornitoreObj = await Fornitore.findById(fornitore);
    if (!fornitoreObj) {
      return res.status(400).json({
        success: false,
        error: 'Fornitore non valido'
      });
    }
    
    // Calcola gli importi
    let totaleImponibile = 0;
    
    // Elabora i prodotti e calcola gli importi
    const prodottiElaborati = await Promise.all(prodotti.map(async (prodotto) => {
      // Verifica ingrediente
      const ingrediente = await Ingrediente.findById(prodotto.ingrediente);
      if (!ingrediente) {
        throw new Error(`Ingrediente non valido: ${prodotto.ingrediente}`);
      }
      
      // Calcola importo
      const importo = prodotto.quantita * prodotto.prezzoUnitario;
      totaleImponibile += importo;
      
      return {
        ...prodotto,
        importo,
        quantitaConsegnata: 0
      };
    }));
    
    // Calcola IVA e totale (esempio con IVA al 22%)
    const iva = totaleImponibile * 0.22;
    const totale = totaleImponibile + iva;
    
    // Crea l'ordine
    const ordineData = {
      fornitore,
      prodotti: prodottiElaborati,
      totaleImponibile,
      iva,
      totale,
      utente: req.user.id,
      ...altriDati
    };
    
    // Se non è specificata la data di consegna prevista, calcola in base al tempo di consegna del fornitore
    if (!ordineData.dataConsegnaPrevista) {
      const dataOrdine = ordineData.dataOrdine || new Date();
      const tempoConsegna = fornitoreObj.tempoConsegnaGiorni || 7;
      
      const dataConsegnaPrevista = new Date(dataOrdine);
      dataConsegnaPrevista.setDate(dataConsegnaPrevista.getDate() + tempoConsegna);
      
      ordineData.dataConsegnaPrevista = dataConsegnaPrevista;
    }
    
    const ordine = await OrdineFornitore.create([ordineData], { session });
    
    // Crea notifica per l'ordine
    // Import dinamico del controller delle notifiche per evitare dipendenze circolari
    const { createNotification } = await import('../controllers/notificationController.js');
    
    // Crea una notifica per gli utenti con ruolo magazzino
    await createNotification({
      type: 'magazzino',
      priority: 'media',
      title: `Nuovo ordine: ${fornitoreObj.ragioneSociale}`,
      message: `È stato creato un nuovo ordine a ${fornitoreObj.ragioneSociale} con consegna prevista il ${new Date(ordine[0].dataConsegnaPrevista).toLocaleDateString()}`,
      // Questo è un esempio, la logica reale dovrà essere implementata per trovare gli utenti con ruolo magazzino
      recipient: req.user.id,
      deliveryChannels: {
        inApp: true,
        email: true
      },
      relatedDocument: {
        type: 'ordine',
        id: ordine[0]._id
      }
    });
    
    await session.commitTransaction();
    
    logger.info(`Nuovo ordine fornitore creato: ${ordine[0]._id}`, {
      service: 'ordineFornitoreController',
      userId: req.user.id,
      ordineId: ordine[0]._id,
      fornitoreId: fornitore
    });
    
    return res.status(201).json({
      success: true,
      data: ordine[0]
    });
  } catch (error) {
    await session.abortTransaction();
    
    logger.error(`Errore nella creazione dell'ordine: ${error.message}`, {
      service: 'ordineFornitoreController',
      error,
      userId: req.user.id
    });
    
    return res.status(500).json({
      success: false,
      error: 'Errore nella creazione dell\'ordine: ' + error.message
    });
  } finally {
    session.endSession();
  }
};

// Aggiorna stato ordine
export const updateStatoOrdine = async (req, res) => {
  try {
    const { stato } = req.body;
    
    if (!['bozza', 'inviato', 'confermato', 'parziale', 'completato', 'annullato'].includes(stato)) {
      return res.status(400).json({
        success: false,
        error: 'Stato non valido'
      });
    }
    
    const ordine = await OrdineFornitore.findByIdAndUpdate(
      req.params.id,
      { stato },
      { new: true, runValidators: true }
    );
    
    if (!ordine) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }
    
    logger.info(`Stato ordine aggiornato: ${ordine._id} -> ${stato}`, {
      service: 'ordineFornitoreController',
      userId: req.user.id,
      ordineId: ordine._id
    });
    
    return res.status(200).json({
      success: true,
      data: ordine
    });
  } catch (error) {
    logger.error(`Errore nell'aggiornamento dello stato dell'ordine: ${error.message}`, {
      service: 'ordineFornitoreController',
      error,
      userId: req.user.id,
      id: req.params.id
    });
    
    return res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento dello stato dell\'ordine'
    });
  }
};

// Registra consegna
export const registraConsegna = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { prodottiConsegnati, dataConsegna = new Date() } = req.body;
    
    // Trova l'ordine
    const ordine = await OrdineFornitore.findById(req.params.id).session(session);
    
    if (!ordine) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }
    
    // Verifica che l'ordine non sia completato o annullato
    if (ordine.stato === 'completato' || ordine.stato === 'annullato') {
      return res.status(400).json({
        success: false,
        error: `Non è possibile registrare consegne per un ordine ${ordine.stato}`
      });
    }
    
    // Registra la consegna usando il metodo dell'ordine
    await ordine.registraConsegna(prodottiConsegnati, dataConsegna);
    
    // Crea notifica per la consegna
    // Import dinamico del controller delle notifiche per evitare dipendenze circolari
    const { createNotification } = await import('../controllers/notificationController.js');
    
    // Crea una notifica per gli utenti con ruolo magazzino
    await createNotification({
      type: 'magazzino',
      priority: 'media',
      title: `Consegna registrata: ${ordine.numeroOrdine}`,
      message: `È stata registrata una consegna per l'ordine ${ordine.numeroOrdine} (${prodottiConsegnati.length} prodotti)`,
      // Questo è un esempio, la logica reale dovrà essere implementata per trovare gli utenti con ruolo magazzino
      recipient: req.user.id,
      deliveryChannels: {
        inApp: true,
        email: false
      },
      relatedDocument: {
        type: 'ordine',
        id: ordine._id
      }
    });
    
    await session.commitTransaction();
    
    logger.info(`Consegna registrata per ordine: ${ordine._id}`, {
      service: 'ordineFornitoreController',
      userId: req.user.id,
      ordineId: ordine._id,
      stato: ordine.stato
    });
    
    return res.status(200).json({
      success: true,
      data: ordine
    });
  } catch (error) {
    await session.abortTransaction();
    
    logger.error(`Errore nella registrazione della consegna: ${error.message}`, {
      service: 'ordineFornitoreController',
      error,
      userId: req.user.id,
      id: req.params.id
    });
    
    return res.status(500).json({
      success: false,
      error: 'Errore nella registrazione della consegna: ' + error.message
    });
  } finally {
    session.endSession();
  }
};

// Ottieni statistiche ordini
export const getStatisticheOrdini = async (req, res) => {
  try {
    const { dataInizio, dataFine } = req.query;
    
    // Costruisci il filtro di date
    const dateFilter = {};
    
    if (dataInizio || dataFine) {
      dateFilter.dataOrdine = {};
      
      if (dataInizio) {
        dateFilter.dataOrdine.$gte = new Date(dataInizio);
      }
      
      if (dataFine) {
        // Aggiungi un giorno alla data fine per includerla completamente
        const dateFineObj = new Date(dataFine);
        dateFineObj.setDate(dateFineObj.getDate() + 1);
        dateFilter.dataOrdine.$lt = dateFineObj;
      }
    }
    
    // Statistiche per stato
    const perStato = await OrdineFornitore.aggregate([
      { $match: dateFilter },
      { $group: { 
        _id: '$stato', 
        count: { $sum: 1 },
        totaleImporto: { $sum: '$totale' }
      }},
      { $sort: { count: -1 } }
    ]);
    
    // Statistiche per fornitore (top 10)
    const perFornitore = await OrdineFornitore.aggregate([
      { $match: dateFilter },
      { $group: { 
        _id: '$fornitore', 
        count: { $sum: 1 },
        totaleImporto: { $sum: '$totale' }
      }},
      { $sort: { totaleImporto: -1 } },
      { $limit: 10 },
      { $lookup: {
        from: 'fornitores',
        localField: '_id',
        foreignField: '_id',
        as: 'fornitoreInfo'
      }},
      { $unwind: '$fornitoreInfo' },
      { $project: {
        count: 1,
        totaleImporto: 1,
        ragioneSociale: '$fornitoreInfo.ragioneSociale'
      }}
    ]);
    
    // Statistiche per mese
    const perMese = await OrdineFornitore.aggregate([
      { $match: dateFilter },
      { $group: {
        _id: {
          anno: { $year: '$dataOrdine' },
          mese: { $month: '$dataOrdine' }
        },
        count: { $sum: 1 },
        totaleImporto: { $sum: '$totale' }
      }},
      { $sort: { '_id.anno': 1, '_id.mese': 1 } },
      { $project: {
        _id: 0,
        anno: '$_id.anno',
        mese: '$_id.mese',
        count: 1,
        totaleImporto: 1
      }}
    ]);
    
    // Conteggio totale e importo totale
    const totali = await OrdineFornitore.aggregate([
      { $match: dateFilter },
      { $group: { 
        _id: null, 
        conteggio: { $sum: 1 },
        totaleImporto: { $sum: '$totale' }
      }}
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        totali: totali.length > 0 ? totali[0] : { conteggio: 0, totaleImporto: 0 },
        perStato,
        perFornitore,
        perMese
      }
    });
  } catch (error) {
    logger.error(`Errore nel recupero delle statistiche ordini: ${error.message}`, {
      service: 'ordineFornitoreController',
      error
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche ordini'
    });
  }
};

export default {
  getOrdini,
  getOrdine,
  createOrdine,
  updateStatoOrdine,
  registraConsegna,
  getStatisticheOrdini
};