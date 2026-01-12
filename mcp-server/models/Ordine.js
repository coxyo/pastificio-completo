// models/Ordine.js - SCHEMA REALE DAL BACKEND GITHUB
// Versione semplificata per MCP (senza hook pre-save e metodi complessi)
import mongoose from 'mongoose';

// ========== SCHEMA PRODOTTO ==========
const prodottoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  quantita: {
    type: Number,
    required: true,
    min: 0
  },
  unita: {
    type: String,
    enum: [
      'kg', 'Kg', 'KG', 
      'pezzi', 'Pezzi', 'PEZZI', 'pz', 'Pz',
      'unità', 'Unità', 
      '€', 'EUR', 
      'g', 'G', 
      'l', 'L',
      'vassoio'
    ],
    default: 'kg'
  },
  unitaMisura: {
    type: String,
    enum: [
      'kg', 'Kg', 'KG', 
      'pezzi', 'Pezzi', 'PEZZI', 'pz', 'Pz',
      'unità', 'Unità', 
      '€', 'EUR', 
      'g', 'G', 
      'l', 'L',
      'vassoio'
    ],
    default: 'kg'
  },
  prezzo: {
    type: Number,
    required: true,
    min: 0
  },
  prezzoUnitario: {
    type: Number,
    min: 0
  },
  categoria: {
    type: String,
    trim: true,
    default: 'altro'
  },
  varianti: [{
    type: String,
    trim: true
  }],
  variante: {
    type: String,
    trim: true
  },
  dettagliCalcolo: {
    type: mongoose.Schema.Types.Mixed
  },
  note: {
    type: String,
    trim: true
  },
  noteCottura: {
    type: String,
    trim: true
  },
  statoProduzione: {
    type: String,
    enum: ['nuovo', 'in_lavorazione', 'completato', 'consegnato'],
    default: 'nuovo'
  }
}, { _id: false });

// ========== SCHEMA ORDINE PRINCIPALE ==========
const ordineSchema = new mongoose.Schema({
  nomeCliente: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  telefono: {
    type: String,
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: false,
    default: null,
    index: true
  },
  numeroOrdine: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  dataRitiro: {
    type: Date,
    required: true,
    index: true
  },
  oraRitiro: {
    type: String,
    required: true,
    trim: true
  },
  prodotti: [prodottoSchema],
  totale: {
    type: Number,
    default: 0,
    min: 0
  },
  totaleCalcolato: {
    type: Number,
    default: 0,
    min: 0
  },
  sconto: {
    type: Number,
    default: 0,
    min: 0
  },
  scontoPercentuale: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  stato: {
    type: String,
    enum: [
      'nuovo', 
      'in_lavorazione', 
      'inLavorazione',
      'pronto', 
      'completato', 
      'annullato',
      'in attesa'
    ],
    default: 'nuovo',
    index: true
  },
  note: {
    type: String,
    trim: true
  },
  notePreparazione: {
    type: String,
    trim: true
  },
  daViaggio: {
    type: Boolean,
    default: false,
    index: true
  },
  esclusioni: [{
    type: String,
    trim: true
  }],
  packaging: {
    type: String,
    enum: ['vassoio_carta', 'scatola', 'busta_carta', 'altro'],
    default: 'vassoio_carta'
  },
  numeroVassoioDimensione: {
    type: Number,
    enum: [2, 4, 6, 8, 10]
  },
  opzioniExtra: {
    daViaggio: {
      type: Boolean,
      default: false
    },
    etichettaIngredienti: {
      type: Boolean,
      default: false
    },
    confezionGift: {
      type: Boolean,
      default: false
    }
  },
  modalitaComposizione: {
    type: String,
    enum: ['libera', 'totale_prima', 'mix_completo']
  },
  metodoPagamento: {
    type: String,
    enum: ['contanti', 'carta', 'bonifico', 'satispay', 'altro'],
    default: 'contanti'
  },
  pagato: {
    type: Boolean,
    default: false,
    index: true
  },
  dataPagamento: {
    type: Date
  },
  creatoDa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modificatoDa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dataModifica: {
    type: Date
  },
  modificatoOffline: {
    type: Boolean,
    default: false
  },
  ultimaSincronizzazione: {
    type: Date
  },
  whatsappInviato: {
    type: Boolean,
    default: false
  },
  dataInvioWhatsapp: {
    type: Date
  },
  whatsappErrore: {
    type: String
  },
  emailInviata: {
    type: Boolean,
    default: false
  },
  dataInvioEmail: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'ordini'
});

// ========== INDICI ==========
ordineSchema.index({ nomeCliente: 1, dataRitiro: -1 });
ordineSchema.index({ cliente: 1, dataRitiro: -1 });
ordineSchema.index({ stato: 1, dataRitiro: 1 });
ordineSchema.index({ numeroOrdine: 1 });
ordineSchema.index({ daViaggio: 1 });
ordineSchema.index({ createdAt: -1 });
ordineSchema.index({ 'opzioniExtra.etichettaIngredienti': 1 });

export default mongoose.model('Ordine', ordineSchema);
