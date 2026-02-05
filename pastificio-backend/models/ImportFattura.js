// models/ImportFattura.js
// Modello per tracciare le fatture già importate nel sistema

import mongoose from 'mongoose';

const RigaFatturaSchema = new mongoose.Schema({
  numeroLinea: Number,
  descrizione: String,
  codiceArticolo: String,
  quantita: Number,
  unitaMisura: String,
  prezzoUnitario: Number,
  prezzoTotale: Number,
  aliquotaIva: Number,
  
  // Risultato dell'import
  importato: {
    type: Boolean,
    default: false
  },
  ingredienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingrediente'
  },
  ingredienteNome: String,
  movimentoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movimento'
  },
  errore: String
}, { _id: false });

const ImportFatturaSchema = new mongoose.Schema({
  // Identificativo univoco fattura
  identificativo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Dati documento
  tipoDocumento: {
    type: String,
    default: 'TD24' // Fattura differita
  },
  numero: {
    type: String,
    required: true
  },
  data: {
    type: Date,
    required: true
  },
  anno: {
    type: Number,
    required: true
  },
  
  // Dati fornitore (cedente/prestatore)
  fornitore: {
    partitaIva: {
      type: String,
      required: true
    },
    codiceFiscale: String,
    ragioneSociale: String,
    nome: String,
    cognome: String,
    indirizzo: {
      via: String,
      cap: String,
      comune: String,
      provincia: String
    }
  },
  
  // Totali
  importoTotale: {
    type: Number,
    default: 0
  },
  imponibile: {
    type: Number,
    default: 0
  },
  imposta: {
    type: Number,
    default: 0
  },
  
  // Righe prodotti
  righe: [RigaFatturaSchema],
  
  // DDT collegati
  ddt: [{
    numero: String,
    data: Date
  }],
  
  // Stato importazione
  stato: {
    type: String,
    enum: ['pendente', 'parziale', 'completato', 'errore', 'annullato'],
    default: 'pendente'
  },
  
  // Statistiche import
  statistiche: {
    totaleRighe: { type: Number, default: 0 },
    righeImportate: { type: Number, default: 0 },
    righeIgnorate: { type: Number, default: 0 },
    righeErrore: { type: Number, default: 0 }
  },
  
  // File XML originale (opzionale, per riferimento)
  fileOriginale: {
    nome: String,
    dimensione: Number,
    hash: String // Per evitare reimport dello stesso file
  },
  
  // Data importazione
  dataImportazione: {
    type: Date,
    default: Date.now
  },
  
  // Annullamento
  annullamento: {
    annullato: { type: Boolean, default: false },
    dataAnnullamento: Date,
    motivo: String,
    annullatoDa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Note
  note: String,
  
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indici per ricerche comuni
ImportFatturaSchema.index({ 'fornitore.partitaIva': 1, data: -1 });
ImportFatturaSchema.index({ numero: 1, anno: 1 });
ImportFatturaSchema.index({ stato: 1 });
ImportFatturaSchema.index({ dataImportazione: -1 });
ImportFatturaSchema.index({ 'fileOriginale.hash': 1 });

// Virtual per nome completo fornitore
ImportFatturaSchema.virtual('nomeFornitore').get(function() {
  if (this.fornitore.ragioneSociale) {
    return this.fornitore.ragioneSociale;
  }
  if (this.fornitore.nome && this.fornitore.cognome) {
    return `${this.fornitore.nome} ${this.fornitore.cognome}`;
  }
  return this.fornitore.partitaIva;
});

// Metodo statico per generare identificativo univoco
ImportFatturaSchema.statics.generaIdentificativo = function(partitaIva, numero, anno) {
  return `${partitaIva}_${numero}_${anno}`.replace(/[^a-zA-Z0-9_]/g, '');
};

// Metodo statico per verificare se fattura già importata
ImportFatturaSchema.statics.esisteGia = async function(partitaIva, numero, anno) {
  const id = this.generaIdentificativo(partitaIva, numero, anno);
  const esistente = await this.findOne({ identificativo: id });
  return esistente;
};

// Metodo statico per verificare se file già processato (tramite hash)
ImportFatturaSchema.statics.fileGiaProcessato = async function(hash) {
  const esistente = await this.findOne({ 'fileOriginale.hash': hash });
  return esistente;
};

// Metodo per annullare importazione
ImportFatturaSchema.methods.annulla = async function(userId, motivo) {
  const Movimento = mongoose.model('Movimento');
  
  // Elimina i movimenti collegati
  const movimentiIds = this.righe
    .filter(r => r.movimentoId)
    .map(r => r.movimentoId);
  
  if (movimentiIds.length > 0) {
    await Movimento.deleteMany({ _id: { $in: movimentiIds } });
  }
  
  // Aggiorna stato
  this.stato = 'annullato';
  this.annullamento = {
    annullato: true,
    dataAnnullamento: new Date(),
    motivo: motivo,
    annullatoDa: userId
  };
  
  // Resetta statistiche
  this.statistiche.righeImportate = 0;
  
  await this.save();
  
  return movimentiIds.length;
};

// Metodo per aggiornare statistiche
ImportFatturaSchema.methods.aggiornaStatistiche = function() {
  this.statistiche.totaleRighe = this.righe.length;
  this.statistiche.righeImportate = this.righe.filter(r => r.importato).length;
  this.statistiche.righeErrore = this.righe.filter(r => r.errore).length;
  this.statistiche.righeIgnorate = this.statistiche.totaleRighe - 
    this.statistiche.righeImportate - this.statistiche.righeErrore;
  
  // Aggiorna stato
  if (this.statistiche.righeImportate === this.statistiche.totaleRighe) {
    this.stato = 'completato';
  } else if (this.statistiche.righeImportate > 0) {
    this.stato = 'parziale';
  } else if (this.statistiche.righeErrore === this.statistiche.totaleRighe) {
    this.stato = 'errore';
  }
};

const ImportFattura = mongoose.model('ImportFattura', ImportFatturaSchema);

export default ImportFattura;
