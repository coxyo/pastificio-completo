// pastificio-backend/scripts/seedArticoli.js
import mongoose from 'mongoose';
import Articolo from '../models/articolo.js';
import dotenv from 'dotenv';

dotenv.config();

const articoliIniziali = [
  {
    codice: 'FAR001',
    nome: 'Farina 00',
    categoria: 'farina',
    unitaMisura: 'kg',
    giacenza: 100,
    scorraMinima: 50,
    prezzoAcquisto: 0.50
  },
  {
    codice: 'FAR002',
    nome: 'Farina Integrale',
    categoria: 'farina',
    unitaMisura: 'kg',
    giacenza: 50,
    scorraMinima: 25,
    prezzoAcquisto: 0.60
  },
  {
    codice: 'ING001',
    nome: 'Uova',
    categoria: 'ingrediente',
    unitaMisura: 'pz',
    giacenza: 200,
    scorraMinima: 100,
    prezzoAcquisto: 0.15
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connesso al database');
    
    // Pulisci articoli esistenti
    await Articolo.deleteMany({});
    
    // Inserisci nuovi articoli
    await Articolo.insertMany(articoliIniziali);
    
    console.log('Articoli iniziali inseriti con successo');
    process.exit(0);
  } catch (error) {
    console.error('Errore:', error);
    process.exit(1);
  }
}

seed();