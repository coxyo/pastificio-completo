// tests/notifiche.advanced.test.js
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import { initializeSocketIO } from '../utils/notifiche.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Ordine } from '../models/Ordine.js';
import { User } from '../models/User.js';
import { performance } from 'perf_hooks';

describe('Test Avanzati Sistema Notifiche', () => {
  let mongoServer;
  let io, httpServer;
  const clients = [];

  beforeAll(async () => {
    // Setup MongoDB in-memory per i test
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    httpServer = createServer();
    io = initializeSocketIO(httpServer);
  });

  afterAll(async () => {
    await Promise.all(clients.map(client => client.close()));
    await mongoose.disconnect();
    await mongoServer.stop();
    io.close();
    httpServer.close();
  });

  // Test di Performance
  describe('Performance Tests', () => {
    test('dovrebbe gestire 100 connessioni simultanee', async () => {
      const start = performance.now();
      const connections = [];

      for (let i = 0; i < 100; i++) {
        connections.push(
          new Promise(resolve => {
            const client = Client(`http://localhost:${port}`, {
              auth: {
                token: `test-token-${i}`,
                userId: `user-${i}`,
                ruolo: 'user'
              }
            });
            clients.push(client);
            client.on('connect', resolve);
          })
        );
      }

      await Promise.all(connections);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(5000); // Max 5 secondi
      expect(io.getActiveConnections()).toBe(100);
    });

    test('dovrebbe gestire 1000 notifiche al secondo', async () => {
      const notifications = [];
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        notifications.push(
          io.notificaNuovoOrdine({
            _id: `order-${i}`,
            userId: `user-${i % 100}`
          })
        );
      }

      await Promise.all(notifications);
      const end = performance.now();

      expect(end - start).toBeLessThan(1000); // Max 1 secondo
    });

    test('dovrebbe mantenere latenza sotto 100ms con carico', async () => {
      const latencies = [];
      const client = clients[0];

      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await new Promise(resolve => {
          client.emit('ping');
          client.once('pong', () => {
            latencies.push(performance.now() - start);
            resolve();
          });
        });
      }

      const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
      expect(avgLatency).toBeLessThan(100);
    });
  });

  // Test di Integrazione Database
  describe('Database Integration Tests', () => {
    test('dovrebbe sincronizzare notifiche con il database', async () => {
      const order = await Ordine.create({
        userId: 'test-user',
        products: [{ name: 'Test', quantity: 1 }]
      });

      const notificationPromise = new Promise(resolve => {
        clients[0].once('nuovoOrdine', resolve);
      });

      await io.notificaNuovoOrdine(order);
      const notification = await notificationPromise;

      expect(notification.ordine._id.toString()).toBe(order._id.toString());
    });

    test('dovrebbe gestire fallimenti del database', async () => {
      const originalSave = mongoose.Model.prototype.save;
      mongoose.Model.prototype.save = () => Promise.reject(new Error('DB Error'));

      try {
        const result = await io.notificaNuovoOrdine({
          userId: 'test-user',
          products: [{ name: 'Test', quantity: 1 }]
        });
        expect(result.error).toBeDefined();
      } finally {
        mongoose.Model.prototype.save = originalSave;
      }
    });
  });

  // Test Race Conditions
  describe('Race Condition Tests', () => {
    test('dovrebbe gestire aggiornamenti simultanei dello stesso ordine', async () => {
      const order = await Ordine.create({
        userId: 'test-user',
        products: [{ name: 'Test', quantity: 1 }]
      });

      const updates = [];
      for (let i = 0; i < 10; i++) {
        updates.push(
          io.notificaOrdineAggiornato({
            ...order.toObject(),
            status: `status-${i}`
          })
        );
      }

      const results = await Promise.all(updates);
      const notifications = new Set(results.map(r => r.version));
      expect(notifications.size).toBe(10); // Versioni uniche
    });

    test('dovrebbe gestire connessioni/disconnessioni simultanee', async () => {
      const client = clients[0];
      const operations = [];

      for (let i = 0; i < 100; i++) {
        operations.push(
          new Promise(resolve => {
            client.disconnect().connect();
            client.once('connect', resolve);
          })
        );
      }

      await Promise.all(operations);
      expect(client.connected).toBe(true);
    });

    test('dovrebbe gestire consegna notifiche concorrenti', async () => {
      const client = clients[0];
      const notifications = new Set();

      client.on('nuovoOrdine', (data) => {
        if (notifications.has(data.ordine._id)) {
          throw new Error('Notifica duplicata');
        }
        notifications.add(data.ordine._id);
      });

      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          io.notificaNuovoOrdine({
            _id: `order-${i}`,
            userId: client.auth.userId
          })
        );
      }

      await Promise.all(promises);
      expect(notifications.size).toBe(100); // No duplicati
    });
  });

  // Test Memory Leaks
  describe('Memory Tests', () => {
    test('non dovrebbe avere memory leaks con molte operazioni', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 1000; i++) {
        await io.notificaNuovoOrdine({
          _id: `order-${i}`,
          userId: `user-${i % 100}`
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const diff = finalMemory - initialMemory;
      
      // Non dovrebbe aumentare più del 50%
      expect(diff / initialMemory).toBeLessThan(0.5);
    });
  });
});
