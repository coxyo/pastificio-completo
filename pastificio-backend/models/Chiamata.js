// pastificio-backend/src/models/Chiamata.js
import mongoose from 'mongoose';

const chiamataSchema = new mongoose.Schema({
  // ID Chiamata 3CX
  callId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Direzione chiamata
  direzione: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  
  // Numero telefonico
  numero: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Cliente associato (se trovato)
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    default: null,
    index: true
  },
  
  clienteNome: {
    type: String,
    default: null
  },
  
  // Interno 3CX che ha gestito la chiamata
  interno: {
    type: String,
    required: true,
    default: '19810'
  },
  
  // Stato chiamata
  stato: {
    type: String,
    enum: ['ringing', 'answered', 'missed', 'busy', 'failed', 'completed'],
    default: 'ringing'
  },
  
  // Durata in secondi
  durata: {
    type: Number,
    default: 0
  },
  
  // Timestamp
  inizioChiamata: {
    type: Date,
    required: true,
    index: true
  },
  
  fineChiamata: {
    type: Date,
    default: null
  },
  
  // URL registrazione (se disponibile)
  registrazioneUrl: {
    type: String,
    default: null
  },
  
  // Note aggiunte dall'operatore
  note: {
    type: String,
    default: ''
  },
  
  // Tag personalizzati
  tags: [{
    type: String
  }],
  
  // Esito chiamata (da compilare dopo)
  esito: {
    type: String,
    enum: ['ordine', 'informazioni', 'reclamo', 'altro', 'non_risposto'],
    default: null
  },
  
  // Chiamata ha generato un ordine?
  ordineCreato: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ordine',
    default: null
  },
  
  // Metadati aggiuntivi
  metadata: {
    device: String,
    userAgent: String,
    ip: String
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indici composti per query frequenti
chiamataSchema.index({ cliente: 1, inizioChiamata: -1 });
chiamataSchema.index({ interno: 1, inizioChiamata: -1 });
chiamataSchema.index({ stato: 1, inizioChiamata: -1 });
chiamataSchema.index({ direzione: 1, stato: 1 });

// Virtual per durata formattata
chiamataSchema.virtual('durataFormattata').get(function() {
  if (!this.durata) return '0s';
  
  const minuti = Math.floor(this.durata / 60);
  const secondi = this.durata % 60;
  
  if (minuti > 0) {
    return `${minuti}m ${secondi}s`;
  }
  return `${secondi}s`;
});

// Metodo per aggiornare stato chiamata
chiamataSchema.methods.aggiornaStato = async function(nuovoStato, durata = null) {
  this.stato = nuovoStato;
  
  if (durata !== null) {
    this.durata = durata;
  }
  
  if (['completed', 'missed', 'busy', 'failed'].includes(nuovoStato)) {
    this.fineChiamata = new Date();
    
    if (!this.durata && this.inizioChiamata) {
      this.durata = Math.floor((this.fineChiamata - this.inizioChiamata) / 1000);
    }
  }
  
  await this.save();
  return this;
};

// Metodo per associare cliente
chiamataSchema.methods.associaCliente = async function(cliente) {
  this.cliente = cliente._id;
  this.clienteNome = cliente.nomeCompleto;
  await this.save();
  return this;
};

// Metodo statico: cerca cliente da numero
chiamataSchema.statics.cercaClienteDaNumero = async function(numero) {
  const Cliente = mongoose.model('Cliente');
  
  // Rimuovi caratteri speciali dal numero
  const numeroPulito = numero.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Cerca in telefono e telefonoSecondario
  const cliente = await Cliente.findOne({
    $or: [
      { telefono: { $regex: numeroPulito, $options: 'i' } },
      { telefonoSecondario: { $regex: numeroPulito, $options: 'i' } }
    ],
    attivo: true
  });
  
  return cliente;
};

// Metodo statico: statistiche chiamate
chiamataSchema.statics.getStatistiche = async function(filtri = {}) {
  const match = { ...filtri };
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totaleChiamate: { $sum: 1 },
        chiamateRisposte: {
          $sum: { $cond: [{ $eq: ['$stato', 'answered'] }, 1, 0] }
        },
        chiamateNonRisposte: {
          $sum: { $cond: [{ $eq: ['$stato', 'missed'] }, 1, 0] }
        },
        durataMedia: { $avg: '$durata' },
        durataTotale: { $sum: '$durata' }
      }
    }
  ]);
  
  return stats[0] || {
    totaleChiamate: 0,
    chiamateRisposte: 0,
    chiamateNonRisposte: 0,
    durataMedia: 0,
    durataTotale: 0
  };
};

const Chiamata = mongoose.model('Chiamata', chiamataSchema);

export default Chiamata;