// pastificio-backend/controllers/notificheController.js
import Notifica from '../models/notifica.js';
import logger from '../config/logger.js';

const notificheController = {
  // Ottieni storico notifiche
  async getStoricoNotifiche(req, res) {
    try {
      const { skip = 0, limit = 50 } = req.query;
      
      const notifiche = await Notifica.find()
        .sort({ timestamp: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit));
      
      const total = await Notifica.countDocuments();
      
      res.json({
        success: true,
        data: notifiche,
        total,
        skip: parseInt(skip),
        limit: parseInt(limit)
      });
    } catch (error) {
      logger.error('Errore nel recupero storico notifiche:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore nel recupero dello storico' 
      });
    }
  },

  // Invia nuova notifica
  async inviaNotifica(req, res) {
    try {
      const { titolo, messaggio, tipo, canale, destinatari } = req.body;
      
      const nuovaNotifica = new Notifica({
        titolo,
        messaggio,
        tipo,
        canale,
        destinatari,
        stato: 'inviata',
        timestamp: new Date(),
        utenteInvio: req.user.username
      });
      
      await nuovaNotifica.save();
      
      // Qui andrà la logica per inviare effettivamente la notifica
      // via email, SMS, push, ecc.
      
      logger.info('Notifica inviata:', nuovaNotifica);
      
      res.json({
        success: true,
        data: nuovaNotifica
      });
    } catch (error) {
      logger.error('Errore invio notifica:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore nell\'invio della notifica' 
      });
    }
  }
};

export default notificheController;