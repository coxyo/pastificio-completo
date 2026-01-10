// controllers/chiamateController.js - VERSIONE FINAL CON PUSHER
import Chiamata from '../models/Chiamata.js';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';
import pusher from '../services/pusherService.js';  // ✅ AGGIUNTO

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

    if (tag) {
      filtri.tags = tag;
    }

    if (esito) {
      filtri.esito = esito;
    }

    if (clienteId) {
      filtri.cliente = clienteId;
    }

    // ✅ FIX: Accetta sia "numero" che "numeroTelefono"
    const numeroRicerca = numero || numeroTelefono;
    if (numeroRicerca) {
      filtri.numero = { $regex: numeroRicerca.replace(/[^\d+]/g, ''), $options: 'i' };
    }

    const chiamate = await Chiamata.find(filtri)
      .populate('cliente', 'nome cognome telefono codiceCliente email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totale = await Chiamata.countDocuments(filtri);

    res.json({
      success: true,
      count: chiamate.length,
      total: totale,
      data: chiamate
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
 * @desc    Ottieni singola chiamata
 * @route   GET /api/chiamate/:id
 * @access  Privato
 */
export const getChiamata = async (req, res) => {
  try {
    const chiamata = await Chiamata.findById(req.params.id)
      .populate('cliente', 'nome cognome telefono email codiceCliente');

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
 * @desc    Crea nuova chiamata
 * @route   POST /api/chiamate
 * @access  Privato
 */
export const creaChiamata = async (req, res) => {
  try {
    const {
      numero,
      numeroTelefono,  // ✅ FIX: supporta anche questo
      cliente,
      timestamp,
      source = 'manual',
      esito = 'in_arrivo',
      durata,
      note,
      tags
    } = req.body;

    // ✅ FIX: Accetta sia "numero" che "numeroTelefono"
    const telefonoRaw = numero || numeroTelefono;

    // Validazione
    if (!telefonoRaw) {
      return res.status(400).json({
        success: false,
        message: 'Numero di telefono obbligatorio'
      });
    }

    // Normalizza numero
    const numeroNormalizzato = telefonoRaw.replace(/[^\d+]/g, '');

    // ✅ FIX: Genera callId univoco
    const callId = `CALL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // ✅ FIX: Usa campi corretti schema
    const chiamata = await Chiamata.create({
      callId,
      numero: numeroNormalizzato,
      numeroOriginale: telefonoRaw,
      cliente,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      source,
      esito,
      durata: durata || 0,
      note: note || '',
      tags: tags || []
    });

    // Popola cliente
    await chiamata.populate('cliente', 'nome cognome telefono codiceCliente');

    logger.info('Chiamata creata:', { id: chiamata._id, numero: numeroNormalizzato });

    res.status(201).json({
      success: true,
      message: 'Chiamata creata con successo',
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
 * @desc    Aggiorna chiamata
 * @route   PUT /api/chiamate/:id
 * @access  Privato
 */
export const aggiornaChiamata = async (req, res) => {
  try {
    const chiamata = await Chiamata.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('cliente', 'nome cognome telefono');

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        message: 'Chiamata non trovata'
      });
    }

    logger.info('Chiamata aggiornata:', { id: chiamata._id });

    res.json({
      success: true,
      message: 'Chiamata aggiornata',
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
 * @desc    Elimina chiamata
 * @route   DELETE /api/chiamate/:id
 * @access  Privato
 */
export const eliminaChiamata = async (req, res) => {
  try {
    const chiamata = await Chiamata.findByIdAndDelete(req.params.id);

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        message: 'Chiamata non trovata'
      });
    }

    logger.info('Chiamata eliminata:', { id: req.params.id });

    res.json({
      success: true,
      message: 'Chiamata eliminata'
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

/**
 * @desc    Aggiungi nota a chiamata
 * @route   POST /api/chiamate/:id/note
 * @access  Privato
 */
export const aggiungiNota = async (req, res) => {
  try {
    const { testo } = req.body;

    if (!testo) {
      return res.status(400).json({
        success: false,
        message: 'Testo della nota obbligatorio'
      });
    }

    const chiamata = await Chiamata.findByIdAndUpdate(
      req.params.id,
      { $push: { note: testo } },
      { new: true }
    ).populate('cliente');

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        message: 'Chiamata non trovata'
      });
    }

    res.json({
      success: true,
      message: 'Nota aggiunta',
      data: chiamata
    });

  } catch (error) {
    logger.error('Errore aggiunta nota:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiunta della nota',
      error: error.message
    });
  }
};

/**
 * @desc    Aggiungi tag a chiamata
 * @route   POST /api/chiamate/:id/tags
 * @access  Privato
 */
export const aggiungiTag = async (req, res) => {
  try {
    const { tag } = req.body;

    if (!tag) {
      return res.status(400).json({
        success: false,
        message: 'Tag obbligatorio'
      });
    }

    const chiamata = await Chiamata.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { tags: tag } },
      { new: true }
    ).populate('cliente');

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        message: 'Chiamata non trovata'
      });
    }

    res.json({
      success: true,
      message: 'Tag aggiunto',
      data: chiamata
    });

  } catch (error) {
    logger.error('Errore aggiunta tag:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiunta del tag',
      error: error.message
    });
  }
};

/**
 * @desc    Rimuovi tag da chiamata
 * @route   DELETE /api/chiamate/:id/tags/:tag
 * @access  Privato
 */
export const rimuoviTag = async (req, res) => {
  try {
    const chiamata = await Chiamata.findByIdAndUpdate(
      req.params.id,
      { $pull: { tags: req.params.tag } },
      { new: true }
    ).populate('cliente');

    if (!chiamata) {
      return res.status(404).json({
        success: false,
        message: 'Chiamata non trovata'
      });
    }

    res.json({
      success: true,
      message: 'Tag rimosso',
      data: chiamata
    });

  } catch (error) {
    logger.error('Errore rimozione tag:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella rimozione del tag',
      error: error.message
    });
  }
};

// ✅ WEBHOOK ENDPOINT CON PUSHER!
/**
 * @desc    Registra chiamata da estensione Chrome o frontend Pusher
 * @route   POST /api/chiamate/webhook
 * @access  Pubblico (con X-API-KEY header)
 */
export const webhookChiamata = async (req, res) => {
  try {
    // Verifica API key (opzionale)
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.WEBHOOK_API_KEY || 'pastificio-chiamate-2025';
    
    if (apiKey && apiKey !== expectedKey) {
      logger.warn('Webhook chiamata: API key non valida');
      return res.status(401).json({
        success: false,
        message: 'API key non valida'
      });
    }

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

    const telefonoRaw = numero || numeroTelefono;

    if (!telefonoRaw) {
      return res.status(400).json({
        success: false,
        message: 'Numero di telefono obbligatorio'
      });
    }

    const numeroNormalizzato = telefonoRaw.replace(/[^\d+]/g, '');
    const callId = `CALL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Cerca cliente
    let clienteId = clienteFromBody || null;
    
    if (!clienteId) {
      try {
        const numeroSenzaPrefisso = numeroNormalizzato.replace(/^\+?39/, '');
        const variantiNumero = [
          numeroNormalizzato,
          `+39${numeroSenzaPrefisso}`,
          `+${numeroNormalizzato.replace(/^\+/, '')}`,
          telefonoRaw,
          telefonoRaw.replace(/\s/g, ''),
          numeroSenzaPrefisso,
          `0${numeroSenzaPrefisso}`
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

    // ✅ Valida source
    const sourceValidi = ['3cx-extension', '3cx-webhook', 'test-manual', 'manual'];
    const sourceRaw = sorgente || source;
    const sourceValidato = sourceValidi.includes(sourceRaw) ? sourceRaw : '3cx-extension';

    // Crea chiamata
    const chiamata = await Chiamata.create({
      callId: callId,
      numero: numeroNormalizzato,
      numeroOriginale: telefonoRaw,
      cliente: clienteId,
      timestamp: timestamp ? new Date(timestamp) : (dataChiamata ? new Date(dataChiamata) : new Date()),
      source: sourceValidato,
      esito: esito,
      durata: 0,
      note: note || ''
    });

    // Popola cliente
    if (clienteId) {
      await chiamata.populate('cliente', 'nome cognome telefono codiceCliente email citta provincia');
    }

    logger.info('Webhook: Chiamata salvata con successo:', {
      id: chiamata._id,
      callId: callId,
      numero: numeroNormalizzato,
      cliente: clienteId ? 'trovato' : 'sconosciuto',
      esito,
      source: sourceValidato
    });

    // ✅ ✅ ✅ INVIA EVENTO PUSHER ✅ ✅ ✅
    try {
      const pusherData = {
        _id: chiamata._id.toString(),
        callId: chiamata.callId,
        numero: chiamata.numero,
        timestamp: chiamata.timestamp.toISOString(),
        cliente: chiamata.cliente ? {
          _id: chiamata.cliente._id.toString(),
          nome: chiamata.cliente.nome,
          cognome: chiamata.cliente.cognome || '',
          telefono: chiamata.cliente.telefono,
          codiceCliente: chiamata.cliente.codiceCliente,
          email: chiamata.cliente.email || '',
          citta: chiamata.cliente.citta || '',
          provincia: chiamata.cliente.provincia || ''
        } : null
      };

      await pusher.trigger('chiamate', 'nuova-chiamata', pusherData);
      
      logger.info('✅ Pusher: Evento nuova-chiamata inviato', {
        callId: chiamata.callId,
        numero: chiamata.numero,
        cliente: chiamata.cliente ? `${chiamata.cliente.nome} ${chiamata.cliente.cognome || ''}`.trim() : 'sconosciuto'
      });
    } catch (pusherError) {
      logger.error('❌ Pusher: Errore invio evento:', pusherError);
    }

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

/**
 * @desc    Ottieni statistiche chiamate
 * @route   GET /api/chiamate/statistiche
 * @access  Privato
 */
export const getStatistiche = async (req, res) => {
  try {
    const { dataInizio, dataFine } = req.query;

    const filtri = {};
    if (dataInizio || dataFine) {
      filtri.timestamp = {};
      if (dataInizio) filtri.timestamp.$gte = new Date(dataInizio);
      if (dataFine) filtri.timestamp.$lte = new Date(dataFine);
    }

    const [
      totale,
      risposte,
      perse,
      durataTotale,
      perCliente
    ] = await Promise.all([
      Chiamata.countDocuments(filtri),
      Chiamata.countDocuments({ ...filtri, esito: 'risposta' }),
      Chiamata.countDocuments({ ...filtri, esito: 'persa' }),
      Chiamata.aggregate([
        { $match: filtri },
        { $group: { _id: null, durata: { $sum: '$durata' } } }
      ]),
      Chiamata.aggregate([
        { $match: filtri },
        {
          $group: {
            _id: '$cliente',
            count: { $sum: 1 },
            durataTotale: { $sum: '$durata' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totale,
        risposte,
        perse,
        durataTotale: durataTotale[0]?.durata || 0,
        durataMedia: totale > 0 ? Math.round((durataTotale[0]?.durata || 0) / totale) : 0,
        perCliente
      }
    });

  } catch (error) {
    logger.error('Errore statistiche chiamate:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel calcolo delle statistiche',
      error: error.message
    });
  }
};

// ✅ Default export per compatibilità con routes
export default {
  getChiamate,
  getChiamata,
  creaChiamata,
  aggiornaChiamata,
  eliminaChiamata,
  aggiungiNota,
  aggiungiTag,
  rimuoviTag,
  webhookChiamata,
  getStatistiche
};
