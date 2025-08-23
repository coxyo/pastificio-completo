// src/data/magazzinoDemo.js
export const movimentiDemo = [
  {
    _id: 'demo1',
    tipo: 'carico',
    prodotto: { nome: 'Farina 00', categoria: 'Materie Prime' },
    quantita: 100,
    unita: 'kg',
    prezzoUnitario: 0.80,
    valoreMovimento: 80,
    fornitore: { nome: 'Molino Rossi' },
    documentoRiferimento: { numero: 'DDT/2024/001', tipo: 'DDT', data: new Date().toISOString() },
    dataMovimento: new Date().toISOString(),
    note: 'Carico settimanale'
  },
  {
    _id: 'demo2',
    tipo: 'scarico',
    prodotto: { nome: 'Farina 00', categoria: 'Materie Prime' },
    quantita: 20,
    unita: 'kg',
    prezzoUnitario: 0.80,
    valoreMovimento: 16,
    fornitore: { nome: 'Produzione' },
    documentoRiferimento: { numero: 'PROD/2024/001', tipo: 'Produzione', data: new Date().toISOString() },
    dataMovimento: new Date().toISOString(),
    note: 'Per produzione pardulas'
  }
];

export const giacenzeDemo = [
  {
    _id: 'g1',
    prodotto: { nome: 'Farina 00', categoria: 'Materie Prime' },
    quantitaAttuale: 80,
    unita: 'kg',
    valoreMedio: 0.80,
    scorta: { minima: 50, ottimale: 150 },
    ultimoMovimento: {
      data: new Date().toISOString(),
      tipo: 'carico',
      quantita: 100
    }
  },
  {
    _id: 'g2',
    prodotto: { nome: 'Uova', categoria: 'Materie Prime' },
    quantitaAttuale: 200,
    unita: 'pz',
    valoreMedio: 0.25,
    scorta: { minima: 100, ottimale: 300 },
    ultimoMovimento: {
      data: new Date().toISOString(),
      tipo: 'carico',
      quantita: 300
    }
  }
];

export const statsDemo = {
  valoreToTale: 114,
  perCategoria: {
    'Materie Prime': 114
  },
  prodottiSottoScorta: [],
  prodottiInScadenza: []
};