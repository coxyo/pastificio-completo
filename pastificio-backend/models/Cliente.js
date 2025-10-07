// models/Cliente.js
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

// Genera codice cliente automatico prima del salvataggio
clienteSchema.pre('save', async function(next) {
  if (!this.codiceCliente) {
    try {
      const anno = new Date().getFullYear().toString().substr(-2);
      
      const ultimoCliente = await this.constructor
        .findOne({ codiceCliente: new RegExp(`^CL${anno}`) })
        .sort({ codiceCliente: -1 });
      
      let numeroProgressivo = 1;
      if (ultimoCliente && ultimoCliente.codiceCliente) {
        const ultimoNumero = parseInt(ultimoCliente.codiceCliente.substring(4)) || 0;
        numeroProgressivo = ultimoNumero + 1;
      }
      
      let tentativi = 0;
      let codiceGenerato = '';
      
      while (tentativi < 10) {
        codiceGenerato = `CL${anno}${numeroProgressivo.toString().padStart(4, '0')}`;
        
        const esistente = await this.constructor.findOne({ codiceCliente: codiceGenerato });
        if (!esistente) {
          this.codiceCliente = codiceGenerato;
          break;
        }
        
        numeroProgressivo++;
        tentativi++;
      }
      
      if (!this.codiceCliente) {
        const timestamp = Date.now().toString().substr(-8);
        this.codiceCliente = `CL${anno}${timestamp}`;
      }
      
      console.log('Codice cliente generato:', this.codiceCliente);
      
    } catch (error) {
      console.error('Errore generazione codice cliente:', error);
      const timestamp = Date.now().toString().substr(-6);
      this.codiceCliente = `CL${timestamp}`;
    }
  }
  next();
});

// Indici - RIMOSSI DUPLICATI
clienteSchema.index({ nome: 'text', cognome: 'text', ragioneSociale: 'text' });
clienteSchema.index({ telefono: 1 });
clienteSchema.index({ email: 1 });

// Metodi
clienteSchema.methods.aggiungiPunti = async function(punti, motivo) {
  this.punti += punti;
  
  if (this.punti >= 5000) {
    this.livelloFedelta = 'platino';
  } else if (this.punti >= 3000) {
    this.livelloFedelta = 'oro';
  } else if (this.punti >= 1000) {
    this.livelloFedelta = 'argento';
  } else {
    this.livelloFedelta = 'bronzo';
  }
  
  await this.save();
  return this;
};

clienteSchema.methods.aggiornaStatistiche = async function(ordine) {
  this.statistiche.numeroOrdini += 1;
  this.statistiche.totaleSpeso += ordine.totale;
  this.statistiche.ultimoOrdine = new Date();
  this.statistiche.mediaOrdine = this.statistiche.totaleSpeso / this.statistiche.numeroOrdini;
  
  const puntiDaAggiungere = Math.floor(ordine.totale);
  await this.aggiungiPunti(puntiDaAggiungere, `Ordine #${ordine.numeroOrdine}`);
  
  await this.save();
  return this;
};

// Virtual per nome completo
clienteSchema.virtual('nomeCompleto').get(function() {
  if (this.tipo === 'azienda') {
    return this.ragioneSociale;
  }
  return `${this.nome} ${this.cognome || ''}`.trim();
});

// Metodo statico per cercare clienti
clienteSchema.statics.cerca = async function(query) {
  const regex = new RegExp(query, 'i');
  
  return this.find({
    $or: [
      { codiceCliente: regex },
      { nome: regex },
      { cognome: regex },
      { ragioneSociale: regex },
      { telefono: regex },
      { email: regex }
    ],
    attivo: true
  })
  .limit(20)
  .sort('-statistiche.ultimoOrdine');
};

const Cliente = mongoose.model('Cliente', clienteSchema);

export default Cliente;