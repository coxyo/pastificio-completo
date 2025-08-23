// inspect-ordine-model.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function inspectOrdineModel() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    // Importa il modello Ordine
    const Ordine = (await import('./models/ordine.js')).default;
    
    console.log('📋 SCHEMA ORDINE:\n');
    
    // Mostra tutti i campi e le loro proprietà
    const paths = Ordine.schema.paths;
    
    // Campi principali
    console.log('CAMPI PRINCIPALI:');
    Object.keys(paths).forEach(key => {
      if (!key.includes('.') && key !== '_id' && key !== '__v') {
        const field = paths[key];
        console.log(`\n${key}:`);
        console.log(`  - Tipo: ${field.instance}`);
        console.log(`  - Richiesto: ${field.isRequired || false}`);
        if (field.enumValues && field.enumValues.length > 0) {
          console.log(`  - Valori enum: [${field.enumValues.join(', ')}]`);
        }
        if (field.defaultValue !== undefined) {
          console.log(`  - Default: ${field.defaultValue}`);
        }
      }
    });
    
    // Campi dei prodotti
    console.log('\n\nCAMPI PRODOTTI:');
    Object.keys(paths).forEach(key => {
      if (key.startsWith('prodotti.')) {
        const field = paths[key];
        const fieldName = key.replace('prodotti.0.', '');
        if (!key.includes('_id')) {
          console.log(`\n${fieldName}:`);
          console.log(`  - Tipo: ${field.instance}`);
          console.log(`  - Richiesto: ${field.isRequired || false}`);
          if (field.enumValues && field.enumValues.length > 0) {
            console.log(`  - Valori enum: [${field.enumValues.join(', ')}]`);
          }
        }
      }
    });

    // Prova a creare un ordine minimo valido
    console.log('\n\n🧪 TEST CREAZIONE ORDINE MINIMO:');
    
    const domani = new Date();
    domani.setDate(domani.getDate() + 1);
    
    const ordineTest = new Ordine({
      nomeCliente: 'Test',
      telefono: '3331234567',
      dataRitiro: domani,
      oraRitiro: '10:00',
      prodotti: [{
        nome: 'Test',
        quantita: 1,
        prezzo: 1,
        unitaMisura: 'pz'  // Proviamo con 'pz'
      }]
    });
    
    // Valida senza salvare
    try {
      await ordineTest.validate();
      console.log('✅ Ordine valido!');
    } catch (err) {
      console.log('❌ Errore validazione:', err.message);
      if (err.errors) {
        Object.keys(err.errors).forEach(key => {
          console.log(`  - ${key}: ${err.errors[key].message}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connessione chiusa');
  }
}

inspectOrdineModel();