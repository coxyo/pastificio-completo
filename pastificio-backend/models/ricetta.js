// models/ricetta.js
import mongoose from 'mongoose';

// Schema per ingredienti nella ricetta
const IngredienteRicettaSchema = new mongoose.Schema({
  ingrediente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingrediente',
    required: [true, 'L\'ingrediente è obbligatorio']
  },
  quantita: {
    type: Number,
    required: [true, 'La quantità è obbligatoria'],
    min: [0, 'La quantità deve essere maggiore di 0']
  },
  note: {
    type: String
  }
});

// Schema per la ricetta
const RicettaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Il nome è obbligatorio'],
    trim: true,
    maxlength: [100, 'Il nome non può superare i 100 caratteri']
  },
  categoria: {
    type: String,
    required: [true, 'La categoria è obbligatoria'],
    enum: ['pasta', 'dolci', 'panadas', 'altro'],
    default: 'altro'
  },
  descrizione: {
    type: String,
    maxlength: [1000, 'La descrizione non può superare i 1000 caratteri']
  },
  procedimento: {
    type: String
  },
  tempoPreparazione: {
    type: Number,
    default: 0,
    min: [0, 'Il tempo di preparazione deve essere maggiore o uguale a 0']
  },
  ingredienti: [IngredienteRicettaSchema],
  resa: {
    type: Number,
    min: [0, 'La resa deve essere maggiore di 0']
  },
  prezzo: {
    type: Number,
    min: [0, 'Il prezzo deve essere maggiore o uguale a 0']
  },
  costo: {
    type: Number,
    min: [0, 'Il costo deve essere maggiore o uguale a 0']
  },
  attivo: {
    type: Boolean,
    default: true
  },
  immagine: {
    type: String
  },
  note: {
    type: String
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

// Indici per ricerche efficienti
RicettaSchema.index({ nome: 1 });
RicettaSchema.index({ categoria: 1 });
RicettaSchema.index({ attivo: 1 });

// Virtual per calcolare il margine
RicettaSchema.virtual('margine').get(function() {
  if (!this.prezzo || !this.costo) return 0;
  return this.prezzo - this.costo;
});

// Virtual per calcolare il margine percentuale
RicettaSchema.virtual('marginePercentuale').get(function() {
  if (!this.prezzo || this.prezzo === 0) return 0;
  return ((this.margine / this.prezzo) * 100).toFixed(2);
});

// Middleware pre-save per calcolare il costo
RicettaSchema.pre('save', async function(next) {
  try {
    // Se non ci sono ingredienti, imposta il costo a 0
    if (!this.ingredienti || this.ingredienti.length === 0) {
      this.costo = 0;
      return next();
    }
    
    // Per calcolare il costo reale, avremmo bisogno di popolare gli ingredienti
    // Questa è solo una stima basata sui dati disponibili
    // In un caso reale, dovresti popolare gli ingredienti prima di salvare
    
    // Se il documento è nuovo o il costo non è stato impostato manualmente
    // calcola il costo automaticamente
    if (this.isNew || this.isModified('ingredienti')) {
      // Avremmo bisogno di popolare gli ingredienti per ottenere i prezzi
      // Per ora, mantenere il costo attuale
    }
    
    next();
  } catch (err) {
    next(err);
  }
});

// Crea il modello
const Ricetta = mongoose.model('Ricetta', RicettaSchema);

export default Ricetta;