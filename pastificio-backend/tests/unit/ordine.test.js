// tests/unit/ordini.test.js
import mongoose from 'mongoose';
import { Ordine } from '../../models/Ordine.js';
import { createTestOrdine } from '../utils/test-helpers.js';

describe('Ordini Unit Tests', () => {
  describe('Validazione', () => {
    it('dovrebbe creare un ordine valido', async () => {
      const ordine = await createTestOrdine(Ordine);
      expect(ordine._id).toBeDefined();
      expect(ordine.nomeCliente).toBeDefined();
    });

    it('dovrebbe validare i campi obbligatori', async () => {
      await expect(Ordine.create({})).rejects.toThrow();
    });

    it('dovrebbe validare la data di ritiro', async () => {
      await expect(
        createTestOrdine(Ordine, { dataRitiro: 'data invalida' })
      ).rejects.toThrow();
    });
  });

  describe('Calcoli', () => {
    it('dovrebbe calcolare il totale correttamente', async () => {
      const ordine = await createTestOrdine(Ordine);
      expect(ordine.totale).toBe(36); // 2 * 18
    });

    it('dovrebbe applicare la maggiorazione per il viaggio', async () => {
      const ordine = await createTestOrdine(Ordine, { deveViaggiare: true });
      expect(ordine.totale).toBeGreaterThan(36);
    });
  });
});
