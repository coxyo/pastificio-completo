// models/Corrispettivo.js
// ✅ MODELLO COMPLETO PER REGISTRO CORRISPETTIVI
import mongoose from 'mongoose';

const corrispettivoSchema = new mongoose.Schema({
  // Identificazione temporale
  anno: {
    type: Number,
    required: true,
    index: true
  },
  mese: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    index: true
  },
  giorno: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },

  // Totale corrispettivi del giorno
  totale: {
    type: Number,
    default: 0
  },

  // Dettaglio per aliquota IVA
  dettaglioIva: {
    iva22: { type: Number, default: 0 },  // Aliquota ordinaria 22%
    iva10: { type: Number, default: 0 },  // Aliquota ridotta 10%
    iva4: { type: Number, default: 0 },   // Aliquota super-ridotta 4%
    esente: { type: Number, default: 0 }  // Operazioni esenti/non imponibili
  },

  // Fatture emesse nel giorno
  fatture: {
    da: { type: String, default: null },  // Numero fattura iniziale
    a: { type: String, default: null }    // Numero fattura finale
  },

  // Note aggiuntive
  note: {
    type: String,
    default: ''
  },

  // Operatore che ha registrato
  operatore: {
    type: String,
    default: 'Maurizio Mameli'
  },

  // Flag chiusura mese
  chiusoMese: {
    type: Boolean,
    default: false
  },
  dataChiusura: {
    type: Date,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index composto per ricerche frequenti
corrispettivoSchema.index({ anno: 1, mese: 1, giorno: 1 }, { unique: true });
corrispettivoSchema.index({ anno: 1, mese: 1 });

// Metodo per calcolare IVA scorporata
corrispettivoSchema.methods.calcolaIvaScorporata = function() {
  const { iva22, iva10, iva4 } = this.dettaglioIva;
  
  return {
    iva22Scorporata: iva22 - (iva22 / 1.22),
    iva10Scorporata: iva10 - (iva10 / 1.10),
    iva4Scorporata: iva4 - (iva4 / 1.04),
    get totaleIva() {
      return this.iva22Scorporata + this.iva10Scorporata + this.iva4Scorporata;
    }
  };
};

// Metodo statico per ottenere totali mensili
corrispettivoSchema.statics.getTotaliMensili = async function(anno, mese) {
  const result = await this.aggregate([
    {
      $match: { anno, mese }
    },
    {
      $group: {
        _id: null,
        totale: { $sum: '$totale' },
        iva22: { $sum: '$dettaglioIva.iva22' },
        iva10: { $sum: '$dettaglioIva.iva10' },
        iva4: { $sum: '$dettaglioIva.iva4' },
        esente: { $sum: '$dettaglioIva.esente' },
        giorniConIncasso: {
          $sum: { $cond: [{ $gt: ['$totale', 0] }, 1, 0] }
        }
      }
    }
  ]);

  return result[0] || {
    totale: 0,
    iva22: 0,
    iva10: 0,
    iva4: 0,
    esente: 0,
    giorniConIncasso: 0
  };
};

// Metodo statico per ottenere totali annuali
corrispettivoSchema.statics.getTotaliAnnuali = async function(anno) {
  const result = await this.aggregate([
    {
      $match: { anno }
    },
    {
      $group: {
        _id: '$mese',
        totale: { $sum: '$totale' },
        iva22: { $sum: '$dettaglioIva.iva22' },
        iva10: { $sum: '$dettaglioIva.iva10' },
        iva4: { $sum: '$dettaglioIva.iva4' },
        esente: { $sum: '$dettaglioIva.esente' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return result;
};

const Corrispettivo = mongoose.model('Corrispettivo', corrispettivoSchema);

export default Corrispettivo;