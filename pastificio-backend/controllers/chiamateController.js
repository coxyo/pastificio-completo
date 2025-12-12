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
      numero,  // ✅ FIX: accetta anche "numero"
      limit = 100,
      skip = 0,
      sort = '-timestamp' // ✅ FIX: usa "timestamp" (campo corretto schema)
    } = req.query;

    // Costruisci filtri dinamici
    const filtri = {};

    // ✅ FIX: Filtro per periodo usa "timestamp" (campo schema)
    if (dataInizio || dataFine) {
      filtri.timestamp = {};
      if (dataInizio) filtri.timestamp.$gte = new Date(dataInizio);
      if (dataFine) filtri.timestamp.$lte = new Date(dataFine);
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

    // ✅ FIX: Filtro per numero usa "numero" (campo schema)
    const numeroRicerca = numero || numeroTelefono;
    if (numeroRicerca) {
      filtri.numero = { $regex: numeroRicerca.replace(/[^\d]/g, ''), $options: 'i' };
    }

    const chiamate = await Chiamata.find(filtri)
      .populate('cliente', 'nome cognome email telefono codiceCliente')
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

// ✅ FIX 12/12/2025: Endpoint pubblico per estensione Chrome E frontend Pusher
/**
 * @desc    Registra chiamata da estensione Chrome o frontend Pusher
 * @route   POST /api/chiamate/webhook
 * @access  Pubblico (con X-API-KEY header)
 */
export const webhookChiamata = async (req, res) => {
  try {
    // Verifica API key (opzionale - per sicurezza base)
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.WEBHOOK_API_KEY || 'pastificio-chiamate-2025';
    
    if (apiKey && apiKey !== expectedKey) {
      logger.warn('Webhook chiamata: API key non valida');
      return res.status(401).json({
        success: false,
        message: 'API key non valida'
      });
    }

    // ✅ FIX: Accetta sia "numero" che "numeroTelefono" dal body
    const {
      numero,
      numeroTelefono,
      timestamp,
      dataChiamata,
      cliente: clienteFromBody,
      clienteTrovato,
      sorgente,
      source,
      esito = 'in_arrivo',
      note
    } = req.body;

    // Usa numero o numeroTelefono
    const telefonoRaw = numero || numeroTelefono;

    // Validazione base
    if (!telefonoRaw) {
      return res.status(400).json({
        success: false,
        message: 'Numero di telefono obbligatorio'
      });
    }

    // Normalizza numero (rimuovi spazi, mantieni + e cifre)
    const numeroNormalizzato = telefonoRaw.replace(/[^\d+]/g, '');

    // ✅ FIX CRITICO: Genera callId univoco (REQUIRED dallo schema!)
    const callId = `CALL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Cerca cliente per numero di telefono (se non già fornito)
    let clienteId = clienteFromBody || null;
    
    if (!clienteId) {
      try {
        // Varianti del numero per ricerca
        const numeroSenzaPrefisso = numeroNormalizzato.replace(/^\+?39/, '');
        const variantiNumero = [
          numeroNormalizzato,
          `+39${numeroSenzaPrefisso}`,
          `+${numeroNormalizzato.replace(/^\+/, '')}`,
          telefonoRaw,
          telefonoRaw.replace(/\s/g, ''),
          numeroSenzaPrefisso,
          `0${numeroSenzaPrefisso}`  // Per numeri fissi
        ];

        const clienteTrovatoDb = await Cliente.findOne({
          telefono: { $in: variantiNumero }
        });
        
        if (clienteTrovatoDb) {
          clienteId = clienteTrovatoDb._id;
          logger.info(`Webhook: Cliente trovato per ${telefonoRaw}: ${clienteTrovatoDb.nome} ${clienteTrovatoDb.cognome || ''}`);
        }
      } catch (err) {
        logger.warn('Webhook: Errore ricerca cliente:', err.message);
      }
    }

    // ✅ FIX: Usa i campi CORRETTI dello schema Chiamata.js
    const chiamata = await Chiamata.create({
      callId: callId,                                    // ✅ REQUIRED - ora generato!
      numero: numeroNormalizzato,                        // ✅ Campo corretto (non "numeroTelefono")
      numeroOriginale: telefonoRaw,                      // Salva anche originale
      cliente: clienteId,
      timestamp: timestamp ? new Date(timestamp) : (dataChiamata ? new Date(dataChiamata) : new Date()),  // ✅ Campo corretto
      source: sorgente || source || '3cx-extension',    // ✅ Campo corretto
      esito: esito,
      durata: 0,                                         // ✅ Campo corretto (non "durataChiamata")
      note: note || ''
    });

    // Popola cliente se trovato
    if (clienteId) {
      await chiamata.populate('cliente', 'nome cognome telefono codiceCliente');
    }

    logger.info('Webhook: Chiamata salvata con successo:', {
      id: chiamata._id,
      callId: callId,
      numero: numeroNormalizzato,
      cliente: clienteId ? 'trovato' : 'sconosciuto',
      esito,
      source: sorgente || source || '3cx-extension'
    });

    res.status(201).json({
      success: true,
      message: 'Chiamata registrata',
      data: chiamata
    });

  } catch (error) {
    logger.error('Webhook: Errore registrazione chiamata:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella registrazione della chiamata',
      error: error.message
    });
  }
};

// ✅ NUOVO 12/12/2025: Endpoint per statistiche chiamate
/**
 * @desc    Ottieni statistiche chiamate
 * @route   GET /api/chiamate/statistiche
 * @access  Privato
 */
export const getStatistiche = async (req, res) => {
  try {
    const { dataInizio, dataFine } = req.query;
    
    // Date di default: ultimo mese
    const oggi = new Date();
    const inizioDefault = new Date(oggi);
    inizioDefault.setMonth(oggi.getMonth() - 1);
    
    const filtroData = {
      timestamp: {
        $gte: dataInizio ? new Date(dataInizio) : inizioDefault,
        $lte: dataFine ? new Date(dataFine) : oggi
      }
    };

    // Statistiche aggregate
    const [
      totaleChiamate,
      chiamateOggi,
      chiamateSettimana,
      chiamateConCliente,
      perEsito,
      perGiorno
    ] = await Promise.all([
      // Totale chiamate nel periodo
      Chiamata.countDocuments(filtroData),
      
      // Chiamate oggi
      Chiamata.countDocuments({
        timestamp: {
          $gte: new Date(oggi.setHours(0, 0, 0, 0)),
          $lte: new Date()
        }
      }),
      
      // Chiamate ultima settimana
      Chiamata.countDocuments({
        timestamp: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          $lte: new Date()
        }
      }),
      
      // Chiamate con cliente identificato
      Chiamata.countDocuments({
        ...filtroData,
        cliente: { $ne: null }
      }),
      
      // Raggruppamento per esito
      Chiamata.aggregate([
        { $match: filtroData },
        { $group: { _id: '$esito', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Chiamate per giorno (ultimi 7 giorni)
      Chiamata.aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Durata media chiamate risposte
    const durataMedia = await Chiamata.aggregate([
      {
        $match: {
          ...filtroData,
          esito: 'risposta',
          durata: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          media: { $avg: '$durata' },
          totale: { $sum: '$durata' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totale: totaleChiamate,
        oggi: chiamateOggi,
        settimana: chiamateSettimana,
        conCliente: chiamateConCliente,
        perEsito: perEsito.reduce((acc, e) => {
          acc[e._id || 'sconosciuto'] = e.count;
          return acc;
        }, {}),
        perGiorno,
        durataMedia: durataMedia[0]?.media || 0,
        durataTotale: durataMedia[0]?.totale || 0
      }
    });

  } catch (error) {
    logger.error('Errore recupero statistiche chiamate:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche',
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
  eliminaChiamata,
  webhookChiamata,
  getStatistiche  // ✅ NUOVO
};
