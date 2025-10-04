// pastificio-backend/models/notifica.js
import mongoose from 'mongoose';

const notificaSchema = new mongoose.Schema({
  titolo: {
    type: String,
    required: true
  },
  messaggio: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  canale: {
    type: String,
    enum: ['email', 'sms', 'push', 'all'],
    required: true
  },
  destinatari: [{
    type: String
  }],
  stato: {
    type: String,
    enum: ['inviata', 'letta', 'errore'],
    default: 'inviata'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  utenteInvio: {
    type: String,
    required: true
  },
  dettagliErrore: String
}, {
  timestamps: true
});

// Indici per query efficienti
notificaSchema.index({ timestamp: -1 });
notificaSchema.index({ stato: 1 });
notificaSchema.index({ canale: 1 });

const Notifica = mongoose.model('Notifica', notificaSchema);

export default Notifica;