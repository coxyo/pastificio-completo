// routes/clienti.js - Gestione clienti completa
import express from 'express';
import { protect } from '../middleware/auth.js';
import Cliente from '../models/Cliente.js';
import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * @route   GET /api/clienti
 * @desc    Ottiene lista clienti con filtri e paginazione
 * @access  Privato
 */
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      livello = '',
      attivo = 'true'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Costruisci query
    const query = {};

    if (search) {
      query.$or = [
        { nome: { $regex: search, $options: 'i' } },
        { cognome: { $regex: search, $options: 'i' } },
        { ragioneSociale: { $regex: search, $options: 'i' } },
        { codiceCliente: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { telefono: { $regex: search, $options: 'i' } },
        { cellulare: { $regex: search, $options: 'i' } }
      ];
    }

    if (livello) {
      query.livelloFedelta = livello;
    }

    if (attivo !== '') {
      query.attivo = attivo === 'true';
    }

    // Esegui query
    const clienti = await Cliente.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totale = await Cliente.countDocuments(query);

    logger.info('✅ Clienti recuperati', {
      totale,
      pagina: page,
      risultati: clienti.length
    });

    res.json({
      clienti,
      totale,
      pagina: parseInt(page),
      totalePagine: Math.ceil(totale / parseInt(limit))
    });

  } catch (error) {
    logger.error('❌ Errore recupero clienti', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/clienti/:id
 * @desc    Ottiene dettagli singolo cliente
 * @access  Privato
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }

    logger.info('✅ Cliente trovato', { clienteId: cliente._id });

    res.json(cliente);

  } catch (error) {
    logger.error('❌ Errore recupero cliente', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/clienti/:id/statistiche
 * @desc    Ottiene statistiche complete del cliente
 * @access  Privato
 */
router.get('/:id/statistiche', protect, async (req, res) => {
  try {
    const clienteId = req.params.id;
    
    // Verifica che il cliente esista
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }

    // Trova tutti gli ordini del cliente (esclusi annullati)
    const ordini = await Ordine.find({ 
      cliente: clienteId,
      stato: { $ne: 'annullato' }
    }).sort({ dataOrdine: -1 });

    // Calcola statistiche
    const totaleOrdini = ordini.length;
    const totaleSpeso = ordini.reduce((sum, o) => sum + (o.totale || 0), 0);
    const mediaOrdine = totaleOrdini > 0 ? totaleSpeso / totaleOrdini : 0;
    
    // Ultimo ordine
    const ultimoOrdine = ordini.length > 0 ? ordini[0].dataOrdine : null;
    
    // Ordini per mese (ultimi 12 mesi)
    const oggi = new Date();
    const unAnnoFa = new Date();
    unAnnoFa.setMonth(oggi.getMonth() - 12);
    
    const ordiniPerMese = ordini
      .filter(o => new Date(o.dataOrdine) >= unAnnoFa)
      .reduce((acc, o) => {
        const mese = new Date(o.dataOrdine).toLocaleDateString('it-IT', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!acc[mese]) {
          acc[mese] = { count: 0, totale: 0 };
        }
        acc[mese].count++;
        acc[mese].totale += o.totale || 0;
        return acc;
      }, {});

    // Prodotti più ordinati
    const prodottiMap = {};
    ordini.forEach(ordine => {
      if (ordine.prodotti && Array.isArray(ordine.prodotti)) {
        ordine.prodotti.forEach(p => {
          if (!prodottiMap[p.nome]) {
            prodottiMap[p.nome] = {
              nome: p.nome,
              quantita: 0,
              totale: 0,
              volte: 0
            };
          }
          prodottiMap[p.nome].quantita += p.quantita || 0;
          prodottiMap[p.nome].totale += p.prezzo || 0;
          prodottiMap[p.nome].volte++;
        });
      }
    });

    const prodottiPiuOrdinati = Object.values(prodottiMap)
      .sort((a, b) => b.volte - a.volte)
      .slice(0, 5);

    // Frequenza ordini (giorni medi tra ordini)
    let giorniMedi = 0;
    if (ordini.length >= 2) {
      const primoOrdine = new Date(ordini[ordini.length - 1].dataOrdine);
      const ultimoOrdineDate = new Date(ordini[0].dataOrdine);
      const giorniTotali = Math.floor((ultimoOrdineDate - primoOrdine) / (1000 * 60 * 60 * 24));
      giorniMedi = Math.floor(giorniTotali / (ordini.length - 1));
    }

    const stats = {
      totaleOrdini,
      totaleSpeso: parseFloat(totaleSpeso.toFixed(2)),
      mediaOrdine: parseFloat(mediaOrdine.toFixed(2)),
      ultimoOrdine,
      ordiniPerMese,
      prodottiPiuOrdinati,
      frequenzaOrdini: giorniMedi,
      primoOrdine: ordini.length > 0 ? ordini[ordini.length - 1].dataOrdine : null,
      clienteDal: cliente.createdAt
    };

    logger.info('✅ Statistiche cliente calcolate', {
      clienteId,
      totaleOrdini: stats.totaleOrdini,
      totaleSpeso: stats.totaleSpeso
    });
    
    res.json(stats);

  } catch (error) {
    logger.error('❌ Errore calcolo statistiche cliente', { 
      error: error.message,
      clienteId: req.params.id
    });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/clienti/:id/ordini
 * @desc    Ottiene tutti gli ordini di un cliente
 * @access  Privato
 */
router.get('/:id/ordini', protect, async (req, res) => {
  try {
    const clienteId = req.params.id;
    const { limit = 10, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const ordini = await Ordine.find({ cliente: clienteId })
      .sort({ dataOrdine: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totale = await Ordine.countDocuments({ cliente: clienteId });

    res.json({
      ordini,
      totale,
      pagina: parseInt(page),
      totalePagine: Math.ceil(totale / parseInt(limit))
    });

  } catch (error) {
    logger.error('❌ Errore recupero ordini cliente', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/clienti
 * @desc    Crea nuovo cliente
 * @access  Privato
 */
router.post('/', protect, async (req, res) => {
  try {
    // Genera codice cliente automatico
    const ultimoCliente = await Cliente.findOne().sort({ createdAt: -1 });
    let nuovoCodice = 'CL250001';
    
    if (ultimoCliente && ultimoCliente.codiceCliente) {
      const numero = parseInt(ultimoCliente.codiceCliente.replace('CL', '')) + 1;
      nuovoCodice = `CL${numero.toString().padStart(6, '0')}`;
    }

    const clienteData = {
      ...req.body,
      codiceCliente: nuovoCodice
    };

    const cliente = new Cliente(clienteData);
    await cliente.save();

    logger.info('✅ Cliente creato', {
      clienteId: cliente._id,
      codiceCliente: cliente.codiceCliente
    });

    res.status(201).json(cliente);

  } catch (error) {
    logger.error('❌ Errore creazione cliente', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/clienti/:id
 * @desc    Aggiorna cliente
 * @access  Privato
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }

    logger.info('✅ Cliente aggiornato', { clienteId: cliente._id });

    res.json(cliente);

  } catch (error) {
    logger.error('❌ Errore aggiornamento cliente', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/clienti/:id
 * @desc    Elimina (disattiva) cliente
 * @access  Privato
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { attivo: false },
      { new: true }
    );

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }

    logger.info('✅ Cliente disattivato', { clienteId: cliente._id });

    res.json({ success: true, message: 'Cliente disattivato' });

  } catch (error) {
    logger.error('❌ Errore eliminazione cliente', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;
