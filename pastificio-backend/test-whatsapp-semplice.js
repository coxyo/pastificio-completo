// test-whatsapp-semplice.js
import axios from 'axios';

const NUMERO_TEST = '3408208314'; // CAMBIA CON IL TUO NUMERO WHATSAPP (senza +39)

async function test() {
  try {
    // 1. Login con le nuove credenziali
    console.log('1. Facendo login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@pastificio.com',
      password: 'Admin123!'  // La nuova password
    });
    
    const loginData = loginResponse.data;
    
    if (!loginData.success) {
      console.error('Errore login:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('✓ Login OK');

    // 2. Verifica se WhatsApp è pronto
    console.log('\n2. Verifico WhatsApp...');
    const statusResponse = await axios.get('http://localhost:5000/api/whatsapp/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const status = statusResponse.data;
    console.log('Stato:', status.isReady ? 'PRONTO ✓' : 'NON PRONTO ✗');
    
    if (!status.isReady) {
      console.log('\n⚠️  WhatsApp non è pronto!');
      console.log('Assicurati di aver scansionato il QR code nel terminale del backend');
      return;
    }

    // 3. Invia messaggio di test
    console.log('\n3. Invio messaggio a', NUMERO_TEST);
    
    // Crea un cliente fittizio per il test
    const createClienteResponse = await axios.post('http://localhost:5000/api/clienti', {
      tipo: 'privato',
      nome: 'Test',
      cognome: 'WhatsApp',
      telefono: NUMERO_TEST,
      email: 'test@test.com'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const cliente = createClienteResponse.data;
    console.log('Cliente test creato:', cliente.success ? 'OK' : 'Errore');

    // Invia messaggio WhatsApp
    const sendResponse = await axios.post('http://localhost:5000/api/comunicazioni/whatsapp', {
      clientiIds: [cliente.cliente._id],
      messaggio: '🍝 *Pastificio Nonna Claudia*\n\nCiao {nome}! Questo è un messaggio di test.\n\nSe lo ricevi, WhatsApp funziona! ✅\n\nGrazie!'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = sendResponse.data;
    console.log('\nRisultato:', result);
    
    if (result.success) {
      console.log('✅ MESSAGGIO INVIATO CON SUCCESSO!');
      console.log('Controlla WhatsApp sul numero', NUMERO_TEST);
    } else {
      console.log('❌ Errore invio:', result.error);
    }

  } catch (error) {
    console.error('Errore:', error.response?.data || error.message);
  }
}

// Esegui il test
test();