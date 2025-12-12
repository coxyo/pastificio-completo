// fix-prezzi-zero.js
// Script da eseguire UNA VOLTA per correggere gli ordini con prezzo €0.00
// Eseguire con: node fix-prezzi-zero.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connessione MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://...'; // Inserisci la tua stringa

// ✅ PREZZI PRODOTTI (copia da prodottiConfig)
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
  
  // Panadine - prezzo a pezzo
  'Panadine': { prezzoPezzo: 0.80, prezzoKg: 16.00, pezziPerKg: 20 },
  
  // Dolci
  'Pardulas': { prezzoKg: 20.00, pezziPerKg: 25 },
  'Ciambelle': { prezzoKg: 17.00, pezziPerKg: 30 },
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

// Funzione per trovare il prezzo di un prodotto
function getPrezzoConfig(nomeProdotto) {
  // Cerca esatto
  if (PREZZI_PRODOTTI[nomeProdotto]) {
    return PREZZI_PRODOTTI[nomeProdotto];
  }
  
  // Cerca nome base (senza parentesi)
  const nomeBase = nomeProdotto.split(' (')[0].trim();
  if (PREZZI_PRODOTTI[nomeBase]) {
    return PREZZI_PRODOTTI[nomeBase];
  }
  
  // Cerca per keyword
  const nomeLower = nomeProdotto.toLowerCase();
  
  if (nomeLower.includes('anguille')) return PREZZI_PRODOTTI['Panada Anguille'];
  if (nomeLower.includes('agnello')) return PREZZI_PRODOTTI['Panada di Agnello'];
  if (nomeLower.includes('maiale')) return PREZZI_PRODOTTI['Panada di Maiale'];
  if (nomeLower.includes('vitella')) return PREZZI_PRODOTTI['Panada di Vitella'];
  if (nomeLower.includes('verdure')) return PREZZI_PRODOTTI['Panada di verdure'];
  if (nomeLower.includes('panadine')) return PREZZI_PRODOTTI['Panadine'];
  if (nomeLower.includes('pardulas')) return PREZZI_PRODOTTI['Pardulas'];
  if (nomeLower.includes('ciambelle')) return PREZZI_PRODOTTI['Ciambelle'];
  if (nomeLower.includes('ravioli')) return PREZZI_PRODOTTI['Ravioli'];
  if (nomeLower.includes('culurgiones')) return PREZZI_PRODOTTI['Culurgiones'];
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

// Funzione per calcolare il prezzo
function calcolaPrezzo(nomeProdotto, quantita, unita) {
  const config = getPrezzoConfig(nomeProdotto);
  
  if (!config) {
    console.warn(`⚠️ Prodotto non trovato: "${nomeProdotto}"`);
    return null;
  }
  
  const unitaLower = (unita || 'kg').toLowerCase();
  
  if (unitaLower === 'kg') {
    if (config.prezzoKg) {
      return quantita * config.prezzoKg;
    }
  }
  
  if (unitaLower === 'pezzi' || unitaLower === 'pz') {
    // Se ha prezzo a pezzo, usalo
    if (config.prezzoPezzo) {
      return quantita * config.prezzoPezzo;
    }
    // Altrimenti converti in kg
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
  
  // Fallback: prova con prezzoKg
  if (config.prezzoKg) {
    return quantita * config.prezzoKg;
  }
  
  return null;
}

async function fixPrezziZero() {
  try {
    console.log('🔌 Connessione a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso!\n');
    
    // Trova tutti gli ordini
    const Ordine = mongoose.model('Ordine', new mongoose.Schema({}, { strict: false }), 'ordinis');
    
    const ordini = await Ordine.find({
      'prodotti.prezzo': 0
    });
    
    console.log(`📋 Trovati ${ordini.length} ordini con prodotti a €0.00\n`);
    
    let ordiniAggiornati = 0;
    let prodottiCorretti = 0;
    let prodottiNonTrovati = [];
    
    for (const ordine of ordini) {
      let ordineModificato = false;
      let nuovoTotale = 0;
      
      const prodottiAggiornati = ordine.prodotti.map(p => {
        // Se il prezzo è già > 0, mantienilo
        if (p.prezzo > 0) {
          nuovoTotale += p.prezzo;
          return p;
        }
        
        // Calcola il nuovo prezzo
        const nuovoPrezzo = calcolaPrezzo(p.nome, p.quantita, p.unita);
        
        if (nuovoPrezzo !== null && nuovoPrezzo > 0) {
          console.log(`  ✅ ${p.nome}: ${p.quantita} ${p.unita} → €${nuovoPrezzo.toFixed(2)}`);
          prodottiCorretti++;
          ordineModificato = true;
          nuovoTotale += nuovoPrezzo;
          
          return {
            ...p.toObject(),
            prezzo: parseFloat(nuovoPrezzo.toFixed(2)),
            dettagliCalcolo: {
              ...p.dettagliCalcolo,
              prezzoTotale: parseFloat(nuovoPrezzo.toFixed(2)),
              dettagli: `${p.quantita} ${p.unita} (corretto)`
            }
          };
        } else {
          if (!prodottiNonTrovati.includes(p.nome)) {
            prodottiNonTrovati.push(p.nome);
          }
          nuovoTotale += p.prezzo || 0;
          return p;
        }
      });
      
      if (ordineModificato) {
        // Aggiorna l'ordine
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
        console.log(`📦 Ordine ${ordine._id} aggiornato (${ordine.nomeCliente}) - Nuovo totale: €${nuovoTotale.toFixed(2)}\n`);
      }
    }
    
    console.log('\n========== RIEPILOGO ==========');
    console.log(`✅ Ordini aggiornati: ${ordiniAggiornati}`);
    console.log(`✅ Prodotti corretti: ${prodottiCorretti}`);
    
    if (prodottiNonTrovati.length > 0) {
      console.log(`\n⚠️ Prodotti non trovati in configurazione:`);
      prodottiNonTrovati.forEach(p => console.log(`   - ${p}`));
    }
    
    console.log('\n✅ Operazione completata!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnesso da MongoDB');
  }
}

// Esegui
fixPrezziZero();
