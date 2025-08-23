// src/components/SetupIniziale.js
import React, { useState, useEffect } from 'react';

const SetupIniziale = () => {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setupAuth();
  }, []);

  const setupAuth = async () => {
    try {
      setStatus('checking');
      setMessage('Controllo sistema di autenticazione...');

      // Pulisci tutto
      localStorage.clear();
      sessionStorage.clear();

      setMessage('Storage pulito, tentativo login...');

      // Login con credenziali corrette
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@pastificio.it',
          password: 'admin123'
        })
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Salva il token corretto
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setStatus('success');
        setMessage('✅ Autenticazione configurata correttamente!');
        
        // Reindirizza dopo 2 secondi
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        throw new Error(data.error || 'Login fallito');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Errore: ${error.message}`);
    }
  };

  const retry = () => {
    setupAuth();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Setup Sistema</h2>
        
        {status === 'checking' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <p className="text-green-600 font-semibold">{message}</p>
            <p className="text-gray-500 mt-2">Reindirizzamento al dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <p className="text-red-600 mb-4">{message}</p>
            <button 
              onClick={retry}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Riprova
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupIniziale;