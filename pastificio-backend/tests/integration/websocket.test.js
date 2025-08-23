// tests/integration/websocket.test.js
import { io as Client } from 'socket.io-client';
import { createTestOrdine } from '../utils/test-helpers.js';

describe('WebSocket Tests', () => {
  let io, httpServer, clientSocket;

  beforeAll(async () => {
    const setup = await global.setupTestServer();
    io = setup.io;
    httpServer = setup.httpServer;
  });

  afterAll(async () => {
    await global.closeTestServer();
  });

  beforeEach((done) => {
    clientSocket = Client(`http://localhost:${httpServer.address().port}`);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it('dovrebbe notificare nuovo ordine', (done) => {
    clientSocket.on('nuovoOrdine', (data) => {
      expect(data).toBeDefined();
      expect(data.nomeCliente).toBeDefined();
      done();
    });

    createTestOrdine().then((ordine) => {
      io.emit('nuovoOrdine', ordine);
    });
  });
});