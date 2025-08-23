// models/pianoProduzione.js
import mongoose from 'mongoose';

// Schema per la produzione all'interno di un piano
const ProduzioneSchema = new mongoose.Schema({
  ricetta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ricetta',
    required: [true, 'La ricetta è obbligatoria']
  },
  quantitaPianificata: {
    type: Number,
    required: [true, 'La quantità pianificata è obbligatoria'],
    min: [0, 'La quantità deve essere maggiore o uguale a 0']
  },
  quantitaProdotta: {
    type: Number,
    default: 0,
    min: [0, 'La quantità deve essere maggiore o uguale a 0']
  },
  oreStimate: {
    type: Number,
    default: 0
  },
  oreEffettive: {
    type: Number,
    default: 0
  },
  stato: {
    type: String,
    enum: ['pianificato', 'in_corso', 'completato', 'annullato'],
    default: 'pianificato'
  },
  priorita: {
    type: String,
    enum: ['bassa', 'normale', 'alta'],
    default: 'normale'
  },
  operatore: {
    type: String
  },
  note: {
    type: String
  },
  inizioProduzione: {
    type: Date
  },
  fineProduzione: {
    type: Date
  }
}, {
  timestamps: true
});

// Schema per il piano di produzione
const PianoProduzioneSchema = new mongoose.Schema({
  data: {
    type: Date,
    required: [true, 'La data è obbligatoria']
  },
  note: {
    type: String
  },
  produzioni: [ProduzioneSchema],
  stato: {
    type: String,
    enum: ['pianificato', 'in_corso', 'completato', 'annullato'],
    default: 'pianificato'
  },
  totaleOre: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Indice sulla data per ricerche efficienti
PianoProduzioneSchema.index({ data: 1 });

// Virtual per calcolare la percentuale di completamento
PianoProduzioneSchema.virtual('percentualeCompletamento').get(function() {
  if (!this.produzioni || this.produzioni.length === 0) return 0;
  
  const produzioniCompletate = this.produzioni.filter(p => p.stato === 'completato').length;
  return Math.round((produzioniCompletate / this.produzioni.length) * 100);
});

// Middleware pre-save per aggiornare lo stato in base alle produzioni
PianoProduzioneSchema.pre('save', function(next) {
  // Se non ci sono produzioni, mantieni lo stato attuale
  if (!this.produzioni || this.produzioni.length === 0) return next();
  
  // Controlla se tutte le produzioni sono completate
  const tutteComplete = this.produzioni.every(p => p.stato === 'completato');
  if (tutteComplete) {
    this.stato = 'completato';
    return next();
  }
  
  // Controlla se tutte le produzioni sono annullate
  const tutteAnnullate = this.produzioni.every(p => p.stato === 'annullato');
  if (tutteAnnullate) {
    this.stato = 'annullato';
    return next();
  }
  
  // Controlla se almeno una produzione è in corso
  const almenaUnaInCorso = this.produzioni.some(p => p.stato === 'in_corso');
  if (almenaUnaInCorso) {
    this.stato = 'in_corso';
    return next();
  }
  
  // Altrimenti, è pianificato
  this.stato = 'pianificato';
  next();
});

// Crea il modello
const PianoProduzione = mongoose.model('PianoProduzione', PianoProduzioneSchema);

export default PianoProduzione;