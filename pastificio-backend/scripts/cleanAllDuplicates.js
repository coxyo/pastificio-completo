// scripts/cleanAllDuplicates.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function cleanAllDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');
    
    const db = mongoose.connection.db;
    const prodottiCollection = db.collection('prodotti');
    
    // Lista TUTTI i prodotti da eliminare
    const daEliminare = [
      'gnocchi',
      'Pardulas con glassa',
      'Pardulas con zucchero a velo',
      // Aggiungi qui altri duplicati se ne vedi
    ];
    
    console.log('🗑️  ELIMINAZIONE PRODOTTI DUPLICATI/TEST...\n');
    
    let eliminati = 0;
    
    for (const nome of daEliminare) {
      const result = await prodottiCollection.deleteOne({ nome: nome });
      if (result.deletedCount > 0) {
        console.log(`   ✅ Eliminato: ${nome}`);
        eliminati++;
      } else {
        console.log(`   ⚠️  Non trovato: ${nome}`);
      }
    }
    
    console.log(`\n📊 Totale eliminati: ${eliminati}`);
    
    // Conta prodotti finali
    const totale = await prodottiCollection.countDocuments({ attivo: true });
    console.log(`📦 Prodotti attivi rimasti: ${totale}`);
    
    // Elenca tutti i prodotti Dolci per trovare altri duplicati
    console.log('\n🍰 PRODOTTI CATEGORIA DOLCI:\n');
    
    const dolci = await prodottiCollection.find({ 
      categoria: 'Dolci',
      attivo: true 
    }).toArray();
    
    dolci.forEach(p => {
      console.log(`   • ${p.nome} (hasVarianti: ${p.hasVarianti || false})`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Completato!');
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
    process.exit(1);
  }
}

cleanAllDuplicates();