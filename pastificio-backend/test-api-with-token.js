// test-api-with-token.js
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODhlODQ2ZWEwYmYyNTZjNjg4Y2M4NiIsInRva2VuVmVyc2lvbiI6MCwiaWF0IjoxNzUzODAzMDU4LCJleHAiOjE3NTM4ODk0NTh9.vKVGGC4JTYOodeRsSQ5ABZRzgb8Rezgfkv__dHbz6lg';

async function testAPIs() {
  console.log('🧪 TEST API CON TOKEN VALIDO\n');

  // Test 1: Dashboard Stats
  console.log('📊 Test Dashboard Stats...');
  try {
    const response = await fetch(`${API_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dashboard Stats:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Errore:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }

  // Test 2: Ordini
  console.log('\n📋 Test Lista Ordini...');
  try {
    const response = await fetch(`${API_URL}/ordini`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ordini:', data.data?.length || 0, 'ordini trovati');
    } else {
      console.log('❌ Errore:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }

  // Test 3: Crea Ordine
  console.log('\n➕ Test Creazione Ordine...');
  try {
    const nuovoOrdine = {
      nomeCliente: 'Mario Rossi',
      telefono: '3331234567',
      email: 'mario@example.com',
      dataRitiro: new Date().toISOString().split('T')[0],
      oraRitiro: '10:00',
      prodotti: [
        {
          prodotto: 'Pane',
          quantita: 2,
          prezzo: 3.5,
          unita: 'kg'
        }
      ],
      totale: 7,
      note: 'Ordine di test',
      daViaggio: false
    };

    const response = await fetch(`${API_URL}/ordini`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nuovoOrdine)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ordine creato:', data.data._id);
    } else {
      console.log('❌ Errore:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }

  // Test 4: KPI
  console.log('\n📈 Test KPI...');
  try {
    const response = await fetch(`${API_URL}/dashboard/kpi`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ KPI:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Errore:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }

  console.log('\n✅ Test completati!');
}

testAPIs();