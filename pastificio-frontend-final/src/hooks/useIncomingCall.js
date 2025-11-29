'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export default function useIncomingCall() {
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pusherService, setPusherService] = useState(null);
  
  // Ref per prevenire chiamate duplicate
  const lastCallIdRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  // Log state changes
  useEffect(() => {
    console.log('📊 [useIncomingCall] STATE UPDATE:');
    console.log('  - chiamataCorrente:', chiamataCorrente?.numero || null);
    console.log('  - isPopupOpen:', isPopupOpen);
    console.log('  - connected:', connected);
  }, [chiamataCorrente, isPopupOpen, connected]);

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
        
        // Debounce: Ignora se stesso evento entro 500ms
        if (lastCallIdRef.current?.id === chiamataUniqueId && 
            now - lastCallIdRef.current.time < 500) {
          console.log('⚠️ [useIncomingCall] Evento duplicato ignorato:', chiamataUniqueId);
          return;
        }
        
        // Aggiorna last call
        lastCallIdRef.current = {
          id: chiamataUniqueId,
          time: now
        };
        
        // Auto-reset dopo 1 secondo
        setTimeout(() => {
          if (lastCallIdRef.current?.id === chiamataUniqueId) {
            console.log('🔄 [useIncomingCall] Reset lastCallId per pulizia');
            lastCallIdRef.current = null;
          }
        }, 1000);
        
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
  }, []);

  // ✅ FIX: Handler per chiudere popup (Ignora) - chiusura IMMEDIATA
  const handleClosePopup = useCallback(() => {
    console.log('🔴 [useIncomingCall] Chiusura popup (Ignora)');
    
    // Pulisci timeout se presente
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    // ✅ Chiudi popup IMMEDIATAMENTE
    setIsPopupOpen(false);
    setChiamataCorrente(null);
    lastCallIdRef.current = null;
    
    console.log('✅ [useIncomingCall] Popup chiuso');
  }, []);

  // ✅ FIX: Handler per accettare chiamata - chiusura IMMEDIATA
  const handleAcceptCall = useCallback(() => {
    console.log('🟢 [useIncomingCall] Chiamata accettata');
    
    // Pulisci timeout se presente
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    // ✅ Chiudi popup IMMEDIATAMENTE
    setIsPopupOpen(false);
    
    // ✅ Mantieni chiamataCorrente per 5 secondi (per localStorage in ClientLayout)
    // poi pulisci automaticamente
    resetTimeoutRef.current = setTimeout(() => {
      console.log('🧹 [useIncomingCall] Auto-reset chiamataCorrente dopo accettazione');
      setChiamataCorrente(null);
      lastCallIdRef.current = null;
    }, 5000);
    
    console.log('✅ [useIncomingCall] Popup chiuso, dati mantenuti per 5s');
  }, []);

  // clearChiamata - pulizia completa
  const clearChiamata = useCallback(() => {
    console.log('🗑️ [useIncomingCall] Clear chiamata manuale');
    
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    setChiamataCorrente(null);
    setIsPopupOpen(false);
    lastCallIdRef.current = null;
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
