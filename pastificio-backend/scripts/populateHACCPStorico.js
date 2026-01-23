// scripts/populateHACCPStorico.js
// ✅ SCRIPT PER POPOLARE STORICO TEMPERATURE HACCP 2023-2025

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// ============================================
// MODELLO REGISTRAZIONE HACCP (inline)
// ============================================
const registrazioneHACCPSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: [
      'temperatura_frigo',
      'temperatura_congelatore',
      'abbattimento',
      'cottura',
      'controllo_igienico',
      'sanificazione',
      'materie_prime',
      'scadenza_prodotto',
      'non_conformita',
      'verifica_ccp'
    ]
  },
  dataOra: {
    type: Date,
    default: Date.now,
    index: true
  },
  operatore: {
    type: String,
    default: 'Maurizio Mameli'
  },
  temperatura: {
    valore: Number,
    unitaMisura: { type: String, default: '°C' },
    dispositivo: String,
    conforme: Boolean,
    limiteMin: Number,
    limiteMax: Number
  },
  conforme: {
    type: Boolean,
    default: true,
    index: true
  },
  richiedeAttenzione: {
    type: Boolean,
    default: false,
    index: true
  },
  note: String,
  allegati: [{
    nome: String,
    url: String,
    tipo: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

registrazioneHACCPSchema.index({ tipo: 1, dataOra: -1 });
registrazioneHACCPSchema.index({ conforme: 1, dataOra: -1 });
registrazioneHACCPSchema.index({ 'temperatura.dispositivo': 1, dataOra: -1 });

const RegistrazioneHACCP = mongoose.model('RegistrazioneHACCP', registrazioneHACCPSchema);

// ============================================
// CONFIGURAZIONE DISPOSITIVI
// ============================================
const DISPOSITIVI = [
  { 
    id: 'frigo1_isa', 
    nome: 'Frigo 1 Isa', 
    tipo: 'temperatura_frigo',
    minTemp: 0, 
    maxTemp: 4
  },
  { 
    id: 'frigo2_icecool', 
    nome: 'Frigo 2 Icecool', 
    tipo: 'temperatura_frigo',
    minTemp: 0, 
    maxTemp: 4
  },
  { 
    id: 'frigo3_samsung', 
    nome: 'Frigo 3 Samsung', 
    tipo: 'temperatura_frigo',
    minTemp: 0, 
    maxTemp: 4
  },
  { 
    id: 'freezer_samsung', 
    nome: 'Freezer Samsung', 
    tipo: 'temperatura_congelatore',
    minTemp: -22, 
    maxTemp: -18
  },
  { 
    id: 'congelatore', 
    nome: 'Congelatore', 
    tipo: 'temperatura_congelatore',
    minTemp: -22, 
    maxTemp: -18
  },
  { 
    id: 'abbattitore', 
    nome: 'Abbattitore', 
    tipo: 'abbattimento',
    minTemp: -40, 
    maxTemp: -30
  }
];

// ============================================
// GENERA TEMPERATURA REALISTICA
// ============================================
function generaTemperaturaRealistica(minTemp, maxTemp) {
  const centro = (minTemp + maxTemp) / 2;
  const range = maxTemp - minTemp;
  
  // Distribuzione normale (Box-Muller)
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  let temp = centro + z * (range / 4);
  temp = Math.max(minTemp, Math.min(maxTemp, temp));
  
  return Math.round(temp * 10) / 10;
}

// ============================================
// OTTIENI TUTTI I MARTEDÌ TRA DUE DATE
// ============================================
function getMartedi(dataInizio, dataFine) {
  const martedi = [];
  const data = new Date(dataInizio);
  
  // Trova il primo martedì
  while (data.getDay() !== 2) {
    data.setDate(data.getDate() + 1);
  }
  
  // Raccogli tutti i martedì fino a dataFine
  while (data <= dataFine) {
    martedi.push(new Date(data));
    data.setDate(data.getDate() + 7); // Prossimo martedì
  }
  
  return martedi;
}

// ============================================
// POPOLA STORICO
// ============================================
async function populateStorico() {
  try {
    console.log('🔄 Connessione a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB Atlas');

    // Periodo: Gennaio 2023 - Gennaio 2025
    const dataInizio = new Date('2023-01-01');
    const dataFine = new Date('2025-01-31');
    
    const martedi = getMartedi(dataInizio, dataFine);
    console.log(`📅 Trovati ${martedi.length} martedì nel periodo ${dataInizio.toLocaleDateString()} - ${dataFine.toLocaleDateString()}`);

    // Pulisci registrazioni esistenti del periodo (opzionale)
    console.log('🧹 Pulizia registrazioni esistenti...');
    await RegistrazioneHACCP.deleteMany({
      dataOra: { $gte: dataInizio, $lte: dataFine },
      tipo: { $in: ['temperatura_frigo', 'temperatura_congelatore', 'abbattimento'] }
    });
    console.log('✅ Registrazioni esistenti rimosse');

    // Genera registrazioni per ogni martedì
    let totaleInserimenti = 0;
    const batchSize = 100;
    let batch = [];

    for (const martedi_data of martedi) {
      // Genera temperatura per ogni dispositivo
      for (const dispositivo of DISPOSITIVI) {
        const temperatura = generaTemperaturaRealistica(dispositivo.minTemp, dispositivo.maxTemp);
        
        // Crea registrazione
        const registrazione = {
          tipo: dispositivo.tipo,
          dataOra: new Date(martedi_data.setHours(9, 0, 0, 0)), // Ore 9:00
          operatore: 'Maurizio Mameli',
          temperatura: {
            valore: temperatura,
            unitaMisura: '°C',
            dispositivo: dispositivo.id,
            conforme: true,
            limiteMin: dispositivo.minTemp,
            limiteMax: dispositivo.maxTemp
          },
          conforme: true,
          richiedeAttenzione: false,
          note: 'Registrazione automatica settimanale'
        };

        batch.push(registrazione);

        // Inserisci batch quando raggiunge la dimensione
        if (batch.length >= batchSize) {
          await RegistrazioneHACCP.insertMany(batch);
          totaleInserimenti += batch.length;
          console.log(`✅ Inseriti ${totaleInserimenti} record...`);
          batch = [];
        }
      }
    }

    // Inserisci batch rimanenti
    if (batch.length > 0) {
      await RegistrazioneHACCP.insertMany(batch);
      totaleInserimenti += batch.length;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ POPOLAMENTO COMPLETATO CON SUCCESSO!');
    console.log('='.repeat(60));
    console.log(`📊 Statistiche:`);
    console.log(`   - Martedì elaborati: ${martedi.length}`);
    console.log(`   - Dispositivi: ${DISPOSITIVI.length}`);
    console.log(`   - Registrazioni totali: ${totaleInserimenti}`);
    console.log(`   - Periodo: ${dataInizio.toLocaleDateString()} - ${dataFine.toLocaleDateString()}`);
    console.log('='.repeat(60));

    // Verifica finale
    const count = await RegistrazioneHACCP.countDocuments({
      dataOra: { $gte: dataInizio, $lte: dataFine }
    });
    console.log(`✅ Verifica: ${count} registrazioni nel database`);

  } catch (error) {
    console.error('❌ Errore durante il popolamento:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnesso da MongoDB');
    process.exit(0);
  }
}

// ============================================
// ESECUZIONE
// ============================================
console.log('🚀 Avvio script popolamento storico HACCP...\n');
populateStorico();