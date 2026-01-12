// models/Cliente.js - SCHEMA REALE DAL BACKEND
import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
  codiceCliente: {
    type: String,
    unique: true,
    required: false
  },
  
  tipo: {
    type: String,
    enum: ['privato', 'azienda'],
    default: 'privato',
    required: true
  },
  nome: {
    type: String,
    required: [true, 'Il nome è obbligatorio'],
    trim: true
  },
  cognome: {
    type: String,
    required: function() {
      return this.tipo === 'privato';
    },
    trim: true
  },
  ragioneSociale: {
    type: String,
    required: function() {
      return this.tipo === 'azienda';
    },
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email non valida']
  },
  telefono: {
    type: String,
    required: [true, 'Il telefono è obbligatorio'],
    trim: true
  },
  telefonoSecondario: {
    type: String,
    trim: true
  },
  indirizzo: {
    via: String,
    citta: String,
    cap: String,
    provincia: String
  },
  partitaIva: {
    type: String,
    trim: true
  },
  codiceFiscale: {
    type: String,
    uppercase: true,
    trim: true
  },
  note: String,
  tags: [String],
  
  // Fedeltà
  punti: {
    type: Number,
    default: 0
  },
  livelloFedelta: {
    type: String,
    enum: ['bronzo', 'argento', 'oro', 'platino'],
    default: 'bronzo'
  },
  
  // Statistiche
  statistiche: {
    numeroOrdini: {
      type: Number,
      default: 0
    },
    totaleSpeso: {
      type: Number,
      default: 0
    },
    ultimoOrdine: Date,
    mediaOrdine: {
      type: Number,
      default: 0
    }
  },
  
  // Preferenze
  preferenze: {
    pagamento: {
      type: String,
      enum: ['contanti', 'bonifico', 'carta', 'assegno'],
      default: 'contanti'
    },
    consegna: {
      type: String,
      enum: ['ritiro', 'domicilio'],
      default: 'ritiro'
    }
  },
  
  attivo: {
    type: Boolean,
    default: true
  },
  
  creatoDa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indici
clienteSchema.index({ nome: 'text', cognome: 'text', ragioneSociale: 'text' });
clienteSchema.index({ telefono: 1 });
clienteSchema.index({ email: 1 });
clienteSchema.index({ codiceCliente: 1 });

// Virtual per nome completo
clienteSchema.virtual('nomeCompleto').get(function() {
  if (this.tipo === 'azienda') {
    return this.ragioneSociale;
  }
  return `${this.nome} ${this.cognome || ''}`.trim();
});

export default mongoose.model('Cliente', clienteSchema);
