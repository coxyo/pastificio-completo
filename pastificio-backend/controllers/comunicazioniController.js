// controllers/comunicazioniController.js
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';
import emailService from '../services/emailService.js';
import smsService from '../services/smsService.js';
import whatsappService from '../services/whatsappService.js';
import ComunicazioneLog from '../models/ComunicazioneLog.js';

export const inviaEmail = async (req, res) => {
  try {
    const { clientiIds, oggetto, messaggio, template, filtri } = req.body;
    
    let clientiQuery = {};
    
    // Se sono specificati clienti specifici
    if (clientiIds && clientiIds.length > 0) {
      clientiQuery._id = { $in: clientiIds };
    }
    
    // Altrimenti usa i filtri
    else if (filtri) {
      if (filtri.livelloFedelta) {
        clientiQuery.livelloFedelta = filtri.livelloFedelta;
      }
      if (filtri.puntiMinimi) {
        clientiQuery.punti = { $gte: filtri.puntiMinimi };
      }
      if (filtri.tipo) {
        clientiQuery.tipo = filtri.tipo;
      }
      if (filtri.attivo !== undefined) {
        clientiQuery.attivo = filtri.attivo;
      }
    }
    
    // Assicurati che abbiano email
    clientiQuery.email = { $exists: true, $ne: '' };
    
    const clienti = await Cliente.find(clientiQuery);

    const risultati = [];
    
    for (const cliente of clienti) {
      try {
        await emailService.sendEmail({
          to: cliente.email,
          subject: oggetto,
          text: messaggio,
          template: template,
          data: {
            nome: cliente.nome,
            cognome: cliente.cognome,
            nomeCompleto: cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome}`,
            punti: cliente.punti,
            livello: cliente.livelloFedelta,
            totaleSpeso: cliente.statistiche?.totaleSpeso || 0,
            numeroOrdini: cliente.statistiche?.numeroOrdini || 0
          }
        });
        
        // Log comunicazione
        await ComunicazioneLog.create({
          tipo: 'email',
          cliente: cliente._id,
          destinatario: cliente.email,
          oggetto: oggetto,
          messaggio: messaggio,
          template: template,
          stato: 'inviato',
          inviatoDa: req.user.id
        });
        
        risultati.push({
          cliente: cliente._id,
          nome: cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome}`,
          email: cliente.email,
          stato: 'inviato'
        });
      } catch (error) {
        logger.error(`Errore invio email a ${cliente.email}:`, error);
        
        // Log errore
        await ComunicazioneLog.create({
          tipo: 'email',
          cliente: cliente._id,
          destinatario: cliente.email,
          oggetto: oggetto,
          messaggio: messaggio,
          template: template,
          stato: 'errore',
          errore: error.message,
          inviatoDa: req.user.id
        });
        
        risultati.push({
          cliente: cliente._id,
          nome: cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome}`,
          email: cliente.email,
          stato: 'errore',
          errore: error.message
        });
      }
    }

    res.json({
      success: true,
      risultati,
      totale: risultati.length,
      inviati: risultati.filter(r => r.stato === 'inviato').length,
      errori: risultati.filter(r => r.stato === 'errore').length
    });

  } catch (error) {
    logger.error('Errore invio email:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'invio delle email'
    });
  }
};

export const inviaSMS = async (req, res) => {
  try {
    const { clientiIds, messaggio, filtri } = req.body;
    
    let clientiQuery = {};
    
    // Se sono specificati clienti specifici
    if (clientiIds && clientiIds.length > 0) {
      clientiQuery._id = { $in: clientiIds };
    }
    
    // Altrimenti usa i filtri
    else if (filtri) {
      if (filtri.livelloFedelta) {
        clientiQuery.livelloFedelta = filtri.livelloFedelta;
      }
      if (filtri.puntiMinimi) {
        clientiQuery.punti = { $gte: filtri.puntiMinimi };
      }
      if (filtri.tipo) {
        clientiQuery.tipo = filtri.tipo;
      }
      if (filtri.attivo !== undefined) {
        clientiQuery.attivo = filtri.attivo;
      }
    }
    
    // Assicurati che abbiano telefono
    clientiQuery.telefono = { $exists: true, $ne: '' };
    
    const clienti = await Cliente.find(clientiQuery);

    const risultati = [];
    
    for (const cliente of clienti) {
      try {
        // Personalizza il messaggio
        let messaggioPersonalizzato = messaggio
          .replace('{nome}', cliente.nome || '')
          .replace('{cognome}', cliente.cognome || '')
          .replace('{nomeCompleto}', cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome}`)
          .replace('{punti}', cliente.punti || 0)
          .replace('{livello}', cliente.livelloFedelta || 'bronzo');
        
        await smsService.sendSMS({
          to: cliente.telefono,
          message: messaggioPersonalizzato
        });
        
        // Log comunicazione
        await ComunicazioneLog.create({
          tipo: 'sms',
          cliente: cliente._id,
          destinatario: cliente.telefono,
          messaggio: messaggioPersonalizzato,
          stato: 'inviato',
          inviatoDa: req.user.id
        });
        
        risultati.push({
          cliente: cliente._id,
          nome: cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome}`,
          telefono: cliente.telefono,
          stato: 'inviato'
        });
      } catch (error) {
        logger.error(`Errore invio SMS a ${cliente.telefono}:`, error);
        
        // Log errore
        await ComunicazioneLog.create({
          tipo: 'sms',
          cliente: cliente._id,
          destinatario: cliente.telefono,
          messaggio: messaggio,
          stato: 'errore',
          errore: error.message,
          inviatoDa: req.user.id
        });
        
        risultati.push({
          cliente: cliente._id,
          nome: cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome}`,
          telefono: cliente.telefono,
          stato: 'errore',
          errore: error.message
        });
      }
    }

    res.json({
      success: true,
      risultati,
      totale: risultati.length,
      inviati: risultati.filter(r => r.stato === 'inviato').length,
      errori: risultati.filter(r => r.stato === 'errore').length
    });

  } catch (error) {
    logger.error('Errore invio SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'invio degli SMS'
    });
  }
};

// NUOVO: Invio WhatsApp
export const inviaWhatsApp = async (req, res) => {
  try {
    const { clientiIds, messaggio, template, mediaUrl, filtri } = req.body;
    
    let clientiQuery = {};
    
    // Se sono specificati clienti specifici
    if (clientiIds && clientiIds.length > 0) {
      clientiQuery._id = { $in: clientiIds };
    }
    
    // Altrimenti usa i filtri
    else if (filtri) {
      if (filtri.livelloFedelta) {
        clientiQuery.livelloFedelta = filtri.livelloFedelta;
      }
      if (filtri.puntiMinimi) {
        clientiQuery.punti = { $gte: filtri.puntiMinimi };
      }
      if (filtri.tipo) {
        clientiQuery.tipo = filtri.tipo;
      }
      if (filtri.attivo !== undefined) {
        clientiQuery.attivo = filtri.attivo;
      }
    }
    
    // Assicurati che abbiano telefono
    clientiQuery.telefono = { $exists: true, $ne: '' };
    
    const clienti = await Cliente.find(clientiQuery);
    const risultati = [];
    
    for (const cliente of clienti) {
      try {
        let result;
        
        if (template) {
          // Usa template pre-approvato
          result = await whatsappService.sendTemplate({
            to: cliente.telefono,
            templateName: template,
            params: [
              cliente.nome || '',
              cliente.punti?.toString() || '0',
              cliente.livelloFedelta || 'bronzo'
            ]
          });
        } else {
          // Messaggio personalizzato
          const messaggioPersonalizzato = messaggio
            .replace('{nome}', cliente.nome || '')
            .replace('{cognome}', cliente.cognome || '')
            .replace('{nomeCompleto}', cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome}`)
            .replace('{punti}', cliente.punti || 0)
            .replace('{livello}', cliente.livelloFedelta || 'bronzo');
          
          result = await whatsappService.sendMessage({
            to: cliente.telefono,
            message: messaggioPersonalizzato,
            mediaUrl: mediaUrl
          });
        }
        
        // Log comunicazione
        await ComunicazioneLog.create({
          tipo: 'whatsapp',
          cliente: cliente._id,
          destinatario: cliente.telefono,
          messaggio: messaggio,
          template: template,
          stato: 'inviato',
          inviatoDa: req.user.id
        });
        
        risultati.push({
          cliente: cliente._id,
          nome: cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome}`,
          telefono: cliente.telefono,
          stato: 'inviato'
        });
        
      } catch (error) {
        logger.error(`Errore invio WhatsApp a ${cliente.telefono}:`, error);
        
        await ComunicazioneLog.create({
          tipo: 'whatsapp',
          cliente: cliente._id,
          destinatario: cliente.telefono,
          messaggio: messaggio,
          stato: 'errore',
          errore: error.message,
          inviatoDa: req.user.id
        });
        
        risultati.push({
          cliente: cliente._id,
          nome: cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome}`,
          telefono: cliente.telefono,
          stato: 'errore',
          errore: error.message
        });
      }
    }

    res.json({
      success: true,
      risultati,
      totale: risultati.length,
      inviati: risultati.filter(r => r.stato === 'inviato').length,
      errori: risultati.filter(r => r.stato === 'errore').length
    });

  } catch (error) {
    logger.error('Errore invio WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'invio dei messaggi WhatsApp'
    });
  }
};

// Webhook per ricevere risposte WhatsApp
export const webhookWhatsApp = async (req, res) => {
  try {
    await whatsappService.handleWebhook(req.body);
    res.sendStatus(200);
  } catch (error) {
    logger.error('Errore webhook WhatsApp:', error);
    res.sendStatus(500);
  }
};

export const inviaNotificaPush = async (req, res) => {
  try {
    const { clientiIds, titolo, messaggio, filtri } = req.body;
    
    // Implementazione notifiche push (se hai un servizio push)
    res.json({
      success: true,
      message: 'Funzionalità in sviluppo'
    });

  } catch (error) {
    logger.error('Errore invio notifiche push:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'invio delle notifiche'
    });
  }
};

export const getStoricoComuncazioni = async (req, res) => {
  try {
    const { clienteId, tipo, stato, dataInizio, dataFine } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (clienteId) {
      query.cliente = clienteId;
    }
    
    if (tipo) {
      query.tipo = tipo;
    }
    
    if (stato) {
      query.stato = stato;
    }
    
    if (dataInizio || dataFine) {
      query.createdAt = {};
      if (dataInizio) query.createdAt.$gte = new Date(dataInizio);
      if (dataFine) query.createdAt.$lte = new Date(dataFine);
    }
    
    const [comunicazioni, totale] = await Promise.all([
      ComunicazioneLog.find(query)
        .populate('cliente', 'nome cognome ragioneSociale tipo')
        .populate('inviatoDa', 'nome cognome')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      ComunicazioneLog.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      comunicazioni,
      totale,
      currentPage: page,
      totalPages: Math.ceil(totale / limit)
    });

  } catch (error) {
    logger.error('Errore recupero storico comunicazioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dello storico'
    });
  }
};

export const getTemplates = async (req, res) => {
  try {
    // Templates predefiniti
    const templates = [
      {
        id: 'benvenuto',
        nome: 'Benvenuto',
        tipo: 'email',
        oggetto: 'Benvenuto in Pastificio Nonna Claudia',
        contenuto: 'Caro {nomeCompleto}, benvenuto nel nostro programma fedeltà!'
      },
      {
        id: 'promemoria_ordine',
        nome: 'Promemoria Ordine',
        tipo: 'whatsapp',
        contenuto: 'Ciao {nome}, ti ricordiamo il ritiro del tuo ordine per domani alle {ora}'
      },
      {
        id: 'ordine_pronto',
        nome: 'Ordine Pronto',
        tipo: 'whatsapp',
        contenuto: 'Ciao {nome}, il tuo ordine è pronto per il ritiro! Ti aspettiamo in negozio.'
      },
      {
        id: 'punti_fedeltà',
        nome: 'Aggiornamento Punti',
        tipo: 'email',
        oggetto: 'I tuoi punti fedeltà',
        contenuto: 'Ciao {nomeCompleto}, hai {punti} punti! Sei al livello {livello}.'
      },
      {
        id: 'promozione',
        nome: 'Promozione',
        tipo: 'email',
        oggetto: 'Offerta speciale per te!',
        contenuto: 'Solo per i nostri clienti {livello}: sconto del 20% su tutti i prodotti!'
      },
      {
        id: 'menu_settimana',
        nome: 'Menu Settimanale',
        tipo: 'whatsapp',
        contenuto: 'Ecco il menu della settimana! 🍝\n\n*Lunedì*: Culurgiones\n*Martedì*: Malloreddus\n*Mercoledì*: Ravioli di ricotta\n\nPrenota il tuo ordine rispondendo a questo messaggio!'
      }
    ];
    
    res.json({
      success: true,
      templates
    });

  } catch (error) {
    logger.error('Errore recupero templates:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei templates'
    });
  }
};

export default {
  inviaEmail,
  inviaSMS,
  inviaWhatsApp,
  webhookWhatsApp,
  inviaNotificaPush,
  getStoricoComuncazioni,
  getTemplates
};