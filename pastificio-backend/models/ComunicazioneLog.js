// models/ComunicazioneLog.js
import mongoose from 'mongoose';

const comunicazioneLogSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['email', 'sms', 'push', 'whatsapp'],
    required: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  destinatario: {
    type: String,
    required: true // email o numero telefono
  },
  oggetto: String, // solo per email
  messaggio: {
    type: String,
    required: true
  },
  template: String, // template utilizzato se applicabile
  stato: {
    type: String,
    enum: ['inviato', 'errore', 'in_coda', 'letto'],
    default: 'in_coda'
  },
  errore: String, // dettagli errore se presente
  dataLettura: Date, // quando è stato letto (se tracciabile)
  inviatoDa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campagna: String, // se fa parte di una campagna
  metadata: {
    type: Map,
    of: String // dati aggiuntivi
  }
}, {
  timestamps: true
});

// Indici
comunicazioneLogSchema.index({ cliente: 1, createdAt: -1 });
comunicazioneLogSchema.index({ tipo: 1, stato: 1 });
comunicazioneLogSchema.index({ destinatario: 1 });

const ComunicazioneLog = mongoose.model('ComunicazioneLog', comunicazioneLogSchema);

export default ComunicazioneLog;