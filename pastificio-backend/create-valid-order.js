// create-valid-order.js
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODhlODQ2ZWEwYmYyNTZjNjg4Y2M4NiIsInRva2VuVmVyc2lvbiI6MCwiaWF0IjoxNzUzODAzMDU4LCJleHAiOjE3NTM4ODk0NTh9.vKVGGC4JTYOodeRsSQ5ABZRzgb8Rezgfkv__dHbz6lg';

async function createOrder() {
  console.log('🛒 CREAZIONE ORDINE VALIDO\n');
  
  // Data di domani
  const domani = new Date();
  domani.setDate(domani.getDate() + 1);
  
  const ordineValido = {
    nomeCliente: 'Mario Rossi',
    telefono: '3331234567',
    email: 'mario@example.com',
    dataRitiro: domani.toISOString().split('T')[0],
    oraRitiro: '10:00',
    prodotti: [
      {
        nome: 'Pane integrale',
        quantita: 2,
        prezzo: 3.5,
        unitaMisura: 'Kg'  // Valore valido!
      },
      {
        nome: 'Focaccia',
        quantita: 3,
        prezzo: 4,
        unitaMisura: 'Pezzi'  // Valore valido!
      },
      {
        nome: 'Grissini',
        quantita: 1,
        prezzo: 2.5,
        unitaMisura: 'Unità'  // Valore valido!
      }
    ],
    stato: 'nuovo',  // Valore valido dallo schema
    totale: 21.5,
    note: 'Ordine di test - Sistema funzionante',
    deveViaggiare: false  // Nome corretto del campo
  };

  console.log('📋 Dati ordine:', JSON.stringify(ordineValido, null, 2));

  try {
    const response = await fetch(`${API_URL}/ordini`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ordineValido)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ ORDINE CREATO CON SUCCESSO!');
      console.log('📦 ID Ordine:', data.data._id);
      console.log('👤 Cliente:', data.data.nomeCliente);
      console.log('📅 Data ritiro:', data.data.dataRitiro);
      console.log('💰 Totale: €', data.data.totale);
      console.log('📝 Stato:', data.data.stato);
      console.log('\n🎉 Il sistema è completamente funzionante!');
      
      // Verifica ordini
      console.log('\n📊 Verifica lista ordini...');
      const listResponse = await fetch(`${API_URL}/ordini`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      
      const listData = await listResponse.json();
      console.log('📋 Totale ordini nel sistema:', listData.data.length);
      
    } else {
      console.log('\n❌ Errore:', response.status);
      console.log('Dettagli:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Errore di rete:', error.message);
  }
}

createOrder();