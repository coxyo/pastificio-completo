// components/VassoidDolciMisti_FINALE.js
// 🎂 COMPOSITORE VASSOI DOLCI PERSONALIZZATI - VERSIONE CORRETTA 26/11/2025
// ✅ FIX: Protezione contro errori React #31 (undefined values)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Card,
  CardContent,
  Chip,
  Alert,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  Grid,
  Tooltip,
  LinearProgress,
  Collapse,
  Badge
} from '@mui/material';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  AlertCircle,
  Info,
  Package,
  Gift,
  Tag,
  Calculator,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ==========================================
// 🎯 CONFIGURAZIONE PRODOTTI DOLCI (FALLBACK)
// ==========================================
// Se PRODOTTI_CONFIG non è disponibile, usa questa configurazione
const PRODOTTI_DOLCI_DEFAULT = {
  'Pardulas': { prezzoKg: 19, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 20 },
  'Amaretti': { prezzoKg: 22, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 40 },
  'Bianchini': { prezzoKg: 25, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 50 },
  'Gueffus': { prezzoKg: 28, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 30 },
  'Ciambelle': { prezzoKg: 18, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 15 },
  'Pabassine': { prezzoKg: 20, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 25 },
  'Papassinas': { prezzoKg: 20, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 25 }
};

// ✅ Import dinamico con fallback
let PRODOTTI_CONFIG_IMPORTED = null;
let getProdottoConfigImported = null;

try {
  const config = require('../config/prodottiConfig.js');
  PRODOTTI_CONFIG_IMPORTED = config.PRODOTTI_CONFIG;
  getProdottoConfigImported = config.getProdottoConfig;
} catch (e) {
  console.warn('⚠️ Impossibile importare prodottiConfig, uso configurazione default');
}

// ✅ Funzione sicura per ottenere config prodotto
const getProdottoConfigSafe = (nomeProdotto) => {
  if (!nomeProdotto) return null;
  
  // Prova prima con l'import
  if (getProdottoConfigImported) {
    try {
      const config = getProdottoConfigImported(nomeProdotto);
      if (config) return config;
    } catch (e) {
      console.warn('Errore getProdottoConfig:', e);
    }
  }
  
  // Fallback alla configurazione default
  if (PRODOTTI_DOLCI_DEFAULT[nomeProdotto]) {
    return PRODOTTI_DOLCI_DEFAULT[nomeProdotto];
  }
  
  // Fallback generico
  return {
    prezzoKg: 20,
    categoria: 'Dolci',
    unitaMisuraDisponibili: ['Kg', 'Pezzi'],
    pezziPerKg: 20
  };
};

// ✅ FUNZIONE HELPER: Trova label variante da nome
const getVarianteLabel = (nomeProdotto, nomeVariante) => {
  if (!nomeVariante) return null;
  
  // ✅ PROTEZIONE: Se nomeVariante è un oggetto, estrai .nome o .label
  if (typeof nomeVariante === 'object') {
    nomeVariante = nomeVariante.nome || nomeVariante.label || JSON.stringify(nomeVariante);
  }
  
  const config = getProdottoConfigSafe(nomeProdotto);
  if (!config?.varianti || !Array.isArray(config.varianti)) return String(nomeVariante);
  
  const variante = config.varianti.find(v => 
    (typeof v === "string" && v === nomeVariante) ||
    (typeof v === "object" && v.nome === nomeVariante)
  );
  
  // ✅ PROTEZIONE: Garantisci sempre output stringa
  const result = variante?.label || nomeVariante;
  return typeof result === 'string' ? result : String(result);
};

// ==========================================
// 🎯 CONFIGURAZIONE MIX PREDEFINITO
// ==========================================
const MIX_DOLCI_COMPLETO_DEFAULT = {
  'Pardulas': { peso: 0.500, percentuale: 50 },
  'Ciambelle': { peso: 0.230, percentuale: 25 },
  'Amaretti': { peso: 0.140, percentuale: 15 },
  'Bianchini': { peso: 0.040, percentuale: 5 },
  'Gueffus': { peso: 0.040, percentuale: 5 }
};

const PESO_TOTALE_MIX_DEFAULT = 1.0; // 1 Kg

// ==========================================
// 🎯 CONFIGURAZIONE DIMENSIONI VASSOIO
// ==========================================
const DIMENSIONI_VASSOIO = {
  2: { label: 'Nr 2 - Piccolo', pesoSuggerito: 0.2, range: '~200g' },
  4: { label: 'Nr 4 - Medio', pesoSuggerito: 0.45, range: '~400-500g' },
  6: { label: 'Nr 6 - Grande', pesoSuggerito: 0.85, range: '~700g-1kg' },
  8: { label: 'Nr 8 - XL', pesoSuggerito: 1.5, range: '~1-2kg' }
};

// ==========================================
// 🎯 MODALITÀ COMPOSIZIONE
// ==========================================
const MODALITA = {
  LIBERA: 'libera',
  TOTALE_PRIMA: 'totale_prima',
  MIX_COMPLETO: 'mix_completo'
};

// ==========================================
// 🎂 COMPONENTE PRINCIPALE
// ==========================================
const VassoidDolciMisti = ({ onAggiungiAlCarrello, onClose, prodottiDisponibili }) => {
  // ========== STATE ==========
  const [modalita, setModalita] = useState(MODALITA.LIBERA);
  
  // Modalità "Totale Prima"
  const [totaleTarget, setTotaleTarget] = useState({
    valore: 1.0,
    unita: 'Kg' // 'Kg', 'Pezzi', '€'
  });
  
  // Composizione corrente
  const [composizione, setComposizione] = useState([]);
  
  // Modalità "Mix Completo"
  const [esclusioni, setEsclusioni] = useState([]);
  
  // Opzioni vassoio
  const [numeroVassoi, setNumeroVassoi] = useState(1);
  const [numeroVassoioDimensione, setNumeroVassoioDimensione] = useState(4);
  const [packaging, setPackaging] = useState('vassoio_carta');
  
  // Opzioni extra
  const [opzioni, setOpzioni] = useState({
    daViaggio: false,
    etichettaIngredienti: false,
    confezionGift: false
  });
  
  const [note, setNote] = useState('');
  
  // UI State
  const [prodottiExpanded, setProdottiExpanded] = useState(true);
  const [errore, setErrore] = useState('');
  const [warning, setWarning] = useState('');

  // ========== PRODOTTI DOLCI ==========
  const prodottiDolci = useMemo(() => {
    // ✅ Usa prodottiDisponibili se passati, altrimenti usa default
    if (prodottiDisponibili && Array.isArray(prodottiDisponibili)) {
      return prodottiDisponibili
        .filter(p => p.categoria === 'Dolci' || p.categoria === 'dolci')
        .map(p => ({
          nome: p.nome || p.name,
          ...p
        }));
    }
    
    // Usa configurazione default
    return Object.entries(PRODOTTI_DOLCI_DEFAULT).map(([nome, config]) => ({

      nome,
      ...config
    }));
  }, [prodottiDisponibili]);

  // ========== CALCOLI DINAMICI ==========
  
  /**
   * ✅ Calcola prezzo singolo prodotto (con protezione errori + gestione varianti)
   */
  const calcolaPrezzoProdotto = useCallback((prodotto, quantita, unita, varianteSelezionata = null) => {
    if (!prodotto || quantita === undefined || quantita === null) return 0;
    
    let config = getProdottoConfigSafe(prodotto);
    if (!config) return 0;

    // ✅ Se prodotto ha varianti, usa prezzo della variante selezionata
    if (varianteSelezionata && config.hasVarianti && config.varianti && Array.isArray(config.varianti)) {
      const variante = config.varianti.find(v => 
        (typeof v === 'string' && v === varianteSelezionata) ||
        (typeof v === 'object' && v.nome === varianteSelezionata)
      );
      
      if (variante && typeof variante === 'object') {
        // Usa prezzi specifici della variante
        if (unita === 'Pezzi' && variante.prezzoPezzo) {
          const qty = parseFloat(quantita) || 0;
          return qty * variante.prezzoPezzo;
        }
        if (variante.prezzoKg) {
          config = { ...config, prezzoKg: variante.prezzoKg };
        }
        if (variante.prezzoPezzo) {
          config = { ...config, prezzoPezzo: variante.prezzoPezzo };
        }
      }
    }

    try {
      const qty = parseFloat(quantita) || 0;
      
      if (unita === 'Kg') {
        return qty * (config.prezzoKg || 0);
      } else if (unita === 'Pezzi') {
        if (config.prezzoPezzo) {
          return qty * config.prezzoPezzo;
        } else if (config.prezzoKg && config.pezziPerKg) {
          return (qty / config.pezziPerKg) * config.prezzoKg;
        }
      } else if (unita === '€') {
        return qty;
      }
      return 0;
    } catch (error) {
      console.error('Errore calcolo prezzo:', error);
      return 0;
    }
  }, []);

  /**
   * ✅ Totale vassoio corrente (con protezione)
   */
  const totaleVassoio = useMemo(() => {
    if (!composizione || !Array.isArray(composizione)) return 0;
    return composizione.reduce((acc, item) => acc + (parseFloat(item?.prezzo) || 0), 0);
  }, [composizione]);

  /**
   * ✅ Peso totale vassoio (in Kg) (con protezione)
   */
  const pesoTotaleVassoio = useMemo(() => {
    if (!composizione || !Array.isArray(composizione)) return 0;
    
    return composizione.reduce((acc, item) => {
      if (!item) return acc;
      const qty = parseFloat(item.quantita) || 0;
      
      if (item.unita === 'Kg') return acc + qty;
      if (item.unita === 'g') return acc + (qty / 1000);
      if (item.unita === 'Pezzi') {
        const config = getProdottoConfigSafe(item.prodotto);
        if (config?.pezziPerKg) {
          return acc + (qty / config.pezziPerKg);
        }
      }
      return acc;
    }, 0);
  }, [composizione]);

  /**
   * Totale raggiunto vs target (per modalità TOTALE_PRIMA)
   */
  const progressoTarget = useMemo(() => {
    if (modalita !== MODALITA.TOTALE_PRIMA) return 0;
    if (!totaleTarget.valore || totaleTarget.valore <= 0) return 0;
    
    let raggiuntoValore = 0;
    
    if (totaleTarget.unita === 'Kg') {
      raggiuntoValore = pesoTotaleVassoio;
    } else if (totaleTarget.unita === 'Pezzi') {
      raggiuntoValore = composizione.reduce((acc, item) => {
        return item?.unita === 'Pezzi' ? acc + (parseFloat(item.quantita) || 0) : acc;
      }, 0);
    } else if (totaleTarget.unita === '€') {
      raggiuntoValore = totaleVassoio;
    }
    
    return (raggiuntoValore / totaleTarget.valore) * 100;
  }, [modalita, totaleTarget, pesoTotaleVassoio, totaleVassoio, composizione]);

  // ========== HANDLERS ==========
  
  /**
   * Cambio modalità composizione
   */
  const handleModalitaChange = (nuovaModalita) => {
    setModalita(nuovaModalita);
    setComposizione([]);
    setEsclusioni([]);
    setErrore('');
    setWarning('');
    
    // Inizializza Mix Completo
    if (nuovaModalita === MODALITA.MIX_COMPLETO) {
      inizializzaMixCompleto();
    }
  };

  /**
   * Inizializza Mix Dolci Completo
   */
  const inizializzaMixCompleto = () => {
    const nuovaComposizione = Object.entries(MIX_DOLCI_COMPLETO_DEFAULT).map(([nome, info]) => {
      const prezzo = calcolaPrezzoProdotto(nome, info.peso, 'Kg');
      return {
        id: Date.now() + Math.random(),
        prodotto: nome,
        quantita: info.peso,
        unita: 'Kg',
        prezzo: prezzo || 0,
        percentuale: info.percentuale
      };
    });
    
    setComposizione(nuovaComposizione);
  };

  /**
   * ✅ CALCOLA DISTRIBUZIONE TOTALE (modalità TOTALE_PRIMA)
   */
  const calcolaDistribuzioneTotale = () => {
    if (!totaleTarget.valore || totaleTarget.valore <= 0) {
      setErrore('Inserisci un valore target valido (maggiore di 0)');
      return;
    }

    if (composizione.length === 0) {
      setErrore('Aggiungi almeno un prodotto prima di calcolare');
      return;
    }

    const itemsAutoCalc = composizione.filter(item => item.autoCalc);
    if (itemsAutoCalc.length === 0) {
      setWarning('Nessun prodotto da distribuire (tutti hanno quantità fissa)');
      return;
    }

    // Quota per ogni prodotto
    const quotaProdotto = totaleTarget.valore / itemsAutoCalc.length;

    setComposizione(prev =>
      prev.map(item => {
        if (!item.autoCalc) return item;

        let quantita = 0;
        let unita = totaleTarget.unita;

        if (totaleTarget.unita === 'Kg') {
          quantita = quotaProdotto;
          unita = 'Kg';
        } else if (totaleTarget.unita === 'Pezzi') {
          quantita = Math.round(quotaProdotto);
          unita = 'Pezzi';
        } else if (totaleTarget.unita === '€') {
          const config = getProdottoConfigSafe(item.prodotto);
          let prezzoKg = config?.prezzoKg || 20;

          if (item.varianteSelezionata && config?.hasVarianti && config.varianti) {
            const variante = config.varianti.find(v => 
              (typeof v === 'string' && v === item.varianteSelezionata) ||
              (typeof v === 'object' && v.nome === item.varianteSelezionata)
            );
            if (variante && typeof variante === 'object' && variante.prezzoKg) {
              prezzoKg = variante.prezzoKg;
            }
          }

          quantita = quotaProdotto / prezzoKg;
          unita = 'Kg';
        }

        const prezzo = calcolaPrezzoProdotto(item.prodotto, quantita, unita, item.varianteSelezionata);
        return { ...item, quantita, unita, prezzo: prezzo || 0, autoCalc: false };
      })
    );

    setErrore('');
    setWarning('');
    console.log(`✅ Distribuiti ${totaleTarget.valore} ${totaleTarget.unita} tra ${itemsAutoCalc.length} prodotti`);
  };

  /**
   * Toggle esclusione prodotto (Mix Completo)
   */
  const toggleEsclusione = (nomeProdotto) => {
    setEsclusioni(prev => {
      const nuove = prev.includes(nomeProdotto)
        ? prev.filter(p => p !== nomeProdotto)
        : [...prev, nomeProdotto];
      
      // Ricalcola composizione
      ricalcolaMixConEsclusioni(nuove);
      return nuove;
    });
  };

  /**
   * Ricalcola Mix con esclusioni
   */
  const ricalcolaMixConEsclusioni = (esclusioni) => {
    const prodottiInclusi = Object.entries(MIX_DOLCI_COMPLETO_DEFAULT)
      .filter(([nome]) => !esclusioni.includes(nome));
    
    const sommaPercentuali = prodottiInclusi.reduce((acc, [_, info]) => acc + info.percentuale, 0);
    
    if (sommaPercentuali === 0) {
      setComposizione([]);
      return;
    }
    
    const nuovaComposizione = prodottiInclusi.map(([nome, info]) => {
      const pesoRicalcolato = (info.percentuale / sommaPercentuali) * PESO_TOTALE_MIX_DEFAULT;
      const prezzo = calcolaPrezzoProdotto(nome, pesoRicalcolato, 'Kg');
      
      return {
        id: Date.now() + Math.random(),
        prodotto: nome,
        quantita: pesoRicalcolato,
        unita: 'Kg',
        prezzo: prezzo || 0,
        percentuale: (info.percentuale / sommaPercentuali) * 100
      };
    });
    
    setComposizione(nuovaComposizione);
  };

  /**
   * Aggiungi prodotto alla composizione
   */
  const aggiungiProdotto = (nomeProdotto) => {
    const config = getProdottoConfigSafe(nomeProdotto);
    if (!config) {
      console.warn('Config non trovato per:', nomeProdotto);
      return;
    }

    // ✅ MODALITÀ TOTALE_PRIMA: Aggiungi solo prodotto, calcolo automatico dopo
    if (modalita === MODALITA.TOTALE_PRIMA) {
      const nuovoItem = {
        id: Date.now() + Math.random(),
        prodotto: nomeProdotto,
        quantita: 0,
        unita: 'Kg',
        prezzo: 0,
        autoCalc: true,
        varianteSelezionata: config.varianti?.[0] || null
      };

      setComposizione(prev => [...prev, nuovoItem]);
      return;
    }

    // ✅ MODALITÀ LIBERA: Aggiungi con quantità default
    const quantitaDefault = config.modalitaVendita === 'solo_kg' ? 0.5 : 1;
    const unitaDefault = config.unitaMisuraDisponibili?.[0] || 'Kg';
    const prezzo = calcolaPrezzoProdotto(nomeProdotto, quantitaDefault, unitaDefault);

    const nuovoItem = {
      id: Date.now() + Math.random(),
      prodotto: nomeProdotto,
      quantita: quantitaDefault,
      unita: unitaDefault,
      prezzo: prezzo || 0,
      varianteSelezionata: config.varianti?.[0] || null
    };

    setComposizione(prev => [...prev, nuovoItem]);
  };

  /**
   * Aggiorna quantità prodotto
   */
  const aggiornaQuantita = (id, nuovaQuantita) => {
    setComposizione(prev => prev.map(item => {
      if (item.id === id) {
        const quantita = parseFloat(nuovaQuantita) || 0;
        const prezzo = calcolaPrezzoProdotto(item.prodotto, quantita, item.unita, item.varianteSelezionata);
        return { ...item, quantita, prezzo: prezzo || 0 };
      }
      return item;
    }));
  };

  /**
   * Cambia unità di misura
   */
  const cambiaUnita = (id, nuovaUnita) => {
    setComposizione(prev => prev.map(item => {
      if (item.id === id) {
        const prezzo = calcolaPrezzoProdotto(item.prodotto, item.quantita, nuovaUnita, item.varianteSelezionata);
        return { ...item, unita: nuovaUnita, prezzo: prezzo || 0 };
      }
      return item;
    }));
  };

  /**
   * Cambia variante prodotto
   */
  const cambiaVariante = (id, nuovaVariante) => {
    setComposizione(prev => prev.map(item => {
      if (item.id === id) {
        const prezzo = calcolaPrezzoProdotto(item.prodotto, item.quantita, item.unita, nuovaVariante);
        return { ...item, varianteSelezionata: nuovaVariante, prezzo: prezzo || item.prezzo };
      }
      return item;
    }));
  };

  /**
   * Incrementa/Decrementa quantità
   */
  const incrementaQuantita = (id, delta) => {
    setComposizione(prev => prev.map(item => {
      if (item.id === id) {
        let nuovaQuantita;
        if (item.unita === 'Kg') {
          nuovaQuantita = Math.max(0.1, (parseFloat(item.quantita) || 0) + (delta * 0.1));
        } else {
          nuovaQuantita = Math.max(1, Math.floor((parseFloat(item.quantita) || 0) + delta));
        }
        const prezzo = calcolaPrezzoProdotto(item.prodotto, nuovaQuantita, item.unita, item.varianteSelezionata);
        return { ...item, quantita: nuovaQuantita, prezzo: prezzo || 0 };
      }
      return item;
    }));
  };

  /**
   * Rimuovi prodotto
   */
  const rimuoviProdotto = (id) => {
    setComposizione(prev => prev.filter(item => item.id !== id));
  };

  /**
   * Aggiungi al carrello
   */
  const handleAggiungiAlCarrello = () => {
    if (composizione.length === 0) {
      setErrore('Aggiungi almeno un prodotto al vassoio');
      return;
    }

    // Prepara dati vassoio
    const dettagliComposizione = composizione.map(item => {
      // ✅ Ottieni label variante (sempre stringa)
      const varianteLabel = item.varianteSelezionata ? 
        getVarianteLabel(item.prodotto, item.varianteSelezionata) : 
        null;
      
      // ✅ FIX 13/12/2025: Evita duplicazione nome
      // Se la variante già contiene il nome prodotto, usa solo la variante
      let nomeCompleto;
      if (varianteLabel) {
        // Controlla se la variante già inizia con il nome del prodotto
        if (varianteLabel.toLowerCase().startsWith(item.prodotto.toLowerCase())) {
          nomeCompleto = varianteLabel;  // Es: "Ciambelle con marmellata" → usa così com'è
        } else {
          nomeCompleto = `${item.prodotto} ${varianteLabel}`;  // Es: "Pardulas" + "con glassa"
        }
      } else {
        nomeCompleto = item.prodotto || "";
      }
      
      return {
        nome: nomeCompleto,
        quantita: parseFloat(item.quantita) || 0,
        unita: item.unita || "Kg",
        prezzo: parseFloat(item.prezzo) || 0,
        variante: varianteLabel || null
      };
    });

    // ✅ FIX 13/12/2025: Stringa dettagli con abbreviazioni
    const ABBREVIAZIONI_VASSOIO = {
      'Ciambelle con marmellata di albicocca': 'C.Albic',
      'Ciambelle con marmellata di ciliegia': 'C.Cileg',
      'Ciambelle con nutella': 'C.Nut',
      'Ciambelle con zucchero a velo': 'C.Nude',
      'Ciambelle semplici': 'C.Nude',
      'Ciambelle miste': 'C.Miste',
      'Ciambelle': 'C',
      'Pardulas con glassa': 'P.Glass',
      'Pardulas con zucchero a velo': 'P.Zucch',
      'Pardulas (base)': 'P',
      'Pardulas': 'P',
      'Amaretti': 'A',
      'Bianchini': 'B',
      'Gueffus': 'G',
      'Papassinas': 'PAB',
      'Dolci misti': 'Dolci Mix'
    };
    
    const abbreviaNome = (nome) => {
      if (!nome) return '';
      // Cerca match esatto
      if (ABBREVIAZIONI_VASSOIO[nome]) return ABBREVIAZIONI_VASSOIO[nome];
      // Cerca case-insensitive
      for (const [key, abbr] of Object.entries(ABBREVIAZIONI_VASSOIO)) {
        if (key.toLowerCase() === nome.toLowerCase()) return abbr;
      }
      // Cerca match parziale
      for (const [key, abbr] of Object.entries(ABBREVIAZIONI_VASSOIO)) {
        if (nome.toLowerCase().includes(key.toLowerCase())) return abbr;
      }
      return nome;
    };
    
    const dettagliStringa = composizione
      .map(item => {
        const varianteLabel = item.varianteSelezionata ? 
          getVarianteLabel(item.prodotto, item.varianteSelezionata) : 
          null;
        
        // Costruisci nome completo senza duplicazione
        let nomeCompleto;
        if (varianteLabel) {
          if (varianteLabel.toLowerCase().startsWith(item.prodotto.toLowerCase())) {
            nomeCompleto = varianteLabel;
          } else {
            nomeCompleto = `${item.prodotto} ${varianteLabel}`;
          }
        } else {
          nomeCompleto = item.prodotto || '';
        }
        
        // Abbrevia per la stringa
        const nomeAbbreviato = abbreviaNome(nomeCompleto);
        return `${nomeAbbreviato}: ${parseFloat(item.quantita) || 0}`;
      })
      .join(', ');

    // Note complete
    const noteComplete = [
      note,
      opzioni.etichettaIngredienti ? '⚠️ RICORDATI DI ATTACCARE ETICHETTA INGREDIENTI' : '',
      opzioni.daViaggio ? '✈️ Da viaggio (sottovuoto)' : '',
      opzioni.confezionGift ? '🎁 Confezione regalo' : '',
      `📦 Packaging: ${packaging === 'vassoio_carta' ? 'Vassoio Carta' : packaging === 'scatola' ? 'Scatola' : 'Busta Carta'}`,
      `📏 Dimensione: Nr ${numeroVassoioDimensione} (${DIMENSIONI_VASSOIO[numeroVassoioDimensione]?.range || ''})`
    ].filter(Boolean).join(' | ');

    const vassoioData = {
      nome: 'Vassoio Dolci Misti',
      quantita: numeroVassoi,
      unita: 'vassoio',
      prezzo: totaleVassoio * numeroVassoi,
      categoria: 'Dolci',
      note: noteComplete,
      dettagliCalcolo: {
        dettagli: dettagliStringa,
        composizione: dettagliComposizione,
        pesoTotale: pesoTotaleVassoio,
        modalita: modalita,
        numeroVassoioDimensione: numeroVassoioDimensione,
        packaging: packaging,
        opzioni: opzioni
      }
    };

    console.log('🎂 Vassoio creato:', vassoioData);

    if (onAggiungiAlCarrello) {
      onAggiungiAlCarrello(vassoioData);
    }

    // Reset
    setComposizione([]);
    setNote('');
    setNumeroVassoi(1);
    setEsclusioni([]);
    
    if (onClose) {
      onClose();
    }
  };

  // ✅ Helper per formattare numeri in modo sicuro
  const formatNumber = (value, decimals = 2) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(decimals);
  };

  // ========== RENDER ==========
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* HEADER */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          🎂 Componi il Tuo Vassoio
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crea vassoi personalizzati con i nostri dolci artigianali
        </Typography>
      </Box>

      {/* ========== SEZIONE 1: MODALITÀ COMPOSIZIONE ========== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📦 Come vuoi comporre il vassoio?
        </Typography>
        
        <RadioGroup 
          value={modalita} 
          onChange={(e) => handleModalitaChange(e.target.value)}
        >
          <FormControlLabel
            value={MODALITA.LIBERA}
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">
                  🆓 Aggiungi prodotti liberamente
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Componi il vassoio aggiungendo i prodotti che vuoi
                </Typography>
              </Box>
            }
          />
          
          <FormControlLabel
            value={MODALITA.TOTALE_PRIMA}
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">
                  🎯 Imposta totale prima (poi componi)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Definisci peso/pezzi/euro target e componi fino a raggiungerlo
                </Typography>
              </Box>
            }
          />
          
          <FormControlLabel
            value={MODALITA.MIX_COMPLETO}
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">
                  ✨ Dolci Misti Completo (escludi qualcosa)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Mix equilibrato da 1 Kg, puoi escludere prodotti
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </Paper>

      {/* ========== SEZIONE 2: TOTALE TARGET (se modalità = totale_prima) ========== */}
      {modalita === MODALITA.TOTALE_PRIMA && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#E3F2FD', borderLeft: '4px solid #2196F3' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1565C0' }}>
            ⚖️ Totale Vassoio Target
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <FormLabel>Ordina per:</FormLabel>
                <RadioGroup
                  row
                  value={totaleTarget.unita}
                  onChange={(e) => setTotaleTarget(prev => ({ ...prev, unita: e.target.value }))}
                >
                  <FormControlLabel value="Kg" control={<Radio />} label="Peso (Kg)" />
                  <FormControlLabel value="Pezzi" control={<Radio />} label="Pezzi" />
                  <FormControlLabel value="€" control={<Radio />} label="Euro (€)" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantità Target"
                value={totaleTarget.valore}
                onChange={(e) => setTotaleTarget(prev => ({ 
                  ...prev, 
                  valore: parseFloat(e.target.value) || 0 
                }))}
                inputProps={{ min: 0, step: 0.1 }}
              />
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={calcolaDistribuzioneTotale}
                disabled={!totaleTarget.valore || totaleTarget.valore <= 0 || composizione.length === 0}
                sx={{ mt: 2 }}
                startIcon={<Calculator size={20} />}
              >
                Calcola Distribuzione
              </Button>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Progresso:
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(progressoTarget, 100)}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2">
                  {progressoTarget >= 100 ? (
                    <Chip label="✅ Raggiunto!" color="success" size="small" />
                  ) : (
                    `${formatNumber(progressoTarget, 1)}% raggiunto`
                  )}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* ========== SEZIONE 3: ESCLUSIONI (se modalità = mix_completo) ========== */}
      {modalita === MODALITA.MIX_COMPLETO && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🚫 Escludi Prodotti dal Mix
          </Typography>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Il mix predefinito contiene: Pardulas (50%), Ciambelle (25%), Amaretti (15%), Bianchini (5%), Gueffus (5%)
          </Typography>
          
          <FormGroup row sx={{ mt: 2 }}>
            {Object.keys(MIX_DOLCI_COMPLETO_DEFAULT).map(nome => (
              <FormControlLabel
                key={nome}
                control={
                  <Checkbox
                    checked={esclusioni.includes(nome)}
                    onChange={() => toggleEsclusione(nome)}
                  />
                }
                label={`🚫 ${nome}`}
              />
            ))}
          </FormGroup>
        </Paper>
      )}

      {/* ========== SEZIONE 4: SELEZIONE PRODOTTI (modalità LIBERA o TOTALE_PRIMA) ========== */}
      {(modalita === MODALITA.LIBERA || modalita === MODALITA.TOTALE_PRIMA) && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box 
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setProdottiExpanded(!prodottiExpanded)}
          >
            <Typography variant="h6">
              🍰 Seleziona Prodotti
            </Typography>
            <IconButton>
              {prodottiExpanded ? <ChevronUp /> : <ChevronDown />}
            </IconButton>
          </Box>
          
          <Collapse in={prodottiExpanded}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {prodottiDolci.map((prodotto) => (
                <Chip
                  key={prodotto.nome}
                  label={prodotto.nome}
                  onClick={() => aggiungiProdotto(prodotto.nome)}
                  color="primary"
                  variant="outlined"
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#E3F2FD' } }}
                />
              ))}
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* ========== SEZIONE 5: COMPOSIZIONE CORRENTE ========== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          🛒 Composizione Vassoio
          {composizione.length > 0 && (
            <Chip 
              label={`${composizione.length} prodotti`} 
              size="small" 
              color="primary"
              sx={{ ml: 2 }}
            />
          )}
        </Typography>

        {composizione.length === 0 ? (
          <Alert severity="info">
            Nessun prodotto aggiunto. Inizia a comporre il tuo vassoio!
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {composizione.map((item) => {
              const config = getProdottoConfigSafe(item?.prodotto);
              
              return (
                <Card key={item.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      {/* Nome Prodotto */}
                      <Typography variant="subtitle1" sx={{ minWidth: 150, fontWeight: 'bold' }}>
                        {String(item.prodotto || 'N/D')}
                        {item.varianteSelezionata && (
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({String(getVarianteLabel(item.prodotto, item.varianteSelezionata) || "")})
                          </Typography>
                        )}
                      </Typography>

                      {/* Dropdown Varianti */}
                      {config?.varianti && config.varianti.length > 0 &&  (
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={item.varianteSelezionata || (config.varianti[0]?.nome || config.varianti[0])}
                            onChange={(e) => cambiaVariante(item.id, e.target.value)}
                          >
                            {config.varianti.map(variante => (
                              <MenuItem key={variante?.nome || variante} value={variante?.nome || variante}>
                                {variante?.label || variante}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      {/* MODALITÀ TOTALE_PRIMA: Mostra solo quantità calcolata */}
                      {modalita === MODALITA.TOTALE_PRIMA && item.autoCalc ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          bgcolor: '#E8F5E9',
                          px: 2,
                          py: 1,
                          borderRadius: 1
                        }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {item.unita === 'Pezzi' 
                              ? `${Math.floor(parseFloat(item.quantita) || 0)} ${item.unita}`
                              : `${formatNumber(item.quantita)} ${item.unita}`
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (calcolato automaticamente)
                          </Typography>
                        </Box>
                      ) : (
                        /* MODALITÀ LIBERA: Controlli quantità normali */
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => incrementaQuantita(item.id, -1)}
                          >
                            <Minus size={16} />
                          </IconButton>

                          <TextField
                            type="number"
                            value={item.quantita || 0}
                            onChange={(e) => aggiornaQuantita(item.id, e.target.value)}
                            size="small"
                            sx={{ width: 80 }}
                            inputProps={{ min: 0, step: item.unita === 'Kg' ? 0.1 : 1 }}
                          />

                          <IconButton 
                            size="small" 
                            onClick={() => incrementaQuantita(item.id, 1)}
                          >
                            <Plus size={16} />
                          </IconButton>
                        </Box>
                      )}

                      {/* Dropdown Unità di Misura - Solo in modalità LIBERA */}
                      {modalita !== MODALITA.TOTALE_PRIMA && (
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value={item.unita || 'Kg'}
                            onChange={(e) => cambiaUnita(item.id, e.target.value)}
                          >
                            {(config?.unitaMisuraDisponibili || ['Kg', 'Pezzi']).map(unita => (
                              <MenuItem key={unita} value={unita}>
                                {unita}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      {/* ✅ Prezzo (con protezione) */}
                      <Typography 
                        variant="h6" 
                        color="primary"
                        sx={{ ml: 'auto', minWidth: 80, textAlign: 'right' }}
                      >
                        €{formatNumber(item.prezzo)}
                      </Typography>

                      {/* Rimuovi */}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => rimuoviProdotto(item.id)}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>

                    {/* Info Percentuale (solo per Mix Completo) */}
                    {item.percentuale && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {formatNumber(item.percentuale, 0)}% del mix
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Totali */}
        {composizione.length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Peso Totale:
                </Typography>
                <Typography variant="h6">
                  {formatNumber(pesoTotaleVassoio)} Kg
                </Typography>
              </Grid>
              
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Prezzo Totale:
                </Typography>
                <Typography variant="h6" color="primary">
                  €{formatNumber(totaleVassoio)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* ========== SEZIONE 6: OPZIONI VASSOIO ========== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📦 Opzioni Vassoio
        </Typography>

        <Grid container spacing={3}>
          {/* Numero Vassoi */}
          <Grid item xs={12} md={6}>
            <Typography variant="body2" gutterBottom>
              Numero Vassoi (uguali)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={() => setNumeroVassoi(Math.max(1, numeroVassoi - 1))}
                disabled={numeroVassoi <= 1}
              >
                <Minus />
              </IconButton>
              
              <TextField
                type="number"
                value={numeroVassoi}
                onChange={(e) => setNumeroVassoi(Math.max(1, parseInt(e.target.value) || 1))}
                size="small"
                sx={{ width: 80 }}
                inputProps={{ min: 1, max: 50 }}
              />
              
              <IconButton onClick={() => setNumeroVassoi(numeroVassoi + 1)}>
                <Plus />
              </IconButton>
              
              <Typography variant="caption" color="text.secondary">
                Totale: €{formatNumber(totaleVassoio * numeroVassoi)}
              </Typography>
            </Box>
          </Grid>

          {/* Dimensione Vassoio */}
          <Grid item xs={12} md={6}>
            <Typography variant="body2" gutterBottom>
              Dimensione Vassoio
            </Typography>
            <Select
              value={numeroVassoioDimensione}
              onChange={(e) => setNumeroVassoioDimensione(e.target.value)}
              size="small"
              fullWidth
            >
              {Object.entries(DIMENSIONI_VASSOIO).map(([num, info]) => (
                <MenuItem key={num} value={parseInt(num)}>
                  {info.label} - {info.range}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          {/* Packaging */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" gutterBottom>
              Tipo Packaging
            </Typography>
            <RadioGroup
              row
              value={packaging}
              onChange={(e) => setPackaging(e.target.value)}
            >
              <FormControlLabel
                value="vassoio_carta"
                control={<Radio />}
                label="📦 Vassoio Carta"
              />
              <FormControlLabel
                value="scatola"
                control={<Radio />}
                label="📦 Scatola Rigida"
              />
              <FormControlLabel
                value="busta_carta"
                control={<Radio />}
                label="🛍️ Busta Carta"
              />
            </RadioGroup>
          </Grid>

          {/* Opzioni Extra */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" gutterBottom>
              Opzioni Extra
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={opzioni.daViaggio}
                    onChange={(e) => setOpzioni({ ...opzioni, daViaggio: e.target.checked })}
                  />
                }
                label="✈️ Da Viaggio (sottovuoto)"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={opzioni.etichettaIngredienti}
                    onChange={(e) => setOpzioni({ ...opzioni, etichettaIngredienti: e.target.checked })}
                  />
                }
                label={
                  <Tooltip title="Promemoria per attaccare l'etichetta ingredienti stampata">
                    <span>🏷️ Ricorda Etichetta Ingredienti</span>
                  </Tooltip>
                }
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={opzioni.confezionGift}
                    onChange={(e) => setOpzioni({ ...opzioni, confezionGift: e.target.checked })}
                  />
                }
                label="🎁 Confezione Regalo"
              />
            </FormGroup>
          </Grid>

          {/* Note */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="📝 Note Aggiuntive"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Es: Confezionare insieme, niente glassa, etc."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ========== ALERT ERRORI/WARNING ========== */}
      {errore && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errore}
        </Alert>
      )}
      
      {warning && !errore && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {warning}
        </Alert>
      )}

      {/* ========== RIEPILOGO FINALE ========== */}
      {composizione.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#E3F2FD' }}>
          <Typography variant="h6" gutterBottom>
            💰 Riepilogo Finale
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">Peso per vassoio:</Typography>
              <Typography variant="h6">{formatNumber(pesoTotaleVassoio)} Kg</Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2">Prezzo per vassoio:</Typography>
              <Typography variant="h6">€{formatNumber(totaleVassoio)}</Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2">Numero vassoi:</Typography>
              <Typography variant="h6">{numeroVassoi}x</Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="primary">TOTALE:</Typography>
              <Typography variant="h4" color="primary">
                €{formatNumber(totaleVassoio * numeroVassoi)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* ========== AZIONI ========== */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onClose && (
          <Button
            variant="outlined"
            onClick={onClose}
            size="large"
          >
            Annulla
          </Button>
        )}
        
        <Button
          variant="contained"
          size="large"
          onClick={handleAggiungiAlCarrello}
          disabled={composizione.length === 0 || !!errore}
          startIcon={<ShoppingCart />}
        >
          Aggiungi al Carrello
        </Button>
      </Box>
    </Box>
  );
};

export default VassoidDolciMisti;