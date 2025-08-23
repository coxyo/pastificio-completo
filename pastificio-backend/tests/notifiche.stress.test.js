// tests/notifiche.stress.test.js
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import { initializeSocketIO } from '../utils/notifiche.js';
import cluster from 'cluster';
import { cpus } from 'os';
import siege from 'siege';
import penetrate from 'pentest-tools';
import { injectFault } from 'fault-injection';

describe('Stress, Penetration and Isolation Tests', () => {
  let io, httpServer;
  
  beforeAll(async () => {
    httpServer = createServer();
    io = initializeSocketIO(httpServer);
  });

  // Stress Tests
  describe('Intensive Stress Tests', () => {
    test('dovrebbe gestire carico massimo distribuito', async () => {
      if (cluster.isPrimary) {
        const numCPUs = cpus().length;
        const workers = [];
        
        // Spawn worker per ogni CPU
        for (let i = 0; i < numCPUs; i++) {
          workers.push(cluster.fork());
        }

        // Monitora uso CPU e memoria
        const metrics = await Promise.all(
          workers.map(worker => 
            worker.send('START_STRESS')
              .then(() => worker.metrics)
          )
        );

        expect(Math.max(...metrics.map(m => m.cpuUsage))).toBeLessThan(90);
        expect(Math.max(...metrics.map(m => m.memoryUsage))).toBeLessThan(90);
      } else {
        // Worker code
        const NUM_CLIENTS = 1000;
        const MESSAGES_PER_CLIENT = 1000;
        
        const clients = await Promise.all(
          Array(NUM_CLIENTS).fill().map(() => createStressClient())
        );

        await Promise.all(
          clients.map(client => 
            sendMessages(client, MESSAGES_PER_CLIENT)
          )
        );
      }
    }, 30000);

    test('dovrebbe mantenere performance sotto carico sostenuto', async () => {
      const siege = new Siege();
      
      const results = await siege
        .concurrent(1000)
        .iterations(10000)
        .get('http://localhost:3000/socket.io')
        .attack();

      expect(results.response.time.median).toBeLessThan(100);
      expect(results.success).toBeGreaterThan(99.9);
    });
  });

  // Penetration Tests
  describe('Penetration Tests', () => {
    test('dovrebbe resistere a DDoS', async () => {
      const attack = penetrate.ddos({
        target: 'ws://localhost:3000',
        duration: 60,
        rate: 10000
      });

      const metrics = await io.getMetrics();
      expect(metrics.availability).toBeGreaterThan(99);
    });

    test('dovrebbe prevenire websocket hijacking', async () => {
      const results = await penetrate.websocket({
        target: 'ws://localhost:3000',
        attacks: ['hijack', 'replay', 'mitm']
      });

      expect(results.vulnerabilities).toHaveLength(0);
    });

    test('dovrebbe prevenire memory exhaustion', async () => {
      const attack = await penetrate.memory({
        target: 'ws://localhost:3000',
        payload: 'X'.repeat(1024 * 1024 * 100), // 100MB
        connections: 1000
      });

      const metrics = await io.getMetrics();
      expect(metrics.memoryUsage).toBeLessThan(90);
    });
  });

  // Fault Isolation Tests
  describe('Fault Isolation Tests', () => {
    test('dovrebbe isolare crash di singoli client', async () => {
      const clients = await Promise.all(
        Array(100).fill().map(() => createClient())
      );

      // Inietta fault in client random
      const faultyClient = clients[Math.floor(Math.random() * clients.length)];
      injectFault(faultyClient, {
        type: 'crash',
        probability: 1
      });

      // Verifica che altri client funzionino
      const workingClients = clients.filter(c => c !== faultyClient);
      const results = await Promise.all(
        workingClients.map(client => 
          new Promise(resolve => client.on('pong', resolve))
        )
      );

      expect(results).toHaveLength(99);
    });

    test('dovrebbe isolare memory leak', async () => {
      // Inietta memory leak
      injectFault(io, {
        type: 'memory_leak',
        rate: '1MB/s',
        duration: '10s'
      });

      const initialMemory = process.memoryUsage().heapUsed;
      await new Promise(r => setTimeout(r, 15000));
      const finalMemory = process.memoryUsage().heapUsed;

      // Verifica che leak sia contenuto
      expect((finalMemory - initialMemory) / 1024 / 1024).toBeLessThan(15);
    });

    test('dovrebbe isolare database failures', async () => {
      // Inietta fallimenti DB
      injectFault(mongoose.connection, {
        type: 'timeout',
        probability: 0.5
      });

      const results = await Promise.allSettled(
        Array(100).fill().map(() => 
          io.notificaNuovoOrdine({ test: true })
        )
      );

      // Verifica che alcuni ordini passino
      expect(results.filter(r => r.status === 'fulfilled').length)
        .toBeGreaterThan(0);
    });
  });

  // Helper functions
  async function createStressClient() {
    const client = Client(`http://localhost:${port}`, {
      auth: { token: 'stress-test' }
    });
    await new Promise(resolve => client.on('connect', resolve));
    return client;
  }

  async function sendMessages(client, count) {
    for (let i = 0; i < count; i++) {
      await new Promise(resolve => {
        client.emit('echo', { seq: i });
        client.once('echo', resolve);
      });
    }
  }
});