import logger from '../config/logger.js';

// Questo servizio utilizzerà Firebase Cloud Messaging (FCM) per le notifiche push
// In ambiente di sviluppo, simuliamo l'invio delle notifiche
class PushService {
  constructor() {
    // In produzione, inizializza Firebase
    if (process.env.NODE_ENV === 'production') {
      try {
        // Utilizziamo dynamic import per evitare di richiedere firebase in sviluppo
        import('firebase-admin').then(admin => {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            })
          });
          
          this.admin = admin;
          logger.info('Firebase Cloud Messaging inizializzato correttamente', {
            service: 'pushService'
          });
        }).catch(err => {
          logger.error(`Errore nell'inizializzazione di Firebase: ${err.message}`, {
            service: 'pushService',
            error: err
          });
        });
      } catch (error) {
        logger.error(`Errore nell'importazione di Firebase: ${error.message}`, {
          service: 'pushService',
          error
        });
      }
    } else {
      // In ambiente di sviluppo, simuliamo il servizio
      logger.info('Usando servizio push simulato per ambiente di sviluppo', {
        service: 'pushService'
      });
      this.admin = null;
    }
  }

  // Formatta la notifica per FCM
  formatPushNotification(notification) {
    return {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        notificationId: notification._id.toString(),
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt?.toISOString() || new Date().toISOString(),
        actionRequired: notification.actionRequired ? 'true' : 'false',
        actionLink: notification.actionLink || '',
        relatedDocumentType: notification.relatedDocument?.type || '',
        relatedDocumentId: notification.relatedDocument?.id?.toString() || ''
      }
    };
  }

  // Invia notifica push
  async sendNotification(token, notification) {
    try {
      const message = this.formatPushNotification(notification);
      
      if (process.env.NODE_ENV === 'production' && this.admin) {
        // In produzione, usa Firebase per inviare notifiche push reali
        message.token = token;
        const result = await this.admin.messaging().send(message);
        
        logger.info(`Notifica push inviata: ${result}`, {
          service: 'pushService',
          token: token.substring(0, 10) + '...',
          notificationId: notification._id
        });
        
        return result;
      } else {
        // In sviluppo, simula l'invio
        logger.info(`[SIMULATO] Notifica push inviata a ${token.substring(0, 10)}...: ${JSON.stringify(message)}`, {
          service: 'pushService',
          token: token.substring(0, 10) + '...',
          notificationId: notification._id
        });
        
        return {
          messageId: 'SIMULATO_' + Date.now(),
          success: true
        };
      }
    } catch (error) {
      logger.error(`Errore nell'invio della notifica push: ${error.message}`, {
        service: 'pushService',
        error,
        token: token.substring(0, 10) + '...',
        notificationId: notification._id
      });
      throw error;
    }
  }

  // Invia notifica push a più dispositivi
  async sendMulticastNotification(tokens, notification) {
    try {
      const message = this.formatPushNotification(notification);
      
      if (process.env.NODE_ENV === 'production' && this.admin) {
        // In produzione, usa Firebase per inviare notifiche push reali
        message.tokens = tokens;
        const result = await this.admin.messaging().sendMulticast(message);
        
        logger.info(`Notifica push multicast inviata: ${result.successCount}/${tokens.length} successi`, {
          service: 'pushService',
          tokensCount: tokens.length,
          notificationId: notification._id
        });
        
        return result;
      } else {
        // In sviluppo, simula l'invio
        logger.info(`[SIMULATO] Notifica push multicast inviata a ${tokens.length} dispositivi: ${JSON.stringify(message)}`, {
          service: 'pushService',
          tokensCount: tokens.length,
          notificationId: notification._id
        });
        
        return {
          successCount: tokens.length,
          failureCount: 0,
          responses: tokens.map(() => ({ success: true }))
        };
      }
    } catch (error) {
      logger.error(`Errore nell'invio della notifica push multicast: ${error.message}`, {
        service: 'pushService',
        error,
        tokensCount: tokens.length,
        notificationId: notification._id
      });
      throw error;
    }
  }

  // Invia notifica push a un argomento (topic)
  async sendTopicNotification(topic, notification) {
    try {
      const message = this.formatPushNotification(notification);
      
      if (process.env.NODE_ENV === 'production' && this.admin) {
        // In produzione, usa Firebase per inviare notifiche push reali
        message.topic = topic;
        const result = await this.admin.messaging().send(message);
        
        logger.info(`Notifica push inviata al topic ${topic}: ${result}`, {
          service: 'pushService',
          topic,
          notificationId: notification._id
        });
        
        return result;
      } else {
        // In sviluppo, simula l'invio
        logger.info(`[SIMULATO] Notifica push inviata al topic ${topic}: ${JSON.stringify(message)}`, {
          service: 'pushService',
          topic,
          notificationId: notification._id
        });
        
        return {
          messageId: 'SIMULATO_' + Date.now(),
          success: true
        };
      }
    } catch (error) {
      logger.error(`Errore nell'invio della notifica push al topic: ${error.message}`, {
        service: 'pushService',
        error,
        topic,
        notificationId: notification._id
      });
      throw error;
    }
  }
}

// Crea e esporta una singola istanza del servizio
const pushService = new PushService();
export default pushService;