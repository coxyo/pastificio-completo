// scripts/importProdotti.js
// Script per importare i prodotti da prodottiConfig.js nel database MongoDB

import mongoose from 'mongoose';
import Prodotto from '../models/Prodotto.js';
import { PRODOTTI_CONFIG } from '../config/prodottiConfig.js';
import logger from '../config/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const importProdotti = async () => {
  try {
    // Connessione MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    // Cancella prodotti esistenti (opzionale - ATTENZIONE!)
    const deleteExisting = process.argv.includes('--force');
    if (deleteExisting) {
      await Prodotto.deleteMany({});
      console.log('⚠️  Prodotti esistenti eliminati');
    }

    let importati = 0;
    let saltati = 0;
    let errori = 0;

    // Itera su tutti i prodotti del config
    for (const [nomeProdotto, config] of Object.entries(PRODOTTI_CONFIG)) {
      try {
        // Verifica se esiste già
        const esistente = await Prodotto.findOne({ nome: nomeProdotto });
        
        if (esistente && !deleteExisting) {
          console.log(`⏭️  Prodotto già esistente: ${nomeProdotto}`);
          saltati++;
          continue;
        }

        // Prepara i dati del prodotto
        const prodottoData = {
          nome: nomeProdotto,
          categoria: config.categoria || 'Altro',
          descrizione: config.descrizione || '',
          prezzoKg: config.prezzoKg || null,
          prezzoPezzo: config.prezzoPezzo || null,
          modalitaVendita: config.modalitaVendita || 'mista',
          pezziPerKg: config.pezziPerKg || null,
          unitaMisuraDisponibili: config.unitaMisuraDisponibili || ['Kg'],
          hasVarianti: config.hasVarianti || false,
          varianti: config.varianti || [],
          disponibile: true,
          attivo: true,
          ordine: config.ordine || 0,
          composizione: config.composizione ? 
            Object.entries(config.composizione).reduce((acc, [key, value]) => {
              acc.set(key, value);
              return acc;
            }, new Map()) : null
        };

        // Crea o aggiorna il prodotto
        if (deleteExisting && esistente) {
          await Prodotto.findByIdAndUpdate(esistente._id, prodottoData);
          console.log(`🔄 Aggiornato: ${nomeProdotto}`);
        } else {
          await Prodotto.create(prodottoData);
          console.log(`✅ Importato: ${nomeProdotto}`);
        }
        
        importati++;
      } catch (error) {
        console.error(`❌ Errore importazione ${nomeProdotto}:`, error.message);
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
    console.log(`📦 Totale prodotti nel config: ${Object.keys(PRODOTTI_CONFIG).length}`);
    console.log('='.repeat(50));

    // Verifica totale prodotti nel DB
    const totaleDB = await Prodotto.countDocuments({});
    console.log(`\n💾 Prodotti totali nel database: ${totaleDB}`);

  } catch (error) {
    console.error('❌ Errore durante l\'importazione:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnesso da MongoDB');
    process.exit(0);
  }
};

// Esegui import
console.log('🚀 Avvio importazione prodotti...\n');
importProdotti();