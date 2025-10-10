// routes/ordini.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';
import whatsappService from '../services/whatsappService.js';

const router = express.Router();

// Funzione helper per validare numero telefono
const isValidPhoneNumber = (telefono) => {
  if (!telefono) return false;
  const numeroPulito = telefono.replace(/[\s\-\(\)]/g, '');
  return /^[0-9]{6,15}$/.test(numeroPulito);
};

/**
 * 🆕 FUNZIONE HELPER: Gestione cliente flessibile
 * Accetta sia ObjectId stringa che oggetto completo
 */
async function resolveClienteId(clienteData) {
  try {
    // Caso 1: È già un ObjectId stringa valido
    if (typeof clienteData === 'string' && clienteData.match(/^[0-9a-fA-F]{24}$/)) {
      logger.info(`Cliente già in formato ObjectId: ${clienteData}`);
      return clienteData;
    }
    
    // Caso 2: È un oggetto con _id
    if (clienteData && typeof clienteData === 'object' && clienteData._id) {
      logger.info(`Estratto _id da oggetto cliente: ${clienteData._id}`);
      return clienteData._id;
    }
    
    // Caso 3: È un oggetto con nome/telefono - cerca o crea il cliente
    if (clienteData && typeof clienteData === 'object' && clienteData.nome && clienteData.telefono) {
      logger.info(`Ricerca/creazione cliente: ${clienteData.nome} - ${clienteData.telefono}`);
      
      // Cerca cliente esistente per telefono
      let cliente = await Cliente.findOne({ 
        telefono: clienteData.telefono 
      });
      
      if (cliente) {
        logger.info(`Cliente trovato: ${cliente._id}`);
        return cliente._id;
      }
      
      // Se non esiste, crea nuovo cliente
      logger.info(`Creazione nuovo cliente: ${clienteData.nome}`);
      
      // Genera codice cliente automatico
      const ultimoCliente = await Cliente.findOne()
        .sort({ codiceCliente: -1 })
        .select('codiceCliente');
      
      let numeroCliente = 1;
      if (ultimoCliente && ultimoCliente.codiceCliente) {
        const match = ultimoCliente.codiceCliente.match(/CL(\d+)/);
        if (match) {
          numeroCliente = parseInt(match[1]) + 1;
        }
      }
      
      const anno = new Date().getFullYear().toString().slice(-2);
      const codiceCliente = `CL${anno}${String(numeroCliente).padStart(4, '0')}`;
      
      cliente = await Cliente.create({
        codiceCliente,
        nome: clienteData.nome,
        telefono: clienteData.telefono,
        email: clienteData.email || '',
        indirizzo: clienteData.indirizzo || '',
        tipo: clienteData.tipo || 'privato',
        note: clienteData.note || '',
        attivo: true
      });
      
      logger.info(`Cliente creato con successo: ${cliente._id} - ${codiceCliente}`);
      return cliente._id;
    }
    
    // Caso 4: Formato non riconosciuto
    throw new Error('Formato cliente non valido');
    
  } catch (error) {
    logger.error(`Errore risoluzione cliente: ${error.message}`);
    throw error;
  }
}

/**
 * @route   GET /api/ordini
 * @desc    Ottiene tutti gli ordini
 * @access  Privato
 */
router.get('/', async (req, res) => {
  try {
    const ordini = await Ordine.find()
      .populate('cliente', 'nome telefono email codiceCliente')
      .sort({ createdAt: -1 });
    
    logger.info(`Ordini recuperati: ${ordini.length}`);
    res.json(ordini);
  } catch (error) {
    logger.error(`Errore recupero ordini: ${error}`);
    res.status(500).json({ message: 'Errore nel recupero degli ordini' });
  }
});

/**
 * @route   GET /api/ordini/:id
 * @desc    Ottiene un singolo ordine
 * @access  Privato
 */
router.get('/:id', async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.id)
      .populate('cliente', 'nome telefono email codiceCliente');
    
    if (!ordine) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    
    res.json(ordine);
  } catch (error) {
    logger.error(`Errore recupero ordine: ${error}`);
    res.status(500).json({ message: 'Errore nel recupero dell\'ordine' });
  }
});

/**
 * @route   POST /api/ordini
 * @desc    Crea un nuovo ordine
 * @access  Privato
 * 🔥 FIX: Gestione cliente flessibile
 */
router.post('/', async (req, res) => {
  try {
    let { cliente, prodotti, dataRitiro, oraRitiro, note, stato } = req.body;
    
    logger.info(`📥 Richiesta creazione ordine - Cliente ricevuto:`, 
      typeof cliente === 'object' ? JSON.stringify(cliente) : cliente
    );
    
    // 🔥 RISOLUZIONE CLIENTE FLESSIBILE
    const clienteId = await resolveClienteId(cliente);
    
    if (!clienteId) {
      return res.status(400).json({ 
        message: 'Cliente non valido o non trovato' 
      });
    }
    
    // Genera codice ordine automatico
    const ultimoOrdine = await Ordine.findOne()
      .sort({ numeroOrdine: -1 })
      .select('numeroOrdine');
    
    const numeroOrdine = ultimoOrdine 
      ? ultimoOrdine.numeroOrdine + 1 
      : 1;
    
    const codiceOrdine = `ORD${String(numeroOrdine).padStart(6, '0')}`;
    
    // Calcola totale ordine
    const totaleOrdine = prodotti.reduce((sum, p) => sum + (p.prezzo || 0), 0);
    
    // Crea ordine con clienteId risolto
    const nuovoOrdine = new Ordine({
      cliente: clienteId, // ✅ Sempre ObjectId valido
      codiceOrdine,
      numeroOrdine,
      prodotti,
      totale: totaleOrdine,
      dataRitiro,
      oraRitiro,
      note,
      stato: stato || 'in attesa'
    });
    
    await nuovoOrdine.save();
    
    // Popola il cliente per la risposta
    await nuovoOrdine.populate('cliente', 'nome telefono email codiceCliente');
    
    logger.info(`✅ Ordine creato con successo: ${codiceOrdine} - Cliente: ${clienteId}`);
    
    res.status(201).json({
      success: true,
      ordine: nuovoOrdine
    });
    
  } catch (error) {
    logger.error(`❌ Errore creazione ordine: ${error}`);
    res.status(400).json({ 
      message: 'Errore nella creazione dell\'ordine',
      error: error.message 
    });
  }
});

/**
 * @route   PUT /api/ordini/:id
 * @desc    Aggiorna un ordine
 * @access  Privato
 * 🔥 FIX: Gestione cliente flessibile
 */
router.put('/:id', async (req, res) => {
  try {
    let { cliente, prodotti, dataRitiro, oraRitiro, note, stato } = req.body;
    
    logger.info(`📝 Richiesta aggiornamento ordine ${req.params.id}`);
    
    // 🔥 RISOLUZIONE CLIENTE FLESSIBILE (se fornito)
    let clienteId;
    if (cliente) {
      clienteId = await resolveClienteId(cliente);
    }
    
    // Calcola nuovo totale
    const totaleOrdine = prodotti 
      ? prodotti.reduce((sum, p) => sum + (p.prezzo || 0), 0)
      : undefined;
    
    const updateData = {
      ...(clienteId && { cliente: clienteId }),
      ...(prodotti && { prodotti }),
      ...(totaleOrdine !== undefined && { totale: totaleOrdine }),
      ...(dataRitiro && { dataRitiro }),
      ...(oraRitiro && { oraRitiro }),
      ...(note !== undefined && { note }),
      ...(stato && { stato }),
      updatedAt: new Date()
    };
    
    const ordineAggiornato = await Ordine.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('cliente', 'nome telefono email codiceCliente');
    
    if (!ordineAggiornato) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    
    logger.info(`✅ Ordine aggiornato: ${req.params.id}`);
    res.json(ordineAggiornato);
    
  } catch (error) {
    logger.error(`❌ Errore aggiornamento ordine: ${error}`);
    res.status(400).json({ 
      message: 'Errore nell\'aggiornamento dell\'ordine',
      error: error.message 
    });
  }
});

/**
 * @route   DELETE /api/ordini/:id
 * @desc    Elimina un ordine
 * @access  Privato
 */
router.delete('/:id', async (req, res) => {
  try {
    const ordine = await Ordine.findByIdAndDelete(req.params.id);
    
    if (!ordine) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    
    logger.info(`🗑️ Ordine eliminato: ${req.params.id}`);
    res.json({ message: 'Ordine eliminato con successo' });
    
  } catch (error) {
    logger.error(`Errore eliminazione ordine: ${error}`);
    res.status(500).json({ message: 'Errore nell\'eliminazione dell\'ordine' });
  }
});

/**
 * @route   PATCH /api/ordini/:id/stato
 * @desc    Aggiorna solo lo stato di un ordine
 * @access  Privato
 */
router.patch('/:id/stato', async (req, res) => {
  try {
    const { stato } = req.body;
    
    const ordine = await Ordine.findByIdAndUpdate(
      req.params.id,
      { stato, updatedAt: new Date() },
      { new: true }
    ).populate('cliente', 'nome telefono email codiceCliente');
    
    if (!ordine) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    
    logger.info(`📊 Stato ordine aggiornato: ${req.params.id} -> ${stato}`);
    res.json(ordine);
    
  } catch (error) {
    logger.error(`Errore aggiornamento stato: ${error}`);
    res.status(400).json({ message: 'Errore nell\'aggiornamento dello stato' });
  }
});

/**
 * @route   GET /api/ordini/data/:data
 * @desc    Ottiene ordini per una specifica data
 * @access  Privato
 */
router.get('/data/:data', async (req, res) => {
  try {
    const { data } = req.params;
    
    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: new Date(data + 'T00:00:00.000Z'),
        $lt: new Date(data + 'T23:59:59.999Z')
      }
    })
    .populate('cliente', 'nome telefono email codiceCliente')
    .sort({ oraRitiro: 1 });
    
    logger.info(`Ordini recuperati per ${data}: ${ordini.length}`);
    res.json(ordini);
    
  } catch (error) {
    logger.error(`Errore recupero ordini per data: ${error}`);
    res.status(500).json({ message: 'Errore nel recupero degli ordini' });
  }
});

export default router;