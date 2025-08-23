// tests/integration/ordini.crud.test.js
import mongoose from 'mongoose';
import { Ordine } from '../../models/Ordine.js';

describe('Ordini CRUD Tests', () => {
  const ordineBase = {
    nomeCliente: 'Test Cliente',
    telefono: '1234567890',
    dataRitiro: new Date(Date.now() + 24 * 60 * 60 * 1000),
    oraRitiro: '10:00',
    prodotti: [{
      nome: 'Test Prodotto',
      quantita: 1,
      prezzo: 10,
      unitaMisura: 'Kg'
    }]
  };

  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  describe('Create', () => {
    it('dovrebbe creare un nuovo ordine', async () => {
      const ordine = await Ordine.create(ordineBase);
      expect(ordine._id).toBeDefined();
      expect(ordine.nomeCliente).toBe(ordineBase.nomeCliente);
    });

    it('dovrebbe validare i campi obbligatori', async () => {
      const ordineInvalido = { ...ordineBase };
      delete ordineInvalido.nomeCliente;
      await expect(Ordine.create(ordineInvalido)).rejects.toThrow();
    });
  });

  describe('Read', () => {
    it('dovrebbe recuperare un ordine per ID', async () => {
      const ordine = await Ordine.create(ordineBase);
      const trovato = await Ordine.findById(ordine._id);
      expect(trovato.nomeCliente).toBe(ordineBase.nomeCliente);
    });

    it('dovrebbe supportare paginazione', async () => {
      // Crea 5 ordini
      await Promise.all([...Array(5)].map((_, i) => 
        Ordine.create({
          ...ordineBase,
          nomeCliente: `Cliente ${i}`
        })
      ));

      const page = 1;
      const limit = 2;
      const ordini = await Ordine.find()
        .skip((page - 1) * limit)
        .limit(limit);

      expect(ordini).toHaveLength(2);
    });
  });

  describe('Update', () => {
    it('dovrebbe aggiornare i dettagli ordine', async () => {
      const ordine = await Ordine.create(ordineBase);
      const nuovoNome = 'Cliente Aggiornato';
      
      await Ordine.findByIdAndUpdate(ordine._id, {
        nomeCliente: nuovoNome
      });

      const aggiornato = await Ordine.findById(ordine._id);
      expect(aggiornato.nomeCliente).toBe(nuovoNome);
    });

    it('dovrebbe aggiornare i prodotti', async () => {
      const ordine = await Ordine.create(ordineBase);
      const nuoviProdotti = [{
        nome: 'Nuovo Prodotto',
        quantita: 2,
        prezzo: 15,
        unitaMisura: 'Kg'
      }];

      await Ordine.findByIdAndUpdate(ordine._id, {
        prodotti: nuoviProdotti
      });

      const aggiornato = await Ordine.findById(ordine._id);
      expect(aggiornato.prodotti).toHaveLength(1);
      expect(aggiornato.prodotti[0].nome).toBe('Nuovo Prodotto');
    });
  });

  describe('Delete', () => {
    it('dovrebbe eliminare un ordine', async () => {
      const ordine = await Ordine.create(ordineBase);
      await Ordine.findByIdAndDelete(ordine._id);
      
      const cercato = await Ordine.findById(ordine._id);
      expect(cercato).toBeNull();
    });

    it('dovrebbe gestire l\'eliminazione di ordini non esistenti', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(
        Ordine.findByIdAndDelete(fakeId)
      ).resolves.toBeNull();
    });
  });
});
