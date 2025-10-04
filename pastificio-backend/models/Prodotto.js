// models/prodotto.js
import mongoose from 'mongoose';

const prodottoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    enum: ['pasta', 'dolci', 'panadas', 'altro']
  },
  descrizione: String,
  prezzo: {
    type: Number,
    required: true,
    min: 0
  },
  unitaMisura: {
    type: String,
    default: 'pz',
    enum: ['pz', 'kg', 'g', 'l', 'ml']
  },
  disponibile: {
    type: Boolean,
    default: true
  },
  immagine: String,
  ingredienti: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingrediente'
  }],
  allergeni: [String],
  tempoPreparazione: Number, // in minuti
  porzioni: Number
}, {
  timestamps: true
});

// Indici
prodottoSchema.index({ nome: 1 });
prodottoSchema.index({ categoria: 1 });
prodottoSchema.index({ disponibile: 1 });

const Prodotto = mongoose.model('Prodotto', prodottoSchema);

export default Prodotto;