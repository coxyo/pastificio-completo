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

// ═══════════════════════════════════════════════════════════
// DATABASE INGREDIENTI E ALLERGENI
// ═══════════════════════════════════════════════════════════

const PRODOTTI_INFO = {
  // DOLCI
  'Pardulas': {
    categoria: 'Dolci',
    ingredienti: 'Ricotta, zucchero, uova, aromi vari, farina 00, strutto, lievito',
    allergeni: ['GLUTINE', 'UOVA', 'LATTE'],
    scadenzaGiorni: 7
  },
  'Amaretti': {
    categoria: 'Dolci',
    ingredienti: 'Mandorle, zucchero, uova, aromi vari',
    allergeni: ['FRUTTA A GUSCIO', 'UOVA'],
    scadenzaGiorni: 7
  },
  'Papassinas': {
    categoria: 'Dolci',
    ingredienti: 'Farina, mandorle, uva sultanina, noci, sapa, zucchero, strutto, aromi vari, lievito',
    allergeni: ['GLUTINE', 'FRUTTA A GUSCIO'],
    scadenzaGiorni: 7
  },
  'Ciambelle con marmellata': {
    categoria: 'Dolci',
    ingredienti: 'Farina 00, zucchero, strutto, margarina vegetale, uova, passata di albicocche, aromi vari, lievito',
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
    ingredienti: 'Farina, zucchero, strutto, margarina vegetale, uova, passata di albicocche, aromi vari, lievito',
    allergeni: ['GLUTINE', 'UOVA'],
    scadenzaGiorni: 7
  },
  'Cantucci': {
    categoria: 'Dolci',
    ingredienti: 'Mandorle, farina 00, zucchero, uova, aromi vari',
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
    ingredienti: 'Mandorle, zucchero, aromi vari',
    allergeni: ['FRUTTA A GUSCIO'],
    scadenzaGiorni: 7
  },
  'Zeppole': {
    categoria: 'Dolci',
    ingredienti: 'Farina, latte, uova, ricotta, patate, aromi vari, lievito',
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
    ingredienti: 'Farina, sapa, zucchero, uova, noci, mandorle, uva sultanina, aromi vari, lievito',
    allergeni: ['GLUTINE', 'UOVA', 'FRUTTA A GUSCIO'],
    scadenzaGiorni: 7
  },

  // PANADAS
  'Panada di anguille': {
    categoria: 'Panadas',
    ingredienti: 'Pasta (Farina, semola, strutto, sale), Ripieno (anguille, patate o piselli, olio extra vergine, aromi vari)',
    allergeni: ['GLUTINE', 'PESCE'],
    scadenzaGiorni: 3
  },
  'Panada di Agnello': {
    categoria: 'Panadas',
    ingredienti: 'Pasta (Farina, semola, strutto, sale), Ripieno (agnello, patate o piselli, olio extra vergine, aromi vari)',
    allergeni: ['GLUTINE'],
    scadenzaGiorni: 3
  },
  'Panada di Maiale': {
    categoria: 'Panadas',
    ingredienti: 'Pasta (Farina, semola, strutto, sale), Ripieno (maiale, patate o piselli, olio extra vergine, aromi vari)',
    allergeni: ['GLUTINE'],
    scadenzaGiorni: 3
  },
  'Panada di Vitella': {
    categoria: 'Panadas',
    ingredienti: 'Pasta (Farina, semola, strutto, sale), Ripieno (vitella, patate o piselli, olio extra vergine, aromi vari)',
    allergeni: ['GLUTINE'],
    scadenzaGiorni: 3
  },
  'Panada di verdure': {
    categoria: 'Panadas',
    ingredienti: 'Pasta (Farina, semola, strutto, sale), Ripieno (melanzane, patate, piselli, olio extra vergine, aromi vari)',
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

  const generaEtichetteOrdine = (ordine) => {
    const etichette = [];
    const cognome = ordine.cognomeCliente || ordine.nomeCliente || 'N/D';
    const ora = ordine.oraRitiro || '--:--';

    (ordine.prodotti || []).forEach(prodotto => {
      const nome = prodotto.nome || 'Prodotto';
      const quantita = prodotto.quantita || 0;
      const unita = prodotto.unita || 'Kg';
      const variante = prodotto.variante || '';
      const nomeCompleto = variante ? `${nome} ${variante}` : nome;

      // Determina categoria prodotto
      const isPasta = nome.toLowerCase().includes('ravioli') || 
                      nome.toLowerCase().includes('culurgion');
      const isPanada = nome.toLowerCase().includes('panada') || 
                       nome.toLowerCase().includes('panadin');

      if (isPasta) {
        // RAVIOLI/CULURGIONES: max 1 Kg per pacco
        if (quantita <= 1.3) {
          // Un solo pacco
          etichette.push({
            tipo: 'ordine',
            cognome: cognome.toUpperCase(),
            ora,
            prodotto: nomeCompleto,
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
              cognome: cognome.toUpperCase(),
              ora,
              prodotto: nomeCompleto,
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
          cognome: cognome.toUpperCase(),
          ora,
          prodotto: nomeCompleto,
          quantita: qDisplay,
          ordineId: ordine._id
        });
      } else {
        // DOLCI e altri: 1 etichetta per voce
        const vassoi = prodotto.numeroVassoi || 1;
        const dimVassoio = prodotto.dimensioneVassoio || '';
        for (let v = 0; v < vassoi; v++) {
          etichette.push({
            tipo: 'ordine',
            cognome: cognome.toUpperCase(),
            ora,
            prodotto: nomeCompleto,
            quantita: `${quantita} ${unita}`,
            vassoio: vassoi > 1 ? `${v + 1}/${vassoi}` : null,
            dimensione: dimVassoio,
            ordineId: ordine._id
          });
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
        pasteSelezionate: Array.from(pasteSelezionate)
      }];
    } else {
      // Etichette singole per tipo
      return Array.from(pasteSelezionate).map(pasta => ({
        tipo: 'produzione-singola',
        nome: pasta,
        data: format(new Date(dataProduzioneFoglio), 'dd/MM/yyyy')
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
    const { larghezza, altezza, tipo } = formato;

    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body { 
        font-family: Arial, Helvetica, sans-serif; 
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      @page {
        ${tipo === 'foglio' ? 'size: A4; margin: 0;' : `size: ${larghezza}mm ${altezza}mm; margin: 0;`}
      }

      /* ===== ETICHETTE ORDINE ===== */
      .etichetta-ordine {
        width: ${larghezza}mm;
        height: ${altezza}mm;
        padding: 2mm;
        display: inline-flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
        border: 0.3px solid #ccc;
        page-break-inside: avoid;
        vertical-align: top;
      }
      .etichetta-ordine .riga-top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 1mm;
      }
      .etichetta-ordine .cognome {
        font-size: ${larghezza < 60 ? '9' : '12'}pt;
        font-weight: bold;
        text-transform: uppercase;
      }
      .etichetta-ordine .ora {
        font-size: ${larghezza < 60 ? '8' : '10'}pt;
        color: #333;
      }
      .etichetta-ordine .riga-bottom {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .etichetta-ordine .prodotto {
        font-size: ${larghezza < 60 ? '7' : '9'}pt;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .etichetta-ordine .quantita {
        font-size: ${larghezza < 60 ? '8' : '10'}pt;
        font-weight: bold;
        margin-left: 2mm;
        white-space: nowrap;
      }
      .etichetta-ordine .pacco-info {
        font-size: 7pt;
        color: #666;
        text-align: right;
      }

      /* ===== ETICHETTE PRODOTTO ===== */
      .etichetta-prodotto {
        width: ${larghezza}mm;
        height: ${tipo === 'foglio' ? altezza + 'mm' : 'auto'};
        min-height: ${altezza}mm;
        padding: 2.5mm;
        display: inline-flex;
        flex-direction: column;
        overflow: hidden;
        border: 0.3px solid #ccc;
        page-break-inside: avoid;
        vertical-align: top;
      }
      .etichetta-prodotto .nome-prodotto {
        font-size: ${larghezza < 60 ? '9' : larghezza > 100 ? '14' : '11'}pt;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 1.5mm;
        text-align: center;
      }
      .etichetta-prodotto .ingredienti {
        font-size: ${larghezza < 60 ? '5.5' : larghezza > 100 ? '8' : '6.5'}pt;
        line-height: 1.3;
        margin-bottom: 1mm;
      }
      .etichetta-prodotto .ingredienti-label {
        font-weight: bold;
      }
      .etichetta-prodotto .allergeni {
        font-size: ${larghezza < 60 ? '5.5' : larghezza > 100 ? '8' : '6.5'}pt;
        margin-bottom: 1.5mm;
      }
      .etichetta-prodotto .allergeni-label {
        font-weight: bold;
      }
      .etichetta-prodotto .allergene {
        font-weight: bold;
        text-transform: uppercase;
      }
      .etichetta-prodotto .campo-compilabile {
        font-size: ${larghezza < 60 ? '6' : '7.5'}pt;
        margin-bottom: 0.5mm;
        display: flex;
        align-items: baseline;
      }
      .etichetta-prodotto .linea-campo {
        flex: 1;
        border-bottom: 0.5pt solid #000;
        margin-left: 1mm;
        min-width: 15mm;
      }
      .etichetta-prodotto .data-precompilata {
        font-weight: normal;
        margin-left: 1mm;
      }
      .etichetta-prodotto .footer-azienda {
        font-size: ${larghezza < 60 ? '5' : '6.5'}pt;
        text-align: center;
        margin-top: auto;
        padding-top: 1mm;
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
        padding: 2mm;
        display: inline-flex;
        flex-direction: column;
        justify-content: center;
        border: 0.3px solid #ccc;
        page-break-inside: avoid;
        vertical-align: top;
      }
      .etichetta-produzione-singola .nome {
        font-size: ${larghezza < 60 ? '9' : '12'}pt;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 1mm;
      }
      .etichetta-produzione-singola .info {
        font-size: ${larghezza < 60 ? '7' : '9'}pt;
      }

      /* ===== GRIGLIA FOGLIO A4 ===== */
      .griglia-etichette {
        width: 210mm;
        margin: 0;
        padding: 0;
        font-size: 0;
        line-height: 0;
      }

      /* ===== PRINT SPECIFICO ===== */
      @media print {
        body { margin: 0; padding: 0; }
        .no-print { display: none !important; }
        .griglia-etichette { page-break-inside: auto; }
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
          padding: 0;
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
      return etichette.map(e => renderEtichettaHTML(e)).join('\n');
    }

    // Griglia per foglio A4
    let html = '<div class="griglia-etichette">';
    etichette.forEach(e => {
      html += renderEtichettaHTML(e);
    });
    html += '</div>';
    return html;
  };

  const renderEtichettaHTML = (etichetta) => {
    switch (etichetta.tipo) {
      case 'ordine':
        return `
          <div class="etichetta-ordine">
            <div class="riga-top">
              <span class="cognome">${etichetta.cognome}</span>
              <span class="ora">ore ${etichetta.ora}</span>
            </div>
            <div class="riga-bottom">
              <span class="prodotto">${etichetta.prodotto}</span>
              <span class="quantita">${etichetta.quantita}</span>
            </div>
            ${etichetta.pacco ? `<div class="pacco-info">Pacco ${etichetta.pacco}</div>` : ''}
            ${etichetta.vassoio ? `<div class="pacco-info">Vassoio ${etichetta.vassoio}</div>` : ''}
          </div>
        `;

      case 'prodotto':
        return `
          <div class="etichetta-prodotto">
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
            </div>
          </div>
        `;

      case 'produzione-singola':
        return `
          <div class="etichetta-produzione-singola">
            <div class="nome">${etichetta.nome}</div>
            <div class="info">Prodotta il: ${etichetta.data}</div>
            <div class="info">Operatore: _______________</div>
          </div>
        `;

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
          Operatore: ________________________________________
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
                    Operatore: ________________________________________
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
                        Operatore: ___________
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
                    <Typography variant="body2">Operatore: ___________</Typography>
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