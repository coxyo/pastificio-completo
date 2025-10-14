// scripts/migraProdottiHardcoded.js - ✅ PRODOTTI REALI DEL PASTIFICIO
import mongoose from 'mongoose';
import Prodotto from '../models/Prodotto.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// ✅ I TUOI 24 PRODOTTI REALI (estratti da prodottiConfig.js)
const PRODOTTI_HARDCODED = [
  // ========== RAVIOLI ==========
  {
    nome: 'Ravioli ricotta e spinaci',
    categoria: 'Ravioli',
    prezzoKg: 11.00,
    prezzoPezzo: 0,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Ravioli ricotta e spinaci freschi',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Ravioli ricotta e zafferano',
    categoria: 'Ravioli',
    prezzoKg: 11.00,
    prezzoPezzo: 0,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Ravioli ricotta e zafferano',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Ravioli ricotta dolci',
    categoria: 'Ravioli',
    prezzoKg: 11.00,
    prezzoPezzo: 0,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Ravioli ricotta dolci',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Ravioli ricotta poco dolci',
    categoria: 'Ravioli',
    prezzoKg: 11.00,
    prezzoPezzo: 0,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Ravioli ricotta poco dolci',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Ravioli ricotta molto dolci',
    categoria: 'Ravioli',
    prezzoKg: 11.00,
    prezzoPezzo: 0,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Ravioli ricotta molto dolci',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Ravioli ricotta piccoli',
    categoria: 'Ravioli',
    prezzoKg: 11.00,
    prezzoPezzo: 0,
    pezziPerKg: 40,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Ravioli ricotta piccoli (più pezzi per kg)',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Culurgiones',
    categoria: 'Ravioli',
    prezzoKg: 18.00,
    prezzoPezzo: 0,
    pezziPerKg: 32,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Culurgiones tradizionali sardi',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },

  // ========== DOLCI ==========
  {
    nome: 'Pardulas',
    categoria: 'Pardulas',
    prezzoKg: 28.00,
    prezzoPezzo: 0.76,
    pezziPerKg: 25,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Pardulas dolci tradizionali pasquali',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Pardulas con glassa',
    categoria: 'Pardulas',
    prezzoKg: 28.00,
    prezzoPezzo: 0.76,
    pezziPerKg: 25,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Pardulas con glassa dolce',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Pardulas con zucchero a velo',
    categoria: 'Pardulas',
    prezzoKg: 28.00,
    prezzoPezzo: 0.76,
    pezziPerKg: 25,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Pardulas con zucchero a velo',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Ciambelle solo base',
    categoria: 'Dolci',
    prezzoKg: 18.00,
    prezzoPezzo: 0,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Ciambelle solo base',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Ciambelle con marmellata di albicocca',
    categoria: 'Dolci',
    prezzoKg: 18.00,
    prezzoPezzo: 0,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Ciambelle con marmellata di albicocca',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Ciambelle con marmellata di ciliegia',
    categoria: 'Dolci',
    prezzoKg: 18.00,
    prezzoPezzo: 0,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Ciambelle con marmellata di ciliegia',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Ciambelle con nutella',
    categoria: 'Dolci',
    prezzoKg: 20.00,
    prezzoPezzo: 0,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Ciambelle con nutella (prezzo maggiorato)',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Sebadas',
    categoria: 'Dolci',
    prezzoKg: 0,
    prezzoPezzo: 2.50,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['pz'],
    descrizione: 'Sebadas tradizionali con miele',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Amaretti',
    categoria: 'Dolci',
    prezzoKg: 18.00,
    prezzoPezzo: 0,
    pezziPerKg: 35,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Amaretti sardi artigianali',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Papassini',
    categoria: 'Dolci',
    prezzoKg: 18.50,
    prezzoPezzo: 0,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Papassini con uvetta e mandorle',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Gueffus',
    categoria: 'Dolci',
    prezzoKg: 18.00,
    prezzoPezzo: 0,
    pezziPerKg: 65,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Gueffus dolci sardi',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Bianchini',
    categoria: 'Dolci',
    prezzoKg: 18.00,
    prezzoPezzo: 0,
    pezziPerKg: 100,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Bianchini dolci tradizionali',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Torta di saba',
    categoria: 'Dolci',
    prezzoKg: 20.00,
    prezzoPezzo: 15.00,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Torta di saba tradizionale (peso variabile)',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 50,
    giacenzaMinima: 5
  },
  {
    nome: 'Dolci misti',
    categoria: 'Dolci',
    prezzoKg: 18.50,
    prezzoPezzo: 0,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Dolci misti: pardulas, ciambelle, amaretti, etc.',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },

  // ========== PANADAS ==========
  {
    nome: 'Panada di Agnello',
    categoria: 'Panadas',
    prezzoKg: 30.00,
    prezzoPezzo: 0,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Panada di agnello tradizionale',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 80,
    giacenzaMinima: 10
  },
  {
    nome: 'Panada di Maiale',
    categoria: 'Panadas',
    prezzoKg: 21.00,
    prezzoPezzo: 0,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Panada di maiale',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 80,
    giacenzaMinima: 10
  },
  {
    nome: 'Panada di Vitella',
    categoria: 'Panadas',
    prezzoKg: 23.00,
    prezzoPezzo: 0,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Panada di vitella',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 80,
    giacenzaMinima: 10
  },
  {
    nome: 'Panada di verdure',
    categoria: 'Panadas',
    prezzoKg: 17.00,
    prezzoPezzo: 0,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Panada di verdure',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 80,
    giacenzaMinima: 10
  },
  {
    nome: 'Panadine',
    categoria: 'Panadas',
    prezzoKg: 0,
    prezzoPezzo: 0.80,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['pz'],
    descrizione: 'Panadine formato piccolo',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 20
  },

  // ========== PASTA ==========
  {
    nome: 'Fregula',
    categoria: 'Altro',
    prezzoKg: 10.00,
    prezzoPezzo: 0,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Fregula sarda tostata',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Pizzette sfoglia',
    categoria: 'Altro',
    prezzoKg: 15.00,
    prezzoPezzo: 0,
    pezziPerKg: 30,
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Pizzette di pasta sfoglia',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Pasta per panada e pizza',
    categoria: 'Altro',
    prezzoKg: 8.00,
    prezzoPezzo: 0,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Pasta base per panadas e pizza',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  },
  {
    nome: 'Sfoglia per lasagne',
    categoria: 'Altro',
    prezzoKg: 8.00,
    prezzoPezzo: 0,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Sfoglia fresca per lasagne',
    disponibile: true,
    attivo: true,
    giacenzaAttuale: 100,
    giacenzaMinima: 10
  }
];

async function migraProdotti() {
  try {
    console.log('🔄 Connessione a MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI?.substring(0, 30) + '...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');
    
    console.log(`\n📦 Inizio migrazione di ${PRODOTTI_HARDCODED.length} prodotti REALI...`);
    
    let creati = 0;
    let aggiornati = 0;
    let errori = 0;
    
    for (const prodottoData of PRODOTTI_HARDCODED) {
      try {
        const esistente = await Prodotto.findOne({ nome: prodottoData.nome });
        
        if (esistente) {
          await Prodotto.findByIdAndUpdate(esistente._id, {
            ...prodottoData,
            updatedAt: new Date()
          });
          console.log(`🔄 Aggiornato: ${prodottoData.nome} - €${prodottoData.prezzoKg || prodottoData.prezzoPezzo}/kg`);
          aggiornati++;
        } else {
          const nuovoProdotto = new Prodotto({
            ...prodottoData,
            ordinamento: creati + 1
          });
          
          await nuovoProdotto.save();
          console.log(`✅ Creato: ${prodottoData.nome} - €${prodottoData.prezzoKg || prodottoData.prezzoPezzo}${prodottoData.prezzoKg ? '/kg' : '/pz'}`);
          creati++;
        }
      } catch (error) {
        console.error(`❌ Errore con ${prodottoData.nome}:`, error.message);
        errori++;
      }
    }
    
    const totaleDB = await Prodotto.countDocuments();
    
    console.log(`\n📊 ═══════════════════════════════════════`);
    console.log(`   RIEPILOGO MIGRAZIONE`);
    console.log(`   ═══════════════════════════════════════`);
    console.log(`   ✅ Prodotti creati:     ${creati}`);
    console.log(`   🔄 Prodotti aggiornati: ${aggiornati}`);
    console.log(`   ❌ Errori:              ${errori}`);
    console.log(`   📦 Totale nel DB:       ${totaleDB}`);
    console.log(`   ═══════════════════════════════════════\n`);
    
    if (creati > 0 || aggiornati > 0) {
      console.log('🎉 Migrazione completata con successo!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore fatale:', error);
    process.exit(1);
  }
}

migraProdotti();