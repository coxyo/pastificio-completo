// models/LimiteGiornaliero.js - ✅ AGGIORNAMENTO 10/03/2026: Bridge verso LimitePeriodo
// STORIA MODIFICHE:
//   12/02/2026 - Aggiunto supporto fascia MATTINA/SERA
//   10/03/2026 - verificaOrdine ora verifica anche i limiti periodo (LimitePeriodo)
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
  // Fascia oraria (giornaliero = tutto il giorno, mattina = 06:00-13:59, sera = 14:00-23:59)
  fascia: {
    type: String,
    enum: ['giornaliero', 'mattina', 'sera'],
    default: 'giornaliero'
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

// Index composto con fascia per evitare duplicati
limiteGiornalieroSchema.index({ data: 1, prodotto: 1, fascia: 1 }, { unique: true, sparse: true });
limiteGiornalieroSchema.index({ data: 1, categoria: 1, fascia: 1 }, { unique: true, sparse: true });

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

// ────────────────────────────────────────────────────────
// HELPER INTERNO
// ────────────────────────────────────────────────────────
const convertiInKg = (quantita, unita) => {
  const qty = parseFloat(quantita) || 0;
  const unit = (unita || 'Kg').toLowerCase();
  if (unit === 'kg') return qty;
  if (unit === 'g') return qty / 1000;
  if (unit === 'pz' || unit === 'pezzi') return qty / 24;
  if (unit === '€' || unit === 'euro') return qty / 21;
  return qty;
};

// ────────────────────────────────────────────────────────
// METODO STATICO: Verifica se ordine supera limiti
// ✅ 10/03/2026: ora controlla ANCHE i limiti periodo
//
// Ritorna:
// {
//   ok: boolean,                    // false se c'è almeno un errore BLOCCANTE
//   errori: [...],                  // superamenti (sia giornalieri che periodo)
//   avvisi: [...],                  // avvisi soglia (solo periodo per ora)
//   limiti: [...]                   // limiti giornalieri trovati (retrocompatibilità)
// }
// ────────────────────────────────────────────────────────
limiteGiornalieroSchema.statics.verificaOrdine = async function(dataRitiro, prodotti, oraRitiro) {
  try {
    const data = new Date(dataRitiro);
    data.setHours(0, 0, 0, 0);
    
    const dataFine = new Date(data);
    dataFine.setDate(dataFine.getDate() + 1);
    
    // Determina fascia dall'ora di ritiro
    const fasciaOrdine = (oraRitiro && oraRitiro >= '14:00') ? 'sera' : 'mattina';
    
    // ════════════════════════════════════════════════════
    // PARTE 1: Verifica limiti GIORNALIERI (comportamento invariato)
    // ════════════════════════════════════════════════════
    const limiti = await this.find({
      data,
      attivo: true,
      $or: [
        { fascia: 'giornaliero' },
        { fascia: fasciaOrdine }
      ]
    });
    
    const Ordine = mongoose.model('Ordine');
    const errori = [];
    
    const prodottiMap = {};
    const categorieMap = {};
    
    prodotti.forEach(p => {
      if (p.unita === 'vassoio' || p.nome === 'Vassoio Dolci Misti') return;
      
      const nome = p.nome;
      const categoria = p.categoria || 'Altro';
      const quantitaKg = convertiInKg(p.quantita, p.unita || p.unitaMisura);
      
      prodottiMap[nome] = (prodottiMap[nome] || 0) + quantitaKg;
      categorieMap[categoria] = (categorieMap[categoria] || 0) + quantitaKg;
    });
    
    for (const limite of limiti) {
      if (limite.prodotto) {
        const quantitaOrdineNuovo = prodottiMap[limite.prodotto] || 0;
        
        let queryOrdini = {
          dataRitiro: { $gte: data, $lt: dataFine },
          'prodotti.nome': { $regex: new RegExp(`^${limite.prodotto}$`, 'i') }
        };
        
        if (limite.fascia === 'mattina') {
          queryOrdini.oraRitiro = { $lt: '14:00' };
        } else if (limite.fascia === 'sera') {
          queryOrdini.oraRitiro = { $gte: '14:00' };
        }
        
        const ordiniEsistenti = await Ordine.find(queryOrdini).lean();
        
        let totaleOrdiniEsistenti = 0;
        ordiniEsistenti.forEach(ordine => {
          ordine.prodotti.forEach(prod => {
            if (prod.nome && prod.nome.toLowerCase() === limite.prodotto.toLowerCase()) {
              totaleOrdiniEsistenti += convertiInKg(prod.quantita, prod.unita);
            }
          });
        });
        
        const venditeDirette = limite.quantitaOrdinata || 0;
        const quantitaTotale = totaleOrdiniEsistenti + venditeDirette + quantitaOrdineNuovo;
        const disponibile = limite.limiteQuantita - totaleOrdiniEsistenti - venditeDirette;
        
        console.log(`[VERIFICA] ${limite.prodotto} (${limite.fascia}): esistenti=${totaleOrdiniEsistenti.toFixed(2)}, dirette=${venditeDirette.toFixed(2)}, nuovo=${quantitaOrdineNuovo.toFixed(2)}, disponibile=${disponibile.toFixed(2)}`);
        
        if (quantitaOrdineNuovo > disponibile) {
          errori.push({
            tipo: 'prodotto',
            nome: limite.prodotto,
            fascia: limite.fascia,
            messaggio: `Limite superato per ${limite.prodotto} (${limite.fascia})`,
            quantitaRichiesta: quantitaOrdineNuovo,
            quantitaDisponibile: Math.max(0, disponibile),
            limite: limite.limiteQuantita,
            unitaMisura: limite.unitaMisura,
            superato: true,
            bloccante: false  // Limiti giornalieri: si può forzare (comportamento invariato)
          });
        } else if (quantitaTotale >= limite.limiteQuantita * (limite.sogliAllerta / 100)) {
          errori.push({
            tipo: 'prodotto',
            nome: limite.prodotto,
            fascia: limite.fascia,
            messaggio: `Attenzione: ${limite.prodotto} vicino al limite (${limite.fascia})`,
            quantitaRichiesta: quantitaOrdineNuovo,
            quantitaDisponibile: Math.max(0, disponibile),
            limite: limite.limiteQuantita,
            unitaMisura: limite.unitaMisura,
            superato: false,
            bloccante: false
          });
        }
      }
      
      if (limite.categoria) {
        const quantitaOrdineNuovo = categorieMap[limite.categoria] || 0;
        const venditeDirette = limite.quantitaOrdinata || 0;
        const disponibile = limite.limiteQuantita - venditeDirette;
        const quantitaTotale = venditeDirette + quantitaOrdineNuovo;
        
        if (quantitaOrdineNuovo > disponibile) {
          errori.push({
            tipo: 'categoria',
            nome: limite.categoria,
            fascia: limite.fascia,
            messaggio: `Limite superato per categoria ${limite.categoria} (${limite.fascia})`,
            quantitaRichiesta: quantitaOrdineNuovo,
            quantitaDisponibile: Math.max(0, disponibile),
            limite: limite.limiteQuantita,
            unitaMisura: limite.unitaMisura,
            superato: true,
            bloccante: false
          });
        } else if (quantitaTotale >= limite.limiteQuantita * (limite.sogliAllerta / 100)) {
          errori.push({
            tipo: 'categoria',
            nome: limite.categoria,
            fascia: limite.fascia,
            messaggio: `Attenzione: categoria ${limite.categoria} vicina al limite (${limite.fascia})`,
            quantitaRichiesta: quantitaOrdineNuovo,
            quantitaDisponibile: Math.max(0, disponibile),
            limite: limite.limiteQuantita,
            unitaMisura: limite.unitaMisura,
            superato: false,
            bloccante: false
          });
        }
      }
    }

    // ════════════════════════════════════════════════════
    // PARTE 2: Verifica limiti PERIODO (NUOVO 10/03/2026)
    // Importazione lazy per evitare circular dependency
    // ════════════════════════════════════════════════════
    let erroriPeriodo = [];
    let avvisiPeriodo = [];

    try {
      const LimitePeriodo = mongoose.model('LimitePeriodo');
      const risultatoPeriodo = await LimitePeriodo.verificaOrdine(dataRitiro, prodotti, oraRitiro);
      erroriPeriodo = risultatoPeriodo.errori || [];
      avvisiPeriodo = risultatoPeriodo.avvisi || [];
    } catch (periodoError) {
      // LimitePeriodo non ancora registrato o errore → non bloccare
      console.warn('[VERIFICA] LimitePeriodo non disponibile (non bloccante):', periodoError.message);
    }

    const tuttiErrori = [...errori, ...erroriPeriodo];
    
    // ok = false solo se c'è almeno un errore BLOCCANTE (periodo_totale)
    // Errori giornalieri e fascia periodo: avvisano ma non bloccano (si può forzare)
    const haBloccante = tuttiErrori.some(e => e.superato && e.bloccante);
    const haSuperato = tuttiErrori.some(e => e.superato && !e.bloccante);
    
    return {
      ok: !haBloccante && !haSuperato,  // false se c'è qualsiasi superamento
      bloccante: haBloccante,           // true solo se limite totale periodo → non forzabile
      errori: tuttiErrori,
      avvisi: avvisiPeriodo,
      limiti
    };
    
  } catch (error) {
    console.error('Errore verifica limiti:', error);
    throw error;
  }
};

// ────────────────────────────────────────────────────────
// Aggiorna contatori DOPO salvataggio ordine (invariato)
// ────────────────────────────────────────────────────────
limiteGiornalieroSchema.statics.aggiornaDopoOrdine = async function(dataRitiro, prodotti) {
  try {
    const data = new Date(dataRitiro);
    data.setHours(0, 0, 0, 0);
    
    const prodottiMap = {};
    const categorieMap = {};
    
    prodotti.forEach(p => {
      if (p.unita === 'vassoio' || p.nome === 'Vassoio Dolci Misti') return;
      
      const nome = p.nome;
      const categoria = p.categoria || 'Altro';
      const quantita = parseFloat(p.quantita) || 0;
      const unita = p.unita || p.unitaMisura || 'Kg';
      
      let quantitaKg = quantita;
      if (unita === 'g') quantitaKg = quantita / 1000;
      
      prodottiMap[nome] = (prodottiMap[nome] || 0) + quantitaKg;
      categorieMap[categoria] = (categorieMap[categoria] || 0) + quantitaKg;
    });
    
    for (const [nome, quantita] of Object.entries(prodottiMap)) {
      await this.findOneAndUpdate(
        { data, prodotto: nome, attivo: true },
        { $inc: { quantitaOrdinata: quantita } }
      );
    }
    
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