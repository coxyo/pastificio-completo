// config/prodottiConfig.js
// ✅ VERSIONE AGGIORNATA - 11 Febbraio 2026
// Aggiunto: Chiacchere (dolce carnevale)

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

// ✅ ORDINE PRIORITÀ PRODOTTI (più venduti per primi)
export const ORDINE_PRODOTTI = [
  'Pardulas',
  'Ciambelle',
  'Ravioli',
  'Culurgiones',
  'Papassinas',
  'Amaretti',
  'Bianchini',
  'Gueffus',
  'Sebadas',
  'Panadas',
  'Panadine',
  'Torta di saba',
  'Pabassine'
];

// ✅ Funzione helper per ottenere prodotti nell'ordine corretto
export const getProdottiOrdinati = () => {
  const prodotti = PRODOTTI_CONFIG;
  const result = {};
  
  // Prima aggiungi prodotti nell'ordine definito
  ORDINE_PRODOTTI.forEach(nome => {
    if (prodotti[nome]) {
      result[nome] = prodotti[nome];
    }
  });
  
  // Poi aggiungi eventuali prodotti non in lista
  Object.keys(prodotti).forEach(nome => {
    if (!result[nome]) {
      result[nome] = prodotti[nome];
    }
  });
  
  return result;
};

// ✅ CONFIGURAZIONE PRODOTTI CON VARIANTI
export const PRODOTTI_CONFIG = {
  // ========== RAVIOLI CON VARIANTI ==========
  'Ravioli': {
    categoria: 'Ravioli',
    hasVarianti: true,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    prezzoKg: 11.00, // Prezzo base
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
      {
        nome: 'formaggio',
        label: 'Ravioli di formaggio',
        prezzoKg: 16.00,
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
        prezzoKg: 17.00
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
        prezzoKg: 17.00
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
    unitaMisuraDisponibili: [UNITA_MISURA.PEZZI, UNITA_MISURA.EURO],
    hasVarianti: true,
    varianti: [
      {
        nome: 'classica',
        label: 'Sebadas',
        prezzoPezzo: 2.00
      },
      {
        nome: 'mirto',
        label: 'Sebadas al mirto',
        prezzoPezzo: 2.50
      }
    ]
  },

  // ✅ FIX 24/02/2026: Alias espliciti per prezzi corretti dal database
  'Sebadas arancia': {
    categoria: 'Dolci',
    prezzoPezzo: 2.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_PEZZO,
    unitaMisuraDisponibili: [UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Sebadas al mirto': {
    categoria: 'Dolci',
    prezzoPezzo: 2.50,
    modalitaVendita: MODALITA_VENDITA.SOLO_PEZZO,
    unitaMisuraDisponibili: [UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
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
  
  // ✅ Alias per Papassine (stesso prodotto)
  'Pabassine': {
    categoria: 'Dolci',
    prezzoKg: 22.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },
  
  // ✅ Alias per Papassinas (scritto diverso)
  'Papassini': {
    categoria: 'Dolci',
    prezzoKg: 22.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },
  
  // ✅ NUOVO 12/12/2025: Zeppole
  'Zeppole': {
    categoria: 'Dolci',
    prezzoKg: 21.00,
    pezziPerKg: 24,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  // ✅ NUOVO 11/02/2026: Chiacchere (15g/pezzo = ~67 pz/kg)
  'Chiacchere': {
    categoria: 'Dolci',
    hasVarianti: true,
    prezzoKg: 17.00,
    pezziPerKg: 67,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO],
    varianti: [
      {
        nome: 'zucchero_velo',
        label: 'Chiacchere con zucchero a velo',
        prezzoKg: 17.00
      },
      {
        nome: 'zucchero_granulato',
        label: 'Chiacchere con zucchero granulato',
        prezzoKg: 17.00
      },
      {
        nome: 'cioccolato',
        label: 'Chiacchere con cioccolato',
        prezzoKg: 17.00
      }
    ]
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
  // ✅ NUOVO 12/12/2025: Panada Anguille
  'Panada Anguille': {
    prezzoKg: 30.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO],
    opzioniAggiuntive: {
      aglio: [
        { nome: 'con_aglio', label: 'Con aglio' },
        { nome: 'senza_aglio', label: 'Senza aglio' }
      ],
      pepe: [
        { nome: 'con_pepe', label: 'Con pepe' },
        { nome: 'senza_pepe', label: 'Senza pepe' }
      ],
      pomodorisecchi: [
        { nome: 'con_pomodori_secchi', label: 'Con pomodori secchi' },
        { nome: 'senza_pomodori_secchi', label: 'Senza pomodori secchi' }
      ],
      contorno: [
        { nome: 'con_patate', label: 'Con patate' },
        { nome: 'con_piselli', label: 'Con piselli' },
        { nome: 'patate_piselli', label: 'Con patate e piselli' }
      ]
    },
    supportaVassoiMultipli: true
  },

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
      pepe: [
        { nome: 'con_pepe', label: 'Con pepe' },
        { nome: 'senza_pepe', label: 'Senza pepe' }
      ],
      pomodorisecchi: [
        { nome: 'con_pomodori_secchi', label: 'Con pomodori secchi' },
        { nome: 'senza_pomodori_secchi', label: 'Senza pomodori secchi' }
      ],
      contorno: [
        { nome: 'con_patate', label: 'Con patate' },
        { nome: 'con_piselli', label: 'Con piselli' },
        { nome: 'patate_piselli', label: 'Con patate e piselli' }
      ]
    },
    supportaVassoiMultipli: true
  },
  
  // ✅ Alias con parentesi
  'Panada di Agnello (con patate)': {
    prezzoKg: 25.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO],
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
      pepe: [
        { nome: 'con_pepe', label: 'Con pepe' },
        { nome: 'senza_pepe', label: 'Senza pepe' }
      ],
      pomodorisecchi: [
        { nome: 'con_pomodori_secchi', label: 'Con pomodori secchi' },
        { nome: 'senza_pomodori_secchi', label: 'Senza pomodori secchi' }
      ],
      contorno: [
        { nome: 'con_patate', label: 'Con patate' },
        { nome: 'con_piselli', label: 'Con piselli' },
        { nome: 'patate_piselli', label: 'Con patate e piselli' }
      ]
    },
    supportaVassoiMultipli: true
  },
  
  // ✅ Alias con parentesi
  'Panada di Maiale (con patate)': {
    prezzoKg: 21.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO],
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
      pepe: [
        { nome: 'con_pepe', label: 'Con pepe' },
        { nome: 'senza_pepe', label: 'Senza pepe' }
      ],
      pomodorisecchi: [
        { nome: 'con_pomodori_secchi', label: 'Con pomodori secchi' },
        { nome: 'senza_pomodori_secchi', label: 'Senza pomodori secchi' }
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
      pepe: [
        { nome: 'con_pepe', label: 'Con pepe' },
        { nome: 'senza_pepe', label: 'Senza pepe' }
      ],
      pomodorisecchi: [
        { nome: 'con_pomodori_secchi', label: 'Con pomodori secchi' },
        { nome: 'senza_pomodori_secchi', label: 'Senza pomodori secchi' }
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
    prezzoKg: 28.00, // ✅ AGGIUNTO: prezzo al kg per vendita a peso
    pezziPerKg: 35,  // ✅ AGGIUNTO: per conversione pezzi/kg
    modalitaVendita: MODALITA_VENDITA.MISTA, // ✅ CAMBIATO: ora supporta kg e pezzi
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO],
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
  
  // ✅ NUOVO: Pasta per panada
  'Pasta per panada': {
    prezzoKg: 5.00,
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

// ✅ MIGLIORATO 12/12/2025: Funzione per ottenere config prodotto
// Ora gestisce meglio varianti, alias e nomi con parentesi
export const getProdottoConfig = (nomeProdotto) => {
  if (!nomeProdotto) return null;
  
  // 1. Cerca prima il prodotto esatto
  if (PRODOTTI_CONFIG[nomeProdotto]) {
    return PRODOTTI_CONFIG[nomeProdotto];
  }

  // 2. Normalizza il nome (rimuovi spazi extra, lowercase per confronto)
  const nomeNormalizzato = nomeProdotto.trim();
  
  // 3. Cerca case-insensitive
  for (const [key, config] of Object.entries(PRODOTTI_CONFIG)) {
    if (key.toLowerCase() === nomeNormalizzato.toLowerCase()) {
      return config;
    }
  }

  // 4. Cerca il nome base (senza opzioni tra parentesi)
  const nomeBase = nomeProdotto.split(' (')[0].trim();
  if (PRODOTTI_CONFIG[nomeBase]) {
    return PRODOTTI_CONFIG[nomeBase];
  }
  
  // 5. Cerca case-insensitive sul nome base
  for (const [key, config] of Object.entries(PRODOTTI_CONFIG)) {
    if (key.toLowerCase() === nomeBase.toLowerCase()) {
      return config;
    }
  }

  // 6. Cerca se il nome contiene una keyword nota
  const keywords = {
    'anguille': 'Panada Anguille',
    'agnello': 'Panada di Agnello',
    'maiale': 'Panada di Maiale',
    'vitella': 'Panada di Vitella',
    'verdure': 'Panada di verdure',
    'panadine': 'Panadine',
    'pardulas': 'Pardulas',
    'ciambelle': 'Ciambelle',
    'ravioli': 'Ravioli',
    'culurgiones': 'Culurgiones',
    'sebadas': 'Sebadas',
    'sebadas arancia': 'Sebadas arancia',
    'sebadas al mirto': 'Sebadas al mirto',
    'amaretti': 'Amaretti',
    'bianchini': 'Bianchini',
    'gueffus': 'Gueffus',
    'papassinas': 'Papassinas',
    'papassini': 'Papassinas',  // ✅ ALIAS
    'pabassine': 'Pabassine',
    'pabassini': 'Pabassine',   // ✅ ALIAS
    'dolci misti': 'Dolci misti',
    'fregula': 'Fregula',
    'torta': 'Torta di saba',
    'zeppole': 'Zeppole',        // ✅ NUOVO
    'chiacchere': 'Chiacchere',   // ✅ NUOVO 11/02/2026
    'chiacchiere': 'Chiacchere'   // ✅ ALIAS (ortografia alternativa)
  };
  
  const nomeLower = nomeNormalizzato.toLowerCase();
  for (const [keyword, prodottoKey] of Object.entries(keywords)) {
    if (nomeLower.includes(keyword)) {
      if (PRODOTTI_CONFIG[prodottoKey]) {
        return PRODOTTI_CONFIG[prodottoKey];
      }
    }
  }

  // 7. Cerca nelle varianti
  for (const [key, config] of Object.entries(PRODOTTI_CONFIG)) {
    if (config.hasVarianti && config.varianti) {
      const variante = config.varianti.find(v => 
        nomeNormalizzato.toLowerCase().includes(v.nome.toLowerCase()) || 
        nomeNormalizzato === v.label ||
        v.label.toLowerCase().includes(nomeNormalizzato.toLowerCase()) ||
        nomeNormalizzato.toLowerCase().includes(v.label.toLowerCase())
      );
      
      if (variante) {
        return {
          ...config,
          prezzoKg: variante.prezzoKg || config.prezzoKg,
          prezzoPezzo: variante.prezzoPezzo || config.prezzoPezzo,
          pezziPerKg: variante.pezziPerKg || config.pezziPerKg,
          nomeCompleto: variante.label
        };
      }
    }
  }

  // 8. Non trovato
  console.warn(`⚠️ Prodotto "${nomeProdotto}" non trovato in configurazione`);
  return null;
};

export const LISTA_PRODOTTI = Object.keys(PRODOTTI_CONFIG).sort();

export default PRODOTTI_CONFIG;