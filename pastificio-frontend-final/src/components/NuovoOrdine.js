// components/NuovoOrdine.js - ✅ LAYOUT 2 COLONNE PER TABLET
// ✅ FIX 03/02/2026: Layout a 2 colonne - Cliente/Data/Carrello sempre visibili a destra
// ✅ FIX 03/02/2026: Dialog fullScreen per massimo spazio
// ✅ FIX 03/02/2026: Data/Ora in alto nella colonna destra (prima cosa visibile)
// ✅ FIX CRITICO 03/02/2026: Corretto bug Panade - numeroVassoi era stringa vuota, ciclo non eseguiva mai!
// ✅ AGGIORNATO 03/02/2026: Aggiunto prezzoUnitario a tutti i prodotti per visualizzazione corretta
// ✅ AGGIORNATO 19/11/2025: Opzioni extra (più piccoli, più grandi, etc.) vanno automaticamente in noteProdotto
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Autocomplete,
  FormControlLabel,
  Switch,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  CircularProgress,
  Chip,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  LinearProgress,
  Checkbox  // ✅ AGGIUNTO per opzioni extra
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Luggage as LuggageIcon,
  ExpandMore as ExpandMoreIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Cake as CakeIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  CalendarToday as CalendarIcon,
  Replay as ReplayIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { calcolaPrezzoOrdine, formattaPrezzo } from '../utils/calcoliPrezzi';
import { PRODOTTI_CONFIG } from '../config/prodottiConfig';
import VassoidDolciMisti from './VassoidDolciMisti_FINALE';
import VariantiProdotto, { 
  generaNomeProdottoConVarianti,
  prodottoHaVarianti,
  CONFIGURAZIONE_VARIANTI  // ✅ NUOVO: Per opzioni extra
} from './VariantiProdotto';
import BarraDisponibilita from './BarraDisponibilita';
import SelectOrarioIntelligente from './SelectOrarioIntelligente';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

// ✅ CACHE GLOBALE - NON MODIFICARE
let clientiCache = null;
let clientiCacheTime = null;
let prodottiCache = null;
let prodottiCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

// ✅ VALORI PREIMPOSTATI PER GRIGLIA RAPIDA
const VALORI_RAPIDI = {
  Kg: [0.25, 0.5, 0.6, 0.7, 0.8, 1, 1.2, 1.3, 1.5, 1.7, 2, 2.5, 3],
  Pezzi: [4, 6, 8, 10, 12, 16, 20, 24, 30, 50],
  pz: [4, 6, 8, 10, 12, 16, 20, 24, 30, 50],
  g: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
  '€': [5, 10, 15, 20, 25, 30],
  euro: [5, 10, 15, 20, 25, 30]
};

// ✅ NUOVO: Dimensioni vassoi disponibili
const DIMENSIONI_VASSOIO = ['2', '3', '4', '4.5', '5', '6', '7', '8'];


// ✅ HELPER: Normalizza input decimali (accetta sia virgola che punto)
const normalizzaDecimale = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return '';
  // Sostituisci virgola con punto
  const normalized = String(value).replace(',', '.');
  return normalized;
};

// ✅ HELPER: Capitalizza prima lettera
const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// ✅ NUOVO 29/01/2026: Identifica se prodotto è critico (ravioli/zeppole)
const identificaProdottoCritico = (nomeProdotto) => {
  if (!nomeProdotto) return null;
  const nomeLower = nomeProdotto.toLowerCase();
  
  // Ravioli
  if (nomeLower.includes('ravioli') || nomeLower.includes('raviolo')) {
    return 'ravioli';
  }
  
  // Zeppole
  if (nomeLower.includes('zeppole') || nomeLower.includes('zeppola')) {
    return 'zeppole';
  }
  
  return null;
};

export default function NuovoOrdine({ 
  open, 
  onClose, 
  onSave, 
  ordineIniziale = null,
clienteIdPreselezionato,
  clientePrecompilato = null, // ✅ FIX 17/01/2026
  numeroPrecompilato = null, // ✅ FIX 17/01/2026
  isConnected = true
}) {
  const [clienti, setClienti] = useState([]);
  const [loadingClienti, setLoadingClienti] = useState(false);
  
  const [prodottiDB, setProdottiDB] = useState([]);
  const [loadingProdotti, setLoadingProdotti] = useState(false);

  const [tabValue, setTabValue] = useState(0);

  const [limiti, setLimiti] = useState([]);
  const [loadingLimiti, setLoadingLimiti] = useState(false);
  const [alertLimiti, setAlertLimiti] = useState([]);
  const [conteggioOrari, setConteggioOrari] = useState(null);
  const [loadingConteggioOrari, setLoadingConteggioOrari] = useState(false);

  const [formData, setFormData] = useState({
    cliente: null,
    nome: '',           // ✅ Campo nome separato
    cognome: '',        // ✅ Campo cognome separato
    nomeCliente: '',    // Per backward compatibility
    telefono: '',
    dataRitiro: new Date().toISOString().split('T')[0],
    oraRitiro: '',
    prodotti: [],
    note: '',
    daViaggio: false,
    ricordaEtichetta: false,  // ✅ NUOVO: Etichetta ingredienti
    confezioneRegalo: false,  // ✅ NUOVO: Confezione regalo
    pagato: false,            // ✅ NUOVO 24/02/2026: Pagamento
    acconto: false,           // ✅ NUOVO 24/02/2026: Acconto
    importoAcconto: ''        // ✅ NUOVO 24/02/2026: Importo acconto
  });

  const [prodottoCorrente, setProdottoCorrente] = useState({
  nome: '',
  variante: '',
  quantita: '',
  unita: 'Kg',
  prezzo: 0,
  varianti: [], // ✅ Array varianti per nuovo sistema checkbox
  opzioniExtra: [], // ✅ NUOVO: Array opzioni extra (più piccoli, più grandi, etc.)
  noteProdotto: ''
});

  // ✅ STATI PER GESTIONE VASSOIO
  const [modalitaVassoio, setModalitaVassoio] = useState(null);
  const [composizioneVassoio, setComposizioneVassoio] = useState([]);
  const [totaleVassoio, setTotaleVassoio] = useState(0);

 // ✅ States per panade e panadine
  const [opzioniPanada, setOpzioniPanada] = useState({
    aglio: 'con_aglio',
    pepe: 'con_pepe',
    pomodorisecchi: 'con_pomodori_secchi',
    contorno: 'con_patate'
  });
  const [numeroVassoi, setNumeroVassoi] = useState(''); // ✅ VUOTO DI DEFAULT
  const [gustiPanadine, setGustiPanadine] = useState([]);
  const [modalitaPanadine, setModalitaPanadine] = useState('miste'); // ✅ Default a MISTE
  const [panadineRapide, setPanadineRapide] = useState({ carne: 0, verdura: 0 });

// ✅ NUOVO 29/01/2026: Traccia prodotto critico selezionato per mostrare capacità
const [prodottoCriticoSelezionato, setProdottoCriticoSelezionato] = useState(null);

  // ✅ NUOVO: States per vassoi multipli e dimensione vassoio
  const [numeroVassoiProdotto, setNumeroVassoiProdotto] = useState(''); // ✅ VUOTO DI DEFAULT
  const [dimensioneVassoio, setDimensioneVassoio] = useState('');

  // ✅ FIX 19/02/2026: Dialog conferma data ritiro = oggi
  const [showConfermaDataOggi, setShowConfermaDataOggi] = useState(false);

  // ✅ NUOVO 27/02/2026: Ripeti ultimo ordine
  const [ultimoOrdine, setUltimoOrdine] = useState(null);
  const [altriOrdini, setAltriOrdini] = useState([]);
  const [loadingUltimoOrdine, setLoadingUltimoOrdine] = useState(false);
  const [mostraAltriOrdini, setMostraAltriOrdini] = useState(false);
  const [ordineRipetuto, setOrdineRipetuto] = useState(false); // Per nascondere box dopo click

  // ✅ FIX 17/01/2026: Sposto caricaProdotti PRIMA degli useEffect per evitare hoisting error
  const caricaProdotti = async () => {
    const cacheTime = localStorage.getItem('prodotti_cache_time');
    const now = Date.now();
    
    if (cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
      const cached = localStorage.getItem('prodotti_cache');
      if (cached) {
        try {
          const prodottiData = JSON.parse(cached);
          console.log('⚡ LOAD ISTANTANEO prodotti dalla cache:', prodottiData.length);
          setProdottiDB(prodottiData);
          prodottiCache = prodottiData;
          prodottiCacheTime = now;
          return;
        } catch (e) {
          console.error('Cache prodotti corrotta, ricarico...');
        }
      }
    }

    try {
      setLoadingProdotti(true);
      console.log('🔄 Caricamento prodotti da API...');
      
      const response = await fetch(`${API_URL}/prodotti/disponibili`);

      if (response.ok) {
        const data = await response.json();
        const prodottiData = data.data || data || [];
        
        prodottiCache = prodottiData;
        prodottiCacheTime = Date.now();
        localStorage.setItem('prodotti_cache', JSON.stringify(prodottiData));
        localStorage.setItem('prodotti_cache_time', Date.now().toString());
        
        setProdottiDB(prodottiData);
        console.log(`✅ ${prodottiData.length} prodotti caricati e cachati`);
      } else {
        console.error('Errore caricamento prodotti:', response.status);
      }
    } catch (error) {
      console.error('Errore caricamento prodotti:', error);
      if (prodottiCache) {
        setProdottiDB(prodottiCache);
        console.log('⚠️ Usando cache prodotti (scaduta)');
      }
    } finally {
      setLoadingProdotti(false);
    }
  };

  // ✅ CARICA PRODOTTI CON CACHE OTTIMIZZATA
  useEffect(() => {
    if (isConnected) {
      caricaProdotti();
    }
  }, [isConnected]);

  // ✅ NUOVO 27/02/2026: Carica ultimo ordine per un cliente
  const caricaUltimoOrdine = async (clienteId) => {
    if (!clienteId) {
      setUltimoOrdine(null);
      setAltriOrdini([]);
      setMostraAltriOrdini(false);
      setOrdineRipetuto(false);
      return;
    }

    try {
      setLoadingUltimoOrdine(true);
      setOrdineRipetuto(false);
      console.log('🔍 Caricamento ultimo ordine per cliente:', clienteId);

      const token = localStorage.getItem('token') || 'dev-token-123';
      const response = await fetch(`${API_URL}/ordini/ultimo/${clienteId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.found && result.data) {
          setUltimoOrdine(result.data);
          console.log('✅ Ultimo ordine trovato:', result.data.prodotti?.length, 'prodotti');
        } else {
          setUltimoOrdine(null);
          console.log('ℹ️ Nessun ordine precedente per questo cliente');
        }
      } else {
        setUltimoOrdine(null);
      }
    } catch (error) {
      console.error('❌ Errore caricamento ultimo ordine:', error);
      setUltimoOrdine(null);
    } finally {
      setLoadingUltimoOrdine(false);
    }
  };

  // ✅ NUOVO 27/02/2026: Carica altri ordini (per "Vedi altri")
  const caricaAltriOrdini = async (clienteId) => {
    if (!clienteId) return;
    try {
      const token = localStorage.getItem('token') || 'dev-token-123';
      const response = await fetch(`${API_URL}/ordini/ultimo/${clienteId}?limit=5`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.found && Array.isArray(result.data)) {
          setAltriOrdini(result.data);
          setMostraAltriOrdini(true);
        }
      }
    } catch (error) {
      console.error('❌ Errore caricamento altri ordini:', error);
    }
  };

  // ✅ NUOVO 27/02/2026: Ripeti ordine - copia prodotti nel carrello con prezzi attuali
  const ripetiOrdine = (ordine) => {
    if (!ordine || !ordine.prodotti || ordine.prodotti.length === 0) return;

    const prodottiCopiati = [];
    const prodottiNonDisponibili = [];

    ordine.prodotti.forEach(p => {
      // Cerca il prodotto nel DB per verificare disponibilità e prezzi attuali
      const nomeProdottoBase = p.nome?.split(' (')[0]?.trim() || p.nome;
      
      // Cerca per nome base o nome completo
      const prodottoDB = prodottiDB.find(db => 
        db.nome === p.nome || 
        db.nome === nomeProdottoBase ||
        p.nome?.toLowerCase().includes(db.nome?.toLowerCase())
      );

      // Per vassoi, copia direttamente
      if (p.unita === 'vassoio' || p.nome === 'Vassoio Dolci Misti' || p.dettagliCalcolo?.composizione) {
        prodottiCopiati.push({
          ...p,
          // Mantieni prezzo vassoio originale (composizione unica)
        });
        return;
      }

      // Ricalcola prezzo con prezzi attuali
      let prezzoRicalcolato = p.prezzo || 0;
      let prezzoUnitario = p.prezzoUnitario || 0;
      
      if (prodottoDB) {
        const quantita = parseFloat(p.quantita) || 0;
        const unita = p.unita || 'Kg';
        
        if (unita === 'Kg' || unita === 'g') {
          const qKg = unita === 'g' ? quantita / 1000 : quantita;
          if (prodottoDB.prezzoKg) {
            prezzoRicalcolato = qKg * prodottoDB.prezzoKg;
            prezzoUnitario = prodottoDB.prezzoKg;
          }
        } else if (unita === 'Pezzi' || unita === 'pz') {
          if (prodottoDB.prezzoPezzo) {
            prezzoRicalcolato = quantita * prodottoDB.prezzoPezzo;
            prezzoUnitario = prodottoDB.prezzoPezzo;
          } else if (prodottoDB.prezzoKg && prodottoDB.pezziPerKg) {
            const kg = quantita / prodottoDB.pezziPerKg;
            prezzoRicalcolato = kg * prodottoDB.prezzoKg;
            prezzoUnitario = prodottoDB.prezzoKg / prodottoDB.pezziPerKg;
          }
        } else if (unita === '€' || unita === 'euro') {
          prezzoRicalcolato = quantita;
        }
      } else if (!p.dettagliCalcolo?.composizione) {
        // Prodotto non trovato nel DB (potrebbe non essere più disponibile)
        prodottiNonDisponibili.push(p.nome);
      }

      prodottiCopiati.push({
        nome: p.nome,
        quantita: p.quantita,
        unita: p.unita || p.unitaMisura || 'Kg',
        unitaMisura: p.unita || p.unitaMisura || 'Kg',
        prezzo: Math.round(prezzoRicalcolato * 100) / 100,
        prezzoUnitario: Math.round(prezzoUnitario * 100) / 100,
        categoria: p.categoria || 'Altro',
        variante: p.variante || '',
        varianti: p.varianti || [],
        noteProdotto: p.noteProdotto || '',
        note: p.note || '',
        dettagliCalcolo: p.dettagliCalcolo || {}
      });
    });

    // Imposta prodotti nel carrello
    setFormData(prev => ({
      ...prev,
      prodotti: prodottiCopiati
    }));

    setOrdineRipetuto(true);
    setMostraAltriOrdini(false);

    // Avvisa se ci sono prodotti non disponibili
    if (prodottiNonDisponibili.length > 0) {
      setTimeout(() => {
        alert(`⚠️ Attenzione: i seguenti prodotti potrebbero non essere più disponibili:\n\n${prodottiNonDisponibili.join('\n')}\n\nI prezzi sono stati mantenuti dall'ordine originale.`);
      }, 300);
    }

    console.log(`✅ Ordine ripetuto: ${prodottiCopiati.length} prodotti copiati nel carrello`);
  };

  // ✅ FIX 17/01/2026: Precompila dati da chiamata telefonica
  useEffect(() => {
    if (open && (clientePrecompilato || numeroPrecompilato)) {
      console.log('[NuovoOrdine] 📞 Precompilazione dati da chiamata:', {
        cliente: clientePrecompilato?.nome,
        numero: numeroPrecompilato
      });

      setFormData(prev => ({
        ...prev,
        cliente: clientePrecompilato || null,
        nome: clientePrecompilato?.nome || '',
        cognome: clientePrecompilato?.cognome || '',
        nomeCliente: clientePrecompilato?.nome 
          ? `${clientePrecompilato.nome} ${clientePrecompilato.cognome || ''}`.trim()
          : '',
        telefono: numeroPrecompilato || clientePrecompilato?.telefono || prev.telefono
      }));

      console.log('[NuovoOrdine] ✅ Dati precompilati');
    }
  }, [open, clientePrecompilato, numeroPrecompilato]);

  // ✅ Carica limiti quando cambia data
  useEffect(() => {
    if (formData.dataRitiro && isConnected) {
      caricaLimiti(formData.dataRitiro);
    }
  }, [formData.dataRitiro, isConnected]);

  const caricaLimiti = async (data) => {
    try {
      setLoadingLimiti(true);
      console.log('🔄 Caricamento limiti per data:', data);
      
      const response = await fetch(`${API_URL}/limiti?data=${data}`);
      
      if (response.ok) {
        const result = await response.json();
        const limitiData = result.data || [];
        setLimiti(limitiData);
        console.log(`✅ ${limitiData.length} limiti caricati per ${data}`);
      } else {
        console.error('Errore caricamento limiti:', response.status);
        setLimiti([]);
      }
    } catch (error) {
      console.error('Errore caricamento limiti:', error);
      setLimiti([]);
    } finally {
      setLoadingLimiti(false);
    }
  };

  // ✅ NUOVO 28/01/2026: Carica conteggio ordini per data selezionata
  const caricaConteggioOrari = async (data) => {
    try {
      setLoadingConteggioOrari(true);
      console.log('🔄 Caricamento conteggio orari per data:', data);
      
      const response = await fetch(`${API_URL}/ordini/conteggio-orari?dataRitiro=${data}`);
      
      if (response.ok) {
        const result = await response.json();
        setConteggioOrari(result);
        console.log(`✅ Conteggio orari caricato: ${result.totaleOrdini} ordini`);
      } else {
        console.error('Errore caricamento conteggio orari:', response.status);
        setConteggioOrari(null);
      }
    } catch (error) {
      console.error('Errore caricamento conteggio orari:', error);
      setConteggioOrari(null);
    } finally {
      setLoadingConteggioOrari(false);
    }
  };

  // ✅ NUOVO 28/01/2026: Effect per caricare conteggio quando cambia data
  useEffect(() => {
    if (formData.dataRitiro && isConnected) {
      caricaConteggioOrari(formData.dataRitiro);
    }
  }, [formData.dataRitiro, isConnected]);

// ✅ NUOVO 29/01/2026: Aggiorna prodotto critico quando cambia selezione
useEffect(() => {
  const tipoProdotto = identificaProdottoCritico(prodottoCorrente.nome);
  setProdottoCriticoSelezionato(tipoProdotto);
  console.log(`🔍 Prodotto selezionato: ${prodottoCorrente.nome} → tipo: ${tipoProdotto}`);
}, [prodottoCorrente.nome]);

  // ✅ Verifica limiti ogni volta che cambiano prodotti
  useEffect(() => {
    if (formData.prodotti.length > 0 && limiti.length > 0) {
      verificaLimiti();
    } else {
      setAlertLimiti([]);
    }
  }, [formData.prodotti, limiti]);

  const verificaLimiti = () => {
    if (limiti.length === 0) {
      setAlertLimiti([]);
      return;
    }

    const alerts = [];
    const prodottiRaggruppati = {};
    const categorieRaggruppate = {};

    formData.prodotti.forEach(p => {
      if (p.unita === 'vassoio' || p.nome === 'Vassoio Dolci Misti') {
        return;
      }

      const nome = p.nome;
      const categoria = p.categoria || 'Altro';
      const quantita = parseFloat(p.quantita) || 0;
      const unita = p.unita || 'Kg';

      let quantitaKg = quantita;
      if (unita === 'g') {
        quantitaKg = quantita / 1000;
      }

      if (!prodottiRaggruppati[nome]) {
        prodottiRaggruppati[nome] = 0;
      }
      prodottiRaggruppati[nome] += quantitaKg;

      if (!categorieRaggruppate[categoria]) {
        categorieRaggruppate[categoria] = 0;
      }
      categorieRaggruppate[categoria] += quantitaKg;
    });

    limiti.forEach(limite => {
      if (limite.prodotto) {
        const quantitaOrdine = prodottiRaggruppati[limite.prodotto] || 0;
        const quantitaTotale = limite.quantitaOrdinata + quantitaOrdine;
        const quantitaDisponibile = limite.limiteQuantita - limite.quantitaOrdinata;

        if (quantitaTotale > limite.limiteQuantita) {
          alerts.push({
            tipo: 'error',
            prodotto: limite.prodotto,
            messaggio: `LIMITE SUPERATO: ${limite.prodotto}`,
            dettaglio: `Richiesti ${quantitaOrdine.toFixed(1)} ${limite.unitaMisura}, disponibili ${quantitaDisponibile.toFixed(1)} ${limite.unitaMisura}`,
            percentuale: (quantitaTotale / limite.limiteQuantita) * 100
          });
        } else if (quantitaTotale >= limite.limiteQuantita * (limite.sogliAllerta / 100)) {
          alerts.push({
            tipo: 'warning',
            prodotto: limite.prodotto,
            messaggio: `ATTENZIONE: ${limite.prodotto}`,
            dettaglio: `Richiesti ${quantitaOrdine.toFixed(1)} ${limite.unitaMisura}, disponibili ${quantitaDisponibile.toFixed(1)} ${limite.unitaMisura}`,
            percentuale: (quantitaTotale / limite.limiteQuantita) * 100
          });
        }
      }

      if (limite.categoria) {
        const quantitaOrdine = categorieRaggruppate[limite.categoria] || 0;
        const quantitaTotale = limite.quantitaOrdinata + quantitaOrdine;
        const quantitaDisponibile = limite.limiteQuantita - limite.quantitaOrdinata;

        if (quantitaTotale > limite.limiteQuantita) {
          alerts.push({
            tipo: 'error',
            categoria: limite.categoria,
            messaggio: `LIMITE SUPERATO: Categoria ${limite.categoria}`,
            dettaglio: `Richiesti ${quantitaOrdine.toFixed(1)} ${limite.unitaMisura}, disponibili ${quantitaDisponibile.toFixed(1)} ${limite.unitaMisura}`,
            percentuale: (quantitaTotale / limite.limiteQuantita) * 100
          });
        } else if (quantitaTotale >= limite.limiteQuantita * (limite.sogliAllerta / 100)) {
          alerts.push({
            tipo: 'warning',
            categoria: limite.categoria,
            messaggio: `ATTENZIONE: Categoria ${limite.categoria}`,
            dettaglio: `Richiesti ${quantitaOrdine.toFixed(1)} ${limite.unitaMisura}, disponibili ${quantitaDisponibile.toFixed(1)} ${limite.unitaMisura}`,
            percentuale: (quantitaTotale / limite.limiteQuantita) * 100
          });
        }
      }
    });

    setAlertLimiti(alerts);
  };

  // ✅ RAGGRUPPA PRODOTTI PER CATEGORIA
  const prodottiPerCategoria = useMemo(() => {
    const categorie = {
      Ravioli: [],
      Dolci: [],
      Panadas: [],
      Pasta: []
    };

    // ✅ ORDINE PRIORITÀ PRODOTTI (più venduti per primi)
    const ORDINE_PRIORITA = ['Pardulas', 'Ciambelle', 'Amaretti'];

    prodottiDB.forEach(prodotto => {
      const categoria = prodotto.categoria || 'Altro';
      
      if (categoria === 'Pardulas') {
        categorie.Dolci.push(prodotto);
      } else if (categorie[categoria]) {
        categorie[categoria].push(prodotto);
      }
    });

    // ✅ ORDINA I PRODOTTI ALL'INTERNO DI OGNI CATEGORIA
    Object.keys(categorie).forEach(catKey => {
      categorie[catKey].sort((a, b) => {
        const indexA = ORDINE_PRIORITA.indexOf(a.nome);
        const indexB = ORDINE_PRIORITA.indexOf(b.nome);
        
        // Se entrambi sono nella lista priorità, ordina per indice
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        // Se solo A è nella lista, A viene prima
        if (indexA !== -1) return -1;
        // Se solo B è nella lista, B viene prima
        if (indexB !== -1) return 1;
        // Altrimenti ordina alfabeticamente
        return a.nome.localeCompare(b.nome);
      });
    });

    return categorie;
  }, [prodottiDB]);

  // ✅ PRODOTTI ORDINATI PER VASSOIO DOLCI MISTI (Pardulas, Ciambelle, Amaretti primi)
  const prodottiOrdinatiVassoio = useMemo(() => {
    const ORDINE_PRIORITA = ['Pardulas', 'Ciambelle', 'Amaretti'];
    
    return [...prodottiDB].sort((a, b) => {
      const indexA = ORDINE_PRIORITA.indexOf(a.nome);
      const indexB = ORDINE_PRIORITA.indexOf(b.nome);
      
      // Se entrambi sono nella lista priorità, ordina per indice
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // Se solo A è nella lista, A viene prima
      if (indexA !== -1) return -1;
      // Se solo B è nella lista, B viene prima
      if (indexB !== -1) return 1;
      // Altrimenti ordina alfabeticamente
      return a.nome.localeCompare(b.nome);
    });
  }, [prodottiDB]);

  useEffect(() => {
    if (ordineIniziale) {
      // ✅ FIX 15/01/2026 v3: Estrai nome/cognome da nomeCliente
      const nomeClienteCompleto = ordineIniziale.nomeCliente || '';
      const partiNome = nomeClienteCompleto.split(' ');
      const nome = partiNome[0] || '';
      const cognome = partiNome.slice(1).join(' ') || '';
      
      setFormData({
        cliente: ordineIniziale.cliente || null,
        nomeCliente: ordineIniziale.nomeCliente || '',
        nome: nome,  // ✅ Popola nome separato
        cognome: cognome,  // ✅ Popola cognome separato
        telefono: ordineIniziale.telefono || '',
        dataRitiro: ordineIniziale.dataRitiro?.split('T')[0] || new Date().toISOString().split('T')[0],
        oraRitiro: ordineIniziale.oraRitiro || '',
        prodotti: ordineIniziale.prodotti || [],
        note: ordineIniziale.note || '',
        daViaggio: ordineIniziale.daViaggio || false,
        ricordaEtichetta: ordineIniziale.ricordaEtichetta || false,  // ✅ NUOVO
        confezioneRegalo: ordineIniziale.confezioneRegalo || false,  // ✅ NUOVO
        pagato: ordineIniziale.pagato || false,
        acconto: ordineIniziale.acconto || false,
        importoAcconto: ordineIniziale.importoAcconto || ''
      });
    } else {
      setFormData({
        cliente: null,
        nome: '',
        cognome: '',
        nomeCliente: '',
        telefono: '',
        dataRitiro: new Date().toISOString().split('T')[0],
        oraRitiro: '',
        prodotti: [],
        note: '',
        daViaggio: false,
        ricordaEtichetta: false,  // ✅ NUOVO
        confezioneRegalo: false,  // ✅ NUOVO
        pagato: false,
        acconto: false,
        importoAcconto: ''
      });
    }
  }, [ordineIniziale, open]);

  // ✅ CARICA CLIENTI CON CACHE OTTIMIZZATA
  useEffect(() => {
    if (isConnected) {
      caricaClienti();
    }
  }, [isConnected]);

  const caricaClienti = async () => {
    const cacheTime = localStorage.getItem('clienti_cache_time');
    const now = Date.now();
    
    if (cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
      const cached = localStorage.getItem('clienti_cache');
      if (cached) {
        try {
          const clientiData = JSON.parse(cached);
          console.log('⚡ LOAD ISTANTANEO clienti dalla cache:', clientiData.length);
          setClienti(clientiData);
          clientiCache = clientiData;
          clientiCacheTime = now;
          return;
        } catch (e) {
          console.error('Cache clienti corrotta, ricarico...');
        }
      }
    }

    try {
      setLoadingClienti(true);
      console.log('🔄 Caricamento clienti da API...');
      
      const token = localStorage.getItem('token') || 'dev-token-123';

      const response = await fetch(`${API_URL}/clienti?attivo=true`, {
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        const clientiData = data.data || data.clienti || data || [];
        
        clientiCache = clientiData;
        clientiCacheTime = Date.now();
        localStorage.setItem('clienti_cache', JSON.stringify(clientiData));
        localStorage.setItem('clienti_cache_time', Date.now().toString());
        
        setClienti(clientiData);
        console.log(`✅ ${clientiData.length} clienti caricati e cachati`);
      }
    } catch (error) {
      console.error('Errore caricamento clienti:', error);
      if (clientiCache) {
        setClienti(clientiCache);
        console.log('⚠️ Usando cache clienti (scaduta)');
      }
    } finally {
      setLoadingClienti(false);
    }

  };

  // ✅ FIX 27/02/2026: Pre-selezione cliente da CallPopup (SOLO per navigazione cross-page)
  // Il flusso principale ora usa le props React (clientePrecompilato, etc.)
  useEffect(() => {
    if (typeof window === 'undefined' || !open) return;
    
    // ✅ Se abbiamo già dati via props, NON leggere localStorage
    if (clientePrecompilato || numeroPrecompilato || clienteIdPreselezionato) {
      console.log('[NuovoOrdine] 📞 Dati già ricevuti via props, skip localStorage');
      localStorage.removeItem('nuovoOrdine_clientePreselezionato');
      return;
    }
    
    // Fallback: controlla localStorage (solo per redirect cross-page)
    const clientePreselezionato = localStorage.getItem('nuovoOrdine_clientePreselezionato');
    
    if (clientePreselezionato) {
      try {
        const cliente = JSON.parse(clientePreselezionato);
        console.log('📞 [NuovoOrdine] Cliente da localStorage (fallback cross-page):', cliente);
        
        setFormData(prev => ({
          ...prev,
          cliente: cliente,
          nome: cliente.nome || '',
          cognome: cliente.cognome || '',
          nomeCliente: `${cliente.nome || ''} ${cliente.cognome || ''}`.trim(),
          telefono: cliente.telefono || ''
        }));
        
      } catch (error) {
        console.error('Errore parsing cliente pre-selezionato:', error);
      } finally {
        // ✅ Sempre pulisci (uso una-tantum)
        localStorage.removeItem('nuovoOrdine_clientePreselezionato');
      }
    }
  }, [open, clientePrecompilato, numeroPrecompilato, clienteIdPreselezionato]);

  // ═══════════════════════════════════════════════════════════════
  // NOTA 27/02/2026: useEffect 'chiamataCliente' RIMOSSO
  // Il passaggio dati da chiamata avviene via props React:
  // CallPopup → onNuovoOrdine → GestoreOrdini → NuovoOrdine props
  // ═══════════════════════════════════════════════════════════════

  // ✅ Preseleziona cliente da chiamata
  useEffect(() => {
    if (clienteIdPreselezionato && clienti.length > 0) {
      const clienteTrovato = clienti.find(c => c._id === clienteIdPreselezionato);
      
      if (clienteTrovato) {
        setFormData(prev => ({
          ...prev,
          cliente: clienteTrovato,
          nome: clienteTrovato.nome || '',
          cognome: clienteTrovato.cognome || '',
          nomeCliente: `${clienteTrovato.nome} ${clienteTrovato.cognome || ''}`.trim(),
          telefono: clienteTrovato.telefono || ''
        }));
        console.log('✅ Cliente preselezionato da chiamata:', clienteTrovato.nome, clienteTrovato.cognome);
      } else {
        console.warn('⚠️ Cliente non trovato con ID:', clienteIdPreselezionato);
      }
    }
  }, [clienteIdPreselezionato, clienti]);

  const handleClienteChange = (event, cliente) => {
    if (cliente) {
      setFormData({
        ...formData,
        cliente: cliente,
        nome: cliente.nome || '',
        cognome: cliente.cognome || '',
        nomeCliente: `${cliente.nome} ${cliente.cognome || ''}`.trim(),
        telefono: cliente.telefono || ''
      });
      // ✅ NUOVO 27/02/2026: Carica ultimo ordine
      if (cliente._id) {
        caricaUltimoOrdine(cliente._id);
      }
    } else {
      setFormData({
        ...formData,
        cliente: null,
        nome: '',
        cognome: '',
        nomeCliente: '',
        telefono: ''
      });
      // ✅ Reset ultimo ordine
      setUltimoOrdine(null);
      setAltriOrdini([]);
      setMostraAltriOrdini(false);
      setOrdineRipetuto(false);
    }
  };

  const getProdottoConfigDB = (nomeProdotto) => {
    return prodottiDB.find(p => p.nome === nomeProdotto) || null;
  };

  const prodottoConfig = useMemo(() => {
    if (!prodottoCorrente.nome) return null;
    return getProdottoConfigDB(prodottoCorrente.nome);
  }, [prodottoCorrente.nome, prodottiDB]);

  // ✅ MODIFICATO: hasVarianti solo per dropdown legacy (NON per checkbox)
  const usaNuovoSistemaVarianti = prodottoHaVarianti(prodottoCorrente.nome);
  const hasVarianti = prodottoConfig?.hasVarianti && !usaNuovoSistemaVarianti;
  const varianti = prodottoConfig?.varianti || [];

  const handleProdottoSelect = (prodotto) => {
    console.log('🎯 Prodotto selezionato:', prodotto.nome);
    
    setProdottoCorrente({
      nome: prodotto.nome,
      variante: '',
      quantita: '',
      unita: prodotto.unitaMisuraDisponibili?.[0] || 'Kg',
      prezzo: 0,
      varianti: [],
      opzioniExtra: [], // ✅ NUOVO: Reset opzioni extra
      noteProdotto: ''
    });
    
    // ✅ NUOVO: Reset numero vassoi e dimensione
    setNumeroVassoiProdotto(1);
    setDimensioneVassoio('');
  };

  const handleVarianteChange = (event) => {
    setProdottoCorrente({
      ...prodottoCorrente,
      variante: event.target.value
    });
  };

  // ✅ AGGIORNATO: Handler per nuovo sistema varianti (checkbox) + opzioni extra
  const handleVariantiChange = (nomeCompleto, variantiIds, opzioniExtraValori) => {
    console.log('🎨 Varianti aggiornate (checkbox):', variantiIds);
    console.log('📝 Opzioni extra:', opzioniExtraValori);
    
    setProdottoCorrente({
      ...prodottoCorrente,
      varianti: variantiIds,
      opzioniExtra: opzioniExtraValori || []
    });
  };

  const handleValoreRapido = (valore) => {
    setProdottoCorrente({
      ...prodottoCorrente,
      quantita: valore
    });
  };

  // ✅ CALCOLO PREZZO - AGGIORNATO PER CHECKBOX MULTIPLE
  useEffect(() => {
    if (!prodottoCorrente.nome || !prodottoCorrente.quantita || prodottoCorrente.quantita <= 0) {
      setProdottoCorrente(prev => ({ ...prev, prezzo: 0 }));
      return;
    }

    try {
      const prodotto = getProdottoConfigDB(prodottoCorrente.nome);
      if (!prodotto) return;

      let prezzo = 0;
      
      // ✅ NUOVO SISTEMA: Checkbox multiple (es. Ravioli)
      // Prezzo fisso €11/Kg indipendentemente dalle varianti selezionate
      if (usaNuovoSistemaVarianti) {
        console.log('📦 Usando nuovo sistema checkbox per:', prodottoCorrente.nome);
        
        // Per Ravioli: prezzo base €11/Kg
        const prezzoBase = prodotto.varianti?.[0]?.prezzoKg || prodotto.prezzoKg || 11;
        
        if (prodottoCorrente.unita === 'Kg' || prodottoCorrente.unita === 'g') {
          const quantitaKg = prodottoCorrente.unita === 'g' 
            ? prodottoCorrente.quantita / 1000 
            : prodottoCorrente.quantita;
          prezzo = prezzoBase * quantitaKg;
        } else if (prodottoCorrente.unita === 'Pezzi' || prodottoCorrente.unita === 'Unità') {
          const prezzoPezzo = prodotto.varianti?.[0]?.prezzoPezzo || prodotto.prezzoPezzo || 0.37;
          prezzo = prezzoPezzo * prodottoCorrente.quantita;
        } else if (prodottoCorrente.unita === '€') {
          prezzo = prodottoCorrente.quantita;
        }
        
        console.log(`💰 Prezzo checkbox: ${prodottoCorrente.quantita} ${prodottoCorrente.unita} x €${prezzoBase} = €${prezzo.toFixed(2)}`);
        
      // ✅ SISTEMA LEGACY: Dropdown singolo
      } else if (prodotto.hasVarianti) {
        if (!prodottoCorrente.variante) {
          console.log('⚠️ Variante non selezionata per', prodotto.nome);
          setProdottoCorrente(prev => ({ ...prev, prezzo: 0 }));
          return;
        }
        
        const varianteSelezionata = prodotto.varianti.find(v => v.nome === prodottoCorrente.variante);
        
        if (!varianteSelezionata) {
          console.error('❌ Variante non trovata:', prodottoCorrente.variante);
          setProdottoCorrente(prev => ({ ...prev, prezzo: 0 }));
          return;
        }
        
        console.log('✅ Variante selezionata:', varianteSelezionata.nome, varianteSelezionata);
        
        if (prodottoCorrente.unita === 'Kg' || prodottoCorrente.unita === 'g') {
          const quantitaKg = prodottoCorrente.unita === 'g' 
            ? prodottoCorrente.quantita / 1000 
            : prodottoCorrente.quantita;
          prezzo = varianteSelezionata.prezzoKg * quantitaKg;
        } else if (prodottoCorrente.unita === 'Pezzi' || prodottoCorrente.unita === 'Unità') {
          prezzo = varianteSelezionata.prezzoPezzo * prodottoCorrente.quantita;
        }
        
        console.log(`💰 Calcolo: ${prodottoCorrente.quantita} ${prodottoCorrente.unita} x €${varianteSelezionata.prezzoKg || varianteSelezionata.prezzoPezzo} = €${prezzo.toFixed(2)}`);
        
      } else {
        // ✅ PRODOTTO SENZA VARIANTI (normale)
        if (prodottoCorrente.unita === 'Kg' || prodottoCorrente.unita === 'g') {
          const quantitaKg = prodottoCorrente.unita === 'g' 
            ? prodottoCorrente.quantita / 1000 
            : prodottoCorrente.quantita;
          prezzo = prodotto.prezzoKg * quantitaKg;
        } else if (prodottoCorrente.unita === 'Pezzi' || prodottoCorrente.unita === 'Unità') {
          prezzo = prodotto.prezzoPezzo * prodottoCorrente.quantita;
        } else if (prodottoCorrente.unita === '€') {
          prezzo = prodottoCorrente.quantita;
        }
      }

      setProdottoCorrente(prev => ({
        ...prev,
        prezzo: Math.round(prezzo * 100) / 100
      }));
    } catch (error) {
      console.error('Errore calcolo prezzo:', error);
      setProdottoCorrente(prev => ({ ...prev, prezzo: 0 }));
    }
  }, [prodottoCorrente.nome, prodottoCorrente.variante, prodottoCorrente.varianti, prodottoCorrente.quantita, prodottoCorrente.unita, prodottiDB, usaNuovoSistemaVarianti]);


  const handleAggiungiProdotto = () => {
    console.log('🔵 handleAggiungiProdotto chiamato', { prodottoCorrente, modalitaVassoio });

    // ✅ SE SIAMO IN MODALITÀ VASSOIO
    if (modalitaVassoio === 'imposta_totale') {
      const nuovoItem = {
        nome: prodottoCorrente.nome,
        quantita: 0,
        unita: 'Kg',
        prezzo: 0,
        id: `temp_${Date.now()}_${Math.random()}`
      };
      
      setComposizioneVassoio(prev => [...prev, nuovoItem]);
      console.log('✅ Prodotto aggiunto alla composizione vassoio');
      
    setProdottoCorrente({
      nome: '',
      variante: '',
      quantita: '',
      unita: 'Kg',
      prezzo: 0,
      varianti: [],
      opzioniExtra: [],
      noteProdotto: ''
    });
    setOpzioniPanada({ aglio: 'con_aglio', pepe: 'con_pepe', pomodorisecchi: 'con_pomodori_secchi', contorno: 'con_patate' });
    setNumeroVassoi(1);
    setGustiPanadine([]);
    setModalitaPanadine('miste');
    setPanadineRapide({ carne: 0, verdura: 0 });
    
       return;
    }

    // ✅ SE SIAMO IN MODALITÀ DOLCI MISTI COMPLETO
    if (modalitaVassoio === 'dolci_misti') {
      const nuovoItem = {
        nome: prodottoCorrente.nome,
        quantita: 0,
        unita: 'Kg',
        prezzo: 0,
        pesoMix: 0,
        id: `temp_${Date.now()}_${Math.random()}`
      };
      
      setComposizioneVassoio(prev => [...prev, nuovoItem]);
      console.log('✅ Prodotto aggiunto al mix dolci');
      
      setProdottoCorrente({
        nome: '',
        variante: '',
        quantita: '',
        unita: 'Kg',
        prezzo: 0,
        varianti: [],
        opzioniExtra: [],
        noteProdotto: ''
      });
      return;
    }

    // ✅ GESTIONE SPECIALE PANADINE CON GUSTI
    const configProdotto = PRODOTTI_CONFIG[prodottoCorrente.nome];
    
    if (configProdotto?.gustiPanadine) {
      let totaleQuantita = 0;
      let dettagliGusti = [];
      
      // ✅ NUOVO: Gestione modalità MISTE
      if (modalitaPanadine === 'miste') {
        // Usa il campo quantità principale
        const quantitaInput = parseFloat(normalizzaDecimale(prodottoCorrente.quantita)) || 0;
        totaleQuantita = Math.round(quantitaInput); // Arrotonda a numero intero
        dettagliGusti.push('Miste a scelta del pastificio');
      } else if (modalitaPanadine === 'rapida') {
        totaleQuantita = panadineRapide.carne + panadineRapide.verdura;
        if (panadineRapide.carne > 0) dettagliGusti.push(`Carne: ${panadineRapide.carne}`);
        if (panadineRapide.verdura > 0) dettagliGusti.push(`Verdura: ${panadineRapide.verdura}`);
      } else {
        totaleQuantita = gustiPanadine.reduce((sum, g) => sum + g.quantita, 0);
        gustiPanadine.forEach(g => {
          if (g.quantita > 0) {
            dettagliGusti.push(`${g.ingrediente1}+${g.ingrediente2}: ${g.quantita}`);
          }
        });
      }
      
      if (totaleQuantita <= 0) {
        alert('Inserisci almeno una panadina');
        return;
      }
      
      const prezzoPezzo = configProdotto.prezzoPezzo || 0.80;
      const prezzoTotale = totaleQuantita * prezzoPezzo;
      
      const nuovoProdotto = {
        nome: 'Panadine',
        quantita: totaleQuantita,
        unita: 'Pezzi',
        unitaMisura: 'Pezzi',
        prezzo: Math.round(prezzoTotale * 100) / 100,
        prezzoUnitario: prezzoPezzo, // ✅ FIX 03/02/2026: Prezzo per pezzo
        categoria: 'Panadas',
        note: dettagliGusti.join(', '),
        dettagliCalcolo: {
          gusti: modalitaPanadine === 'miste' ? { miste: totaleQuantita } : 
                 modalitaPanadine === 'rapida' ? panadineRapide : gustiPanadine,
          modalita: modalitaPanadine
        }
      };
      
      console.log('🥟 Panadine aggiunte:', nuovoProdotto);
      
      setFormData({
        ...formData,
        prodotti: [...formData.prodotti, nuovoProdotto]
      });
      
      // Reset
      setProdottoCorrente({
        nome: '',
        variante: '',
        quantita: '',
        unita: 'Kg',
        prezzo: 0,
        varianti: [],
        opzioniExtra: [],
        noteProdotto: ''
      });
      setOpzioniPanada({ aglio: 'con_aglio', pepe: 'con_pepe', pomodorisecchi: 'con_pomodori_secchi', contorno: 'con_patate' });
      setNumeroVassoi(1);
      setGustiPanadine([]);
      setModalitaPanadine('miste'); // ✅ NUOVO: Default a MISTE invece di rapida
      setPanadineRapide({ carne: 0, verdura: 0 });
      return;
    }
    
    // ✅ GESTIONE SPECIALE PANADE CON OPZIONI
    if (configProdotto?.opzioniAggiuntive) {
      if (!prodottoCorrente.quantita || prodottoCorrente.quantita <= 0) {
        alert('Inserisci una quantità');
        return;
      }
      
      const aglioNote = opzioniPanada.aglio === 'senza_aglio' ? 'senza aglio' : '';
      const pepeNote = opzioniPanada.pepe === 'senza_pepe' ? 'senza pepe' : '';
      const pomodoriNote = opzioniPanada.pomodorisecchi === 'senza_pomodori_secchi' ? 'senza pomodori secchi' : '';
      const contornoLabel = opzioniPanada.contorno === 'con_patate' ? 'con patate' : 
                           opzioniPanada.contorno === 'con_piselli' ? 'con piselli' : 'con patate e piselli';
      
      // Costruisci le note "senza" (aglio, pepe, pomodori secchi)
      const noteSenza = [aglioNote, pepeNote, pomodoriNote].filter(Boolean).join(', ');
      
      let nomeCompleto;
      if (noteSenza) {
        nomeCompleto = `${prodottoCorrente.nome} (${noteSenza}, ${contornoLabel})`;
      } else {
        nomeCompleto = `${prodottoCorrente.nome} (${contornoLabel})`;
      }
      
      // ✅ FIX 03/02/2026: Converte numeroVassoi in numero, default 1 se vuoto
      const numVassoi = parseInt(numeroVassoi) || 1;
      console.log('🥘 Creazione Panade - numeroVassoi:', numeroVassoi, '→ numVassoi:', numVassoi);
      
      const nuoviProdotti = [];
      for (let i = 0; i < numVassoi; i++) {
        // ✅ FIX 21/01/2026: Calcola prezzo per Panade
        const calcoloPrezzo = calcolaPrezzoOrdine(
          prodottoCorrente.nome,
          prodottoCorrente.quantita,
          prodottoCorrente.unita,
          prodottoCorrente.prezzo
        );
        
        // ✅ FIX 03/02/2026: Calcola prezzoUnitario per Panade
        const quantitaPanada = parseFloat(normalizzaDecimale(prodottoCorrente.quantita)) || 0;
        const prezzoUnitarioPanada = quantitaPanada > 0 
          ? (calcoloPrezzo.prezzoTotale / quantitaPanada) 
          : 0;
        
        nuoviProdotti.push({
          nome: nomeCompleto,
          quantita: prodottoCorrente.quantita,
          unita: prodottoCorrente.unita,
          unitaMisura: prodottoCorrente.unita,
          prezzo: calcoloPrezzo.prezzoTotale,
          prezzoUnitario: Math.round(prezzoUnitarioPanada * 100) / 100, // ✅ NUOVO
          categoria: 'Panadas',
          note: '',
          dettagliCalcolo: {
            nomeBase: prodottoCorrente.nome,
            opzioni: opzioniPanada,
            numeroVassoi: 1,
            quantitaSingola: prodottoCorrente.quantita,
            prezzoCalcolato: true
          }
        });
      }
      
      console.log('🥘 Panade aggiunte:', nuoviProdotti);
      
      setFormData({
        ...formData,
        prodotti: [...formData.prodotti, ...nuoviProdotti]
      });
      
      // Reset
      setProdottoCorrente({
        nome: '',
        variante: '',
        quantita: '',
        unita: 'Kg',
        prezzo: 0,
        varianti: [],
        opzioniExtra: [],
        noteProdotto: ''
      });
      setOpzioniPanada({ aglio: 'con_aglio', pepe: 'con_pepe', pomodorisecchi: 'con_pomodori_secchi', contorno: 'con_patate' });
      setNumeroVassoi(1);
      setGustiPanadine([]);
      setModalitaPanadine('miste');
      setPanadineRapide({ carne: 0, verdura: 0 });
      return;
    }

    // ✅ MODALITÀ NORMALE
    if (!prodottoCorrente.nome || !prodottoCorrente.quantita || prodottoCorrente.quantita <= 0) {
      alert('Seleziona un prodotto e inserisci una quantità valida');
      return;
    }

    // ✅ SISTEMA LEGACY: Verifica varianti dropdown
    if (hasVarianti && !prodottoCorrente.variante) {
      alert('Seleziona una variante');
      return;
    }

    // ✅ GENERA NOME CON VARIANTI
    let nomeProdottoCompleto = prodottoCorrente.nome;
    
    // Nuovo sistema checkbox
    if (prodottoCorrente.varianti && prodottoCorrente.varianti.length > 0) {
      nomeProdottoCompleto = generaNomeProdottoConVarianti(
        prodottoCorrente.nome,
        prodottoCorrente.varianti
      );
      console.log('✅ Nome con varianti (checkbox):', nomeProdottoCompleto);
    } 
    // Sistema legacy dropdown
    else if (prodottoCorrente.variante) {
      const variante = varianti.find(v => v.nome === prodottoCorrente.variante);
      nomeProdottoCompleto = variante?.label || `${prodottoCorrente.nome} ${prodottoCorrente.variante}`;
      console.log('✅ Nome con variante (dropdown):', nomeProdottoCompleto);
    }

    // ✅ NUOVO: Combina noteProdotto esistenti con opzioni extra
    let noteProdottoCombinate = prodottoCorrente.noteProdotto || '';
    
    if (prodottoCorrente.opzioniExtra && prodottoCorrente.opzioniExtra.length > 0) {
      const opzioniExtraStr = prodottoCorrente.opzioniExtra.join(', ');
      console.log('📝 Opzioni extra da aggiungere alle note:', opzioniExtraStr);
      
      if (noteProdottoCombinate) {
        noteProdottoCombinate = `${noteProdottoCombinate}, ${opzioniExtraStr}`;
      } else {
        noteProdottoCombinate = opzioniExtraStr;
      }
    }
    
    // ✅ NUOVO: Aggiungi dimensione vassoio alle note se selezionata
    console.log('🔍 DEBUG dimensioneVassoio:', dimensioneVassoio, 'tipo:', typeof dimensioneVassoio);
    if (dimensioneVassoio) {
      const dimensioneNote = `Vassoio nr ${dimensioneVassoio}`;
      if (noteProdottoCombinate) {
        noteProdottoCombinate = `${noteProdottoCombinate}, ${dimensioneNote}`;
      } else {
        noteProdottoCombinate = dimensioneNote;
      }
      console.log('📦 Dimensione vassoio aggiunta alle note:', dimensioneNote);
    }

    // ✅ VALIDAZIONE STRETTA QUANTITÀ (FIX 21/01/2026 - AGGIORNATO)
    let quantitaNormalizzata = parseFloat(normalizzaDecimale(prodottoCorrente.quantita));
    
    // 💶 CASO SPECIALE: Ordini in EURO
    // Quando l'unità è € e quantità è vuota/invalida, usa il prezzo come quantità
    if ((isNaN(quantitaNormalizzata) || quantitaNormalizzata <= 0) && prodottoCorrente.unita === '€') {
      if (prodottoCorrente.prezzo > 0) {
        quantitaNormalizzata = prodottoCorrente.prezzo;
        console.log('💶 Ordine in EURO: quantità auto-impostata a €', quantitaNormalizzata);
      } else {
        alert('❌ Inserisci un importo in euro valido.');
        console.error('❌ Prezzo euro invalido:', prodottoCorrente.prezzo);
        return;
      }
    } else if (isNaN(quantitaNormalizzata) || quantitaNormalizzata <= 0) {
      alert('❌ Quantità non valida. Inserisci un numero maggiore di 0.');
      console.error('❌ Quantità invalida:', prodottoCorrente.quantita, '→', quantitaNormalizzata);
      return;
    }

    // ✅ NUOVO: Crea più prodotti se numeroVassoiProdotto > 1
    const nuoviProdotti = [];
    for (let i = 0; i < numeroVassoiProdotto; i++) {
      // ✅ FIX 21/01/2026: Calcola prezzo usando calcolaPrezzoOrdine
      const calcoloPrezzo = calcolaPrezzoOrdine(
        prodottoCorrente.nome,
        quantitaNormalizzata,
        prodottoCorrente.unita,
        prodottoCorrente.prezzo
      );
      
      // ✅ FIX 03/02/2026: Calcola prezzoUnitario per visualizzazione corretta
      const prezzoUnitarioCalcolato = quantitaNormalizzata > 0 
        ? (calcoloPrezzo.prezzoTotale / quantitaNormalizzata) 
        : 0;
      
      nuoviProdotti.push({
        nome: nomeProdottoCompleto,
        quantita: quantitaNormalizzata,
        unita: prodottoCorrente.unita,
        unitaMisura: prodottoCorrente.unita,
        prezzo: calcoloPrezzo.prezzoTotale,
        prezzoUnitario: Math.round(prezzoUnitarioCalcolato * 100) / 100, // ✅ NUOVO: Prezzo per unità
        categoria: prodottoConfig?.categoria || 'Altro',
        variante: prodottoCorrente.variante,
        varianti: prodottoCorrente.varianti,
        noteProdotto: noteProdottoCombinate
      });
    }

    console.log(`➕ ${numeroVassoiProdotto} prodotto/i aggiunto/i al carrello:`, nuoviProdotti);

    setFormData({
      ...formData,
      prodotti: [...formData.prodotti, ...nuoviProdotti]
    });

    setProdottoCorrente({
      nome: '',
      variante: '',
      quantita: '',
      unita: 'Kg',
      prezzo: 0,
      varianti: [],
      opzioniExtra: [],
      noteProdotto: ''
    });
    
    // ✅ NUOVO: Reset numero vassoi e dimensione
    setNumeroVassoiProdotto(1);
    setDimensioneVassoio('');
  };

  const handleRimuoviProdotto = (index) => {
    setFormData({
      ...formData,
      prodotti: formData.prodotti.filter((_, i) => i !== index)
    });
  };

  // ✅ FIX 04/02/2026: Funzione per MODIFICARE un prodotto nel carrello
  // ✅ CRITICO: Resettare numeroVassoiProdotto a 1, altrimenti il ciclo for non esegue!
  const handleModificaProdotto = (index) => {
    const prodottoDaModificare = formData.prodotti[index];
    
    console.log('✏️ Modifica prodotto:', prodottoDaModificare);
    
    // 1. Trova configurazione prodotto da PRODOTTI_CONFIG
    const configProdotto = PRODOTTI_CONFIG[prodottoDaModificare.nome];
    
    // 2. Rimuovi il prodotto dal carrello
    const nuoviProdotti = formData.prodotti.filter((_, i) => i !== index);
    
    // 3. Ripopola prodottoCorrente con tutti i dati
    setProdottoCorrente({
      nome: prodottoDaModificare.nome || '',
      variante: prodottoDaModificare.variante || '',
      quantita: prodottoDaModificare.quantita || '',
      unita: prodottoDaModificare.unita || configProdotto?.unitaMisuraDisponibili?.[0] || 'Kg',
      prezzo: prodottoDaModificare.prezzo || 0,
      varianti: prodottoDaModificare.varianti || [],
      opzioniExtra: prodottoDaModificare.opzioniExtra || [],
      noteProdotto: prodottoDaModificare.noteProdotto || ''
    });
    
    // ✅ FIX 04/02/2026: CRITICO - Reset numeroVassoiProdotto a 1
    // Senza questo, il ciclo for in handleAggiungiProdotto non esegue mai!
    setNumeroVassoiProdotto(1);
    setDimensioneVassoio(prodottoDaModificare.dimensioneVassoio || '');
    
    // 4. Aggiorna il carrello senza il prodotto
    setFormData({
      ...formData,
      prodotti: nuoviProdotti
    });
    
    // 5. Torna al tab "Prodotti Singoli"
    setTabValue(0);
    
    console.log('✅ Prodotto caricato nel form per modifica, numeroVassoiProdotto = 1');
  };

  const aggiungiVassoioAlCarrello = (vassoio) => {
  console.log('🎂 Vassoio ricevuto:', vassoio);
  
  let vassoiArray;
  
  if (Array.isArray(vassoio)) {
    vassoiArray = vassoio;
  } else if (vassoio && typeof vassoio === 'object') {
    vassoiArray = [vassoio];
    console.log('✅ Convertito oggetto vassoio in array');
  } else {
    console.error('❌ Vassoio non valido:', vassoio);
    return;
  }
  
  setFormData({
    ...formData,
    prodotti: [...formData.prodotti, ...vassoiArray]
  });
  
  setTabValue(0);
  console.log('✅ Vassoio aggiunto al carrello');
};

  const handleConfermaVassoio = (vassoi) => {
    console.log('🎂 Conferma vassoio ricevuto:', vassoi);
    
    setFormData(prev => ({
      ...prev,
      prodotti: [...prev.prodotti, ...vassoi]
    }));
    
    setModalitaVassoio(null);
    setComposizioneVassoio([]);
    setTotaleVassoio(0);
    setTabValue(0);
    
    console.log('✅ Vassoio aggiunto all\'ordine');
  };

  const handleAnnullaVassoio = () => {
    setModalitaVassoio(null);
    setComposizioneVassoio([]);
    setTotaleVassoio(0);
    setTabValue(0);
    console.log('❌ Vassoio annullato');
  };

  const calcolaTotale = () => {
    return formData.prodotti.reduce((sum, p) => sum + (p.prezzo || 0), 0);
  };

  const handleSalva = async () => {
    // ✅ Validazione con supporto nome/cognome separati
    const nomeClienteCompleto = formData.nomeCliente || 
      `${formData.nome || ''} ${formData.cognome || ''}`.trim();
    
    if (!nomeClienteCompleto || !formData.dataRitiro || !formData.oraRitiro || formData.prodotti.length === 0) {
      alert('Compila tutti i campi obbligatori: nome cliente, data ritiro, ora ritiro e almeno un prodotto');
      return;
    }

    // ✅ FIX 21/01/2026: VALIDAZIONE STRETTA PRODOTTI
    // Controlla che TUTTI i prodotti abbiano quantità > 0
    const prodottiInvalidi = formData.prodotti.filter(p => {
      const quantita = parseFloat(p.quantita);
      return isNaN(quantita) || quantita <= 0;
    });

    if (prodottiInvalidi.length > 0) {
      const nomiProdotti = prodottiInvalidi.map(p => p.nome).join(', ');
      console.error('❌ PRODOTTI CON QUANTITÀ INVALIDA:', prodottiInvalidi);
      alert(
        `❌ ERRORE: I seguenti prodotti hanno quantità 0 o invalida:\n\n` +
        `${nomiProdotti}\n\n` +
        `Rimuovi questi prodotti o correggi le quantità prima di salvare.`
      );
      return;
    }

    // ✅ Controlla anche che abbiano prezzo > 0
    const prodottiSenzaPrezzo = formData.prodotti.filter(p => {
      const prezzo = parseFloat(p.prezzo);
      return isNaN(prezzo) || prezzo <= 0;
    });

    if (prodottiSenzaPrezzo.length > 0) {
      const nomiProdotti = prodottiSenzaPrezzo.map(p => p.nome).join(', ');
      console.error('❌ PRODOTTI CON PREZZO €0:', prodottiSenzaPrezzo);
      alert(
        `❌ ERRORE: I seguenti prodotti hanno prezzo €0:\n\n` +
        `${nomiProdotti}\n\n` +
        `Verifica le quantità e riprova.`
      );
      return;
    }

    console.log('✅ Validazione prodotti OK - tutti hanno quantità e prezzo validi');

    // ✅ FIX 19/02/2026: Controlla se data ritiro è OGGI → mostra dialog conferma
    const oggi = new Date().toISOString().split('T')[0];
    const dataRitiroSelezionata = formData.dataRitiro?.split('T')[0];
    
    if (dataRitiroSelezionata === oggi) {
      setShowConfermaDataOggi(true);
      return; // Aspetta conferma utente dal dialog
    }

    // Se data NON è oggi → procedi direttamente
    eseguiSalvataggio();
  };

  // ✅ Funzione separata per il salvataggio effettivo (chiamata dopo conferma)
  const eseguiSalvataggio = () => {
    const nomeClienteCompleto = formData.nomeCliente || 
      `${formData.nome || ''} ${formData.cognome || ''}`.trim();

    const erroriCritici = alertLimiti.filter(a => a.tipo === 'error');
    let forceOverride = false;
    
    if (erroriCritici.length > 0) {
      const conferma = window.confirm(
        `⚠️ ATTENZIONE!\n\n` +
        `L'ordine supera i limiti di capacità produttiva:\n\n` +
        erroriCritici.map(e => `• ${e.messaggio}\n  ${e.dettaglio}`).join('\n\n') +
        `\n\nVuoi procedere comunque?`
      );
      
      if (!conferma) {
        return;
      }
      
      forceOverride = true;
      console.log('⚠️ Utente ha confermato override limiti');
    }

    // ✅ Raccogli tutte le note prodotto
    const noteProdotti = formData.prodotti
      .filter(p => p.noteProdotto && p.noteProdotto.trim() !== '')
      .map(p => `${p.nome}: ${p.noteProdotto}`)
      .join(' | ');
    
    // ✅ Combina note ordine + note prodotti
    let noteFinali = formData.note || '';
    if (noteProdotti) {
      noteFinali = noteFinali 
        ? `${noteFinali}\n\n📝 Note prodotti: ${noteProdotti}`
        : `📝 Note prodotti: ${noteProdotti}`;
    }

    const ordineData = {
      ...formData,
      note: noteFinali,  // ✅ Note combinate
      nomeCliente: nomeClienteCompleto,  // ✅ Usa nome completo calcolato
      // ✅ FIX 15/01/2026 v2: Salva nome/cognome/telefono separati per modifica
      nome: formData.nome || nomeClienteCompleto.split(' ')[0] || '',
      cognome: formData.cognome || nomeClienteCompleto.split(' ').slice(1).join(' ') || '',
      telefono: formData.telefono || '',
      cliente: formData.cliente?._id || null,
      totale: calcolaTotale(),
      daViaggio: formData.daViaggio,
      ricordaEtichetta: formData.ricordaEtichetta,    // ✅ NUOVO
      confezioneRegalo: formData.confezioneRegalo,    // ✅ NUOVO
      pagato: formData.pagato,                         // ✅ NUOVO 24/02/2026
      acconto: formData.acconto,                       // ✅ NUOVO 24/02/2026
      importoAcconto: formData.acconto ? parseFloat(normalizzaDecimale(formData.importoAcconto)) || 0 : 0,  // ✅ NUOVO 24/02/2026
      forceOverride,
      packaging: formData.prodotti.find(p => p.dettagliCalcolo?.packaging)?.dettagliCalcolo.packaging,
      numeroVassoioDimensione: formData.prodotti.find(p => p.dettagliCalcolo?.numeroVassoioDimensione)?.dettagliCalcolo.numeroVassoioDimensione,
      opzioniExtra: formData.prodotti.find(p => p.dettagliCalcolo?.opzioni)?.dettagliCalcolo.opzioni || {}
    };

    console.log('🚀 INVIO ORDINE CON DATI:', JSON.stringify({
      forceOverride: ordineData.forceOverride,
      cliente: ordineData.nomeCliente,
      prodotti: ordineData.prodotti.length,
      totale: ordineData.totale
    }, null, 2));
    
    onSave(ordineData);
  };

  return (
    <>
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={false}
      fullWidth
      fullScreen
      PaperProps={{
        sx: { 
          maxWidth: '100vw',
          m: 0,
          borderRadius: 0
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: 'primary.main',
        color: 'white',
        py: 1
      }}>
        <Typography variant="h6">
          {ordineIniziale ? '✏️ Modifica Ordine' : '➕ Nuovo Ordine'}
        </Typography>
        <Button 
          variant="contained" 
          color="inherit"
          onClick={onClose}
          sx={{ color: 'primary.main' }}
        >
          ✕ Chiudi
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: { xs: 'auto', md: 'hidden' } }}>
        {/* ✅ LAYOUT A 2 COLONNE - Su mobile: Cliente/Data PRIMA, poi Prodotti */}
        <Grid container sx={{ 
          height: { xs: 'auto', md: 'calc(100vh - 64px)' },
          flexDirection: { xs: 'column', md: 'row' }  // ✅ Su mobile impila verticalmente
        }}>
          
          {/* ========== COLONNA SINISTRA: PRODOTTI/VASSOIO (scrollabile) ========== */}
          {/* Su mobile (xs): order=2 (appare DOPO), su desktop (md): order=1 (appare PRIMA) */}
          <Grid item xs={12} md={8} sx={{ 
            height: { xs: 'auto', md: '100%' }, 
            overflow: { xs: 'visible', md: 'auto' },
            borderRight: { md: '1px solid #e0e0e0' },
            bgcolor: '#fafafa',
            order: { xs: 2, md: 1 },
            pb: '100px'  // ✅ Spazio per bottone SALVA fisso in basso
          }}>
            <Box sx={{ p: 2, pb: 10 }}>  {/* ✅ Padding extra in fondo */}
              {/* Alert Limiti */}
              {alertLimiti.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {alertLimiti.map((alert, index) => (
                    <Alert 
                      key={index}
                      severity={alert.tipo} 
                      icon={alert.tipo === 'error' ? <ErrorIcon /> : <WarningIcon />}
                      sx={{ mb: 1 }}
                    >
                      <AlertTitle>{alert.messaggio}</AlertTitle>
                      {alert.dettaglio}
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(alert.percentuale, 100)}
                        color={alert.tipo === 'error' ? 'error' : 'warning'}
                        sx={{ mt: 1 }}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        Capacità utilizzata: {alert.percentuale.toFixed(0)}%
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              )}

              {/* Info Limiti */}
              {limiti.length > 0 && (
                <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'info.light' }}>
                  <Typography variant="caption" display="flex" alignItems="center" gap={1}>
                    <CheckIcon fontSize="small" />
                    Limiti configurati per {new Date(formData.dataRitiro).toLocaleDateString('it-IT')}: {limiti.length}
                    {loadingLimiti && <CircularProgress size={14} />}
                  </Typography>
                </Paper>
              )}

              {/* TABS */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={(e, newValue) => setTabValue(newValue)}
                  variant="fullWidth"
                >
                  <Tab 
                    label="🛒 Prodotti Singoli" 
                    icon={<CartIcon />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="🎂 Vassoio Dolci Misti" 
                    icon={<CakeIcon />}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              {/* TAB 0: PRODOTTI SINGOLI */}
              {tabValue === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                  
                  <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CartIcon /> Seleziona Prodotti
                {loadingProdotti && <CircularProgress size={20} />}
              </Typography>

              {Object.entries(prodottiPerCategoria).map(([categoria, prodotti]) => (
                prodotti.length > 0 && (
                  <Accordion key={categoria} defaultExpanded={categoria === 'Ravioli'}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {categoria} ({prodotti.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1}>
                        {prodotti.map((p) => (
                          <Grid item xs={6} sm={4} md={3} key={p._id || p.nome}>
                            <Button
                              fullWidth
                              variant={prodottoCorrente.nome === p.nome ? "contained" : "outlined"}
                              onClick={() => handleProdottoSelect(p)}
                              sx={{ 
                                justifyContent: 'flex-start', 
                                textAlign: 'left',
                                height: '100%',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                p: 1.5
                              }}
                            >
                              <Typography variant="body2" fontWeight="bold">
                                {p.nome}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {p.prezzoKg ? `€${p.prezzoKg}/Kg` : p.prezzoPezzo ? `€${p.prezzoPezzo}/pz` : ''}
                              </Typography>
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )
              ))}

              <Divider sx={{ my: 2 }} />

              {/* Form Aggiunta Prodotto */}
              {prodottoCorrente.nome && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#CFD8DC', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Configura: <strong>{prodottoCorrente.nome}</strong>
                  </Typography>

                  {/* ✅ NUOVO SISTEMA: Checkbox multiple (Ravioli, ecc.) */}
                  {usaNuovoSistemaVarianti && 
                   !PRODOTTI_CONFIG[prodottoCorrente.nome]?.opzioniAggiuntive && 
                   !PRODOTTI_CONFIG[prodottoCorrente.nome]?.gustiPanadine && (
                    <Box sx={{ my: 2 }}>
                      <VariantiProdotto
                        prodottoBase={prodottoCorrente.nome}
                        onVarianteChange={handleVariantiChange}
                        variantiSelezionate={prodottoCorrente.varianti}
                        opzioniExtraSelezionate={prodottoCorrente.opzioniExtra}
                      />
                    </Box>
                  )}

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* ✅ SISTEMA LEGACY: Dropdown singolo (solo se NON usa nuovo sistema) */}
                    {hasVarianti && (
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Variante *</InputLabel>
                          <Select
                            value={prodottoCorrente.variante}
                            onChange={handleVarianteChange}
                            label="Variante *"
                          >
                            {varianti.map((v) => (
                              <MenuItem key={v.nome} value={v.nome}>
                                {v.label} - €{v.prezzoKg}/Kg
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        type="text"
                        label="Quantità"
                        placeholder="0"
                        value={prodottoCorrente.quantita}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^\d.,]/g, '');
                          const separatori = value.match(/[.,]/g);
                          if (separatori && separatori.length > 1) return;
                          setProdottoCorrente({ ...prodottoCorrente, quantita: value });
                        }}
                        onBlur={(e) => {
                          let value = e.target.value;
                          if (value === '' || value === ',' || value === '.') {
                            setProdottoCorrente({ ...prodottoCorrente, quantita: '' });
                            return;
                          }
                          const normalized = normalizzaDecimale(value);
                          const parsedValue = parseFloat(normalized);
                          if (isNaN(parsedValue) || parsedValue <= 0) {
                            setProdottoCorrente({ ...prodottoCorrente, quantita: '' });
                            return;
                          }
                          setProdottoCorrente({ ...prodottoCorrente, quantita: parsedValue });
                        }}
                        inputProps={{ 
                          inputMode: 'decimal',
                          style: { MozAppearance: 'textfield' }
                        }}
                        sx={{
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0
                          }
                        }}
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Unità</InputLabel>
                        <Select
                          value={prodottoCorrente.unita}
                          onChange={(e) => setProdottoCorrente({ 
                            ...prodottoCorrente, 
                            unita: e.target.value,
                            quantita: ''
                          })}
                          label="Unità"
                        >
                          {/* ✅ AGGIORNATO: Aggiungi sempre € come opzione */}
                          {[...(prodottoConfig?.unitaMisuraDisponibili || ['Kg']), '€']
                            .filter((u, i, arr) => arr.indexOf(u) === i) // rimuovi duplicati
                            .map((u) => (
                              <MenuItem key={u} value={u}>{u}</MenuItem>
                            ))
                          }
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Campo Note Prodotto */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Note Prodotto"
                        placeholder="Es: ben cotte, poco dorate..."
                        value={prodottoCorrente.noteProdotto}
                        onChange={(e) => setProdottoCorrente({ 
                          ...prodottoCorrente, 
                          noteProdotto: e.target.value 
                        })}
                        size="small"
                      />
                    </Grid>

                    {/* Griglia Valori Rapidi */}
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        ⚡ Valori rapidi:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {VALORI_RAPIDI[prodottoCorrente.unita]?.map((valore) => (
                          <Chip
                            key={valore}
                            label={`${valore} ${prodottoCorrente.unita}`}
                            onClick={() => handleValoreRapido(valore)}
                            color={prodottoCorrente.quantita === valore ? "primary" : "default"}
                            variant={prodottoCorrente.quantita === valore ? "filled" : "outlined"}
                            sx={{
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              minWidth: '70px',
                              height: '48px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': { transform: 'scale(1.05)' },
                              '&:active': { transform: 'scale(0.95)' },
                              ...(prodottoCorrente.quantita === valore ? {
                                backgroundColor: '#1976d2',
                                color: 'white'
                              } : {})
                            }}
                          />
                        ))}
                      </Box>
                    </Grid>

                    {/* ✅ NUMERO VASSOI UGUALI - CHIP CLICCABILI PER TABLET */}
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        🔢 Nr vassoi uguali:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <Chip
                            key={num}
                            label={num}
                            onClick={() => setNumeroVassoiProdotto(num)}
                            color={numeroVassoiProdotto === num ? 'primary' : 'default'}
                            variant={numeroVassoiProdotto === num ? 'filled' : 'outlined'}
                            sx={{
                              fontSize: '0.95rem',
                              fontWeight: '500',
                              minWidth: '40px',
                              height: '36px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': { transform: 'scale(1.05)' },
                              '&:active': { transform: 'scale(0.95)' },
                              ...(numeroVassoiProdotto === num ? {
                                backgroundColor: '#1976d2',
                                color: 'white'
                              } : {})
                            }}
                          />
                        ))}
                      </Box>
                    </Grid>

                    {/* ✅ Dimensione Vassoio */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Dim. Vassoio</InputLabel>
                        <Select
                          value={dimensioneVassoio}
                          onChange={(e) => {
                            console.log('🎯 Dimensione vassoio selezionata:', e.target.value);
                            setDimensioneVassoio(e.target.value);
                          }}
                          label="Dim. Vassoio"
                        >
                          <MenuItem value="">-</MenuItem>
                          {DIMENSIONI_VASSOIO.map((dim) => (
                            <MenuItem key={dim} value={dim}>Nr {dim}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={8} sm={hasVarianti ? 8 : 4}>
                      <TextField
                        fullWidth
                        label="Prezzo Totale"
                        value={`€${prodottoCorrente.prezzo.toFixed(2)}`}
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>

              <Grid item xs={4} sm={hasVarianti ? 4 : 2}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={<AddIcon />}
                        onClick={handleAggiungiProdotto}
                        sx={{ height: '40px' }}
                      >
                        Aggiungi
                      </Button>
                    </Grid>

                    {/* Opzioni Panade (Aglio + Pepe + Pomodori Secchi + Contorno) */}
                    {PRODOTTI_CONFIG[prodottoCorrente.nome]?.opzioniAggiuntive && (
                      <Grid item xs={12}>
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            🥘 Opzioni Panada
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Aglio</InputLabel>
                                <Select
                                  value={opzioniPanada.aglio}
                                  onChange={(e) => setOpzioniPanada(prev => ({ ...prev, aglio: e.target.value }))}
                                  label="Aglio"
                                >
                                  <MenuItem value="con_aglio">Con aglio</MenuItem>
                                  <MenuItem value="senza_aglio">Senza aglio</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={6} sm={3}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Pepe</InputLabel>
                                <Select
                                  value={opzioniPanada.pepe}
                                  onChange={(e) => setOpzioniPanada(prev => ({ ...prev, pepe: e.target.value }))}
                                  label="Pepe"
                                >
                                  <MenuItem value="con_pepe">Con pepe</MenuItem>
                                  <MenuItem value="senza_pepe">Senza pepe</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={6} sm={3}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Pomodori Secchi</InputLabel>
                                <Select
                                  value={opzioniPanada.pomodorisecchi}
                                  onChange={(e) => setOpzioniPanada(prev => ({ ...prev, pomodorisecchi: e.target.value }))}
                                  label="Pomodori Secchi"
                                >
                                  <MenuItem value="con_pomodori_secchi">Con pomodori secchi</MenuItem>
                                  <MenuItem value="senza_pomodori_secchi">Senza pomodori secchi</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={6} sm={3}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Contorno</InputLabel>
                                <Select
                                  value={opzioniPanada.contorno}
                                  onChange={(e) => setOpzioniPanada(prev => ({ ...prev, contorno: e.target.value }))}
                                  label="Contorno"
                                >
                                  <MenuItem value="con_patate">Con patate</MenuItem>
                                  <MenuItem value="con_piselli">Con piselli</MenuItem>
                                  <MenuItem value="patate_piselli">Con patate e piselli</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={12}>
                              <TextField
                                label="Numero Vassoi/Panade"
                                type="number"
                                value={numeroVassoi}
                                onChange={(e) => setNumeroVassoi(Math.max(1, parseInt(e.target.value) || 1))}
                                size="small"
                                fullWidth
                                inputProps={{ min: 1 }}
                                helperText="Es: 2 panade da 1kg = inserisci 2"
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                    )}

                    {/* Gusti Panadine */}
                    {PRODOTTI_CONFIG[prodottoCorrente.nome]?.gustiPanadine && (
                      <Grid item xs={12}>
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            🥟 Gusti Panadine
                          </Typography>
                          
                          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Button
                              variant={modalitaPanadine === 'miste' ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => setModalitaPanadine('miste')}
                              color="success"
                              sx={{ fontWeight: modalitaPanadine === 'miste' ? 'bold' : 'normal' }}
                            >
                              🎲 MISTE (a scelta)
                            </Button>
                            <Button
                              variant={modalitaPanadine === 'rapida' ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => setModalitaPanadine('rapida')}
                            >
                              Carne/Verdura
                            </Button>
                            <Button
                              variant={modalitaPanadine === 'componi' ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => setModalitaPanadine('componi')}
                            >
                              Componi
                            </Button>
                          </Box>

                          {/* ✅ NUOVO: Modalità MISTE - usa campo quantità principale */}
                          {modalitaPanadine === 'miste' && (
                            <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                              <Typography variant="body2" color="success.main" gutterBottom>
                                ✅ Usa il campo <strong>Quantità</strong> sopra per inserire il numero totale di panadine.
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Le panadine saranno preparate con gusti misti a scelta del pastificio.
                              </Typography>
                              {prodottoCorrente.quantita > 0 && (
                                <Typography variant="h6" color="success.main" sx={{ mt: 1 }}>
                                  Totale: {prodottoCorrente.quantita} panadine = €{(prodottoCorrente.quantita * 0.80).toFixed(2)}
                                </Typography>
                              )}
                            </Box>
                          )}
                          
                          {modalitaPanadine === 'rapida' && (
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <TextField
                                  label="Carne"
                                  type="number"
                                  value={panadineRapide.carne}
                                  onChange={(e) => setPanadineRapide(prev => ({ 
                                    ...prev, 
                                    carne: Math.max(0, parseInt(e.target.value) || 0) 
                                  }))}
                                  size="small"
                                  fullWidth
                                  inputProps={{ min: 0 }}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  label="Verdura"
                                  type="number"
                                  value={panadineRapide.verdura}
                                  onChange={(e) => setPanadineRapide(prev => ({ 
                                    ...prev, 
                                    verdura: Math.max(0, parseInt(e.target.value) || 0) 
                                  }))}
                                  size="small"
                                  fullWidth
                                  inputProps={{ min: 0 }}
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                  Totale: {panadineRapide.carne + panadineRapide.verdura} panadine = €{((panadineRapide.carne + panadineRapide.verdura) * 0.80).toFixed(2)}
                                </Typography>
                              </Grid>
                            </Grid>
                          )}
                          
                          {modalitaPanadine === 'componi' && (
                            <Box>
                              {gustiPanadine.map((gusto, index) => (
                                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                  <FormControl size="small" sx={{ minWidth: 100 }}>
                                    <Select
                                      value={gusto.ingrediente1}
                                      onChange={(e) => {
                                        const newGusti = [...gustiPanadine];
                                        newGusti[index].ingrediente1 = e.target.value;
                                        setGustiPanadine(newGusti);
                                      }}
                                      displayEmpty
                                    >
                                      <MenuItem value="">Ingr. 1</MenuItem>
                                      <MenuItem value="carne">Carne</MenuItem>
                                      <MenuItem value="piselli">Piselli</MenuItem>
                                      <MenuItem value="patate">Patate</MenuItem>
                                      <MenuItem value="melanzane">Melanzane</MenuItem>
                                      <MenuItem value="peperoni">Peperoni</MenuItem>
                                      <MenuItem value="zucchine">Zucchine</MenuItem>
                                      <MenuItem value="pomodoro">Pomodoro</MenuItem>
                                      <MenuItem value="salsiccia">Salsiccia</MenuItem>
                                      <MenuItem value="funghi">Funghi</MenuItem>
                                    </Select>
                                  </FormControl>
                                  
                                  <Typography>+</Typography>
                                  
                                  <FormControl size="small" sx={{ minWidth: 100 }}>
                                    <Select
                                      value={gusto.ingrediente2}
                                      onChange={(e) => {
                                        const newGusti = [...gustiPanadine];
                                        newGusti[index].ingrediente2 = e.target.value;
                                        setGustiPanadine(newGusti);
                                      }}
                                      displayEmpty
                                    >
                                      <MenuItem value="">Ingr. 2</MenuItem>
                                      <MenuItem value="carne">Carne</MenuItem>
                                      <MenuItem value="piselli">Piselli</MenuItem>
                                      <MenuItem value="patate">Patate</MenuItem>
                                      <MenuItem value="melanzane">Melanzane</MenuItem>
                                      <MenuItem value="peperoni">Peperoni</MenuItem>
                                      <MenuItem value="zucchine">Zucchine</MenuItem>
                                      <MenuItem value="pomodoro">Pomodoro</MenuItem>
                                      <MenuItem value="salsiccia">Salsiccia</MenuItem>
                                      <MenuItem value="funghi">Funghi</MenuItem>
                                    </Select>
                                  </FormControl>
                                  
                                  <TextField
                                    type="number"
                                    value={gusto.quantita}
                                    onChange={(e) => {
                                      const newGusti = [...gustiPanadine];
                                      newGusti[index].quantita = Math.max(0, parseInt(e.target.value) || 0);
                                      setGustiPanadine(newGusti);
                                    }}
                                    size="small"
                                    sx={{ width: 60 }}
                                    inputProps={{ min: 0 }}
                                  />
                                  
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => {
                                      setGustiPanadine(gustiPanadine.filter((_, i) => i !== index));
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ))}
                              
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                  setGustiPanadine([...gustiPanadine, { 
                                    ingrediente1: '', 
                                    ingrediente2: '', 
                                    quantita: 0 
                                  }]);
                                }}
                                sx={{ mt: 1 }}
                              >
                                Aggiungi Combinazione
                              </Button>
                              
                              <Typography variant="body2" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
                                Totale: {gustiPanadine.reduce((sum, g) => sum + g.quantita, 0)} panadine = €{(gustiPanadine.reduce((sum, g) => sum + g.quantita, 0) * 0.80).toFixed(2)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    )}

                  </Grid>
                </Box>
              )}
            </Paper>

            {/* Lista Prodotti Aggiunti */}
            {formData.prodotti.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>📦 Prodotti nel Carrello</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Prodotto</TableCell>
                      <TableCell align="center">Quantità</TableCell>
                      <TableCell align="right">Prezzo</TableCell>
                      <TableCell align="center">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.prodotti.map((p, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {p.nome}
                            </Typography>
                            {p.variante && (
                              <Typography variant="caption" color="text.secondary">
                                📦 Variante: {String(p.variante)}
                              </Typography>
                            )}
                            {p.noteProdotto && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                🔥 {String(p.noteProdotto)}
                              </Typography>
                            )}
                            {p.dettagliCalcolo?.dettagli && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {typeof p.dettagliCalcolo.dettagli === 'string' ? p.dettagliCalcolo.dettagli : JSON.stringify(p.dettagliCalcolo.dettagli)}
                              </Typography>
                            )}
                            {p.dettagliCalcolo?.composizione && Array.isArray(p.dettagliCalcolo.composizione) && (
                              <Typography variant="caption" color="primary" display="block">
                                🎂 Vassoio: {p.dettagliCalcolo.composizione.length} prodotti
                              </Typography>
                            )}
                            {p.note && (
                              <Typography variant="caption" color="warning.main" display="block">
                                📝 {String(p.note)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {p.quantita} {p.unita}
                        </TableCell>
                        <TableCell align="right">€{p.prezzo.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          {/* ✅ FIX 20/12/2025: Pulsante MODIFICA */}
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleModificaProdotto(index)}
                            title="Modifica prodotto"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleRimuoviProdotto(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2}><strong>TOTALE</strong></TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary">
                          €{calcolaTotale().toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        )}

       {/* TAB 1: VASSOIO DOLCI MISTI */}
              {tabValue === 1 && (
                <VassoidDolciMisti 
                  prodottiDisponibili={prodottiOrdinatiVassoio}
                  onAggiungiAlCarrello={aggiungiVassoioAlCarrello}
                  onClose={() => setTabValue(0)}
                />
              )}
            </Box>
          </Grid>

          {/* ========== COLONNA DESTRA: CLIENTE + DATA + CARRELLO (sticky) ========== */}
          {/* Su mobile (xs): order=1 (appare PRIMA), su desktop (md): order=2 (appare DOPO) */}
          <Grid item xs={12} md={4} sx={{ 
            height: { xs: 'auto', md: '100%' }, 
            overflow: { xs: 'visible', md: 'auto' },
            bgcolor: 'white',
            position: { xs: 'relative', md: 'sticky' },
            top: 0,
            order: { xs: 1, md: 2 },
            borderBottom: { xs: '2px solid #1976d2', md: 'none' },
            pb: { xs: 2, md: '100px' }  // ✅ Spazio per bottone SALVA
          }}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, pb: 10 }}>  {/* ✅ Padding extra */}
              
              {/* ========== DATA E ORA (IN ALTO!) ========== */}
              <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  📅 Data e Ora Ritiro
                </Typography>
                
                {/* Box con frecce per cambiare data */}
                <Box sx={{ 
                  p: 1.5, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  color: 'white',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <IconButton 
                    onClick={() => {
                      const currentDate = new Date(formData.dataRitiro + 'T12:00:00');
                      currentDate.setDate(currentDate.getDate() - 1);
                      setFormData({ ...formData, dataRitiro: currentDate.toISOString().split('T')[0] });
                    }}
                    sx={{ color: 'white', p: 0.5 }}
                    size="small"
                  >
                    ◀️
                  </IconButton>
                  
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {formData.dataRitiro ? 
                        new Date(formData.dataRitiro + 'T12:00:00').toLocaleDateString('it-IT', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short'
                        }).toUpperCase()
                        : 'DATA'
                      }
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formData.oraRitiro || '--:--'}
                    </Typography>
                  </Box>
                  
                  <IconButton 
                    onClick={() => {
                      const currentDate = new Date(formData.dataRitiro + 'T12:00:00');
                      currentDate.setDate(currentDate.getDate() + 1);
                      setFormData({ ...formData, dataRitiro: currentDate.toISOString().split('T')[0] });
                    }}
                    sx={{ color: 'white', p: 0.5 }}
                    size="small"
                  >
                    ▶️
                  </IconButton>
                </Box>
                
                {/* Barra disponibilità */}
                <BarraDisponibilita 
                  conteggioOrari={conteggioOrari}
                  dataSelezionata={formData.dataRitiro}
                  loading={loadingConteggioOrari}
                />
                
                {/* Input data e ora compatti */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    value={formData.dataRitiro}
                    onChange={(e) => setFormData({ ...formData, dataRitiro: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <SelectOrarioIntelligente
                    value={formData.oraRitiro}
                    onChange={(e) => setFormData({ ...formData, oraRitiro: e.target.value })}
                    conteggioOrari={conteggioOrari}
                    loading={loadingConteggioOrari}
                    disabled={!formData.dataRitiro}
                    prodottoSelezionato={prodottoCriticoSelezionato}
                    size="small"
                  />
                </Box>
              </Paper>

              {/* ========== CLIENTE (compatto) ========== */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  👤 Cliente
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* Nome - Inline Autocomplete + Chip */}
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nome *"
                      placeholder="Cerca cliente..."
                      value={formData.nome}
                      onChange={(e) => {
                        const val = capitalizeFirst(e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          nome: val,
                          nomeCliente: `${val} ${prev.cognome || ''}`.trim(),
                          cliente: null
                        }));
                      }}
                      onKeyDown={(e) => {
                        // Tab o Freccia Destra → accetta suggerimento inline
                        if ((e.key === 'Tab' || e.key === 'ArrowRight') && formData.nome.length >= 2) {
                          const input = formData.nome.toLowerCase().trim();
                          const match = clienti.find(c => {
                            const nome = (c.nome || '').toLowerCase();
                            return nome.startsWith(input) && nome !== input;
                          });
                          if (match) {
                            e.preventDefault();
                            setFormData(prev => ({
                              ...prev,
                              cliente: match,
                              nome: match.nome || '',
                              cognome: match.cognome || '',
                              nomeCliente: `${match.nome} ${match.cognome || ''}`.trim(),
                              telefono: prev.telefono || match.telefono || ''
                            }));
                            // ✅ NUOVO 27/02/2026: Carica ultimo ordine
                            if (match._id) caricaUltimoOrdine(match._id);
                            setTimeout(() => {
                              const cognomeField = document.getElementById('campo-cognome');
                              if (cognomeField) cognomeField.focus();
                            }, 50);
                          }
                        }
                      }}
                      InputProps={{
                        endAdornment: (() => {
                          // Mostra suggerimento inline in grigio
                          if (formData.nome.length >= 2 && !formData.cliente) {
                            const input = formData.nome.toLowerCase().trim();
                            const match = clienti.find(c => {
                              const nome = (c.nome || '').toLowerCase();
                              return nome.startsWith(input) && nome !== input;
                            });
                            if (match) {
                              return (
                                <InputAdornment position="end">
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: '#999', 
                                      fontSize: '0.85rem',
                                      whiteSpace: 'nowrap',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    → {match.nome} {match.cognome || ''}
                                  </Typography>
                                </InputAdornment>
                              );
                            }
                          }
                          return null;
                        })()
                      }}
                    />
                  </Box>

                  {/* Chip suggerimenti clienti - appaiono sotto il campo nome */}
                  {formData.nome.length >= 2 && !formData.cliente && (() => {
                    const input = formData.nome.toLowerCase().trim();
                    const matches = clienti.filter(c => {
                      const nome = (c.nome || '').toLowerCase();
                      const cognome = (c.cognome || '').toLowerCase();
                      const nomeCompleto = `${nome} ${cognome}`;
                      const telefono = (c.telefono || '').toLowerCase();
                      return nome.includes(input) || cognome.includes(input) || 
                             nomeCompleto.includes(input) || telefono.includes(input);
                    }).slice(0, 4);
                    
                    if (matches.length === 0) return null;
                    
                    return (
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.5, 
                        mt: -0.5,
                        mb: 0.5
                      }}>
                        {matches.map((cliente) => (
                          <Chip
                            key={cliente._id}
                            label={`${cliente.nome} ${cliente.cognome || ''} ${cliente.telefono ? '📞' + cliente.telefono.slice(-4) : ''}`}
                            size="small"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                cliente: cliente,
                                nome: cliente.nome || '',
                                cognome: cliente.cognome || '',
                                nomeCliente: `${cliente.nome} ${cliente.cognome || ''}`.trim(),
                                telefono: prev.telefono || cliente.telefono || ''
                              }));
                              // ✅ NUOVO 27/02/2026: Carica ultimo ordine
                              if (cliente._id) caricaUltimoOrdine(cliente._id);
                              setTimeout(() => {
                                const cognomeField = document.getElementById('campo-cognome');
                                if (cognomeField) cognomeField.focus();
                              }, 50);
                            }}
                            sx={{
                              cursor: 'pointer',
                              bgcolor: '#e3f2fd',
                              border: '1px solid #90caf9',
                              fontWeight: 500,
                              fontSize: '0.8rem',
                              height: 36,
                              '&:hover': { bgcolor: '#bbdefb' },
                              '&:active': { bgcolor: '#90caf9', transform: 'scale(0.95)' }
                            }}
                          />
                        ))}
                      </Box>
                    );
                  })()}

                  {/* Cliente selezionato - conferma visiva */}
                  {formData.cliente && (
                    <Chip
                      label={`✅ ${formData.cliente.nome} ${formData.cliente.cognome || ''} ${formData.cliente.telefono ? '- 📞' + formData.cliente.telefono : ''}`}
                      onDelete={() => {
                        setFormData(prev => ({
                          ...prev,
                          cliente: null,
                          nome: '',
                          cognome: '',
                          telefono: '',
                          nomeCliente: ''
                        }));
                        // ✅ NUOVO 27/02/2026: Reset ultimo ordine
                        setUltimoOrdine(null);
                        setAltriOrdini([]);
                        setMostraAltriOrdini(false);
                        setOrdineRipetuto(false);
                      }}
                      size="small"
                      sx={{
                        bgcolor: '#c8e6c9',
                        border: '1px solid #66bb6a',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        height: 32,
                        mt: -0.5
                      }}
                    />
                  )}
                  
                  {/* Cognome - con inline suggestion + chip */}
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      size="small"
                      id="campo-cognome"
                      label="Cognome"
                      placeholder="Cerca per cognome..."
                      value={formData.cognome}
                      onChange={(e) => {
                        const val = capitalizeFirst(e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          cognome: val,
                          nomeCliente: `${prev.nome || ''} ${val}`.trim(),
                          cliente: null
                        }));
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === 'Tab' || e.key === 'ArrowRight') && formData.cognome.length >= 2) {
                          const input = formData.cognome.toLowerCase().trim();
                          const match = clienti.find(c => {
                            const cognome = (c.cognome || '').toLowerCase();
                            return cognome.startsWith(input) && cognome !== input;
                          });
                          if (match) {
                            e.preventDefault();
                            setFormData(prev => ({
                              ...prev,
                              cliente: match,
                              nome: match.nome || '',
                              cognome: match.cognome || '',
                              nomeCliente: `${match.nome} ${match.cognome || ''}`.trim(),
                              telefono: prev.telefono || match.telefono || ''
                            }));
                            // ✅ NUOVO 27/02/2026: Carica ultimo ordine
                            if (match._id) caricaUltimoOrdine(match._id);
                          }
                        }
                      }}
                      InputProps={{
                        endAdornment: (() => {
                          if (formData.cognome.length >= 2 && !formData.cliente) {
                            const input = formData.cognome.toLowerCase().trim();
                            const match = clienti.find(c => {
                              const cognome = (c.cognome || '').toLowerCase();
                              return cognome.startsWith(input) && cognome !== input;
                            });
                            if (match) {
                              return (
                                <InputAdornment position="end">
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: '#999', 
                                      fontSize: '0.85rem',
                                      whiteSpace: 'nowrap',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    → {match.nome} {match.cognome || ''}
                                  </Typography>
                                </InputAdornment>
                              );
                            }
                          }
                          return null;
                        })()
                      }}
                    />
                  </Box>

                  {/* Chip suggerimenti per cognome */}
                  {formData.cognome.length >= 2 && !formData.cliente && (() => {
                    const input = formData.cognome.toLowerCase().trim();
                    const matches = clienti.filter(c => {
                      const cognome = (c.cognome || '').toLowerCase();
                      const nomeCompleto = `${(c.nome || '')} ${cognome}`.toLowerCase();
                      return cognome.includes(input) || nomeCompleto.includes(input);
                    }).slice(0, 4);
                    
                    if (matches.length === 0) return null;
                    
                    return (
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.5, 
                        mt: -0.5,
                        mb: 0.5
                      }}>
                        {matches.map((cliente) => (
                          <Chip
                            key={cliente._id}
                            label={`${cliente.nome} ${cliente.cognome || ''} ${cliente.telefono ? '📞' + cliente.telefono.slice(-4) : ''}`}
                            size="small"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                cliente: cliente,
                                nome: cliente.nome || '',
                                cognome: cliente.cognome || '',
                                nomeCliente: `${cliente.nome} ${cliente.cognome || ''}`.trim(),
                                telefono: prev.telefono || cliente.telefono || ''
                              }));
                              // ✅ NUOVO 27/02/2026: Carica ultimo ordine
                              if (cliente._id) caricaUltimoOrdine(cliente._id);
                            }}
                            sx={{
                              cursor: 'pointer',
                              bgcolor: '#e3f2fd',
                              border: '1px solid #90caf9',
                              fontWeight: 500,
                              fontSize: '0.8rem',
                              height: 36,
                              '&:hover': { bgcolor: '#bbdefb' },
                              '&:active': { bgcolor: '#90caf9', transform: 'scale(0.95)' }
                            }}
                          />
                        ))}
                      </Box>
                    );
                  })()}
                  
                  {/* Telefono */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  />
                </Box>
              </Paper>

              {/* ========== ULTIMO ORDINE (RIPETI) ========== */}
              {/* ✅ NUOVO 27/02/2026: Mostra box ultimo ordine quando cliente selezionato */}
              {formData.cliente && !ordineIniziale && !ordineRipetuto && (ultimoOrdine || loadingUltimoOrdine) && (
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: '#fff8e1', 
                  border: '1px solid #ffca28',
                  borderRadius: 2
                }}>
                  {loadingUltimoOrdine ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="text.secondary">
                        Caricamento ultimo ordine...
                      </Typography>
                    </Box>
                  ) : ultimoOrdine ? (
                    <Box>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <HistoryIcon fontSize="small" sx={{ color: '#f57f17' }} />
                        Ultimo ordine di {formData.nome} {formData.cognome} 
                        <Typography component="span" variant="caption" color="text.secondary">
                          ({ultimoOrdine.dataRitiro ? new Date(ultimoOrdine.dataRitiro).toLocaleDateString('it-IT') : 'N/D'})
                        </Typography>
                      </Typography>
                      
                      {/* Lista prodotti ultimo ordine */}
                      <Box sx={{ mb: 1.5 }}>
                        {(ultimoOrdine.prodotti || []).map((p, idx) => (
                          <Box key={idx} sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            py: 0.3,
                            borderBottom: idx < ultimoOrdine.prodotti.length - 1 ? '1px solid #fff3e0' : 'none'
                          }}>
                            <Typography variant="body2">
                              • {p.nome}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {p.quantita} {p.unita || p.unitaMisura || ''}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                      
                      {/* Totale */}
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Totale: €{(ultimoOrdine.totale || 0).toFixed(2)} — i prezzi verranno ricalcolati
                      </Typography>
                      
                      {/* Bottone Ripeti */}
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<ReplayIcon />}
                        onClick={() => ripetiOrdine(ultimoOrdine)}
                        sx={{
                          bgcolor: '#2e7d32',
                          '&:hover': { bgcolor: '#1b5e20' },
                          py: 1.2,
                          fontSize: '0.95rem',
                          fontWeight: 'bold',
                          borderRadius: 2,
                          textTransform: 'none'
                        }}
                      >
                        🔄 Ripeti questo ordine
                      </Button>
                      
                      {/* Link "Vedi altri ordini" */}
                      {!mostraAltriOrdini && (
                        <Button
                          size="small"
                          onClick={() => caricaAltriOrdini(formData.cliente._id)}
                          sx={{ 
                            mt: 0.5, 
                            textTransform: 'none', 
                            fontSize: '0.75rem',
                            color: 'text.secondary'
                          }}
                        >
                          📋 Vedi altri ordini recenti
                        </Button>
                      )}
                      
                      {/* Lista altri ordini */}
                      {mostraAltriOrdini && altriOrdini.length > 1 && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #ffca28' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                            Ordini precedenti:
                          </Typography>
                          {altriOrdini.slice(1).map((ordine, idx) => (
                            <Box key={idx} sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              py: 0.5,
                              borderBottom: '1px solid #fff3e0'
                            }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {ordine.dataRitiro ? new Date(ordine.dataRitiro).toLocaleDateString('it-IT') : 'N/D'}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  {(ordine.prodotti || []).map(p => p.nome).join(', ')}
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => ripetiOrdine(ordine)}
                                sx={{ 
                                  minWidth: 'auto', 
                                  px: 1, 
                                  py: 0.3,
                                  fontSize: '0.7rem',
                                  textTransform: 'none'
                                }}
                              >
                                Ripeti
                              </Button>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ) : null}
                </Paper>
              )}

              {/* ✅ NUOVO 27/02/2026: Conferma ordine ripetuto */}
              {ordineRipetuto && formData.prodotti.length > 0 && (
                <Alert 
                  severity="success" 
                  sx={{ borderRadius: 2 }}
                  onClose={() => setOrdineRipetuto(false)}
                >
                  ✅ Ordine precedente caricato! Puoi modificare i prodotti prima di salvare.
                </Alert>
              )}

              {/* ========== CARRELLO ========== */}
              <Paper sx={{ p: 2, bgcolor: formData.prodotti.length > 0 ? '#e8f5e9' : '#fff3e0' }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  🛒 Carrello ({formData.prodotti.length})
                </Typography>
                
                {formData.prodotti.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Nessun prodotto aggiunto
                  </Typography>
                ) : (
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {formData.prodotti.map((p, idx) => (
                      <Box key={idx} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        py: 0.5,
                        borderBottom: '1px solid #eee'
                      }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {p.nome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.quantita} {p.unita || p.unitaMisura}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            €{(p.prezzo || 0).toFixed(2)}
                          </Typography>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                prodotti: formData.prodotti.filter((_, i) => i !== idx)
                              });
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
                
                {/* Totale */}
                {formData.prodotti.length > 0 && (
                  <Box sx={{ 
                    mt: 2, 
                    pt: 2, 
                    borderTop: '2px solid #4caf50',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="h6">TOTALE:</Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      €{calcolaTotale().toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* ========== NOTE (compatte) ========== */}
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="📝 Note ordine"
                placeholder="Note aggiuntive..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />

              {/* ========== OPZIONI EXTRA ========== */}
              <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  ⚙️ Opzioni Extra
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {/* Da Viaggio */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.daViaggio}
                        onChange={(e) => setFormData({ ...formData, daViaggio: e.target.checked })}
                        size="small"
                        color="warning"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        ✈️ Da Viaggio (sottovuoto)
                      </Typography>
                    }
                  />
                  
                  {/* Etichetta Ingredienti */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.ricordaEtichetta}
                        onChange={(e) => setFormData({ ...formData, ricordaEtichetta: e.target.checked })}
                        size="small"
                        color="info"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        🏷️ Ricorda Etichetta Ingredienti
                      </Typography>
                    }
                  />
                  
                  {/* Confezione Regalo */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.confezioneRegalo}
                        onChange={(e) => setFormData({ ...formData, confezioneRegalo: e.target.checked })}
                        size="small"
                        color="secondary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        🎁 Confezione Regalo
                      </Typography>
                    }
                  />

                  <Divider sx={{ my: 0.5 }} />

                  {/* Pagato */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.pagato}
                        onChange={(e) => {
                          const newPagato = e.target.checked;
                          setFormData({ 
                            ...formData, 
                            pagato: newPagato,
                            // Se pagato, disattiva acconto
                            acconto: newPagato ? false : formData.acconto,
                            importoAcconto: newPagato ? '' : formData.importoAcconto
                          });
                        }}
                        size="small"
                        color="success"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: formData.pagato ? 'bold' : 'normal', color: formData.pagato ? 'success.main' : 'inherit' }}>
                        💰 Pagato
                      </Typography>
                    }
                  />

                  {/* Acconto */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.acconto}
                        onChange={(e) => {
                          const newAcconto = e.target.checked;
                          setFormData({ 
                            ...formData, 
                            acconto: newAcconto,
                            // Se acconto, disattiva pagato
                            pagato: newAcconto ? false : formData.pagato,
                            importoAcconto: newAcconto ? formData.importoAcconto : ''
                          });
                        }}
                        size="small"
                        color="warning"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: formData.acconto ? 'bold' : 'normal', color: formData.acconto ? 'warning.main' : 'inherit' }}>
                        💳 Acconto
                      </Typography>
                    }
                  />

                  {/* Campo importo acconto - visibile solo se acconto è selezionato */}
                  {formData.acconto && (
                    <TextField
                      label="Importo Acconto"
                      value={formData.importoAcconto}
                      onChange={(e) => setFormData({ ...formData, importoAcconto: normalizzaDecimale(e.target.value) })}
                      size="small"
                      fullWidth
                      type="text"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                      }}
                      placeholder="Es: 20"
                      sx={{ ml: 4, mt: 0.5 }}
                    />
                  )}
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>

        {/* ========== BOTTONE SALVA FISSO IN BASSO ========== */}
        <Box sx={{ 
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'white',
          borderTop: '2px solid #e0e0e0',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          <Button 
            variant="contained" 
            onClick={handleSalva} 
            size="large"
            fullWidth
            color={alertLimiti.some(a => a.tipo === 'error') ? 'warning' : 'success'}
            sx={{ 
              py: 2, 
              fontSize: '1.2rem',
              fontWeight: 'bold',
              minHeight: '60px'  // ✅ Altezza minima per touch facile
            }}
          >
            {alertLimiti.some(a => a.tipo === 'error') ? '⚠️ SALVA (Supera Limiti)' : '✅ SALVA ORDINE'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>

    {/* ✅ FIX 19/02/2026: Dialog elegante conferma data ritiro = oggi */}
    <Dialog
      open={showConfermaDataOggi}
      onClose={() => setShowConfermaDataOggi(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 }
      }}
    >
      <Box sx={{ textAlign: 'center', pt: 3, pb: 1, px: 3 }}>
        <CalendarIcon sx={{ fontSize: 48, color: '#f59e0b', mb: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          Ritiro oggi?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          La data di ritiro è impostata a <strong>oggi ({new Date().toLocaleDateString('it-IT')})</strong>.
          Confermi?
        </Typography>
      </Box>
      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, px: 3 }}>
        <Button
          variant="outlined"
          onClick={() => setShowConfermaDataOggi(false)}
          sx={{ 
            minWidth: 130, 
            py: 1.2,
            borderRadius: 2,
            fontSize: '1rem'
          }}
        >
          Cambio data
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setShowConfermaDataOggi(false);
            eseguiSalvataggio();
          }}
          sx={{ 
            minWidth: 130, 
            py: 1.2,
            borderRadius: 2,
            fontSize: '1rem',
            bgcolor: '#f59e0b',
            '&:hover': { bgcolor: '#d97706' }
          }}
        >
          Sì, è oggi
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}