// utils/calcoliPrezzi.js
// Logica di calcolo prezzi basata su configurazione prodotti

import { getProdottoConfig, MODALITA_VENDITA, UNITA_MISURA } from '../config/prodottiConfig';

/**
 * Calcola il prezzo totale in base a prodotto, quantità e unità di misura
 * @param {string} nomeProdotto - Nome del prodotto
 * @param {number} quantita - Quantità ordinata
 * @param {string} unitaMisura - Unità di misura (Kg, Pezzi, Unità, €)
 * @returns {Object} { prezzoTotale, kg, pezzi, dettagli }
 */
export const calcolaPrezzoOrdine = (nomeProdotto, quantita, unitaMisura) => {
  const config = getProdottoConfig(nomeProdotto);
  
  if (!config) {
    throw new Error(`Prodotto "${nomeProdotto}" non trovato in configurazione`);
  }

  let prezzoTotale = 0;
  let kg = 0;
  let pezzi = 0;
  let dettagli = '';

  switch (unitaMisura) {
    case UNITA_MISURA.KG:
      // Ordine in KG
      kg = quantita;
      prezzoTotale = quantita * config.prezzoKg;
      
      if (config.pezziPerKg) {
        pezzi = Math.round(quantita * config.pezziPerKg);
        dettagli = `${kg} kg (circa ${pezzi} pezzi)`;
      } else {
        dettagli = `${kg} kg`;
      }
      break;

    case UNITA_MISURA.PEZZI:
      // Ordine in PEZZI
      pezzi = quantita;
      
      if (config.modalitaVendita === MODALITA_VENDITA.SOLO_PEZZO) {
        // Prodotto venduto solo a pezzo (es. Sebadas)
        prezzoTotale = quantita * config.prezzoPezzo;
        dettagli = `${pezzi} pezzi`;
      } else if (config.pezziPerKg) {
        // Prodotto con conversione pezzi → kg
        kg = quantita / config.pezziPerKg;
        prezzoTotale = kg * config.prezzoKg;
        dettagli = `${pezzi} pezzi (${kg.toFixed(2)} kg)`;
      } else {
        throw new Error(`Prodotto "${nomeProdotto}" non supporta vendita a pezzi`);
      }
      break;

    case UNITA_MISURA.UNITA:
      // Ordine in UNITÀ (es. 1 torta di saba)
      if (config.modalitaVendita === MODALITA_VENDITA.PESO_VARIABILE) {
        // Per prodotti a peso variabile, serve il peso effettivo
        // In questo caso, quantità = peso in kg della singola unità
        kg = quantita;
        prezzoTotale = kg * config.prezzoKg;
        dettagli = `1 unità (${kg} kg)`;
      } else {
        throw new Error(`Prodotto "${nomeProdotto}" non supporta vendita a unità`);
      }
      break;

    case UNITA_MISURA.EURO:
      // Ordine in EURO (es. "10 euro di Pardulas")
      const importoDesiderato = quantita;
      
      if (config.modalitaVendita === MODALITA_VENDITA.SOLO_PEZZO) {
        // Prodotto venduto solo a pezzo (es. Sebadas)
        pezzi = Math.floor(importoDesiderato / config.prezzoPezzo);
        prezzoTotale = pezzi * config.prezzoPezzo;
        const resto = importoDesiderato - prezzoTotale;
        dettagli = `${pezzi} pezzi (resto: €${resto.toFixed(2)})`;
      } else {
        // Prodotto venduto a kg
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

  return {
    prezzoTotale: parseFloat(prezzoTotale.toFixed(2)),
    kg: parseFloat(kg.toFixed(3)),
    pezzi: pezzi,
    dettagli: dettagli,
    nomeProdotto: nomeProdotto,
    unitaMisura: unitaMisura,
    quantitaOriginale: quantita
  };
};

/**
 * Calcola prezzo da pezzi
 * @param {string} nomeProdotto 
 * @param {number} numeroPezzi 
 * @returns {number} prezzo totale
 */
export const calcolaPrezzoDaPezzi = (nomeProdotto, numeroPezzi) => {
  const risultato = calcolaPrezzoOrdine(nomeProdotto, numeroPezzi, UNITA_MISURA.PEZZI);
  return risultato.prezzoTotale;
};

/**
 * Calcola prezzo da kg
 * @param {string} nomeProdotto 
 * @param {number} kg 
 * @returns {number} prezzo totale
 */
export const calcolaPrezzoDaKg = (nomeProdotto, kg) => {
  const risultato = calcolaPrezzoOrdine(nomeProdotto, kg, UNITA_MISURA.KG);
  return risultato.prezzoTotale;
};

/**
 * Calcola quantità da importo in euro
 * @param {string} nomeProdotto 
 * @param {number} euro 
 * @returns {Object} dettagli quantità ottenuta
 */
export const calcolaQuantitaDaEuro = (nomeProdotto, euro) => {
  return calcolaPrezzoOrdine(nomeProdotto, euro, UNITA_MISURA.EURO);
};

/**
 * Converte pezzi in kg per un prodotto
 * @param {string} nomeProdotto 
 * @param {number} pezzi 
 * @returns {number} kg
 */
export const convertiPezziInKg = (nomeProdotto, pezzi) => {
  const config = getProdottoConfig(nomeProdotto);
  
  if (!config || !config.pezziPerKg) {
    throw new Error(`Impossibile convertire pezzi in kg per "${nomeProdotto}"`);
  }
  
  return pezzi / config.pezziPerKg;
};

/**
 * Converte kg in pezzi per un prodotto
 * @param {string} nomeProdotto 
 * @param {number} kg 
 * @returns {number} pezzi (arrotondato)
 */
export const convertiKgInPezzi = (nomeProdotto, kg) => {
  const config = getProdottoConfig(nomeProdotto);
  
  if (!config || !config.pezziPerKg) {
    throw new Error(`Impossibile convertire kg in pezzi per "${nomeProdotto}"`);
  }
  
  return Math.round(kg * config.pezziPerKg);
};

/**
 * Verifica se un prodotto supporta una determinata unità di misura
 * @param {string} nomeProdotto 
 * @param {string} unitaMisura 
 * @returns {boolean}
 */
export const supportaUnitaMisura = (nomeProdotto, unitaMisura) => {
  const config = getProdottoConfig(nomeProdotto);
  
  if (!config) return false;
  
  return config.unitaMisuraDisponibili.includes(unitaMisura);
};

/**
 * Ottiene unità di misura disponibili per un prodotto
 * @param {string} nomeProdotto 
 * @returns {Array<string>} lista unità disponibili
 */
export const getUnitaMisuraDisponibili = (nomeProdotto) => {
  const config = getProdottoConfig(nomeProdotto);
  return config ? config.unitaMisuraDisponibili : [];
};

/**
 * Calcola totale ordine con più prodotti
 * @param {Array} prodotti - Array di { nomeProdotto, quantita, unitaMisura }
 * @returns {Object} { totale, dettaglioProdotti }
 */
export const calcolaTotaleOrdine = (prodotti) => {
  let totale = 0;
  const dettaglioProdotti = [];

  prodotti.forEach(item => {
    const risultato = calcolaPrezzoOrdine(
      item.nomeProdotto,
      item.quantita,
      item.unitaMisura
    );
    
    totale += risultato.prezzoTotale;
    dettaglioProdotti.push(risultato);
  });

  return {
    totale: parseFloat(totale.toFixed(2)),
    dettaglioProdotti: dettaglioProdotti
  };
};

/**
 * Formatta prezzo in euro
 * @param {number} prezzo 
 * @returns {string} prezzo formattato (es. "€19.50")
 */
export const formattaPrezzo = (prezzo) => {
  return `€${prezzo.toFixed(2)}`;
};

/**
 * Calcola prezzo con sconto
 * @param {number} prezzoBase 
 * @param {number} percentualeSconto 
 * @returns {Object} { prezzoScontato, importoSconto }
 */
export const applicaSconto = (prezzoBase, percentualeSconto) => {
  const importoSconto = (prezzoBase * percentualeSconto) / 100;
  const prezzoScontato = prezzoBase - importoSconto;
  
  return {
    prezzoScontato: parseFloat(prezzoScontato.toFixed(2)),
    importoSconto: parseFloat(importoSconto.toFixed(2))
  };
};

export default {
  calcolaPrezzoOrdine,
  calcolaPrezzoDaPezzi,
  calcolaPrezzoDaKg,
  calcolaQuantitaDaEuro,
  convertiPezziInKg,
  convertiKgInPezzi,
  supportaUnitaMisura,
  getUnitaMisuraDisponibili,
  calcolaTotaleOrdine,
  formattaPrezzo,
  applicaSconto
};