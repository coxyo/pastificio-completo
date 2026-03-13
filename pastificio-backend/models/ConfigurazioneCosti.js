// models/ConfigurazioneCosti.js
import mongoose from 'mongoose';

const configurazioneCostiSchema = new mongoose.Schema({
  tipo: {
    type: String,
    default: 'default',
    unique: true
  },
  overhead: {
    energia:     { type: Number, default: 20 },
    gas:         { type: Number, default: 0  },
    manodopera:  { type: Number, default: 25 },
    affitto:     { type: Number, default: 0  },
    tasse:       { type: Number, default: 10 },
    imballaggi:  { type: Number, default: 3  },
    iva:         { type: Number, default: 10 },
    varie:       { type: Number, default: 5  }
  },
  margineConsigliato: {
    type: Number,
    default: 70
  }
}, { timestamps: true });

configurazioneCostiSchema.virtual('totaleOverhead').get(function () {
  const o = this.overhead;
  return (o.energia || 0) + (o.gas || 0) + (o.manodopera || 0) +
         (o.affitto || 0) + (o.tasse || 0) + (o.imballaggi || 0) +
         (o.iva || 0) + (o.varie || 0);
});

configurazioneCostiSchema.set('toJSON', { virtuals: true });
configurazioneCostiSchema.set('toObject', { virtuals: true });

configurazioneCostiSchema.statics.getDefault = async function () {
  let config = await this.findOne({ tipo: 'default' });
  if (!config) {
    config = await this.create({ tipo: 'default' });
  }
  return config;
};

const ConfigurazioneCosti = mongoose.model('ConfigurazioneCosti', configurazioneCostiSchema);
export default ConfigurazioneCosti;