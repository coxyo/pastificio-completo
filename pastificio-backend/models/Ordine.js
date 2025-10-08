// models/Ordine.js - FIX DEFINITIVO
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
  // ✅ FIX: Accetta TUTTE le varianti maiuscole/minuscole
  unita: {
    type: String,
    enum: ['kg', 'Kg', 'KG', 'pezzi', 'Pezzi', 'PEZZI', 'unità', 'Unità', 'unitÃ ', 'unitÃƒ ', '€', 'EUR', 'g', 'G', 'l', 'L'],
    default: 'kg'
  },
  unitaMisura: {
    type: String,
    enum: ['kg', 'Kg', 'KG', 'pezzi', 'Pezzi', 'PEZZI', 'unità', 'Unità', 'unitÃ ', 'unitÃƒ ', '€', 'EUR', 'g', 'G', 'l', 'L'],
    default: 'kg'
  },
  prezzo: {
    type: Number,
    required: true,
    min: 0
  },
  // ✅ FIX: Rimuove enum rigido - accetta QUALSIASI stringa
  categoria: {
    type: String,
    trim: true,
    default: 'altro'
  },
  variante: {
    type: String,
    trim: true
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
    enum: ['nuovo', 'inLavorazione', 'pronto', 'completato', 'annullato', 'in_lavorazione'],
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
  daViaggio: {
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
  modificatoOffline: {
    type: Boolean,
    default: false
  },
  ultimaSincronizzazione: {
    type: Date
  },
  numeroOrdine: {
    type: String,
    unique: true,
    sparse: true
  },
  // ✅ FIX: Campo cliente OPZIONALE (può essere null)
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: false,
    default: null
  }
}, {
  timestamps: true
});

// Indici per performance
ordineSchema.index({ dataRitiro: 1, oraRitiro: 1 });
ordineSchema.index({ nomeCliente: 1 });
ordineSchema.index({ stato: 1 });
ordineSchema.index({ createdAt: -1 });
ordineSchema.index({ numeroOrdine: 1 });
ordineSchema.index({ daViaggio: 1 });

// Metodo per calcolare il totale
ordineSchema.methods.calcolaTotale = function() {
  this.totaleCalcolato = this.prodotti.reduce((sum, p) => {
    return sum + (p.quantita * p.prezzo);
  }, 0);
  this.totale = this.totaleCalcolato;
  return this.totale;
};

// ✅ Hook pre-save MIGLIORATO - Normalizza e pulisce dati
ordineSchema.pre('save', function(next) {
  // Calcola totale se non presente
  if (!this.totale || this.totale === 0) {
    this.calcolaTotale();
  }
  
  // ✅ NORMALIZZA PRODOTTI - Risolve problemi enum
  this.prodotti = this.prodotti.map(p => {
    // Rimuovi quantità dal nome se presente
    if (p.nome) {
      p.nome = p.nome.replace(/\s*\(\d+.*?\)\s*$/, '').trim();
    }
    
    // ✅ NORMALIZZA unità di misura (accetta maiuscole/minuscole)
    if (p.unita) {
      // Converte "Pezzi" → "pezzi", "Kg" → "kg"
      const unitaNormalized = p.unita.toLowerCase();
      if (['kg', 'pezzi', 'unità', '€', 'g', 'l'].includes(unitaNormalized)) {
        p.unita = unitaNormalized;
      }
    }
    
    if (p.unitaMisura) {
      const unitaMisuraNormalized = p.unitaMisura.toLowerCase();
      if (['kg', 'pezzi', 'unità', '€', 'g', 'l'].includes(unitaMisuraNormalized)) {
        p.unitaMisura = unitaMisuraNormalized;
      }
    }
    
    // Assicura che unita e unitaMisura siano allineati
    if (p.unita && !p.unitaMisura) {
      p.unitaMisura = p.unita;
    } else if (p.unitaMisura && !p.unita) {
      p.unita = p.unitaMisura;
    }
    
    // ✅ NORMALIZZA CATEGORIA - Determina automaticamente
    if (!p.categoria || p.categoria === 'altro' || p.categoria === p.nome) {
      p.categoria = this.getCategoriaProdotto(p.nome);
    } else {
      // Se categoria è un nome prodotto, normalizza
      p.categoria = this.getCategoriaProdotto(p.categoria);
    }
    
    return p;
  });
  
  next();
});

// ✅ Metodo MIGLIORATO per determinare la categoria
ordineSchema.methods.getCategoriaProdotto = function(nomeProdotto) {
  const nome = nomeProdotto?.toLowerCase() || '';
  
  // Panadas
  if (nome.includes('panada') || nome.includes('panadine')) {
    return 'panadas';
  }
  
  // Pasta
  if (nome.includes('malloreddus') || nome.includes('culurgiones') || 
      nome.includes('ravioli') || nome.includes('gnocch') || 
      nome.includes('fregola') || nome.includes('tagliatelle') ||
      nome.includes('lasagne') || nome.includes('cannelloni') ||
      nome.includes('pasta')) {
    return 'pasta';
  }
  
  // Dolci
  if (nome.includes('seadas') || nome.includes('sebadas') || 
      nome.includes('pardulas') || nome.includes('papassin') || 
      nome.includes('amaretti') || nome.includes('bianchini') ||
      nome.includes('gueffus') || nome.includes('candelaus') ||
      nome.includes('pabassinas') || nome.includes('dolci') ||
      nome.includes('ciambelle') || nome.includes('zeppole')) {
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

// Virtuals
ordineSchema.virtual('dataRitiroFormattata').get(function() {
  return this.dataRitiro?.toLocaleDateString('it-IT');
});

ordineSchema.virtual('isTemporary').get(function() {
  return false;
});

const Ordine = mongoose.model('Ordine', ordineSchema);

export default Ordine;