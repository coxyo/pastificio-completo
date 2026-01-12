// utils/calcoliPrezzi.js
// ✅ VERSIONE AGGIORNATA - 13 Dicembre 2025
// Aggiunto: fallback a prezzo esistente

import { PRODOTTI_CONFIG, getProdottoConfig, MODALITA_VENDITA } from '../config/prodottiConfig';

/**
 * Calcola il prezzo di un ordine
 * @param {string} nomeProdotto - Nome del prodotto
 * @param {number} quantita - Quantità ordinata
 * @param {string} unita - Unità di misura (Kg, Pezzi, €, vassoio)
 * @param {number} prezzoEsistente - ✅ NUOVO: Prezzo già salvato (fallback)
 * @returns {object} - { prezzoTotale, prezzoUnitario, dettagli }
 */
export const calcolaPrezzoOrdine = (nomeProdotto, quantita, unita, prezzoEsistente = 0) => {
  // ✅ Se è un vassoio, non ricalcolare - usa prezzo esistente
  if (unita === 'vassoio' || nomeProdotto === 'Vassoio Dolci Misti') {
    return {
      prezzoTotale: prezzoEsistente || 0,
      prezzoUnitario: prezzoEsistente || 0,
      dettagli: 'Vassoio personalizzato',
      tipo: 'vassoio'
    };
  }

  const config = getProdottoConfig(nomeProdotto);
  
  // ✅ Se prodotto non trovato, usa prezzo esistente come fallback
  if (!config) {
    console.warn(`⚠️ Prodotto "${nomeProdotto}" non in config, uso prezzo esistente: €${prezzoEsistente}`);
    
    // Se c'è un prezzo esistente, usalo
    if (prezzoEsistente && prezzoEsistente > 0) {
      return {
        prezzoTotale: prezzoEsistente,
        prezzoUnitario: prezzoEsistente / (quantita || 1),
        dettagli: `${quantita} ${unita} (prezzo manuale)`,
        tipo: 'fallback'
      };
    }
    
    // Altrimenti solleva errore
    throw new Error(`Prodotto '${nomeProdotto}' non trovato in configurazione`);
  }

  const unitaLower = (unita || 'kg').toLowerCase();
  let prezzoTotale = 0;
  let prezzoUnitario = 0;
  let dettagli = '';

  // Calcolo in base all'unità
  if (unitaLower === 'kg' || unitaLower === 'kilogrammi') {
    prezzoUnitario = config.prezzoKg || 0;
    prezzoTotale = prezzoUnitario * quantita;
    dettagli = `${quantita} Kg × €${prezzoUnitario.toFixed(2)}/Kg`;
  } 
  else if (unitaLower === 'pezzi' || unitaLower === 'pz') {
    if (config.prezzoPezzo) {
      prezzoUnitario = config.prezzoPezzo;
      prezzoTotale = prezzoUnitario * quantita;
      dettagli = `${quantita} pz × €${prezzoUnitario.toFixed(2)}/pz`;
    } else if (config.prezzoKg && config.pezziPerKg) {
      // Converti pezzi in kg
      const kgEquivalenti = quantita / config.pezziPerKg;
      prezzoUnitario = config.prezzoKg / config.pezziPerKg;
      prezzoTotale = config.prezzoKg * kgEquivalenti;
      dettagli = `${quantita} pz (≈${kgEquivalenti.toFixed(2)} Kg) × €${config.prezzoKg.toFixed(2)}/Kg`;
    } else {
      // Fallback
      prezzoTotale = prezzoEsistente || 0;
      dettagli = `${quantita} pz`;
    }
  } 
  else if (unitaLower === '€' || unitaLower === 'euro') {
    // Vendita diretta in euro
    prezzoTotale = quantita;
    prezzoUnitario = quantita;
    
    if (config.prezzoKg) {
      const kgEquivalenti = quantita / config.prezzoKg;
      dettagli = `€${quantita.toFixed(2)} (≈${kgEquivalenti.toFixed(2)} Kg)`;
    } else {
      dettagli = `€${quantita.toFixed(2)}`;
    }
  }
  else if (unitaLower === 'unità' || unitaLower === 'unita') {
    prezzoUnitario = config.prezzoPezzo || config.prezzoKg || 0;
    prezzoTotale = prezzoUnitario * quantita;
    dettagli = `${quantita} unità × €${prezzoUnitario.toFixed(2)}`;
  }
  else {
    // Fallback generico
    prezzoUnitario = config.prezzoKg || config.prezzoPezzo || 0;
    prezzoTotale = prezzoUnitario * quantita;
    dettagli = `${quantita} ${unita}`;
  }

  // ✅ Se il calcolo ha dato 0 ma c'è un prezzo esistente, usa quello
  if (prezzoTotale === 0 && prezzoEsistente > 0) {
    console.warn(`⚠️ Calcolo €0 per "${nomeProdotto}", uso prezzo esistente: €${prezzoEsistente}`);
    return {
      prezzoTotale: prezzoEsistente,
      prezzoUnitario: prezzoEsistente / (quantita || 1),
      dettagli: `${quantita} ${unita} (prezzo esistente)`,
      tipo: 'fallback'
    };
  }

  return {
    prezzoTotale: Math.round(prezzoTotale * 100) / 100,
    prezzoUnitario: Math.round(prezzoUnitario * 100) / 100,
    dettagli,
    tipo: 'calcolato'
  };
};

/**
 * Formatta un prezzo in euro
 */
export const formattaPrezzo = (prezzo) => {
  if (typeof prezzo !== 'number' || isNaN(prezzo)) return '€0.00';
  return `€${prezzo.toFixed(2)}`;
};

/**
 * Ottiene le unità di misura disponibili per un prodotto
 */
export const getUnitaMisuraDisponibili = (nomeProdotto) => {
  const config = getProdottoConfig(nomeProdotto);
  if (!config) return ['Kg', 'Pezzi', '€'];
  return config.unitaMisuraDisponibili || ['Kg', 'Pezzi', '€'];
};

/**
 * Calcola il peso equivalente in Kg
 */
export const calcolaPesoKg = (nomeProdotto, quantita, unita) => {
  const config = getProdottoConfig(nomeProdotto);
  if (!config) return 0;
  
  const unitaLower = (unita || 'kg').toLowerCase();
  
  if (unitaLower === 'kg') return quantita;
  if (unitaLower === 'pezzi' && config.pezziPerKg) {
    return quantita / config.pezziPerKg;
  }
  if (unitaLower === '€' && config.prezzoKg) {
    return quantita / config.prezzoKg;
  }
  
  return 0;
};

export default {
  calcolaPrezzoOrdine,
  formattaPrezzo,
  getUnitaMisuraDisponibili,
  calcolaPesoKg
};