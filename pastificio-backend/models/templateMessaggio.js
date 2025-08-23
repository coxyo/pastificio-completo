// models/templateMessaggio.js
import mongoose from 'mongoose';

const templateMessaggioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    unique: true
  },
  categoria: {
    type: String,
    enum: ['ordine', 'marketing', 'servizio', 'festività'],
    required: true
  },
  oggetto: String,
  testo: {
    type: String,
    required: true
  },
  variabili: [{
    nome: String,
    descrizione: String
  }],
  attivo: {
    type: Boolean,
    default: true
  },
  utilizzi: {
    type: Number,
    default: 0
  },
  notifiche: {
    promemoria: Boolean,
    promemoria_data: Date,
    pronto: Boolean,
    pronto_data: Date
  }
}, {
  timestamps: true
});

// Metodo per processare il template con le variabili
templateMessaggioSchema.methods.processa = function(dati) {
  let testo = this.testo;
  
  // Sostituisci le variabili nel formato {{variabile}}
  Object.keys(dati).forEach(chiave => {
    const regex = new RegExp(`{{${chiave}}}`, 'g');
    testo = testo.replace(regex, dati[chiave]);
  });
  
  return testo;
};

export default mongoose.model('TemplateMessaggio', templateMessaggioSchema);