// models/Ingrediente.js - ✅ SISTEMA RINTRACCIABILITÀ COMPLETO
import mongoose from 'mongoose';

// =====================================
// SCHEMA LOTTO - Tracciabilità completa
// =====================================
const LottoSchema = new mongoose.Schema({
  codiceLotto: {
    type: String,
    required: true,
    unique: true,
    index: true
    // Formato: {INGREDIENTE}-{ANNO}-{PROGRESSIVO}
    // Es: FARINA00-2025-001, RICOTTA-2025-042
  },
  dataArrivo: {
    type: Date,
    required: true,
    default: Date.now
  },
  dataScadenza: {
    type: Date,
    required: true,
    index: true // Per query scadenze rapide
  },
  quantitaIniziale: {
    type: Number,
    required: true,
    min: 0
  },
  quantitaAttuale: {
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
  // ============ RINTRACCIABILITÀ FORNITORE ============
  fornitore: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fornitore',
      required: true
    },
    ragioneSociale: String,
    partitaIVA: String
  },
  // ============ DOCUMENTO DI ORIGINE ============
  documentoOrigine: {
    tipo: {
      type: String,
      enum: ['fattura', 'ddt', 'ordine', 'altro'],
      default: 'fattura'
    },
    numero: String,
    data: Date,
    // Riferimento all'importazione (se da XML)
    importazioneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImportazioneFattura'
    }
  },
  // ============ RINTRACCIABILITÀ UPSTREAM (da fornitore) ============
  lottoFornitore: {
    codice: String, // Lotto del fornitore
    dataProduzioneFornitore: Date,
    stabilimentoProduzioneFornitore: String
  },
  // ============ STATO E QUALITÀ ============
  stato: {
    type: String,
    enum: ['disponibile', 'in_uso', 'esaurito', 'scaduto', 'richiamato', 'quarantena'],
    default: 'disponibile',
    index: true
  },
  // ============ UTILIZZI - Per rintracciabilità downstream ============
  utilizzi: [{
    dataUtilizzo: {
      type: Date,
      default: Date.now
    },
    quantitaUsata: Number,
    prodottoFinito: {
      nome: String,
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prodotto'
      }
    },
    ordineCliente: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ordine'
      },
      numeroOrdine: String,
      cliente: String
    },
    // Movimento magazzino collegato
    movimentoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movimento'
    }
  }],
  // ============ ALERT E NOTIFICHE ============
  alertInviati: [{
    tipo: {
      type: String,
      enum: ['scadenza_7gg', 'scadenza_3gg', 'scadenza_1gg', 'scaduto', 'sotto_scorta']
    },
    dataInvio: {
      type: Date,
      default: Date.now
    }
  }],
  note: String,
  // ============ HACCP ============
  certificazioniHACCP: [{
    tipo: String, // Es: "Certificato origine", "Analisi microbiologiche"
    numero: String,
    dataRilascio: Date,
    fileUrl: String
  }],
  temperaturaConservazione: {
    min: Number,
    max: Number,
    attuale: Number
  }
}, {
  timestamps: true
});

// Indici compositi per performance
LottoSchema.index({ codiceLotto: 1, stato: 1 });
LottoSchema.index({ 'fornitore.id': 1, dataArrivo: -1 });
LottoSchema.index({ dataScadenza: 1, stato: 1 });

// Virtual per giorni alla scadenza
LottoSchema.virtual('giorniAllaScadenza').get(function() {
  if (!this.dataScadenza) return null;
  const oggi = new Date();
  const diff = this.dataScadenza - oggi;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual per percentuale utilizzata
LottoSchema.virtual('percentualeUtilizzata').get(function() {
  if (!this.quantitaIniziale || this.quantitaIniziale === 0) return 0;
  return ((this.quantitaIniziale - this.quantitaAttuale) / this.quantitaIniziale * 100).toFixed(2);
});

// =====================================
// SCHEMA INGREDIENTE PRINCIPALE
// =====================================
const IngredienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  categoria: {
    type: String,
    required: true,
    enum: [
      'farine',
      'latticini',
      'uova',
      'zuccheri',
      'grassi',
      'spezie',
      'lieviti',
      'frutta',
      'confezionamento',
      'altro'
    ],
    default: 'altro'
  },
  descrizione: String,
  // ============ GIACENZE TOTALI ============
  giacenzaAttuale: {
    type: Number,
    default: 0,
    min: 0
  },
  giacenzaMinima: {
    type: Number,
    default: 0,
    min: 0
  },
  unitaMisura: {
    type: String,
    enum: ['kg', 'g', 'l', 'ml', 'pz'],
    default: 'kg'
  },
  // ============ PREZZI MEDI ============
  prezzoMedioAcquisto: {
    type: Number,
    default: 0,
    min: 0
  },
  ultimoPrezzoAcquisto: {
    type: Number,
    default: 0,
    min: 0
  },
  // ============ LOTTI ATTIVI ============
  lotti: [LottoSchema],
  // ============ FORNITORI ABITUALI ============
  fornitoriAbituali: [{
    fornitore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fornitore'
    },
    preferito: {
      type: Boolean,
      default: false
    }
  }],
  // ============ MAPPING CON FATTURE ============
  mappingFornitori: [{
    fornitoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fornitore'
    },
    ragioneSociale: String,
    nomeFornitore: String, // Es: "FARINA 00 W320" nel XML
    codiceArticolo: String, // Es: "FAR001"
    ultimaModifica: {
      type: Date,
      default: Date.now
    }
  }],
  // ============ INFORMAZIONI NUTRIZIONALI (opzionale) ============
  valoriNutrizionali: {
    caloriePer100g: Number,
    proteinePer100g: Number,
    grassiPer100g: Number,
    carboidratiPer100g: Number
  },
  // ============ ALLERGENI ============
  allergeni: [{
    type: String,
    enum: [
      'glutine',
      'crostacei',
      'uova',
      'pesce',
      'arachidi',
      'soia',
      'latte',
      'frutta_a_guscio',
      'sedano',
      'senape',
      'sesamo',
      'solfiti',
      'lupini',
      'molluschi'
    ]
  }],
  // ============ STATO ============
  attivo: {
    type: Boolean,
    default: true
  },
  // ============ STORICO PREZZI ============
  storicoPrezzi: [{
    data: {
      type: Date,
      default: Date.now
    },
    prezzo: Number,
    fornitore: String,
    quantita: Number
  }],
  note: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// =====================================
// INDICI COMPOSTI PER PERFORMANCE
// =====================================
IngredienteSchema.index({ nome: 1, categoria: 1 });
IngredienteSchema.index({ giacenzaAttuale: 1, giacenzaMinima: 1 });
IngredienteSchema.index({ 'lotti.stato': 1, 'lotti.dataScadenza': 1 });

// =====================================
// METODI STATICI
// =====================================

/**
 * Trova ingredienti sotto scorta
 */
IngredienteSchema.statics.getSottoScorta = function() {
  return this.find({
    $expr: { $lt: ['$giacenzaAttuale', '$giacenzaMinima'] },
    attivo: true
  }).sort({ giacenzaAttuale: 1 });
};

/**
 * Trova ingredienti con lotti in scadenza
 * @param {Number} giorniSoglia - Giorni entro cui considerare "in scadenza"
 */
IngredienteSchema.statics.getLottiInScadenza = function(giorniSoglia = 7) {
  const oggi = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(oggi.getDate() + giorniSoglia);
  
  return this.aggregate([
    { $unwind: '$lotti' },
    {
      $match: {
        'lotti.stato': { $in: ['disponibile', 'in_uso'] },
        'lotti.dataScadenza': {
          $gte: oggi,
          $lte: dataLimite
        }
      }
    },
    {
      $project: {
        nome: 1,
        categoria: 1,
        lotto: '$lotti',
        giorniRimanenti: {
          $divide: [
            { $subtract: ['$lotti.dataScadenza', oggi] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    { $sort: { giorniRimanenti: 1 } }
  ]);
};

/**
 * Genera codice lotto automatico
 * @param {String} nomeIngrediente - Nome ingrediente
 */
IngredienteSchema.statics.generaCodiceLotto = async function(nomeIngrediente) {
  const anno = new Date().getFullYear();
  const prefisso = nomeIngrediente
    .toUpperCase()
    .replace(/\s+/g, '')
    .substring(0, 10); // Max 10 caratteri
  
  // Trova ultimo lotto dell'anno per questo ingrediente
  const ultimoLotto = await this.findOne(
    {
      nome: nomeIngrediente,
      'lotti.codiceLotto': new RegExp(`^${prefisso}-${anno}-`)
    },
    { 'lotti.$': 1 }
  ).sort({ 'lotti.codiceLotto': -1 });
  
  let progressivo = 1;
  if (ultimoLotto && ultimoLotto.lotti && ultimoLotto.lotti.length > 0) {
    const match = ultimoLotto.lotti[0].codiceLotto.match(/-(\d+)$/);
    if (match) {
      progressivo = parseInt(match[1]) + 1;
    }
  }
  
  // Formato: INGREDIENTE-ANNO-PROGRESSIVO (3 cifre)
  return `${prefisso}-${anno}-${progressivo.toString().padStart(3, '0')}`;
};

// =====================================
// METODI ISTANZA
// =====================================

/**
 * Aggiungi nuovo lotto
 */
IngredienteSchema.methods.aggiungiLotto = function(datiLotto) {
  // Calcola giacenza totale
  this.giacenzaAttuale += datiLotto.quantitaIniziale;
  
  // Aggiungi lotto
  this.lotti.push({
    ...datiLotto,
    quantitaAttuale: datiLotto.quantitaIniziale,
    stato: 'disponibile'
  });
  
  // Aggiorna prezzo medio
  if (datiLotto.prezzoUnitario > 0) {
    this.ultimoPrezzoAcquisto = datiLotto.prezzoUnitario;
    
    // Calcola prezzo medio ponderato
    const lottiDisponibili = this.lotti.filter(l => l.quantitaAttuale > 0);
    const totaleQuantita = lottiDisponibili.reduce((sum, l) => sum + l.quantitaAttuale, 0);
    const totaleValore = lottiDisponibili.reduce((sum, l) => sum + (l.quantitaAttuale * l.prezzoUnitario), 0);
    
    if (totaleQuantita > 0) {
      this.prezzoMedioAcquisto = totaleValore / totaleQuantita;
    }
  }
  
  // Aggiungi a storico prezzi
  if (datiLotto.prezzoUnitario > 0) {
    this.storicoPrezzi.push({
      data: datiLotto.dataArrivo || new Date(),
      prezzo: datiLotto.prezzoUnitario,
      fornitore: datiLotto.fornitore?.ragioneSociale || 'N/D',
      quantita: datiLotto.quantitaIniziale
    });
  }
  
  return this.save();
};

/**
 * Scarica quantità da un lotto specifico
 */
IngredienteSchema.methods.scaricoLotto = function(codiceLotto, quantita, datiUtilizzo = {}) {
  const lotto = this.lotti.find(l => l.codiceLotto === codiceLotto);
  
  if (!lotto) {
    throw new Error(`Lotto ${codiceLotto} non trovato`);
  }
  
  if (lotto.quantitaAttuale < quantita) {
    throw new Error(`Quantità insufficiente nel lotto ${codiceLotto}. Disponibile: ${lotto.quantitaAttuale}, Richiesta: ${quantita}`);
  }
  
  // Scarica quantità
  lotto.quantitaAttuale -= quantita;
  this.giacenzaAttuale -= quantita;
  
  // Aggiungi utilizzo per rintracciabilità
  lotto.utilizzi.push({
    dataUtilizzo: new Date(),
    quantitaUsata: quantita,
    prodottoFinito: datiUtilizzo.prodottoFinito || {},
    ordineCliente: datiUtilizzo.ordineCliente || {},
    movimentoId: datiUtilizzo.movimentoId
  });
  
  // Aggiorna stato lotto
  if (lotto.quantitaAttuale === 0) {
    lotto.stato = 'esaurito';
  } else if (lotto.stato === 'disponibile') {
    lotto.stato = 'in_uso';
  }
  
  return this.save();
};

/**
 * Scarica quantità usando FIFO (First In First Out)
 */
IngredienteSchema.methods.scaricoFIFO = async function(quantitaRichiesta, datiUtilizzo = {}) {
  if (this.giacenzaAttuale < quantitaRichiesta) {
    throw new Error(`Giacenza insufficiente per ${this.nome}. Disponibile: ${this.giacenzaAttuale}, Richiesta: ${quantitaRichiesta}`);
  }
  
  // Ordina lotti per data arrivo (FIFO)
  const lottiDisponibili = this.lotti
    .filter(l => l.stato === 'disponibile' || l.stato === 'in_uso')
    .filter(l => l.quantitaAttuale > 0)
    .sort((a, b) => a.dataArrivo - b.dataArrivo);
  
  if (lottiDisponibili.length === 0) {
    throw new Error(`Nessun lotto disponibile per ${this.nome}`);
  }
  
  let quantitaResidua = quantitaRichiesta;
  const lottiUsati = [];
  
  for (const lotto of lottiDisponibili) {
    if (quantitaResidua <= 0) break;
    
    const quantitaDaScaricare = Math.min(lotto.quantitaAttuale, quantitaResidua);
    
    // Scarica dal lotto
    lotto.quantitaAttuale -= quantitaDaScaricare;
    this.giacenzaAttuale -= quantitaDaScaricare;
    
    // Aggiungi utilizzo
    lotto.utilizzi.push({
      dataUtilizzo: new Date(),
      quantitaUsata: quantitaDaScaricare,
      prodottoFinito: datiUtilizzo.prodottoFinito || {},
      ordineCliente: datiUtilizzo.ordineCliente || {},
      movimentoId: datiUtilizzo.movimentoId
    });
    
    // Aggiorna stato
    if (lotto.quantitaAttuale === 0) {
      lotto.stato = 'esaurito';
    } else if (lotto.stato === 'disponibile') {
      lotto.stato = 'in_uso';
    }
    
    lottiUsati.push({
      codiceLotto: lotto.codiceLotto,
      quantita: quantitaDaScaricare
    });
    
    quantitaResidua -= quantitaDaScaricare;
  }
  
  await this.save();
  return lottiUsati;
};

/**
 * Verifica scadenze e aggiorna stati
 */
IngredienteSchema.methods.verificaScadenze = function() {
  const oggi = new Date();
  let modificato = false;
  
  for (const lotto of this.lotti) {
    if (lotto.stato === 'scaduto') continue;
    
    if (lotto.dataScadenza < oggi) {
      lotto.stato = 'scaduto';
      modificato = true;
    }
  }
  
  if (modificato) {
    return this.save();
  }
  return Promise.resolve(this);
};

// =====================================
// MIDDLEWARE
// =====================================

// Pre-save: Aggiorna giacenza attuale sommando tutti i lotti
IngredienteSchema.pre('save', function(next) {
  // Ricalcola giacenza attuale dalla somma dei lotti
  this.giacenzaAttuale = this.lotti
    .filter(l => l.stato !== 'scaduto' && l.stato !== 'richiamato')
    .reduce((sum, l) => sum + l.quantitaAttuale, 0);
  
  next();
});

// =====================================
// EXPORT
// =====================================
const Ingrediente = mongoose.model('Ingrediente', IngredienteSchema);
export default Ingrediente;