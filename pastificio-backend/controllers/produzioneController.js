// controllers/produzioneController.js
import PianoProduzione from '../models/pianoProduzione.js';
import Ricetta from '../models/ricetta.js';
import Ingrediente from '../models/ingrediente.js';
import Movimento from '../models/movimento.js';
import logger from '../config/logger.js';
import { io } from '../server.js';

// Get production plans
export const getPianiProduzione = async (req, res) => {
  try {
    const { data, completato } = req.query;
    const query = {};
    
    if (data) {
      const startDate = new Date(data);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(data);
      endDate.setHours(23, 59, 59, 999);
      
      query.data = { $gte: startDate, $lte: endDate };
    }
    
    if (completato !== undefined) {
      query.completato = completato === 'true';
    }
    
    const pianiProduzione = await PianoProduzione.find(query)
      .populate({
        path: 'produzioni.ricetta',
        select: 'nome categoria resa'
      })
      .populate({
        path: 'produzioni.operatore',
        select: 'username'
      })
      .sort({ data: 1 });
    
    res.status(200).json({
      success: true,
      count: pianiProduzione.length,
      data: pianiProduzione
    });
  } catch (error) {
    logger.error(`Errore nel recupero piani di produzione: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei piani di produzione'
    });
  }
};

// Create production plan
export const createPianoProduzione = async (req, res) => {
  try {
    const pianoProduzione = await PianoProduzione.create(req.body);
    
    // Popola le ricette per calcoli
    await pianoProduzione.populate({
      path: 'produzioni.ricetta',
      populate: {
        path: 'ingredienti.ingrediente'
      }
    });
    
    // Calcola costi totali
    let costoMateriali = 0;
    
    for (const produzione of pianoProduzione.produzioni) {
      const ricetta = produzione.ricetta;
      if (!ricetta) continue;
      
      await ricetta.calcolaCosto();
      const costoUnitario = ricetta.costoStimato;
      const quantita = produzione.quantitaPianificata;
      costoMateriali += costoUnitario * quantita;
    }
    
    pianoProduzione.costo.materiali = costoMateriali;
    pianoProduzione.costo.totale = costoMateriali + pianoProduzione.costo.lavoro;
    
    await pianoProduzione.save();
    
    // Notifica tramite WebSocket
    io.emit('nuovoPianoProduzione', {
      id: pianoProduzione._id,
      data: pianoProduzione.data
    });
    
    res.status(201).json({
      success: true,
      data: pianoProduzione
    });
  } catch (error) {
    logger.error(`Errore nella creazione piano produzione: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Start production
export const startProduzione = async (req, res) => {
  try {
    const { pianoId, produzioneIndex } = req.params;
    
    const piano = await PianoProduzione.findById(pianoId)
      .populate({
        path: 'produzioni.ricetta',
        populate: {
          path: 'ingredienti.ingrediente'
        }
      });
    
    if (!piano) {
      return res.status(404).json({
        success: false,
        error: 'Piano produzione non trovato'
      });
    }
    
    const produzione = piano.produzioni[produzioneIndex];
    if (!produzione) {
      return res.status(404).json({
        success: false,
        error: 'Produzione non trovata nel piano'
      });
    }
    
    // Verifica disponibilità ingredienti
    const ricetta = produzione.ricetta;
    const quantitaPianificata = produzione.quantitaPianificata;
    
    if (!ricetta) {
      return res.status(400).json({
        success: false,
        error: 'Ricetta non trovata'
      });
    }
    
    // Verifica disponibilità ingredienti
    const ingredientiMancanti = [];
    
    for (const item of ricetta.ingredienti) {
      const ingrediente = item.ingrediente;
      if (!ingrediente) continue;
      
      const quantitaNecessaria = item.quantita * quantitaPianificata;
      if (ingrediente.quantitaDisponibile < quantitaNecessaria) {
        ingredientiMancanti.push({
          nome: ingrediente.nome,
          disponibile: ingrediente.quantitaDisponibile,
          necessario: quantitaNecessaria,
          mancante: quantitaNecessaria - ingrediente.quantitaDisponibile
        });
      }
    }
    
    if (ingredientiMancanti.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ingredienti insufficienti',
        ingredientiMancanti
      });
    }
    
    // Scala ingredienti dal magazzino
    for (const item of ricetta.ingredienti) {
      const ingrediente = item.ingrediente;
      if (!ingrediente) continue;
      
      const quantitaNecessaria = item.quantita * quantitaPianificata;
      
      // Crea movimento magazzino
      await Movimento.create({
        tipo: 'uscita',
        ingrediente: ingrediente._id,
        quantita: quantitaNecessaria,
        utenteId: req.user.id,
        lottoRiferimento: produzione.lottoProduzioneId,
        nota: `Produzione ${ricetta.nome} - Lotto ${produzione.lottoProduzioneId}`
      });
      
      // Aggiorna quantità disponibile
      ingrediente.quantitaDisponibile -= quantitaNecessaria;
      await ingrediente.save();
    }
    
    // Aggiorna stato produzione
    produzione.stato = 'in_corso';
    produzione.orarioInizio = new Date();
    produzione.operatore = req.user.id;
    
    await piano.save();
    
    // Notifica aggiornamento
    io.emit('produzioneAggiornata', {
      pianoId,
      produzioneIndex,
      stato: 'in_corso'
    });
    
    res.status(200).json({
      success: true,
      data: piano
    });
  } catch (error) {
    logger.error(`Errore nell'avvio produzione: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'avvio della produzione'
    });
  }
};

// Complete production
export const completeProduzione = async (req, res) => {
  try {
    const { pianoId, produzioneIndex } = req.params;
    const { quantitaProdotta, note } = req.body;
    
    const piano = await PianoProduzione.findById(pianoId)
      .populate({
        path: 'produzioni.ricetta',
        select: 'nome resa'
      });
    
    if (!piano) {
      return res.status(404).json({
        success: false,
        error: 'Piano produzione non trovato'
      });
    }
    
    const produzione = piano.produzioni[produzioneIndex];
    if (!produzione) {
      return res.status(404).json({
        success: false,
        error: 'Produzione non trovata nel piano'
      });
    }
    
    // Aggiorna stato produzione
    produzione.stato = 'completato';
    produzione.orarioFine = new Date();
    produzione.quantitaProdotta = quantitaProdotta || produzione.quantitaPianificata;
    if (note) produzione.note = notes;
    
    // Verifica se tutto il piano è completato
    const tuttoCompletato = piano.produzioni.every(
      p => p.stato === 'completato' || p.stato === 'annullato'
    );
    
    if (tuttoCompletato) {
      piano.completato = true;
    }
    
    await piano.save();
    
    // Notifica completamento
    io.emit('produzioneAggiornata', {
      pianoId,
      produzioneIndex,
      stato: 'completato',
      completato: piano.completato
    });
    
    res.status(200).json({
      success: true,
      data: piano
    });
  } catch (error) {
    logger.error(`Errore nel completamento produzione: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Errore nel completamento della produzione'
    });
  }
};