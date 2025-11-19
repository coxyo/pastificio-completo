// components/NuovoOrdine.js - ✅ CON CACHE OTTIMIZZATA E FIX PREZZO VARIANTI
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
  prodottoHaVarianti 
} from './VariantiProdotto';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

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
    nomeCliente: '',
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
  varianti: [], // ✅ NUOVO: Array varianti per nuovo sistema
  noteCottura: '' // ✅ NUOVO: Note cottura
});

  // ✅ STATI PER GESTIONE VASSOIO (AGGIUNTO 13/11/2025)
  const [modalitaVassoio, setModalitaVassoio] = useState(null);
  const [composizioneVassoio, setComposizioneVassoio] = useState([]);
  const [totaleVassoio, setTotaleVassoio] = useState(0);

 // ✅ NUOVO: States per panade e panadine
  const [opzioniPanada, setOpzioniPanada] = useState({
    aglio: 'con_aglio',
    contorno: 'con_patate'
  });
  const [numeroVassoi, setNumeroVassoi] = useState(1);
  const [gustiPanadine, setGustiPanadine] = useState([]);
  const [modalitaPanadine, setModalitaPanadine] = useState('rapida'); // 'rapida' o 'componi'
  const [panadineRapide, setPanadineRapide] = useState({ carne: 0, verdura: 0 });

  // ✅ CARICA PRODOTTI CON CACHE OTTIMIZZATA
  useEffect(() => {
    if (isConnected) {
      caricaProdotti();
    }
  }, [isConnected]);

  const caricaProdotti = async () => {
    // ✅ PROVA PRIMA DALLA CACHE LOCALSTORAGE
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

    // Se cache mancante/scaduta, carica da API
    try {
      setLoadingProdotti(true);
      console.log('🔄 Caricamento prodotti da API...');
      
      const response = await fetch(`${API_URL}/prodotti/disponibili`);

      if (response.ok) {
        const data = await response.json();
        const prodottiData = data.data || data || [];
        
        // Salva in cache
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

  // ✅ RAGGRUPPA PRODOTTI PER CATEGORIA (INCLUDI PARDULAS NEI DOLCI)
  const prodottiPerCategoria = useMemo(() => {
    const categorie = {
      Ravioli: [],
      Dolci: [],
      Panadas: [],
      Pasta: []
    };

    prodottiDB.forEach(prodotto => {
      const categoria = prodotto.categoria || 'Altro';
      
      if (categoria === 'Pardulas') {
        categorie.Dolci.push(prodotto);
      } else if (categorie[categoria]) {
        categorie[categoria].push(prodotto);
      }
    });

    return categorie;
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
    // ✅ PROVA PRIMA DALLA CACHE LOCALSTORAGE
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

    // Se cache mancante/scaduta, carica da API
    try {
      setLoadingClienti(true);
      console.log('🔄 Caricamento clienti da API...');
      
     // ✅ Ottieni token JWT
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
        
        // Salva in cache
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

  // ✅ NUOVO: Leggi dati chiamata da localStorage (PRIMA DI TUTTO!)
  useEffect(() => {
    console.log('🔍 [NuovoOrdine] Controllo chiamata da localStorage...');
    
    const chiamataData = localStorage.getItem('chiamataCliente');
    
    if (chiamataData) {
      try {
        const dati = JSON.parse(chiamataData);
        console.log('📞 [NuovoOrdine] Dati chiamata trovati:', dati);
        
        // ✅ PRECOMPILA SEMPRE IL TELEFONO
        if (dati.telefono) {
          setFormData(prev => ({
            ...prev,
            telefono: dati.telefono
          }));
          console.log('✅ Telefono precompilato:', dati.telefono);
        }
        
        // ✅ PRECOMPILA NOME SOLO SE CLIENTE TROVATO
        // I dati arrivano già con nome/cognome al primo livello
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
        
        // ✅ PULISCI SOLO DOPO AVER LETTO
        localStorage.removeItem('chiamataCliente');
        console.log('🧹 localStorage pulito');
        
      } catch (error) {
        console.error('❌ Errore parsing dati chiamata:', error);
        localStorage.removeItem('chiamataCliente');
      }
    } else {
      console.log('ℹ️ Nessuna chiamata in localStorage');
    }
  }, []); // ⚠️ Array vuoto = esegue solo al mount!

// ✅ NUOVO: Preseleziona cliente da chiamata
  useEffect(() => {
    if (clienteIdPreselezionato && clienti.length > 0) {
      const clienteTrovato = clienti.find(c => c._id === clienteIdPreselezionato);
      
      if (clienteTrovato) {
        setFormData(prev => ({
          ...prev,
          cliente: clienteTrovato,
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
        nomeCliente: `${cliente.nome} ${cliente.cognome || ''}`.trim(),
        telefono: cliente.telefono || ''
      });
    } else {
      setFormData({
        ...formData,
        cliente: null,
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

  const hasVarianti = prodottoConfig?.hasVarianti || false;
  const varianti = prodottoConfig?.varianti || [];

  const handleProdottoSelect = (prodotto) => {
  console.log('🎯 Prodotto selezionato:', prodotto.nome);
  
  setProdottoCorrente({
    nome: prodotto.nome,
    variante: '',
    quantita: '',
    unita: prodotto.unitaMisuraDisponibili?.[0] || 'Kg',
    prezzo: 0,
    varianti: [], // ✅ Reset varianti nuovo sistema
    noteCottura: '' // ✅ Reset note cottura
  });
};

  const handleVarianteChange = (event) => {
    setProdottoCorrente({
      ...prodottoCorrente,
      variante: event.target.value
    });
  };

  // ✅ NUOVO: Handler per nuovo sistema varianti
  const handleVariantiChange = (nuoveVarianti) => {
    console.log('🎨 Varianti aggiornate (nuovo sistema):', nuoveVarianti);
    setProdottoCorrente({
      ...prodottoCorrente,
      varianti: nuoveVarianti
    });
  };

  const handleValoreRapido = (valore) => {
    setProdottoCorrente({
      ...prodottoCorrente,
      quantita: valore
    });
  };

  // ✅ FIX CALCOLO PREZZO VARIANTI
  useEffect(() => {
    if (!prodottoCorrente.nome || !prodottoCorrente.quantita || prodottoCorrente.quantita <= 0) {
      setProdottoCorrente(prev => ({ ...prev, prezzo: 0 }));
      return;
    }

    try {
      const prodotto = getProdottoConfigDB(prodottoCorrente.nome);
      if (!prodotto) return;

      let prezzo = 0;
      
      // ✅ FIX: Gestione varianti CORRETTA
      if (prodotto.hasVarianti) {
        // Se il prodotto ha varianti MA non è stata selezionata ancora
        if (!prodottoCorrente.variante) {
          console.log('⚠️ Variante non selezionata per', prodotto.nome);
          setProdottoCorrente(prev => ({ ...prev, prezzo: 0 }));
          return;
        }
        
        // Trova la variante selezionata
        const varianteSelezionata = prodotto.varianti.find(v => v.nome === prodottoCorrente.variante);
        
        if (!varianteSelezionata) {
          console.error('❌ Variante non trovata:', prodottoCorrente.variante);
          setProdottoCorrente(prev => ({ ...prev, prezzo: 0 }));
          return;
        }
        
        // ✅ USA IL PREZZO DELLA VARIANTE SELEZIONATA
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
  }, [prodottoCorrente.nome, prodottoCorrente.variante, prodottoCorrente.quantita, prodottoCorrente.unita, prodottiDB]);


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
      noteCottura: ''
    });
    // ✅ NUOVO: Reset panade/panadine
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
        noteCottura: ''
      });
      return;
    }

    // ✅ MODALITÀ NORMALE: codice originale
    if (!prodottoCorrente.nome || !prodottoCorrente.quantita || prodottoCorrente.quantita <= 0) {
      alert('Seleziona un prodotto e inserisci una quantità valida');
      return;
    }

    // ✅ SISTEMA VECCHIO: Verifica varianti legacy (DB)
    if (hasVarianti && !prodottoCorrente.variante) {
      alert('Seleziona una variante');
      return;
    }

    // ✅ SISTEMA NUOVO: Genera nome con varianti configurate
    let nomeProdottoCompleto = prodottoCorrente.nome;
    
    if (prodottoCorrente.varianti && prodottoCorrente.varianti.length > 0) {
      nomeProdottoCompleto = generaNomeProdottoConVarianti(
        prodottoCorrente.nome,
        prodottoCorrente.varianti
      );
      console.log('✅ Nome con varianti (nuovo sistema):', nomeProdottoCompleto);
    } else if (prodottoCorrente.variante) {
      const variante = varianti.find(v => v.nome === prodottoCorrente.variante);
      nomeProdottoCompleto = variante?.label || `${prodottoCorrente.nome} ${prodottoCorrente.variante}`;
      console.log('✅ Nome con variante legacy:', nomeProdottoCompleto);
    }

    const nuovoProdotto = {
      nome: nomeProdottoCompleto,
      quantita: prodottoCorrente.quantita,
      unita: prodottoCorrente.unita,
      unitaMisura: prodottoCorrente.unita,
      prezzo: prodottoCorrente.prezzo,
      categoria: prodottoConfig?.categoria || 'Altro',
      variante: prodottoCorrente.variante,
      varianti: prodottoCorrente.varianti,
      noteCottura: prodottoCorrente.noteCottura
    };

    console.log('➕ Prodotto aggiunto al carrello:', nuovoProdotto);

    setFormData({
      ...formData,
      prodotti: [...formData.prodotti, nuovoProdotto]
    });

    setProdottoCorrente({
      nome: '',
      variante: '',
      quantita: '',
      unita: 'Kg',
      prezzo: 0,
      varianti: [],
      noteCottura: ''
    });
  };

  const handleRimuoviProdotto = (index) => {
    setFormData({
      ...formData,
      prodotti: formData.prodotti.filter((_, i) => i !== index)
    });
  };

  const aggiungiVassoioAlCarrello = (vassoio) => {
  console.log('🎂 Vassoio ricevuto:', vassoio);
  
  // ✅ GESTISCI SIA OGGETTO CHE ARRAY
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

  // ✅ HANDLER CONFERMA VASSOIO (AGGIUNTO 13/11/2025)
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

  // ✅ HANDLER ANNULLA VASSOIO (AGGIUNTO 13/11/2025)
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

  // ✅ Verifica limiti PRIMA di salvare CON FORCE OVERRIDE
  const handleSalva = async () => {
    if (!formData.nomeCliente || !formData.dataRitiro || !formData.oraRitiro || formData.prodotti.length === 0) {
      alert('Compila tutti i campi obbligatori: cliente, data ritiro, ora ritiro e almeno un prodotto');
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

                  {/* ✅ NUOVO: Componente VariantiProdotto (sistema configurato) */}
                  {prodottoHaVarianti(prodottoCorrente.nome) && (
                    <Box sx={{ my: 2 }}>
                      <VariantiProdotto
                        prodotto={prodottoCorrente.nome}
                        value={prodottoCorrente.varianti}
                        onChange={handleVariantiChange}
                      />
                    </Box>
                  )}

                  <Grid container spacing={2} sx={{ mt: 1 }}>
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
                          {(prodottoConfig?.unitaMisuraDisponibili || ['Kg']).map((u) => (
                            <MenuItem key={u} value={u}>{u}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* ✅ NUOVO: Campo Note Cottura */}
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

                    {/* ✅ NUOVO: Opzioni Panade (Aglio + Contorno) */}
                    {PRODOTTI_CONFIG[prodottoCorrente.nome]?.opzioniAggiuntive && (
                      <Grid item xs={12}>
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            🥘 Opzioni Panada
                          </Typography>
                          
                          <Grid container spacing={2}>
                            {/* Aglio */}
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
                            
                            {/* Contorno */}
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
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            {/* Numero Vassoi */}
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

                    {/* ✅ NUOVO: Gusti Panadine */}
                    {PRODOTTI_CONFIG[prodottoCorrente.nome]?.gustiPanadine && (
                      <Grid item xs={12}>
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            🥟 Gusti Panadine
                          </Typography>
                          
                          {/* Toggle modalità */}
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
                          
                          {/* Modalità Rapida */}
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
                          
                          {/* Modalità Componi */}
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
                                📦 Variante: {p.variante}
                              </Typography>
                            )}
                            {p.noteCottura && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                🔥 {p.noteCottura}
                              </Typography>
                            )}
                            {p.dettagliCalcolo?.dettagli && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {p.dettagliCalcolo.dettagli}
                              </Typography>
                            )}
                            {p.dettagliCalcolo?.composizione && (
                              <Typography variant="caption" color="primary" display="block">
                                🎂 Vassoio: {p.dettagliCalcolo.composizione.length} prodotti
                              </Typography>
                            )}
                            {p.note && (
                              <Typography variant="caption" color="warning.main" display="block">
                                📝 {p.note}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {p.quantita} {p.unita}
                        </TableCell>
                        <TableCell align="right">€{p.prezzo.toFixed(2)}</TableCell>
                        <TableCell align="center">
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
    prodottiDisponibili={prodottiDB}
    onAggiungiAlCarrello={aggiungiVassoioAlCarrello}
    onClose={() => setTabValue(0)}
  />
)}

        {/* SEZIONI COMUNI */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          
          {/* SEZIONE CLIENTE */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon /> Dati Cliente
            </Typography>
            
            <Autocomplete
              options={clienti}
              getOptionLabel={(option) => 
                `${option.nome} ${option.cognome || ''} - ${option.telefono}`.trim()
              }
              value={formData.cliente}
              onChange={handleClienteChange}
              loading={loadingClienti}
              loadingText="Caricamento clienti..."
              noOptionsText={loadingClienti ? "Caricamento..." : "Nessun cliente trovato"}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente *"
                  placeholder="Cerca cliente esistente"
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

            {!formData.cliente && (
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  label="Nome Cliente *"
                  value={formData.nomeCliente}
                  onChange={(e) => setFormData({ ...formData, nomeCliente: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </Box>
            )}
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
