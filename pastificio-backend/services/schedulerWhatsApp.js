// services/schedulerWhatsApp.js
import cron from 'node-cron';
import Ordine from '../models/Ordine.js';
import * as whatsappService from './whatsappService.js';
import logger from '../config/logger.js';

class SchedulerWhatsApp {
  constructor() {
    this.jobs = new Map();
  }

  inizializza() {
    logger.info('🕐 Inizializzazione scheduler WhatsApp...');
    
    // Promemoria giornaliero alle 18:00
    this.aggiungiJob('promemoria-giorno-prima', '0 18 * * *', this.inviaPromemoriaDomani);

    // ❌ DISABILITATO 07/03/2026 - causa loop notifiche "ordine pronto" ogni ora
    // L'ordine pronto va inviato SOLO manualmente dal gestionale
    // this.aggiungiJob('check-ordini-pronti', '0 * * * *', this.checkOrdiniPronti);
    
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
        stato: { $ne: 'annullato' },
        promemoria_inviato: { $ne: true }
      });
      
      logger.info(`📋 Trovati ${ordiniDomani.length} ordini per domani (senza promemoria già inviato)`);
      
      let inviatiConSuccesso = 0;
      let errori = 0;
      
      for (const ordine of ordiniDomani) {
        const telefono = ordine.telefono || ordine.cliente?.telefono;
        
        if (telefono) {
          try {
            const prodottiLista = ordine.prodotti
              .slice(0, 5)
              .map(p => {
                const qty = p.quantita || 0;
                const unita = p.unitaMisura || p.unita || 'Kg';
                return `• ${p.nome || p.prodotto}: ${qty} ${unita}`;
              })
              .join('\n');
            
            const altriProdotti = ordine.prodotti.length > 5 
              ? `\n• ...e altri ${ordine.prodotti.length - 5} prodotti`
              : '';
            
            const messaggio = `🔔 *Promemoria Ritiro*

Gentile ${ordine.nomeCliente || 'Cliente'},
le ricordiamo il suo ordine per domani ${domani.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} alle ore ${ordine.oraRitiro || '10:00'}.

${prodottiLista}${altriProdotti}

📍 Via Carmine 20/B, Assemini (CA)
📞 070 944382

Pastificio Nonna Claudia 🍝`;
            
            const result = await whatsappService.inviaMessaggio(telefono, messaggio);
            
            if (result.success) {
              ordine.promemoria_inviato = true;
              ordine.promemoria_inviato_at = new Date();
              await ordine.save();
              
              inviatiConSuccesso++;
              logger.info(`✅ Promemoria inviato a ${ordine.nomeCliente} (${telefono})`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
          } catch (error) {
            errori++;
            logger.error(`❌ Errore invio promemoria a ${ordine.nomeCliente}:`, error.message);
          }
        } else {
          logger.warn(`⚠️ Ordine ${ordine._id} - ${ordine.nomeCliente}: nessun telefono disponibile`);
        }
      }
      
      logger.info(`✅ Promemoria completati: ${inviatiConSuccesso} inviati, ${errori} errori`);
      
    } catch (error) {
      logger.error('❌ Errore generale invio promemoria:', error);
    }
  }

  // Check ordini pronti - DISABILITATO dallo scheduler, disponibile solo per chiamata manuale
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

      logger.info(`📦 [checkOrdiniPronti] Trovati ${ordiniOggi.length} ordini pronti da notificare`);
      
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
            
            await Ordine.updateOne(
              { _id: ordine._id },
              { $set: { notificaPronto: true, notificaPronto_at: new Date() } }
            );
            
            logger.info(`✅ Notifica ordine pronto inviata a ${ordine.nomeCliente} (${ordine.telefono}) - ordine ${ordine._id} marcato`);
            
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (error) {
            logger.error(`❌ Errore notifica ordine pronto a ${ordine.nomeCliente}:`, error.message);
          }
        }
      }
    } catch (error) {
      logger.error('❌ Errore check ordini pronti:', error);
    }
  }

  // Invia report giornaliero al proprietario
  async inviaReportGiornaliero() {
    try {
      const NUMERO_PROPRIETARIO = '3898879833';
      
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
      const ordiniAnnullati = ordiniOggi.filter(o => o.stato === 'annullato').length;
      const totaleIncasso = ordiniOggi
        .filter(o => o.stato !== 'annullato')
        .reduce((sum, o) => sum + (o.totale || 0), 0);
      
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
      
      const messaggio = `📊 *Report Giornaliero* - ${oggi.toLocaleDateString('it-IT')}

📦 Ordini: ${totaleOrdini} (${ordiniCompletati} completati, ${ordiniAnnullati} annullati)
💰 Incasso: €${totaleIncasso.toFixed(2)}

🏆 *Top prodotti:*
${topProdotti || 'Nessuno'}

📅 Ordini domani: ${await this.contaOrdiniDomani()}`;
      
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

  ferma() {
    this.jobs.forEach((job, nome) => {
      job.stop();
      logger.info(`⏹️ Job fermato: ${nome}`);
    });
    this.jobs.clear();
  }
}

export default new SchedulerWhatsApp();