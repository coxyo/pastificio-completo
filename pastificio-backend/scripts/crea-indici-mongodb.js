// scripts/crea-indici-mongodb.js
// ✅ Script per creare/verificare indici MongoDB
// Eseguire UNA VOLTA: node scripts/crea-indici-mongodb.js
// Oppure copiare i comandi nella MongoDB Atlas Shell

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function creaIndici() {
  console.log('🔗 Connessione a MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connesso!');
  
  const db = mongoose.connection.db;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 📦 COLLEZIONE: ordini
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📦 Creazione indici ORDINI...');
  const ordini = db.collection('ordinis'); // Mongoose pluralizza
  
  try {
    // Lista ordini giornaliera (query più frequente)
    await ordini.createIndex({ dataRitiro: 1 }, { name: 'idx_dataRitiro', background: true });
    console.log('  ✅ idx_dataRitiro');
    
    // Ordini per cliente (cronologico inverso)
    await ordini.createIndex({ 'cliente.cognome': 1, dataRitiro: -1 }, { name: 'idx_cliente_data', background: true });
    console.log('  ✅ idx_cliente_data');
    
    // Filtro per stato + data
    await ordini.createIndex({ stato: 1, dataRitiro: 1 }, { name: 'idx_stato_data', background: true });
    console.log('  ✅ idx_stato_data');
    
    // Ordini recenti (per sync e dashboard)
    await ordini.createIndex({ createdAt: -1 }, { name: 'idx_createdAt', background: true });
    console.log('  ✅ idx_createdAt');
    
    // Ricerca per ID cliente
    await ordini.createIndex({ 'cliente._id': 1 }, { name: 'idx_clienteId', background: true, sparse: true });
    console.log('  ✅ idx_clienteId');
    
  } catch (e) {
    console.log(`  ⚠️ Errore ordini: ${e.message}`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 👥 COLLEZIONE: clienti
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n👥 Creazione indici CLIENTI...');
  const clienti = db.collection('clientes');
  
  try {
    // Ricerca per telefono (dal popup chiamata 3CX)
    await clienti.createIndex({ telefono: 1 }, { name: 'idx_telefono', unique: true, sparse: true, background: true });
    console.log('  ✅ idx_telefono (unique)');
    
    // Ricerca alfabetica
    await clienti.createIndex({ cognome: 1, nome: 1 }, { name: 'idx_cognome_nome', background: true });
    console.log('  ✅ idx_cognome_nome');
    
  } catch (e) {
    console.log(`  ⚠️ Errore clienti: ${e.message}`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 📦 COLLEZIONE: movimenti (magazzino)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📦 Creazione indici MOVIMENTI...');
  const movimenti = db.collection('movimentos');
  
  try {
    // Storico movimenti (più recenti prima)
    await movimenti.createIndex({ data: -1 }, { name: 'idx_data', background: true });
    console.log('  ✅ idx_data');
    
    // Movimenti per prodotto
    await movimenti.createIndex({ 'prodotto.nome': 1, data: -1 }, { name: 'idx_prodotto_data', background: true });
    console.log('  ✅ idx_prodotto_data');
    
    // Aggregazione per tipo (carico/scarico)
    await movimenti.createIndex({ tipo: 1, data: -1 }, { name: 'idx_tipo_data', background: true });
    console.log('  ✅ idx_tipo_data');
    
  } catch (e) {
    console.log(`  ⚠️ Errore movimenti: ${e.message}`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🌡️ COLLEZIONE: haccpregistraziones
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🌡️ Creazione indici HACCP...');
  const haccp = db.collection('haccpregistraziones');
  
  try {
    // Report per periodo
    await haccp.createIndex({ data: -1, tipo: 1 }, { name: 'idx_data_tipo', background: true });
    console.log('  ✅ idx_data_tipo');
    
  } catch (e) {
    console.log(`  ⚠️ Errore HACCP: ${e.message}`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 💰 COLLEZIONE: corrispettivos
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n💰 Creazione indici CORRISPETTIVI...');
  const corrispettivi = db.collection('corrispettivos');
  
  try {
    await corrispettivi.createIndex({ data: -1 }, { name: 'idx_data', background: true });
    console.log('  ✅ idx_data');
    
  } catch (e) {
    console.log(`  ⚠️ Errore corrispettivi: ${e.message}`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 RIEPILOGO
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 RIEPILOGO INDICI PER COLLEZIONE:');
  console.log('═══════════════════════════════════════════');
  
  for (const collName of ['ordinis', 'clientes', 'movimentos', 'haccpregistraziones', 'corrispettivos', 'prodottos']) {
    try {
      const coll = db.collection(collName);
      const indexes = await coll.indexes();
      console.log(`\n  📂 ${collName}: ${indexes.length} indici`);
      indexes.forEach(idx => {
        const keys = Object.entries(idx.key).map(([k, v]) => `${k}:${v}`).join(', ');
        console.log(`     ${idx.unique ? '🔑' : '📌'} ${idx.name} → {${keys}}`);
      });
    } catch (e) {
      console.log(`  ⚠️ ${collName}: ${e.message}`);
    }
  }
  
  console.log('\n✅ Operazione completata!');
  await mongoose.disconnect();
  process.exit(0);
}

creaIndici().catch(err => {
  console.error('❌ Errore:', err);
  process.exit(1);
});