// config/prodottiConfig.js - CONFIGURAZIONE CORRETTA

export const MODALITA_VENDITA = {
  SOLO_KG: 'solo_kg',
  SOLO_PEZZO: 'solo_pezzo',
  MISTA: 'mista',
  PESO_VARIABILE: 'peso_variabile'
};

export const UNITA_MISURA = {
  KG: 'Kg',
  PEZZI: 'Pezzi',
  EURO: '€'
};

export const PRODOTTI_CONFIG = {
  // ========== RAVIOLI ==========
  'Ravioli ricotta spinaci e zafferano': {
    prezzoKg: 11.00,
    pezziPerKg: 30, // ✅ CORRETTO
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Ravioli',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },
  
  'Ravioli ricotta e zafferano': {
    prezzoKg: 11.00,
    pezziPerKg: 30, // ✅ CORRETTO
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Ravioli',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },
  
  'Culurgiones': {
    prezzoKg: 16.00,
    pezziPerKg: 30, // ✅ CORRETTO (assumo stesso dei ravioli)
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Ravioli',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },
  
  'Ravioli ricotta formaggio': {
    prezzoKg: 16.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Ravioli',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  // ========== PARDULAS ==========
  'Pardulas': {
    prezzoKg: 19.00,
    pezziPerKg: 25, // ✅ CORRETTO
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  // ========== DOLCI ==========
  'Bianchini': {
    prezzoKg: 15.00,
    pezziPerKg: 80, // ✅ CORRETTO (era 100)
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Gueffus': {
    prezzoKg: 22.00,
    pezziPerKg: 65, // ✅ CORRETTO
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Amaretti': {
    prezzoKg: 22.00,
    pezziPerKg: 32, // ✅ CORRETTO (era 35)
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Papassinas': {
    prezzoKg: 22.00,
    pezziPerKg: 30, // ✅ CORRETTO
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Ciambelle con marmellata': {
    prezzoKg: 16.00,
    pezziPerKg: 30, // ✅ CORRETTO
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Ciambelle con Nutella': {
    prezzoKg: 16.00,
    pezziPerKg: 30, // ✅ CORRETTO
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Zeppole': {
    prezzoKg: 21.00,
    pezziPerKg: 24, // ✅ CORRETTO - 24 pezzi per kg
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  // Dolci misti
  'Dolci misti (Pardulas, ciambelle, papassinas, amaretti, gueffus, bianchini)': {
    prezzoKg: 19.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Dolci',
    composizione: {
      'Pardulas': 0.40, // 400g
      'Ciambelle con marmellata': 0.30, // 300g
      'Amaretti': 0.20, // 200g
      'Gueffus': 0.05, // 50g
      'Papassinas': 0.025, // 25g
      'Bianchini': 0.025 // 25g
    },
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Dolci misti (Pardulas, ciambelle)': {
    prezzoKg: 17.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Dolci',
    composizione: {
      'Pardulas': 0.50, // 500g
      'Ciambelle con marmellata': 0.50 // 500g
    },
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Sebadas': {
    prezzoPezzo: 2.50,
    modalitaVendita: MODALITA_VENDITA.SOLO_PEZZO,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Pizzette sfoglia': {
    prezzoKg: 16.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Torta di sapa': {
    prezzoKg: 23.00,
    modalitaVendita: MODALITA_VENDITA.PESO_VARIABILE,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  // ========== PANADAS ==========
  'Panada di anguille': {
    prezzoKg: 30.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Panada di Agnello': {
    prezzoKg: 25.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Panada di maiale': {
    prezzoKg: 21.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Panada di vitella': {
    prezzoKg: 23.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Panada di verdure': {
    prezzoKg: 17.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  // ========== ALTRO ==========
  'Sfoglie per lasagne': {
    prezzoKg: 5.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Altro',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Pasta per panadas': {
    prezzoKg: 5.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Altro',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  }
};

// Lista prodotti per dropdown
export const LISTA_PRODOTTI = Object.keys(PRODOTTI_CONFIG);

// Funzione helper per ottenere config prodotto
export function getProdottoConfig(nomeProdotto) {
  return PRODOTTI_CONFIG[nomeProdotto] || null;
}