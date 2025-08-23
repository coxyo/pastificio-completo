// controllers/inventarioController.js
import Inventario from '../models/Inventario.js';
import Movimento from '../models/movimento.js';
import logger from '../config/logger.js';

const inventarioController = {
  // Ottieni tutto l'inventario
  async getInventario(req, res) {
    try {
      const inventario = await Inventario.find();
      res.json({ success: true, data: inventario });
    } catch (error) {
      logger.error('Errore recupero inventario:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Aggiorna giacenza dopo movimento
  async aggiornaGiacenza(prodottoNome, quantita, tipo) {
    try {
      let inventario = await Inventario.findOne({ prodotto: prodottoNome });
      
      if (!inventario) {
        inventario = new Inventario({
          prodotto: prodottoNome,
          quantitaAttuale: 0,
          unita: 'kg'
        });
      }

      if (tipo === 'carico' || tipo === 'inventario') {
        inventario.quantitaAttuale += Math.abs(quantita);
      } else if (tipo === 'scarico') {
        inventario.quantitaAttuale = Math.max(0, inventario.quantitaAttuale - Math.abs(quantita));
      }

      inventario.ultimoAggiornamento = new Date();
      await inventario.save();

      return inventario;
    } catch (error) {
      logger.error('Errore aggiornamento giacenza:', error);
      throw error;
    }
  },

  // Verifica scorte minime
  async verificaScorteMinime(req, res) {
    try {
      const prodottiSottoScorta = await Inventario.find({
        $expr: { $lt: ['$quantitaAttuale', '$quantitaMinima'] }
      });

      res.json({ 
        success: true, 
        data: prodottiSottoScorta,
        count: prodottiSottoScorta.length 
      });
    } catch (error) {
      logger.error('Errore verifica scorte:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Imposta scorte minime/massime
  async setScorte(req, res) {
    try {
      const { prodotto, quantitaMinima, quantitaMassima } = req.body;
      
      const inventario = await Inventario.findOneAndUpdate(
        { prodotto },
        { 
          quantitaMinima, 
          quantitaMassima,
          ultimoAggiornamento: new Date()
        },
        { new: true, upsert: true }
      );

      res.json({ success: true, data: inventario });
    } catch (error) {
      logger.error('Errore impostazione scorte:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
};

export default inventarioController;