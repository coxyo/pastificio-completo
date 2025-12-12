// utils/calcoliPrezzi.js - ✅ FIX 12/12/2025
// Logica di calcolo prezzi basata su configurazione prodotti
// MIGLIORATO: Gestisce prodotti non in config usando prezzo esistente

import { getProdottoConfig, MODALITA_VENDITA, UNITA_MISURA } from '../config/prodottiConfig';

/**
 * ✅ FIX: Calcola il prezzo totale in base a prodotto, quantità e unità di misura
 * @param {string} nomeProdotto - Nome del prodotto
 * @param {number} quantita - Quantità ordinata
 * @param {string} unitaMisura - Unità di misura (Kg, Pezzi, Unità, €)
 * @param {number} prezzoEsistente - (NUOVO) Prezzo già presente nell'ordine, usato come fallback
 * @returns {Object} { prezzoTotale, kg, pezzi, dettagli }
 */
export const calcolaPrezzoOrdine = (nomeProdotto, quantita, unitaMisura, prezzoEsistente = null) => {
  const config = getProdottoConfig(nomeProdotto);
  
  // ✅ FIX: Se prodotto non trovato, usa prezzo esistente se disponibile
  if (!config) {
    if (prezzoEsistente !== null && prezzoEsistente > 0) {
      console.warn(`⚠️ Prodotto "${nomeProdotto}" non in config, uso prezzo esistente: €${prezzoEsistente}`);
      return {
        prezzoTotale: parseFloat(prezzoEsistente),
        kg: unitaMisura?.toLowerCase() === 'kg' ? quantita : 0,
        pezzi: unitaMisura?.toLowerCase().includes('pezz') ? quantita : 0,
        dettagli: `${quantita} ${unitaMisura || 'unità'} (prezzo manuale)`,
        nomeProdotto: nomeProdotto,
        unitaMisura: unitaMisura,
        quantitaOriginale: quantita,
        fromExisting: true
      };
    }
    
    // Se non c'è prezzo esistente, logga warning ma non bloccare
    console.error(`❌ Prodotto "${nomeProdotto}" non trovato in configurazione e nessun prezzo esistente`);
    return {
      prezzoTotale: 0,
      kg: 0,
      pezzi: 0,
      dettagli: `Prodotto non trovato`,
      nomeProdotto: nomeProdotto,
      unitaMisura: unitaMisura,
      quantitaOriginale: quantita,
      errore: true
    };
  }

  let prezzoTotale = 0;
  let kg = 0;
  let pezzi = 0;
  let dettagli = '';

  // ✅ Normalizza unità di misura (case-insensitive)
  const unitaNormalizzata = (unitaMisura || 'kg').toLowerCase().trim();

  try {
    switch (unitaNormalizzata) {
      case 'kg':
        // Ordine in KG
        kg = quantita;
        
        if (!config.prezzoKg) {
          // Fallback: se ha prezzoPezzo e pezziPerKg, calcola
          if (config.prezzoPezzo && config.pezziPerKg) {
            prezzoTotale = quantita * config.pezziPerKg * config.prezzoPezzo;
          } else if (prezzoEsistente) {
            prezzoTotale = prezzoEsistente;
          } else {
            throw new Error(`Prodotto "${nomeProdotto}" non ha prezzo/kg configurato`);
          }
        } else {
          prezzoTotale = quantita * config.prezzoKg;
        }
        
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
            if (prezzoEsistente) {
              prezzoTotale = prezzoEsistente;
            } else {
              throw new Error(`Prodotto "${nomeProdotto}" non ha prezzo/pezzo configurato`);
            }
          } else {
            prezzoTotale = quantita * config.prezzoPezzo;
          }
          dettagli = `${pezzi} pezzi`;
          
          console.log(`✅ ${nomeProdotto} - SOLO_PEZZO: ${pezzi} × €${config.prezzoPezzo} = €${prezzoTotale.toFixed(2)}`);
        } 
        // CASO 2: Prodotto con prezzoPezzo definito
        else if (config.prezzoPezzo) {
          prezzoTotale = quantita * config.prezzoPezzo;
          
          if (config.pezziPerKg) {
            kg = quantita / config.pezziPerKg;
            dettagli = `${pezzi} pezzi (${kg.toFixed(2)} kg)`;
          } else {
            dettagli = `${pezzi} pezzi`;
          }
          
          console.log(`✅ ${nomeProdotto} - PREZZO_PEZZO: ${pezzi} × €${config.prezzoPezzo} = €${prezzoTotale.toFixed(2)}`);
        }
        // CASO 3: Prodotto con conversione pezzi → kg (es. Pardulas, Culurgiones)
        else if (config.pezziPerKg && config.prezzoKg) {
          // Converti pezzi in kg
          kg = quantita / config.pezziPerKg;
          
          // Calcola prezzo basato sui kg
          prezzoTotale = kg * config.prezzoKg;
          
          dettagli = `${pezzi} pezzi (${kg.toFixed(2)} kg)`;
          
          console.log(`✅ ${nomeProdotto} - PEZZI→KG: ${pezzi} pz ÷ ${config.pezziPerKg} × €${config.prezzoKg}/kg = €${prezzoTotale.toFixed(2)}`);
        } 
        else if (prezzoEsistente) {
          prezzoTotale = prezzoEsistente;
          dettagli = `${pezzi} pezzi (prezzo manuale)`;
        }
        else {
          throw new Error(`Prodotto "${nomeProdotto}" non supporta vendita a pezzi`);
        }
        break;

      case 'unità':
      case 'unita':
      case 'unitá':
        // Ordine in UNITÀ (es. 1 torta di saba)
        if (config.modalitaVendita === MODALITA_VENDITA.PESO_VARIABILE) {
          kg = quantita;
          
          if (!config.prezzoKg) {
            if (prezzoEsistente) {
              prezzoTotale = prezzoEsistente;
            } else {
              throw new Error(`Prodotto "${nomeProdotto}" non ha prezzo/kg configurato`);
            }
          } else {
            prezzoTotale = kg * config.prezzoKg;
          }
          dettagli = `1 unità (${kg} kg)`;
        } else if (config.prezzoPezzo) {
          prezzoTotale = quantita * config.prezzoPezzo;
          pezzi = quantita;
          dettagli = `${quantita} unità`;
        } else if (prezzoEsistente) {
          prezzoTotale = prezzoEsistente;
          dettagli = `${quantita} unità (prezzo manuale)`;
        } else {
          throw new Error(`Prodotto "${nomeProdotto}" non supporta vendita a unità`);
        }
        break;

      case '€':
      case 'euro':
      case 'eur':
        // Ordine in EURO (es. "10 euro di Pardulas")
        const importoDesiderato = quantita;
        
        if (config.modalitaVendita === MODALITA_VENDITA.SOLO_PEZZO) {
          if (!config.prezzoPezzo) {
            prezzoTotale = importoDesiderato;
            dettagli = `€${importoDesiderato} (prezzo manuale)`;
          } else {
            pezzi = Math.floor(importoDesiderato / config.prezzoPezzo);
            prezzoTotale = pezzi * config.prezzoPezzo;
            const resto = importoDesiderato - prezzoTotale;
            dettagli = `${pezzi} pezzi (resto: €${resto.toFixed(2)})`;
          }
        } else {
          if (!config.prezzoKg) {
            prezzoTotale = importoDesiderato;
            dettagli = `€${importoDesiderato} (prezzo manuale)`;
          } else {
            kg = importoDesiderato / config.prezzoKg;
            prezzoTotale = importoDesiderato;
            
            if (config.pezziPerKg) {
              pezzi = Math.round(kg * config.pezziPerKg);
              dettagli = `${kg.toFixed(2)} kg (circa ${pezzi} pezzi)`;
            } else {
              dettagli = `${kg.toFixed(2)} kg`;
            }
          }
        }
        break;

      // ✅ NUOVO: Gestione "vassoio"
      case 'vassoio':
        if (prezzoEsistente) {
          prezzoTotale = prezzoEsistente;
          dettagli = `${quantita} vassoio (prezzo composto)`;
        } else {
          prezzoTotale = 0;
          dettagli = `Vassoio - calcolo manuale`;
        }
        break;

      default:
        // ✅ Fallback per unità non riconosciute
        if (prezzoEsistente) {
          prezzoTotale = prezzoEsistente;
          dettagli = `${quantita} ${unitaMisura} (prezzo esistente)`;
        } else {
          console.warn(`⚠️ Unità di misura "${unitaMisura}" non riconosciuta per "${nomeProdotto}"`);
          prezzoTotale = 0;
          dettagli = `Unità non riconosciuta`;
        }
    }
  } catch (error) {
    console.error(`❌ Errore calcolo prezzo per ${nomeProdotto}:`, error.message);
    
    // Usa prezzo esistente come fallback
    if (prezzoEsistente) {
      return {
        prezzoTotale: parseFloat(prezzoEsistente),
        kg: kg,
        pezzi: pezzi,
        dettagli: `${quantita} ${unitaMisura} (fallback)`,
        nomeProdotto: nomeProdotto,
        unitaMisura: unitaMisura,
        quantitaOriginale: quantita,
        fromFallback: true
      };
    }
    
    return {
      prezzoTotale: 0,
      kg: 0,
      pezzi: 0,
      dettagli: error.message,
      nomeProdotto: nomeProdotto,
      unitaMisura: unitaMisura,
      quantitaOriginale: quantita,
      errore: true
    };
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
};

/**
 * Calcola prezzo da pezzi
 */
export const calcolaPrezzoDaPezzi = (nomeProdotto, numeroPezzi) => {
  const risultato = calcolaPrezzoOrdine(nomeProdotto, numeroPezzi, UNITA_MISURA.PEZZI);
  return risultato.prezzoTotale;
};

/**
 * Calcola prezzo da kg
 */
export const calcolaPrezzoDaKg = (nomeProdotto, kg) => {
  const risultato = calcolaPrezzoOrdine(nomeProdotto, kg, UNITA_MISURA.KG);
  return risultato.prezzoTotale;
};

/**
 * Calcola quantità da importo in euro
 */
export const calcolaQuantitaDaEuro = (nomeProdotto, euro) => {
  return calcolaPrezzoOrdine(nomeProdotto, euro, UNITA_MISURA.EURO);
};

/**
 * Converte pezzi in kg per un prodotto
 */
export const convertiPezziInKg = (nomeProdotto, pezzi) => {
  const config = getProdottoConfig(nomeProdotto);
  
  if (!config || !config.pezziPerKg) {
    console.warn(`Impossibile convertire pezzi in kg per "${nomeProdotto}"`);
    return 0;
  }
  
  return pezzi / config.pezziPerKg;
};

/**
 * Converte kg in pezzi per un prodotto
 */
export const convertiKgInPezzi = (nomeProdotto, kg) => {
  const config = getProdottoConfig(nomeProdotto);
  
  if (!config || !config.pezziPerKg) {
    console.warn(`Impossibile convertire kg in pezzi per "${nomeProdotto}"`);
    return 0;
  }
  
  return Math.round(kg * config.pezziPerKg);
};

/**
 * Verifica se un prodotto supporta una determinata unità di misura
 */
export const supportaUnitaMisura = (nomeProdotto, unitaMisura) => {
  const config = getProdottoConfig(nomeProdotto);
  
  if (!config) return true; // Permetti tutto se non configurato
  
  return config.unitaMisuraDisponibili?.includes(unitaMisura) ?? true;
};

/**
 * Ottiene unità di misura disponibili per un prodotto
 */
export const getUnitaMisuraDisponibili = (nomeProdotto) => {
  const config = getProdottoConfig(nomeProdotto);
  return config?.unitaMisuraDisponibili || [UNITA_MISURA.KG, UNITA_MISURA.PEZZI, UNITA_MISURA.EURO];
};

/**
 * Calcola totale ordine con più prodotti
 */
export const calcolaTotaleOrdine = (prodotti) => {
  let totale = 0;
  const dettaglioProdotti = [];

  prodotti.forEach(item => {
    const risultato = calcolaPrezzoOrdine(
      item.nomeProdotto || item.nome,
      item.quantita,
      item.unitaMisura || item.unita,
      item.prezzo // Passa prezzo esistente come fallback
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
 */
export const formattaPrezzo = (prezzo) => {
  return `€${(prezzo || 0).toFixed(2)}`;
};

/**
 * Calcola prezzo con sconto
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
