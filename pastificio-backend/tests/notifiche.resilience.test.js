// tests/notifiche.resilience.test.js
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import { initializeSocketIO } from '../utils/notifiche.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { createProxy } from 'proxy';
import nock from 'nock';

describe('Test Resilienza e Sicurezza', () => {
  let mongoServer, io, httpServer;
  let proxyServer;
  
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    httpServer = createServer();
    io = initializeSocketIO(httpServer);
    proxyServer = createProxy();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    io.close();
    httpServer.close();
    proxyServer.close();
  });

  // Recovery dopo crash
  describe('Recovery Tests', () => {
    test('dovrebbe ripristinare lo stato dopo crash', async () => {
      // Simula crash
      await io.close(true); // Force close
      const savedState = await io.saveState();
      
      // Riavvia server
      io = initializeSocketIO(httpServer);
      await io.restoreState(savedState);
      
      const restoredConnections = io.getActiveConnections();
      expect(restoredConnections).toEqual(savedState.connections);
    });

    test('dovrebbe recuperare notifiche perse durante il downtime', async () => {
      const client = Client(`http://localhost:${port}`);
      const downtime = Date.now();
      
      // Simula downtime
      await io.close();
      await new Promise(r => setTimeout(r, 1000));
      io = initializeSocketIO(httpServer);

      // Verifica recupero notifiche
      const missedNotifications = await io.getMissedNotifications(client.id, downtime);
      expect(missedNotifications.length).toBeGreaterThan(0);
    });
  });

  // Test di Sicurezza
  describe('Security Tests', () => {
    test('dovrebbe prevenire SQL injection', async () => {
      const maliciousPayload = "'; DROP TABLE users; --";
      
      await expect(async () => {
        await io.notificaNuovoOrdine({
          userId: maliciousPayload
        });
      }).rejects.toThrow();
    });

    test('dovrebbe prevenire XSS attacks', async () => {
      const xssPayload = "<script>alert('xss')</script>";
      const notification = await io.notificaNuovoOrdine({
        message: xssPayload
      });
      
      expect(notification.message).not.toContain('<script>');
    });

    test('dovrebbe validare e sanitizzare JWT', async () => {
      const maliciousToken = jwt.sign(
        { admin: true },
        'wrong_secret'
      );

      const client = Client(`http://localhost:${port}`, {
        auth: { token: maliciousToken }
      });

      await expect(
        new Promise((resolve, reject) => {
          client.on('connect', resolve);
          client.on('connect_error', reject);
        })
      ).rejects.toThrow();
    });

    test('dovrebbe limitare rate delle connessioni', async () => {
      const connections = [];
      
      for (let i = 0; i < 1000; i++) {
        connections.push(
          Client(`http://localhost:${port}`, {
            auth: { token: `token-${i}` }
          })
        );
      }

      const results = await Promise.allSettled(
        connections.map(client => 
          new Promise(resolve => client.on('connect', resolve))
        )
      );

      const rejected = results.filter(r => r.status === 'rejected');
      expect(rejected.length).toBeGreaterThan(0);
    });
  });

  // Test Resilienza Rete
  describe('Network Resilience Tests', () => {
    test('dovrebbe gestire latenza alta', async () => {
      // Configura proxy con latenza
      proxyServer.slow({
        latency: 1000
      });

      const client = Client(`http://localhost:${port}`, {
        proxy: proxyServer.url
      });

      const start = Date.now();
      await new Promise(resolve => client.on('connect', resolve));
      
      expect(client.connected).toBe(true);
      expect(Date.now() - start).toBeGreaterThan(1000);
    });

    test('dovrebbe gestire packet loss', async () => {
      proxyServer.flaky({
        failRate: 0.3
      });

      const client = Client(`http://localhost:${port}`, {
        proxy: proxyServer.url,
        reconnectionAttempts: 3
      });

      await new Promise(resolve => {
        client.on('connect', resolve);
      });

      expect(client.connected).toBe(true);
    });

    test('dovrebbe mantenere ordine messaggi con rete instabile', async () => {
      proxyServer.flaky({
        failRate: 0.2,
        outOfOrder: true
      });

      const messages = [];
      const client = Client(`http://localhost:${port}`, {
        proxy: proxyServer.url
      });

      client.on('message', (msg) => messages.push(msg));

      for (let i = 0; i < 100; i++) {
        await io.emit('message', { seq: i });
      }

      await new Promise(r => setTimeout(r, 1000));
      
      // Verifica ordine corretto
      expect(messages).toEqual(
        messages.sort((a, b) => a.seq - b.seq)
      );
    });

    test('dovrebbe sincronizzare dopo partizione di rete', async () => {
      // Simula network partition
      proxyServer.partition();
      
      const client1 = Client(`http://localhost:${port}`);
      const client2 = Client(`http://localhost:${port}`);
      
      // Genera eventi durante la partizione
      const events = [];
      for (let i = 0; i < 10; i++) {
        events.push(io.notificaNuovoOrdine({
          _id: `order-${i}`
        }));
      }

      // Rimuovi partizione
      proxyServer.heal();
      await new Promise(r => setTimeout(r, 1000));

      // Verifica sincronizzazione
      const events1 = await client1.getEvents();
      const events2 = await client2.getEvents();
      expect(events1).toEqual(events2);
    });
  });
});