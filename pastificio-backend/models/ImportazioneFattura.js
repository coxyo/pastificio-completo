// models/ImportazioneFattura.js - ✅ RINTRACCIABILITÀ IMPORT FATTURE
import mongoose from 'mongoose';

// =====================================
// SCHEMA MAPPING PRODOTTO
// =====================================
const MappingProdottoSchema = new mongoose.Schema({
  // Dati dal XML fornitore
  nomeFornitore: {
    type: String,
    required: true
  },
  codiceArticoloFornitore: String,
  descrizioneFornitore: String,
  
  // Mapping con ingrediente nostro
  ingrediente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingrediente',
    required: true
  },
  nomeIngrediente: String, // Denormalizzato per query veloci
  
  // Dati riga fattura
  quantita: {
    type: Number,
    required: true,
    min: 0
  },
  unitaMisura: {
    type: String,
    enum: ['kg', 'g', 'l', 'ml', 'pz'],
    default: 'kg'
  },
  prezzoUnitario: {
    type: Number,
    default: 0,
    min: 0
  },
  sconto: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totaleRiga: {
    type: Number,
    default: 0
  },
  
  // Lotto generato
  codiceLotto: String, // Codice lotto generato automaticamente
  dataScadenza: Date,
  
  // Movimento magazzino creato
  movimentoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movimento'
  },
  
  // Flag importazione
  importato: {
    type: Boolean,
    default: false
  },
  dataImportazione: Date
}, { _id: true });

// =====================================
// SCHEMA IMPORTAZIONE FATTURA
// =====================================
const ImportazioneFatturaSchema = new mongoose.Schema({
  // ============ DATI FATTURA ============
  numeroFattura: {
    type: String,
    required: true,
    index: true
  },
  dataFattura: {
    type: Date,
    required: true,
    index: true
  },
  
  // ============ FORNITORE ============
  fornitore: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fornitore'
    },
    ragioneSociale: {
      type: String,
      required: true
    },
    partitaIVA: String,
    indirizzo: String,
    // Auto-creato se non esiste
    autoCreato: {
      type: Boolean,
      default: false
    }
  },
  
  // ============ RIGHE FATTURA ============
  righe: [MappingProdottoSchema],
  
  // ============ TOTALI ============
  totaleImponibile: {
    type: Number,
    default: 0
  },
  totaleIVA: {
    type: Number,
    default: 0
  },
  totaleFattura: {
    type: Number,
    default: 0
  },
  
  // ============ FILE ORIGINALE ============
  fileOriginale: {
    nome: String,
    path: String,
    formato: {
      type: String,
      enum: ['xml', 'pdf', 'altro'],
      default: 'xml'
    },
    dimensione: Number, // bytes
    hash: String // Per verifica integrit
  },
  
  // ============ STATO IMPORTAZIONE ============
  statoImportazione: {
    type: String,
    enum: ['pending', 'in_mapping', 'completato', 'parziale', 'annullato', 'errore'],
    default: 'pending',
    index: true
  },
  
  // ============ PROGRESSI ============
  progressi: {
    righeProcessate: {
      type: Number,
      default: 0
    },
    righeTotali: {
      type: Number,
      default: 0
    },
    righeImportate: {
      type: Number,
      default: 0
    },
    righeConErrori: {
      type: Number,
      default: 0
    }
  },
  
  // ============ ERRORI ============
  errori: [{
    riga: Number,
    messaggio: String,
    campo: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ============ LOG ATTIVITÀ ============
  logAttivita: [{
    azione: {
      type: String,
      enum: ['upload', 'parsing', 'mapping', 'import', 'annullamento', 'modifica']
    },
    descrizione: String,
    utente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ============ METADATI ============
  dataCaricamento: {
    type: Date,
    default: Date.now
  },
  dataCompletamento: Date,
  dataAnnullamento: Date,
  motivoAnnullamento: String,
  
  utenteCaricamento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  note: String,
  
  // ============ RINTRACCIABILITÀ ============
  movimentiCreati: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movimento'
  }],
  
  lottiCreati: [{
    ingrediente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingrediente'
    },
    codiceLotto: String
  }]
}, {
  timestamps: true
});

// =====================================
// INDICI
// =====================================
ImportazioneFatturaSchema.index({ numeroFattura: 1, 'fornitore.ragioneSociale': 1 });
ImportazioneFatturaSchema.index({ statoImportazione: 1, dataCaricamento: -1 });
ImportazioneFatturaSchema.index({ 'fornitore.id': 1, dataFattura: -1 });

// =====================================
// VIRTUALS
// =====================================

// Percentuale completamento
ImportazioneFatturaSchema.virtual('percentualeCompletamento').get(function() {
  if (!this.progressi.righeTotali || this.progressi.righeTotali === 0) return 0;
  return Math.round((this.progressi.righeImportate / this.progressi.righeTotali) * 100);
});

// Importazione completa?
ImportazioneFatturaSchema.virtual('isCompletato').get(function() {
  return this.statoImportazione === 'completato';
});

// Ha errori?
ImportazioneFatturaSchema.virtual('hasErrori').get(function() {
  return this.errori && this.errori.length > 0;
});

// =====================================
// METODI STATICI
// =====================================

/**
 * Trova importazioni per fornitore
 */
ImportazioneFatturaSchema.statics.getByFornitore = function(fornitoreId, options = {}) {
  const query = { 'fornitore.id': fornitoreId };
  
  if (options.dataInizio) {
    query.dataFattura = { $gte: options.dataInizio };
  }
  if (options.dataFine) {
    query.dataFattura = { ...query.dataFattura, $lte: options.dataFine };
  }
  if (options.stato) {
    query.statoImportazione = options.stato;
  }
  
  return this.find(query)
    .sort({ dataFattura: -1 })
    .limit(options.limit || 50);
};

/**
 * Statistiche importazioni
 */
ImportazioneFatturaSchema.statics.getStatistiche = async function(filtri = {}) {
  const match = {};
  
  if (filtri.dataInizio) {
    match.dataCaricamento = { $gte: new Date(filtri.dataInizio) };
  }
  if (filtri.dataFine) {
    match.dataCaricamento = { ...match.dataCaricamento, $lte: new Date(filtri.dataFine) };
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$statoImportazione',
        totale: { $sum: 1 },
        totaleImponibile: { $sum: '$totaleImponibile' },
        totaleFattura: { $sum: '$totaleFattura' },
        righeImportate: { $sum: '$progressi.righeImportate' },
        righeTotali: { $sum: '$progressi.righeTotali' }
      }
    }
  ]);
  
  return {
    perStato: stats,
    totaleImportazioni: stats.reduce((sum, s) => sum + s.totale, 0),
    totaleValore: stats.reduce((sum, s) => sum + s.totaleFattura, 0)
  };
};

// =====================================
// METODI ISTANZA
// =====================================

/**
 * Aggiungi log attività
 */
ImportazioneFatturaSchema.methods.aggiungiLog = function(azione, descrizione, utenteId) {
  this.logAttivita.push({
    azione,
    descrizione,
    utente: utenteId,
    timestamp: new Date()
  });
  return this.save();
};

/**
 * Aggiungi errore
 */
ImportazioneFatturaSchema.methods.aggiungiErrore = function(riga, messaggio, campo) {
  this.errori.push({
    riga,
    messaggio,
    campo,
    timestamp: new Date()
  });
  this.progressi.righeConErrori++;
  return this;
};

/**
 * Segna riga come importata
 */
ImportazioneFatturaSchema.methods.segnaRigaImportata = function(rigaId, movimentoId, codiceLotto) {
  const riga = this.righe.id(rigaId);
  if (riga) {
    riga.importato = true;
    riga.dataImportazione = new Date();
    riga.movimentoId = movimentoId;
    riga.codiceLotto = codiceLotto;
    
    this.progressi.righeImportate++;
    
    // Aggiorna stato generale
    if (this.progressi.righeImportate === this.progressi.righeTotali) {
      this.statoImportazione = 'completato';
      this.dataCompletamento = new Date();
    } else if (this.progressi.righeImportate > 0) {
      this.statoImportazione = 'parziale';
    }
  }
  return this;
};

/**
 * Annulla importazione (reverte movimenti)
 */
ImportazioneFatturaSchema.methods.annulla = async function(motivo, utenteId) {
  const Movimento = mongoose.model('Movimento');
  const Ingrediente = mongoose.model('Ingrediente');
  
  // Elimina movimenti creati
  for (const movimentoId of this.movimentiCreati) {
    await Movimento.findByIdAndDelete(movimentoId);
  }
  
  // Rimuovi lotti creati
  for (const lottoInfo of this.lottiCreati) {
    const ingrediente = await Ingrediente.findById(lottoInfo.ingrediente);
    if (ingrediente) {
      ingrediente.lotti = ingrediente.lotti.filter(
        l => l.codiceLotto !== lottoInfo.codiceLotto
      );
      await ingrediente.save();
    }
  }
  
  // Aggiorna stato
  this.statoImportazione = 'annullato';
  this.dataAnnullamento = new Date();
  this.motivoAnnullamento = motivo;
  
  // Log
  this.logAttivita.push({
    azione: 'annullamento',
    descrizione: `Importazione annullata: ${motivo}`,
    utente: utenteId,
    timestamp: new Date()
  });
  
  return this.save();
};

// =====================================
// MIDDLEWARE
// =====================================

// Pre-save: Calcola progressi
ImportazioneFatturaSchema.pre('save', function(next) {
  if (this.righe && this.righe.length > 0) {
    this.progressi.righeTotali = this.righe.length;
    this.progressi.righeProcessate = this.righe.filter(r => r.ingrediente).length;
    this.progressi.righeImportate = this.righe.filter(r => r.importato).length;
  }
  next();
});

// =====================================
// EXPORT
// =====================================
const ImportazioneFattura = mongoose.model('ImportazioneFattura', ImportazioneFatturaSchema);
export default ImportazioneFattura;