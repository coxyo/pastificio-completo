'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

export default function useIncomingCall() {
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pusherService, setPusherService] = useState(null);
  
  // Ref per prevenire chiamate duplicate - timeout più lungo
  const lastCallIdRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  // Log state changes
  useEffect(() => {
    console.log('📊 [useIncomingCall] STATE UPDATE:');
    console.log('  - chiamataCorrente:', chiamataCorrente?.numero || null);
    console.log('  - isPopupOpen:', isPopupOpen);
    console.log('  - connected:', connected);
  }, [chiamataCorrente, isPopupOpen, connected]);

  // ✅ NUOVO: Salva chiamata nel database
  const salvaChiamataDB = useCallback(async (callData) => {
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
          cliente: callData.cliente || null,
          clienteTrovato: !!callData.cliente,
          sorgente: 'pusher-frontend'
        })
      });
      
      if (response.ok) {
        console.log('✅ [useIncomingCall] Chiamata salvata nel database');
      } else {
        console.warn('⚠️ [useIncomingCall] Errore salvataggio chiamata:', response.status);
      }
    } catch (error) {
      console.error('❌ [useIncomingCall] Errore salvataggio chiamata:', error);
    }
  }, []);

  // ✅ NUOVO: Salva chiamata in localStorage per persistenza locale
  const salvaChiamataLocale = useCallback((callData) => {
    try {
      const storageKey = 'pastificio_chiamate_recenti';
      const chiamateEsistenti = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Aggiungi nuova chiamata all'inizio
      const nuovaChiamata = {
        ...callData,
        id: `${callData.numero}_${Date.now()}`,
        savedAt: new Date().toISOString(),
        status: 'ricevuta'
      };
      
      // Mantieni solo ultime 50 chiamate
      const chiamateAggiornate = [nuovaChiamata, ...chiamateEsistenti].slice(0, 50);
      localStorage.setItem(storageKey, JSON.stringify(chiamateAggiornate));
      
      console.log('✅ [useIncomingCall] Chiamata salvata in localStorage');
    } catch (error) {
      console.error('❌ [useIncomingCall] Errore salvataggio locale:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔧 [useIncomingCall] Inizializzazione...');

    // Listener per visibilità pagina
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ [useIncomingCall] Tab visibile, verifico Pusher...');
        
        if (pusherService && pusherService.getStatus) {
          const status = pusherService.getStatus();
          console.log('📡 Stato Pusher al focus:', status);
          
          if (!status.connected) {
            console.warn('⚠️ Pusher disconnesso, tento riconnessione...');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Import dinamico pusherService
    import('@/services/pusherService').then((module) => {
      const service = module.default;
      console.log('✅ [useIncomingCall] pusherService importato');
      
      setPusherService(service);

      // Check connessione ogni 2s
      const checkConnection = () => {
        const status = service.getStatus();
        setConnected(status.connected && status.channelSubscribed);
      };

      checkConnection();
      const interval = setInterval(checkConnection, 2000);

      // Listener per eventi custom
      const handleIncomingCall = (event) => {
        const callData = event.detail;
        
        console.log('📞 [useIncomingCall] Evento ricevuto:', callData);
        console.log('🔍 [useIncomingCall] Stato attuale:', {
          lastCallId: lastCallIdRef.current,
          isPopupOpen,
          chiamataCorrente: !!chiamataCorrente
        });
        
        // Usa combinazione numero+timestamp per identificare chiamata unica
        const chiamataUniqueId = `${callData.numero}_${callData.timestamp}`;
        const now = Date.now();
        
        // ✅ FIX: Debounce più lungo - 2 secondi invece di 500ms
        if (lastCallIdRef.current?.id === chiamataUniqueId && 
            now - lastCallIdRef.current.time < 2000) {
          console.log('⚠️ [useIncomingCall] Evento duplicato ignorato:', chiamataUniqueId);
          return;
        }
        
        // Aggiorna last call
        lastCallIdRef.current = {
          id: chiamataUniqueId,
          time: now
        };
        
        // ✅ FIX: Reset dopo 30 SECONDI invece di 1 secondo
        // Questo permette all'utente di vedere il popup abbastanza a lungo
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
        resetTimeoutRef.current = setTimeout(() => {
          if (lastCallIdRef.current?.id === chiamataUniqueId) {
            console.log('🔄 [useIncomingCall] Reset lastCallId dopo 30s');
            lastCallIdRef.current = null;
          }
        }, 30000); // 30 secondi
        
        // ✅ NUOVO: Salva chiamata PRIMA di mostrare popup
        salvaChiamataLocale(callData);
        salvaChiamataDB(callData);
        
        // ✅ AGGIORNA STATE + APRI POPUP
        setChiamataCorrente(callData);
        setIsPopupOpen(true);
        
        console.log('✅ [useIncomingCall] Popup aperto per:', callData.numero);
      };

      // Registra listener
      window.addEventListener('pusher-incoming-call', handleIncomingCall);

      // Registra listener Pusher diretto
      const setupPusherListener = () => {
        const status = service.getStatus();
        if (status.connected && status.channelSubscribed) {
          console.log('✅ [useIncomingCall] Registro listener Pusher');
          service.onIncomingCall((data) => {
            console.log('📞 [useIncomingCall] Chiamata Pusher:', data);
            handleIncomingCall({ detail: data });
          });
          return true;
        }
        return false;
      };

      if (!setupPusherListener()) {
        console.log('⏳ [useIncomingCall] Pusher non ancora pronto, attendo...');
        
        const retryInterval = setInterval(() => {
          if (setupPusherListener()) {
            clearInterval(retryInterval);
          }
        }, 1000);

        // Cleanup retry interval
        setTimeout(() => clearInterval(retryInterval), 30000);
      }

      return () => {
        clearInterval(interval);
        window.removeEventListener('pusher-incoming-call', handleIncomingCall);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    });
  }, [salvaChiamataDB, salvaChiamataLocale]);

  // ✅ FIX: Handler per chiudere popup (Ignora) - aggiorna status locale
  const handleClosePopup = useCallback(() => {
    console.log('🔴 [useIncomingCall] Chiusura popup (Ignora)');
    
    // ✅ NUOVO: Aggiorna status chiamata in localStorage
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
    
    // Pulisci timeout se presente
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    // ✅ Chiudi popup IMMEDIATAMENTE
    setIsPopupOpen(false);
    setChiamataCorrente(null);
    // ✅ FIX: NON resettare lastCallIdRef qui - mantienilo per prevenire duplicati
    
    console.log('✅ [useIncomingCall] Popup chiuso');
  }, [chiamataCorrente]);

  // ✅ FIX: Handler per accettare chiamata - aggiorna status locale
  const handleAcceptCall = useCallback(() => {
    console.log('🟢 [useIncomingCall] Chiamata accettata');
    
    // ✅ NUOVO: Aggiorna status chiamata in localStorage
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
    
    // Pulisci timeout se presente
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    // ✅ Chiudi popup IMMEDIATAMENTE
    setIsPopupOpen(false);
    
    // ✅ Mantieni chiamataCorrente per 10 secondi (per form NuovoOrdine)
    resetTimeoutRef.current = setTimeout(() => {
      console.log('🧹 [useIncomingCall] Auto-reset chiamataCorrente dopo accettazione');
      setChiamataCorrente(null);
    }, 10000); // 10 secondi invece di 5
    
    console.log('✅ [useIncomingCall] Popup chiuso, dati mantenuti per 10s');
  }, [chiamataCorrente]);

  // clearChiamata - pulizia completa
  const clearChiamata = useCallback(() => {
    console.log('🗑️ [useIncomingCall] Clear chiamata manuale');
    
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    setChiamataCorrente(null);
    setIsPopupOpen(false);
    // ✅ FIX: NON resettare lastCallIdRef qui
  }, []);

  // ✅ NUOVO: Funzione per ottenere storico chiamate locale
  const getStoricoChiamateLocale = useCallback(() => {
    try {
      const storageKey = 'pastificio_chiamate_recenti';
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      console.error('Errore lettura storico:', error);
      return [];
    }
  }, []);

  // Cleanup timeout on unmount
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
    getStoricoChiamateLocale  // ✅ NUOVO: esponi storico locale
  };
}
