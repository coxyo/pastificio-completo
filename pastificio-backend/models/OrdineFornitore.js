// models/ordineFornitore.js
import mongoose from 'mongoose';

const OrdineFornitoreSchema = new mongoose.Schema({
  fornitore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fornitore',
    required: true
  },
  dataOrdine: {
    type: Date,
    default: Date.now,
    required: true
  },
  dataConsegnaPrevista: Date,
  dataConsegnaEffettiva: Date,
  stato: {
    type: String,
    enum: ['bozza', 'inviato', 'confermato', 'in_consegna', 'consegnato', 'annullato'],
    default: 'bozza'
  },
  articoli: [{
    ingrediente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingrediente'
    },
    quantitaOrdinata: {
      type: Number,
      required: true
    },
    quantitaConsegnata: {
      type: Number,
      default: 0
    },
    prezzoUnitario: Number,
    note: String
  }],
  totale: {
    type: Number,
    default: 0
  },
  numeroOrdine: String,
  numeroDocumentoFornitore: String,
  note: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indici
OrdineFornitoreSchema.index({ fornitore: 1, dataOrdine: -1 });
OrdineFornitoreSchema.index({ stato: 1 });
OrdineFornitoreSchema.index({ numeroOrdine: 1 });

// Virtual per ordini recenti del fornitore
OrdineFornitoreSchema.virtual('ordiniRecenti', {
  ref: 'OrdineFornitore',
  localField: 'fornitore',
  foreignField: 'fornitore',
  options: { 
    sort: { dataOrdine: -1 },
    limit: 10
  }
});

export default mongoose.model('OrdineFornitore', OrdineFornitoreSchema);