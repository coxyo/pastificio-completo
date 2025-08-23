'use client'; // Questa direttiva è cruciale!

import React, { useState, useEffect } from 'react';
import GestoreOrdini from './GestoreOrdini';
import ConfigurazionePannello from './ConfigurazionePannello';
import SistemaLogAudit from './SistemaLogAudit';
import SistemaStampe from './SistemaStampe';
import { LoggingService } from '../services/loggingService';

export default function TestComponents() {
  const [activeTab, setActiveTab] = useState('gestoreOrdini');
  const [ordini, setOrdini] = useState([]);
  
  // Log che la pagina è stata caricata
  useEffect(() => {
    LoggingService.info('Pagina di test caricata', { timestamp: new Date().toISOString() });
    
    // Carica alcuni ordini di esempio
    if (typeof window !== 'undefined') {
      const ordiniSalvati = localStorage.getItem('ordini');
      if (ordiniSalvati) {
        setOrdini(JSON.parse(ordiniSalvati));
      }
    }
  }, []);
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Componenti Pastificio</h1>
      
      <div className="flex flex-wrap space-x-2 mb-4">
        <button 
          className={`px-4 py-2 rounded mb-2 ${activeTab === 'gestoreOrdini' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('gestoreOrdini')}
        >
          Gestore Ordini
        </button>
        <button 
          className={`px-4 py-2 rounded mb-2 ${activeTab === 'configurazione' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('configurazione')}
        >
          Configurazione
        </button>
        <button 
          className={`px-4 py-2 rounded mb-2 ${activeTab === 'logAudit' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('logAudit')}
        >
          Log & Audit
        </button>
        <button 
          className={`px-4 py-2 rounded mb-2 ${activeTab === 'stampe' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('stampe')}
        >
          Stampe
        </button>
      </div>
      
      <div className="mt-4">
        {activeTab === 'gestoreOrdini' && <GestoreOrdini />}
        {activeTab === 'configurazione' && <ConfigurazionePannello />}
        {activeTab === 'logAudit' && <SistemaLogAudit />}
        {activeTab === 'stampe' && <SistemaStampe ordini={ordini} />}
      </div>
    </div>
  );
}