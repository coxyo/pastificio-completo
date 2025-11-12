// services/pusherService.js - FRONTEND v5.1 FIXED KEY
// ✅ INIZIALIZZAZIONE AUTOMATICA + DEBUG COMPLETO + KEY CORRETTA

import Pusher from 'pusher-js';

class PusherClientService {
  constructor() {
    this.pusher = null;
    this.isConnected = false;
    this.callChannel = null;
    this.initializationPromise = null;
    
    // ✅ Configurazione - KEY CORRETTA!
    this.PUSHER_KEY = '42b401f9d1043202d98a';  // ⚠️ FIXED: era 42b401f9d1043282d298
    this.PUSHER_CLUSTER = 'eu';
    
    console.log('🚀 Pusher Service v5.1 creato (KEY CORRETTA)');
    
    // ✅ AUTO-INIZIALIZZAZIONE solo in browser
    if (typeof window !== 'undefined') {
      console.log('🌐 Ambiente browser rilevato, inizializzazione automatica...');
      this.initialize();
    }
  }

  // ✅ INIZIALIZZAZIONE
  initialize() {
    // Se già inizializzato, ritorna promise esistente
    if (this.initializationPromise) {
      console.log('⚠️ Inizializzazione già in corso...');
      return this.initializationPromise;
    }

    // Se già connesso
    if (this.pusher && this.isConnected) {
      console.log('✅ Pusher già inizializzato e connesso');
      return Promise.resolve(this.pusher);
    }

    console.log('🔧 Inizializzazione Pusher...');
    console.log('📡 Key:', this.PUSHER_KEY);
    console.log('🌍 Cluster:', this.PUSHER_CLUSTER);

    this.initializationPromise = new Promise((resolve, reject) => {
      try {
        // Crea istanza Pusher
        this.pusher = new Pusher(this.PUSHER_KEY, {
          cluster: this.PUSHER_CLUSTER,
          encrypted: true,
          forceTLS: true,
          // ✅ Abilita logging in development
          enabledTransports: ['ws', 'wss'],
          disableStats: true,
        });

        console.log('🔌 Pusher client creato, in attesa di connessione...');

        // ✅ Handler connessione riuscita
        this.pusher.connection.bind('connected', () => {
          console.log('✅ Pusher CONNESSO! Socket ID:', this.pusher.connection.socket_id);
          this.isConnected = true;
          
          // ✅ AUTO-SUBSCRIBE al canale chiamate
          setTimeout(() => {
            this.subscribeToCallChannel();
          }, 500); // Piccolo delay per stabilizzare connessione
          
          resolve(this.pusher);
        });

        // ✅ Handler stato connessione
        this.pusher.connection.bind('state_change', (states) => {
          console.log(`🔄 Pusher state: ${states.previous} → ${states.current}`);
        });

        // ✅ Handler disconnessione
        this.pusher.connection.bind('disconnected', () => {
          console.warn('⚠️ Pusher disconnesso');
          this.isConnected = false;
        });

        // ✅ Handler errore
        this.pusher.connection.bind('error', (err) => {
          console.error('❌ Errore Pusher:', err);
          this.isConnected = false;
          reject(err);
        });

        // ✅ Handler servizio non disponibile
        this.pusher.connection.bind('unavailable', () => {
          console.error('❌ Pusher non disponibile');
          this.isConnected = false;
          reject(new Error('Pusher unavailable'));
        });

        // ✅ Handler fallimento connessione
        this.pusher.connection.bind('failed', () => {
          console.error('❌ Connessione Pusher fallita');
          this.isConnected = false;
          reject(new Error('Pusher connection failed'));
        });

        // ✅ Timeout se non si connette entro 10s
        setTimeout(() => {
          if (!this.isConnected) {
            console.error('❌ Timeout connessione Pusher (10s)');
            reject(new Error('Pusher connection timeout'));
          }
        }, 10000);

      } catch (error) {
        console.error('❌ Errore inizializzazione Pusher:', error);
        this.initializationPromise = null;
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  // ✅ SUBSCRIBE CANALE CHIAMATE
  subscribeToCallChannel() {
    if (!this.pusher) {
      console.error('❌ Pusher non inizializzato, impossibile fare subscribe');
      return null;
    }

    if (this.callChannel) {
      console.log('✅ Già sottoscritto al canale chiamate');
      return this.callChannel;
    }

    console.log('📡 Subscribe al canale "chiamate"...');

    try {
      this.callChannel = this.pusher.subscribe('chiamate');

      // ✅ Evento subscription success
      this.callChannel.bind('pusher:subscription_succeeded', () => {
        console.log('✅ Subscribe chiamate SUCCESS!');
        console.log('📞 Listener attivo per evento "nuova-chiamata"');
      });

      // ✅ Evento subscription error
      this.callChannel.bind('pusher:subscription_error', (status) => {
        console.error('❌ Errore subscribe chiamate:', status);
      });

      // ✅ Listener globale per debug (tutti gli eventi)
      if (process.env.NODE_ENV === 'development') {
        this.callChannel.bind_global((eventName, data) => {
          console.log(`🌐 [Pusher Event] ${eventName}:`, data);
        });
      }

      return this.callChannel;

    } catch (error) {
      console.error('❌ Errore subscribe:', error);
      return null;
    }
  }

  // ✅ LISTENER CHIAMATA ENTRANTE
  onIncomingCall(callback) {
    if (!this.pusher) {
      console.warn('⚠️ Pusher non ancora inizializzato, inizializzo ora...');
      this.initialize().then(() => {
        this._bindCallListener(callback);
      });
      return;
    }

    if (!this.callChannel) {
      console.warn('⚠️ Canale non sottoscritto, subscribing...');
      this.subscribeToCallChannel();
      
      // Attendi 1s per subscribe
      setTimeout(() => {
        this._bindCallListener(callback);
      }, 1000);
      return;
    }

    this._bindCallListener(callback);
  }

  // ✅ Helper per bind listener
  _bindCallListener(callback) {
    if (!this.callChannel) {
      console.error('❌ Canale chiamate non disponibile');
      return;
    }

    console.log('👂 Listener per "nuova-chiamata" registrato');

    // ✅ Bind evento nuova-chiamata
    this.callChannel.bind('nuova-chiamata', (data) => {
      console.log('🔔 CHIAMATA IN ARRIVO via Pusher:', data);
      
      // ✅ Mostra notifica browser se permessi concessi
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('📞 Nuova Chiamata', {
          body: `Chiamata da: ${data.numero}`,
          icon: '/favicon.ico',
          tag: data.callId,
          requireInteraction: true
        });
      }

      // ✅ Emetti evento custom per hook React
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pusher-incoming-call', { 
          detail: data 
        }));
      }

      // ✅ Chiama callback con dati chiamata
      if (typeof callback === 'function') {
        callback(data);
      } else {
        console.warn('⚠️ Callback non è una funzione');
      }
    });
  }

  // ✅ DISCONNECT
  disconnect() {
    if (this.pusher) {
      console.log('🔌 Disconnessione Pusher...');
      
      if (this.callChannel) {
        this.callChannel.unbind_all();
        this.pusher.unsubscribe('chiamate');
        this.callChannel = null;
      }

      this.pusher.disconnect();
      this.pusher = null;
      this.isConnected = false;
      this.initializationPromise = null;
      
      console.log('✅ Pusher disconnesso');
    }
  }

  // ✅ RECONNECT
  reconnect() {
    console.log('🔄 Reconnect Pusher...');
    this.disconnect();
    return this.initialize();
  }

  // ✅ STATUS
  getStatus() {
    return {
      initialized: !!this.pusher,
      connected: this.isConnected,
      socketId: this.pusher?.connection?.socket_id || null,
      connectionState: this.pusher?.connection?.state || 'disconnected',
      channelSubscribed: !!this.callChannel,
      channels: this.pusher ? Object.keys(this.pusher.channels?.channels || {}) : [],
      cluster: this.PUSHER_CLUSTER,
      key: this.PUSHER_KEY
    };
  }
}

// ✅ SINGLETON - Crea istanza unica
const pusherService = new PusherClientService();

// ✅ DEBUG HELPER (window.pusherDebug)
if (typeof window !== 'undefined') {
  window.pusherDebug = {
    service: pusherService,
    
    // Status completo
    status: () => {
      const status = pusherService.getStatus();
      console.log('📊 ===== PUSHER STATUS =====');
      console.log('Initialized:', status.initialized);
      console.log('Connected:', status.connected);
      console.log('Socket ID:', status.socketId);
      console.log('Connection State:', status.connectionState);
      console.log('Channel Subscribed:', status.channelSubscribed);
      console.log('Active Channels:', status.channels);
      console.log('Cluster:', status.cluster);
      console.log('Key:', status.key);
      console.log('============================');
      return status;
    },
    
    // Reconnect manuale
    reconnect: () => {
      console.log('🔄 Reconnect manuale richiesto...');
      return pusherService.reconnect();
    },
    
    // Force subscribe
    forceSubscribe: () => {
      console.log('📡 Force subscribe manuale...');
      return pusherService.subscribeToCallChannel();
    },
    
    // Test chiamata con webhook reale
    testChiamata: (numero = '+393271234567') => {
      console.log('🧪 Test chiamata con webhook backend...');
      console.log('📞 Numero:', numero);
      
      fetch('https://pastificio-backend-production.up.railway.app/api/webhook/chiamata-entrante', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          numero: numero,
          timestamp: new Date().toISOString(),
          callId: 'debug-test-' + Date.now(),
          source: 'debug-console',
          tipo: 'entrante'
        })
      })
      .then(response => {
        console.log('📡 Response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('✅ Webhook risposta:', data);
        console.log('⏳ Attendi evento Pusher...');
      })
      .catch(error => {
        console.error('❌ Errore webhook:', error);
      });
    },
    
    // Test locale (simula evento)
    testLocale: (numero = '+393271234567') => {
      console.log('🧪 Test locale (evento simulato)...');
      
      if (!pusherService.callChannel) {
        console.error('❌ Canale non sottoscritto!');
        return;
      }

      const fakeData = {
        numero: numero,
        timestamp: new Date().toISOString(),
        callId: 'test-local-' + Date.now(),
        source: 'test-frontend',
        tipo: 'entrante',
        cliente: null
      };

      console.log('📤 Emetto evento "nuova-chiamata":', fakeData);
      
      // Emetti evento custom
      window.dispatchEvent(new CustomEvent('pusher-incoming-call', { 
        detail: fakeData 
      }));
    },
    
    // Lista canali attivi
    listChannels: () => {
      const channels = Object.keys(pusherService.pusher?.channels?.channels || {});
      console.log('📡 Canali attivi:', channels);
      return channels;
    },

    // Verifica listener
    checkListeners: () => {
      if (!pusherService.callChannel) {
        console.error('❌ Canale non sottoscritto!');
        return;
      }

      const callbacks = pusherService.callChannel.callbacks;
      console.log('👂 Listener registrati:', callbacks);
      
      const hasListener = callbacks && callbacks['nuova-chiamata'];
      console.log('✅ Listener "nuova-chiamata" presente:', !!hasListener);
      
      return callbacks;
    }
  };
  
  console.log('💡 ===== PUSHER DEBUG COMMANDS =====');
  console.log('window.pusherDebug.status()        - Mostra stato');
  console.log('window.pusherDebug.reconnect()     - Riconnetti');
  console.log('window.pusherDebug.testChiamata()  - Test webhook backend');
  console.log('window.pusherDebug.testLocale()    - Test locale (simula)');
  console.log('window.pusherDebug.forceSubscribe()- Force subscribe');
  console.log('window.pusherDebug.listChannels()  - Lista canali');
  console.log('window.pusherDebug.checkListeners()- Verifica listener');
  console.log('====================================');
}

export default pusherService;
