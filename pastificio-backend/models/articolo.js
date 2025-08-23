// pastificio-backend/models/articolo.js
import mongoose from 'mongoose';

const articoloSchema = new mongoose.Schema({
  codice: {
    type: String,
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true
  },
  descrizione: String,
  categoria: {
    type: String,
    enum: ['farina', 'ingrediente', 'confezionamento', 'altro'],
    required: true
  },
  unitaMisura: {
    type: String,
    enum: ['kg', 'l', 'pz'],
    default: 'kg'
  },
  giacenza: {
    type: Number,
    default: 0,
    min: 0
  },
  scorraMinima: {
    type: Number,
    default: 0,
    min: 0
  },
  prezzoAcquisto: {
    type: Number,
    default: 0,
    min: 0
  },
  fornitorePreferito: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fornitore'
  },
  attivo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Metodo per aggiornare giacenza
articoloSchema.methods.aggiornaGiacenza = async function(quantita, tipo) {
  if (tipo === 'carico') {
    this.giacenza += quantita;
  } else if (tipo === 'scarico') {
    if (this.giacenza < quantita) {
      throw new Error('Giacenza insufficiente');
    }
    this.giacenza -= quantita;
  }
  return this.save();
};

export default mongoose.model('Articolo', articoloSchema);