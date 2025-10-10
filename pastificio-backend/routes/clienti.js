// routes/clienti.js - CON CACHE OTTIMIZZATA
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Cliente from '../models/Cliente.js';
import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';
import ExcelJS from 'exceljs';

const router = express.Router();

// 🔥 CACHE IN-MEMORY PER LISTA CLIENTI
let clientiCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

// Funzione per invalidare cache
function invalidateCache() {
  clientiCache = null;
  cacheTimestamp = null;
  logger.info('🗑️ Cache clienti invalidata');
}

// ⚠️ AUTENTICAZIONE COMMENTATA PER TEST
// router.use(protect);

// GET /api/clienti - Lista clienti con filtri (CON CACHE)
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      tipo, 
      livello,
      attivo,
      limit = 100,
      skip = 0,
      sort = '-createdAt',
      noCache = false // Parametro per forzare bypass cache
    } = req.query;
    
    // 🔥 CHECK CACHE - solo per query semplici senza filtri
    const isSimpleQuery = !search && !tipo && !livello && skip === 0 && 
                          (attivo === 'true' || attivo === undefined);
    
    if (isSimpleQuery && !noCache) {
      const now = Date.now();
      const cacheValid = clientiCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION);
      
      if (cacheValid) {
        logger.debug(`✅ CACHE HIT - Clienti serviti dalla cache (età: ${Math.round((now - cacheTimestamp) / 1000)}s)`);
        
        return res.json({
          success: true,
          data: clientiCache,
          pagination: {
            total: clientiCache.length,
            limit: parseInt(limit),
            skip: 0
          },
          cached: true,
          cacheAge: Math.round((now - cacheTimestamp) / 1000)
        });
      } else {
        logger.debug('⚠️ CACHE MISS - Recupero da database');
      }
    }
    
    // Query normale con filtri
    let query = {};
    
    // Filtro ricerca
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { codiceCliente: regex },
        { nome: regex },
        { cognome: regex },
        { ragioneSociale: regex },
        { telefono: regex },
        { email: regex }
      ];
    }
    
    // Altri filtri
    if (tipo) query.tipo = tipo;
    if (livello) query.livelloFedelta = livello;
    
    if (attivo !== undefined && attivo !== '' && attivo !== null) {
      query.attivo = attivo === 'true';
    } else {
      query.attivo = true;
    }
    
    logger.debug('Query clienti:', query);
    
    const clienti = await Cliente.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort(sort)
      .lean(); // ✅ Performance: usa lean() per oggetti JS plain
    
    const total = await Cliente.countDocuments(query);
    
    // 🔥 AGGIORNA CACHE se query semplice
    if (isSimpleQuery) {
      clientiCache = clienti;
      cacheTimestamp = Date.now();
      logger.info(`💾 Cache clienti aggiornata: ${clienti.length} clienti`);
    }
    
    logger.debug(`Trovati ${clienti.length} clienti su ${total} totali`);
    
    res.json({
      success: true,
      data: clienti,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      },
      cached: false
    });
    
  } catch (error) {
    logger.error('Errore recupero clienti:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nel recupero dei clienti' 
    });
  }
});

// GET /api/clienti/export/excel - Export clienti in Excel
router.get('/export/excel', async (req, res) => {
  try {
    const clienti = await Cliente.find({ attivo: true }).sort('codiceCliente');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Clienti');
    
    worksheet.columns = [
      { header: 'Codice Cliente', key: 'codiceCliente', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 10 },
      { header: 'Nome', key: 'nome', width: 20 },
      { header: 'Cognome', key: 'cognome', width: 20 },
      { header: 'Ragione Sociale', key: 'ragioneSociale', width: 30 },
      { header: 'Telefono', key: 'telefono', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Indirizzo', key: 'indirizzo', width: 40 },
      { header: 'CAP', key: 'cap', width: 10 },
      { header: 'Città', key: 'citta', width: 20 },
      { header: 'Provincia', key: 'provincia', width: 10 },
      { header: 'Partita IVA', key: 'partitaIva', width: 15 },
      { header: 'Codice Fiscale', key: 'codiceFiscale', width: 20 },
      { header: 'Livello Fedeltà', key: 'livelloFedelta', width: 15 },
      { header: 'Punti', key: 'punti', width: 10 },
      { header: 'Totale Speso', key: 'totaleSpeso', width: 15 },
      { header: 'Note', key: 'note', width: 30 },
      { header: 'Data Creazione', key: 'createdAt', width: 15 }
    ];
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    clienti.forEach(cliente => {
      worksheet.addRow({
        codiceCliente: cliente.codiceCliente,
        tipo: cliente.tipo,
        nome: cliente.nome,
        cognome: cliente.cognome,
        ragioneSociale: cliente.ragioneSociale,
        telefono: cliente.telefono,
        email: cliente.email,
        indirizzo: cliente.indirizzo,
        cap: cliente.cap,
        citta: cliente.citta,
        provincia: cliente.provincia,
        partitaIva: cliente.partitaIva,
        codiceFiscale: cliente.codiceFiscale,
        livelloFedelta: cliente.livelloFedelta,
        punti: cliente.punti,
        totaleSpeso: cliente.statistiche?.totaleSpeso || 0,
        note: cliente.note,
        createdAt: cliente.createdAt ? new Date(cliente.createdAt).toLocaleDateString('it-IT') : ''
      });
    });
    
    worksheet.autoFilter = {
      from: 'A1',
      to: `R${clienti.length + 1}`
    };
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=clienti_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    res.send(buffer);
    
    logger.info('Export Excel clienti completato', { 
      numeroClienti: clienti.length
    });
    
  } catch (error) {
    logger.error('Errore export Excel clienti:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore durante l\'export Excel' 
    });
  }
});

// GET /api/clienti/search/:query - Ricerca rapida clienti
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }
    
    const clienti = await Cliente.cerca(query);
    
    res.json({ success: true, data: clienti });
    
  } catch (error) {
    logger.error('Errore ricerca clienti:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nella ricerca' 
    });
  }
});

// GET /api/clienti/top - Top clienti per fatturato
router.get('/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const clienti = await Cliente.find({ attivo: true })
      .sort('-statistiche.totaleSpeso')
      .limit(parseInt(limit));
    
    res.json({ success: true, data: clienti });
    
  } catch (error) {
    logger.error('Errore recupero top clienti:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nel recupero dei top clienti' 
    });
  }
});

// POST /api/clienti - Crea nuovo cliente
router.post('/', async (req, res) => {
  try {
    logger.info('🔥 POST /api/clienti - Creazione nuovo cliente');
    
    const clienteData = {
      ...req.body
      // creatoDa: req.user?._id
    };
    
    // Se non c'è il cognome ma c'è uno spazio nel nome, dividi
    if (!clienteData.cognome && clienteData.nome && clienteData.nome.includes(' ')) {
      const parti = clienteData.nome.split(' ');
      clienteData.nome = parti[0];
      clienteData.cognome = parti.slice(1).join(' ');
    }
    
    const cliente = await Cliente.create(clienteData);
    
    // 🔥 INVALIDA CACHE dopo creazione
    invalidateCache();
    
    logger.info('✅ Nuovo cliente creato', { 
      clienteId: cliente._id,
      codiceCliente: cliente.codiceCliente,
      nome: cliente.nomeCompleto 
    });
    
    res.status(201).json({ 
      success: true, 
      data: cliente 
    });
    
  } catch (error) {
    logger.error('❌ Errore creazione cliente:', error);
    
    if (error.code === 11000) {
      const campo = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        success: false, 
        error: `${campo} già esistente` 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Errore nella creazione del cliente',
      details: error.message
    });
  }
});

// GET /api/clienti/:id - Ottieni singolo cliente
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente non trovato' 
      });
    }
    
    res.json({ success: true, data: cliente });
    
  } catch (error) {
    logger.error('Errore recupero cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nel recupero del cliente' 
    });
  }
});

// PUT /api/clienti/:id - Aggiorna cliente
router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente non trovato' 
      });
    }
    
    // 🔥 INVALIDA CACHE dopo update
    invalidateCache();
    
    logger.info('Cliente aggiornato', { clienteId: cliente._id });
    
    res.json({ success: true, data: cliente });
    
  } catch (error) {
    logger.error('Errore aggiornamento cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nell\'aggiornamento del cliente' 
    });
  }
});

// DELETE /api/clienti/:id - Elimina cliente (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente non trovato' 
      });
    }
    
    cliente.attivo = false;
    await cliente.save();
    
    // 🔥 INVALIDA CACHE dopo delete
    invalidateCache();
    
    logger.info('Cliente disattivato', { clienteId: cliente._id });
    
    res.json({ 
      success: true, 
      message: 'Cliente disattivato con successo' 
    });
    
  } catch (error) {
    logger.error('Errore eliminazione cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nell\'eliminazione del cliente' 
    });
  }
});

// GET /api/clienti/:id/statistiche - Statistiche cliente
router.get('/:id/statistiche', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente non trovato' 
      });
    }
    
    const ordini = await Ordine.find({ 
      $or: [
        { cliente: cliente._id },
        { telefono: cliente.telefono }
      ]
    }).sort('-dataRitiro');
    
    const statistiche = {
      ...cliente.statistiche.toObject(),
      ordiniTotali: ordini.length,
      ordiniUltimi30Giorni: ordini.filter(o => {
        const giorni30Fa = new Date();
        giorni30Fa.setDate(giorni30Fa.getDate() - 30);
        return new Date(o.dataRitiro) > giorni30Fa;
      }).length,
      prodottiPreferiti: calcolaProdottiPreferiti(ordini),
      puntiMancanti: calcolaPuntiMancanti(cliente.livelloFedelta, cliente.punti)
    };
    
    res.json({ success: true, data: statistiche });
    
  } catch (error) {
    logger.error('Errore recupero statistiche:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nel recupero delle statistiche' 
    });
  }
});

// POST /api/clienti/:id/punti - Aggiungi/rimuovi punti
router.post('/:id/punti', async (req, res) => {
  try {
    const { punti, motivo } = req.body;
    
    if (!punti || !motivo) {
      return res.status(400).json({ 
        success: false, 
        error: 'Punti e motivo sono obbligatori' 
      });
    }
    
    const cliente = await Cliente.findById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente non trovato' 
      });
    }
    
    await cliente.aggiungiPunti(punti, motivo);
    
    // 🔥 INVALIDA CACHE dopo modifica punti
    invalidateCache();
    
    logger.info('Punti modificati', { 
      clienteId: cliente._id,
      punti,
      motivo,
      nuovoTotale: cliente.punti 
    });
    
    res.json({ 
      success: true, 
      data: {
        puntiAggiunti: punti,
        nuovoTotale: cliente.punti,
        nuovoLivello: cliente.livelloFedelta
      }
    });
    
  } catch (error) {
    logger.error('Errore modifica punti:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nella modifica dei punti' 
    });
  }
});

// GET /api/clienti/:id/ordini - Ordini del cliente
router.get('/:id/ordini', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente non trovato' 
      });
    }
    
    const ordini = await Ordine.find({ 
      $or: [
        { cliente: cliente._id },
        { telefono: cliente.telefono }
      ]
    })
    .sort('-dataRitiro')
    .limit(50);
    
    res.json({ success: true, data: ordini });
    
  } catch (error) {
    logger.error('Errore recupero ordini cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nel recupero degli ordini' 
    });
  }
});

// Funzioni helper
function calcolaProdottiPreferiti(ordini) {
  const prodottiCount = {};
  
  ordini.forEach(ordine => {
    if (ordine.prodotti) {
      ordine.prodotti.forEach(prod => {
        const nome = prod.nome || prod.prodotto;
        if (nome) {
          prodottiCount[nome] = (prodottiCount[nome] || 0) + 1;
        }
      });
    }
  });
  
  return Object.entries(prodottiCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, count]) => ({ nome, count }));
}

function calcolaPuntiMancanti(livello, puntiAttuali) {
  const soglie = {
    bronzo: 200,
    argento: 500,
    oro: 1000,
    platino: Infinity
  };
  
  const prossimaSoglia = 
    livello === 'bronzo' ? soglie.argento :
    livello === 'argento' ? soglie.oro :
    livello === 'oro' ? soglie.platino :
    0;
  
  return prossimaSoglia === Infinity ? 0 : Math.max(0, prossimaSoglia - puntiAttuali);
}

// GET /api/clienti/:id/export - Export dati cliente
router.get('/:id/export', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente non trovato' });
    }

    const ordini = await Ordine.find({ 
      $or: [
        { cliente: cliente._id },
        { telefono: cliente.telefono }
      ]
    }).sort('-dataRitiro');

    const workbook = new ExcelJS.Workbook();
    
    const clienteSheet = workbook.addWorksheet('Cliente');
    clienteSheet.columns = [
      { header: 'Campo', key: 'campo', width: 20 },
      { header: 'Valore', key: 'valore', width: 40 }
    ];
    
    clienteSheet.addRows([
      { campo: 'Codice Cliente', valore: cliente.codiceCliente },
      { campo: 'Nome', valore: cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome}` },
      { campo: 'Telefono', valore: cliente.telefono },
      { campo: 'Email', valore: cliente.email || '-' },
      { campo: 'Punti Fedeltà', valore: cliente.punti },
      { campo: 'Livello', valore: cliente.livelloFedelta },
      { campo: 'Totale Speso', valore: `€${cliente.statistiche?.totaleSpeso?.toFixed(2) || '0.00'}` },
      { campo: 'Numero Ordini', valore: cliente.statistiche?.numeroOrdini || 0 }
    ]);
    
    const ordiniSheet = workbook.addWorksheet('Ordini');
    ordiniSheet.columns = [
      { header: 'N° Ordine', key: 'numero', width: 15 },
      { header: 'Data', key: 'data', width: 15 },
      { header: 'Prodotti', key: 'prodotti', width: 40 },
      { header: 'Totale', key: 'totale', width: 12 },
      { header: 'Stato', key: 'stato', width: 15 }
    ];
    
    ordini.forEach(ordine => {
      ordiniSheet.addRow({
        numero: ordine.numeroOrdine || ordine._id.toString().slice(-6),
        data: new Date(ordine.dataRitiro).toLocaleDateString('it-IT'),
        prodotti: ordine.prodotti?.map(p => `${p.nome} (${p.quantita} ${p.unita})`).join(', '),
        totale: `€${ordine.totale?.toFixed(2) || '0.00'}`,
        stato: ordine.stato
      });
    });
    
    [clienteSheet, ordiniSheet].forEach(sheet => {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=cliente_${cliente.codiceCliente}_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
    
    logger.info('Export cliente completato', { clienteId: cliente._id });
    
  } catch (error) {
    logger.error('Errore export cliente:', error);
    res.status(500).json({ success: false, error: 'Errore durante l\'export' });
  }
});

export default router;