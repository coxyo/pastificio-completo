// utils/calcoliPrezzi.js - BACKEND VERSION
// Sistema di calcolo prezzi centralizzato per il backend

// 🔥 CONFIGURAZIONE PRODOTTI - SYNC CON FRONTEND
const PRODOTTI_CONFIG = {
  // RAVIOLI
  'Ravioli ricotta spinaci e zafferano': {
    prezzoKg: 11,
    unitaMisuraDisponibili: ['Kg'],
    categoria: 'Ravioli'
  },
  'Culurgiones patate e menta': {
    prezzoKg: 14,
    unitaMisuraDisponibili: ['Kg'],
    categoria: 'Ravioli'
  },
  
  // PARDULAS
  'Pardulas': {
    prezzoPezzo: 0.76,
    pesoMedioPezzo: 0.04,
    pezziPerKg: 25,
    prezzoKg: 19,
    unitaMisuraDisponibili: ['Pezzi', 'Kg'],
    categoria: 'Pardulas'
  },
  
  // DOLCI
  'Amaretti': {
    prezzoKg: 18,
    unitaMisuraDisponibili: ['Kg'],
    categoria: 'Dolci'
  },
  'Bianchini': {
    prezzoKg: 18,
    unitaMisuraDisponibili: ['Kg'],
    categoria: 'Dolci'
  },
  'Gueffus': {
    prezzoKg: 18,
    unitaMisuraDisponibili: ['Kg'],
    categoria: 'Dolci'
  },
  'Ciambelle': {
    prezzoKg: 16,
    unitaMisuraDisponibili: ['Kg'],
    categoria: 'Dolci'
  },
  
  // PANADAS
  'Panadas carne': {
    prezzoKg: 20,
    unitaMisuraDisponibili: ['Kg'],
    categoria: 'Panadas'
  },
  'Panadas verdure': {
    prezzoKg: 18,
    unitaMisuraDisponibili: ['Kg'],
    categoria: 'Panadas'
  }
};

/**
 * Ottiene configurazione prodotto per nome (case-insensitive)
 */
export function getProdottoConfig(nomeProdotto) {
  if (!nomeProdotto) return null;
  
  const nomeLower = nomeProdotto.toLowerCase().trim();
  
  // Ricerca esatta
  const exactMatch = Object.keys(PRODOTTI_CONFIG).find(
    key => key.toLowerCase() === nomeLower
  );
  
  if (exactMatch) {
    return PRODOTTI_CONFIG[exactMatch];
  }
  
  // Ricerca parziale
  const partialMatch = Object.keys(PRODOTTI_CONFIG).find(
    key => nomeLower.includes(key.toLowerCase()) || key.toLowerCase().includes(nomeLower)
  );
  
  if (partialMatch) {
    return PRODOTTI_CONFIG[partialMatch];
  }
  
  return null;
}

/**
 * 🔥 FUNZIONE PRINCIPALE - Calcola prezzo ordine
 * 
 * @param {string} nomeProdotto - Nome del prodotto
 * @param {number} quantita - Quantità ordinata
 * @param {string} unita - Unità di misura ('Kg', 'Pezzi', etc.)
 * @returns {Object} - { prezzoTotale, dettagli, kg, pezzi }
 */
export function calcolaPrezzoOrdine(nomeProdotto, quantita, unita) {
  if (!nomeProdotto || !quantita || quantita <= 0) {
    return {
      prezzoTotale: 0,
      dettagli: 'Dati mancanti',
      kg: 0,
      pezzi: 0
    };
  }
  
  const config = getProdottoConfig(nomeProdotto);
  
  if (!config) {
    console.warn(`⚠️ Prodotto non trovato in config: ${nomeProdotto}`);
    return {
      prezzoTotale: 0,
      dettagli: `Prodotto non configurato: ${nomeProdotto}`,
      kg: 0,
      pezzi: 0
    };
  }
  
  const unitaNormalizzata = (unita || 'Kg').toLowerCase();
  
  // ============================================
  // CASO 1: PARDULAS (gestione speciale pezzi)
  // ============================================
  if (nomeProdotto.toLowerCase().includes('pardula')) {
    if (unitaNormalizzata === 'pezzi' || unitaNormalizzata === 'pz' || unitaNormalizzata === 'pezzo') {
      // Vendita a pezzi
      const prezzoPezzo = config.prezzoPezzo || 0.76;
      const prezzoTotale = quantita * prezzoPezzo;
      const kg = quantita * (config.pesoMedioPezzo || 0.04);
      
      return {
        prezzoTotale,
        dettagli: `${quantita} pezzi (${kg.toFixed(2)} kg)`,
        kg,
        pezzi: quantita
      };
    } else if (unitaNormalizzata === 'kg' || unitaNormalizzata === 'kilogrammi') {
      // Vendita a kg
      const pezziPerKg = config.pezziPerKg || 25;
      const pezzi = Math.round(quantita * pezziPerKg);
      const prezzoPezzo = config.prezzoPezzo || 0.76;
      const prezzoTotale = pezzi * prezzoPezzo;
      
      return {
        prezzoTotale,
        dettagli: `${quantita} kg (${pezzi} pezzi)`,
        kg: quantita,
        pezzi
      };
    }
  }
  
  // ============================================
  // CASO 2: PRODOTTI NORMALI (solo kg)
  // ============================================
  if (unitaNormalizzata === 'kg' || unitaNormalizzata === 'kilogrammi') {
    const prezzoKg = config.prezzoKg || 0;
    const prezzoTotale = quantita * prezzoKg;
    
    return {
      prezzoTotale,
      dettagli: `${quantita} kg`,
      kg: quantita,
      pezzi: 0
    };
  }
  
  // ============================================
  // CASO 3: EURO (vendita a importo fisso)
  // ============================================
  if (unitaNormalizzata === '€' || unitaNormalizzata === 'euro') {
    return {
      prezzoTotale: quantita,
      dettagli: `€${quantita.toFixed(2)}`,
      kg: 0,
      pezzi: 0
    };
  }
  
  // ============================================
  // CASO 4: UNITÀ SCONOSCIUTA
  // ============================================
  console.warn(`⚠️ Unità non riconosciuta per ${nomeProdotto}: ${unita}`);
  return {
    prezzoTotale: 0,
    dettagli: `Unità non supportata: ${unita}`,
    kg: 0,
    pezzi: 0
  };
}

/**
 * Formatta prezzo in euro
 */
export function formattaPrezzo(prezzo) {
  return `€${(prezzo || 0).toFixed(2)}`;
}

/**
 * Ottiene unità di misura disponibili per un prodotto
 */
export function getUnitaMisuraDisponibili(nomeProdotto) {
  const config = getProdottoConfig(nomeProdotto);
  return config?.unitaMisuraDisponibili || ['Kg'];
}

// Export configurazione per uso esterno
export { PRODOTTI_CONFIG };

export default {
  calcolaPrezzoOrdine,
  getProdottoConfig,
  formattaPrezzo,
  getUnitaMisuraDisponibili,
  PRODOTTI_CONFIG
};