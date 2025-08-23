// tests/ordini.validation.test.js
import mongoose from 'mongoose';
import { Ordine } from '../models/Ordine.js';

describe('Ordine Validation Tests', () => {
  let ordineBase;

  beforeEach(async () => {
    await Ordine.deleteMany({});
    // Data futura per test
    const domani = new Date();
    domani.setDate(domani.getDate() + 1);

    ordineBase = {
      nomeCliente: 'Mario Rossi',
      telefono: '1234567890', // 10 digits
      dataRitiro: domani,
      oraRitiro: '10:00',
      prodotti: [
        {
          nome: 'Pardulas',
          quantita: 2,
          prezzo: 18,
          unitaMisura: 'Kg'
        }
      ]
    };
  });

  describe('Validazioni campi', () => {
    it('dovrebbe validare il formato telefono', async () => {
      const ordineInvalido = { 
        ...ordineBase,
        telefono: 'non-un-numero'
      };
      await expect(Ordine.create(ordineInvalido)).rejects.toThrow(/numero di telefono valido/);
    });

    it('dovrebbe validare la data di ritiro futura', async () => {
      const dataPassata = new Date();
      dataPassata.setDate(dataPassata.getDate() - 1);
      
      const ordineDataPassata = {
        ...ordineBase,
        dataRitiro: dataPassata
      };
      await expect(Ordine.create(ordineDataPassata)).rejects.toThrow(/data di ritiro deve essere futura/);
    });

    it('dovrebbe validare l\'unità di misura', async () => {
      const ordineUnitaInvalida = {
        ...ordineBase,
        prodotti: [{
          ...ordineBase.prodotti[0],
          unitaMisura: 'UnitaInvalida'
        }]
      };
      await expect(Ordine.create(ordineUnitaInvalida)).rejects.toThrow();
    });
  });

  describe('Calcoli automatici', () => {
    it('dovrebbe calcolare il totale correttamente', async () => {
      const ordine = await Ordine.create({
        ...ordineBase,
        prodotti: [
          {
            nome: 'Prodotto1',
            quantita: 2,
            prezzo: 10,
            unitaMisura: 'Kg'
          },
          {
            nome: 'Prodotto2',
            quantita: 3,
            prezzo: 5,
            unitaMisura: 'Pezzi'
          }
        ]
      });
      expect(ordine.totale).toBe(35); // (2 * 10) + (3 * 5)
    });
  });
});
