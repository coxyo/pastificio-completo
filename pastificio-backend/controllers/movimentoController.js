// controllers/movimentoController.js
import Movimento from '../models/movimento.js';
import Ingrediente from '../models/ingrediente.js';
import { logger } from '../config/logger.js';

// Ottiene tutti i movimenti
export const getMovimenti = async (req, res) => {
  try {
    const { ingrediente, tipo, startDate, endDate, sortBy } = req.query;
    const filter = {};
    
    // Filtri
    if (ingrediente) {
      filter.ingrediente = ingrediente;
    }
    
    if (tipo && tipo !== 'tutti') {
      filter.tipoMovimento = tipo;
    }
    
    // Filtro per data
    if (startDate || endDate) {
      filter.data = {};
      
      if (startDate) {
        filter.data.$gte = new Date(startDate);
      }
      
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.data.$lte = endDateTime;
      }
    }
    
    // Ordinamento
    const sort = {};
    if (sortBy) {
      const parts = sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.data = -1; // Default: più recenti prima
    }
    
    const movimenti = await Movimento.find(filter)
      .sort(sort)
      .populate('ingrediente', 'nome unitaMisura')
      .populate('createdBy', 'nome cognome');
    
    res.json({
      success: true,
      count: movimenti.length,
      data: movimenti
    });
  } catch (error) {
    logger.error(`Errore getMovimenti: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei movimenti'
    });
  }
};

// Ottiene un movimento specifico
export const getMovimento = async (req, res) => {
  try {
    const movimento = await Movimento.findById(req.params.id)
      .populate('ingrediente', 'nome unitaMisura')
      .populate('createdBy', 'nome cognome');
    
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
    logger.error(`Errore getMovimento: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del movimento'
    });
  }
};

// Crea un nuovo movimento
export const createMovimento = async (req, res) => {
  try {
    const { ingrediente: ingredienteId, quantita, ...rest } = req.body;
    
    // Trova l'ingrediente per ottenere giacenza attuale
    const ingrediente = await Ingrediente.findById(ingredienteId);
    
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        error: 'Ingrediente non trovato'
      });
    }
    
    // Calcola la giacenza attuale (totale movimenti precedenti)
    const movimentiPrecedenti = await Movimento.find({ ingrediente: ingredienteId })
      .sort({ data: -1 })
      .limit(1);
    
    let giacenzaIniziale = 0;
    
    if (movimentiPrecedenti.length > 0) {
      giacenzaIniziale = movimentiPrecedenti[0].giacenzaFinale;
    }
    
    // Calcola la giacenza finale
    const giacenzaFinale = giacenzaIniziale + parseFloat(quantita);
    
    if (giacenzaFinale < 0) {
      return res.status(400).json({
        success: false,
        error: 'La giacenza non può diventare negativa'
      });
    }
    
    // Crea il movimento
    const movimento = new Movimento({
      ingrediente: ingredienteId,
      quantita,
      giacenzaIniziale,
      giacenzaFinale,
      createdBy: req.user._id,
      ...rest
    });
    
    await movimento.save();
    
    res.status(201).json({
      success: true,
      data: movimento
    });
    
    logger.info(`Nuovo movimento registrato: ${req.body.tipoMovimento} di ${quantita} per ingrediente ${ingrediente.nome}`);
  } catch (error) {
    logger.error(`Errore createMovimento: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Ottiene statistiche sui movimenti
export const getStatisticheMovimenti = async (req, res) => {
  try {
    const oggi = new Date();
    const trentaGiorniFa = new Date();
    trentaGiorniFa.setDate(trentaGiorniFa.getDate() - 30);
    
    // Totale movimenti ultimi 30 giorni
    const totaleMovimentiRecenti = await Movimento.countDocuments({
      data: { $gte: trentaGiorniFa, $lte: oggi }
    });
    
    // Totale movimenti per tipo negli ultimi 30 giorni
    const movimentiPerTipo = await Movimento.aggregate([
      {
        $match: {
          data: { $gte: trentaGiorniFa, $lte: oggi }
        }
      },
      {
        $group: {
          _id: '$tipoMovimento',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Movimenti per giorno degli ultimi 30 giorni
    const movimentiPerGiorno = await Movimento.aggregate([
      {
        $match: {
          data: { $gte: trentaGiorniFa, $lte: oggi }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$data' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        totaleMovimentiRecenti,
        movimentiPerTipo,
        movimentiPerGiorno
      }
    });
  } catch (error) {
    logger.error(`Errore getStatisticheMovimenti: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche'
    });
  }
};

// Ottiene le scorte attuali di un ingrediente
export const getScorteIngrediente = async (req, res) => {
  try {
    const ingredienteId = req.params.id;
    
    // Trova l'ultimo movimento per ottenere le scorte attuali
    const ultimoMovimento = await Movimento.findOne({ ingrediente: ingredienteId })
      .sort({ data: -1 });
    
    // Trova gli ultimi 5 movimenti
    const ultimiMovimenti = await Movimento.find({ ingrediente: ingredienteId })
      .sort({ data: -1 })
      .limit(5);
    
    const scorteAttuali = ultimoMovimento ? ultimoMovimento.giacenzaFinale : 0;
    
    res.json({
      success: true,
      data: {
        scorteAttuali,
        ultimiMovimenti
      }
    });
  } catch (error) {
    logger.error(`Errore getScorteIngrediente: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle scorte'
    });
  }
};

export default {
  getMovimenti,
  getMovimento,
  createMovimento,
  getStatisticheMovimenti,
  getScorteIngrediente
};