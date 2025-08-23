// src/components/DashboardFunzionante.js
import React, { useState, useEffect } from 'react';
import authManager from '@/services/authManager';

const DashboardFunzionante = () => {
  const [stats, setStats] = useState({
    ordiniOggi: 0,
    ordiniTotali: 0,
    clientiTotali: 0,
    fatturatoOggi: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prima pulisci qualsiasi token di test
      const testToken = localStorage.getItem('token');
      if (testToken === 'testuser' || (testToken && testToken.includes('test'))) {
        console.log('Rimuovo token di test invalido');
        authManager.clearAuth();
      }

      // Verifica autenticazione
      if (!authManager.isAuthenticated()) {
        console.log('Non autenticato, provo login automatico...');
        const loginResult = await authManager.freshLogin();
        
        if (!loginResult.success) {
          setNeedsAuth(true);
          setError('Devi prima autenticarti dalla pagina Ordini');
          return;
        }
      }

      // Carica i dati
      await loadDashboardData();
      
    } catch (err) {
      console.error('Errore inizializzazione:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await authManager.authenticatedFetch('http://localhost:5000/api/ordini');
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token invalido, riprova login
          console.log('Token invalido, riprovo login...');
          authManager.clearAuth();
          const loginResult = await authManager.freshLogin();
          
          if (loginResult.success) {
            // Riprova a caricare i dati
            return loadDashboardData();
          } else {
            throw new Error('Autenticazione fallita');
          }
        }
        throw new Error(`Errore ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const ordini = data.data || [];
        const oggi = new Date().toISOString().split('T')[0];
        
        // Calcola statistiche
        const ordiniOggi = ordini.filter(o => {
          if (o.dataRitiro) {
            const dataOrdine = new Date(o.dataRitiro).toISOString().split('T')[0];
            return dataOrdine === oggi;
          }
          return false;
        });
        
        const clientiSet = new Set();
        let fatturatoOggi = 0;
        
        ordini.forEach(ordine => {
          const cliente = ordine.cliente || ordine.nomeCliente || ordine.clienteNome;
          if (cliente) clientiSet.add(cliente);
          
          if (ordine.dataRitiro) {
            const dataOrdine = new Date(ordine.dataRitiro).toISOString().split('T')[0];
            if (dataOrdine === oggi) {
              fatturatoOggi += ordine.totale || ordine.totaleOrdine || 0;
            }
          }
        });
        
        setStats({
          ordiniOggi: ordiniOggi.length,
          ordiniTotali: ordini.length,
          clientiTotali: clientiSet.size,
          fatturatoOggi: fatturatoOggi
        });
        
        setError(null);
      }
    } catch (err) {
      console.error('Errore caricamento dati:', err);
      throw err;
    }
  };

  const handleRetry = async () => {
    await initializeDashboard();
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

  if (needsAuth || error) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">⚠️</span>
            <h3 className="font-bold text-lg">Attenzione</h3>
          </div>
          <p className="mb-4">{error || 'Non sei autenticato'}</p>
          <div className="flex gap-3">
            <a 
              href="/ordini"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Vai agli Ordini
            </a>
            <button 
              onClick={handleRetry}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
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
            onClick={loadDashboardData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <span>↻</span> Aggiorna
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Ordini Oggi</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.ordiniOggi}</p>
            <p className="text-xs text-gray-400 mt-2">Da completare oggi</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Ordini Totali</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.ordiniTotali}</p>
            <p className="text-xs text-gray-400 mt-2">Nel sistema</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border-l-4 border-purple-500">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Clienti</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.clientiTotali}</p>
            <p className="text-xs text-gray-400 mt-2">Clienti unici</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border-l-4 border-orange-500">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Fatturato Oggi</h3>
            <p className="text-3xl font-bold text-gray-800">€ {stats.fatturatoOggi.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-2">Totale di oggi</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFunzionante;