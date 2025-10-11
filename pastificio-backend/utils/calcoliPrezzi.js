// utils/calcoliPrezzi.js - ✅ BACKEND VERSION COMPLETA - SYNC CON FRONTEND
// Sistema di calcolo prezzi centralizzato per il backend

// ========== MODALITÀ VENDITA ==========
export const MODALITA_VENDITA = {
  SOLO_KG: 'solo_kg',
  SOLO_PEZZO: 'solo_pezzo',
  MISTA: 'mista',
  PESO_VARIABILE: 'peso_variabile'
};

// ========== UNITÀ MISURA ==========
export const UNITA_MISURA = {
  KG: 'Kg',
  PEZZI: 'Pezzi',
  EURO: '€'
};

// ========== CONFIGURAZIONE PRODOTTI COMPLETA ==========
export const PRODOTTI_CONFIG = {
  // ========== RAVIOLI ==========
  'Ravioli ricotta spinaci e zafferano': {
    prezzoKg: 11.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Ravioli',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },
  
  'Ravioli ricotta e zafferano': {
    prezzoKg: 11.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Ravioli',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },
  
  'Culurgiones': {
    prezzoKg: 16.00,
    pezziPerKg: 30,
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
    pezziPerKg: 25,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  // ========== DOLCI ==========
  'Bianchini': {
    prezzoKg: 15.00,
    pezziPerKg: 80,
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

  'Amaretti': {
    prezzoKg: 22.00,
    pezziPerKg: 32,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Papassinas': {
    prezzoKg: 22.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  // ✅ AGGIUNTO: Ciambelle con marmellata
  'Ciambelle con marmellata': {
    prezzoKg: 16.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Ciambelle con Nutella': {
    prezzoKg: 16.00,
    pezziPerKg: 30,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  'Zeppole': {
    prezzoKg: 21.00,
    pezziPerKg: 24,
    modalitaVendita: MODALITA_VENDITA.MISTA,
    categoria: 'Dolci',
    unitaMisuraDisponibili: [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO]
  },

  // Dolci misti
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

  // ✅ AGGIUNTO: Sebadas
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

/**
 * ✅ Ottiene configurazione prodotto (case-insensitive con fuzzy matching)
 */
export function getProdottoConfig(nomeProdotto) {
  if (!nomeProdotto) return null;
  
  const nomeLower = nomeProdotto.toLowerCase().trim();
  
  // 1. Ricerca esatta
  const exactMatch = Object.keys(PRODOTTI_CONFIG).find(
    key => key.toLowerCase() === nomeLower
  );
  
  if (exactMatch) {
    return PRODOTTI_CONFIG[exactMatch];
  }
  
  // 2. Ricerca parziale (contiene)
  const partialMatch = Object.keys(PRODOTTI_CONFIG).find(
    key => nomeLower.includes(key.toLowerCase()) || key.toLowerCase().includes(nomeLower)
  );
  
  if (partialMatch) {
    return PRODOTTI_CONFIG[partialMatch];
  }
  
  // 3. Ricerca per keyword principali
  if (nomeLower.includes('sebadas') || nomeLower.includes('seadas')) {
    return PRODOTTI_CONFIG['Sebadas'];
  }
  
  if (nomeLower.includes('ciambelle')) {
    if (nomeLower.includes('nutella')) {
      return PRODOTTI_CONFIG['Ciambelle con Nutella'];
    }
    return PRODOTTI_CONFIG['Ciambelle con marmellata'];
  }
  
  if (nomeLower.includes('pardula')) {
    return PRODOTTI_CONFIG['Pardulas'];
  }
  
  return null;
}

/**
 * ✅ FUNZIONE PRINCIPALE - Calcola prezzo ordine
 * @param {string} nomeProdotto - Nome del prodotto
 * @param {number} quantita - Quantità ordinata
 * @param {string} unitaMisura - Unità di misura
 * @returns {Object} { prezzoTotale, kg, pezzi, dettagli }
 */
export function calcolaPrezzoOrdine(nomeProdotto, quantita, unitaMisura) {
  const config = getProdottoConfig(nomeProdotto);
  
  if (!config) {
    console.warn(`⚠️ Prodotto non trovato: ${nomeProdotto}`);
    return {
      prezzoTotale: 0,
      kg: 0,
      pezzi: 0,
      dettagli: `Prodotto non configurato: ${nomeProdotto}`,
      nomeProdotto,
      unitaMisura,
      quantitaOriginale: quantita
    };
  }

  let prezzoTotale = 0;
  let kg = 0;
  let pezzi = 0;
  let dettagli = '';

  // Normalizza unità di misura (case-insensitive)
  const unitaNormalizzata = (unitaMisura || 'kg').toLowerCase();

  switch (unitaNormalizzata) {
    case 'kg':
      // Ordine in KG
      kg = quantita;
      
      if (!config.prezzoKg) {
        throw new Error(`Prodotto "${nomeProdotto}" non ha prezzo/kg configurato`);
      }
      
      prezzoTotale = quantita * config.prezzoKg;
      
      if (config.pezziPerKg) {
        pezzi = Math.round(quantita * config.pezziPerKg);
        dettagli = `${kg} kg (circa ${pezzi} pezzi)`;
      } else {
        dettagli = `${kg} kg`;
      }
      break;

    case 'pezzi':
    case 'pz':
    case 'pezzo':
    case 'pz.':
      // ✅ Ordine in PEZZI
      pezzi = quantita;
      
      // CASO 1: Prodotto venduto SOLO a pezzo (es. Sebadas)
      if (config.modalitaVendita === MODALITA_VENDITA.SOLO_PEZZO) {
        if (!config.prezzoPezzo) {
          throw new Error(`Prodotto "${nomeProdotto}" non ha prezzo/pezzo configurato`);
        }
        
        prezzoTotale = quantita * config.prezzoPezzo;
        dettagli = `${pezzi} pezzi`;
        
        console.log(`✅ ${nomeProdotto} - SOLO_PEZZO: ${pezzi} × €${config.prezzoPezzo} = €${prezzoTotale.toFixed(2)}`);
      } 
      // CASO 2: Prodotto con conversione pezzi → kg
      else if (config.pezziPerKg) {
        if (!config.prezzoKg) {
          throw new Error(`Prodotto "${nomeProdotto}" non ha prezzo/kg configurato`);
        }
        
        // Converti pezzi in kg
        kg = quantita / config.pezziPerKg;
        
        // Calcola prezzo basato sui kg
        prezzoTotale = kg * config.prezzoKg;
        
        dettagli = `${pezzi} pezzi (${kg.toFixed(2)} kg)`;
        
        console.log(`✅ ${nomeProdotto} - PEZZI→KG: ${pezzi} pz ÷ ${config.pezziPerKg} × €${config.prezzoKg}/kg = €${prezzoTotale.toFixed(2)}`);
      } 
      else {
        throw new Error(`Prodotto "${nomeProdotto}" non supporta vendita a pezzi`);
      }
      break;

    case 'unità':
    case 'unita':
    case 'unità':
      // Ordine in UNITÀ
      if (config.modalitaVendita === MODALITA_VENDITA.PESO_VARIABILE) {
        kg = quantita;
        
        if (!config.prezzoKg) {
          throw new Error(`Prodotto "${nomeProdotto}" non ha prezzo/kg configurato`);
        }
        
        prezzoTotale = kg * config.prezzoKg;
        dettagli = `1 unità (${kg} kg)`;
      } else {
        throw new Error(`Prodotto "${nomeProdotto}" non supporta vendita a unità`);
      }
      break;

    case '€':
    case 'euro':
    case 'eur':
      // Ordine in EURO
      const importoDesiderato = quantita;
      
      if (config.modalitaVendita === MODALITA_VENDITA.SOLO_PEZZO) {
        if (!config.prezzoPezzo) {
          throw new Error(`Prodotto "${nomeProdotto}" non ha prezzo/pezzo configurato`);
        }
        
        pezzi = Math.floor(importoDesiderato / config.prezzoPezzo);
        prezzoTotale = pezzi * config.prezzoPezzo;
        const resto = importoDesiderato - prezzoTotale;
        dettagli = `${pezzi} pezzi (resto: €${resto.toFixed(2)})`;
      } else {
        if (!config.prezzoKg) {
          throw new Error(`Prodotto "${nomeProdotto}" non ha prezzo/kg configurato`);
        }
        
        kg = importoDesiderato / config.prezzoKg;
        prezzoTotale = importoDesiderato;
        
        if (config.pezziPerKg) {
          pezzi = Math.round(kg * config.pezziPerKg);
          dettagli = `${kg.toFixed(2)} kg (circa ${pezzi} pezzi)`;
        } else {
          dettagli = `${kg.toFixed(2)} kg`;
        }
      }
      break;

    default:
      throw new Error(`Unità di misura "${unitaMisura}" non riconosciuta`);
  }

  const risultato = {
    prezzoTotale: parseFloat(prezzoTotale.toFixed(2)),
    kg: parseFloat(kg.toFixed(3)),
    pezzi: pezzi,
    dettagli: dettagli,
    nomeProdotto: nomeProdotto,
    unitaMisura: unitaMisura,
    quantitaOriginale: quantita
  };
  
  console.log(`💰 Calcolo finale per ${nomeProdotto}:`, risultato);
  
  return risultato;
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
  return config ? config.unitaMisuraDisponibili : [UNITA_MISURA.KG];
}

/**
 * Calcola totale ordine con più prodotti
 */
export function calcolaTotaleOrdine(prodotti) {
  let totale = 0;
  const dettaglioProdotti = [];

  prodotti.forEach(item => {
    const risultato = calcolaPrezzoOrdine(
      item.nomeProdotto || item.nome,
      item.quantita,
      item.unitaMisura || item.unita
    );
    
    totale += risultato.prezzoTotale;
    dettaglioProdotti.push(risultato);
  });

  return {
    totale: parseFloat(totale.toFixed(2)),
    dettaglioProdotti: dettaglioProdotti
  };
}

export default {
  calcolaPrezzoOrdine,
  getProdottoConfig,
  formattaPrezzo,
  getUnitaMisuraDisponibili,
  calcolaTotaleOrdine,
  PRODOTTI_CONFIG,
  MODALITA_VENDITA,
  UNITA_MISURA
};