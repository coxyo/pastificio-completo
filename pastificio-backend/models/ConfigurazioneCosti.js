// models/ConfigurazioneCosti.js
import mongoose from 'mongoose';

const ConfigurazioneCostiSchema = new mongoose.Schema({
  tipo: {
    type: String,
    default: 'default',
    unique: true
  },
  overhead: {
    energia: { type: Number, default: 15 },
    gas: { type: Number, default: 8 },
    manodopera: { type: Number, default: 25 },
    affitto: { type: Number, default: 5 },
    tasse: { type: Number, default: 10 },
    imballaggi: { type: Number, default: 3 },
    varie: { type: Number, default: 5 }
  },
  margineConsigliato: {
    type: Number,
    default: 70
  },
  modificatoDa: {
    type: String,
    default: 'Admin'
  },
  modificatoIl: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Metodo statico per ottenere/creare la configurazione default
ConfigurazioneCostiSchema.statics.getDefault = async function () {
  let config = await this.findOne({ tipo: 'default' });
  if (!config) {
    config = await this.create({ tipo: 'default' });
  }
  return config;
};

// Calcola totale overhead %
ConfigurazioneCostiSchema.virtual('totaleOverhead').get(function () {
  const o = this.overhead;
  return (o.energia || 0) + (o.gas || 0) + (o.manodopera || 0) +
    (o.affitto || 0) + (o.tasse || 0) + (o.imballaggi || 0) + (o.varie || 0);
});

const ConfigurazioneCosti = mongoose.model('ConfigurazioneCosti', ConfigurazioneCostiSchema);
export default ConfigurazioneCosti;