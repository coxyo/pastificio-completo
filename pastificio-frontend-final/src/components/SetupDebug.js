// src/components/SetupDebug.js
import React, { useState, useEffect } from 'react';

const SetupDebug = () => {
  const [status, setStatus] = useState('ready');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testLogin = async () => {
    setStatus('testing');
    setLogs([]);
    
    // Pulisci storage
    localStorage.clear();
    sessionStorage.clear();
    addLog('Storage pulito');

    // Lista di credenziali da provare
    const credentials = [
      { email: 'admin@pastificio.it', password: 'admin123' },
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'admin', password: 'admin123' },
      { username: 'admin', password: 'admin123' }
    ];

    for (const cred of credentials) {
      addLog(`Provo con: ${JSON.stringify(cred)}`);
      
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cred)
        });

        const data = await response.json();
        addLog(`Risposta: ${JSON.stringify(data)}`);

        if (data.success && data.token) {
          setStatus('success');
          setMessage(`✅ Login riuscito con: ${cred.email || cred.username}`);
          
          // Salva il token
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          addLog('Token salvato nel localStorage');
          return;
        }
      } catch (error) {
        addLog(`Errore: ${error.message}`);
      }
    }

    setStatus('error');
    setMessage('❌ Nessuna credenziale ha funzionato');
  };

  const checkCurrentAuth = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    addLog(`Token attuale: ${token ? token.substring(0, 20) + '...' : 'nessuno'}`);
    addLog(`User attuale: ${user || 'nessuno'}`);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
          <h2 className="text-2xl font-bold mb-4">Setup Debug Sistema</h2>
          
          <div className="space-y-4">
            <button 
              onClick={testLogin}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mr-2"
              disabled={status === 'testing'}
            >
              Test Login
            </button>
            
            <button 
              onClick={checkCurrentAuth}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Controlla Auth Attuale
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded ${
              status === 'success' ? 'bg-green-100 text-green-700' : 
              status === 'error' ? 'bg-red-100 text-red-700' : 
              'bg-yellow-100 text-yellow-700'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Log di Debug:</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Nessun log...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>

        {status === 'success' && (
          <div className="mt-4 text-center">
            <a 
              href="/dashboard"
              className="inline-block bg-green-500 text-white px-8 py-3 rounded hover:bg-green-600"
            >
              Vai al Dashboard →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupDebug;