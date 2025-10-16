// models/Prodotto.js - ✅ FIX ENUM UNITÀ MISURA
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
  pezziPerKg: {  // ✅ AGGIUNTO per varianti come "Ravioli piccoli"
    type: Number,
    default: null
  },
  disponibile: {
    type: Boolean,
    default: true
  },
  descrizione: {  // ✅ AGGIUNTO per descrizioni varianti
    type: String,
    default: ''
  },
  prezzoMaggiorazione: {  // ✅ AGGIUNTO per prezzi differenziati
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
    enum: ['Ravioli', 'Dolci', 'Pardulas', 'Panadas', 'Pasta', 'Altro'],  // ✅ Aggiunta "Pasta"
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
  // ✅ FIX PRINCIPALE: ENUM COMPLETO
  unitaMisuraDisponibili: [{
    type: String,
    enum: [
      'Kg', 
      'g', 
      'pz', 
      'Pezzi',        // ✅ AGGIUNTO
      'Unità',        // ✅ AGGIUNTO
      'dozzina', 
      'mezzo kg',
      '€'             // ✅ AGGIUNTO
    ]
  }],
  // ✅ AGGIUNTO: Flag per indicare se ha varianti
  hasVarianti: {
    type: Boolean,
    default: false
  },
  // ✅ ARRAY VARIANTI (già presente ma migliorato)
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
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indici per performance
prodottoSchema.index({ nome: 1 });
prodottoSchema.index({ categoria: 1 });
prodottoSchema.index({ disponibile: 1 });
prodottoSchema.index({ attivo: 1 });

// Metodi virtuali
prodottoSchema.virtual('prezzoDisplay').get(function() {
  if (this.prezzoKg > 0) {
    return `€${this.prezzoKg.toFixed(2)}/Kg`;
  } else if (this.prezzoPezzo > 0) {
    return `€${this.prezzoPezzo.toFixed(2)}/pz`;
  }
  return 'N/D';
});

// ✅ NUOVO: Virtual per controllare se è configurato correttamente
prodottoSchema.virtual('isConfiguratoCorrettamente').get(function() {
  // Deve avere almeno un prezzo configurato
  const haPrezzo = this.prezzoKg > 0 || this.prezzoPezzo > 0;
  
  // Se ha varianti, devono essere valide
  const variantiValide = !this.hasVarianti || 
    (this.varianti && this.varianti.length > 0 && 
     this.varianti.every(v => v.nome && (v.prezzoKg > 0 || v.prezzoPezzo > 0)));
  
  return haPrezzo && variantiValide;
});

// Pre-save middleware
prodottoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // ✅ Auto-imposta hasVarianti in base all'array
  if (this.varianti && this.varianti.length > 0) {
    this.hasVarianti = true;
  } else {
    this.hasVarianti = false;
  }
  
  next();
});

// ✅ NUOVO: Pre-update middleware per gestire varianti
prodottoSchema.pre(['findOneAndUpdate', 'updateOne'], function(next) {
  const update = this.getUpdate();
  
  // Auto-imposta hasVarianti se ci sono varianti nell'update
  if (update.varianti !== undefined) {
    if (update.varianti && Array.isArray(update.varianti) && update.varianti.length > 0) {
      update.hasVarianti = true;
    } else {
      update.hasVarianti = false;
    }
  }
  
  next();
});

const Prodotto = mongoose.model('Prodotto', prodottoSchema);

export default Prodotto;