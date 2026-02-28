// routes/clienti.js - CON CACHE OTTIMIZZATA + ⭐ PREFERITI + STATISTICHE DETTAGLIATE
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
// ⭐ AGGIORNATO: ordinamento preferito DESC, cognome ASC, nome ASC
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      tipo, 
      livello,
      attivo,
      limit = 100,
      skip = 0,
      sort: sortParam,
      noCache = false,
      orderBy // ⭐ Nuovo parametro: se 'preferito', forza ordinamento preferiti
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
    
    // ⭐ Ordinamento: preferiti in cima, poi cognome/nome
    const sortOrder = (orderBy === 'preferito' || !sortParam)
      ? { preferito: -1, cognome: 1, nome: 1 }
      : sortParam;
    
    const clienti = await Cliente.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort(sortOrder)
      .lean();
    
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
      { header: '⭐', key: 'preferito', width: 5 },
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
      { header: 'N° Ordini', key: 'numeroOrdini', width: 12 },
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
        preferito: cliente.preferito ? '⭐' : '',
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
        numeroOrdini: cliente.statistiche?.numeroOrdini || 0,
        totaleSpeso: cliente.statistiche?.totaleSpeso || 0,
        note: cliente.note,
        createdAt: cliente.createdAt ? new Date(cliente.createdAt).toLocaleDateString('it-IT') : ''
      });
    });
    
    worksheet.autoFilter = {
      from: 'A1',
      to: `T${clienti.length + 1}`
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

// GET /api/clienti/top - Top clienti per numero ordini
// ⭐ AGGIORNATO: usato anche per suggerimento preferiti
router.get('/top', async (req, res) => {
  try {
    const { limit = 10, orderBy = 'ordini' } = req.query;
    
    const sortField = orderBy === 'speso' 
      ? '-statistiche.totaleSpeso' 
      : '-statistiche.numeroOrdini';
    
    const clienti = await Cliente.find({ attivo: true })
      .sort(sortField)
      .limit(parseInt(limit))
      .lean();
    
    res.json({ success: true, data: clienti });
    
  } catch (error) {
    logger.error('Errore recupero top clienti:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nel recupero dei top clienti' 
    });
  }
});

// ⭐ PUT /api/clienti/:id/preferito - Toggle preferito
router.put('/:id/preferito', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente non trovato' 
      });
    }
    
    // Toggle
    cliente.preferito = !cliente.preferito;
    
    if (cliente.preferito) {
      cliente.preferitoDA = req.body.utente || req.user?.nome || 'admin';
      cliente.preferitoIl = new Date();
    } else {
      cliente.preferitoDA = null;
      cliente.preferitoIl = null;
    }
    
    await cliente.save();
    
    // 🔥 INVALIDA CACHE
    invalidateCache();
    
    logger.info(`⭐ Cliente ${cliente.nomeCompleto} ${cliente.preferito ? 'aggiunto ai' : 'rimosso dai'} preferiti`);
    
    res.json({ 
      success: true, 
      data: cliente,
      preferito: cliente.preferito
    });
    
  } catch (error) {
    logger.error('Errore toggle preferito:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nel toggle preferito' 
    });
  }
});

// ⭐ PUT /api/clienti/preferiti/bulk - Imposta più clienti come preferiti
router.put('/preferiti/bulk', async (req, res) => {
  try {
    const { clienteIds, utente } = req.body;
    
    if (!clienteIds || !Array.isArray(clienteIds) || clienteIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'clienteIds è obbligatorio (array di ID)' 
      });
    }
    
    const result = await Cliente.updateMany(
      { _id: { $in: clienteIds } },
      { 
        $set: { 
          preferito: true, 
          preferitoDA: utente || 'admin',
          preferitoIl: new Date()
        }
      }
    );
    
    // 🔥 INVALIDA CACHE
    invalidateCache();
    
    logger.info(`⭐ ${result.modifiedCount} clienti impostati come preferiti`);
    
    res.json({ 
      success: true, 
      aggiornati: result.modifiedCount
    });
    
  } catch (error) {
    logger.error('Errore preferiti bulk:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nell\'impostazione preferiti' 
    });
  }
});

// ⭐ POST /api/clienti/ricalcola-contatori - Ricalcola statistiche per tutti i clienti
router.post('/ricalcola-contatori', async (req, res) => {
  try {
    logger.info('🔄 Inizio ricalcolo contatori clienti...');
    
    const clienti = await Cliente.find({ attivo: true });
    let aggiornati = 0;
    let errori = 0;
    
    for (const cliente of clienti) {
      try {
        // Cerca tutti gli ordini del cliente (per _id o telefono)
        const ordini = await Ordine.find({
          $or: [
            { cliente: cliente._id },
            { telefono: cliente.telefono }
          ],
          stato: { $ne: 'annullato' }
        }).sort('dataRitiro').lean();
        
        const totaleSpeso = ordini.reduce((sum, o) => sum + (o.totale || 0), 0);
        const numeroOrdini = ordini.length;
        
        let primoOrdine = null;
        let ultimoOrdine = null;
        let frequenzaGiorni = 0;
        
        if (ordini.length > 0) {
          // Trova il primo e ultimo ordine per data
          const dateOrdini = ordini
            .map(o => new Date(o.dataRitiro || o.createdAt))
            .filter(d => !isNaN(d.getTime()))
            .sort((a, b) => a - b);
          
          if (dateOrdini.length > 0) {
            primoOrdine = dateOrdini[0];
            ultimoOrdine = dateOrdini[dateOrdini.length - 1];
            
            if (dateOrdini.length > 1) {
              const giorniTotali = Math.max(1, Math.floor(
                (ultimoOrdine - primoOrdine) / (1000 * 60 * 60 * 24)
              ));
              frequenzaGiorni = Math.round(giorniTotali / (dateOrdini.length - 1));
            }
          }
        }
        
        await Cliente.findByIdAndUpdate(cliente._id, {
          $set: {
            'statistiche.numeroOrdini': numeroOrdini,
            'statistiche.totaleSpeso': parseFloat(totaleSpeso.toFixed(2)),
            'statistiche.ultimoOrdine': ultimoOrdine,
            'statistiche.primoOrdine': primoOrdine,
            'statistiche.mediaOrdine': numeroOrdini > 0 ? parseFloat((totaleSpeso / numeroOrdini).toFixed(2)) : 0,
            'statistiche.frequenzaGiorni': frequenzaGiorni
          }
        });
        
        aggiornati++;
        
      } catch (err) {
        errori++;
        logger.error(`Errore ricalcolo cliente ${cliente._id}:`, err.message);
      }
    }
    
    // 🔥 INVALIDA CACHE
    invalidateCache();
    
    logger.info(`✅ Ricalcolo completato: ${aggiornati} aggiornati, ${errori} errori su ${clienti.length} totali`);
    
    res.json({ 
      success: true, 
      totale: clienti.length,
      aggiornati,
      errori,
      message: `Ricalcolo completato: ${aggiornati} clienti aggiornati`
    });
    
  } catch (error) {
    logger.error('Errore ricalcolo contatori:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nel ricalcolo contatori' 
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

// ⭐ GET /api/clienti/:id/statistiche-dettagliate - Statistiche DETTAGLIATE cliente
router.get('/:id/statistiche-dettagliate', async (req, res) => {
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
      ],
      stato: { $ne: 'annullato' }
    }).sort('dataRitiro').lean();
    
    // Calcola statistiche dettagliate
    const totaleSpeso = ordini.reduce((sum, o) => sum + (o.totale || 0), 0);
    const numeroOrdini = ordini.length;
    
    // Primo e ultimo ordine
    let primoOrdine = null;
    let ultimoOrdine = null;
    let frequenzaGiorni = 0;
    
    const dateOrdini = ordini
      .map(o => new Date(o.dataRitiro || o.createdAt))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a - b);
    
    if (dateOrdini.length > 0) {
      primoOrdine = dateOrdini[0];
      ultimoOrdine = dateOrdini[dateOrdini.length - 1];
      
      if (dateOrdini.length > 1) {
        const giorniTotali = Math.max(1, Math.floor(
          (ultimoOrdine - primoOrdine) / (1000 * 60 * 60 * 24)
        ));
        frequenzaGiorni = Math.round(giorniTotali / (dateOrdini.length - 1));
      }
    }
    
    // Prodotti preferiti (top 5)
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
    
    const prodottiPreferiti = Object.entries(prodottiCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, count]) => ({ nome, count }));
    
    // Ordini ultimi 30 giorni
    const giorni30Fa = new Date();
    giorni30Fa.setDate(giorni30Fa.getDate() - 30);
    const ordiniUltimi30gg = ordini.filter(o => {
      const data = new Date(o.dataRitiro || o.createdAt);
      return data > giorni30Fa;
    }).length;
    
    // Spesa per mese (ultimi 6 mesi)
    const mesi6Fa = new Date();
    mesi6Fa.setMonth(mesi6Fa.getMonth() - 6);
    const spesaPerMese = {};
    
    ordini.forEach(o => {
      const data = new Date(o.dataRitiro || o.createdAt);
      if (data > mesi6Fa) {
        const chiave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        spesaPerMese[chiave] = (spesaPerMese[chiave] || 0) + (o.totale || 0);
      }
    });
    
    // Giorno della settimana preferito
    const giorniSettimana = [0, 0, 0, 0, 0, 0, 0]; // Dom, Lun, Mar, ...
    const nomiGiorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    
    ordini.forEach(o => {
      const data = new Date(o.dataRitiro || o.createdAt);
      if (!isNaN(data.getTime())) {
        giorniSettimana[data.getDay()]++;
      }
    });
    
    const giornoPreferito = giorniSettimana.indexOf(Math.max(...giorniSettimana));
    
    const statistiche = {
      numeroOrdini,
      totaleSpeso: parseFloat(totaleSpeso.toFixed(2)),
      mediaOrdine: numeroOrdini > 0 ? parseFloat((totaleSpeso / numeroOrdini).toFixed(2)) : 0,
      primoOrdine: primoOrdine ? primoOrdine.toISOString() : null,
      ultimoOrdine: ultimoOrdine ? ultimoOrdine.toISOString() : null,
      frequenzaGiorni,
      ordiniUltimi30gg,
      prodottiPreferiti,
      spesaPerMese,
      giornoPreferito: nomiGiorni[giornoPreferito] || '-',
      livelloFedelta: cliente.livelloFedelta,
      punti: cliente.punti,
      puntiMancanti: calcolaPuntiMancanti(cliente.livelloFedelta, cliente.punti)
    };
    
    res.json({ success: true, data: statistiche });
    
  } catch (error) {
    logger.error('Errore recupero statistiche dettagliate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore nel recupero delle statistiche' 
    });
  }
});

// GET /api/clienti/:id/statistiche - Statistiche cliente (legacy)
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
      { campo: 'Preferito', valore: cliente.preferito ? '⭐ Sì' : 'No' },
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