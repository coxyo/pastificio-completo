// models/AlertConfig.js - Configurazione soglie alert
import mongoose from 'mongoose';

const alertConfigSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'ordini_pochi',
      'ordini_eccezionali',
      'ordini_zero',
      'cliente_sparito',
      'cliente_nuovo_top',
      'prodotto_non_venduto',
      'prodotto_boom',
      'incasso_anomalo',
      'trend_negativo'
    ]
  },
  
  attivo: {
    type: Boolean,
    default: true
  },
  
  // Soglie configurabili per tipo
  soglia: {
    type: Number,
    required: true
  },
  
  sogliaMax: {
    type: Number,
    default: null  // Per soglie con range (es. incasso 50-150%)
  },
  
  // Unità della soglia per display
  unitaSoglia: {
    type: String,
    enum: ['percentuale', 'giorni', 'ordini', 'settimane'],
    default: 'percentuale'
  },
  
  descrizione: {
    type: String,
    trim: true
  },
  
  modificatoDa: {
    type: String,
    default: 'sistema'
  },
  
  modificatoIl: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ✅ Configurazione di default
alertConfigSchema.statics.inizializzaDefaults = async function() {
  const defaults = [
    {
      tipo: 'ordini_pochi',
      attivo: true,
      soglia: 50,
      unitaSoglia: 'percentuale',
      descrizione: 'Giornata con pochi ordini (sotto % della media)'
    },
    {
      tipo: 'ordini_eccezionali',
      attivo: true,
      soglia: 150,
      unitaSoglia: 'percentuale',
      descrizione: 'Giornata eccezionale (sopra % della media)'
    },
    {
      tipo: 'ordini_zero',
      attivo: true,
      soglia: 12, // Ora del controllo
      unitaSoglia: 'ordini',
      descrizione: 'Zero ordini a mezzogiorno'
    },
    {
      tipo: 'cliente_sparito',
      attivo: true,
      soglia: 45,
      unitaSoglia: 'giorni',
      descrizione: 'Cliente abituale non ordina da X giorni'
    },
    {
      tipo: 'cliente_nuovo_top',
      attivo: true,
      soglia: 3,
      unitaSoglia: 'ordini',
      descrizione: 'Nuovo cliente con X+ ordini nel primo mese'
    },
    {
      tipo: 'prodotto_non_venduto',
      attivo: true,
      soglia: 14,
      unitaSoglia: 'giorni',
      descrizione: 'Prodotto disponibile non venduto da X giorni'
    },
    {
      tipo: 'prodotto_boom',
      attivo: true,
      soglia: 200,
      unitaSoglia: 'percentuale',
      descrizione: 'Prodotto venduto X% in più rispetto alla media'
    },
    {
      tipo: 'incasso_anomalo',
      attivo: true,
      soglia: 50,
      sogliaMax: 150,
      unitaSoglia: 'percentuale',
      descrizione: 'Incasso giornaliero fuori range % della media'
    },
    {
      tipo: 'trend_negativo',
      attivo: true,
      soglia: 3,
      unitaSoglia: 'settimane',
      descrizione: 'X settimane consecutive in calo'
    }
  ];

  for (const config of defaults) {
    await this.findOneAndUpdate(
      { tipo: config.tipo },
      { $setOnInsert: config },
      { upsert: true, new: true }
    );
  }
  
  console.log('✅ AlertConfig defaults inizializzati');
};

// ✅ Metodo per ottenere config di un tipo
alertConfigSchema.statics.getConfig = async function(tipo) {
  return this.findOne({ tipo });
};

// ✅ Metodo per ottenere tutte le config attive
alertConfigSchema.statics.getConfigAttive = async function() {
  return this.find({ attivo: true });
};

const AlertConfig = mongoose.model('AlertConfig', alertConfigSchema);

export default AlertConfig;