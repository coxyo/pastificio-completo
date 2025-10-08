// config/prodottiConfig.js
// Configurazione completa prodotti - PULITA

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

// ✅ CONFIGURAZIONE PRODOTTI - PULITA
export const PRODOTTI_CONFIG = {
  // ========== RAVIOLI CON VARIANTI (PULITI - no duplicati €14) ==========
  'Ravioli': {
    categoria: 'Ravioli',
    hasVarianti: true,
    varianti: [
      {
        nome: 'ricotta e zafferano',
        label: 'Ravioli ricotta e zafferano',
        prezzoKg: 11.00,
        pezziPerKg: 30
      },
      {
        nome: 'ricotta spinaci e zafferano',
        label: 'Ravioli ricotta spinaci e zafferano',
        prezzoKg: 11.00,
        pezziPerKg: 30
      },
      {
        nome: 'ricotta spinaci',
        label: 'Ravioli ricotta spinaci',
        prezzoKg: 11.00,
        pezziPerKg: 30
      },
      {
        nome: 'ricotta dolci',
        label: 'Ravioli ricotta dolci',
        prezzoKg: 11.00,
        pezziPerKg: 30
      },
      {
        nome: 'formaggio',
        label: 'Ravioli formaggio',
        prezzoKg: 16.00,
        pezziPerKg: 30
      }
    ],
    modalitaVendita: MODALITA_VENDITA.MISTA,
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Culurgiones': {
    prezzoKg: 16.00,
    pezziPerKg: 32,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Ravioli',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Sfoglie per Lasagne': {
    prezzoKg: 5.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Pasta',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Pasta per panadas': {
    prezzoKg: 5.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Pasta',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  // ========== PARDULAS (in Dolci) ==========
  'Pardulas': {
    prezzoKg: 19.00,
    pezziPerKg: 25,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  // ========== DOLCI ==========
  'Bianchini': {
    prezzoKg: 15.00,
    pezziPerKg: 100,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Gueffus': {
    prezzoKg: 22.00,
    pezziPerKg: 65,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Dolci misti (Pardulas, ciambelle, papassinas, amaretti, gueffus, bianchini)': {
    prezzoKg: 19.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Dolci misti (Pardulas, ciambelle)': {
    prezzoKg: 17.00,
    modalitaVendita: MODALITA_VENDITA.SOLO_KG,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.EURO]
  },

  'Zeppole': {
    prezzoKg: 21.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
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

  // ========== PANADAS SEPARATE ==========
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

  'Panadine carne o verdura': {
    prezzoPezzo: 0.80,
    modalitaVendita: MODALITA_VENDITA.SOLO_PEZZO,
    categoria: 'Panadas',
    unitaMisuraDisponibili: [UNITA_MISURA.UNITA, UNITA_MISURA.EURO]
  }

  // ✅ RIMOSSO: "Pane panada/pizza" eliminato dalla lista
};

// ✅ Funzione per ottenere config prodotto (gestisce varianti)
export const getProdottoConfig = (nomeProdotto) => {
  // Cerca prodotto esatto
  if (PRODOTTI_CONFIG[nomeProdotto]) {
    return PRODOTTI_CONFIG[nomeProdotto];
  }

  // Se il prodotto contiene "Ravioli", cerca nella config Ravioli
  if (nomeProdotto.includes('Ravioli')) {
    const ravioliConfig = PRODOTTI_CONFIG['Ravioli'];
    if (ravioliConfig && ravioliConfig.hasVarianti) {
      // Cerca variante
      const variante = ravioliConfig.varianti.find(v => 
        nomeProdotto.includes(v.nome) || nomeProdotto === v.label
      );
      
      if (variante) {
        return {
          ...ravioliConfig,
          prezzoKg: variante.prezzoKg,
          pezziPerKg: variante.pezziPerKg,
          nomeCompleto: variante.label
        };
      }
    }
  }

  return null;
};

// Lista prodotti per dropdown
export const LISTA_PRODOTTI = Object.keys(PRODOTTI_CONFIG).sort();

export default PRODOTTI_CONFIG;