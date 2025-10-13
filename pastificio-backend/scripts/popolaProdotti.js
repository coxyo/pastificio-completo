import mongoose from 'mongoose';
import Prodotto from '../models/Prodotto.js';
import dotenv from 'dotenv';

dotenv.config();

const prodottiIniziali = [
  {
    nome: 'Culurgiones Patate',
    categoria: 'Ravioli',
    descrizione: 'Ravioli sardi ripieni di patate',
    prezzoKg: 20.00,
    unitaMisuraDisponibili: ['Kg', 'mezzo kg', 'pz'],
    pezziPerKg: 35,
    disponibile: true,
    attivo: true
  },
  {
    nome: 'Pardulas al Formaggio',
    categoria: 'Pardulas',
    descrizione: 'Pardulas tradizionali sarde',
    prezzoPezzo: 1.50,
    unitaMisuraDisponibili: ['pz', 'dozzina'],
    disponibile: true,
    attivo: true
  },
  // ... aggiungi altri prodotti ...
];

async function popola() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connesso');

    await Prodotto.deleteMany({}); // Pulisce collezione
    await Prodotto.insertMany(prodottiIniziali);
    
    console.log(`✅ Inseriti ${prodottiIniziali.length} prodotti`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

popola();