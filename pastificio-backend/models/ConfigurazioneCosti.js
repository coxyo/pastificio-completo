// models/ConfigurazioneCosti.js
import mongoose from 'mongoose';

const configurazioneCostiSchema = new mongoose.Schema({
  tipo: {
    type: String,
    default: 'default',
    unique: true
  },
  overhead: {
    // Valori calibrati su dati reali 2024 - base €96.000 ingredienti annui
    // Aggiornato: Marzo 2026
    energia:     { type: Number, default: 4   }, // €3.305/anno (bolletta Ajo' Energia)
    gas:         { type: Number, default: 0   }, // non utilizzato
    manodopera:  { type: Number, default: 28  }, // €26.322/anno (Francesca Fenu, part-time 90%)
    affitto:     { type: Number, default: 0   }, // locale di proprietà
    tasse:       { type: Number, default: 8   }, // €7.251/anno (IRPEF Maurizio €1.943 + Valentina €5.308)
    imballaggi:  { type: Number, default: 3   }, // ~€2.880/anno (stima 3%)
    iva:         { type: Number, default: 0   }, // IVA non è un costo (neutrale per chi la scarica)
    varie:       { type: Number, default: 5   }  // ~€4.800/anno (INPS artigiani ~€6k + Bluenext ~€600 + altro)
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