// test-whatsapp.js
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const TOKEN = 'IL_TUO_TOKEN'; // Sostituisci con il tuo token di autenticazione

async function testWhatsApp() {
  try {
    // 1. Prima facciamo login per ottenere il token
    console.log('1. Login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@pastificio.com',
        password: 'Admin123!'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✓ Login effettuato');

    // 2. Verifica stato WhatsApp
    console.log('\n2. Verifica stato WhatsApp...');
    const statusResponse = await fetch(`${API_URL}/whatsapp/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const status = await statusResponse.json();
    console.log('Stato WhatsApp:', status);

    // 3. Invia un messaggio di test
    if (status.isReady) {
      console.log('\n3. Invio messaggio di test...');
      
      const numeroTest = '3408208314'; // CAMBIA CON IL TUO NUMERO (senza +39)
      
      const messageResponse = await fetch(`${API_URL}/comunicazioni/whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientiIds: [], // Vuoto perché usiamo numero diretto
          messaggio: '🍝 *Test Pastificio Nonna Claudia*\n\nQuesto è un messaggio di test del sistema WhatsApp.\n\nSe ricevi questo messaggio, il sistema funziona correttamente! ✅',
          filtri: {
            // Per test, invia solo a un numero specifico
            telefono: numeroTest
          }
        })
      });

      // ALTERNATIVA: Test diretto senza passare per clienti
      const testDiretto = await fetch(`${API_URL}/test/whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: numeroTest,
          message: 'Test diretto WhatsApp!'
        })
      });

      const result = await messageResponse.json();
      console.log('Risultato invio:', result);
    } else {
      console.log('⚠️  WhatsApp non ancora pronto. Scansiona il QR code.');
    }

  } catch (error) {
    console.error('Errore:', error);
  }
}

// Esegui il test
testWhatsApp();