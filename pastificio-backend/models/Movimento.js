// models/movimento.js
import mongoose from 'mongoose';

const movimentoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['carico', 'scarico', 'rettifica', 'inventario'],
    required: true
  },
  prodotto: {
    nome: { type: String, required: true },
    categoria: { type: String },
    codice: { type: String }
  },
  quantita: {
    type: Number,
    required: true,
    min: 0
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
    nome: { type: String },
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Fornitore' }
  },
  documentoRiferimento: {
    tipo: { type: String },
    numero: { type: String },
    data: { type: Date }
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
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indici per query ottimizzate
movimentoSchema.index({ 'prodotto.nome': 1 });
movimentoSchema.index({ tipo: 1 });
movimentoSchema.index({ dataMovimento: -1 });

// Calcola il valore del movimento prima del salvataggio
movimentoSchema.pre('save', function(next) {
  this.valoreMovimento = this.quantita * this.prezzoUnitario;
  next();
});

// Metodi statici per report
movimentoSchema.statics.getGiacenze = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$prodotto.nome',
        categoria: { $first: '$prodotto.categoria' },
        quantitaTotale: {
          $sum: {
            $cond: [
              { $in: ['$tipo', ['carico', 'inventario']] },
              '$quantita',
              { $multiply: ['$quantita', -1] }
            ]
          }
        },
        valoreTotale: {
          $sum: {
            $cond: [
              { $in: ['$tipo', ['carico', 'inventario']] },
              '$valoreMovimento',
              { $multiply: ['$valoreMovimento', -1] }
            ]
          }
        }
      }
    },
    { $match: { quantitaTotale: { $gt: 0 } } },
    { $sort: { _id: 1 } }
  ]);
};

const Movimento = mongoose.model('Movimento', movimentoSchema);
export default Movimento;