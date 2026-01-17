// routes/limiti.js - ✅ FIX COMPLETO 18/01/2026: Calcolo disponibilità corretto
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

// ✅ FIX: Helper per normalizzare nome prodotto
const normalizzaNomeProdotto = (nome) => {
  return nome.toLowerCase().trim();
};

// ✅ FIX: Helper per verificare se un prodotto contiene il nome cercato
const prodottoContiene = (nomeProdotto, nomeCercato) => {
  const prodottoNorm = normalizzaNomeProdotto(nomeProdotto);
  const cercatoNorm = normalizzaNomeProdotto(nomeCercato);
  return prodottoNorm.includes(cercatoNorm);
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
    
    console.log(`[LIMITI] ==========================================`);
    console.log(`[LIMITI] GET limite prodotto: ${nome}`);
    console.log(`[LIMITI] Data: ${dataRicerca.toISOString().split('T')[0]}`);

    // Cerca limite esistente per questa data
    let limite = await LimiteGiornaliero.findOne({
      data: dataRicerca,
      prodotto: nome,
      attivo: true
    });

    // Se non esiste, crealo automaticamente
    if (!limite) {
      console.log(`[LIMITI] ⚠️  Limite non trovato - Creazione automatica 27 Kg`);
      limite = await LimiteGiornaliero.create({
        data: dataRicerca,
        prodotto: nome,
        limiteQuantita: 27,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true,
        sogliAllerta: 80
      });
    } else {
      console.log(`[LIMITI] ✅ Limite trovato in DB: ID=${limite._id}`);
    }

    // ✅ FIX: Calcola quantitaOrdinata dagli ordini reali per questa data
    const dataFine = new Date(dataRicerca);
    dataFine.setDate(dataFine.getDate() + 1);

    console.log(`[LIMITI] 🔍 Cerco ordini tra ${dataRicerca.toISOString()} e ${dataFine.toISOString()}`);

    // ✅ FIX: Carica TUTTI gli ordini del giorno (senza filtro prodotto)
    const tuttiOrdini = await Ordine.find({
      dataRitiro: { $gte: dataRicerca, $lt: dataFine }
    });

    console.log(`[LIMITI] 📦 Trovati ${tuttiOrdini.length} ordini totali per questa data`);

    // ✅ FIX: Filtra manualmente gli ordini che contengono il prodotto
    let totaleOrdinatoKg = 0;
    let ordiniConProdotto = 0;
    let prodottiTrovati = [];

    tuttiOrdini.forEach(ordine => {
      ordine.prodotti.forEach(prodotto => {
        if (prodotto.nome && prodottoContiene(prodotto.nome, nome)) {
          const quantitaKg = convertiInKg(prodotto.quantita, prodotto.unita);
          totaleOrdinatoKg += quantitaKg;
          ordiniConProdotto++;
          
          prodottiTrovati.push({
            ordineId: ordine._id,
            cliente: ordine.nomeCliente,
            nomeProdotto: prodotto.nome,
            quantita: prodotto.quantita,
            unita: prodotto.unita,
            quantitaKg: quantitaKg.toFixed(3)
          });
        }
      });
    });

    console.log(`[LIMITI] 🎯 Prodotti ${nome} trovati: ${ordiniConProdotto}`);
    console.log(`[LIMITI] 📊 Totale calcolato dagli ordini: ${totaleOrdinatoKg.toFixed(3)} Kg`);
    
    if (prodottiTrovati.length > 0) {
      console.log(`[LIMITI] 📋 Dettaglio prodotti trovati:`);
      prodottiTrovati.forEach((p, idx) => {
        console.log(`[LIMITI]   ${idx + 1}. ${p.cliente}: ${p.quantita} ${p.unita} (${p.quantitaKg} Kg) - "${p.nomeProdotto}"`);
      });
    }

    // ✅ Calcoli finali
    const totaleOrdini = parseFloat(totaleOrdinatoKg.toFixed(2));
    const venditeDirette = limite.quantitaOrdinata || 0;
    const totaleComplessivo = totaleOrdini + venditeDirette;
    const disponibile = limite.limiteQuantita - totaleComplessivo;

    console.log(`[LIMITI] 💰 RIEPILOGO CALCOLI:`);
    console.log(`[LIMITI]   - Limite giornaliero: ${limite.limiteQuantita} Kg`);
    console.log(`[LIMITI]   - Ordini registrati: ${totaleOrdini} Kg (da ${ordiniConProdotto} prodotti)`);
    console.log(`[LIMITI]   - Vendite dirette: ${venditeDirette} Kg`);
    console.log(`[LIMITI]   - Totale complessivo: ${totaleComplessivo} Kg`);
    console.log(`[LIMITI]   - Disponibile: ${disponibile} Kg`);
    console.log(`[LIMITI] ==========================================`);

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
      updatedAt: limite.updatedAt,
      // ✅ Debug info
      debug: {
        ordiniTotaliGiorno: tuttiOrdini.length,
        ordiniConProdotto: ordiniConProdotto,
        prodottiDettaglio: prodottiTrovati
      }
    };

    res.json({ success: true, data: limiteRisposta });
  } catch (error) {
    console.error('[LIMITI] ❌ ERRORE GET limite:', error);
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

    // ✅ FIX: Carica TUTTI gli ordini del giorno (senza filtro prodotto)
    const tuttiOrdini = await Ordine.find({
      dataRitiro: { $gte: dataRicerca, $lt: dataFine }
    }).sort({ oraRitiro: 1 });

    console.log(`[LIMITI] Trovati ${tuttiOrdini.length} ordini totali per ${dataRicerca.toISOString().split('T')[0]}`);

    let totaleKg = 0;
    const ordiniFormattati = [];

    // ✅ FIX: Filtra manualmente
    tuttiOrdini.forEach(ordine => {
      ordine.prodotti.forEach(prodotto => {
        if (prodotto.nome && prodottoContiene(prodotto.nome, nome)) {
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

    console.log(`[LIMITI] Trovati ${ordiniFormattati.length} prodotti "${nome}" per un totale di ${totaleKg.toFixed(2)} Kg`);

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

    // ✅ FIX: Calcola totale attuale dagli ordini (stesso metodo del GET)
    const dataFine = new Date(dataVendita);
    dataFine.setDate(dataFine.getDate() + 1);

    const tuttiOrdini = await Ordine.find({
      dataRitiro: { $gte: dataVendita, $lt: dataFine }
    });

    let totaleOrdini = 0;
    tuttiOrdini.forEach(ordine => {
      ordine.prodotti.forEach(p => {
        if (p.nome && prodottoContiene(p.nome, prodotto)) {
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

console.log('[LIMITI ROUTES] ✅ Tutte le route registrate con FIX calcolo disponibilità');

export default router;
