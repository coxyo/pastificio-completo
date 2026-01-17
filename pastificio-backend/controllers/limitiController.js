// controllers/limitiController.js - ✅ FIX 17/01/2026: Zeppole 24 pz/Kg e €21/Kg
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import Ordine from '../models/Ordine.js';

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
 * GET /api/limiti/prodotto/:nome - Ottieni/Crea limite per prodotto
 * @deprecated Usa routes/limiti.js per supporto filtro data
 */
export const getLimiteProdotto = async (req, res) => {
  try {
    const { nome } = req.params;
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    console.log(`[LIMITI CONTROLLER] GET limite prodotto: ${nome} per data: ${oggi}`);

    // Cerca limite esistente
    let limite = await LimiteGiornaliero.findOne({
      data: oggi,
      prodotto: nome,
      attivo: true
    });

    // Se non esiste, crealo automaticamente
    if (!limite) {
      console.log(`[LIMITI CONTROLLER] Limite non trovato, creo automaticamente con 27 Kg`);
      limite = await LimiteGiornaliero.create({
        data: oggi,
        prodotto: nome,
        limiteQuantita: 27,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true,
        sogliAllerta: 80
      });
    }

    // ✅ Calcola totale dagli ordini
    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 1);

    const ordini = await Ordine.find({
      dataRitiro: { $gte: oggi, $lt: domani },
      'prodotti.nome': { $regex: new RegExp(nome, 'i') }
    });

    let totaleOrdini = 0;
    ordini.forEach(ordine => {
      ordine.prodotti.forEach(prodotto => {
        if (prodotto.nome && prodotto.nome.toLowerCase().includes(nome.toLowerCase())) {
          totaleOrdini += convertiInKg(prodotto.quantita, prodotto.unita);
        }
      });
    });

    const venditeDirette = limite.quantitaOrdinata || 0;
    const totaleComplessivo = totaleOrdini + venditeDirette;

    res.json({
      success: true,
      data: {
        ...limite.toObject(),
        totaleOrdini: parseFloat(totaleOrdini.toFixed(2)),
        totaleComplessivo: parseFloat(totaleComplessivo.toFixed(2)),
        disponibile: limite.limiteQuantita - totaleComplessivo
      }
    });

  } catch (error) {
    console.error('[LIMITI CONTROLLER] Errore GET limite:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del limite',
      error: error.message
    });
  }
};

/**
 * GET /api/limiti/ordini-prodotto/:nome - Ottieni ordini con prodotto specifico
 * @deprecated Usa routes/limiti.js per supporto filtro data
 */
export const getOrdiniProdotto = async (req, res) => {
  try {
    const { nome } = req.params;
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 1);

    console.log(`[LIMITI CONTROLLER] GET ordini prodotto: ${nome}`);

    // Trova ordini con il prodotto
    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: oggi,
        $lt: domani
      },
      'prodotti.nome': { $regex: new RegExp(nome, 'i') }
    }).sort({ oraRitiro: 1 });

    console.log(`[LIMITI CONTROLLER] Trovati ${ordini.length} ordini con ${nome}`);

    // Calcola totali
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
    console.error('[LIMITI CONTROLLER] Errore GET ordini:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli ordini',
      error: error.message
    });
  }
};

/**
 * POST /api/limiti/vendita-diretta - Registra vendita diretta
 */
export const registraVenditaDiretta = async (req, res) => {
  try {
    const { prodotto, quantitaKg, data } = req.body;

    if (!prodotto || !quantitaKg) {
      return res.status(400).json({
        success: false,
        message: 'Prodotto e quantità sono obbligatori'
      });
    }

    // Usa data fornita o oggi
    const dataVendita = data ? new Date(data) : new Date();
    dataVendita.setHours(0, 0, 0, 0);

    console.log(`[LIMITI CONTROLLER] POST vendita diretta: ${prodotto} - ${quantitaKg} Kg per ${dataVendita.toISOString().split('T')[0]}`);

    // Trova o crea limite
    let limite = await LimiteGiornaliero.findOne({
      data: dataVendita,
      prodotto,
      attivo: true
    });

    if (!limite) {
      // Crea automaticamente
      limite = await LimiteGiornaliero.create({
        data: dataVendita,
        prodotto,
        limiteQuantita: 27,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true
      });
    }

    // ✅ Calcola totale dagli ordini
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

    console.log(`[LIMITI CONTROLLER] Vendita registrata. Vendite dirette: ${limite.quantitaOrdinata} Kg`);

    // Emetti evento Pusher (se configurato)
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
      console.warn('[LIMITI CONTROLLER] Pusher non disponibile:', pusherError.message);
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
    console.error('[LIMITI CONTROLLER] Errore vendita diretta:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella registrazione della vendita',
      error: error.message
    });
  }
};

/**
 * POST /api/limiti/reset-prodotto - Reset disponibilità prodotto
 */
export const resetProdotto = async (req, res) => {
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

    console.log(`[LIMITI CONTROLLER] POST reset prodotto: ${prodotto} per data: ${dataReset.toISOString().split('T')[0]}`);

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

    console.log(`[LIMITI CONTROLLER] Reset completato per ${prodotto}`);

    // Emetti evento Pusher
    try {
      const pusher = (await import('../services/pusherService.js')).default;
      await pusher.trigger('zeppole-channel', 'reset-disponibilita', {
        prodotto,
        limiteKg: limite.limiteQuantita,
        timestamp: new Date()
      });
    } catch (pusherError) {
      console.warn('[LIMITI CONTROLLER] Pusher non disponibile:', pusherError.message);
    }

    res.json({
      success: true,
      message: 'Disponibilità resettata (solo vendite dirette)',
      data: limite
    });

  } catch (error) {
    console.error('[LIMITI CONTROLLER] Errore reset:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel reset della disponibilità',
      error: error.message
    });
  }
};

// Esporta come default object
export default {
  getLimiteProdotto,
  getOrdiniProdotto,
  registraVenditaDiretta,
  resetProdotto
};
