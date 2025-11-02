// hooks/useIncomingCall.js
'use client';

import { useState, useEffect, useCallback } from 'react';

export default function useIncomingCall() {
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [connected, setConnected] = useState(false);
  const [pusherService, setPusherService] = useState(null);

  useEffect(() => {
    // ✅ Import dinamico pusherService
    if (typeof window === 'undefined') return;

    console.log('🔧 [useIncomingCall] Inizializzazione...');

    import('@/services/pusherService').then((module) => {
      const service = module.default;
      console.log('✅ [useIncomingCall] pusherService importato');
      
      setPusherService(service);

      // ✅ Verifica stato connessione ogni 2s
      const checkConnection = () => {
        const status = service.getStatus();
        setConnected(status.connected && status.channelSubscribed);
      };

      checkConnection();
      const interval = setInterval(checkConnection, 2000);

      // ✅ Listener per evento chiamata
      const handleIncomingCall = (event) => {
        console.log('🔔 [useIncomingCall] Evento ricevuto:', event.detail);
        setChiamataCorrente(event.detail);
      };

      // ✅ Registra listener globale per eventi custom
      window.addEventListener('pusher-incoming-call', handleIncomingCall);

      // ✅ Registra listener Pusher diretto
      if (service.isConnected && service.callChannel) {
        console.log('✅ [useIncomingCall] Registro listener Pusher');
        service.onIncomingCall((data) => {
          console.log('📞 [useIncomingCall] Chiamata Pusher:', data);
          setChiamataCorrente(data);
        });
      } else {
        // Se non ancora connesso, aspetta e riprova
        console.log('⏳ [useIncomingCall] Pusher non ancora pronto, attendo...');
        
        const retryInterval = setInterval(() => {
          const status = service.getStatus();
          if (status.connected && status.channelSubscribed) {
            console.log('✅ [useIncomingCall] Pusher pronto, registro listener');
            service.onIncomingCall((data) => {
              console.log('📞 [useIncomingCall] Chiamata Pusher:', data);
              setChiamataCorrente(data);
            });
            clearInterval(retryInterval);
          }
        }, 1000);

        return () => {
          clearInterval(retryInterval);
        };
      }

      // ✅ Cleanup
      return () => {
        clearInterval(interval);
        window.removeEventListener('pusher-incoming-call', handleIncomingCall);
      };
    });
  }, []);

  const clearChiamata = useCallback(() => {
    console.log('🗑️ [useIncomingCall] Clear chiamata');
    setChiamataCorrente(null);
  }, []);

  return {
    chiamataCorrente,
    clearChiamata,
    connected,
    pusherService
  };
}
