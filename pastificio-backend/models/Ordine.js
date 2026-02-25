// models/Ordine.js - ✅ FIX 13/12/2025: Preserva prezzi già calcolati
import mongoose from 'mongoose';
import calcoliPrezzi from '../utils/calcoliPrezzi.js';

// ========== CONFIGURAZIONE PREZZI BACKUP ==========
// ✅ NUOVO 13/12/2025: Prezzi di fallback per prodotti non in calcoliPrezzi.js
const PREZZI_BACKUP = {
  'Panada Anguille': { prezzoKg: 30.00 },
  'Panada di Agnello': { prezzoKg: 25.00 },
  'Panada di Agnello (con patate)': { prezzoKg: 25.00 },
  'Panada di Maiale': { prezzoKg: 21.00 },
  'Panada di Maiale (con patate)': { prezzoKg: 21.00 },
  'Panada di Vitella': { prezzoKg: 23.00 },
  'Panada di verdure': { prezzoKg: 17.00 },
  'Panadine': { prezzoKg: 28.00, prezzoPezzo: 0.80, pezziPerKg: 35 },
  'Pardulas': { prezzoKg: 20.00, prezzoPezzo: 0.76, pezziPerKg: 25 },
  'Ciambelle': { prezzoKg: 17.00, pezziPerKg: 30 },
  'Amaretti': { prezzoKg: 22.00, pezziPerKg: 35 },
  'Papassinas': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Papassini': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Pabassine': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Zeppole': { prezzoKg: 21.00, pezziPerKg: 24 },
  'Gueffus': { prezzoKg: 22.00, pezziPerKg: 65 },
  'Bianchini': { prezzoKg: 15.00, pezziPerKg: 100 },
  'Sebadas': { prezzoPezzo: 2.50 },
  'Dolci misti': { prezzoKg: 19.00 },
  'Torta di saba': { prezzoKg: 26.00 },
  'Ravioli': { prezzoKg: 11.00, pezziPerKg: 30 },
  'Culurgiones': { prezzoKg: 16.00, pezziPerKg: 32 },
  'Fregula': { prezzoKg: 10.00 },
  'Pasta per panada': { prezzoKg: 5.00 },
  'Pizzette sfoglia': { prezzoKg: 16.00, pezziPerKg: 30 }
};

// ✅ NUOVO: Funzione per calcolare prezzo con fallback
const calcolaPrezzoConFallback = (nome, quantita, unita, prezzoEsistente) => {
  // 1. Se c'è già un prezzo valido, usalo
  if (prezzoEsistente && prezzoEsistente > 0) {
    console.log(`✅ Uso prezzo esistente per ${nome}: €${prezzoEsistente}`);
    return prezzoEsistente;
  }
  
  // 2. Prova con calcoliPrezzi
  try {
    const risultato = calcoliPrezzi.calcolaPrezzoOrdine(nome, quantita, unita, prezzoEsistente);
    if (risultato && risultato.prezzoTotale > 0) {
      return risultato.prezzoTotale;
    }
  } catch (e) {
    // Ignora errore, useremo fallback
  }
  
  // 3. Usa PREZZI_BACKUP
  const config = trovaProdottoBackup(nome);
  if (config) {
    const unitaLower = (unita || 'kg').toLowerCase();
    let prezzo = 0;
    
    if (unitaLower === 'kg' && config.prezzoKg) {
      prezzo = quantita * config.prezzoKg;
    } else if ((unitaLower === 'pezzi' || unitaLower === 'pz') && config.prezzoPezzo) {
      prezzo = quantita * config.prezzoPezzo;
    } else if ((unitaLower === 'pezzi' || unitaLower === 'pz') && config.prezzoKg && config.pezziPerKg) {
      prezzo = (quantita / config.pezziPerKg) * config.prezzoKg;
    } else if (unitaLower === '€') {
      prezzo = quantita;
    } else if (config.prezzoKg) {
      prezzo = quantita * config.prezzoKg;
    }
    
    if (prezzo > 0) {
      console.log(`✅ Prezzo calcolato da BACKUP per ${nome}: €${prezzo.toFixed(2)}`);
      return Math.round(prezzo * 100) / 100;
    }
  }
  
  console.warn(`⚠️ Prodotto non trovato: ${nome}`);
  return 0;
};

// ✅ Trova prodotto nel backup con ricerca fuzzy
const trovaProdottoBackup = (nome) => {
  if (!nome) return null;
  
  // Match esatto
  if (PREZZI_BACKUP[nome]) return PREZZI_BACKUP[nome];
  
  // Case-insensitive
  const nomeLower = nome.toLowerCase().trim();
  for (const [key, config] of Object.entries(PREZZI_BACKUP)) {
    if (key.toLowerCase() === nomeLower) return config;
  }
  
  // Nome base (senza parentesi)
  const nomeBase = nome.split(' (')[0].trim();
  if (PREZZI_BACKUP[nomeBase]) return PREZZI_BACKUP[nomeBase];
  
  // Keywords
  const keywords = {
    'anguille': 'Panada Anguille',
    'agnello': 'Panada di Agnello',
    'maiale': 'Panada di Maiale',
    'vitella': 'Panada di Vitella',
    'verdure': 'Panada di verdure',
    'panadine': 'Panadine',
    'pardulas': 'Pardulas',
    'ciambelle': 'Ciambelle',
    'ravioli': 'Ravioli',
    'culurgiones': 'Culurgiones',
    'sebadas': 'Sebadas',
    'amaretti': 'Amaretti',
    'bianchini': 'Bianchini',
    'gueffus': 'Gueffus',
    'papassinas': 'Papassinas',
    'papassini': 'Papassinas',
    'pabassine': 'Pabassine',
    'dolci misti': 'Dolci misti',
    'fregula': 'Fregula',
    'torta': 'Torta di saba',
    'zeppole': 'Zeppole'
  };
  
  for (const [keyword, prodottoKey] of Object.entries(keywords)) {
    if (nomeLower.includes(keyword) && PREZZI_BACKUP[prodottoKey]) {
      return PREZZI_BACKUP[prodottoKey];
    }
  }
  
  return null;
};

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
    'pezzi', 'Pezzi', 'PEZZI', 'pz', 'Pz',
      'unità', 'Unità', 
      '€', 'EUR', 
      'g', 'G', 
      'l', 'L',
      'vassoio'
    ],
    default: 'kg'
  },
  unitaMisura: {
    type: String,
    enum: [
      'kg', 'Kg', 'KG', 
    'pezzi', 'Pezzi', 'PEZZI', 'pz', 'Pz',
      'unità', 'Unità', 
      '€', 'EUR', 
      'g', 'G', 
      'l', 'L',
      'vassoio'
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
  
  varianti: [{
    type: String,
    trim: true,
    comment: 'Varianti selezionate: es. ["con_aglio", "ben_cotte"]'
  }],
  
  variante: {
    type: String,
    trim: true,
    comment: 'Es: ricotta, carne, verdure (campo legacy)'
  },
  
  dettagliCalcolo: {
    type: mongoose.Schema.Types.Mixed,
    comment: 'Composizione dettagliata vassoi + dati calcolo'
  },
  
  note: {
    type: String,
    trim: true,
    comment: 'Note specifiche per questo prodotto'
  },
  
  noteCottura: {
    type: String,
    trim: true,
    comment: 'Es: "ben cotte", "poco dorate", etc.'
  },
  
  statoProduzione: {
    type: String,
    enum: ['nuovo', 'in_lavorazione', 'completato', 'consegnato'],
    default: 'nuovo',
    comment: 'Stato di lavorazione del singolo prodotto'
  }
}, { _id: false });

// ========== SCHEMA ORDINE PRINCIPALE ==========
const ordineSchema = new mongoose.Schema({
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
  
  esclusioni: [{
    type: String,
    trim: true,
    comment: 'Prodotti da escludere: es. ["ciambelle", "bianchini"]'
  }],
  
  packaging: {
    type: String,
    enum: ['vassoio_carta', 'scatola', 'busta_carta', 'altro'],
    default: 'vassoio_carta',
    comment: 'Tipo di packaging per ordine'
  },
  
  numeroVassoioDimensione: {
    type: Number,
    enum: [2, 4, 6, 8, 10],
    comment: 'Dimensione vassoio: 2=piccolo, 4=medio, 6=grande, 8=XL, 10=XXL'
  },
  
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
  
  modalitaComposizione: {
    type: String,
    enum: ['libera', 'totale_prima', 'mix_completo'],
    comment: 'Modalità usata per comporre il vassoio'
  },
  
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

  acconto: {
    type: Boolean,
    default: false
  },

  importoAcconto: {
    type: Number,
    default: 0
  },
  
  dataPagamento: {
    type: Date
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
  },
  
  // ✅ NUOVO 30/01/2026: Promemoria automatici WhatsApp
  promemoria_inviato: {
    type: Boolean,
    default: false,
    index: true,
    comment: 'Indica se è stato inviato il promemoria WhatsApp automatico'
  },
  
  promemoria_inviato_at: {
    type: Date,
    default: null,
    comment: 'Timestamp invio promemoria automatico'
  },
  
  // ========== ✅ RINTRACCIABILITÀ HACCP ==========
  ingredientiScaricati: {
    type: Boolean,
    default: false,
    index: true,
    comment: 'Indica se gli ingredienti sono stati scaricati dal magazzino'
  },
  
  dataScarico: {
    type: Date,
    default: null,
    comment: 'Timestamp dello scarico ingredienti'
  },
  
  movimentiCollegati: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movimento',
    comment: 'Movimenti di scarico magazzino collegati'
  }],
  // ========== FINE RINTRACCIABILITÀ ==========
  
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
ordineSchema.index({ 'opzioniExtra.etichettaIngredienti': 1 });

// ✅ NUOVO 30/01/2026: Indice composto per query scheduler promemoria
// Velocizza: find({ dataRitiro: domani, stato: {$ne: 'annullato'}, promemoria_inviato: {$ne: true} })
ordineSchema.index({ 
  dataRitiro: 1, 
  promemoria_inviato: 1, 
  stato: 1 
});

// ========== HOOK PRE-SAVE ✅ FIX 13/12/2025 ==========
ordineSchema.pre('save', async function(next) {
  // Genera numero ordine automatico
  if (!this.numeroOrdine && this.isNew) {
    const count = await this.constructor.countDocuments();
    this.numeroOrdine = `ORD${String(count + 1).padStart(6, '0')}`;
  }
  
  // ✅ FIX 13/12/2025: Calcola totale preservando prezzi esistenti
  let totale = 0;
  
  for (const prodotto of this.prodotti) {
    // IMPORTANTE: Per vassoi personalizzati, usa prezzo già calcolato
    if (prodotto.nome === 'Vassoio Dolci Misti' || 
        prodotto.nome.includes('Vassoio') ||
        prodotto.unita === 'vassoio') {
      
      console.log(`✅ Vassoio rilevato: ${prodotto.nome}, prezzo: €${prodotto.prezzo}`);
      totale += prodotto.prezzo || 0;
      continue;
    }
    
    // ✅ FIX: Usa funzione con fallback che preserva prezzi esistenti
    const prezzoCalcolato = calcolaPrezzoConFallback(
      prodotto.nome,
      prodotto.quantita,
      prodotto.unita,
      prodotto.prezzo  // ✅ Passa prezzo esistente come fallback!
    );
    
    prodotto.prezzo = prezzoCalcolato;
    totale += prezzoCalcolato;
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

ordineSchema.methods.hasVassoi = function() {
  return this.prodotti.some(p => 
    p.nome.includes('Vassoio') || p.unita === 'vassoio'
  );
};

ordineSchema.methods.needsEtichettaIngredienti = function() {
  return this.opzioniExtra?.etichettaIngredienti === true;
};

ordineSchema.methods.getNoteComplete = function() {
  const noteArray = [];
  
  if (this.note) noteArray.push(this.note);
  if (this.notePreparazione) noteArray.push(`Preparazione: ${this.notePreparazione}`);
  
  if (this.esclusioni && this.esclusioni.length > 0) {
    noteArray.push(`Escludi: ${this.esclusioni.join(', ')}`);
  }
  
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
  
  if (this.opzioniExtra) {
    if (this.opzioniExtra.daViaggio) noteArray.push('✈️ Da Viaggio (sottovuoto)');
    if (this.opzioniExtra.etichettaIngredienti) noteArray.push('⚠️ ATTACCARE ETICHETTA INGREDIENTI');
    if (this.opzioniExtra.confezionGift) noteArray.push('🎁 Confezione Regalo');
  }

  if (this.pagato) noteArray.push('💰 PAGATO');
  if (this.acconto && this.importoAcconto > 0) noteArray.push(`💳 ACCONTO €${this.importoAcconto.toFixed(2)}`);
  
  return noteArray.join(' | ');
};

ordineSchema.methods.formatWhatsAppMessage = function() {
  let message = `
🎂 *Pastificio Nonna Claudia*

📋 Ordine #${this.numeroOrdine}
👤 ${this.nomeCliente}
📅 Ritiro: ${new Date(this.dataRitiro).toLocaleDateString('it-IT')} ore ${this.oraRitiro}
`;

  message += '\n📦 *PRODOTTI:*\n';
  this.prodotti.forEach(p => {
    message += `  • ${p.nome}: ${p.quantita} ${p.unita} - €${p.prezzo.toFixed(2)}\n`;
    
    if (p.dettagliCalcolo?.composizione) {
      message += '    *Composizione:*\n';
      p.dettagliCalcolo.composizione.forEach(c => {
        message += `      - ${c.nome}: ${c.quantita} ${c.unita}\n`;
      });
    }
  });

  message += `\n💰 *TOTALE: €${this.totale.toFixed(2)}*`;

  const noteComplete = this.getNoteComplete();
  if (noteComplete) {
    message += `\n\n📝 *NOTE:*\n${noteComplete}`;
  }

  message += '\n\nGrazie per la tua fiducia! 🙏';

  return message.trim();
};

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

ordineSchema.methods.hasSpecialRequirements = function() {
  return {
    daViaggio: this.daViaggio || this.opzioniExtra?.daViaggio,
    etichettaIngredienti: this.opzioniExtra?.etichettaIngredienti,
    confezionGift: this.opzioniExtra?.confezionGift,
    hasVassoi: this.hasVassoi(),
    hasEsclusioni: this.esclusioni && this.esclusioni.length > 0
  };
};

ordineSchema.methods.aggiornaStatoProdotto = function(indiceProdotto, nuovoStato) {
  if (!this.prodotti[indiceProdotto]) {
    throw new Error(`Prodotto con indice ${indiceProdotto} non trovato`);
  }
  
  const statiValidi = ['nuovo', 'in_lavorazione', 'completato', 'consegnato'];
  if (!statiValidi.includes(nuovoStato)) {
    throw new Error(`Stato non valido: ${nuovoStato}. Stati validi: ${statiValidi.join(', ')}`);
  }
  
  this.prodotti[indiceProdotto].statoProduzione = nuovoStato;
  
  const tuttiCompletati = this.prodotti.every(p => p.statoProduzione === 'completato');
  const tuttiConsegnati = this.prodotti.every(p => p.statoProduzione === 'consegnato');
  const almenoUnoInLavorazione = this.prodotti.some(p => p.statoProduzione === 'in_lavorazione');
  
  if (tuttiConsegnati) {
    this.stato = 'completato';
  } else if (tuttiCompletati) {
    this.stato = 'pronto';
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