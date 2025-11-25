// config/prodottiConfig.js
// ✅ VERSIONE AGGIORNATA - 19 Novembre 2025
// Aggiunto: Ravioli di formaggio, pulizia doppioni

export const MODALITA_VENDITA = {
  SOLO_KG: 'solo_kg',
  SOLO_PEZZO: 'solo_pezzo',
  MISTA: 'mista',
  PESO_VARIABILE: 'peso_variabile'
};

export const UNITA_MISURA = {
  KG: 'Kg',
  PEZZI: 'Pezzi',
  UNITA: 'Unità',
  EURO: '€'
};

// ✅ CONFIGURAZIONE PRODOTTI CON VARIANTI
export const PRODOTTI_CONFIG = {
  // ========== RAVIOLI CON VARIANTI ==========
  'Ravioli': {
    categoria: 'Ravioli',
    hasVarianti: true,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    pezziPerKg: 30,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO],
    supportaVassoiMultipli: true,
    varianti: [
      {
        nome: 'spinaci',
        label: 'Ravioli ricotta e spinaci',
        prezzoKg: 11.00,
        pezziPerKg: 30
      },
      {
        nome: 'zafferano',
        label: 'Ravioli ricotta e zafferano',
        prezzoKg: 11.00,
        pezziPerKg: 30
      },
      {
        nome: 'dolci',
        label: 'Ravioli ricotta dolci',
        prezzoKg: 11.00,
        pezziPerKg: 30
      },
      {
        nome: 'poco_dolci',
        label: 'Ravioli ricotta poco dolci',
        prezzoKg: 11.00,
        pezziPerKg: 30
      },
      {
        nome: 'molto_dolci',
        label: 'Ravioli ricotta molto dolci',
        prezzoKg: 11.00,
        pezziPerKg: 30
      },
      {
        nome: 'piccoli',
        label: 'Ravioli ricotta piccoli',
        prezzoKg: 11.00,
        pezziPerKg: 40
      },
      // ✅ NUOVO: Ravioli di formaggio
      {
        nome: 'formaggio',
        label: 'Ravioli di formaggio',
        prezzoKg: 11.00,
        pezziPerKg: 30
      }
    ]
  },

  // ========== CULURGIONES ==========
  'Culurgiones': {
    categoria: 'Ravioli',
    prezzoKg: 16.00,
    pezziPerKg: 32,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO],
    supportaVassoiMultipli: true
  },

  // ========== PARDULAS CON VARIANTI ==========
  'Pardulas': {
    categoria: 'Dolci',
    hasVarianti: true,
    prezzoKg: 20.00,
    prezzoPezzo: 0.76,
    pezziPerKg: 25,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO],
    // ✅ Aggiunta opzione livello cottura
    opzioniCottura: [
      { nome: 'normale', label: 'Cottura Normale' },
      { nome: 'ben_cotte', label: 'Ben Cotte' },
      { nome: 'poco_cotte', label: 'Poco Cotte' }
    ],
    varianti: [
      {
        nome: 'base',
        label: 'Pardulas (base)',
        prezzoKg: 20.00,
        prezzoPezzo: 0.76
      },
      {
        nome: 'con_glassa',
        label: 'Pardulas con glassa',
        prezzoKg: 20.00,
        prezzoPezzo: 0.76
      },
      {
        nome: 'zucchero_velo',
        label: 'Pardulas con zucchero a velo',
        prezzoKg: 20.00,
        prezzoPezzo: 0.76
      }
    ]
  },

  // ========== CIAMBELLE CON VARIANTI ==========
  'Ciambelle': {
    categoria: 'Dolci',
    hasVarianti: true,
    prezzoKg: 17.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO],
    varianti: [
      // ✅ RIMOSSO "Ciambelle solo base" - duplicato inutile
      {
        nome: 'albicocca',
        label: 'Ciambelle con marmellata di albicocca',
        prezzoKg: 17.00
      },
      {
        nome: 'ciliegia',
        label: 'Ciambelle con marmellata di ciliegia',
        prezzoKg: 17.00
      },
      {
        nome: 'nutella',
        label: 'Ciambelle con nutella',
        prezzoKg: 18.00
      },
      {
        nome: 'zucchero_velo',
        label: 'Ciambelle con zucchero a velo',
        prezzoKg: 17.00
      },
      {
        nome: 'semplici',
        label: 'Ciambelle semplici (senza farcitura)',
        prezzoKg: 17.00
      },
      {
        nome: 'miste_marmellata_nutella',
        label: 'Ciambelle miste: marmellata - nutella',
        prezzoKg: 17.50
      },
      {
        nome: 'miste_marmellata_zucchero',
        label: 'Ciambelle miste: marmellata - zucchero a velo',
        prezzoKg: 17.00
      }
    ]
  },

  // ========== ALTRI DOLCI ==========
  'Sebadas': {
    categoria: 'Dolci',
    prezzoPezzo: 2.50,
    modalitaVendita: MODALITA_VENDITA.SOLO_PEZZO,
    unitaMisuraDisponibili: [UNITA_MISURA.UNITA, UNITA_MISURA.EURO],
    // ✅ Aggiunta variante al mirto
    hasVarianti: true,
    varianti: [
      {
        nome: 'classica',
        label: 'Sebadas',
        prezzoPezzo: 2.50
      },
      {
        nome: 'mirto',
        label: 'Sebadas al mirto',
        prezzoPezzo: 2.50
      }
    ]
  },

  'Amaretti': {
    categoria: 'Dolci',
    prezzoKg: 22.00,
    pezziPerKg: 35,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Papassinas': {
    categoria: 'Dolci',
    prezzoKg: 22.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Gueffus': {
    categoria: 'Dolci',
    prezzoKg: 22.00,
    pezziPerKg: 65,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Bianchini': {
    categoria: 'Dolci',
    prezzoKg: 15.00,
    pezziPerKg: 100,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Torta di saba': {
    categoria: 'Dolci',
    prezzoKg: 26.00,
    prezzoPezzo: 15.00,
    modalitaVendita: MODALITA_VENDITA.PESO_VARIABILE,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.UNITA, UNITA_MISURA.EURO]
  },

  'Dolci misti': {
    categoria: 'Dolci',
    prezzoKg: 19.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO],
    composizione: {
      pardulas: 0.40,
      ciambelle: 0.30,
      amaretti: 0.15,
      misti: 0.15
    }
  },

  // ========== PANADAS CON VARIANTI ==========
  'Panada di Agnello': {
    prezzoKg: 25.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO],
    opzioniAggiuntive: {
      aglio: [
        { nome: 'con_aglio', label: 'Con aglio' },
        { nome: 'senza_aglio', label: 'Senza aglio' }
      ],
      contorno: [
        { nome: 'con_patate', label: 'Con patate' },
        { nome: 'con_piselli', label: 'Con piselli' },
        { nome: 'patate_piselli', label: 'Con patate e piselli' }
      ]
    },
    supportaVassoiMultipli: true
  },

  'Panada di Maiale': {
    prezzoKg: 21.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO],
    opzioniAggiuntive: {
      aglio: [
        { nome: 'con_aglio', label: 'Con aglio' },
        { nome: 'senza_aglio', label: 'Senza aglio' }
      ],
      contorno: [
        { nome: 'con_patate', label: 'Con patate' },
        { nome: 'con_piselli', label: 'Con piselli' },
        { nome: 'patate_piselli', label: 'Con patate e piselli' }
      ]
    },
    supportaVassoiMultipli: true
  },

  'Panada di Vitella': {
    prezzoKg: 23.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO],
    opzioniAggiuntive: {
      aglio: [
        { nome: 'con_aglio', label: 'Con aglio' },
        { nome: 'senza_aglio', label: 'Senza aglio' }
      ],
      contorno: [
        { nome: 'con_patate', label: 'Con patate' },
        { nome: 'con_piselli', label: 'Con piselli' },
        { nome: 'patate_piselli', label: 'Con patate e piselli' }
      ]
    },
    supportaVassoiMultipli: true
  },

  'Panada di verdure': {
    prezzoKg: 17.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO],
    opzioniAggiuntive: {
      aglio: [
        { nome: 'con_aglio', label: 'Con aglio' },
        { nome: 'senza_aglio', label: 'Senza aglio' }
      ],
      contorno: [
        { nome: 'con_patate', label: 'Con patate' },
        { nome: 'con_piselli', label: 'Con piselli' },
        { nome: 'patate_piselli', label: 'Con patate e piselli' }
      ]
    },
    supportaVassoiMultipli: true
  },

  'Panadine': {
    prezzoPezzo: 0.80,
    modalitaVendita: MODALITA_VENDITA.SOLO_PEZZO,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.PEZZI, UNITA_MISURA.EURO],
    gustiPanadine: {
      rapidi: [
        { nome: 'carne', label: 'Carne' },
        { nome: 'verdura', label: 'Verdura' }
      ],
      ingredienti: [
        { nome: 'carne', label: 'Carne' },
        { nome: 'piselli', label: 'Piselli' },
        { nome: 'patate', label: 'Patate' },
        { nome: 'melanzane', label: 'Melanzane' },
        { nome: 'peperoni', label: 'Peperoni' },
        { nome: 'zucchine', label: 'Zucchine' },
        { nome: 'pomodoro_fresco', label: 'Pomodoro fresco' },
        { nome: 'salsiccia', label: 'Salsiccia' },
        { nome: 'funghi', label: 'Funghi' }
      ]
    }
  },

  // ========== PASTA ==========
  'Fregula': {
    prezzoKg: 10.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Pasta',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Pizzette sfoglia': {
    prezzoKg: 16.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Pasta',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Pasta per panada e pizza': {
    prezzoKg: 5.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Pasta',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Sfoglia per lasagne': {
    prezzoKg: 5.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Pasta',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  }
};

// ✅ Funzione per ottenere config prodotto (gestisce varianti e opzioni)
export const getProdottoConfig = (nomeProdotto) => {
  // Cerca prima il prodotto esatto
  if (PRODOTTI_CONFIG[nomeProdotto]) {
    return PRODOTTI_CONFIG[nomeProdotto];
  }

  // Cerca il nome base (senza opzioni tra parentesi)
  const nomeBase = nomeProdotto.split(' (')[0];
  if (PRODOTTI_CONFIG[nomeBase]) {
    return PRODOTTI_CONFIG[nomeBase];
  }

  // Cerca nelle varianti
  for (const [key, config] of Object.entries(PRODOTTI_CONFIG)) {
    if (config.hasVarianti && config.varianti) {
      const variante = config.varianti.find(v => 
        nomeProdotto.toLowerCase().includes(v.nome.toLowerCase()) || 
        nomeProdotto === v.label ||
        v.label.toLowerCase().includes(nomeProdotto.toLowerCase())
      );
      
      if (variante) {
        return {
          ...config,
          prezzoKg: variante.prezzoKg,
          prezzoPezzo: variante.prezzoPezzo,
          pezziPerKg: variante.pezziPerKg || config.pezziPerKg,
          nomeCompleto: variante.label
        };
      }
    }
  }

  return null;
};

export const LISTA_PRODOTTI = Object.keys(PRODOTTI_CONFIG).sort();

export default PRODOTTI_CONFIG;