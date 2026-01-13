// routes/limiti.js - VERSIONE COMPLETA con route Zeppole
// ✅ AGGIORNATO 15/12/2025 + ROUTE ZEPPOLE

import express from 'express';
import { protect } from '../middleware/auth.js';
import LimiteGiornaliero from '../models/LimiteGiornaliero.js';
import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(protect);

/**
 * ✅ FUNZIONE: Calcola quantità ordinata per un limite (CON DEBUG)
 */
const calcolaOrdinatoPerLimite = async (limite) => {
  try {
    // Crea range data per il giorno del limite
    const inizioGiorno = new Date(limite.data);
    inizioGiorno.setHours(0, 0, 0, 0);
    
    const fineGiorno = new Date(limite.data);
    fineGiorno.setHours(23, 59, 59, 999);
    
    console.log(`\n🔍 ===== CALCOLO ORDINATO =====`);
    console.log(`📦 Prodotto/Categoria: ${limite.prodotto || limite.categoria}`);
    console.log(`📅 Data: ${inizioGiorno.toLocaleDateString('it-IT')}`);
    console.log(`⏰ Range: ${inizioGiorno.toISOString()} → ${fineGiorno.toISOString()}`);
    
    // Trova tutti gli ordini per quella data
    const ordini = await Ordine.find({
      dataRitiro: { $gte: inizioGiorno, $lte: fineGiorno },
      stato: { $ne: 'annullato' } // Escludi annullati
    });
    
    console.log(`📋 Ordini trovati: ${ordini.length}`);
    
    let totaleOrdinato = 0;
    let contatoreMatch = 0;
    
    ordini.forEach((ordine, idx) => {
      if (!ordine.prodotti) return;
      
      console.log(`\n  📦 Ordine ${idx + 1}/${ordini.length} - ${ordine.numeroOrdine}`);
      
      ordine.prodotti.forEach((prodotto, pIdx) => {
        const nomeProdotto = prodotto.nome || prodotto.prodotto || '';
        const quantita = parseFloat(prodotto.quantita) || 0;
        const unita = prodotto.unitaMisura || prodotto.unita || 'Kg';
        
        console.log(`    ${pIdx + 1}. ${nomeProdotto} - ${quantita} ${unita}`);
        
        // Skip vassoi
        if (unita === 'vassoio' || nomeProdotto === 'Vassoio Dolci Misti') {
          console.log(`       ⏭️ Skip vassoio`);
          return;
        }
        
        // Converti in Kg se necessario
        let quantitaKg = quantita;
        if (unita === 'g') {
          quantitaKg = quantita / 1000;
          console.log(`       🔄 Conversione: ${quantita}g → ${quantitaKg}Kg`);
        } else if (unita === 'Pezzi' || unita === 'pz') {
          if (limite.unitaMisura === 'Pezzi') {
            quantitaKg = quantita;
            console.log(`       ✅ Limite in pezzi, uso diretto: ${quantitaKg}`);
          } else {
            quantitaKg = quantita / 30;
            console.log(`       🔄 Conversione: ${quantita}pz → ${quantitaKg}Kg (stima)`);
          }
        } else if (unita === '€') {
          const prezzoAlKg = 20;
          quantitaKg = quantita / prezzoAlKg;
          console.log(`       🔄 Conversione: ${quantita}€ → ${quantitaKg}Kg (stima @20€/Kg)`);
        }
        
        // Verifica match con limite
        let match = false;
        
        // Match per prodotto specifico
        if (limite.prodotto) {
          if (nomeProdotto.toLowerCase().includes(limite.prodotto.toLowerCase()) ||
              limite.prodotto.toLowerCase().includes(nomeProdotto.toLowerCase())) {
            match = true;
            console.log(`       ✅ MATCH prodotto: "${limite.prodotto}"`);
          }
        }
        
        // Match per categoria
        if (limite.categoria) {
          const categoriaProdotto = determinaCategoria(nomeProdotto);
          if (categoriaProdotto.toLowerCase() === limite.categoria.toLowerCase()) {
            match = true;
            console.log(`       ✅ MATCH categoria: "${limite.categoria}"`);
          } else {
            console.log(`       ❌ NO MATCH: categoria prodotto="${categoriaProdotto}" vs limite="${limite.categoria}"`);
          }
        }
        
        if (match) {
          totaleOrdinato += quantitaKg;
          contatoreMatch++;
          console.log(`       ➕ Aggiunto: ${quantitaKg}Kg → Totale: ${totaleOrdinato.toFixed(2)}Kg`);
        }
      });
    });
    
    console.log(`\n✅ RISULTATO FINALE:`);
    console.log(`   Prodotti matchati: ${contatoreMatch}`);
    console.log(`   Totale ordinato: ${totaleOrdinato.toFixed(2)} ${limite.unitaMisura}`);
    console.log(`   Limite: ${limite.limiteQuantita} ${limite.unitaMisura}`);
    console.log(`   Disponibile: ${(limite.limiteQuantita - totaleOrdinato).toFixed(2)} ${limite.unitaMisura}`);
    console.log(`================================\n`);
    
    return totaleOrdinato;
    
  } catch (error) {
    console.error('❌ ERRORE calcolo ordinato:', error);
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
 * @access  Protetto
 */
router.get('/', async (req, res) => {
  try {
    const { data, attivo } = req.query;
    
    console.log(`\n🌐 GET /api/limiti - Query params:`, { data, attivo });
    
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
    console.log(`📊 Limiti trovati in DB: ${limiti.length}`);
    
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
    console.error('❌ Errore GET /limiti:', error);
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
 * @access  Protetto
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
 * @access  Protetto
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
 * @access  Protetto
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
 * @access  Protetto
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
 * @access  Protetto
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

// ========================================
// ⭐ NUOVE ROUTE PER GESTIONE ZEPPOLE
// ========================================

/**
 * @route   POST /api/limiti/vendita-diretta
 * @desc    Registra vendita diretta (senza ordine) per un prodotto
 * @access  Protetto
 */
router.post('/vendita-diretta', async (req, res) => {
  try {
    const { prodotto, quantitaKg, data, nota } = req.body;
    
    if (!prodotto || !quantitaKg) {
      return res.status(400).json({
        success: false,
        message: 'Prodotto e quantità sono obbligatori'
      });
    }

    // Data di default: oggi
    const dataTarget = data ? new Date(data) : new Date();
    dataTarget.setHours(0, 0, 0, 0);

    // Trova limite per quel prodotto e data
    const limite = await LimiteGiornaliero.findOne({
      prodotto: prodotto,
      data: dataTarget,
      attivo: true
    });

    if (!limite) {
      return res.status(404).json({
        success: false,
        message: `Limite giornaliero non configurato per ${prodotto}`
      });
    }

    // Verifica disponibilità
    const disponibile = limite.limiteQuantita - limite.quantitaOrdinata;
    if (disponibile < quantitaKg) {
      return res.status(400).json({
        success: false,
        message: `Disponibilità insufficiente. Rimangono solo ${disponibile.toFixed(2)} Kg`
      });
    }

    // Incrementa quantità ordinata
    limite.quantitaOrdinata += quantitaKg;
    
    // Aggiungi alle note se fornita
    if (nota) {
      limite.note = (limite.note || '') + `\n[${new Date().toLocaleTimeString('it-IT')}] Vendita diretta: ${quantitaKg}Kg - ${nota}`;
    }
    
    await limite.save();

    // 🔥 Notifica real-time via Pusher
    try {
      const pusherService = await import('../services/pusherService.js');
      pusherService.default.trigger('zeppole-channel', 'vendita-diretta', {
        prodotto: prodotto,
        quantitaKg: quantitaKg,
        disponibileKg: limite.limiteQuantita - limite.quantitaOrdinata,
        ordinatoKg: limite.quantitaOrdinata,
        timestamp: new Date()
      });
    } catch (pusherError) {
      console.error('⚠️ Errore Pusher (non critico):', pusherError);
    }

    logger.info(`✅ Vendita diretta registrata: ${quantitaKg}Kg di ${prodotto}`);

    res.json({
      success: true,
      message: `Venduti ${quantitaKg} Kg di ${prodotto}`,
      data: {
        limite: limite.limiteQuantita,
        ordinato: limite.quantitaOrdinata,
        disponibile: limite.limiteQuantita - limite.quantitaOrdinata
      }
    });

  } catch (error) {
    logger.error('Errore vendita diretta:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella registrazione vendita',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/limiti/prodotto/:nome
 * @desc    Ottieni limite per un prodotto specifico (es: Zeppole)
 * @access  Protetto
 */
router.get('/prodotto/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    const { data } = req.query;

    // Data di default: oggi
    const dataTarget = data ? new Date(data) : new Date();
    dataTarget.setHours(0, 0, 0, 0);

    let limite = await LimiteGiornaliero.findOne({
      prodotto: nome,
      data: dataTarget
    });

    // Se non esiste, crea limite di default
    if (!limite) {
      limite = await LimiteGiornaliero.create({
        prodotto: nome,
        data: dataTarget,
        limiteQuantita: 20, // Default 20 Kg
        unitaMisura: 'Kg',
        quantitaOrdinata: 0,
        attivo: true,
        sogliAllerta: 80
      });
      logger.info(`✅ Creato limite di default per ${nome}: 20 Kg`);
    }

    // Calcola ordinato dinamicamente
    limite.quantitaOrdinata = await calcolaOrdinatoPerLimite(limite);
    await limite.save();

    res.json({
      success: true,
      data: limite
    });

  } catch (error) {
    logger.error('Errore GET limite prodotto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero limite',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/limiti/reset-prodotto
 * @desc    Reset disponibilità per un prodotto specifico
 * @access  Protetto
 */
router.post('/reset-prodotto', async (req, res) => {
  try {
    const { prodotto, data } = req.body;

    if (!prodotto) {
      return res.status(400).json({
        success: false,
        message: 'Prodotto è obbligatorio'
      });
    }

    const dataTarget = data ? new Date(data) : new Date();
    dataTarget.setHours(0, 0, 0, 0);

    const limite = await LimiteGiornaliero.findOne({
      prodotto: prodotto,
      data: dataTarget,
      attivo: true
    });

    if (!limite) {
      return res.status(404).json({
        success: false,
        message: `Limite non trovato per ${prodotto}`
      });
    }

    // Reset quantità ordinata
    const vecchioOrdinato = limite.quantitaOrdinata;
    limite.quantitaOrdinata = 0;
    limite.note = (limite.note || '') + `\n[${new Date().toLocaleTimeString('it-IT')}] Reset disponibilità (era: ${vecchioOrdinato}Kg)`;
    await limite.save();

    // 🔥 Notifica real-time
    try {
      const pusherService = await import('../services/pusherService.js');
      pusherService.default.trigger('zeppole-channel', 'reset-disponibilita', {
        prodotto: prodotto,
        limiteKg: limite.limiteQuantita,
        timestamp: new Date()
      });
    } catch (pusherError) {
      console.error('⚠️ Errore Pusher (non critico):', pusherError);
    }

    logger.info(`✅ Reset disponibilità: ${prodotto} (era ${vecchioOrdinato}Kg)`);

    res.json({
      success: true,
      message: `Disponibilità resettata per ${prodotto}`,
      data: limite
    });

  } catch (error) {
    logger.error('Errore reset prodotto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel reset',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/limiti/ordini-prodotto/:nome
 * @desc    Ottieni ordini di oggi per un prodotto specifico
 * @access  Protetto
 */
router.get('/ordini-prodotto/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    const { data } = req.query;

    const dataTarget = data ? new Date(data) : new Date();
    dataTarget.setHours(0, 0, 0, 0);
    
    const fineGiorno = new Date(dataTarget);
    fineGiorno.setHours(23, 59, 59, 999);

    const ordini = await Ordine.find({
      dataRitiro: { $gte: dataTarget, $lte: fineGiorno },
      stato: { $ne: 'annullato' }
    })
    .populate('cliente', 'nome cognome codiceCliente')
    .sort({ oraRitiro: 1 })
    .lean();

    // Filtra ed estrai solo il prodotto richiesto
    const ordiniProdotto = [];
    
    ordini.forEach(ordine => {
      if (!ordine.prodotti) return;

      ordine.prodotti.forEach(prodotto => {
        const nomeProdotto = prodotto.nome || prodotto.prodotto || '';
        
        // Match case-insensitive
        if (nomeProdotto.toLowerCase().includes(nome.toLowerCase())) {
          let quantitaKg = parseFloat(prodotto.quantita) || 0;
          const unita = prodotto.unitaMisura || prodotto.unita || 'Kg';
          
          // Converti in Kg
          if (unita === 'g') {
            quantitaKg = quantitaKg / 1000;
          } else if (unita === 'Pezzi' || unita === 'pz') {
            quantitaKg = quantitaKg / 30; // Stima
          }

          ordiniProdotto.push({
            ordineId: ordine._id,
            numeroOrdine: ordine.numeroOrdine,
            cliente: ordine.cliente ? 
              `${ordine.cliente.nome || ''} ${ordine.cliente.cognome || ''}`.trim() : 
              'Cliente non specificato',
            codiceCliente: ordine.cliente?.codiceCliente,
            oraRitiro: ordine.oraRitiro,
            quantita: prodotto.quantita,
            unita: unita,
            quantitaKg: quantitaKg,
            note: prodotto.note || '',
            stato: ordine.stato
          });
        }
      });
    });

    const totaleKg = ordiniProdotto.reduce((sum, o) => sum + o.quantitaKg, 0);

    res.json({
      success: true,
      count: ordiniProdotto.length,
      totaleKg: totaleKg,
      data: ordiniProdotto
    });

  } catch (error) {
    logger.error('Errore GET ordini prodotto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero ordini',
      error: error.message
    });
  }
});

export default router;