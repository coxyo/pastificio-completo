// contexts/OrdiniContext.js
'use client';

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const OrdiniContext = createContext();

export function OrdiniProvider({ children }) {
  const [ordini, setOrdini] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [offlineQueue, setOfflineQueue] = useState([]);

  // Carica ordini dalla cache al mount
  useEffect(() => {
    const loadFromCache = () => {
      try {
        const ordiniCache = localStorage.getItem('ordini');
        if (ordiniCache) {
          const parsed = JSON.parse(ordiniCache);
          setOrdini(parsed);
          console.log(`📂 Caricati ${parsed.length} ordini dalla cache`);
        }

        // Carica queue offline
        const queue = localStorage.getItem('offlineQueue');
        if (queue) {
          setOfflineQueue(JSON.parse(queue));
        }
      } catch (error) {
        console.error('Errore caricamento cache:', error);
      }
    };

    loadFromCache();
  }, []);

  // Salva ordini in cache quando cambiano
  useEffect(() => {
    if (ordini.length > 0) {
      localStorage.setItem('ordini', JSON.stringify(ordini));
      localStorage.setItem('lastUpdate', new Date().toISOString());
    }
  }, [ordini]);

  // Salva offline queue
  useEffect(() => {
    if (offlineQueue.length > 0) {
      localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
    } else {
      localStorage.removeItem('offlineQueue');
    }
  }, [offlineQueue]);

  // Aggiungi ordine alla queue offline
  const addToOfflineQueue = useCallback((action) => {
    setOfflineQueue(prev => [...prev, {
      ...action,
      timestamp: new Date().toISOString(),
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }]);
  }, []);

  // Processa queue offline quando torna online
  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;
    
    console.log(`📤 Processando ${offlineQueue.length} azioni offline...`);
    setSyncStatus('syncing');
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app';
    const token = localStorage.getItem('token');
    
    for (const action of offlineQueue) {
      try {
        let response;
        
        switch (action.type) {
          case 'create':
            response = await fetch(`${API_URL}/api/ordini`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(action.data)
            });
            break;
            
          case 'update':
            response = await fetch(`${API_URL}/api/ordini/${action.ordineId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(action.data)
            });
            break;
            
          case 'delete':
            response = await fetch(`${API_URL}/api/ordini/${action.ordineId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            break;
        }
        
        if (response && response.ok) {
          console.log(`✅ Azione ${action.type} sincronizzata`);
          // Rimuovi dall'queue
          setOfflineQueue(prev => prev.filter(a => a.id !== action.id));
        }
      } catch (error) {
        console.error(`❌ Errore sync azione ${action.type}:`, error);
      }
    }
    
    setSyncStatus('synced');
    setLastSyncTime(new Date());
  }, [offlineQueue]);

  // Monitora connessione
  useEffect(() => {
    const checkConnection = () => {
      const online = navigator.onLine;
      setIsConnected(online);
      
      if (online && offlineQueue.length > 0) {
        processOfflineQueue();
      }
    };

    // Check iniziale
    checkConnection();

    // Listeners per cambio connessione
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, [offlineQueue, processOfflineQueue]);

  // Funzione per aggiungere ordine
  const aggiungiOrdine = useCallback((ordine) => {
    const nuovoOrdine = {
      ...ordine,
      _id: ordine._id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: ordine.createdAt || new Date().toISOString(),
      _isOffline: !isConnected
    };
    
    setOrdini(prev => [nuovoOrdine, ...prev]);
    
    if (!isConnected) {
      addToOfflineQueue({
        type: 'create',
        data: ordine
      });
    }
    
    return nuovoOrdine;
  }, [isConnected, addToOfflineQueue]);

  // Funzione per aggiornare ordine
  const aggiornaOrdine = useCallback((id, updates) => {
    setOrdini(prev => prev.map(o => 
      o._id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
    ));
    
    if (!isConnected) {
      addToOfflineQueue({
        type: 'update',
        ordineId: id,
        data: updates
      });
    }
  }, [isConnected, addToOfflineQueue]);

  // Funzione per eliminare ordine
  const eliminaOrdine = useCallback((id) => {
    setOrdini(prev => prev.filter(o => o._id !== id));
    
    if (!isConnected) {
      addToOfflineQueue({
        type: 'delete',
        ordineId: id
      });
    }
  }, [isConnected, addToOfflineQueue]);

  // Funzione per sincronizzare con server
  const sincronizzaConServer = useCallback(async () => {
    setSyncStatus('syncing');
    setLoading(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app';
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token mancante');
      }
      
      const response = await fetch(`${API_URL}/api/ordini`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const ordiniServer = data.data || data;
        
        // Merge intelligente con ordini locali
        const ordiniLocali = ordini.filter(o => o._isOffline);
        const ordiniMerged = [...ordiniServer];
        
        // Aggiungi ordini offline che non sono ancora sul server
        ordiniLocali.forEach(ordineLocale => {
          if (!ordiniMerged.some(o => o._id === ordineLocale._id)) {
            ordiniMerged.push(ordineLocale);
          }
        });
        
        setOrdini(ordiniMerged);
        setIsConnected(true);
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        
        // Processa queue offline se presente
        if (offlineQueue.length > 0) {
          await processOfflineQueue();
        }
        
        return true;
      } else {
        throw new Error('Errore risposta server');
      }
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      setSyncStatus('error');
      setIsConnected(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [ordini, offlineQueue, processOfflineQueue]);

  // Calcola statistiche
  const calcolaStatistiche = useCallback(() => {
    const oggi = new Date().toDateString();
    const ordiniOggi = ordini.filter(o => {
      const dataOrdine = new Date(o.dataRitiro || o.createdAt).toDateString();
      return dataOrdine === oggi;
    });

    const totaleOggi = ordiniOggi.reduce((sum, o) => sum + (o.totale || 0), 0);
    const completati = ordiniOggi.filter(o => o.stato === 'completato').length;
    const inLavorazione = ordiniOggi.filter(o => o.stato === 'in_lavorazione').length;
    const nuovi = ordiniOggi.filter(o => o.stato === 'nuovo').length;
    const ordiniOffline = ordini.filter(o => o._isOffline).length;

    return {
      totaleOrdini: ordini.length,
      ordiniOggi: ordiniOggi.length,
      ordiniOffline,
      totaleOggi,
      completati,
      inLavorazione,
      nuovi,
      percentualeCompletamento: ordiniOggi.length > 0 ? (completati / ordiniOggi.length * 100) : 0,
      mediaOrdine: ordiniOggi.length > 0 ? (totaleOggi / ordiniOggi.length) : 0
    };
  }, [ordini]);

  const value = {
    ordini,
    setOrdini,
    aggiungiOrdine,
    aggiornaOrdine,
    eliminaOrdine,
    isConnected,
    setIsConnected,
    loading,
    setLoading,
    syncStatus,
    lastSyncTime,
    offlineQueue,
    sincronizzaConServer,
    calcolaStatistiche
  };

  return (
    <OrdiniContext.Provider value={value}>
      {children}
    </OrdiniContext.Provider>
  );
}

export function useOrdini() {
  const context = useContext(OrdiniContext);
  if (!context) {
    throw new Error('useOrdini deve essere usato dentro OrdiniProvider');
  }
  return context;
}

export default OrdiniContext;
