// models/Corrispettivo.js
import mongoose from 'mongoose';

/**
 * SCHEMA CORRISPETTIVI GIORNALIERI
 * Registro elettronico corrispettivi per commercialista
 */

const corrispettivoSchema = new mongoose.Schema({
  // Data di riferimento
  data: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },

  // Giorno e mese (per visualizzazione)
  giorno: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },

  mese: {
    type: String,
    required: true,
    enum: ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC']
  },

  anno: {
    type: Number,
    required: true
  },

  // TOTALE CORRISPETTIVI GIORNALIERI (lordo)
  totaleCorrispettivi: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },

  // IMPONIBILE IVA 10% (calcolato: totaleCorrispettivi / 1.10)
  imponibile10: {
    type: Number,
    default: 0,
    min: 0
  },

  // IVA 10% (calcolata: imponibile10 * 0.10)
  iva10: {
    type: Number,
    default: 0,
    min: 0
  },

  // Note eventuali
  note: {
    type: String,
    maxlength: 500
  },

  // Operatore che ha registrato
  operatore: {
    type: String,
    default: 'Maurizio Mameli'
  },

  // Flag chiusura giornata
  chiuso: {
    type: Boolean,
    default: false
  },

  // Flag importato da file storico
  importato: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

// METODI

/**
 * Calcola automaticamente imponibile e IVA
 */
corrispettivoSchema.methods.calcolaIva = function() {
  if (this.totaleCorrispettivi > 0) {
    // Imponibile = Totale / 1.10
    this.imponibile10 = parseFloat((this.totaleCorrispettivi / 1.10).toFixed(2));
    
    // IVA = Imponibile * 0.10
    this.iva10 = parseFloat((this.imponibile10 * 0.10).toFixed(2));
  } else {
    this.imponibile10 = 0;
    this.iva10 = 0;
  }
};

/**
 * Formato data italiano
 */
corrispettivoSchema.methods.getDataItaliana = function() {
  return this.data.toLocaleDateString('it-IT');
};

// METODI STATICI

/**
 * Ottieni corrispettivi di un mese
 */
corrispettivoSchema.statics.getCorrespettiviMese = function(anno, mese) {
  const primoGiorno = new Date(anno, mese - 1, 1);
  const ultimoGiorno = new Date(anno, mese, 0, 23, 59, 59);

  return this.find({
    data: {
      $gte: primoGiorno,
      $lte: ultimoGiorno
    }
  }).sort({ data: 1 });
};

/**
 * Calcola totale mensile
 */
corrispettivoSchema.statics.getTotaleMensile = async function(anno, mese) {
  const corrispettivi = await this.getCorrespettiviMese(anno, mese);

  const totale = corrispettivi.reduce((acc, c) => {
    return {
      totaleCorrispettivi: acc.totaleCorrispettivi + c.totaleCorrispettivi,
      imponibile10: acc.imponibile10 + c.imponibile10,
      iva10: acc.iva10 + c.iva10
    };
  }, {
    totaleCorrispettivi: 0,
    imponibile10: 0,
    iva10: 0
  });

  return {
    ...totale,
    giorni: corrispettivi.length,
    corrispettivi
  };
};

/**
 * Ottieni statistiche anno
 */
corrispettivoSchema.statics.getStatisticheAnno = async function(anno) {
  const primoGiorno = new Date(anno, 0, 1);
  const ultimoGiorno = new Date(anno, 11, 31, 23, 59, 59);

  const corrispettivi = await this.find({
    data: {
      $gte: primoGiorno,
      $lte: ultimoGiorno
    }
  }).sort({ data: 1 });

  const totaleAnno = corrispettivi.reduce((acc, c) => {
    return {
      totaleCorrispettivi: acc.totaleCorrispettivi + c.totaleCorrispettivi,
      imponibile10: acc.imponibile10 + c.imponibile10,
      iva10: acc.iva10 + c.iva10
    };
  }, {
    totaleCorrispettivi: 0,
    imponibile10: 0,
    iva10: 0
  });

  // Raggruppa per mese
  const perMese = {};
  corrispettivi.forEach(c => {
    const mese = c.mese;
    if (!perMese[mese]) {
      perMese[mese] = {
        totaleCorrispettivi: 0,
        imponibile10: 0,
        iva10: 0,
        giorni: 0
      };
    }
    perMese[mese].totaleCorrispettivi += c.totaleCorrispettivi;
    perMese[mese].imponibile10 += c.imponibile10;
    perMese[mese].iva10 += c.iva10;
    perMese[mese].giorni++;
  });

  return {
    anno,
    totaleAnno,
    perMese,
    giorniAperti: corrispettivi.length
  };
};

// MIDDLEWARE

/**
 * Prima di salvare, calcola IVA automaticamente
 */
corrispettivoSchema.pre('save', function(next) {
  // Calcola mese e giorno
  this.giorno = this.data.getDate();
  this.anno = this.data.getFullYear();
  
  const mesi = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'];
  this.mese = mesi[this.data.getMonth()];

  // Calcola IVA
  this.calcolaIva();

  next();
});

const Corrispettivo = mongoose.model('Corrispettivo', corrispettivoSchema);

export default Corrispettivo;