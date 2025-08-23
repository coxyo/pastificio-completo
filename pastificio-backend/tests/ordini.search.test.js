// tests/ordini.search.test.js
import mongoose from 'mongoose';
import { Ordine } from '../models/Ordine.js';

describe('Ordine Search Tests', () => {
  const dataBase = new Date();
  dataBase.setDate(dataBase.getDate() + 1);
  dataBase.setHours(0, 0, 0, 0);

  beforeAll(async () => {
    try {
      console.log('Inizializzazione test di ricerca...');
      await Ordine.deleteMany({});
      console.log('Database pulito');

      const ordiniTest = [
        {
          nomeCliente: 'Mario Rossi',
          telefono: '1234567890',
          dataRitiro: new Date(dataBase),
          oraRitiro: '10:00',
          prodotti: [{ 
            nome: 'P1', 
            quantita: 1, 
            prezzo: 10, 
            unitaMisura: 'Kg' 
          }]
        },
        {
          nomeCliente: 'Luigi Verdi',
          telefono: '0987654321',
          dataRitiro: new Date(dataBase),
          oraRitiro: '11:00',
          prodotti: [{ 
            nome: 'P2', 
            quantita: 2, 
            prezzo: 15, 
            unitaMisura: 'Kg' 
          }]
        },
        {
          nomeCliente: 'Mario Bianchi',
          telefono: '1122334455',
          dataRitiro: new Date(dataBase.getTime() + 24 * 60 * 60 * 1000),
          oraRitiro: '09:00',
          prodotti: [{ 
            nome: 'P1', 
            quantita: 3, 
            prezzo: 10, 
            unitaMisura: 'Kg' 
          }]
        }
      ];

      console.log('Creazione ordini di test...');
      for (const ordine of ordiniTest) {
        const nuovoOrdine = await Ordine.create(ordine);
        console.log(`Ordine creato: ${nuovoOrdine._id}`);
      }

      const count = await Ordine.countDocuments();
      console.log(`Totale ordini salvati: ${count}`);
    } catch (error) {
      console.error('Errore durante l\'inizializzazione:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    const count = await Ordine.countDocuments();
    console.log(`Ordini presenti prima del test: ${count}`);
  });

  afterAll(async () => {
    try {
      await Ordine.deleteMany({});
      console.log('Pulizia database completata');
    } catch (error) {
      console.error('Errore durante la pulizia:', error);
    }
  });

  it('dovrebbe trovare ordini per data', async () => {
    const inizio = new Date(dataBase);
    const fine = new Date(dataBase);
    fine.setDate(fine.getDate() + 1);

    console.log('Ricerca ordini per data:', {
      inizio: inizio.toISOString(),
      fine: fine.toISOString()
    });

    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: inizio,
        $lt: fine
      }
    });

    console.log(`Ordini trovati: ${ordini.length}`);
    ordini.forEach(o => console.log(`- ${o.nomeCliente}: ${o.dataRitiro.toISOString()}`));

    expect(ordini).toHaveLength(2);
  });

  it('dovrebbe trovare ordini per cliente', async () => {
    console.log('Ricerca ordini per nome cliente Mario');
    
    const ordini = await Ordine.find({
      nomeCliente: { $regex: /^Mario/, $options: 'i' }
    });

    console.log(`Ordini trovati: ${ordini.length}`);
    ordini.forEach(o => console.log(`- ${o.nomeCliente}`));

    expect(ordini).toHaveLength(2);
  });

  it('dovrebbe ordinare per ora ritiro', async () => {
    console.log('Ricerca ordini ordinati per ora ritiro');
    
    const inizio = new Date(dataBase);
    const fine = new Date(dataBase);
    fine.setDate(fine.getDate() + 1);

    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: inizio,
        $lt: fine
      }
    }).sort('oraRitiro');

    console.log('Ordini trovati ordinati per ora:');
    ordini.forEach(o => console.log(`- ${o.nomeCliente}: ${o.oraRitiro}`));

    expect(ordini.length).toBe(2);
    expect(ordini[0].oraRitiro).toBe('10:00');
    expect(ordini[1].oraRitiro).toBe('11:00');
  });
});
