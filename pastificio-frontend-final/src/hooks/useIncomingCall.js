// hooks/useIncomingCall.js - v2.2 - 17/01/2026 ore 18:45
// ✅ FIX SSR: Pusher importato solo nel browser
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
    // ✅ FIX SSR: Esegui SOLO nel browser
    if (typeof window === 'undefined') {
      console.log('⚠️ [useIncomingCall] SSR rilevato, skip pulizia');
      return;
    }

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

  // ✅ Log stati (solo nel browser)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[useIncomingCall] STATE UPDATE:');
    console.log('  - chiamataCorrente:', chiamataCorrente?.numero || null);
    console.log('  - isPopupOpen:', isPopupOpen);
    console.log('  - connected:', connected);
  }, [chiamataCorrente, isPopupOpen, connected]);

  // ✅ FIX 15/01/2026: Salvataggio DB disabilitato temporaneamente (causa errori CORS)
  const salvaChiamataDB = useCallback(async (callData) => {
    // DISABILITATO: causa errori CORS continui
    console.log('[useIncomingCall] ℹ️ Salvataggio DB disabilitato (solo localStorage)');
    return;
  }, []);

  // ✅ Salvataggio locale chiamate
  const salvaChiamataLocale = useCallback((callData) => {
    if (typeof window === 'undefined') return;

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

  // ✅ Main effect - Inizializzazione Pusher
  useEffect(() => {
    // ✅ FIX SSR: BLOCCA TUTTO se non siamo nel browser
    if (typeof window === 'undefined') {
      console.log('⚠️ [useIncomingCall] SSR rilevato, skip init Pusher');
      return;
    }

    console.log('INIT [useIncomingCall] Inizializzazione (BROWSER)...');

    // ✅ Handler visibilità tab
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

    // ✅ Import dinamico pusherService (solo nel browser)
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

      // ✅ Handler chiamate in arrivo
      const handleIncomingCall = (event) => {
        const callData = event.detail;
        
        console.log('CALL [useIncomingCall] Evento ricevuto:', callData);
        
        const chiamataUniqueId = `${callData.numero}_${callData.timestamp}`;
        const now = Date.now();
        
        // Anti-duplicazione
        if (lastCallIdRef.current?.id === chiamataUniqueId && 
            now - lastCallIdRef.current.time < 2000) {
          console.log('SKIP [useIncomingCall] Evento duplicato ignorato');
          return;
        }
        
        lastCallIdRef.current = {
          id: chiamataUniqueId,
          time: now
        };
        
        // Timeout auto-reset
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
        resetTimeoutRef.current = setTimeout(() => {
          if (lastCallIdRef.current?.id === chiamataUniqueId) {
            console.log('RESET [useIncomingCall] Reset lastCallId dopo 30s');
            lastCallIdRef.current = null;
          }
        }, 30000);
        
        // Salva chiamata
        salvaChiamataLocale(callData);
        salvaChiamataDB(callData);
        
        // Apri popup
        setChiamataCorrente(callData);
        setIsPopupOpen(true);
        
        console.log('OK [useIncomingCall] Popup aperto per:', callData.numero);
      };

      // Registra listener evento custom
      window.addEventListener('pusher-incoming-call', handleIncomingCall);

      // Setup listener Pusher
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

      // ✅ Cleanup
      return () => {
        clearInterval(interval);
        window.removeEventListener('pusher-incoming-call', handleIncomingCall);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }).catch(err => {
      console.error('❌ [useIncomingCall] Errore import pusherService:', err);
    });

    // ✅ Cleanup effect principale
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [salvaChiamataDB, salvaChiamataLocale]);

  // ✅ Handler chiusura popup
  const handleClosePopup = useCallback(() => {
    if (typeof window === 'undefined') return;

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

  // ✅ Handler accettazione chiamata
  const handleAcceptCall = useCallback(() => {
    if (typeof window === 'undefined') return;

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

  // ✅ Clear manuale chiamata
  const clearChiamata = useCallback(() => {
    console.log('CLEAR [useIncomingCall] Clear chiamata manuale');
    
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    setChiamataCorrente(null);
    setIsPopupOpen(false);
  }, []);

  // ✅ Getter storico chiamate
  const getStoricoChiamateLocale = useCallback(() => {
    if (typeof window === 'undefined') return [];

    try {
      const storageKey = 'pastificio_chiamate_recenti';
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      console.error('Errore lettura storico:', error);
      return [];
    }
  }, []);

  // ✅ Cleanup finale
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
