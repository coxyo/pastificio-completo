// pastificio-backend/scripts/syncPrezziDaConfig.js

import mongoose from 'mongoose';
import Prodotto from '../models/Prodotto.js';
import dotenv from 'dotenv';

dotenv.config();

const PREZZI_CORRETTI = {
  'Ravioli': {
    categoria: 'Ravioli',
    hasVarianti: true,
    pezziPerKg: 30,
    varianti: [
      { nome: 'spinaci', label: 'Ravioli ricotta e spinaci', prezzoKg: 11.00, pezziPerKg: 30 },
      { nome: 'zafferano', label: 'Ravioli ricotta e zafferano', prezzoKg: 11.00, pezziPerKg: 30 },
      { nome: 'dolci', label: 'Ravioli ricotta dolci', prezzoKg: 11.00, pezziPerKg: 30 },
      { nome: 'poco_dolci', label: 'Ravioli ricotta poco dolci', prezzoKg: 11.00, pezziPerKg: 30 },
      { nome: 'molto_dolci', label: 'Ravioli ricotta molto dolci', prezzoKg: 11.00, pezziPerKg: 30 },
      { nome: 'piccoli', label: 'Ravioli ricotta piccoli', prezzoKg: 11.00, pezziPerKg: 40 }
    ]
  },
  
  'Culurgiones': {
    categoria: 'Ravioli',
    prezzoKg: 16.00,
    prezzoPezzo: null,
    pezziPerKg: 32,
    hasVarianti: false
  },
  
  'Pardulas': {
    categoria: 'Dolci',
    hasVarianti: true,
    prezzoKg: 20.00,
    prezzoPezzo: 0.76,
    pezziPerKg: 25,
    varianti: [
      { nome: 'base', label: 'Pardulas (base)', prezzoKg: 20.00, prezzoPezzo: 0.76 },
      { nome: 'con_glassa', label: 'Pardulas con glassa', prezzoKg: 20.00, prezzoPezzo: 0.76 },
      { nome: 'zucchero_velo', label: 'Pardulas con zucchero a velo', prezzoKg: 20.00, prezzoPezzo: 0.76 }
    ]
  },
  
  'Cimbelle': {
    categoria: 'Dolci',
    hasVarianti: true,
    prezzoKg: 17.00,
    pezziPerKg: 30,
    varianti: [
      { nome: 'base', label: 'Ciambelle solo base', prezzoKg: 17.00 },
      { nome: 'albicocca', label: 'Ciambelle con marmellata di albicocca', prezzoKg: 17.00 },
      { nome: 'ciliegia', label: 'Ciambelle con marmellata di ciliegia', prezzoKg: 17.00 },
      { nome: 'nutella', label: 'Ciambelle con nutella', prezzoKg: 17.00 },
      { nome: 'zucchero_velo', label: 'Ciambelle con zucchero a velo', prezzoKg: 17.00 },
      { nome: 'miste_marmellata_nutella', label: 'Ciambelle miste: marmellata - nutella', prezzoKg: 17.00 },
      { nome: 'miste_marmellata_zucchero', label: 'Ciambelle miste: marmellata - zucchero a velo', prezzoKg: 17.00 },
      { nome: 'miste_marmellata_base', label: 'Ciambelle miste: marmellata - solo base', prezzoKg: 17.00 }
    ]
  },
  
  'Sebadas': {
    categoria: 'Dolci',
    prezzoKg: null,
    prezzoPezzo: 2.50,
    hasVarianti: false
  },
  
  'Amaretti': {
    categoria: 'Dolci',
    prezzoKg: 22.00,
    prezzoPezzo: null,
    pezziPerKg: 35,
    hasVarianti: false
  },
  
  'Papassini': {
    categoria: 'Dolci',
    prezzoKg: 22.00,
    prezzoPezzo: null,
    pezziPerKg: 30,
    hasVarianti: false
  },
  
  'Gueffus': {
    categoria: 'Dolci',
    prezzoKg: 22.00,
    prezzoPezzo: null,
    pezziPerKg: 65,
    hasVarianti: false
  },
  
  'Bianchini': {
    categoria: 'Dolci',
    prezzoKg: 15.00,
    prezzoPezzo: null,
    pezziPerKg: 100,
    hasVarianti: false
  },
  
  'Torta di saba': {
    categoria: 'Dolci',
    prezzoKg: 26.00,
    prezzoPezzo: 15.00,
    hasVarianti: false
  },
  
  'Dolci misti': {
    categoria: 'Dolci',
    prezzoKg: 19.00,
    prezzoPezzo: null,
    hasVarianti: false
  },
  
  'Panada di Agnello': {
    categoria: 'Panadas',
    prezzoKg: 30.00,
    prezzoPezzo: null,
    hasVarianti: false
  },
  
  'Panada di Maiale': {
    categoria: 'Panadas',
    prezzoKg: 21.00,
    prezzoPezzo: null,
    hasVarianti: false
  },
  
  'Panada di Vitella': {
    categoria: 'Panadas',
    prezzoKg: 23.00,
    prezzoPezzo: null,
    hasVarianti: false
  },
  
  'Panada di verdure': {
    categoria: 'Panadas',
    prezzoKg: 17.00,
    prezzoPezzo: null,
    hasVarianti: false
  },
  
  'Panadine': {
    categoria: 'Panadas',
    prezzoKg: null,
    prezzoPezzo: 0.80,
    hasVarianti: false
  },
  
  'Fregula': {
    categoria: 'Pasta',
    prezzoKg: 10.00,
    prezzoPezzo: null,
    hasVarianti: false
  },
  
  'Pizzette sfoglia': {
    categoria: 'Pasta',
    prezzoKg: 16.00,
    prezzoPezzo: null,
    pezziPerKg: 30,
    hasVarianti: false
  },
  
  'Pasta per panada e pizza': {
    categoria: 'Pasta',
    prezzoKg: 5.00,
    prezzoPezzo: null,
    hasVarianti: false
  },
  
  'Sfoglia per lasagne': {
    categoria: 'Pasta',
    prezzoKg: 5.00,
    prezzoPezzo: null,
    hasVarianti: false
  }
};

async function syncPrezzi() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');
    console.log('🔄 SINCRONIZZAZIONE PREZZI IN CORSO...\n');
    
    let aggiornati = 0;
    let errori = 0;
    
    for (const [nomeProdotto, config] of Object.entries(PREZZI_CORRETTI)) {
      try {
        console.log(`📦 Elaborazione: ${nomeProdotto}`);
        
        const prodotto = await Prodotto.findOne({ nome: nomeProdotto });
        
        if (!prodotto) {
          console.log(`   ⚠️  Prodotto non trovato nel DB, verrà creato`);
          
          await Prodotto.create({
            nome: nomeProdotto,
            categoria: config.categoria,
            prezzoKg: config.prezzoKg || null,
            prezzoPezzo: config.prezzoPezzo || null,
            pezziPerKg: config.pezziPerKg || null,
            hasVarianti: config.hasVarianti || false,
            varianti: config.varianti || [],
            unitaMisuraDisponibili: config.hasVarianti ? ['Kg', 'Pezzi', '€'] : config.prezzoPezzo ? ['Unità', '€'] : ['Kg', '€'],
            attivo: true
          });
          
          console.log(`   ✅ Prodotto creato\n`);
          aggiornati++;
          continue;
        }
        
        // Aggiorna prezzi base
        prodotto.prezzoKg = config.prezzoKg || null;
        prodotto.prezzoPezzo = config.prezzoPezzo || null;
        prodotto.pezziPerKg = config.pezziPerKg || null;
        prodotto.categoria = config.categoria;
        prodotto.hasVarianti = config.hasVarianti || false;
        
        // Aggiorna varianti se presenti
        if (config.hasVarianti && config.varianti) {
          console.log(`   🔧 Aggiornamento ${config.varianti.length} varianti...`);
          
          config.varianti.forEach(nuovaVariante => {
            const varianteEsistente = prodotto.varianti?.find(v => v.nome === nuovaVariante.nome);
            
            if (varianteEsistente) {
              varianteEsistente.prezzoKg = nuovaVariante.prezzoKg || null;
              varianteEsistente.prezzoPezzo = nuovaVariante.prezzoPezzo || null;
              varianteEsistente.label = nuovaVariante.label;
              varianteEsistente.pezziPerKg = nuovaVariante.pezziPerKg || null;
              console.log(`      ✓ ${nuovaVariante.nome}: €${nuovaVariante.prezzoKg || nuovaVariante.prezzoPezzo}`);
            } else {
              if (!prodotto.varianti) prodotto.varianti = [];
              prodotto.varianti.push(nuovaVariante);
              console.log(`      + ${nuovaVariante.nome}: AGGIUNTA`);
            }
          });
        } else {
          console.log(`   💰 Prezzo: €${config.prezzoKg || config.prezzoPezzo}${config.prezzoKg ? '/Kg' : '/pz'}`);
        }
        
        await prodotto.save();
        console.log(`   ✅ ${nomeProdotto} aggiornato!\n`);
        aggiornati++;
        
      } catch (error) {
        console.error(`   ❌ Errore su ${nomeProdotto}:`, error.message, '\n');
        errori++;
      }
    }
    
    console.log('='.repeat(80));
    console.log(`\n🎉 SINCRONIZZAZIONE COMPLETATA!`);
    console.log(`   ✅ Prodotti aggiornati: ${aggiornati}`);
    console.log(`   ❌ Errori: ${errori}\n`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnesso da MongoDB');
    
  } catch (error) {
    console.error('❌ ERRORE CRITICO:', error);
    process.exit(1);
  }
}

syncPrezzi();