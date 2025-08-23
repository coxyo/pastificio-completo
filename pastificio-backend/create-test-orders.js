// pastificio-backend/create-test-orders.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ordine from './models/Ordine.js';

dotenv.config();

async function createTestOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connesso a MongoDB');
    
    // Ordini di esempio con i valori enum CORRETTI
    const ordiniTest = [
      {
        nomeCliente: 'Mario Rossi',
        telefono: '3331234567',
        dataRitiro: new Date(),
        oraRitiro: '10:00',
        prodotti: [
          { 
            nome: 'Culurgiones', 
            quantita: 2, 
            prezzo: 15, 
            unitaMisura: 'Kg' // Kg con K maiuscola
          },
          { 
            nome: 'Seadas', 
            quantita: 10, 
            prezzo: 2, 
            unitaMisura: 'Pezzi' // Pezzi non pz
          }
        ],
        totale: 50,
        stato: 'nuovo', // nuovo, non in_attesa
        metodoPagamento: 'contanti',
        note: 'Cliente abituale'
      },
      {
        nomeCliente: 'Giuseppe Verdi',
        telefono: '3399876543',
        dataRitiro: new Date(Date.now() + 86400000), // Domani
        oraRitiro: '15:00',
        prodotti: [
          { 
            nome: 'Pardulas', 
            quantita: 20, 
            prezzo: 1.5, 
            unitaMisura: 'Pezzi'
          },
          { 
            nome: 'Pane Carasau', 
            quantita: 3, 
            prezzo: 5, 
            unitaMisura: 'Unità' // Unità con U maiuscola
          }
        ],
        totale: 45,
        stato: 'in_lavorazione',
        metodoPagamento: 'carta',
        note: 'Prima volta'
      },
      {
        nomeCliente: 'Anna Bianchi',
        telefono: '3405555555',
        dataRitiro: new Date(),
        oraRitiro: '18:00',
        prodotti: [
          { 
            nome: 'Malloreddus', 
            quantita: 1, 
            prezzo: 12, 
            unitaMisura: 'Kg'
          },
          { 
            nome: 'Fregola', 
            quantita: 2, 
            prezzo: 8, 
            unitaMisura: 'Kg'
          }
        ],
        totale: 28,
        stato: 'nuovo',
        metodoPagamento: 'contanti'
      },
      {
        nomeCliente: 'Luigi Nero',
        telefono: '3354444444',
        dataRitiro: new Date(Date.now() - 86400000), // Ieri
        oraRitiro: '11:00',
        prodotti: [
          { 
            nome: 'Culurgiones', 
            quantita: 3, 
            prezzo: 15, 
            unitaMisura: 'Kg'
          },
          { 
            nome: 'Amaretti', 
            quantita: 2, 
            prezzo: 10, 
            unitaMisura: 'Unità'
          }
        ],
        totale: 65,
        stato: 'completato',
        metodoPagamento: 'carta'
      },
      {
        nomeCliente: 'Maria Gialli',
        telefono: '3383333333',
        dataRitiro: new Date(Date.now() - 172800000), // 2 giorni fa
        oraRitiro: '09:00',
        prodotti: [
          { 
            nome: 'Seadas', 
            quantita: 15, 
            prezzo: 2, 
            unitaMisura: 'Pezzi'
          }
        ],
        totale: 30,
        stato: 'completato',
        metodoPagamento: 'contanti'
      },
      {
        nomeCliente: 'Paolo Viola',
        telefono: '3372222222',
        dataRitiro: new Date(Date.now() + 172800000), // Tra 2 giorni
        oraRitiro: '16:00',
        prodotti: [
          { 
            nome: 'Pardulas', 
            quantita: 30, 
            prezzo: 1.5, 
            unitaMisura: 'Pezzi'
          },
          { 
            nome: 'Culurgiones', 
            quantita: 2, 
            prezzo: 15, 
            unitaMisura: 'Kg'
          }
        ],
        totale: 75,
        stato: 'nuovo',
        metodoPagamento: 'bonifico'
      },
      {
        nomeCliente: 'Carla Rosa',
        telefono: '3361111111',
        dataRitiro: new Date(),
        oraRitiro: '14:00',
        prodotti: [
          { 
            nome: 'Pane Carasau', 
            quantita: 5, 
            prezzo: 5, 
            unitaMisura: 'Unità'
          },
          { 
            nome: 'Malloreddus', 
            quantita: 2, 
            prezzo: 12, 
            unitaMisura: 'Kg'
          }
        ],
        totale: 49,
        stato: 'in_lavorazione',
        metodoPagamento: 'carta'
      },
      {
        nomeCliente: 'Franco Blu',
        telefono: '3347777777',
        dataRitiro: new Date(Date.now() + 86400000),
        oraRitiro: '11:30',
        prodotti: [
          { 
            nome: 'Culurgiones', 
            quantita: 5, 
            prezzo: 15, 
            unitaMisura: 'Kg'
          },
          { 
            nome: 'Seadas', 
            quantita: 20, 
            prezzo: 2, 
            unitaMisura: 'Pezzi'
          },
          { 
            nome: 'Pardulas', 
            quantita: 15, 
            prezzo: 1.5, 
            unitaMisura: 'Pezzi'
          }
        ],
        totale: 137.5,
        stato: 'nuovo',
        metodoPagamento: 'carta', // Cambiato da 'pos' a 'carta'
      },
      {
        nomeCliente: 'Giulia Verde',
        telefono: '3398888888',
        dataRitiro: new Date(),
        oraRitiro: '17:00',
        prodotti: [
          { 
            nome: 'Fregola', 
            quantita: 3, 
            prezzo: 8, 
            unitaMisura: 'Kg'
          },
          { 
            nome: 'Amaretti', 
            quantita: 4, 
            prezzo: 10, 
            unitaMisura: 'Unità'
          }
        ],
        totale: 64,
        stato: 'in_lavorazione',
        metodoPagamento: 'contanti'
      },
      {
        nomeCliente: 'Roberto Arancio',
        telefono: '3356666666',
        dataRitiro: new Date(Date.now() - 86400000),
        oraRitiro: '12:00',
        prodotti: [
          { 
            nome: 'Malloreddus', 
            quantita: 4, 
            prezzo: 12, 
            unitaMisura: 'Kg'
          }
        ],
        totale: 48,
        stato: 'completato',
        metodoPagamento: 'carta'
      },
      {
        nomeCliente: 'Lucia Bianca',
        telefono: '3321112223',
        dataRitiro: new Date(),
        oraRitiro: '10:30',
        prodotti: [
          { 
            nome: 'Culurgiones', 
            quantita: 1, 
            prezzo: 15, 
            unitaMisura: 'Kg'
          },
          { 
            nome: 'Seadas', 
            quantita: 8, 
            prezzo: 2, 
            unitaMisura: 'Pezzi'
          }
        ],
        totale: 31,
        stato: 'nuovo',
        metodoPagamento: 'non_pagato' // Usando anche questo valore enum
      },
      {
        nomeCliente: 'Marco Neri',
        telefono: '3667778889',
        dataRitiro: new Date(Date.now() + 86400000),
        oraRitiro: '16:30',
        prodotti: [
          { 
            nome: 'Fregola', 
            quantita: 5, 
            prezzo: 8, 
            unitaMisura: 'Kg'
          }
        ],
        totale: 40,
        stato: 'in_lavorazione',
        metodoPagamento: 'bonifico'
      }
    ];
    
    // Crea nuovi ordini
    let creati = 0;
    let errori = 0;
    
    for (const ordineData of ordiniTest) {
      try {
        const ordine = new Ordine(ordineData);
        await ordine.save();
        console.log(`✅ Ordine creato per ${ordineData.nomeCliente}`);
        creati++;
      } catch (error) {
        console.error(`❌ Errore per ${ordineData.nomeCliente}:`, error.message);
        errori++;
      }
    }
    
    const count = await Ordine.countDocuments();
    console.log(`\n📊 Riepilogo:`);
    console.log(`   - Ordini creati: ${creati}`);
    console.log(`   - Errori: ${errori}`);
    console.log(`   - Totale ordini nel database: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore generale:', error);
    process.exit(1);
  }
}

createTestOrders();

