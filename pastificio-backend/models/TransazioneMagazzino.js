// models/TransazioneMagazzino.js
import mongoose from 'mongoose';
import logger from '../config/logger.js';

/**
 * Schema per le transazioni di magazzino
 * Questa è una cronologia di tutti i movimenti di magazzino per tracciabilità e audit
 */
const TransazioneMagazzinoSchema = new mongoose.Schema({
  tipoOperazione: {
    type: String,
    required: [true, 'Il tipo di operazione è obbligatorio'],
    enum: ['ingresso', 'uscita', 'aggiustamento', 'scaduto', 'trasferimento'],
    index: true
  },
  ingrediente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingrediente',
    required: [true, 'L\'ingrediente è obbligatorio'],
    index: true
  },
  quantita: {
    type: Number,
    required: [true, 'La quantità è obbligatoria'],
    validate: {
      validator: function(val) {
        // Per le uscite e gli scaduti, la quantità deve essere negativa
        if ((this.tipoOperazione === 'uscita' || this.tipoOperazione === 'scaduto') && val >= 0) {
          return false;
        }
        // Per gli ingressi, la quantità deve essere positiva
        if (this.tipoOperazione === 'ingresso' && val <= 0) {
          return false;
        }
        return true;
      },
      message: 'La quantità deve essere coerente con il tipo di operazione'
    }
  },
  valoreTotale: {
    type: Number,
    default: 0
  },
  magazzino: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magazzino'
  },
  magazzinoDestinazione: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magazzino'
  },
  lotto: {
    type: String,
    trim: true
  },
  dataScadenza: {
    type: Date
  },
  fornitore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fornitore'
  },
  ordine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ordine'
  },
  produzioneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PianoProduzione'
  },
  numeroOrdine: {
    type: String,
    trim: true
  },
  numeroFattura: {
    type: String,
    trim: true
  },
  dataDocumento: {
    type: Date
  },
  utente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utente è obbligatorio'],
    index: true
  },
  note: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indici
TransazioneMagazzinoSchema.index({ ingrediente: 1 });
TransazioneMagazzinoSchema.index({ tipoOperazione: 1 });
TransazioneMagazzinoSchema.index({ createdAt: 1 });
TransazioneMagazzinoSchema.index({ fornitore: 1 });
TransazioneMagazzinoSchema.index({ utente: 1 });
TransazioneMagazzinoSchema.index({ magazzino: 1, createdAt: -1 });
TransazioneMagazzinoSchema.index({ dataDocumento: 1 });

// Virtuals
TransazioneMagazzinoSchema.virtual('descrizioneOperazione').get(function() {
  const operazioni = {
    'ingresso': 'Carico',
    'uscita': 'Scarico',
    'aggiustamento': 'Aggiustamento inventario',
    'scaduto': 'Prodotto scaduto',
    'trasferimento': 'Trasferimento tra magazzini'
  };
  
  return operazioni[this.tipoOperazione] || this.tipoOperazione;
});

// Middleware pre-save
TransazioneMagazzinoSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      // Se è un trasferimento, verifica che ci sia un magazzino destinazione
      if (this.tipoOperazione === 'trasferimento' && !this.magazzinoDestinazione) {
        throw new Error('Per un trasferimento è necessario specificare il magazzino di destinazione');
      }
      
      // Calcola valoreTotale se non specificato
      if (!this.valoreTotale && this.quantita) {
        const Ingrediente = mongoose.model('Ingrediente');
        const ingrediente = await Ingrediente.findById(this.ingrediente);
        
        if (ingrediente) {
          this.valoreTotale = this.quantita * (ingrediente.prezzoMedio || ingrediente.prezzoUnitario);
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware post-save per il logging
TransazioneMagazzinoSchema.post('save', function(doc) {
  logger.info(`Transazione magazzino registrata: ${doc.tipoOperazione} di ${Math.abs(doc.quantita)} di ${doc.ingrediente}`, {
    id: doc._id,
    tipoOperazione: doc.tipoOperazione,
    ingrediente: doc.ingrediente,
    quantita: doc.quantita,
    utente: doc.utente
  });
});

// Metodi statici
TransazioneMagazzinoSchema.statics.getMovimentiPeriodo = async function(dataInizio, dataFine, filtri = {}) {
  const query = {
    createdAt: {}
  };
  
  if (dataInizio) {
    query.createdAt.$gte = new Date(dataInizio);
  }
  
  if (dataFine) {
    query.createdAt.$lte = new Date(dataFine);
  }
  
  // Aggiungi filtri opzionali
  if (filtri.tipoOperazione) {
    query.tipoOperazione = filtri.tipoOperazione;
  }
  
  if (filtri.ingrediente) {
    query.ingrediente = filtri.ingrediente;
  }
  
  if (filtri.magazzino) {
    query.magazzino = filtri.magazzino;
  }
  
  if (filtri.utente) {
    query.utente = filtri.utente;
  }
  
  if (filtri.fornitore) {
    query.fornitore = filtri.fornitore;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('ingrediente', 'nome codice unitaMisura')
    .populate('utente', 'username')
    .populate('magazzino', 'nome')
    .populate('magazzinoDestinazione', 'nome')
    .populate('fornitore', 'ragioneSociale');
};

TransazioneMagazzinoSchema.statics.getStatisticheMovimenti = async function(dataInizio, dataFine, raggruppamento = 'giorno') {
  const query = {
    createdAt: {}
  };
  
  if (dataInizio) {
    query.createdAt.$gte = new Date(dataInizio);
  }
  
  if (dataFine) {
    query.createdAt.$lte = new Date(dataFine);
  }
  
  const groupByDate = {};
  switch (raggruppamento) {
    case 'ora':
      groupByDate.anno = { $year: "$createdAt" };
      groupByDate.mese = { $month: "$createdAt" };
      groupByDate.giorno = { $dayOfMonth: "$createdAt" };
      groupByDate.ora = { $hour: "$createdAt" };
      break;
    case 'giorno':
      groupByDate.anno = { $year: "$createdAt" };
      groupByDate.mese = { $month: "$createdAt" };
      groupByDate.giorno = { $dayOfMonth: "$createdAt" };
      break;
    case 'settimana':
      groupByDate.anno = { $year: "$createdAt" };
      groupByDate.settimana = { $week: "$createdAt" };
      break;
    case 'mese':
      groupByDate.anno = { $year: "$createdAt" };
      groupByDate.mese = { $month: "$createdAt" };
      break;
    default:
      groupByDate.anno = { $year: "$createdAt" };
      groupByDate.mese = { $month: "$createdAt" };
      groupByDate.giorno = { $dayOfMonth: "$createdAt" };
  }
  
  return this.aggregate([
    { $match: query },
    { $group: {
      _id: groupByDate,
      totaleIngressi: {
        $sum: {
          $cond: [
            { $eq: ["$tipoOperazione", "ingresso"] },
            "$quantita",
            0
          ]
        }
      },
      totaleUscite: {
        $sum: {
          $cond: [
            { $eq: ["$tipoOperazione", "uscita"] },
            { $abs: "$quantita" },
            0
          ]
        }
      },
      totaleAggiustamenti: {
        $sum: {
          $cond: [
            { $eq: ["$tipoOperazione", "aggiustamento"] },
            "$quantita",
            0
          ]
        }
      },
      totaleScaduti: {
        $sum: {
          $cond: [
            { $eq: ["$tipoOperazione", "scaduto"] },
            { $abs: "$quantita" },
            0
          ]
        }
      },
      valoreTotaleIngressi: {
        $sum: {
          $cond: [
            { $eq: ["$tipoOperazione", "ingresso"] },
            "$valoreTotale",
            0
          ]
        }
      },
      valoreTotaleUscite: {
        $sum: {
          $cond: [
            { $eq: ["$tipoOperazione", "uscita"] },
            { $abs: "$valoreTotale" },
            0
          ]
        }
      },
      conteggio: { $sum: 1 }
    }},
    { $sort: {
      "_id.anno": 1,
      "_id.mese": 1,
      "_id.giorno": 1,
      "_id.ora": 1,
      "_id.settimana": 1
    }}
  ]);
};

TransazioneMagazzinoSchema.statics.getTopIngredienti = async function(dataInizio, dataFine, limit = 10) {
  const query = {
    createdAt: {},
    tipoOperazione: 'uscita' // Solo uscite per calcolare il consumo
  };
  
  if (dataInizio) {
    query.createdAt.$gte = new Date(dataInizio);
  }
  
  if (dataFine) {
    query.createdAt.$lte = new Date(dataFine);
  }
  
  return this.aggregate([
    { $match: query },
    { $group: {
      _id: "$ingrediente",
      totaleConsumato: { $sum: { $abs: "$quantita" } },
      valoreTotale: { $sum: { $abs: "$valoreTotale" } },
      conteggio: { $sum: 1 }
    }},
    { $sort: { totaleConsumato: -1 } },
    { $limit: limit },
    { $lookup: {
      from: 'ingrediente',
      localField: '_id',
      foreignField: '_id',
      as: 'dettagliIngrediente'
    }},
    { $unwind: '$dettagliIngrediente' },
    { $project: {
      _id: 0,
      ingrediente: '$_id',
      nome: '$dettagliIngrediente.nome',
      codice: '$dettagliIngrediente.codice',
      categoria: '$dettagliIngrediente.categoria',
      unitaMisura: '$dettagliIngrediente.unitaMisura',
      totaleConsumato: 1,
      valoreTotale: 1,
      conteggio: 1
    }}
  ]);
};

// Crea il modello
const TransazioneMagazzino = mongoose.model('TransazioneMagazzino', TransazioneMagazzinoSchema);

export default TransazioneMagazzino;