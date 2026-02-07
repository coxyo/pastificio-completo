// routes/rintracciabilita.js - API RINTRACCIABILITÀ HACCP
import express from 'express';
import { protect } from '../middleware/auth.js';
import Ingrediente from '../models/Ingrediente.js';
import Movimento from '../models/Movimento.js';
import logger from '../config/logger.js';

const router = express.Router();

// Middleware autenticazione
router.use(protect);

/**
 * GET /api/rintracciabilita
 * Ottieni tabella rintracciabilità completa
 */
router.get('/', async (req, res) => {
  try {
    const { 
      dataInizio, 
      dataFine, 
      fornitore, 
      categoria,
      ingrediente,
      lotto,
      soloInScadenza,
      soloScaduti,
      limit = 100,
      skip = 0 
    } = req.query;
    
    // Query base
    const query = { attivo: true };
    
    if (categoria) {
      query.categoria = categoria;
    }
    
    if (ingrediente) {
      query.nome = { $regex: ingrediente, $options: 'i' };
    }
    
    // Trova tutti gli ingredienti con i loro lotti
    let ingredienti = await Ingrediente.find(query)
      .sort({ nome: 1 })
      .lean();
    
    // Costruisci tabella rintracciabilità
    const tabella = [];
    const oggi = new Date();
    
    for (const ing of ingredienti) {
      if (!ing.lotti || ing.lotti.length === 0) continue;
      
      for (const lottoItem of ing.lotti) {
        // Filtri data
        if (dataInizio && new Date(lottoItem.dataArrivo) < new Date(dataInizio)) continue;
        if (dataFine && new Date(lottoItem.dataArrivo) > new Date(dataFine)) continue;
        
        // Filtro fornitore
        if (fornitore && lottoItem.fornitore?.ragioneSociale?.toLowerCase().indexOf(fornitore.toLowerCase()) === -1) continue;
        
        // Filtro lotto
        if (lotto && lottoItem.codiceLotto?.toLowerCase().indexOf(lotto.toLowerCase()) === -1) continue;
        
        // Calcola giorni alla scadenza
        const giorniAllaScadenza = lottoItem.dataScadenza 
          ? Math.ceil((new Date(lottoItem.dataScadenza) - oggi) / (1000 * 60 * 60 * 24))
          : null;
        
        // Filtri scadenza
        if (soloInScadenza === 'true' && (giorniAllaScadenza === null || giorniAllaScadenza > 30)) continue;
        if (soloScaduti === 'true' && (giorniAllaScadenza === null || giorniAllaScadenza > 0)) continue;
        
        tabella.push({
          _id: `${ing._id}-${lottoItem.codiceLotto}`,
          ingredienteId: ing._id,
          ingrediente: ing.nome,
          categoria: ing.categoria,
          codiceLotto: lottoItem.codiceLotto,
          dataArrivo: lottoItem.dataArrivo,
          dataScadenza: lottoItem.dataScadenza,
          giorniAllaScadenza,
          quantitaIniziale: lottoItem.quantitaIniziale,
          quantitaAttuale: lottoItem.quantitaAttuale,
          unitaMisura: lottoItem.unitaMisura || ing.unitaMisura,
          prezzoUnitario: lottoItem.prezzoUnitario,
          valoreTotale: (lottoItem.prezzoUnitario || 0) * (lottoItem.quantitaAttuale || 0),
          fornitore: lottoItem.fornitore?.ragioneSociale || 'N/D',
          partitaIvaFornitore: lottoItem.fornitore?.partitaIVA || '',
          documentoOrigine: {
            tipo: lottoItem.documentoOrigine?.tipo || 'fattura',
            numero: lottoItem.documentoOrigine?.numero || '',
            data: lottoItem.documentoOrigine?.data
          },
          lottoFornitore: lottoItem.lottoFornitore?.codice || '',
          stato: lottoItem.stato,
          utilizziCount: lottoItem.utilizzi?.length || 0,
          // Alert scadenza
          alertScadenza: giorniAllaScadenza !== null && giorniAllaScadenza <= 7 ? 
            (giorniAllaScadenza <= 0 ? 'scaduto' : giorniAllaScadenza <= 3 ? 'urgente' : 'attenzione') 
            : null
        });
      }
    }
    
    // Ordinamento default: per data arrivo decrescente
    tabella.sort((a, b) => new Date(b.dataArrivo) - new Date(a.dataArrivo));
    
    // Paginazione
    const totale = tabella.length;
    const tabellaPage = tabella.slice(parseInt(skip), parseInt(skip) + parseInt(limit));
    
    // Statistiche
    const stats = {
      totaleRighe: totale,
      totaleLotti: tabella.length,
      lottiInScadenza: tabella.filter(r => r.giorniAllaScadenza !== null && r.giorniAllaScadenza <= 30 && r.giorniAllaScadenza > 0).length,
      lottiScaduti: tabella.filter(r => r.giorniAllaScadenza !== null && r.giorniAllaScadenza <= 0).length,
      valoreTotale: tabella.reduce((sum, r) => sum + (r.valoreTotale || 0), 0),
      categorie: [...new Set(tabella.map(r => r.categoria))],
      fornitori: [...new Set(tabella.map(r => r.fornitore).filter(f => f !== 'N/D'))]
    };
    
    res.json({
      success: true,
      data: tabellaPage,
      stats,
      pagination: {
        totale,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pagine: Math.ceil(totale / parseInt(limit))
      }
    });
    
  } catch (error) {
    logger.error('Errore recupero rintracciabilità:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero della rintracciabilità'
    });
  }
});

/**
 * GET /api/rintracciabilita/lotto/:codiceLotto
 * Dettaglio completo di un lotto specifico
 */
router.get('/lotto/:codiceLotto', async (req, res) => {
  try {
    const { codiceLotto } = req.params;
    
    // Trova ingrediente con questo lotto
    const ingrediente = await Ingrediente.findOne({
      'lotti.codiceLotto': codiceLotto
    }).lean();
    
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        error: 'Lotto non trovato'
      });
    }
    
    const lotto = ingrediente.lotti.find(l => l.codiceLotto === codiceLotto);
    
    // Trova movimenti collegati a questo lotto
    const movimenti = await Movimento.find({
      lotto: codiceLotto
    }).sort({ dataMovimento: -1 }).lean();
    
    const oggi = new Date();
    const giorniAllaScadenza = lotto.dataScadenza 
      ? Math.ceil((new Date(lotto.dataScadenza) - oggi) / (1000 * 60 * 60 * 24))
      : null;
    
    res.json({
      success: true,
      data: {
        ingrediente: {
          id: ingrediente._id,
          nome: ingrediente.nome,
          categoria: ingrediente.categoria
        },
        lotto: {
          ...lotto,
          giorniAllaScadenza,
          percentualeUtilizzata: lotto.quantitaIniziale > 0 
            ? ((lotto.quantitaIniziale - lotto.quantitaAttuale) / lotto.quantitaIniziale * 100).toFixed(2)
            : 0
        },
        movimenti,
        rintracciabilitaCompleta: {
          fornitore: lotto.fornitore,
          documentoOrigine: lotto.documentoOrigine,
          lottoFornitore: lotto.lottoFornitore,
          utilizzi: lotto.utilizzi || []
        }
      }
    });
    
  } catch (error) {
    logger.error('Errore dettaglio lotto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del dettaglio lotto'
    });
  }
});

/**
 * GET /api/rintracciabilita/scadenze
 * Lista lotti in scadenza per alert
 */
router.get('/scadenze', async (req, res) => {
  try {
    const { giorni = 30 } = req.query;
    
    const oggi = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(oggi.getDate() + parseInt(giorni));
    
    const ingredienti = await Ingrediente.find({
      attivo: true,
      'lotti.stato': { $in: ['disponibile', 'in_uso'] },
      'lotti.dataScadenza': { $lte: dataLimite }
    }).lean();
    
    const lottiInScadenza = [];
    
    for (const ing of ingredienti) {
      for (const lotto of ing.lotti) {
        if (!lotto.dataScadenza) continue;
        if (lotto.stato === 'scaduto' || lotto.stato === 'richiamato') continue;
        
        const dataScadenza = new Date(lotto.dataScadenza);
        if (dataScadenza > dataLimite) continue;
        
        const giorniRimanenti = Math.ceil((dataScadenza - oggi) / (1000 * 60 * 60 * 24));
        
        lottiInScadenza.push({
          ingrediente: ing.nome,
          ingredienteId: ing._id,
          categoria: ing.categoria,
          codiceLotto: lotto.codiceLotto,
          dataScadenza: lotto.dataScadenza,
          giorniRimanenti,
          quantitaRimanente: lotto.quantitaAttuale,
          unitaMisura: lotto.unitaMisura || ing.unitaMisura,
          fornitore: lotto.fornitore?.ragioneSociale || 'N/D',
          urgenza: giorniRimanenti <= 0 ? 'scaduto' : giorniRimanenti <= 3 ? 'critico' : giorniRimanenti <= 7 ? 'urgente' : 'attenzione'
        });
      }
    }
    
    // Ordina per urgenza
    lottiInScadenza.sort((a, b) => a.giorniRimanenti - b.giorniRimanenti);
    
    res.json({
      success: true,
      data: lottiInScadenza,
      stats: {
        totale: lottiInScadenza.length,
        scaduti: lottiInScadenza.filter(l => l.giorniRimanenti <= 0).length,
        critici: lottiInScadenza.filter(l => l.giorniRimanenti > 0 && l.giorniRimanenti <= 3).length,
        urgenti: lottiInScadenza.filter(l => l.giorniRimanenti > 3 && l.giorniRimanenti <= 7).length,
        attenzione: lottiInScadenza.filter(l => l.giorniRimanenti > 7).length
      }
    });
    
  } catch (error) {
    logger.error('Errore scadenze:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle scadenze'
    });
  }
});

/**
 * GET /api/rintracciabilita/ricerca-ordine/:ordineId
 * Rintracciabilità upstream da ordine cliente
 */
router.get('/ricerca-ordine/:ordineId', async (req, res) => {
  try {
    const { ordineId } = req.params;
    
    // Trova tutti gli ingredienti che hanno utilizzi per questo ordine
    const ingredienti = await Ingrediente.find({
      'lotti.utilizzi.ordineCliente.id': ordineId
    }).lean();
    
    const risultati = [];
    
    for (const ing of ingredienti) {
      for (const lotto of ing.lotti) {
        const utilizziOrdine = (lotto.utilizzi || []).filter(
          u => u.ordineCliente?.id?.toString() === ordineId
        );
        
        if (utilizziOrdine.length > 0) {
          risultati.push({
            ingrediente: ing.nome,
            categoria: ing.categoria,
            lotto: lotto.codiceLotto,
            fornitore: lotto.fornitore?.ragioneSociale || 'N/D',
            documentoOrigine: lotto.documentoOrigine,
            lottoFornitore: lotto.lottoFornitore?.codice || '',
            utilizzi: utilizziOrdine
          });
        }
      }
    }
    
    res.json({
      success: true,
      ordineId,
      ingredientiUtilizzati: risultati
    });
    
  } catch (error) {
    logger.error('Errore ricerca ordine:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella ricerca per ordine'
    });
  }
});

/**
 * GET /api/rintracciabilita/ricerca-fornitore
 * Ricerca per fornitore/fattura
 */
router.get('/ricerca-fornitore', async (req, res) => {
  try {
    const { fornitore, numeroFattura, partitaIva } = req.query;
    
    const query = { attivo: true };
    
    const ingredienti = await Ingrediente.find(query).lean();
    
    const risultati = [];
    
    for (const ing of ingredienti) {
      for (const lotto of ing.lotti) {
        let match = false;
        
        if (fornitore && lotto.fornitore?.ragioneSociale?.toLowerCase().includes(fornitore.toLowerCase())) {
          match = true;
        }
        if (numeroFattura && lotto.documentoOrigine?.numero?.includes(numeroFattura)) {
          match = true;
        }
        if (partitaIva && lotto.fornitore?.partitaIVA === partitaIva) {
          match = true;
        }
        
        if (match) {
          risultati.push({
            ingrediente: ing.nome,
            ingredienteId: ing._id,
            categoria: ing.categoria,
            codiceLotto: lotto.codiceLotto,
            quantitaIniziale: lotto.quantitaIniziale,
            quantitaAttuale: lotto.quantitaAttuale,
            unitaMisura: lotto.unitaMisura || ing.unitaMisura,
            dataArrivo: lotto.dataArrivo,
            dataScadenza: lotto.dataScadenza,
            fornitore: lotto.fornitore,
            documentoOrigine: lotto.documentoOrigine,
            stato: lotto.stato,
            utilizziCount: lotto.utilizzi?.length || 0
          });
        }
      }
    }
    
    res.json({
      success: true,
      filtri: { fornitore, numeroFattura, partitaIva },
      totale: risultati.length,
      data: risultati
    });
    
  } catch (error) {
    logger.error('Errore ricerca fornitore:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella ricerca per fornitore'
    });
  }
});

/**
 * PUT /api/rintracciabilita/lotto/:codiceLotto/stato
 * Aggiorna stato lotto (es: richiamo)
 */
router.put('/lotto/:codiceLotto/stato', async (req, res) => {
  try {
    const { codiceLotto } = req.params;
    const { stato, note } = req.body;
    
    const statiValidi = ['disponibile', 'in_uso', 'esaurito', 'scaduto', 'richiamato', 'quarantena'];
    if (!statiValidi.includes(stato)) {
      return res.status(400).json({
        success: false,
        error: `Stato non valido. Stati ammessi: ${statiValidi.join(', ')}`
      });
    }
    
    const result = await Ingrediente.updateOne(
      { 'lotti.codiceLotto': codiceLotto },
      { 
        $set: { 
          'lotti.$.stato': stato,
          'lotti.$.note': note || ''
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Lotto non trovato'
      });
    }
    
    logger.info(`Stato lotto ${codiceLotto} aggiornato a: ${stato}`);
    
    res.json({
      success: true,
      message: `Stato lotto aggiornato a: ${stato}`
    });
    
  } catch (error) {
    logger.error('Errore aggiornamento stato lotto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento dello stato'
    });
  }
});

/**
 * GET /api/rintracciabilita/export
 * Export CSV/Excel per HACCP
 */
router.get('/export', async (req, res) => {
  try {
    const { formato = 'csv', dataInizio, dataFine } = req.query;
    
    const ingredienti = await Ingrediente.find({ attivo: true }).lean();
    
    const righe = [];
    const oggi = new Date();
    
    for (const ing of ingredienti) {
      for (const lotto of ing.lotti || []) {
        if (dataInizio && new Date(lotto.dataArrivo) < new Date(dataInizio)) continue;
        if (dataFine && new Date(lotto.dataArrivo) > new Date(dataFine)) continue;
        
        const giorniScadenza = lotto.dataScadenza 
          ? Math.ceil((new Date(lotto.dataScadenza) - oggi) / (1000 * 60 * 60 * 24))
          : '';
        
        righe.push({
          'Prodotto': ing.nome,
          'Categoria': ing.categoria,
          'Codice Lotto': lotto.codiceLotto || '',
          'Data Arrivo': lotto.dataArrivo ? new Date(lotto.dataArrivo).toLocaleDateString('it-IT') : '',
          'Data Scadenza': lotto.dataScadenza ? new Date(lotto.dataScadenza).toLocaleDateString('it-IT') : '',
          'Giorni Scadenza': giorniScadenza,
          'Qtà Iniziale': lotto.quantitaIniziale || 0,
          'Qtà Attuale': lotto.quantitaAttuale || 0,
          'Unità': lotto.unitaMisura || ing.unitaMisura,
          'Prezzo Unit.': lotto.prezzoUnitario || 0,
          'Fornitore': lotto.fornitore?.ragioneSociale || '',
          'P.IVA Fornitore': lotto.fornitore?.partitaIVA || '',
          'Tipo Doc.': lotto.documentoOrigine?.tipo || '',
          'N. Documento': lotto.documentoOrigine?.numero || '',
          'Data Documento': lotto.documentoOrigine?.data ? new Date(lotto.documentoOrigine.data).toLocaleDateString('it-IT') : '',
          'Lotto Fornitore': lotto.lottoFornitore?.codice || '',
          'Stato': lotto.stato || ''
        });
      }
    }
    
    if (formato === 'csv') {
      // Genera CSV
      const headers = Object.keys(righe[0] || {});
      let csv = headers.join(';') + '\n';
      
      for (const riga of righe) {
        csv += headers.map(h => `"${(riga[h] || '').toString().replace(/"/g, '""')}"`).join(';') + '\n';
      }
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=rintracciabilita_${new Date().toISOString().split('T')[0]}.csv`);
      res.send('\uFEFF' + csv); // BOM per Excel
    } else {
      res.json({
        success: true,
        data: righe
      });
    }
    
  } catch (error) {
    logger.error('Errore export:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'export'
    });
  }
});

export default router;