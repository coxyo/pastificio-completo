// hooks/useIncomingCall.js - v2.1 - 15/01/2026 ore 06:15
// ✅ FIX: Pulizia popup persistente al mount
// ✅ FIX: Salvataggio DB disabilitato (errori CORS)
// ✅ FIX: Solo localStorage per storico chiamate
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

export default function useIncomingCall() {
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pusherService, setPusherService] = useState(null);
  
  const lastCallIdRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  // ✅ FIX 15/01/2026: Pulizia popup persistente al mount
  useEffect(() => {
    console.log('[useIncomingCall] 🧹 Pulizia popup persistente al caricamento');
    
    // Resetta stato se ci sono popup fantasma
    setIsPopupOpen(false);
    setChiamataCorrente(null);
    
    // Pulisci eventuali timeout appesi
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []); // Solo al mount

  useEffect(() => {
    console.log('[useIncomingCall] STATE UPDATE:');
    console.log('  - chiamataCorrente:', chiamataCorrente?.numero || null);
    console.log('  - isPopupOpen:', isPopupOpen);
    console.log('  - connected:', connected);
  }, [chiamataCorrente, isPopupOpen, connected]);

  // ✅ FIX 15/01/2026: Salvataggio DB disabilitato temporaneamente (causa errori CORS)
  // Riattivare quando backend Railway è stabile
  const salvaChiamataDB = useCallback(async (callData) => {
    // DISABILITATO: causa errori CORS continui
    console.log('[useIncomingCall] ℹ️ Salvataggio DB disabilitato (solo localStorage)');
    return;
    
    /* CODICE ORIGINALE - DISABILITATO
    try {
      const response = await fetch(`${API_URL}/chiamate/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'pastificio-chiamate-2025'
        },
        body: JSON.stringify({
          numero: callData.numero,
          timestamp: callData.timestamp || new Date().toISOString(),
          callId: `call_${Date.now()}`,
          cliente: callData.cliente || null,
          clienteTrovato: !!callData.cliente
        })
      });
      
      if (response.ok) {
        console.log('OK [useIncomingCall] Chiamata salvata nel database');
      } else {
        console.warn('WARN [useIncomingCall] Errore salvataggio chiamata:', response.status);
      }
    } catch (error) {
      console.error('ERROR [useIncomingCall] Errore salvataggio chiamata:', error);
    }
    */
  }, []);

  const salvaChiamataLocale = useCallback((callData) => {
    try {
      const storageKey = 'pastificio_chiamate_recenti';
      const chiamateEsistenti = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      const nuovaChiamata = {
        ...callData,
        id: `${callData.numero}_${Date.now()}`,
        savedAt: new Date().toISOString(),
        status: 'ricevuta'
      };
      
      const chiamateAggiornate = [nuovaChiamata, ...chiamateEsistenti].slice(0, 50);
      localStorage.setItem(storageKey, JSON.stringify(chiamateAggiornate));
      
      console.log('OK [useIncomingCall] Chiamata salvata in localStorage');
    } catch (error) {
      console.error('ERROR [useIncomingCall] Errore salvataggio locale:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('INIT [useIncomingCall] Inizializzazione...');

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('FOCUS [useIncomingCall] Tab visibile, verifico Pusher...');
        
        if (pusherService && pusherService.getStatus) {
          const status = pusherService.getStatus();
          console.log('Stato Pusher al focus:', status);
          
          if (!status.connected) {
            console.warn('WARN Pusher disconnesso, tento riconnessione...');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    import('@/services/pusherService').then((module) => {
      const service = module.default;
      console.log('OK [useIncomingCall] pusherService importato');
      
      setPusherService(service);

      const checkConnection = () => {
        const status = service.getStatus();
        setConnected(status.connected && status.channelSubscribed);
      };

      checkConnection();
      const interval = setInterval(checkConnection, 2000);

      const handleIncomingCall = (event) => {
        const callData = event.detail;
        
        console.log('CALL [useIncomingCall] Evento ricevuto:', callData);
        
        const chiamataUniqueId = `${callData.numero}_${callData.timestamp}`;
        const now = Date.now();
        
        if (lastCallIdRef.current?.id === chiamataUniqueId && 
            now - lastCallIdRef.current.time < 2000) {
          console.log('SKIP [useIncomingCall] Evento duplicato ignorato');
          return;
        }
        
        lastCallIdRef.current = {
          id: chiamataUniqueId,
          time: now
        };
        
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
        resetTimeoutRef.current = setTimeout(() => {
          if (lastCallIdRef.current?.id === chiamataUniqueId) {
            console.log('RESET [useIncomingCall] Reset lastCallId dopo 30s');
            lastCallIdRef.current = null;
          }
        }, 30000);
        
        salvaChiamataLocale(callData);
        salvaChiamataDB(callData);
        
        setChiamataCorrente(callData);
        setIsPopupOpen(true);
        
        console.log('OK [useIncomingCall] Popup aperto per:', callData.numero);
      };

      window.addEventListener('pusher-incoming-call', handleIncomingCall);

      const setupPusherListener = () => {
        const status = service.getStatus();
        if (status.connected && status.channelSubscribed) {
          console.log('OK [useIncomingCall] Registro listener Pusher');
          service.onIncomingCall((data) => {
            console.log('PUSHER [useIncomingCall] Chiamata Pusher:', data);
            handleIncomingCall({ detail: data });
          });
          return true;
        }
        return false;
      };

      if (!setupPusherListener()) {
        console.log('WAIT [useIncomingCall] Pusher non ancora pronto, attendo...');
        
        const retryInterval = setInterval(() => {
          if (setupPusherListener()) {
            clearInterval(retryInterval);
          }
        }, 1000);

        setTimeout(() => clearInterval(retryInterval), 30000);
      }

      return () => {
        clearInterval(interval);
        window.removeEventListener('pusher-incoming-call', handleIncomingCall);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    });
  }, [salvaChiamataDB, salvaChiamataLocale]);

  const handleClosePopup = useCallback(() => {
    console.log('CLOSE [useIncomingCall] Chiusura popup (Ignora)');
    
    if (chiamataCorrente) {
      try {
        const storageKey = 'pastificio_chiamate_recenti';
        const chiamate = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const chiamateAggiornate = chiamate.map(c => {
          if (c.numero === chiamataCorrente.numero && c.status === 'ricevuta') {
            return { ...c, status: 'ignorata', closedAt: new Date().toISOString() };
          }
          return c;
        });
        localStorage.setItem(storageKey, JSON.stringify(chiamateAggiornate));
      } catch (error) {
        console.error('Errore aggiornamento status:', error);
      }
    }
    
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    setIsPopupOpen(false);
    setChiamataCorrente(null);
    
    console.log('OK [useIncomingCall] Popup chiuso');
  }, [chiamataCorrente]);

  const handleAcceptCall = useCallback(() => {
    console.log('ACCEPT [useIncomingCall] Chiamata accettata');
    
    if (chiamataCorrente) {
      try {
        const storageKey = 'pastificio_chiamate_recenti';
        const chiamate = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const chiamateAggiornate = chiamate.map(c => {
          if (c.numero === chiamataCorrente.numero && c.status === 'ricevuta') {
            return { ...c, status: 'accettata', acceptedAt: new Date().toISOString() };
          }
          return c;
        });
        localStorage.setItem(storageKey, JSON.stringify(chiamateAggiornate));
      } catch (error) {
        console.error('Errore aggiornamento status:', error);
      }
    }
    
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    setIsPopupOpen(false);
    
    resetTimeoutRef.current = setTimeout(() => {
      console.log('CLEANUP [useIncomingCall] Auto-reset chiamataCorrente dopo accettazione');
      setChiamataCorrente(null);
    }, 10000);
    
    console.log('OK [useIncomingCall] Popup chiuso, dati mantenuti per 10s');
  }, [chiamataCorrente]);

  const clearChiamata = useCallback(() => {
    console.log('CLEAR [useIncomingCall] Clear chiamata manuale');
    
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    setChiamataCorrente(null);
    setIsPopupOpen(false);
  }, []);

  const getStoricoChiamateLocale = useCallback(() => {
    try {
      const storageKey = 'pastificio_chiamate_recenti';
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      console.error('Errore lettura storico:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  return {
    chiamataCorrente,
    isPopupOpen,
    handleClosePopup,
    handleAcceptCall,
    clearChiamata,
    connected,
    pusherService,
    getStoricoChiamateLocale
  };
}