// scripts/fix-indice-telefono.js
// Eseguire: node scripts/fix-indice-telefono.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixIndice() {
  console.log('🔗 Connessione a MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connesso!');
  
  const db = mongoose.connection.db;
  const clienti = db.collection('clientes');
  
  // 1. Verifica duplicati rimasti
  const duplicati = await clienti.aggregate([
    { $match: { telefono: { $ne: null, $ne: '' } } },
    { $group: { _id: '$telefono', count: { $sum: 1 }, nomi: { $push: { nome: '$nome', cognome: '$cognome' } } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  
  if (duplicati.length > 0) {
    console.log('⚠️ Trovati ancora duplicati:');
    duplicati.forEach(d => {
      console.log(`   Tel: ${d._id} → ${d.count} clienti: ${d.nomi.map(n => `${n.nome} ${n.cognome}`).join(', ')}`);
    });
    console.log('❌ Risolvi i duplicati prima di creare l\'indice unique.');
    await mongoose.disconnect();
    process.exit(1);
  }
  
  console.log('✅ Nessun duplicato trovato!');
  
  // 2. Rimuovi vecchio indice telefono se esiste (non-unique)
  try {
    const indexes = await clienti.indexes();
    const oldIndex = indexes.find(i => i.name === 'telefono_1' && !i.unique);
    if (oldIndex) {
      await clienti.dropIndex('telefono_1');
      console.log('🗑️ Vecchio indice telefono_1 (non-unique) rimosso');
    }
  } catch (e) {
    // Ignora se non esiste
  }
  
  // 3. Crea indice unique + sparse (ignora documenti senza telefono)
  try {
    await clienti.createIndex(
      { telefono: 1 }, 
      { name: 'idx_telefono_unique', unique: true, sparse: true, background: true }
    );
    console.log('✅ Indice idx_telefono_unique creato!');
    console.log('   → Da ora è IMPOSSIBILE inserire due clienti con lo stesso numero');
  } catch (e) {
    console.log('❌ Errore:', e.message);
  }
  
  // 4. Crea indice cognome+nome se mancante
  try {
    await clienti.createIndex(
      { cognome: 1, nome: 1 }, 
      { name: 'idx_cognome_nome', background: true }
    );
    console.log('✅ Indice idx_cognome_nome creato!');
  } catch (e) {
    // Già esiste, ok
  }
  
  // Riepilogo
  const finalIndexes = await clienti.indexes();
  console.log(`\n📊 Indici clientes: ${finalIndexes.length}`);
  finalIndexes.forEach(idx => {
    const keys = Object.entries(idx.key).map(([k, v]) => `${k}:${v}`).join(', ');
    console.log(`   ${idx.unique ? '🔑' : '📌'} ${idx.name} → {${keys}}`);
  });
  
  await mongoose.disconnect();
  console.log('\n✅ Fatto!');
  process.exit(0);
}

fixIndice().catch(err => {
  console.error('❌ Errore:', err);
  process.exit(1);
});