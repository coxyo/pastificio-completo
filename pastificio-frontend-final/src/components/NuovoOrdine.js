// components/NuovoOrdine.js - ✅ CON CHECKBOX MULTIPLE PER RAVIOLI + OPZIONI EXTRA
// ✅ AGGIORNATO 19/11/2025: Opzioni extra (più piccoli, più grandi, etc.) vanno automaticamente in noteCottura
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
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  LinearProgress
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
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { calcolaPrezzoOrdine, formattaPrezzo } from '../utils/calcoliPrezzi';
import { PRODOTTI_CONFIG } from '../config/prodottiConfig';
import VassoidDolciMisti from './VassoidDolciMisti_FINALE';
import VariantiProdotto, { 
  generaNomeProdottoConVarianti,
  prodottoHaVarianti,
  CONFIGURAZIONE_VARIANTI  // ✅ NUOVO: Per opzioni extra
} from './VariantiProdotto';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

// ✅ CACHE GLOBALE - NON MODIFICARE
let clientiCache = null;
let clientiCacheTime = null;
let prodottiCache = null;
let prodottiCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

// ✅ VALORI PREIMPOSTATI PER GRIGLIA RAPIDA
const VALORI_RAPIDI = {
  Kg: [0.5, 0.7, 1, 1.5, 2, 2.5, 3],
  Pezzi: [4, 6, 8, 12, 16, 24, 50],
  '€': [5, 10, 15, 20, 25, 30]
};

// ✅ NUOVO: Dimensioni vassoi disponibili
const DIMENSIONI_VASSOIO = ['2', '3', '4', '4.5', '5', '6', '7', '8'];

export default function NuovoOrdine({ 
  open, 
  onClose, 
  onSave, 
  ordineIniziale = null,
clienteIdPreselezionato,
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
    daViaggio: false
  });

  const [prodottoCorrente, setProdottoCorrente] = useState({
  nome: '',
  variante: '',
  quantita: '',
  unita: 'Kg',
  prezzo: 0,
  varianti: [], // ✅ Array varianti per nuovo sistema checkbox
  opzioniExtra: [], // ✅ NUOVO: Array opzioni extra (più piccoli, più grandi, etc.)
  noteCottura: ''
});

  // ✅ STATI PER GESTIONE VASSOIO
  const [modalitaVassoio, setModalitaVassoio] = useState(null);
  const [composizioneVassoio, setComposizioneVassoio] = useState([]);
  const [totaleVassoio, setTotaleVassoio] = useState(0);

 // ✅ States per panade e panadine
  const [opzioniPanada, setOpzioniPanada] = useState({
    aglio: 'con_aglio',
    contorno: 'con_patate'
  });
  const [numeroVassoi, setNumeroVassoi] = useState(1);
  const [gustiPanadine, setGustiPanadine] = useState([]);
  const [modalitaPanadine, setModalitaPanadine] = useState('rapida');
  const [panadineRapide, setPanadineRapide] = useState({ carne: 0, verdura: 0 });

  // ✅ NUOVO: States per vassoi multipli e dimensione vassoio
  const [numeroVassoiProdotto, setNumeroVassoiProdotto] = useState(1);
  const [dimensioneVassoio, setDimensioneVassoio] = useState('');

  // ✅ CARICA PRODOTTI CON CACHE OTTIMIZZATA
  useEffect(() => {
    if (isConnected) {
      caricaProdotti();
    }
  }, [isConnected]);

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
      setFormData({
        cliente: ordineIniziale.cliente || null,
        nomeCliente: ordineIniziale.nomeCliente || '',
        telefono: ordineIniziale.telefono || '',
        dataRitiro: ordineIniziale.dataRitiro?.split('T')[0] || new Date().toISOString().split('T')[0],
        oraRitiro: ordineIniziale.oraRitiro || '',
        prodotti: ordineIniziale.prodotti || [],
        note: ordineIniziale.note || '',
        daViaggio: ordineIniziale.daViaggio || false
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
        daViaggio: false
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

  // ✅ Leggi dati chiamata da localStorage
  useEffect(() => {
    console.log('🔍 [NuovoOrdine] Controllo chiamata da localStorage...');
    
    const chiamataData = localStorage.getItem('chiamataCliente');
    
    if (chiamataData) {
      try {
        const dati = JSON.parse(chiamataData);
        console.log('📞 [NuovoOrdine] Dati chiamata trovati:', dati);
        
        if (dati.telefono) {
          setFormData(prev => ({
            ...prev,
            telefono: dati.telefono
          }));
          console.log('✅ Telefono precompilato:', dati.telefono);
        }
        
        if (dati.nome) {
          const nomeCompleto = `${dati.nome || ''} ${dati.cognome || ''}`.trim();
          setFormData(prev => ({
            ...prev,
            nomeCliente: nomeCompleto
          }));
          console.log('✅ Nome precompilato:', nomeCompleto);
        } else {
          console.log('ℹ️ Cliente sconosciuto, solo telefono precompilato');
        }
        
        localStorage.removeItem('chiamataCliente');
        console.log('🧹 localStorage pulito');
        
      } catch (error) {
        console.error('❌ Errore parsing dati chiamata:', error);
        localStorage.removeItem('chiamataCliente');
      }
    } else {
      console.log('ℹ️ Nessuna chiamata in localStorage');
    }
  }, []);

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
    } else {
      setFormData({
        ...formData,
        cliente: null,
        nome: '',
        cognome: '',
        nomeCliente: '',
        telefono: ''
      });
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
      noteCottura: ''
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
      noteCottura: ''
    });
    setOpzioniPanada({ aglio: 'con_aglio', contorno: 'con_patate' });
    setNumeroVassoi(1);
    setGustiPanadine([]);
    setModalitaPanadine('rapida');
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
        noteCottura: ''
      });
      return;
    }

    // ✅ GESTIONE SPECIALE PANADINE CON GUSTI
    const configProdotto = PRODOTTI_CONFIG[prodottoCorrente.nome];
    
    if (configProdotto?.gustiPanadine) {
      let totaleQuantita = 0;
      let dettagliGusti = [];
      
      if (modalitaPanadine === 'rapida') {
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
        categoria: 'Panadas',
        note: dettagliGusti.join(', '),
        dettagliCalcolo: {
          gusti: modalitaPanadine === 'rapida' ? panadineRapide : gustiPanadine,
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
        noteCottura: ''
      });
      setOpzioniPanada({ aglio: 'con_aglio', contorno: 'con_patate' });
      setNumeroVassoi(1);
      setGustiPanadine([]);
      setModalitaPanadine('rapida');
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
      const contornoLabel = opzioniPanada.contorno === 'con_patate' ? 'con patate' : 
                           opzioniPanada.contorno === 'con_piselli' ? 'con piselli' : 'con patate e piselli';
      
      let nomeCompleto = `${prodottoCorrente.nome} (${contornoLabel})`;
      if (aglioNote) {
        nomeCompleto = `${prodottoCorrente.nome} (${aglioNote}, ${contornoLabel})`;
      }
      
      const nuoviProdotti = [];
      for (let i = 0; i < numeroVassoi; i++) {
        nuoviProdotti.push({
          nome: nomeCompleto,
          quantita: prodottoCorrente.quantita,
          unita: prodottoCorrente.unita,
          unitaMisura: prodottoCorrente.unita,
          prezzo: prodottoCorrente.prezzo,
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
        noteCottura: ''
      });
      setOpzioniPanada({ aglio: 'con_aglio', contorno: 'con_patate' });
      setNumeroVassoi(1);
      setGustiPanadine([]);
      setModalitaPanadine('rapida');
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

    // ✅ NUOVO: Combina noteCottura esistenti con opzioni extra
    let noteCotturaCombinate = prodottoCorrente.noteCottura || '';
    
    if (prodottoCorrente.opzioniExtra && prodottoCorrente.opzioniExtra.length > 0) {
      const opzioniExtraStr = prodottoCorrente.opzioniExtra.join(', ');
      console.log('📝 Opzioni extra da aggiungere alle note:', opzioniExtraStr);
      
      if (noteCotturaCombinate) {
        noteCotturaCombinate = `${noteCotturaCombinate}, ${opzioniExtraStr}`;
      } else {
        noteCotturaCombinate = opzioniExtraStr;
      }
    }
    
    // ✅ NUOVO: Aggiungi dimensione vassoio alle note se selezionata
    console.log('🔍 DEBUG dimensioneVassoio:', dimensioneVassoio, 'tipo:', typeof dimensioneVassoio);
    if (dimensioneVassoio) {
      const dimensioneNote = `Vassoio nr ${dimensioneVassoio}`;
      if (noteCotturaCombinate) {
        noteCotturaCombinate = `${noteCotturaCombinate}, ${dimensioneNote}`;
      } else {
        noteCotturaCombinate = dimensioneNote;
      }
      console.log('📦 Dimensione vassoio aggiunta alle note:', dimensioneNote);
    }

    // ✅ NUOVO: Crea più prodotti se numeroVassoiProdotto > 1
    const nuoviProdotti = [];
    for (let i = 0; i < numeroVassoiProdotto; i++) {
      nuoviProdotti.push({
        nome: nomeProdottoCompleto,
        quantita: prodottoCorrente.quantita,
        unita: prodottoCorrente.unita,
        unitaMisura: prodottoCorrente.unita,
        prezzo: prodottoCorrente.prezzo,
        categoria: prodottoConfig?.categoria || 'Altro',
        variante: prodottoCorrente.variante,
        varianti: prodottoCorrente.varianti,
        noteCottura: noteCotturaCombinate
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
      noteCottura: ''
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

  // ✅ FIX 20/12/2025 v3: Funzione per MODIFICARE un prodotto nel carrello
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
      noteCottura: prodottoDaModificare.noteCottura || ''
    });
    
    // 4. Aggiorna il carrello senza il prodotto
    setFormData({
      ...formData,
      prodotti: nuoviProdotti
    });
    
    // 5. Torna al tab "Prodotti Singoli"
    setTabValue(0);
    
    console.log('✅ Prodotto caricato nel form per modifica');
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

    const ordineData = {
      ...formData,
      nomeCliente: nomeClienteCompleto,  // ✅ Usa nome completo calcolato
      cliente: formData.cliente?._id || null,
      totale: calcolaTotale(),
      daViaggio: formData.daViaggio,
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {ordineIniziale ? 'Modifica Ordine' : 'Nuovo Ordine'}
      </DialogTitle>

      <DialogContent>
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
            
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
                        type="number"
                        label="Quantità"
                        placeholder="0"
                        value={prodottoCorrente.quantita}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setProdottoCorrente({ ...prodottoCorrente, quantita: '' });
                            return;
                          }
                          const parsedValue = prodottoCorrente.unita === 'Kg' 
                            ? parseFloat(value) || 0
                            : parseInt(value) || 0;
                          setProdottoCorrente({ ...prodottoCorrente, quantita: parsedValue });
                        }}
                        inputProps={{ 
                          min: prodottoCorrente.unita === 'Kg' ? 0.1 : 1,
                          step: prodottoCorrente.unita === 'Kg' ? 0.1 : 1,
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

                    {/* Campo Note Cottura */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Note Cottura"
                        placeholder="Es: ben cotte, poco dorate..."
                        value={prodottoCorrente.noteCottura}
                        onChange={(e) => setProdottoCorrente({ 
                          ...prodottoCorrente, 
                          noteCottura: e.target.value 
                        })}
                        size="small"
                      />
                    </Grid>

                    {/* ✅ NUOVO: Numero Vassoi Uguali */}
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Nr vassoi uguali"
                        value={numeroVassoiProdotto}
                        onChange={(e) => setNumeroVassoiProdotto(Math.max(1, parseInt(e.target.value) || 1))}
                        size="small"
                        inputProps={{ min: 1 }}
                      />
                    </Grid>

                    {/* ✅ NUOVO: Dimensione Vassoio */}
                    <Grid item xs={6} sm={3}>
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
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
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

                    {/* Opzioni Panade (Aglio + Contorno) */}
                    {PRODOTTI_CONFIG[prodottoCorrente.nome]?.opzioniAggiuntive && (
                      <Grid item xs={12}>
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            🥘 Opzioni Panada
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
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
                            
                            <Grid item xs={6}>
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
                          
                          <Box sx={{ mb: 2 }}>
                            <Button
                              variant={modalitaPanadine === 'rapida' ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => setModalitaPanadine('rapida')}
                              sx={{ mr: 1 }}
                            >
                              Scelta Rapida
                            </Button>
                            <Button
                              variant={modalitaPanadine === 'componi' ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => setModalitaPanadine('componi')}
                            >
                              Componi
                            </Button>
                          </Box>
                          
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
                            {p.noteCottura && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                🔥 {String(p.noteCottura)}
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

        {/* SEZIONI COMUNI */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          
          {/* SEZIONE CLIENTE - ✅ CON NOME E COGNOME SEPARATI */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon /> Dati Cliente
            </Typography>
            
            <Grid container spacing={2}>
              {/* ✅ CAMPO NOME con Autocomplete */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  options={clienti}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.nome || '';
                  }}
                  filterOptions={(options, { inputValue }) => {
                    const input = inputValue.toLowerCase().trim();
                    if (!input) return [];
                    return options.filter(opt => {
                      const nome = (opt.nome || '').toLowerCase();
                      const cognome = (opt.cognome || '').toLowerCase();
                      const nomeCompleto = `${nome} ${cognome}`;
                      const cognomeNome = `${cognome} ${nome}`;
                      const telefono = (opt.telefono || '').toLowerCase();
                      return nome.includes(input) || 
                             cognome.includes(input) || 
                             nomeCompleto.includes(input) ||
                             cognomeNome.includes(input) ||
                             telefono.includes(input);
                    }).slice(0, 10);
                  }}
                  value={formData.cliente || formData.nome}
                  inputValue={formData.nome}
                  onInputChange={(event, newInputValue) => {
                    setFormData(prev => ({
                      ...prev,
                      nome: newInputValue,
                      nomeCliente: `${newInputValue} ${prev.cognome || ''}`.trim(),
                      cliente: null
                    }));
                  }}
                  onChange={(event, newValue) => {
                    if (newValue && typeof newValue === 'object') {
                      setFormData(prev => ({
                        ...prev,
                        cliente: newValue,
                        nome: newValue.nome || '',
                        cognome: newValue.cognome || '',
                        nomeCliente: `${newValue.nome} ${newValue.cognome || ''}`.trim(),
                        telefono: newValue.telefono || ''
                      }));
                    } else if (typeof newValue === 'string') {
                      setFormData(prev => ({
                        ...prev,
                        cliente: null,
                        nome: newValue,
                        nomeCliente: `${newValue} ${prev.cognome || ''}`.trim()
                      }));
                    }
                  }}
                  loading={loadingClienti}
                  renderOption={(props, option) => (
                    <li {...props} key={option._id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1" fontWeight="bold">
                          {option.nome} {option.cognome || ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📞 {option.telefono || 'N/D'} 
                          {option.codiceCliente && ` • ${option.codiceCliente}`}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Nome *"
                      placeholder="Cerca o inserisci nome..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingClienti ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* ✅ CAMPO COGNOME */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cognome"
                  placeholder="Inserisci cognome..."
                  value={formData.cognome}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    cognome: e.target.value,
                    nomeCliente: `${prev.nome || ''} ${e.target.value}`.trim(),
                    cliente: null
                  }))}
                  disabled={formData.cliente !== null}
                  helperText={formData.cliente ? "Cognome da anagrafica" : ""}
                />
              </Grid>

              {/* ✅ INDICATORE CLIENTE ESISTENTE */}
              {formData.cliente && (
                <Grid item xs={12}>
                  <Alert 
                    severity="success" 
                    sx={{ py: 0.5 }}
                    action={
                      <Button 
                        size="small" 
                        color="inherit"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          cliente: null
                        }))}
                      >
                        Modifica
                      </Button>
                    }
                  >
                    <Typography variant="body2">
                      ✅ <strong>{formData.nome} {formData.cognome}</strong> - Cliente esistente
                      {formData.cliente.codiceCliente && ` (${formData.cliente.codiceCliente})`}
                      {formData.cliente.livelloFedelta && ` • ${formData.cliente.livelloFedelta}`}
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {/* ✅ CAMPO TELEFONO */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Telefono"
                  placeholder="Es: 3331234567"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  disabled={formData.cliente !== null}
                  helperText={formData.cliente ? "Telefono da anagrafica" : "Opzionale"}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Data e Ora */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>📅 Data e Ora Ritiro</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Data Ritiro *"
                value={formData.dataRitiro}
                onChange={(e) => setFormData({ ...formData, dataRitiro: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="time"
                label="Ora Ritiro *"
                value={formData.oraRitiro}
                onChange={(e) => setFormData({ ...formData, oraRitiro: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Paper>

          {/* Note */}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Note"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />

          {/* Switch Da Viaggio */}
          <Paper sx={{ p: 2, bgcolor: formData.daViaggio ? 'warning.light' : 'grey.100' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.daViaggio}
                  onChange={(e) => setFormData({ ...formData, daViaggio: e.target.checked })}
                  color="warning"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LuggageIcon />
                  <Typography variant="body1" fontWeight="bold">
                    Ordine Da Viaggio (sottovuoto)
                  </Typography>
                </Box>
              }
            />
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button 
          variant="contained" 
          onClick={handleSalva} 
          size="large"
          color={alertLimiti.some(a => a.tipo === 'error') ? 'warning' : 'primary'}
        >
          {alertLimiti.some(a => a.tipo === 'error') ? '⚠️ Salva (Supera Limiti)' : 'Salva Ordine'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}