// routes/limiti.js - ✅ AGGIORNAMENTO 12/02/2026: Supporto fascia MATTINA/SERA
import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import Ordine from '../models/Ordine.js';

const router = express.Router();

// ✅ Autenticazione OPZIONALE per compatibilità
router.use(optionalAuth);

// ✅ Ora di cambio fascia mattina → sera
const ORA_CAMBIO_FASCIA = '14:00';

/**
 * ✅ Helper per convertire quantità in Kg
 */
const convertiInKg = (quantita, unita) => {
  const qty = parseFloat(quantita) || 0;
  const unit = (unita || 'Kg').toLowerCase();
  
  if (unit === 'kg') return qty;
  if (unit === 'g') return qty / 1000;
  if (unit === 'pz' || unit === 'pezzi') return qty / 24;
  if (unit === '€' || unit === 'euro') return qty / 21;
  
  return qty;
};

/**
 * GET /api/limiti/prodotto/:nome
 * ✅ 12/02/2026: Supporto parametro ?fascia=mattina|sera
 */
router.get('/prodotto/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    const { data, fascia } = req.query;

    const dataRichiesta = data ? new Date(data) : new Date();
    dataRichiesta.setHours(0, 0, 0, 0);
    
    const dataFine = new Date(dataRichiesta);
    dataFine.setDate(dataFine.getDate() + 1);

    // ✅ Fascia: default 'giornaliero' per retrocompatibilità
    const fasciaRichiesta = fascia || 'giornaliero';

    console.log(`[LIMITI] GET prodotto: ${nome} fascia: ${fasciaRichiesta} data: ${dataRichiesta.toISOString().split('T')[0]}`);

    // 1. Trova/Crea limite per la fascia specifica
    let limite = await LimiteGiornaliero.findOne({
      data: dataRichiesta,
      prodotto: nome,
      fascia: fasciaRichiesta,
      attivo: true
    });

    if (!limite) {
      // ✅ Default diversi per fascia
      let limiteDefault = 27; // giornaliero
      if (fasciaRichiesta === 'mattina') limiteDefault = 30;
      if (fasciaRichiesta === 'sera') limiteDefault = 26;

      console.log(`[LIMITI] Limite non trovato, creo automaticamente ${fasciaRichiesta}: ${limiteDefault} Kg`);
      limite = await LimiteGiornaliero.create({
        data: dataRichiesta,
        prodotto: nome,
        fascia: fasciaRichiesta,
        limiteQuantita: limiteDefault,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true,
        sogliAllerta: 80
      });
    }

    // ✅ Query ordini con filtro data + fascia oraria
    let queryOrdini = {
      dataRitiro: {
        $gte: dataRichiesta,
        $lt: dataFine
      },
      'prodotti.nome': { $regex: new RegExp(`^${nome}$`, 'i') }
    };

    // ✅ NUOVO: Filtra ordini per fascia oraria
    if (fasciaRichiesta === 'mattina') {
      queryOrdini.$or = [
        { oraRitiro: { $lt: ORA_CAMBIO_FASCIA } },
        { oraRitiro: { $exists: false } },
        { oraRitiro: null },
        { oraRitiro: '' }
      ];
    } else if (fasciaRichiesta === 'sera') {
      queryOrdini.oraRitiro = { $gte: ORA_CAMBIO_FASCIA };
    }
    // Se 'giornaliero' → nessun filtro ora (tutti gli ordini)

    const ordini = await Ordine.find(queryOrdini).lean();

    console.log(`[LIMITI] Trovati ${ordini.length} ordini per ${nome} (${fasciaRichiesta})`);

    // 2. Calcola totale dagli ordini
    let totaleOrdini = 0;
    const ordiniDettaglio = [];

    ordini.forEach(ordine => {
      ordine.prodotti.forEach(prodotto => {
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
    const percentualeUtilizzo = limite.limiteQuantita > 0 
      ? (totaleComplessivo / limite.limiteQuantita) * 100 
      : 0;

    console.log(`[LIMITI] ${fasciaRichiesta} - Ordini: ${totaleOrdini.toFixed(2)}, Dirette: ${venditeDirette.toFixed(2)}, Totale: ${totaleComplessivo.toFixed(2)}, Disponibile: ${disponibile.toFixed(2)}`);

    res.json({
      success: true,
      data: {
        _id: limite._id,
        data: limite.data,
        prodotto: limite.prodotto,
        fascia: limite.fascia,
        limiteQuantita: limite.limiteQuantita,
        unitaMisura: limite.unitaMisura,
        quantitaOrdinata: parseFloat(venditeDirette.toFixed(2)),
        totaleOrdini: parseFloat(totaleOrdini.toFixed(2)),
        totaleComplessivo: parseFloat(totaleComplessivo.toFixed(2)),
        disponibile: parseFloat(Math.max(0, disponibile).toFixed(2)),
        percentualeUtilizzo: parseFloat(percentualeUtilizzo.toFixed(1)),
        attivo: limite.attivo,
        sogliAllerta: limite.sogliAllerta,
        totaleOrdiniCount: ordini.length,
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
 * ✅ 12/02/2026: Supporto parametro ?fascia=mattina|sera
 */
router.get('/ordini-prodotto/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    const { data, fascia } = req.query;

    const dataRichiesta = data ? new Date(data) : new Date();
    dataRichiesta.setHours(0, 0, 0, 0);
    
    const dataFine = new Date(dataRichiesta);
    dataFine.setDate(dataFine.getDate() + 1);

    const fasciaRichiesta = fascia || 'giornaliero';

    console.log(`[LIMITI] GET ordini prodotto: ${nome} fascia: ${fasciaRichiesta} data: ${dataRichiesta.toISOString().split('T')[0]}`);

    let queryOrdini = {
      dataRitiro: {
        $gte: dataRichiesta,
        $lt: dataFine
      },
      'prodotti.nome': { $regex: new RegExp(`^${nome}$`, 'i') }
    };

    // ✅ NUOVO: Filtra per fascia oraria
    if (fasciaRichiesta === 'mattina') {
      queryOrdini.$or = [
        { oraRitiro: { $lt: ORA_CAMBIO_FASCIA } },
        { oraRitiro: { $exists: false } },
        { oraRitiro: null },
        { oraRitiro: '' }
      ];
    } else if (fasciaRichiesta === 'sera') {
      queryOrdini.oraRitiro = { $gte: ORA_CAMBIO_FASCIA };
    }

    const ordini = await Ordine.find(queryOrdini).sort({ oraRitiro: 1 }).lean();

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
            notes: prodotto.note || '',
            stato: ordine.stato
          });
        }
      });
    });

    console.log(`[LIMITI] Trovati ${ordiniFormattati.length} ordini ${nome} (${fasciaRichiesta})`);

    res.json({
      success: true,
      count: ordiniFormattati.length,
      totaleKg: parseFloat(totaleKg.toFixed(2)),
      fascia: fasciaRichiesta,
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
 * ✅ 12/02/2026: Supporto campo fascia nel body
 */
router.post('/vendita-diretta', async (req, res) => {
  try {
    const { prodotto, quantitaKg, data, fascia } = req.body;

    if (!prodotto || !quantitaKg) {
      return res.status(400).json({
        success: false,
        message: 'Prodotto e quantità sono obbligatori'
      });
    }

    const fasciaRichiesta = fascia || 'giornaliero';
    const dataVendita = data ? new Date(data) : new Date();
    dataVendita.setHours(0, 0, 0, 0);

    console.log(`[LIMITI] POST vendita diretta: ${prodotto} ${fasciaRichiesta} - ${quantitaKg} Kg`);

    // Trova limite per fascia
    let limite = await LimiteGiornaliero.findOne({
      data: dataVendita,
      prodotto,
      fascia: fasciaRichiesta,
      attivo: true
    });

    if (!limite) {
      let limiteDefault = 27;
      if (fasciaRichiesta === 'mattina') limiteDefault = 30;
      if (fasciaRichiesta === 'sera') limiteDefault = 26;

      limite = await LimiteGiornaliero.create({
        data: dataVendita,
        prodotto,
        fascia: fasciaRichiesta,
        limiteQuantita: limiteDefault,
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true
      });
    }

    // Calcola totale ordini per la fascia
    const dataFine = new Date(dataVendita);
    dataFine.setDate(dataFine.getDate() + 1);

    let queryOrdini = {
      dataRitiro: { $gte: dataVendita, $lt: dataFine },
      'prodotti.nome': { $regex: new RegExp(`^${prodotto}$`, 'i') }
    };

    if (fasciaRichiesta === 'mattina') {
      queryOrdini.$or = [
        { oraRitiro: { $lt: ORA_CAMBIO_FASCIA } },
        { oraRitiro: { $exists: false } },
        { oraRitiro: null },
        { oraRitiro: '' }
      ];
    } else if (fasciaRichiesta === 'sera') {
      queryOrdini.oraRitiro = { $gte: ORA_CAMBIO_FASCIA };
    }

    const ordini = await Ordine.find(queryOrdini).lean();

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
        message: `[${fasciaRichiesta.toUpperCase()}] Disponibile: ${Math.max(0, disponibile).toFixed(2)} Kg`,
        disponibile: Math.max(0, disponibile)
      });
    }

    // Aggiorna contatore vendite dirette
    limite.quantitaOrdinata += quantitaKg;
    await limite.save();

    console.log(`[LIMITI] Vendita ${fasciaRichiesta} registrata. Dirette: ${limite.quantitaOrdinata} Kg`);

    // Emetti evento Pusher
    try {
      const pusher = (await import('../services/pusherService.js')).default;
      await pusher.trigger('zeppole-channel', 'vendita-diretta', {
        prodotto,
        fascia: fasciaRichiesta,
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
      message: `Vendita ${fasciaRichiesta} di ${quantitaKg} Kg registrata`,
      data: {
        prodotto: limite.prodotto,
        fascia: fasciaRichiesta,
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
 * ✅ 12/02/2026: Supporto campo fascia nel body
 */
router.post('/reset-prodotto', async (req, res) => {
  try {
    const { prodotto, data, fascia } = req.body;

    if (!prodotto) {
      return res.status(400).json({
        success: false,
        message: 'Prodotto obbligatorio'
      });
    }

    const fasciaRichiesta = fascia || 'giornaliero';
    const dataReset = data ? new Date(data) : new Date();
    dataReset.setHours(0, 0, 0, 0);

    console.log(`[LIMITI] POST reset: ${prodotto} ${fasciaRichiesta} data: ${dataReset.toISOString().split('T')[0]}`);

    const limite = await LimiteGiornaliero.findOne({
      data: dataReset,
      prodotto,
      fascia: fasciaRichiesta,
      attivo: true
    });

    if (!limite) {
      return res.status(404).json({
        success: false,
        message: `Limite ${fasciaRichiesta} non trovato per questa data`
      });
    }

    // Reset solo le vendite dirette
    limite.quantitaOrdinata = 0;
    await limite.save();

    console.log(`[LIMITI] Reset ${fasciaRichiesta} completato per ${prodotto}`);

    // Emetti evento Pusher
    try {
      const pusher = (await import('../services/pusherService.js')).default;
      await pusher.trigger('zeppole-channel', 'reset-disponibilita', {
        prodotto,
        fascia: fasciaRichiesta,
        limiteKg: limite.limiteQuantita,
        timestamp: new Date()
      });
    } catch (pusherError) {
      console.warn('[LIMITI] Pusher non disponibile:', pusherError.message);
    }

    res.json({
      success: true,
      message: `Reset ${fasciaRichiesta} completato (solo vendite dirette)`,
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
 * ✅ 12/02/2026: Supporto campo fascia nel body
 */
router.put('/prodotto/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    const { limiteQuantita, data, fascia } = req.body;

    const fasciaRichiesta = fascia || 'giornaliero';
    const dataLimite = data ? new Date(data) : new Date();
    dataLimite.setHours(0, 0, 0, 0);

    console.log(`[LIMITI] PUT modifica limite: ${nome} ${fasciaRichiesta} → ${limiteQuantita} Kg`);

    let limite = await LimiteGiornaliero.findOne({
      data: dataLimite,
      prodotto: nome,
      fascia: fasciaRichiesta,
      attivo: true
    });

    if (!limite) {
      limite = await LimiteGiornaliero.create({
        data: dataLimite,
        prodotto: nome,
        fascia: fasciaRichiesta,
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
        fascia: fasciaRichiesta,
        limiteQuantita,
        timestamp: new Date()
      });
    } catch (pusherError) {
      console.warn('[LIMITI] Pusher non disponibile:', pusherError.message);
    }

    res.json({
      success: true,
      message: `Limite ${fasciaRichiesta} aggiornato a ${limiteQuantita} Kg`,
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