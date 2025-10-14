// scripts/migraProdottiHardcoded.js
import mongoose from 'mongoose';
import Prodotto from '../models/Prodotto.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica .env dalla root del progetto
dotenv.config({ path: join(__dirname, '..', '.env') });

// 28 prodotti esistenti da GestoreOrdini.js
const PRODOTTI_HARDCODED = [
  // RAVIOLI
  { 
    nome: 'Culurgiones', 
    categoria: 'Ravioli', 
    prezzoKg: 10, 
    prezzoPezzo: 0.5, 
    pezziPerKg: 20, 
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Culurgiones tradizionali sardi'
  },
  { 
    nome: 'Culurgiones (base)', 
    categoria: 'Ravioli', 
    prezzoKg: 10, 
    prezzoPezzo: 0.5, 
    pezziPerKg: 20, 
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Culurgiones versione base'
  },
  { 
    nome: 'Culurgiones ricotta e spinaci', 
    categoria: 'Ravioli', 
    prezzoKg: 10, 
    prezzoPezzo: 0.5, 
    pezziPerKg: 20, 
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Culurgiones con ripieno di ricotta e spinaci freschi'
  },
  { 
    nome: 'Culurgiones carne', 
    categoria: 'Ravioli', 
    prezzoKg: 10, 
    prezzoPezzo: 0.5, 
    pezziPerKg: 20, 
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Culurgiones con ripieno di carne'
  },
  { 
    nome: 'Culurgiones verdure', 
    categoria: 'Ravioli', 
    prezzoKg: 10, 
    prezzoPezzo: 0.5, 
    pezziPerKg: 20, 
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Culurgiones con ripieno di verdure miste'
  },
  { 
    nome: 'Ravioli ricotta e spinaci', 
    categoria: 'Ravioli', 
    prezzoKg: 10, 
    prezzoPezzo: 0.5, 
    pezziPerKg: 20, 
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Ravioli classici ricotta e spinaci'
  },
  
  // DOLCI
  { 
    nome: 'Sebadas', 
    categoria: 'Dolci', 
    prezzoKg: 10, 
    prezzoPezzo: 0.5, 
    pezziPerKg: 20, 
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Sebadas tradizionali con miele'
  },
  { 
    nome: 'Pardulas', 
    categoria: 'Pardulas', 
    prezzoKg: 0, 
    prezzoPezzo: 0.5, 
    pezziPerKg: 20, 
    unitaMisuraDisponibili: ['pz'],
    descrizione: 'Pardulas dolci tradizionali pasquali'
  },
  { 
    nome: 'Pardulas con giassa', 
    categoria: 'Pardulas', 
    prezzoKg: 0, 
    prezzoPezzo: 0.5, 
    pezziPerKg: 20, 
    unitaMisuraDisponibili: ['pz'],
    descrizione: 'Pardulas con glassa dolce'
  },
  { 
    nome: 'Amaretti', 
    categoria: 'Dolci', 
    prezzoKg: 15, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Amaretti sardi artigianali'
  },
  { 
    nome: 'Bianchini', 
    categoria: 'Dolci', 
    prezzoKg: 15, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Bianchini dolci tradizionali'
  },
  { 
    nome: 'Gueffus', 
    categoria: 'Dolci', 
    prezzoKg: 15, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Gueffus dolci sardi'
  },
  { 
    nome: 'Candelaus', 
    categoria: 'Dolci', 
    prezzoKg: 15, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Candelaus dolci natalizi'
  },
  { 
    nome: 'Pabassinas', 
    categoria: 'Dolci', 
    prezzoKg: 15, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Pabassinas con uvetta e mandorle'
  },
  
  // PANADAS
  { 
    nome: 'Panadas', 
    categoria: 'Panadas', 
    prezzoKg: 10, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Panadas salate tradizionali'
  },
  { 
    nome: 'Panadine', 
    categoria: 'Panadas', 
    prezzoKg: 10, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Panadine formato piccolo'
  },
  
  // PASTA
  { 
    nome: 'Gnocchi', 
    categoria: 'Altro', 
    prezzoKg: 10, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Gnocchi di patate freschi'
  },
  { 
    nome: 'Malloreddus', 
    categoria: 'Altro', 
    prezzoKg: 10, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Malloreddus pasta tipica sarda'
  },
  { 
    nome: 'Fregola', 
    categoria: 'Altro', 
    prezzoKg: 10, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Fregola sarda tostata'
  },
  { 
    nome: 'Lorighittas', 
    categoria: 'Altro', 
    prezzoKg: 12, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Lorighittas pasta intrecciata'
  },
  
  // ALTRO
  { 
    nome: 'Lasagne', 
    categoria: 'Altro', 
    prezzoKg: 10, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Sfoglia per lasagne fatta in casa'
  },
  { 
    nome: 'Cannelloni', 
    categoria: 'Altro', 
    prezzoKg: 10, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Cannelloni freschi'
  },
  { 
    nome: 'Tagliatelle', 
    categoria: 'Altro', 
    prezzoKg: 10, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Tagliatelle all\'uovo fresche'
  },
  { 
    nome: 'Pasta fresca generica', 
    categoria: 'Altro', 
    prezzoKg: 10, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Pasta fresca vari formati'
  },
  { 
    nome: 'Focaccia', 
    categoria: 'Altro', 
    prezzoKg: 0, 
    prezzoPezzo: 8, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['pz'],
    descrizione: 'Focaccia fatta in casa'
  },
  { 
    nome: 'Pane carasau', 
    categoria: 'Altro', 
    prezzoKg: 12, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg'],
    descrizione: 'Pane carasau tradizionale'
  },
  { 
    nome: 'Civraxiu', 
    categoria: 'Altro', 
    prezzoKg: 0, 
    prezzoPezzo: 5, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['pz'],
    descrizione: 'Pane civraxiu rustico'
  },
  { 
    nome: 'Altro', 
    categoria: 'Altro', 
    prezzoKg: 10, 
    prezzoPezzo: 0, 
    pezziPerKg: null, 
    unitaMisuraDisponibili: ['Kg', 'pz'],
    descrizione: 'Prodotto generico'
  }
];

async function migraProdotti() {
  try {
    console.log('🔄 Connessione a MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI?.substring(0, 30) + '...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');
    
    console.log(`\n📦 Inizio migrazione di ${PRODOTTI_HARDCODED.length} prodotti...`);
    
    let creati = 0;
    let aggiornati = 0;
    let esistenti = 0;
    let errori = 0;
    
    for (const prodottoData of PRODOTTI_HARDCODED) {
      try {
        // Verifica se esiste già
        const esistente = await Prodotto.findOne({ nome: prodottoData.nome });
        
        if (esistente) {
          // Aggiorna prodotto esistente
          await Prodotto.findByIdAndUpdate(esistente._id, {
            ...prodottoData,
            disponibile: true,
            attivo: true,
            giacenzaAttuale: esistente.giacenzaAttuale || 100,
            giacenzaMinima: esistente.giacenzaMinima || 10,
            updatedAt: new Date()
          });
          console.log(`🔄 Prodotto aggiornato: ${prodottoData.nome}`);
          aggiornati++;
        } else {
          // Crea nuovo prodotto
          const nuovoProdotto = new Prodotto({
            ...prodottoData,
            disponibile: true,
            attivo: true,
            giacenzaAttuale: 100, // Giacenza iniziale
            giacenzaMinima: 10,   // Soglia alert
            ordinamento: creati + 1
          });
          
          await nuovoProdotto.save();
          console.log(`✅ Creato: ${prodottoData.nome}`);
          creati++;
        }
        
      } catch (error) {
        console.error(`❌ Errore con ${prodottoData.nome}:`, error.message);
        errori++;
      }
    }
    
    const totaleDB = await Prodotto.countDocuments();
    
    console.log(`\n📊 ═══════════════════════════════════════`);
    console.log(`   RIEPILOGO MIGRAZIONE COMPLETATA`);
    console.log(`   ═══════════════════════════════════════`);
    console.log(`   ✅ Prodotti creati:        ${creati}`);
    console.log(`   🔄 Prodotti aggiornati:    ${aggiornati}`);
    console.log(`   ❌ Errori:                 ${errori}`);
    console.log(`   📦 Totale nel database:    ${totaleDB}`);
    console.log(`   ═══════════════════════════════════════\n`);
    
    if (creati > 0 || aggiornati > 0) {
      console.log('🎉 Migrazione completata con successo!');
    } else {
      console.log('ℹ️  Nessun prodotto da migrare.');
    }
    
  } catch (error) {
    console.error('❌ Errore fatale durante la migrazione:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnesso da MongoDB');
    process.exit(0);
  }
}

// Esegui migrazione
migraProdotti();