// hooks/useIncomingCall.js - v3.0 - 18/01/2026 ore 05:40
// ✅ FIX SSR DEFINITIVO: Hook completamente SSR-safe
// ✅ ZERO accessi a window/document/localStorage durante SSR
// ✅ Import dinamico Pusher protetto
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

export default function useIncomingCall() {
  // ✅ Stati base (SSR-safe)
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pusherService, setPusherService] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const lastCallIdRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  // ✅ Detect client-side mount
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
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
      
      console.log('[useIncomingCall] ✅ Chiamata salvata');
    } catch (error) {
      console.error('[useIncomingCall] Errore salvataggio:', error);
    }
  }, [isMounted]);

  // ✅ Handler chiamate in arrivo
  const handleIncomingCall = useCallback((callData) => {
    if (!isMounted) return;

    console.log('[useIncomingCall] 📞 Chiamata ricevuta:', callData.numero);
    
    const chiamataId = `${callData.numero}_${callData.timestamp}`;
    const now = Date.now();
    
    // Anti-duplicazione
    if (lastCallIdRef.current?.id === chiamataId && 
        now - lastCallIdRef.current.time < 2000) {
      console.log('[useIncomingCall] ⏭️ Duplicato ignorato');
      return;
    }
    
    lastCallIdRef.current = { id: chiamataId, time: now };
    
    // Auto-reset dopo 30s
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
  }, [isMounted, salvaChiamataLocale]);

  // ✅ Inizializzazione Pusher (SOLO client-side)
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;

    console.log('[useIncomingCall] 🚀 Init Pusher (client-side)');

    let pusher, channel, cleanupFn;

    // Import dinamico Pusher
    import('@/services/pusherService')
      .then((module) => {
        const service = module.default;
        setPusherService(service);

        // Check connessione ogni 2s
        const checkConnection = () => {
          const status = service.getStatus();
          setConnected(status.connected && status.channelSubscribed);
        };

        checkConnection();
        const interval = setInterval(checkConnection, 2000);

        // Setup listener Pusher
        const setupListener = () => {
          const status = service.getStatus();
          if (status.connected && status.channelSubscribed) {
            console.log('[useIncomingCall] ✅ Pusher connesso');
            service.onIncomingCall((data) => {
              handleIncomingCall(data);
            });
            return true;
          }
          return false;
        };

        // Retry setup se non pronto
        if (!setupListener()) {
          const retryInterval = setInterval(() => {
            if (setupListener()) {
              clearInterval(retryInterval);
            }
          }, 1000);
          
          setTimeout(() => clearInterval(retryInterval), 30000);
        }

        // Event listener per eventi custom
        const customEventHandler = (event) => {
          handleIncomingCall(event.detail);
        };
        
        window.addEventListener('pusher-incoming-call', customEventHandler);

        cleanupFn = () => {
          clearInterval(interval);
          window.removeEventListener('pusher-incoming-call', customEventHandler);
        };
      })
      .catch((err) => {
        console.error('[useIncomingCall] ❌ Errore Pusher:', err);
      });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [isMounted, handleIncomingCall]);

  // ✅ Handler chiusura popup
  const handleClosePopup = useCallback(() => {
    if (!isMounted || typeof window === 'undefined') return;

    console.log('[useIncomingCall] ❌ Popup chiuso (ignorata)');
    
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
        console.error('Errore update status:', error);
      }
    }
    
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
        console.error('Errore update status:', error);
      }
    }
    
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    setIsPopupOpen(false);
    
    // Reset chiamata dopo 10s
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
      console.error('Errore lettura storico:', error);
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

  // ✅ Return (SSR-safe: tutti i valori sono definiti)
  return {
    chiamataCorrente,
    isPopupOpen,
    handleClosePopup,
    handleAcceptCall,
    clearChiamata,
    connected,
    pusherService,
    getStoricoChiamateLocale,
    isMounted // ✅ Esposto per debug
  };
}