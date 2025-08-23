import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';

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

