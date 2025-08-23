// src/components/DashboardRapido.js
import React, { useState, useEffect } from 'react';

const DashboardRapido = () => {
  const [stats, setStats] = useState({
    ordiniOggi: 0,
    ordiniTotali: 0,
    clientiTotali: 0,
    fatturatoOggi: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usa il token già salvato dal sistema degli ordini
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Se non c'è token, reindirizza alla pagina ordini per fare login
        setError('Vai prima alla pagina Ordini per autenticarti');
        return;
      }

      // Carica gli ordini usando il token esistente
      const ordiniResponse = await fetch('http://localhost:5000/api/ordini', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!ordiniResponse.ok) {
        if (ordiniResponse.status === 401) {
          localStorage.removeItem('token');
          setError('Token scaduto. Vai alla pagina Ordini per riautenticarti');
          return;
        }
        throw new Error(`Errore ${ordiniResponse.status}`);
      }

      const ordiniData = await ordiniResponse.json();
      
      if (ordiniData.success) {
        const ordini = ordiniData.data || [];
        const oggi = new Date().toISOString().split('T')[0];
        
        // Filtra ordini di oggi
        const ordiniOggi = ordini.filter(o => {
          if (o.dataRitiro) {
            const dataOrdine = o.dataRitiro.split('T')[0];
            return dataOrdine === oggi;
          }
          return false;
        });
        
        // Calcola statistiche
        const clientiSet = new Set();
        let fatturatoTotaleOggi = 0;
        
        ordini.forEach(ordine => {
          // Aggiungi cliente al set
          if (ordine.cliente) clientiSet.add(ordine.cliente);
          if (ordine.nomeCliente) clientiSet.add(ordine.nomeCliente);
          
          // Calcola fatturato di oggi
          if (ordine.dataRitiro && ordine.dataRitiro.split('T')[0] === oggi) {
            fatturatoTotaleOggi += ordine.totale || 0;
          }
        });
        
        setStats({
          ordiniOggi: ordiniOggi.length,
          ordiniTotali: ordini.length,
          clientiTotali: clientiSet.size,
          fatturatoOggi: fatturatoTotaleOggi
        });
      }
    } catch (err) {
      console.error('Errore dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Link rapido alla pagina ordini
  const goToOrdini = () => {
    window.location.href = '/ordini';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-bold mb-2">⚠️ Attenzione</p>
          <p className="mb-3">{error}</p>
          <button 
            onClick={goToOrdini}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
          >
            Vai agli Ordini
          </button>
          <button 
            onClick={loadDashboardData}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Pastificio</h1>
        <button 
          onClick={loadDashboardData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <span>↻</span> Aggiorna
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Ordini Oggi</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.ordiniOggi}</p>
          <p className="text-xs text-gray-400 mt-2">Ordini per oggi</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Ordini Totali</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.ordiniTotali}</p>
          <p className="text-xs text-gray-400 mt-2">Nel sistema</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Clienti</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.clientiTotali}</p>
          <p className="text-xs text-gray-400 mt-2">Clienti unici</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Fatturato Oggi</h3>
          <p className="text-3xl font-bold text-gray-800">€ {stats.fatturatoOggi.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Totale di oggi</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
        <p className="text-sm">
          💡 <strong>Suggerimento:</strong> Se non vedi i dati, assicurati di essere autenticato. 
          Vai prima alla pagina <button onClick={goToOrdini} className="underline font-bold">Ordini</button> per effettuare il login.
        </p>
      </div>
    </div>
  );
};

export default DashboardRapido;