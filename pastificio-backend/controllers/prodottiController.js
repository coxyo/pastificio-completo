// controllers/prodottiController.js
import Prodotto from '../models/Prodotto.js';
import logger from '../config/logger.js';

const prodottiController = {
  // ✅ GET TUTTI I PRODOTTI
  async getAll(req, res) {
    try {
      const { categoria, disponibile, attivo } = req.query;
      
      const filtri = {};
      if (categoria) filtri.categoria = categoria;
      if (disponibile !== undefined) filtri.disponibile = disponibile === 'true';
      if (attivo !== undefined) filtri.attivo = attivo === 'true';
      
      const prodotti = await Prodotto.find(filtri)
        .sort({ categoria: 1, ordine: 1, nome: 1 })
        .lean();
      
      logger.info(`GET /api/prodotti - ${prodotti.length} prodotti trovati`);
      
      res.json({
        success: true,
        data: prodotti,
        count: prodotti.length
      });
    } catch (error) {
      logger.error('Errore GET prodotti:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero dei prodotti',
        error: error.message
      });
    }
  },

  // ✅ GET PRODOTTO PER ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const prodotto = await Prodotto.findById(id).lean();
      
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
      logger.error('Errore GET prodotto:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero del prodotto',
        error: error.message
      });
    }
  },

  // ✅ GET PRODOTTI PER CATEGORIA
  async getByCategoria(req, res) {
    try {
      const { categoria } = req.params;
      
      const prodotti = await Prodotto.getByCategoria(categoria);
      
      res.json({
        success: true,
        data: prodotti,
        count: prodotti.length
      });
    } catch (error) {
      logger.error('Errore GET prodotti per categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero dei prodotti',
        error: error.message
      });
    }
  },

  // ✅ GET SOLO PRODOTTI DISPONIBILI
  async getDisponibili(req, res) {
    try {
      const prodotti = await Prodotto.getDisponibili();
      
      res.json({
        success: true,
        data: prodotti,
        count: prodotti.length
      });
    } catch (error) {
      logger.error('Errore GET prodotti disponibili:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero dei prodotti',
        error: error.message
      });
    }
  },

  // ✅ CREA NUOVO PRODOTTO
  async create(req, res) {
    try {
      const prodottoData = req.body;
      
      // Verifica se esiste già un prodotto con lo stesso nome
      const esistente = await Prodotto.findOne({ nome: prodottoData.nome });
      if (esistente) {
        return res.status(400).json({
          success: false,
          message: 'Esiste già un prodotto con questo nome'
        });
      }
      
      const prodotto = new Prodotto(prodottoData);
      await prodotto.save();
      
      logger.info(`Prodotto creato: ${prodotto.nome} (${prodotto._id})`);
      
      res.status(201).json({
        success: true,
        message: 'Prodotto creato con successo',
        data: prodotto
      });
    } catch (error) {
      logger.error('Errore creazione prodotto:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nella creazione del prodotto',
        error: error.message
      });
    }
  },

  // ✅ AGGIORNA PRODOTTO
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Se si cambia il nome, verifica che non esista già
      if (updateData.nome) {
        const esistente = await Prodotto.findOne({ 
          nome: updateData.nome,
          _id: { $ne: id }
        });
        
        if (esistente) {
          return res.status(400).json({
            success: false,
            message: 'Esiste già un prodotto con questo nome'
          });
        }
      }
      
      const prodotto = await Prodotto.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      logger.info(`Prodotto aggiornato: ${prodotto.nome} (${prodotto._id})`);
      
      res.json({
        success: true,
        message: 'Prodotto aggiornato con successo',
        data: prodotto
      });
    } catch (error) {
      logger.error('Errore aggiornamento prodotto:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'aggiornamento del prodotto',
        error: error.message
      });
    }
  },

  // ✅ ELIMINA PRODOTTO (soft delete)
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const prodotto = await Prodotto.findByIdAndUpdate(
        id,
        { attivo: false },
        { new: true }
      );
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      logger.info(`Prodotto disattivato: ${prodotto.nome} (${prodotto._id})`);
      
      res.json({
        success: true,
        message: 'Prodotto disattivato con successo',
        data: prodotto
      });
    } catch (error) {
      logger.error('Errore eliminazione prodotto:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'eliminazione del prodotto',
        error: error.message
      });
    }
  },

  // ✅ ELIMINA DEFINITIVAMENTE PRODOTTO
  async deleteForce(req, res) {
    try {
      const { id } = req.params;
      
      const prodotto = await Prodotto.findByIdAndDelete(id);
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      logger.warn(`Prodotto eliminato definitivamente: ${prodotto.nome} (${prodotto._id})`);
      
      res.json({
        success: true,
        message: 'Prodotto eliminato definitivamente'
      });
    } catch (error) {
      logger.error('Errore eliminazione definitiva prodotto:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'eliminazione del prodotto',
        error: error.message
      });
    }
  },

  // ✅ AGGIORNA DISPONIBILITÀ
  async updateDisponibilita(req, res) {
    try {
      const { id } = req.params;
      const { disponibile } = req.body;
      
      const prodotto = await Prodotto.findByIdAndUpdate(
        id,
        { disponibile },
        { new: true }
      );
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      logger.info(`Disponibilità prodotto ${disponibile ? 'attivata' : 'disattivata'}: ${prodotto.nome}`);
      
      res.json({
        success: true,
        message: `Prodotto ${disponibile ? 'disponibile' : 'non disponibile'}`,
        data: prodotto
      });
    } catch (error) {
      logger.error('Errore aggiornamento disponibilità:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'aggiornamento della disponibilità',
        error: error.message
      });
    }
  },

  // ✅ AGGIORNA PREZZO
  async updatePrezzo(req, res) {
    try {
      const { id } = req.params;
      const { prezzoKg, prezzoPezzo } = req.body;
      
      const updateData = {};
      if (prezzoKg !== undefined) updateData.prezzoKg = prezzoKg;
      if (prezzoPezzo !== undefined) updateData.prezzoPezzo = prezzoPezzo;
      
      const prodotto = await Prodotto.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      
      if (!prodotto) {
        return res.status(404).json({
          success: false,
          message: 'Prodotto non trovato'
        });
      }
      
      logger.info(`Prezzo aggiornato per ${prodotto.nome}: Kg=${prezzoKg} Pezzo=${prezzoPezzo}`);
      
      res.json({
        success: true,
        message: 'Prezzo aggiornato con successo',
        data: prodotto
      });
    } catch (error) {
      logger.error('Errore aggiornamento prezzo:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'aggiornamento del prezzo',
        error: error.message
      });
    }
  },

  // ✅ CALCOLA PREZZO PRODOTTO
  async calcolaPrezzo(req, res) {
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
      
      const prezzo = prodotto.calcolaPrezzo(
        parseFloat(quantita),
        unita,
        variante
      );
      
      res.json({
        success: true,
        data: {
          prodotto: prodotto.nome,
          quantita: parseFloat(quantita),
          unita,
          variante,
          prezzo
        }
      });
    } catch (error) {
      logger.error('Errore calcolo prezzo:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel calcolo del prezzo',
        error: error.message
      });
    }
  },

  // ✅ GET STATISTICHE PRODOTTI
  async getStatistiche(req, res) {
    try {
      const totali = await Prodotto.countDocuments({});
      const attivi = await Prodotto.countDocuments({ attivo: true });
      const disponibili = await Prodotto.countDocuments({ disponibile: true });
      
      const perCategoria = await Prodotto.aggregate([
        { $match: { attivo: true } },
        { $group: { _id: '$categoria', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      
      res.json({
        success: true,
        data: {
          totali,
          attivi,
          disponibili,
          perCategoria: perCategoria.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      logger.error('Errore statistiche prodotti:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero delle statistiche',
        error: error.message
      });
    }
  }
};

export default prodottiController;