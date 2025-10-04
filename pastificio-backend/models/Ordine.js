// models/Ordine.js
import mongoose from 'mongoose';

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
    enum: ['kg', 'pezzi', '€', 'g', 'l'],
    default: 'kg'
  },
  unitaMisura: {
    type: String,
    enum: ['kg', 'pezzi', '€', 'g', 'l'],
    default: 'kg'
  },
  prezzo: {
    type: Number,
    required: true,
    min: 0
  },
  categoria: {
    type: String,
    enum: ['pasta', 'dolci', 'pane', 'altro'],
    default: 'altro'
  }
});

const ordineSchema = new mongoose.Schema({
  nomeCliente: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  dataRitiro: {
    type: Date,
    required: true
  },
  oraRitiro: {
    type: String,
    required: true
  },
  prodotti: [prodottoSchema],
  totale: {
    type: Number,
    default: 0
  },
  totaleCalcolato: {
    type: Number,
    default: 0
  },
  note: {
    type: String,
    trim: true
  },
  stato: {
    type: String,
    enum: ['nuovo', 'inLavorazione', 'pronto', 'completato', 'annullato'],
    default: 'nuovo'
  },
  metodoPagamento: {
    type: String,
    enum: ['contanti', 'carta', 'bonifico', 'altro'],
    default: 'contanti'
  },
  pagato: {
    type: Boolean,
    default: false
  },
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
  // Campi per sincronizzazione
  modificatoOffline: {
    type: Boolean,
    default: false
  },
  ultimaSincronizzazione: {
    type: Date
  }
}, {
  timestamps: true
});

// Indici per performance
ordineSchema.index({ dataRitiro: 1, oraRitiro: 1 });
ordineSchema.index({ nomeCliente: 1 });
ordineSchema.index({ stato: 1 });
ordineSchema.index({ createdAt: -1 });

// Metodo per calcolare il totale
ordineSchema.methods.calcolaTotale = function() {
  this.totaleCalcolato = this.prodotti.reduce((sum, p) => {
    return sum + (p.quantita * p.prezzo);
  }, 0);
  this.totale = this.totaleCalcolato;
  return this.totale;
};

// Hook pre-save per calcolare il totale e normalizzare i dati
ordineSchema.pre('save', function(next) {
  // Calcola totale se non presente
  if (!this.totale) {
    this.calcolaTotale();
  }
  
  // Normalizza prodotti
  this.prodotti = this.prodotti.map(p => {
    // Rimuovi quantità dal nome se presente
    if (p.nome) {
      p.nome = p.nome.replace(/\s*\(\d+.*?\)\s*$/, '').trim();
    }
    
    // Assicura che unita e unitaMisura siano allineati
    if (p.unita && !p.unitaMisura) {
      p.unitaMisura = p.unita;
    } else if (p.unitaMisura && !p.unita) {
      p.unita = p.unitaMisura;
    }
    
    // Determina categoria se non presente
    if (!p.categoria) {
      p.categoria = this.getCategoriaProdotto(p.nome);
    }
    
    return p;
  });
  
  next();
});

// Metodo per determinare la categoria di un prodotto
ordineSchema.methods.getCategoriaProdotto = function(nomeProdotto) {
  const nome = nomeProdotto?.toLowerCase() || '';
  
  if (nome.includes('malloreddus') || nome.includes('culurgiones') || 
      nome.includes('ravioli') || nome.includes('gnocch') || 
      nome.includes('fregola') || nome.includes('tagliatelle') ||
      nome.includes('lasagne') || nome.includes('cannelloni')) {
    return 'pasta';
  }
  
  if (nome.includes('seadas') || nome.includes('sebadas') || 
      nome.includes('pardulas') || nome.includes('papassin') || 
      nome.includes('amaretti') || nome.includes('bianchini') ||
      nome.includes('gueffus') || nome.includes('candelaus') ||
      nome.includes('pabassinas') || nome.includes('dolci') ||
      nome.includes('ciambelle')) {
    return 'dolci';
  }
  
  if (nome.includes('pane') || nome.includes('carasau') || 
      nome.includes('civraxiu') || nome.includes('coccoi') ||
      nome.includes('pistoccu') || nome.includes('moddizzosu')) {
    return 'pane';
  }
  
  return 'altro';
};

// Virtuals
ordineSchema.virtual('dataRitiroFormattata').get(function() {
  return this.dataRitiro?.toLocaleDateString('it-IT');
});

ordineSchema.virtual('isTemporary').get(function() {
  return false; // Gli ordini salvati nel DB non sono mai temporanei
});

const Ordine = mongoose.model('Ordine', ordineSchema);

export default Ordine;