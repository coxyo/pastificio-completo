// services/schedulerHACCP.js
import cron from 'node-cron';
import RegistrazioneHACCP from '../models/RegistrazioneHACCP.js';
import logger from '../config/logger.js';
import emailService from './emailService.js';

/**
 * SCHEDULER HACCP AUTOMATICO
 * - Remind controlli giornalieri
 * - Verifica scadenze prodotti
 * - Alert temperature fuori range
 * - Report settimanale
 */

class HACCPScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Avvia tutti gli scheduler HACCP
   */
  start() {
    logger.info('🌡️ Avvio HACCP Scheduler...');

    // JOB 1: Remind controllo temperature giornaliero
    // Ogni giorno alle 08:00 e 18:00
    const jobRemindTemperature = cron.schedule('0 8,18 * * *', async () => {
      try {
        logger.info('⏰ Remind controllo temperature frigoriferi');
        await this.inviaRemindControlloTemperature();
      } catch (error) {
        logger.error('❌ Errore remind temperature:', error);
      }
    }, {
      scheduled: true,
      timezone: "Europe/Rome"
    });

    this.jobs.push({ name: 'Remind Temperature', job: jobRemindTemperature });
    logger.info('✅ Scheduler Remind Temperature attivo (08:00 e 18:00)');

    // JOB 2: Verifica scadenze prodotti
    // Ogni giorno alle 07:00
    const jobVerificaScadenze = cron.schedule('0 7 * * *', async () => {
      try {
        logger.info('📦 Verifica scadenze prodotti...');
        await this.verificaScadenzeProdotti();
      } catch (error) {
        logger.error('❌ Errore verifica scadenze:', error);
      }
    }, {
      scheduled: true,
      timezone: "Europe/Rome"
    });

    this.jobs.push({ name: 'Verifica Scadenze', job: jobVerificaScadenze });
    logger.info('✅ Scheduler Verifica Scadenze attivo (07:00)');

    // JOB 3: Report HACCP settimanale
    // Ogni Venerdì alle 17:00
    const jobReportSettimanale = cron.schedule('0 17 * * 5', async () => {
      try {
        logger.info('📊 Generazione report HACCP settimanale...');
        await this.generaReportSettimanale();
      } catch (error) {
        logger.error('❌ Errore report settimanale:', error);
      }
    }, {
      scheduled: true,
      timezone: "Europe/Rome"
    });

    this.jobs.push({ name: 'Report Settimanale HACCP', job: jobReportSettimanale });
    logger.info('✅ Scheduler Report Settimanale attivo (Venerdì 17:00)');

    // JOB 4: Verifica non conformità
    // Ogni ora
    const jobVerificaNonConformita = cron.schedule('0 * * * *', async () => {
      try {
        await this.verificaNonConformita();
      } catch (error) {
        logger.error('❌ Errore verifica non conformità:', error);
      }
    }, {
      scheduled: true,
      timezone: "Europe/Rome"
    });

    this.jobs.push({ name: 'Verifica Non Conformità', job: jobVerificaNonConformita });
    logger.info('✅ Scheduler Verifica Non Conformità attivo (ogni ora)');

    logger.info(`✅ HACCP Scheduler avviato con ${this.jobs.length} job attivi`);
  }

  /**
   * Invia remind per controllo temperature
   */
  async inviaRemindControlloTemperature() {
    try {
      // Verifica ultima registrazione
      const ultimaRegistrazione = await RegistrazioneHACCP.findOne({
        tipo: { $in: ['temperatura_frigo', 'temperatura_congelatore'] }
      }).sort({ dataOra: -1 });

      const oreTrascorse = ultimaRegistrazione 
        ? (Date.now() - ultimaRegistrazione.dataOra) / (1000 * 60 * 60)
        : 999;

      // Se sono passate più di 8 ore, invia remind
      if (oreTrascorse > 8) {
        const messaggio = `⏰ REMIND HACCP

È ora di registrare le temperature dei frigoriferi!

Ultima registrazione: ${ultimaRegistrazione 
  ? ultimaRegistrazione.dataOra.toLocaleString('it-IT')
  : 'Mai registrata'}

Dispositivi da controllare:
• Frigo 1 (target: 0-4°C)
• Congelatore principale (target: -18/-25°C)

👉 Accedi al gestionale per registrare le temperature.`;

        logger.info(messaggio);
        // TODO: Inviare via WhatsApp/Email
      }

    } catch (error) {
      logger.error('❌ Errore remind temperature:', error);
    }
  }

  /**
   * Verifica scadenze prodotti
   */
  async verificaScadenzeProdotti() {
    try {
      const oggi = new Date();
      const tra7giorni = new Date(oggi);
      tra7giorni.setDate(tra7giorni.getDate() + 7);

      // Cerca prodotti in scadenza
      const prodottiInScadenza = await RegistrazioneHACCP.find({
        tipo: 'scadenza_prodotto',
        'scadenzaProdotto.dataScadenza': {
          $gte: oggi,
          $lte: tra7giorni
        },
        'scadenzaProdotto.azione': { $ne: 'smaltito' }
      });

      if (prodottiInScadenza.length > 0) {
        logger.warn(`⚠️ ${prodottiInScadenza.length} prodotti in scadenza entro 7 giorni`);
        
        // Genera alert
        const messaggioAlert = `⚠️ ALERT SCADENZE HACCP

${prodottiInScadenza.length} prodotti in scadenza nei prossimi 7 giorni:

${prodottiInScadenza.slice(0, 5).map(p => 
  `• ${p.scadenzaProdotto.nomeProdotto} (Lotto: ${p.scadenzaProdotto.lotto})
   Scadenza: ${p.scadenzaProdotto.dataScadenza.toLocaleDateString('it-IT')}`
).join('\n')}

${prodottiInScadenza.length > 5 ? `\n... e altri ${prodottiInScadenza.length - 5} prodotti` : ''}

👉 Verifica nel gestionale HACCP`;

        logger.warn(messaggioAlert);
        // TODO: Inviare via WhatsApp/Email
      }

    } catch (error) {
      logger.error('❌ Errore verifica scadenze:', error);
    }
  }

  /**
   * Genera report settimanale HACCP
   */
  async generaReportSettimanale() {
    try {
      const oggi = new Date();
      const setteGiorniFa = new Date(oggi);
      setteGiorniFa.setDate(setteGiorniFa.getDate() - 7);

      // Query registrazioni ultima settimana
      const registrazioni = await RegistrazioneHACCP.find({
        dataOra: { $gte: setteGiorniFa }
      });

      // Calcola statistiche
      const stats = {
        totale: registrazioni.length,
        conformi: registrazioni.filter(r => r.conforme).length,
        nonConformi: registrazioni.filter(r => !r.conforme).length,
        perTipo: {}
      };

      registrazioni.forEach(r => {
        stats.perTipo[r.tipo] = (stats.perTipo[r.tipo] || 0) + 1;
      });

      // Log report
      logger.info(`📊 REPORT HACCP SETTIMANALE
      
Periodo: ${setteGiorniFa.toLocaleDateString('it-IT')} - ${oggi.toLocaleDateString('it-IT')}

Registrazioni totali: ${stats.totale}
✅ Conformi: ${stats.conformi}
❌ Non conformi: ${stats.nonConformi}

Registrazioni per tipo:
${Object.entries(stats.perTipo).map(([tipo, count]) => 
  `• ${tipo}: ${count}`
).join('\n')}
      `);

      // TODO: Inviare via email

    } catch (error) {
      logger.error('❌ Errore report settimanale:', error);
    }
  }

  /**
   * Verifica non conformità non risolte
   */
  async verificaNonConformita() {
    try {
      const nonConformita = await RegistrazioneHACCP.find({
        conforme: false,
        richiedeAttenzione: true,
        alertInviato: false
      });

      if (nonConformita.length > 0) {
        logger.warn(`⚠️ ${nonConformita.length} non conformità non risolte`);
        
        // Marca come alert inviati
        await Promise.all(nonConformita.map(nc => {
          nc.alertInviato = true;
          return nc.save();
        }));
      }

    } catch (error) {
      logger.error('❌ Errore verifica non conformità:', error);
    }
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
}

export default new HACCPScheduler();