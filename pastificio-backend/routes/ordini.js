// routes/ordini.js - ✅ FIX 13/12/2025: Calcolo prezzi lato backend
import express from 'express';
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import { protect } from '../middleware/auth.js';
import { aggiornaGiacenzeOrdine } from '../middleware/aggiornaGiacenze.js';
import logger from '../config/logger.js';

const router = express.Router();

// ✅ NUOVO 13/12/2025: Configurazione prezzi prodotti lato backend
const PREZZI_PRODOTTI = {
  // PANADAS
  'Panada Anguille': { prezzoKg: 30.00 },
  'Panada di Agnello': { prezzoKg: 25.00 },
  'Panada di Agnello (con patate)': { prezzoKg: 25.00 },
  'Panada di Maiale': { prezzoKg: 21.00 },
  'Panada di Maiale (con patate)': { prezzoKg: 21.00 },
  'Panada di Vitella': { prezzoKg: 23.00 },
  'Panada di verdure': { prezzoKg: 17.00 },
  'Panadine': { prezzoKg: 28.00, prezzoPezzo: 0.80, pezziPerKg: 35 },
  
  // DOLCI
  'Pardulas': { prezzoKg: 20.00, prezzoPezzo: 0.76, pezziPerKg: 25 },
  'Ciambelle': { prezzoKg: 17.00, pezziPerKg: 30 },
  'Amaretti': { prezzoKg: 22.00, pezziPerKg: 35 },
  'Papassinas': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Papassini': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Pabassine': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Zeppole': { prezzoKg: 21.00, pezziPerKg: 24 },
  'Gueffus': { prezzoKg: 22.00, pezziPerKg: 65 },
  'Bianchini': { prezzoKg: 15.00, pezziPerKg: 100 },
  'Sebadas': { prezzoPezzo: 2.50 },
  'Dolci misti': { prezzoKg: 19.00 },
  'Torta di saba': { prezzoKg: 26.00 },
  
  // RAVIOLI
  'Ravioli': { prezzoKg: 11.00, pezziPerKg: 30 },
  'Ravioli ricotta e spinaci': { prezzoKg: 11.00, pezziPerKg: 30 },
  'Ravioli ricotta e zafferano': { prezzoKg: 11.00, pezziPerKg: 30 },
  'Ravioli ricotta dolci': { prezzoKg: 11.00, pezziPerKg: 30 },
  'Ravioli ricotta poco dolci': { prezzoKg: 11.00, pezziPerKg: 30 },
  'Ravioli ricotta molto dolci': { prezzoKg: 11.00, pezziPerKg: 30 },
  'Ravioli di formaggio': { prezzoKg: 16.00, pezziPerKg: 30 },
  'Culurgiones': { prezzoKg: 16.00, pezziPerKg: 32 },
  
  // PASTA
  'Fregula': { prezzoKg: 10.00 },
  'Pasta per panada': { prezzoKg: 5.00 },
  'Pasta per panada e pizza': { prezzoKg: 5.00 },
  'Sfoglia per lasagne': { prezzoKg: 5.00 },
  'Pizzette sfoglia': { prezzoKg: 16.00, pezziPerKg: 30 }
};

// ✅ NUOVO 13/12/2025: Trova configurazione prodotto (con ricerca fuzzy)
const trovaProdottoConfig = (nomeProdotto) => {
  if (!nomeProdotto) return null;
  
  // 1. Match esatto
  if (PREZZI_PRODOTTI[nomeProdotto]) {
    return PREZZI_PRODOTTI[nomeProdotto];
  }
  
  // 2. Case-insensitive
  const nomeLower = nomeProdotto.toLowerCase().trim();
  for (const [key, config] of Object.entries(PREZZI_PRODOTTI)) {
    if (key.toLowerCase() === nomeLower) {
      return config;
    }
  }
  
  // 3. Nome base (senza parentesi)
  const nomeBase = nomeProdotto.split(' (')[0].trim();
  if (PREZZI_PRODOTTI[nomeBase]) {
    return PREZZI_PRODOTTI[nomeBase];
  }
  
  // 4. Keywords
  const keywords = {
    'anguille': 'Panada Anguille',
    'agnello': 'Panada di Agnello',
    'maiale': 'Panada di Maiale',
    'vitella': 'Panada di Vitella',
    'verdure': 'Panada di verdure',
    'panadine': 'Panadine',
    'pardulas': 'Pardulas',
    'ciambelle': 'Ciambelle',
    'ravioli': 'Ravioli',
    'culurgiones': 'Culurgiones',
    'sebadas': 'Sebadas',
    'amaretti': 'Amaretti',
    'bianchini': 'Bianchini',
    'gueffus': 'Gueffus',
    'papassinas': 'Papassinas',
    'papassini': 'Papassinas',
    'pabassine': 'Pabassine',
    'dolci misti': 'Dolci misti',
    'fregula': 'Fregula',
    'torta': 'Torta di saba',
    'zeppole': 'Zeppole'
  };
  
  for (const [keyword, prodottoKey] of Object.entries(keywords)) {
    if (nomeLower.includes(keyword)) {
      if (PREZZI_PRODOTTI[prodottoKey]) {
        return PREZZI_PRODOTTI[prodottoKey];
      }
    }
  }
  
  return null;
};

// ✅ NUOVO 13/12/2025: Calcola prezzo singolo prodotto
const calcolaPrezziProdotto = (prodotto) => {
  const { nome, quantita, unita, prezzo } = prodotto;
  
  // Se è un vassoio, mantieni il prezzo esistente
  if (unita === 'vassoio' || nome === 'Vassoio Dolci Misti') {
    return prezzo || 0;
  }
  
  // Cerca configurazione prodotto
  const config = trovaProdottoConfig(nome);
  
  if (!config) {
    // Prodotto non trovato - usa prezzo esistente se > 0
    if (prezzo && prezzo > 0) {
      logger.warn(`⚠️ Prodotto "${nome}" non in config, uso prezzo esistente: €${prezzo}`);
      return prezzo;
    }
    logger.error(`❌ Prodotto "${nome}" non trovato e nessun prezzo esistente`);
    return 0;
  }
  
  const unitaLower = (unita || 'kg').toLowerCase().trim();
  let prezzoCalcolato = 0;
  
  switch (unitaLower) {
    case 'kg':
      if (config.prezzoKg) {
        prezzoCalcolato = quantita * config.prezzoKg;
      }
      break;
      
    case 'pezzi':
    case 'pz':
    case 'pezzo':
      if (config.prezzoPezzo) {
        prezzoCalcolato = quantita * config.prezzoPezzo;
      } else if (config.prezzoKg && config.pezziPerKg) {
        // Converti pezzi in kg
        const kg = quantita / config.pezziPerKg;
        prezzoCalcolato = kg * config.prezzoKg;
      }
      break;
      
    case '€':
    case 'euro':
      // L'importo È il prezzo
      prezzoCalcolato = quantita;
      break;
      
    default:
      // Fallback: prova con prezzoKg
      if (config.prezzoKg) {
        prezzoCalcolato = quantita * config.prezzoKg;
      }
  }
  
  // Se calcolo ha dato 0 ma c'è prezzo esistente, usa quello
  if (prezzoCalcolato === 0 && prezzo && prezzo > 0) {
    logger.warn(`⚠️ Calcolo €0 per "${nome}", uso prezzo esistente: €${prezzo}`);
    return prezzo;
  }
  
  logger.info(`💰 Prezzo calcolato per ${nome}: ${quantita} ${unita} = €${prezzoCalcolato.toFixed(2)}`);
  return Math.round(prezzoCalcolato * 100) / 100;
};

// ✅ NUOVO 13/12/2025: Calcola prezzi per tutti i prodotti dell'ordine
const calcolaPrezziOrdine = (prodotti) => {
  if (!prodotti || !Array.isArray(prodotti)) return { prodotti: [], totale: 0 };
  
  let totale = 0;
  const prodottiConPrezzi = prodotti.map(p => {
    const prezzoCalcolato = calcolaPrezziProdotto(p);
    totale += prezzoCalcolato;
    
    return {
      ...p,
      prezzo: prezzoCalcolato
    };
  });
  
  return {
    prodotti: prodottiConPrezzi,
    totale: Math.round(totale * 100) / 100
  };
};

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

// POST /api/ordini - Crea nuovo ordine (CON CALCOLO PREZZI E CREAZIONE AUTOMATICA CLIENTE)
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
    
    // ✅✅ NUOVO 13/12/2025: CALCOLA PREZZI LATO BACKEND
    const { prodotti: prodottiConPrezzi, totale: totaleCalcolato } = calcolaPrezziOrdine(ordineData.prodotti);
    
    // Se il totale ricevuto è 0 o molto diverso, usa quello calcolato
    let totaleFinale = ordineData.totale || 0;
    if (totaleFinale === 0 || Math.abs(totaleFinale - totaleCalcolato) > 1) {
      logger.info(`💰 Totale ricalcolato: €${totaleCalcolato} (ricevuto: €${totaleFinale})`);
      totaleFinale = totaleCalcolato;
    }
    
    // ✅ Prepara dati ordine (RIMUOVI forceOverride prima di salvare)
    const { forceOverride, ...ordineDataPulito } = ordineData;
    
    const nuovoOrdineData = {
      ...ordineDataPulito,
      prodotti: prodottiConPrezzi, // ✅ USA PRODOTTI CON PREZZI CALCOLATI
      cliente: clienteId,
      numeroOrdine: `ORD${Date.now().toString().slice(-8)}`,
      stato: ordineData.stato || 'nuovo',
      totale: totaleFinale, // ✅ USA TOTALE CALCOLATO
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Crea ordine
    const nuovoOrdine = new Ordine(nuovoOrdineData);
    await nuovoOrdine.save();
    
    // Popola cliente per risposta
    await nuovoOrdine.populate('cliente', 'nome cognome telefono email codiceCliente');
    
    logger.info(`✅ Ordine creato: ${nuovoOrdine.numeroOrdine} - Totale: €${totaleFinale}`);
    
    // Notifica WebSocket
    if (global.io) {
      global.io.emit('nuovo-ordine', {
        ordine: nuovoOrdine,
        timestamp: new Date()
      });
    }
    
    // ✅ FIX 20/01/2026: RIMOSSO aggiornaDopoOrdine
    // Il totale degli ordini viene calcolato DINAMICAMENTE in routes/limiti.js
    // La chiamata a aggiornaDopoOrdine aggiungeva la quantità ANCHE a quantitaOrdinata,
    // causando il DOPPIO CONTEGGIO (una volta dagli ordini, una volta da quantitaOrdinata)
    // 
    // Ora:
    // - totaleOrdini = calcolato dinamicamente dalla query degli ordini
    // - quantitaOrdinata = SOLO vendite dirette (bottoni +100G, +500G, etc.)
    // - totaleComplessivo = totaleOrdini + quantitaOrdinata (senza duplicazioni)
    
    // Passa al middleware per aggiornamento giacenze
    req.ordineCreato = nuovoOrdine;
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
  // Risposta finale dopo middleware
  res.status(201).json({
    success: true,
    message: 'Ordine creato con successo',
    data: req.ordineCreato
  });
});

// PUT /api/ordini/:id - Aggiorna ordine (CON RICALCOLO PREZZI)
router.put('/:id', async (req, res) => {
  try {
    const ordineData = req.body;
    
    // Trova ordine esistente per confronto limiti
    const ordineEsistente = await Ordine.findById(req.params.id);
    if (!ordineEsistente) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }
    
    const skipVerificaLimiti = ordineData.forceOverride === true || ordineData.forceOverride === 'true';
    
    // ✅ FIX 20/01/2026: RIMOSSO aggiornaDopoOrdine anche dall'update
    // Il totale viene calcolato dinamicamente, non serve aggiornare quantitaOrdinata
    // Manteniamo solo la verifica dei limiti (verificaOrdine)
    const dataVerifica = ordineData.dataRitiro || ordineEsistente.dataRitiro;
    const prodottiVerifica = ordineData.prodotti || ordineEsistente.prodotti;
    
    if (dataVerifica && prodottiVerifica && prodottiVerifica.length > 0 && !skipVerificaLimiti) {
      try {
        // Verifica nuovo ordine (senza modificare quantitaOrdinata)
        const verificaLimiti = await LimiteGiornaliero.verificaOrdine(
          dataVerifica,
          prodottiVerifica
        );
        
        if (verificaLimiti.errori && verificaLimiti.errori.length > 0) {
          const erroriBloccanti = verificaLimiti.errori.filter(e => e.superato);
          
          if (erroriBloccanti.length > 0) {
            return res.status(400).json({
              success: false,
              message: 'Modifica supera i limiti di capacità produttiva',
              erroriLimiti: erroriBloccanti,
              superaLimiti: true
            });
          }
        }
      } catch (limiteError) {
        logger.warn('⚠️ Errore verifica limiti:', limiteError.message);
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
    
    // ✅✅ NUOVO 13/12/2025: RICALCOLA PREZZI SE NECESSARIO
    let prodottiFinali = ordineData.prodotti;
    let totaleFinale = ordineData.totale;
    
    if (ordineData.prodotti && ordineData.prodotti.length > 0) {
      const { prodotti: prodottiConPrezzi, totale: totaleCalcolato } = calcolaPrezziOrdine(ordineData.prodotti);
      
      // Se ci sono prodotti con prezzo 0, ricalcola
      const haPrezziZero = ordineData.prodotti.some(p => !p.prezzo || p.prezzo === 0);
      if (haPrezziZero || totaleFinale === 0) {
        logger.info(`💰 Ricalcolo prezzi ordine: €${totaleCalcolato}`);
        prodottiFinali = prodottiConPrezzi;
        totaleFinale = totaleCalcolato;
      }
    }
    
    // ✅ Rimuovi forceOverride prima di salvare
    const { forceOverride, ...ordineDataPulito } = ordineData;
    
    const ordineAggiornato = await Ordine.findByIdAndUpdate(
      req.params.id,
      {
        ...ordineDataPulito,
        prodotti: prodottiFinali,
        totale: totaleFinale,
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
    
    logger.info(`✅ Ordine aggiornato: ${ordineAggiornato.numeroOrdine} - Totale: €${totaleFinale}${forceOverride ? ' (FORCE OVERRIDE)' : ''}`);
    
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
    
    // ✅ FIX 20/01/2026: RIMOSSO aggiornaDopoOrdine dalla DELETE
    // Il totale viene calcolato dinamicamente dalla query ordini,
    // non serve sottrarre da quantitaOrdinata quando si elimina un ordine
    
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


// ✅ FIX 25/11/2025: PUT /api/ordini/:id/prodotto/:index/stato - Aggiorna stato singolo prodotto
// AGGIUNTO 'consegnato' alla validazione!
router.put('/:id/prodotto/:index/stato', async (req, res) => {
  try {
    const { id, index } = req.params;
    const { stato } = req.body;
    
    // ✅ FIX: Aggiunto 'consegnato' all'array degli stati validi
    if (!stato || !['nuovo', 'in_lavorazione', 'completato', 'consegnato'].includes(stato)) {
      return res.status(400).json({
        success: false,
        message: `Stato non valido: ${stato}. Stati validi: nuovo, in_lavorazione, completato, consegnato`
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

// ✅ NUOVO 13/12/2025: GET /api/ordini/fix/preview - Anteprima ordini con prezzo €0
router.get('/fix/preview', async (req, res) => {
  try {
    // Trova ordini con prodotti a prezzo 0
    const ordini = await Ordine.find({
      'prodotti.prezzo': 0
    }).populate('cliente', 'nome cognome telefono');
    
    const preview = ordini.map(o => {
      const prodottiZero = o.prodotti.filter(p => !p.prezzo || p.prezzo === 0);
      const { totale: nuovoTotale } = calcolaPrezziOrdine(o.prodotti);
      
      return {
        _id: o._id,
        numeroOrdine: o.numeroOrdine,
        cliente: o.nomeCliente || o.cliente?.nomeCompleto,
        dataRitiro: o.dataRitiro,
        totaleAttuale: o.totale,
        totaleCalcolato: nuovoTotale,
        differenza: nuovoTotale - (o.totale || 0),
        prodottiDaCorreggere: prodottiZero.map(p => ({
          nome: p.nome,
          quantita: p.quantita,
          unita: p.unita,
          prezzoAttuale: p.prezzo,
          prezzoCalcolato: calcolaPrezziProdotto(p)
        }))
      };
    });
    
    res.json({
      success: true,
      count: preview.length,
      data: preview
    });
  } catch (error) {
    logger.error('❌ Errore preview fix:', error);
    res.status(500).json({
      success: false,
      message: 'Errore preview',
      error: error.message
    });
  }
});

// ✅ NUOVO 13/12/2025: POST /api/ordini/fix/correggi - Correggi ordini con prezzo €0
router.post('/fix/correggi', async (req, res) => {
  try {
    // Trova ordini con prodotti a prezzo 0
    const ordini = await Ordine.find({
      'prodotti.prezzo': 0
    });
    
    let corretti = 0;
    const dettagli = [];
    
    for (const ordine of ordini) {
      const { prodotti: prodottiConPrezzi, totale: nuovoTotale } = calcolaPrezziOrdine(ordine.prodotti);
      
      // Aggiorna solo se c'è differenza
      if (nuovoTotale > 0 && nuovoTotale !== ordine.totale) {
        await Ordine.findByIdAndUpdate(ordine._id, {
          prodotti: prodottiConPrezzi,
          totale: nuovoTotale,
          updatedAt: new Date()
        });
        
        corretti++;
        dettagli.push({
          numeroOrdine: ordine.numeroOrdine,
          vecchioTotale: ordine.totale,
          nuovoTotale: nuovoTotale
        });
        
        logger.info(`✅ Ordine corretto: ${ordine.numeroOrdine} - €${ordine.totale} → €${nuovoTotale}`);
      }
    }
    
    res.json({
      success: true,
      message: `Corretti ${corretti} ordini`,
      corretti,
      dettagli
    });
  } catch (error) {
    logger.error('❌ Errore correzione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore correzione',
      error: error.message
    });
  }
});

export default router;