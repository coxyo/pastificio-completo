// routes/limiti.js - ✅ FIX 18/01/2026: Filtro data corretto per ordini
import express from 'express';
import { protect } from '../middleware/auth.js';
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import Ordine from '../models/Ordine.js';

const router = express.Router();

/**
 * ✅ FIX: Helper per convertire quantità in Kg
 */
const convertiInKg = (quantita, unita) => {
  const qty = parseFloat(quantita) || 0;
  const unit = (unita || 'Kg').toLowerCase();
  
  if (unit === 'kg') return qty;
  if (unit === 'g') return qty / 1000;
  if (unit === 'pz' || unit === 'pezzi') return qty / 24; // Zeppole: 24 pz = 1 Kg
  if (unit === '€' || unit === 'euro') return qty / 21;   // Zeppole: €21 = 1 Kg
  
  return qty;
};

/**
 * GET /api/limiti/prodotto/:nome
 * ✅ FIX: Filtra ordini SOLO per la data specificata
 */
router.get('/prodotto/:nome', protect, async (req, res) => {
  try {
    const { nome } = req.params;
    const { data } = req.query;

    // ✅ FIX: Usa data da query o oggi
    const dataRichiesta = data ? new Date(data) : new Date();
    dataRichiesta.setHours(0, 0, 0, 0);
    
    const dataFine = new Date(dataRichiesta);
    dataFine.setDate(dataFine.getDate() + 1);

    console.log(`[LIMITI] GET prodotto: ${nome} per data: ${dataRichiesta.toISOString().split('T')[0]}`);

    // 1. Trova/Crea limite
    let limite = await LimiteGiornaliero.findOne({
      data: dataRichiesta,
      prodotto: nome,
      attivo: true
    });

    if (!limite) {
      console.log(`[LIMITI] Limite non trovato, creo automaticamente con 27 Kg`);
      limite = await LimiteGiornaliero.create({
        data: dataRichiesta,
        prodotto: nome,
        limiteQuantita: 27,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true,
        sogliAllerta: 80
      });
    }

    // ✅ FIX: Query ordini con filtro data STRETTO
    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: dataRichiesta,
        $lt: dataFine
      },
      'prodotti.nome': { $regex: new RegExp(`^${nome}$`, 'i') } // ✅ Match esatto
    }).lean();

    console.log(`[LIMITI] Trovati ${ordini.length} ordini per ${nome}`);

    // 2. Calcola totale dagli ordini
    let totaleOrdini = 0;
    const ordiniDettaglio = [];

    ordini.forEach(ordine => {
      ordine.prodotti.forEach(prodotto => {
        // ✅ FIX: Match case-insensitive esatto
        if (prodotto.nome && prodotto.nome.toLowerCase() === nome.toLowerCase()) {
          const quantitaKg = convertiInKg(prodotto.quantita, prodotto.unita);
          totaleOrdini += quantitaKg;
          
          ordiniDettaglio.push({
            ordineId: ordine.numeroOrdine || ordine._id,
            cliente: ordine.nomeCliente,
            codiceCliente: ordine.codiceCliente,
            oraRitiro: ordine.oraRitiro,
            quantita: prodotto.quantita,
            unita: prodotto.unita,
            quantitaKg: parseFloat(quantitaKg.toFixed(3)),
            note: prodotto.note || '',
            stato: ordine.stato
          });
        }
      });
    });

    // 3. Calcola totali
    const venditeDirette = limite.quantitaOrdinata || 0;
    const totaleComplessivo = totaleOrdini + venditeDirette;
    const disponibile = limite.limiteQuantita - totaleComplessivo;
    const percentualeUtilizzo = (totaleComplessivo / limite.limiteQuantita) * 100;

    console.log(`[LIMITI] Totale ordini: ${totaleOrdini.toFixed(2)} Kg`);
    console.log(`[LIMITI] Vendite dirette: ${venditeDirette.toFixed(2)} Kg`);
    console.log(`[LIMITI] Totale complessivo: ${totaleComplessivo.toFixed(2)} Kg`);
    console.log(`[LIMITI] Disponibile: ${disponibile.toFixed(2)} Kg`);

    res.json({
      success: true,
      data: {
        _id: limite._id,
        data: limite.data,
        prodotto: limite.prodotto,
        limiteQuantita: limite.limiteQuantita,
        unitaMisura: limite.unitaMisura,
        quantitaOrdinata: parseFloat(venditeDirette.toFixed(2)),
        totaleOrdini: parseFloat(totaleOrdini.toFixed(2)),
        totaleComplessivo: parseFloat(totaleComplessivo.toFixed(2)),
        disponibile: parseFloat(disponibile.toFixed(2)),
        percentualeUtilizzo: parseFloat(percentualeUtilizzo.toFixed(1)),
        attivo: limite.attivo,
        sogliAllerta: limite.sogliAllerta,
        ordini: ordiniDettaglio
      }
    });

  } catch (error) {
    console.error('[LIMITI] Errore GET prodotto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del limite',
      error: error.message
    });
  }
});

/**
 * GET /api/limiti/ordini-prodotto/:nome
 * ✅ FIX: Filtra ordini per data
 */
router.get('/ordini-prodotto/:nome', protect, async (req, res) => {
  try {
    const { nome } = req.params;
    const { data } = req.query;

    const dataRichiesta = data ? new Date(data) : new Date();
    dataRichiesta.setHours(0, 0, 0, 0);
    
    const dataFine = new Date(dataRichiesta);
    dataFine.setDate(dataFine.getDate() + 1);

    console.log(`[LIMITI] GET ordini prodotto: ${nome} per data: ${dataRichiesta.toISOString().split('T')[0]}`);

    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: dataRichiesta,
        $lt: dataFine
      },
      'prodotti.nome': { $regex: new RegExp(`^${nome}$`, 'i') }
    }).sort({ oraRitiro: 1 }).lean();

    let totaleKg = 0;
    const ordiniFormattati = [];

    ordini.forEach(ordine => {
      ordine.prodotti.forEach(prodotto => {
        if (prodotto.nome && prodotto.nome.toLowerCase() === nome.toLowerCase()) {
          const quantitaKg = convertiInKg(prodotto.quantita, prodotto.unita);
          totaleKg += quantitaKg;

          ordiniFormattati.push({
            ordineId: ordine.numeroOrdine || ordine._id,
            cliente: ordine.nomeCliente,
            codiceCliente: ordine.codiceCliente,
            oraRitiro: ordine.oraRitiro,
            quantita: prodotto.quantita,
            unita: prodotto.unita,
            quantitaKg: parseFloat(quantitaKg.toFixed(3)),
            note: prodotto.note || '',
            stato: ordine.stato
          });
        }
      });
    });

    res.json({
      success: true,
      count: ordiniFormattati.length,
      totaleKg: parseFloat(totaleKg.toFixed(2)),
      data: ordiniFormattati
    });

  } catch (error) {
    console.error('[LIMITI] Errore GET ordini:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli ordini',
      error: error.message
    });
  }
});

/**
 * POST /api/limiti/vendita-diretta
 * Registra vendita diretta
 */
router.post('/vendita-diretta', protect, async (req, res) => {
  try {
    const { prodotto, quantitaKg, data } = req.body;

    if (!prodotto || !quantitaKg) {
      return res.status(400).json({
        success: false,
        message: 'Prodotto e quantità sono obbligatori'
      });
    }

    const dataVendita = data ? new Date(data) : new Date();
    dataVendita.setHours(0, 0, 0, 0);

    console.log(`[LIMITI] POST vendita diretta: ${prodotto} - ${quantitaKg} Kg per ${dataVendita.toISOString().split('T')[0]}`);

    // Trova limite
    let limite = await LimiteGiornaliero.findOne({
      data: dataVendita,
      prodotto,
      attivo: true
    });

    if (!limite) {
      limite = await LimiteGiornaliero.create({
        data: dataVendita,
        prodotto,
        limiteQuantita: 27,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true
      });
    }

    // Calcola totale ordini
    const dataFine = new Date(dataVendita);
    dataFine.setDate(dataFine.getDate() + 1);

    const ordini = await Ordine.find({
      dataRitiro: { $gte: dataVendita, $lt: dataFine },
      'prodotti.nome': { $regex: new RegExp(`^${prodotto}$`, 'i') }
    }).lean();

    let totaleOrdini = 0;
    ordini.forEach(ordine => {
      ordine.prodotti.forEach(p => {
        if (p.nome && p.nome.toLowerCase() === prodotto.toLowerCase()) {
          totaleOrdini += convertiInKg(p.quantita, p.unita);
        }
      });
    });

    // Verifica disponibilità
    const nuovoTotale = totaleOrdini + limite.quantitaOrdinata + quantitaKg;
    
    if (nuovoTotale > limite.limiteQuantita) {
      const disponibile = limite.limiteQuantita - totaleOrdini - limite.quantitaOrdinata;
      return res.status(400).json({
        success: false,
        message: `Quantità non disponibile. Disponibile: ${Math.max(0, disponibile).toFixed(2)} Kg`,
        disponibile: Math.max(0, disponibile)
      });
    }

    // Aggiorna contatore vendite dirette
    limite.quantitaOrdinata += quantitaKg;
    await limite.save();

    console.log(`[LIMITI] Vendita registrata. Vendite dirette: ${limite.quantitaOrdinata} Kg`);

    // Emetti evento Pusher
    try {
      const pusher = (await import('../services/pusherService.js')).default;
      await pusher.trigger('zeppole-channel', 'vendita-diretta', {
        prodotto,
        quantitaKg,
        totaleComplessivo: totaleOrdini + limite.quantitaOrdinata,
        disponibile: limite.limiteQuantita - totaleOrdini - limite.quantitaOrdinata,
        timestamp: new Date()
      });
    } catch (pusherError) {
      console.warn('[LIMITI] Pusher non disponibile:', pusherError.message);
    }

    res.json({
      success: true,
      message: `Vendita di ${quantitaKg} Kg registrata`,
      data: {
        prodotto: limite.prodotto,
        quantitaVenduta: quantitaKg,
        venditeDirette: limite.quantitaOrdinata,
        totaleOrdini: parseFloat(totaleOrdini.toFixed(2)),
        totaleComplessivo: parseFloat((totaleOrdini + limite.quantitaOrdinata).toFixed(2)),
        disponibile: limite.limiteQuantita - totaleOrdini - limite.quantitaOrdinata,
        limite: limite.limiteQuantita
      }
    });

  } catch (error) {
    console.error('[LIMITI] Errore vendita diretta:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella registrazione della vendita',
      error: error.message
    });
  }
});

/**
 * POST /api/limiti/reset-prodotto
 * Reset disponibilità prodotto
 */
router.post('/reset-prodotto', protect, async (req, res) => {
  try {
    const { prodotto, data } = req.body;

    if (!prodotto) {
      return res.status(400).json({
        success: false,
        message: 'Prodotto obbligatorio'
      });
    }

    const dataReset = data ? new Date(data) : new Date();
    dataReset.setHours(0, 0, 0, 0);

    console.log(`[LIMITI] POST reset prodotto: ${prodotto} per data: ${dataReset.toISOString().split('T')[0]}`);

    const limite = await LimiteGiornaliero.findOne({
      data: dataReset,
      prodotto,
      attivo: true
    });

    if (!limite) {
      return res.status(404).json({
        success: false,
        message: 'Limite non trovato per questa data'
      });
    }

    // Reset solo le vendite dirette
    limite.quantitaOrdinata = 0;
    await limite.save();

    console.log(`[LIMITI] Reset completato per ${prodotto}`);

    // Emetti evento Pusher
    try {
      const pusher = (await import('../services/pusherService.js')).default;
      await pusher.trigger('zeppole-channel', 'reset-disponibilita', {
        prodotto,
        limiteKg: limite.limiteQuantita,
        timestamp: new Date()
      });
    } catch (pusherError) {
      console.warn('[LIMITI] Pusher non disponibile:', pusherError.message);
    }

    res.json({
      success: true,
      message: 'Disponibilità resettata (solo vendite dirette)',
      data: limite
    });

  } catch (error) {
    console.error('[LIMITI] Errore reset:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel reset della disponibilità',
      error: error.message
    });
  }
});

/**
 * PUT /api/limiti/prodotto/:nome
 * Modifica limite prodotto
 */
router.put('/prodotto/:nome', protect, async (req, res) => {
  try {
    const { nome } = req.params;
    const { limiteQuantita, data } = req.body;

    const dataLimite = data ? new Date(data) : new Date();
    dataLimite.setHours(0, 0, 0, 0);

    console.log(`[LIMITI] PUT modifica limite: ${nome} → ${limiteQuantita} Kg`);

    let limite = await LimiteGiornaliero.findOne({
      data: dataLimite,
      prodotto: nome,
      attivo: true
    });

    if (!limite) {
      limite = await LimiteGiornaliero.create({
        data: dataLimite,
        prodotto: nome,
        limiteQuantita,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true
      });
    } else {
      limite.limiteQuantita = limiteQuantita;
      await limite.save();
    }

    // Emetti evento Pusher
    try {
      const pusher = (await import('../services/pusherService.js')).default;
      await pusher.trigger('zeppole-channel', 'limite-aggiornato', {
        prodotto: nome,
        limiteQuantita,
        timestamp: new Date()
      });
    } catch (pusherError) {
      console.warn('[LIMITI] Pusher non disponibile:', pusherError.message);
    }

    res.json({
      success: true,
      message: 'Limite aggiornato',
      data: limite
    });

  } catch (error) {
    console.error('[LIMITI] Errore modifica limite:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella modifica del limite',
      error: error.message
    });
  }
});

export default router;