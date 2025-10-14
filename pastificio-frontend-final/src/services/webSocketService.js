// Version 2.0.1 - Fixed isConnected method conflict
// services/webSocketService.js

import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.listeners = new Map();
    this.pendingEmits = [];
    
    // URL backend da variabili ambiente
    this.BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pastificio-backend-production.up.railway.app';
    
    console.log('🚀 WebSocket Service inizializzato con URL:', this.BACKEND_URL);
  }

  connect() {
    if (this.socket?.connected) {
      console.log('✅ WebSocket già connesso');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      console.log('🔄 Connessione WebSocket a:', this.BACKEND_URL);
      
      // Importa e connetti con socket.io-client REALE
      this.socket = io(this.BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true
      });

      // Handler connessione stabilita
      this.socket.on('connect', () => {
        console.log('✅ WebSocket CONNESSO! ID:', this.socket.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Processa eventi in coda
        this.processPendingEmits();
        
        // Notifica listeners
        this.notifyListeners('connection-status', { connected: true });
        
        // Richiedi sync iniziale
        this.socket.emit('request-sync');
        
        resolve();
      });

      // Handler disconnessione
      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnesso:', reason);
        this.isConnected = false;
        this.notifyListeners('connection-status', { connected: false, reason });
      });

      // Handler errore connessione
      this.socket.on('connect_error', (error) => {
        console.error('⚠️ Errore connessione:', error.message);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts === 1) {
          reject(error);
        }
        
        this.notifyListeners('connection-error', { 
          error: error.message,
          attempts: this.reconnectAttempts 
        });
      });

      // Handler riconnessione
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Riconnesso dopo ${attemptNumber} tentativi`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.socket.emit('request-sync');
      });

      // Eventi ordini
      this.socket.on('ordine-creato', (data) => {
        console.log('📦 Nuovo ordine ricevuto via WebSocket:', data);
        this.notifyListeners('ordine-creato', data);
      });

      this.socket.on('ordine-aggiornato', (data) => {
        console.log('📝 Ordine aggiornato via WebSocket:', data);
        this.notifyListeners('ordine-aggiornato', data);
      });

      this.socket.on('ordine-eliminato', (data) => {
        console.log('🗑️ Ordine eliminato via WebSocket:', data);
        this.notifyListeners('ordine-eliminato', data);
      });

      // Eventi magazzino
      this.socket.on('movimento-creato', (data) => {
        console.log('📦 Nuovo movimento magazzino:', data);
        this.notifyListeners('movimento-creato', data);
      });

      // Eventi inventario
      this.socket.on('inventario_aggiornato', (data) => {
        console.log('📊 Inventario aggiornato:', data);
        this.notifyListeners('inventario_aggiornato', data);
      });

      this.socket.on('movimento_aggiunto', (data) => {
        console.log('➕ Movimento aggiunto:', data);
        this.notifyListeners('movimento_aggiunto', data);
      });

      this.socket.on('movimento_eliminato', (data) => {
        console.log('🗑️ Movimento eliminato:', data);
        this.notifyListeners('movimento_eliminato', data);
      });

      this.socket.on('movimenti_caricati', (data) => {
        console.log('📋 Movimenti caricati:', data);
        this.notifyListeners('movimenti_caricati', data);
      });

      // Sync data
      this.socket.on('sync-data', (data) => {
        console.log('🔄 Dati sincronizzati ricevuti');
        this.notifyListeners('sync-data', data);
      });

      // Heartbeat
      this.startHeartbeat();
      
      // Timeout per la connessione iniziale
      setTimeout(() => {
        if (!this.isConnected) {
          console.warn('⏱️ Timeout connessione iniziale, continuo in background...');
          resolve(); // Risolvi comunque per non bloccare l'app
        }
      }, 5000);
    });
  }

  startHeartbeat() {
    setInterval(() => {
      if (this.isConnected) {
        this.socket.emit('ping');
      }
    }, 25000);
  }

  processPendingEmits() {
    while (this.pendingEmits.length > 0) {
      const { event, data } = this.pendingEmits.shift();
      this.socket.emit(event, data);
    }
  }

  emit(event, data) {
    if (this.isConnected && this.socket) {
      console.log(`📤 Emitting ${event}:`, data);
      this.socket.emit(event, data);
    } else {
      console.log(`⏳ Queuing ${event} per invio quando connesso`);
      this.pendingEmits.push({ event, data });
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Registra anche sul socket se esiste
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Errore nel listener per ${event}:`, error);
        }
      });
    }
  }

  // Metodi di compatibilità con il vecchio codice
  addConnectionListener(callback) {
    this.on('connection-status', (data) => {
      callback(data.connected);
    });
  }

  removeConnectionListener(callback) {
    this.off('connection-status', callback);
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnessione WebSocket manuale');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      transport: this.socket?.io?.engine?.transport?.name || 'disconnected',
      reconnectAttempts: this.reconnectAttempts,
      backendUrl: this.BACKEND_URL
    };
  }

  getConnectionState() {
    return this.isConnected;
  }

  
  isMockMode() {
    return false; // Non più in mock mode!
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

// Auto-connect quando il modulo viene importato nel browser
if (typeof window !== 'undefined') {
  // Connetti automaticamente
  webSocketService.connect().catch(err => {
    console.error('Errore connessione iniziale:', err);
  });
  
  // Reconnect quando la pagina torna online
  window.addEventListener('online', () => {
    console.log('🌐 Rete tornata online, riconnessione WebSocket...');
    webSocketService.connect();
  });

  // Log quando si va offline
  window.addEventListener('offline', () => {
    console.log('📵 Rete offline');
  });

  // Reconnect quando la tab diventa attiva
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !webSocketService.isConnected) {
      console.log('👁️ Tab attiva, check connessione WebSocket...');
      webSocketService.connect();
    }
  });
}

// Export default
export default webSocketService;

// Named export per compatibilità
export { webSocketService as WebSocketService };
