import Notification from '../models/notification.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

// Servizi di notifica che implementeremo in seguito
import emailService from '../services/emailService.js';
import smsService from '../services/smsService.js';
import pushService from '../services/pushService.js';

// Ottiene le notifiche di un utente
export const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Notification.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalCount: count
      }
    });
  } catch (error) {
    logger.error(`Errore nel recupero delle notifiche: ${error.message}`, { 
      service: 'notificationController',
      error
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle notifiche'
    });
  }
};

// Marca una notifica come letta
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({ 
      _id: id, 
      recipient: userId 
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notifica non trovata'
      });
    }

    await notification.markAsRead();

    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error(`Errore nel marcare la notifica come letta: ${error.message}`, {
      service: 'notificationController',
      error
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nel marcare la notifica come letta'
    });
  }
};

// Marca tutte le notifiche come lette
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await Notification.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    logger.error(`Errore nel marcare tutte le notifiche come lette: ${error.message}`, {
      service: 'notificationController',
      error
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nel marcare tutte le notifiche come lette'
    });
  }
};

// Elimina una notifica
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({ 
      _id: id, 
      recipient: userId 
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notifica non trovata'
      });
    }

    return res.status(200).json({
      success: true,
      data: { id }
    });
  } catch (error) {
    logger.error(`Errore nell'eliminazione della notifica: ${error.message}`, {
      service: 'notificationController',
      error
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione della notifica'
    });
  }
};

// Crea una notifica (funzione interna)
export const createNotification = async (notificationData) => {
  try {
    // Crea la notifica nel sistema
    const notification = new Notification(notificationData);
    await notification.save();

    // Invia la notifica attraverso i canali selezionati
    sendThroughChannels(notification);

    // Emetti evento WebSocket per notifiche real-time 
    // (Lo implementeremo in seguito)
    emitNotificationEvent(notification);

    return notification;
  } catch (error) {
    logger.error(`Errore nella creazione della notifica: ${error.message}`, {
      service: 'notificationController',
      error,
      notificationData
    });
    throw error;
  }
};

// Invia la notifica attraverso i canali selezionati
const sendThroughChannels = async (notification) => {
  try {
    const user = await User.findById(notification.recipient);
    if (!user) {
      throw new Error(`Utente non trovato: ${notification.recipient}`);
    }

    const { deliveryChannels } = notification;

    // Invia email se richiesto
    if (deliveryChannels.email && user.email) {
      try {
        await emailService.sendNotification(user.email, notification);
        notification.deliveryStatus.email = 'sent';
      } catch (error) {
        logger.error(`Errore nell'invio dell'email: ${error.message}`, {
          service: 'notificationController',
          error,
          userId: user._id
        });
        notification.deliveryStatus.email = 'failed';
      }
    }

    // Invia SMS se richiesto
    if (deliveryChannels.sms && user.phone) {
      try {
        await smsService.sendNotification(user.phone, notification);
        notification.deliveryStatus.sms = 'sent';
      } catch (error) {
        logger.error(`Errore nell'invio dell'SMS: ${error.message}`, {
          service: 'notificationController',
          error,
          userId: user._id
        });
        notification.deliveryStatus.sms = 'failed';
      }
    }

    // Invia notifica push se richiesto
    if (deliveryChannels.push && user.pushToken) {
      try {
        await pushService.sendNotification(user.pushToken, notification);
        notification.deliveryStatus.push = 'sent';
      } catch (error) {
        logger.error(`Errore nell'invio della notifica push: ${error.message}`, {
          service: 'notificationController',
          error,
          userId: user._id
        });
        notification.deliveryStatus.push = 'failed';
      }
    }

    // Aggiorna lo stato in-app a 'delivered' (poiché è già nel database)
    notification.deliveryStatus.inApp = 'delivered';
    
    // Salva lo stato della consegna aggiornato
    await notification.save();
  } catch (error) {
    logger.error(`Errore nell'invio della notifica: ${error.message}`, {
      service: 'notificationController',
      error,
      notificationId: notification._id
    });
  }
};

// Funzione per emettere eventi WebSocket (implementazione di base)
const emitNotificationEvent = (notification) => {
  // Questo è un placeholder. L'implementazione reale utilizzerà socket.io
  // e sarà integrata con il sistema WebSocket esistente.
  try {
    // La funzione reale sarà implementata quando integriamo con socket.io
    logger.debug('Emissione evento notifica via WebSocket', {
      service: 'notificationController',
      notificationId: notification._id
    });
  } catch (error) {
    logger.error(`Errore nell'emissione dell'evento WebSocket: ${error.message}`, {
      service: 'notificationController',
      error,
      notificationId: notification._id
    });
  }
};

// Ottiene le statistiche delle notifiche
export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false
    });
    
    const byPriority = await Notification.aggregate([
      { $match: { recipient: mongoose.Types.ObjectId(userId) } },
      { $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const byType = await Notification.aggregate([
      { $match: { recipient: mongoose.Types.ObjectId(userId) } },
      { $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        unreadCount,
        byPriority,
        byType
      }
    });
  } catch (error) {
    logger.error(`Errore nel recupero delle statistiche: ${error.message}`, {
      service: 'notificationController',
      error
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche delle notifiche'
    });
  }
};

// API per aggiornare le preferenze di notifica dell'utente
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;
    
    // Aggiorna le preferenze dell'utente
    const user = await User.findByIdAndUpdate(
      userId,
      { 'notificationPreferences': preferences },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: { 
        notificationPreferences: user.notificationPreferences 
      }
    });
  } catch (error) {
    logger.error(`Errore nell'aggiornamento delle preferenze di notifica: ${error.message}`, {
      service: 'notificationController',
      error
    });
    return res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento delle preferenze di notifica'
    });
  }
};

export default {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationStats,
  updateNotificationPreferences
};