// pastificio-backend/scripts/testConnection.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('Test connessione MongoDB...');
console.log('URI:', process.env.MONGODB_URI ? 'Presente' : 'MANCANTE!');

async function testConnection() {
  try {
    console.log('Tentativo di connessione...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // timeout di 5 secondi
    });
    console.log('✅ Connessione riuscita!');
    console.log('Database:', mongoose.connection.name);
    
    // Prova a fare una query semplice
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collezioni trovate:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('Disconnesso.');
  } catch (error) {
    console.error('❌ Errore di connessione:', error.message);
  }
  process.exit();
}

testConnection();