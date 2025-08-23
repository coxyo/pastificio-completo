// pastificio-backend/check-schema.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ordine from './models/Ordine.js';

dotenv.config();

async function checkSchema() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connesso a MongoDB\n');
    
    // Ottieni lo schema
    const schema = Ordine.schema;
    
    // Controlla i valori enum per stato
    console.log('📋 VALORI ENUM PER "stato":');
    const statoEnum = schema.path('stato').enumValues;
    console.log(statoEnum);
    
    // Controlla i valori enum per metodoPagamento
    console.log('\n💳 VALORI ENUM PER "metodoPagamento":');
    const metodoPagamentoEnum = schema.path('metodoPagamento').enumValues;
    console.log(metodoPagamentoEnum);
    
    // Controlla i valori enum per unitaMisura nei prodotti
    console.log('\n📏 VALORI ENUM PER "prodotti.unitaMisura":');
    const prodottiSchema = schema.path('prodotti').schema;
    const unitaMisuraEnum = prodottiSchema.path('unitaMisura').enumValues;
    console.log(unitaMisuraEnum);
    
    // Mostra un esempio di ordine esistente
    console.log('\n📦 ESEMPIO DI ORDINE ESISTENTE:');
    const ordineEsempio = await Ordine.findOne();
    if (ordineEsempio) {
      console.log('Stato:', ordineEsempio.stato);
      console.log('Metodo Pagamento:', ordineEsempio.metodoPagamento);
      if (ordineEsempio.prodotti && ordineEsempio.prodotti[0]) {
        console.log('Unità Misura prodotto:', ordineEsempio.prodotti[0].unitaMisura);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Errore:', error);
    process.exit(1);
  }
}

checkSchema();

