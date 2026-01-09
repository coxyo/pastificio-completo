// models/RegistrazioneHACCP.js
import mongoose from 'mongoose';

/**
 * SCHEMA REGISTRAZIONI HACCP
 * Gestisce tutti i controlli del manuale HACCP:
 * - Temperature frigoriferi/congelatori
 * - Controlli igienici
 * - Scadenze prodotti
 * - Sanificazioni
 * - Derattizzazioni
 * - Formazione personale
 */

const registrazioneHACCPSchema = new mongoose.Schema({
  // Tipo di registrazione
  tipo: {
    type: String,
    required: true,
    enum: [
      'temperatura_frigo',
      'temperatura_congelatore', 
      'controllo_igienico',
      'scadenza_prodotto',
      'sanificazione',
      'derattizzazione',
      'formazione_personale',
      'verifica_fornitori',
      'controllo_materie_prime'
    ]
  },

  // Data e ora registrazione
  dataOra: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },

  // Operatore che ha effettuato il controllo
  operatore: {
    type: String,
    required: true,
    default: 'Maurizio Mameli'
  },

  // TEMPERATURE
  temperatura: {
    valore: {
      type: Number,
      min: -30,
      max: 50
    },
    unitaMisura: {
      type: String,
      enum: ['°C', '°F'],
      default: '°C'
    },
    dispositivo: {
      type: String, // es: "Frigo 1", "Congelatore principale"
    },
    conforme: {
      type: Boolean, // true se temperatura nei limiti
      default: true
    },
    limiteMin: Number,
    limiteMax: Number
  },

  // CONTROLLO IGIENICO
  controlloIgienico: {
    area: {
      type: String, // es: "Laboratorio", "Magazzino", "Bagno"
    },
    elementi: [{
      nome: String, // es: "Pavimento", "Piano lavoro", "Utensili"
      conforme: Boolean,
      note: String
    }],
    azioneCorrettiva: String
  },

  // SCADENZE PRODOTTI
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

  // SANIFICAZIONE
  sanificazione: {
    area: String,
    prodottoUsato: String,
    concentrazione: String,
    durata: Number, // minuti
    verificaEfficacia: Boolean
  },

  // DERATTIZZAZIONE/DISINFESTAZIONE
  derattizzazione: {
    aziendaEsterna: String,
    certificatoNumero: String,
    areeTratate: [String],
    prodottiUsati: [String],
    prossimIntervento: Date
  },

  // FORMAZIONE PERSONALE
  formazionePersonale: {
    argomento: String,
    durata: Number, // ore
    partecipanti: [String],
    attestati: Boolean,
    dataScadenzaAttestati: Date
  },

  // VERIFICA FORNITORI
  verificaFornitori: {
    nomeFornit: String,
    tipoVerifica: {
      type: String,
      enum: ['documentale', 'audit', 'campionamento']
    },
    esito: {
      type: String,
      enum: ['conforme', 'non_conforme', 'azioni_correttive']
    },
    certificatiRicevuti: [String],
    note: String
  },

  // NOTE GENERALI
  note: {
    type: String,
    maxlength: 1000
  },

  // AZIONI CORRETTIVE
  azioniCorrettive: [{
    descrizione: String,
    responsabile: String,
    dataScadenza: Date,
    completata: {
      type: Boolean,
      default: false
    },
    dataCompletamento: Date
  }],

  // ALLEGATI (path file caricati)
  allegati: [{
    nome: String,
    path: String,
    tipo: String, // 'foto', 'documento', 'certificato'
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],

  // FLAG CONFORMITÀ
  conforme: {
    type: Boolean,
    required: true,
    default: true
  },

  // FLAG RICHIEDE ATTENZIONE
  richiedeAttenzione: {
    type: Boolean,
    default: false
  },

  // ALERT INVIATO
  alertInviato: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

// INDICI
registrazioneHACCPSchema.index({ tipo: 1, dataOra: -1 });
registrazioneHACCPSchema.index({ 'temperatura.dispositivo': 1, dataOra: -1 });
registrazioneHACCPSchema.index({ conforme: 1 });
registrazioneHACCPSchema.index({ richiedeAttenzione: 1 });

// METODI

/**
 * Verifica conformità temperatura
 */
registrazioneHACCPSchema.methods.verificaConformitaTemperatura = function() {
  if (!this.temperatura || !this.temperatura.valore) return false;
  
  const temp = this.temperatura.valore;
  const min = this.temperatura.limiteMin;
  const max = this.temperatura.limiteMax;
  
  if (min !== undefined && max !== undefined) {
    return temp >= min && temp <= max;
  }
  
  return true;
};

/**
 * Genera alert se non conforme
 */
registrazioneHACCPSchema.methods.generaAlertSeNecessario = async function() {
  if (!this.conforme && !this.alertInviato) {
    // TODO: Inviare notifica (email, WhatsApp, push)
    this.alertInviato = true;
    this.richiedeAttenzione = true;
    await this.save();
  }
};

// METODI STATICI

/**
 * Ottieni ultime temperature per dispositivo
 */
registrazioneHACCPSchema.statics.getUltimeTemperature = function(dispositivo, limit = 10) {
  return this.find({
    tipo: { $in: ['temperatura_frigo', 'temperatura_congelatore'] },
    'temperatura.dispositivo': dispositivo
  })
  .sort({ dataOra: -1 })
  .limit(limit);
};

/**
 * Ottieni registrazioni non conformi
 */
registrazioneHACCPSchema.statics.getNonConformi = function(giorni = 7) {
  const dataInizio = new Date();
  dataInizio.setDate(dataInizio.getDate() - giorni);
  
  return this.find({
    conforme: false,
    dataOra: { $gte: dataInizio }
  }).sort({ dataOra: -1 });
};

/**
 * Statistiche mensili
 */
registrazioneHACCPSchema.statics.getStatisticheMensili = async function(anno, mese) {
  const dataInizio = new Date(anno, mese - 1, 1);
  const dataFine = new Date(anno, mese, 0, 23, 59, 59);
  
  const registrazioni = await this.find({
    dataOra: { $gte: dataInizio, $lte: dataFine }
  });
  
  return {
    totale: registrazioni.length,
    conformi: registrazioni.filter(r => r.conforme).length,
    nonConformi: registrazioni.filter(r => !r.conforme).length,
    perTipo: registrazioni.reduce((acc, r) => {
      acc[r.tipo] = (acc[r.tipo] || 0) + 1;
      return acc;
    }, {})
  };
};

const RegistrazioneHACCP = mongoose.model('RegistrazioneHACCP', registrazioneHACCPSchema);

export default RegistrazioneHACCP;