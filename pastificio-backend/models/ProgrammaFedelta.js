// models/ProgrammaFedelta.js
import mongoose from 'mongoose';

const programmaFedeltaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  descrizione: String,
  tipo: {
    type: String,
    enum: ['punti_per_euro', 'punti_per_visita', 'punti_per_prodotto'],
    default: 'punti_per_euro'
  },
  valore: {
    type: Number,
    default: 1 // 1 punto per euro
  },
  livelli: [{
    nome: String,
    puntiMinimi: Number,
    benefici: [String],
    sconto: Number // percentuale
  }],
  premi: [{
    nome: String,
    descrizione: String,
    puntiRichiesti: Number,
    disponibile: Boolean,
    quantita: Number
  }],
  attivo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ProgrammaFedelta = mongoose.model('ProgrammaFedelta', programmaFedeltaSchema);
export default ProgrammaFedelta;