// controllers/ordiniController.js - GESTIONE ROBUSTA
import { AppError } from '../middleware/errorHandler.js';
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';
import whatsappService from '../services/whatsappService.js';

export const ordiniController = {
  async creaOrdine(req, res) {
    try {
      const { 
        nomeCliente, 
        telefono, 
        email,
        dataRitiro,
        oraRitiro,
        prodotti,
        totale,
        note,
        stato,
        metodoPagamento,
        pagato,
        daViaggio,
        cliente // ✅ Campo cliente dal frontend
      } = req.body;

      // ✅ LOG DETTAGLIATO per debug
      logger.info('📦 Creazione nuovo ordine - Dati ricevuti:', {
        nomeCliente,
        telefono,
        dataRitiro,
        oraRitiro,
        numeroProdotti: prodotti?.length,
        totale,
        daViaggio,
        clienteRicevuto: cliente ? 'SI' : 'NO',
        tipoCliente: typeof cliente
      });

      // Validazione base
      if (!nomeCliente || !dataRitiro || !oraRitiro || !prodotti || prodotti.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Campi obbligatori mancanti: nomeCliente, dataRitiro, oraRitiro, prodotti'
        });
      }

      // ✅ FIX: Gestione CLIENTE - Accetta sia ObjectId che oggetto
      let clienteId = null;
      
      if (cliente) {
        // Se cliente è un ObjectId string valido
        if (typeof cliente === 'string' && mongoose.Types.ObjectId.isValid(cliente)) {
          clienteId = cliente;
        } 
        // Se cliente è un oggetto con _id
        else if (typeof cliente === 'object' && cliente._id) {
          clienteId = cliente._id;
        }
        // Se cliente è un oggetto con nome e telefono (creazione nuovo)
        else if (typeof cliente === 'object' && cliente.nome && cliente.telefono) {
          // Cerca cliente esistente
          let clienteEsistente = await Cliente.findOne({ 
            telefono: cliente.telefono 
          });
          
          if (!clienteEsistente) {
            // Crea nuovo cliente
            clienteEsistente = await Cliente.create({
              tipo: 'privato',
              nome: cliente.nome,
              cognome: cliente.cognome || '',
              telefono: cliente.telefono,
              email: cliente.email || '',
              creatoDa: req.user?.id || null
            });
            logger.info(`✅ Nuovo cliente creato: ${clienteEsistente._id}`);
          }
          
          clienteId = clienteEsistente._id;
        }
      }
      
      // Se non c'è cliente ma c'è telefono, cerca/crea cliente
      if (!clienteId && telefono) {
        let clienteEsistente = await Cliente.findOne({ telefono });
        
        if (!clienteEsistente && nomeCliente) {
          const [nome, ...cognomeParts] = nomeCliente.split(' ');
          clienteEsistente = await Cliente.create({
            tipo: 'privato',
            nome: nome,
            cognome: cognomeParts.join(' ') || '',
            telefono: telefono,
            email: email || '',
            creatoDa: req.user?.id || null
          });
          logger.info(`✅ Nuovo cliente auto-creato: ${clienteEsistente._id}`);
        }
        
        if (clienteEsistente) {
          clienteId = clienteEsistente._id;
        }
      }

      // Genera numero ordine progressivo
      const numeroOrdine = await this.generaNumeroOrdine();

      // ✅ NORMALIZZA PRODOTTI - Risolve problemi enum
      const prodottiNormalizzati = prodotti.map(p => {
        // Normalizza unità di misura
        const unitaNormalized = p.unita?.toLowerCase() || 'kg';
        const unitaMisuraNormalized = p.unitaMisura?.toLowerCase() || unitaNormalized;
        
        return {
          nome: p.nome?.trim(),
          quantita: Number(p.quantita) || 0,
          unita: unitaNormalized,
          unitaMisura: unitaMisuraNormalized,
          prezzo: Number(p.prezzo) || 0,
          categoria: p.categoria || 'altro', // Sarà normalizzato dal pre-save hook
          variante: p.variante || null
        };
      });

      // ✅ LOG PRODOTTI NORMALIZZATI
      logger.info('🔧 Prodotti normalizzati:', {
        originali: prodotti.map(p => ({ 
          nome: p.nome, 
          unita: p.unita, 
          categoria: p.categoria 
        })),
        normalizzati: prodottiNormalizzati.map(p => ({ 
          nome: p.nome, 
          unita: p.unita, 
          categoria: p.categoria 
        }))
      });

      // Crea ordine
      const ordine = new Ordine({
        nomeCliente,
        telefono: telefono || '',
        email: email || '',
        dataRitiro,
        oraRitiro,
        prodotti: prodottiNormalizzati,
        totale: Number(totale) || 0,
        note: note || '',
        stato: stato || 'nuovo',
        metodoPagamento: metodoPagamento || 'contanti',
        pagato: pagato === true,
        daViaggio: daViaggio === true,
        numeroOrdine,
        cliente: clienteId, // ✅ Può essere null
        creatoDa: req.user?.id || null
      });

      await ordine.save();
      
      logger.info(`✅ Ordine creato con successo: ${ordine._id}`, {
        numeroOrdine: ordine.numeroOrdine,
        daViaggio: ordine.daViaggio,
        totale: ordine.totale,
        prodotti: ordine.prodotti.length
      });
      
      // Popola i dati del cliente se presente
      if (ordine.cliente) {
        await ordine.populate('cliente');
      }

      // Invia WhatsApp automatico
      if (telefono && whatsappService.isReady()) {
        try {
          const messaggioOrdine = `
🎉 *Ordine Confermato!*

Ciao ${nomeCliente},
Il tuo ordine #${ordine.numeroOrdine} è stato ricevuto!

📅 *Data ritiro:* ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}
⏰ *Ora:* ${ordine.oraRitiro}
${ordine.daViaggio ? '🧳 *Da viaggio* - Confezionato sottovuoto' : ''}

📦 *Prodotti ordinati:*
${ordine.prodotti.map(p => `• ${p.nome}${p.variante ? ` (${p.variante})` : ''}: ${p.quantita} ${p.unitaMisura} - €${p.prezzo.toFixed(2)}`).join('\n')}

💰 *Totale:* €${ordine.totale.toFixed(2)}

${ordine.note ? `📝 Note: ${ordine.note}` : ''}

Ti invieremo un promemoria il giorno prima del ritiro.

Grazie! 🍝
          `.trim();
          
          await whatsappService.inviaMessaggio(telefono, messaggioOrdine);
          logger.info(`📱 WhatsApp inviato per ordine ${ordine.numeroOrdine}`);
        } catch (whatsappError) {
          logger.error('❌ Errore invio WhatsApp:', whatsappError.message);
        }
      }

      // Notifica WebSocket
      if (global.io) {
        global.io.emit('nuovo-ordine', ordine);
        global.io.emit('ordine-creato', ordine);
      }

      res.status(201).json({
        success: true,
        data: ordine
      });
    } catch (error) {
      logger.error('❌ ERRORE CREAZIONE ORDINE:', {
        message: error.message,
        name: error.name,
        errors: error.errors ? Object.keys(error.errors) : null
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Errore durante la creazione dell\'ordine',
        details: process.env.NODE_ENV === 'development' ? error.errors : undefined
      });
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
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const skip = (page - 1) * limit;

      let query = {};
      
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

      if (req.query.daViaggio !== undefined) {
        query.daViaggio = req.query.daViaggio === 'true';
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
    } catch (error) {
      logger.error('Errore recupero ordini:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async getOrdine(req, res) {
    try {
      const ordine = await Ordine.findById(req.params.id)
        .populate('cliente')
        .populate('creatoDa', 'nome cognome');
      
      if (!ordine) {
        return res.status(404).json({
          success: false,
          error: 'Ordine non trovato'
        });
      }

      res.json({
        success: true,
        data: ordine
      });
    } catch (error) {
      logger.error('Errore recupero ordine:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async updateOrdine(req, res) {
    try {
      const ordineOriginale = await Ordine.findById(req.params.id);
      
      if (!ordineOriginale) {
        return res.status(404).json({
          success: false,
          error: 'Ordine non trovato'
        });
      }

      const updateData = {
        ...req.body,
        modificatoDa: req.user?.id,
        dataModifica: new Date()
      };

      if (updateData.daViaggio !== undefined) {
        updateData.daViaggio = updateData.daViaggio === true;
      }

      const ordine = await Ordine.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('cliente');

      if (ordineOriginale.stato !== 'pronto' && ordine.stato === 'pronto' && ordine.telefono && whatsappService.isReady()) {
        try {
          const messaggio = `
✅ *Ordine Pronto!*

${ordine.nomeCliente}, il tuo ordine #${ordine.numeroOrdine} è pronto per il ritiro!

Puoi venire a ritirarlo negli orari di apertura.

Grazie! 🙏
          `.trim();
          
          await whatsappService.inviaMessaggio(ordine.telefono, messaggio);
          logger.info(`📱 Notifica ordine pronto inviata per #${ordine.numeroOrdine}`);
        } catch (error) {
          logger.error('Errore invio notifica ordine pronto:', error);
        }
      }

      if (global.io) {
        global.io.emit('ordine-aggiornato', ordine);
      }

      logger.info(`✅ Ordine aggiornato: ${ordine._id}`);

      res.json({
        success: true,
        data: ordine
      });
    } catch (error) {
      logger.error('Errore aggiornamento ordine:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async deleteOrdine(req, res) {
    try {
      const ordine = await Ordine.findByIdAndDelete(req.params.id);
      
      if (!ordine) {
        return res.status(404).json({
          success: false,
          error: 'Ordine non trovato'
        });
      }

      if (global.io) {
        global.io.emit('ordine-eliminato', { id: req.params.id });
      }

      logger.info(`🗑️ Ordine eliminato: ${ordine._id}`);

      res.json({
        success: true,
        data: {}
      });
    } catch (error) {
      logger.error('Errore eliminazione ordine:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async getOrdiniOggi(req, res) {
    try {
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
        totale: ordini.reduce((sum, o) => sum + o.totale, 0),
        totaleOrdini: ordini.length,
        ordiniDaViaggio: ordini.filter(o => o.daViaggio).length
      });
    } catch (error) {
      logger.error('Errore recupero ordini oggi:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async getStatistiche(req, res) {
    try {
      const { dataInizio, dataFine } = req.query;
      
      const query = {};
      if (dataInizio) {
        query.createdAt = { $gte: new Date(dataInizio) };
      }
      if (dataFine) {
        query.createdAt = { ...query.createdAt, $lte: new Date(dataFine) };
      }

      const [
        totaleOrdini, 
        ordiniCompletati, 
        ordiniDaViaggio,
        venditePerProdotto
      ] = await Promise.all([
        Ordine.countDocuments(query),
        Ordine.countDocuments({ ...query, stato: 'completato' }),
        Ordine.countDocuments({ ...query, daViaggio: true }),
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
          ordiniDaViaggio,
          percentualeCompletamento: totaleOrdini ? (ordiniCompletati / totaleOrdini * 100).toFixed(1) : 0,
          percentualeDaViaggio: totaleOrdini ? (ordiniDaViaggio / totaleOrdini * 100).toFixed(1) : 0,
          totaleVendite: totaleVendite[0]?.totale || 0,
          venditePerProdotto
        }
      });
    } catch (error) {
      logger.error('Errore recupero statistiche:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

export default ordiniController;