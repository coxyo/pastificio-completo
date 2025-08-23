import mongoose from 'mongoose';

const AlertSchema = new mongoose.Schema({
  titolo: {
    type: String,
    required: [true, 'Il titolo è obbligatorio'],
    trim: true
  },
  messaggio: {
    type: String,
    required: [true, 'Il messaggio è obbligatorio'],
    trim: true
  },
  severita: {
    type: String,
    enum: ['bassa', 'media', 'alta', 'critica'],
    default: 'media'
  },
  tipo: {
    type: String,
    required: [true, 'Il tipo è obbligatorio'],
    enum: ['scorta_bassa', 'scadenza_imminente', 'prodotto_scaduto', 'errore_sistema', 'nuovo_ordine', 'altro'],
    default: 'altro'
  },
  riferimento: {
    modello: {
      type: String,
      enum: ['Ingrediente', 'Ordine', 'Sistema', 'Fornitore', 'Altro']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  attivo: {
    type: Boolean,
    default: true
  },
  visualizzato: {
    type: Boolean,
    default: false
  },
  visualizzatoDa: [{
    utente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    data: {
      type: Date,
      default: Date.now
    }
  }],
  risolto: {
    type: Boolean,
    default: false
  },
  risoltoDa: {
    utente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    data: {
      type: Date
    }
  },
  notificatoVia: {
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    app: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
AlertSchema.virtual('stato').get(function() {
  if (this.risolto) return 'risolto';
  if (!this.attivo) return 'inattivo';
  if (this.visualizzato) return 'visualizzato';
  return 'nuovo';
});

// Middleware per inviare notifiche tramite WebSocket
AlertSchema.post('save', async function(doc) {
  try {
    if (doc.attivo && !doc.risolto) {
      const io = global.io;
      if (io) {
        io.emit('alert:new', {
          id: doc._id,
          titolo: doc.titolo,
          messaggio: doc.messaggio,
          severita: doc.severita,
          tipo: doc.tipo,
          createdAt: doc.createdAt
        });
      }
    }
  } catch (error) {
    console.error('Errore nell\'invio della notifica WebSocket:', error);
  }
});

// Indici
AlertSchema.index({ attivo: 1, severita: 1 });
AlertSchema.index({ createdAt: 1 });
AlertSchema.index({ tipo: 1 });
AlertSchema.index({ 'riferimento.modello': 1, 'riferimento.id': 1 });
AlertSchema.index({ visualizzato: 1 });
AlertSchema.index({ risolto: 1 });

const Alert = mongoose.model('Alert', AlertSchema);

export default Alert;