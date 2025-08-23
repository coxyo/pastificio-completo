// controllers/fatturaController.js
import Fattura from '../models/fattura.js';
import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';
import { format } from 'date-fns';
import { it } from 'date-fns/locale/index.js';

// Utility per formattare le risposte di errore
const errorResponse = (res, statusCode, message, error = null) => {
  logger.error(message, { error: error?.message || error });
  return res.status(statusCode).json({ success: false, error: message });
};

/**
 * @desc    Crea una nuova fattura
 * @route   POST /api/fatture
 * @access  Private
 */
export const creaFattura = async (req, res) => {
  try {
    const { 
      cliente, righe, dataEmissione, dataScadenza, 
      note, modalitaPagamento, coordinateBancarie 
    } = req.body;

    // Validazione dati base
    if (!cliente || !cliente.nome || !cliente.indirizzo) {
      return errorResponse(res, 400, 'Dati cliente incompleti');
    }

    if (!righe || !Array.isArray(righe) || righe.length === 0) {
      return errorResponse(res, 400, 'È necessario specificare almeno una riga');
    }

    const anno = new Date().getFullYear();
    const numero = await Fattura.generaNuovoNumero(anno);

    const nuovaFattura = new Fattura({
      numero,
      anno,
      dataEmissione: dataEmissione || new Date(),
      dataScadenza: dataScadenza || (() => {
        const data = new Date();
        data.setDate(data.getDate() + 30); // Default: 30 giorni
        return data;
      })(),
      cliente,
      righe,
      note,
      modalitaPagamento: modalitaPagamento || 'Bonifico Bancario',
      coordinateBancarie,
      stato: 'Bozza',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    await nuovaFattura.save();

    // Aggiorna riferimento fattura negli ordini collegati
    for (const riga of righe) {
      if (riga.ordineId) {
        await Ordine.findByIdAndUpdate(riga.ordineId, {
          $set: { fatturaId: nuovaFattura._id }
        });
      }
    }

    logger.info(`Fattura ${numero}/${anno} creata con successo`, { 
      userId: req.user.id,
      fatturaId: nuovaFattura._id 
    });

    return res.status(201).json({
      success: true,
      data: nuovaFattura
    });
  } catch (error) {
    return errorResponse(res, 500, 'Errore nella creazione della fattura', error);
  }
};

/**
 * @desc    Crea una fattura da un ordine esistente
 * @route   POST /api/fatture/da-ordine/:id
 * @access  Private
 */
export const creaFatturaDaOrdine = async (req, res) => {
  try {
    const ordineId = req.params.id;
    if (!ordineId) {
      return errorResponse(res, 400, 'ID ordine non specificato');
    }

    const ordine = await Ordine.findById(ordineId);
    if (!ordine) {
      return errorResponse(res, 404, 'Ordine non trovato');
    }

    // Verifica se l'ordine ha già una fattura
    if (ordine.fatturaId) {
      return errorResponse(res, 400, 'Questo ordine è già stato fatturato');
    }

    // Crea fattura dall'ordine
    const fattura = await Fattura.daOrdine(ordine, req.user.id);
    await fattura.save();

    // Aggiorna riferimento fattura nell'ordine
    ordine.fatturaId = fattura._id;
    await ordine.save();

    logger.info(`Fattura ${fattura.numero}/${fattura.anno} creata da ordine ${ordineId}`, {
      userId: req.user.id,
      fatturaId: fattura._id,
      ordineId
    });

    return res.status(201).json({
      success: true,
      data: fattura
    });
  } catch (error) {
    return errorResponse(res, 500, 'Errore nella creazione della fattura da ordine', error);
  }
};

/**
 * @desc    Ottiene tutte le fatture con paginazione e filtri
 * @route   GET /api/fatture
 * @access  Private
 */
export const getFatture = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Costruisci filtri dinamici
    const filtro = {};

    if (req.query.anno) {
      filtro.anno = parseInt(req.query.anno, 10);
    }

    if (req.query.stato) {
      filtro.stato = req.query.stato;
    }

    if (req.query.cliente) {
      filtro['cliente.nome'] = { $regex: req.query.cliente, $options: 'i' };
    }

    if (req.query.dataInizio) {
      filtro.dataEmissione = { $gte: new Date(req.query.dataInizio) };
    }

    if (req.query.dataFine) {
      if (filtro.dataEmissione) {
        filtro.dataEmissione.$lte = new Date(req.query.dataFine);
      } else {
        filtro.dataEmissione = { $lte: new Date(req.query.dataFine) };
      }
    }

    if (req.query.importoMinimo) {
      // Questa query è un po' complessa perché totaleFattura è un virtual
      // Dovremmo usare un aggregation pipeline
    }

    // Costruisci ordinamento
    const sort = {};
    if (req.query.sortField) {
      sort[req.query.sortField] = req.query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.dataEmissione = -1; // Default: più recenti prima
    }

    // Esegui query con paginazione
    const fatture = await Fattura.find(filtro)
      .sort(sort)
      .skip(startIndex)
      .limit(limit)
      .populate('createdBy', 'username');

    // Conta totale risultati per paginazione
    const total = await Fattura.countDocuments(filtro);

    // Prepara metadati paginazione
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    };

    return res.status(200).json({
      success: true,
      count: fatture.length,
      pagination,
      data: fatture
    });
  } catch (error) {
    return errorResponse(res, 500, 'Errore nel recupero delle fatture', error);
  }
};

/**
 * @desc    Ottiene una fattura specifica per ID
 * @route   GET /api/fatture/:id
 * @access  Private
 */
export const getFattura = async (req, res) => {
  try {
    const fattura = await Fattura.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    if (!fattura) {
      return errorResponse(res, 404, 'Fattura non trovata');
    }

    return res.status(200).json({
      success: true,
      data: fattura
    });
  } catch (error) {
    return errorResponse(res, 500, 'Errore nel recupero della fattura', error);
  }
};

/**
 * @desc    Aggiorna una fattura esistente
 * @route   PUT /api/fatture/:id
 * @access  Private
 */
export const aggiornafattura = async (req, res) => {
  try {
    let fattura = await Fattura.findById(req.params.id);

    if (!fattura) {
      return errorResponse(res, 404, 'Fattura non trovata');
    }

    // Verifica se la fattura è modificabile
    if (fattura.stato !== 'Bozza' && !req.user.ruolo === 'admin') {
      return errorResponse(res, 403, 'Solo le fatture in stato "Bozza" possono essere modificate');
    }

    // Campi che possono essere aggiornati
    const { 
      cliente, righe, dataEmissione, dataScadenza, 
      note, modalitaPagamento, coordinateBancarie, stato 
    } = req.body;

    // Aggiorna i campi
    if (cliente) fattura.cliente = cliente;
    if (righe) fattura.righe = righe;
    if (dataEmissione) fattura.dataEmissione = dataEmissione;
    if (dataScadenza) fattura.dataScadenza = dataScadenza;
    if (note) fattura.note = note;
    if (modalitaPagamento) fattura.modalitaPagamento = modalitaPagamento;
    if (coordinateBancarie) fattura.coordinateBancarie = coordinateBancarie;
    if (stato && req.user.ruolo === 'admin') fattura.stato = stato;

    fattura.updatedBy = req.user.id;
    
    await fattura.save();

    logger.info(`Fattura ${fattura.numero}/${fattura.anno} aggiornata`, {
      userId: req.user.id,
      fatturaId: fattura._id
    });

    return res.status(200).json({
      success: true,
      data: fattura
    });
  } catch (error) {
    return errorResponse(res, 500, 'Errore nell\'aggiornamento della fattura', error);
  }
};

/**
 * @desc    Registra un pagamento per una fattura
 * @route   POST /api/fatture/:id/pagamenti
 * @access  Private
 */
export const registraPagamento = async (req, res) => {
  try {
    const fattura = await Fattura.findById(req.params.id);

    if (!fattura) {
      return errorResponse(res, 404, 'Fattura non trovata');
    }

    const { importo, metodoPagamento, data, note } = req.body;

    if (!importo || !metodoPagamento) {
      return errorResponse(res, 400, 'Importo e metodo di pagamento sono obbligatori');
    }

    // Crea oggetto pagamento
    const pagamento = {
      importo: parseFloat(importo),
      metodoPagamento,
      data: data || new Date(),
      note: note || ''
    };

    // Aggiungi pagamento alla fattura
    fattura.pagamenti.push(pagamento);
    fattura.updatedBy = req.user.id;
    
    // Salva e aggiorna stato automaticamente (tramite pre-save hook)
    await fattura.save();

    logger.info(`Pagamento di ${importo}€ registrato per fattura ${fattura.numero}/${fattura.anno}`, {
      userId: req.user.id,
      fatturaId: fattura._id,
      importo,
      metodoPagamento
    });

    return res.status(200).json({
      success: true,
      data: fattura
    });
  } catch (error) {
    return errorResponse(res, 500, 'Errore nella registrazione del pagamento', error);
  }
};

/**
 * @desc    Annulla una fattura
 * @route   PUT /api/fatture/:id/annulla
 * @access  Private/Admin
 */
export const annullaFattura = async (req, res) => {
  try {
    const fattura = await Fattura.findById(req.params.id);

    if (!fattura) {
      return errorResponse(res, 404, 'Fattura non trovata');
    }

    // Solo gli admin possono annullare fatture
    if (req.user.ruolo !== 'admin') {
      return errorResponse(res, 403, 'Solo gli amministratori possono annullare le fatture');
    }

    // Aggiorna stato
    fattura.stato = 'Annullata';
    fattura.updatedBy = req.user.id;
    fattura.note = `${fattura.note ? fattura.note + '\n' : ''}Annullata il ${format(new Date(), 'dd/MM/yyyy')} da ${req.user.username}.`;
    
    await fattura.save();

    // Rimuovi riferimenti negli ordini
    await Ordine.updateMany(
      { fatturaId: fattura._id },
      { $unset: { fatturaId: "" } }
    );

    logger.info(`Fattura ${fattura.numero}/${fattura.anno} annullata`, {
      userId: req.user.id,
      fatturaId: fattura._id
    });

    return res.status(200).json({
      success: true,
      data: fattura
    });
  } catch (error) {
    return errorResponse(res, 500, 'Errore nell\'annullamento della fattura', error);
  }
};

/**
 * @desc    Ottiene statistiche fatturazione
 * @route   GET /api/fatture/statistiche
 * @access  Private
 */
export const getStatistiche = async (req, res) => {
  try {
    const anno = parseInt(req.query.anno, 10) || new Date().getFullYear();
    
    // Statistiche base con aggregation pipeline
    const stats = await Fattura.aggregate([
      { $match: { 
        anno, 
        stato: { $nin: ['Annullata', 'Bozza'] } 
      }},
      { $group: {
        _id: null,
        numeroFatture: { $sum: 1 },
        fatturatoTotale: { $sum: { 
          $reduce: {
            input: "$righe",
            initialValue: 0,
            in: { 
              $add: ["$$value", { 
                $multiply: [
                  "$$this.prezzoUnitario", 
                  "$$this.quantita", 
                  { $subtract: [1, { $divide: ["$$this.sconto", 100] }] }
                ] 
              }]
            }
          }
        }},
        ivaMedia: { $avg: "$righe.aliquotaIva" },
        importoPagato: { $sum: { 
          $reduce: {
            input: "$pagamenti",
            initialValue: 0,
            in: { $add: ["$$value", "$$this.importo"] }
          }
        }}
      }},
      { $project: {
        _id: 0,
        numeroFatture: 1,
        fatturatoTotale: { $round: ["$fatturatoTotale", 2] },
        ivaMedia: { $round: ["$ivaMedia", 2] },
        importoPagato: { $round: ["$importoPagato", 2] },
        percentualePagato: { 
          $round: [{ 
            $multiply: [{ 
              $divide: ["$importoPagato", { $max: ["$fatturatoTotale", 0.01] }] 
            }, 100] 
          }, 2]
        }
      }}
    ]);

    // Distribuzione mensile
    const distribuzionePerMese = await Fattura.aggregate([
      { $match: { 
        anno, 
        stato: { $nin: ['Annullata', 'Bozza'] } 
      }},
      { $group: {
        _id: { $month: "$dataEmissione" },
        fatturatoMese: { $sum: { 
          $reduce: {
            input: "$righe",
            initialValue: 0,
            in: { 
              $add: ["$$value", { 
                $multiply: [
                  "$$this.prezzoUnitario", 
                  "$$this.quantita", 
                  { $subtract: [1, { $divide: ["$$this.sconto", 100] }] }
                ] 
              }]
            }
          }
        }},
        numeroFatture: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $project: {
        _id: 0,
        mese: "$_id",
        nomeMese: {
          $arrayElemAt: [
            ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", 
             "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
            { $subtract: ["$_id", 1] }
          ]
        },
        fatturatoMese: { $round: ["$fatturatoMese", 2] },
        numeroFatture: 1
      }}
    ]);

    // Statistiche per stato
    const distribuzionePerStato = await Fattura.aggregate([
      { $match: { anno } },
      { $group: {
        _id: "$stato",
        count: { $sum: 1 },
        totale: { $sum: { 
          $reduce: {
            input: "$righe",
            initialValue: 0,
            in: { 
              $add: ["$$value", { 
                $multiply: [
                  "$$this.prezzoUnitario", 
                  "$$this.quantita", 
                  { $subtract: [1, { $divide: ["$$this.sconto", 100] }] }
                ] 
              }]
            }
          }
        }}
      }},
      { $project: {
        _id: 0,
        stato: "$_id",
        count: 1,
        totale: { $round: ["$totale", 2] }
      }}
    ]);

    // Fatture insolute
    const fattureInsolute = await Fattura.find({
      anno,
      stato: { $in: ['Emessa', 'Scaduta', 'Parzialmente Pagata'] },
      dataScadenza: { $lt: new Date() }
    }).select('numero anno dataEmissione dataScadenza cliente.nome totaleFattura totalePagato saldo')
      .sort('dataScadenza');

    return res.status(200).json({
      success: true,
      data: {
        statisticheGenerali: stats[0] || {
          numeroFatture: 0,
          fatturatoTotale: 0,
          ivaMedia: 0,
          importoPagato: 0,
          percentualePagato: 0
        },
        distribuzionePerMese,
        distribuzionePerStato,
        fattureInsolute
      }
    });
  } catch (error) {
    return errorResponse(res, 500, 'Errore nel recupero delle statistiche', error);
  }
};

/**
 * @desc    Genera PDF di una fattura
 * @route   GET /api/fatture/:id/pdf
 * @access  Private
 */
export const generaPdf = async (req, res) => {
  try {
    const fattura = await Fattura.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!fattura) {
      return errorResponse(res, 404, 'Fattura non trovata');
    }

    // Importa il servizio PDF
    const pdfService = (await import('../services/pdfService.js')).default;
    
    // Genera il PDF
    const pdfPath = await pdfService.generateInvoicePDF(fattura);
    
    // Imposta gli header per il download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Fattura_${fattura.numero}_${fattura.anno}.pdf"`);
    
    // Invia il file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    // Cleanup dopo l'invio
    fileStream.on('end', () => {
      pdfService.cleanupTempFile(pdfPath);
    });
    
    logger.info(`PDF fattura ${fattura.numero}/${fattura.anno} generato e inviato`, {
      userId: req.user.id,
      fatturaId: fattura._id
    });
  } catch (error) {
    return errorResponse(res, 500, 'Errore nella generazione del PDF', error);
  }
};

/**
 * @desc    Elimina una fattura (solo bozze o admin)
 * @route   DELETE /api/fatture/:id
 * @access  Private/Admin
 */
export const eliminafattura = async (req, res) => {
  try {
    const fattura = await Fattura.findById(req.params.id);

    if (!fattura) {
      return errorResponse(res, 404, 'Fattura non trovata');
    }

    // Solo bozze o admin possono eliminare
    if (fattura.stato !== 'Bozza' && req.user.ruolo !== 'admin') {
      return errorResponse(res, 403, 'Solo le fatture in stato "Bozza" possono essere eliminate');
    }

    // Rimuovi riferimenti negli ordini
    await Ordine.updateMany(
      { fatturaId: fattura._id },
      { $unset: { fatturaId: "" } }
    );

    await fattura.remove();

    logger.info(`Fattura ${fattura.numero}/${fattura.anno} eliminata`, {
      userId: req.user.id,
      fatturaId: fattura._id
    });

    return res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    return errorResponse(res, 500, 'Errore nell\'eliminazione della fattura', error);
  }
};

