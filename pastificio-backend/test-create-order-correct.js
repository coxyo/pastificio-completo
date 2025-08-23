// test-create-order-correct.js
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODhlODQ2ZWEwYmYyNTZjNjg4Y2M4NiIsInRva2VuVmVyc2lvbiI6MCwiaWF0IjoxNzUzODAzMDU4LCJleHAiOjE3NTM4ODk0NTh9.vKVGGC4JTYOodeRsSQ5ABZRzgb8Rezgfkv__dHbz6lg';

async function getOrderSchema() {
  console.log('🔍 Prima verifichiamo lo schema dell\'ordine...\n');
  
  // Crea un ordine minimo per vedere quali campi sono richiesti
  const testOrder = {
    nomeCliente: 'Test',
    dataRitiro: new Date(Date.now() + 86400000).toISOString(), // Domani
    prodotti: [{
      nome: 'Test',
      quantita: 1
    }]
  };

  const response = await fetch(`${API_URL}/ordini`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testOrder)
  });

  const result = await response.json();
  console.log('Risposta test:', JSON.stringify(result, null, 2));
}

async function createValidOrder() {
  console.log('\n📝 Creazione ordine con dati corretti...\n');
  
  // Data di domani
  const domani = new Date();
  domani.setDate(domani.getDate() + 1);
  domani.setHours(10, 0, 0, 0);
  
  const ordineCorretto = {
    nomeCliente: 'Mario Rossi',
    telefono: '3331234567',
    email: 'mario@example.com',
    dataRitiro: domani.toISOString().split('T')[0], // Solo data
    oraRitiro: '10:00',
    prodotti: [
      {
        nome: 'Pane integrale',  // nome invece di prodotto
        quantita: 2,
        prezzo: 3.5,
        unitaMisura: 'Kg'  // Prova con K maiuscola
      },
      {
        nome: 'Focaccia',
        quantita: 3,
        prezzo: 4,
        unitaMisura: 'unità'  // Prova con 'unità'
      }
    ],
    stato: 'nuovo',  // Prova con 'nuovo' invece di 'confermato'
    totale: 19,
    note: 'Ordine di test',
    daViaggio: false
  };

  console.log('Ordine da inviare:', JSON.stringify(ordineCorretto, null, 2));

  try {
    const response = await fetch(`${API_URL}/ordini`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ordineCorretto)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ ORDINE CREATO CON SUCCESSO!');
      console.log('ID:', data.data._id);
      console.log('Cliente:', data.data.nomeCliente);
      console.log('Data ritiro:', data.data.dataRitiro);
      console.log('Totale:', data.data.totale);
    } else {
      console.log('❌ Errore:', response.status);
      console.log('Dettagli:', JSON.stringify(data, null, 2));
      
      // Analizza gli errori
      if (data.error && data.error.includes('enum')) {
        console.log('\n⚠️  Valori enum non validi. Controlla:');
        console.log('   - stato: deve essere uno dei valori permessi');
        console.log('   - unitaMisura: deve essere uno dei valori permessi');
      }
    }
  } catch (error) {
    console.error('❌ Errore di rete:', error.message);
  }
}

async function testOrder() {
  await getOrderSchema();
  await createValidOrder();
}

testOrder();