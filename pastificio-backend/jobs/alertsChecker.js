// jobs/alertsChecker.js - Cron jobs per controlli automatici alert
import cron from 'node-cron';
import alertsService from '../services/alertsService.js';
import AlertConfig from '../models/AlertConfig.js';
import pusherService from '../services/pusherService.js';
import logger from '../config/logger.js';

class AlertsChecker {
  constructor() {
    this.jobs = new Map();
    this.initialized = false;
  }

  async inizializza() {
    try {
      // Inizializza configurazione default
      await AlertConfig.inizializzaDefaults();
      
      // ══════════════════════════════════════════
      // JOB 1: Controllo giornaliero ore 12:00
      // Zero ordini? Pochi ordini rispetto a media?
      // ══════════════════════════════════════════
      const jobMezzogiorno = cron.schedule('0 12 * * 2-6', async () => {
        logger.info('[ALERTS CRON] 🔔 Controllo mezzogiorno avviato');
        try {
          const alerts = await alertsService.controlloOrdiniGiornata();
          if (alerts.length > 0) {
            await this._notificaPusher(alerts);
          }
        } catch (error) {
          logger.error('[ALERTS CRON] Errore controllo mezzogiorno:', error);
        }
      }, { timezone: 'Europe/Rome' });
      
      this.jobs.set('mezzogiorno', jobMezzogiorno);

      // ══════════════════════════════════════════
      // JOB 2: Controllo fine giornata ore 19:30
      // Riepilogo giornata + incasso vs media
      // ══════════════════════════════════════════
      const jobFineGiornata = cron.schedule('30 19 * * 2-6', async () => {
        logger.info('[ALERTS CRON] 🔔 Controllo fine giornata avviato');
        try {
          const alerts = await alertsService.eseguiControlliGiornalieri();
          if (alerts.length > 0) {
            await this._notificaPusher(alerts);
          }
        } catch (error) {
          logger.error('[ALERTS CRON] Errore controllo fine giornata:', error);
        }
      }, { timezone: 'Europe/Rome' });
      
      this.jobs.set('fineGiornata', jobFineGiornata);

      // ══════════════════════════════════════════
      // JOB 3: Controllo domenica mattina ore 10:00
      // (domenica solo mattina)
      // ══════════════════════════════════════════
      const jobDomenica = cron.schedule('0 10 * * 0', async () => {
        logger.info('[ALERTS CRON] 🔔 Controllo domenica mattina');
        try {
          const alerts = await alertsService.controlloOrdiniGiornata();
          if (alerts.length > 0) {
            await this._notificaPusher(alerts);
          }
        } catch (error) {
          logger.error('[ALERTS CRON] Errore controllo domenica:', error);
        }
      }, { timezone: 'Europe/Rome' });
      
      this.jobs.set('domenica', jobDomenica);

      // ══════════════════════════════════════════
      // JOB 4: Controllo settimanale lunedì 08:00
      // Clienti spariti, prodotti, trend, nuovi top
      // ══════════════════════════════════════════
      const jobSettimanale = cron.schedule('0 8 * * 1', async () => {
        logger.info('[ALERTS CRON] 🔔 Controllo settimanale avviato');
        try {
          const alerts = await alertsService.eseguiControlliSettimanali();
          if (alerts.length > 0) {
            await this._notificaPusher(alerts);
          }
        } catch (error) {
          logger.error('[ALERTS CRON] Errore controllo settimanale:', error);
        }
      }, { timezone: 'Europe/Rome' });
      
      this.jobs.set('settimanale', jobSettimanale);

      this.initialized = true;
      logger.info(`✅ AlertsChecker inizializzato: ${this.jobs.size} cron jobs attivi`);
      logger.info('   📅 Mezzogiorno: mart-sab 12:00');
      logger.info('   📅 Fine giornata: mart-sab 19:30');
      logger.info('   📅 Domenica: dom 10:00');
      logger.info('   📅 Settimanale: lun 08:00');
      
    } catch (error) {
      logger.error('[ALERTS CRON] Errore inizializzazione:', error);
    }
  }

  // Notifica via Pusher ai client connessi
  async _notificaPusher(alerts) {
    try {
      if (!pusherService.isEnabled()) return;
      
      // Invia evento per aggiornare badge campanella
      const nonLetti = await (await import('../models/Alert.js')).default.countNonLetti();
      
      await pusherService.trigger('alerts', 'nuovi-alert', {
        count: alerts.length,
        nonLetti,
        alerts: alerts.map(a => ({
          _id: a._id,
          tipo: a.tipo,
          priorita: a.priorita,
          titolo: a.titolo,
          icona: a.icona
        }))
      });
      
      logger.info(`[ALERTS CRON] 📢 ${alerts.length} alert notificati via Pusher`);
    } catch (error) {
      logger.error('[ALERTS CRON] Errore notifica Pusher:', error);
    }
  }

  // Esecuzione manuale (per test)
  async eseguiOra(tipo = 'tutti') {
    logger.info(`[ALERTS CRON] ▶️ Esecuzione manuale: ${tipo}`);
    
    let alerts = [];
    
    switch (tipo) {
      case 'giornaliero':
        alerts = await alertsService.eseguiControlliGiornalieri();
        break;
      case 'settimanale':
        alerts = await alertsService.eseguiControlliSettimanali();
        break;
      case 'tutti':
      default:
        const g = await alertsService.eseguiControlliGiornalieri();
        const s = await alertsService.eseguiControlliSettimanali();
        alerts = [...g, ...s];
        break;
    }
    
    if (alerts.length > 0) {
      await this._notificaPusher(alerts);
    }
    
    return alerts;
  }

  ferma() {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`[ALERTS CRON] ⏹️ Job ${name} fermato`);
    });
    this.jobs.clear();
    this.initialized = false;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      jobsAttivi: this.jobs.size,
      jobs: Array.from(this.jobs.keys())
    };
  }
}

const alertsChecker = new AlertsChecker();
export default alertsChecker;