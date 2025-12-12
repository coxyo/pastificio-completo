// routes/fix-prezzi.js
// Endpoint per correggere ordini con prezzo €0.00
// Aggiungere a server.js: app.use('/api/fix', fixPrezziRoutes);

import express from 'express';
import Ordine from '../models/Ordine.js';

const router = express.Router();

// ✅ PREZZI PRODOTTI
const PREZZI_PRODOTTI = {
  // Panadas
  'Panada Anguille': { prezzoKg: 30.00 },
  'Panada di Agnello': { prezzoKg: 25.00 },
  'Panada di Agnello (con patate)': { prezzoKg: 25.00 },
  'Panada di Agnello (con piselli)': { prezzoKg: 25.00 },
  'Panada di Agnello (con patate e piselli)': { prezzoKg: 25.00 },
  'Panada di Maiale': { prezzoKg: 21.00 },
  'Panada di Maiale (con patate)': { prezzoKg: 21.00 },
  'Panada di Vitella': { prezzoKg: 23.00 },
  'Panada di Vitella (con patate)': { prezzoKg: 23.00 },
  'Panada di Vitella (con piselli)': { prezzoKg: 23.00 },
  'Panada di verdure': { prezzoKg: 17.00 },
  'Panada di verdure (con patate)': { prezzoKg: 17.00 },
  
  // Panadine
  'Panadine': { prezzoPezzo: 0.80, prezzoKg: 16.00, pezziPerKg: 20 },
  
  // Dolci
  'Pardulas': { prezzoKg: 20.00, pezziPerKg: 25 },
  'Ciambelle': { prezzoKg: 17.00, pezziPerKg: 30 },
  'Ciambelle con nutella': { prezzoKg: 18.00, pezziPerKg: 30 },
  'Amaretti': { prezzoKg: 22.00, pezziPerKg: 35 },
  'Papassinas': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Papassini': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Pabassine': { prezzoKg: 22.00, pezziPerKg: 30 },
  'Gueffus': { prezzoKg: 22.00, pezziPerKg: 65 },
  'Bianchini': { prezzoKg: 15.00, pezziPerKg: 100 },
  'Dolci misti': { prezzoKg: 19.00 },
  'Zeppole': { prezzoKg: 18.00, pezziPerKg: 24 },
  
  // Ravioli
  'Ravioli': { prezzoKg: 11.00, pezziPerKg: 30 },
  'Culurgiones': { prezzoKg: 16.00, pezziPerKg: 32 },
  
  // Sebadas
  'Sebadas': { prezzoPezzo: 2.50 },
  'Sebadas arancia': { prezzoPezzo: 2.00 },
  'Sebadas al mirto': { prezzoPezzo: 2.50 },
  
  // Pasta
  'Pasta per panada': { prezzoKg: 5.00 },
  'Fregula': { prezzoKg: 10.00 },
  'Torta di saba': { prezzoKg: 26.00 }
};

function getPrezzoConfig(nomeProdotto) {
  if (PREZZI_PRODOTTI[nomeProdotto]) {
    return PREZZI_PRODOTTI[nomeProdotto];
  }
  
  const nomeBase = nomeProdotto.split(' (')[0].trim();
  if (PREZZI_PRODOTTI[nomeBase]) {
    return PREZZI_PRODOTTI[nomeBase];
  }
  
  const nomeLower = nomeProdotto.toLowerCase();
  
  if (nomeLower.includes('anguille')) return PREZZI_PRODOTTI['Panada Anguille'];
  if (nomeLower.includes('agnello')) return PREZZI_PRODOTTI['Panada di Agnello'];
  if (nomeLower.includes('maiale')) return PREZZI_PRODOTTI['Panada di Maiale'];
  if (nomeLower.includes('vitella')) return PREZZI_PRODOTTI['Panada di Vitella'];
  if (nomeLower.includes('verdure')) return PREZZI_PRODOTTI['Panada di verdure'];
  if (nomeLower.includes('panadine')) return PREZZI_PRODOTTI['Panadine'];
  if (nomeLower.includes('pardulas')) return PREZZI_PRODOTTI['Pardulas'];
  if (nomeLower.includes('ciambelle') && nomeLower.includes('nutella')) return PREZZI_PRODOTTI['Ciambelle con nutella'];
  if (nomeLower.includes('ciambelle')) return PREZZI_PRODOTTI['Ciambelle'];
  if (nomeLower.includes('ravioli')) return PREZZI_PRODOTTI['Ravioli'];
  if (nomeLower.includes('culurgiones')) return PREZZI_PRODOTTI['Culurgiones'];
  if (nomeLower.includes('sebadas') && nomeLower.includes('arancia')) return PREZZI_PRODOTTI['Sebadas arancia'];
  if (nomeLower.includes('sebadas') && nomeLower.includes('mirto')) return PREZZI_PRODOTTI['Sebadas al mirto'];
  if (nomeLower.includes('sebadas')) return PREZZI_PRODOTTI['Sebadas'];
  if (nomeLower.includes('amaretti')) return PREZZI_PRODOTTI['Amaretti'];
  if (nomeLower.includes('bianchini')) return PREZZI_PRODOTTI['Bianchini'];
  if (nomeLower.includes('gueffus')) return PREZZI_PRODOTTI['Gueffus'];
  if (nomeLower.includes('papassin')) return PREZZI_PRODOTTI['Papassinas'];
  if (nomeLower.includes('pabassine')) return PREZZI_PRODOTTI['Pabassine'];
  if (nomeLower.includes('dolci misti')) return PREZZI_PRODOTTI['Dolci misti'];
  if (nomeLower.includes('fregula')) return PREZZI_PRODOTTI['Fregula'];
  if (nomeLower.includes('torta')) return PREZZI_PRODOTTI['Torta di saba'];
  if (nomeLower.includes('zeppole')) return PREZZI_PRODOTTI['Zeppole'];
  
  return null;
}

function calcolaPrezzo(nomeProdotto, quantita, unita) {
  const config = getPrezzoConfig(nomeProdotto);
  
  if (!config) {
    return null;
  }
  
  const unitaLower = (unita || 'kg').toLowerCase();
  
  if (unitaLower === 'kg') {
    if (config.prezzoKg) {
      return quantita * config.prezzoKg;
    }
  }
  
  if (unitaLower === 'pezzi' || unitaLower === 'pz') {
    if (config.prezzoPezzo) {
      return quantita * config.prezzoPezzo;
    }
    if (config.pezziPerKg && config.prezzoKg) {
      const kg = quantita / config.pezziPerKg;
      return kg * config.prezzoKg;
    }
  }
  
  if (unitaLower === 'unità' || unitaLower === 'unita') {
    if (config.prezzoPezzo) {
      return quantita * config.prezzoPezzo;
    }
  }
  
  if (config.prezzoKg) {
    return quantita * config.prezzoKg;
  }
  
  return null;
}

/**
 * @route   GET /api/fix/preview
 * @desc    Anteprima ordini da correggere (senza modificare)
 */
router.get('/preview', async (req, res) => {
  try {
    const ordini = await Ordine.find({
      'prodotti.prezzo': 0
    }).sort({ dataRitiro: -1 });
    
    const preview = [];
    let totaleProdottiDaCorreggere = 0;
    const prodottiNonTrovati = new Set();
    
    for (const ordine of ordini) {
      const prodottiZero = ordine.prodotti.filter(p => p.prezzo === 0 || !p.prezzo);
      
      const correzioni = prodottiZero.map(p => {
        const nuovoPrezzo = calcolaPrezzo(p.nome, p.quantita, p.unita);
        
        if (nuovoPrezzo === null) {
          prodottiNonTrovati.add(p.nome);
        }
        
        return {
          nome: p.nome,
          quantita: p.quantita,
          unita: p.unita,
          prezzoAttuale: p.prezzo || 0,
          nuovoPrezzo: nuovoPrezzo !== null ? parseFloat(nuovoPrezzo.toFixed(2)) : null,
          trovato: nuovoPrezzo !== null
        };
      });
      
      totaleProdottiDaCorreggere += correzioni.filter(c => c.trovato).length;
      
      preview.push({
        _id: ordine._id,
        nomeCliente: ordine.nomeCliente,
        dataRitiro: ordine.dataRitiro,
        totaleAttuale: ordine.totale,
        correzioni
      });
    }
    
    res.json({
      success: true,
      ordiniTotali: ordini.length,
      prodottiDaCorreggere: totaleProdottiDaCorreggere,
      prodottiNonTrovati: Array.from(prodottiNonTrovati),
      preview: preview.slice(0, 50) // Primi 50 per non sovraccaricare
    });
    
  } catch (error) {
    console.error('Errore preview:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/fix/correggi
 * @desc    Correggi tutti gli ordini con prezzo €0.00
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
      let ordineModificato = false;
      let nuovoTotale = 0;
      
      const prodottiAggiornati = ordine.prodotti.map(p => {
        if (p.prezzo > 0) {
          nuovoTotale += p.prezzo;
          return p;
        }
        
        const nuovoPrezzo = calcolaPrezzo(p.nome, p.quantita, p.unita);
        
        if (nuovoPrezzo !== null && nuovoPrezzo > 0) {
          prodottiCorretti++;
          ordineModificato = true;
          nuovoTotale += nuovoPrezzo;
          
          return {
            ...p.toObject ? p.toObject() : p,
            prezzo: parseFloat(nuovoPrezzo.toFixed(2)),
            dettagliCalcolo: {
              ...(p.dettagliCalcolo || {}),
              prezzoTotale: parseFloat(nuovoPrezzo.toFixed(2)),
              dettagli: `${p.quantita} ${p.unita}`
            }
          };
        } else {
          prodottiNonTrovati.add(p.nome);
          nuovoTotale += p.prezzo || 0;
          return p.toObject ? p.toObject() : p;
        }
      });
      
      if (ordineModificato) {
        try {
          await Ordine.updateOne(
            { _id: ordine._id },
            { 
              $set: { 
                prodotti: prodottiAggiornati,
                totale: parseFloat(nuovoTotale.toFixed(2))
              }
            }
          );
          ordiniAggiornati++;
        } catch (err) {
          errori.push({ ordineId: ordine._id, errore: err.message });
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
    console.error('Errore correzione:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/fix/correggi-singolo/:id
 * @desc    Correggi un singolo ordine
 */
router.post('/correggi-singolo/:id', async (req, res) => {
  try {
    const ordine = await Ordine.findById(req.params.id);
    
    if (!ordine) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato' });
    }
    
    let nuovoTotale = 0;
    let prodottiCorretti = 0;
    
    const prodottiAggiornati = ordine.prodotti.map(p => {
      if (p.prezzo > 0) {
        nuovoTotale += p.prezzo;
        return p;
      }
      
      const nuovoPrezzo = calcolaPrezzo(p.nome, p.quantita, p.unita);
      
      if (nuovoPrezzo !== null && nuovoPrezzo > 0) {
        prodottiCorretti++;
        nuovoTotale += nuovoPrezzo;
        
        return {
          ...p.toObject(),
          prezzo: parseFloat(nuovoPrezzo.toFixed(2)),
          dettagliCalcolo: {
            ...(p.dettagliCalcolo || {}),
            prezzoTotale: parseFloat(nuovoPrezzo.toFixed(2)),
            dettagli: `${p.quantita} ${p.unita}`
          }
        };
      } else {
        nuovoTotale += p.prezzo || 0;
        return p;
      }
    });
    
    ordine.prodotti = prodottiAggiornati;
    ordine.totale = parseFloat(nuovoTotale.toFixed(2));
    await ordine.save();
    
    res.json({
      success: true,
      prodottiCorretti,
      nuovoTotale: ordine.totale,
      ordine
    });
    
  } catch (error) {
    console.error('Errore correzione singolo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
