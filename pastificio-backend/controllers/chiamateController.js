// controllers/chiamateController.js
import Chiamata from '../models/Chiamata.js';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';

/**
 * @desc    Ottieni tutte le chiamate con filtri opzionali
 * @route   GET /api/chiamate
 * @access  Privato
 */
export const getChiamate = async (req, res) => {
  try {
    const { 
      dataInizio, 
      dataFine, 
      tag, 
      esito, 
      clienteId,
      numeroTelefono,
      limit = 100,
      skip = 0,
      sort = '-dataChiamata' // Default: più recenti prima
    } = req.query;

    // Costruisci filtri dinamici
    const filtri = {};

    // Filtro per periodo
    if (dataInizio || dataFine) {
      filtri.dataChiamata = {};
      if (dataInizio) filtri.dataChiamata.$gte = new Date(dataInizio);
      if (dataFine) filtri.dataChiamata.$lte = new Date(dataFine);
    }

    // Filtro per tag
    if (tag) {
      // Supporta tag multipli separati da virgola
      const tagsArray = tag.split(',').map(t => t.trim());
      filtri.tags = { $in: tagsArray };
    }

    // Filtro per esito
    if (esito) {
      filtri.esito = esito;
    }

    // Filtro per cliente
    if (clienteId) {
      filtri.cliente = clienteId;
    }

    // Filtro per numero di telefono
    if (numeroTelefono) {
      filtri.numeroTelefono = numeroTelefono;
    }

    const chiamate = await Chiamata.find(filtri)
      .populate('cliente', 'nome cognome email telefono codiceCliente')
      .populate('ordineGenerato', 'numeroOrdine dataOrdine totale')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const totale = await Chiamata.countDocuments(filtri);

    logger.info(`Chiamate recuperate: ${chiamate.length}/${totale}`, {
      filtri,
      user: req.user?._id
    });

    res.json({
      success: true,
      data: chiamate,
      pagination: {
        totale,
        corrente: chiamate.length,
        skip: parseInt(skip),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Errore recupero chiamate:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle chiamate',
      error: error.message
    });
  }
};

/**
 * @desc    Ottieni una singola chiamata per ID
 * @route   GET /api/chiamate/:id
 * @access  Privato
 */
export const getChiamataById = async (req, res) => {
  try {
    const chiamata = await Chiamata.findById(req.params.id)
      .populate('cliente', 'nome cognome email telefono codiceCliente')
      .populate('ordineGenerato', 'numeroOrdine dataOrdine totale prodotti');

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        message: 'Chiamata non trovata'
      });
    }

    res.json({
      success: true,
      data: chiamata
    });

  } catch (error) {
    logger.error('Errore recupero chiamata:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della chiamata',
      error: error.message
    });
  }
};

/**
 * @desc    Crea una nuova chiamata
 * @route   POST /api/chiamate
 * @access  Privato
 */
export const creaChiamata = async (req, res) => {
  try {
    const {
      numeroTelefono,
      cliente,
      esito,
      note,
      tags = [],
      ordineGenerato
    } = req.body;

    // Validazione base
    if (!numeroTelefono) {
      return res.status(400).json({
        success: false,
        message: 'Numero di telefono obbligatorio'
      });
    }

    // Se cliente ID fornito, verifica esistenza
    if (cliente) {
      const clienteEsiste = await Cliente.findById(cliente);
      if (!clienteEsiste) {
        return res.status(404).json({
          success: false,
          message: 'Cliente non trovato'
        });
      }
    }

    const chiamata = await Chiamata.create({
      numeroTelefono,
      cliente,
      esito: esito || 'non-risposto',
      note,
      tags,
      ordineGenerato,
      dataChiamata: new Date(),
      durataChiamata: 0 // Verrà aggiornata se necessario
    });

    // Popola i dati per la risposta
    await chiamata.populate('cliente', 'nome cognome email telefono');

    logger.info('Chiamata creata:', {
      id: chiamata._id,
      numero: numeroTelefono,
      esito,
      user: req.user?._id
    });

    res.status(201).json({
      success: true,
      message: 'Chiamata registrata con successo',
      data: chiamata
    });

  } catch (error) {
    logger.error('Errore creazione chiamata:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della chiamata',
      error: error.message
    });
  }
};

/**
 * @desc    Aggiorna una chiamata esistente
 * @route   PUT /api/chiamate/:id
 * @access  Privato
 */
export const aggiornaChiamata = async (req, res) => {
  try {
    const {
      esito,
      note,
      tags,
      durataChiamata,
      ordineGenerato
    } = req.body;

    const chiamata = await Chiamata.findById(req.params.id);

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        message: 'Chiamata non trovata'
      });
    }

    // Aggiorna solo i campi forniti
    if (esito) chiamata.esito = esito;
    if (note !== undefined) chiamata.note = note;
    if (tags) chiamata.tags = tags;
    if (durataChiamata) chiamata.durataChiamata = durataChiamata;
    if (ordineGenerato) chiamata.ordineGenerato = ordineGenerato;

    await chiamata.save();
    await chiamata.populate('cliente', 'nome cognome email telefono');

    logger.info('Chiamata aggiornata:', {
      id: chiamata._id,
      esito,
      user: req.user?._id
    });

    res.json({
      success: true,
      message: 'Chiamata aggiornata con successo',
      data: chiamata
    });

  } catch (error) {
    logger.error('Errore aggiornamento chiamata:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della chiamata',
      error: error.message
    });
  }
};

/**
 * @desc    Aggiungi tag a una chiamata
 * @route   POST /api/chiamate/:id/tags
 * @access  Privato
 */
export const aggiungiTag = async (req, res) => {
  try {
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Fornire almeno un tag'
      });
    }

    const chiamata = await Chiamata.findById(req.params.id);

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        message: 'Chiamata non trovata'
      });
    }

    // Aggiungi solo tag nuovi (evita duplicati)
    tags.forEach(tag => {
      if (!chiamata.tags.includes(tag)) {
        chiamata.tags.push(tag);
      }
    });

    await chiamata.save();

    logger.info('Tag aggiunti a chiamata:', {
      id: chiamata._id,
      tags,
      user: req.user?._id
    });

    res.json({
      success: true,
      message: 'Tag aggiunti con successo',
      data: chiamata
    });

  } catch (error) {
    logger.error('Errore aggiunta tag:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiunta dei tag',
      error: error.message
    });
  }
};

/**
 * @desc    Rimuovi tag da una chiamata
 * @route   DELETE /api/chiamate/:id/tags
 * @access  Privato
 */
export const rimuoviTag = async (req, res) => {
  try {
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Fornire almeno un tag da rimuovere'
      });
    }

    const chiamata = await Chiamata.findById(req.params.id);

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        message: 'Chiamata non trovata'
      });
    }

    // Rimuovi i tag specificati
    chiamata.tags = chiamata.tags.filter(tag => !tags.includes(tag));

    await chiamata.save();

    logger.info('Tag rimossi da chiamata:', {
      id: chiamata._id,
      tags,
      user: req.user?._id
    });

    res.json({
      success: true,
      message: 'Tag rimossi con successo',
      data: chiamata
    });

  } catch (error) {
    logger.error('Errore rimozione tag:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella rimozione dei tag',
      error: error.message
    });
  }
};

/**
 * @desc    Ottieni tutti i tag unici utilizzati
 * @route   GET /api/chiamate/tags/all
 * @access  Privato
 */
export const getAllTags = async (req, res) => {
  try {
    // Aggregazione per ottenere tutti i tag unici
    const tagsAggregation = await Chiamata.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      data: tagsAggregation
    });

  } catch (error) {
    logger.error('Errore recupero tag:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei tag',
      error: error.message
    });
  }
};

/**
 * @desc    Elimina una chiamata
 * @route   DELETE /api/chiamate/:id
 * @access  Privato
 */
export const eliminaChiamata = async (req, res) => {
  try {
    const chiamata = await Chiamata.findById(req.params.id);

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        message: 'Chiamata non trovata'
      });
    }

    await chiamata.deleteOne();

    logger.info('Chiamata eliminata:', {
      id: req.params.id,
      user: req.user?._id
    });

    res.json({
      success: true,
      message: 'Chiamata eliminata con successo'
    });

  } catch (error) {
    logger.error('Errore eliminazione chiamata:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione della chiamata',
      error: error.message
    });
  }
};

export default {
  getChiamate,
  getChiamataById,
  creaChiamata,
  aggiornaChiamata,
  aggiungiTag,
  rimuoviTag,
  getAllTags,
  eliminaChiamata
};