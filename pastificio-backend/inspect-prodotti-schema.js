// inspect-prodotti-schema.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function inspectProdottiSchema() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    // Importa il modello Ordine
    const Ordine = (await import('./models/ordine.js')).default;
    
    console.log('📋 ANALISI DETTAGLIATA SCHEMA PRODOTTI:\n');
    
    // Cerca lo schema dei prodotti
    const prodottiPath = Ordine.schema.path('prodotti');
    console.log('Tipo array prodotti:', prodottiPath.instance);
    
    if (prodottiPath && prodottiPath.schema) {
      console.log('\nCAMPI DEL SINGOLO PRODOTTO:');
      const prodSchema = prodottiPath.schema;
      
      prodSchema.eachPath((pathName, schemaType) => {
        if (pathName !== '_id') {
          console.log(`\n${pathName}:`);
          console.log(`  - Tipo: ${schemaType.instance}`);
          console.log(`  - Richiesto: ${schemaType.isRequired || false}`);
          
          // Controlla enum values in diversi modi
          if (schemaType.enumValues && schemaType.enumValues.length > 0) {
            console.log(`  - Valori enum: [${schemaType.enumValues.map(v => `"${v}"`).join(', ')}]`);
          }
          if (schemaType.options && schemaType.options.enum) {
            console.log(`  - Valori enum (options): [${schemaType.options.enum.map(v => `"${v}"`).join(', ')}]`);
          }
          if (schemaType.validators) {
            schemaType.validators.forEach(validator => {
              if (validator.type === 'enum') {
                console.log(`  - Valori enum (validator): [${validator.enumValues.map(v => `"${v}"`).join(', ')}]`);
              }
            });
          }
        }
      });
    }
    
    // Test con diversi valori di unitaMisura
    console.log('\n\n🧪 TEST VALORI UNITA MISURA:');
    const testValues = ['pz', 'Pz', 'PZ', 'kg', 'Kg', 'KG', 'g', 'l', 'ml', 'pezzi', 'numero', ''];
    
    const domani = new Date();
    domani.setDate(domani.getDate() + 1);
    
    for (const value of testValues) {
      const ordineTest = new Ordine({
        nomeCliente: 'Test',
        telefono: '3331234567',
        dataRitiro: domani,
        oraRitiro: '10:00',
        prodotti: [{
          nome: 'Test',
          quantita: 1,
          prezzo: 1,
          unitaMisura: value
        }]
      });
      
      try {
        await ordineTest.validate();
        console.log(`✅ "${value}" - VALIDO`);
      } catch (err) {
        if (err.errors && err.errors['prodotti.0.unitaMisura']) {
          console.log(`❌ "${value}" - NON VALIDO`);
        } else {
          console.log(`⚠️  "${value}" - Altro errore: ${err.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connessione chiusa');
  }
}

inspectProdottiSchema();