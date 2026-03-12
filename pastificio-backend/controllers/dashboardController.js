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

      // dataRitiro è campo Date in MongoDB → solo range $gte/$lte, NO $regex
      // Range copre l'intera giornata italiana (UTC+1 inverno, UTC+2 estate)
      // Usiamo UTC-2/+2 come margine sicuro per coprire entrambi i fusi
      const inizioGiorno = new Date(data + 'T00:00:00.000+02:00');
      const fineGiorno   = new Date(data + 'T23:59:59.999+02:00');

      const ordini = await Ordine.find({
        dataRitiro: { $gte: inizioGiorno, $lte: fineGiorno },
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
          // Mappa keyword → prezzoKg (da PRODOTTI_CONFIG)
          const PREZZI_EURO_KG = [
            { keys: ['ravioli', 'culurgion'],                          prezzoKg: 11 },
            { keys: ['culurgion'],                                     prezzoKg: 16 },
            { keys: ['pardula'],                                       prezzoKg: 20 },
            { keys: ['ciambelle', 'ciambella', 'chiaccher'],           prezzoKg: 17 },
            { keys: ['amarett'],                                       prezzoKg: 22 },
            { keys: ['papassin', 'pabassine', 'pabassinas'],           prezzoKg: 22 },
            { keys: ['gueff'],                                         prezzoKg: 22 },
            { keys: ['bianchin'],                                      prezzoKg: 15 },
            { keys: ['zeppol'],                                        prezzoKg: 21 },
            { keys: ['torta di saba', 'torta'],                        prezzoKg: 26 },
            { keys: ['dolci misti', 'dolci mix'],                      prezzoKg: 19 },
            { keys: ['panada anguill'],                                prezzoKg: 30 },
            { keys: ['panada di agnello', 'panada agnello'],           prezzoKg: 25 },
            { keys: ['panada di maiale', 'panada maiale'],             prezzoKg: 21 },
            { keys: ['panada di vitella', 'panada vitella'],           prezzoKg: 23 },
            { keys: ['panada di verdur', 'panada verdur'],             prezzoKg: 17 },
            { keys: ['panadine'],                                      prezzoKg: 28 },
            { keys: ['pasta per panada', 'pasta panada'],              prezzoKg:  5 },
            { keys: ['pizzette'],                                      prezzoKg: 16 },
            { keys: ['fregula', 'fregola'],                            prezzoKg: 10 },
          ];
          // Culurgiones ha prezzoKg specifico - controlla prima
          if (nomeLC.includes('culurgion')) return quantita / 16;
          for (const { keys, prezzoKg } of PREZZI_EURO_KG) {
            if (keys.some(k => nomeLC.includes(k))) return quantita / prezzoKg;
          }
          return 0; // prodotto in € non mappato → ignora
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

          // Vassoio dolci misti - logica identica a GestoreOrdini:
          // ogni componente va nella sua categoria (pardulas→pardulas, ciambelle→dolci, ecc.)
          // NON esiste un totali.dolci per il vassoio, Dolci = Ciambelle+Amaretti+Gueffus+Bianchini+Pabassine
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
              // Classifica ogni componente nella sua categoria (come GestoreOrdini)
              if (cN.includes('pardula'))                                         { totali.pardulas += cP; }
              else if (cN.includes('ciambelle') || cN.includes('ciambella'))      { totali.dolci += cP; dettaglioDolci[comp.nome||cN] = (dettaglioDolci[comp.nome||cN]||0)+cP; }
              else if (cN.includes('amarett'))                                    { totali.dolci += cP; dettaglioDolci[comp.nome||cN] = (dettaglioDolci[comp.nome||cN]||0)+cP; }
              else if (cN.includes('gueff'))                                      { totali.dolci += cP; dettaglioDolci[comp.nome||cN] = (dettaglioDolci[comp.nome||cN]||0)+cP; }
              else if (cN.includes('bianchin'))                                   { totali.dolci += cP; dettaglioDolci[comp.nome||cN] = (dettaglioDolci[comp.nome||cN]||0)+cP; }
              else if (cN.includes('pabassine') || cN.includes('papassin'))       { totali.dolci += cP; dettaglioDolci[comp.nome||cN] = (dettaglioDolci[comp.nome||cN]||0)+cP; }
            });
            return;
          }

          // Dolci misti senza vassoio - esplodi per composizione standard
          // pardulas → totali.pardulas, il resto → totali.dolci (come GestoreOrdini)
          if ((nomeLC.includes('dolci mix') || nomeLC.includes('dolci misti')) && !nomeLC.includes('vassoio')) {
            for (const [comp, perc] of Object.entries(COMPOSIZIONE_DOLCI_MISTI)) {
              if (comp === 'pardulas') totali.pardulas += peso * perc;
              else totali.dolci += peso * perc;
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