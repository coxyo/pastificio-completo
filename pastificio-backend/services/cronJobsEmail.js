// services/cronJobsEmail.js
// ✅ CRON JOB AUTOMATICO INVIO EMAIL CORRISPETTIVI
// Esegue automaticamente il 3° giorno di ogni mese alle 09:00

import cron from 'node-cron';
import logger from '../config/logger.js';
import emailService from './emailService.js';
import pdfCorrispettiviService from './pdfCorrispettivi.js';
import Corrispettivo from '../models/Corrispettivo.js';

/**
 * CRON JOB EMAIL AUTOMATICHE
 * - Report corrispettivi mensile (3° giorno mese ore 09:00)
 * - Promemoria ritiri ordini (giornaliero ore 18:00)
 */

class CronJobsEmail {
  constructor() {
    this.jobs = [];
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🚀 AVVIA TUTTI I CRON JOBS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  inizializza() {
    logger.info('🚀 Inizializzazione cron jobs email...');

    // 1. Report corrispettivi mensile
    this.avviaReportCorrispettiviMensile();

    // 2. (Opzionale) Promemoria ritiri
    // this.avviaPromemoriaRitiri();

    logger.info(`✅ ${this.jobs.length} cron jobs attivi`);
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📊 CRON: REPORT CORRISPETTIVI MENSILE
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * Esegue il 3° giorno di ogni mese alle 09:00
   * Cron syntax: '0 9 3 * *' = minuto 0, ora 9, giorno 3, ogni mese, ogni giorno settimana
   */
  avviaReportCorrispettiviMensile() {
    const cronExpression = '0 9 3 * *'; // Giorno 3 di ogni mese, ore 09:00

    const job = cron.schedule(cronExpression, async () => {
      try {
        logger.info('📊 ━━━ CRON: Invio report corrispettivi mensile ━━━');

        // Calcola mese/anno precedente
        const oggi = new Date();
        const mesePrecedente = oggi.getMonth(); // Se oggi è 3 gennaio, mese = 0 (dicembre)
        const annoPrecedente = mesePrecedente === 0 ? oggi.getFullYear() - 1 : oggi.getFullYear();
        const mese = mesePrecedente === 0 ? 12 : mesePrecedente;

        logger.info(`📅 Report per: ${mese}/${annoPrecedente}`);

        // Verifica se ci sono dati
        const count = await Corrispettivo.countDocuments({ 
          anno: annoPrecedente, 
          mese: mese 
        });

        if (count === 0) {
          logger.warn(`⚠️ Nessun corrispettivo trovato per ${mese}/${annoPrecedente} - skip invio`);
          return;
        }

        // Genera PDF
        logger.info('📄 Generazione PDF...');
        const pdfBuffer = await pdfCorrispettiviService.generaPdfCorrispettivi(
          annoPrecedente, 
          mese
        );

        // Genera CSV
        logger.info('📊 Generazione CSV...');
        const csvBuffer = await pdfCorrispettiviService.generaCsvCorrispettivi(
          annoPrecedente, 
          mese
        );

        // Invia email
        logger.info('📧 Invio email...');
        const result = await emailService.inviaReportCorrispettiviMensile(
          annoPrecedente,
          mese,
          pdfBuffer,
          csvBuffer
        );

        if (result.success) {
          logger.info(`✅ Report corrispettivi ${mese}/${annoPrecedente} inviato con successo!`);
          logger.info(`   MessageID: ${result.messageId}`);
          logger.info(`   Totale mese: €${result.totali.totaleMese.toFixed(2)}`);
        } else {
          logger.error(`❌ Invio fallito: ${result.reason}`);
        }

      } catch (error) {
        logger.error('❌ ERRORE CRON report corrispettivi:', error);
        // TODO: Inviare notifica errore a admin
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Rome'
    });

    this.jobs.push({
      name: 'reportCorrispettiviMensile',
      cron: cronExpression,
      job: job
    });

    logger.info(`✅ Cron job attivato: Report corrispettivi mensile (${cronExpression})`);
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * ⏰ CRON: PROMEMORIA RITIRI (OPZIONALE)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * Esegue ogni giorno alle 18:00
   * Invia promemoria email/WhatsApp per ordini di domani
   */
  avviaPromemoriaRitiri() {
    const cronExpression = '0 18 * * *'; // Ogni giorno alle 18:00

    const job = cron.schedule(cronExpression, async () => {
      try {
        logger.info('⏰ ━━━ CRON: Invio promemoria ritiri ━━━');

        // TODO: Implementare logica promemoria
        // 1. Trova ordini con ritiro = domani
        // 2. Per ogni ordine, invia WhatsApp o email
        // 3. Registra invio per evitare duplicati

        logger.info('✅ Promemoria ritiri inviati');

      } catch (error) {
        logger.error('❌ ERRORE CRON promemoria ritiri:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Rome'
    });

    this.jobs.push({
      name: 'promemoriaRitiri',
      cron: cronExpression,
      job: job
    });

    logger.info(`✅ Cron job attivato: Promemoria ritiri (${cronExpression})`);
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🛠️ UTILITY
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */

  /**
   * Ferma tutti i cron jobs
   */
  fermatutti() {
    logger.info('⏹️ Fermando tutti i cron jobs...');
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`   Fermato: ${name}`);
    });
    logger.info('✅ Tutti i cron jobs fermati');
  }

  /**
   * Lista cron jobs attivi
   */
  lista() {
    logger.info('📋 Cron jobs attivi:');
    this.jobs.forEach(({ name, cron }) => {
      logger.info(`   - ${name}: ${cron}`);
    });
    return this.jobs;
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🧪 TEST MANUALE (per debugging)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async testInvioReportManualeOggi() {
    try {
      logger.info('🧪 TEST: Invio report corrispettivi manuale...');

      // Usa mese/anno corrente per test
      const oggi = new Date();
      const anno = oggi.getFullYear();
      const mese = oggi.getMonth() + 1; // getMonth() ritorna 0-11

      logger.info(`📅 Test per: ${mese}/${anno}`);

      // Verifica dati
      const count = await Corrispettivo.countDocuments({ anno, mese });
      if (count === 0) {
        logger.warn(`⚠️ Nessun dato trovato per ${mese}/${anno}`);
        return { success: false, reason: 'no_data' };
      }

      // Genera PDF e CSV
      const pdfBuffer = await pdfCorrispettiviService.generaPdfCorrispettivi(anno, mese);
      const csvBuffer = await pdfCorrispettiviService.generaCsvCorrispettivi(anno, mese);

      // Invia email
      const result = await emailService.inviaReportCorrispettiviMensile(
        anno,
        mese,
        pdfBuffer,
        csvBuffer
      );

      logger.info(`✅ Test completato: ${JSON.stringify(result)}`);
      return result;

    } catch (error) {
      logger.error('❌ Errore test invio report:', error);
      throw error;
    }
  }
}

export default new CronJobsEmail();