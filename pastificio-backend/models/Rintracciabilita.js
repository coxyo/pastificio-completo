// models/Rintracciabilita.js
// Modello per la rintracciabilità ingredienti - HACCP compliant
// Traccia il percorso: Fornitore → Ingrediente (lotto) → Prodotto Finito → Cliente

import mongoose from 'mongoose';

// Schema singolo ingrediente usato nella produzione
const IngredienteUsatoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  ingredienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingrediente' },
  fornitore: {
    ragioneSociale: String,
    partitaIva: String
  },
  lotto: { type: String, required: true },
  dataScadenza: Date,
  quantitaUsata: { type: Number, required: true },
  unitaMisura: { type: String, default: 'kg' },
  // Riferimento al movimento di carico originale
  movimentoCaricoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movimento' },
  // Riferimento alla fattura di acquisto
  importFatturaId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportFattura' },
  // Dati DDT/fattura
  riferimentoDocumento: String,
  dataRicevimento: Date,
  // Controllo qualità alla ricezione
  controlloIngresso: {
    temperatura: Number,
    conforme: { type: Boolean, default: true },
    note: String,
    dataControllo: Date,
    operatore: String
  }
}, { _id: true });

// Schema prodotto finito
const ProdottoFinitoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  categoria: String,
  quantitaProdotta: { type: Number, required: true },
  unitaMisura: { type: String, default: 'kg' },
  lottoProduzione: { type: String, required: true },
  dataProduzione: { type: Date, required: true },
  dataScadenza: Date,
  // Ricetta usata (opzionale)
  ricettaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ricetta' }
}, { _id: true });

// Schema destinazione (a chi è stato venduto)
const DestinazioneSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['cliente_diretto', 'ordine', 'banco', 'altro'],
    default: 'ordine'
  },
  cliente: {
    nome: String,
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' }
  },
  ordineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ordine' },
  numeroOrdine: String,
  dataVendita: Date,
  quantitaVenduta: Number,
  unitaMisura: { type: String, default: 'kg' },
  note: String
}, { _id: true });

// Schema principale rintracciabilità
const RintracciabilitaSchema = new mongoose.Schema({
  // Identificativo lotto produzione
  lottoProduzione: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Data produzione
  dataProduzione: {
    type: Date,
    required: true,
    index: true
  },
  
  // Prodotto finito
  prodottoFinito: ProdottoFinitoSchema,
  
  // Ingredienti usati (con lotti e fornitori)
  ingredientiUsati: [IngredienteUsatoSchema],
  
  // Destinazioni (vendite)
  destinazioni: [DestinazioneSchema],
  
  // Stato
  stato: {
    type: String,
    enum: ['in_produzione', 'completato', 'venduto', 'ritirato', 'scaduto'],
    default: 'in_produzione',
    index: true
  },
  
  // Note produzione
  noteProoduzione: String,
  
  // Operatore responsabile
  operatore: {
    nome: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Condizioni produzione (per HACCP)
  condizioniProduzione: {
    temperaturaAmbiente: Number,
    umidita: Number,
    temperaturaCottura: Number,
    tempoCoattura: Number, // minuti
    temperaturaRaffreddamento: Number,
    note: String
  },
  
  // Flag per allerta / ritiro
  allerta: {
    attiva: { type: Boolean, default: false },
    tipo: { type: String, enum: ['richiamo', 'ritiro', 'segnalazione', null] },
    motivo: String,
    dataAllerta: Date,
    azioni: String
  },
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Indici
RintracciabilitaSchema.index({ dataProduzione: -1 });
RintracciabilitaSchema.index({ 'prodottoFinito.nome': 1, dataProduzione: -1 });
RintracciabilitaSchema.index({ 'ingredientiUsati.lotto': 1 });
RintracciabilitaSchema.index({ 'ingredientiUsati.fornitore.partitaIva': 1 });
RintracciabilitaSchema.index({ 'destinazioni.ordineId': 1 });
RintracciabilitaSchema.index({ 'allerta.attiva': 1 });

// Generazione automatica lotto produzione: LOT-YYYYMMDD-XXX
RintracciabilitaSchema.statics.generaLotto = async function(data) {
  const dataStr = (data || new Date()).toISOString().slice(0, 10).replace(/-/g, '');
  const count = await this.countDocuments({
    lottoProduzione: { $regex: `^LOT-${dataStr}` }
  });
  return `LOT-${dataStr}-${String(count + 1).padStart(3, '0')}`;
};

// Cerca tutti i prodotti che contengono un certo lotto ingrediente
RintracciabilitaSchema.statics.tracciaLottoIngrediente = async function(lottoIngrediente) {
  return this.find({
    'ingredientiUsati.lotto': lottoIngrediente
  }).sort({ dataProduzione: -1 });
};

// Cerca tutti i prodotti venduti a un cliente
RintracciabilitaSchema.statics.tracciaPerCliente = async function(clienteId) {
  return this.find({
    'destinazioni.cliente.clienteId': clienteId
  }).sort({ dataProduzione: -1 });
};

// Cerca tutti i prodotti da un fornitore
RintracciabilitaSchema.statics.tracciaPerFornitore = async function(partitaIva) {
  return this.find({
    'ingredientiUsati.fornitore.partitaIva': partitaIva
  }).sort({ dataProduzione: -1 });
};

export default mongoose.model('Rintracciabilita', RintracciabilitaSchema);