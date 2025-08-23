// models/ordine.js
import mongoose from 'mongoose';

const ProdottoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  quantita: {
    type: Number,
    required: true,
    min: [0, 'La quantità non può essere negativa']
  },
  prezzo: {
    type: Number, 
    required: true,
    min: [0, 'Il prezzo non può essere negativo']
  },
  unitaMisura: {
    type: String,
    enum: ['Kg', 'Pezzi', 'Unità', 'unità', '€'],
    required: true
  },
  categoria: {
    type: String,
    default: 'altro'
  },
  note: String
});

const StatoSchema = new mongoose.Schema({
  stato: {
    type: String,
    required: true,
    enum: ['nuovo', 'in_lavorazione', 'completato', 'annullato']
  },
  data: {
    type: Date,
    default: Date.now
  },
  note: String
}, { _id: false });

const OrdineSchema = new mongoose.Schema({
  // Riferimento al cliente (opzionale)
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: false
  },
  nomeCliente: {
    type: String,
    required: [true, 'Il nome del cliente è obbligatorio'],
    trim: true
  },
  telefono: {
    type: String,
    required: [true, 'Il numero di telefono è obbligatorio'],
    trim: true,
    validate: {
      validator: function(v) {
        // Accetta numeri con 9-15 cifre (per gestire prefissi internazionali)
        return /^\d{9,15}$/.test(v);
      },
      message: props => `${props.value} non è un numero di telefono valido!`
    }
  },
  email: String,
  dataRitiro: {
    type: Date,
    required: [true, 'La data di ritiro è obbligatoria'],
    validate: {
      validator: function(v) {
        // Disabilita temporaneamente per test
        return true;
        // Per riabilitare:
        // const oggi = new Date();
        // oggi.setHours(0, 0, 0, 0);
        // return v >= oggi;
      },
      message: 'La data di ritiro deve essere oggi o futura'
    }
  },
  oraRitiro: {
    type: String,
    required: [true, "L'ora di ritiro è obbligatoria"],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} non è un formato ora valido!`
    }
  },
  prodotti: {
    type: [ProdottoSchema],
    required: [true, 'Almeno un prodotto è richiesto'],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Un ordine deve contenere almeno un prodotto'
    }
  },
  deveViaggiare: {
    type: Boolean,
    default: false
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Le note non possono superare i 500 caratteri']
  },
  stato: {
    type: String,
    enum: ['nuovo', 'in_lavorazione', 'completato', 'annullato'],
    default: 'nuovo'
  },
  storicoStati: [StatoSchema],
  totale: {
    type: Number,
    default: 0
  },
  pagato: {
    type: Boolean,
    default: false
  },
  metodoPagamento: {
    type: String,
    enum: ['contanti', 'carta', 'bonifico', 'non_pagato'],
    default: 'non_pagato'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tempId: String // Per gestire ordini offline
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
OrdineSchema.virtual('totaleCalcolato').get(function() {
  const subtotale = this.prodotti.reduce((tot, prod) => {
    if (prod.unitaMisura === '€') {
      return tot + prod.quantita;
    }
    return tot + (prod.quantita * prod.prezzo);
  }, 0);
  return this.deveViaggiare ? subtotale * 1.1 : subtotale;
});

OrdineSchema.virtual('numeroProdotti').get(function() {
  return this.prodotti.reduce((tot, prod) => tot + prod.quantita, 0);
});

// Inizializza lo storico stati quando viene creato un nuovo ordine
OrdineSchema.pre('save', function(next) {
  if (this.isNew) {
    this.storicoStati = [{
      stato: this.stato || 'nuovo',
      data: new Date()
    }];
    
    // Calcola il totale se non è stato fornito
    if (!this.totale) {
      this.totale = this.totaleCalcolato;
    }
  }
  next();
});

// Middleware per aggiornare statistiche cliente dopo il salvataggio
OrdineSchema.post('save', async function(doc) {
  if (doc.cliente) {
    try {
      const Cliente = mongoose.model('Cliente');
      await Cliente.findByIdAndUpdate(doc.cliente, {
        $inc: { 
          'statistiche.numeroOrdini': 1,
          'statistiche.totaleSpeso': doc.totale || doc.totaleCalcolato
        },
        $set: {
          'statistiche.ultimoOrdine': new Date()
        }
      });
      
      // Calcola media ordine
      const cliente = await Cliente.findById(doc.cliente);
      if (cliente && cliente.statistiche.numeroOrdini > 0) {
        cliente.statistiche.mediaOrdine = cliente.statistiche.totaleSpeso / cliente.statistiche.numeroOrdini;
        
        // Aggiorna punti fedeltà (1 punto per euro)
        const puntiDaAggiungere = Math.floor(doc.totale || doc.totaleCalcolato);
        if (cliente.aggiungiPunti) {
          await cliente.aggiungiPunti(puntiDaAggiungere, `Ordine #${doc._id}`);
        }
      }
    } catch (error) {
      console.error('Errore aggiornamento statistiche cliente:', error);
    }
  }
});

// Indici
OrdineSchema.index({ dataRitiro: 1 });
OrdineSchema.index({ nomeCliente: 1 });
OrdineSchema.index({ stato: 1 });
OrdineSchema.index({ telefono: 1 });
OrdineSchema.index({ cliente: 1 });
OrdineSchema.index({ createdAt: -1 });

// Metodo per cambiare stato
OrdineSchema.methods.cambiaStato = async function(nuovoStato, note = '') {
  const transizioniValide = {
    'nuovo': ['in_lavorazione', 'annullato'],
    'in_lavorazione': ['completato', 'annullato'],
    'completato': ['annullato'],
    'annullato': []
  };

  if (!transizioniValide[this.stato]?.includes(nuovoStato)) {
    throw new Error(`Transizione non valida da ${this.stato} a ${nuovoStato}`);
  }

  this.stato = nuovoStato;
  this.storicoStati.push({
    stato: nuovoStato,
    data: new Date(),
    note
  });

  return await this.save();
};

// Metodi statici
OrdineSchema.statics.getStatistiche = async function(dataInizio, dataFine) {
  return this.aggregate([
    {
      $match: {
        dataRitiro: {
          $gte: dataInizio,
          $lte: dataFine
        }
      }
    },
    {
      $group: {
        _id: '$stato',
        count: { $sum: 1 },
        totale: { $sum: '$totale' }
      }
    }
  ]);
};

// Metodo per la ricerca avanzata
OrdineSchema.statics.ricercaAvanzata = async function(filtri = {}) {
  const query = {};
  
  if (filtri.dataInizio || filtri.dataFine) {
    query.dataRitiro = {};
    if (filtri.dataInizio) query.dataRitiro.$gte = filtri.dataInizio;
    if (filtri.dataFine) query.dataRitiro.$lte = filtri.dataFine;
  }

  if (filtri.cliente) {
    query.nomeCliente = new RegExp(filtri.cliente, 'i');
  }

  if (filtri.stato) {
    query.stato = filtri.stato;
  }

  if (filtri.telefono) {
    query.telefono = new RegExp(filtri.telefono.replace(/\D/g, ''));
  }

  return this.find(query)
    .sort(filtri.ordinamento || '-dataRitiro')
    .skip(filtri.skip || 0)
    .limit(filtri.limit || 20);
};

export const Ordine = mongoose.model('Ordine', OrdineSchema);
export default Ordine;