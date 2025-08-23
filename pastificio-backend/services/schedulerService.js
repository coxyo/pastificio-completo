// services/schedulerService.js
import cron from 'node-cron';
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  inizializza() {
    try {
      // Per ora disabilitiamo i job per evitare problemi
      logger.info('Scheduler inizializzato (jobs disabilitati temporaneamente)');
      
      // Decommentare quando WhatsApp sarà pronto
      // this.aggiungiJob('promemoria-ritiro', '0 9 * * *', this.inviaPromemoria.bind(this));
      // this.aggiungiJob('ordini-pronti', '0 * * * *', this.notificaOrdiniPronti.bind(this));
      // this.aggiungiJob('report-giornaliero', '0 20 * * *', this.inviaReportGiornaliero.bind(this));
      
    } catch (error) {
      logger.error('Errore inizializzazione scheduler:', error);
    }
  }

  aggiungiJob(nome, cronExpression, callback) {
    try {
      if (this.jobs.has(nome)) {
        this.jobs.get(nome).stop();
      }
      
      const job = cron.schedule(cronExpression, callback, {
        scheduled: true,
        timezone: "Europe/Rome"
      });
      
      this.jobs.set(nome, job);
      logger.info(`Job schedulato: ${nome} (${cronExpression})`);
    } catch (error) {
      logger.error(`Errore aggiunta job ${nome}:`, error);
    }
  }

  async inviaPromemoria() {
    // Implementazione futura
    logger.info('Promemoria job eseguito');
  }

  async notificaOrdiniPronti() {
    // Implementazione futura
    logger.info('Notifica ordini pronti job eseguito');
  }

  async inviaReportGiornaliero() {
    // Implementazione futura
    logger.info('Report giornaliero job eseguito');
  }

  ferma() {
    try {
      this.jobs.forEach((job, nome) => {
        job.stop();
        logger.info(`Job fermato: ${nome}`);
      });
      this.jobs.clear();
    } catch (error) {
      logger.error('Errore fermando scheduler:', error);
    }
  }
}

export default new SchedulerService();
