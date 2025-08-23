// src/services/authManager.js
class AuthManager {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
  }

  // Pulisce tutto e fa un login fresco
  async freshLogin() {
    try {
      // Pulisci tutto prima
      this.clearAuth();

      // Prova le credenziali standard
      const credentials = [
        { email: 'admin@pastificio.it', password: 'admin123' },
        { email: 'admin@example.com', password: 'admin123' },
        { email: 'admin', password: 'admin123' }
      ];

      for (const cred of credentials) {
        console.log('Tentativo login con:', cred.email);
        
        const response = await fetch(`${this.baseURL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cred)
        });

        const data = await response.json();
        
        if (data.success && data.token) {
          console.log('✅ Login riuscito con:', cred.email);
          
          // Salva i dati corretti
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user || {}));
          localStorage.setItem('authEmail', cred.email);
          
          // Rimuovi qualsiasi token di test
          localStorage.removeItem('testToken');
          localStorage.removeItem('testUser');
          
          return {
            success: true,
            token: data.token,
            user: data.user
          };
        }
      }

      throw new Error('Nessuna credenziale valida trovata');
    } catch (error) {
      console.error('Errore login:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Ottiene il token valido
  getValidToken() {
    const token = localStorage.getItem('token');
    
    // Se il token è "testuser" o simile, è invalido
    if (!token || token === 'testuser' || token.includes('test')) {
      return null;
    }
    
    return token;
  }

  // Verifica se siamo autenticati correttamente
  isAuthenticated() {
    const token = this.getValidToken();
    return !!token && token !== 'testuser';
  }

  // Pulisce l'autenticazione
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('testToken');
    localStorage.removeItem('testUser');
    localStorage.removeItem('authEmail');
  }

  // Fa una richiesta autenticata
  async authenticatedFetch(url, options = {}) {
    const token = this.getValidToken();
    
    if (!token) {
      // Prova a fare login
      const loginResult = await this.freshLogin();
      if (!loginResult.success) {
        throw new Error('Non autenticato');
      }
    }

    const finalToken = this.getValidToken();
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${finalToken}`,
        'Content-Type': 'application/json'
      }
    });
  }
}

export default new AuthManager();