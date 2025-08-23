// models/ingrediente.js
import mongoose from 'mongoose';
import logger from '../config/logger.js';

// Schema per l'ingrediente
const IngredienteSchema = new mongoose.Schema({
  codice: {
    type: String,
    trim: true,
    uppercase: true,
    unique: true,
    sparse: true
  },
  nome: {
    type: String,
    required: [true, 'Il nome è obbligatorio'],
    trim: true,
    maxlength: [100, 'Il nome non può superare i 100 caratteri']
  },
  descrizione: {
    type: String,
    trim: true
  },
  categoria: {
    type: String,
    required: [true, 'La categoria è obbligatoria'],
    enum: ['farina', 'latticini', 'carne', 'pesce', 'frutta', 'verdura', 'spezie', 'uova', 'semola', 'formaggio', 'imballaggio', 'altro'],
    default: 'altro'
  },
  unitaMisura: {
    type: String,
    required: [true, 'L\'unità di misura è obbligatoria'],
    enum: ['kg', 'g', 'l', 'ml', 'pz', 'unità', 'altro'],
    default: 'kg'
  },
  prezzoUnitario: {
    type: Number,
    required: [true, 'Il prezzo unitario è obbligatorio'],
    min: [0, 'Il prezzo unitario deve essere maggiore o uguale a 0']
  },
  prezzoMedio: {
    type: Number,
    default: 0,
    min: [0, 'Il prezzo medio deve essere maggiore o uguale a 0']
  },
  scorteMinime: {
    type: Number,
    default: 0,
    min: [0, 'Le scorte minime devono essere maggiori o uguali a 0']
  },
  scorteMassime: {
    type: Number,
    default: 0,
    min: [0, 'Le scorte massime devono essere maggiori o uguali a 0']
  },
  lottoMinimo: {
    type: Number,
    default: 1,
    min: [0, 'Il lotto minimo deve essere maggiore o uguale a 0']
  },
  tempoConsegna: {
    type: Number,
    default: 0,
    min: [0, 'Il tempo di consegna deve essere maggiore o uguale a 0']
  },
  attivo: {
    type: Boolean,
    default: true
  },
  fornitoriPrimari: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fornitore'
  }],
  lotti: [{
    codice: {
      type: String,
      required: true,
      trim: true
    },
    quantita: {
      type: Number,
      required: true,
      min: 0
    },
    dataScadenza: {
      type: Date
    },
    dataAcquisto: {
      type: Date,
      default: Date.now
    },
    fornitore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fornitore'
    },
    prezzo: {
      type: Number,
      default: 0
    },
    numDocumento: {
      type: String,
      trim: true
    },
    note: {
      type: String,
      trim: true
    }
  }],
  posizioneMagazzino: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  immagine: {
    type: String
  },
  note: {
    type: String
  },
  allergenico: {
    type: Boolean,
    default: false
  },
  tipiAllergene: [{
    type: String,
    enum: [
      'glutine', 
      'latte', 
      'uova', 
      'frutta_a_guscio', 
      'pesce', 
      'crostacei', 
      'soia', 
      'sesamo', 
      'senape',
      'sedano',
      'lupini',
      'molluschi',
      'arachidi',
      'anidride_solforosa',
      'altro',
      ''
    ],
    default: ''
  }],
  ricette: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ricetta'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indici per ricerche efficienti
IngredienteSchema.index({ nome: 1 });
IngredienteSchema.index({ codice: 1 });
IngredienteSchema.index({ categoria: 1 });
IngredienteSchema.index({ attivo: 1 });
IngredienteSchema.index({ allergenico: 1 });
IngredienteSchema.index({ barcode: 1 });
IngredienteSchema.index({ 'lotti.dataScadenza': 1 });

// Virtual per ottenere le scorte attuali
IngredienteSchema.virtual('scorteAttuali').get(async function() {
  try {
    const Magazzino = mongoose.model('Magazzino');
    const magazzini = await Magazzino.find({ attivo: true });
    
    let totale = 0;
    for (const magazzino of magazzini) {
      const items = magazzino.inventario.filter(i => 
        i.ingredienteId.toString() === this._id.toString());
      
      for (const item of items) {
        totale += item.quantita;
      }
    }
    
    return totale;
  } catch (error) {
    logger.error(`Errore nel calcolo scorte per ingrediente ${this._id}: ${error.message}`);
    return 0;
  }
});

// Virtual per calcolare le scorte totali da lotti
IngredienteSchema.virtual('quantitaTotaleLotti').get(function() {
  if (!this.lotti || this.lotti.length === 0) return 0;
  return this.lotti.reduce((total, lotto) => total + lotto.quantita, 0);
});

// Virtual per ricavare i lotti in scadenza
IngredienteSchema.virtual('lottiInScadenza').get(function() {
  if (!this.lotti || this.lotti.length === 0) return [];
  
  const oggi = new Date();
  const trenta_giorni = new Date();
  trenta_giorni.setDate(trenta_giorni.getDate() + 30);
  
  return this.lotti.filter(lotto => 
    lotto.dataScadenza && 
    lotto.dataScadenza > oggi && 
    lotto.dataScadenza <= trenta_giorni &&
    lotto.quantita > 0
  );
});

// Virtual per valore totale dell'ingrediente
IngredienteSchema.virtual('valoreTotale').get(function() {
  if (this.quantitaTotaleLotti === 0) return 0;
  return this.quantitaTotaleLotti * this.prezzoMedio;
});

// Virtual per stato scorta
IngredienteSchema.virtual('statoScorta').get(function() {
  if (this.quantitaTotaleLotti === 0) return 'ESAURITO';
  if (this.quantitaTotaleLotti <= this.scorteMinime) return 'SOTTO_SOGLIA';
  if (this.quantitaTotaleLotti >= this.scorteMassime) return 'ECCESSO';
  return 'NORMALE';
});

// Middleware pre-save
IngredienteSchema.pre('save', function(next) {
  // Generazione automatica codice se non presente
  if (!this.codice) {
    // Crea un codice basato sulla categoria e nome
    const prefixMap = {
      'farina': 'FA',
      'latticini': 'LA',
      'carne': 'CR',
      'pesce': 'PS',
      'frutta': 'FR',
      'verdura': 'VD',
      'spezie': 'SP',
      'uova': 'UV',
      'semola': 'SM',
      'formaggio': 'FM',
      'imballaggio': 'IM',
      'altro': 'AL'
    };
    
    const prefix = prefixMap[this.categoria] || 'XX';
    const namePart = this.nome.substring(0, 3).toUpperCase();
    
    // Usa timestamp per rendere il codice unico
    const timestamp = Date.now().toString().substring(8, 13);
    
    this.codice = `${prefix}${namePart}${timestamp}`;
  }
  
  // Calcola prezzo medio in base ai lotti
  if (this.lotti && this.lotti.length > 0) {
    let totalQuantity = 0;
    let totalValue = 0;
    
    this.lotti.forEach(lotto => {
      if (lotto.prezzo > 0 && lotto.quantita > 0) {
        totalValue += lotto.prezzo * lotto.quantita;
        totalQuantity += lotto.quantita;
      }
    });
    
    if (totalQuantity > 0) {
      this.prezzoMedio = totalValue / totalQuantity;
    } else {
      this.prezzoMedio = this.prezzoUnitario;
    }
  } else {
    this.prezzoMedio = this.prezzoUnitario;
  }
  
  next();
});

// Metodi statici
IngredienteSchema.statics.getInSottoSoglia = async function() {
  return this.find({
    attivo: true,
    $expr: { 
      $lte: [
        { $ifNull: [{ $sum: "$lotti.quantita" }, 0] },
        "$scorteMinime"
      ]
    }
  }).sort('categoria nome');
};

IngredienteSchema.statics.getInScadenza = async function(giorniMax = 30) {
  const oggi = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() + giorniMax);
  
  return this.find({
    attivo: true,
    lotti: {
      $elemMatch: {
        dataScadenza: { $gt: oggi, $lte: dataLimite },
        quantita: { $gt: 0 }
      }
    }
  }).sort('lotti.dataScadenza');
};

// Crea il modello
const Ingrediente = mongoose.model('Ingrediente', IngredienteSchema);

export default Ingrediente;