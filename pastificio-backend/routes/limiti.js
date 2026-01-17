// routes/limiti.js - ✅ FIX 17/01/2026: Supporto filtro DATA + Zeppole 24 pz/Kg e €21/Kg
import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import Ordine from '../models/Ordine.js';

const router = express.Router();

router.use(optionalAuth);

console.log('[LIMITI ROUTES] File caricato - Autenticazione OPZIONALE');

// ✅ Helper per parsare la data dalla query o usare oggi
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

// ✅ Helper per convertire quantità in Kg
const convertiInKg = (quantita, unita) => {
  const qty = parseFloat(quantita) || 0;
  const unit = (unita || 'Kg').toLowerCase();
  
  if (unit === 'kg') return qty;
  if (unit === 'g') return qty / 1000;
  if (unit === 'pz' || unit === 'pezzi') return qty / 24; // ✅ Zeppole: 24 pz = 1 Kg
  if (unit === '€' || unit === 'euro') return qty / 21;   // ✅ Zeppole: €21 = 1 Kg
  
  return qty;
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

    // Cerca limite esistente per questa data
    let limite = await LimiteGiornaliero.findOne({
      data: dataRicerca,
      prodotto: nome,
      attivo: true
    });

    // Se non esiste, crealo automaticamente
    if (!limite) {
      console.log(`[LIMITI] Creazione automatica limite 27 Kg per ${nome} - ${dataRicerca.toISOString().split('T')[0]}`);
      limite = await LimiteGiornaliero.create({
        data: dataRicerca,
        prodotto: nome,
        limiteQuantita: 27, // Default 27 Kg per Zeppole
        unitaMisura: 'Kg',
        quantitaOrdinata: 0, // Vendite dirette
        attivo: true,
        sogliAllerta: 80
      });
    }

    // ✅ Calcola quantitaOrdinata dagli ordini reali per questa data
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
          const quantitaKg = convertiInKg(prodotto.quantita, prodotto.unita);
          totaleOrdinatoKg += quantitaKg;
        }
      });
    });

    // ✅ Calcoli finali
    const totaleOrdini = parseFloat(totaleOrdinatoKg.toFixed(2));
    const venditeDirette = limite.quantitaOrdinata || 0;
    const totaleComplessivo = totaleOrdini + venditeDirette;
    const disponibile = limite.limiteQuantita - totaleComplessivo;

    console.log(`[LIMITI] Limite ${nome}:`);
    console.log(`  - Ordini: ${totaleOrdini} Kg (da ${ordini.length} ordini)`);
    console.log(`  - Vendite dirette: ${venditeDirette} Kg`);
    console.log(`  - Totale: ${totaleComplessivo} Kg`);
    console.log(`  - Disponibile: ${disponibile} Kg`);

    // ✅ Prepara risposta con tutti i dati
    const limiteRisposta = {
      _id: limite._id,
      data: limite.data,
      prodotto: limite.prodotto,
      limiteQuantita: limite.limiteQuantita,
      quantitaOrdinata: venditeDirette,      // Solo vendite dirette (per compatibilità)
      totaleOrdini: totaleOrdini,            // Solo ordini
      totaleComplessivo: totaleComplessivo,  // ✅ SOMMA TOTALE (ordini + vendite)
      disponibile: disponibile,
      unitaMisura: limite.unitaMisura,
      attivo: limite.attivo,
      sogliAllerta: limite.sogliAllerta,
      updatedAt: limite.updatedAt
    };

    res.json({ success: true, data: limiteRisposta });
  } catch (error) {
    console.error('[LIMITI] Errore GET limite:', error);
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
          const quantitaKg = convertiInKg(prodotto.quantita, prodotto.unita);
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
    console.error('[LIMITI] Errore GET ordini:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/limiti/vendita-diretta
 * @desc    Registra vendita diretta (non da ordini)
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

    // Trova o crea limite
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

    // ✅ Calcola totale attuale dagli ordini
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
          totaleOrdini += convertiInKg(p.quantita, p.unita);
        }
      });
    });

    // ✅ Verifica disponibilità
    const nuovoTotale = totaleOrdini + limite.quantitaOrdinata + quantitaKg;
    
    if (nuovoTotale > limite.limiteQuantita) {
      const disponibile = limite.limiteQuantita - totaleOrdini - limite.quantitaOrdinata;
      return res.status(400).json({
        success: false,
        message: `Disponibile: ${Math.max(0, disponibile).toFixed(2)} Kg`
      });
    }

    // ✅ Aggiorna contatore vendite dirette
    limite.quantitaOrdinata += quantitaKg;
    await limite.save();

    console.log(`[LIMITI] Vendita registrata. Vendite dirette: ${limite.quantitaOrdinata} Kg`);

    // ✅ Emetti evento Pusher (opzionale)
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
        disponibile: limite.limiteQuantita - totaleOrdini - limite.quantitaOrdinata
      }
    });
  } catch (error) {
    console.error('[LIMITI] Errore vendita diretta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/limiti/reset-prodotto
 * @desc    Reset disponibilità (solo vendite dirette, ordini restano)
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

    // ✅ Reset solo le vendite dirette
    limite.quantitaOrdinata = 0;
    await limite.save();

    console.log(`[LIMITI] Reset completato - Vendite dirette azzerate`);

    // ✅ Emetti evento Pusher
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
      message: 'Vendite dirette resettate',
      data: limite
    });
  } catch (error) {
    console.error('[LIMITI] Errore reset:', error);
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
    console.error('[LIMITI] Errore PUT limite:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/limiti
 * @desc    Ottieni tutti i limiti attivi per una data
 * @query   data - Data in formato YYYY-MM-DD (opzionale, default: oggi)
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
    console.error('[LIMITI] Errore GET limiti:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

console.log('[LIMITI ROUTES] Tutte le route registrate con supporto filtro DATA');

export default router;
