// models/fattura.js
import mongoose from 'mongoose';
import logger from '../config/logger.js';

const RigaFatturaSchema = new mongoose.Schema({
  descrizione: {
    type: String,
    required: [true, 'La descrizione è obbligatoria'],
    trim: true
  },
  quantita: {
    type: Number,
    required: [true, 'La quantità è obbligatoria'],
    min: [0.01, 'La quantità deve essere maggiore di zero']
  },
  prezzoUnitario: {
    type: Number,
    required: [true, 'Il prezzo unitario è obbligatorio'],
    min: [0, 'Il prezzo unitario non può essere negativo']
  },
  aliquotaIva: {
    type: Number,
    required: [true, 'L\'aliquota IVA è obbligatoria'],
    default: 10, // Default per prodotti alimentari
    enum: [4, 5, 10, 22] // Aliquote IVA italiane comuni
  },
  sconto: {
    type: Number,
    default: 0,
    min: [0, 'Lo sconto non può essere negativo'],
    max: [100, 'Lo sconto non può superare il 100%']
  },
  importoNetto: {
    type: Number,
    default: function() {
      return (this.prezzoUnitario * this.quantita) * (1 - this.sconto / 100);
    }
  },
  importoIva: {
    type: Number,
    default: function() {
      return this.importoNetto * (this.aliquotaIva / 100);
    }
  },
  ordineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ordine'
  }
}, { _id: true });

const PagamentoSchema = new mongoose.Schema({
  data: {
    type: Date,
    required: [true, 'La data di pagamento è obbligatoria'],
    default: Date.now
  },
  importo: {
    type: Number,
    required: [true, 'L\'importo del pagamento è obbligatorio'],
    min: [0.01, 'L\'importo deve essere maggiore di zero']
  },
  metodoPagamento: {
    type: String,
    required: [true, 'Il metodo di pagamento è obbligatorio'],
    enum: ['Contanti', 'Bonifico', 'Carta di Credito', 'Assegno', 'Altro']
  },
  note: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const FatturaSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: [true, 'Il numero di fattura è obbligatorio'],
    unique: true,
    trim: true
  },
  anno: {
    type: Number,
    required: [true, 'L\'anno di emissione è obbligatorio'],
    min: 2000,
    max: 2100
  },
  dataEmissione: {
    type: Date,
    required: [true, 'La data di emissione è obbligatoria'],
    default: Date.now
  },
  dataScadenza: {
    type: Date,
    required: [true, 'La data di scadenza è obbligatoria']
  },
  cliente: {
    nome: {
      type: String,
      required: [true, 'Il nome del cliente è obbligatorio'],
      trim: true
    },
    indirizzo: {
      type: String,
      required: [true, 'L\'indirizzo del cliente è obbligatorio'],
      trim: true
    },
    codiceFiscale: {
      type: String,
      trim: true
    },
    partitaIva: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato email non valido']
    },
    telefono: {
      type: String,
      trim: true
    }
  },
  righe: [RigaFatturaSchema],
  pagamenti: [PagamentoSchema],
  note: {
    type: String,
    trim: true
  },
  stato: {
    type: String,
    required: true,
    enum: ['Bozza', 'Emessa', 'Pagata', 'Parzialmente Pagata', 'Annullata', 'Scaduta'],
    default: 'Bozza'
  },
  modalitaPagamento: {
    type: String,
    required: [true, 'La modalità di pagamento è obbligatoria'],
    enum: ['Contanti', 'Bonifico Bancario', 'Ricevuta Bancaria', 'Assegno', 'Altro'],
    default: 'Bonifico Bancario'
  },
  coordinateBancarie: {
    iban: { type: String, trim: true },
    banca: { type: String, trim: true },
    intestatario: { type: String, trim: true }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indici
FatturaSchema.index({ numero: 1, anno: 1 }, { unique: true });
FatturaSchema.index({ dataEmissione: 1 });
FatturaSchema.index({ dataScadenza: 1 });
FatturaSchema.index({ stato: 1 });
FatturaSchema.index({ 'cliente.nome': 1 });

// Virtuals
FatturaSchema.virtual('totaleImponibile').get(function() {
  return this.righe.reduce((sum, riga) => sum + riga.importoNetto, 0);
});

FatturaSchema.virtual('totaleIva').get(function() {
  return this.righe.reduce((sum, riga) => sum + riga.importoIva, 0);
});

FatturaSchema.virtual('totaleFattura').get(function() {
  return this.totaleImponibile + this.totaleIva;
});

FatturaSchema.virtual('totalePagato').get(function() {
  return this.pagamenti.reduce((sum, pagamento) => sum + pagamento.importo, 0);
});

FatturaSchema.virtual('saldo').get(function() {
  return this.totaleFattura - this.totalePagato;
});

FatturaSchema.virtual('isPagata').get(function() {
  return this.totalePagato >= this.totaleFattura;
});

// Middleware pre-save per aggiornare lo stato in base ai pagamenti
FatturaSchema.pre('save', function(next) {
  if (this.stato === 'Annullata') {
    return next();
  }

  if (this.isPagata) {
    this.stato = 'Pagata';
  } else if (this.totalePagato > 0) {
    this.stato = 'Parzialmente Pagata';
  } else if (this.stato === 'Bozza') {
    // Non cambiare lo stato se è una bozza
  } else {
    if (new Date() > this.dataScadenza) {
      this.stato = 'Scaduta';
    } else {
      this.stato = 'Emessa';
    }
  }
  
  next();
});

// Middleware per il logging
FatturaSchema.post('save', function(doc) {
  logger.info(`Fattura ${doc.numero}/${doc.anno} salvata`, { id: doc._id, stato: doc.stato });
});

FatturaSchema.post('remove', function(doc) {
  logger.info(`Fattura ${doc.numero}/${doc.anno} rimossa`, { id: doc._id });
});

// Metodo statico per generare numero progressivo
FatturaSchema.statics.generaNuovoNumero = async function(anno) {
  const annoCorrente = anno || new Date().getFullYear();
  const ultimaFattura = await this.findOne({ anno: annoCorrente }).sort({ numero: -1 });
  
  if (!ultimaFattura) {
    return "1";
  }
  
  const ultimoNumero = parseInt(ultimaFattura.numero, 10);
  return (ultimoNumero + 1).toString();
};

// Metodo per aggiungere un pagamento
FatturaSchema.methods.registraPagamento = function(pagamento) {
  this.pagamenti.push(pagamento);
  return this.save();
};

// Metodo per generare una fattura da un ordine
FatturaSchema.statics.daOrdine = async function(ordine, userId) {
  if (!ordine || !ordine.prodotti || !ordine.nomeCliente) {
    throw new Error('Ordine non valido o incompleto');
  }

  const anno = new Date().getFullYear();
  const numero = await this.generaNuovoNumero(anno);
  
  const dataEmissione = new Date();
  const dataScadenza = new Date();
  dataScadenza.setDate(dataScadenza.getDate() + 30); // Scadenza a 30 giorni
  
  const righe = [];
  
  // Aggiungi prodotti come righe di fattura
  for (const prodotto of ordine.prodotti) {
    righe.push({
      descrizione: prodotto.nome,
      quantita: prodotto.quantita,
      prezzoUnitario: prodotto.prezzo,
      aliquotaIva: 10, // Default per prodotti alimentari
      ordineId: ordine._id
    });
  }

  return new this({
    numero,
    anno,
    dataEmissione,
    dataScadenza,
    cliente: {
      nome: ordine.nomeCliente,
      indirizzo: ordine.indirizzoCliente || 'Da specificare',
      telefono: ordine.telefono
    },
    righe,
    stato: 'Bozza',
    createdBy: userId
  });
};

const Fattura = mongoose.model('Fattura', FatturaSchema);

export default Fattura;