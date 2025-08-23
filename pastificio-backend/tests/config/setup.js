// tests/config/setup.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config();

let mongod = null;

beforeAll(async () => {
  try {
    console.log('Inizializzazione database di test...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('URI MongoDB:', uri);
    
    await mongoose.connect(uri);
    console.log('Connessione al database stabilita');
  } catch (error) {
    console.error('Errore setup database:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log('Cleanup database completato');
  } catch (error) {
    console.error('Errore cleanup:', error);
  }
});