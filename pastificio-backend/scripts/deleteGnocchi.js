// scripts/deleteGnocchi.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function deleteGnocchi() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');
    
    const db = mongoose.connection.db;
    const prodottiCollection = db.collection('prodotti');
    
    // Elimina gnocchi
    const result = await prodottiCollection.deleteOne({ nome: 'gnocchi' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Gnocchi eliminato con successo!');
    } else {
      console.log('⚠️ Gnocchi non trovato (forse già eliminato)');
    }
    
    // Conta prodotti totali
    const totale = await prodottiCollection.countDocuments();
    console.log(`\n📊 Prodotti totali rimasti: ${totale}`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnesso');
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
    process.exit(1);
  }
}

deleteGnocchi();