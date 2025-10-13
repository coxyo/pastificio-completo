// models/Prodotto.js
import mongoose from 'mongoose';

const varianteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  prezzoKg: {
    type: Number,
    default: 0
  },
  prezzoPezzo: {
    type: Number,
    default: 0
  },
  disponibile: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const prodottoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  descrizione: {
    type: String,
    default: ''
  },
  categoria: {
    type: String,
    required: true,
    enum: ['Ravioli', 'Dolci', 'Pardulas', 'Panadas', 'Altro'],
    default: 'Altro'
  },
  prezzoKg: {
    type: Number,
    default: 0,
    min: 0
  },
  prezzoPezzo: {
    type: Number,
    default: 0,
    min: 0
  },
  pezziPerKg: {
    type: Number,
    default: null
  },
  unitaMisuraDisponibili: [{
    type: String,
    enum: ['Kg', 'g', 'pz', 'dozzina', 'mezzo kg']
  }],
  varianti: [varianteSchema],
  disponibile: {
    type: Boolean,
    default: true
  },
  attivo: {
    type: Boolean,
    default: true
  },
  ordinamento: {
    type: Number,
    default: 999
  },
  immagine: {
    type: String,
    default: null
  },
  allergeni: [{
    type: String
  }],
  ingredienti: [{
    type: String
  }],
  tempoPreparazione: {
    type: Number, // minuti
    default: 0
  },
  giacenzaMinima: {
    type: Number,
    default: 0
  },
  giacenzaAttuale: {
    type: Number,
    default: 0
  },
  note: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indici per performance
prodottoSchema.index({ nome: 1 });
prodottoSchema.index({ categoria: 1 });
prodottoSchema.index({ disponibile: 1 });
prodottoSchema.index({ attivo: 1 });

// Metodi virtuali
prodottoSchema.virtual('prezzoDisplay').get(function() {
  if (this.prezzoKg > 0) {
    return `€${this.prezzoKg.toFixed(2)}/Kg`;
  } else if (this.prezzoPezzo > 0) {
    return `€${this.prezzoPezzo.toFixed(2)}/pz`;
  }
  return 'N/D';
});

// Pre-save middleware
prodottoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Prodotto = mongoose.model('Prodotto', prodottoSchema);

export default Prodotto;