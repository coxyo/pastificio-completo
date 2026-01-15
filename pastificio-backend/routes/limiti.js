// routes/limiti.js - ✅ FIX 15/01/2026: Supporto filtro per DATA
import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import Ordine from '../models/Ordine.js';

const router = express.Router();

router.use(optionalAuth);

console.log('[LIMITI ROUTES] File caricato - Autenticazione OPZIONALE');

// Helper per parsare la data dalla query o usare oggi
const getDataFromQuery = (queryData) => {
  let data;
  if (queryData) {
    // Formato atteso: YYYY-MM-DD
    data = new Date(queryData + 'T00:00:00');
  } else {
    data = new Date();
  }
  data.setHours(0, 0, 0, 0);
  return data;
};

/**
 * @route   GET /api/limiti/prodotto/:nome
 * @desc    Ottieni/Crea limite per prodotto per una data specifica
 * @query   data - Data in formato YYYY-MM-DD (opzionale, default: oggi)
 */
router.get('/prodotto/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    const { data: queryData } = req.query;
    
    const dataRicerca = getDataFromQuery(queryData);
    
    console.log(`[LIMITI] GET limite prodotto: ${nome} per data: ${dataRicerca.toISOString().split('T')[0]}`);

    let limite = await LimiteGiornaliero.findOne({
      data: dataRicerca,
      prodotto: nome,
      attivo: true
    });

    if (!limite) {
      console.log(`[LIMITI] Creazione automatica limite 50 Kg per ${nome} - ${dataRicerca.toISOString().split('T')[0]}`);
      limite = await LimiteGiornaliero.create({
        data: dataRicerca,
        prodotto: nome,
        limiteQuantita: 50,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true,
        sogliAllerta: 80
      });
    }

    // ✅ NUOVO: Calcola quantitaOrdinata dagli ordini reali per questa data
    const dataFine = new Date(dataRicerca);
    dataFine.setDate(dataFine.getDate() + 1);

    const ordini = await Ordine.find({
      dataRitiro: { $gte: dataRicerca, $lt: dataFine },
      'prodotti.nome': { $regex: new RegExp(nome, 'i') }
    });

    let totaleOrdinatoKg = 0;
    ordini.forEach(ordine => {
      ordine.prodotti.forEach(prodotto => {
        if (prodotto.nome && prodotto.nome.toLowerCase().includes(nome.toLowerCase())) {
          let quantitaKg = parseFloat(prodotto.quantita) || 0;
          
          const unita = (prodotto.unita || 'Kg').toLowerCase();
          if (unita === 'g') quantitaKg = quantitaKg / 1000;
          else if (unita === 'pz') quantitaKg = quantitaKg * 0.08; // ~80g per zeppola
          else if (unita === '€') quantitaKg = quantitaKg / 17; // ~17€/kg

          totaleOrdinatoKg += quantitaKg;
        }
      });
    });

    // Aggiorna il limite con il totale calcolato
    limite.quantitaOrdinata = parseFloat(totaleOrdinatoKg.toFixed(2));

    console.log(`[LIMITI] Limite ${nome}: ${limite.quantitaOrdinata}/${limite.limiteQuantita} Kg (da ${ordini.length} ordini)`);

    res.json({ success: true, data: limite });
  } catch (error) {
    console.error('[LIMITI] Errore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/limiti/ordini-prodotto/:nome
 * @desc    Ottieni ordini con prodotto per una data specifica
 * @query   data - Data in formato YYYY-MM-DD (opzionale, default: oggi)
 */
router.get('/ordini-prodotto/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    const { data: queryData } = req.query;
    
    const dataRicerca = getDataFromQuery(queryData);
    const dataFine = new Date(dataRicerca);
    dataFine.setDate(dataFine.getDate() + 1);

    console.log(`[LIMITI] GET ordini prodotto: ${nome} per data: ${dataRicerca.toISOString().split('T')[0]}`);

    const ordini = await Ordine.find({
      dataRitiro: { $gte: dataRicerca, $lt: dataFine },
      'prodotti.nome': { $regex: new RegExp(nome, 'i') }
    }).sort({ oraRitiro: 1 });

    console.log(`[LIMITI] Trovati ${ordini.length} ordini per ${dataRicerca.toISOString().split('T')[0]}`);

    let totaleKg = 0;
    const ordiniFormattati = [];

    ordini.forEach(ordine => {
      ordine.prodotti.forEach(prodotto => {
        if (prodotto.nome && prodotto.nome.toLowerCase().includes(nome.toLowerCase())) {
          let quantitaKg = parseFloat(prodotto.quantita) || 0;
          
          const unita = (prodotto.unita || 'Kg').toLowerCase();
          if (unita === 'g') quantitaKg = quantitaKg / 1000;
          else if (unita === 'pz') quantitaKg = quantitaKg * 0.08; // ~80g per zeppola
          else if (unita === '€') quantitaKg = quantitaKg / 17; // ~17€/kg

          totaleKg += quantitaKg;

          ordiniFormattati.push({
            ordineId: ordine.numeroOrdine || ordine._id,
            cliente: ordine.nomeCliente,
            codiceCliente: ordine.codiceCliente,
            oraRitiro: ordine.oraRitiro,
            quantita: prodotto.quantita,
            unita: prodotto.unita || 'Kg',
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
    const { prodotto, quantitaKg, data: queryData } = req.body;

    if (!prodotto || !quantitaKg) {
      return res.status(400).json({
        success: false,
        message: 'Prodotto e quantità obbligatori'
      });
    }

    const dataVendita = getDataFromQuery(queryData);

    console.log(`[LIMITI] POST vendita diretta: ${prodotto} - ${quantitaKg} Kg per ${dataVendita.toISOString().split('T')[0]}`);

    let limite = await LimiteGiornaliero.findOne({
      data: dataVendita,
      prodotto,
      attivo: true
    });

    if (!limite) {
      limite = await LimiteGiornaliero.create({
        data: dataVendita,
        prodotto,
        limiteQuantita: 50,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true
      });
    }

    // Calcola totale attuale dagli ordini
    const dataFine = new Date(dataVendita);
    dataFine.setDate(dataFine.getDate() + 1);

    const ordini = await Ordine.find({
      dataRitiro: { $gte: dataVendita, $lt: dataFine },
      'prodotti.nome': { $regex: new RegExp(prodotto, 'i') }
    });

    let totaleOrdini = 0;
    ordini.forEach(ordine => {
      ordine.prodotti.forEach(p => {
        if (p.nome && p.nome.toLowerCase().includes(prodotto.toLowerCase())) {
          let q = parseFloat(p.quantita) || 0;
          const u = (p.unita || 'Kg').toLowerCase();
          if (u === 'g') q = q / 1000;
          else if (u === 'pz') q = q * 0.08;
          else if (u === '€') q = q / 17;
          totaleOrdini += q;
        }
      });
    });

    const nuovoTotale = totaleOrdini + limite.quantitaOrdinata + quantitaKg;
    
    if (nuovoTotale > limite.limiteQuantita) {
      const disponibile = limite.limiteQuantita - totaleOrdini - limite.quantitaOrdinata;
      return res.status(400).json({
        success: false,
        message: `Disponibile: ${Math.max(0, disponibile).toFixed(2)} Kg`
      });
    }

    limite.quantitaOrdinata += quantitaKg;
    await limite.save();

    console.log(`[LIMITI] Vendita registrata. Vendite dirette: ${limite.quantitaOrdinata} Kg`);

    res.json({
      success: true,
      message: `Vendita di ${quantitaKg} Kg registrata`,
      data: {
        prodotto: limite.prodotto,
        quantitaVenduta: quantitaKg,
        venditeDirette: limite.quantitaOrdinata,
        totaleOrdini: parseFloat(totaleOrdini.toFixed(2)),
        disponibile: limite.limiteQuantita - totaleOrdini - limite.quantitaOrdinata
      }
    });
  } catch (error) {
    console.error('[LIMITI] Errore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/limiti/reset-prodotto
 * @desc    Reset disponibilità (solo vendite dirette)
 */
router.post('/reset-prodotto', async (req, res) => {
  try {
    const { prodotto, data: queryData } = req.body;

    if (!prodotto) {
      return res.status(400).json({
        success: false,
        message: 'Prodotto obbligatorio'
      });
    }

    const dataReset = getDataFromQuery(queryData);

    console.log(`[LIMITI] POST reset prodotto: ${prodotto} per ${dataReset.toISOString().split('T')[0]}`);

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

    // Reset solo le vendite dirette, non gli ordini
    limite.quantitaOrdinata = 0;
    await limite.save();

    console.log(`[LIMITI] Reset completato - Vendite dirette azzerate`);

    res.json({
      success: true,
      message: 'Vendite dirette resettate',
      data: limite
    });
  } catch (error) {
    console.error('[LIMITI] Errore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/limiti/:id
 * @desc    Aggiorna limite esistente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limiteQuantita } = req.body;

    console.log(`[LIMITI] PUT limite ${id}: ${limiteQuantita} Kg`);

    const limite = await LimiteGiornaliero.findByIdAndUpdate(
      id,
      { limiteQuantita },
      { new: true }
    );

    if (!limite) {
      return res.status(404).json({
        success: false,
        message: 'Limite non trovato'
      });
    }

    res.json({ success: true, data: limite });
  } catch (error) {
    console.error('[LIMITI] Errore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/limiti
 * @desc    Ottieni tutti i limiti attivi per una data
 */
router.get('/', async (req, res) => {
  try {
    const { data: queryData } = req.query;
    const dataRicerca = getDataFromQuery(queryData);
    
    console.log(`[LIMITI] GET tutti i limiti per data: ${dataRicerca.toISOString().split('T')[0]}`);
    
    const limiti = await LimiteGiornaliero.find({
      data: dataRicerca,
      attivo: true
    }).sort({ prodotto: 1 });
    
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

console.log('[LIMITI ROUTES] Tutte le route registrate con supporto filtro DATA');

export default router;