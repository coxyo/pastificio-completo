// routes/statistiche.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import Chiamata from '../models/Chiamata.js';
import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';

const router = express.Router();

// Middleware di autenticazione
router.use(protect);

/**
 * @route   GET /api/statistiche/chiamate
 * @desc    Ottieni statistiche complete sulle chiamate
 * @access  Privato
 * @query   ?periodo=oggi|settimana|mese|anno&dataInizio=YYYY-MM-DD&dataFine=YYYY-MM-DD
 */
router.get('/chiamate', async (req, res) => {
  try {
    const { periodo, dataInizio, dataFine } = req.query;
    
    // Calcola range date basato sul periodo
    let startDate, endDate = new Date();
    
    if (periodo) {
      switch (periodo) {
        case 'oggi':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'settimana':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'mese':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'anno':
          startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0); // Tutte le chiamate
      }
    } else if (dataInizio) {
      startDate = new Date(dataInizio);
      if (dataFine) endDate = new Date(dataFine);
    } else {
      // Default: ultimo mese
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const filtroData = {
      dataChiamata: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // 1. KPI PRINCIPALI
    const totaleChiamate = await Chiamata.countDocuments(filtroData);
    
    const chiamatePerEsito = await Chiamata.aggregate([
      { $match: filtroData },
      { $group: { _id: '$esito', count: { $sum: 1 } } }
    ]);

    const chiamateConOrdine = await Chiamata.countDocuments({
      ...filtroData,
      ordineGenerato: { $exists: true, $ne: null }
    });

    const tassoConversione = totaleChiamate > 0 
      ? ((chiamateConOrdine / totaleChiamate) * 100).toFixed(2)
      : 0;

    // 2. CHIAMATE PER GIORNO (ultimi 30 giorni per grafico)
    const ultimiGiorni = new Date();
    ultimiGiorni.setDate(ultimiGiorni.getDate() - 30);

    const chiamatePerGiorno = await Chiamata.aggregate([
      { 
        $match: { 
          dataChiamata: { $gte: ultimiGiorni } 
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$dataChiamata' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. CHIAMATE PER TAG
    const chiamatePerTag = await Chiamata.aggregate([
      { $match: filtroData },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 4. DISTRIBUZIONE ORARIA
    const distribuzioneOraria = await Chiamata.aggregate([
      { $match: filtroData },
      {
        $group: {
          _id: { $hour: '$dataChiamata' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 5. TOP 5 CLIENTI CHE CHIAMANO
    const topClienti = await Chiamata.aggregate([
      { 
        $match: { 
          ...filtroData,
          cliente: { $exists: true, $ne: null }
        } 
      },
      { $group: { _id: '$cliente', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'clientes',
          localField: '_id',
          foreignField: '_id',
          as: 'clienteInfo'
        }
      },
      { $unwind: '$clienteInfo' },
      {
        $project: {
          _id: 1,
          count: 1,
          nome: '$clienteInfo.nome',
          cognome: '$clienteInfo.cognome',
          telefono: '$clienteInfo.telefono'
        }
      }
    ]);

    // 6. DURATA MEDIA CHIAMATE
    const durataMedia = await Chiamata.aggregate([
      { $match: filtroData },
      {
        $group: {
          _id: null,
          durataMedia: { $avg: '$durataChiamata' },
          durataTotale: { $sum: '$durataChiamata' }
        }
      }
    ]);

    // 7. VALORE MEDIO ORDINI DA CHIAMATE
    const ordiniDaChiamate = await Chiamata.aggregate([
      {
        $match: {
          ...filtroData,
          ordineGenerato: { $exists: true, $ne: null }
        }
      },
      {
        $lookup: {
          from: 'ordines',
          localField: 'ordineGenerato',
          foreignField: '_id',
          as: 'ordine'
        }
      },
      { $unwind: '$ordine' },
      {
        $group: {
          _id: null,
          valoreMedio: { $avg: '$ordine.totale' },
          valoreTotale: { $sum: '$ordine.totale' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 8. TREND SETTIMANALE (confronto con settimana precedente)
    const settimanaScorsa = new Date();
    settimanaScorsa.setDate(settimanaScorsa.getDate() - 14);
    const inizioSettimanaScorsa = new Date(settimanaScorsa);
    inizioSettimanaScorsa.setDate(inizioSettimanaScorsa.getDate() - 7);

    const chiamateSettimanaCorrente = await Chiamata.countDocuments({
      dataChiamata: { $gte: settimanaScorsa, $lte: new Date() }
    });

    const chiamateSettimanaPrecedente = await Chiamata.countDocuments({
      dataChiamata: { $gte: inizioSettimanaScorsa, $lte: settimanaScorsa }
    });

    const variazioneTrend = chiamateSettimanaPrecedente > 0
      ? (((chiamateSettimanaCorrente - chiamateSettimanaPrecedente) / chiamateSettimanaPrecedente) * 100).toFixed(2)
      : 0;

    // Componi risposta
    const statistiche = {
      periodo: {
        inizio: startDate.toISOString(),
        fine: endDate.toISOString(),
        descrizione: periodo || 'personalizzato'
      },
      kpi: {
        totaleChiamate,
        chiamateRisposte: chiamatePerEsito.find(e => e._id === 'risposto')?.count || 0,
        chiamateNonRisposte: chiamatePerEsito.find(e => e._id === 'non-risposto')?.count || 0,
        chiamateConOrdine,
        tassoConversione: parseFloat(tassoConversione),
        mediaGiornaliera: (totaleChiamate / Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))).toFixed(2)
      },
      trend: {
        chiamateSettimanaCorrente,
        chiamateSettimanaPrecedente,
        variazione: parseFloat(variazioneTrend),
        direzione: variazioneTrend > 0 ? 'crescita' : variazioneTrend < 0 ? 'calo' : 'stabile'
      },
      grafici: {
        chiamatePerGiorno,
        chiamatePerTag,
        distribuzioneOraria,
        chiamatePerEsito
      },
      topClienti,
      durata: durataMedia[0] || { durataMedia: 0, durataTotale: 0 },
      ordini: ordiniDaChiamate[0] || { valoreMedio: 0, valoreTotale: 0, count: 0 }
    };

    logger.info('Statistiche chiamate generate:', {
      periodo: periodo || 'custom',
      totale: totaleChiamate,
      user: req.user?._id
    });

    res.json({
      success: true,
      data: statistiche
    });

  } catch (error) {
    logger.error('Errore generazione statistiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella generazione delle statistiche',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/statistiche/chiamate/export
 * @desc    Esporta statistiche in formato CSV
 * @access  Privato
 */
router.get('/chiamate/export', async (req, res) => {
  try {
    const chiamate = await Chiamata.find()
      .populate('cliente', 'nome cognome codiceCliente')
      .sort('-dataChiamata')
      .lean();

    // Genera CSV
    const csv = [
      ['Data', 'Ora', 'Numero', 'Cliente', 'Esito', 'Tags', 'Durata (sec)', 'Ordine Generato', 'Note'].join(','),
      ...chiamate.map(c => [
        new Date(c.dataChiamata).toLocaleDateString('it-IT'),
        new Date(c.dataChiamata).toLocaleTimeString('it-IT'),
        c.numeroTelefono,
        c.cliente ? `${c.cliente.nome} ${c.cliente.cognome}` : 'Sconosciuto',
        c.esito,
        c.tags.join('; '),
        c.durataChiamata || 0,
        c.ordineGenerato ? 'Sì' : 'No',
        (c.note || '').replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=chiamate_${new Date().toISOString().split('T')[0]}.csv`);
    res.send('\uFEFF' + csv); // BOM per Excel UTF-8

    logger.info('Export chiamate CSV generato', {
      totale: chiamate.length,
      user: req.user?._id
    });

  } catch (error) {
    logger.error('Errore export CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'export CSV',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/statistiche/chiamate/riepilogo
 * @desc    Riepilogo rapido ultimi 7 giorni
 * @access  Privato
 */
router.get('/chiamate/riepilogo', async (req, res) => {
  try {
    const setteGiorniFa = new Date();
    setteGiorniFa.setDate(setteGiorniFa.getDate() - 7);

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const riepilogo = {
      oggi: await Chiamata.countDocuments({
        dataChiamata: { $gte: oggi }
      }),
      ultimi7giorni: await Chiamata.countDocuments({
        dataChiamata: { $gte: setteGiorniFa }
      }),
      oggiConOrdine: await Chiamata.countDocuments({
        dataChiamata: { $gte: oggi },
        ordineGenerato: { $exists: true, $ne: null }
      })
    };

    res.json({
      success: true,
      data: riepilogo
    });

  } catch (error) {
    logger.error('Errore riepilogo chiamate:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel riepilogo',
      error: error.message
    });
  }
});

export default router;