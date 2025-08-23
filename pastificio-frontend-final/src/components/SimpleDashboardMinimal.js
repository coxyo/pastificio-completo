// SimpleDashboardMinimal.js
import React, { useState, useEffect } from 'react';

const SimpleDashboardMinimal = () => {
  const [ordini, setOrdini] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Gestione stato online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    loadData();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Login
      const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'admin@pastificio.it', 
          password: 'admin123' 
        })
      });

      const loginData = await loginRes.json();
      
      if (!loginData.success) {
        throw new Error(loginData.error || 'Login fallito');
      }

      localStorage.setItem('token', loginData.token);

      // Carica ordini
      const ordiniRes = await fetch('http://localhost:5000/api/ordini', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      const ordiniData = await ordiniRes.json();
      
      if (ordiniData.success) {
        setOrdini(ordiniData.data || []);
      }
    } catch (err) {
      setError(err.message);
      console.error('Errore:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOnline) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>⚠️ Modalità Offline</h2>
        <p>Non sei connesso a Internet</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Caricamento...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>❌ Errore</h2>
        <p>{error}</p>
        <button onClick={loadData}>Riprova</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard Pastificio</h1>
      <h2>Ordini: {ordini.length}</h2>
      
      {ordini.length === 0 ? (
        <p>Nessun ordine presente</p>
      ) : (
        <ul>
          {ordini.map((ordine, index) => (
            <li key={index}>
              Ordine #{ordine._id || index} - Cliente: {ordine.cliente || 'N/D'}
            </li>
          ))}
        </ul>
      )}
      
      <button onClick={loadData} style={{ marginTop: '20px' }}>
        Ricarica Dati
      </button>
    </div>
  );
};

export default SimpleDashboardMinimal;