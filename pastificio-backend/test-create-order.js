// test-create-order.js
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODhlODQ2ZWEwYmYyNTZjNjg4Y2M4NiIsInRva2VuVmVyc2lvbiI6MCwiaWF0IjoxNzUzODAzMDU4LCJleHAiOjE3NTM4ODk0NTh9.vKVGGC4JTYOodeRsSQ5ABZRzgb8Rezgfkv__dHbz6lg';

async function testCreateOrder() {
  console.log('🧪 TEST CREAZIONE ORDINE\n');

  // Data di domani
  const domani = new Date();
  domani.setDate(domani.getDate() + 1);
  const dataRitiro = domani.toISOString().split('T')[0];

  const nuovoOrdine = {
    nomeCliente: 'Mario Rossi',
    telefono: '3331234567',
    email: 'mario@example.com',
    dataRitiro: dataRitiro, // Data futura
    oraRitiro: '10:00',
    prodotti: [
      {
        nome: 'Pane carasau',  // Aggiunto nome
        prodotto: 'Pane carasau',
        quantita: 2,
        prezzo: 3.5,
        unitaMisura: 'kg',  // Aggiunto unitaMisura
        categoria: 'pane'
      },
      {
        nome: 'Culurgiones',
        prodotto: 'Culurgiones',
        quantita: 20,
        prezzo: 1.2,
        unitaMisura: 'pz',
        categoria: 'pasta'
      }
    ],
    totale: 31, // 7 + 24
    note: 'Ordine di test - ritiro domani',
    daViaggio: false,
    stato: 'confermato'
  };

  try {
    console.log('📝 Creazione ordine per:', dataRitiro);
    console.log('📦 Prodotti:', nuovoOrdine.prodotti.length);
    
    const response = await fetch(`${API_URL}/ordini`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nuovoOrdine)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ ORDINE CREATO CON SUCCESSO!');
      console.log('   ID:', data.data._id);
      console.log('   Cliente:', data.data.nomeCliente);
      console.log('   Data ritiro:', data.data.dataRitiro);
      console.log('   Totale: €', data.data.totale);
      
      // Test recupero ordine
      console.log('\n🔍 Recupero ordine creato...');
      const getResponse = await fetch(`${API_URL}/ordini/${data.data._id}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      
      if (getResponse.ok) {
        const orderData = await getResponse.json();
        console.log('✅ Ordine recuperato:', orderData.data._id);
      }
      
    } else {
      console.log('\n❌ ERRORE:', response.status);
      console.log('Dettagli:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }

  // Test lista ordini
  console.log('\n📋 Verifica lista ordini...');
  try {
    const listResponse = await fetch(`${API_URL}/ordini`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ Totale ordini nel sistema:', listData.data.length);
      
      if (listData.data.length > 0) {
        console.log('\n📊 Ultimi ordini:');
        listData.data.slice(0, 3).forEach(ordine => {
          console.log(`   - ${ordine.nomeCliente} (${ordine.dataRitiro}) - €${ordine.totale}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Errore lista:', error.message);
  }
}

testCreateOrder();