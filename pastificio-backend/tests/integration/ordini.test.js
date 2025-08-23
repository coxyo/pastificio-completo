// tests/integration/ordini.test.js
import request from 'supertest';
import { app } from '../../server.js';
import { createTestOrdine, createTestUser, getAuthToken } from '../utils/test-helpers.js';

describe('Ordini API Tests', () => {
  let token;

  beforeEach(async () => {
    token = await getAuthToken();
  });

  describe('CRUD Operations', () => {
    it('POST /api/ordini - dovrebbe creare un ordine', async () => {
      const res = await request(app)
        .post('/api/ordini')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nomeCliente: 'Test Cliente',
          dataRitiro: '2024-12-07',
          prodotti: [{ nome: 'Test', quantita: 1, prezzo: 10 }]
        });

      expect(res.status).toBe(201);
      expect(res.body.data._id).toBeDefined();
    });

    it('GET /api/ordini - dovrebbe ottenere tutti gli ordini', async () => {
      const res = await request(app)
        .get('/api/ordini')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Filtri e Ricerca', () => {
    it('dovrebbe filtrare per data', async () => {
      const res = await request(app)
        .get('/api/ordini')
        .query({ data: '2024-12-07' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});