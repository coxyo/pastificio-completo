// models/RegistrazioneHACCP.js
// ✅ MODELLO COMPLETO PER TUTTE LE REGISTRAZIONI HACCP
import mongoose from 'mongoose';

const registrazioneHACCPSchema = new mongoose.Schema({
  // Tipo di registrazione
  tipo: {
    type: String,
    required: true,
    enum: [
      'temperatura_frigo',
      'temperatura_congelatore',
      'abbattimento',
      'cottura',
      'controllo_igienico',
      'sanificazione',
      'materie_prime',
      'scadenza_prodotto',
      'non_conformita',
      'verifica_ccp'
    ]
  },

  // Data e ora registrazione
  dataOra: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Operatore che ha effettuato il controllo
  operatore: {
    type: String,
    default: 'Maurizio Mameli'
  },

  // ============================================
  // DATI TEMPERATURA (CCP1, CCP2, CCP5)
  // ============================================
  temperatura: {
    valore: Number,
    unitaMisura: { type: String, default: '°C' },
    dispositivo: String,
    conforme: Boolean,
    limiteMin: Number,
    limiteMax: Number
  },

  // ============================================
  // DATI ABBATTIMENTO (CCP4)
  // ============================================
  abbattimento: {
    prodotto: String,
    lotto: String,
    oraInizio: String,
    oraFine: String,
    temperaturaIniziale: Number,
    temperaturaFinale: Number,
    durataMinuti: Number
  },

  // ============================================
  // DATI COTTURA (CCP3)
  // ============================================
  cottura: {
    prodotto: String,
    lotto: String,
    temperaturaRaggiunta: Number,
    tempoCottura: Number,
    metodo: String // forno, frittura, etc.
  },

  // ============================================
  // CONTROLLO IGIENICO / PULIZIA
  // ============================================
  controlloIgienico: {
    area: String,
    elementi: [{
      nome: String,
      conforme: { type: Boolean, default: true },
      note: String
    }],
    azioneCorrettiva: String
  },

  // ============================================
  // SANIFICAZIONE
  // ============================================
  sanificazione: {
    area: String,
    prodottoUsato: String,
    concentrazione: String,
    durata: Number, // minuti
    verificaEfficacia: Boolean
  },

  // ============================================
  // MATERIE PRIME (CCP1)
  // ============================================
  materiePrime: {
    fornitore: String,
    prodotto: String,
    lotto: String,
    dataScadenza: Date,
    temperatura: Number,
    integritaConfezioni: Boolean,
    azione: {
      type: String,
      enum: ['accettato', 'rifiutato', 'accettato_con_riserva']
    }
  },

  // ============================================
  // SCADENZA PRODOTTI
  // ============================================
  scadenzaProdotto: {
    nomeProdotto: String,
    lotto: String,
    dataScadenza: Date,
    quantita: Number,
    unitaMisura: String,
    azione: {
      type: String,
      enum: ['conforme', 'prossimo_scadenza', 'scaduto', 'smaltito']
    }
  },

  // ============================================
  // NON CONFORMITÀ
  // ============================================
  nonConformita: {
    tipoNC: {
      type: String,
      enum: ['temperatura', 'materie_prime', 'pulizia', 'processo', 'attrezzature', 'personale', 'altro']
    },
    descrizione: String,
    azioneCorrettiva: String,
    dataRilevazione: Date,
    dataRisoluzione: Date,
    risolto: { type: Boolean, default: false },
    responsabile: String
  },

  // ============================================
  // CAMPI COMUNI
  // ============================================
  conforme: {
    type: Boolean,
    default: true,
    index: true
  },

  richiedeAttenzione: {
    type: Boolean,
    default: false,
    index: true
  },

  note: String,

  // Allegati (foto, documenti)
  allegati: [{
    nome: String,
    url: String,
    tipo: String
  }],

  // Metadata
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
registrazioneHACCPSchema.index({ tipo: 1, dataOra: -1 });
registrazioneHACCPSchema.index({ conforme: 1, dataOra: -1 });
registrazioneHACCPSchema.index({ 'temperatura.dispositivo': 1, dataOra: -1 });

// Metodo per verificare conformità temperatura
registrazioneHACCPSchema.methods.verificaConformitaTemperatura = function() {
  if (!this.temperatura || this.temperatura.valore === undefined) return null;
  
  const { valore, limiteMin, limiteMax } = this.temperatura;
  
  if (limiteMin !== null && valore < limiteMin) return false;
  if (limiteMax !== null && valore > limiteMax) return false;
  
  return true;
};

// Metodo statico per ottenere statistiche
registrazioneHACCPSchema.statics.getStatistiche = async function(dataInizio, dataFine) {
  const match = {
    dataOra: { $gte: dataInizio, $lte: dataFine }
  };

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$tipo',
        totale: { $sum: 1 },
        conformi: {
          $sum: { $cond: ['$conforme', 1, 0] }
        },
        nonConformi: {
          $sum: { $cond: ['$conforme', 0, 1] }
        }
      }
    }
  ]);

  return stats;
};

const RegistrazioneHACCP = mongoose.model('RegistrazioneHACCP', registrazioneHACCPSchema);

export default RegistrazioneHACCP;