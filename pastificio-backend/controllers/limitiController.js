// controllers/limitiController.js - ✅ FIX 15/01/2026: Zeppole 24 pz/Kg e €21/Kg
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import Ordine from '../models/Ordine.js';

// GET /api/limiti/prodotto/:nome - Ottieni/Crea limite per prodotto
export const getLimiteProdotto = async (req, res) => {
  try {
    const { nome } = req.params;
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    console.log(`[LIMITI] GET limite prodotto: ${nome} per data: ${oggi}`);

    // Cerca limite esistente
    let limite = await LimiteGiornaliero.findOne({
      data: oggi,
      prodotto: nome,
      attivo: true
    });

    // Se non esiste, crealo automaticamente
    if (!limite) {
      console.log(`[LIMITI] Limite non trovato, creo automaticamente con 20 Kg`);
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

    res.json({
      success: true,
      data: limite
    });

  } catch (error) {
    console.error('[LIMITI] Errore GET limite:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del limite',
      error: error.message
    });
  }
};

// GET /api/limiti/ordini-prodotto/:nome - Ottieni ordini con prodotto specifico
export const getOrdiniProdotto = async (req, res) => {
  try {
    const { nome } = req.params;
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 1);

    console.log(`[LIMITI] GET ordini prodotto: ${nome}`);

    // Trova ordini con il prodotto
    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: oggi,
        $lt: domani
      },
      'prodotti.nome': nome
    }).sort({ oraRitiro: 1 });

    console.log(`[LIMITI] Trovati ${ordini.length} ordini con ${nome}`);

    // Calcola totali
    let totaleKg = 0;
    const ordiniFormattati = [];

    ordini.forEach(ordine => {
      ordine.prodotti.forEach(prodotto => {
        if (prodotto.nome === nome) {
          let quantitaKg = parseFloat(prodotto.quantita) || 0;
          
          // Converti in Kg
          const unita = (prodotto.unita || 'Kg').toLowerCase();
          
          if (unita === 'g') {
            quantitaKg = quantitaKg / 1000;
          } else if (unita === 'pz' || unita === 'pezzi') {
            // ✅ FIX 15/01/2026: Zeppole 24 pz/Kg (1 Kg = 24 pezzi)
            quantitaKg = quantitaKg / 24;
          } else if (unita === '€' || unita === 'euro') {
            // ✅ FIX 15/01/2026: Zeppole €21/Kg
            quantitaKg = quantitaKg / 21;
          }

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
    console.error('[LIMITI] Errore GET ordini:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli ordini',
      error: error.message
    });
  }
};

// POST /api/limiti/vendita-diretta - Registra vendita diretta
export const registraVenditaDiretta = async (req, res) => {
  try {
    const { prodotto, quantitaKg, nota } = req.body;

    if (!prodotto || !quantitaKg) {
      return res.status(400).json({
        success: false,
        message: 'Prodotto e quantità sono obbligatori'
      });
    }

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    console.log(`[LIMITI] POST vendita diretta: ${prodotto} - ${quantitaKg} Kg`);

    // Trova o crea limite
    let limite = await LimiteGiornaliero.findOne({
      data: oggi,
      prodotto,
      attivo: true
    });

    if (!limite) {
      // Crea automaticamente
      limite = await LimiteGiornaliero.create({
        data: oggi,
        prodotto,
        limiteQuantita: 20,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true
      });
    }

    // Verifica disponibilità
    const nuovoTotale = limite.quantitaOrdinata + quantitaKg;
    if (nuovoTotale > limite.limiteQuantita) {
      return res.status(400).json({
        success: false,
        message: `Quantità non disponibile. Disponibile: ${(limite.limiteQuantita - limite.quantitaOrdinata).toFixed(2)} Kg`,
        disponibile: limite.limiteQuantita - limite.quantitaOrdinata
      });
    }

    // Aggiorna contatore
    limite.quantitaOrdinata = nuovoTotale;
    await limite.save();

    console.log(`[LIMITI] Vendita registrata. Nuovo totale: ${nuovoTotale} Kg`);

    // Emetti evento Pusher (se configurato)
    try {
      const pusher = (await import('../services/pusherService.js')).default;
      await pusher.trigger('zeppole-channel', 'vendita-diretta', {
        prodotto,
        quantitaKg,
        ordinatoKg: nuovoTotale,
        disponibileKg: limite.limiteQuantita - nuovoTotale,
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
        ordinatoTotale: nuovoTotale,
        disponibile: limite.limiteQuantita - nuovoTotale,
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
};

// POST /api/limiti/reset-prodotto - Reset disponibilità prodotto
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

    console.log(`[LIMITI] POST reset prodotto: ${prodotto} per data: ${dataReset}`);

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
      message: 'Disponibilità resettata',
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
};

// Esporta come default object
export default {
  getLimiteProdotto,
  getOrdiniProdotto,
  registraVenditaDiretta,
  resetProdotto
};