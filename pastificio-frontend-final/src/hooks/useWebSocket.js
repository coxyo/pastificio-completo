// hooks/useWebSocket.js - FIX DEFINITIVO
// ✅ Gestisce correttamente webSocketService quando è uno stub
import { useEffect, useState } from 'react';
import webSocketService from '@/services/webSocketService';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // ✅ FIX: Verifica se webSocketService ha i metodi prima di usarli
    if (typeof webSocketService.addConnectionListener === 'function') {
      // WebSocket attivo (scenario vecchio, non più usato)
      const handleConnectionChange = (isConnected) => {
        setConnected(isConnected);
      };

      webSocketService.addConnectionListener(handleConnectionChange);

      return () => {
        if (typeof webSocketService.removeConnectionListener === 'function') {
          webSocketService.removeConnectionListener(handleConnectionChange);
        }
      };
    } else {
      // ✅ WebSocket è uno stub (scenario attuale con Pusher)
      console.log('ℹ️ WebSocketService è disabilitato, usa Pusher per real-time');
      setConnected(false);
    }
  }, []);

  return {
    socket: webSocketService,
    connected: webSocketService.connected || false, // ✅ Usa proprietà se esiste
    emit: (event, data) => {
      if (typeof webSocketService.emit === 'function') {
        webSocketService.emit(event, data);
      }
    },
    on: (event, callback) => {
      if (typeof webSocketService.on === 'function') {
        webSocketService.on(event, callback);
      }
    },
    off: (event, callback) => {
      if (typeof webSocketService.off === 'function') {
        webSocketService.off(event, callback);
      }
    }
  };
}

export default useWebSocket;
