// models/MappingProdottiFornitore.js
// Modello per memorizzare gli abbinamenti tra descrizioni prodotti nelle fatture
// e prodotti nel magazzino/ingredienti

import mongoose from 'mongoose';

const MappingProdottiFornitoreSchema = new mongoose.Schema({
  // Dati dal fornitore (dalla fattura XML)
  fornitore: {
    partitaIva: {
      type: String,
      required: true,
      index: true
    },
    ragioneSociale: {
      type: String,
      required: true
    }
  },
  
  // Descrizione originale dal fornitore (come appare in fattura)
  descrizioneFornitore: {
    type: String,
    required: true,
    trim: true
  },
  
  // Codice articolo fornitore (se presente)
  codiceArticoloFornitore: {
    type: String,
    trim: true,
    sparse: true
  },
  
  // Riferimento al prodotto nel nostro sistema
  prodottoMagazzino: {
    tipo: {
      type: String,
      enum: ['ingrediente', 'prodotto', 'altro'],
      default: 'ingrediente'
    },
    // Riferimento all'ingrediente o prodotto nel magazzino
    ingredienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingrediente'
    },
    // Nome del prodotto nel nostro sistema (per riferimento rapido)
    nome: {
      type: String,
      required: true
    },
    // Categoria nel nostro sistema
    categoria: {
      type: String
    }
  },
  
  // Fattore di conversione unità di misura
  conversione: {
    unitaFornitore: {
      type: String,
      default: 'KG'
    },
    unitaMagazzino: {
      type: String,
      default: 'kg'
    },
    fattore: {
      type: Number,
      default: 1 // 1 = nessuna conversione
    }
  },
  
  // Contatore utilizzi (per ordinare per frequenza)
  utilizzi: {
    type: Number,
    default: 1
  },
  
  // Ultimo utilizzo
  ultimoUtilizzo: {
    type: Date,
    default: Date.now
  },
  
  // Flag per mapping confermato manualmente
  confermatoManualmente: {
    type: Boolean,
    default: false
  },
  
  // Score di similarità (se match automatico)
  scoreSimilarita: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Attivo
  attivo: {
    type: Boolean,
    default: true
  },
  
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indice composto per ricerca veloce
MappingProdottiFornitoreSchema.index({ 
  'fornitore.partitaIva': 1, 
  'descrizioneFornitore': 1 
}, { unique: true });

// Indice per ricerca per ingrediente
MappingProdottiFornitoreSchema.index({ 'prodottoMagazzino.ingredienteId': 1 });

// Indice per ordinamento per utilizzi
MappingProdottiFornitoreSchema.index({ utilizzi: -1 });

// Metodo statico per trovare o creare mapping
MappingProdottiFornitoreSchema.statics.trovaOCrea = async function(datiFornitore, descrizione, codice = null) {
  let mapping = await this.findOne({
    'fornitore.partitaIva': datiFornitore.partitaIva,
    descrizioneFornitore: descrizione
  });
  
  if (mapping) {
    // Aggiorna contatore utilizzi
    mapping.utilizzi += 1;
    mapping.ultimoUtilizzo = new Date();
    await mapping.save();
    return { mapping, nuovo: false };
  }
  
  return { mapping: null, nuovo: true };
};

// Metodo statico per cercare mapping simili (fuzzy)
MappingProdottiFornitoreSchema.statics.cercaSimilari = async function(partitaIva, descrizione) {
  // Cerca mapping esistenti dello stesso fornitore
  const mappings = await this.find({
    'fornitore.partitaIva': partitaIva,
    attivo: true
  }).sort({ utilizzi: -1 }).limit(50);
  
  if (!mappings.length) return [];
  
  // Calcola similarità con ogni mapping
  const risultati = mappings.map(m => {
    const score = calcolaSimilarita(descrizione, m.descrizioneFornitore);
    return { mapping: m, score };
  }).filter(r => r.score > 50) // Solo score > 50%
    .sort((a, b) => b.score - a.score);
  
  return risultati;
};

// Metodo statico per suggerire prodotto magazzino
MappingProdottiFornitoreSchema.statics.suggerisciProdotto = async function(descrizione, ingredienti) {
  // Normalizza descrizione
  const descNorm = normalizzaDescrizione(descrizione);
  
  // Cerca tra gli ingredienti
  let migliorMatch = null;
  let migliorScore = 0;
  
  for (const ing of ingredienti) {
    const ingNorm = normalizzaDescrizione(ing.nome);
    const score = calcolaSimilarita(descNorm, ingNorm);
    
    if (score > migliorScore) {
      migliorScore = score;
      migliorMatch = ing;
    }
  }
  
  if (migliorScore >= 60) {
    return { ingrediente: migliorMatch, score: migliorScore };
  }
  
  return null;
};

// Funzione helper per normalizzare descrizione
function normalizzaDescrizione(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Funzione helper per calcolare similarità (algoritmo semplice)
function calcolaSimilarita(str1, str2) {
  const s1 = normalizzaDescrizione(str1);
  const s2 = normalizzaDescrizione(str2);
  
  // Se sono uguali
  if (s1 === s2) return 100;
  
  // Calcola parole in comune
  const parole1 = new Set(s1.split(' ').filter(p => p.length > 2));
  const parole2 = new Set(s2.split(' ').filter(p => p.length > 2));
  
  if (parole1.size === 0 || parole2.size === 0) return 0;
  
  let comuni = 0;
  for (const p of parole1) {
    if (parole2.has(p)) comuni++;
  }
  
  // Score basato su parole in comune
  const score = (comuni * 2 / (parole1.size + parole2.size)) * 100;
  
  return Math.round(score);
}

const MappingProdottiFornitore = mongoose.model('MappingProdottiFornitore', MappingProdottiFornitoreSchema);

export default MappingProdottiFornitore;
