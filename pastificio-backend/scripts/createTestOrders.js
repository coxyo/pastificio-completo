// scripts/createTestOrders.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// Schema Ordine semplificato
const ordineSchema = new mongoose.Schema({
  nomeCliente: String,
  telefono: String,
  email: String,
  dataRitiro: Date,
  oraRitiro: String,
  prodotti: [{
    nome: String,
    quantita: Number,
    prezzo: Number,
    unita: String
  }],
  totale: Number,
  stato: {
    type: String,
    enum: ['in_attesa', 'in_lavorazione', 'completato'],
    default: 'in_attesa'
  },
  note: String,
  daViaggio: Boolean,
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});

const Ordine = mongoose.model('Ordine', ordineSchema);

// Dati di esempio
const clienti = [
  { nome: "Mario Rossi", telefono: "3331234567" },
  { nome: "Luigi Bianchi", telefono: "3339876543" },
  { nome: "Anna Verdi", telefono: "3335551234" },
  { nome: "Giuseppe Russo", telefono: "3337778899" },
  { nome: "Maria Romano", telefono: "3332223344" },
  { nome: "Paolo Esposito", telefono: "3334445566" },
  { nome: "Francesca Costa", telefono: "3336667788" },
  { nome: "Antonio Ferrari", telefono: "3338889900" },
  { nome: "Laura Fontana", telefono: "3331112233" },
  { nome: "Marco Ricci", telefono: "3333334455" }
];

const prodotti = [
  { nome: "Pardulas", prezzo: 2.50, unita: "pz" },
  { nome: "Seadas", prezzo: 3.00, unita: "pz" },
  { nome: "Culurgiones", prezzo: 12.00, unita: "kg" },
  { nome: "Malloreddus", prezzo: 8.00, unita: "kg" },
  { nome: "Pane Carasau", prezzo: 5.00, unita: "conf" },
  { nome: "Amaretti", prezzo: 15.00, unita: "kg" },
  { nome: "Papassini", prezzo: 18.00, unita: "kg" },
  { nome: "Torrone", prezzo: 20.00, unita: "kg" }
];

const operatori = ["maria", "giuseppe", "anna"];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomTime() {
  const hours = 8 + Math.floor(Math.random() * 12); // 8:00 - 19:00
  const minutes = Math.random() < 0.5 ? "00" : "30";
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

async function createTestOrders() {
  try {
    console.log('🔗 Connessione a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pastificio');
    console.log('✅ Connesso a MongoDB\n');

    console.log('📦 Generazione ordini di test...\n');
    
    const oggi = new Date();
    const ordiniCreati = [];
    
    // Genera 50 ordini
    for (let i = 0; i < 50; i++) {
      const cliente = clienti[Math.floor(Math.random() * clienti.length)];
      const numProdotti = 1 + Math.floor(Math.random() * 4); // 1-4 prodotti per ordine
      const prodottiOrdine = [];
      let totale = 0;
      
      // Seleziona prodotti casuali
      for (let j = 0; j < numProdotti; j++) {
        const prodotto = prodotti[Math.floor(Math.random() * prodotti.length)];
        const quantita = 1 + Math.floor(Math.random() * 5); // 1-5 unità
        const subtotale = prodotto.prezzo * quantita;
        
        prodottiOrdine.push({
          nome: prodotto.nome,
          quantita: quantita,
          prezzo: prodotto.prezzo,
          unita: prodotto.unita
        });
        
        totale += subtotale;
      }
      
      // Data ritiro: da oggi a +7 giorni
      const dataRitiro = randomDate(oggi, new Date(oggi.getTime() + 7 * 24 * 60 * 60 * 1000));
      
      const ordine = new Ordine({
        nomeCliente: cliente.nome,
        telefono: cliente.telefono,
        email: `${cliente.nome.toLowerCase().replace(' ', '.')}@email.it`,
        dataRitiro: dataRitiro,
        oraRitiro: randomTime(),
        prodotti: prodottiOrdine,
        totale: totale,
        stato: Math.random() < 0.3 ? 'completato' : Math.random() < 0.6 ? 'in_lavorazione' : 'in_attesa',
        daViaggio: Math.random() < 0.2,
        note: Math.random() < 0.3 ? "Note di prova per l'ordine" : "",
        createdBy: operatori[Math.floor(Math.random() * operatori.length)],
        createdAt: randomDate(new Date(oggi.getTime() - 30 * 24 * 60 * 60 * 1000), oggi)
      });
      
      await ordine.save();
      ordiniCreati.push(ordine);
      
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Creati ${i + 1} ordini...`);
      }
    }
    
    console.log('\n✨ Tutti gli ordini sono stati creati!\n');
    
    // Statistiche
    const stats = {
      totale: ordiniCreati.length,
      inAttesa: ordiniCreati.filter(o => o.stato === 'in_attesa').length,
      inLavorazione: ordiniCreati.filter(o => o.stato === 'in_lavorazione').length,
      completati: ordiniCreati.filter(o => o.stato === 'completato').length,
      daViaggio: ordiniCreati.filter(o => o.daViaggio).length,
      valoreTotal: ordiniCreati.reduce((sum, o) => sum + o.totale, 0)
    };
    
    console.log('📊 STATISTICHE ORDINI GENERATI:');
    console.log('================================');
    console.log(`Totale ordini: ${stats.totale}`);
    console.log(`- In attesa: ${stats.inAttesa}`);
    console.log(`- In lavorazione: ${stats.inLavorazione}`);
    console.log(`- Completati: ${stats.completati}`);
    console.log(`- Da viaggio: ${stats.daViaggio}`);
    console.log(`Valore totale: €${stats.valoreTotal.toFixed(2)}`);
    console.log(`Valore medio: €${(stats.valoreTotal / stats.totale).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connessione chiusa');
  }
}

createTestOrders();