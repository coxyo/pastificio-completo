// get-token.js
import fetch from 'node-fetch';

async function getToken() {
  try {
    console.log('🔐 Login con email e password...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@pastificio.com',
        password: 'admin123'  // Password corretta dal DB
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Login riuscito!');
      console.log('👤 Utente:', data.user);
      console.log('\n📋 TOKEN DA COPIARE:');
      console.log('━'.repeat(60));
      console.log(data.token);
      console.log('━'.repeat(60));
      console.log('\n📌 Copia il token sopra e usalo nei file di test!');
    } else {
      console.log('❌ Login fallito:', data.error);
      console.log('\nAssicurati di aver eseguito: node update-admin.js');
    }
    
  } catch (error) {
    console.error('❌ Errore di connessione:', error.message);
    console.log('\nAssicurati che il server sia in esecuzione');
  }
}

getToken();