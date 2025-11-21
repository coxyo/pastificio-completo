// routes/ordini.js - ✅ VERSIONE COMPLETA CON GIACENZE, LIMITI E CREAZIONE AUTOMATICA CLIENTE
import express from 'express';
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import { protect } from '../middleware/auth.js';
import { aggiornaGiacenzeOrdine } from '../middleware/aggiornaGiacenze.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * ✅ NUOVO 21/11/2025: Crea cliente automaticamente se non esiste
 * @param {string} nomeCliente - Nome completo del cliente
 * @param {string} telefono - Numero di telefono
 * @returns {string|null} - ID del cliente creato/trovato
 */
const creaClienteAutomatico = async (nomeCliente, telefono) => {
  try {
    if (!nomeCliente || !telefono) {
      return null;
    }
    
    // Normalizza telefono (rimuovi spazi, trattini, ecc.)
    const telefonoNorm = telefono.replace(/[\s\-\(\)]/g, '');
    
    // 1️⃣ Cerca cliente esistente per telefono
    let cliente = await Cliente.findOne({ 
      telefono: { $in: [telefono, telefonoNorm] }
    });
    
    if (cliente) {
      logger.info(`[INFO] Cliente esistente trovato: ${cliente.codiceCliente} - ${cliente.nomeCompleto}`);
      return cliente._id;
    }
    
    // 2️⃣ Cliente non esiste, crealo
    
    // Estrai nome e cognome (se separati da spazio)
    const partiNome = nomeCliente.trim().split(' ');
    const nome = partiNome[0] || '';
    const cognome = partiNome.slice(1).join(' ') || '';
    
    // 3️⃣ Genera codice cliente progressivo
    const ultimoCliente = await Cliente.findOne().sort({ codiceCliente: -1 });
    let numeroProgressivo = 1;
    
    if (ultimoCliente && ultimoCliente.codiceCliente) {
      const match = ultimoCliente.codiceCliente.match(/CL(\d+)/);
      if (match) {
        numeroProgressivo = parseInt(match[1]) + 1;
      }
    }
    
    const codiceCliente = `CL${numeroProgressivo.toString().padStart(6, '0')}`;
    
    // 4️⃣ Crea nuovo cliente
    cliente = new Cliente({
      nome,
      cognome,
      telefono: telefonoNorm,
      email: '',
      codiceCliente,
      nomeCompleto: nomeCliente,
      dataRegistrazione: new Date(),
      attivo: true,
      note: 'Cliente creato automaticamente da ordine'
    });
    
    await cliente.save();
    logger.info(`✅ Cliente creato automaticamente: ${codiceCliente} - ${nomeCliente}`);
    
    return cliente._id;
    
  } catch (error) {
    logger.error('⚠️ Errore creazione cliente automatico:', error);
    // Non bloccare la creazione dell'ordine se fallisce
    return null;
  }
};

// GET /api/ordini - Ottieni tutti gli ordini
router.get('/', async (req, res) => {
  try {
    const { data, stato, cliente, limit = 1000 } = req.query;
    
    let filter = {};
    
    if (data) {
      const startDate = new Date(data);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(data);
      endDate.setHours(23, 59, 59, 999);
      
      filter.dataRitiro = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    if (stato) {
      filter.stato = stato;
    }
    
    if (cliente) {
      filter.cliente = cliente;
    }
    
    const ordini = await Ordine.find(filter)
      .populate('cliente', 'nome cognome telefono email codiceCliente')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    logger.info(`✅ Recuperati ${ordini.length} ordini`);
    
    res.json({
      success: true,
      count: ordini.length,
      data: ordini
    });
  } catch (error) {
    logger.error('❌ Errore recupero ordini:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero ordini',
      error: error.message
    });
  }
});

// GET /api/ordini/:id - Ottieni ordine singolo
router.get('/:id', async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.id)
      .populate('cliente', 'nome cognome telefono email codiceCliente');
    
    if (!ordine) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }
    
    res.json({
      success: true,
      data: ordine
    });
  } catch (error) {
    logger.error('❌ Errore recupero ordine:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero ordine',
      error: error.message
    });
  }
});

// POST /api/ordini - Crea nuovo ordine (CON CREAZIONE AUTOMATICA CLIENTE)
router.post('/', async (req, res, next) => {
  try {
    logger.info('📥 Ricevuta richiesta creazione ordine');
    
    const ordineData = req.body;
    
    // ✅ LOG DEBUG
    console.log('🔍 DATI RICEVUTI:', JSON.stringify({
      forceOverride: ordineData.forceOverride,
      dataRitiro: ordineData.dataRitiro,
      prodotti: ordineData.prodotti?.length || 0,
      nomeCliente: ordineData.nomeCliente,
      telefono: ordineData.telefono
    }, null, 2));
    
    // ✅ VERIFICA LIMITI SOLO SE NON È UN FORCE OVERRIDE
    if (ordineData.dataRitiro && ordineData.prodotti && ordineData.prodotti.length > 0) {
      
      const skipVerificaLimiti = ordineData.forceOverride === true || ordineData.forceOverride === 'true';
      
      if (!skipVerificaLimiti) {
        try {
          const verificaLimiti = await LimiteGiornaliero.verificaOrdine(
            ordineData.dataRitiro,
            ordineData.prodotti
          );
          
          if (verificaLimiti.errori && verificaLimiti.errori.length > 0) {
            const erroriBloccanti = verificaLimiti.errori.filter(e => e.superato);
            
            if (erroriBloccanti.length > 0) {
              logger.error('❌ Ordine supera limiti:', erroriBloccanti);
              
              return res.status(400).json({
                success: false,
                message: 'Ordine supera i limiti di capacità produttiva',
                erroriLimiti: erroriBloccanti,
                superaLimiti: true
              });
            }
          }
        } catch (limiteError) {
          logger.warn('⚠️ Errore verifica limiti (continuo comunque):', limiteError.message);
        }
      } else {
        logger.warn('⚠️ Ordine creato con FORCE OVERRIDE (limiti ignorati)');
        console.log('✅ SKIP VERIFICA LIMITI - forceOverride attivo');
      }
    }
    
    // ✅✅ NUOVO 21/11/2025: Crea cliente automaticamente se non esiste
    let clienteId = null;
    
    // Se NON c'è cliente ID ma ci sono nome e telefono, crea cliente
    if (!ordineData.cliente && ordineData.nomeCliente && ordineData.telefono) {
      clienteId = await creaClienteAutomatico(
        ordineData.nomeCliente,
        ordineData.telefono
      );
      
      if (clienteId) {
        logger.info(`🔗 Cliente collegato all'ordine: ${clienteId}`);
      }
    }
    
    // Verifica cliente esistente (se già c'era un ID)
    if (!clienteId && ordineData.cliente) {
      if (typeof ordineData.cliente === 'string') {
        clienteId = ordineData.cliente;
      } else if (ordineData.cliente._id) {
        clienteId = ordineData.cliente._id;
      }
      
      if (clienteId) {
        const clienteEsiste = await Cliente.findById(clienteId);
        if (!clienteEsiste) {
          logger.warn(`⚠️ Cliente non trovato: ${clienteId}`);
          clienteId = null;
        }
      }
    }
    
    // ✅ Prepara dati ordine (RIMUOVI forceOverride prima di salvare)
    const { forceOverride, ...ordineDataPulito } = ordineData;
    
    const nuovoOrdineData = {
      ...ordineDataPulito,
      cliente: clienteId,
      numeroOrdine: `ORD${Date.now().toString().slice(-8)}`,
      stato: ordineData.stato || 'nuovo',
      totale: ordineData.totale || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Crea ordine
    const nuovoOrdine = new Ordine(nuovoOrdineData);
    await nuovoOrdine.save();
    
    logger.info(`✅ Ordine creato: ${nuovoOrdine.numeroOrdine} - €${nuovoOrdine.totale}${forceOverride ? ' (FORCE OVERRIDE)' : ''}`);
    
    // ✅ AGGIORNA CONTATORI LIMITI DOPO SALVATAGGIO
    if (nuovoOrdine.dataRitiro && nuovoOrdine.prodotti && nuovoOrdine.prodotti.length > 0) {
      try {
        await LimiteGiornaliero.aggiornaDopoOrdine(nuovoOrdine.dataRitiro, nuovoOrdine.prodotti);
        logger.info(`📊 Limiti aggiornati per ordine ${nuovoOrdine._id}`);
      } catch (aggiornaError) {
        logger.error('⚠️ Errore aggiornamento limiti:', aggiornaError.message);
      }
    }
    
    // ✅ SALVA IN res.locals PER MIDDLEWARE GIACENZE
    res.locals.ordineCreato = nuovoOrdine;
    
    // Popola cliente per risposta
    await nuovoOrdine.populate('cliente', 'nome cognome telefono email codiceCliente');
    
    // Notifica WebSocket
    if (global.io) {
      global.io.emit('ordine-creato', {
        ordine: nuovoOrdine,
        timestamp: new Date()
      });
    }
    
    // ✅ PASSA AL MIDDLEWARE GIACENZE
    next();
    
  } catch (error) {
    logger.error('❌ Errore creazione ordine:', error);
    res.status(500).json({
      success: false,
      message: 'Errore creazione ordine',
      error: error.message
    });
  }
}, aggiornaGiacenzeOrdine, (req, res) => {
  // ✅ RISPOSTA FINALE DOPO AGGIORNAMENTO GIACENZE
  res.status(201).json({
    success: true,
    message: 'Ordine creato con successo',
    data: res.locals.ordineCreato
  });
});

// PUT /api/ordini/:id - Aggiorna ordine (CON CREAZIONE AUTOMATICA CLIENTE)
router.put('/:id', async (req, res) => {
  try {
    const ordineData = req.body;
    
    const ordineEsistente = await Ordine.findById(req.params.id);
    
    if (!ordineEsistente) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }
    
    // ✅ VERIFICA LIMITI (SOLO SE NON FORCE OVERRIDE)
    const skipVerificaLimiti = ordineData.forceOverride === true || ordineData.forceOverride === 'true';
    
    if ((ordineData.dataRitiro || ordineData.prodotti) && !skipVerificaLimiti) {
      const dataVerifica = ordineData.dataRitiro || ordineEsistente.dataRitiro;
      const prodottiVerifica = ordineData.prodotti || ordineEsistente.prodotti;
      
      try {
        // Rimuovi quantità vecchio ordine dai contatori
        if (ordineEsistente.prodotti && ordineEsistente.prodotti.length > 0) {
          await LimiteGiornaliero.aggiornaDopoOrdine(
            ordineEsistente.dataRitiro,
            ordineEsistente.prodotti.map(p => ({
              nome: p.nome,
              quantita: -p.quantita,
              unita: p.unita || p.unitaMisura,
              categoria: p.categoria
            }))
          );
        }
        
        // Verifica con nuovo ordine
        const verificaLimiti = await LimiteGiornaliero.verificaOrdine(dataVerifica, prodottiVerifica);
        
        if (verificaLimiti.errori && verificaLimiti.errori.length > 0) {
          const erroriBloccanti = verificaLimiti.errori.filter(e => e.superato);
          
          if (erroriBloccanti.length > 0) {
            // Ripristina quantità vecchio ordine
            await LimiteGiornaliero.aggiornaDopoOrdine(ordineEsistente.dataRitiro, ordineEsistente.prodotti);
            
            return res.status(400).json({
              success: false,
              message: 'Modifica supera i limiti di capacità produttiva',
              erroriLimiti: erroriBloccanti,
              superaLimiti: true
            });
          }
        }
        
        // Aggiungi quantità nuovo ordine
        await LimiteGiornaliero.aggiornaDopoOrdine(dataVerifica, prodottiVerifica);
        
      } catch (limiteError) {
        logger.warn('⚠️ Errore verifica/aggiornamento limiti:', limiteError.message);
      }
    } else if (skipVerificaLimiti) {
      logger.warn('⚠️ Ordine aggiornato con FORCE OVERRIDE (limiti ignorati)');
    }
    
    // ✅✅ NUOVO 21/11/2025: Crea cliente anche su update
    let clienteId = null;
    
    if (!ordineData.cliente && ordineData.nomeCliente && ordineData.telefono) {
      clienteId = await creaClienteAutomatico(
        ordineData.nomeCliente,
        ordineData.telefono
      );
      
      if (clienteId) {
        logger.info(`🔗 Cliente collegato all'ordine (update): ${clienteId}`);
      }
    }
    
    // Gestisci cliente esistente
    if (!clienteId && ordineData.cliente) {
      if (typeof ordineData.cliente === 'string') {
        clienteId = ordineData.cliente;
      } else if (ordineData.cliente._id) {
        clienteId = ordineData.cliente._id;
      }
    }
    
    // ✅ Rimuovi forceOverride prima di salvare
    const { forceOverride, ...ordineDataPulito } = ordineData;
    
    const ordineAggiornato = await Ordine.findByIdAndUpdate(
      req.params.id,
      {
        ...ordineDataPulito,
        cliente: clienteId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('cliente', 'nome cognome telefono email codiceCliente');
    
    if (!ordineAggiornato) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }
    
    logger.info(`✅ Ordine aggiornato: ${ordineAggiornato.numeroOrdine}${forceOverride ? ' (FORCE OVERRIDE)' : ''}`);
    
    // Notifica WebSocket
    if (global.io) {
      global.io.emit('ordine-aggiornato', {
        ordine: ordineAggiornato,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Ordine aggiornato',
      data: ordineAggiornato
    });
  } catch (error) {
    logger.error('❌ Errore aggiornamento ordine:', error);
    res.status(500).json({
      success: false,
      message: 'Errore aggiornamento ordine',
      error: error.message
    });
  }
});

// DELETE /api/ordini/:id - Elimina ordine (E RIPRISTINA LIMITI)
router.delete('/:id', async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.id);
    
    if (!ordine) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }
    
    // ✅ RIPRISTINA LIMITI SOTTRAENDO QUANTITÀ
    if (ordine.dataRitiro && ordine.prodotti && ordine.prodotti.length > 0) {
      try {
        await LimiteGiornaliero.aggiornaDopoOrdine(
          ordine.dataRitiro,
          ordine.prodotti.map(p => ({
            nome: p.nome,
            quantita: -p.quantita,
            unita: p.unita || p.unitaMisura,
            categoria: p.categoria
          }))
        );
        logger.info(`📊 Limiti ripristinati dopo eliminazione ordine ${ordine._id}`);
      } catch (limiteError) {
        logger.error('⚠️ Errore ripristino limiti:', limiteError.message);
      }
    }
    
    await ordine.deleteOne();
    
    logger.info(`🗑️ Ordine eliminato: ${ordine.numeroOrdine}`);
    
    // Notifica WebSocket
    if (global.io) {
      global.io.emit('ordine-eliminato', {
        ordineId: req.params.id,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Ordine eliminato'
    });
  } catch (error) {
    logger.error('❌ Errore eliminazione ordine:', error);
    res.status(500).json({
      success: false,
      message: 'Errore eliminazione ordine',
      error: error.message
    });
  }
});

// GET /api/ordini/statistiche/giornaliere - Statistiche giornaliere
router.get('/statistiche/giornaliere', async (req, res) => {
  try {
    const { data } = req.query;
    const dataTarget = data ? new Date(data) : new Date();
    
    const startDate = new Date(dataTarget);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dataTarget);
    endDate.setHours(23, 59, 59, 999);
    
    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    const statistiche = {
      totaleOrdini: ordini.length,
      totaleIncasso: ordini.reduce((sum, o) => sum + (o.totale || 0), 0),
      ordiniCompletati: ordini.filter(o => o.stato === 'completato').length,
      ordiniInLavorazione: ordini.filter(o => o.stato === 'in_lavorazione').length,
      ordiniNuovi: ordini.filter(o => o.stato === 'nuovo').length,
      ordiniAnnullati: ordini.filter(o => o.stato === 'annullato').length,
      mediaOrdine: ordini.length > 0 ? ordini.reduce((sum, o) => sum + (o.totale || 0), 0) / ordini.length : 0
    };
    
    res.json({
      success: true,
      data: statistiche
    });
  } catch (error) {
    logger.error('❌ Errore statistiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore calcolo statistiche',
      error: error.message
    });
  }
});


// ✅ NUOVO 21/11/2025: PUT /api/ordini/:id/prodotto/:index/stato - Aggiorna stato singolo prodotto
router.put('/:id/prodotto/:index/stato', async (req, res) => {
  try {
    const { id, index } = req.params;
    const { stato } = req.body;
    
    if (!stato || !['nuovo', 'in_lavorazione', 'completato'].includes(stato)) {
      return res.status(400).json({
        success: false,
        message: 'Stato non valido'
      });
    }
    
    const ordine = await Ordine.findById(id);
    
    if (!ordine) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }
    
    const prodottoIndex = parseInt(index);
    
    if (prodottoIndex < 0 || prodottoIndex >= ordine.prodotti.length) {
      return res.status(400).json({
        success: false,
        message: 'Indice prodotto non valido'
      });
    }
    
    // Aggiorna stato prodotto usando il metodo del model
    ordine.aggiornaStatoProdotto(prodottoIndex, stato);
    await ordine.save();
    
    logger.info(`✅ Stato prodotto aggiornato: Ordine ${ordine.numeroOrdine}, Prodotto ${prodottoIndex}, Stato ${stato}`);
    
    // Popola cliente per risposta
    await ordine.populate('cliente', 'nome cognome telefono email codiceCliente');
    
    // Notifica WebSocket
    if (global.io) {
      global.io.emit('ordine-aggiornato', {
        ordine: ordine,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Stato prodotto aggiornato',
      data: ordine
    });
  } catch (error) {
    logger.error('❌ Errore aggiornamento stato prodotto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore aggiornamento stato prodotto',
      error: error.message
    });
  }
});

export default router;
