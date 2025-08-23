// src/components/SimpleDashboard.js
import React, { useState, useEffect } from 'react';
import authService from '@/services/authService';
import { testCredentials } from '@/utils/testAuth';

const SimpleDashboard = () => {
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

      // Controlla se siamo autenticati
      let token = authService.getToken();
      
      if (!token) {
        // Prova il login automatico con le credenziali di test
        const validCreds = await testCredentials();
        if (validCreds) {
          const loginResult = await authService.login(validCreds.email, validCreds.password);
          if (loginResult.success) {
            token = authService.getToken();
          }
        }
      }

      if (!token) {
        throw new Error('Non autenticato');
      }

      // Carica statistiche
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Prova a caricare le statistiche
      const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', { headers });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      } else if (statsResponse.status === 404) {
        // Se l'endpoint non esiste, usa dati di fallback
        const ordiniResponse = await fetch('http://localhost:5000/api/ordini', { headers });
        if (ordiniResponse.ok) {
          const ordiniData = await ordiniResponse.json();
          if (ordiniData.success) {
            const ordini = ordiniData.data || [];
            const oggi = new Date().toISOString().split('T')[0];
            const ordiniOggi = ordini.filter(o => 
              o.dataRitiro && o.dataRitiro.startsWith(oggi)
            );
            
            setStats({
              ordiniOggi: ordiniOggi.length,
              ordiniTotali: ordini.length,
              clientiTotali: new Set(ordini.map(o => o.cliente || o.nomeCliente)).size,
              fatturatoOggi: ordiniOggi.reduce((sum, o) => sum + (o.totale || 0), 0)
            });
          }
        }
      }
    } catch (err) {
      console.error('Errore dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Errore</p>
          <p>{error}</p>
          <button 
            onClick={loadDashboardData}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Pastificio</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Ordini Oggi</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.ordiniOggi}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Ordini Totali</h3>
          <p className="text-3xl font-bold text-green-600">{stats.ordiniTotali}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Clienti</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.clientiTotali}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Fatturato Oggi</h3>
          <p className="text-3xl font-bold text-orange-600">€ {stats.fatturatoOggi.toFixed(2)}</p>
        </div>
      </div>

      <button 
        onClick={loadDashboardData}
        className="mt-6 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        Aggiorna Dati
      </button>
    </div>
  );
};

export default SimpleDashboard;