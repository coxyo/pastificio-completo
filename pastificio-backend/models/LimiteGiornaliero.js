// models/LimiteGiornaliero.js - NUOVO MODELLO
import mongoose from 'mongoose';

const limiteGiornalieroSchema = new mongoose.Schema({
  data: {
    type: Date,
    required: true,
    index: true,
    comment: 'Data per cui vale il limite (es: 2025-12-24)'
  },
  
  // Limite per prodotto specifico
  prodotto: {
    type: String,
    trim: true,
    comment: 'Nome prodotto specifico (es: "Pardulas", "Culurgiones ricotta")'
  },
  
  // Oppure limite per categoria
  categoria: {
    type: String,
    enum: ['Ravioli', 'Dolci', 'Pardulas', 'Panadas', 'Pasta', 'Pane', 'Altro'],
    comment: 'Categoria di prodotti (alternativa a prodotto specifico)'
  },
  
  // Quantità massima
  limiteQuantita: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Quantità massima in Kg (o pezzi per prodotti a pezzo)'
  },
  
  // Unità di misura del limite
  unitaMisura: {
    type: String,
    enum: ['Kg', 'Pezzi'],
    default: 'Kg',
    comment: 'Unità di misura del limite'
  },
  
  // Quantità già ordinata (calcolata dinamicamente)
  quantitaOrdinata: {
    type: Number,
    default: 0,
    comment: 'Quantità già ordinata per questa data (aggiornata ad ogni ordine)'
  },
  
  // Stato limite
  attivo: {
    type: Boolean,
    default: true,
    comment: 'Se false, il limite non viene applicato'
  },
  
  // Note
  note: {
    type: String,
    trim: true,
    comment: 'Note aggiuntive (es: "Natale - alta domanda")'
  },
  
  // Notifiche
  sogliAllerta: {
    type: Number,
    min: 0,
    max: 100,
    default: 80,
    comment: 'Percentuale a cui inviare alert (es: 80 = avviso all\'80%)'
  },
  
  alertInviato: {
    type: Boolean,
    default: false,
    comment: 'Se true, alert già inviato'
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// INDICI
// ==========================================
limiteGiornalieroSchema.index({ data: 1, prodotto: 1 }, { unique: true, sparse: true });
limiteGiornalieroSchema.index({ data: 1, categoria: 1 }, { unique: true, sparse: true });
limiteGiornalieroSchema.index({ data: 1, attivo: 1 });

// ==========================================
// VIRTUALS
// ==========================================

// Quantità residua disponibile
limiteGiornalieroSchema.virtual('quantitaDisponibile').get(function() {
  return Math.max(0, this.limiteQuantita - this.quantitaOrdinata);
});

// Percentuale utilizzata
limiteGiornalieroSchema.virtual('percentualeUtilizzo').get(function() {
  if (this.limiteQuantita === 0) return 0;
  return Math.round((this.quantitaOrdinata / this.limiteQuantita) * 100);
});

// Stato capacità (disponibile, in_esaurimento, esaurito)
limiteGiornalieroSchema.virtual('statoCapacita').get(function() {
  const perc = this.percentualeUtilizzo;
  if (perc >= 100) return 'esaurito';
  if (perc >= this.sogliAllerta) return 'in_esaurimento';
  return 'disponibile';
});

// ==========================================
// METODI INSTANCE
// ==========================================

/**
 * Verifica se c'è ancora capacità per una certa quantità
 */
limiteGiornalieroSchema.methods.haCapacita = function(quantitaRichiesta) {
  return this.quantitaDisponibile >= quantitaRichiesta;
};

/**
 * Aggiorna quantità ordinata
 */
limiteGiornalieroSchema.methods.aggiungiQuantita = async function(quantita) {
  this.quantitaOrdinata += quantita;
  
  // Controlla se superare soglia alert
  if (!this.alertInviato && this.percentualeUtilizzo >= this.sogliAllerta) {
    this.alertInviato = true;
    // TODO: Invia notifica
    console.log(`⚠️ Alert: ${this.prodotto || this.categoria} al ${this.percentualeUtilizzo}% per ${this.data.toLocaleDateString()}`);
  }
  
  return this.save();
};

/**
 * Rimuovi quantità (es: cancellazione ordine)
 */
limiteGiornalieroSchema.methods.rimuoviQuantita = async function(quantita) {
  this.quantitaOrdinata = Math.max(0, this.quantitaOrdinata - quantita);
  return this.save();
};

// ==========================================
// METODI STATICI
// ==========================================

/**
 * Ottieni tutti i limiti per una data
 */
limiteGiornalieroSchema.statics.getLimitiPerData = function(data) {
  const inizioGiorno = new Date(data);
  inizioGiorno.setHours(0, 0, 0, 0);
  
  const fineGiorno = new Date(data);
  fineGiorno.setHours(23, 59, 59, 999);
  
  return this.find({
    data: { $gte: inizioGiorno, $lte: fineGiorno },
    attivo: true
  }).sort({ prodotto: 1, categoria: 1 });
};

/**
 * Verifica limiti per un ordine
 * Ritorna array di errori se supera limiti
 */
limiteGiornalieroSchema.statics.verificaOrdine = async function(dataRitiro, prodotti) {
  const errori = [];
  
  // Ottieni limiti per questa data
  const limiti = await this.getLimitiPerData(dataRitiro);
  
  if (limiti.length === 0) {
    return { ok: true, errori: [] }; // Nessun limite configurato
  }
  
  // Raggruppa prodotti ordine per nome e categoria
  const prodottiRaggruppati = {};
  const categorieRaggruppate = {};
  
  prodotti.forEach(p => {
    // Skip vassoi (già espansi nei singoli prodotti)
    if (p.unita === 'vassoio' || p.nome === 'Vassoio Dolci Misti') {
      return;
    }
    
    const nome = p.nome;
    const categoria = p.categoria || 'Altro';
    const quantita = parseFloat(p.quantita) || 0;
    const unita = p.unita || 'Kg';
    
    // Converti in Kg se necessario
    let quantitaKg = quantita;
    if (unita === 'g') {
      quantitaKg = quantita / 1000;
    } else if (unita === 'Pezzi' || unita === 'pz') {
      // Per pezzi, usa conversione se disponibile
      quantitaKg = quantita; // Mantieni pezzi per ora
    }
    
    // Raggruppa per prodotto
    if (!prodottiRaggruppati[nome]) {
      prodottiRaggruppati[nome] = { quantita: 0, unita: unita };
    }
    prodottiRaggruppati[nome].quantita += quantitaKg;
    
    // Raggruppa per categoria
    if (!categorieRaggruppate[categoria]) {
      categorieRaggruppate[categoria] = { quantita: 0, unita: 'Kg' };
    }
    categorieRaggruppate[categoria].quantita += quantitaKg;
  });
  
  // Verifica ogni limite
  for (const limite of limiti) {
    // Limite per prodotto specifico
    if (limite.prodotto) {
      const prodottoOrdine = prodottiRaggruppati[limite.prodotto];
      
      if (prodottoOrdine) {
        const quantitaTotale = limite.quantitaOrdinata + prodottoOrdine.quantita;
        
        if (quantitaTotale > limite.limiteQuantita) {
          errori.push({
            tipo: 'prodotto',
            prodotto: limite.prodotto,
            limiteQuantita: limite.limiteQuantita,
            quantitaOrdinata: limite.quantitaOrdinata,
            quantitaRichiesta: prodottoOrdine.quantita,
            quantitaDisponibile: limite.quantitaDisponibile,
            unitaMisura: limite.unitaMisura,
            messaggio: `Limite superato per ${limite.prodotto}: richiesti ${prodottoOrdine.quantita} ${limite.unitaMisura}, disponibili ${limite.quantitaDisponibile} ${limite.unitaMisura}`
          });
        }
      }
    }
    
    // Limite per categoria
    if (limite.categoria) {
      const categoriaOrdine = categorieRaggruppate[limite.categoria];
      
      if (categoriaOrdine) {
        const quantitaTotale = limite.quantitaOrdinata + categoriaOrdine.quantita;
        
        if (quantitaTotale > limite.limiteQuantita) {
          errori.push({
            tipo: 'categoria',
            categoria: limite.categoria,
            limiteQuantita: limite.limiteQuantita,
            quantitaOrdinata: limite.quantitaOrdinata,
            quantitaRichiesta: categoriaOrdine.quantita,
            quantitaDisponibile: limite.quantitaDisponibile,
            unitaMisura: limite.unitaMisura,
            messaggio: `Limite superato per categoria ${limite.categoria}: richiesti ${categoriaOrdine.quantita} ${limite.unitaMisura}, disponibili ${limite.quantitaDisponibile} ${limite.unitaMisura}`
          });
        }
      }
    }
  }
  
  return {
    ok: errori.length === 0,
    errori: errori,
    limiti: limiti
  };
};

/**
 * Aggiorna quantità ordinate dopo salvataggio ordine
 */
limiteGiornalieroSchema.statics.aggiornaDopoOrdine = async function(dataRitiro, prodotti) {
  const limiti = await this.getLimitiPerData(dataRitiro);
  
  if (limiti.length === 0) return;
  
  // Raggruppa prodotti
  const prodottiRaggruppati = {};
  const categorieRaggruppate = {};
  
  prodotti.forEach(p => {
    if (p.unita === 'vassoio' || p.nome === 'Vassoio Dolci Misti') {
      return;
    }
    
    const nome = p.nome;
    const categoria = p.categoria || 'Altro';
    const quantita = parseFloat(p.quantita) || 0;
    const unita = p.unita || 'Kg';
    
    let quantitaKg = quantita;
    if (unita === 'g') {
      quantitaKg = quantita / 1000;
    }
    
    prodottiRaggruppati[nome] = (prodottiRaggruppati[nome] || 0) + quantitaKg;
    categorieRaggruppate[categoria] = (categorieRaggruppate[categoria] || 0) + quantitaKg;
  });
  
  // Aggiorna limiti
  for (const limite of limiti) {
    let aggiornaLimite = false;
    
    if (limite.prodotto && prodottiRaggruppati[limite.prodotto]) {
      await limite.aggiungiQuantita(prodottiRaggruppati[limite.prodotto]);
      aggiornaLimite = true;
    }
    
    if (limite.categoria && categorieRaggruppate[limite.categoria]) {
      await limite.aggiungiQuantita(categorieRaggruppate[limite.categoria]);
      aggiornaLimite = true;
    }
  }
};

// ==========================================
// EXPORT
// ==========================================
const LimiteGiornaliero = mongoose.model('LimiteGiornaliero', limiteGiornalieroSchema);

export default LimiteGiornaliero;