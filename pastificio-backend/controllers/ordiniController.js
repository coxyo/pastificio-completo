// controllers/ordiniController.js - ✅ FIX FINALE + CAPACITÀ PRODUTTIVA
import { AppError } from '../middleware/errorHandler.js';
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';
import whatsappService from '../services/whatsappService.js';
// ✅ IMPORT SISTEMA CALCOLO PREZZI
import calcoliPrezzi from '../utils/calcoliPrezzi.js';

// ========================================
// ✅ CONFIGURAZIONE CAPACITÀ PRODUTTIVA
// ========================================
const CAPACITA_PRODUTTIVA = {
  ravioli: {
    capacitaKg: 5,        // 5 Kg ogni 30 minuti
    intervalloMinuti: 30,
    oraInizio: '10:00',
    oraFine: '12:45',     // Produzione solo mattina (10:00-12:45)
    // Conversioni: 30 pezzi per Kg, €11 per Kg
    nomiProdotti: [
      'Ravioli',
      'Ravioli ricotta',
      'Ravioli spinaci', 
      'Ravioli patate',
      'Ravioli semplici',
      'Ravioli ricotta e spinaci'
    ]
  },
  zeppole: {
    capacitaKg: 10,       // 10 Kg ogni ora
    intervalloMinuti: 60,
    oraInizio: '17:00',   // Mar-Sab: 17:00-19:00
    oraFine: '19:00',
    oraInizioDomenica: '09:00',  // Domenica: 09:00-13:00
    oraFineDomenica: '13:00',
    // Conversioni: 24 pezzi per Kg, €21 per Kg
    nomiProdotti: [
      'Zeppole',
      'Zeppole sarde',
      'Zeppole dolci',
      'Zeppole salate'
    ]
  }
};

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
        cliente
      } = req.body;

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

      // Gestione CLIENTE - Accetta sia ObjectId che oggetto
      let clienteId = null;
      let clienteObj = null;
      
      if (cliente) {
        // Se cliente è un ObjectId string valido
        if (typeof cliente === 'string' && mongoose.Types.ObjectId.isValid(cliente)) {
          clienteId = cliente;
          clienteObj = await Cliente.findById(clienteId);
        } 
        // Se cliente è un oggetto con _id
        else if (typeof cliente === 'object' && cliente._id) {
          clienteId = cliente._id;
          clienteObj = await Cliente.findById(clienteId);
        }
        // Se cliente è un oggetto con nome e telefono (creazione nuovo)
        else if (typeof cliente === 'object' && cliente.nome && cliente.telefono) {
          let clienteEsistente = await Cliente.findOne({ 
            telefono: cliente.telefono 
          });
          
          if (!clienteEsistente) {
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
          clienteObj = clienteEsistente;
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
          clienteObj = clienteEsistente;
        }
      }

      // Genera numero ordine progressivo
      const numeroOrdine = await this.generaNumeroOrdine();

      // ✅ RICALCOLA PREZZI USANDO IL SISTEMA CENTRALIZZATO
      const prodottiRicalcolati = prodotti.map(p => {
        const unitaMisura = (p.unita || p.unitaMisura || 'kg').toLowerCase();
        
        // Ricalcola il prezzo corretto usando calcoliPrezzi
        const risultato = calcoliPrezzi.calcolaPrezzoOrdine(
          p.nome,
          p.quantita,
          unitaMisura
        );
        
        logger.info(`💰 Prodotto: ${p.nome}`);
        logger.info(`   - Input: ${p.quantita} ${unitaMisura} - Prezzo frontend: €${p.prezzo}`);
        logger.info(`   - Backend RICALCOLA: €${risultato.prezzoTotale.toFixed(2)}`);
        logger.info(`   - Dettagli: ${risultato.dettagli}`);
        
        return {
          nome: p.nome?.replace(/\s*\(\d+.*?\)\s*$/, '').trim(),
          quantita: p.quantita,
          unita: unitaMisura,
          unitaMisura: unitaMisura,
          prezzo: risultato.prezzoTotale,
          prezzoUnitario: risultato.prezzoTotale / p.quantita,
          categoria: p.categoria || 'altro',
          variante: p.variante || null,
          dettagliCalcolo: risultato
        };
      });
      
      // ✅ RICALCOLA TOTALE NEL BACKEND
      const totaleBackend = prodottiRicalcolati.reduce((sum, p) => sum + p.prezzo, 0);
      
      logger.info(`💰 TOTALE FRONTEND ricevuto: €${totale}`);
      logger.info(`💰 TOTALE BACKEND ricalcolato: €${totaleBackend.toFixed(2)}`);

      // Crea ordine con dati corretti
      const ordine = new Ordine({
        nomeCliente: clienteObj?.nome || nomeCliente || 'Cliente Sconosciuto',
        telefono: clienteObj?.telefono || telefono || '',
        email: clienteObj?.email || email || '',
        dataRitiro,
        oraRitiro,
        prodotti: prodottiRicalcolati,
        totale: totaleBackend,
        note: note || '',
        stato: stato || 'nuovo',
        metodoPagamento: metodoPagamento || 'contanti',
        pagato: pagato === true,
        daViaggio: daViaggio === true,
        numeroOrdine,
        cliente: clienteId,
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

Ciao ${ordine.nomeCliente},
Il tuo ordine #${ordine.numeroOrdine} è stato ricevuto!

📅 *Data ritiro:* ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}
⏰ *Ora:* ${ordine.oraRitiro}
${ordine.daViaggio ? '🧳 *Da viaggio* - Confezionato sottovuoto' : ''}

📦 *Prodotti ordinati:*
${ordine.prodotti.map(p => `• ${p.nome}${p.variante ? ` (${p.variante})` : ''}: ${p.dettagliCalcolo?.dettagli || `${p.quantita} ${p.unitaMisura}`} - €${p.prezzo.toFixed(2)}`).join('\n')}

💰 *Totale:* €${ordine.totale.toFixed(2)}

${ordine.note ? `📝 Note: ${ordine.note}` : ''}

Ti invieremo un promemoria il giorno prima del ritiro.

Grazie! 🙏
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
      const {
        page = 1,
        limit = 50,
        search,
        stato,
        dataRitiro,
        dataInizio,
        dataFine,
        daViaggio
      } = req.query;

      const query = {};

      if (search) {
        query.$or = [
          { nomeCliente: { $regex: search, $options: 'i' } },
          { telefono: { $regex: search, $options: 'i' } },
          { numeroOrdine: { $regex: search, $options: 'i' } }
        ];
      }

      if (stato && stato !== 'tutti') {
        query.stato = stato;
      }

      if (dataRitiro) {
        query.dataRitiro = dataRitiro;
      } else if (dataInizio || dataFine) {
        query.dataRitiro = {};
        if (dataInizio) query.dataRitiro.$gte = dataInizio;
        if (dataFine) query.dataRitiro.$lte = dataFine;
      }

      if (daViaggio !== undefined) {
        query.daViaggio = daViaggio === 'true';
      }

      const ordini = await Ordine.find(query)
        .populate('cliente', 'nome cognome telefono email')
        .populate('creatoDa', 'nome cognome')
        .sort({ dataRitiro: -1, oraRitiro: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Ordine.countDocuments(query);

      res.json({
        success: true,
        data: ordini,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
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

      // ✅ RICALCOLA PREZZI SE PRODOTTI MODIFICATI
      if (req.body.prodotti) {
        req.body.prodotti = req.body.prodotti.map(p => {
          const unitaMisura = (p.unita || p.unitaMisura || 'kg').toLowerCase();
          const risultato = calcoliPrezzi.calcolaPrezzoOrdine(
            p.nome,
            p.quantita,
            unitaMisura
          );
          
          return {
            nome: p.nome?.replace(/\s*\(\d+.*?\)\s*$/, '').trim(),
            quantita: p.quantita,
            unita: unitaMisura,
            unitaMisura: unitaMisura,
            prezzo: risultato.prezzoTotale,
            prezzoUnitario: risultato.prezzoTotale / p.quantita,
            categoria: p.categoria || 'altro',
            variante: p.variante || null,
            dettagliCalcolo: risultato
          };
        });
        
        req.body.totale = req.body.prodotti.reduce((sum, p) => sum + p.prezzo, 0);
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
  },

  // ========================================
  // ✅ HELPER: Identifica tipo prodotto
  // ========================================
  
  identificaTipoProdotto(nomeProdotto) {
    const nomeLower = nomeProdotto.toLowerCase();
    
    // Controlla Ravioli
    const isRavioli = CAPACITA_PRODUTTIVA.ravioli.nomiProdotti.some(
      nome => nomeLower.includes(nome.toLowerCase())
    );
    if (isRavioli) return 'ravioli';
    
    // Controlla Zeppole
    const isZeppole = CAPACITA_PRODUTTIVA.zeppole.nomiProdotti.some(
      nome => nomeLower.includes(nome.toLowerCase())
    );
    if (isZeppole) return 'zeppole';
    
    return null;
  },

  // ========================================
  // ✅ CALCOLA CAPACITÀ DISPONIBILE PER FASCIA ORARIA
  // ========================================
  
  calcolaCapacitaOraria(ora, tipoProdotto, dataRitiro) {
    const config = CAPACITA_PRODUTTIVA[tipoProdotto];
    if (!config) return null;
    
    // Per zeppole: orari diversi domenica vs altri giorni
    if (tipoProdotto === 'zeppole') {
      const giornoSettimana = new Date(dataRitiro).getDay(); // 0 = Domenica
      
      if (giornoSettimana === 0) {
        // Domenica: 09:00-13:00
        if (ora < config.oraInizioDomenica || ora > config.oraFineDomenica) {
          return null;
        }
      } else {
        // Mar-Sab: 17:00-19:00
        if (ora < config.oraInizio || ora > config.oraFine) {
          return null;
        }
      }
      
      // Zeppole: capacità solo sulle ore intere
      const [h, m] = ora.split(':');
      if (m !== '00') {
        return null; // Slot intermedi non contano per zeppole
      }
    } else {
      // Ravioli: produzione solo 10:00-12:45
      if (ora < config.oraInizio || ora > config.oraFine) {
        return null;
      }
    }
    
    return {
      capacita: config.capacitaKg,
      intervallo: config.intervalloMinuti,
      inProduzione: true
    };
  },

  // ========================================
  // ✅ ANALIZZA QUANTITÀ PRODOTTI CRITICI PER ORA
  // ========================================
  
  analizzaProdottiCritici(ordini) {
    const totali = {
      ravioli: 0,
      zeppole: 0
    };
    
    const dettaglio = {
      ravioli: [],
      zeppole: []
    };
    
    ordini.forEach(ordine => {
      if (!ordine.prodotti || ordine.prodotti.length === 0) return;
      
      ordine.prodotti.forEach(prodotto => {
        const tipo = ordiniController.identificaTipoProdotto(prodotto.nome);
        
        // ✅ DEBUG LOG - Verifica riconoscimento prodotti
        logger.info(`🔍 Analisi prodotto: "${prodotto.nome}" → tipo: ${tipo}, quantita: ${prodotto.quantita} ${prodotto.unitaMisura || prodotto.unita}`);
        
        if (tipo && (tipo === 'ravioli' || tipo === 'zeppole')) {
          // Estrai quantità in Kg
          let quantitaKg = 0;
          const unita = (prodotto.unitaMisura || prodotto.unita || '').toLowerCase();
          const quantitaNumerica = parseFloat(prodotto.quantita) || 0;
          
          // ========================================
          // CONVERSIONI BASATE SU UNITÀ DI MISURA
          // ========================================
          
          // 1. CONVERSIONE KG/G
          if (unita === 'kg' || unita === 'g') {
            // ✅ AUTO-CORREZIONE: Rileva pezzi salvati erroneamente come Kg
            // Se ordine ravioli >= 10 Kg → IMPOSSIBILE → sono pezzi!
            // Se ordine zeppole >= 5 Kg → IMPROBABILE → sono pezzi!
            if (tipo === 'ravioli' && quantitaNumerica >= 10 && unita === 'kg') {
              // Conversione PEZZI → KG (30 ravioli per Kg)
              quantitaKg = quantitaNumerica / 30;
              logger.info(`   ⚠️ AUTO-CORREZIONE: ${quantitaNumerica} kg → Rilevati come PEZZI → ${quantitaKg.toFixed(2)} Kg (30 pz/Kg)`);
            }
            else if (tipo === 'zeppole' && quantitaNumerica >= 5 && unita === 'kg') {
              // Conversione PEZZI → KG (24 zeppole per Kg)
              quantitaKg = quantitaNumerica / 24;
              logger.info(`   ⚠️ AUTO-CORREZIONE: ${quantitaNumerica} kg → Rilevati come PEZZI → ${quantitaKg.toFixed(2)} Kg (24 pz/Kg)`);
            }
            // Quantità normale in Kg
            else if (unita === 'kg') {
              quantitaKg = quantitaNumerica;
            }
            // Quantità in grammi
            else if (unita === 'g') {
              quantitaKg = quantitaNumerica / 1000;
            }
          }
          
          // 2. CONVERSIONE PEZZI → KG
          else if (unita === 'pezzi' || unita === 'pz') {
            if (tipo === 'ravioli') {
              // 30 ravioli per Kg
              quantitaKg = quantitaNumerica / 30;
              logger.info(`   ↳ Conversione: ${quantitaNumerica} pezzi → ${quantitaKg.toFixed(2)} Kg (30 pz/Kg)`);
            } else if (tipo === 'zeppole') {
              // 24 zeppole per Kg
              quantitaKg = quantitaNumerica / 24;
              logger.info(`   ↳ Conversione: ${quantitaNumerica} pezzi → ${quantitaKg.toFixed(2)} Kg (24 pz/Kg)`);
            }
          }
          
          // 3. CONVERSIONE € → KG
          else if (unita === '€' || unita === 'euro') {
            if (tipo === 'ravioli') {
              // Ravioli: €11 per Kg
              quantitaKg = quantitaNumerica / 11;
              logger.info(`   ↳ Conversione: €${quantitaNumerica} → ${quantitaKg.toFixed(2)} Kg (€11/Kg)`);
            } else if (tipo === 'zeppole') {
              // Zeppole: €21 per Kg
              quantitaKg = quantitaNumerica / 21;
              logger.info(`   ↳ Conversione: €${quantitaNumerica} → ${quantitaKg.toFixed(2)} Kg (€21/Kg)`);
            }
          }
          
          // ========================================
          // AGGIUNGI AL TOTALE SE VALIDO
          // ========================================
          
          if (quantitaKg > 0) {
            totali[tipo] += quantitaKg;
            dettaglio[tipo].push({
              nome: prodotto.nome,
              quantita: quantitaKg,
              ordineId: ordine._id
            });
            logger.info(`   ✅ Aggiunto a totale ${tipo}: +${quantitaKg.toFixed(2)} Kg (totale: ${totali[tipo].toFixed(2)} Kg)`);
          } else {
            logger.warn(`   ⚠️ Quantità non valida o unità non riconosciuta: ${prodotto.quantita} ${unita}`);
          }
        }
      });
    });
    
    return { totali, dettaglio };
  },

  // ========================================
  // ✅ NUOVO 28/01/2026: Conteggio orari con capacità produttiva
  // ========================================
  
  async getConteggioOrari(req, res) {
    try {
      const { dataRitiro } = req.query;
      
      if (!dataRitiro) {
        return res.status(400).json({ 
          success: false,
          error: 'Parametro dataRitiro obbligatorio (formato: YYYY-MM-DD)' 
        });
      }

      // Query con prodotti popolati per analisi dettagliata
      const ordini = await Ordine.find({
        dataRitiro: dataRitiro,
        stato: { $ne: 'annullato' }
      })
      .select('oraRitiro prodotti')
      .lean();

      // Raggruppa ordini per ora
      const ordiniPerOra = {};
      ordini.forEach(ordine => {
        const ora = ordine.oraRitiro;
        if (!ora) return;
        
        if (!ordiniPerOra[ora]) {
          ordiniPerOra[ora] = [];
        }
        ordiniPerOra[ora].push(ordine);
      });

      // Analizza capacità produttiva per ogni ora
      const conteggioPerOra = {};
      const capacitaPerOra = {};
      let orarioPicco = '';
      let ordiniPicco = 0;

      for (const [ora, ordiniOra] of Object.entries(ordiniPerOra)) {
        conteggioPerOra[ora] = ordiniOra.length;
        
        // Analizza prodotti critici
        const analisi = ordiniController.analizzaProdottiCritici(ordiniOra);
        
        // ✅ DEBUG LOG - Risultato analisi
        logger.info(`📊 Ora ${ora}: Ravioli totali=${analisi.totali.ravioli} Kg, Zeppole totali=${analisi.totali.zeppole} Kg`);
        
        const infoOra = {
          numeroOrdini: ordiniOra.length
        };
        
        // Ravioli - Solo nelle fasce di produzione (10:00-12:45)
        const capRavioli = ordiniController.calcolaCapacitaOraria(ora, 'ravioli', dataRitiro);
        
        // ✅ DEBUG LOG - Capacità ravioli
        logger.info(`🕒 Ora ${ora}: capRavioli=${capRavioli ? 'SI' : 'NO'}, analisi.totali.ravioli=${analisi.totali.ravioli}`);
        
        if (capRavioli && analisi.totali.ravioli > 0) {
          const ordinatoRavioli = analisi.totali.ravioli;
          infoOra.ravioli = {
            ordinatoKg: parseFloat(ordinatoRavioli.toFixed(2)),
            capacitaKg: capRavioli.capacita,
            percentuale: parseFloat(((ordinatoRavioli / capRavioli.capacita) * 100).toFixed(1)),
            eccesso: ordinatoRavioli > capRavioli.capacita ? parseFloat((ordinatoRavioli - capRavioli.capacita).toFixed(2)) : 0,
            stato: ordinatoRavioli <= capRavioli.capacita * 0.8 ? 'ok' : 
                   ordinatoRavioli <= capRavioli.capacita ? 'attenzione' : 'pieno'
          };
        }
        
        // Zeppole - Solo nelle fasce di produzione (17:00-19:00 o 09:00-13:00 domenica)
        const capZeppole = ordiniController.calcolaCapacitaOraria(ora, 'zeppole', dataRitiro);
        if (capZeppole && analisi.totali.zeppole > 0) {
          const ordinatoZeppole = analisi.totali.zeppole;
          infoOra.zeppole = {
            ordinatoKg: parseFloat(ordinatoZeppole.toFixed(2)),
            capacitaKg: capZeppole.capacita,
            percentuale: parseFloat(((ordinatoZeppole / capZeppole.capacita) * 100).toFixed(1)),
            eccesso: ordinatoZeppole > capZeppole.capacita ? parseFloat((ordinatoZeppole - capZeppole.capacita).toFixed(2)) : 0,
            stato: ordinatoZeppole <= capZeppole.capacita * 0.8 ? 'ok' : 
                   ordinatoZeppole <= capZeppole.capacita ? 'attenzione' : 'pieno'
          };
        }
        
        capacitaPerOra[ora] = infoOra;
        
        if (ordiniOra.length > ordiniPicco) {
          ordiniPicco = ordiniOra.length;
          orarioPicco = ora;
        }
      }

      // Identifica fasce libere
      const fasceLibere = [];
      const orariPossibili = ordiniController.generaOrariPossibili();
      
      for (const ora of orariPossibili) {
        const count = conteggioPerOra[ora] || 0;
        if (count <= 1) {
          fasceLibere.push(ora);
        }
      }

      const risultato = {
        success: true,
        data: dataRitiro,
        totaleOrdini: ordini.length,
        orarioPicco: orarioPicco || null,
        ordiniPicco: ordiniPicco,
        conteggioPerOra: conteggioPerOra,
        capacitaPerOra: capacitaPerOra, // ✅ NUOVO: info capacità produttiva
        fasceLibere: fasceLibere,
        generatedAt: new Date().toISOString()
      };

      logger.info(`✅ Conteggio orari per ${dataRitiro}: ${ordini.length} ordini`);
      res.json(risultato);

    } catch (error) {
      logger.error('❌ Errore in getConteggioOrari:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  },

  generaOrariPossibili() {
    const orari = [];
    for (let h = 8; h <= 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        const ora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        orari.push(ora);
        if (h === 20 && m === 0) break;
      }
    }
    return orari;
  }
};

export default ordiniController;