// scripts/deleteDisabled.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function deleteDisabled() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');
    
    const db = mongoose.connection.db;
    const prodottiCollection = db.collection('prodotti');
    
    // Trova prodotti disattivati
    const disattivati = await prodottiCollection.find({ attivo: false }).toArray();
    
    console.log('🔍 PRODOTTI DISATTIVATI TROVATI:\n');
    disattivati.forEach(p => {
      console.log(`   • ${p.nome} (categoria: ${p.categoria})`);
    });
    
    console.log(`\n📊 Totale disattivati: ${disattivati.length}`);
    
    // OPZIONALE: Elimina prodotti disattivati
    // Decommentare le righe sotto SE vuoi eliminarli
    /*
    const result = await prodottiCollection.deleteMany({ attivo: false });
    console.log(`\n✅ Eliminati: ${result.deletedCount} prodotti`);
    */
    
    const totaleAttivi = await prodottiCollection.countDocuments({ attivo: true });
    console.log(`\n✅ Prodotti attivi rimasti: ${totaleAttivi}`);
    
    await mongoose.disconnect();
    console.log('✅ Completato!');
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
    process.exit(1);
  }
}

deleteDisabled();