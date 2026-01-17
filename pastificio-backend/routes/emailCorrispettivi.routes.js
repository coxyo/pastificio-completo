// routes/emailCorrispettivi.routes.js
// ✅ API PER TEST E INVIO MANUALE EMAIL CORRISPETTIVI

import express from 'express';
import { protect } from '../middleware/auth.js';
import emailService from '../services/emailService.js';
import pdfCorrispettiviService from '../services/pdfCorrispettivi.js';
import cronJobsEmail from '../services/cronJobsEmail.js';
import logger from '../config/logger.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

/**
 * @route   POST /api/email-corrispettivi/test-connection
 * @desc    Testa connessione email Gmail
 * @access  Privato
 */
router.post('/test-connection', async (req, res) => {
  try {
    logger.info('📧 Test connessione email...');
    
    const isConnected = await emailService.testConnection();
    
    res.json({
      success: isConnected,
      message: isConnected 
        ? '✅ Connessione email attiva' 
        : '❌ Errore connessione email - verifica .env',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Errore test connessione:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/email-corrispettivi/invia-report
 * @desc    Invia report corrispettivi manualmente
 * @body    { anno: 2025, mese: 1 }
 * @access  Privato
 */
router.post('/invia-report', async (req, res) => {
  try {
    const { anno, mese } = req.body;
    
    if (!anno || !mese) {
      return res.status(400).json({
        success: false,
        message: 'Anno e mese sono obbligatori'
      });
    }

    logger.info(`📧 Invio manuale report ${mese}/${anno}...`);

    // Genera PDF
    const pdfBuffer = await pdfCorrispettiviService.generaPdfCorrispettivi(anno, mese);
    
    // Genera CSV
    const csvBuffer = await pdfCorrispettiviService.generaCsvCorrispettivi(anno, mese);

    // Invia email
    const result = await emailService.inviaReportCorrispettiviMensile(
      anno,
      mese,
      pdfBuffer,
      csvBuffer
    );

    res.json({
      success: result.success,
      message: result.success 
        ? `✅ Report ${mese}/${anno} inviato con successo!` 
        : `❌ Invio fallito: ${result.reason}`,
      messageId: result.messageId,
      totali: result.totali,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Errore invio report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/email-corrispettivi/test-report-oggi
 * @desc    Invia report del mese corrente (TEST)
 * @access  Privato
 */
router.post('/test-report-oggi', async (req, res) => {
  try {
    logger.info('🧪 Test invio report mese corrente...');

    const result = await cronJobsEmail.testInvioReportManualeOggi();

    res.json({
      success: result.success,
      message: result.success 
        ? '✅ Email test inviata!' 
        : `❌ Errore: ${result.reason}`,
      messageId: result.messageId,
      totali: result.totali,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Errore test report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/email-corrispettivi/preview-pdf/:anno/:mese
 * @desc    Anteprima PDF senza invio email
 * @access  Privato
 */
router.get('/preview-pdf/:anno/:mese', async (req, res) => {
  try {
    const { anno, mese } = req.params;

    logger.info(`📄 Generazione preview PDF ${mese}/${anno}...`);

    const pdfBuffer = await pdfCorrispettiviService.generaPdfCorrispettivi(
      parseInt(anno), 
      parseInt(mese)
    );

    // Invia PDF come risposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Corrispettivi_${anno}_${mese}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    logger.error('Errore preview PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/email-corrispettivi/download-csv/:anno/:mese
 * @desc    Download CSV senza invio email
 * @access  Privato
 */
router.get('/download-csv/:anno/:mese', async (req, res) => {
  try {
    const { anno, mese } = req.params;

    logger.info(`📊 Generazione CSV ${mese}/${anno}...`);

    const csvBuffer = await pdfCorrispettiviService.generaCsvCorrispettivi(
      parseInt(anno), 
      parseInt(mese)
    );

    // Invia CSV come risposta
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Corrispettivi_${anno}_${mese}.csv"`);
    res.send(csvBuffer);

  } catch (error) {
    logger.error('Errore download CSV:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/email-corrispettivi/cron-jobs
 * @desc    Lista cron jobs attivi
 * @access  Privato
 */
router.get('/cron-jobs', (req, res) => {
  try {
    const jobs = cronJobsEmail.lista();
    
    res.json({
      success: true,
      jobs: jobs.map(({ name, cron }) => ({ name, cron })),
      count: jobs.length
    });
    
  } catch (error) {
    logger.error('Errore lista cron jobs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;