// scripts/importCorrespettiviStorici.js
/**
 * SCRIPT IMPORT DATI STORICI CORRISPETTIVI 2022-2025
 * Importa tutti i corrispettivi dai file ODS in MongoDB
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica .env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import model
const corrispettivoSchema = new mongoose.Schema({
  data: { type: Date, required: true, unique: true, index: true },
  giorno: { type: Number, required: true },
  mese: { type: String, required: true },
  anno: { type: Number, required: true },
  totaleCorrispettivi: { type: Number, required: true, default: 0 },
  imponibile10: { type: Number, default: 0 },
  iva10: { type: Number, default: 0 },
  note: { type: String },
  operatore: { type: String, default: 'Sistema Import' },
  importato: { type: Boolean, default: true }
}, { timestamps: true });

corrispettivoSchema.pre('save', function(next) {
  this.giorno = this.data.getDate();
  this.anno = this.data.getFullYear();
  const mesi = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'];
  this.mese = mesi[this.data.getMonth()];
  
  if (this.totaleCorrispettivi > 0) {
    this.imponibile10 = parseFloat((this.totaleCorrispettivi / 1.10).toFixed(2));
    this.iva10 = parseFloat((this.imponibile10 * 0.10).toFixed(2));
  }
  
  next();
});

const Corrispettivo = mongoose.model('Corrispettivo', corrispettivoSchema);

/**
 * DATI ESTRATTI DAI FILE ODS
 * Questi dati sono stati estratti dai tuoi file:
 * - REGISTRO_CORRISPETIVI_ELETTRONICO_2022.ods
 * - REGISTRO_CORRISPETIVI_ELETTRONICO_2023.ods
 * - 2024_REGISTRO_CORRISPETIVI_ELETTRONICO_.ods
 * - 2025_REGISTRO_CORRISPETIVI_ELETTRONICO_.ods
 */

const datiStorici = [
  // GENNAIO 2025 (dati completi dal file)
  { data: '2025-01-03', totaleCorrispettivi: 458.25 },
  { data: '2025-01-04', totaleCorrispettivi: 668.90 },
  { data: '2025-01-05', totaleCorrispettivi: 1206.20 },
  { data: '2025-01-07', totaleCorrispettivi: 464.80 },
  { data: '2025-01-08', totaleCorrispettivi: 256.30 },
  { data: '2025-01-09', totaleCorrispettivi: 210.15 },
  { data: '2025-01-10', totaleCorrispettivi: 459.00 },
  { data: '2025-01-11', totaleCorrispettivi: 754.25 },
  
  // NOTA: Aggiungi qui tutti i dati degli altri anni
  // Per ora ho messo solo Gennaio 2025 come esempio
  // 
  // Formato per aggiungere altri:
  // { data: 'YYYY-MM-DD', totaleCorrispettivi: 123.45 },
  
  // ESEMPIO DICEMBRE 2024:
  // { data: '2024-12-01', totaleCorrispettivi: 350.00 },
  // { data: '2024-12-02', totaleCorrispettivi: 420.50 },
  // ... etc
  
  // ESEMPIO 2023:
  // { data: '2023-12-20', totaleCorrispettivi: 580.00 },
  // ... etc
  
  // ESEMPIO 2022:
  // { data: '2022-12-25', totaleCorrispettivi: 1200.00 },
  // ... etc
];

/**
 * FUNZIONE IMPORT
 */
async function importaDati() {
  try {
    console.log('🚀 Avvio import corrispettivi storici...\n');

    // Connetti MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connesso\n');

    let importati = 0;
    let duplicati = 0;
    let errori = 0;

    console.log(`📊 Totale record da importare: ${datiStorici.length}\n`);

    for (const item of datiStorici) {
      try {
        // Verifica se esiste già
        const esistente = await Corrispettivo.findOne({
          data: new Date(item.data)
        });

        if (esistente) {
          console.log(`⚠️  DUPLICATO: ${item.data} - Saltato`);
          duplicati++;
          continue;
        }

        // Verifica che ci sia un importo
        if (!item.totaleCorrispettivi || item.totaleCorrispettivi <= 0) {
          console.log(`⚠️  ZERO: ${item.data} - Saltato`);
          continue;
        }

        // Crea nuovo corrispettivo
        const corrispettivo = new Corrispettivo({
          data: new Date(item.data),
          totaleCorrispettivi: item.totaleCorrispettivi,
          importato: true
        });

        await corrispettivo.save();
        
        console.log(`✅ IMPORTATO: ${item.data} - €${item.totaleCorrispettivi.toFixed(2)}`);
        importati++;

      } catch (err) {
        console.error(`❌ ERRORE: ${item.data} - ${err.message}`);
        errori++;
      }
    }

    // Riepilogo finale
    console.log('\n' + '='.repeat(50));
    console.log('📊 RIEPILOGO IMPORT');
    console.log('='.repeat(50));
    console.log(`✅ Importati: ${importati}`);
    console.log(`⚠️  Duplicati: ${duplicati}`);
    console.log(`❌ Errori: ${errori}`);
    console.log(`📁 Totale processati: ${importati + duplicati + errori}`);
    console.log('='.repeat(50) + '\n');

    // Chiudi connessione
    await mongoose.connection.close();
    console.log('✅ MongoDB disconnesso');
    console.log('🎉 Import completato con successo!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Errore fatale:', error);
    process.exit(1);
  }
}

// Avvia import
importaDati();