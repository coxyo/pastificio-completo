// pastificio-backend/scripts/checkArticoli.js
import mongoose from 'mongoose';
import Articolo from '../models/articolo.js';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connesso al database');
    
    const count = await Articolo.countDocuments();
    console.log(`Numero di articoli nel database: ${count}`);
    
    const articoli = await Articolo.find();
    console.log('\nArticoli trovati:');
    articoli.forEach(art => {
      console.log(`- ${art.codice}: ${art.nome} (${art.giacenza} ${art.unitaMisura})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Errore:', error);
    process.exit(1);
  }
}

check();