// models/Chiamata.js - Schema per storico chiamate 3CX
import mongoose from 'mongoose';

const chiamataSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  numero: {
    type: String,
    required: true,
    index: true
  },
  numeroOriginale: {
    type: String
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    default: null,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  source: {
    type: String,
    enum: ['3cx-extension', '3cx-webhook', 'test-manual', 'manual'],
    default: '3cx-extension'
  },
  esito: {
    type: String,
    enum: ['in_arrivo', 'risposta', 'non_risposta', 'occupato', 'sconosciuto', 'completato', 'persa'],
    default: 'in_arrivo'
  },
  durata: {
    type: Number, // Durata in secondi
    default: 0
  },
  note: {
    type: String,
    default: ''
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indici composti per query frequenti
chiamataSchema.index({ cliente: 1, timestamp: -1 });
chiamataSchema.index({ timestamp: -1 });
chiamataSchema.index({ esito: 1, timestamp: -1 });

// Metodi virtuali
chiamataSchema.virtual('durataMinuti').get(function() {
  return this.durata > 0 ? Math.floor(this.durata / 60) : 0;
});

// Metodo per formattare durata
chiamataSchema.methods.getDurataFormattata = function() {
  if (this.durata === 0) return '0s';
  
  const ore = Math.floor(this.durata / 3600);
  const minuti = Math.floor((this.durata % 3600) / 60);
  const secondi = this.durata % 60;
  
  let result = '';
  if (ore > 0) result += `${ore}h `;
  if (minuti > 0) result += `${minuti}m `;
  if (secondi > 0 || result === '') result += `${secondi}s`;
  
  return result.trim();
};

// Middleware pre-save
chiamataSchema.pre('save', function(next) {
  // Pulisci numero se presente
  if (this.numero) {
    this.numero = this.numero.replace(/\s+/g, '');
  }
  next();
});

const Chiamata = mongoose.model('Chiamata', chiamataSchema);

export default Chiamata;
