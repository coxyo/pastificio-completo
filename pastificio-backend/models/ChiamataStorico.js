// models/ChiamataStorico.js
import mongoose from 'mongoose';

const chiamataStoricoSchema = new mongoose.Schema({
  // Identificatori
  callId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Dati chiamata
  numero: {
    type: String,
    required: true,
    index: true
  },
  
  numeroNormalizzato: {
    type: String,
    required: true,
    index: true
  },
  
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    index: true
  },
  
  // Timing
  dataOraChiamata: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  durata: {
    type: Number, // in secondi
    default: 0
  },
  
  // Stato
  stato: {
    type: String,
    enum: ['ricevuta', 'risposta', 'persa', 'occupato', 'rifiutata'],
    default: 'ricevuta'
  },
  
  esitoChiamata: {
    type: String,
    enum: ['ordine_creato', 'richiesta_info', 'richiamata', 'nessun_ordine', 'altro'],
    default: null
  },
  
  // Relazioni
  ordineCollegato: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ordine',
    default: null
  },
  
  // Note e dettagli
  note: {
    type: String,
    default: ''
  },
  
  noteAutomatiche: [{
    tipo: {
      type: String,
      enum: ['cliente_nuovo', 'cliente_frequente', 'ordine_recente', 'prodotto_preferito', 'compleanno', 'promemoria']
    },
    messaggio: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  source: {
    type: String,
    default: '3cx_extension'
  },
  
  operatore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Tags per analytics
  tags: [{
    type: String
  }],
  
  // Trascrizione (per fase 5)
  trascrizione: {
    testo: String,
    lingua: String,
    confidence: Number,
    durataTrascrizione: Number
  },
  
  // Recording (per fase 5)
  recording: {
    url: String,
    formato: String,
    dimensione: Number,
    dataScadenza: Date
  }
  
}, {
  timestamps: true,
  collection: 'chiamate_storico'
});

// Indici composti per performance
chiamataStoricoSchema.index({ cliente: 1, dataOraChiamata: -1 });
chiamataStoricoSchema.index({ numeroNormalizzato: 1, dataOraChiamata: -1 });
chiamataStoricoSchema.index({ stato: 1, dataOraChiamata: -1 });
chiamataStoricoSchema.index({ esitoChiamata: 1 });

// Virtual per ottenere ultimi ordini cliente
chiamataStoricoSchema.virtual('ordiniRecenti', {
  ref: 'Ordine',
  localField: 'cliente',
  foreignField: 'cliente',
  options: { sort: { createdAt: -1 }, limit: 5 }
});

// Metodo per generare note automatiche
chiamataStoricoSchema.methods.generaNoteAutomatiche = async function() {
  const note = [];
  
  if (this.cliente) {
    const Cliente = mongoose.model('Cliente');
    const Ordine = mongoose.model('Ordine');
    const ChiamataStorico = mongoose.model('ChiamataStorico');
    
    try {
      // Carica cliente
      const cliente = await Cliente.findById(this.cliente);
      
      if (!cliente) return note;
      
      // 1. Cliente nuovo
      const chiamatePrecedenti = await ChiamataStorico.countDocuments({
        cliente: this.cliente,
        _id: { $ne: this._id }
      });
      
      if (chiamatePrecedenti === 0) {
        note.push({
          tipo: 'cliente_nuovo',
          messaggio: '🎉 Prima chiamata! Cliente nuovo da accogliere con attenzione.',
          timestamp: new Date()
        });
      }
      
      // 2. Cliente frequente
      if (chiamatePrecedenti > 10) {
        note.push({
          tipo: 'cliente_frequente',
          messaggio: `⭐ Cliente VIP: ${chiamatePrecedenti} chiamate precedenti. Livello: ${cliente.livelloFedelta || 'Standard'}.`,
          timestamp: new Date()
        });
      }
      
      // 3. Ordine recente
      const ultimoOrdine = await Ordine.findOne({
        cliente: this.cliente
      }).sort({ createdAt: -1 });
      
      if (ultimoOrdine) {
        const giorniDaUltimoOrdine = Math.floor(
          (new Date() - new Date(ultimoOrdine.createdAt)) / (1000 * 60 * 60 * 24)
        );
        
        if (giorniDaUltimoOrdine <= 7) {
          note.push({
            tipo: 'ordine_recente',
            messaggio: `📦 Ultimo ordine ${giorniDaUltimoOrdine} giorni fa (${new Date(ultimoOrdine.createdAt).toLocaleDateString('it-IT')}) - €${ultimoOrdine.totale?.toFixed(2)}`,
            timestamp: new Date()
          });
        }
      }
      
      // 4. Prodotto preferito
      const ordiniCliente = await Ordine.find({
        cliente: this.cliente
      }).limit(20).lean();
      
      if (ordiniCliente.length > 0) {
        const prodottiCount = {};
        
        ordiniCliente.forEach(ordine => {
          (ordine.prodotti || []).forEach(p => {
            prodottiCount[p.nome] = (prodottiCount[p.nome] || 0) + 1;
          });
        });
        
        const prodottoPreferito = Object.entries(prodottiCount)
          .sort((a, b) => b[1] - a[1])[0];
        
        if (prodottoPreferito && prodottoPreferito[1] >= 3) {
          note.push({
            tipo: 'prodotto_preferito',
            messaggio: `❤️ Prodotto preferito: ${prodottoPreferito[0]} (ordinato ${prodottoPreferito[1]} volte)`,
            timestamp: new Date()
          });
        }
      }
      
      // 5. Compleanno
      if (cliente.dataNascita) {
        const oggi = new Date();
        const compleanno = new Date(cliente.dataNascita);
        
        if (oggi.getMonth() === compleanno.getMonth() && 
            oggi.getDate() === compleanno.getDate()) {
          note.push({
            tipo: 'compleanno',
            messaggio: '🎂 COMPLEANNO OGGI! Augura buon compleanno al cliente!',
            timestamp: new Date()
          });
        }
        
        // Settimana del compleanno
        const giorniAlCompleanno = Math.floor(
          (new Date(oggi.getFullYear(), compleanno.getMonth(), compleanno.getDate()) - oggi) / (1000 * 60 * 60 * 24)
        );
        
        if (giorniAlCompleanno > 0 && giorniAlCompleanno <= 7) {
          note.push({
            tipo: 'compleanno',
            messaggio: `🎈 Compleanno tra ${giorniAlCompleanno} giorni! Proponi un dolce speciale.`,
            timestamp: new Date()
          });
        }
      }
      
      // 6. Promemoria ordini in sospeso
      const ordiniInSospeso = await Ordine.countDocuments({
        cliente: this.cliente,
        stato: { $in: ['nuovo', 'in_lavorazione'] }
      });
      
      if (ordiniInSospeso > 0) {
        note.push({
          tipo: 'promemoria',
          messaggio: `⏰ ${ordiniInSospeso} ordine/i in sospeso da ritirare.`,
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      console.error('Errore generazione note automatiche:', error);
    }
  }
  
  this.noteAutomatiche = note;
  return note;
};

// Hook pre-save per generare note automatiche
chiamataStoricoSchema.pre('save', async function(next) {
  if (this.isNew && this.cliente) {
    await this.generaNoteAutomatiche();
  }
  next();
});

// Metodo statico per statistiche
chiamataStoricoSchema.statics.getStatisticheCliente = async function(clienteId) {
  const stats = await this.aggregate([
    {
      $match: { cliente: new mongoose.Types.ObjectId(clienteId) }
    },
    {
      $group: {
        _id: null,
        totaleChiamate: { $sum: 1 },
        durataMedia: { $avg: '$durata' },
        chiamateConOrdine: {
          $sum: { $cond: [{ $ne: ['$ordineCollegato', null] }, 1, 0] }
        },
        ultimaChiamata: { $max: '$dataOraChiamata' }
      }
    }
  ]);
  
  return stats[0] || {
    totaleChiamate: 0,
    durataMedia: 0,
    chiamateConOrdine: 0,
    ultimaChiamata: null
  };
};

const ChiamataStorico = mongoose.model('ChiamataStorico', chiamataStoricoSchema);

export default ChiamataStorico;
