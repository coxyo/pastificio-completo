// controllers/magazzinoController.js
import mongoose from 'mongoose';
import Movimento from '../models/movimento.js';
import Prodotto from '../models/prodotto.js';
import notificationService from '../services/NotificationService.js';
import logger from '../config/logger.js';

// Crea nuovo movimento
const createMovimento = async (req, res) => {
  try {
    const movimento = new Movimento({
      ...req.body,
      utente: req.user.id
    });
    
    await movimento.save();
    
    logger.info(`Nuovo movimento creato: ${movimento._id}`);
    
    // Notifica via WebSocket
    if (req.app.locals.io) {
      req.app.locals.io.emit('movimento:creato', movimento);
    }
    
    // Controlla scorte dopo il movimento
    await checkAndNotifyLowStock(req, movimento.prodotto);
    
    res.status(201).json({
      success: true,
      data: movimento
    });
  } catch (error) {
    logger.error('Errore creazione movimento:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Funzione helper per controllare scorte basse
const checkAndNotifyLowStock = async (req, prodotto) => {
  try {
    const giacenza = await getGiacenzaProdotto(prodotto.nome);
    
    if (giacenza && giacenza.quantitaAttuale < giacenza.scortaMinima) {
      // Notifica via WebSocket (esistente)
      if (req.app.locals.io) {
        req.app.locals.io.emit('low-stock', {
          prodotto: {
            id: giacenza._id,
            nome: prodotto.nome,
            quantitaAttuale: giacenza.quantitaAttuale,
            unitaMisura: giacenza.unita,
            scortaMinima: giacenza.scortaMinima
          },
          timestamp: new Date()
        });
      }
      
      // NUOVO: Notifica via email/SMS
      await notificationService.notifyLowStock({
        nome: prodotto.nome,
        quantitaAttuale: giacenza.quantitaAttuale,
        unitaMisura: giacenza.unita,
        scortaMinima: giacenza.scortaMinima
      });
    }
  } catch (error) {
    logger.error('Errore controllo scorte:', error);
  }
};

// Helper per ottenere giacenza di un prodotto
const getGiacenzaProdotto = async (nomeProdotto) => {
  const [giacenza] = await Movimento.aggregate([
    { $match: { 'prodotto.nome': nomeProdotto } },
    {
      $group: {
        _id: '$prodotto.nome',
        quantitaAttuale: {
          $sum: {
            $cond: [
              { $in: ['$tipo', ['carico', 'inventario']] },
              '$quantita',
              { $multiply: ['$quantita', -1] }
            ]
          }
        },
        unita: { $first: '$unita' },
        scortaMinima: { $first: { $literal: 10 } }
      }
    }
  ]);
  
  return giacenza;
};

// Ottieni tutti i movimenti
const getMovimenti = async (req, res) => {
  try {
    const { 
      limit = 100, 
      skip = 0, 
      tipo, 
      prodotto,
      dataInizio,
      dataFine 
    } = req.query;
    
    // Costruisci filtri
    const filter = {};
    if (tipo) filter.tipo = tipo;
    if (prodotto) filter['prodotto.nome'] = new RegExp(prodotto, 'i');
    
    if (dataInizio || dataFine) {
      filter.dataMovimento = {};
      if (dataInizio) filter.dataMovimento.$gte = new Date(dataInizio);
      if (dataFine) filter.dataMovimento.$lte = new Date(dataFine);
    }
    
    const movimenti = await Movimento.find(filter)
      .sort({ dataMovimento: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('utente', 'username');
    
    const count = await Movimento.countDocuments(filter);
    
    res.json({
      success: true,
      data: movimenti,
      count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    logger.error('Errore recupero movimenti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei movimenti'
    });
  }
};

// Ottieni movimento per ID
const getMovimentoById = async (req, res) => {
  try {
    const movimento = await Movimento.findById(req.params.id)
      .populate('utente', 'username');
    
    if (!movimento) {
      return res.status(404).json({
        success: false,
        error: 'Movimento non trovato'
      });
    }
    
    res.json({
      success: true,
      data: movimento
    });
  } catch (error) {
    logger.error('Errore recupero movimento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del movimento'
    });
  }
};

// Aggiorna movimento
const updateMovimento = async (req, res) => {
  try {
    const movimento = await Movimento.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!movimento) {
      return res.status(404).json({
        success: false,
        error: 'Movimento non trovato'
      });
    }
    
    // Notifica via WebSocket
    if (req.app.locals.io) {
      req.app.locals.io.emit('movimento:aggiornato', movimento);
    }
    
    // Controlla scorte
    await checkAndNotifyLowStock(req, movimento.prodotto);
    
    res.json({
      success: true,
      data: movimento
    });
  } catch (error) {
    logger.error('Errore aggiornamento movimento:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Elimina movimento
const deleteMovimento = async (req, res) => {
  try {
    const movimento = await Movimento.findByIdAndDelete(req.params.id);
    
    if (!movimento) {
      return res.status(404).json({
        success: false,
        error: 'Movimento non trovato'
      });
    }
    
    // Notifica via WebSocket
    if (req.app.locals.io) {
      req.app.locals.io.emit('movimento:eliminato', { _id: req.params.id });
    }
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Errore eliminazione movimento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione del movimento'
    });
  }
};

// Get giacenze
const getGiacenze = async (req, res) => {
  try {
    const giacenze = await Movimento.aggregate([
      {
        $group: {
          _id: {
            nome: '$prodotto.nome',
            categoria: '$prodotto.categoria'
          },
          quantitaAttuale: {
            $sum: {
              $cond: [
                { $in: ['$tipo', ['carico', 'inventario']] },
                '$quantita',
                { $multiply: ['$quantita', -1] }
              ]
            }
          },
          valoreMedio: { $avg: '$prezzoUnitario' },
          unita: { $first: '$unita' },
          ultimoMovimento: {
            $max: {
              data: '$dataMovimento',
              tipo: '$tipo',
              quantita: '$quantita'
            }
          }
        }
      },
      {
        $project: {
          _id: mongoose.Types.ObjectId(),
          prodotto: '$_id',
          quantitaAttuale: 1,
          valoreMedio: { $round: ['$valoreMedio', 2] },
          unita: 1,
          ultimoMovimento: 1,
          scorta: {
            minima: 10,
            ottimale: 50
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: giacenze
    });
  } catch (error) {
    logger.error('Errore recupero giacenze:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle giacenze'
    });
  }
};

// Controlla scorte basse
const checkLowStock = async (req, res) => {
  try {
    const prodottiSottoScorta = await Movimento.aggregate([
      {
        $group: {
          _id: '$prodotto.nome',
          quantitaAttuale: {
            $sum: {
              $cond: [
                { $in: ['$tipo', ['carico', 'inventario']] },
                '$quantita',
                { $multiply: ['$quantita', -1] }
              ]
            }
          },
          unita: { $first: '$unita' },
          categoria: { $first: '$prodotto.categoria' }
        }
      },
      {
        $match: {
          quantitaAttuale: { $lt: 10 }
        }
      }
    ]);
    
    // Invia notifiche via WebSocket e email/SMS
    if (prodottiSottoScorta.length > 0) {
      for (const prodotto of prodottiSottoScorta) {
        // WebSocket
        if (req.app.locals.io) {
          req.app.locals.io.emit('low-stock', {
            prodotto: {
              nome: prodotto._id,
              quantitaAttuale: prodotto.quantitaAttuale,
              unitaMisura: prodotto.unita,
              scortaMinima: 10
            },
            timestamp: new Date()
          });
        }
        
        // Email/SMS
        await notificationService.notifyLowStock({
          nome: prodotto._id,
          quantitaAttuale: prodotto.quantitaAttuale,
          unitaMisura: prodotto.unita,
          scortaMinima: 10
        });
      }
    }
    
    res.json({ 
      success: true, 
      prodottiSottoScorta: prodottiSottoScorta,
      count: prodottiSottoScorta.length 
    });
  } catch (error) {
    logger.error('Errore controllo scorte:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Controlla prodotti in scadenza
const checkExpiringProducts = async (req, res) => {
  try {
    const giorniAvviso = parseInt(req.query.giorni) || 7;
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + giorniAvviso);
    
    const prodottiInScadenza = await Movimento.find({
      dataScadenza: { 
        $gte: new Date(),
        $lte: dataLimite 
      },
      tipo: { $in: ['carico', 'inventario'] }
    }).select('prodotto dataScadenza lotto');
    
    if (prodottiInScadenza.length > 0) {
      // WebSocket
      if (req.app.locals.io) {
        req.app.locals.io.emit('products-expiring', {
          prodotti: prodottiInScadenza,
          giorniRimanenti: giorniAvviso
        });
      }
      
      // Email notification
      await notificationService.notifyExpiringProducts(
        prodottiInScadenza.map(p => ({
          nome: p.prodotto.nome,
          dataScadenza: p.dataScadenza,
          lotto: p.lotto
        }))
      );
    }
    
    res.json({ 
      success: true, 
      prodottiInScadenza: prodottiInScadenza,
      count: prodottiInScadenza.length 
    });
  } catch (error) {
    logger.error('Errore controllo scadenze:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get valore magazzino
const getValore = async (req, res) => {
  try {
    const [valore] = await Movimento.aggregate([
      {
        $group: {
          _id: null,
          valoreToTale: {
            $sum: {
              $cond: [
                { $in: ['$tipo', ['carico', 'inventario']] },
                '$valoreMovimento',
                { $multiply: ['$valoreMovimento', -1] }
              ]
            }
          }
        }
      }
    ]);
    
    const prodottiSottoScorta = await getProdottiSottoScortaCount();
    
    res.json({
      success: true,
      data: {
        valoreToTale: valore?.valoreToTale || 0,
        prodottiSottoScorta: prodottiSottoScorta,
        prodottiInScadenza: [],
        perCategoria: {}
      }
    });
  } catch (error) {
    logger.error('Errore calcolo valore:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel calcolo del valore'
    });
  }
};

// Get dashboard data
const getDashboard = async (req, res) => {
  try {
    // Recupera prodotti sotto scorta
    const prodottiSottoScorta = await Movimento.aggregate([
      {
        $group: {
          _id: '$prodotto.nome',
          quantitaAttuale: {
            $sum: {
              $cond: [
                { $in: ['$tipo', ['carico', 'inventario']] },
                '$quantita',
                { $multiply: ['$quantita', -1] }
              ]
            }
          },
          unita: { $first: '$unita' },
          categoria: { $first: '$prodotto.categoria' }
        }
      },
      {
        $match: {
          quantitaAttuale: { $lt: 10 }
        }
      },
      {
        $project: {
          prodotto: '$_id',
          quantitaAttuale: 1,
          scortaMinima: { $literal: 10 },
          unita: 1,
          categoria: 1,
          _id: 0
        }
      },
      {
        $limit: 10
      }
    ]);

    // Calcola valore totale
    const [valoreData] = await Movimento.aggregate([
      {
        $group: {
          _id: null,
          valoreTotal: {
            $sum: {
              $cond: [
                { $in: ['$tipo', ['carico', 'inventario']] },
                '$valoreMovimento',
                { $multiply: ['$valoreMovimento', -1] }
              ]
            }
          }
        }
      }
    ]);

    // Movimenti recenti
    const movimentiRecenti = await Movimento.find()
      .sort({ dataMovimento: -1 })
      .limit(5)
      .select('tipo prodotto quantita unita dataMovimento');

    res.json({
      success: true,
      prodottiSottoScorta: prodottiSottoScorta || [],
      valoreTotal: valoreData?.valoreTotal || 0,
      movimentiRecenti: movimentiRecenti || []
    });
  } catch (error) {
    logger.error('Errore dashboard magazzino:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel caricamento dashboard',
      details: error.message
    });
  }
};

// Get stats
const getStats = async (req, res) => {
  try {
    const stats = await Movimento.aggregate([
      {
        $facet: {
          totaleIngredienti: [
            {
              $group: {
                _id: '$prodotto.nome'
              }
            },
            { $count: 'count' }
          ],
          alertAttivi: [
            {
              $group: {
                _id: '$prodotto.nome',
                quantita: {
                  $sum: {
                    $cond: [
                      { $in: ['$tipo', ['carico', 'inventario']] },
                      '$quantita',
                      { $multiply: ['$quantita', -1] }
                    ]
                  }
                }
              }
            },
            {
              $match: { quantita: { $lt: 10 } }
            },
            { $count: 'count' }
          ],
          movimentiOggi: [
            {
              $match: {
                dataMovimento: {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);
    
    res.json({
      totaleIngredienti: stats[0]?.totaleIngredienti[0]?.count || 0,
      alertAttivi: stats[0]?.alertAttivi[0]?.count || 0,
      movimentiOggi: stats[0]?.movimentiOggi[0]?.count || 0
    });
  } catch (error) {
    logger.error('Errore stats:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel caricamento statistiche'
    });
  }
};

// Ottieni inventario attuale
const getInventario = async (req, res) => {
  try {
    const inventario = await Movimento.aggregate([
      {
        $group: {
          _id: '$prodotto.nome',
          categoria: { $first: '$prodotto.categoria' },
          quantitaTotale: {
            $sum: {
              $cond: [
                { $in: ['$tipo', ['carico', 'inventario']] },
                '$quantita',
                { $multiply: ['$quantita', -1] }
              ]
            }
          },
          unita: { $first: '$unita' },
          valoreMedio: { $avg: '$prezzoUnitario' },
          ultimoMovimento: { $max: '$dataMovimento' }
        }
      },
      {
        $project: {
          prodotto: '$_id',
          categoria: 1,
          quantitaTotale: 1,
          unita: 1,
          valoreMedio: { $round: ['$valoreMedio', 2] },
          valoreGiacenza: { 
            $round: [{ $multiply: ['$quantitaTotale', '$valoreMedio'] }, 2] 
          },
          ultimoMovimento: 1,
          _id: 0
        }
      },
      { $sort: { prodotto: 1 } }
    ]);
    
    res.json({
      success: true,
      data: inventario
    });
  } catch (error) {
    logger.error('Errore calcolo inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel calcolo dell\'inventario'
    });
  }
};

// Ottieni prodotti sotto scorta
const getProdottiSottoScorta = async (req, res) => {
  try {
    const prodottiSottoScorta = await Movimento.aggregate([
      {
        $group: {
          _id: '$prodotto.nome',
          quantitaTotale: {
            $sum: {
              $cond: [
                { $in: ['$tipo', ['carico', 'inventario']] },
                '$quantita',
                { $multiply: ['$quantita', -1] }
              ]
            }
          },
          unita: { $first: '$unita' }
        }
      },
      {
        $match: {
          quantitaTotale: { $lt: 10 }
        }
      },
      {
        $project: {
          prodotto: '$_id',
          quantitaAttuale: '$quantitaTotale',
          unita: 1,
          scortaMinima: { $literal: 10 },
          daOrdinare: { $subtract: [10, '$quantitaTotale'] },
          _id: 0
        }
      }
    ]);
    
    // Invia notifiche per i prodotti sotto scorta
    if (prodottiSottoScorta.length > 0) {
      for (const prodotto of prodottiSottoScorta) {
        await notificationService.notifyLowStock({
          nome: prodotto.prodotto,
          quantitaAttuale: prodotto.quantitaAttuale,
          unitaMisura: prodotto.unita,
          scortaMinima: prodotto.scortaMinima
        });
      }
    }
    
    res.json({
      success: true,
      data: prodottiSottoScorta
    });
  } catch (error) {
    logger.error('Errore recupero prodotti sotto scorta:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei prodotti sotto scorta'
    });
  }
};

// Ottieni statistiche
const getStatistiche = async (req, res) => {
  try {
    const { dataInizio, dataFine } = req.query;
    
    const match = {};
    if (dataInizio || dataFine) {
      match.dataMovimento = {};
      if (dataInizio) match.dataMovimento.$gte = new Date(dataInizio);
      if (dataFine) match.dataMovimento.$lte = new Date(dataFine);
    }
    
    const [inventario, movimentiGiornalieri, valorePerCategoria] = await Promise.all([
      // Calcolo inventario corrente
      Movimento.aggregate([
        {
          $group: {
            _id: null,
            valoreToTale: { 
              $sum: {
                $cond: [
                  { $in: ['$tipo', ['carico', 'inventario']] },
                  '$valoreMovimento',
                  { $multiply: ['$valoreMovimento', -1] }
                ]
              }
            }
          }
        }
      ]),
      
      // Movimenti per giorno
      Movimento.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$dataMovimento" }
            },
            count: { $sum: 1 },
            valore: { $sum: '$valoreMovimento' }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ]),
      
      // Valore per categoria
      Movimento.aggregate([
        {
          $group: {
            _id: '$prodotto.categoria',
            valore: { $sum: '$valoreMovimento' }
          }
        }
      ])
    ]);
    
    // Conta prodotti sotto scorta
    const prodottiSottoScorta = await getProdottiSottoScortaCount();
    
    res.json({
      success: true,
      data: {
        valoreToTale: inventario[0]?.valoreToTale || 0,
        prodottiSottoScorta,
        prodottiInScadenza: 0, // Implementare in futuro
        movimentiOggi: await Movimento.countDocuments({
          dataMovimento: {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lte: new Date().setHours(23, 59, 59, 999)
          }
        }),
        movimentiPerGiorno: movimentiGiornalieri,
        perCategoria: valorePerCategoria.reduce((acc, cat) => {
          acc[cat._id || 'Non categorizzato'] = cat.valore;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    logger.error('Errore calcolo statistiche:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel calcolo delle statistiche'
    });
  }
};

// Helper function
async function getProdottiSottoScortaCount() {
  const result = await Movimento.aggregate([
    {
      $group: {
        _id: '$prodotto.nome',
        quantitaTotale: {
          $sum: {
            $cond: [
              { $in: ['$tipo', ['carico', 'inventario']] },
              '$quantita',
              { $multiply: ['$quantita', -1] }
            ]
          }
        }
      }
    },
    {
      $match: {
        quantitaTotale: { $lt: 10 }
      }
    },
    {
      $count: 'count'
    }
  ]);
  
  return result[0]?.count || 0;
}

export default {
  createMovimento,
  getMovimenti,
  getMovimentoById,
  updateMovimento,
  deleteMovimento,
  getInventario,
  getProdottiSottoScorta,
  getStatistiche,
  getGiacenze,
  getValore,
  getDashboard,
  getStats,
  checkLowStock,
  checkExpiringProducts
};
