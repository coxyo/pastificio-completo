// tests/integration/ordini.state.test.js
import { Ordine } from '../../models/Ordine.js';

describe('Ordini State Management Tests', () => {
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

 describe('Transizioni di Stato', () => {
   it('dovrebbe iniziare come nuovo', async () => {
     const ordine = await Ordine.create(ordineBase);
     expect(ordine.stato).toBe('nuovo');
   });

   it('dovrebbe passare a in_lavorazione', async () => {
     const ordine = await Ordine.create(ordineBase);
     await ordine.cambiaStato('in_lavorazione');
     expect(ordine.stato).toBe('in_lavorazione');
   });

   it('dovrebbe tracciare le modifiche di stato', async () => {
     const ordine = await Ordine.create(ordineBase);
     await ordine.cambiaStato('in_lavorazione');
     await ordine.cambiaStato('completato');

     const statoAtteso = [
       expect.objectContaining({ stato: 'nuovo' }),
       expect.objectContaining({ stato: 'in_lavorazione' }),
       expect.objectContaining({ stato: 'completato' })
     ];
     
     expect(ordine.storicoStati).toHaveLength(3);
     expect(ordine.storicoStati).toEqual(expect.arrayContaining(statoAtteso));
   });
 });

 describe('Validazioni Stato', () => {
   it('dovrebbe rifiutare stati non validi', async () => {
     const ordine = await Ordine.create(ordineBase);
     await expect(ordine.cambiaStato('stato_invalido')).rejects.toThrow();
   });

   it('dovrebbe impedire il passaggio diretto da nuovo a completato', async () => {
     const ordine = await Ordine.create(ordineBase);
     await expect(ordine.cambiaStato('completato')).rejects.toThrow();
   });
 });

 describe('Query per Stato', () => {
   it('dovrebbe trovare ordini per stato', async () => {
     const ordine1 = await Ordine.create(ordineBase);
     const ordine2 = await Ordine.create(ordineBase);
     await ordine2.cambiaStato('in_lavorazione');

     const nuovi = await Ordine.find({ stato: 'nuovo' });
     expect(nuovi).toHaveLength(1);
   });

   it('dovrebbe calcolare statistiche per stato', async () => {
     // Crea gli ordini
     const ordine1 = await Ordine.create(ordineBase);
     const ordine2 = await Ordine.create(ordineBase);
     const ordine3 = await Ordine.create(ordineBase);

     // Cambia gli stati seguendo il flusso corretto
     await ordine2.cambiaStato('in_lavorazione');
     
     // Per ordine3, dobbiamo prima passare per in_lavorazione
     await ordine3.cambiaStato('in_lavorazione');
     await ordine3.cambiaStato('completato');

     const stats = await Ordine.aggregate([
       {
         $group: {
           _id: '$stato',
           count: { $sum: 1 }
         }
       },
       {
         $sort: { _id: 1 }
       }
     ]);

     // Log per debug
     console.log('Statistiche per stato:', stats);

     // Verifica le statistiche
     const statObj = stats.reduce((acc, curr) => {
       acc[curr._id] = curr.count;
       return acc;
     }, {});

     expect(statObj.nuovo).toBe(1);
     expect(statObj.in_lavorazione).toBe(1);
     expect(statObj.completato).toBe(1);
   });
 });

 describe('Transizioni Avanzate', () => {
   it('dovrebbe permettere annullamento da qualsiasi stato', async () => {
     // Test annullamento da nuovo
     const ordine1 = await Ordine.create(ordineBase);
     await ordine1.cambiaStato('annullato');
     expect(ordine1.stato).toBe('annullato');

     // Test annullamento da in_lavorazione
     const ordine2 = await Ordine.create(ordineBase);
     await ordine2.cambiaStato('in_lavorazione');
     await ordine2.cambiaStato('annullato');
     expect(ordine2.stato).toBe('annullato');

     // Test annullamento da completato
     const ordine3 = await Ordine.create(ordineBase);
     await ordine3.cambiaStato('in_lavorazione');
     await ordine3.cambiaStato('completato');
     await ordine3.cambiaStato('annullato');
     expect(ordine3.stato).toBe('annullato');
   });

   it('dovrebbe mantenere note nelle transizioni', async () => {
     const ordine = await Ordine.create(ordineBase);
     await ordine.cambiaStato('in_lavorazione', 'Iniziata lavorazione');
     await ordine.cambiaStato('completato', 'Ordine pronto');

     expect(ordine.storicoStati[1].note).toBe('Iniziata lavorazione');
     expect(ordine.storicoStati[2].note).toBe('Ordine pronto');
   });
 });
});
