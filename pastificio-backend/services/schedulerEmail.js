// services/schedulerEmail.js
import cron from 'node-cron';
import emailService from './emailService.js';
import logger from '../config/logger.js';

/**
 * SCHEDULER EMAIL AUTOMATICHE
 * - Report mensile commercialista: ogni 1° del mese alle 08:00
 * - Email promemoria ritiri: ogni giorno alle 18:00
 */

class EmailScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Avvia tutti gli scheduler
   */
  start() {
    logger.info('🚀 Avvio Email Scheduler...');

    // JOB 1: Report mensile commercialista
    // Ogni 1° del mese alle 08:00
    const jobReportMensile = cron.schedule('0 8 1 * *', async () => {
      try {
        logger.info('📧 Avvio invio report mensile commercialista...');
        await emailService.inviaReportMensileCommercialista();
        logger.info('✅ Report mensile inviato con successo');
      } catch (error) {
        logger.error('❌ Errore invio report mensile:', error);
      }
    }, {
      scheduled: true,
      timezone: "Europe/Rome"
    });

    this.jobs.push({ name: 'Report Mensile', job: jobReportMensile });
    logger.info('✅ Scheduler Report Mensile attivo (1° giorno del mese, ore 08:00)');

    // JOB 2: Report settimanale (opzionale)
    // Ogni Lunedì alle 09:00
    const jobReportSettimanale = cron.schedule('0 9 * * 1', async () => {
      try {
        logger.info('📧 Report settimanale (opzionale - da implementare)');
        // TODO: Implementare se richiesto
      } catch (error) {
        logger.error('❌ Errore report settimanale:', error);
      }
    }, {
      scheduled: false, // Disabilitato di default
      timezone: "Europe/Rome"
    });

    this.jobs.push({ name: 'Report Settimanale', job: jobReportSettimanale });
    logger.info('ℹ️ Scheduler Report Settimanale disponibile (disabilitato)');

    // JOB 3: Test connessione email
    // Ogni giorno alle 07:00
    const jobTestEmail = cron.schedule('0 7 * * *', async () => {
      try {
        const isConnected = await emailService.testConnection();
        if (!isConnected) {
          logger.warn('⚠️ Connessione email non disponibile!');
        }
      } catch (error) {
        logger.error('❌ Errore test connessione email:', error);
      }
    }, {
      scheduled: true,
      timezone: "Europe/Rome"
    });

    this.jobs.push({ name: 'Test Email', job: jobTestEmail });
    logger.info('✅ Scheduler Test Email attivo (ogni giorno ore 07:00)');

    logger.info(`✅ Email Scheduler avviato con ${this.jobs.length} job attivi`);
  }

  /**
   * Ferma tutti gli scheduler
   */
  stop() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`🛑 Scheduler ${name} fermato`);
    });
  }

  /**
   * Stato scheduler
   */
  getStatus() {
    return this.jobs.map(({ name, job }) => ({
      name,
      running: job.getStatus() === 'scheduled'
    }));
  }

  /**
   * Trigger manuale report (per testing)
   */
  async triggerReportMensile() {
    try {
      logger.info('🔧 Trigger manuale report mensile...');
      return await emailService.inviaReportMensileCommercialista();
    } catch (error) {
      logger.error('❌ Errore trigger manuale:', error);
      throw error;
    }
  }
}

export default new EmailScheduler();