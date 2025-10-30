// services/pusherService.js - FRONTEND
// Pusher client per notifiche real-time - ✅ VERSIONE AGGIORNATA CON FIX SUBSCRIBE

import Pusher from 'pusher-js';

class PusherClientService {
  constructor() {
    this.pusher = null;
    this.channels = {};
    this.isConnected = false;
    
    // ✅ ACCESSO CORRETTO ENV VARS IN NEXT.JS CLIENT
    // Le env vars sono iniettate al build time, NON a runtime
    this.PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '42b401f9d1043282d298'; // ✅ Key corretta
    this.PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';
    
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
   * ✅ AGGIORNATO - Subscribe al canale chiamate con fix
   */
  subscribeToChiamate(callback) {
    if (!this.pusher) {
      console.error('❌ Pusher non inizializzato');
      return null;
    }

    // ✅ FIX: Check se già sottoscritto
    if (this.channels.chiamate) {
      console.log('✅ Già sottoscritto al canale chiamate');
      return this.channels.chiamate;
    }

    try {
      // ✅ Subscribe al canale
      const channel = this.pusher.subscribe('chiamate');
      this.channels.chiamate = channel; // ✅ IMPORTANTE: Salva nel channels object

      console.log('✅ Sottoscritto a canale chiamate');

      // ✅ Bind evento nuova chiamata
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

    // Check se già sottoscritto
    if (this.channels.ordini) {
      console.log('✅ Già sottoscritto al canale ordini');
      return this.channels.ordini;
    }

    try {
      const channel = this.pusher.subscribe('ordini');
      this.channels.ordini = channel;

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

    // Check se già sottoscritto
    if (this.channels.magazzino) {
      console.log('✅ Già sottoscritto al canale magazzino');
      return this.channels.magazzino;
    }

    try {
      const channel = this.pusher.subscribe('magazzino');
      this.channels.magazzino = channel;

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
  
  // ✅ AGGIORNATO: Subscribe al canale chiamate (sempre attivo se loggato)
  const token = localStorage.getItem('token');
  if (token) {
    console.log('✅ Token trovato, sottoscrivo a chiamate...');
    pusherClientService.subscribeToChiamate();
  }

  // Subscribe quando fa login
  window.addEventListener('user-logged-in', () => {
    console.log('🔐 User logged in, sottoscrivo a tutti i canali...');
    pusherClientService.subscribeToChiamate();
    pusherClientService.subscribeToOrdini({});
    pusherClientService.subscribeToMagazzino();
  });

  // Unsubscribe quando fa logout
  window.addEventListener('user-logged-out', () => {
    console.log('🔐 User logged out, disconnetto Pusher...');
    pusherClientService.disconnect();
  });

  // ✅ AGGIORNATO: Debug helper migliorato
  window.pusherDebug = {
    status: () => {
      const status = pusherClientService.getStatus();
      console.log('=== Pusher Status ===');
      console.log('Initialized:', status.initialized);
      console.log('Connected:', status.connected);
      console.log('Socket ID:', status.socketId);
      console.log('Channels:', status.channels); // ✅ Mostra array canali
      console.log('Cluster:', status.cluster);
      console.log('====================');
      return status;
    },
    
    // ✅ NUOVO: Forza subscribe a chiamate
    forceSubscribe: () => {
      if (!pusherClientService.channels.chiamate) {
        console.log('🔄 Forzo subscribe a chiamate...');
        pusherClientService.subscribeToChiamate((data) => {
          console.log('📞 Chiamata ricevuta dal force subscribe:', data);
        });
      } else {
        console.log('✅ Già sottoscritto a chiamate');
      }
    },
    
    // ✅ NUOVO: Test simulato chiamata
    testChiamata: async () => {
      console.log('🧪 Invia test chiamata al backend...');
      try {
        const response = await fetch('https://pastificio-backend-production.up.railway.app/api/webhook/chiamata-entrante', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numero: '+393271234567', // ✅ Modifica con numero reale
            timestamp: new Date().toISOString(),
            callId: 'test-' + Date.now(),
            source: 'debug-console'
          })
        });
        
        const result = await response.json();
        console.log('✅ Risposta webhook:', result);
        return result;
      } catch (error) {
        console.error('❌ Errore test chiamata:', error);
        return { error: error.message };
      }
    },
    
    disconnect: () => pusherClientService.disconnect(),
    
    reconnect: () => {
      console.log('🔄 Reconnecting Pusher...');
      pusherClientService.disconnect();
      setTimeout(() => {
        pusherClientService.initialize();
        pusherClientService.subscribeToChiamate();
      }, 1000);
    },
    
    // ✅ NUOVO: Lista tutti i canali
    listChannels: () => {
      console.log('📺 Canali sottoscritti:', Object.keys(pusherClientService.channels));
      return Object.keys(pusherClientService.channels);
    }
  };

  console.log('💡 Pusher debug disponibili:');
  console.log('  - window.pusherDebug.status()');
  console.log('  - window.pusherDebug.forceSubscribe()');
  console.log('  - window.pusherDebug.testChiamata()');
  console.log('  - window.pusherDebug.listChannels()');
}

export default pusherClientService;