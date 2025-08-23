// services/emailService.js
import nodemailer from 'nodemailer';
import config from '../config/config.js';
import logger from '../config/logger.js';

// Configurazione del trasporto email
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

// Verifica la configurazione
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    logger.info('Configurazione email verificata');
    return true;
  } catch (error) {
    logger.error(`Errore nella verifica configurazione email: ${error.message}`);
    return false;
  }
};

// Invia una email
export const sendEmail = async (options) => {
  try {
    // Verifica configurazione
    if (!await verifyTransporter()) {
      throw new Error('Configurazione email non valida');
    }
    
    // Prepara il messaggio
    const message = {
      from: `"${config.email.senderName}" <${config.email.user}>`,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    };
    
    // Invia email
    const info = await transporter.sendMail(message);
    
    logger.info(`Email inviata: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Errore nell'invio email: ${error.message}`);
    throw error;
  }
};

export default {
  sendEmail
};