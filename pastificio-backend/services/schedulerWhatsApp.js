// services/schedulerWhatsApp.js - VERSIONE TWILIO
import cron from 'node-cron';
import Ordine from '../models/Ordine.js';
import twilioService from './twilioService.js';
import logger from '../config/logger.js';

class SchedulerWhatsApp {
  constructor() {
    this.jobs = new Map();
  }

  inizializza() {
    logger.info('📅 Inizializzazione scheduler WhatsApp con Twilio...');
    
    // Promemoria giornaliero alle 18:00
    this.aggiungiJob('promemoria-giorno-prima', '0 18 * * *', this.inviaPromemoriaDomani);
    
    // Check ordini pronti ogni ora
    this.aggiungiJob('check-ordini-pronti', '0 * * * *', this.checkOrdiniPronti);
    
    // Report giornaliero alle 20:00
    this.aggiungiJob('report-giornaliero', '0 20 * * *', this.inviaReportGiornaliero);
    
    logger.info('✅ Scheduler WhatsApp Twilio attivato');
  }

  aggiungiJob(nome, cronExpression, funzione) {
    if (this.jobs.has(nome)) {
      this.jobs.get(nome).stop();
    }
    
    const job = cron.schedule(cronExpression, funzione.bind(this), {
      scheduled: true,
      timezone: "Europe/Rome"
    });
    
    this.jobs.set(nome, job);
    logger.info(`📅 Job schedulato: ${nome} - ${cronExpression}`);
  }

  async inviaPromemoriaDomani() {
    try {
      logger.info('🔔 Invio promemoria per ordini di domani...');
      
      const domani = new Date();
      domani.setDate(domani.getDate() + 1);
      domani.setHours(0, 0, 0, 0);
      
      const dopodomani = new Date(domani);
      dopodomani.setDate(dopodomani.getDate() + 1);
      
      const ordiniDomani = await Ordine.find({
        dataRitiro: {
          $gte: domani,
          $lt: dopodomani
        },
        stato: { $ne: 'annullato' }
      });
      
      logger.info(`📋 Trovati ${ordiniDomani.length} ordini per domani`);
      
      for (const ordine of ordiniDomani) {
        if (ordine.telefono) {
          try {
            await twilioService.inviaMessaggioConTemplate(
              ordine.telefono,
              'promemoria',
              {
                nomeCliente: ordine.nomeCliente,
                dataRitiro: domani.toLocaleDateString('it-IT'),
                oraRitiro: ordine.oraRitiro
              }
            );
            
            logger.info(`✅ Promemoria Twilio inviato a ${ordine.nomeCliente}`);
            
            // Pausa tra messaggi per evitare rate limits
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (error) {
            logger.error(`Errore invio promemoria a ${ordine.nomeCliente}:`, error);
          }
        }
      }
      
      logger.info('✅ Promemoria completati');
    } catch (error) {
      logger.error('Errore invio promemoria:', error);
    }
  }

  async checkOrdiniPronti() {
    try {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const domani = new Date(oggi);
      domani.setDate(domani.getDate() + 1);
      
      const ordiniOggi = await Ordine.find({
        dataRitiro: {
          $gte: oggi,
          $lt: domani
        },
        stato: 'completato',
        notificaPronto: { $ne: true }
      });
      
      for (const ordine of ordiniOggi) {
        if (ordine.telefono) {
          try {
            await twilioService.inviaMessaggioConTemplate(
              ordine.telefono,
              'ordine-pronto',
              {
                nomeCliente: ordine.nomeCliente,
                oraRitiro: ordine.oraRitiro
              }
            );
            
            ordine.notificaPronto = true;
            await ordine.save();
            
            logger.info(`✅ Notifica ordine pronto inviata con Twilio a ${ordine.nomeCliente}`);
            
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (error) {
            logger.error(`Errore notifica ordine pronto:`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Errore check ordini pronti:', error);
    }
  }

  async inviaReportGiornaliero() {
    try {
      const NUMERO_PROPRIETARIO = process.env.OWNER_PHONE || '3898879833';
      
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const domani = new Date(oggi);
      domani.setDate(domani.getDate() + 1);
      
      const ordiniOggi = await Ordine.find({
        dataRitiro: {
          $gte: oggi,
          $lt: domani
        }
      });
      
      const totaleOrdini = ordiniOggi.length;
      const ordiniCompletati = ordiniOggi.filter(o => o.stato === 'completato').length;
      const totaleIncasso = ordiniOggi
        .filter(o => o.stato !== 'annullato')
        .reduce((sum, o) => sum + (o.totale || 0), 0);
      
      const messaggio = `📊 *REPORT GIORNALIERO*\n` +
        `${oggi.toLocaleDateString('it-IT')}\n\n` +
        `📦 Ordini: ${totaleOrdini}\n` +
        `✅ Completati: ${ordiniCompletati}\n` +
        `💰 Incasso: €${totaleIncasso.toFixed(2)}\n\n` +
        `Sistema: Twilio WhatsApp Business`;
      
      await twilioService.inviaMessaggio(NUMERO_PROPRIETARIO, messaggio);
      logger.info('✅ Report giornaliero inviato con Twilio');
      
    } catch (error) {
      logger.error('Errore invio report:', error);
    }
  }

  ferma() {
    this.jobs.forEach((job, nome) => {
      job.stop();
      logger.info(`⏹️ Job fermato: ${nome}`);
    });
    this.jobs.clear();
  }
}

export default new SchedulerWhatsApp();