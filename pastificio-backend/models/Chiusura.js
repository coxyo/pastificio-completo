// models/Chiusura.js
import mongoose from 'mongoose';

const ChiusuraSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['personalizzata', 'settimanale'],
    required: true
  },

  // Per chiusure personalizzate (giorno singolo o periodo)
  dataInizio: {
    type: Date,
    required: function() { return this.tipo === 'personalizzata'; }
  },
  dataFine: {
    type: Date,
    required: function() { return this.tipo === 'personalizzata'; }
  },

  // Per chiusura settimanale ricorrente (0=Dom, 1=Lun, ..., 6=Sab)
  giornoSettimana: {
    type: Number,
    min: 0,
    max: 6,
    required: function() { return this.tipo === 'settimanale'; }
  },

  motivo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  // Ripeti ogni anno (solo per tipo 'personalizzata')
  ripetiOgniAnno: {
    type: Boolean,
    default: false
  },

  attivo: {
    type: Boolean,
    default: true
  },

  creatoDA: {
    type: String,
    default: 'sistema'
  }
}, {
  timestamps: true
});

// Indice per ricerca per data
ChiusuraSchema.index({ dataInizio: 1, dataFine: 1, attivo: 1 });
ChiusuraSchema.index({ tipo: 1, attivo: 1 });

export default mongoose.model('Chiusura', ChiusuraSchema);