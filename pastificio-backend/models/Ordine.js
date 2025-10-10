// models/Ordine.js - MODELLO OTTIMIZZATO E COMPLETO
import mongoose from 'mongoose';

// Schema Prodotto nel carrello
const prodottoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  quantita: {
    type: Number,
    required: true,
    min: 0
  },
  unita: {
    type: String,
    enum: ['kg', 'Kg', 'KG', 'pezzi', 'Pezzi', 'PEZZI', 'unità', 'Unità', '€', 'EUR', 'g', 'G', 'l', 'L'],
    default: 'kg'
  },
  unitaMisura: {
    type: String,
    enum: ['kg', 'Kg', 'KG', 'pezzi', 'Pezzi', 'PEZZI', 'unità', 'Unità', '€', 'EUR', 'g', 'G', 'l', 'L'],
    default: 'kg'
  },
  prezzo: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Prezzo totale già calcolato dal frontend (quantità × prezzo unitario)'
  },
  prezzoUnitario: {
    type: Number,
    min: 0,
    comment: 'Prezzo per kg/pezzo (opzionale, per reference)'
  },
  categoria: {
    type: String,
    trim: true,
    default: 'altro'
  },
  variante: {
    type: String,
    trim: true,
    comment: 'Es: ricotta, carne, verdure, etc.'
  },
  dettagliCalcolo: {
    type: mongoose.Schema.Types.Mixed,
    comment: 'Dati di calcolo dal frontend per debug/audit'
  }
}, { _id: false });

// Schema Ordine Principale
const ordineSchema = new mongoose.Schema({
  // ==========================================
  // DATI CLIENTE (legacy - per retrocompatibilità)
  // ==========================================
  nomeCliente: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  telefono: {
    type: String,
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // ==========================================
  // RELAZIONE CLIENTE (nuovo sistema normalizzato)
  // ==========================================
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: false,
    default: null,
    index: true,
    comment: 'Riferimento alla tabella Cliente (sistema normalizzato)'
  },
  
  // ==========================================
  // DATI ORDINE
  // ==========================================
  numeroOrdine: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    comment: 'Codice ordine auto-generato (es: ORD000123)'
  },
  
  dataRitiro: {
    type: Date,
    required: true,
    index: true
  },
  
  oraRitiro: {
    type: String,
    required: true,
    trim: true
  },
  
  prodotti: [prodottoSchema],
  
  // ==========================================
  // TOTALI
  // ==========================================
  totale: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Totale ordine finale'
  },
  
  totaleCalcolato: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Totale ricalcolato dal backend per verifica'
  },
  
  sconto: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Sconto applicato in €'
  },
  
  scontoPercentuale: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    comment: 'Sconto applicato in %'
  },
  
  // ==========================================
  // STATO E GESTIONE
  // ==========================================
  stato: {
    type: String,
    enum: [
      'nuovo', 
      'in_lavorazione', 
      'inLavorazione',  // legacy
      'pronto', 
      'completato', 
      'annullato',
      'in attesa'  // aggiunto per compatibilità
    ],
    default: 'nuovo',
    index: true
  },
  
  note: {
    type: String,
    trim: true
  },
  
  daViaggio: {
    type: Boolean,
    default: false,
    index: true,
    comment: 'Se true, ordine da consegnare/spedire'
  },
  
  // ==========================================
  // PAGAMENTO
  // ==========================================
  metodoPagamento: {
    type: String,
    enum: ['contanti', 'carta', 'bonifico', 'satispay', 'altro'],
    default: 'contanti'
  },
  
  pagato: {
    type: Boolean,
    default: false,
    index: true
  },
  
  dataPagamento: {
    type: Date
  },
  
  // ==========================================
  // AUDIT E TRACKING
  // ==========================================
  creatoDa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  modificatoDa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  dataModifica: {
    type: Date
  },
  
  modificatoOffline: {
    type: Boolean,
    default: false
  },
  
  ultimaSincronizzazione: {
    type: Date
  },
  
  // ==========================================
  // NOTIFICHE E COMUNICAZIONI
  // ==========================================
  whatsappInviato: {
    type: Boolean,
    default: false
  },
  
  dataInvioWhatsapp: {
    type: Date
  },
  
  emailInviata: {
    type: Boolean,
    default: false
  },
  
  dataInvioEmail: {
    type: Date
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// INDICI COMPOSTI PER PERFORMANCE
// ==========================================
ordineSchema.index({ dataRitiro: 1, oraRitiro: 1 });
ordineSchema.index({ dataRitiro: 1, stato: 1 });
ordineSchema.index({ cliente: 1, dataRitiro: -1 });
ordineSchema.index({ stato: 1, dataRitiro: 1 });
ordineSchema.index({ createdAt: -1 });
ordineSchema.index({ daViaggio: 1, stato: 1 });
ordineSchema.index({ pagato: 1, dataRitiro: 1 });

// ⚠️ RIMUOVI DUPLICATO - mantieni solo quello sopra
// ordineSchema.index({ numeroOrdine: 1 }); // <-- RIMOSSO: già unique sopra

// ==========================================
// METODI INSTANCE
// ==========================================

/**
 * Calcola il totale ordine
 * ✅ I prezzi dei prodotti sono già totali (quantità × prezzo unitario)
 * Quindi facciamo solo la SOMMA
 */
ordineSchema.methods.calcolaTotale = function() {
  // Somma i prezzi già calcolati
  this.totaleCalcolato = this.prodotti.reduce((sum, p) => {
    return sum + (p.prezzo || 0);
  }, 0);
  
  // Applica sconti se presenti
  let totaleConSconto = this.totaleCalcolato;
  
  if (this.scontoPercentuale > 0) {
    totaleConSconto = this.totaleCalcolato * (1 - this.scontoPercentuale / 100);
  } else if (this.sconto > 0) {
    totaleConSconto = this.totaleCalcolato - this.sconto;
  }
  
  this.totale = parseFloat(Math.max(0, totaleConSconto).toFixed(2));
  return this.totale;
};

/**
 * Determina la categoria di un prodotto dal nome
 */
ordineSchema.methods.getCategoriaProdotto = function(nomeProdotto) {
  const nome = nomeProdotto?.toLowerCase() || '';
  
  // Panadas
  if (nome.includes('panada') || nome.includes('panadine')) {
    return 'panadas';
  }
  
  // Ravioli e Culurgiones
  if (nome.includes('culurgiones') || nome.includes('ravioli') || nome.includes('agnolotti')) {
    return 'ravioli';
  }
  
  // Pasta
  if (nome.includes('malloreddus') || nome.includes('gnocch') || 
      nome.includes('fregola') || nome.includes('tagliatelle') ||
      nome.includes('lasagne') || nome.includes('cannelloni') ||
      nome.includes('pasta') || nome.includes('lorighittas') ||
      nome.includes('maccarrones')) {
    return 'pasta';
  }
  
  // Dolci Tradizionali
  if (nome.includes('seadas') || nome.includes('sebadas') || 
      nome.includes('pardulas') || nome.includes('papassin') || 
      nome.includes('amaretti') || nome.includes('bianchini') ||
      nome.includes('gueffus') || nome.includes('candelaus') ||
      nome.includes('pabassinas') || nome.includes('ciambelle') || 
      nome.includes('zeppole') || nome.includes('casadinas')) {
    return 'dolci';
  }
  
  // Pane
  if (nome.includes('pane') || nome.includes('carasau') || 
      nome.includes('civraxiu') || nome.includes('coccoi') ||
      nome.includes('pistoccu') || nome.includes('moddizzosu')) {
    return 'pane';
  }
  
  return 'altro';
};

/**
 * Verifica se l'ordine è in ritardo
 */
ordineSchema.methods.isInRitardo = function() {
  if (!this.dataRitiro) return false;
  const ora = new Date();
  const dataRitiro = new Date(this.dataRitiro);
  
  // Parsing ora ritiro (es: "10:30")
  if (this.oraRitiro) {
    const [ore, minuti] = this.oraRitiro.split(':').map(Number);
    if (!isNaN(ore) && !isNaN(minuti)) {
      dataRitiro.setHours(ore, minuti, 0, 0);
    }
  }
  
  return ora > dataRitiro && this.stato !== 'completato' && this.stato !== 'annullato';
};

/**
 * Segna come completato
 */
ordineSchema.methods.completaOrdine = function() {
  this.stato = 'completato';
  if (!this.pagato) {
    this.pagato = true;
    this.dataPagamento = new Date();
  }
  return this.save();
};

// ==========================================
// HOOKS PRE-SAVE
// ==========================================
ordineSchema.pre('save', function(next) {
  // ✅ FIX: Usa il totale passato dal frontend se valido
  if (!this.totale || this.totale === 0) {
    this.calcolaTotale();
  } else {
    // Verifica coerenza
    const totaleCalcolato = this.prodotti.reduce((sum, p) => sum + (p.prezzo || 0), 0);
    
    // Tolleranza 0.1€ per arrotondamenti
    if (Math.abs(totaleCalcolato - this.totale) < 0.1) {
      this.totaleCalcolato = this.totale;
    } else {
      // Differenza significativa - logga warning e ricalcola
      console.warn(
        `⚠️ Discrepanza totale ordine ${this.numeroOrdine || this._id}:`,
        `Frontend: €${this.totale}, Backend: €${totaleCalcolato.toFixed(2)}`
      );
      this.totale = parseFloat(totaleCalcolato.toFixed(2));
      this.totaleCalcolato = this.totale;
    }
  }
  
  // Normalizza prodotti
  this.prodotti = this.prodotti.map(p => {
    // Pulisci nome prodotto (rimuovi quantità se presente)
    if (p.nome) {
      p.nome = p.nome
        .replace(/\s*\(\d+.*?\)\s*$/g, '') // Rimuovi (123...)
        .trim();
    }
    
    // Normalizza unità di misura
    if (p.unita) {
      p.unita = p.unita.toLowerCase();
    }
    if (p.unitaMisura) {
      p.unitaMisura = p.unitaMisura.toLowerCase();
    }
    
    // Allinea unita e unitaMisura
    if (p.unita && !p.unitaMisura) {
      p.unitaMisura = p.unita;
    } else if (p.unitaMisura && !p.unita) {
      p.unita = p.unitaMisura;
    }
    
    // Auto-determina categoria se mancante
    if (!p.categoria || p.categoria === 'altro') {
      p.categoria = this.getCategoriaProdotto(p.nome);
    }
    
    return p;
  });
  
  // Normalizza stato legacy
  if (this.stato === 'inLavorazione') {
    this.stato = 'in_lavorazione';
  }
  
  next();
});

// Hook pre-save per logging
ordineSchema.pre('save', function(next) {
  if (this.isNew) {
    console.log(`📝 Creazione nuovo ordine: ${this.numeroOrdine || 'temp'} - ${this.nomeCliente}`);
  } else if (this.isModified()) {
    console.log(`✏️ Modifica ordine: ${this.numeroOrdine || this._id}`);
  }
  next();
});

// ==========================================
// VIRTUALS
// ==========================================

ordineSchema.virtual('dataRitiroFormattata').get(function() {
  if (!this.dataRitiro) return null;
  return this.dataRitiro.toLocaleDateString('it-IT', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

ordineSchema.virtual('dataRitiroISO').get(function() {
  return this.dataRitiro?.toISOString().split('T')[0];
});

ordineSchema.virtual('numeroArticoli').get(function() {
  return this.prodotti.length;
});

ordineSchema.virtual('quantitaTotale').get(function() {
  return this.prodotti.reduce((sum, p) => sum + (p.quantita || 0), 0);
});

ordineSchema.virtual('isPagato').get(function() {
  return this.pagato === true;
});

ordineSchema.virtual('isTemporary').get(function() {
  return false;
});

ordineSchema.virtual('ritardoMinuti').get(function() {
  if (!this.isInRitardo()) return 0;
  
  const ora = new Date();
  const dataRitiro = new Date(this.dataRitiro);
  
  if (this.oraRitiro) {
    const [ore, minuti] = this.oraRitiro.split(':').map(Number);
    if (!isNaN(ore) && !isNaN(minuti)) {
      dataRitiro.setHours(ore, minuti, 0, 0);
    }
  }
  
  return Math.floor((ora - dataRitiro) / 60000);
});

// ==========================================
// METODI STATICI
// ==========================================

/**
 * Trova ordini per data
 */
ordineSchema.statics.findByData = function(data) {
  const inizio = new Date(data);
  inizio.setHours(0, 0, 0, 0);
  
  const fine = new Date(data);
  fine.setHours(23, 59, 59, 999);
  
  return this.find({
    dataRitiro: {
      $gte: inizio,
      $lte: fine
    }
  })
  .populate('cliente', 'nome telefono email codiceCliente')
  .sort({ oraRitiro: 1 });
};

/**
 * Trova ordini in ritardo
 */
ordineSchema.statics.findInRitardo = function() {
  const ora = new Date();
  return this.find({
    dataRitiro: { $lt: ora },
    stato: { $nin: ['completato', 'annullato'] }
  })
  .populate('cliente', 'nome telefono')
  .sort({ dataRitiro: 1 });
};

/**
 * Statistiche giornaliere
 */
ordineSchema.statics.statisticheGiornaliere = async function(data) {
  const inizio = new Date(data);
  inizio.setHours(0, 0, 0, 0);
  
  const fine = new Date(data);
  fine.setHours(23, 59, 59, 999);
  
  const ordini = await this.find({
    dataRitiro: { $gte: inizio, $lte: fine }
  });
  
  return {
    totaleOrdini: ordini.length,
    totaleIncasso: ordini.reduce((sum, o) => sum + o.totale, 0),
    ordiniCompletati: ordini.filter(o => o.stato === 'completato').length,
    ordiniAnnullati: ordini.filter(o => o.stato === 'annullato').length,
    ordiniInRitardo: ordini.filter(o => o.isInRitardo()).length,
    mediaOrdine: ordini.length > 0 
      ? ordini.reduce((sum, o) => sum + o.totale, 0) / ordini.length 
      : 0
  };
};

// ==========================================
// EXPORT MODEL
// ==========================================
const Ordine = mongoose.model('Ordine', ordineSchema);

export default Ordine;