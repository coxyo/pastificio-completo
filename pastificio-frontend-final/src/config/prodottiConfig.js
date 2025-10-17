// config/prodottiConfig.js
// ✅ Configurazione completa prodotti con VARIANTI - AGGIORNATA

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
        pezziPerKg: 40 // ✅ Più pezzi per kg perché sono piccoli
      }
    ]
  },

  // ========== CULURGIONES ==========
  'Culurgiones': {
    categoria: 'Ravioli',
    prezzoKg: 16.00,
    pezziPerKg: 32,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
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
  'Cimbelle': {
    categoria: 'Dolci',
    hasVarianti: true,
    prezzoKg: 17.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO],
    varianti: [
      {
        nome: 'base',
        label: 'Ciambelle solo base',
        prezzoKg: 17.00
      },
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
        prezzoKg: 17.00 // ✅ Prezzo maggiorato per nutella
      },
      {
        nome: 'zucchero_velo',
        label: 'Ciambelle con zucchero a velo',
        prezzoKg: 17.00
      },
      {
        nome: 'miste_marmellata_nutella',
        label: 'Ciambelle miste: marmellata - nutella',
        prezzoKg: 17.00 // ✅ Prezzo medio tra marmellata e nutella
      },
      {
        nome: 'miste_marmellata_zucchero',
        label: 'Ciambelle miste: marmellata - zucchero a velo',
        prezzoKg: 17.00
      },
      {
        nome: 'miste_marmellata_base',
        label: 'Ciambelle miste: marmellata - solo base',
        prezzoKg: 17.00
      }
    ]
  },

  // ========== ALTRI DOLCI ==========
  'Sebadas': {
    categoria: 'Dolci',
    prezzoPezzo: 2.50,
    modalitaVendita: MODALITA_VENDITA.SOLO_PEZZO,
    unitaMisuraDisponibili: [UNITA_MISURA.UNITA, UNITA_MISURA.EURO]
  },

  'Amaretti': {
    categoria: 'Dolci',
    prezzoKg: 22.00,
    pezziPerKg: 35,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Papassini': {
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
      pardulas: 0.40,    // 40% Pardulas
      cimbelle: 0.30,    // 30% Ciambelle
      amaretti: 0.15,    // 15% Amaretti
      misti: 0.15        // 15% Pabassinas, bianchini, gueffus
    }
  },

  // ========== PANADAS ==========
  'Panada di Agnello': {
    prezzoKg: 30.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Panada di Maiale': {
    prezzoKg: 21.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Panada di Vitella': {
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

  'Panadine': {
    prezzoPezzo: 0.80,
    modalitaVendita: MODALITA_VENDITA.SOLO_PEZZO,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.UNITA, UNITA_MISURA.EURO]
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

// ✅ Funzione per ottenere config prodotto (gestisce varianti)
export const getProdottoConfig = (nomeProdotto) => {
  // Cerca prodotto esatto
  if (PRODOTTI_CONFIG[nomeProdotto]) {
    return PRODOTTI_CONFIG[nomeProdotto];
  }

  // Cerca nelle varianti
  for (const [key, config] of Object.entries(PRODOTTI_CONFIG)) {
    if (config.hasVarianti && config.varianti) {
      const variante = config.varianti.find(v => 
        nomeProdotto.includes(v.nome) || 
        nomeProdotto === v.label ||
        v.label.includes(nomeProdotto)
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

// Lista prodotti per dropdown (solo prodotti base, non varianti)
export const LISTA_PRODOTTI = Object.keys(PRODOTTI_CONFIG).sort();

export default PRODOTTI_CONFIG;