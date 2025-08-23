'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

const OrdiniContext = createContext();

export function OrdiniProvider({ children }) {
  const [ordini, setOrdini] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carica ordini dalla cache al mount
  useEffect(() => {
    const ordiniCache = localStorage.getItem('ordini');
    if (ordiniCache) {
      try {
        setOrdini(JSON.parse(ordiniCache));
      } catch (error) {
        console.error('Errore caricamento cache ordini:', error);
      }
    }
  }, []);

  // Salva ordini in cache quando cambiano
  useEffect(() => {
    if (ordini.length > 0) {
      localStorage.setItem('ordini', JSON.stringify(ordini));
    }
  }, [ordini]);

  return (
    <OrdiniContext.Provider value={{
      ordini,
      setOrdini,
      isConnected,
      setIsConnected,
      loading,
      setLoading
    }}>
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