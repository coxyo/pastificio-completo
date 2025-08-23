// services/schedulerWhatsApp.js
import cron from 'node-cron';
import Ordine from '../models/Ordine.js';
import whatsappService from './whatsappService.js';
import logger from '../config/logger.js';

class SchedulerWhatsApp {
  constructor() {
    this.jobs = new Map();
  }

  inizializza() {
    logger.info('🕐 Inizializzazione scheduler WhatsApp...');
    
    // Promemoria giornaliero alle 18:00
    this.aggiungiJob('promemoria-giorno-prima', '0 18 * * *', this.inviaPromemoriaDomani);
    
    // Check ordini pronti ogni ora
    this.aggiungiJob('check-ordini-pronti', '0 * * * *', this.checkOrdiniPronti);
    
    // Report giornaliero alle 20:00
    this.aggiungiJob('report-giornaliero', '0 20 * * *', this.inviaReportGiornaliero);
    
    // Auguri festività (esempio Natale)
    this.aggiungiJob('auguri-natale', '0 9 25 12 *', () => this.inviaAuguriFestivita('Natale'));
    this.aggiungiJob('auguri-pasqua', '0 9 1 4 *', () => this.inviaAuguriFestivita('Pasqua'));
    
    logger.info('✅ Scheduler WhatsApp attivato');
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

  // Invia promemoria per ordini di domani
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
            const prodottiBreve = ordine.prodotti
              .slice(0, 3)
              .map(p => `• ${p.nome}`)
              .join('\n');
            
            await whatsappService.inviaMessaggioConTemplate(
              ordine.telefono,
              'promemoria-giorno-prima',
              {
                nomeCliente: ordine.nomeCliente,
                dataRitiro: domani.toLocaleDateString('it-IT'),
                oraRitiro: ordine.oraRitiro,
                prodottiBreve: prodottiBreve + (ordine.prodotti.length > 3 ? '\n• ...' : '')
              }
            );
            
            logger.info(`✅ Promemoria inviato a ${ordine.nomeCliente}`);
            
            // Pausa tra messaggi per evitare ban
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

  // Check ordini pronti (da chiamare manualmente quando un ordine è pronto)
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
            await whatsappService.inviaMessaggioConTemplate(
              ordine.telefono,
              'ordine-pronto',
              {
                nomeCliente: ordine.nomeCliente,
                oraRitiro: ordine.oraRitiro
              }
            );
            
            // Marca come notificato
            ordine.notificaPronto = true;
            await ordine.save();
            
            logger.info(`✅ Notifica ordine pronto inviata a ${ordine.nomeCliente}`);
            
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

  // Invia report giornaliero al proprietario
  async inviaReportGiornaliero() {
    try {
      const NUMERO_PROPRIETARIO = '3898879833'; // Il tuo numero
      
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const domani = new Date(oggi);
      domani.setDate(domani.getDate() + 1);
      
      // Statistiche del giorno
      const ordiniOggi = await Ordine.find({
        dataRitiro: {
          $gte: oggi,
          $lt: domani
        }
      });
      
      const totaleOrdini = ordiniOggi.length;
      const ordiniCompletati = ordiniOggi.filter(o => o.stato === 'completato').length;
      const ordiniAnnullati = ordiniOggi.filter(o => o.stato === 'annullato').length;
      const totaleIncasso = ordiniOggi
        .filter(o => o.stato !== 'annullato')
        .reduce((sum, o) => sum + (o.totale || 0), 0);
      
      // Prodotti più venduti
      const prodottiVenduti = {};
      ordiniOggi.forEach(ordine => {
        ordine.prodotti.forEach(p => {
          if (!prodottiVenduti[p.nome]) {
            prodottiVenduti[p.nome] = 0;
          }
          prodottiVenduti[p.nome] += p.quantita;
        });
      });
      
      const topProdotti = Object.entries(prodottiVenduti)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nome, qty]) => `• ${nome}: ${qty}`)
        .join('\n');
      
      const messaggio = `📊 *REPORT GIORNALIERO* 📊
${oggi.toLocaleDateString('it-IT')}

📦 *ORDINI:*
- Totali: ${totaleOrdini}
- Completati: ${ordiniCompletati}
- Annullati: ${ordiniAnnullati}

💰 *INCASSO:* €${totaleIncasso.toFixed(2)}

🏆 *TOP PRODOTTI:*
${topProdotti || 'Nessuno'}

📅 *ORDINI DOMANI:* ${await this.contaOrdiniDomani()}

Buon lavoro! 💪`;
      
      await whatsappService.inviaMessaggio(NUMERO_PROPRIETARIO, messaggio);
      logger.info('✅ Report giornaliero inviato');
      
    } catch (error) {
      logger.error('Errore invio report:', error);
    }
  }

  async contaOrdiniDomani() {
    const domani = new Date();
    domani.setDate(domani.getDate() + 1);
    domani.setHours(0, 0, 0, 0);
    const dopodomani = new Date(domani);
    dopodomani.setDate(dopodomani.getDate() + 1);
    
    const count = await Ordine.countDocuments({
      dataRitiro: {
        $gte: domani,
        $lt: dopodomani
      },
      stato: { $ne: 'annullato' }
    });
    
    return count;
  }

  // Invia auguri per festività
  async inviaAuguriFestivita(festivita) {
    try {
      const messaggi = {
        'Natale': {
          messaggio: 'In questo magico Natale, vogliamo ringraziarti per la fiducia che ci hai accordato durante l\'anno.',
          auguri: 'Buon Natale e Felice Anno Nuovo'
        },
        'Pasqua': {
          messaggio: 'La Pasqua è rinascita e speranza. Grazie per essere parte della nostra famiglia.',
          auguri: 'Buona Pasqua'
        }
      };
      
      const festivitaData = messaggi[festivita];
      if (!festivitaData) return;
      
      // Prendi clienti attivi (con ordini negli ultimi 3 mesi)
      const treMesiFa = new Date();
      treMesiFa.setMonth(treMesiFa.getMonth() - 3);
      
      const clientiAttivi = await Ordine.distinct('telefono', {
        createdAt: { $gte: treMesiFa }
      });
      
      logger.info(`🎄 Invio auguri ${festivita} a ${clientiAttivi.length} clienti`);
      
      for (const telefono of clientiAttivi) {
        const ordine = await Ordine.findOne({ telefono }).sort('-createdAt');
        if (ordine) {
          try {
            await whatsappService.inviaMessaggioConTemplate(
              telefono,
              'auguri-festivita',
              {
                nomeCliente: ordine.nomeCliente,
                messaggioFestivita: festivitaData.messaggio,
                auguri: festivitaData.auguri
              }
            );
            
            await new Promise(resolve => setTimeout(resolve, 5000));
          } catch (error) {
            logger.error(`Errore invio auguri a ${telefono}:`, error);
          }
        }
      }
      
      logger.info(`✅ Auguri ${festivita} completati`);
    } catch (error) {
      logger.error('Errore invio auguri:', error);
    }
  }

  // Ferma tutti i job
  ferma() {
    this.jobs.forEach((job, nome) => {
      job.stop();
      logger.info(`⏹️ Job fermato: ${nome}`);
    });
    this.jobs.clear();
  }
}

export default new SchedulerWhatsApp();
