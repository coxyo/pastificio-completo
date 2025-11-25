// models/Ordine_AGGIORNATO.js - ✅ SCHEMA COMPLETO CON NUOVI CAMPI VASSOIO
import mongoose from 'mongoose';
import calcoliPrezzi from '../utils/calcoliPrezzi.js';

// ========== SCHEMA PRODOTTO EVOLUTO ==========
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
    enum: [
      'kg', 'Kg', 'KG', 
    'pezzi', 'Pezzi', 'PEZZI', 'pz', 'Pz',  // ✅ AGGIUNTO pz
      'unità', 'Unità', 
      '€', 'EUR', 
      'g', 'G', 
      'l', 'L',
      'vassoio' // ✅ AGGIUNTO
    ],
    default: 'kg'
  },
  unitaMisura: {
    type: String,
    enum: [
      'kg', 'Kg', 'KG', 
    'pezzi', 'Pezzi', 'PEZZI', 'pz', 'Pz',  // ✅ AGGIUNTO pz
      'unità', 'Unità', 
      '€', 'EUR', 
      'g', 'G', 
      'l', 'L',
      'vassoio' // ✅ AGGIUNTO
    ],
    default: 'kg'
  },
  prezzo: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Prezzo totale calcolato (quantità × prezzo unitario)'
  },
  prezzoUnitario: {
    type: Number,
    min: 0,
    comment: 'Prezzo per kg/pezzo'
  },
  categoria: {
    type: String,
    trim: true,
    default: 'altro'
  },
  
  // ✅ Varianti prodotto (array)
  varianti: [{
    type: String,
    trim: true,
    comment: 'Varianti selezionate: es. ["con_aglio", "ben_cotte"]'
  }],
  
  // ✅ Variante singola (legacy)
  variante: {
    type: String,
    trim: true,
    comment: 'Es: ricotta, carne, verdure (campo legacy)'
  },
  
  // ✅ Dettagli calcolo (per vassoi)
  dettagliCalcolo: {
    type: mongoose.Schema.Types.Mixed,
    comment: 'Composizione dettagliata vassoi + dati calcolo'
  },
  
  // ✅ Note specifiche prodotto
  note: {
    type: String,
    trim: true,
    comment: 'Note specifiche per questo prodotto'
  },
  
  // ✅ Note cottura
  noteCottura: {
    type: String,
    trim: true,
    comment: 'Es: "ben cotte", "poco dorate", etc.'
  }
,
  
  // ✅ NUOVO 21/11/2025: Stato produzione per singolo prodotto
  statoProduzione: {
    type: String,
    enum: ['nuovo', 'in_lavorazione', 'completato', 'consegnato'],
    default: 'nuovo',
    comment: 'Stato di lavorazione del singolo prodotto'
  }}, { _id: false });

// ========== SCHEMA ORDINE PRINCIPALE ==========
const ordineSchema = new mongoose.Schema({
  // ==========================================
  // DATI CLIENTE
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
  
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: false,
    default: null,
    index: true
  },
  
  // ==========================================
  // DATI ORDINE
  // ==========================================
  numeroOrdine: {
    type: String,
    unique: true,
    sparse: true,
    index: true
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
    min: 0
  },
  
  totaleCalcolato: {
    type: Number,
    default: 0,
    min: 0
  },
  
  sconto: {
    type: Number,
    default: 0,
    min: 0
  },
  
  scontoPercentuale: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // ==========================================
  // STATO E GESTIONE
  // ==========================================
  stato: {
    type: String,
    enum: [
      'nuovo', 
      'in_lavorazione', 
      'inLavorazione',
      'pronto', 
      'completato', 
      'annullato',
      'in attesa'
    ],
    default: 'nuovo',
    index: true
  },
  
  note: {
    type: String,
    trim: true
  },
  
  // ✅ NUOVO: Note preparazione (specifiche dall'utente)
  notePreparazione: {
    type: String,
    trim: true,
    comment: 'Istruzioni specifiche per preparazione ordine'
  },
  
  daViaggio: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // ==========================================
  // ✅ NUOVI CAMPI PER VASSOI PERSONALIZZATI
  // ==========================================
  
  // ✅ Esclusioni prodotti (per dolci misti)
  esclusioni: [{
    type: String,
    trim: true,
    comment: 'Prodotti da escludere: es. ["ciambelle", "bianchini"]'
  }],
  
  // ✅ Packaging ordine/vassoio
  packaging: {
    type: String,
    enum: ['vassoio_carta', 'scatola', 'busta_carta', 'altro'],
    default: 'vassoio_carta',
    comment: 'Tipo di packaging per ordine'
  },
  
  // ✅ Dimensione vassoio
  numeroVassoioDimensione: {
    type: Number,
    enum: [2, 4, 6, 8, 10],
    comment: 'Dimensione vassoio: 2=piccolo, 4=medio, 6=grande, 8=XL, 10=XXL'
  },
  
  // ✅ Opzioni extra
  opzioniExtra: {
    daViaggio: {
      type: Boolean,
      default: false,
      comment: 'Sottovuoto per viaggio'
    },
    etichettaIngredienti: {
      type: Boolean,
      default: false,
      comment: 'Reminder per attaccare etichetta ingredienti'
    },
    confezionGift: {
      type: Boolean,
      default: false,
      comment: 'Confezione regalo'
    }
  },
  
  // ✅ Modalità composizione vassoio
  modalitaComposizione: {
    type: String,
    enum: ['libera', 'totale_prima', 'mix_completo'],
    comment: 'Modalità usata per comporre il vassoio'
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
  // NOTIFICHE
  // ==========================================
  whatsappInviato: {
    type: Boolean,
    default: false
  },
  
  dataInvioWhatsapp: {
    type: Date
  },
  
  whatsappErrore: {
    type: String
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
  collection: 'ordini'
});

// ========== INDICI ==========
ordineSchema.index({ nomeCliente: 1, dataRitiro: -1 });
ordineSchema.index({ cliente: 1, dataRitiro: -1 });
ordineSchema.index({ stato: 1, dataRitiro: 1 });
ordineSchema.index({ numeroOrdine: 1 });
ordineSchema.index({ daViaggio: 1 });
ordineSchema.index({ createdAt: -1 });
ordineSchema.index({ 'opzioniExtra.etichettaIngredienti': 1 }); // ✅ NUOVO

// ========== HOOK PRE-SAVE ==========
ordineSchema.pre('save', async function(next) {
  // Genera numero ordine automatico
  if (!this.numeroOrdine && this.isNew) {
    const count = await this.constructor.countDocuments();
    this.numeroOrdine = `ORD${String(count + 1).padStart(6, '0')}`;
  }
  
  // ✅ Calcola totale ordine (saltando vassoi)
  let totale = 0;
  
  for (const prodotto of this.prodotti) {
    // IMPORTANTE: Per vassoi personalizzati, usa prezzo già calcolato
    if (prodotto.nome === 'Vassoio Dolci Misti' || 
        prodotto.nome.includes('Vassoio') ||
        prodotto.unita === 'vassoio') {
      
      console.log(`✅ Vassoio rilevato: ${prodotto.nome}, prezzo: €${prodotto.prezzo}`);
      totale += prodotto.prezzo;
      continue;
    }
    
    // Per altri prodotti, calcola prezzo
    try {
      const nomeConVarianti = prodotto.varianti && prodotto.varianti.length > 0
        ? `${prodotto.nome} ${prodotto.varianti.join(' ')}`
        : prodotto.nome;
      
      const risultato = calcoliPrezzi.calcolaPrezzoOrdine(
        nomeConVarianti,
        prodotto.quantita,
        prodotto.unita
      );
      
      prodotto.prezzo = risultato.prezzoTotale;
      totale += risultato.prezzoTotale;
      
    } catch (error) {
      console.error(`❌ Errore calcolo prezzo per ${prodotto.nome}:`, error.message);
      totale += prodotto.prezzo || 0;
    }
  }
  
  // Applica sconto se presente
  if (this.scontoPercentuale > 0) {
    totale = totale * (1 - this.scontoPercentuale / 100);
  } else if (this.sconto > 0) {
    totale -= this.sconto;
  }
  
  this.totaleCalcolato = parseFloat(totale.toFixed(2));
  
  // Se totale non è impostato, usa quello calcolato
  if (!this.totale || this.totale === 0) {
    this.totale = this.totaleCalcolato;
  }
  
  next();
});

// ========== METODI ==========

/**
 * ✅ Ottiene composizione dettagliata vassoi
 */
ordineSchema.methods.getComposizioneVassoi = function() {
  return this.prodotti
    .filter(p => p.dettagliCalcolo && p.dettagliCalcolo.composizione)
    .map(p => ({
      nome: p.nome,
      composizione: p.dettagliCalcolo.composizione,
      totale: p.prezzo,
      packaging: p.dettagliCalcolo.packaging,
      dimensione: p.dettagliCalcolo.numeroVassoioDimensione,
      pesoTotale: p.dettagliCalcolo.pesoTotale
    }));
};

/**
 * ✅ Verifica se ordine contiene vassoi
 */
ordineSchema.methods.hasVassoi = function() {
  return this.prodotti.some(p => 
    p.nome.includes('Vassoio') || p.unita === 'vassoio'
  );
};

/**
 * ✅ Verifica se ordine richiede etichetta ingredienti
 */
ordineSchema.methods.needsEtichettaIngredienti = function() {
  return this.opzioniExtra?.etichettaIngredienti === true;
};

/**
 * ✅ Ottiene note complete ordine
 */
ordineSchema.methods.getNoteComplete = function() {
  const noteArray = [];
  
  if (this.note) noteArray.push(this.note);
  if (this.notePreparazione) noteArray.push(`Preparazione: ${this.notePreparazione}`);
  
  // Note esclusioni
  if (this.esclusioni && this.esclusioni.length > 0) {
    noteArray.push(`Escludi: ${this.esclusioni.join(', ')}`);
  }
  
  // Note packaging
  if (this.packaging && this.packaging !== 'vassoio_carta') {
    const packagingLabel = {
      'scatola': 'Scatola rigida',
      'busta_carta': 'Busta carta'
    }[this.packaging] || this.packaging;
    noteArray.push(`Packaging: ${packagingLabel}`);
  }
  
  if (this.numeroVassoioDimensione) {
    const dimensioneInfo = {
      2: 'Nr 2 (piccolo ~200g)',
      4: 'Nr 4 (medio ~400-500g)',
      6: 'Nr 6 (grande ~700g-1kg)',
      8: 'Nr 8 (XL ~1-2kg)'
    }[this.numeroVassoioDimensione];
    
    if (dimensioneInfo) {
      noteArray.push(`Dimensione: ${dimensioneInfo}`);
    }
  }
  
  // Note opzioni extra
  if (this.opzioniExtra) {
    if (this.opzioniExtra.daViaggio) noteArray.push('✈️ Da Viaggio (sottovuoto)');
    if (this.opzioniExtra.etichettaIngredienti) noteArray.push('⚠️ ATTACCARE ETICHETTA INGREDIENTI');
    if (this.opzioniExtra.confezionGift) noteArray.push('🎁 Confezione Regalo');
  }
  
  return noteArray.join(' | ');
};

/**
 * ✅ Formatta ordine per WhatsApp
 */
ordineSchema.methods.formatWhatsAppMessage = function() {
  let message = `
🎂 *Pastificio Nonna Claudia*

📋 Ordine #${this.numeroOrdine}
👤 ${this.nomeCliente}
📅 Ritiro: ${new Date(this.dataRitiro).toLocaleDateString('it-IT')} ore ${this.oraRitiro}
`;

  // Dettaglio prodotti
  message += '\n📦 *PRODOTTI:*\n';
  this.prodotti.forEach(p => {
    message += `  • ${p.nome}: ${p.quantita} ${p.unita} - €${p.prezzo.toFixed(2)}\n`;
    
    // Se è un vassoio, mostra composizione
    if (p.dettagliCalcolo?.composizione) {
      message += '    *Composizione:*\n';
      p.dettagliCalcolo.composizione.forEach(c => {
        message += `      - ${c.nome}: ${c.quantita} ${c.unita}\n`;
      });
    }
  });

  // Totale
  message += `\n💰 *TOTALE: €${this.totale.toFixed(2)}*`;

  // Note complete
  const noteComplete = this.getNoteComplete();
  if (noteComplete) {
    message += `\n\n📝 *NOTE:*\n${noteComplete}`;
  }

  message += '\n\nGrazie per la tua fiducia! 🙏';

  return message.trim();
};

/**
 * ✅ Formatta ordine per stampa
 */
ordineSchema.methods.formatPrintDetails = function() {
  const details = {
    ordine: this.numeroOrdine,
    cliente: this.nomeCliente,
    data: new Date(this.dataRitiro).toLocaleDateString('it-IT'),
    ora: this.oraRitiro,
    prodotti: [],
    totale: this.totale,
    note: this.getNoteComplete(),
    vassoi: []
  };

  this.prodotti.forEach(p => {
    const prodottoInfo = {
      nome: p.nome,
      quantita: p.quantita,
      unita: p.unita,
      prezzo: p.prezzo
    };

    if (p.dettagliCalcolo?.composizione) {
      prodottoInfo.composizione = p.dettagliCalcolo.composizione;
      prodottoInfo.pesoTotale = p.dettagliCalcolo.pesoTotale;
      prodottoInfo.packaging = p.dettagliCalcolo.packaging;
      prodottoInfo.dimensione = p.dettagliCalcolo.numeroVassoioDimensione;
      details.vassoi.push(prodottoInfo);
    }

    details.prodotti.push(prodottoInfo);
  });

  return details;
};

/**
 * ✅ Verifica se ordine richiede attenzioni speciali
 */
ordineSchema.methods.hasSpecialRequirements = function() {
  return {
    daViaggio: this.daViaggio || this.opzioniExtra?.daViaggio,
    etichettaIngredienti: this.opzioniExtra?.etichettaIngredienti,
    confezionGift: this.opzioniExtra?.confezionGift,
    hasVassoi: this.hasVassoi(),
    hasEsclusioni: this.esclusioni && this.esclusioni.length > 0
  };
}; // ✅ FIX 25/11/2025: Chiusura corretta metodo

/**
 * ✅ NUOVO 21/11/2025: Aggiorna stato singolo prodotto
 * @param {number} indiceProdotto - Indice del prodotto nell'array
 * @param {string} nuovoStato - nuovo | in_lavorazione | completato | consegnato
 */
ordineSchema.methods.aggiornaStatoProdotto = function(indiceProdotto, nuovoStato) {
  if (!this.prodotti[indiceProdotto]) {
    throw new Error(`Prodotto con indice ${indiceProdotto} non trovato`);
  }
  
  const statiValidi = ['nuovo', 'in_lavorazione', 'completato', 'consegnato'];
  if (!statiValidi.includes(nuovoStato)) {
    throw new Error(`Stato non valido: ${nuovoStato}. Stati validi: ${statiValidi.join(', ')}`);
  }
  
  this.prodotti[indiceProdotto].statoProduzione = nuovoStato;
  
  // Aggiorna stato generale ordine in base ai prodotti
  const tuttiCompletati = this.prodotti.every(p => p.statoProduzione === 'completato');
  const tuttiConsegnati = this.prodotti.every(p => p.statoProduzione === 'consegnato');
  const almenoUnoInLavorazione = this.prodotti.some(p => p.statoProduzione === 'in_lavorazione');
  
  if (tuttiConsegnati) {
    this.stato = 'completato'; // Tutto consegnato = ordine completato
  } else if (tuttiCompletati) {
    this.stato = 'pronto'; // Tutto fatto = ordine pronto per ritiro
  } else if (almenoUnoInLavorazione) {
    this.stato = 'in_lavorazione';
  } else {
    this.stato = 'nuovo';
  }
  
  console.log(`✅ Prodotto ${indiceProdotto} (${this.prodotti[indiceProdotto].nome}) → ${nuovoStato}`);
  console.log(`📦 Stato ordine aggiornato: ${this.stato}`);
};

const Ordine = mongoose.model('Ordine', ordineSchema);
export default Ordine;
