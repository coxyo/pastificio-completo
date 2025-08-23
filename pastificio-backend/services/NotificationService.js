// pastificio-backend/services/notificationService.js
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

class NotificationService {
  constructor() {
    this.io = null;
    this.transporter = null;
    this.initializeEmailTransporter();
  }

  setSocketIO(io) {
    this.io = io;
    logger.info('Socket.IO configurato per il servizio notifiche');
  }

  initializeEmailTransporter() {
    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('Configurazione email mancante. Il servizio email non sarà disponibile.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      // Verifica la configurazione
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Errore verifica configurazione email:', error);
        } else {
          logger.info('Server email pronto per inviare messaggi');
        }
      });
    } catch (error) {
      logger.error('Errore inizializzazione servizio email:', error);
    }
  }

  async sendEmail(to, subject, html) {
    if (!this.transporter) {
      logger.error('Transporter email non configurato');
      return { success: false, error: 'Servizio email non configurato' };
    }

    try {
      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME || 'Pastificio'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email inviata con successo:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Errore invio email:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyNewOrder(order) {
    logger.info('Notifica nuovo ordine:', order._id);
    
    if (this.io) {
      this.io.emit('new-order', {
        orderId: order._id,
        cliente: order.nomeCliente,
        timestamp: new Date()
      });
    }
    
    // Qui potresti aggiungere l'invio email
  }

  async notifyOrderUpdate(order, action) {
    logger.info(`Notifica aggiornamento ordine ${order._id}: ${action}`);
    
    if (this.io) {
      this.io.emit('order-update', {
        orderId: order._id,
        action,
        timestamp: new Date()
      });
    }
  }

  async notifyLowStock(product) {
    logger.info('Notifica scorte basse:', product.nome);
    
    if (this.io) {
      this.io.emit('low-stock', {
        product,
        timestamp: new Date()
      });
    }
    
    // Qui potresti aggiungere l'invio email
  }

  async notifyExpiringProducts(products) {
    logger.info(`Notifica prodotti in scadenza: ${products.length} prodotti`);
    
    if (this.io) {
      this.io.emit('expiring-products', {
        products,
        timestamp: new Date()
      });
    }
  }

  async sendDailyReport() {
    logger.info('Preparazione report giornaliero');
    
    try {
      // Qui implementerai la logica per il report giornaliero
      logger.info('Report giornaliero inviato con successo');
    } catch (error) {
      logger.error('Errore invio report giornaliero:', error);
    }
  }

  async sendCustomAlert(alertData) {
    logger.info('Invio alert personalizzato:', alertData.title);
    
    if (this.io) {
      this.io.emit('custom-alert', {
        ...alertData,
        timestamp: new Date()
      });
    }
    
    // Qui potresti aggiungere l'invio email
  }
}

// Esporta un'istanza singleton
const notificationService = new NotificationService();
export default notificationService;