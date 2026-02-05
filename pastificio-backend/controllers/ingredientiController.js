// controllers/ingredientiController.js - ✅ GESTIONE COMPLETA INGREDIENTI + SCARICO AUTO
import Ingrediente from '../models/Ingrediente.js';
import Movimento from '../models/Movimento.js';
import logger from '../config/logger.js';

// =====================================
// 1. GET TUTTI GLI INGREDIENTI
// =====================================
export const getIngredienti = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      categoria,
      search,
      attivo,
      sottoScorta
    } = req.query;
    
    const query = {};
    
    if (categoria) query.categoria = categoria;
    if (attivo !== undefined) query.attivo = attivo === 'true';
    if (search) {
      query.$or = [
        { nome: new RegExp(search, 'i') },
        { descrizione: new RegExp(search, 'i') }
      ];
    }
    
    let ingredientiQuery = Ingrediente.find(query);
    
    // Se richiesti solo sotto scorta
    if (sottoScorta === 'true') {
      ingredientiQuery = Ingrediente.getSottoScorta();
    }
    
    const skip = (page - 1) * limit;
    
    const [ingredienti, totale] = await Promise.all([
      ingredientiQuery
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ nome: 1 }),
      Ingrediente.countDocuments(query)
    ]);
    
    // Per ogni ingrediente, calcola lotti in scadenza
    const ingredientiConInfo = ingredienti.map(ing => {
      const obj = ing.toObject();
      
      // Conta lotti attivi
      obj.lottiAttivi = ing.lotti.filter(
        l => l.stato === 'disponibile' || l.stato === 'in_uso'
      ).length;
      
      // Trova lotto più vecchio in scadenza
      const lottiInScadenza = ing.lotti
        .filter(l => l.stato === 'disponibile' || l.stato === 'in_uso')
        .map(l => ({
          codiceLotto: l.codiceLotto,
          giorniAllaScadenza: Math.ceil((l.dataScadenza - new Date()) / (1000 * 60 * 60 * 24))
        }))
        .filter(l => l.giorniAllaScadenza <= 7)
        .sort((a, b) => a.giorniAllaScadenza - b.giorniAllaScadenza);
      
      obj.primoLottoInScadenza = lottiInScadenza[0] || null;
      obj.sottoScorta = ing.giacenzaAttuale < ing.giacenzaMinima;
      
      return obj;
    });
    
    res.status(200).json({
      success: true,
      data: ingredientiConInfo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totale,
        pagine: Math.ceil(totale / limit)
      }
    });
    
  } catch (error) {
    logger.error('Errore get ingredienti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero ingredienti',
      error: error.message
    });
  }
};

// =====================================
// 2. GET SINGOLO INGREDIENTE
// =====================================
export const getIngrediente = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.findById(req.params.id)
      .populate('fornitoriAbituali.fornitore', 'ragioneSociale partitaIVA contatti');
    
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente non trovato'
      });
    }
    
    // Aggiungi info extra
    const obj = ingrediente.toObject();
    
    // Ultimi movimenti
    obj.ultimiMovimenti = await Movimento.find({
      'prodotto.nome': ingrediente.nome
    })
      .sort({ dataMovimento: -1 })
      .limit(10)
      .select('tipo quantita unita dataMovimento lotto fornitore.nome');
    
    // Statistiche lotti
    const lottiAttivi = ingrediente.lotti.filter(
      l => l.stato === 'disponibile' || l.stato === 'in_uso'
    );
    
    obj.statisticheLotti = {
      totali: ingrediente.lotti.length,
      disponibili: ingrediente.lotti.filter(l => l.stato === 'disponibile').length,
      inUso: ingrediente.lotti.filter(l => l.stato === 'in_uso').length,
      esauriti: ingrediente.lotti.filter(l => l.stato === 'esaurito').length,
      scaduti: ingrediente.lotti.filter(l => l.stato === 'scaduto').length,
      valoreTotale: lottiAttivi.reduce(
        (sum, l) => sum + (l.quantitaAttuale * l.prezzoUnitario),
        0
      )
    };
    
    res.status(200).json({
      success: true,
      data: obj
    });
    
  } catch (error) {
    logger.error('Errore get ingrediente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero ingrediente',
      error: error.message
    });
  }
};

// =====================================
// 3. CREA INGREDIENTE
// =====================================
export const createIngrediente = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.create(req.body);
    
    logger.info(`Ingrediente creato: ${ingrediente.nome}`);
    
    res.status(201).json({
      success: true,
      message: 'Ingrediente creato con successo',
      data: ingrediente
    });
    
  } catch (error) {
    logger.error('Errore creazione ingrediente:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un ingrediente con questo nome esiste già'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Errore creazione ingrediente',
      error: error.message
    });
  }
};

// =====================================
// 4. AGGIORNA INGREDIENTE
// =====================================
export const updateIngrediente = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente non trovato'
      });
    }
    
    logger.info(`Ingrediente aggiornato: ${ingrediente.nome}`);
    
    res.status(200).json({
      success: true,
      message: 'Ingrediente aggiornato',
      data: ingrediente
    });
    
  } catch (error) {
    logger.error('Errore aggiornamento ingrediente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore aggiornamento ingrediente',
      error: error.message
    });
  }
};

// =====================================
// 5. ELIMINA INGREDIENTE
// =====================================
export const deleteIngrediente = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.findById(req.params.id);
    
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente non trovato'
      });
    }
    
    // Verifica se ha lotti attivi
    const lottiAttivi = ingrediente.lotti.filter(
      l => l.stato === 'disponibile' || l.stato === 'in_uso'
    );
    
    if (lottiAttivi.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossibile eliminare: ingrediente ha lotti attivi',
        lottiAttivi: lottiAttivi.length
      });
    }
    
    // Disattiva invece di eliminare
    ingrediente.attivo = false;
    await ingrediente.save();
    
    logger.info(`Ingrediente disattivato: ${ingrediente.nome}`);
    
    res.status(200).json({
      success: true,
      message: 'Ingrediente disattivato'
    });
    
  } catch (error) {
    logger.error('Errore eliminazione ingrediente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore eliminazione ingrediente',
      error: error.message
    });
  }
};

// =====================================
// 6. AGGIUNGI LOTTO
// =====================================
export const aggiungiLotto = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.findById(req.params.id);
    
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente non trovato'
      });
    }
    
    // Genera codice lotto se non fornito
    if (!req.body.codiceLotto) {
      req.body.codiceLotto = await Ingrediente.generaCodiceLotto(ingrediente.nome);
    }
    
    await ingrediente.aggiungiLotto(req.body);
    
    logger.info(`Lotto aggiunto: ${req.body.codiceLotto} per ${ingrediente.nome}`);
    
    res.status(200).json({
      success: true,
      message: 'Lotto aggiunto con successo',
      data: ingrediente
    });
    
  } catch (error) {
    logger.error('Errore aggiunta lotto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore aggiunta lotto',
      error: error.message
    });
  }
};

// =====================================
// 7. GET INGREDIENTI SOTTO SCORTA
// =====================================
export const getIngredientiSottoScorta = async (req, res) => {
  try {
    const ingredienti = await Ingrediente.getSottoScorta();
    
    // Aggiungi info extra
    const conInfo = ingredienti.map(ing => {
      const obj = ing.toObject();
      obj.differenza = ing.giacenzaMinima - ing.giacenzaAttuale;
      obj.percentuale = Math.round((ing.giacenzaAttuale / ing.giacenzaMinima) * 100);
      return obj;
    });
    
    res.status(200).json({
      success: true,
      count: conInfo.length,
      data: conInfo
    });
    
  } catch (error) {
    logger.error('Errore get sotto scorta:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero ingredienti sotto scorta',
      error: error.message
    });
  }
};

// =====================================
// 8. GET INGREDIENTI IN SCADENZA
// =====================================
export const getIngredientiInScadenza = async (req, res) => {
  try {
    const { giorniSoglia = 7 } = req.query;
    
    const lottiInScadenza = await Ingrediente.getLottiInScadenza(parseInt(giorniSoglia));
    
    res.status(200).json({
      success: true,
      count: lottiInScadenza.length,
      data: lottiInScadenza
    });
    
  } catch (error) {
    logger.error('Errore get in scadenza:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero lotti in scadenza',
      error: error.message
    });
  }
};

// =====================================
// 9. SCARICO INGREDIENTI DA ORDINE (AUTO)
// =====================================
/**
 * Scarica automaticamente ingredienti quando viene creato un ordine
 * @param {Object} ordine - Ordine cliente
 * @param {String} userId - ID utente che crea l'ordine
 */
export const scaricoAutomaticoOrdine = async (ordine, userId) => {
  try {
    const Ricetta = (await import('../models/Ricetta.js')).default;
    
    const risultati = {
      successi: [],
      errori: [],
      movimenti: []
    };
    
    // Per ogni prodotto nell'ordine
    for (const item of ordine.prodotti) {
      try {
        // Cerca ricetta del prodotto
        const ricetta = await Ricetta.findOne({
          nome: item.nome,
          attivo: true
        }).populate('ingredienti.ingrediente');
        
        if (!ricetta || !ricetta.ingredienti || ricetta.ingredienti.length === 0) {
          risultati.errori.push({
            prodotto: item.nome,
            motivo: 'Ricetta non trovata o senza ingredienti'
          });
          continue;
        }
        
        // Per ogni ingrediente nella ricetta
        for (const ingredienteRicetta of ricetta.ingredienti) {
          const ingrediente = await Ingrediente.findById(ingredienteRicetta.ingrediente);
          
          if (!ingrediente) {
            risultati.errori.push({
              prodotto: item.nome,
              ingrediente: ingredienteRicetta.ingrediente.nome,
              motivo: 'Ingrediente non trovato'
            });
            continue;
          }
          
          // Calcola quantità da scaricare (proporzionale a quantità ordinata)
          const quantitaBase = ingredienteRicetta.quantita; // Per 1 unità prodotto
          const quantitaTotale = quantitaBase * (item.quantita || 1);
          
          // Scarica con metodo FIFO
          const lottiUsati = await ingrediente.scaricoFIFO(quantitaTotale, {
            prodottoFinito: {
              nome: item.nome,
              id: item.id
            },
            ordineCliente: {
              id: ordine._id,
              numeroOrdine: ordine.numeroOrdine || ordine._id.toString().slice(-6),
              cliente: `${ordine.cliente?.nome || ''} ${ordine.cliente?.cognome || ''}`.trim()
            }
          });
          
          // Crea movimento scarico per ogni lotto usato
          for (const lottoUsato of lottiUsati) {
            const movimento = await Movimento.create({
              tipo: 'scarico',
              prodotto: {
                nome: ingrediente.nome,
                categoria: ingrediente.categoria,
                codice: ingrediente._id.toString()
              },
              quantita: lottoUsato.quantita,
              unita: ingrediente.unitaMisura,
              prezzoUnitario: ingrediente.prezzoMedioAcquisto || 0,
              valoreMovimento: lottoUsato.quantita * (ingrediente.prezzoMedioAcquisto || 0),
              documentoRiferimento: {
                tipo: 'Ordine',
                numero: ordine.numeroOrdine || ordine._id.toString().slice(-6),
                data: ordine.dataOrdine || new Date()
              },
              lotto: lottoUsato.codiceLotto,
              note: `Scarico automatico per ordine - Prodotto: ${item.nome} - Cliente: ${ordine.cliente?.nome || 'N/D'}`,
              dataMovimento: new Date(),
              utente: userId
            });
            
            risultati.movimenti.push(movimento._id);
          }
          
          risultati.successi.push({
            prodotto: item.nome,
            ingrediente: ingrediente.nome,
            quantitaScaricata: quantitaTotale,
            lottiUsati: lottiUsati.map(l => l.codiceLotto)
          });
          
          logger.info(`Scarico automatico: ${quantitaTotale}${ingrediente.unitaMisura} di ${ingrediente.nome} per ordine ${ordine._id}`);
        }
        
      } catch (error) {
        logger.error(`Errore scarico automatico prodotto ${item.nome}:`, error);
        risultati.errori.push({
          prodotto: item.nome,
          motivo: error.message
        });
      }
    }
    
    return risultati;
    
  } catch (error) {
    logger.error('Errore scarico automatico ordine:', error);
    throw error;
  }
};