// scripts/ricalcolaOrdiniPardulas.js
// ✅ SCRIPT PER CORREGGERE ORDINI GIÀ SALVATI CON PREZZI SBAGLIATI

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ordine from '../models/Ordine.js';
import { calcolaPrezzoOrdine } from '../utils/calcoliPrezzi.js';

dotenv.config();

async function ricalcolaOrdiniPardulas() {
  try {
    console.log('🔄 Connessione a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    // Trova tutti gli ordini con Pardulas
    const ordiniConPardulas = await Ordine.find({
      'prodotti.nome': { $regex: /pardulas/i }
    });

    console.log(`\n📋 Trovati ${ordiniConPardulas.length} ordini con Pardulas\n`);

    let corretti = 0;
    let errori = 0;

    for (const ordine of ordiniConPardulas) {
      try {
        console.log(`\n🔍 Ordine ${ordine.numeroOrdine || ordine._id}`);
        console.log(`   Cliente: ${ordine.nomeCliente}`);
        
        const vecchioTotale = ordine.totale;
        let modificato = false;

        // Ricalcola ogni prodotto
        ordine.prodotti = ordine.prodotti.map(p => {
          const vecchioPrezzo = p.prezzo;
          
          // Ricalcola usando il sistema corretto
          try {
            const risultato = calcolaPrezzoOrdine(
              p.nome,
              p.quantita,
              p.unita || p.unitaMisura || 'Kg'
            );

            const nuovoPrezzo = risultato.prezzoTotale;
            const differenza = Math.abs(vecchioPrezzo - nuovoPrezzo);

            // Se c'è una differenza significativa (>€1)
            if (differenza > 1) {
              console.log(`   ⚠️  ${p.nome}:`);
              console.log(`      - PRIMA: ${p.quantita} ${p.unita} = €${vecchioPrezzo.toFixed(2)}`);
              console.log(`      - DOPO:  ${risultato.dettagli} = €${nuovoPrezzo.toFixed(2)}`);
              console.log(`      - Differenza: €${differenza.toFixed(2)}`);
              modificato = true;
            }

            return {
              ...p,
              prezzo: nuovoPrezzo,
              dettagliCalcolo: risultato
            };
          } catch (error) {
            console.error(`   ❌ Errore ricalcolo ${p.nome}:`, error.message);
            return p; // Mantieni il prodotto originale
          }
        });

        if (modificato) {
          // Ricalcola totale
          ordine.calcolaTotale();
          
          const nuovoTotale = ordine.totale;
          const differenzaTotale = Math.abs(vecchioTotale - nuovoTotale);

          console.log(`   💰 TOTALE ORDINE:`);
          console.log(`      - PRIMA: €${vecchioTotale.toFixed(2)}`);
          console.log(`      - DOPO:  €${nuovoTotale.toFixed(2)}`);
          console.log(`      - Differenza: €${differenzaTotale.toFixed(2)}`);

          // Salva solo se c'è differenza significativa
          if (differenzaTotale > 1) {
            await ordine.save();
            corretti++;
            console.log(`   ✅ Ordine corretto e salvato`);
          }
        } else {
          console.log(`   ✅ Ordine già corretto`);
        }

      } catch (error) {
        errori++;
        console.error(`   ❌ Errore ordine ${ordine.numeroOrdine}:`, error.message);
      }
    }

    console.log(`\n\n📊 RIEPILOGO:`);
    console.log(`   - Ordini analizzati: ${ordiniConPardulas.length}`);
    console.log(`   - Ordini corretti: ${corretti}`);
    console.log(`   - Errori: ${errori}`);
    console.log(`   - Non modificati: ${ordiniConPardulas.length - corretti - errori}`);

  } catch (error) {
    console.error('❌ Errore generale:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnesso da MongoDB');
  }
}

// Esegui lo script
ricalcolaOrdiniPardulas();