// hooks/useWebSocket.js (se esiste)
import { useEffect, useState } from 'react';
import webSocketService from '@/services/webSocketService';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const handleConnectionChange = (isConnected) => {
      setConnected(isConnected);
    };

    webSocketService.addConnectionListener(handleConnectionChange);

    return () => {
      webSocketService.removeConnectionListener(handleConnectionChange);
    };
  }, []);

  return {
    socket: webSocketService,
    connected,
    emit: (event, data) => webSocketService.emit(event, data),
    on: (event, callback) => webSocketService.on(event, callback),
    off: (event, callback) => webSocketService.off(event, callback)
  };
}

export default useWebSocket;