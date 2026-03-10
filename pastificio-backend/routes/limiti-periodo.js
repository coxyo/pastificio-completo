// routes/limiti-periodo.js - Gestione limiti produzione multi-giorno
// NUOVO 10/03/2026
import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import LimitePeriodo from '../models/LimitePeriodo.js';

const router = express.Router();
router.use(optionalAuth);

// ────────────────────────────────────────────────────────
// GET /api/limiti-periodo
// Lista tutti i periodi (con filtri opzionali)
// Query params: prodotto, attivo, dataInizio, dataFine
// ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { prodotto, attivo, dataInizio, dataFine } = req.query;
    const query = {};

    if (prodotto) query.prodotto = { $regex: new RegExp(`^${prodotto}$`, 'i') };
    if (attivo !== undefined) query.attivo = attivo === 'true';

    // Filtra periodi che si sovrappongono all'intervallo richiesto
    if (dataInizio || dataFine) {
      const dI = dataInizio ? new Date(dataInizio) : new Date('2000-01-01');
      const dF = dataFine ? new Date(dataFine) : new Date('2100-01-01');
      dI.setHours(0, 0, 0, 0);
      dF.setHours(23, 59, 59, 999);
      query.dataInizio = { $lte: dF };
      query.dataFine = { $gte: dI };
    }

    const periodi = await LimitePeriodo.find(query).sort({ dataInizio: 1, prodotto: 1 });

    res.json({
      success: true,
      count: periodi.length,
      data: periodi
    });
  } catch (error) {
    console.error('[LIMITI-PERIODO] Errore GET /:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────
// GET /api/limiti-periodo/:id/stato
// Stato completo di un periodo con percentuali per fascia
// Usato dalla dashboard limiti
// ────────────────────────────────────────────────────────
router.get('/:id/stato', async (req, res) => {
  try {
    const stato = await LimitePeriodo.getStatoPeriodo(req.params.id);
    if (!stato) {
      return res.status(404).json({ success: false, message: 'Periodo non trovato' });
    }
    res.json({ success: true, data: stato });
  } catch (error) {
    console.error('[LIMITI-PERIODO] Errore GET /:id/stato:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────
// GET /api/limiti-periodo/:id
// Dettaglio singolo periodo
// ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const periodo = await LimitePeriodo.findById(req.params.id);
    if (!periodo) {
      return res.status(404).json({ success: false, message: 'Periodo non trovato' });
    }
    res.json({ success: true, data: periodo });
  } catch (error) {
    console.error('[LIMITI-PERIODO] Errore GET /:id:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────
// POST /api/limiti-periodo
// Crea nuovo periodo
// Body: { nome, prodotto, dataInizio, dataFine, limiteTotale, unitaMisura?,
//         fasce: [{data, fascia, limite}], sogliAllerta?, note?, creatoDA? }
// ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      nome, prodotto, dataInizio, dataFine,
      limiteTotale, unitaMisura, fasce,
      sogliAllerta, note, creatoDA
    } = req.body;

    // Validazione base
    if (!nome || !prodotto || !dataInizio || !dataFine || !limiteTotale) {
      return res.status(400).json({
        success: false,
        message: 'Campi obbligatori: nome, prodotto, dataInizio, dataFine, limiteTotale'
      });
    }

    // Controllo sovrapposizione con periodi esistenti per stesso prodotto
    const dI = new Date(dataInizio);
    const dF = new Date(dataFine);
    dI.setHours(0, 0, 0, 0);
    dF.setHours(23, 59, 59, 999);

    const sovrapposizione = await LimitePeriodo.findOne({
      prodotto: { $regex: new RegExp(`^${prodotto}$`, 'i') },
      attivo: true,
      dataInizio: { $lte: dF },
      dataFine: { $gte: dI }
    });

    if (sovrapposizione) {
      return res.status(409).json({
        success: false,
        message: `Esiste già un periodo attivo per "${prodotto}" che si sovrappone: "${sovrapposizione.nome}" (${new Date(sovrapposizione.dataInizio).toLocaleDateString('it-IT')} - ${new Date(sovrapposizione.dataFine).toLocaleDateString('it-IT')})`,
        conflitto: {
          _id: sovrapposizione._id,
          nome: sovrapposizione.nome
        }
      });
    }

    const periodo = new LimitePeriodo({
      nome: nome.trim(),
      prodotto: prodotto.trim(),
      dataInizio: dI,
      dataFine: dF,
      limiteTotale: parseFloat(limiteTotale),
      unitaMisura: unitaMisura || 'Kg',
      fasce: (fasce || []).map(f => ({
        data: new Date(f.data),
        fascia: f.fascia,
        limite: parseFloat(f.limite)
      })),
      sogliAllerta: sogliAllerta || 80,
      note: note || '',
      creatoDA: creatoDA || (req.user?.username) || 'Admin',
      attivo: true
    });

    await periodo.save();

    console.log(`✅ [LIMITI-PERIODO] Creato: "${periodo.nome}" per ${periodo.prodotto} (${new Date(periodo.dataInizio).toLocaleDateString('it-IT')} - ${new Date(periodo.dataFine).toLocaleDateString('it-IT')})`);

    res.status(201).json({ success: true, data: periodo });
  } catch (error) {
    console.error('[LIMITI-PERIODO] Errore POST /:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────
// PUT /api/limiti-periodo/:id
// Aggiorna periodo esistente
// Body: stessi campi di POST (tutti opzionali)
// ────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const periodo = await LimitePeriodo.findById(req.params.id);
    if (!periodo) {
      return res.status(404).json({ success: false, message: 'Periodo non trovato' });
    }

    const campiAggiornabili = ['nome', 'limiteTotale', 'unitaMisura', 'fasce', 'sogliAllerta', 'note', 'attivo'];
    campiAggiornabili.forEach(campo => {
      if (req.body[campo] !== undefined) {
        if (campo === 'fasce') {
          periodo.fasce = req.body.fasce.map(f => ({
            data: new Date(f.data),
            fascia: f.fascia,
            limite: parseFloat(f.limite)
          }));
        } else {
          periodo[campo] = req.body[campo];
        }
      }
    });

    // Aggiorna date se fornite
    if (req.body.dataInizio) {
      periodo.dataInizio = new Date(req.body.dataInizio);
      periodo.dataInizio.setHours(0, 0, 0, 0);
    }
    if (req.body.dataFine) {
      periodo.dataFine = new Date(req.body.dataFine);
      periodo.dataFine.setHours(23, 59, 59, 999);
    }

    await periodo.save();

    console.log(`✅ [LIMITI-PERIODO] Aggiornato: "${periodo.nome}" (${periodo._id})`);
    res.json({ success: true, data: periodo });
  } catch (error) {
    console.error('[LIMITI-PERIODO] Errore PUT /:id:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────
// DELETE /api/limiti-periodo/:id
// Elimina (o disattiva) periodo
// Query param: ?soft=true → solo disattiva (default: elimina)
// ────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { soft } = req.query;

    if (soft === 'true') {
      // Disattiva senza eliminare
      const periodo = await LimitePeriodo.findByIdAndUpdate(
        req.params.id,
        { attivo: false },
        { new: true }
      );
      if (!periodo) {
        return res.status(404).json({ success: false, message: 'Periodo non trovato' });
      }
      console.log(`✅ [LIMITI-PERIODO] Disattivato: "${periodo.nome}" (${periodo._id})`);
      return res.json({ success: true, message: 'Periodo disattivato', data: periodo });
    }

    const periodo = await LimitePeriodo.findByIdAndDelete(req.params.id);
    if (!periodo) {
      return res.status(404).json({ success: false, message: 'Periodo non trovato' });
    }

    console.log(`✅ [LIMITI-PERIODO] Eliminato: "${periodo.nome}" (${periodo._id})`);
    res.json({ success: true, message: 'Periodo eliminato' });
  } catch (error) {
    console.error('[LIMITI-PERIODO] Errore DELETE /:id:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────
// POST /api/limiti-periodo/verifica
// Verifica se un ordine supera limiti periodo
// (endpoint dedicato, usato anche da NuovoOrdine.js frontend)
// Body: { dataRitiro, prodotti, oraRitiro }
// ────────────────────────────────────────────────────────
router.post('/verifica', async (req, res) => {
  try {
    const { dataRitiro, prodotti, oraRitiro } = req.body;

    if (!dataRitiro || !prodotti) {
      return res.status(400).json({
        success: false,
        message: 'dataRitiro e prodotti sono obbligatori'
      });
    }

    const risultato = await LimitePeriodo.verificaOrdine(dataRitiro, prodotti, oraRitiro);

    res.json({ success: true, ...risultato });
  } catch (error) {
    console.error('[LIMITI-PERIODO] Errore POST /verifica:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────
// GET /api/limiti-periodo/attivi-oggi
// Periodi che coprono la data odierna (o una data fornita)
// Query param: ?data=YYYY-MM-DD
// ────────────────────────────────────────────────────────
router.get('/attivi-oggi', async (req, res) => {
  try {
    const data = req.query.data ? new Date(req.query.data) : new Date();
    data.setHours(0, 0, 0, 0);

    const periodi = await LimitePeriodo.find({
      attivo: true,
      dataInizio: { $lte: data },
      dataFine: { $gte: data }
    }).sort({ prodotto: 1 });

    // Arricchisci con stato
    const periodiConStato = await Promise.all(
      periodi.map(p => LimitePeriodo.getStatoPeriodo(p._id))
    );

    res.json({
      success: true,
      count: periodiConStato.length,
      data: periodiConStato.filter(Boolean)
    });
  } catch (error) {
    console.error('[LIMITI-PERIODO] Errore GET /attivi-oggi:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;