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
        
        // ✅ DEBOUNCE: Ignora chiamate duplicate (stesso callId entro 5 secondi)
        if (lastCallIdRef.current === callData.callId) {
          console.log('⚠️ [useIncomingCall] Chiamata duplicata ignorata:', callData.callId);
          return;
        }
        
        // Aggiorna last callId
        lastCallIdRef.current = callData.callId;
        
        // Reset lastCallId dopo 5 secondi
        setTimeout(() => {
          if (lastCallIdRef.current === callData.callId) {
            lastCallIdRef.current = null;
          }
        }, 5000);
        
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
    
    // ✅ NUOVO: Auto-reset dopo 3 secondi
    // Questo permette a NuovoOrdine di leggere chiamataCorrente dal localStorage
    // ma poi pulisce lo state per permettere nuove chiamate
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    
    resetTimeoutRef.current = setTimeout(() => {
      console.log('🧹 [useIncomingCall] Auto-reset chiamataCorrente dopo accettazione');
      setChiamataCorrente(null);
      lastCallIdRef.current = null;
    }, 3000); // 3 secondi dovrebbero bastare per salvare in localStorage
    
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
