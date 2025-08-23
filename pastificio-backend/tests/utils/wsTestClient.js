// tests/utils/wsTestClient.js
export class WebSocketTestClient {
  constructor() {
    this.messages = [];
    this.connected = false;
  }

  async connect() {
    // Setup connessione WebSocket di test
  }

  async waitForMessage(timeout = 1000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for message'));
      }, timeout);

      this.onMessage = (msg) => {
        clearTimeout(timer);
        resolve(msg);
      };
    });
  }
}