// tests/ordini.test.js
import mongoose from 'mongoose';
import { Ordine } from '../models/Ordine.js';

describe('Ordine Model Test', () => {
  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  const ordineValido = {
    nomeCliente: 'Mario Rossi',
    telefono: '1234567890',
    dataRitiro: new Date('2024-12-07'),
    oraRitiro: '10:00',
    prodotti: [
      {
        nome: 'Pardulas',
        quantita: 2,
        prezzo: 18,
        unitaMisura: 'Kg'
      }
    ],
    deveViaggiare: false,
    note: 'Test ordine'
  };

  it('dovrebbe creare & salvare un ordine con successo', async () => {
    const ordine = await Ordine.create(ordineValido);
    expect(ordine._id).toBeDefined();
    expect(ordine.nomeCliente).toBe(ordineValido.nomeCliente);
    expect(ordine.totale).toBe(36); // 2 * 18
  });

  it('dovrebbe fallire senza nome cliente', async () => {
    const ordineInvalido = { ...ordineValido };
    delete ordineInvalido.nomeCliente;
    await expect(Ordine.create(ordineInvalido)).rejects.toThrow();
  });
});
