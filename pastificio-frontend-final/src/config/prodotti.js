// src/config/prodotti.js - Configurazione prodotti del pastificio Nonna Claudia

export const prodottiDisponibili = {
  dolci: [
    { nome: "Pardulas", prezzo: 18.00, unita: "Kg", descrizione: "Dolci tradizionali sardi con ricotta e zafferano" },
    { nome: "Amaretti", prezzo: 20.00, unita: "Kg", descrizione: "Biscotti alle mandorle amare" },
    { nome: "Papassinas", prezzo: 20.00, unita: "Kg", descrizione: "Biscotti tradizionali sardi" },
    { nome: "Ciambelle con marmellata", prezzo: 16.00, unita: "Kg", descrizione: "Ciambelle dolci con marmellata" },
    { nome: "Ciambelle con Nutella", prezzo: 16.00, unita: "Kg", descrizione: "Ciambelle dolci con Nutella" },
    { nome: "Crostate", prezzo: 20.00, unita: "Kg", descrizione: "Crostate con marmellata" },
    { nome: "Cantucci", prezzo: 22.00, unita: "Kg", descrizione: "Biscotti secchi alle mandorle" },
    { nome: "Bianchini", prezzo: 15.00, unita: "Kg", descrizione: "Dolci tradizionali sardi" },
    { nome: "Gueffus", prezzo: 20.00, unita: "Kg", descrizione: "Dolci tradizionali sardi" },
    { nome: "Dolci misti (Pardulas, ciambelle, papassinas, amaretti, gueffus, bianchini)", prezzo: 18.00, unita: "Kg", descrizione: "Mix di dolci tradizionali completo" },
    { nome: "Dolci misti (Pardulas, ciambelle, papassinas, bianchini)", prezzo: 17.00, unita: "Kg", descrizione: "Mix di dolci tradizionali base" },
    { nome: "Zeppole", prezzo: 20.00, unita: "Kg", descrizione: "Zeppole tradizionali" },
    { nome: "Pizzette sfoglia", prezzo: 15.00, unita: "Kg", descrizione: "Pizzette di pasta sfoglia" },
    { nome: "Torta di sapa", prezzo: 21.00, unita: "Kg", descrizione: "Torta tradizionale sarda con sapa" }
  ],
  panadas: [
    { nome: "Panada di anguille", prezzo: 25.00, unita: "Kg", descrizione: "Panada tradizionale con anguille" },
    { nome: "Panada di Agnello", prezzo: 30.00, unita: "Kg", descrizione: "Panada con carne di agnello" },
    { nome: "Panada di Maiale", prezzo: 20.00, unita: "Kg", descrizione: "Panada con carne di maiale" },
    { nome: "Panada di Vitella", prezzo: 22.00, unita: "Kg", descrizione: "Panada con carne di vitello" },
    { nome: "Panada di verdure", prezzo: 17.00, unita: "Kg", descrizione: "Panada vegetariana" },
    { nome: "Panadine carne o verdura", prezzo: 0.80, unita: "unità", descrizione: "Panadine singole" }
  ],
  pasta: [
    { nome: "Ravioli ricotta e zafferano", prezzo: 10.00, unita: "Kg", descrizione: "Ravioli con ricotta e zafferano" },
    { nome: "Ravioli ricotta spinaci e zafferano", prezzo: 10.00, unita: "Kg", descrizione: "Ravioli con ricotta, spinaci e zafferano" },
    { nome: "Ravioli ricotta spinaci", prezzo: 10.00, unita: "Kg", descrizione: "Ravioli con ricotta e spinaci" },
    { nome: "Ravioli ricotta dolci", prezzo: 10.00, unita: "Kg", descrizione: "Ravioli dolci con ricotta" },
    { nome: "Culurgiones", prezzo: 14.00, unita: "Kg", descrizione: "Culurgiones tradizionali sardi" },
    { nome: "Ravioli formaggio", prezzo: 15.00, unita: "Kg", descrizione: "Ravioli con formaggio" },
    { nome: "Sfoglie per Lasagne", prezzo: 5.00, unita: "Kg", descrizione: "Sfoglie fresche per lasagne" },
    { nome: "Pasta per panadas", prezzo: 4.50, unita: "Kg", descrizione: "Pasta fresca per panadas" },
    { nome: "Pasta per pizza", prezzo: 4.50, unita: "Kg", descrizione: "Pasta fresca per pizza" },
    { nome: "Fregola", prezzo: 10.00, unita: "Kg", descrizione: "Fregola sarda tradizionale" }
  ]
};

export const categorieDisponibili = [
  { id: 'dolci', nome: 'Dolci', icona: '🧁' },
  { id: 'panadas', nome: 'Panadas', icona: '🥟' },
  { id: 'pasta', nome: 'Pasta Fresca', icona: '🍝' }
];

export const unitaMisura = [
  { id: 'Kg', nome: 'Chilogrammi', simbolo: 'Kg' },
  { id: 'unità', nome: 'Unità/Pezzi', simbolo: 'unità' },
  { id: 'LT', nome: 'Litri', simbolo: 'Lt' },
  { id: 'GR', nome: 'Grammi', simbolo: 'gr' }
];

// Funzioni helper per gestire i prodotti
export const getProdottiByCategoriaId = (categoriaId) => {
  return prodottiDisponibili[categoriaId] || [];
};

export const getCategoriaById = (categoriaId) => {
  return categorieDisponibili.find(cat => cat.id === categoriaId);
};

export const getAllProdotti = () => {
  const allProdotti = [];
  Object.keys(prodottiDisponibili).forEach(categoria => {
    prodottiDisponibili[categoria].forEach(prodotto => {
      allProdotti.push({
        ...prodotto,
        categoria: categoria,
        categoriaNome: getCategoriaById(categoria)?.nome
      });
    });
  });
  return allProdotti;
};

export const getProdottoByNome = (nome, categoria) => {
  const prodotti = getProdottiByCategoriaId(categoria);
  return prodotti.find(p => p.nome === nome);
};

// Configurazioni aggiuntive
export const configProdotti = {
  prezzoMinimo: 1,
  prezzoMassimo: 50,
  quantitaMinima: 0.1,
  quantitaMassima: 100,
  scontoMassimo: 20, // percentuale
  iva: 22 // percentuale IVA
};

export default {
  prodottiDisponibili,
  categorieDisponibili,
  unitaMisura,
  getProdottiByCategoriaId,
  getCategoriaById,
  getAllProdotti,
  getProdottoByNome,
  configProdotti
};