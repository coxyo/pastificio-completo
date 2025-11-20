// routes/limiti.js - ✅ AGGIORNATO 20/11/2025: Calcolo dinamico ordinato

import express from 'express';
// import { protect } from '../middleware/auth.js'; // COMMENTATO TEMPORANEAMENTE
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';

const router = express.Router();

// COMMENTATO TEMPORANEAMENTE PER TEST
// router.use(protect);

/**
 * ✅ NUOVA FUNZIONE: Calcola quantità ordinata per un limite
 */
const calcolaOrdinatoPerLimite = async (limite) => {
  try {
    // Crea range data per il giorno del limite
    const inizioGiorno = new Date(limite.data);
    inizioGiorno.setHours(0, 0, 0, 0);
    
    const fineGiorno = new Date(limite.data);
    fineGiorno.setHours(23, 59, 59, 999);
    
    // Trova tutti gli ordini per quella data
    const ordini = await Ordine.find({
      dataRitiro: { $gte: inizioGiorno, $lte: fineGiorno },
      stato: { $ne: 'annullato' } // Escludi annullati
    });
    
    let totaleOrdinato = 0;
    
    ordini.forEach(ordine => {
      if (!ordine.prodotti) return;
      
      ordine.prodotti.forEach(prodotto => {
        const nomeProdotto = prodotto.nome || prodotto.prodotto || '';
        const quantita = parseFloat(prodotto.quantita) || 0;
        const unita = prodotto.unitaMisura || prodotto.unita || 'Kg';
        
        // Skip vassoi
        if (unita === 'vassoio' || nomeProdotto === 'Vassoio Dolci Misti') {
          return;
        }
        
        // Converti in Kg se necessario
        let quantitaKg = quantita;
        if (unita === 'g') {
          quantitaKg = quantita / 1000;
        } else if (unita === 'Pezzi' || unita === 'pz') {
          // Per pezzi, usa la quantità diretta se il limite è in pezzi
          if (limite.unitaMisura === 'Pezzi') {
            quantitaKg = quantita;
          } else {
            // Altrimenti ignora o converti (es. 30 pezzi = 1 Kg per ravioli)
            quantitaKg = quantita / 30; // Conversione approssimativa
          }
        } else if (unita === '€') {
          // Per ordini in euro, stima Kg dal prezzo (es. 20€/Kg)
          const prezzoAlKg = 20; // Prezzo medio
          quantitaKg = quantita / prezzoAlKg;
        }
        
        // Verifica match con limite
        let match = false;
        
        // Match per prodotto specifico
        if (limite.prodotto) {
          // Match esatto o parziale
          if (nomeProdotto.toLowerCase().includes(limite.prodotto.toLowerCase()) ||
              limite.prodotto.toLowerCase().includes(nomeProdotto.toLowerCase())) {
            match = true;
          }
        }
        
        // Match per categoria
        if (limite.categoria) {
          const categoriaProdotto = determinaCategoria(nomeProdotto);
          if (categoriaProdotto.toLowerCase() === limite.categoria.toLowerCase()) {
            match = true;
          }
        }
        
        if (match) {
          totaleOrdinato += quantitaKg;
        }
      });
    });
    
    return totaleOrdinato;
    
  } catch (error) {
    console.error('Errore calcolo ordinato:', error);
    return 0;
  }
};

/**
 * ✅ HELPER: Determina categoria di un prodotto
 */
const determinaCategoria = (nomeProdotto) => {
  if (!nomeProdotto) return 'Altro';
  const nome = nomeProdotto.toLowerCase();
  
  if (nome.includes('ravioli') || nome.includes('culurgion')) {
    return 'Ravioli';
  }
  if (nome.includes('pardula')) {
    return 'Pardulas';
  }
  if (nome.includes('panada') || nome.includes('panadin')) {
    return 'Panadas';
  }
  if (nome.includes('amarett') || nome.includes('bianchin') || 
      nome.includes('ciambelle') || nome.includes('sebada') ||
      nome.includes('gueffus') || nome.includes('pabassina') ||
      nome.includes('torta')) {
    return 'Dolci';
  }
  
  return 'Altro';
};

/**
 * @route   GET /api/limiti
 * @desc    Ottieni tutti i limiti CON calcolo dinamico ordinato
 * @access  Pubblico (temporaneamente per test)
 */
router.get('/', async (req, res) => {
  try {
    const { data, attivo } = req.query;
    
    let query = {};
    
    if (data) {
      const inizioGiorno = new Date(data);
      inizioGiorno.setHours(0, 0, 0, 0);
      
      const fineGiorno = new Date(data);
      fineGiorno.setHours(23, 59, 59, 999);
      
      query.data = { $gte: inizioGiorno, $lte: fineGiorno };
    }
    
    if (attivo !== undefined) {
      query.attivo = attivo === 'true';
    }
    
    const limiti = await LimiteGiornaliero.find(query).sort({ data: 1, prodotto: 1 });
    
    // ✅ NUOVO: Calcola ordinato dinamicamente per ogni limite
    const limitiConOrdinato = await Promise.all(
      limiti.map(async (limite) => {
        const limiteObj = limite.toObject();
        limiteObj.quantitaOrdinata = await calcolaOrdinatoPerLimite(limite);
        return limiteObj;
      })
    );
    
    res.json({
      success: true,
      count: limitiConOrdinato.length,
      data: limitiConOrdinato
    });
    
  } catch (error) {
    logger.error('Errore GET /limiti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero limiti',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/limiti
 * @desc    Crea nuovo limite
 * @access  Pubblico (temporaneamente per test)
 */
router.post('/', async (req, res) => {
  try {
    const limite = new LimiteGiornaliero(req.body);
    await limite.save();
    
    logger.info(`✅ Limite creato: ${limite.prodotto || limite.categoria} per ${limite.data.toLocaleDateString()}`);
    
    res.status(201).json({
      success: true,
      data: limite
    });
    
  } catch (error) {
    logger.error('Errore POST /limiti:', error);
    res.status(400).json({
      success: false,
      message: 'Errore creazione limite',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/limiti/:id
 * @desc    Aggiorna limite
 * @access  Pubblico (temporaneamente per test)
 */
router.put('/:id', async (req, res) => {
  try {
    const limite = await LimiteGiornaliero.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!limite) {
      return res.status(404).json({
        success: false,
        message: 'Limite non trovato'
      });
    }
    
    logger.info(`✅ Limite aggiornato: ${limite._id}`);
    
    res.json({
      success: true,
      data: limite
    });
    
  } catch (error) {
    logger.error('Errore PUT /limiti/:id:', error);
    res.status(400).json({
      success: false,
      message: 'Errore aggiornamento limite',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/limiti/:id
 * @desc    Elimina limite
 * @access  Pubblico (temporaneamente per test)
 */
router.delete('/:id', async (req, res) => {
  try {
    const limite = await LimiteGiornaliero.findByIdAndDelete(req.params.id);
    
    if (!limite) {
      return res.status(404).json({
        success: false,
        message: 'Limite non trovato'
      });
    }
    
    logger.info(`🗑️ Limite eliminato: ${limite._id}`);
    
    res.json({
      success: true,
      message: 'Limite eliminato'
    });
    
  } catch (error) {
    logger.error('Errore DELETE /limiti/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Errore eliminazione limite',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/limiti/verifica
 * @desc    Verifica se ordine supera limiti
 * @access  Pubblico (temporaneamente per test)
 */
router.post('/verifica', async (req, res) => {
  try {
    const { dataRitiro, prodotti } = req.body;
    
    if (!dataRitiro || !prodotti) {
      return res.status(400).json({
        success: false,
        message: 'dataRitiro e prodotti sono obbligatori'
      });
    }
    
    const risultato = await LimiteGiornaliero.verificaOrdine(dataRitiro, prodotti);
    
    res.json({
      success: true,
      ...risultato
    });
    
  } catch (error) {
    logger.error('Errore POST /limiti/verifica:', error);
    res.status(500).json({
      success: false,
      message: 'Errore verifica limiti',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/limiti/bulk
 * @desc    Crea limiti in massa
 * @access  Pubblico (temporaneamente per test)
 */
router.post('/bulk', async (req, res) => {
  try {
    const { limiti } = req.body;
    
    if (!Array.isArray(limiti)) {
      return res.status(400).json({
        success: false,
        message: 'Formato non valido: limiti deve essere un array'
      });
    }
    
    const limitiCreati = await LimiteGiornaliero.insertMany(limiti);
    
    logger.info(`✅ Creati ${limitiCreati.length} limiti in massa`);
    
    res.status(201).json({
      success: true,
      count: limitiCreati.length,
      data: limitiCreati
    });
    
  } catch (error) {
    logger.error('Errore POST /limiti/bulk:', error);
    res.status(400).json({
      success: false,
      message: 'Errore creazione limiti in massa',
      error: error.message
    });
  }
});

export default router;
