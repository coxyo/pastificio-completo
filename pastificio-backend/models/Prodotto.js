// models/Prodotto.js - AGGIORNATO per gestire varianti e configurazioni complete
import mongoose from 'mongoose';

const varianteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true
  },
  prezzoKg: {
    type: Number,
    min: 0
  },
  prezzoPezzo: {
    type: Number,
    min: 0
  },
  pezziPerKg: {
    type: Number,
    min: 0
  }
}, { _id: false });

const prodottoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  categoria: {
    type: String,
    required: true,
    enum: ['Ravioli', 'Dolci', 'Panadas', 'Pasta', 'Altro']
  },
  descrizione: {
    type: String,
    trim: true
  },
  
  // ✅ PREZZI
  prezzoKg: {
    type: Number,
    min: 0
  },
  prezzoPezzo: {
    type: Number,
    min: 0
  },
  
  // ✅ CONFIGURAZIONE VENDITA
  modalitaVendita: {
    type: String,
    required: true,
    enum: ['solo_kg', 'solo_pezzo', 'mista', 'peso_variabile'],
    default: 'mista'
  },
  
  unitaMisuraDisponibili: [{
    type: String,
    enum: ['Kg', 'Pezzi', 'Unità', '€']
  }],
  
  // ✅ PEZZI PER KG
  pezziPerKg: {
    type: Number,
    min: 0
  },
  
  // ✅ VARIANTI (per prodotti come Ravioli, Pardulas, Ciambelle)
  hasVarianti: {
    type: Boolean,
    default: false
  },
  
  varianti: [varianteSchema],
  
  // ✅ COMPOSIZIONE (per dolci misti)
  composizione: {
    type: Map,
    of: Number
  },
  
  // ✅ STATO E VISIBILITÀ
  disponibile: {
    type: Boolean,
    default: true
  },
  
  attivo: {
    type: Boolean,
    default: true
  },
  
  // ✅ INFORMAZIONI AGGIUNTIVE
  immagine: String,
  
  ingredienti: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingrediente'
  }],
  
  allergeni: [String],
  
  tempoPreparazione: {
    type: Number, // minuti
    min: 0
  },
  
  porzioni: {
    type: Number,
    min: 0
  },
  
  // ✅ ORDINAMENTO E PRIORITÀ
  ordine: {
    type: Number,
    default: 0
  },
  
  // ✅ NOTE INTERNE
  note: String
  
}, {
  timestamps: true
});

// ✅ INDICI
prodottoSchema.index({ nome: 1 });
prodottoSchema.index({ categoria: 1 });
prodottoSchema.index({ disponibile: 1 });
prodottoSchema.index({ attivo: 1 });
prodottoSchema.index({ ordine: 1 });

// ✅ METODI VIRTUALI
prodottoSchema.virtual('nomeCompleto').get(function() {
  return this.nome;
});

// ✅ METODI ISTANZA
prodottoSchema.methods.calcolaPrezzo = function(quantita, unita, varianteNome = null) {
  let prezzo = 0;
  
  if (this.hasVarianti && varianteNome) {
    const variante = this.varianti.find(v => v.nome === varianteNome);
    if (!variante) {
      throw new Error('Variante non trovata');
    }
    
    if (unita === 'Kg') {
      prezzo = variante.prezzoKg * quantita;
    } else if (unita === 'Pezzi' || unita === 'Unità') {
      prezzo = variante.prezzoPezzo * quantita;
    }
  } else {
    if (unita === 'Kg') {
      prezzo = this.prezzoKg * quantita;
    } else if (unita === 'Pezzi' || unita === 'Unità') {
      prezzo = this.prezzoPezzo * quantita;
    }
  }
  
  return Math.round(prezzo * 100) / 100; // Arrotonda a 2 decimali
};

// ✅ METODI STATICI
prodottoSchema.statics.getByCategoria = function(categoria) {
  return this.find({ categoria, attivo: true }).sort({ ordine: 1, nome: 1 });
};

prodottoSchema.statics.getDisponibili = function() {
  return this.find({ disponibile: true, attivo: true }).sort({ categoria: 1, ordine: 1 });
};

const Prodotto = mongoose.model('Prodotto', prodottoSchema);

export default Prodotto;