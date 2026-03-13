// controllers/prodottiController.js - ✅ AGGIORNATO CON RICETTE E COSTI
import Prodotto from '../models/Prodotto.js';
import Ingrediente from '../models/Ingrediente.js';
import ConfigurazioneCosti from '../models/ConfigurazioneCosti.js';
import logger from '../config/logger.js';

// ============================================================
// FUNZIONE HELPER: Ricalcola costi di un prodotto
// Chiamata sia dal controller che dall'import fatture
// ============================================================
export const ricalcolaCostoProdotto = async (prodottoId, configOverride = null) => {
  try {
    const prodotto = await Prodotto.findById(prodottoId);
    if (!prodotto || !prodotto.ricetta || prodotto.ricetta.length === 0) return null;

    const config = configOverride || await ConfigurazioneCosti.getDefault();
    const overhead = config.overhead;

    // Ricalcola costo ingredienti
    let costoIngrediente = 0;
    const ricettaAggiornata = [];

    for (const voce of prodotto.ricetta) {
      const ingrediente = await Ingrediente.findById(voce.ingredienteId)
        .select('ultimoPrezzoAcquisto prezzoMedioAcquisto nome');

      let prezzoUnitario = voce.prezzoUnitarioSnapshot || 0;
      if (ingrediente) {
        prezzoUnitario = ingrediente.ultimoPrezzoAcquisto || ingrediente.prezzoMedioAcquisto || 0;
      }

      const costo = prezzoUnitario * voce.quantitaPerKg;
      costoIngrediente += costo;

      ricettaAggiornata.push({
        ingredienteId: voce.ingredienteId,
        ingredienteNome: voce.ingredienteNome,
        quantitaPerKg: voce.quantitaPerKg,
        unita: voce.unita,
        prezzoUnitarioSnapshot: prezzoUnitario,
        costoCalcolato: costo
      });
    }

    // Determina quale overhead usare
    const useCustom = prodotto.overheadPersonalizzato?.attivo;
    const oh = useCustom ? prodotto.overheadPersonalizzato : overhead;

    const percOverhead = (oh.energia || 0) + (oh.gas || 0) + (oh.manodopera || 0) +
      (oh.affitto || 0) + (oh.tasse || 0) + (oh.imballaggi || 0) + (oh.varie || 0);

    const costoIngredientiBase = prodotto.usaCostoManuale && prodotto.costoIngredientiManuale != null
      ? prodotto.costoIngredientiManuale
      : costoIngrediente;

    const costoTotale = costoIngredientiBase * (1 + percOverhead / 100);

    // Calcola margine dal prezzoKg
    const prezzoVendita = prodotto.prezzoKg || 0;
    const margine = prezzoVendita > 0 && costoTotale > 0
      ? ((prezzoVendita - costoTotale) / costoTotale) * 100
      : 0;

    // Aggiorna prodotto
    await Prodotto.findByIdAndUpdate(prodottoId, {
      $set: {
        ricetta: ricettaAggiornata,
        costoIngredientiCalcolato: costoIngrediente,
        costoTotaleProduzione: costoTotale,
        margineAttuale: margine
      }
    });

    return { costoIngrediente, costoTotale, margine };
  } catch (err) {
    logger.error('Errore ricalcolo costo prodotto:', err);
    return null;
  }
};

// ============================================================
// Ricalcola tutti i prodotti che usano un certo ingrediente
// Chiamata dall'autoImport quando arriva nuova fattura
// ============================================================
export const ricalcolaPerIngrediente = async (ingredienteId) => {
  try {
    const prodotti = await Prodotto.find({
      'ricetta.ingredienteId': ingredienteId,
      attivo: true
    }).select('_id nome');

    if (prodotti.length === 0) return;

    const config = await ConfigurazioneCosti.getDefault();
    const risultati = [];

    for (const p of prodotti) {
      const res = await ricalcolaCostoProdotto(p._id, config);
      if (res) risultati.push({ nome: p.nome, ...res });
    }

    logger.info(`[RICALCOLO] ${risultati.length} prodotti aggiornati per ingrediente ${ingredienteId}`);
    return risultati;
  } catch (err) {
    logger.error('Errore ricalcolo per ingrediente:', err);
  }
};

const prodottiController = {

  // GET /api/prodotti
  getAll: async (req, res) => {
    try {
      const { categoria, disponibile, attivo, search } = req.query;
      let filter = {};
      if (categoria) filter.categoria = categoria;
      if (disponibile !== undefined) filter.disponibile = disponibile === 'true';
      if (attivo !== undefined) filter.attivo = attivo === 'true';
      if (search) {
        filter.$or = [
          { nome: { $regex: search, $options: 'i' } },
          { descrizione: { $regex: search, $options: 'i' } }
        ];
      }
      const prodotti = await Prodotto.find(filter).sort({ categoria: 1, ordinamento: 1, nome: 1 });
      res.json({ success: true, count: prodotti.length, data: prodotti });
    } catch (error) {
      logger.error('Errore recupero prodotti:', error);
      res.status(500).json({ success: false, message: 'Errore recupero prodotti', error: error.message });
    }
  },

  // GET /api/prodotti/disponibili
  getDisponibili: async (req, res) => {
    try {
      const prodotti = await Prodotto.find({ disponibile: true, attivo: true })
        .sort({ categoria: 1, ordinamento: 1, nome: 1 });
      res.json({ success: true, count: prodotti.length, data: prodotti });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // GET /api/prodotti/categoria/:categoria
  getByCategoria: async (req, res) => {
    try {
      const prodotti = await Prodotto.find({
        categoria: req.params.categoria,
        disponibile: true,
        attivo: true
      }).sort({ ordinamento: 1, nome: 1 });
      res.json({ success: true, categoria: req.params.categoria, count: prodotti.length, data: prodotti });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // GET /api/prodotti/statistiche
  getStatistiche: async (req, res) => {
    try {
      const totale = await Prodotto.countDocuments({ attivo: true });
      const disponibili = await Prodotto.countDocuments({ disponibile: true, attivo: true });
      const perCategoria = await Prodotto.aggregate([
        { $match: { attivo: true } },
        { $group: { _id: '$categoria', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      const giacenzeBasse = await Prodotto.countDocuments({
        attivo: true,
        $expr: { $lt: ['$giacenzaAttuale', '$giacenzaMinima'] }
      });
      const conRicetta = await Prodotto.countDocuments({ attivo: true, 'ricetta.0': { $exists: true } });

      res.json({
        success: true,
        statistiche: {
          totale, disponibili,
          nonDisponibili: totale - disponibili,
          giacenzeBasse, conRicetta,
          perCategoria: perCategoria.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // GET /api/prodotti/:id
  getById: async (req, res) => {
    try {
      const prodotto = await Prodotto.findById(req.params.id);
      if (!prodotto) return res.status(404).json({ success: false, message: 'Prodotto non trovato' });
      res.json({ success: true, data: prodotto });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // GET /api/prodotti/:id/calcola-prezzo
  calcolaPrezzo: async (req, res) => {
    try {
      const { quantita, unita, variante } = req.query;
      const prodotto = await Prodotto.findById(req.params.id);
      if (!prodotto) return res.status(404).json({ success: false, message: 'Prodotto non trovato' });

      let prezzoBase = 0;
      let dettagli = '';

      if (unita === 'Kg' || unita === 'mezzo kg') {
        const kg = unita === 'mezzo kg' ? 0.5 : parseFloat(quantita);
        prezzoBase = prodotto.prezzoKg * kg;
        dettagli = `${kg} Kg x €${prodotto.prezzoKg}/Kg`;
      } else if (unita === 'pz' || unita === 'dozzina') {
        const pezzi = unita === 'dozzina' ? parseFloat(quantita) * 12 : parseFloat(quantita);
        if (prodotto.prezzoPezzo > 0) {
          prezzoBase = prodotto.prezzoPezzo * pezzi;
          dettagli = `${pezzi} pz x €${prodotto.prezzoPezzo}/pz`;
        } else if (prodotto.pezziPerKg && prodotto.prezzoKg > 0) {
          const kg = pezzi / prodotto.pezziPerKg;
          prezzoBase = kg * prodotto.prezzoKg;
          dettagli = `${pezzi} pz (${kg.toFixed(2)} Kg) x €${prodotto.prezzoKg}/Kg`;
        }
      } else if (unita === 'g') {
        const kg = parseFloat(quantita) / 1000;
        prezzoBase = prodotto.prezzoKg * kg;
        dettagli = `${quantita}g (${kg.toFixed(3)} Kg) x €${prodotto.prezzoKg}/Kg`;
      }

      res.json({ success: true, calcolo: { prodotto: prodotto.nome, quantita, unita, prezzoBase: prezzoBase.toFixed(2), dettagli, variante: variante || null } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // ============================================================
  // RICETTA - GET /api/prodotti/:id/ricetta
  // ============================================================
  getRicetta: async (req, res) => {
    try {
      const prodotto = await Prodotto.findById(req.params.id)
        .select('nome ricetta istruzioni costoIngredientiCalcolato costoIngredientiManuale usaCostoManuale costoTotaleProduzione margineAttuale overheadPersonalizzato prezzoKg');
      if (!prodotto) return res.status(404).json({ success: false, message: 'Prodotto non trovato' });

      // Arricchisce con prezzi aggiornati dagli ingredienti
      const ricettaArricchita = [];
      for (const voce of (prodotto.ricetta || [])) {
        const ingrediente = await Ingrediente.findById(voce.ingredienteId)
          .select('ultimoPrezzoAcquisto prezzoMedioAcquisto storicoPrezzi nome unitaMisura');
        ricettaArricchita.push({
          ...voce.toObject(),
          prezzoAttualeIngrediente: ingrediente?.ultimoPrezzoAcquisto || 0,
          prezzoMedioIngrediente: ingrediente?.prezzoMedioAcquisto || 0,
          storicoPrezzi: ingrediente?.storicoPrezzi?.slice(-5) || []
        });
      }

      res.json({ success: true, data: { ...prodotto.toObject(), ricetta: ricettaArricchita } });
    } catch (error) {
      logger.error('Errore get ricetta:', error);
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // ============================================================
  // RICETTA - PUT /api/prodotti/:id/ricetta
  // ============================================================
  updateRicetta: async (req, res) => {
    try {
      const { ricetta, istruzioni } = req.body;

      if (!Array.isArray(ricetta)) {
        return res.status(400).json({ success: false, message: 'ricetta deve essere un array' });
      }

      // Valida e arricchisce con snapshot prezzi
      const ricettaProcessata = [];
      for (const voce of ricetta) {
        if (!voce.ingredienteNome || voce.quantitaPerKg == null || voce.quantitaPerKg < 0) {
          return res.status(400).json({ success: false, message: `Voce ricetta non valida: ${JSON.stringify(voce)}` });
        }

        let prezzoSnap = voce.prezzoUnitarioSnapshot || 0;
        if (voce.ingredienteId) {
          const ing = await Ingrediente.findById(voce.ingredienteId).select('ultimoPrezzoAcquisto prezzoMedioAcquisto');
          if (ing) prezzoSnap = ing.ultimoPrezzoAcquisto || ing.prezzoMedioAcquisto || 0;
        }

        ricettaProcessata.push({
          ingredienteId: voce.ingredienteId || null,
          ingredienteNome: voce.ingredienteNome.trim(),
          quantitaPerKg: parseFloat(voce.quantitaPerKg),
          unita: voce.unita || 'kg',
          prezzoUnitarioSnapshot: prezzoSnap,
          costoCalcolato: prezzoSnap * parseFloat(voce.quantitaPerKg)
        });
      }

      const updateData = { $set: { ricetta: ricettaProcessata } };
      if (istruzioni && typeof istruzioni === 'object') {
        updateData.$set.istruzioni = {
          preparazione: istruzioni.preparazione || '',
          cottura:      istruzioni.cottura      || '',
          consigli:     istruzioni.consigli     || ''
        };
      }
      await Prodotto.findByIdAndUpdate(req.params.id, updateData);

      // Ricalcola costi
      const costiAggiornati = await ricalcolaCostoProdotto(req.params.id);

      const prodottoAggiornato = await Prodotto.findById(req.params.id);

      logger.info(`Ricetta aggiornata: ${prodottoAggiornato?.nome}`);

      res.json({
        success: true,
        message: 'Ricetta aggiornata e costi ricalcolati',
        data: prodottoAggiornato,
        costiRicalcolati: costiAggiornati
      });
    } catch (error) {
      logger.error('Errore update ricetta:', error);
      res.status(500).json({ success: false, message: 'Errore aggiornamento ricetta', error: error.message });
    }
  },

  // ============================================================
  // CONFIGURAZIONE COSTI - GET /api/prodotti/configurazione-costi
  // ============================================================
  getConfigurazioneCosti: async (req, res) => {
    try {
      const config = await ConfigurazioneCosti.getDefault();
      res.json({ success: true, data: config });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // ============================================================
  // CONFIGURAZIONE COSTI - PUT /api/prodotti/configurazione-costi
  // ============================================================
  updateConfigurazioneCosti: async (req, res) => {
    try {
      const { overhead, margineConsigliato } = req.body;

      const config = await ConfigurazioneCosti.findOneAndUpdate(
        { tipo: 'default' },
        {
          $set: {
            overhead,
            margineConsigliato: margineConsigliato || 70,
            modificatoDa: req.user?.username || 'Admin',
            modificatoIl: new Date()
          }
        },
        { upsert: true, new: true }
      );

      // Ricalcola tutti i prodotti con la nuova configurazione
      const prodotti = await Prodotto.find({ attivo: true, 'ricetta.0': { $exists: true } }).select('_id');
      for (const p of prodotti) {
        await ricalcolaCostoProdotto(p._id, config);
      }

      logger.info(`Configurazione costi aggiornata da ${config.modificatoDa}`);
      res.json({ success: true, message: 'Configurazione aggiornata e prodotti ricalcolati', data: config });
    } catch (error) {
      logger.error('Errore update configurazione:', error);
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // ============================================================
  // RICALCOLA COSTI - POST /api/prodotti/:id/ricalcola-costi
  // ============================================================
  ricalcolaCosti: async (req, res) => {
    try {
      const risultato = await ricalcolaCostoProdotto(req.params.id);
      if (!risultato) {
        return res.status(400).json({ success: false, message: 'Nessuna ricetta configurata per questo prodotto' });
      }
      const prodotto = await Prodotto.findById(req.params.id);
      res.json({ success: true, message: 'Costi ricalcolati', data: prodotto, costi: risultato });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // ============================================================
  // TABELLA COMPARATIVA - GET /api/prodotti/comparativa
  // ============================================================
  getComparativa: async (req, res) => {
    try {
      const { periodo = 30 } = req.query;

      const prodotti = await Prodotto.find({ attivo: true })
        .select('nome categoria prezzoKg prezzoPezzo costoTotaleProduzione costoIngredientiCalcolato margineAttuale ricetta');

      // Per le vendite mensili usiamo gli ordini
      const Ordine = (await import('../models/Ordine.js')).default;
      const dataInizio = new Date();
      dataInizio.setDate(dataInizio.getDate() - parseInt(periodo));

      const vendite = await Ordine.aggregate([
        {
          $match: {
            stato: { $in: ['completato', 'confermato', 'pronto'] },
            dataCreazione: { $gte: dataInizio }
          }
        },
        { $unwind: '$prodotti' },
        {
          $group: {
            _id: '$prodotti.nome',
            totaleKg: { $sum: '$prodotti.quantitaKg' },
            totaleValore: { $sum: '$prodotti.prezzoTotale' },
            numOrdini: { $sum: 1 }
          }
        }
      ]);

      const venditeMap = {};
      for (const v of vendite) {
        venditeMap[v._id] = { totaleKg: v.totaleKg, totaleValore: v.totaleValore, numOrdini: v.numOrdini };
      }

      const comparativa = prodotti.map(p => {
        const vendita = venditeMap[p.nome] || { totaleKg: 0, totaleValore: 0, numOrdini: 0 };
        const prezzoVendita = p.prezzoKg || p.prezzoPezzo || 0;
        const costo = p.costoTotaleProduzione || 0;
        const margineEuro = prezzoVendita > 0 ? prezzoVendita - costo : 0;
        const marginePerc = costo > 0 && prezzoVendita > 0 ? ((prezzoVendita - costo) / costo) * 100 : 0;
        const profittoMese = vendita.totaleKg > 0 ? margineEuro * vendita.totaleKg : 0;

        return {
          _id: p._id,
          nome: p.nome,
          categoria: p.categoria,
          prezzoVendita,
          costoProduzione: costo,
          costoIngredienti: p.costoIngredientiCalcolato || 0,
          margineEuro: margineEuro.toFixed(2),
          marginePerc: marginePerc.toFixed(1),
          hasRicetta: p.ricetta && p.ricetta.length > 0,
          venditeKg: vendita.totaleKg,
          venditeValore: vendita.totaleValore,
          profittoMese: profittoMese.toFixed(2),
          numOrdini: vendita.numOrdini
        };
      }).sort((a, b) => parseFloat(b.profittoMese) - parseFloat(a.profittoMese));

      res.json({ success: true, data: comparativa, periodo: parseInt(periodo) });
    } catch (error) {
      logger.error('Errore tabella comparativa:', error);
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // ============================================================
  // LISTA INGREDIENTI per dropdown ricetta
  // GET /api/prodotti/ingredienti-disponibili
  // ============================================================
  getIngredientiDisponibili: async (req, res) => {
    try {
      const ingredienti = await Ingrediente.find({ attivo: true })
        .select('nome categoria unitaMisura ultimoPrezzoAcquisto prezzoMedioAcquisto storicoPrezzi')
        .sort({ nome: 1 });
      res.json({ success: true, data: ingredienti });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // POST /api/prodotti
  create: async (req, res) => {
    try {
      const nuovoProdotto = new Prodotto(req.body);
      await nuovoProdotto.save();
      logger.info(`Prodotto creato: ${nuovoProdotto.nome}`);
      res.status(201).json({ success: true, message: 'Prodotto creato con successo', data: nuovoProdotto });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Esiste già un prodotto con questo nome' });
      }
      logger.error('Errore creazione prodotto:', error);
      res.status(500).json({ success: false, message: 'Errore creazione prodotto', error: error.message });
    }
  },

  // PUT /api/prodotti/:id
  update: async (req, res) => {
    try {
      if (req.body.varianti && Array.isArray(req.body.varianti)) {
        for (let i = 0; i < req.body.varianti.length; i++) {
          const variante = req.body.varianti[i];
          if (!variante.nome || variante.nome.trim() === '') {
            return res.status(400).json({ success: false, message: `Variante #${i + 1}: il nome è obbligatorio` });
          }
          variante.prezzo = parseFloat(variante.prezzo) || 0;
          variante.prezzoMaggiorazione = parseFloat(variante.prezzoMaggiorazione) || 0;
          variante.disponibile = variante.disponibile !== undefined ? Boolean(variante.disponibile) : true;
          if (variante.descrizione) variante.descrizione = variante.descrizione.trim();
        }
      }
      if (req.body.prezzoKg !== undefined) req.body.prezzoKg = parseFloat(req.body.prezzoKg) || 0;
      if (req.body.prezzoPezzo !== undefined) req.body.prezzoPezzo = parseFloat(req.body.prezzoPezzo) || 0;
      if (req.body.pezziPerKg !== undefined) req.body.pezziPerKg = parseInt(req.body.pezziPerKg) || null;

      // Rimuovi ricetta dall'update base (gestita da endpoint dedicato)
      delete req.body.ricetta;

      const prodotto = await Prodotto.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true, context: 'query' }
      );

      if (!prodotto) return res.status(404).json({ success: false, message: 'Prodotto non trovato' });

      // Se è cambiato il prezzo, ricalcola il margine
      if (req.body.prezzoKg !== undefined || req.body.prezzoPezzo !== undefined) {
        await ricalcolaCostoProdotto(prodotto._id);
      }

      logger.info(`Prodotto aggiornato: ${prodotto.nome}`);
      res.json({ success: true, message: 'Prodotto aggiornato', data: prodotto });
    } catch (error) {
      logger.error('Errore aggiornamento prodotto:', error);
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // PATCH /api/prodotti/:id/disponibilita
  updateDisponibilita: async (req, res) => {
    try {
      const prodotto = await Prodotto.findByIdAndUpdate(
        req.params.id,
        { disponibile: req.body.disponibile },
        { new: true }
      );
      if (!prodotto) return res.status(404).json({ success: false, message: 'Prodotto non trovato' });
      res.json({ success: true, message: 'Disponibilità aggiornata', data: prodotto });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // PATCH /api/prodotti/:id/prezzo
  updatePrezzo: async (req, res) => {
    try {
      const { prezzoKg, prezzoPezzo } = req.body;
      const update = {};
      if (prezzoKg !== undefined) update.prezzoKg = prezzoKg;
      if (prezzoPezzo !== undefined) update.prezzoPezzo = prezzoPezzo;

      const prodotto = await Prodotto.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!prodotto) return res.status(404).json({ success: false, message: 'Prodotto non trovato' });

      await ricalcolaCostoProdotto(prodotto._id);
      res.json({ success: true, message: 'Prezzo aggiornato', data: prodotto });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // DELETE /api/prodotti/:id
  delete: async (req, res) => {
    try {
      const prodotto = await Prodotto.findByIdAndUpdate(req.params.id, { attivo: false }, { new: true });
      if (!prodotto) return res.status(404).json({ success: false, message: 'Prodotto non trovato' });
      res.json({ success: true, message: 'Prodotto disattivato', data: prodotto });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  },

  // DELETE /api/prodotti/:id/force
  deleteForce: async (req, res) => {
    try {
      const prodotto = await Prodotto.findByIdAndDelete(req.params.id);
      if (!prodotto) return res.status(404).json({ success: false, message: 'Prodotto non trovato' });
      res.json({ success: true, message: 'Prodotto eliminato definitivamente' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Errore', error: error.message });
    }
  }
};

export default prodottiController;