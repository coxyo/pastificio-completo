// pastificio-backend/scripts/createTestData.js
import mongoose from 'mongoose';
import Articolo from '../models/articolo.js';
import dotenv from 'dotenv';

dotenv.config();

const articoliTest = [
  {
    codice: 'FAR001',
    nome: 'Farina 00',
    descrizione: 'Farina di grano tenero tipo 00',
    categoria: 'farina',
    unitaMisura: 'kg',
    giacenza: 100,
    scorraMinima: 50,
    prezzoAcquisto: 0.50,
    attivo: true
  },
  {
    codice: 'ING001',
    nome: 'Uova fresche',
    descrizione: 'Uova fresche di gallina',
    categoria: 'ingrediente',
    unitaMisura: 'pz',
    giacenza: 500,
    scorraMinima: 200,
    prezzoAcquisto: 0.20,
    attivo: true
  },
  {
    codice: 'ING002',
    nome: 'Sale fino',
    descrizione: 'Sale fino marino',
    categoria: 'ingrediente',
    unitaMisura: 'kg',
    giacenza: 50,
    scorraMinima: 20,
    prezzoAcquisto: 0.30,
    attivo: true
  }
];

async function createData() {
  try {
    // Usa MongoDB locale se Atlas non funziona
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pastificio';
    
    console.log('Connessione a:', uri.includes('localhost') ? 'MongoDB Locale' : 'MongoDB Atlas');
    
    await mongoose.connect(uri);
    console.log('✅ Connesso al database');
    
    // Pulisci dati esistenti
    await Articolo.deleteMany({});
    console.log('✅ Articoli esistenti rimossi');
    
    // Inserisci nuovi articoli
    const risultato = await Articolo.insertMany(articoliTest);
    console.log(`✅ Inseriti ${risultato.length} articoli di test`);
    
    // Mostra articoli inseriti
    console.log('\nArticoli inseriti:');
    risultato.forEach(art => {
      console.log(`- ${art.codice}: ${art.nome} (${art.giacenza} ${art.unitaMisura})`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnesso dal database');
  }
}

createData();