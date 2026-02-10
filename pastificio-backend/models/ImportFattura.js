// models/ImportFattura.js
// Modello per tracciare le fatture importate da Danea e prevenire duplicati

import mongoose from 'mongoose';

const RigaImportSchema = new mongoose.Schema({
  // Dati originali dalla fattura XML
  numeroLinea: Number,
  descrizione: String,
  quantita: Number,
  unitaMisura: String,
  prezzoUnitario: Number,
  prezzoTotale: Number,
  aliquotaIva: Number,
  codiceArticolo: String,
  
  // NUOVI CAMPI RINTRACCIABILITÀ
  lottoFornitore: String,
  dataScadenza: Date,
  
  // Risultato matching
  stato: {
    type: String,
    enum: ['importato', 'ignorato', 'errore', 'manuale', 'non_abbinato'],
    default: 'non_abbinato'
  },
  
  // Riferimento al prodotto abbinato
  ingredienteAbbinato: {
    ingredienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingrediente'
    },
    nome: String,
    categoria: String,
    metodoMatch: {
      type: String,
      enum: ['mapping_esistente', 'match_automatico', 'manuale', 'nessuno'],
      default: 'nessuno'
    },
    scoreSimilarita: Number
  },
  
  // ID del movimento di magazzino creato
  movimentoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movimento'
  },
  
  // Quantità effettivamente importata (dopo conversione)
  quantitaImportata: Number,
  unitaImportata: String,
  
  // Note
  note: String,
  errore: String
}, { _id: true });

const ImportFatturaSchema = new mongoose.Schema({
  // Identificativo univoco fattura (partitaIva_numero_anno)
  identificativo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Hash MD5 del file XML per prevenire duplicati
  hashFile: {
    type: String,
    required: true,
    index: true
  },
  
  // Dati fornitore dalla fattura
  fornitore: {
    partitaIva: {
      type: String,
      required: true,
      index: true
    },
    codiceFiscale: String,
    ragioneSociale: {
      type: String,
      required: true
    },
    indirizzo: String,
    cap: String,
    comune: String,
    provincia: String
  },
  
  // Dati fattura
  fattura: {
    tipo: {
      type: String,
      default: 'FatturaPA'
    },
    numero: {
      type: String,
      required: true
    },
    data: {
      type: Date,
      required: true
    },
    tipoDocumento: {
      type: String,
      default: 'TD01'
    },
    divisa: {
      type: String,
      default: 'EUR'
    }
  },
  
  // DDT collegati
  ddt: [{
    numero: String,
    data: Date,
    riferimento: String
  }],
  
  // Righe della fattura con stato import
  righe: [RigaImportSchema],
  
  // Totali dalla fattura
  totali: {
    imponibile: Number,
    iva: Number,
    imposta: Number,
    totaleDocumento: Number,
    arrotondamento: Number
  },
  
  // Stato importazione - AGGIUNTO 'ignorato'
  stato: {
    type: String,
    enum: ['analizzato', 'importato', 'importato_parziale', 'annullato', 'errore', 'duplicato', 'ignorato'],
    default: 'analizzato',
    index: true
  },
  
  // Stato processamento
  statoProcessamento: {
    type: String,
    enum: ['in_corso', 'completato', 'errore'],
    default: 'in_corso'
  },
  
  // Statistiche
  statistiche: {
    totaleRighe: { type: Number, default: 0 },
    righeImportate: { type: Number, default: 0 },
    righeIgnorate: { type: Number, default: 0 },
    righeErrore: { type: Number, default: 0 },
    righeManuali: { type: Number, default: 0 }
  },
  
  // Metadati import
  dataImportazione: {
    type: Date,
    default: null
  },
  
  dataAnnullamento: Date,
  motivoAnnullamento: String,
  
  // Nome file originale
  nomeFile: {
    type: String,
    required: true
  },
  
  // Dimensione file in bytes
  dimensioneFile: Number,
  
  // Note
  note: String,
  
  // Audit
  importatoDa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  annullatoDa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indice composto per ricerca rapida
ImportFatturaSchema.index({ 'fornitore.partitaIva': 1, 'fattura.data': -1 });
ImportFatturaSchema.index({ stato: 1, createdAt: -1 });
ImportFatturaSchema.index({ 'fattura.numero': 1, 'fattura.data': 1 });

// Metodo statico: verifica se fattura già importata
ImportFatturaSchema.statics.verificaDuplicato = async function(identificativo, hashFile) {
  const existing = await this.findOne({
    $or: [
      { identificativo },
      { hashFile }
    ],
    stato: { $ne: 'annullato' }
  });
  
  return existing;
};

// Metodo statico: verifica se file già processato tramite hash
ImportFatturaSchema.statics.fileGiaProcessato = async function(hashFile) {
  const existing = await this.findOne({
    hashFile,
    stato: { $ne: 'annullato' }
  });
  return existing;
};

// Metodo statico: verifica se fattura già esiste per partitaIva + numero + anno
ImportFatturaSchema.statics.esisteGia = async function(partitaIva, numero, anno) {
  const dataInizio = new Date(anno, 0, 1);
  const dataFine = new Date(anno, 11, 31, 23, 59, 59);
  
  const existing = await this.findOne({
    'fornitore.partitaIva': partitaIva,
    'fattura.numero': numero,
    'fattura.data': { $gte: dataInizio, $lte: dataFine },
    stato: { $ne: 'annullato' }
  });
  return existing;
};

// Metodo statico: genera identificativo univoco per fattura
ImportFatturaSchema.statics.generaIdentificativo = function(partitaIva, numero, anno) {
  return `${partitaIva}_${numero}_${anno}`;
};

// Metodo statico: statistiche importazioni
ImportFatturaSchema.statics.getStatistiche = async function(filtri = {}) {
  const match = {};
  
  if (filtri.dataInizio) match.createdAt = { $gte: new Date(filtri.dataInizio) };
  if (filtri.dataFine) {
    match.createdAt = match.createdAt || {};
    match.createdAt.$lte = new Date(filtri.dataFine);
  }
  if (filtri.fornitore) match['fornitore.partitaIva'] = filtri.fornitore;
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$stato',
        count: { $sum: 1 },
        totaleDocumenti: { $sum: '$totali.totaleDocumento' },
        totaleRighe: { $sum: '$statistiche.totaleRighe' },
        righeImportate: { $sum: '$statistiche.righeImportate' }
      }
    }
  ]);
  
  const perFornitore = await this.aggregate([
    { $match: { ...match, stato: { $in: ['importato', 'importato_parziale'] } } },
    {
      $group: {
        _id: '$fornitore.ragioneSociale',
        partitaIva: { $first: '$fornitore.partitaIva' },
        count: { $sum: 1 },
        totaleSpeso: { $sum: '$totali.totaleDocumento' }
      }
    },
    { $sort: { totaleSpeso: -1 } }
  ]);
  
  return { perStato: stats, perFornitore };
};

// Metodo istanza: annulla importazione
ImportFatturaSchema.methods.annulla = async function(userId, motivo) {
  this.stato = 'annullato';
  this.dataAnnullamento = new Date();
  this.motivoAnnullamento = motivo;
  this.annullatoDa = userId;
  
  return this.save();
};

// Metodo istanza: aggiorna statistiche
ImportFatturaSchema.methods.aggiornaStatistiche = function() {
  this.statistiche.totaleRighe = this.righe.length;
  this.statistiche.righeImportate = this.righe.filter(r => r.stato === 'importato').length;
  this.statistiche.righeIgnorate = this.righe.filter(r => r.stato === 'ignorato').length;
  this.statistiche.righeErrore = this.righe.filter(r => r.stato === 'errore').length;
  this.statistiche.righeManuali = this.righe.filter(r => r.stato === 'manuale').length;
};

export default mongoose.model('ImportFattura', ImportFatturaSchema);