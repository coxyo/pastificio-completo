// src/utils/testAuth.js
export const testCredentials = async () => {
  const credentials = [
    { email: 'admin@pastificio.it', password: 'admin123' },
    { email: 'admin@example.com', password: 'admin123' },
    { email: 'admin', password: 'admin123' }
  ];

  for (const cred of credentials) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('✅ Credenziali funzionanti:', cred);
        return { ...cred, token: data.token };
      }
    } catch (error) {
      console.log('❌ Errore con:', cred.email);
    }
  }
  
  return null;
};