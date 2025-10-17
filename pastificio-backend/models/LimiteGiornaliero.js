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
limiteGiornalieroSchema.statics.verificaOrdine = async function(dataRitiro, prodotti) {
  try {
    const data = new Date(dataRitiro);
    data.setHours(0, 0, 0, 0);
    
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
    
    const errori = [];
    
    // Raggruppa prodotti dell'ordine
    const prodottiMap = {};
    const categorieMap = {};
    
    prodotti.forEach(p => {
      // Skip vassoi (già espansi nei dettagli)
      if (p.unita === 'vassoio' || p.nome === 'Vassoio Dolci Misti') {
        return;
      }
      
      const nome = p.nome;
      const categoria = p.categoria || 'Altro';
      const quantita = parseFloat(p.quantita) || 0;
      const unita = p.unita || p.unitaMisura || 'Kg';
      
      // Converti in Kg se necessario
      let quantitaKg = quantita;
      if (unita === 'g') {
        quantitaKg = quantita / 1000;
      }
      
      // Raggruppa per prodotto
      prodottiMap[nome] = (prodottiMap[nome] || 0) + quantitaKg;
      
      // Raggruppa per categoria
      categorieMap[categoria] = (categorieMap[categoria] || 0) + quantitaKg;
    });
    
    // Verifica ogni limite
    for (const limite of limiti) {
      // Limite per prodotto specifico
      if (limite.prodotto) {
        const quantitaOrdine = prodottiMap[limite.prodotto] || 0;
        const quantitaTotale = limite.quantitaOrdinata + quantitaOrdine;
        const disponibile = limite.limiteQuantita - limite.quantitaOrdinata;
        
        if (quantitaTotale > limite.limiteQuantita) {
          errori.push({
            tipo: 'prodotto',
            nome: limite.prodotto,
            messaggio: `Limite superato per ${limite.prodotto}`,
            quantitaRichiesta: quantitaOrdine,
            quantitaDisponibile: disponibile,
            limite: limite.limiteQuantita,
            unitaMisura: limite.unitaMisura,
            superato: true
          });
        } else if (quantitaTotale >= limite.limiteQuantita * (limite.sogliAllerta / 100)) {
          errori.push({
            tipo: 'prodotto',
            nome: limite.prodotto,
            messaggio: `Attenzione: ${limite.prodotto} vicino al limite`,
            quantitaRichiesta: quantitaOrdine,
            quantitaDisponibile: disponibile,
            limite: limite.limiteQuantita,
            unitaMisura: limite.unitaMisura,
            superato: false
          });
        }
      }
      
      // Limite per categoria
      if (limite.categoria) {
        const quantitaOrdine = categorieMap[limite.categoria] || 0;
        const quantitaTotale = limite.quantitaOrdinata + quantitaOrdine;
        const disponibile = limite.limiteQuantita - limite.quantitaOrdinata;
        
        if (quantitaTotale > limite.limiteQuantita) {
          errori.push({
            tipo: 'categoria',
            nome: limite.categoria,
            messaggio: `Limite superato per categoria ${limite.categoria}`,
            quantitaRichiesta: quantitaOrdine,
            quantitaDisponibile: disponibile,
            limite: limite.limiteQuantita,
            unitaMisura: limite.unitaMisura,
            superato: true
          });
        } else if (quantitaTotale >= limite.limiteQuantita * (limite.sogliAllerta / 100)) {
          errori.push({
            tipo: 'categoria',
            nome: limite.categoria,
            messaggio: `Attenzione: categoria ${limite.categoria} vicina al limite`,
            quantitaRichiesta: quantitaOrdine,
            quantitaDisponibile: disponibile,
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