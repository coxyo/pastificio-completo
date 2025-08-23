// tests/integration/dashboard.test.js
import { jest } from '@jest/globals';
import { Ordine } from '../../models/Ordine.js';

describe('Dashboard Tests', () => {
  describe('Statistiche Giornaliere', () => {
    it('dovrebbe calcolare correttamente le statistiche del giorno', async () => {
      const stats = await getDailyStats();
      expect(stats).toHaveProperty('totaleOrdini');
      expect(stats).toHaveProperty('totaleValore');
      expect(stats).toHaveProperty('prodottiPiuVenduti');
    });

    it('dovrebbe aggiornare le statistiche in tempo reale', async () => {
      const wsClient = new WebSocketTestClient();
      await wsClient.connect();
      
      // Crea nuovo ordine
      const nuovoOrdine = await Ordine.create({...});
      
      // Verifica aggiornamento statistiche via WebSocket
      const message = await wsClient.waitForMessage();
      expect(message.type).toBe('STATS_UPDATE');
    });
  });

  describe('Report Personalizzati', () => {
    it('dovrebbe generare report per periodo specifico', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const report = await generateCustomReport(startDate, endDate);
      expect(report.periodo).toEqual({ startDate, endDate });
      expect(report.dati).toBeDefined();
    });
  });
});

// tests/unit/realtime.test.js
describe('Real-time Sync Tests', () => {
  let wsServer, wsClient;

  beforeAll(async () => {
    wsServer = new WebSocketServer();
    wsClient = new WebSocketClient();
  });

  it('dovrebbe notificare i client connessi di nuovi ordini', async () => {
    await wsClient.connect();
    const ordine = await Ordine.create({...});
    const notification = await wsClient.waitForMessage();
    expect(notification.type).toBe('NEW_ORDER');
    expect(notification.data.id).toBe(ordine._id.toString());
  });

  it('dovrebbe sincronizzare modifiche agli ordini', async () => {
    const ordine = await Ordine.create({...});
    await wsClient.connect();
    
    await Ordine.findByIdAndUpdate(ordine._id, { stato: 'completato' });
    
    const update = await wsClient.waitForMessage();
    expect(update.type).toBe('ORDER_UPDATE');
    expect(update.data.stato).toBe('completato');
  });
});

// tests/edge-cases/ordini.test.js
describe('Ordini Edge Cases', () => {
  it('dovrebbe gestire ordini con molti prodotti', async () => {
    const moltiProdotti = Array.from({ length: 100 }, (_, i) => ({
      nome: `Prodotto ${i}`,
      quantita: 1,
      prezzo: 10,
      unitaMisura: 'Pezzi'
    }));

    const ordine = await Ordine.create({
      nomeCliente: 'Test',
      prodotti: moltiProdotti,
      dataRitiro: new Date('2024-12-07')
    });

    expect(ordine.prodotti).toHaveLength(100);
    expect(ordine.totale).toBe(1000);
  });

  it('dovrebbe gestire concorrenza su modifica ordine', async () => {
    const ordine = await Ordine.create({...});
    
    // Simula modifiche concorrenti
    const update1 = Ordine.findByIdAndUpdate(ordine._id, { stato: 'in_lavorazione' });
    const update2 = Ordine.findByIdAndUpdate(ordine._id, { stato: 'completato' });
    
    await Promise.all([update1, update2]);
    
    const ordineFinale = await Ordine.findById(ordine._id);
    expect(ordineFinale.statoUltimaModifica).toBeDefined();
  });
});
