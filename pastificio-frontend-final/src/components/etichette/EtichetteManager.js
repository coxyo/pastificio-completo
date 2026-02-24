// components/etichette/EtichetteManager.js
// Sistema completo gestione etichette - 3 tab
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Paper, Tabs, Tab, Typography, Button, Select, MenuItem,
  FormControl, InputLabel, TextField, Checkbox, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Divider, Grid, Card, CardContent,
  Autocomplete, Switch, Tooltip, Badge, Stack
} from '@mui/material';
import {
  Print as PrintIcon,
  Visibility as PreviewIcon,
  LocalShipping as OrdiniIcon,
  Inventory as ProdottiIcon,
  FactCheck as ProduzioneIcon,
  Today as TodayIcon,
  SelectAll as SelectAllIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CheckCircle,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app';
const LOGO_BASE64 = 'data:image/jpeg;base64,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';


// ═══════════════════════════════════════════════════════════
// DATABASE INGREDIENTI E ALLERGENI
// ═══════════════════════════════════════════════════════════

const PRODOTTI_INFO = {
  // DOLCI
  'Pardulas': {
    categoria: 'Dolci',
    ingredienti: 'Ricotta, zucchero, uova, zafferano, limone, farina 00, strutto, lievito',
    allergeni: ['GLUTINE', 'UOVA', 'LATTE'],
    scadenzaGiorni: 7
  },
  'Amaretti': {
    categoria: 'Dolci',
    ingredienti: 'Mandorle, zucchero, uova, limone',
    allergeni: ['FRUTTA A GUSCIO', 'UOVA'],
    scadenzaGiorni: 7
  },
  'Papassinas': {
    categoria: 'Dolci',
    ingredienti: 'Farina, mandorle, uva sultanina, noci, sapa, zucchero, strutto, latte, ammoniaca per dolci, limone, vanillina, lievito',
    allergeni: ['GLUTINE', 'FRUTTA A GUSCIO'],
    scadenzaGiorni: 7
  },
  'Ciambelle con marmellata': {
    categoria: 'Dolci',
    ingredienti: 'Farina 00, zucchero, strutto, margarina vegetale, uova, passata di albicocche, limone, vanillina, lievito',
    allergeni: ['GLUTINE', 'UOVA'],
    scadenzaGiorni: 7
  },
  'Ciambelle con Nutella': {
    categoria: 'Dolci',
    ingredienti: 'Farina, zucchero, strutto, margarina vegetale, uova, cacao, aromi vari, lievito',
    allergeni: ['GLUTINE', 'UOVA', 'FRUTTA A GUSCIO', 'LATTE'],
    scadenzaGiorni: 7
  },
  'Crostate': {
    categoria: 'Dolci',
    ingredienti: 'Farina, zucchero, strutto, margarina vegetale, uova, passata di albicocche, limone, vanillina, lievito',
    allergeni: ['GLUTINE', 'UOVA'],
    scadenzaGiorni: 7
  },
  'Cantucci': {
    categoria: 'Dolci',
    ingredienti: 'Mandorle, farina 00, zucchero, uova, limone',
    allergeni: ['GLUTINE', 'FRUTTA A GUSCIO', 'UOVA'],
    scadenzaGiorni: 7
  },
  'Bianchini': {
    categoria: 'Dolci',
    ingredienti: 'Zucchero, uova',
    allergeni: ['UOVA'],
    scadenzaGiorni: 7
  },
  'Gueffus': {
    categoria: 'Dolci',
    ingredienti: "Mandorle, zucchero, acqua fior d'arancio",
    allergeni: ['FRUTTA A GUSCIO'],
    scadenzaGiorni: 7
  },
  'Zeppole': {
    categoria: 'Dolci',
    ingredienti: 'Farina, latte, uova, ricotta, patate, zafferano, acquavite, lievito, fritte in olio di palma',
    allergeni: ['GLUTINE', 'UOVA', 'LATTE'],
    scadenzaGiorni: 7
  },
  'Pizzette sfoglia': {
    categoria: 'Dolci',
    ingredienti: 'Farina, passata di pomodoro, strutto, capperi, lievito',
    allergeni: ['GLUTINE'],
    scadenzaGiorni: 7
  },
  'Torta di sapa': {
    categoria: 'Dolci',
    ingredienti: 'Farina, sapa, zucchero, uova, noci, mandorle, uva sultanina, limone, lievito',
    allergeni: ['GLUTINE', 'UOVA', 'FRUTTA A GUSCIO'],
    scadenzaGiorni: 7
  },

  // PANADAS
  'Panada di anguille': {
    categoria: 'Panadas',
    ingredienti: 'Pasta (Farina, semola, strutto, sale), Ripieno (anguille, patate o piselli, olio extra vergine, prezzemolo, aglio, pomodoro secco)',
    allergeni: ['GLUTINE', 'PESCE'],
    scadenzaGiorni: 3
  },
  'Panada di Agnello': {
    categoria: 'Panadas',
    ingredienti: 'Pasta (Farina, semola, strutto, sale), Ripieno (agnello, patate o piselli, olio extra vergine, prezzemolo, aglio, pomodoro secco)',
    allergeni: ['GLUTINE'],
    scadenzaGiorni: 3
  },
  'Panada di Maiale': {
    categoria: 'Panadas',
    ingredienti: 'Pasta (Farina, semola, strutto, sale), Ripieno (maiale, patate o piselli, olio extra vergine, prezzemolo, aglio, pomodoro secco)',
    allergeni: ['GLUTINE'],
    scadenzaGiorni: 3
  },
  'Panada di Vitella': {
    categoria: 'Panadas',
    ingredienti: 'Pasta (Farina, semola, strutto, sale), Ripieno (vitella, patate o piselli, olio extra vergine, prezzemolo, aglio, pomodoro secco)',
    allergeni: ['GLUTINE'],
    scadenzaGiorni: 3
  },
  'Panada di verdure': {
    categoria: 'Panadas',
    ingredienti: 'Pasta (Farina, semola, strutto, sale), Ripieno (melanzane, patate, piselli, olio extra vergine, prezzemolo, aglio, pomodoro secco)',
    allergeni: ['GLUTINE'],
    scadenzaGiorni: 3
  },
  'Panadine carne o verdura': {
    categoria: 'Panadas',
    ingredienti: 'Pasta (Farina, semola, strutto, sale), Ripieno (olio extra vergine, aromi vari)',
    allergeni: ['GLUTINE'],
    scadenzaGiorni: 3
  },

  // PASTA
  'Ravioli ricotta e zafferano': {
    categoria: 'Pasta',
    ingredienti: 'Ricotta, zafferano, uova, sale, semola, farina',
    allergeni: ['GLUTINE', 'UOVA', 'LATTE'],
    scadenzaGiorni: 3
  },
  'Ravioli ricotta spinaci e zafferano': {
    categoria: 'Pasta',
    ingredienti: 'Ricotta, spinaci, zafferano, uova, sale, semola, farina',
    allergeni: ['GLUTINE', 'UOVA', 'LATTE'],
    scadenzaGiorni: 3
  },
  'Ravioli ricotta spinaci': {
    categoria: 'Pasta',
    ingredienti: 'Ricotta, spinaci, uova, sale, semola, farina',
    allergeni: ['GLUTINE', 'UOVA', 'LATTE'],
    scadenzaGiorni: 3
  },
  'Ravioli ricotta Dolci': {
    categoria: 'Pasta',
    ingredienti: 'Ricotta, zafferano, uova, zucchero, semola, farina',
    allergeni: ['GLUTINE', 'UOVA', 'LATTE'],
    scadenzaGiorni: 3
  },
  'Culurgiones': {
    categoria: 'Pasta',
    ingredienti: 'Patate, formaggio, aglio, menta, olio extra vergine, sale, semola, farina',
    allergeni: ['GLUTINE', 'LATTE'],
    scadenzaGiorni: 3
  },
  'Ravioli formaggio': {
    categoria: 'Pasta',
    ingredienti: 'Formaggio pecorino, spinaci, uova, sale, semola, farina',
    allergeni: ['GLUTINE', 'UOVA', 'LATTE'],
    scadenzaGiorni: 3
  },
  'Lasagne': {
    categoria: 'Pasta',
    ingredienti: 'Semola, farina, uova, sale',
    allergeni: ['GLUTINE', 'UOVA'],
    scadenzaGiorni: 180
  },
  'Pasta per panadas': {
    categoria: 'Pasta',
    ingredienti: 'Semola, farina, strutto naturale, sale',
    allergeni: ['GLUTINE'],
    scadenzaGiorni: 3
  },
  'Pasta per pizza': {
    categoria: 'Pasta',
    ingredienti: 'Farina, latte, olio, lievito, sale',
    allergeni: ['GLUTINE', 'LATTE'],
    scadenzaGiorni: 3
  },
  'Fregola': {
    categoria: 'Pasta',
    ingredienti: 'Semola, zafferano, sale',
    allergeni: ['GLUTINE'],
    scadenzaGiorni: 180
  }
};

// ═══════════════════════════════════════════════════════════
// FORMATI ETICHETTE PER STAMPANTE
// ═══════════════════════════════════════════════════════════

const FORMATI_STAMPA = {
  'markin-piccola': {
    nome: 'Markin 52.5×29.7mm (Epson A4)',
    larghezza: 52.5,
    altezza: 29.7,
    colonne: 4,
    righe: 10,
    margineSinistro: 0,
    margineSuperiore: 0,
    spaziatura: 0,
    tipo: 'foglio'
  },
  'markin-media': {
    nome: 'Markin 70×29.7mm (Epson A4)',
    larghezza: 70,
    altezza: 29.7,
    colonne: 3,
    righe: 10,
    margineSinistro: 0,
    margineSuperiore: 0,
    spaziatura: 0,
    tipo: 'foglio'
  },
  'markin-grande': {
    nome: 'Markin 105×48mm (Epson A4)',
    larghezza: 105,
    altezza: 48,
    colonne: 2,
    righe: 6,
    margineSinistro: 0,
    margineSuperiore: 0,
    spaziatura: 0,
    tipo: 'foglio'
  },
  'niimbot': {
    nome: 'Niimbot 50×30mm (Termica)',
    larghezza: 50,
    altezza: 30,
    colonne: 1,
    righe: 1,
    margineSinistro: 0,
    margineSuperiore: 0,
    spaziatura: 0,
    tipo: 'termica'
  },
  'katasymbol': {
    nome: 'Katasymbol 150×40mm (Rullo)',
    larghezza: 150,
    altezza: 40,
    colonne: 1,
    righe: 1,
    margineSinistro: 0,
    margineSuperiore: 0,
    spaziatura: 0,
    tipo: 'rullo'
  }
};

// Tipi pasta per tracciabilità produzione
const TIPI_PASTA_PRODUZIONE = [
  'Pasta Ravioli',
  'Pasta Panada',
  'Pasta Pardulas',
  'Pasta Sebadas',
  'Pasta Culurgiones',
  'Impasto Dolci'
];

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════

const EtichetteManager = () => {
  // State generali
  const [tabCorrente, setTabCorrente] = useState(0);
  const [formatoStampa, setFormatoStampa] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('etichette_formato') || 'markin-grande';
    }
    return 'markin-grande';
  });
  const [dialogAnteprima, setDialogAnteprima] = useState(false);
  const [etichetteDaStampare, setEtichetteDaStampare] = useState([]);
  const [loading, setLoading] = useState(false);

  // State Tab 1 - Ordini
  const [ordini, setOrdini] = useState([]);
  const [ordiniSelezionati, setOrdiniSelezionati] = useState(new Set());
  const [dataFiltro, setDataFiltro] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loadingOrdini, setLoadingOrdini] = useState(false);

  // State Tab 2 - Prodotti
  const [prodottoSelezionato, setProdottoSelezionato] = useState(null);
  const [dataProduzione, setDataProduzione] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [pesoProdotto, setPesoProdotto] = useState('');
  const [quantitaEtichette, setQuantitaEtichette] = useState(1);

  // State Tab 3 - Produzione
  const [pasteSelezionate, setPasteSelezionate] = useState(new Set());
  const [dataProduzioneFoglio, setDataProduzioneFoglio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formatoProduzione, setFormatoProduzione] = useState('foglio'); // foglio o singole
  const [righeExtra, setRigheExtra] = useState(2);
  const [operatoreSelezionato, setOperatoreSelezionato] = useState('');
  const OPERATORI = ['MAURIZIO', 'FRANCESCA', 'VALENTINA'];

  const printRef = useRef(null);

  // Salva formato preferito
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('etichette_formato', formatoStampa);
    }
  }, [formatoStampa]);

  // ═══════════════════════════════════════════════════════════
  // CARICAMENTO ORDINI
  // ═══════════════════════════════════════════════════════════

  const caricaOrdini = useCallback(async () => {
    try {
      setLoadingOrdini(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/ordini`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const tuttiOrdini = data.data || [];
      
      // Filtra per data selezionata
      const dataSelezionata = new Date(dataFiltro);
      dataSelezionata.setHours(0, 0, 0, 0);
      const dataFine = new Date(dataSelezionata);
      dataFine.setDate(dataFine.getDate() + 1);

      const ordiniFiltrati = tuttiOrdini.filter(o => {
        const dataRitiro = new Date(o.dataRitiro || o.createdAt);
        return dataRitiro >= dataSelezionata && dataRitiro < dataFine;
      });

      // Ordina per ora ritiro
      ordiniFiltrati.sort((a, b) => {
        const oraA = a.oraRitiro || '00:00';
        const oraB = b.oraRitiro || '00:00';
        return oraA.localeCompare(oraB);
      });

      setOrdini(ordiniFiltrati);
    } catch (error) {
      console.error('Errore caricamento ordini:', error);
      toast.error('Errore nel caricamento ordini');
    } finally {
      setLoadingOrdini(false);
    }
  }, [dataFiltro]);

  useEffect(() => {
    if (tabCorrente === 0) {
      caricaOrdini();
    }
  }, [tabCorrente, caricaOrdini]);

  // ═══════════════════════════════════════════════════════════
  // LOGICA GENERAZIONE ETICHETTE ORDINE
  // ═══════════════════════════════════════════════════════════

  // Helper: abbrevia nome cliente → "F. ALESSANDRA" o "FLORIS AL."
  const abbreviaNomeCliente = (nome, cognome) => {
    let testo = '';
    if (nome && cognome) {
      testo = `${nome} ${cognome}`;
    } else if (cognome) {
      testo = cognome;
    } else if (nome) {
      testo = nome;
    } else {
      return 'N/D';
    }
    
    const parti = testo.trim().split(/\s+/);
    if (parti.length >= 2) {
      const completo = parti.join(' ');
      if (completo.length <= 12) return completo.toUpperCase();
      // Abbrevia: prima lettera prima parola + seconda parola
      const abbr1 = `${parti[0].charAt(0).toUpperCase()}. ${parti.slice(1).join(' ').toUpperCase()}`;
      if (abbr1.length <= 14) return abbr1;
      // Se ancora troppo lungo: prima parola + iniziale seconda
      const abbr2 = `${parti[0].toUpperCase()} ${parti[1].charAt(0).toUpperCase()}.`;
      if (abbr2.length <= 14) return abbr2;
      // Ultima risorsa: tronca
      return completo.toUpperCase().substring(0, 12);
    }
    return testo.toUpperCase();
  };

  // ═══ COMPOSIZIONE VASSOIO - Logica da RiepilogoStampabile.js ═══

  // Conversione pezzi → Kg (stessi valori di RiepilogoStampabile)
  const PEZZI_PER_KG = {
    'Pardulas': 25, 'Amaretti': 35, 'Bianchini': 100,
    'Papassinas': 30, 'Papassine': 30, 'Pabassine': 30, 'Pabassinas': 30,
    'Gueffus': 65, 'Ciambelle': 30, 'Sebadas': 10, 'Zeppole': 24,
    'Ciambelle con marmellata di albicocca': 30,
    'Ciambelle con marmellata di ciliegia': 30,
    'Ciambelle con nutella': 30,
    'Ciambelle con zucchero a velo': 30,
    'Pizzette sfoglia': 30,
  };

  const getPezziPerKgComp = (nome) => {
    if (PEZZI_PER_KG[nome]) return PEZZI_PER_KG[nome];
    for (const [chiave, val] of Object.entries(PEZZI_PER_KG)) {
      if (nome.toLowerCase().includes(chiave.toLowerCase()) ||
          chiave.toLowerCase().includes(nome.toLowerCase())) return val;
    }
    return 30;
  };

  // Abbreviazioni composizione (stesse del RiepilogoStampabile)
  const getAbbrComp = (nome, variante) => {
    const ABBR = {
      'Pardulas': 'P', 'Amaretti': 'A', 'Bianchini': 'B', 'Gueffus': 'G',
      'Papassinas': 'Pab', 'Papassine': 'Pab', 'Pabassine': 'Pab',
      'Ciambelle': 'C', 'Sebadas': 'Seb', 'Zeppole': 'Z',
      'Torta di saba': 'T', 'Pizzette sfoglia': 'Piz',
    };
    
    // Match esatto nome
    if (ABBR[nome]) {
      let base = ABBR[nome];
      // Varianti ciambelle
      if (base === 'C' && variante) {
        const vl = variante.toLowerCase();
        if (vl.includes('albicocca')) return 'C.Alb';
        if (vl.includes('ciliegia') || vl.includes('cilieg')) return 'C.Cil';
        if (vl.includes('nutella')) return 'C.Nut';
        if (vl.includes('zucchero')) return 'C.Zuc';
        if (vl.includes('miste')) return 'C.Mix';
      }
      // Varianti pardulas
      if (base === 'P' && variante) {
        const vl = variante.toLowerCase();
        if (vl.includes('glassa')) return 'P.Gl';
      }
      return base;
    }
    // Match parziale
    for (const [chiave, abbr] of Object.entries(ABBR)) {
      if (nome.toLowerCase().includes(chiave.toLowerCase())) return abbr;
    }
    return nome.charAt(0).toUpperCase();
  };

  // Ritorna: { descrizione: "P 0,5 C.Alb 0,3", pesoTotale: "1 Kg" }
  const abbreviaComposizioneVassoio = (prodotto) => {
    const fmtQ = (n) => {
      const r = Math.round(n * 10) / 10;
      return r % 1 === 0 ? String(Math.round(r)) : r.toFixed(1).replace('.', ',');
    };
    
    const composizione = prodotto.dettagliCalcolo?.composizione 
      || prodotto.composizione || [];
    
    if (composizione.length > 0) {
      let pesoTotKg = 0;
      const parti = [];
      
      for (const item of composizione) {
        const abbr = getAbbrComp(item.nome || '', item.variante || '');
        const q = parseFloat(item.quantita) || 0;
        const unitaItem = (item.unita || 'Kg').toLowerCase();
        
        if (q <= 0) continue;
        
        if (unitaItem === 'pezzi' || unitaItem === 'pz' || unitaItem === 'unità') {
          // CONVERTI pezzi in Kg
          const ppk = getPezziPerKgComp(item.nome || '');
          const kgEquiv = q / ppk;
          pesoTotKg += kgEquiv;
          parti.push(`${abbr} ${fmtQ(kgEquiv)}`);
        } else {
          pesoTotKg += q;
          parti.push(`${abbr} ${fmtQ(q)}`);
        }
      }
      
      if (parti.length > 0) {
        return {
          descrizione: parti.join(' '),
          pesoTotale: `${fmtQ(pesoTotKg)} Kg`
        };
      }
    }

    // Fallback campo dettagli stringa
    const dettagli = prodotto.dettagliCalcolo?.dettagli || prodotto.dettagli || '';
    if (dettagli) {
      const segmenti = dettagli.split(/[,|;]\s*/);
      let pesoTotKg = 0;
      const parti = [];
      for (const seg of segmenti) {
        const match = seg.match(/^(.+?):\s*([\d.,]+)\s*(Kg|g|pz|pezzi|unità)?/i);
        if (match) {
          const q = parseFloat(match[2].replace(',', '.')) || 0;
          const u = (match[3] || 'Kg').toLowerCase();
          const abbr = getAbbrComp(match[1].trim(), '');
          if (q > 0) {
            if (u === 'pz' || u === 'pezzi' || u === 'unità') {
              const ppk = getPezziPerKgComp(match[1].trim());
              const kgEquiv = q / ppk;
              pesoTotKg += kgEquiv;
              parti.push(`${abbr} ${fmtQ(kgEquiv)}`);
            } else {
              pesoTotKg += q;
              parti.push(`${abbr} ${fmtQ(q)}`);
            }
          }
        }
      }
      if (parti.length > 0) {
        return {
          descrizione: parti.join(' '),
          pesoTotale: `${fmtQ(pesoTotKg)} Kg`
        };
      }
    }

    return {
      descrizione: 'Dolci misti',
      pesoTotale: prodotto.quantita ? `${prodotto.quantita} Kg` : ''
    };
  };

  // Helper: abbrevia nome prodotto per etichetta
  const abbreviaProdotto = (nome) => {
    if (!nome) return '';
    const abbreviazioni = {
      // Ravioli - ordine specifico prima (match più lungo prima)
      'Ravioli ricotta con Spinaci e con Zafferano': 'Rav. Ric. Sp. Zaff.',
      'Ravioli ricotta con Spinaci': 'Rav. Ric. Spinaci',
      'Ravioli ricotta con Zafferano': 'Rav. Ric. Zaff.',
      'Ravioli ricotta Dolci': 'Rav. Ric. Dolci',
      'Ravioli formaggio': 'Rav. Formaggio',
      'Ravioli ricotta': 'Rav. Ricotta',
      'Culurgiones': 'Culurg.',
      'Culurgiones di patate': 'Culurg. Patate',
      // Panadas
      'Panada di Agnello (con patate)': 'Pan. Agn. Pat.',
      'Panada di Agnello': 'Pan. Agnello',
      'Panada di verdure (con patate)': 'Pan. Verd. Pat.',
      'Panada di verdure': 'Pan. Verdure',
      'Panada di anguille': 'Pan. Anguille',
      'Panada di Maiale': 'Pan. Maiale',
      'Panada di Vitella': 'Pan. Vitella',
      'Pasta per panada': 'Pasta panada',
      // Ciambelle con variante
      'Ciambelle con marmellata': 'Ciamb. Marm.',
      'Ciambelle con nutella': 'Ciamb. Nutella',
      'Ciambelle con zucchero': 'Ciamb. Zucch.',
      'Ciambelle miste': 'Ciamb. Miste',
      'Ciambelle solo base': 'Ciamb. Base',
      'Ciambelle albicocca': 'Ciamb. Albic.',
      'Ciambelle ciliegia': 'Ciamb. Cileg.',
      // Ciambelle generico (last)
      'Ciambelle': 'Ciambelle',
      // Altri dolci
      'Sebadas arancia': 'Seb. Arancia',
      'Sebadas limone': 'Seb. Limone',
      'Vassoio Dolci Misti': 'Vass. Misti',
      'Pardulas': 'Pardulas',
      'Panadine': 'Panadine',
      'Zeppole': 'Zeppole',
      'Pizzette sfoglia': 'Pizzette sf.',
      'Torta di sapa': 'Torta sapa',
      'Torta di saba': 'Torta saba',
      'Fregola': 'Fregola',
      'Lasagne': 'Lasagne',
    };
    // Cerca match esatto prima
    if (abbreviazioni[nome]) return abbreviazioni[nome];
    // Cerca match parziale (contiene)
    for (const [chiave, abbr] of Object.entries(abbreviazioni)) {
      if (nome.toLowerCase().includes(chiave.toLowerCase())) return abbr;
    }
    // Se il nome è lungo (>20 char), tronca
    if (nome.length > 20) return nome.substring(0, 18) + '..';
    return nome;
  };

  const generaEtichetteOrdine = (ordine) => {
    const etichette = [];
    const cognomeDisplay = abbreviaNomeCliente(
      ordine.nomeCliente, 
      ordine.cognomeCliente
    );
    const ora = ordine.oraRitiro || '--:--';

    (ordine.prodotti || []).forEach(prodotto => {
      const nome = prodotto.nome || 'Prodotto';
      const quantita = prodotto.quantita || 0;
      const unita = prodotto.unita || 'Kg';
      const variante = prodotto.variante || '';
      const nomeCompleto = variante ? `${nome} ${variante}` : nome;
      const nomeAbbreviato = abbreviaProdotto(nomeCompleto);

      // Determina categoria prodotto
      const isPasta = nome.toLowerCase().includes('ravioli') || 
                      nome.toLowerCase().includes('culurgion');
      const isPanada = nome.toLowerCase().includes('panada') || 
                       nome.toLowerCase().includes('panadin');

      if (isPasta) {
        if (unita === 'Pezzi') {
          // RAVIOLI A PEZZI: 1 etichetta con quantità totale
          etichette.push({
            tipo: 'ordine',
            cognome: cognomeDisplay,
            ora,
            prodotto: nomeAbbreviato,
            quantita: `${quantita} Pezzi`,
            ordineId: ordine._id
          });
        } else if (quantita <= 1.3) {
          // Un solo pacco
          etichette.push({
            tipo: 'ordine',
            cognome: cognomeDisplay,
            ora,
            prodotto: nomeAbbreviato,
            quantita: `${quantita} ${unita}`,
            ordineId: ordine._id
          });
        } else {
          // Più pacchi da 1 Kg
          let rimanente = quantita;
          let numPacco = 1;
          const totPacchi = Math.ceil(quantita);
          while (rimanente > 0) {
            const qPacco = rimanente > 1.3 ? 1 : rimanente;
            etichette.push({
              tipo: 'ordine',
              cognome: cognomeDisplay,
              ora,
              prodotto: nomeAbbreviato,
              quantita: `${qPacco} ${unita}`,
              pacco: totPacchi > 1 ? `${numPacco}/${totPacchi}` : null,
              ordineId: ordine._id
            });
            rimanente -= qPacco;
            rimanente = Math.round(rimanente * 100) / 100;
            numPacco++;
          }
        }
      } else if (isPanada) {
        // PANADAS: 1 etichetta per ordine totale
        const qDisplay = unita === 'Pezzi' ? `x${quantita}` : `${quantita} ${unita}`;
        etichette.push({
          tipo: 'ordine',
          cognome: cognomeDisplay,
          ora,
          prodotto: nomeAbbreviato,
          quantita: qDisplay,
          ordineId: ordine._id
        });
      } else {
        // DOLCI e altri: 1 etichetta per voce
        const vassoi = prodotto.numeroVassoi || 1;
        const dimVassoio = prodotto.dimensioneVassoio || '';
        
        // Se è un vassoio dolci misti, mostra la composizione con quantità
        const isVassoioMisti = nome.toLowerCase().includes('vassoio') || 
                               (nome.toLowerCase().includes('dolci misti') && unita === 'vassoio');
        
        if (isVassoioMisti) {
          const comp = abbreviaComposizioneVassoio(prodotto);
          for (let v = 0; v < vassoi; v++) {
            etichette.push({
              tipo: 'ordine',
              isVassoio: true,
              cognome: cognomeDisplay,
              ora,
              prodotto: comp.descrizione,
              quantita: comp.pesoTotale || `${quantita} Kg`,
              vassoio: vassoi > 1 ? `${v + 1}/${vassoi}` : null,
              dimensione: dimVassoio,
              ordineId: ordine._id
            });
          }
        } else {
          for (let v = 0; v < vassoi; v++) {
            etichette.push({
              tipo: 'ordine',
              cognome: cognomeDisplay,
              ora,
              prodotto: nomeAbbreviato,
              quantita: `${quantita} ${unita}`,
              vassoio: vassoi > 1 ? `${v + 1}/${vassoi}` : null,
              dimensione: dimVassoio,
              ordineId: ordine._id
            });
          }
        }
      }
    });

    return etichette;
  };

  // ═══════════════════════════════════════════════════════════
  // LOGICA GENERAZIONE ETICHETTE PRODOTTO
  // ═══════════════════════════════════════════════════════════

  const generaEtichetteProdotto = () => {
    if (!prodottoSelezionato) return [];

    const info = PRODOTTI_INFO[prodottoSelezionato];
    if (!info) return [];

    const dataProd = new Date(dataProduzione);
    const dataScadenza = addDays(dataProd, info.scadenzaGiorni);

    const etichette = [];
    for (let i = 0; i < quantitaEtichette; i++) {
      etichette.push({
        tipo: 'prodotto',
        nome: prodottoSelezionato,
        ingredienti: info.ingredienti,
        allergeni: info.allergeni,
        peso: pesoProdotto,
        dataProduzione: format(dataProd, 'dd/MM/yyyy'),
        dataScadenza: format(dataScadenza, 'dd/MM/yyyy'),
        scadenzaGiorni: info.scadenzaGiorni
      });
    }
    return etichette;
  };

  // ═══════════════════════════════════════════════════════════
  // LOGICA GENERAZIONE ETICHETTE PRODUZIONE
  // ═══════════════════════════════════════════════════════════

  const generaEtichetteProduzione = () => {
    if (formatoProduzione === 'foglio') {
      // Foglio unico con tutte le paste
      const righe = [
        ...TIPI_PASTA_PRODUZIONE,
        ...Array(righeExtra).fill('')  // righe vuote extra
      ];
      return [{
        tipo: 'produzione-foglio',
        data: format(new Date(dataProduzioneFoglio), 'dd/MM/yyyy'),
        paste: righe,
        pasteSelezionate: Array.from(pasteSelezionate),
        operatore: operatoreSelezionato
      }];
    } else {
      // Etichette singole per tipo
      return Array.from(pasteSelezionate).map(pasta => ({
        tipo: 'produzione-singola',
        nome: pasta,
        data: format(new Date(dataProduzioneFoglio), 'dd/MM/yyyy'),
        operatore: operatoreSelezionato
      }));
    }
  };

  // ═══════════════════════════════════════════════════════════
  // ANTEPRIMA E STAMPA
  // ═══════════════════════════════════════════════════════════

  const mostraAnteprima = (etichette) => {
    if (!etichette || etichette.length === 0) {
      toast.error('Nessuna etichetta da stampare');
      return;
    }
    setEtichetteDaStampare(etichette);
    setDialogAnteprima(true);
  };

  const stampa = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup bloccato. Abilita i popup per stampare.');
      return;
    }

    const formato = FORMATI_STAMPA[formatoStampa];
    const cssStampa = generaCSSStampa(formato);
    const htmlEtichette = generaHTMLEtichette(etichetteDaStampare, formato);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <title>Stampa Etichette - Pastificio Nonna Claudia</title>
        <style>${cssStampa}</style>
      </head>
      <body>
        ${htmlEtichette}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    setDialogAnteprima(false);
    toast.success(`${etichetteDaStampare.length} etichette inviate alla stampa`);
  };

  // ═══════════════════════════════════════════════════════════
  // GENERAZIONE CSS STAMPA
  // ═══════════════════════════════════════════════════════════

  const generaCSSStampa = (formato) => {
    const { larghezza, altezza, colonne, righe, tipo } = formato;

    // Font sizes calibrati per altezza etichetta
    // 29.7mm = molto piccola, 48mm = media, >48mm = grande
    const isMinuscola = altezza <= 30;
    const isMedia = altezza > 30 && altezza <= 50;
    
    const fontCognome = isMinuscola ? '11' : isMedia ? '14' : '16';
    const fontOra = isMinuscola ? '9' : isMedia ? '11' : '12';
    const fontProdotto = isMinuscola ? '10' : isMedia ? '12' : '14';
    const fontQuantita = isMinuscola ? '11' : isMedia ? '13' : '15';
    const fontPacco = isMinuscola ? '7' : '9';
    const paddingEtichetta = isMinuscola ? '0.5mm 1mm' : '1.5mm';
    const marginRigaTop = isMinuscola ? '0.3mm' : '1mm';

    // Font per etichette prodotto
    const fontNomeProdotto = isMinuscola ? '10' : isMedia ? '13' : '16';
    const fontIngredienti = isMinuscola ? '5.5' : isMedia ? '7' : '9';
    const fontCampo = isMinuscola ? '6' : isMedia ? '7.5' : '9';
    const fontFooter = isMinuscola ? '5' : isMedia ? '6' : '7';

    // Calcolo margini foglio A4 per centrare la griglia di etichette
    // A4 = 210mm x 297mm
    const larghezzaTotale = colonne * larghezza;
    const altezzaTotale = righe * altezza;
    const margineSx = (210 - larghezzaTotale) / 2;
    const margineSup = (297 - altezzaTotale) / 2;

    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body { 
        font-family: Arial, Helvetica, sans-serif; 
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      @page {
        ${tipo === 'foglio' 
          ? `size: A4; margin: 0;` 
          : tipo === 'termica'
            ? `size: ${altezza}mm ${larghezza}mm; margin: 0;`
            : `size: ${larghezza}mm ${altezza}mm; margin: 0;`
        }
      }

      ${tipo === 'termica' ? `
      /* Stampanti termiche: pagina portrait (30×50), contenuto ruotato 90° */
      body {
        margin: 0;
        padding: 0;
      }
      .etichetta-ordine, .etichetta-prodotto, .etichetta-produzione-singola {
        width: ${altezza}mm !important;
        height: ${larghezza}mm !important;
        page-break-after: always;
        overflow: hidden;
        position: relative;
      }
      .etichetta-ordine .contenuto-ruotato,
      .etichetta-prodotto .contenuto-ruotato,
      .etichetta-produzione-singola .contenuto-ruotato {
        position: absolute;
        top: 1mm;
        left: 0;
        width: ${larghezza - 3}mm;
        height: ${altezza - 2}mm;
        transform: rotate(90deg);
        transform-origin: top left;
        margin-left: ${altezza - 1}mm;
        padding: 0 1mm;
      }
      .etichetta-ordine table {
        width: 100%;
        height: 100%;
      }
      ` : ''}

      /* ===== ETICHETTE ORDINE ===== */
      .etichetta-ordine {
        width: ${larghezza}mm;
        height: ${altezza}mm;
        padding: ${paddingEtichetta};
        display: inline-block;
        vertical-align: top;
        overflow: hidden;
        page-break-inside: avoid;
      }
      .etichetta-ordine table {
        width: 100%;
        height: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      .etichetta-ordine td {
        padding: 0 0.5mm;
        vertical-align: middle;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: 0;
      }
      .etichetta-ordine .col-sinistra {
        width: 62%;
      }
      .etichetta-ordine .col-destra {
        width: 38%;
      }
      .etichetta-ordine .cognome {
        font-size: ${fontCognome}pt;
        font-weight: bold;
        text-transform: uppercase;
        text-align: left;
      }
      .etichetta-ordine .ora {
        font-size: ${fontOra}pt;
        color: #333;
        text-align: right;
      }
      .etichetta-ordine .prodotto {
        font-size: ${fontProdotto}pt;
        text-align: left;
      }
      .etichetta-ordine .quantita {
        font-size: ${fontQuantita}pt;
        font-weight: bold;
        text-align: right;
      }
      .etichetta-ordine .pacco-info {
        font-size: ${fontPacco}pt;
        color: #666;
        text-align: right;
      }
      .etichetta-ordine .composizione {
        font-size: ${fontProdotto}pt;
        font-weight: bold;
        text-align: left;
        white-space: normal;
        word-wrap: break-word;
        line-height: 1.2;
        padding: 0 0.5mm;
      }

      /* ===== ETICHETTE PRODOTTO ===== */
      .etichetta-prodotto {
        width: ${larghezza}mm;
        height: ${tipo === 'foglio' ? altezza + 'mm' : 'auto'};
        min-height: ${altezza}mm;
        padding: ${paddingEtichetta};
        display: inline-block;
        vertical-align: top;
        overflow: hidden;
        page-break-inside: avoid;
        line-height: 1.2;
        font-size: 0;
      }
      .etichetta-prodotto .nome-prodotto {
        font-size: ${fontNomeProdotto}pt;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: ${isMinuscola ? '0.5mm' : '1.5mm'};
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .etichetta-prodotto .ingredienti {
        font-size: ${fontIngredienti}pt;
        line-height: 1.2;
        margin-bottom: ${isMinuscola ? '0.3mm' : '1mm'};
        overflow: hidden;
        ${isMinuscola ? 'max-height: 7mm;' : ''}
      }
      .etichetta-prodotto .ingredienti-label {
        font-weight: bold;
      }
      .etichetta-prodotto .allergeni {
        font-size: ${fontIngredienti}pt;
        margin-bottom: ${isMinuscola ? '0.3mm' : '1.5mm'};
      }
      .etichetta-prodotto .allergeni-label {
        font-weight: bold;
      }
      .etichetta-prodotto .allergene {
        font-weight: bold;
        text-transform: uppercase;
      }
      .etichetta-prodotto .campo-compilabile {
        font-size: ${fontCampo}pt;
        margin-bottom: 0.3mm;
        display: flex;
        align-items: baseline;
      }
      .etichetta-prodotto .linea-campo {
        flex: 1;
        border-bottom: 0.5pt solid #000;
        margin-left: 1mm;
        min-width: 10mm;
      }
      .etichetta-prodotto .data-precompilata {
        font-weight: normal;
        margin-left: 1mm;
      }
      .etichetta-prodotto .footer-azienda {
        font-size: ${fontFooter}pt;
        text-align: center;
        margin-top: auto;
        padding-top: 0.5mm;
        border-top: 0.3pt solid #999;
        color: #555;
      }

      /* ===== FOGLIO PRODUZIONE ===== */
      .foglio-produzione {
        width: 190mm;
        padding: 10mm;
        page-break-after: always;
      }
      .foglio-produzione h1 {
        font-size: 18pt;
        text-align: center;
        margin-bottom: 3mm;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .foglio-produzione .data-foglio {
        font-size: 14pt;
        text-align: center;
        margin-bottom: 8mm;
      }
      .foglio-produzione .riga-pasta {
        display: flex;
        align-items: center;
        padding: 3mm 0;
        border-bottom: 0.5pt solid #ddd;
        font-size: 12pt;
      }
      .foglio-produzione .checkbox-produzione {
        width: 5mm;
        height: 5mm;
        border: 1pt solid #000;
        margin-right: 4mm;
        display: inline-block;
        flex-shrink: 0;
      }
      .foglio-produzione .nome-pasta {
        flex: 1;
        font-weight: 500;
        min-width: 50mm;
      }
      .foglio-produzione .campo-data {
        margin-left: 4mm;
        font-size: 11pt;
      }
      .foglio-produzione .linea-data {
        display: inline-block;
        width: 30mm;
        border-bottom: 0.5pt solid #000;
        margin-left: 2mm;
      }
      .foglio-produzione .riga-vuota .nome-pasta {
        border-bottom: 0.5pt solid #000;
      }
      .foglio-produzione .operatore {
        margin-top: 10mm;
        font-size: 12pt;
      }
      .foglio-produzione .footer-foglio {
        margin-top: 8mm;
        font-size: 10pt;
        color: #666;
        text-align: center;
      }

      /* ===== ETICHETTA PRODUZIONE SINGOLA ===== */
      .etichetta-produzione-singola {
        width: ${larghezza}mm;
        height: ${altezza}mm;
        padding: ${paddingEtichetta};
        display: inline-block;
        vertical-align: top;
        overflow: hidden;
        page-break-inside: avoid;
        line-height: 1.2;
        font-size: 0;
      }
      .etichetta-produzione-singola .nome {
        font-size: ${fontCognome}pt;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: ${isMinuscola ? '0.3mm' : '1mm'};
      }
      .etichetta-produzione-singola .info {
        font-size: ${fontProdotto}pt;
      }

      /* ===== GRIGLIA FOGLIO A4 ===== */
      .griglia-etichette {
        width: 210mm;
        min-height: 297mm;
        margin: 0;
        padding: ${margineSup}mm 0 0 ${margineSx}mm;
        font-size: 0;
        line-height: 0;
      }

      /* ===== PRINT SPECIFICO ===== */
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; }
        .no-print { display: none !important; }
        .griglia-etichette { page-break-inside: auto; }
        .etichetta-ordine, .etichetta-prodotto, .etichetta-produzione-singola {
          border: none;
        }
      }

      /* ===== ANTEPRIMA SCREEN ===== */
      @media screen {
        body { 
          background: #eee; 
          padding: 20px; 
        }
        .griglia-etichette {
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          margin: 0 auto;
        }
        .foglio-produzione {
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          margin: 0 auto;
        }
      }
    `;
  };

  // ═══════════════════════════════════════════════════════════
  // GENERAZIONE HTML ETICHETTE
  // ═══════════════════════════════════════════════════════════

  const generaHTMLEtichette = (etichette, formato) => {
    if (!etichette || etichette.length === 0) return '';

    const primaEtichetta = etichette[0];

    // Foglio produzione - formato speciale
    if (primaEtichetta.tipo === 'produzione-foglio') {
      return generaHTMLFoglioProduzione(primaEtichetta);
    }

    // Etichette singole (termica/rullo)
    if (formato.tipo !== 'foglio') {
      const isTermica = formato.tipo === 'termica';
      return etichette.map(e => renderEtichettaHTML(e, isTermica)).join('\n');
    }

    // Griglia per foglio A4
    let html = '<div class="griglia-etichette">';
    etichette.forEach(e => {
      html += renderEtichettaHTML(e, false);
    });
    html += '</div>';
    return html;
  };

  const renderEtichettaHTML = (etichetta, isTermica = false) => {
    // Per termiche: wrappa contenuto in div ruotato
    const wrapTermica = (classe, contenuto) => {
      if (isTermica) {
        return `<div class="${classe}"><div class="contenuto-ruotato">${contenuto}</div></div>`;
      }
      return `<div class="${classe}">${contenuto}</div>`;
    };

    switch (etichetta.tipo) {
      case 'ordine':
        if (etichetta.isVassoio) {
          const innerVassoio = `
            <table>
              <colgroup><col class="col-sinistra"><col class="col-destra"></colgroup>
              <tr>
                <td class="cognome">${etichetta.cognome}</td>
                <td class="ora">${etichetta.ora}</td>
              </tr>
              <tr>
                <td colspan="2" class="composizione">${etichetta.prodotto} = ${etichetta.quantita}</td>
              </tr>
            </table>`;
          return wrapTermica('etichetta-ordine', innerVassoio);
        }
        const innerOrdine = `
          <table>
            <colgroup><col class="col-sinistra"><col class="col-destra"></colgroup>
            <tr>
              <td class="cognome">${etichetta.cognome}</td>
              <td class="ora">${etichetta.ora}</td>
            </tr>
            <tr>
              <td class="prodotto">${etichetta.prodotto}</td>
              <td class="quantita">${etichetta.quantita}</td>
            </tr>
            ${etichetta.pacco ? `<tr><td colspan="2" class="pacco-info">Pacco ${etichetta.pacco}</td></tr>` : ''}
            ${etichetta.vassoio ? `<tr><td colspan="2" class="pacco-info">Vassoio ${etichetta.vassoio}</td></tr>` : ''}
          </table>`;
        return wrapTermica('etichetta-ordine', innerOrdine);

      case 'prodotto':
        const innerProdotto = `
            <div style="text-align:center;margin-bottom:1mm;">
              <img src="${LOGO_BASE64}" style="height:8mm;width:auto;" />
            </div>
            <div class="nome-prodotto">${etichetta.nome}</div>
            <div class="ingredienti">
              <span class="ingredienti-label">Ingredienti:</span> ${etichetta.ingredienti}
            </div>
            <div class="allergeni">
              <span class="allergeni-label">Allergeni:</span> 
              ${etichetta.allergeni.map(a => `<span class="allergene">${a}</span>`).join(', ')}
            </div>
            <div class="campo-compilabile">
              Peso: ${etichetta.peso ? `<span class="data-precompilata">${etichetta.peso} Kg</span>` : '<span class="linea-campo"></span> Kg'}
            </div>
            <div class="campo-compilabile">
              Prodotto il: <span class="data-precompilata">${etichetta.dataProduzione}</span>
            </div>
            <div class="campo-compilabile">
              Da consumare entro: <span class="data-precompilata">${etichetta.dataScadenza}</span>
            </div>
            <div class="footer-azienda">
              Pastificio Nonna Claudia — Via Carmine 20/B - Assemini
            </div>`;
        return wrapTermica('etichetta-prodotto', innerProdotto);

      case 'produzione-singola':
        const operatoreDisplay = etichetta.operatore 
          ? `<span style="font-weight:bold">${etichetta.operatore}</span>` 
          : '_______________';
        const innerProduz = `
            <div class="nome">${etichetta.nome}</div>
            <div class="info">Prodotta il: ${etichetta.data}</div>
            <div class="info">Operatore: ${operatoreDisplay}</div>`;
        return wrapTermica('etichetta-produzione-singola', innerProduz);

      default:
        return '';
    }
  };

  const generaHTMLFoglioProduzione = (foglio) => {
    const righeHTML = foglio.paste.map((pasta, idx) => {
      const isVuota = !pasta;
      return `
        <div class="riga-pasta ${isVuota ? 'riga-vuota' : ''}">
          <span class="checkbox-produzione"></span>
          <span class="nome-pasta">${pasta || '&nbsp;'}</span>
          <span class="campo-data">del <span class="linea-data"></span></span>
        </div>
      `;
    }).join('');

    return `
      <div class="foglio-produzione">
        <h1>Tracciabilità Produzione</h1>
        <div class="data-foglio">Data: ${foglio.data}</div>
        ${righeHTML}
        <div class="operatore">
          Operatore: ${foglio.operatore ? `<strong>${foglio.operatore}</strong>` : '________________________________________'}
        </div>
        <div class="footer-foglio">
          Pastificio Nonna Claudia — Via Carmine 20/B - Assemini
        </div>
      </div>
    `;
  };

  // ═══════════════════════════════════════════════════════════
  // SELEZIONE ORDINI
  // ═══════════════════════════════════════════════════════════

  const toggleOrdineSelezionato = (ordineId) => {
    setOrdiniSelezionati(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ordineId)) {
        newSet.delete(ordineId);
      } else {
        newSet.add(ordineId);
      }
      return newSet;
    });
  };

  const selezionaTutti = () => {
    if (ordiniSelezionati.size === ordini.length) {
      setOrdiniSelezionati(new Set());
    } else {
      setOrdiniSelezionati(new Set(ordini.map(o => o._id)));
    }
  };

  const contaEtichetteOrdiniSelezionati = () => {
    let totale = 0;
    ordini.forEach(o => {
      if (ordiniSelezionati.has(o._id)) {
        totale += generaEtichetteOrdine(o).length;
      }
    });
    return totale;
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER TAB 1 - ETICHETTE ORDINE
  // ═══════════════════════════════════════════════════════════

  const renderTabOrdini = () => (
    <Box>
      {/* Filtri */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          type="date"
          label="Data ritiro"
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ width: 180 }}
        />
        <Button
          variant="outlined"
          startIcon={<TodayIcon />}
          onClick={() => setDataFiltro(format(new Date(), 'yyyy-MM-dd'))}
          size="small"
        >
          Oggi
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={caricaOrdini}
          size="small"
        >
          Aggiorna
        </Button>

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<SelectAllIcon />}
            onClick={selezionaTutti}
            size="small"
          >
            {ordiniSelezionati.size === ordini.length ? 'Deseleziona' : 'Seleziona'} tutti
          </Button>
          <Chip 
            label={`${ordiniSelezionati.size} ordini → ${contaEtichetteOrdiniSelezionati()} etichette`}
            color="primary"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Tabella ordini */}
      {loadingOrdini ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : ordini.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Nessun ordine trovato per il {format(new Date(dataFiltro), 'dd MMMM yyyy', { locale: it })}
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={ordiniSelezionati.size === ordini.length && ordini.length > 0}
                    indeterminate={ordiniSelezionati.size > 0 && ordiniSelezionati.size < ordini.length}
                    onChange={selezionaTutti}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ora</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Prodotti</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Etichette</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordini.map((ordine) => {
                const etichette = generaEtichetteOrdine(ordine);
                const isSelected = ordiniSelezionati.has(ordine._id);
                return (
                  <TableRow 
                    key={ordine._id} 
                    hover
                    selected={isSelected}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => toggleOrdineSelezionato(ordine._id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={isSelected} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {ordine.oraRitiro || '--:--'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {ordine.cognomeCliente || ordine.nomeCliente || 'N/D'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(ordine.prodotti || []).map((p, i) => (
                          <Chip
                            key={i}
                            label={`${p.nome}${p.variante ? ' ' + p.variante : ''} ${p.quantita}${p.unita || 'Kg'}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Badge badgeContent={etichette.length} color="primary">
                        <PrintIcon fontSize="small" color="action" />
                      </Badge>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Anteprima e stampa">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            mostraAnteprima(etichette);
                          }}
                        >
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pulsanti azione */}
      {ordiniSelezionati.size > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => {
              const etichette = [];
              ordini.forEach(o => {
                if (ordiniSelezionati.has(o._id)) {
                  etichette.push(...generaEtichetteOrdine(o));
                }
              });
              mostraAnteprima(etichette);
            }}
          >
            Anteprima ({contaEtichetteOrdiniSelezionati()} etichette)
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => {
              const etichette = [];
              ordini.forEach(o => {
                if (ordiniSelezionati.has(o._id)) {
                  etichette.push(...generaEtichetteOrdine(o));
                }
              });
              mostraAnteprima(etichette);
            }}
          >
            Stampa selezionati
          </Button>
        </Box>
      )}
    </Box>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER TAB 2 - ETICHETTE PRODOTTO
  // ═══════════════════════════════════════════════════════════

  const renderTabProdotti = () => {
    const info = prodottoSelezionato ? PRODOTTI_INFO[prodottoSelezionato] : null;
    const prodottiPerCategoria = {};
    Object.entries(PRODOTTI_INFO).forEach(([nome, info]) => {
      if (!prodottiPerCategoria[info.categoria]) {
        prodottiPerCategoria[info.categoria] = [];
      }
      prodottiPerCategoria[info.categoria].push(nome);
    });

    return (
      <Box>
        <Grid container spacing={3}>
          {/* Colonna sinistra - Selezione */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
                📦 Seleziona Prodotto
              </Typography>

              <Autocomplete
                value={prodottoSelezionato}
                onChange={(e, val) => setProdottoSelezionato(val)}
                options={Object.keys(PRODOTTI_INFO)}
                groupBy={(option) => PRODOTTI_INFO[option]?.categoria || 'Altro'}
                renderInput={(params) => (
                  <TextField {...params} label="Prodotto" placeholder="Cerca prodotto..." />
                )}
                sx={{ mb: 2 }}
              />

              <TextField
                type="date"
                label="Data produzione"
                value={dataProduzione}
                onChange={(e) => setDataProduzione(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{ mb: 2 }}
              />

              {info && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Scadenza: <strong>{info.scadenzaGiorni} giorni</strong> → {' '}
                  {format(addDays(new Date(dataProduzione), info.scadenzaGiorni), 'dd/MM/yyyy')}
                </Alert>
              )}

              <TextField
                label="Peso (Kg) — lascia vuoto per compilare a mano"
                value={pesoProdotto}
                onChange={(e) => setPesoProdotto(e.target.value.replace(/,/g, '.'))}
                fullWidth
                sx={{ mb: 2 }}
                placeholder="Es: 0.5"
              />

              <TextField
                type="number"
                label="Quantità etichette"
                value={quantitaEtichette}
                onChange={(e) => setQuantitaEtichette(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1, max: 100 }}
                fullWidth
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={() => mostraAnteprima(generaEtichetteProdotto())}
                  disabled={!prodottoSelezionato}
                  fullWidth
                >
                  Anteprima
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={() => mostraAnteprima(generaEtichetteProdotto())}
                  disabled={!prodottoSelezionato}
                  fullWidth
                >
                  Stampa ({quantitaEtichette})
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Colonna destra - Anteprima prodotto */}
          <Grid item xs={12} md={7}>
            {info ? (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  👁️ Anteprima Etichetta
                </Typography>

                {/* Anteprima visiva etichetta */}
                <Box sx={{
                  border: '2px solid #e0e0e0',
                  borderRadius: 2,
                  p: 3,
                  maxWidth: 400,
                  mx: 'auto',
                  backgroundColor: '#fafafa'
                }}>
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <img src={LOGO_BASE64} alt="Logo" style={{ height: 40 }} />
                  </Box>
                  <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', textTransform: 'uppercase', mb: 1.5 }}>
                    {prodottoSelezionato}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Ingredienti:</strong> {info.ingredienti}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    <strong>Allergeni:</strong>{' '}
                    {info.allergeni.map((a, i) => (
                      <React.Fragment key={a}>
                        {i > 0 && ', '}
                        <strong style={{ textTransform: 'uppercase' }}>{a}</strong>
                      </React.Fragment>
                    ))}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Peso:</strong> {pesoProdotto ? `${pesoProdotto} Kg` : '_______ Kg'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Prodotto il:</strong> {format(new Date(dataProduzione), 'dd/MM/yyyy')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    <strong>Da consumare entro:</strong>{' '}
                    {format(addDays(new Date(dataProduzione), info.scadenzaGiorni), 'dd/MM/yyyy')}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="caption" align="center" display="block" color="text.secondary">
                    Pastificio Nonna Claudia — Via Carmine 20/B - Assemini
                  </Typography>
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <ProdottiIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                <Typography color="text.secondary">
                  Seleziona un prodotto per vedere l'anteprima dell'etichetta
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER TAB 3 - ETICHETTE PRODUZIONE
  // ═══════════════════════════════════════════════════════════

  const renderTabProduzione = () => (
    <Box>
      <Grid container spacing={3}>
        {/* Opzioni */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
              📋 Tracciabilità Produzione
            </Typography>

            <TextField
              type="date"
              label="Data produzione"
              value={dataProduzioneFoglio}
              onChange={(e) => setDataProduzioneFoglio(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Formato stampa</InputLabel>
              <Select
                value={formatoProduzione}
                onChange={(e) => setFormatoProduzione(e.target.value)}
                label="Formato stampa"
              >
                <MenuItem value="foglio">📄 Foglio unico A4 (con checkbox)</MenuItem>
                <MenuItem value="singole">🏷️ Etichette singole per pasta</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Operatore (opzionale)</InputLabel>
              <Select
                value={operatoreSelezionato}
                onChange={(e) => setOperatoreSelezionato(e.target.value)}
                label="Operatore (opzionale)"
              >
                <MenuItem value="">
                  <em>Nessuno (scrivi a mano)</em>
                </MenuItem>
                {OPERATORI.map(op => (
                  <MenuItem key={op} value={op}>{op}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {formatoProduzione === 'foglio' && (
              <TextField
                type="number"
                label="Righe vuote extra"
                value={righeExtra}
                onChange={(e) => setRigheExtra(Math.max(0, parseInt(e.target.value) || 0))}
                inputProps={{ min: 0, max: 10 }}
                fullWidth
                sx={{ mb: 2 }}
                helperText="Per aggiungere paste non in elenco"
              />
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              {formatoProduzione === 'foglio' ? 'Il foglio includerà tutte le paste standard' : 'Seleziona le paste da stampare:'}
            </Typography>

            {formatoProduzione === 'singole' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                {TIPI_PASTA_PRODUZIONE.map(pasta => (
                  <FormControlLabel
                    key={pasta}
                    control={
                      <Checkbox
                        checked={pasteSelezionate.has(pasta)}
                        onChange={() => {
                          setPasteSelezionate(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(pasta)) {
                              newSet.delete(pasta);
                            } else {
                              newSet.add(pasta);
                            }
                            return newSet;
                          });
                        }}
                      />
                    }
                    label={pasta}
                  />
                ))}
                <Button
                  size="small"
                  onClick={() => setPasteSelezionate(new Set(TIPI_PASTA_PRODUZIONE))}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Seleziona tutte
                </Button>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={() => mostraAnteprima(generaEtichetteProduzione())}
                disabled={formatoProduzione === 'singole' && pasteSelezionate.size === 0}
                fullWidth
              >
                Anteprima
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={() => mostraAnteprima(generaEtichetteProduzione())}
                disabled={formatoProduzione === 'singole' && pasteSelezionate.size === 0}
                fullWidth
              >
                Stampa
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Anteprima foglio */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
              👁️ Anteprima
            </Typography>

            {formatoProduzione === 'foglio' ? (
              <Box sx={{
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                p: 3,
                backgroundColor: '#fafafa'
              }}>
                <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', textTransform: 'uppercase', mb: 0.5 }}>
                  Tracciabilità Produzione
                </Typography>
                <Typography align="center" sx={{ mb: 3 }} color="text.secondary">
                  Data: {format(new Date(dataProduzioneFoglio), 'dd/MM/yyyy')}
                </Typography>

                {TIPI_PASTA_PRODUZIONE.map(pasta => (
                  <Box key={pasta} sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.2,
                    borderBottom: '1px solid #eee',
                    gap: 2
                  }}>
                    <Box sx={{
                      width: 18, height: 18,
                      border: '2px solid #333',
                      borderRadius: 0.5,
                      flexShrink: 0
                    }} />
                    <Typography sx={{ flex: 1, fontWeight: 500 }}>{pasta}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      del ___/___/____
                    </Typography>
                  </Box>
                ))}

                {/* Righe vuote */}
                {Array(righeExtra).fill(null).map((_, i) => (
                  <Box key={`vuota-${i}`} sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.2,
                    borderBottom: '1px solid #eee',
                    gap: 2
                  }}>
                    <Box sx={{
                      width: 18, height: 18,
                      border: '2px solid #333',
                      borderRadius: 0.5,
                      flexShrink: 0
                    }} />
                    <Box sx={{
                      flex: 1,
                      borderBottom: '1px solid #999',
                      height: 20
                    }} />
                    <Typography variant="body2" color="text.secondary">
                      del ___/___/____
                    </Typography>
                  </Box>
                ))}

                <Box sx={{ mt: 3 }}>
                  <Typography>
                    Operatore: {operatoreSelezionato ? <strong>{operatoreSelezionato}</strong> : '________________________________________'}
                  </Typography>
                </Box>
                <Typography variant="caption" align="center" display="block" color="text.secondary" sx={{ mt: 2 }}>
                  Pastificio Nonna Claudia — Via Carmine 20/B - Assemini
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {pasteSelezionate.size === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', width: '100%', py: 4 }}>
                    Seleziona le paste per vedere l'anteprima
                  </Typography>
                ) : (
                  Array.from(pasteSelezionate).map(pasta => (
                    <Box key={pasta} sx={{
                      border: '2px solid #e0e0e0',
                      borderRadius: 2,
                      p: 2,
                      minWidth: 200,
                      backgroundColor: '#fafafa'
                    }}>
                      <Typography fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                        {pasta}
                      </Typography>
                      <Typography variant="body2">
                        Prodotta il: {format(new Date(dataProduzioneFoglio), 'dd/MM/yyyy')}
                      </Typography>
                      <Typography variant="body2">
                        Operatore: {operatoreSelezionato ? <strong>{operatoreSelezionato}</strong> : '___________'}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ═══════════════════════════════════════════════════════════
  // DIALOG ANTEPRIMA STAMPA
  // ═══════════════════════════════════════════════════════════

  const renderDialogAnteprima = () => {
    const formato = FORMATI_STAMPA[formatoStampa];
    
    return (
      <Dialog
        open={dialogAnteprima}
        onClose={() => setDialogAnteprima(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            🖨️ Anteprima Stampa
            <Typography variant="body2" color="text.secondary">
              {etichetteDaStampare.length} etichett{etichetteDaStampare.length === 1 ? 'a' : 'e'} • Formato: {formato?.nome}
            </Typography>
          </Box>
          <IconButton onClick={() => setDialogAnteprima(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ 
            backgroundColor: '#f0f0f0', 
            p: 3, 
            borderRadius: 2,
            maxHeight: 500,
            overflow: 'auto'
          }}>
            {etichetteDaStampare.map((etichetta, idx) => (
              <Box key={idx} sx={{ mb: 1, display: 'inline-block', mr: 0.5 }}>
                {etichetta.tipo === 'ordine' && (
                  <Box sx={{
                    border: '1px solid #ccc',
                    borderRadius: 1,
                    p: 1.5,
                    backgroundColor: 'white',
                    width: Math.min(formato.larghezza * 3, 300),
                    minHeight: formato.altezza * 2.5
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                        {etichetta.cognome}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ore {etichetta.ora}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {etichetta.prodotto}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ ml: 1 }}>
                        {etichetta.quantita}
                      </Typography>
                    </Box>
                    {etichetta.pacco && (
                      <Typography variant="caption" color="text.secondary" align="right" display="block">
                        Pacco {etichetta.pacco}
                      </Typography>
                    )}
                    {etichetta.vassoio && (
                      <Typography variant="caption" color="text.secondary" align="right" display="block">
                        Vassoio {etichetta.vassoio}
                      </Typography>
                    )}
                  </Box>
                )}

                {etichetta.tipo === 'prodotto' && (
                  <Box sx={{
                    border: '1px solid #ccc',
                    borderRadius: 1,
                    p: 2,
                    backgroundColor: 'white',
                    width: Math.min(formato.larghezza * 3.5, 380)
                  }}>
                    <Typography fontWeight="bold" align="center" sx={{ textTransform: 'uppercase', mb: 1 }}>
                      {etichetta.nome}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Ingredienti:</strong> {etichetta.ingredienti}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Allergeni:</strong>{' '}
                      <strong style={{ textTransform: 'uppercase' }}>{etichetta.allergeni.join(', ')}</strong>
                    </Typography>
                    <Typography variant="body2">Peso: {etichetta.peso || '_______ '} Kg</Typography>
                    <Typography variant="body2">Prodotto il: {etichetta.dataProduzione}</Typography>
                    <Typography variant="body2">Da consumare entro: {etichetta.dataScadenza}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" align="center" display="block" color="text.secondary">
                      Pastificio Nonna Claudia — Via Carmine 20/B - Assemini
                    </Typography>
                  </Box>
                )}

                {etichetta.tipo === 'produzione-foglio' && (
                  <Typography variant="body2" color="text.secondary">
                    📄 Foglio tracciabilità - Stampa in anteprima completa
                  </Typography>
                )}

                {etichetta.tipo === 'produzione-singola' && (
                  <Box sx={{
                    border: '1px solid #ccc',
                    borderRadius: 1,
                    p: 1.5,
                    backgroundColor: 'white',
                    width: 200
                  }}>
                    <Typography fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                      {etichetta.nome}
                    </Typography>
                    <Typography variant="body2">Prodotta il: {etichetta.data}</Typography>
                    <Typography variant="body2">Operatore: {etichetta.operatore ? <strong>{etichetta.operatore}</strong> : '___________'}</Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogAnteprima(false)}>
            Annulla
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={stampa}
            size="large"
          >
            🖨️ Stampa ({etichetteDaStampare.length} etichett{etichetteDaStampare.length === 1 ? 'a' : 'e'})
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER PRINCIPALE
  // ═══════════════════════════════════════════════════════════

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1f2937', mb: 0.5 }}>
          🏷️ Gestione Etichette
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Stampa etichette per ordini, prodotti e tracciabilità produzione
        </Typography>
      </Box>

      {/* Selettore formato stampa */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" sx={{ minWidth: 120 }}>
          🖨️ Formato stampa:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 300 }}>
          <Select
            value={formatoStampa}
            onChange={(e) => setFormatoStampa(e.target.value)}
          >
            {Object.entries(FORMATI_STAMPA).map(([key, val]) => (
              <MenuItem key={key} value={key}>{val.nome}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Chip 
          label={`${FORMATI_STAMPA[formatoStampa].larghezza}×${FORMATI_STAMPA[formatoStampa].altezza}mm`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={FORMATI_STAMPA[formatoStampa].tipo === 'foglio' ? 'Foglio A4' : 
                 FORMATI_STAMPA[formatoStampa].tipo === 'termica' ? 'Termica' : 'Rullo'}
          size="small"
          color="info"
          variant="outlined"
        />
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabCorrente}
          onChange={(e, val) => setTabCorrente(val)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { 
              py: 2, 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 600 
            }
          }}
        >
          <Tab 
            icon={<OrdiniIcon />} 
            label="Ordini Cliente" 
            iconPosition="start"
          />
          <Tab 
            icon={<ProdottiIcon />} 
            label="Prodotti (Ingredienti)" 
            iconPosition="start"
          />
          <Tab 
            icon={<ProduzioneIcon />} 
            label="Produzione (HACCP)" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Contenuto Tab */}
      <Box>
        {tabCorrente === 0 && renderTabOrdini()}
        {tabCorrente === 1 && renderTabProdotti()}
        {tabCorrente === 2 && renderTabProduzione()}
      </Box>

      {/* Dialog Anteprima */}
      {renderDialogAnteprima()}
    </Box>
  );
};

export default EtichetteManager;