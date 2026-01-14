// routes/limiti.js - ROUTE ORDINATE CORRETTAMENTE
import express from 'express';
import { protect } from '../middleware/auth.js';
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import Ordine from '../models/Ordine.js';

const router = express.Router();

// Middleware di autenticazione
router.use(protect);

console.log('[LIMITI ROUTES] File caricato');

// ⚠️ IMPORTANTE: Route SPECIFICHE devono venire PRIMA delle generiche!

/**
 * @route   GET /api/limiti/prodotto/:nome
 * @desc    Ottieni/Crea limite per prodotto
 */
router.get('/prodotto/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    console.log(`[LIMITI] GET limite prodotto: ${nome}`);

    let limite = await LimiteGiornaliero.findOne({
      data: oggi,
      prodotto: nome,
      attivo: true
    });

    if (!limite) {
      console.log(`[LIMITI] Creazione automatica limite 20 Kg per ${nome}`);
      limite = await LimiteGiornaliero.create({
        data: oggi,
        prodotto: nome,
        limiteQuantita: 20,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true,
        sogliAllerta: 80
      });
    }

    res.json({ success: true, data: limite });
  } catch (error) {
    console.error('[LIMITI] Errore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/limiti/ordini-prodotto/:nome
 * @desc    Ottieni ordini con prodotto
 */
router.get('/ordini-prodotto/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 1);

    console.log(`[LIMITI] GET ordini prodotto: ${nome}`);

    const ordini = await Ordine.find({
      dataRitiro: { $gte: oggi, $lt: domani },
      'prodotti.nome': nome
    }).sort({ oraRitiro: 1 });

    console.log(`[LIMITI] Trovati ${ordini.length} ordini`);

    let totaleKg = 0;
    const ordiniFormattati = [];

    ordini.forEach(ordine => {
      ordine.prodotti.forEach(prodotto => {
        if (prodotto.nome === nome) {
          let quantitaKg = parseFloat(prodotto.quantita) || 0;
          
          if (prodotto.unita === 'g') quantitaKg = quantitaKg / 1000;
          else if (prodotto.unita === 'pz') quantitaKg = quantitaKg * 0.033;
          else if (prodotto.unita === '€') quantitaKg = quantitaKg / 20;

          totaleKg += quantitaKg;

          ordiniFormattati.push({
            ordineId: ordine.numeroOrdine || ordine._id,
            cliente: ordine.nomeCliente,
            codiceCliente: ordine.codiceCliente,
            oraRitiro: ordine.oraRitiro,
            quantita: prodotto.quantita,
            unita: prodotto.unita,
            quantitaKg: quantitaKg,
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
    console.error('[LIMITI] Errore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/limiti/vendita-diretta
 * @desc    Registra vendita diretta
 */
router.post('/vendita-diretta', async (req, res) => {
  try {
    const { prodotto, quantitaKg } = req.body;

    if (!prodotto || !quantitaKg) {
      return res.status(400).json({
        success: false,
        message: 'Prodotto e quantità obbligatori'
      });
    }

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    console.log(`[LIMITI] POST vendita diretta: ${prodotto} - ${quantitaKg} Kg`);

    let limite = await LimiteGiornaliero.findOne({
      data: oggi,
      prodotto,
      attivo: true
    });

    if (!limite) {
      limite = await LimiteGiornaliero.create({
        data: oggi,
        prodotto,
        limiteQuantita: 20,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true
      });
    }

    const nuovoTotale = limite.quantitaOrdinata + quantitaKg;
    if (nuovoTotale > limite.limiteQuantita) {
      return res.status(400).json({
        success: false,
        message: `Disponibile: ${(limite.limiteQuantita - limite.quantitaOrdinata).toFixed(2)} Kg`
      });
    }

    limite.quantitaOrdinata = nuovoTotale;
    await limite.save();

    console.log(`[LIMITI] Vendita registrata. Totale: ${nuovoTotale} Kg`);

    res.json({
      success: true,
      message: `Vendita di ${quantitaKg} Kg registrata`,
      data: {
        prodotto: limite.prodotto,
        quantitaVenduta: quantitaKg,
        ordinatoTotale: nuovoTotale,
        disponibile: limite.limiteQuantita - nuovoTotale
      }
    });
  } catch (error) {
    console.error('[LIMITI] Errore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/limiti/reset-prodotto
 * @desc    Reset disponibilità
 */
router.post('/reset-prodotto', async (req, res) => {
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

    console.log(`[LIMITI] POST reset prodotto: ${prodotto}`);

    const limite = await LimiteGiornaliero.findOne({
      data: dataReset,
      prodotto,
      attivo: true
    });

    if (!limite) {
      return res.status(404).json({
        success: false,
        message: 'Limite non trovato'
      });
    }

    limite.quantitaOrdinata = 0;
    await limite.save();

    console.log(`[LIMITI] Reset completato`);

    res.json({
      success: true,
      message: 'Disponibilità resettata',
      data: limite
    });
  } catch (error) {
    console.error('[LIMITI] Errore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ⚠️ Route generiche ALLA FINE (dopo quelle specifiche)

/**
 * @route   GET /api/limiti
 * @desc    Ottieni tutti i limiti attivi
 */
router.get('/', async (req, res) => {
  try {
    const { data } = req.query;
    const dataRicerca = data ? new Date(data) : new Date();
    dataRicerca.setHours(0, 0, 0, 0);
    
    console.log(`[LIMITI] GET tutti i limiti per data: ${dataRicerca.toISOString()}`);
    
    const limiti = await LimiteGiornaliero.find({
      data: dataRicerca,
      attivo: true
    }).sort({ prodotto: 1, categoria: 1 });
    
    console.log(`[LIMITI] Trovati ${limiti.length} limiti`);
    
    res.json({
      success: true,
      count: limiti.length,
      data: limiti
    });
  } catch (error) {
    console.error('[LIMITI] Errore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

console.log('[LIMITI ROUTES] Tutte le route registrate (ordine corretto)');

export default router;