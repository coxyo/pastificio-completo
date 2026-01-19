// hooks/useIncomingCall.js - v3.1 FINAL - 19/01/2026
// ✅ Hook completamente SSR-safe
// ✅ Export default + named export per compatibilità
// ✅ ZERO errori "Cannot access X before initialization"
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

function useIncomingCall() {
  // ✅ Stati base (SSR-safe - tutti hanno valori iniziali)
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pusherService, setPusherService] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // ✅ Refs (SSR-safe)
  const lastCallIdRef = useRef(null);
  const resetTimeoutRef = useRef(null);
  const pusherCleanupRef = useRef(null);

  // ✅ Detect client-side mount
  useEffect(() => {
    setIsMounted(true);
    console.log('[useIncomingCall] ✅ Hook montato');
    return () => {
      setIsMounted(false);
      console.log('[useIncomingCall] 🔴 Hook smontato');
    };
  }, []);

  // ✅ Salvataggio localStorage (SOLO client-side)
  const salvaChiamataLocale = useCallback((callData) => {
    if (!isMounted || typeof window === 'undefined') return;

    try {
      const storageKey = 'pastificio_chiamate_recenti';
      const esistenti = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      const nuova = {
        ...callData,
        id: `${callData.numero}_${Date.now()}`,
        savedAt: new Date().toISOString(),
        status: 'ricevuta'
      };
      
      const aggiornate = [nuova, ...esistenti].slice(0, 50);
      localStorage.setItem(storageKey, JSON.stringify(aggiornate));
      
      console.log('[useIncomingCall] ✅ Chiamata salvata in localStorage');
    } catch (error) {
      console.error('[useIncomingCall] ❌ Errore salvataggio:', error);
    }
  }, [isMounted]);

  // ✅ Handler chiamate in arrivo (memoizzato)
  const handleIncomingCall = useCallback((callData) => {
    if (!isMounted) {
      console.log('[useIncomingCall] ⚠️ Ignorato: hook non montato');
      return;
    }

    console.log('[useIncomingCall] 📞 Chiamata ricevuta:', callData?.numero);
    
    if (!callData || !callData.numero) {
      console.log('[useIncomingCall] ⚠️ Dati chiamata invalidi');
      return;
    }
    
    const chiamataId = `${callData.numero}_${callData.timestamp || Date.now()}`;
    const now = Date.now();
    
    // Anti-duplicazione (2 secondi)
    if (lastCallIdRef.current?.id === chiamataId && 
        now - lastCallIdRef.current.time < 2000) {
      console.log('[useIncomingCall] ⭕ Duplicato ignorato');
      return;
    }
    
    lastCallIdRef.current = { id: chiamataId, time: now };
    
    // Auto-reset ref dopo 30s
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = setTimeout(() => {
      lastCallIdRef.current = null;
    }, 30000);
    
    // Salva e mostra popup
    salvaChiamataLocale(callData);
    setChiamataCorrente(callData);
    setIsPopupOpen(true);
    
    console.log('[useIncomingCall] ✅ Popup aperto');
  }, [isMounted, salvaChiamataLocale]);

  // ✅ Inizializzazione Pusher (SOLO client-side)
  useEffect(() => {
    // Guard SSR
    if (!isMounted || typeof window === 'undefined') {
      return;
    }

    console.log('[useIncomingCall] 🚀 Inizializzazione Pusher...');

    let intervalId = null;
    let retryIntervalId = null;

    // Import dinamico Pusher (evita errori SSR)
    import('@/services/pusherService')
      .then((module) => {
        if (!isMounted) return; // Check se ancora montato
        
        const service = module.default;
        setPusherService(service);
        console.log('[useIncomingCall] ✅ pusherService caricato');

        // Check connessione ogni 2s
        const checkConnection = () => {
          try {
            const status = service.getStatus();
            setConnected(status.connected && status.channelSubscribed);
          } catch (e) {
            setConnected(false);
          }
        };

        checkConnection();
        intervalId = setInterval(checkConnection, 2000);

        // Setup listener Pusher
        const setupListener = () => {
          try {
            const status = service.getStatus();
            if (status.connected && status.channelSubscribed) {
              console.log('[useIncomingCall] ✅ Pusher connesso, registro listener');
              service.onIncomingCall((data) => {
                console.log('[useIncomingCall] 📡 Evento Pusher ricevuto');
                handleIncomingCall(data);
              });
              return true;
            }
          } catch (e) {
            console.error('[useIncomingCall] ❌ Errore setup listener:', e);
          }
          return false;
        };

        // Retry setup se non pronto
        if (!setupListener()) {
          console.log('[useIncomingCall] ⏳ Pusher non pronto, retry...');
          retryIntervalId = setInterval(() => {
            if (setupListener()) {
              clearInterval(retryIntervalId);
              retryIntervalId = null;
            }
          }, 1000);
          
          // Stop retry dopo 30s
          setTimeout(() => {
            if (retryIntervalId) {
              clearInterval(retryIntervalId);
              retryIntervalId = null;
              console.log('[useIncomingCall] ⚠️ Timeout connessione Pusher');
            }
          }, 30000);
        }

        // Event listener per eventi custom (backup)
        const customEventHandler = (event) => {
          console.log('[useIncomingCall] 📡 Evento custom ricevuto');
          handleIncomingCall(event.detail);
        };
        
        window.addEventListener('pusher-incoming-call', customEventHandler);

        // Salva cleanup function
        pusherCleanupRef.current = () => {
          console.log('[useIncomingCall] 🧹 Cleanup Pusher');
          if (intervalId) clearInterval(intervalId);
          if (retryIntervalId) clearInterval(retryIntervalId);
          window.removeEventListener('pusher-incoming-call', customEventHandler);
        };
      })
      .catch((err) => {
        console.error('[useIncomingCall] ❌ Errore caricamento Pusher:', err);
        setConnected(false);
      });

    // Cleanup
    return () => {
      if (pusherCleanupRef.current) {
        pusherCleanupRef.current();
      }
    };
  }, [isMounted, handleIncomingCall]);

  // ✅ Handler chiusura popup
  const handleClosePopup = useCallback(() => {
    if (!isMounted || typeof window === 'undefined') return;

    console.log('[useIncomingCall] ❌ Popup chiuso (ignorata)');
    
    // Aggiorna status in localStorage
    if (chiamataCorrente) {
      try {
        const storageKey = 'pastificio_chiamate_recenti';
        const chiamate = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const aggiornate = chiamate.map(c => {
          if (c.numero === chiamataCorrente.numero && c.status === 'ricevuta') {
            return { ...c, status: 'ignorata', closedAt: new Date().toISOString() };
          }
          return c;
        });
        localStorage.setItem(storageKey, JSON.stringify(aggiornate));
      } catch (error) {
        console.error('[useIncomingCall] Errore update status:', error);
      }
    }
    
    // Clear timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    setIsPopupOpen(false);
    setChiamataCorrente(null);
  }, [isMounted, chiamataCorrente]);

  // ✅ Handler accettazione chiamata
  const handleAcceptCall = useCallback(() => {
    if (!isMounted || typeof window === 'undefined') return;

    console.log('[useIncomingCall] ✅ Chiamata accettata');
    
    // Aggiorna status in localStorage
    if (chiamataCorrente) {
      try {
        const storageKey = 'pastificio_chiamate_recenti';
        const chiamate = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const aggiornate = chiamate.map(c => {
          if (c.numero === chiamataCorrente.numero && c.status === 'ricevuta') {
            return { ...c, status: 'accettata', acceptedAt: new Date().toISOString() };
          }
          return c;
        });
        localStorage.setItem(storageKey, JSON.stringify(aggiornate));
      } catch (error) {
        console.error('[useIncomingCall] Errore update status:', error);
      }
    }
    
    // Clear timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    setIsPopupOpen(false);
    
    // Reset chiamata dopo 10s (per permettere a GestoreOrdini di usarla)
    resetTimeoutRef.current = setTimeout(() => {
      setChiamataCorrente(null);
    }, 10000);
  }, [isMounted, chiamataCorrente]);

  // ✅ Clear chiamata manuale
  const clearChiamata = useCallback(() => {
    if (!isMounted) return;

    console.log('[useIncomingCall] 🧹 Clear chiamata');
    
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    setChiamataCorrente(null);
    setIsPopupOpen(false);
  }, [isMounted]);

  // ✅ Getter storico chiamate
  const getStoricoChiamateLocale = useCallback(() => {
    if (!isMounted || typeof window === 'undefined') return [];

    try {
      const storageKey = 'pastificio_chiamate_recenti';
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      console.error('[useIncomingCall] Errore lettura storico:', error);
      return [];
    }
  }, [isMounted]);

  // ✅ Cleanup finale
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Return oggetto con tutti i valori (sempre definiti per SSR)
  return {
    chiamataCorrente,
    isPopupOpen,
    handleClosePopup,
    handleAcceptCall,
    clearChiamata,
    connected,
    pusherService,
    getStoricoChiamateLocale,
    isMounted
  };
}

// ✅ Export default E named per massima compatibilità
export default useIncomingCall;
export { useIncomingCall };