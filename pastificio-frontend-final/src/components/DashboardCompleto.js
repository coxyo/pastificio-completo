// src/components/DashboardCompleto.js
import React, { useState, useEffect } from 'react';

const DashboardCompleto = () => {
  const [stats, setStats] = useState({
    ordiniOggi: 0,
    ordiniTotali: 0,
    clientiTotali: 0,
    fatturatoOggi: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Controlla se c'è un token salvato
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        setIsAuthenticated(false);
        setError('Non sei autenticato. Vai prima alla pagina Ordini.');
        setLoading(false);
        return;
      }

      // Prova a usare il token esistente
      const testResponse = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Se il test fallisce, prova con gli ordini
      if (!testResponse.ok) {
        const ordiniResponse = await fetch('http://localhost:5000/api/ordini', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!ordiniResponse.ok) {
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setError('Token scaduto. Vai alla pagina Ordini per riautenticarti.');
          return;
        }

        // Token valido, carica i dati
        const ordiniData = await ordiniResponse.json();
        processOrdiniData(ordiniData);
        setIsAuthenticated(true);
      } else {
        // Token valido, carica i dati degli ordini
        const ordiniResponse = await fetch('http://localhost:5000/api/ordini', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (ordiniResponse.ok) {
          const ordiniData = await ordiniResponse.json();
          processOrdiniData(ordiniData);
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.error('Errore dashboard:', err);
      setError('Errore nel caricamento dei dati: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const processOrdiniData = (ordiniData) => {
    if (ordiniData.success) {
      const ordini = ordiniData.data || [];
      const oggi = new Date().toISOString().split('T')[0];
      
      // Filtra ordini di oggi
      const ordiniOggi = ordini.filter(o => {
        if (o.dataRitiro) {
          const dataOrdine = new Date(o.dataRitiro).toISOString().split('T')[0];
          return dataOrdine === oggi;
        }
        return false;
      });
      
      // Calcola statistiche
      const clientiSet = new Set();
      let fatturatoTotaleOggi = 0;
      
      ordini.forEach(ordine => {
        // Aggiungi cliente al set
        const clienteNome = ordine.cliente || ordine.nomeCliente || ordine.clienteNome;
        if (clienteNome) clientiSet.add(clienteNome);
        
        // Calcola fatturato di oggi
        if (ordine.dataRitiro) {
          const dataOrdine = new Date(ordine.dataRitiro).toISOString().split('T')[0];
          if (dataOrdine === oggi) {
            fatturatoTotaleOggi += ordine.totale || ordine.totaleOrdine || 0;
          }
        }
      });
      
      setStats({
        ordiniOggi: ordiniOggi.length,
        ordiniTotali: ordini.length,
        clientiTotali: clientiSet.size,
        fatturatoOggi: fatturatoTotaleOggi
      });
    }
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

  if (!isAuthenticated && error) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">⚠️</span>
            <h3 className="font-bold text-lg">Attenzione</h3>
          </div>
          <p className="mb-4">{error}</p>
          <div className="flex gap-3">
            <a 
              href="/ordini"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
            >
              Vai agli Ordini
            </a>
            <button 
              onClick={checkAuthAndLoadData}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Pastificio</h1>
            <p className="text-gray-600 mt-1">Panoramica delle attività</p>
          </div>
          <button 
            onClick={checkAuthAndLoadData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 transition"
          >
            <span className="text-xl">↻</span> Aggiorna
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm font-medium">Ordini Oggi</h3>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.ordiniOggi}</p>
            <p className="text-xs text-gray-400 mt-2">Da completare oggi</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm font-medium">Ordini Totali</h3>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.ordiniTotali}</p>
            <p className="text-xs text-gray-400 mt-2">Nel sistema</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm font-medium">Clienti</h3>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.clientiTotali}</p>
            <p className="text-xs text-gray-400 mt-2">Clienti unici</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm font-medium">Fatturato Oggi</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">€ {stats.fatturatoOggi.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-2">Totale di oggi</p>
          </div>
        </div>

        {stats.ordiniTotali === 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-lg">
            <p className="text-sm">
              📝 <strong>Nessun ordine presente.</strong> Vai alla sezione 
              <a href="/ordini" className="underline font-bold ml-1">Ordini</a> per aggiungere il primo ordine.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCompleto;