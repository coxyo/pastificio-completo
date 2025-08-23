// test-auth-controller.js
import fetch from 'node-fetch';

async function testAuth() {
  const tests = [
    {
      name: 'Test 1: Email + Password',
      body: {
        email: 'admin@pastificio.com',
        password: 'admin123'
      }
    },
    {
      name: 'Test 2: Username + Password',
      body: {
        username: 'admin',
        password: 'admin123'
      }
    },
    {
      name: 'Test 3: Tutti i campi',
      body: {
        email: 'admin@pastificio.com',
        username: 'admin',
        password: 'admin123'
      }
    }
  ];

  for (const test of tests) {
    console.log(`\n🧪 ${test.name}`);
    console.log('Payload:', JSON.stringify(test.body, null, 2));
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ LOGIN RIUSCITO!');
        console.log('Token:', data.token);
        console.log('User:', data.user);
        console.log('\n🎉 USA QUESTO TOKEN NEI TEST:');
        console.log('━'.repeat(60));
        console.log(data.token);
        console.log('━'.repeat(60));
        break;
      } else {
        console.log('❌ Fallito:', data.error);
      }
    } catch (error) {
      console.error('❌ Errore:', error.message);
    }
  }
}

testAuth();