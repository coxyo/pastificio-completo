// controllers/ordiniController.js
import { AppError } from '../middleware/errorHandler.js';
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';
import whatsappService from '../services/whatsappService.js';

export const ordiniController = {
  async creaOrdine(req, res) {
    try {
      // Gestione automatica cliente
      if (req.body.telefono) {
        let cliente = await Cliente.findOne({ 
          telefono: req.body.telefono 
        });

        // Se non esiste, crea un nuovo cliente
        if (!cliente && req.body.nomeCliente) {
          const [nome, ...cognomeParts] = req.body.nomeCliente.split(' ');
          cliente = await Cliente.create({
            tipo: 'privato',
            nome: nome,
            cognome: cognomeParts.join(' ') || '',
            telefono: req.body.telefono,
            email: req.body.email || '',
            creatoDa: req.user.id
          });
          logger.info(`Nuovo cliente creato automaticamente: ${cliente._id}`);
        }

        if (cliente) {
          req.body.cliente = cliente._id;
        }
      }

      const ordine = new Ordine({
        ...req.body,
        creatoDa: req.user.id,
        numeroOrdine: await this.generaNumeroOrdine()
      });

      await ordine.save();
      logger.info(`Nuovo ordine creato: ${ordine._id}`);
      
      // Popola i dati del cliente se presente
      if (ordine.cliente) {
        await ordine.populate('cliente');
      }

      // Invia WhatsApp automatico se il cliente ha un numero
      if (ordine.cliente && ordine.cliente.telefono) {
        try {
          const messaggioOrdine = `
🎉 *Ordine Confermato!*

Ciao ${ordine.cliente.nome || ordine.nomeCliente},
Il tuo ordine #${ordine.numeroOrdine} è stato ricevuto!

📅 *Data ritiro:* ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}
⏰ *Ora:* ${ordine.oraRitiro}

📦 *Prodotti ordinati:*
${ordine.prodotti.map(p => `• ${p.nome}: ${p.quantita} ${p.unitaMisura} - €${p.prezzo}`).join('\n')}

💰 *Totale:* €${ordine.totale}

${ordine.note ? `📝 Note: ${ordine.note}` : ''}

Ti invieremo un promemoria il giorno prima del ritiro.

Grazie per aver scelto il nostro pastificio! 🍝
          `.trim();
          
          await whatsappService.inviaMessaggio(
            ordine.cliente.telefono,
            messaggioOrdine
          );
          
          logger.info(`WhatsApp inviato per ordine ${ordine.numeroOrdine}`);
        } catch (whatsappError) {
          // Non bloccare la creazione dell'ordine se WhatsApp fallisce
          logger.error('Errore invio WhatsApp:', whatsappError);
        }
      }

      // Notifica WebSocket
      if (global.io) {
        global.io.emit('nuovo-ordine', ordine);
      }

      res.status(201).json({
        success: true,
        data: ordine
      });
    } catch (error) {
      logger.error('Errore creazione ordine:', error);
      throw error;
    }
  },

  async generaNumeroOrdine() {
    const oggi = new Date();
    const anno = oggi.getFullYear();
    const mese = String(oggi.getMonth() + 1).padStart(2, '0');
    const giorno = String(oggi.getDate()).padStart(2, '0');
    
    const count = await Ordine.countDocuments({
      createdAt: {
        $gte: new Date(oggi.setHours(0, 0, 0, 0)),
        $lt: new Date(oggi.setHours(23, 59, 59, 999))
      }
    });
    
    const progressivo = String(count + 1).padStart(3, '0');
    return `${anno}${mese}${giorno}-${progressivo}`;
  },

  async getOrdini(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filtri
    if (req.query.data) {
      const dataInizio = new Date(req.query.data);
      dataInizio.setHours(0, 0, 0, 0);
      const dataFine = new Date(req.query.data);
      dataFine.setHours(23, 59, 59, 999);
      
      query.dataRitiro = {
        $gte: dataInizio,
        $lte: dataFine
      };
    }
    
    if (req.query.cliente) {
      query.nomeCliente = new RegExp(req.query.cliente, 'i');
    }

    if (req.query.clienteId) {
      query.cliente = req.query.clienteId;
    }

    if (req.query.stato) {
      query.stato = req.query.stato;
    }

    const [ordini, total] = await Promise.all([
      Ordine.find(query)
        .populate('cliente', 'nome cognome ragioneSociale tipo telefono')
        .skip(skip)
        .limit(limit)
        .sort('-createdAt'),
      Ordine.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: ordini,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  },

  async getOrdine(req, res) {
    const ordine = await Ordine.findById(req.params.id)
      .populate('cliente')
      .populate('creatoDa', 'nome cognome');
    
    if (!ordine) {
      throw new AppError('Ordine non trovato', 404);
    }

    res.json({
      success: true,
      data: ordine
    });
  },

  async updateOrdine(req, res) {
    const ordineOriginale = await Ordine.findById(req.params.id);
    
    if (!ordineOriginale) {
      throw new AppError('Ordine non trovato', 404);
    }

    const ordine = await Ordine.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        lastModifiedBy: req.user.id 
      },
      { new: true, runValidators: true }
    ).populate('cliente');

    // Se lo stato è cambiato a "pronto", invia notifica WhatsApp
    if (ordineOriginale.stato !== 'pronto' && ordine.stato === 'pronto' && ordine.cliente?.telefono) {
      try {
        const messaggio = `
✅ *Ordine Pronto!*

${ordine.cliente.nome}, il tuo ordine #${ordine.numeroOrdine} è pronto per il ritiro!

Puoi venire a ritirarlo negli orari di apertura.

Grazie! 🙏
        `.trim();
        
        await whatsappService.inviaMessaggio(ordine.cliente.telefono, messaggio);
        logger.info(`Notifica ordine pronto inviata per #${ordine.numeroOrdine}`);
      } catch (error) {
        logger.error('Errore invio notifica ordine pronto:', error);
      }
    }

    logger.info(`Ordine aggiornato: ${ordine._id}`);

    res.json({
      success: true,
      data: ordine
    });
  },

  async deleteOrdine(req, res) {
    const ordine = await Ordine.findByIdAndDelete(req.params.id);
    
    if (!ordine) {
      throw new AppError('Ordine non trovato', 404);
    }

    logger.info(`Ordine eliminato: ${ordine._id}`);

    res.json({
      success: true,
      data: {}
    });
  },

  async getOrdiniOggi(req, res) {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 1);

    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: oggi,
        $lt: domani
      }
    })
    .populate('cliente')
    .sort('oraRitiro');

    res.json({
      success: true,
      data: ordini,
      totale: ordini.reduce((sum, o) => sum + o.totale, 0)
    });
  },

  async getStatistiche(req, res) {
    const { dataInizio, dataFine } = req.query;
    
    const query = {};
    if (dataInizio) {
      query.createdAt = { $gte: new Date(dataInizio) };
    }
    if (dataFine) {
      query.createdAt = { ...query.createdAt, $lte: new Date(dataFine) };
    }

    const [totaleOrdini, ordiniCompletati, venditePerProdotto] = await Promise.all([
      Ordine.countDocuments(query),
      Ordine.countDocuments({ ...query, stato: 'completato' }),
      Ordine.aggregate([
        { $match: query },
        { $unwind: '$prodotti' },
        {
          $group: {
            _id: '$prodotti.nome',
            quantitaTotale: { $sum: '$prodotti.quantita' },
            ricavoTotale: { $sum: { $multiply: ['$prodotti.quantita', '$prodotti.prezzo'] } }
          }
        },
        { $sort: { ricavoTotale: -1 } }
      ])
    ]);

    const totaleVendite = await Ordine.aggregate([
      { $match: query },
      { $group: { _id: null, totale: { $sum: '$totale' } } }
    ]);

    res.json({
      success: true,
      data: {
        totaleOrdini,
        ordiniCompletati,
        percentualeCompletamento: totaleOrdini ? (ordiniCompletati / totaleOrdini * 100).toFixed(1) : 0,
        totaleVendite: totaleVendite[0]?.totale || 0,
        venditePerProdotto
      }
    });
  }
};

