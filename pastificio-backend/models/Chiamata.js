// models/Chiamata.js
import mongoose from 'mongoose';

const chiamataSchema = new mongoose.Schema({
  // Identificativo unico 3CX
  callId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Tipo chiamata
  tipo: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true,
    index: true
  },

  // Numero chiamante
  numeroChiamante: {
    type: String,
    required: true,
    index: true
  },

  // Numero chiamato
  numeroChiamato: {
    type: String,
    required: true
  },

  // Cliente associato (se esiste)
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    index: true
  },

  clienteNome: String, // Denormalizzato per performance

  // User che ha gestito la chiamata
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Estensione 3CX
  estensione: String,

  // Stato chiamata
  stato: {
    type: String,
    enum: ['ringing', 'answered', 'missed', 'busy', 'failed', 'ended'],
    default: 'ringing',
    index: true
  },

  // Timestamp
  dataOraInizio: {
    type: Date,
    default: Date.now,
    index: true
  },

  dataOraRisposta: Date,
  dataOraFine: Date,

  // Durata (secondi)
  durataSquillo: Number,
  durataChiamata: Number,
  duratatotale: Number,

  // Esito
  esito: {
    type: String,
    enum: ['risposta', 'persa', 'occupato', 'rifiutata', 'non_risponde', 'altro'],
    index: true
  },

  // Note
  note: String,
  noteAutomatiche: String, // Note generate dal sistema

  // Recording (se disponibile)
  recordingUrl: String,
  recordingDisponibile: {
    type: Boolean,
    default: false
  },

  // Tags per categorizzazione
  tags: [String],

  // Dati aggiuntivi 3CX
  cx3Data: {
    queueName: String,
    queueTime: Number,
    transferredFrom: String,
    didNumber: String,
    disposition: String
  },

  // Ordini creati durante/dopo la chiamata
  ordiniCollegati: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ordine'
  }],

  // Follow-up
  richiedeFollowUp: {
    type: Boolean,
    default: false
  },
  followUpData: Date,
  followUpNote: String,
  followUpCompletato: {
    type: Boolean,
    default: false
  },

  // Metadata
  metadata: {
    userAgent: String,
    ip: String,
    source: String
  }

}, {
  timestamps: true,
  collection: 'chiamate'
});

// Indici composti per query frequenti
chiamataSchema.index({ dataOraInizio: -1, tipo: 1 });
chiamataSchema.index({ cliente: 1, dataOraInizio: -1 });
chiamataSchema.index({ stato: 1, dataOraInizio: -1 });
chiamataSchema.index({ user: 1, dataOraInizio: -1 });

// Virtual: durata formattata
chiamataSchema.virtual('durataFormattata').get(function() {
  if (!this.durataChiamata) return '0s';
  
  const minuti = Math.floor(this.durataChiamata / 60);
  const secondi = this.durataChiamata % 60;
  
  if (minuti > 0) {
    return `${minuti}m ${secondi}s`;
  }
  return `${secondi}s`;
});

// Method: calcola durate
chiamataSchema.methods.calcolaDurate = function() {
  if (this.dataOraRisposta && this.dataOraInizio) {
    this.durataSquillo = Math.floor((this.dataOraRisposta - this.dataOraInizio) / 1000);
  }

  if (this.dataOraFine && this.dataOraRisposta) {
    this.durataChiamata = Math.floor((this.dataOraFine - this.dataOraRisposta) / 1000);
  }

  if (this.dataOraFine && this.dataOraInizio) {
    this.duratatotale = Math.floor((this.dataOraFine - this.dataOraInizio) / 1000);
  }
};

// Method: aggiorna stato
chiamataSchema.methods.aggiornaStato = async function(nuovoStato, datiAggiuntivi = {}) {
  this.stato = nuovoStato;

  // Timestamp automatici
  if (nuovoStato === 'answered' && !this.dataOraRisposta) {
    this.dataOraRisposta = new Date();
  }

  if (nuovoStato === 'ended' && !this.dataOraFine) {
    this.dataOraFine = new Date();
    this.calcolaDurate();

    // Determina esito se non impostato
    if (!this.esito) {
      if (this.durataChiamata > 0) {
        this.esito = 'risposta';
      } else {
        this.esito = 'persa';
      }
    }
  }

  if (nuovoStato === 'missed') {
    this.dataOraFine = new Date();
    this.esito = 'persa';
    this.calcolaDurate();
  }

  // Merge dati aggiuntivi
  Object.assign(this, datiAggiuntivi);

  await this.save();
  return this;
};

// Static: trova chiamate recenti
chiamataSchema.statics.findRecenti = function(limit = 20, filtri = {}) {
  return this.find(filtri)
    .populate('cliente', 'nome cognome telefono email')
    .populate('user', 'nome cognome username')
    .sort({ dataOraInizio: -1 })
    .limit(limit);
};

// Static: statistiche
chiamataSchema.statics.getStatistiche = async function(dataInizio, dataFine, filtri = {}) {
  const match = {
    dataOraInizio: {
      $gte: dataInizio,
      $lte: dataFine
    },
    ...filtri
  };

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totaleChiamate: { $sum: 1 },
        chiamateRisposte: {
          $sum: { $cond: [{ $eq: ['$esito', 'risposta'] }, 1, 0] }
        },
        chiamatePerse: {
          $sum: { $cond: [{ $eq: ['$esito', 'persa'] }, 1, 0] }
        },
        durataTotale: { $sum: '$durataChiamata' },
        durataMedia: { $avg: '$durataChiamata' }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totaleChiamate: 0,
      chiamateRisposte: 0,
      chiamatePerse: 0,
      tassoRisposta: 0,
      durataTotale: 0,
      durataMedia: 0
    };
  }

  const result = stats[0];
  result.tassoRisposta = result.totaleChiamate > 0
    ? Math.round((result.chiamateRisposte / result.totaleChiamate) * 100)
    : 0;

  return result;
};

// Static: trova per numero
chiamataSchema.statics.findByNumero = function(numero, limit = 10) {
  return this.find({
    $or: [
      { numeroChiamante: numero },
      { numeroChiamato: numero }
    ]
  })
    .populate('cliente', 'nome cognome')
    .sort({ dataOraInizio: -1 })
    .limit(limit);
};

// Middleware: before save
chiamataSchema.pre('save', function(next) {
  // Pulisci numeri (rimuovi spazi, trattini, etc)
  if (this.numeroChiamante) {
    this.numeroChiamante = this.numeroChiamante.replace(/[\s\-\(\)]/g, '');
  }
  if (this.numeroChiamato) {
    this.numeroChiamato = this.numeroChiamato.replace(/[\s\-\(\)]/g, '');
  }

  next();
});

const Chiamata = mongoose.model('Chiamata', chiamataSchema);

export default Chiamata;