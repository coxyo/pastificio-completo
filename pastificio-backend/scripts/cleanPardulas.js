// scripts/cleanPardulas.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function cleanPardulas() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');
    
    const db = mongoose.connection.db;
    const prodottiCollection = db.collection('prodotti');
    
    // 1. ELIMINA prodotti duplicati
    console.log('🗑️  ELIMINAZIONE DUPLICATI...\n');
    
    const duplicati = [
      'Pardulas con glassa',
      'Pardulas con zucchero a velo'
    ];
    
    for (const nome of duplicati) {
      const result = await prodottiCollection.deleteOne({ nome: nome });
      if (result.deletedCount > 0) {
        console.log(`   ✅ Eliminato: ${nome}`);
      } else {
        console.log(`   ⚠️  Non trovato: ${nome}`);
      }
    }
    
    // 2. VERIFICA prodotto Pardulas principale
    console.log('\n📦 VERIFICA PRODOTTO PRINCIPALE...\n');
    
    const pardulas = await prodottiCollection.findOne({ nome: 'Pardulas' });
    
    if (!pardulas) {
      console.error('❌ Prodotto Pardulas principale non trovato!');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`✅ Pardulas trovato (categoria: ${pardulas.categoria})`);
    console.log(`   hasVarianti: ${pardulas.hasVarianti}`);
    console.log(`   Numero varianti: ${pardulas.varianti?.length || 0}`);
    
    // 3. AGGIORNA prezzi varianti a €20/Kg
    console.log('\n💰 AGGIORNAMENTO PREZZI...\n');
    
    const updateResult = await prodottiCollection.updateOne(
      { nome: 'Pardulas' },
      {
        $set: {
          'prezzoKg': 20.00,
          'prezzoPezzo': 0.76,
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
    
    console.log(`✅ Prodotto aggiornato (modifiche: ${updateResult.modifiedCount})`);
    
    // 4. VERIFICA FINALE
    console.log('\n🔍 VERIFICA FINALE...\n');
    
    const pardulasFinal = await prodottiCollection.findOne({ nome: 'Pardulas' });
    
    console.log('Varianti configurate:');
    pardulasFinal.varianti.forEach(v => {
      console.log(`   • ${v.label}: €${v.prezzoKg}/Kg`);
    });
    
    // 5. CONTA PRODOTTI TOTALI
    const totalePardulas = await prodottiCollection.countDocuments({ 
      nome: { $regex: /Pardulas/i } 
    });
    
    console.log(`\n📊 Totale prodotti "Pardulas" nel DB: ${totalePardulas}`);
    
    if (totalePardulas === 1) {
      console.log('✅ PERFETTO! Solo 1 prodotto Pardulas (con varianti)');
    } else {
      console.log('⚠️  ATTENZIONE! Ci sono ancora duplicati!');
      
      const tuttiPardulas = await prodottiCollection.find({ 
        nome: { $regex: /Pardulas/i } 
      }).toArray();
      
      console.log('\nProdotti trovati:');
      tuttiPardulas.forEach(p => {
        console.log(`   - ${p.nome} (ID: ${p._id})`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Script completato!');
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
    process.exit(1);
  }
}

cleanPardulas();