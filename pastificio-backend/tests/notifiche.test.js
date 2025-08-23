// tests/notifiche.test.js
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import { initializeSocketIO } from '../utils/notifiche.js';
import { jest } from '@jest/globals';
import { logger } from '../config/logger.js';

describe('Sistema Notifiche', () => {
  let io, serverSocket, clientSocket, httpServer;
  let adminSocket, userSocket;

  beforeAll((done) => {
    httpServer = createServer();
    io = initializeSocketIO(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      
      // Client admin
      adminSocket = Client(`http://localhost:${port}`, {
        auth: {
          token: 'admin-token',
          userId: 'admin-user',
          ruolo: 'admin'
        }
      });

      // Client utente normale
      userSocket = Client(`http://localhost:${port}`, {
        auth: {
          token: 'user-token',
          userId: 'normal-user',
          ruolo: 'user'
        }
      });

      done();
    });
  });

  afterAll(() => {
    io.close();
    adminSocket.close();
    userSocket.close();
    httpServer.close();
  });

  // Test di connessione
  describe('Connessione', () => {
    test('dovrebbe connettersi come admin', (done) => {
      adminSocket.on('connect', () => {
        expect(adminSocket.connected).toBe(true);
        done();
      });
    });

    test('dovrebbe connettersi come utente normale', (done) => {
      userSocket.on('connect', () => {
        expect(userSocket.connected).toBe(true);
        done();
      });
    });

    test('dovrebbe rifiutare connessione senza token', (done) => {
      const invalidSocket = Client(`http://localhost:${port}`);
      invalidSocket.on('connect_error', (err) => {
        expect(err.message).toBe('Autenticazione richiesta');
        invalidSocket.close();
        done();
      });
    });
  });

  // Test notifiche ordini
  describe('Notifiche Ordini', () => {
    test('admin dovrebbe ricevere notifica nuovo ordine', (done) => {
      const testOrder = { _id: 'test-1', userId: 'normal-user' };
      
      adminSocket.on('nuovoOrdine', (data) => {
        expect(data.ordine._id).toBe(testOrder._id);
        done();
      });

      io.emit('nuovoOrdine', { ordine: testOrder });
    });

    test('utente dovrebbe ricevere solo i propri ordini', (done) => {
      const testOrder = { _id: 'test-2', userId: 'normal-user' };
      const otherOrder = { _id: 'test-3', userId: 'other-user' };
      
      let receivedCount = 0;
      userSocket.on('nuovoOrdine', (data) => {
        expect(data.ordine.userId).toBe('normal-user');
        receivedCount++;
        if (receivedCount === 1) done();
      });

      io.emit('nuovoOrdine', { ordine: testOrder });
      io.emit('nuovoOrdine', { ordine: otherOrder });
    });
  });

  // Test buffer notifiche
  describe('Buffer Notifiche', () => {
    test('dovrebbe bufferizzare notifiche per utenti offline', async () => {
      const offlineUserId = 'offline-user';
      const testOrder = { _id: 'test-4', userId: offlineUserId };

      await io.notificaNuovoOrdine(testOrder);
      const buffer = await io.getNotificationBuffer(offlineUserId);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer[0].data.ordine._id).toBe(testOrder._id);
    });

    test('dovrebbe consegnare notifiche bufferizzate alla riconnessione', (done) => {
      const offlineUserId = 'reconnecting-user';
      const testOrder = { _id: 'test-5', userId: offlineUserId };

      io.notificaNuovoOrdine(testOrder).then(() => {
        const reconnectingSocket = Client(`http://localhost:${port}`, {
          auth: {
            token: 'test-token',
            userId: offlineUserId,
            ruolo: 'user'
          }
        });

        reconnectingSocket.on('buffered_notifications', (notifications) => {
          expect(notifications).toBeDefined();
          expect(notifications.length).toBeGreaterThan(0);
          expect(notifications[0].data.ordine._id).toBe(testOrder._id);
          reconnectingSocket.close();
          done();
        });
      });
    });
  });

  // Test stato utenti
  describe('Stato Utenti', () => {
    test('dovrebbe tracciare lo stato online degli utenti', (done) => {
      adminSocket.on('user_status', (status) => {
        expect(status.userId).toBeDefined();
        expect(status.online).toBeDefined();
        expect(status.lastSeen).toBeDefined();
        done();
      });

      userSocket.disconnect().connect();
    });

    test('dovrebbe aggiornare lastSeen con il ping', (done) => {
      const before = Date.now();
      userSocket.emit('ping');
      userSocket.on('pong', () => {
        const userStatus = io.getUserStatus('normal-user');
        expect(userStatus.lastSeen.getTime()).toBeGreaterThanOrEqual(before);
        done();
      });
    });
  });

  // Test recupero stato
  describe('Recupero Stato', () => {
    test('dovrebbe recuperare notifiche perse', (done) => {
      const lastMessageId = 'last-message-id';
      userSocket.emit('recover_state', lastMessageId);
      
      userSocket.on('state_recovery', (notifications) => {
        expect(Array.isArray(notifications)).toBe(true);
        done();
      });
    });
  });

  // Test gestione errori
  describe('Gestione Errori', () => {
    test('dovrebbe gestire errori di autenticazione', (done) => {
      const invalidSocket = Client(`http://localhost:${port}`, {
        auth: {
          token: 'invalid-token'
        }
      });

      invalidSocket.on('connect_error', (err) => {
        expect(err).toBeDefined();
        invalidSocket.close();
        done();
      });
    });

    test('dovrebbe gestire disconnessioni impreviste', (done) => {
      const testSocket = Client(`http://localhost:${port}`, {
        auth: {
          token: 'test-token',
          userId: 'test-user',
          ruolo: 'user'
        }
      });

      testSocket.on('connect', () => {
        // Simula una disconnessione imprevista
        testSocket.disconnect();
        
        // Verifica che lo stato sia aggiornato
        setTimeout(() => {
          const userStatus = io.getUserStatus('test-user');
          expect(userStatus.online).toBe(false);
          done();
        }, 6000);
      });
    });
  });
});