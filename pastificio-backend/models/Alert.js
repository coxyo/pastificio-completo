// models/Alert.js - Sistema alert automatici anomalie
import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: [
      // Ordini
      'ordini_pochi',
      'ordini_eccezionali',
      'ordini_zero',
      // Clienti
      'cliente_sparito',
      'cliente_nuovo_top',
      // Prodotti
      'prodotto_non_venduto',
      'prodotto_boom',
      // Business
      'incasso_anomalo_basso',
      'incasso_anomalo_alto',
      'trend_negativo'
    ],
    index: true
  },
  
  priorita: {
    type: String,
    required: true,
    enum: ['critico', 'attenzione', 'informativo'],
    default: 'attenzione',
    index: true
  },
  
  titolo: {
    type: String,
    required: true,
    trim: true
  },
  
  messaggio: {
    type: String,
    required: true,
    trim: true
  },
  
  icona: {
    type: String,
    default: '⚠️'
  },
  
  // Dati contestuali specifici per tipo alert
  dati: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // Esempi:
    // cliente_sparito: { clienteId, clienteNome, giorniAssenza, mediaFrequenza }
    // ordini_pochi: { ordiniOggi, mediaGiorno, percentuale }
    // prodotto_boom: { prodottoNome, venditeSettimana, mediaSettimana, percentualeAumento }
    // incasso_anomalo: { incassoOggi, mediaGiorno, percentuale }
  },
  
  // Stato lettura
  letto: {
    type: Boolean,
    default: false,
    index: true
  },
  
  lettoDa: {
    type: String,
    default: null
  },
  
  lettoIl: {
    type: Date,
    default: null
  },
  
  // Per evitare alert duplicati nello stesso giorno
  chiaveUnicita: {
    type: String,
    index: true
    // Formato: "tipo_YYYY-MM-DD_dettaglio"
    // Es: "cliente_sparito_2026-02-28_CL260001"
    // Es: "ordini_pochi_2026-02-28"
  },
  
  // Azione suggerita
  azione: {
    tipo: {
      type: String,
      enum: ['link', 'telefono', 'nessuna'],
      default: 'nessuna'
    },
    label: String,
    valore: String  // URL o numero telefono
  }
  
}, {
  timestamps: true
});

// Indici per performance
alertSchema.index({ createdAt: -1 });
alertSchema.index({ letto: 1, createdAt: -1 });
alertSchema.index({ tipo: 1, createdAt: -1 });
alertSchema.index({ chiaveUnicita: 1 }, { unique: true, sparse: true });

// TTL: elimina alert più vecchi di 90 giorni
alertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Metodo statico: conta non letti
alertSchema.statics.countNonLetti = async function() {
  return this.countDocuments({ letto: false });
};

// Metodo statico: segna tutti come letti
alertSchema.statics.segnaLettiTutti = async function(utente) {
  return this.updateMany(
    { letto: false },
    { 
      $set: { 
        letto: true, 
        lettoDa: utente || 'sistema',
        lettoIl: new Date() 
      } 
    }
  );
};

// Metodo statico: crea alert evitando duplicati
alertSchema.statics.creaSeNonEsiste = async function(datiAlert) {
  const chiave = datiAlert.chiaveUnicita;
  if (!chiave) {
    // Senza chiave unicità, crea sempre
    return this.create(datiAlert);
  }
  
  const esistente = await this.findOne({ chiaveUnicita: chiave });
  if (esistente) {
    return null; // Già esiste, non duplicare
  }
  
  return this.create(datiAlert);
};

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;