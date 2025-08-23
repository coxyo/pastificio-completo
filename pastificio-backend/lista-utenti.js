// lista-utenti.js
import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function listaUtenti() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const utenti = await User.find({}, 'nome cognome email ruolo');
    
    console.log('Utenti nel database:');
    utenti.forEach(u => {
      console.log(`- ${u.email} (${u.nome} ${u.cognome}) - Ruolo: ${u.ruolo}`);
    });
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Errore:', error);
  }
}

listaUtenti();