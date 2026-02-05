// models/Fornitore.js
// Modello Fornitore per anagrafica fornitori pastificio

import mongoose from 'mongoose';

const FornitoreSchema = new mongoose.Schema({
  ragioneSociale: {
    type: String,
    required: [true, 'La ragione sociale è obbligatoria'],
    trim: true,
    unique: true,
    index: true
  },
  partitaIva: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    index: true
  },
  codiceFiscale: {
    type: String,
    trim: true,
    sparse: true
  },
  
  // Contatti
  contatti: {
    telefono: { type: String, trim: true },
    cellulare: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    pec: { type: String, trim: true, lowercase: true },
    fax: { type: String, trim: true },
    sito: { type: String, trim: true }
  },
  
  // Indirizzo
  indirizzo: {
    via: { type: String, trim: true },
    cap: { type: String, trim: true },
    comune: { type: String, trim: true },
    provincia: { type: String, trim: true, maxlength: 2 },
    nazione: { type: String, default: 'IT', trim: true }
  },
  
  // Categorie merceologiche
  categorieMerceologiche: [{
    type: String,
    enum: [
      'Materie Prime',
      'Ingredienti',
      'Farine e Semole',
      'Latticini',
      'Uova',
      'Zuccheri e Dolcificanti',
      'Frutta Secca',
      'Aromi e Spezie',
      'Grassi e Oli',
      'Imballaggi',
      'Accessori',
      'Attrezzature',
      'Pulizia',
      'Altro'
    ]
  }],
  
  // Condizioni commerciali
  condizioni: {
    pagamento: {
      type: String,
      enum: ['contanti', 'bonifico_30gg', 'bonifico_60gg', 'bonifico_90gg', 'riba_30gg', 'riba_60gg', 'altro'],
      default: 'contanti'
    },
    scontoBase: { type: Number, default: 0, min: 0, max: 100 },
    minimoOrdine: { type: Number, default: 0 },
    speseSpedizione: { type: Number, default: 0 },
    giorniConsegna: { type: Number, default: 1 },
    note: String
  },
  
  // Dati bancari
  bancari: {
    iban: { type: String, trim: true },
    banca: { type: String, trim: true },
    swift: { type: String, trim: true }
  },
  
  // Referente
  referente: {
    nome: { type: String, trim: true },
    ruolo: { type: String, trim: true },
    telefono: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true }
  },
  
  // Certificazioni
  certificazioni: [{
    tipo: { type: String, trim: true },
    numero: { type: String, trim: true },
    scadenza: Date,
    note: String
  }],
  
  // Valutazione
  valutazione: {
    qualita: { type: Number, min: 1, max: 5 },
    puntualita: { type: Number, min: 1, max: 5 },
    prezzo: { type: Number, min: 1, max: 5 },
    servizio: { type: Number, min: 1, max: 5 },
    media: { type: Number, min: 1, max: 5 },
    note: String
  },
  
  // Stato
  attivo: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Note generali
  note: {
    type: String,
    trim: true
  },
  
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indici
FornitoreSchema.index({ ragioneSociale: 'text' });
FornitoreSchema.index({ attivo: 1, ragioneSociale: 1 });
FornitoreSchema.index({ categorieMerceologiche: 1 });

// Pre-save: calcola media valutazione
FornitoreSchema.pre('save', function(next) {
  if (this.valutazione) {
    const voti = [
      this.valutazione.qualita,
      this.valutazione.puntualita,
      this.valutazione.prezzo,
      this.valutazione.servizio
    ].filter(v => v && v > 0);
    
    if (voti.length > 0) {
      this.valutazione.media = parseFloat((voti.reduce((a, b) => a + b, 0) / voti.length).toFixed(1));
    }
  }
  next();
});

export default mongoose.model('Fornitore', FornitoreSchema);