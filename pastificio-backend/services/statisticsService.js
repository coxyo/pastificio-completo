// services/statisticsService.js
import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { it } from 'date-fns/locale';

class StatisticsService {
  // Statistiche vendite per periodo
  async getVenditePeriodo(startDate, endDate) {
    try {
      const ordini = await Ordine.find({
        dataRitiro: {
          $gte: startDate,
          $lte: endDate
        },
        stato: { $ne: 'annullato' }
      });

      const stats = {
        numeroOrdini: ordini.length,
        totaleVendite: 0,
        mediaOrdine: 0,
        prodottiVenduti: {},
        clientiUnici: new Set(),
        giorni: {}
      };

      ordini.forEach(ordine => {
        // Totale vendite
        stats.totaleVendite += ordine.totale || 0;
        
        // Clienti unici
        stats.clientiUnici.add(ordine.nomeCliente);
        
        // Prodotti venduti
        ordine.prodotti?.forEach(prod => {
          if (!stats.prodottiVenduti[prod.nome]) {
            stats.prodottiVenduti[prod.nome] = {
              quantita: 0,
              valore: 0,
              ordini: 0
            };
          }
          stats.prodottiVenduti[prod.nome].quantita += prod.quantita || 0;
          stats.prodottiVenduti[prod.nome].valore += (prod.quantita * prod.prezzo) || 0;
          stats.prodottiVenduti[prod.nome].ordini += 1;
        });

        // Statistiche per giorno
        const giorno = format(new Date(ordine.dataRitiro), 'yyyy-MM-dd');
        if (!stats.giorni[giorno]) {
          stats.giorni[giorno] = { ordini: 0, totale: 0 };
        }
        stats.giorni[giorno].ordini += 1;
        stats.giorni[giorno].totale += ordine.totale || 0;
      });

      stats.mediaOrdine = stats.numeroOrdini > 0 ? stats.totaleVendite / stats.numeroOrdini : 0;
      stats.numeroClienti = stats.clientiUnici.size;

      return stats;
    } catch (error) {
      logger.error('Errore calcolo statistiche vendite:', error);
      throw error;
    }
  }

  // Top prodotti
  async getTopProdotti(limit = 10, periodo = 'mese') {
    try {
      let startDate = new Date();
      
      switch (periodo) {
        case 'giorno':
          startDate = startOfDay(new Date());
          break;
        case 'settimana':
          startDate = startOfWeek(new Date(), { locale: it });
          break;
        case 'mese':
          startDate = startOfMonth(new Date());
          break;
        case 'anno':
          startDate = new Date(new Date().getFullYear(), 0, 1);
          break;
      }

      const result = await Ordine.aggregate([
        {
          $match: {
            dataRitiro: { $gte: startDate },
            stato: { $ne: 'annullato' }
          }
        },
        { $unwind: '$prodotti' },
        {
          $group: {
            _id: '$prodotti.nome',
            quantitaTotale: { $sum: '$prodotti.quantita' },
            valoreTotale: { 
              $sum: { 
                $multiply: ['$prodotti.quantita', '$prodotti.prezzo'] 
              } 
            },
            numeroOrdini: { $sum: 1 },
            categoria: { $first: '$prodotti.categoria' }
          }
        },
        { $sort: { valoreTotale: -1 } },
        { $limit: limit }
      ]);

      return result.map(item => ({
        nome: item._id,
        quantita: item.quantitaTotale,
        valore: item.valoreTotale,
        ordini: item.numeroOrdini,
        categoria: item.categoria
      }));

    } catch (error) {
      logger.error('Errore calcolo top prodotti:', error);
      throw error;
    }
  }

  // Top clienti
  async getTopClienti(limit = 10, periodo = 'mese') {
    try {
      let startDate = new Date();
      
      switch (periodo) {
        case 'settimana':
          startDate = startOfWeek(new Date(), { locale: it });
          break;
        case 'mese':
          startDate = startOfMonth(new Date());
          break;
        case 'anno':
          startDate = new Date(new Date().getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0); // Tutti i tempi
      }

      const result = await Ordine.aggregate([
        {
          $match: {
            dataRitiro: { $gte: startDate },
            stato: { $ne: 'annullato' }
          }
        },
        {
          $group: {
            _id: '$nomeCliente',
            numeroOrdini: { $sum: 1 },
            totaleSpeso: { $sum: '$totale' },
            primoOrdine: { $min: '$dataRitiro' },
            ultimoOrdine: { $max: '$dataRitiro' },
            telefono: { $first: '$telefono' }
          }
        },
        {
          $project: {
            cliente: '$_id',
            numeroOrdini: 1,
            totaleSpeso: 1,
            mediaOrdine: { $divide: ['$totaleSpeso', '$numeroOrdini'] },
            primoOrdine: 1,
            ultimoOrdine: 1,
            telefono: 1
          }
        },
        { $sort: { totaleSpeso: -1 } },
        { $limit: limit }
      ]);

      return result;
    } catch (error) {
      logger.error('Errore calcolo top clienti:', error);
      throw error;
    }
  }

  // Trend vendite
  async getTrendVendite(giorni = 30) {
    try {
      const endDate = endOfDay(new Date());
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - giorni);

      const ordini = await Ordine.find({
        dataRitiro: {
          $gte: startDate,
          $lte: endDate
        },
        stato: { $ne: 'annullato' }
      }).sort({ dataRitiro: 1 });

      const trend = {};
      
      // Inizializza tutti i giorni
      for (let i = 0; i <= giorni; i++) {
        const data = new Date();
        data.setDate(data.getDate() - (giorni - i));
        const key = format(data, 'yyyy-MM-dd');
        trend[key] = {
          data: format(data, 'dd/MM'),
          ordini: 0,
          totale: 0
        };
      }

      // Popola con dati reali
      ordini.forEach(ordine => {
        const key = format(new Date(ordine.dataRitiro), 'yyyy-MM-dd');
        if (trend[key]) {
          trend[key].ordini += 1;
          trend[key].totale += ordine.totale || 0;
        }
      });

      return Object.values(trend);
    } catch (error) {
      logger.error('Errore calcolo trend vendite:', error);
      throw error;
    }
  }

  // Previsioni vendite (semplice media mobile)
  async getPrevisioniVendite(giorniPrevisione = 7) {
    try {
      // Prendi dati degli ultimi 30 giorni
      const trend = await this.getTrendVendite(30);
      
      // Calcola media mobile a 7 giorni
      const mediaSettimanale = trend.slice(-7).reduce((sum, day) => ({
        ordini: sum.ordini + day.ordini,
        totale: sum.totale + day.totale
      }), { ordini: 0, totale: 0 });

      mediaSettimanale.ordini /= 7;
      mediaSettimanale.totale /= 7;

      // Genera previsioni
      const previsioni = [];
      for (let i = 1; i <= giorniPrevisione; i++) {
        const data = new Date();
        data.setDate(data.getDate() + i);
        
        // Applica variazione stagionale (es. weekend)
        const dayOfWeek = data.getDay();
        let fattoreMoltiplicativo = 1;
        
        if (dayOfWeek === 0) fattoreMoltiplicativo = 1.3; // Domenica
        if (dayOfWeek === 6) fattoreMoltiplicativo = 1.2; // Sabato
        
        previsioni.push({
          data: format(data, 'dd/MM'),
          ordiniPrevisti: Math.round(mediaSettimanale.ordini * fattoreMoltiplicativo),
          totalePrevisto: Math.round(mediaSettimanale.totale * fattoreMoltiplicativo)
        });
      }

      return {
        previsioni,
        mediaSettimanale,
        affidabilita: 'Media' // Potresti calcolare questo basandoti sulla varianza dei dati
      };

    } catch (error) {
      logger.error('Errore calcolo previsioni:', error);
      throw error;
    }
  }

  // Report completo
  async getReportCompleto(periodo = 'mese') {
    try {
      let startDate;
      const endDate = endOfDay(new Date());
      
      switch (periodo) {
        case 'giorno':
          startDate = startOfDay(new Date());
          break;
        case 'settimana':
          startDate = startOfWeek(new Date(), { locale: it });
          break;
        case 'mese':
          startDate = startOfMonth(new Date());
          break;
        case 'anno':
          startDate = new Date(new Date().getFullYear(), 0, 1);
          break;
      }

      const [vendite, topProdotti, topClienti, trend] = await Promise.all([
        this.getVenditePeriodo(startDate, endDate),
        this.getTopProdotti(5, periodo),
        this.getTopClienti(5, periodo),
        this.getTrendVendite(periodo === 'giorno' ? 7 : 30)
      ]);

      return {
        periodo: {
          tipo: periodo,
          inizio: startDate,
          fine: endDate
        },
        vendite,
        topProdotti,
        topClienti,
        trend,
        generatoIl: new Date()
      };

    } catch (error) {
      logger.error('Errore generazione report completo:', error);
      throw error;
    }
  }
}

export default new StatisticsService();
