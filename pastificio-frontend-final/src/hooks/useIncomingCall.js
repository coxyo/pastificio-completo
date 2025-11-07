'use client';

import { useState, useEffect, useCallback } from 'react';

export default function useIncomingCall() {
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false); // ✅ NUOVO: Controlla apertura popup
  const [connected, setConnected] = useState(false);
  const [pusherService, setPusherService] = useState(null);

  // ✅ NUOVO: Log ogni volta che cambia lo state
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
        console.log('🔔 [useIncomingCall] Evento ricevuto:', event.detail);
        
        // ✅ AGGIORNA STATE + APRI POPUP
        setChiamataCorrente(event.detail);
        setIsPopupOpen(true); // ← FIX PRINCIPALE!
        
        console.log('✅ [useIncomingCall] State aggiornato via event:', event.detail);
        console.log('✅ [useIncomingCall] Popup aperto!');
      };

      // Registra listener per eventi custom (da pusherService)
      window.addEventListener('pusher-incoming-call', handleIncomingCall);

      // ✅ Registra listener Pusher diretto
      if (service.isConnected && service.callChannel) {
        console.log('✅ [useIncomingCall] Registro listener Pusher');
        service.onIncomingCall((data) => {
          console.log('📞 [useIncomingCall] Chiamata Pusher:', data);
          
          // ✅ AGGIORNA STATE + APRI POPUP
          setChiamataCorrente(data);
          setIsPopupOpen(true); // ← FIX PRINCIPALE!
          
          console.log('✅ [useIncomingCall] State aggiornato:', data);
        });
      } else {
        console.log('⏳ [useIncomingCall] Pusher non ancora pronto, attendo...');
        
        const retryInterval = setInterval(() => {
          const status = service.getStatus();
          if (status.connected && status.channelSubscribed) {
            console.log('✅ [useIncomingCall] Pusher pronto, registro listener');
            service.onIncomingCall((data) => {
              console.log('📞 [useIncomingCall] Chiamata Pusher:', data);
              
              // ✅ AGGIORNA STATE + APRI POPUP
              setChiamataCorrente(data);
              setIsPopupOpen(true); // ← FIX PRINCIPALE!
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

  // ✅ NUOVO: Handler per chiudere popup
  const handleClosePopup = useCallback(() => {
    console.log('🔴 [useIncomingCall] Chiusura popup');
    setIsPopupOpen(false);
    setChiamataCorrente(null);
  }, []);

  // ✅ NUOVO: Handler per accettare chiamata
  const handleAcceptCall = useCallback(() => {
    console.log('🟢 [useIncomingCall] Chiamata accettata');
    setIsPopupOpen(false);
    // Mantieni chiamataCorrente per poterla usare in NuovoOrdine
    // setChiamataCorrente(null); ← NON cancellare subito!
  }, []);

  // ✅ AGGIORNATO: clearChiamata ora chiude anche il popup
  const clearChiamata = useCallback(() => {
    console.log('🗑️ [useIncomingCall] Clear chiamata');
    setChiamataCorrente(null);
    setIsPopupOpen(false);
  }, []);

  return {
    chiamataCorrente,
    isPopupOpen,           // ✅ NUOVO
    handleClosePopup,      // ✅ NUOVO
    handleAcceptCall,      // ✅ NUOVO
    clearChiamata,
    connected,
    pusherService
  };
}
