// scripts/inizializzaGiacenze.js
import mongoose from 'mongoose';
import Prodotto from '../models/Prodotto.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function inizializzaGiacenze() {
  try {
    console.log('🔄 Connessione a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');
    
    const prodotti = await Prodotto.find();
    console.log(`📦 Trovati ${prodotti.length} prodotti\n`);
    
    let aggiornati = 0;
    
    for (const prodotto of prodotti) {
      // Imposta giacenze di default se non presenti
      const giacenzaAttuale = prodotto.giacenzaAttuale || 100;
      const giacenzaMinima = prodotto.giacenzaMinima || 10;
      
      await Prodotto.findByIdAndUpdate(prodotto._id, {
        giacenzaAttuale,
        giacenzaMinima,
        updatedAt: new Date()
      });
      
      console.log(`✅ ${prodotto.nome}:`);
      console.log(`   Giacenza: ${giacenzaAttuale} | Minimo: ${giacenzaMinima}`);
      aggiornati++;
    }
    
    console.log(`\n📊 ═══════════════════════════════════════`);
    console.log(`   GIACENZE INIZIALIZZATE`);
    console.log(`   ═══════════════════════════════════════`);
    console.log(`   ✅ Prodotti aggiornati:    ${aggiornati}`);
    console.log(`   📦 Giacenza standard:      100 unità`);
    console.log(`   ⚠️  Soglia alert:          10 unità`);
    console.log(`   ═══════════════════════════════════════\n`);
    
    console.log('🎉 Inizializzazione completata!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnesso da MongoDB');
    process.exit(0);
  }
}

inizializzaGiacenze();