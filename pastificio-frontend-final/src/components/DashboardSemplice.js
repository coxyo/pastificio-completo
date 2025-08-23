// src/components/DashboardSemplice.js
import React, { useState, useEffect } from 'react';

const DashboardSemplice = () => {
  const [stats, setStats] = useState({
    ordiniOggi: 0,
    ordiniTotali: 0,
    clientiTotali: 0,
    fatturatoOggi: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token || token === 'testuser') {
        setError('Non autenticato. Vai a /setup per configurare.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/ordini', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const ordini = data.data || [];
        const oggi = new Date().toISOString().split('T')[0];
        
        const ordiniOggi = ordini.filter(o => {
          if (o.dataRitiro) {
            return o.dataRitiro.split('T')[0] === oggi;
          }
          return false;
        });
        
        const clientiSet = new Set();
        let fatturatoOggi = 0;
        
        ordini.forEach(ordine => {
          const cliente = ordine.cliente || ordine.nomeCliente;
          if (cliente) clientiSet.add(cliente);
          
          if (ordine.dataRitiro && ordine.dataRitiro.split('T')[0] === oggi) {
            fatturatoOggi += ordine.totale || 0;
          }
        });
        
        setStats({
          ordiniOggi: ordiniOggi.length,
          ordiniTotali: ordini.length,
          clientiTotali: clientiSet.size,
          fatturatoOggi: fatturatoOggi
        });
      }
    } catch (err) {
      console.error('Errore:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Errore</p>
          <p>{error}</p>
          <div className="mt-4">
            <a href="/setup" className="bg-blue-500 text-white px-4 py-2 rounded inline-block">
              Vai al Setup
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Pastificio</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">Ordini Oggi</h3>
          <p className="text-3xl font-bold">{stats.ordiniOggi}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Ordini Totali</h3>
          <p className="text-3xl font-bold">{stats.ordiniTotali}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">Clienti</h3>
          <p className="text-3xl font-bold">{stats.clientiTotali}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm">Fatturato Oggi</h3>
          <p className="text-3xl font-bold">€ {stats.fatturatoOggi.toFixed(2)}</p>
        </div>
      </div>
      
      <button 
        onClick={loadData}
        className="mt-6 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        Aggiorna
      </button>
    </div>
  );
};

export default DashboardSemplice;