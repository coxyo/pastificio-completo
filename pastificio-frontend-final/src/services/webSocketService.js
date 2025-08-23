// services/webSocketService.js

// Mock implementation per quando socket.io-client non è disponibile
class MockSocket {
  constructor() {
    this.connected = false;
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  off(event, callback) {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    console.log(`Mock emit: ${event}`, data);
  }

  disconnect() {
    this.connected = false;
  }
}

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connectionListeners = new Set();
    this.eventListeners = new Map();
    this.mockMode = true; // Always start in mock mode
    this.mockInterval = null;
  }

  async connect(token) {
    console.log('🎭 WebSocket Service - Modalità MOCK attiva');
    
    // Usa sempre mock per ora
    this.mockMode = true;
    this.socket = new MockSocket();
    this.connected = true;
    
    // Notifica i listener della connessione
    this.notifyConnectionListeners(true);
    
    // Avvia simulazione eventi
    this.simulateMockEvents();
    
    return Promise.resolve();
  }

  disconnect() {
    console.log('🔌 Disconnessione WebSocket...');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    
    this.connected = false;
    this.notifyConnectionListeners(false);
  }

  emit(event, data) {
    console.log(`📤 Mock emit ${event}:`, data);
    
    // Gestisci l'evento in modo mock
    this.handleMockEmit(event, data);
  }

  on(event, callback) {
    console.log(`👂 Registering listener for ${event}`);
    
    // Salva nel registro locale
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
    
    // Registra anche sul mock socket se esiste
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    // Rimuovi dal socket se esiste
    if (this.socket) {
      this.socket.off(event, callback);
    }
    
    // Rimuovi dal registro locale
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  addConnectionListener(callback) {
    this.connectionListeners.add(callback);
    // Notifica immediatamente lo stato corrente
    callback(this.connected);
  }

  removeConnectionListener(callback) {
    this.connectionListeners.delete(callback);
  }

  notifyConnectionListeners(connected) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  notifyEventListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Gestione eventi mock per il magazzino
  handleMockEmit(event, data) {
    setTimeout(() => {
      switch(event) {
        case 'richiedi_inventario':
        case 'get_inventario':
          console.log('📦 Invio inventario mock...');
          this.notifyEventListeners('inventario_aggiornato', {
            success: true,
            data: this.getMockInventario()
          });
          break;
          
        case 'aggiungi_movimento':
        case 'add_movimento':
          console.log('➕ Aggiunta movimento mock...');
          const movimento = {
            ...data,
            id: Date.now(),
            dataCreazione: new Date().toISOString(),
            success: true
          };
          this.notifyEventListeners('movimento_aggiunto', movimento);
          
          // Aggiorna anche l'inventario
          setTimeout(() => {
            this.notifyEventListeners('inventario_aggiornato', {
              success: true,
              data: this.getMockInventario()
            });
          }, 100);
          break;
          
        case 'elimina_movimento':
        case 'delete_movimento':
          console.log('🗑️ Eliminazione movimento mock...');
          this.notifyEventListeners('movimento_eliminato', {
            success: true,
            id: data.id
          });
          break;
          
        case 'get_movimenti':
          console.log('📋 Invio movimenti mock...');
          this.notifyEventListeners('movimenti_caricati', {
            success: true,
            data: this.getMockMovimenti()
          });
          break;
          
        default:
          console.log('⚠️ Mock event non gestito:', event);
      }
    }, 300);
  }

  // Dati mock per l'inventario
  getMockInventario() {
    return [
      { 
        id: 1, 
        prodotto: 'Farina 00', 
        quantita: 100, 
        unita: 'kg', 
        minimo: 20, 
        categoria: 'Farine',
        ultimoAggiornamento: new Date().toISOString()
      },
      { 
        id: 2, 
        prodotto: 'Semola di grano duro', 
        quantita: 50, 
        unita: 'kg', 
        minimo: 10, 
        categoria: 'Farine',
        ultimoAggiornamento: new Date().toISOString()
      },
      { 
        id: 3, 
        prodotto: 'Sale fino', 
        quantita: 20, 
        unita: 'kg', 
        minimo: 5, 
        categoria: 'Condimenti',
        ultimoAggiornamento: new Date().toISOString()
      },
      { 
        id: 4, 
        prodotto: 'Lievito di birra', 
        quantita: 5, 
        unita: 'kg', 
        minimo: 2, 
        categoria: 'Lieviti',
        ultimoAggiornamento: new Date().toISOString()
      },
      { 
        id: 5, 
        prodotto: 'Olio extravergine', 
        quantita: 30, 
        unita: 'L', 
        minimo: 10, 
        categoria: 'Condimenti',
        ultimoAggiornamento: new Date().toISOString()
      },
      { 
        id: 6, 
        prodotto: 'Uova fresche', 
        quantita: 200, 
        unita: 'pz', 
        minimo: 50, 
        categoria: 'Uova e Latticini',
        ultimoAggiornamento: new Date().toISOString()
      },
      { 
        id: 7, 
        prodotto: 'Burro', 
        quantita: 15, 
        unita: 'kg', 
        minimo: 5, 
        categoria: 'Uova e Latticini',
        ultimoAggiornamento: new Date().toISOString()
      },
      { 
        id: 8, 
        prodotto: 'Zucchero semolato', 
        quantita: 25, 
        unita: 'kg', 
        minimo: 10, 
        categoria: 'Altro',
        ultimoAggiornamento: new Date().toISOString()
      },
      { 
        id: 9, 
        prodotto: 'Lievito madre', 
        quantita: 3, 
        unita: 'kg', 
        minimo: 1, 
        categoria: 'Lieviti',
        ultimoAggiornamento: new Date().toISOString()
      },
      { 
        id: 10, 
        prodotto: 'Strutto', 
        quantita: 10, 
        unita: 'kg', 
        minimo: 3, 
        categoria: 'Grassi',
        ultimoAggiornamento: new Date().toISOString()
      }
    ];
  }

  // Dati mock per i movimenti
  getMockMovimenti() {
    const oggi = new Date();
    const movimenti = [];
    
    for (let i = 0; i < 10; i++) {
      const data = new Date(oggi);
      data.setDate(data.getDate() - i);
      
      movimenti.push({
        id: Date.now() + i,
        tipo: ['carico', 'scarico', 'rettifica'][Math.floor(Math.random() * 3)],
        prodotto: this.getMockInventario()[Math.floor(Math.random() * 10)].prodotto,
        quantita: Math.floor(Math.random() * 50) + 1,
        unita: 'kg',
        dataMovimento: data.toISOString(),
        operatore: ['Mario Rossi', 'Luigi Verdi', 'Anna Bianchi'][Math.floor(Math.random() * 3)],
        note: 'Movimento di test',
        numeroDocumento: `DOC-${2024}${String(100 + i).padStart(4, '0')}`
      });
    }
    
    return movimenti;
  }

  // Simula eventi periodici in mock mode
  simulateMockEvents() {
    if (this.mockInterval) return;
    
    console.log('🎭 Avvio simulazione eventi mock per magazzino...');
    
    // Invia subito l'inventario iniziale
    setTimeout(() => {
      this.notifyEventListeners('inventario_aggiornato', {
        success: true,
        data: this.getMockInventario()
      });
    }, 500);
    
    // Invia i movimenti iniziali
    setTimeout(() => {
      this.notifyEventListeners('movimenti_caricati', {
        success: true,
        data: this.getMockMovimenti()
      });
    }, 1000);
    
    // Simula movimenti casuali ogni 20 secondi
    this.mockInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const inventario = this.getMockInventario();
        const prodotto = inventario[Math.floor(Math.random() * inventario.length)];
        
        const movimento = {
          id: Date.now(),
          tipo: ['carico', 'scarico'][Math.floor(Math.random() * 2)],
          prodotto: prodotto.prodotto,
          quantita: Math.floor(Math.random() * 20) + 1,
          unita: prodotto.unita,
          fornitore: ['Fornitore A', 'Fornitore B', 'Produzione interna'][Math.floor(Math.random() * 3)],
          note: 'Movimento automatico di test',
          dataMovimento: new Date().toISOString(),
          operatore: 'Sistema Mock',
          numeroDocumento: `DOC-${Date.now()}`
        };
        
        console.log('🎭 Mock movimento generato:', movimento);
        this.notifyEventListeners('movimento_aggiunto', movimento);
        
        // Aggiorna inventario
        setTimeout(() => {
          this.notifyEventListeners('inventario_aggiornato', {
            success: true,
            data: this.getMockInventario()
          });
        }, 500);
      }
    }, 20000);
  }

  isConnected() {
    return this.connected;
  }

  getSocket() {
    return this.socket;
  }

  isMockMode() {
    return this.mockMode;
  }
}

// Crea singleton
const webSocketService = new WebSocketService();

// Auto-connect quando il documento è pronto
if (typeof window !== 'undefined') {
  // Connetti dopo che il DOM è caricato
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      webSocketService.connect(null);
    });
  } else {
    // DOM già caricato
    setTimeout(() => {
      webSocketService.connect(null);
    }, 100);
  }
  
  // Riconnetti quando la pagina torna visibile
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !webSocketService.isConnected()) {
      console.log('🔄 Pagina attiva, riconnetto...');
      webSocketService.connect(null);
    }
  });
}

// Export default
export default webSocketService;

// Named export per compatibilità
export { webSocketService as WebSocketService };