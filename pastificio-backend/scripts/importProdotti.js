// scripts/importProdotti.js - VERSIONE SEMPLIFICATA
import mongoose from 'mongoose';
import Prodotto from '../models/Prodotto.js';
import dotenv from 'dotenv';

dotenv.config();

// ✅ PRODOTTI HARDCODED (non serve importare da config)
const PRODOTTI_DA_IMPORTARE = [
  // RAVIOLI
  {
    nome: 'Ravioli',
    categoria: 'Ravioli',
    hasVarianti: true,
    modalitaVendita: 'mista',
    prezzoKg: 11.00,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'Pezzi', '€'],
    varianti: [
      { nome: 'spinaci', label: 'Ravioli ricotta e spinaci', prezzoKg: 11.00, pezziPerKg: 30 },
      { nome: 'zafferano', label: 'Ravioli ricotta e zafferano', prezzoKg: 11.00, pezziPerKg: 30 },
      { nome: 'dolci', label: 'Ravioli ricotta dolci', prezzoKg: 11.00, pezziPerKg: 30 },
      { nome: 'poco_dolci', label: 'Ravioli ricotta poco dolci', prezzoKg: 11.00, pezziPerKg: 30 },
      { nome: 'molto_dolci', label: 'Ravioli ricotta molto dolci', prezzoKg: 11.00, pezziPerKg: 30 },
      { nome: 'piccoli', label: 'Ravioli ricotta piccoli', prezzoKg: 11.00, pezziPerKg: 40 }
    ],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Culurgiones',
    categoria: 'Ravioli',
    prezzoKg: 18.00,
    pezziPerKg: 32,
    modalitaVendita: 'mista',
    unitaMisuraDisponibili: ['Kg', 'Pezzi', '€'],
    disponibile: true,
    attivo: true
  },

  // DOLCI
  {
    nome: 'Pardulas',
    categoria: 'Dolci',
    hasVarianti: true,
    prezzoKg: 28.00,
    prezzoPezzo: 0.76,
    pezziPerKg: 25,
    modalitaVendita: 'mista',
    unitaMisuraDisponibili: ['Kg', 'Pezzi', '€'],
    varianti: [
      { nome: 'base', label: 'Pardulas (base)', prezzoKg: 28.00, prezzoPezzo: 0.76 },
      { nome: 'con_glassa', label: 'Pardulas con glassa', prezzoKg: 28.00, prezzoPezzo: 0.76 },
      { nome: 'zucchero_velo', label: 'Pardulas con zucchero a velo', prezzoKg: 28.00, prezzoPezzo: 0.76 }
    ],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Cimbelle',
    categoria: 'Dolci',
    hasVarianti: true,
    prezzoKg: 18.00,
    pezziPerKg: 30,
    modalitaVendita: 'mista',
    unitaMisuraDisponibili: ['Kg', 'Pezzi', '€'],
    varianti: [
      { nome: 'base', label: 'Ciambelle solo base', prezzoKg: 18.00 },
      { nome: 'albicocca', label: 'Ciambelle con marmellata di albicocca', prezzoKg: 18.00 },
      { nome: 'ciliegia', label: 'Ciambelle con marmellata di ciliegia', prezzoKg: 18.00 },
      { nome: 'nutella', label: 'Ciambelle con nutella', prezzoKg: 20.00 },
      { nome: 'zucchero_velo', label: 'Ciambelle con zucchero a velo', prezzoKg: 18.00 },
      { nome: 'miste_marmellata_nutella', label: 'Ciambelle miste: marmellata - nutella', prezzoKg: 19.00 },
      { nome: 'miste_marmellata_zucchero', label: 'Ciambelle miste: marmellata - zucchero a velo', prezzoKg: 18.00 },
      { nome: 'miste_marmellata_base', label: 'Ciambelle miste: marmellata - solo base', prezzoKg: 18.00 }
    ],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Sebadas',
    categoria: 'Dolci',
    prezzoPezzo: 2.50,
    modalitaVendita: 'solo_pezzo',
    unitaMisuraDisponibili: ['Unità', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Amaretti',
    categoria: 'Dolci',
    prezzoKg: 18.00,
    pezziPerKg: 35,
    modalitaVendita: 'mista',
    unitaMisuraDisponibili: ['Kg', 'Pezzi', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Papassini',
    categoria: 'Dolci',
    prezzoKg: 18.50,
    pezziPerKg: 30,
    modalitaVendita: 'mista',
    unitaMisuraDisponibili: ['Kg', 'Pezzi', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Gueffus',
    categoria: 'Dolci',
    prezzoKg: 18.00,
    pezziPerKg: 65,
    modalitaVendita: 'mista',
    unitaMisuraDisponibili: ['Kg', 'Pezzi', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Bianchini',
    categoria: 'Dolci',
    prezzoKg: 18.00,
    pezziPerKg: 100,
    modalitaVendita: 'mista',
    unitaMisuraDisponibili: ['Kg', 'Pezzi', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Torta di saba',
    categoria: 'Dolci',
    prezzoKg: 20.00,
    prezzoPezzo: 15.00,
    modalitaVendita: 'peso_variabile',
    unitaMisuraDisponibili: ['Kg', 'Unità', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Dolci misti',
    categoria: 'Dolci',
    prezzoKg: 18.50,
    modalitaVendita: 'solo_kg',
    unitaMisuraDisponibili: ['Kg', '€'],
    disponibile: true,
    attivo: true
  },

  // PANADAS
  {
    nome: 'Panada di Agnello',
    categoria: 'Panadas',
    prezzoKg: 30.00,
    modalitaVendita: 'solo_kg',
    unitaMisuraDisponibili: ['Kg', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Panada di Maiale',
    categoria: 'Panadas',
    prezzoKg: 21.00,
    modalitaVendita: 'solo_kg',
    unitaMisuraDisponibili: ['Kg', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Panada di Vitella',
    categoria: 'Panadas',
    prezzoKg: 23.00,
    modalitaVendita: 'solo_kg',
    unitaMisuraDisponibili: ['Kg', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Panada di verdure',
    categoria: 'Panadas',
    prezzoKg: 17.00,
    modalitaVendita: 'solo_kg',
    unitaMisuraDisponibili: ['Kg', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Panadine',
    categoria: 'Panadas',
    prezzoPezzo: 0.80,
    modalitaVendita: 'solo_pezzo',
    unitaMisuraDisponibili: ['Unità', '€'],
    disponibile: true,
    attivo: true
  },

  // PASTA
  {
    nome: 'Fregula',
    categoria: 'Pasta',
    prezzoKg: 10.00,
    modalitaVendita: 'solo_kg',
    unitaMisuraDisponibili: ['Kg', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Pizzette sfoglia',
    categoria: 'Pasta',
    prezzoKg: 15.00,
    pezziPerKg: 30,
    modalitaVendita: 'mista',
    unitaMisuraDisponibili: ['Kg', 'Pezzi', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Pasta per panada e pizza',
    categoria: 'Pasta',
    prezzoKg: 8.00,
    modalitaVendita: 'solo_kg',
    unitaMisuraDisponibili: ['Kg', '€'],
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Sfoglia per lasagne',
    categoria: 'Pasta',
    prezzoKg: 8.00,
    modalitaVendita: 'solo_kg',
    unitaMisuraDisponibili: ['Kg', '€'],
    disponibile: true,
    attivo: true
  }
];

const importProdotti = async () => {
  try {
    console.log('🚀 Avvio importazione prodotti...\n');
    
    // Connessione MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    let importati = 0;
    let saltati = 0;
    let errori = 0;

    // Importa prodotti
    for (const prodottoData of PRODOTTI_DA_IMPORTARE) {
      try {
        const esistente = await Prodotto.findOne({ nome: prodottoData.nome });
        
        if (esistente) {
          console.log(`⏭️  Già esistente: ${prodottoData.nome}`);
          saltati++;
          continue;
        }

        await Prodotto.create(prodottoData);
        console.log(`✅ Importato: ${prodottoData.nome}`);
        importati++;
        
      } catch (error) {
        console.error(`❌ Errore importazione ${prodottoData.nome}:`, error.message);
        errori++;
      }
    }

    // Riepilogo
    console.log('\n' + '='.repeat(50));
    console.log('📊 RIEPILOGO IMPORTAZIONE');
    console.log('='.repeat(50));
    console.log(`✅ Importati: ${importati}`);
    console.log(`⏭️  Saltati: ${saltati}`);
    console.log(`❌ Errori: ${errori}`);
    console.log(`📦 Totale prodotti da importare: ${PRODOTTI_DA_IMPORTARE.length}`);
    console.log('='.repeat(50));

    // Verifica totale nel DB
    const totaleDB = await Prodotto.countDocuments({});
    console.log(`\n💾 Prodotti totali nel database: ${totaleDB}\n`);

  } catch (error) {
    console.error('❌ Errore durante importazione:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnesso da MongoDB');
    process.exit(0);
  }
};

// Esegui import
importProdotti();