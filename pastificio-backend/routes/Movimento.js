import mongoose from 'mongoose';

const movimentoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['carico', 'scarico', 'inventario', 'rettifica']
  },
  prodotto: {
    nome: { type: String, required: true },
    categoria: { type: String }
  },
  quantita: {
    type: Number,
    required: true
  },
  unita: {
    type: String,
    default: 'kg'
  },
  prezzoUnitario: {
    type: Number,
    default: 0
  },
  valoreMovimento: {
    type: Number,
    default: 0
  },
  fornitore: {
    nome: { type: String }
  },
  documentoRiferimento: {
    tipo: String,
    numero: String,
    data: Date
  },
  lotto: String,
  dataScadenza: Date,
  note: String,
  dataMovimento: {
    type: Date,
    default: Date.now
  },
  utente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calcola il valore del movimento prima del salvataggio
movimentoSchema.pre('save', function(next) {
  this.valoreMovimento = this.quantita * this.prezzoUnitario;
  next();
});

export default mongoose.model('Movimento', movimentoSchema);