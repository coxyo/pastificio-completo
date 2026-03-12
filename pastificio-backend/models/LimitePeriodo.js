// models/LimitePeriodo.js - Limiti produzione multi-giorno con fasce orarie
// NUOVO 10/03/2026: Sistema limiti periodo (es. Pasqua, Ferragosto, ecc.)
import mongoose from 'mongoose';

// Schema per singola fascia oraria all'interno del periodo
const fasciaSchema = new mongoose.Schema({
  data: {
    type: Date,
    required: true
  },
  fascia: {
    type: String,
    enum: ['mattina', 'sera'],
    required: true
  },
  limite: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const limitePeriodoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
    // es. "Pasqua 2026", "Ferragosto 2026"
  },
  prodotto: {
    type: String,
    required: true,
    index: true
  },
  dataInizio: {
    type: Date,
    required: true,
    index: true
  },
  dataFine: {
    type: Date,
    required: true,
    index: true
  },
  limiteTotale: {
    type: Number,
    required: true,
    min: 0
  },
  unitaMisura: {
    type: String,
    enum: ['Kg', 'Pezzi', 'g', 'Litri'],
    default: 'Kg'
  },
  fasce: {
    type: [fasciaSchema],
    default: []
    // Array di { data, fascia: 'mattina'|'sera', limite }
  },
  sogliAllerta: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  attivo: {
    type: Boolean,
    default: true,
    index: true
  },
  note: {
    type: String
  },
  creatoDA: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Index composto: non possono esistere due periodi attivi per stesso prodotto che si sovrappongono
// (la validazione logica è fatta nel pre-save)
limitePeriodoSchema.index({ prodotto: 1, dataInizio: 1, dataFine: 1 });

// Validazione: dataFine >= dataInizio
limitePeriodoSchema.pre('save', function(next) {
  if (this.dataFine < this.dataInizio) {
    return next(new Error('dataFine deve essere >= dataInizio'));
  }
  // Verifica che la somma delle fasce non superi il limiteTotale
  if (this.fasce.length > 0) {
    const sommFasce = this.fasce.reduce((sum, f) => sum + f.limite, 0);
    if (sommFasce > this.limiteTotale + 0.01) {
      return next(new Error(`Somma fasce (${sommFasce}) supera il limite totale (${this.limiteTotale})`));
    }
  }
  next();
});

// ────────────────────────────────────────────────────────
// HELPER INTERNO: converte quantità in Kg
// ────────────────────────────────────────────────────────
const convertiInKg = (quantita, unita) => {
  const qty = parseFloat(quantita) || 0;
  const unit = (unita || 'Kg').toLowerCase();
  if (unit === 'kg') return qty;
  if (unit === 'g') return qty / 1000;
  if (unit === 'pz' || unit === 'pezzi') return qty / 24;
  if (unit === 'euro' || unit === '€') return qty / 21;
  return qty;
};

// ────────────────────────────────────────────────────────
// METODO STATICO: verifica se un ordine supera limiti periodo
// Chiamato da LimiteGiornaliero.verificaOrdine (via bridge in model)
// oppure direttamente da ordiniController
//
// Ritorna stesso formato di LimiteGiornaliero.verificaOrdine:
// { ok: bool, errori: [], avvisi: [] }
// ────────────────────────────────────────────────────────
limitePeriodoSchema.statics.verificaOrdine = async function(dataRitiro, prodotti, oraRitiro) {
  try {
    const dataOrdine = new Date(dataRitiro);
    dataOrdine.setHours(0, 0, 0, 0);

    // fasciaOrdine non più usata (verifica per giorno intero)

    // 1. Trova periodi attivi che coprono questa data
    const periodi = await this.find({
      attivo: true,
      dataInizio: { $lte: dataOrdine },
      dataFine: { $gte: dataOrdine }
    }).lean();

    if (periodi.length === 0) {
      return { ok: true, errori: [], avvisi: [] };
    }

    const Ordine = mongoose.model('Ordine');
    const errori = [];
    const avvisi = [];

    // 2. Raggruppa quantità prodotti dell'ordine corrente
    const prodottiMap = {};
    prodotti.forEach(p => {
      if (p.unita === 'vassoio' || p.nome === 'Vassoio Dolci Misti') return;
      const qKg = convertiInKg(p.quantita, p.unita || p.unitaMisura);
      prodottiMap[p.nome] = (prodottiMap[p.nome] || 0) + qKg;
    });

    // 3. Per ogni periodo attivo
    for (const periodo of periodi) {
      // Verifica solo prodotti che matchano questo periodo
      const quantitaNuovaOrdine = prodottiMap[periodo.prodotto] || 0;
      if (quantitaNuovaOrdine === 0) continue;

      const dataInizio = new Date(periodo.dataInizio);
      dataInizio.setHours(0, 0, 0, 0);
      const dataFine = new Date(periodo.dataFine);
      dataFine.setHours(23, 59, 59, 999);

      // 3a. Calcola totale ordini già presenti per TUTTO il periodo
      const ordiniPeriodo = await Ordine.find({
        dataRitiro: { $gte: dataInizio, $lte: dataFine },
        'prodotti.nome': { $regex: new RegExp(`^${periodo.prodotto}$`, 'i') },
        stato: { $ne: 'annullato' }
      }).lean();

      let totalePeriodo = 0;
      ordiniPeriodo.forEach(ord => {
        ord.prodotti.forEach(p => {
          if (p.nome && p.nome.toLowerCase() === periodo.prodotto.toLowerCase()) {
            totalePeriodo += convertiInKg(p.quantita, p.unita);
          }
        });
      });

      const disponibilePeriodo = periodo.limiteTotale - totalePeriodo;
      const percPeriodo = ((totalePeriodo + quantitaNuovaOrdine) / periodo.limiteTotale) * 100;

      console.log(`[PERIODO] ${periodo.nome} - ${periodo.prodotto}: esistenti=${totalePeriodo.toFixed(2)}, nuovo=${quantitaNuovaOrdine.toFixed(2)}, disponibile=${disponibilePeriodo.toFixed(2)}`);

      // 3b. Verifica limite TOTALE periodo
      if (quantitaNuovaOrdine > disponibilePeriodo) {
        errori.push({
          tipo: 'periodo_totale',
          nome: periodo.prodotto,
          nomePeriodo: periodo.nome,
          messaggio: `Limite periodo "${periodo.nome}" superato per ${periodo.prodotto}`,
          quantitaRichiesta: parseFloat(quantitaNuovaOrdine.toFixed(2)),
          quantitaDisponibile: parseFloat(Math.max(0, disponibilePeriodo).toFixed(2)),
          limite: periodo.limiteTotale,
          unitaMisura: periodo.unitaMisura,
          superato: true,
          bloccante: true   // Limite totale periodo → NON si può forzare
        });
        // Se il totale periodo è già superato, non serve verificare la fascia
        continue;
      } else if (percPeriodo >= periodo.sogliAllerta) {
        avvisi.push({
          tipo: 'periodo_totale_avviso',
          nome: periodo.prodotto,
          nomePeriodo: periodo.nome,
          messaggio: `Attenzione: ${periodo.prodotto} vicino al limite "${periodo.nome}" (${percPeriodo.toFixed(0)}%)`,
          quantitaRichiesta: parseFloat(quantitaNuovaOrdine.toFixed(2)),
          quantitaDisponibile: parseFloat(Math.max(0, disponibilePeriodo).toFixed(2)),
          limite: periodo.limiteTotale,
          unitaMisura: periodo.unitaMisura,
          superato: false,
          bloccante: false,
          percentuale: parseFloat(percPeriodo.toFixed(1))
        });
      }

      // 3c. Verifica limite GIORNALIERO (somma tutte le fasce configurate per questo giorno)
      // Il limite si applica all'intero giorno, indipendentemente dalla fascia dell'ordine
      const fasceGiorno = periodo.fasce.filter(f => {
        const dataFascia = new Date(f.data);
        dataFascia.setHours(0, 0, 0, 0);
        return dataFascia.getTime() === dataOrdine.getTime();
      });

      if (fasceGiorno.length > 0) {
        // Limite giornaliero = somma di tutte le fasce configurate per questo giorno
        const limiteGiornaliero = fasceGiorno.reduce((sum, f) => sum + f.limite, 0);

        // Calcola tutti gli ordini del giorno intero (mattina + sera)
        const dataOrdineInizio = new Date(dataOrdine);
        const dataOrdineFine = new Date(dataOrdine);
        dataOrdineFine.setDate(dataOrdineFine.getDate() + 1);

        const ordiniGiorno = await Ordine.find({
          dataRitiro: { $gte: dataOrdineInizio, $lt: dataOrdineFine },
          'prodotti.nome': { $regex: new RegExp(`^${periodo.prodotto}$`, 'i') },
          stato: { $ne: 'annullato' }
        }).lean();

        let totaleGiorno = 0;
        ordiniGiorno.forEach(ord => {
          ord.prodotti.forEach(p => {
            if (p.nome && p.nome.toLowerCase() === periodo.prodotto.toLowerCase()) {
              totaleGiorno += convertiInKg(p.quantita, p.unita);
            }
          });
        });

        const disponibileGiorno = limiteGiornaliero - totaleGiorno;
        const percGiorno = ((totaleGiorno + quantitaNuovaOrdine) / limiteGiornaliero) * 100;

        console.log(`[PERIODO GIORNO] ${periodo.prodotto} ${new Date(dataOrdine).toLocaleDateString('it-IT')}: limite=${limiteGiornaliero.toFixed(2)}, esistenti=${totaleGiorno.toFixed(2)}, nuovo=${quantitaNuovaOrdine.toFixed(2)}, disponibile=${disponibileGiorno.toFixed(2)}`);

        if (quantitaNuovaOrdine > disponibileGiorno) {
          avvisi.push({
            tipo: 'periodo_giorno',
            nome: periodo.prodotto,
            nomePeriodo: periodo.nome,
            messaggio: `⚠️ Limite giornaliero "${periodo.nome}" superato: ${periodo.prodotto} del ${new Date(dataOrdine).toLocaleDateString('it-IT')} - disponibili ${Math.max(0, disponibileGiorno).toFixed(1)} ${periodo.unitaMisura} su ${limiteGiornaliero} ${periodo.unitaMisura}`,
            quantitaRichiesta: parseFloat(quantitaNuovaOrdine.toFixed(2)),
            quantitaDisponibile: parseFloat(Math.max(0, disponibileGiorno).toFixed(2)),
            limite: limiteGiornaliero,
            unitaMisura: periodo.unitaMisura,
            superato: true,
            bloccante: false
          });
        } else if (percGiorno >= periodo.sogliAllerta) {
          avvisi.push({
            tipo: 'periodo_giorno_avviso',
            nome: periodo.prodotto,
            nomePeriodo: periodo.nome,
            messaggio: `Attenzione: ${periodo.prodotto} vicino al limite giornaliero "${periodo.nome}" (${percGiorno.toFixed(0)}%) - ${new Date(dataOrdine).toLocaleDateString('it-IT')}`,
            quantitaRichiesta: parseFloat(quantitaNuovaOrdine.toFixed(2)),
            quantitaDisponibile: parseFloat(Math.max(0, disponibileGiorno).toFixed(2)),
            limite: limiteGiornaliero,
            unitaMisura: periodo.unitaMisura,
            superato: false,
            bloccante: false,
            percentuale: parseFloat(percGiorno.toFixed(1))
          });
        }
      }
    }

    return {
      ok: errori.filter(e => e.superato && e.bloccante).length === 0,
      errori,
      avvisi
    };

  } catch (error) {
    console.error('[LIMITE PERIODO] Errore verifica:', error);
    throw error;
  }
};

// ────────────────────────────────────────────────────────
// METODO STATICO: stato completo di un periodo (per dashboard)
// Ritorna totali e percentuali per ogni fascia
// ────────────────────────────────────────────────────────
limitePeriodoSchema.statics.getStatoPeriodo = async function(periodoId) {
  const periodo = await this.findById(periodoId).lean();
  if (!periodo) return null;

  const Ordine = mongoose.model('Ordine');

  const dataInizio = new Date(periodo.dataInizio);
  dataInizio.setHours(0, 0, 0, 0);
  const dataFine = new Date(periodo.dataFine);
  dataFine.setHours(23, 59, 59, 999);

  // Tutti gli ordini del periodo per questo prodotto
  const ordini = await Ordine.find({
    dataRitiro: { $gte: dataInizio, $lte: dataFine },
    'prodotti.nome': { $regex: new RegExp(`^${periodo.prodotto}$`, 'i') },
    stato: { $ne: 'annullato' }
  }).lean();

  // Totale periodo
  let totalePeriodo = 0;
  ordini.forEach(ord => {
    ord.prodotti.forEach(p => {
      if (p.nome && p.nome.toLowerCase() === periodo.prodotto.toLowerCase()) {
        totalePeriodo += convertiInKg(p.quantita, p.unita);
      }
    });
  });

  // Stato per ogni fascia configurata
  const fasceStato = await Promise.all(periodo.fasce.map(async (fasciaConf) => {
    const dataFasciaInizio = new Date(fasciaConf.data);
    dataFasciaInizio.setHours(0, 0, 0, 0);
    const dataFasciaFine = new Date(fasciaConf.data);
    dataFasciaFine.setDate(dataFasciaFine.getDate() + 1);

    let queryFascia = {
      dataRitiro: { $gte: dataFasciaInizio, $lt: dataFasciaFine },
      'prodotti.nome': { $regex: new RegExp(`^${periodo.prodotto}$`, 'i') },
      stato: { $ne: 'annullato' }
    };
    if (fasciaConf.fascia === 'mattina') {
      queryFascia.$or = [
        { oraRitiro: { $lt: '14:00' } },
        { oraRitiro: { $exists: false } },
        { oraRitiro: null },
        { oraRitiro: '' }
      ];
    } else {
      queryFascia.oraRitiro = { $gte: '14:00' };
    }

    const ordiniFascia = await Ordine.find(queryFascia).lean();
    let totaleFascia = 0;
    ordiniFascia.forEach(ord => {
      ord.prodotti.forEach(p => {
        if (p.nome && p.nome.toLowerCase() === periodo.prodotto.toLowerCase()) {
          totaleFascia += convertiInKg(p.quantita, p.unita);
        }
      });
    });

    return {
      data: fasciaConf.data,
      fascia: fasciaConf.fascia,
      limite: fasciaConf.limite,
      ordinato: parseFloat(totaleFascia.toFixed(2)),
      disponibile: parseFloat(Math.max(0, fasciaConf.limite - totaleFascia).toFixed(2)),
      percentuale: fasciaConf.limite > 0 ? parseFloat(((totaleFascia / fasciaConf.limite) * 100).toFixed(1)) : 0,
      completo: totaleFascia >= fasciaConf.limite
    };
  }));

  return {
    _id: periodo._id,
    nome: periodo.nome,
    prodotto: periodo.prodotto,
    dataInizio: periodo.dataInizio,
    dataFine: periodo.dataFine,
    limiteTotale: periodo.limiteTotale,
    unitaMisura: periodo.unitaMisura,
    ordinatoTotale: parseFloat(totalePeriodo.toFixed(2)),
    disponibileTotale: parseFloat(Math.max(0, periodo.limiteTotale - totalePeriodo).toFixed(2)),
    percentualeTotale: periodo.limiteTotale > 0 ? parseFloat(((totalePeriodo / periodo.limiteTotale) * 100).toFixed(1)) : 0,
    fasce: fasceStato,
    attivo: periodo.attivo,
    note: periodo.note
  };
};

const LimitePeriodo = mongoose.model('LimitePeriodo', limitePeriodoSchema);
export default LimitePeriodo;