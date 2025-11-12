'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export default function useIncomingCall() {
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pusherService, setPusherService] = useState(null);
  
  // ✅ NUOVO: Ref per prevenire chiamate duplicate
  const lastCallIdRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  // Log state changes
  useEffect(() => {
    console.log('📊 [useIncomingCall] STATE UPDATE:');
    console.log('  - chiamataCorrente:', chiamataCorrente);
    console.log('  - isPopupOpen:', isPopupOpen);
    console.log('  - connected:', connected);
  }, [chiamataCorrente, isPopupOpen, connected]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔧 [useIncomingCall] Inizializzazione...');

    // ✅ NUOVO: Listener per visibilità pagina
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

      // ✅ LISTENER GLOBALE per eventi custom
      const handleIncomingCall = (event) => {
        const callData = event.detail;
        
        console.log('🔔 [useIncomingCall] Evento ricevuto:', callData);
        console.log('🔍 [useIncomingCall] Stato attuale:', {
          lastCallId: lastCallIdRef.current,
          isPopupOpen,
          chiamataCorrente: !!chiamataCorrente
        });
        
        // ✅ NUOVO: Usa combinazione numero+timestamp per identificare chiamata unica
        const chiamataUniqueId = `${callData.numero}_${callData.timestamp}`;
        const now = Date.now();
        
        // ✅ DEBOUNCE MIGLIORATO: Ignora se stesso evento entro 500ms (protezione duplicati Pusher)
        if (lastCallIdRef.current?.id === chiamataUniqueId && 
            now - lastCallIdRef.current.time < 500) {
          console.log('⚠️ [useIncomingCall] Evento duplicato ignorato (stesso timestamp):', chiamataUniqueId);
          return;
        }
        
        // Verifica che Pusher sia ancora connesso
        if (service && service.getStatus) {
          const status = service.getStatus();
          console.log('📡 [useIncomingCall] Stato Pusher:', status);
          
          if (!status.connected) {
            console.warn('⚠️ [useIncomingCall] Pusher disconnesso! Tento riconnessione...');
            // Lascia che il servizio gestisca la riconnessione automatica
          }
        }
        
        // Aggiorna last call con ID univoco basato su numero+timestamp
        lastCallIdRef.current = {
          id: chiamataUniqueId,
          time: now
        };
        
        // Auto-reset dopo 1 secondo (solo per pulizia, non blocca nuove chiamate)
        setTimeout(() => {
          if (lastCallIdRef.current?.id === chiamataUniqueId) {
            console.log('🔄 [useIncomingCall] Reset lastCallId per pulizia');
            lastCallIdRef.current = null;
          }
        }, 1000);
        
        // ✅ AGGIORNA STATE + APRI POPUP
        setChiamataCorrente(callData);
        setIsPopupOpen(true);
        
        console.log('✅ [useIncomingCall] State aggiornato via event:', callData);
        console.log('✅ [useIncomingCall] Popup aperto!');
      };

      // Registra listener per eventi custom (da pusherService)
      window.addEventListener('pusher-incoming-call', handleIncomingCall);

      // ✅ Registra listener Pusher diretto
      if (service.isConnected && service.callChannel) {
        console.log('✅ [useIncomingCall] Registro listener Pusher');
        service.onIncomingCall((data) => {
          console.log('📞 [useIncomingCall] Chiamata Pusher:', data);
          
          // Usa stesso handler per evitare duplicazione logica
          handleIncomingCall({ detail: data });
        });
      } else {
        console.log('⏳ [useIncomingCall] Pusher non ancora pronto, attendo...');
        
        const retryInterval = setInterval(() => {
          const status = service.getStatus();
          if (status.connected && status.channelSubscribed) {
            console.log('✅ [useIncomingCall] Pusher pronto, registro listener');
            service.onIncomingCall((data) => {
              console.log('📞 [useIncomingCall] Chiamata Pusher:', data);
              handleIncomingCall({ detail: data });
            });
            clearInterval(retryInterval);
          }
        }, 1000);

        return () => {
          clearInterval(retryInterval);
          clearInterval(interval);
          window.removeEventListener('pusher-incoming-call', handleIncomingCall);
        };
      }

      return () => {
        clearInterval(interval);
        window.removeEventListener('pusher-incoming-call', handleIncomingCall);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    });
  }, []);

  // ✅ Handler per chiudere popup (Ignora)
  const handleClosePopup = useCallback(() => {
    console.log('🔴 [useIncomingCall] Chiusura popup (Ignora)');
    setIsPopupOpen(false);
    setChiamataCorrente(null);
    lastCallIdRef.current = null; // Reset per permettere nuove chiamate
  }, []);

  // ✅ Handler per accettare chiamata
  const handleAcceptCall = useCallback(() => {
    console.log('🟢 [useIncomingCall] Chiamata accettata');
    setIsPopupOpen(false);
    
    // ✅ NUOVO: Auto-reset dopo 10 secondi (aumentato da 3)
    // Questo permette a NuovoOrdine di leggere chiamataCorrente dal localStorage
    // ma poi pulisce lo state per permettere nuove chiamate
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    
    resetTimeoutRef.current = setTimeout(() => {
      console.log('🧹 [useIncomingCall] Auto-reset chiamataCorrente dopo accettazione');
      setChiamataCorrente(null);
      lastCallIdRef.current = null;
    }, 10000); // 10 secondi per sicurezza
    
  }, []);

  // ✅ clearChiamata ora chiude anche il popup
  const clearChiamata = useCallback(() => {
    console.log('🗑️ [useIncomingCall] Clear chiamata manuale');
    setChiamataCorrente(null);
    setIsPopupOpen(false);
    lastCallIdRef.current = null;
    
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
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
    pusherService
  };
}
