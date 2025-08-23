// src/components/DashboardFinale.js
import React, { useState, useEffect } from 'react';

const DashboardFinale = () => {
  const [stats, setStats] = useState({
    ordiniOggi: 0,
    ordiniTotali: 0,
    clientiTotali: 0,
    fatturatoOggi: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prendi il token dal localStorage
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      setDebugInfo(`Token presente: ${token ? 'Sì' : 'No'}`);
      
      if (!token) {
        throw new Error('Token non trovato. Vai a /setup per configurare.');
      }

      // Carica gli ordini
      const response = await fetch('http://localhost:5000/api/ordini', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore response:', errorText);
        throw new Error(`Errore ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Dati ricevuti:', data);
      
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
          // Gestisci diversi nomi di campo per il cliente
          const cliente = ordine.cliente || ordine.nomeCliente || ordine.clienteNome;
          if (cliente) clientiSet.add(cliente);
          
          // Calcola fatturato
          if (ordine.dataRitiro) {
            const dataOrdine = new Date(ordine.dataRitiro).toISOString().split('T')[0];
            if (dataOrdine === oggi) {
              const totale = ordine.totale || ordine.totaleOrdine || ordine.importoTotale || 0;
              fatturatoOggi += totale;
            }
          }
        });
        
        setStats({
          ordiniOggi: ordiniOggi.length,
          ordiniTotali: ordini.length,
          clientiTotali: clientiSet.size,
          fatturatoOggi: fatturatoOggi
        });
        
        setDebugInfo(`Caricati ${ordini.length} ordini totali`);
      } else {
        throw new Error(data.error || 'Errore nel caricamento dati');
      }
    } catch (err) {
      console.error('Errore dashboard:', err);
      setError(err.message);
      setDebugInfo(`Errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Errore nel caricamento</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-2 text-xs text-gray-600">{debugInfo}</p>
                </div>
                <div className="mt-4 space-x-2">
                  <button 
                    onClick={loadDashboardData}
                    className="bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200"
                  >
                    Riprova
                  </button>
                  <a 
                    href="/setup"
                    className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Vai al Setup
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Pastificio</h1>
          <p className="mt-1 text-sm text-gray-600">Panoramica delle attività - {new Date().toLocaleDateString('it-IT')}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card Ordini Oggi */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Ordini Oggi</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{stats.ordiniOggi}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-blue-700">Da completare oggi</span>
              </div>
            </div>
          </div>

          {/* Card Ordini Totali */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Ordini Totali</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{stats.ordiniTotali}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-green-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-700">Nel sistema</span>
              </div>
            </div>
          </div>

          {/* Card Clienti */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Clienti</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{stats.clientiTotali}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-purple-700">Clienti unici</span>
              </div>
            </div>
          </div>

          {/* Card Fatturato */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Fatturato Oggi</dt>
                    <dd className="text-3xl font-semibold text-gray-900">€ {stats.fatturatoOggi.toFixed(2)}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-orange-700">Totale di oggi</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button 
            onClick={loadDashboardData}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Aggiorna Dati
          </button>
          
          <div className="text-sm text-gray-500">
            {debugInfo}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFinale;