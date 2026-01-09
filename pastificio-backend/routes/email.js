// routes/email.js
import express from 'express';
import emailService from '../services/emailService.js';
import schedulerEmail from '../services/schedulerEmail.js';
import { protect } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// Middleware autenticazione per tutte le route
router.use(protect);

/**
 * @route   GET /api/email/test
 * @desc    Test connessione email service
 * @access  Privato
 */
router.get('/test', async (req, res) => {
  try {
    const isConnected = await emailService.testConnection();
    
    res.json({
      success: true,
      connected: isConnected,
      message: isConnected 
        ? '✅ Email service connesso e funzionante' 
        : '❌ Email service non disponibile',
      config: {
        user: process.env.EMAIL_USER,
        commercialista: process.env.EMAIL_COMMERCIALISTA
      }
    });
  } catch (error) {
    logger.error('❌ Errore test email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Errore verifica connessione email'
    });
  }
});

/**
 * @route   POST /api/email/trigger-report-commercialista
 * @desc    Trigger manuale report mensile commercialista
 * @access  Privato
 */
router.post('/trigger-report-commercialista', async (req, res) => {
  try {
    logger.info('🔧 Trigger manuale report commercialista');
    
    const result = await schedulerEmail.triggerReportMensile();
    
    res.json({ 
      success: true, 
      result,
      message: '✅ Report commercialista inviato con successo'
    });
  } catch (error) {
    logger.error('❌ Errore trigger report:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Errore invio report commercialista'
    });
  }
});

/**
 * @route   POST /api/email/test-send
 * @desc    Invia email di test
 * @access  Privato
 */
router.post('/test-send', async (req, res) => {
  try {
    const { destinatario, oggetto, testo } = req.body;
    
    await emailService.transporter.sendMail({
      from: `"Pastificio Nonna Claudia" <${process.env.EMAIL_USER}>`,
      to: destinatario || process.env.EMAIL_COMMERCIALISTA,
      subject: oggetto || 'Test Email - Pastificio Nonna Claudia',
      text: testo || 'Questa è una email di test dal sistema Pastificio Nonna Claudia.'
    });

    logger.info(`✅ Email di test inviata a ${destinatario || process.env.EMAIL_COMMERCIALISTA}`);
    
    res.json({
      success: true,
      message: '✅ Email di test inviata con successo'
    });
  } catch (error) {
    logger.error('❌ Errore invio email test:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Errore invio email di test'
    });
  }
});

/**
 * @route   GET /api/email/scheduler/status
 * @desc    Stato scheduler email
 * @access  Privato
 */
router.get('/scheduler/status', (req, res) => {
  try {
    const status = schedulerEmail.getStatus();
    
    res.json({
      success: true,
      scheduler: status,
      message: 'Scheduler email attivo'
    });
  } catch (error) {
    logger.error('❌ Errore status scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;