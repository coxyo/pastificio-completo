// models/fornitore.js
import mongoose from 'mongoose';

const FornitoreSchema = new mongoose.Schema({
  ragioneSociale: {
    type: String,
    required: true,
    unique: true
  },
  partitaIVA: {
    type: String,
    unique: true,
    sparse: true
  },
  codiceFiscale: String,
  indirizzo: {
    via: String,
    citta: String,
    cap: String,
    provincia: String
  },
  contatti: {
    telefono: String,
    email: String,
    pec: String,
    referente: String
  },
  categoriaForniture: [{
    type: String,
    enum: ['farina', 'uova', 'latticini', 'spezie', 'confezionamento', 'altro']
  }],
  condizioniPagamento: {
    tipo: {
      type: String,
      enum: ['contanti', 'bonifico', 'riba', 'rid'],
      default: 'bonifico'
    },
    giorni: {
      type: Number,
      default: 30
    }
  },
  note: String,
  attivo: {
    type: Boolean,
    default: true
  },
  valutazione: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, {
  timestamps: true
});

export default mongoose.model('Fornitore', FornitoreSchema);