// services/pusherService.js - FRONTEND
// Pusher client per notifiche real-time

import Pusher from 'pusher-js';

class PusherClientService {
  constructor() {
    this.pusher = null;
    this.channels = {};
    this.isConnected = false;
    
    // ✅ ACCESSO CORRETTO ENV VARS IN NEXT.JS CLIENT
    // Le env vars sono iniettate al build time, NON a runtime
    this.PUSHER_KEY = '42b401f9d1043202d98a'; // Hardcoded per sicurezza
    this.PUSHER_CLUSTER = 'eu';
    
    console.log('🚀 Pusher Service inizializzato');
  }

  initialize() {
    if (this.pusher) {
      console.log('⚠️ Pusher già inizializzato');
      return;
    }

    if (!this.PUSHER_KEY) {
      console.error('❌ PUSHER_KEY mancante');
      return;
    }

    try {
      // ✅ Inizializza Pusher client
      this.pusher = new Pusher(this.PUSHER_KEY, {
        cluster: this.PUSHER_CLUSTER,
        encrypted: true,
        forceTLS: true
      });

      // Eventi connessione
      this.pusher.connection.bind('connected', () => {
        console.log('✅ Pusher connesso! Socket ID:', this.pusher.connection.socket_id);
        this.isConnected = true;
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('❌ Pusher disconnesso');
        this.isConnected = false;
      });

      this.pusher.connection.bind('error', (err) => {
        console.error('❌ Errore Pusher:', err);
      });

      console.log('✅ Pusher client inizializzato', {
        cluster: this.PUSHER_CLUSTER,
        key: this.PUSHER_KEY.substring(0, 8) + '...'
      });

    } catch (error) {
      console.error('❌ Errore inizializzazione Pusher:', error);
    }
  }

  /**
   * Subscribe al canale chiamate
   */
  subscribeToChiamate(callback) {
    if (!this.pusher) {
      console.error('❌ Pusher non inizializzato');
      return null;
    }

    try {
      // Subscribe al canale
      const channel = this.pusher.subscribe('chiamate');
      this.channels['chiamate'] = channel;

      // Bind evento nuova chiamata
      channel.bind('nuova-chiamata', (data) => {
        console.log('📞 CHIAMATA IN ARRIVO via Pusher:', data);
        
        // Trigger evento per CallPopup
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chiamata:arrivo', {
            detail: data
          }));
        }
        
        // Callback opzionale
        if (callback) callback(data);
      });

      console.log('✅ Sottoscritto a canale chiamate');
      return channel;

    } catch (error) {
      console.error('❌ Errore subscribe chiamate:', error);
      return null;
    }
  }

  /**
   * Subscribe al canale ordini
   */
  subscribeToOrdini(callbacks = {}) {
    if (!this.pusher) return null;

    try {
      const channel = this.pusher.subscribe('ordini');
      this.channels['ordini'] = channel;

      // Ordine creato
      if (callbacks.onCreate) {
        channel.bind('ordine-creato', (data) => {
          console.log('📦 Nuovo ordine via Pusher:', data);
          callbacks.onCreate(data);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ordine-creato', { detail: data }));
          }
        });
      }

      // Ordine aggiornato
      if (callbacks.onUpdate) {
        channel.bind('ordine-aggiornato', (data) => {
          console.log('📝 Ordine aggiornato via Pusher:', data);
          callbacks.onUpdate(data);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ordine-aggiornato', { detail: data }));
          }
        });
      }

      console.log('✅ Sottoscritto a canale ordini');
      return channel;

    } catch (error) {
      console.error('❌ Errore subscribe ordini:', error);
      return null;
    }
  }

  /**
   * Subscribe al canale magazzino
   */
  subscribeToMagazzino(callback) {
    if (!this.pusher) return null;

    try {
      const channel = this.pusher.subscribe('magazzino');
      this.channels['magazzino'] = channel;

      channel.bind('movimento-creato', (data) => {
        console.log('📊 Movimento magazzino via Pusher:', data);
        
        if (callback) callback(data);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('movimento-creato', { detail: data }));
        }
      });

      console.log('✅ Sottoscritto a canale magazzino');
      return channel;

    } catch (error) {
      console.error('❌ Errore subscribe magazzino:', error);
      return null;
    }
  }

  /**
   * Unsubscribe da un canale
   */
  unsubscribe(channelName) {
    if (this.channels[channelName]) {
      this.pusher.unsubscribe(channelName);
      delete this.channels[channelName];
      console.log(`✅ Unsubscribed da ${channelName}`);
    }
  }

  /**
   * Disconnect da Pusher
   */
  disconnect() {
    if (this.pusher) {
      Object.keys(this.channels).forEach(channel => {
        this.unsubscribe(channel);
      });
      
      this.pusher.disconnect();
      this.pusher = null;
      this.isConnected = false;
      
      console.log('🔌 Pusher disconnesso');
    }
  }

  /**
   * Status Pusher
   */
  getStatus() {
    return {
      initialized: !!this.pusher,
      connected: this.isConnected,
      socketId: this.pusher?.connection?.socket_id || null,
      channels: Object.keys(this.channels),
      cluster: this.PUSHER_CLUSTER
    };
  }
}

// Singleton
const pusherClientService = new PusherClientService();

// Auto-initialize quando il modulo viene caricato nel browser
if (typeof window !== 'undefined') {
  pusherClientService.initialize();
  
  // Subscribe al canale chiamate (sempre attivo se loggato)
  const token = localStorage.getItem('token');
  if (token) {
    pusherClientService.subscribeToChiamate();
  }

  // Subscribe quando fa login
  window.addEventListener('user-logged-in', () => {
    pusherClientService.subscribeToChiamate();
    pusherClientService.subscribeToOrdini({});
    pusherClientService.subscribeToMagazzino();
  });

  // Unsubscribe quando fa logout
  window.addEventListener('user-logged-out', () => {
    pusherClientService.disconnect();
  });

  // Debug helper
  window.pusherDebug = {
    status: () => {
      const status = pusherClientService.getStatus();
      console.log('=== Pusher Status ===');
      console.log('Initialized:', status.initialized);
      console.log('Connected:', status.connected);
      console.log('Socket ID:', status.socketId);
      console.log('Channels:', status.channels);
      console.log('Cluster:', status.cluster);
      console.log('====================');
      return status;
    },
    test: () => {
      console.log('🧪 Invia test chiamata al backend...');
      console.log('Usa: POST /api/cx3/test per testare');
    },
    disconnect: () => pusherClientService.disconnect(),
    reconnect: () => {
      pusherClientService.disconnect();
      pusherClientService.initialize();
      pusherClientService.subscribeToChiamate();
    }
  };

  console.log('💡 Pusher debug: window.pusherDebug.status()');
}

export default pusherClientService;