// models/LimiteGiornaliero.js - ✅ CON METODO AGGIORNA
import mongoose from 'mongoose';

const limiteGiornalieroSchema = new mongoose.Schema({
  data: {
    type: Date,
    required: true,
    index: true
  },
  prodotto: {
    type: String,
    index: true,
    sparse: true
  },
  categoria: {
    type: String,
    index: true,
    sparse: true
  },
  limiteQuantita: {
    type: Number,
    required: true,
    min: 0
  },
  unitaMisura: {
    type: String,
    enum: ['Kg', 'Pezzi', 'g', 'Litri'],
    default: 'Kg'
  },
  quantitaOrdinata: {
    type: Number,
    default: 0,
    min: 0
  },
  attivo: {
    type: Boolean,
    default: true
  },
  sogliAllerta: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  note: {
    type: String
  }
}, {
  timestamps: true
});

// Index composto per evitare duplicati
limiteGiornalieroSchema.index({ data: 1, prodotto: 1 }, { unique: true, sparse: true });
limiteGiornalieroSchema.index({ data: 1, categoria: 1 }, { unique: true, sparse: true });

// Validazione: deve avere O prodotto O categoria
limiteGiornalieroSchema.pre('save', function(next) {
  if (!this.prodotto && !this.categoria) {
    next(new Error('Deve essere specificato un prodotto o una categoria'));
  } else if (this.prodotto && this.categoria) {
    next(new Error('Non è possibile specificare sia prodotto che categoria'));
  } else {
    next();
  }
});

// ✅ METODO STATICO: Verifica se ordine supera limiti
// FIX 20/01/2026: Calcola totale ordini DINAMICAMENTE invece di usare quantitaOrdinata
limiteGiornalieroSchema.statics.verificaOrdine = async function(dataRitiro, prodotti) {
  try {
    const data = new Date(dataRitiro);
    data.setHours(0, 0, 0, 0);
    
    const dataFine = new Date(data);
    dataFine.setDate(dataFine.getDate() + 1);
    
    // Trova tutti i limiti attivi per quella data
    const limiti = await this.find({
      data,
      attivo: true
    });
    
    if (limiti.length === 0) {
      return {
        ok: true,
        errori: [],
        limiti: []
      };
    }
    
    // ✅ FIX: Importa il model Ordine per calcolare totali dinamici
    const Ordine = mongoose.model('Ordine');
    
    const errori = [];
    
    // Raggruppa prodotti dell'ordine corrente
    const prodottiMap = {};
    const categorieMap = {};
    
    // Helper per convertire in Kg
    const convertiInKg = (quantita, unita) => {
      const qty = parseFloat(quantita) || 0;
      const unit = (unita || 'Kg').toLowerCase();
      
      if (unit === 'kg') return qty;
      if (unit === 'g') return qty / 1000;
      if (unit === 'pz' || unit === 'pezzi') return qty / 24; // Zeppole: 24 pz = 1 Kg
      if (unit === '€' || unit === 'euro') return qty / 21;   // Zeppole: €21 = 1 Kg
      
      return qty;
    };
    
    prodotti.forEach(p => {
      // Skip vassoi (già espansi nei dettagli)
      if (p.unita === 'vassoio' || p.nome === 'Vassoio Dolci Misti') {
        return;
      }
      
      const nome = p.nome;
      const categoria = p.categoria || 'Altro';
      const quantitaKg = convertiInKg(p.quantita, p.unita || p.unitaMisura);
      
      // Raggruppa per prodotto
      prodottiMap[nome] = (prodottiMap[nome] || 0) + quantitaKg;
      
      // Raggruppa per categoria
      categorieMap[categoria] = (categorieMap[categoria] || 0) + quantitaKg;
    });
    
    // Verifica ogni limite
    for (const limite of limiti) {
      // Limite per prodotto specifico
      if (limite.prodotto) {
        const quantitaOrdineNuovo = prodottiMap[limite.prodotto] || 0;
        
        // ✅ FIX: Calcola totale ordini ESISTENTI dinamicamente
        const ordiniEsistenti = await Ordine.find({
          dataRitiro: { $gte: data, $lt: dataFine },
          'prodotti.nome': { $regex: new RegExp(`^${limite.prodotto}$`, 'i') }
        }).lean();
        
        let totaleOrdiniEsistenti = 0;
        ordiniEsistenti.forEach(ordine => {
          ordine.prodotti.forEach(prod => {
            if (prod.nome && prod.nome.toLowerCase() === limite.prodotto.toLowerCase()) {
              totaleOrdiniEsistenti += convertiInKg(prod.quantita, prod.unita);
            }
          });
        });
        
        // Totale = ordini esistenti + vendite dirette + nuovo ordine
        const venditeDirette = limite.quantitaOrdinata || 0;
        const quantitaTotale = totaleOrdiniEsistenti + venditeDirette + quantitaOrdineNuovo;
        const disponibile = limite.limiteQuantita - totaleOrdiniEsistenti - venditeDirette;
        
        console.log(`[VERIFICA] ${limite.prodotto}: esistenti=${totaleOrdiniEsistenti.toFixed(2)}, dirette=${venditeDirette.toFixed(2)}, nuovo=${quantitaOrdineNuovo.toFixed(2)}, disponibile=${disponibile.toFixed(2)}`);
        
        if (quantitaOrdineNuovo > disponibile) {
          errori.push({
            tipo: 'prodotto',
            nome: limite.prodotto,
            messaggio: `Limite superato per ${limite.prodotto}`,
            quantitaRichiesta: quantitaOrdineNuovo,
            quantitaDisponibile: Math.max(0, disponibile),
            limite: limite.limiteQuantita,
            unitaMisura: limite.unitaMisura,
            superato: true
          });
        } else if (quantitaTotale >= limite.limiteQuantita * (limite.sogliAllerta / 100)) {
          errori.push({
            tipo: 'prodotto',
            nome: limite.prodotto,
            messaggio: `Attenzione: ${limite.prodotto} vicino al limite`,
            quantitaRichiesta: quantitaOrdineNuovo,
            quantitaDisponibile: Math.max(0, disponibile),
            limite: limite.limiteQuantita,
            unitaMisura: limite.unitaMisura,
            superato: false
          });
        }
      }
      
      // Limite per categoria (stesso fix)
      if (limite.categoria) {
        const quantitaOrdineNuovo = categorieMap[limite.categoria] || 0;
        
        // Per categoria, calcolo semplificato (usa quantitaOrdinata come prima)
        // TODO: implementare calcolo dinamico anche per categorie se necessario
        const venditeDirette = limite.quantitaOrdinata || 0;
        const disponibile = limite.limiteQuantita - venditeDirette;
        const quantitaTotale = venditeDirette + quantitaOrdineNuovo;
        
        if (quantitaOrdineNuovo > disponibile) {
          errori.push({
            tipo: 'categoria',
            nome: limite.categoria,
            messaggio: `Limite superato per categoria ${limite.categoria}`,
            quantitaRichiesta: quantitaOrdineNuovo,
            quantitaDisponibile: Math.max(0, disponibile),
            limite: limite.limiteQuantita,
            unitaMisura: limite.unitaMisura,
            superato: true
          });
        } else if (quantitaTotale >= limite.limiteQuantita * (limite.sogliAllerta / 100)) {
          errori.push({
            tipo: 'categoria',
            nome: limite.categoria,
            messaggio: `Attenzione: categoria ${limite.categoria} vicina al limite`,
            quantitaRichiesta: quantitaOrdineNuovo,
            quantitaDisponibile: Math.max(0, disponibile),
            limite: limite.limiteQuantita,
            unitaMisura: limite.unitaMisura,
            superato: false
          });
        }
      }
    }
    
    return {
      ok: errori.filter(e => e.superato).length === 0,
      errori,
      limiti
    };
    
  } catch (error) {
    console.error('Errore verifica limiti:', error);
    throw error;
  }
};

// ✅ NUOVO: Aggiorna contatori DOPO salvataggio ordine
limiteGiornalieroSchema.statics.aggiornaDopoOrdine = async function(dataRitiro, prodotti) {
  try {
    const data = new Date(dataRitiro);
    data.setHours(0, 0, 0, 0);
    
    // Raggruppa prodotti
    const prodottiMap = {};
    const categorieMap = {};
    
    prodotti.forEach(p => {
      // Skip vassoi
      if (p.unita === 'vassoio' || p.nome === 'Vassoio Dolci Misti') {
        return;
      }
      
      const nome = p.nome;
      const categoria = p.categoria || 'Altro';
      const quantita = parseFloat(p.quantita) || 0;
      const unita = p.unita || p.unitaMisura || 'Kg';
      
      // Converti in Kg
      let quantitaKg = quantita;
      if (unita === 'g') {
        quantitaKg = quantita / 1000;
      }
      
      prodottiMap[nome] = (prodottiMap[nome] || 0) + quantitaKg;
      categorieMap[categoria] = (categorieMap[categoria] || 0) + quantitaKg;
    });
    
    // Aggiorna limiti per prodotto
    for (const [nome, quantita] of Object.entries(prodottiMap)) {
      await this.findOneAndUpdate(
        { data, prodotto: nome, attivo: true },
        { $inc: { quantitaOrdinata: quantita } }
      );
    }
    
    // Aggiorna limiti per categoria
    for (const [categoria, quantita] of Object.entries(categorieMap)) {
      await this.findOneAndUpdate(
        { data, categoria, attivo: true },
        { $inc: { quantitaOrdinata: quantita } }
      );
    }
    
    console.log(`✅ Limiti aggiornati per ${dataRitiro}`);
    
  } catch (error) {
    console.error('Errore aggiornamento limiti:', error);
    throw error;
  }
};

const LimiteGiornaliero = mongoose.model('LimiteGiornaliero', limiteGiornalieroSchema);

export default LimiteGiornaliero;