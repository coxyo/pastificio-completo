// Version 2.1.0 - Railway Metal Edge Optimized
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
      
      // ✅ POLLING ONLY per test Railway (se WebSocket non supportato)
      this.socket = io(this.BACKEND_URL, {
        // ⚡ SOLO POLLING (no websocket)
        transports: ['polling'],
        
        // Path esplicito
        path: '/socket.io/',
        
        // Reconnection strategy
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        
        // Timeout più lungo per Railway
        timeout: 30000,
        
        // Auto-connect
        autoConnect: true,
        
        // ✅ FIX: Disabilita credentials per Railway CORS
        withCredentials: false,
        
        // ✅ Upgrade settings
        upgrade: true,
        rememberUpgrade: true,
        
        // Query params per debug
        query: {
          source: 'pastificio-frontend',
          timestamp: Date.now()
        }
      });

      // Handler connessione stabilita
      this.socket.on('connect', () => {
        console.log('✅ WebSocket CONNESSO! ID:', this.socket.id);
        console.log('📡 Transport:', this.socket.io.engine.transport.name);
        
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

      // ✅ Monitor transport upgrade (polling → websocket)
      this.socket.io.engine.on('upgrade', (transport) => {
        console.log('⬆️ WebSocket upgrade a:', transport.name);
      });

      // Handler disconnessione
      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnesso:', reason);
        this.isConnected = false;
        this.notifyListeners('connection-status', { connected: false, reason });
        
        // Auto-reconnect se server ha chiuso
        if (reason === 'io server disconnect') {
          this.socket.connect();
        }
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

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Tentativo riconnessione', attemptNumber);
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('❌ Errore riconnessione:', error.message);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ Riconnessione fallita dopo tutti i tentativi');
      });

      // ========================
      // EVENTI ORDINI
      // ========================
      
      this.socket.on('ordine-creato', (data) => {
        console.log('📦 Nuovo ordine ricevuto via WebSocket:', data);
        this.notifyListeners('ordine-creato', data);
        
        // Dispatch evento per React
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ordine-creato', { detail: data }));
        }
      });

      this.socket.on('ordine-aggiornato', (data) => {
        console.log('📝 Ordine aggiornato via WebSocket:', data);
        this.notifyListeners('ordine-aggiornato', data);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ordine-aggiornato', { detail: data }));
        }
      });

      this.socket.on('ordine-eliminato', (data) => {
        console.log('🗑️ Ordine eliminato via WebSocket:', data);
        this.notifyListeners('ordine-eliminato', data);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ordine-eliminato', { detail: data }));
        }
      });

      // ========================
      // EVENTI MAGAZZINO
      // ========================
      
      this.socket.on('movimento-creato', (data) => {
        console.log('📦 Nuovo movimento magazzino:', data);
        this.notifyListeners('movimento-creato', data);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('movimento-creato', { detail: data }));
        }
      });

      this.socket.on('inventario_aggiornato', (data) => {
        console.log('📊 Inventario aggiornato:', data);
        this.notifyListeners('inventario_aggiornato', data);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inventario_aggiornato', { detail: data }));
        }
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

      // ========================
      // EVENTI CHIAMATE (CX3)
      // ========================
      
      this.socket.on('chiamata:arrivo', (data) => {
        console.log('📞 Chiamata in arrivo via WebSocket:', data);
        this.notifyListeners('chiamata:arrivo', data);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chiamata:arrivo', { detail: data }));
        }
      });

      // ========================
      // EVENTI SYNC
      // ========================
      
      this.socket.on('sync-data', (data) => {
        console.log('🔄 Dati sincronizzati ricevuti');
        this.notifyListeners('sync-data', data);
      });

      this.socket.on('connected', (data) => {
        console.log('✅ Conferma connessione dal server:', data);
      });

      // ========================
      // EVENTI BACKUP
      // ========================
      
      this.socket.on('backup:created', (data) => {
        console.log('💾 Backup creato:', data);
        this.notifyListeners('backup:created', data);
      });

      this.socket.on('backup:error', (data) => {
        console.error('❌ Errore backup:', data);
        this.notifyListeners('backup:error', data);
      });

      // ========================
      // EVENTI NOTIFICHE
      // ========================
      
      this.socket.on('notification', (data) => {
        console.log('🔔 Notifica:', data);
        this.notifyListeners('notification', data);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notification', { detail: data }));
        }
      });

      // ========================
      // EVENTI WHATSAPP
      // ========================
      
      this.socket.on('whatsapp:status', (data) => {
        console.log('📱 Status WhatsApp:', data);
        this.notifyListeners('whatsapp:status', data);
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
      if (this.isConnected && this.socket) {
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

  // ========================
  // METODI DI COMPATIBILITÀ
  // ========================
  
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
    return false;
  }

  // ========================
  // METODI UTILITY AGGIUNTIVI
  // ========================
  
  // Test ping/pong
  ping() {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('WebSocket non connesso'));
        return;
      }

      const startTime = Date.now();
      
      this.socket.emit('ping');
      
      const timeout = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
      
      this.socket.once('pong', (data) => {
        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        console.log('🏓 Pong ricevuto! Latency:', latency + 'ms');
        resolve({ latency, timestamp: data?.timestamp });
      });
    });
  }

  // Autentica utente
  authenticate(userId) {
    console.log('🔐 Autenticazione utente:', userId);
    this.emit('authenticate', { userId });
  }

  // Join room
  joinRoom(room) {
    console.log('🚪 Join room:', room);
    this.emit('join', room);
  }

  // Leave room
  leaveRoom(room) {
    console.log('🚪 Leave room:', room);
    this.emit('leave', room);
  }

  // Forza upgrade a websocket
  forceUpgrade() {
    if (this.socket?.io?.engine?.transport?.name === 'polling') {
      console.log('⬆️ Forzando upgrade a websocket...');
      this.socket.io.engine.upgrade();
    } else {
      console.log('ℹ️ Già su websocket o non disponibile');
    }
  }

  // Request sync manuale
  requestSync() {
    console.log('🔄 Richiesta sincronizzazione manuale');
    this.emit('request-sync');
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

// Auto-connect quando il modulo viene importato nel browser
if (typeof window !== 'undefined') {
  // Connetti automaticamente
  webSocketService.connect().catch(err => {
    console.error('❌ Errore connessione iniziale:', err);
  });
  
  // Reconnect quando la pagina torna online
  window.addEventListener('online', () => {
    console.log('🌐 Rete tornata online, riconnessione WebSocket...');
    webSocketService.connect();
  });

  // Log quando si va offline
  window.addEventListener('offline', () => {
    console.log('🔵 Rete offline');
  });

  // Reconnect quando la tab diventa attiva
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !webSocketService.isConnected) {
      console.log('👁️ Tab attiva, check connessione WebSocket...');
      webSocketService.connect();
    }
  });

  // ✅ Debug helper globale
  window.wsDebug = {
    status: () => {
      const status = webSocketService.getConnectionStatus();
      console.log('=== WebSocket Status ===');
      console.log('Connected:', status.connected);
      console.log('Socket ID:', status.socketId);
      console.log('Transport:', status.transport);
      console.log('Backend URL:', status.backendUrl);
      console.log('Reconnect Attempts:', status.reconnectAttempts);
      console.log('========================');
      return status;
    },
    connect: () => webSocketService.connect(),
    disconnect: () => webSocketService.disconnect(),
    ping: () => webSocketService.ping(),
    upgrade: () => webSocketService.forceUpgrade(),
    sync: () => webSocketService.requestSync(),
    test: () => {
      webSocketService.emit('test-event', { 
        message: 'Test from frontend',
        timestamp: new Date().toISOString() 
      });
      console.log('✅ Test event inviato');
    }
  };
  
  console.log('💡 WebSocket Debug disponibile: window.wsDebug');
  console.log('💡 Comandi: status(), connect(), disconnect(), ping(), upgrade(), sync(), test()');
}

// Export default
export default webSocketService;

// Named export per compatibilità
export { webSocketService as WebSocketService };