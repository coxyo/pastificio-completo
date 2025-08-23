// pastificio-backend/routes/notifiche.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// Modello per salvare le preferenze (se non esiste già)
let notificationPreferences = {};

// Mock service per l'invio notifiche
const sendEmail = async (to, subject, body) => {
  logger.info(`Email inviata a ${to}: ${subject}`);
  return true;
};

const sendSMS = async (to, message) => {
  logger.info(`SMS inviato a ${to}: ${message}`);
  return true;
};

const sendPushNotification = async (userId, title, message) => {
  logger.info(`Push notification inviata a utente ${userId}: ${title}`);
  return true;
};

// GET /api/notifiche/preferences
router.get('/preferences', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    // Recupera le preferenze salvate o usa i default
    const preferences = notificationPreferences[userId] || {
      email: { 
        enabled: true, 
        address: req.user.email || '' 
      },
      sms: { 
        enabled: false, 
        phoneNumber: '' 
      },
      browser: { 
        enabled: true 
      }
    };

    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    logger.error('Errore recupero preferenze:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore durante il recupero delle preferenze' 
    });
  }
});

// PUT /api/notifiche/preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { email, sms, browser } = req.body;
    
    // Validazione base
    if (email && email.enabled && email.address) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.address)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Indirizzo email non valido' 
        });
      }
    }
    
    // Salva le preferenze in memoria (in produzione usa il database)
    notificationPreferences[userId] = { email, sms, browser };
    
    logger.info('Preferenze notifiche aggiornate', {
      userId,
      preferences: { email, sms, browser }
    });

    res.json({
      success: true,
      message: 'Preferenze salvate con successo',
      preferences: { email, sms, browser }
    });
  } catch (error) {
    logger.error('Errore salvataggio preferenze:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore durante il salvataggio delle preferenze' 
    });
  }
});

// POST /api/notifiche/send-alert
router.post('/send-alert', protect, async (req, res) => {
  try {
    const { titolo, messaggio, tipo = 'info', canale = 'email' } = req.body;
    
    logger.info('Richiesta invio alert ricevuta', {
      titolo,
      tipo,
      canale,
      userId: req.user?.id
    });
    
    if (!titolo || !messaggio) {
      return res.status(400).json({ 
        success: false, 
        error: 'Titolo e messaggio sono obbligatori' 
      });
    }

    let risultati = {
      success: true,
      inviate: 0,
      fallite: 0,
      dettagli: []
    };

    // Gestione invio in base al canale
    switch (canale) {
      case 'email':
        await sendEmail('utenti@pastificio.it', titolo, messaggio);
        risultati.inviate = 1;
        risultati.dettagli.push({ tipo: 'email', status: 'inviata' });
        break;
        
      case 'sms':
        await sendSMS('+39123456789', `${titolo}: ${messaggio}`);
        risultati.inviate = 1;
        risultati.dettagli.push({ tipo: 'sms', status: 'inviato' });
        break;
        
      case 'push':
        await sendPushNotification(req.user.id, titolo, messaggio);
        risultati.inviate = 1;
        risultati.dettagli.push({ tipo: 'push', status: 'inviata' });
        break;
        
      case 'broadcast':
        const promises = [
          sendEmail('utenti@pastificio.it', titolo, messaggio),
          sendSMS('+39123456789', `${titolo}: ${messaggio}`),
          sendPushNotification(req.user.id, titolo, messaggio)
        ];
        
        await Promise.all(promises);
        risultati.inviate = 3;
        risultati.dettagli = [
          { tipo: 'email', status: 'inviata' },
          { tipo: 'sms', status: 'inviato' },
          { tipo: 'push', status: 'inviata' }
        ];
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Canale non valido' 
        });
    }

    // Emetti notifica via WebSocket se disponibile
    const io = req.app.get('io');
    if (io) {
      io.emit('alert:sent', {
        titolo,
        messaggio,
        tipo,
        canale,
        timestamp: new Date(),
        mittente: req.user.username || req.user.email
      });
    }

    logger.info(`Alert inviato con successo: ${titolo} - Canale: ${canale} - Tipo: ${tipo}`, {
      userId: req.user.id,
      risultati
    });

    res.json({
      success: true,
      message: 'Alert inviato con successo',
      risultati
    });

  } catch (error) {
    logger.error('Errore invio alert:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Errore durante l\'invio dell\'alert' 
    });
  }
});

// GET /api/notifiche/templates
router.get('/templates', protect, async (req, res) => {
  try {
    const templates = [
      {
        id: 1,
        nome: 'Ordine Pronto',
        titolo: 'Il tuo ordine è pronto!',
        messaggio: 'Gentile cliente, il tuo ordine #{{numeroOrdine}} è pronto per il ritiro.',
        tipo: 'info',
        canale: 'email'
      },
      {
        id: 2,
        nome: 'Promemoria Ritiro',
        titolo: 'Promemoria ritiro ordine',
        messaggio: 'Ti ricordiamo che domani potrai ritirare il tuo ordine #{{numeroOrdine}}.',
        tipo: 'warning',
        canale: 'sms'
      }
    ];

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error('Errore recupero templates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore durante il recupero dei templates' 
    });
  }
});

// GET /api/notifiche/history
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, skip = 0 } = req.query;
    
    // Dati di esempio
    const history = [
      {
        _id: '1',
        type: 'orders',
        channel: 'email',
        success: true,
        sentAt: new Date(),
        error: null
      }
    ];

    res.json({
      success: true,
      history: history.slice(parseInt(skip), parseInt(skip) + parseInt(limit)),
      total: history.length
    });
  } catch (error) {
    logger.error('Errore recupero storico notifiche:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore durante il recupero dello storico' 
    });
  }
});

// GET /api/notifiche/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = {
      totali: {
        inviate: 150,
        fallite: 5,
        inCoda: 2
      },
      perCanale: {
        email: { inviate: 80, fallite: 2 },
        sms: { inviate: 50, fallite: 3 },
        push: { inviate: 20, fallite: 0 }
      },
      perTipo: {
        info: 60,
        warning: 40,
        error: 25,
        success: 25
      },
      ultimoInvio: new Date()
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Errore recupero statistiche:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore durante il recupero delle statistiche' 
    });
  }
});

export default router;