// models/ConfigChiusure.js - Singleton con configurazione festività attive
import mongoose from 'mongoose';

const ConfigChiusureSchema = new mongoose.Schema({
  // Flag per ogni festività fissa nazionale/locale
  festivitaAttive: {
    capodanno:    { type: Boolean, default: true },
    epifania:     { type: Boolean, default: true },
    pasquetta:    { type: Boolean, default: true },
    liberazione:  { type: Boolean, default: true },
    santEfisio:   { type: Boolean, default: true },
    lavoratori:   { type: Boolean, default: true },
    repubblica:   { type: Boolean, default: true },
    ferragosto:   { type: Boolean, default: true },
    ognissanti:   { type: Boolean, default: true },
    immacolata:   { type: Boolean, default: true },
    natale:       { type: Boolean, default: true },
    santoStefano: { type: Boolean, default: true }
  },

  // Giorni di chiusura settimanale ricorrente (0=Dom, 1=Lun, ..., 6=Sab)
  giorniChiusuraSettimanale: {
    type: [Number],
    default: []
  },

  modificatoDA: {
    type: String,
    default: 'sistema'
  }
}, {
  timestamps: true
});

export default mongoose.model('ConfigChiusure', ConfigChiusureSchema);