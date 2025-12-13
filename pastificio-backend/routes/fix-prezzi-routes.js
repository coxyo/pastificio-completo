// routes/fix-prezzi-routes.js
// Endpoint per correggere ordini con prezzo €0.00

import express from 'express';
import Ordine from '../models/Ordine.js';

const router = express.Router();

// ========== CONFIGURAZIONE PREZZI ==========
const PREZZI_PRODOTTI = {
  // PANADAS
  'Panada Anguille': { prezzoKg: 30.00 },
  'Panada di Agnello': { prezzoKg: 25.00 },
  'Panada di Maiale': { prezzoKg: 21.00 },
  'Panada di Vitella': { prezzoKg: 23.00 },
  'Panada di verdure': { prezzoKg: 17.00 },
  'Panadine': { prezzoPezzo: 0.80, prezzoKg: 16.00, pezziPerKg: 20 },
  
  // DOLCI
  'Pardulas': { prezzoKg: 20.00, pezziPerKg: 25 },
  'Ciambelle': { prezzoKg: 17.00, pezziPerKg: 30 },
  'Ciambelle con nutella': { prezzoKg: 18.00, pezziPerKg: 30 },
  'Amaretti': { prezzoKg: 22.00, pezziPerKg: 35 },
  'Papassinas': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Papassini': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Pabassine': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Bianchini': { prezzoKg: 25.00, pezziPerKg: 40 },
  'Gueffus': { prezzoKg: 28.00, pezziPerKg: 35 },
  'Zeppole': { prezzoKg: 18.00, pezziPerKg: 24 },
  
  // PASTE
  'Sebadas': { prezzoPezzo: 2.50 },
  'Sebadas arancia': { prezzoPezzo: 2.00 },
  'Ravioli': { prezzoKg: 11.00, pezziPerKg: 30 },
  'Culurgiones': { prezzoKg: 16.00, pezziPerKg: 32 },
  'Malloreddus': { prezzoKg: 9.00 },
  'Lorighittas': { prezzoKg: 14.00 },
  
  // ALTRI
  'Dolci misti': { prezzoKg: 22.00 },
};

// Funzione per trovare config prodotto (con fuzzy matching)
function getPrezzoConfig(nomeProdotto) {
  if (!nomeProdotto) return null;
  
  // 1. Cerca esatto
  if (PREZZI_PRODOTTI[nomeProdotto]) {
    return PREZZI_PRODOTTI[nomeProdotto];
  }
  
  // 2. Cerca nome base (senza parentesi)
  const nomeBase = nomeProdotto.split(' (')[0].trim();
  if (PREZZI_PRODOTTI[nomeBase]) {
    return PREZZI_PRODOTTI[nomeBase];
  }
  
  // 3. Cerca per keyword
  const nomeLower = nomeProdotto.toLowerCase();
  
  if (nomeLower.includes('anguille')) return PREZZI_PRODOTTI['Panada Anguille'];
  if (nomeLower.includes('agnello')) return PREZZI_PRODOTTI['Panada di Agnello'];
  if (nomeLower.includes('maiale')) return PREZZI_PRODOTTI['Panada di Maiale'];
  if (nomeLower.includes('vitella')) return PREZZI_PRODOTTI['Panada di Vitella'];
  if (nomeLower.includes('verdure')) return PREZZI_PRODOTTI['Panada di verdure'];
  if (nomeLower.includes('panadine')) return PREZZI_PRODOTTI['Panadine'];
  
  if (nomeLower.includes('pardula')) return PREZZI_PRODOTTI['Pardulas'];
  if (nomeLower.includes('ciambelle') && nomeLower.includes('nutella')) return PREZZI_PRODOTTI['Ciambelle con nutella'];
  if (nomeLower.includes('ciambelle') || nomeLower.includes('ciambella')) return PREZZI_PRODOTTI['Ciambelle'];
  if (nomeLower.includes('amarett')) return PREZZI_PRODOTTI['Amaretti'];
  if (nomeLower.includes('papassin') || nomeLower.includes('pabassini')) return PREZZI_PRODOTTI['Papassinas'];
  if (nomeLower.includes('pabassine')) return PREZZI_PRODOTTI['Pabassine'];
  if (nomeLower.includes('bianchin')) return PREZZI_PRODOTTI['Bianchini'];
  if (nomeLower.includes('gueffus')) return PREZZI_PRODOTTI['Gueffus'];
  if (nomeLower.includes('zeppol')) return PREZZI_PRODOTTI['Zeppole'];
  
  if (nomeLower.includes('sebadas') && nomeLower.includes('arancia')) return PREZZI_PRODOTTI['Sebadas arancia'];
  if (nomeLower.includes('sebadas')) return PREZZI_PRODOTTI['Sebadas'];
  if (nomeLower.includes('ravioli')) return PREZZI_PRODOTTI['Ravioli'];
  if (nomeLower.includes('culurgion')) return PREZZI_PRODOTTI['Culurgiones'];
  if (nomeLower.includes('malloreddus')) return PREZZI_PRODOTTI['Malloreddus'];
  if (nomeLower.includes('lorighittas')) return PREZZI_PRODOTTI['Lorighittas'];
  
  if (nomeLower.includes('dolci misti')) return PREZZI_PRODOTTI['Dolci misti'];
  
  return null;
}

// Funzione per calcolare prezzo
function calcolaPrezzo(nomeProdotto, quantita, unita) {
  const config = getPrezzoConfig(nomeProdotto);
  if (!config) return null;
  
  const unitaLower = (unita || 'kg').toLowerCase();
  const qty = parseFloat(quantita) || 0;
  
  // Vendita a Kg
  if (unitaLower === 'kg' && config.prezzoKg) {
    return Math.round(qty * config.prezzoKg * 100) / 100;
  }
  
  // Vendita a pezzi
  if (unitaLower === 'pezzi' || unitaLower === 'pz' || unitaLower === 'unità') {
    if (config.prezzoPezzo) {
      return Math.round(qty * config.prezzoPezzo * 100) / 100;
    }
    if (config.pezziPerKg && config.prezzoKg) {
      return Math.round((qty / config.pezziPerKg) * config.prezzoKg * 100) / 100;
    }
  }
  
  // Fallback a Kg
  if (config.prezzoKg) {
    return Math.round(qty * config.prezzoKg * 100) / 100;
  }
  
  return null;
}

// ========== ENDPOINTS ==========

/**
 * GET /api/fix/preview
 * Anteprima ordini da correggere (non modifica nulla)
 */
router.get('/preview', async (req, res) => {
  try {
    // Trova ordini con almeno un prodotto a prezzo 0
    const ordini = await Ordine.find({
      'prodotti.prezzo': 0
    }).lean();
    
    const risultati = [];
    const prodottiNonTrovati = new Set();
    
    for (const ordine of ordini) {
      const prodottiDaCorreggere = [];
      
      for (const prodotto of ordine.prodotti) {
        if (prodotto.prezzo === 0 || !prodotto.prezzo) {
          // Salta i vassoi (hanno prezzo composto)
          if (prodotto.unita === 'vassoio' || prodotto.nome?.includes('Vassoio')) {
            continue;
          }
          
          const nuovoPrezzo = calcolaPrezzo(prodotto.nome, prodotto.quantita, prodotto.unita);
          
          if (nuovoPrezzo !== null) {
            prodottiDaCorreggere.push({
              nome: prodotto.nome,
              quantita: prodotto.quantita,
              unita: prodotto.unita,
              prezzoAttuale: prodotto.prezzo,
              nuovoPrezzo: nuovoPrezzo
            });
          } else {
            prodottiNonTrovati.add(prodotto.nome);
          }
        }
      }
      
      if (prodottiDaCorreggere.length > 0) {
        risultati.push({
          ordineId: ordine._id,
          cliente: ordine.cliente,
          dataConsegna: ordine.dataConsegna,
          prodottiDaCorreggere
        });
      }
    }
    
    res.json({
      success: true,
      ordiniDaCorreggere: risultati.length,
      prodottiTotali: risultati.reduce((sum, o) => sum + o.prodottiDaCorreggere.length, 0),
      prodottiNonTrovati: Array.from(prodottiNonTrovati),
      dettagli: risultati
    });
    
  } catch (error) {
    console.error('Errore preview fix prezzi:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/fix/correggi
 * Corregge tutti gli ordini con prezzo 0
 */
router.post('/correggi', async (req, res) => {
  try {
    const ordini = await Ordine.find({
      'prodotti.prezzo': 0
    });
    
    let ordiniAggiornati = 0;
    let prodottiCorretti = 0;
    const prodottiNonTrovati = new Set();
    const errori = [];
    
    for (const ordine of ordini) {
      let modificato = false;
      
      for (let i = 0; i < ordine.prodotti.length; i++) {
        const prodotto = ordine.prodotti[i];
        
        if (prodotto.prezzo === 0 || !prodotto.prezzo) {
          // Salta i vassoi
          if (prodotto.unita === 'vassoio' || prodotto.nome?.includes('Vassoio')) {
            continue;
          }
          
          const nuovoPrezzo = calcolaPrezzo(prodotto.nome, prodotto.quantita, prodotto.unita);
          
          if (nuovoPrezzo !== null) {
            ordine.prodotti[i].prezzo = nuovoPrezzo;
            modificato = true;
            prodottiCorretti++;
          } else {
            prodottiNonTrovati.add(prodotto.nome);
          }
        }
      }
      
      if (modificato) {
        // Ricalcola totale ordine
        ordine.totale = ordine.prodotti.reduce((sum, p) => sum + (p.prezzo || 0), 0);
        
        try {
          await ordine.save();
          ordiniAggiornati++;
        } catch (saveError) {
          errori.push({
            ordineId: ordine._id,
            errore: saveError.message
          });
        }
      }
    }
    
    res.json({
      success: true,
      ordiniAggiornati,
      prodottiCorretti,
      prodottiNonTrovati: Array.from(prodottiNonTrovati),
      errori: errori.length > 0 ? errori : undefined
    });
    
  } catch (error) {
    console.error('Errore correzione prezzi:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/fix/correggi-singolo/:id
 * Corregge un singolo ordine
 */
router.post('/correggi-singolo/:id', async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.id);
    
    if (!ordine) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato' });
    }
    
    let prodottiCorretti = 0;
    const prodottiNonTrovati = [];
    
    for (let i = 0; i < ordine.prodotti.length; i++) {
      const prodotto = ordine.prodotti[i];
      
      if (prodotto.prezzo === 0 || !prodotto.prezzo) {
        if (prodotto.unita === 'vassoio' || prodotto.nome?.includes('Vassoio')) {
          continue;
        }
        
        const nuovoPrezzo = calcolaPrezzo(prodotto.nome, prodotto.quantita, prodotto.unita);
        
        if (nuovoPrezzo !== null) {
          ordine.prodotti[i].prezzo = nuovoPrezzo;
          prodottiCorretti++;
        } else {
          prodottiNonTrovati.push(prodotto.nome);
        }
      }
    }
    
    if (prodottiCorretti > 0) {
      ordine.totale = ordine.prodotti.reduce((sum, p) => sum + (p.prezzo || 0), 0);
      await ordine.save();
    }
    
    res.json({
      success: true,
      prodottiCorretti,
      nuovoTotale: ordine.totale,
      prodottiNonTrovati
    });
    
  } catch (error) {
    console.error('Errore correzione singolo ordine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ IMPORTANTE: export default per ES modules
export default router;
