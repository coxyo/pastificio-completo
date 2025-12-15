// hooks/useWebSocket.js - ULTRA-SAFE VERSION
// ✅ Non crasherà MAI, anche se chiamato con codice vecchio
import { useEffect, useState } from 'react';

// ✅ Safe import - non crasha se manca
let webSocketService = null;
try {
  webSocketService = require('@/services/webSocketService').default;
} catch (e) {
  console.warn('⚠️ webSocketService non disponibile');
}

export function useWebSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // ✅ ULTRA-SAFE: Controlla TUTTO prima di usare
    if (!webSocketService) {
      console.log('ℹ️ webSocketService non disponibile');
      return;
    }

    // ✅ Controlla se è uno stub
    const status = webSocketService.getStatus?.();
    if (status?.disabled) {
      console.log('ℹ️ WebSocketService è disabilitato (stub), usa Pusher');
      setConnected(false);
      return;
    }

    // ✅ Safe check per addConnectionListener
    if (typeof webSocketService.addConnectionListener === 'function') {
      // WebSocket attivo (vecchio sistema)
      try {
        const handleConnectionChange = (isConnected) => {
          setConnected(isConnected);
        };

        webSocketService.addConnectionListener(handleConnectionChange);

        return () => {
          try {
            if (typeof webSocketService.removeConnectionListener === 'function') {
              webSocketService.removeConnectionListener(handleConnectionChange);
            }
          } catch (error) {
            console.warn('⚠️ Errore cleanup listener:', error);
          }
        };
      } catch (error) {
        console.warn('⚠️ Errore setup listener:', error);
      }
    } else {
      // WebSocket è stub, tutto OK
      console.log('ℹ️ WebSocket stub attivo (usa Pusher)');
      setConnected(false);
    }
  }, []);

  // ✅ ULTRA-SAFE: Tutti i metodi hanno fallback
  const safeEmit = (event, data) => {
    try {
      if (webSocketService && typeof webSocketService.emit === 'function') {
        webSocketService.emit(event, data);
      }
    } catch (error) {
      console.warn('⚠️ Errore emit:', error);
    }
  };

  const safeOn = (event, callback) => {
    try {
      if (webSocketService && typeof webSocketService.on === 'function') {
        webSocketService.on(event, callback);
      }
    } catch (error) {
      console.warn('⚠️ Errore on:', error);
    }
  };

  const safeOff = (event, callback) => {
    try {
      if (webSocketService && typeof webSocketService.off === 'function') {
        webSocketService.off(event, callback);
      }
    } catch (error) {
      console.warn('⚠️ Errore off:', error);
    }
  };

  return {
    socket: webSocketService || {}, // ✅ Sempre un oggetto
    connected: Boolean(webSocketService?.connected || webSocketService?.isConnected?.() || connected),
    emit: safeEmit,
    on: safeOn,
    off: safeOff
  };
}

export default useWebSocket;
