// services/webSocketService.js - STUB COMPLETO (NON fa nulla)
// WebSocket disabilitato - Pusher gestisce real-time

class WebSocketServiceStub {
  constructor() {
    this.connected = false;
    this.socket = null;
    // console.log('⚠️ WebSocketService disabilitato - Usa Pusher');
  }

  connect() {
    // NON fa nulla
    return Promise.resolve();
  }

  disconnect() {
    // NON fa nulla
  }

  on(event, callback) {
    // NON fa nulla
  }

  off(event, callback) {
    // NON fa nulla
  }

  emit(event, data) {
    // NON fa nulla
  }

  isConnected() {
    return false;
  }

  getStatus() {
    return {
      connected: false,
      disabled: true,
      message: 'WebSocket disabilitato - usa Pusher'
    };
  }
}

// Singleton
const webSocketService = new WebSocketServiceStub();

// NON auto-connect (completamente disabilitato)

export default webSocketService;