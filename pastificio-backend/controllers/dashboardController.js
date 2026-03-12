import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';

// ✅ Helper: importa modello LimiteGiornaliero (importazione lazy per evitare errori se non esiste)
let LimiteGiornaliero;
const getLimiteModel = async () => {
  if (!LimiteGiornaliero) {
    try {
      const mod = await import('../models/LimiteGiornaliero.js');
      LimiteGiornaliero = mod.default;
    } catch {
      LimiteGiornaliero = null;
    }
  }
  return LimiteGiornaliero;
};

const dashboardController = {
  // Ottiene statistiche generali
  getStatisticheGenerali: async (req, res) => {
    try {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const domani = new Date(oggi);
      domani.setDate(domani.getDate() + 1);
      
      const inizioSettimana = new Date(oggi);
      inizioSettimana.setDate(oggi.getDate() - oggi.getDay());
      
      const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
      
      // Ordini oggi
      const ordiniOggi = await Ordine.countDocuments({
        createdAt: { $gte: oggi, $lt: domani }
      });
      
      const valoreOggi = await Ordine.aggregate([
        { $match: { createdAt: { $gte: oggi, $lt: domani } } },
        { $group: { _id: null, totale: { $sum: '$totale' } } }
      ]);
      
      // Ordini settimana
      const ordiniSettimana = await Ordine.countDocuments({
        createdAt: { $gte: inizioSettimana }
      });
      
      const valoreSettimana = await Ordine.aggregate([
        { $match: { createdAt: { $gte: inizioSettimana } } },
        { $group: { _id: null, totale: { $sum: '$totale' } } }
      ]);
      
      // Ordini mese
      const ordiniMese = await Ordine.countDocuments({
        createdAt: { $gte: inizioMese }
      });
      
      const valoreMese = await Ordine.aggregate([
        { $match: { createdAt: { $gte: inizioMese } } },
        { $group: { _id: null, totale: { $sum: '$totale' } } }
      ]);
      
      res.json({
        ordiniOggi,
        valoreOggi: valoreOggi[0]?.totale || 0,
        ordiniSettimana,
        valoreSettimana: valoreSettimana[0]?.totale || 0,
        ordiniMese,
        valoreMese: valoreMese[0]?.totale || 0,
        ticketMedio: ordiniOggi > 0 ? (valoreOggi[0]?.totale || 0) / ordiniOggi : 0
      });
    } catch (error) {
      logger.error('Errore getStatisticheGenerali:', error);
      res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
    }
  },

  // ✅ NUOVO 12/03/2026: Riepilogo produzione per data (usato in NuovoOrdine)
  getProduzioneSommario: async (req, res) => {
    try {
      const { data } = req.query;
      if (!data) return res.status(400).json({ error: 'Parametro data richiesto (YYYY-MM-DD)' });

      // Cerca ordini per data - triplice copertura per tutti i formati storici
      // 1) Stringa "2026-04-04" o "2026-04-04T..."
      // 2) Date UTC+1 (Europe/Rome)
      // 3) Date UTC puro
      const inizioITA = new Date(data + 'T00:00:00+02:00');
      const fineITA   = new Date(data + 'T23:59:59+02:00');

      const ordini = await Ordine.find({
        $or: [
          { dataRitiro: { $regex: `^${data}` } },
          { dataRitiro: { $gte: inizioITA, $lte: fineITA } },
          { dataRitiro: { $gte: new Date(data + 'T00:00:00.000Z'), $lte: new Date(data + 'T23:59:59.999Z') } }
        ],
        stato: { $nin: ['annullato', 'cancellato'] }
      }).lean();

      logger.info(`[produzione] data=${data} ordini trovati=${ordini.length}`);

      const PEZZI_PER_KG = {
        'ravioli': 30, 'culurgion': 32, 'pardula': 25,
        'amarett': 35, 'bianchin': 100, 'papassin': 30, 'pabassine': 30, 'pabassinas': 30,
        'gueff': 65, 'ciambelle': 30, 'ciambella': 30, 'sebada': 10,
        'panadine': 20, 'panada': 4, 'pizzette': 30, 'zeppol': 24
      };

      const convertiInKg = (prodotto) => {
        const unita = (prodotto.unita || 'kg').toLowerCase();
        const quantita = parseFloat(prodotto.quantita) || 0;
        const nomeLC = (prodotto.nome || '').toLowerCase();
        if (unita === '€' || unita === 'euro') {
          return nomeLC.includes('zeppol') ? quantita / 21 : 0;
        }
        if (unita === 'kg' || unita === 'kilogrammi') return quantita;
        if (unita === 'pezzi' || unita === 'pz') {
          for (const [chiave, pezziKg] of Object.entries(PEZZI_PER_KG)) {
            if (nomeLC.includes(chiave)) return quantita / pezziKg;
          }
          return quantita / 30;
        }
        if (unita === 'vassoio' && prodotto.dettagliCalcolo?.composizione) {
          const numV = parseFloat(prodotto.quantita) || 1;
          return (prodotto.dettagliCalcolo.composizione || []).reduce((acc, comp) => {
            const cU = (comp.unita || '').toLowerCase();
            if (cU === 'kg') return acc + (comp.quantita || 0) * numV;
            if (cU === 'pezzi' || cU === 'pz') {
              const cN = (comp.nome || '').toLowerCase();
              for (const [chiave, pezziKg] of Object.entries(PEZZI_PER_KG)) {
                if (cN.includes(chiave)) return acc + (comp.quantita || 0) / pezziKg * numV;
              }
              return acc + (comp.quantita || 0) / 30 * numV;
            }
            return acc;
          }, 0);
        }
        return 0;
      };

      const classificaCategoria = (nomeLC) => {
        if (nomeLC.includes('ravioli') || nomeLC.includes('culurgion')) return 'ravioli';
        if (nomeLC.includes('pardula')) return 'pardulas';
        if (nomeLC.includes('zeppol')) return 'zeppole';
        if (nomeLC.includes('panadine')) return 'panadine';
        if (nomeLC.includes('pasta per panada') || nomeLC === 'pasta panada') return 'pasta';
        if (nomeLC.includes('panada')) return 'panadas';
        if (nomeLC.includes('sebada')) return 'sebadas';
        if (nomeLC.includes('ciambelle') || nomeLC.includes('ciambella') ||
            nomeLC.includes('amarett') || nomeLC.includes('gueff') ||
            nomeLC.includes('bianchin') || nomeLC.includes('pabassine') ||
            nomeLC.includes('papassin')) return 'dolci';
        return 'altri';
      };

      const COMPOSIZIONE_DOLCI_MISTI = { pardulas: 0.40, ciambelle: 0.25, amaretti: 0.15, gueffus: 0.05, pabassine: 0.05, bianchini: 0.03 };

      const totali = { ravioli: 0, pardulas: 0, dolci: 0, panadas: 0, panadine: 0, zeppole: 0, sebadas: 0, pasta: 0, altri: 0 };
      const dettaglioRavioli = {};
      const dettaglioDolci = {};
      const dettaglioPanadas = {};

      ordini.forEach(ordine => {
        (ordine.prodotti || []).forEach(prodotto => {
          if (prodotto.statoProduzione === 'completato' || prodotto.statoProduzione === 'consegnato' || prodotto.statoProduzione === 'in_lavorazione') return;

          const nomeLC = (prodotto.nome || '').toLowerCase();
          const peso = convertiInKg(prodotto);
          if (peso <= 0) return;

          // Vassoio dolci misti
          if (nomeLC.includes('vassoio') && prodotto.dettagliCalcolo?.composizione) {
            const numV = parseFloat(prodotto.quantita) || 1;
            (prodotto.dettagliCalcolo.composizione || []).forEach(comp => {
              const cN = (comp.nome || '').toLowerCase();
              let cP = 0;
              const cU = (comp.unita || '').toLowerCase();
              if (cU === 'kg') cP = (comp.quantita || 0) * numV;
              else {
                for (const [chiave, pezziKg] of Object.entries(PEZZI_PER_KG)) {
                  if (cN.includes(chiave)) { cP = (comp.quantita || 0) / pezziKg * numV; break; }
                }
                if (!cP) cP = (comp.quantita || 0) / 30 * numV;
              }
              totali.dolci += cP;
              if (cN.includes('pardula')) totali.pardulas += cP;
              dettaglioDolci[comp.nome || cN] = (dettaglioDolci[comp.nome || cN] || 0) + cP;
            });
            return;
          }

          // Dolci misti senza vassoio
          if ((nomeLC.includes('dolci mix') || nomeLC.includes('dolci misti')) && !nomeLC.includes('vassoio')) {
            for (const [comp, perc] of Object.entries(COMPOSIZIONE_DOLCI_MISTI)) {
              totali.dolci += peso * perc;
              if (comp === 'pardulas') totali.pardulas += peso * perc;
            }
            return;
          }

          const cat = classificaCategoria(nomeLC);
          totali[cat] = (totali[cat] || 0) + peso;

          if (cat === 'ravioli') {
            const variante = (prodotto.variante || '').trim() || 'ricotta';
            dettaglioRavioli[variante] = (dettaglioRavioli[variante] || 0) + peso;
          }
          if (cat === 'dolci') {
            dettaglioDolci[prodotto.nome || nomeLC] = (dettaglioDolci[prodotto.nome || nomeLC] || 0) + peso;
          }
          if (cat === 'panadas') {
            const farcitura = nomeLC.includes('agnello') ? 'Agnello' : nomeLC.includes('maiale') ? 'Maiale' : nomeLC.includes('vitella') ? 'Vitella' : nomeLC.includes('verdur') ? 'Verdure' : nomeLC.includes('anguill') ? 'Anguille' : 'Altra';
            dettaglioPanadas[farcitura] = (dettaglioPanadas[farcitura] || 0) + peso;
          }
        });
      });

      const totaleGenerale = Object.values(totali).reduce((a, b) => a + b, 0);

      res.json({
        data,
        totali,
        dettaglio: { ravioli: dettaglioRavioli, dolci: dettaglioDolci, panadas: dettaglioPanadas },
        totaleGenerale,
        numeroOrdini: ordini.length
      });
    } catch (error) {
      logger.error('Errore getProduzioneSommario:', error);
      res.status(500).json({ error: 'Errore nel recupero riepilogo produzione' });
    }
  },

  // Ottiene KPI principali
  getKPI: async (req, res) => {
    try {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const domani = new Date(oggi);
      domani.setDate(domani.getDate() + 1);
      
      const ordiniTotali = await Ordine.countDocuments({
        createdAt: { $gte: oggi, $lt: domani }
      });
      
      const ordiniCompletati = await Ordine.countDocuments({
        createdAt: { $gte: oggi, $lt: domani },
        stato: 'completato'
      });
      
      const aggregazione = await Ordine.aggregate([
        { $match: { createdAt: { $gte: oggi, $lt: domani } } },
        { 
          $group: { 
            _id: null, 
            valoreTotale: { $sum: '$totale' },
            count: { $sum: 1 }
          } 
        }
      ]);
      
      const valoreTotale = aggregazione[0]?.valoreTotale || 0;
      const ticketMedio = aggregazione[0]?.count > 0 
        ? valoreTotale / aggregazione[0].count 
        : 0;
      
      const tassoCompletamento = ordiniTotali > 0 
        ? Math.round((ordiniCompletati / ordiniTotali) * 100)
        : 0;
      
      res.json({
        ordiniTotali,
        valoreTotale,
        ticketMedio,
        tassoCompletamento
      });
    } catch (error) {
      logger.error('Errore getKPI:', error);
      res.status(500).json({ error: 'Errore nel recupero dei KPI' });
    }
  }
};

export default dashboardController;