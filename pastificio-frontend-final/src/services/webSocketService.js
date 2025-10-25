// services/webSocketService.js - STUB (disabilitato, usa Pusher)
// Questo file è mantenuto solo per compatibilità con componenti esistenti
// WebSocket è sostituito da Pusher per chiamate CX3

class WebSocketServiceStub {
  constructor() {
    this.connected = false;
    console.log('⚠️ WebSocketService disabilitato - Usa Pusher per real-time');
  }

  connect() {
    console.log('⚠️ WebSocket.connect() chiamato ma disabilitato');
    return Promise.resolve();
  }

  disconnect() {
    console.log('⚠️ WebSocket.disconnect() chiamato ma disabilitato');
  }

  on(event, callback) {
    console.log(`⚠️ WebSocket.on('${event}') chiamato ma disabilitato`);
  }

  off(event, callback) {
    console.log(`⚠️ WebSocket.off('${event}') chiamato ma disabilitato`);
  }

  emit(event, data) {
    console.log(`⚠️ WebSocket.emit('${event}') chiamato ma disabilitato`);
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

// NON auto-connect (disabilitato)

export default webSocketService;