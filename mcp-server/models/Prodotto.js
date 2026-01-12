// models/Prodotto.js - SCHEMA REALE DAL BACKEND
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
  pezziPerKg: {
    type: Number,
    default: null
  },
  disponibile: {
    type: Boolean,
    default: true
  },
  descrizione: {
    type: String,
    default: ''
  },
  prezzoMaggiorazione: {
    type: Number,
    default: 0
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
    enum: ['Ravioli', 'Dolci', 'Pardulas', 'Panadas', 'Pasta', 'Altro'],
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
    enum: ['Kg', 'g', 'pz', 'Pezzi', 'Unità', 'dozzina', 'mezzo kg', '€']
  }],
  hasVarianti: {
    type: Boolean,
    default: false
  },
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
    type: Number,
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
  }
}, {
  timestamps: true
});

// Indici per performance
prodottoSchema.index({ nome: 1 });
prodottoSchema.index({ categoria: 1 });
prodottoSchema.index({ disponibile: 1 });
prodottoSchema.index({ attivo: 1 });

// Virtual per prezzo display
prodottoSchema.virtual('prezzoDisplay').get(function() {
  if (this.prezzoKg > 0) {
    return `€${this.prezzoKg.toFixed(2)}/Kg`;
  } else if (this.prezzoPezzo > 0) {
    return `€${this.prezzoPezzo.toFixed(2)}/pz`;
  }
  return 'N/D';
});

export default mongoose.model('Prodotto', prodottoSchema);
