// models/Prodotto.js - ✅ AGGIORNATO CON RICETTE E CALCOLO COSTI
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
  pezziPerKg: {
    type: Number,
    default: null
  },
  disponibile: {
    type: Boolean,
    default: true
  },
  descrizione: {
    type: String,
    default: ''
  },
  prezzoMaggiorazione: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Schema ingrediente nella ricetta
const ricettaIngredienteSchema = new mongoose.Schema({
  ingredienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingrediente'
  },
  ingredienteNome: {
    type: String,
    required: true
  },
  quantitaPerKg: {
    type: Number,
    required: true,
    min: 0
    // Quantità in unità base per 1 Kg di prodotto finito
    // Es: 0.400 significa 400g di quell'ingrediente per 1 Kg prodotto
  },
  unita: {
    type: String,
    enum: ['kg', 'g', 'l', 'ml', 'pz'],
    default: 'kg'
  },
  // Snapshot prezzo al momento dell'ultima modifica ricetta
  prezzoUnitarioSnapshot: {
    type: Number,
    default: 0
  },
  costoCalcolato: {
    type: Number,
    default: 0
    // prezzoUnitarioSnapshot * quantitaPerKg
  }
}, { _id: false });

// Schema istruzioni di preparazione
const istruzioniSchema = new mongoose.Schema({
  preparazione: { type: String, default: '' },
  cottura:      { type: String, default: '' },
  consigli:     { type: String, default: '' }
}, { _id: false });

// Schema storico costi
const storicoCostiSchema = new mongoose.Schema({
  data: {
    type: Date,
    default: Date.now
  },
  costoIngrediente: {
    type: Number,
    default: 0
  },
  costoTotale: {
    type: Number,
    default: 0
  },
  prezzoVendita: {
    type: Number,
    default: 0
  },
  margine: {
    type: Number,
    default: 0
  },
  note: String
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
    enum: ['Ravioli', 'Dolci', 'Pardulas', 'Panadas', 'Pasta', 'Altro'],
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
  unitaMisuraDisponibili: [{
    type: String,
    enum: ['Kg', 'g', 'pz', 'Pezzi', 'Unità', 'dozzina', 'mezzo kg', '€']
  }],
  hasVarianti: {
    type: Boolean,
    default: false
  },
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
  allergeni: [{ type: String }],
  ingredienti: [{ type: String }],
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

  // ============================================================
  // RICETTA E COSTI (NUOVO)
  // ============================================================
  ricetta: [ricettaIngredienteSchema],

  // Costo ingredienti calcolato automaticamente dall'ultima fattura
  costoIngredientiCalcolato: {
    type: Number,
    default: 0
  },
  // Resa ricetta: quanti Kg di prodotto finito escono dagli ingredienti inseriti
  // Es: ricetta con ~2kg ingredienti -> 1.8kg ciambelle finite -> resaRicetta = 1.8
  resaRicetta: {
    type: Number,
    default: 1,
    min: 0.01
  },
  // Campi legacy (mantenuti per retrocompatibilita DB)
  costoIngredientiManuale: { type: Number, default: null },
  usaCostoManuale: { type: Boolean, default: false },

  // Override overhead per singolo prodotto (null = usa configurazione globale)
  overheadPersonalizzato: {
    attivo: { type: Boolean, default: false },
    energia: { type: Number, default: null },
    gas: { type: Number, default: null },
    manodopera: { type: Number, default: null },
    affitto: { type: Number, default: null },
    tasse: { type: Number, default: null },
    imballaggi: { type: Number, default: null },
    varie: { type: Number, default: null }
  },

  // Costo totale produzione (ingredienti + overhead) - calcolato
  costoTotaleProduzione: {
    type: Number,
    default: 0
  },
  // Margine attuale % basato su prezzoKg
  margineAttuale: {
    type: Number,
    default: 0
  },

  // Storico costi
  storicoCosti: [storicoCostiSchema],

  // Istruzioni di preparazione
  istruzioni: { type: istruzioniSchema, default: () => ({}) },

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

// Virtual prezzo display
prodottoSchema.virtual('prezzoDisplay').get(function () {
  if (this.prezzoKg > 0) return `€${this.prezzoKg.toFixed(2)}/Kg`;
  else if (this.prezzoPezzo > 0) return `€${this.prezzoPezzo.toFixed(2)}/pz`;
  return 'N/D';
});

// Virtual: costo ingredienti effettivo per 1 Kg di prodotto finito (con resa)
prodottoSchema.virtual('costoIngredientiEffettivo').get(function () {
  const base = this.costoIngredientiCalcolato || 0;
  const resa = this.resaRicetta > 0 ? this.resaRicetta : 1;
  return base / resa;
});

// Pre-save middleware
prodottoSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.varianti && this.varianti.length > 0) {
    this.hasVarianti = true;
  } else {
    this.hasVarianti = false;
  }
  next();
});

// Pre-update middleware
prodottoSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const update = this.getUpdate();
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