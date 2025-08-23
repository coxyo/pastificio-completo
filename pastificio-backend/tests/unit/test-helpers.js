// tests/utils/test-helpers.js
export const createTestOrdine = async (Ordine, override = {}) => {
  const defaultOrdine = {
    nomeCliente: 'Test Cliente',
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

  return await Ordine.create({
    ...defaultOrdine,
    ...override
  });
};