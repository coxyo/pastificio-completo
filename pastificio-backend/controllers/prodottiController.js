// controllers/prodottiController.js
import Prodotto from '../models/Prodotto.js';
import logger from '../config/logger.js';

const prodottiController = {
  // GET /api/prodotti - Ottiene tutti i prodotti
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
      
      const prodotti = await Prodotto.find(filter)
        .sort({ categoria: 1, ordinamento: 1, nome: 1 });
      
      logger.info(`Recuperati ${prodotti.length} prodotti`);
      
      res.json({
        success: true,
        count: prodotti.length,
        data: prodotti
      });
    } catch (error) {
      logger.error('Errore recupero prodotti:', error);
      res.status(500).json({
        success: false,
        message: 'Errore recupero prodotti',
        error: error.message
      });
    }
  },

  // GET /api/prodotti/disponibili - Prodotti disponibili (pubblico)
  getDisponibili: async (req, res) => {
    try {
      const prodotti = await Prodotto.find({ 
        disponibile: true, 
        attivo: true 
      }).sort({ categoria: 1, ordinamento: 1, nome: 1 });
      
      res.json({
        success: true,
        count: prodotti.length,
        data: prodotti
      });
    } catch (error) {
      logger.error('Errore recupero prodotti disponibili:', error);
      res.status(500).json({
        success: false,
        message: 'Errore recupero prodotti disponibili',
        error: error.message
      });
    }
  },

  // GET /api/prodotti/categoria/:categoria
  getByCategoria: async (req, res) => {
    try {
      const { categoria } = req.params;
      
      const prodotti = await Prodotto.find({ 
        categoria, 
        disponibile: true, 
        attivo: true 
      }).sort({ ordinamento: 1, nome: 1 });
      
      res.json({
        success: true,
        categoria,
        count: prodotti.length,
        data: prodotti
      });
    } catch (error) {
      logger.error('Errore recupero per categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Errore recupero per categoria',
        error: error.message
      });
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
      
      res.json({
        success: true,
        statistiche: {
          totale,
          disponibili,
          nonDisponibili: totale - disponibili,
          giacenzeBasse,
          perCategoria: perCategoria.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      logger.error('Errore calcolo statistiche:', error);
      res.status(500).json({
        success: false,
        message: 'Errore calcolo statistiche',
        error: error.message
      });
    }
  },

  // GET /api/prodotti/:id
  getById: async (req, res) => {
    try {
      const prodotto = await Prodotto.findById(req.params.id);
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      res.json({
        success: true,
        data: prodotto
      });
    } catch (error) {
      logger.error('Errore recupero prodotto:', error);
      res.status(500).json({
        success: false,
        message: 'Errore recupero prodotto',
        error: error.message
      });
    }
  },

  // GET /api/prodotti/:id/calcola-prezzo
  calcolaPrezzo: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantita, unita, variante } = req.query;
      
      const prodotto = await Prodotto.findById(id);
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      let prezzoBase = 0;
      let dettagli = '';
      
      // Logica calcolo prezzo basata su unità
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
      
      res.json({
        success: true,
        calcolo: {
          prodotto: prodotto.nome,
          quantita,
          unita,
          prezzoBase: prezzoBase.toFixed(2),
          dettagli,
          variante: variante || null
        }
      });
    } catch (error) {
      logger.error('Errore calcolo prezzo:', error);
      res.status(500).json({
        success: false,
        message: 'Errore calcolo prezzo',
        error: error.message
      });
    }
  },

  // POST /api/prodotti - Crea nuovo prodotto
  create: async (req, res) => {
    try {
      const nuovoProdotto = new Prodotto(req.body);
      await nuovoProdotto.save();
      
      logger.info(`Prodotto creato: ${nuovoProdotto.nome}`);
      
      res.status(201).json({
        success: true,
        message: 'Prodotto creato con successo',
        data: nuovoProdotto
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Esiste già un prodotto con questo nome'
        });
      }
      
      logger.error('Errore creazione prodotto:', error);
      res.status(500).json({
        success: false,
        message: 'Errore creazione prodotto',
        error: error.message
      });
    }
  },

  // PUT /api/prodotti/:id - Aggiorna prodotto ✅ FIX VARIANTI
  update: async (req, res) => {
    try {
      // ✅ NUOVO: Validazione e sanitizzazione varianti se presenti
      if (req.body.varianti && Array.isArray(req.body.varianti)) {
        logger.info(`Aggiornamento prodotto con ${req.body.varianti.length} varianti`);
        
        // Valida che ogni variante abbia almeno nome
        for (let i = 0; i < req.body.varianti.length; i++) {
          const variante = req.body.varianti[i];
          
          // Nome obbligatorio
          if (!variante.nome || variante.nome.trim() === '') {
            return res.status(400).json({
              success: false,
              message: `Variante #${i + 1}: il nome è obbligatorio`
            });
          }
          
          // Sanitizza prezzo
          if (variante.prezzo !== undefined && variante.prezzo !== null) {
            variante.prezzo = parseFloat(variante.prezzo);
            if (isNaN(variante.prezzo) || variante.prezzo < 0) {
              return res.status(400).json({
                success: false,
                message: `Variante "${variante.nome}": prezzo non valido (${variante.prezzo})`
              });
            }
          } else {
            variante.prezzo = 0; // Default
          }
          
          // Sanitizza prezzoMaggiorazione
          if (variante.prezzoMaggiorazione !== undefined && variante.prezzoMaggiorazione !== null) {
            variante.prezzoMaggiorazione = parseFloat(variante.prezzoMaggiorazione);
            if (isNaN(variante.prezzoMaggiorazione)) {
              variante.prezzoMaggiorazione = 0;
            }
          } else {
            variante.prezzoMaggiorazione = 0; // Default
          }
          
          // Sanitizza disponibile
          if (variante.disponibile === undefined) {
            variante.disponibile = true; // Default
          } else {
            variante.disponibile = Boolean(variante.disponibile);
          }
          
          // Sanitizza descrizione
          if (variante.descrizione && typeof variante.descrizione === 'string') {
            variante.descrizione = variante.descrizione.trim();
          }
          
          logger.debug(`Variante sanitizzata: ${JSON.stringify(variante)}`);
        }
      }
      
      // ✅ Sanitizza altri campi numerici
      if (req.body.prezzoKg !== undefined) {
        req.body.prezzoKg = parseFloat(req.body.prezzoKg);
        if (isNaN(req.body.prezzoKg)) req.body.prezzoKg = 0;
      }
      
      if (req.body.prezzoPezzo !== undefined) {
        req.body.prezzoPezzo = parseFloat(req.body.prezzoPezzo);
        if (isNaN(req.body.prezzoPezzo)) req.body.prezzoPezzo = 0;
      }
      
      if (req.body.pezziPerKg !== undefined) {
        req.body.pezziPerKg = parseInt(req.body.pezziPerKg);
        if (isNaN(req.body.pezziPerKg)) req.body.pezziPerKg = 0;
      }
      
      // Aggiorna prodotto
      const prodotto = await Prodotto.findByIdAndUpdate(
        req.params.id,
        req.body,
        { 
          new: true, 
          runValidators: true,
          context: 'query' // ✅ IMPORTANTE: serve per validazioni con update
        }
      );
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      logger.info(`✅ Prodotto aggiornato: ${prodotto.nome}`, {
        id: prodotto._id,
        hasVarianti: !!(prodotto.varianti && prodotto.varianti.length > 0),
        numVarianti: prodotto.varianti ? prodotto.varianti.length : 0
      });
      
      res.json({
        success: true,
        message: 'Prodotto aggiornato con successo',
        data: prodotto
      });
    } catch (error) {
      logger.error('❌ Errore aggiornamento prodotto:', {
        error: error.message,
        stack: error.stack,
        prodottoId: req.params.id,
        body: JSON.stringify(req.body).substring(0, 200) // Log primi 200 caratteri
      });
      
      res.status(500).json({
        success: false,
        message: 'Errore aggiornamento prodotto',
        error: error.message
      });
    }
  },

  // PATCH /api/prodotti/:id/disponibilita
  updateDisponibilita: async (req, res) => {
    try {
      const { disponibile } = req.body;
      
      const prodotto = await Prodotto.findByIdAndUpdate(
        req.params.id,
        { disponibile },
        { new: true }
      );
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      logger.info(`Disponibilità aggiornata: ${prodotto.nome} -> ${disponibile}`);
      
      res.json({
        success: true,
        message: 'Disponibilità aggiornata',
        data: prodotto
      });
    } catch (error) {
      logger.error('Errore aggiornamento disponibilità:', error);
      res.status(500).json({
        success: false,
        message: 'Errore aggiornamento disponibilità',
        error: error.message
      });
    }
  },

  // PATCH /api/prodotti/:id/prezzo
  updatePrezzo: async (req, res) => {
    try {
      const { prezzoKg, prezzoPezzo } = req.body;
      
      const update = {};
      if (prezzoKg !== undefined) update.prezzoKg = prezzoKg;
      if (prezzoPezzo !== undefined) update.prezzoPezzo = prezzoPezzo;
      
      const prodotto = await Prodotto.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true }
      );
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      logger.info(`Prezzo aggiornato: ${prodotto.nome}`);
      
      res.json({
        success: true,
        message: 'Prezzo aggiornato',
        data: prodotto
      });
    } catch (error) {
      logger.error('Errore aggiornamento prezzo:', error);
      res.status(500).json({
        success: false,
        message: 'Errore aggiornamento prezzo',
        error: error.message
      });
    }
  },

  // DELETE /api/prodotti/:id - Soft delete
  delete: async (req, res) => {
    try {
      const prodotto = await Prodotto.findByIdAndUpdate(
        req.params.id,
        { attivo: false },
        { new: true }
      );
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      logger.info(`Prodotto disattivato: ${prodotto.nome}`);
      
      res.json({
        success: true,
        message: 'Prodotto disattivato',
        data: prodotto
      });
    } catch (error) {
      logger.error('Errore disattivazione prodotto:', error);
      res.status(500).json({
        success: false,
        message: 'Errore disattivazione prodotto',
        error: error.message
      });
    }
  },

  // DELETE /api/prodotti/:id/force - Hard delete
  deleteForce: async (req, res) => {
    try {
      const prodotto = await Prodotto.findByIdAndDelete(req.params.id);
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      logger.warn(`Prodotto eliminato definitivamente: ${prodotto.nome}`);
      
      res.json({
        success: true,
        message: 'Prodotto eliminato definitivamente'
      });
    } catch (error) {
      logger.error('Errore eliminazione prodotto:', error);
      res.status(500).json({
        success: false,
        message: 'Errore eliminazione prodotto',
        error: error.message
      });
    }
  }
};

export default prodottiController;