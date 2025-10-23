// scripts/deleteDuplicates.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function deleteDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');
    
    const db = mongoose.connection.db;
    const prodottiCollection = db.collection('prodotti');
    
    // Elimina duplicati Pardulas
    const duplicati = [
      'Pardulas con glassa',
      'Pardulas con zucchero a velo'
    ];
    
    console.log('🗑️  ELIMINAZIONE DUPLICATI...\n');
    
    for (const nome of duplicati) {
      const result = await prodottiCollection.deleteOne({ nome: nome });
      console.log(`   ${result.deletedCount > 0 ? '✅' : '⚠️'}  ${nome}: ${result.deletedCount > 0 ? 'ELIMINATO' : 'NON TROVATO'}`);
    }
    
    // Conta prodotti rimasti
    const totale = await prodottiCollection.countDocuments();
    console.log(`\n📊 Prodotti totali: ${totale}`);
    
    // Aggiorna prezzo Pardulas principale
    console.log('\n💰 AGGIORNAMENTO PREZZI PARDULAS...\n');
    
    await prodottiCollection.updateOne(
      { nome: 'Pardulas' },
      {
        $set: {
          'varianti': [
            {
              nome: 'base',
              label: 'Pardulas (base) - €20/Kg',
              prezzoKg: 20.00,
              prezzoPezzo: 0.76
            },
            {
              nome: 'con_glassa',
              label: 'Pardulas con glassa - €20/Kg',
              prezzoKg: 20.00,
              prezzoPezzo: 0.76
            },
            {
              nome: 'zucchero_velo',
              label: 'Pardulas con zucchero a velo - €20/Kg',
              prezzoKg: 20.00,
              prezzoPezzo: 0.76
            }
          ]
        }
      }
    );
    
    console.log('✅ Pardulas aggiornato con tutte le varianti a €20/Kg\n');
    
    await mongoose.disconnect();
    console.log('✅ Completato!');
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
    process.exit(1);
  }
}

deleteDuplicates();