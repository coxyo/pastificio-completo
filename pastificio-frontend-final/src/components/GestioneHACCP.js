// components/GestioneHACCP.js
// ✅ VERSIONE COMPLETA CON TUTTE LE SCHEDE DEL MANUALE HACCP
// Pastificio Nonna Claudia di Mameli Maurizio

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  LinearProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Tooltip,
  Badge,
  Snackbar
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import axios from 'axios';
import HACCPAutoPopup from './HACCPAutoPopup';  // ✅ NUOVO 23/01/2026
import PuliziaAutoPopup from './PuliziaAutoPopup';  // ✅ NUOVO 27/01/2026
import StampaHACCP from './StampaHACCP';
import Rintracciabilita from './Rintracciabilita';  // ✅ NUOVO 07/02/2026 - Rintracciabilità lotti

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================
// DATI STATICI DAL MANUALE HACCP
// ============================================

// Prodotti con allergeni (dal manuale sezione 5.1)
const PRODOTTI_ALLERGENI = [
  { nome: 'Pardulas', glutine: true, uova: true, latte: true, fruttaGuscio: false, solfiti: false, pesce: false },
  { nome: 'Amaretti', glutine: false, uova: true, latte: false, fruttaGuscio: true, solfiti: false, pesce: false },
  { nome: 'Pistoccheddus', glutine: true, uova: true, latte: true, fruttaGuscio: false, solfiti: false, pesce: false },
  { nome: 'Gueffus', glutine: false, uova: false, latte: false, fruttaGuscio: true, solfiti: false, pesce: false },
  { nome: 'Pabassinas', glutine: true, uova: true, latte: true, fruttaGuscio: true, solfiti: true, pesce: false },
  { nome: 'Fregola', glutine: true, uova: true, latte: false, fruttaGuscio: false, solfiti: false, pesce: false },
  { nome: 'Ravioli di ricotta', glutine: true, uova: true, latte: true, fruttaGuscio: false, solfiti: false, pesce: false },
  { nome: 'Culurgiones di patate', glutine: true, uova: true, latte: true, fruttaGuscio: false, solfiti: false, pesce: false },
  { nome: 'Ciambelle', glutine: true, uova: true, latte: false, fruttaGuscio: false, solfiti: false, pesce: false },
  { nome: 'Bianchini', glutine: false, uova: true, latte: false, fruttaGuscio: true, solfiti: false, pesce: false },
  { nome: 'Tzipulas (Zeppole)', glutine: true, uova: true, latte: true, fruttaGuscio: false, solfiti: false, pesce: false },
  { nome: 'Panadas di anguille', glutine: true, uova: false, latte: false, fruttaGuscio: false, solfiti: false, pesce: true },
  { nome: 'Panadas di carne', glutine: true, uova: false, latte: false, fruttaGuscio: false, solfiti: false, pesce: false },
  { nome: 'Panadas di verdura', glutine: true, uova: false, latte: false, fruttaGuscio: false, solfiti: false, pesce: false },
  { nome: 'Torta di sapa', glutine: true, uova: false, latte: false, fruttaGuscio: true, solfiti: true, pesce: false },
];

// Temperature e tempi di cottura (dal manuale sezione 8.2)
const COTTURE_PRODOTTI = [
  { prodotto: 'Pardulas', temperatura: 180, tempo: '30 minuti' },
  { prodotto: 'Amaretti', temperatura: 180, tempo: '17 minuti' },
  { prodotto: 'Pistoccheddus', temperatura: 170, tempo: '15-20 minuti' },
  { prodotto: 'Panadas', temperatura: 180, tempo: '60-90 minuti' },
  { prodotto: 'Pabassinas', temperatura: 180, tempo: '12 minuti' },
  { prodotto: 'Ciambelle', temperatura: 180, tempo: '17 minuti' },
  { prodotto: 'Tzipulas', temperatura: 170, tempo: '3-4 minuti (frittura)' },
  { prodotto: 'Torta di sapa', temperatura: 180, tempo: '35 minuti' },
  { prodotto: 'Bianchini', temperatura: 120, tempo: '12 ore (forno spento)' },
];

// CCP dal manuale (sezione 3.2)
const CCP_LIST = [
  { id: 'CCP1', fase: 'Ricevimento materie prime', pericolo: 'Temperatura elevata', limite: 'T ≤ 4°C', monitoraggio: 'Controllo temperatura', azione: 'Rifiuto merce' },
  { id: 'CCP2', fase: 'Stoccaggio refrigerato', pericolo: 'Temperatura elevata', limite: 'T ≤ 4°C', monitoraggio: '1 volta/settimana', azione: 'Verifica frigoriferi' },
  { id: 'CCP3', fase: 'Cottura', pericolo: 'Temperatura insufficiente', limite: 'T ≥ 75°C al cuore', monitoraggio: 'Termometro sonda', azione: 'Prolungare cottura' },
  { id: 'CCP4', fase: 'Abbattimento', pericolo: 'Raffreddamento insufficiente', limite: '60°C→10°C in 2h', monitoraggio: 'Temp e tempo', azione: 'Prolungare abbattimento' },
  { id: 'CCP5', fase: 'Conservazione prodotti finiti', pericolo: 'Temperatura elevata', limite: 'T ≤ 4°C', monitoraggio: '1 volta/settimana', azione: 'Verifica prodotti' },
];

// Fornitori qualificati (dal manuale sezione 7.1)
const FORNITORI = [
  { nome: 'Formaggi Valdes di Vittorio Valdes', prodotto: 'Ricotta fresca, Formaggio fresco', indirizzo: 'Via Cavour 21, 09034 Villasor (CA)' },
  { nome: 'Elledi Srl', prodotto: 'Farina, Semola, Strutto, Margarina, Marmellate, Olio, Lievito', indirizzo: 'Via Edison SNC, 09047 Selargius (CA)' },
  { nome: 'Branca Giovanni', prodotto: 'Uova fresche', indirizzo: 'Loc. S\'acqua bella, 09068 Uta (CA)' },
  { nome: 'Antiche Bontà di Pistis Giuliano', prodotto: 'Fregola', indirizzo: 'Via Amsicora 9, 09034 Villasor (SU)' },
  { nome: 'Macelleria Piras Roberto', prodotto: 'Carni', indirizzo: 'Via Sardegna 36, Assemini' },
  { nome: 'Dal Pescatore di Marco Prefumo', prodotto: 'Anguille', indirizzo: 'Via Gorizia 47, Assemini' },
];

// Aree pulizia (dal manuale sezione 10.1)
const AREE_PULIZIA = [
  { area: 'Superfici di lavoro', frequenza: 'Giornaliera', prodotto: 'Detergente + Sanificante' },
  { area: 'Pavimenti', frequenza: 'Giornaliera', prodotto: 'Detergente + Sanificante' },
  { area: 'Pareti', frequenza: 'Settimanale', prodotto: 'Detergente + Sanificante' },
  { area: 'Attrezzature', frequenza: 'Dopo ogni uso', prodotto: 'Detergente + Sanificante' },
  { area: 'Frigoriferi', frequenza: 'Settimanale', prodotto: 'Detergente + Sanificante' },
  { area: 'Abbattitore', frequenza: 'Dopo ogni uso', prodotto: 'Detergente + Sanificante' },
  { area: 'Servizi igienici', frequenza: 'Giornaliera', prodotto: 'Detergente + Sanificante' },
];

// Dispositivi temperatura
const DISPOSITIVI_TEMPERATURA = [
  { id: 'frigo1', nome: 'Frigorifero 1 (Principale)', tipo: 'temperatura_frigo', limiteMin: 0, limiteMax: 4 },
  { id: 'frigo2', nome: 'Frigorifero 2', tipo: 'temperatura_frigo', limiteMin: 0, limiteMax: 4 },
  { id: 'frigo3', nome: 'Frigorifero 3', tipo: 'temperatura_frigo', limiteMin: 0, limiteMax: 4 },
  { id: 'congelatore', nome: 'Congelatore Principale', tipo: 'temperatura_congelatore', limiteMin: -25, limiteMax: -18 },
  { id: 'abbattitore', nome: 'Abbattitore', tipo: 'abbattitore', limiteMin: null, limiteMax: 10 },
];

// ============================================
// COMPONENTE PRINCIPALE
// ============================================

export default function GestioneHACCP() {
  // State principale
  const [tabCorrente, setTabCorrente] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [testHACCPPopupOpen, setTestHACCPPopupOpen] = useState(false);  // ✅ NUOVO 23/01/2026
  const [testPuliziaPopupOpen, setTestPuliziaPopupOpen] = useState(false);  // ✅ NUOVO 27/01/2026
  
  // Dati dal backend
  const [dashboard, setDashboard] = useState(null);
  const [registrazioni, setRegistrazioni] = useState([]);
  const [nonConformita, setNonConformita] = useState([]);
  
  // Stati paginazione e filtri temperature
  const [paginaTemperature, setPaginaTemperature] = useState(0);
  const [righePerPagina, setRighePerPagina] = useState(50);
  const [filtroDaData, setFiltroDaData] = useState('');
  const [filtroAData, setFiltroAData] = useState('');
  
  // Dialog states
  const [dialogTemperatura, setDialogTemperatura] = useState(false);
  const [dialogPulizia, setDialogPulizia] = useState(false);
  const [dialogAbbattimento, setDialogAbbattimento] = useState(false);
  const [dialogMateriePrime, setDialogMateriePrime] = useState(false);
  const [dialogNonConformita, setDialogNonConformita] = useState(false);
  
  // Form states
  const [formTemperatura, setFormTemperatura] = useState({
    dispositivo: 'frigo1',
    temperatura: '',
    note: ''
  });
  
  const [formPulizia, setFormPulizia] = useState({
    aree: {},
    operatore: 'Maurizio Mameli',
    note: ''
  });
  
  const [formAbbattimento, setFormAbbattimento] = useState({
    prodotto: '',
    lotto: '',
    oraInizio: '',
    oraFine: '',
    tempIniziale: '',
    tempFinale: '',
    note: ''
  });
  
  const [formMateriePrime, setFormMateriePrime] = useState({
    fornitore: '',
    prodotto: '',
    lotto: '',
    dataScadenza: '',
    temperatura: '',
    conforme: true,
    note: ''
  });
  
  const [formNonConformita, setFormNonConformita] = useState({
    tipo: '',
    descrizione: '',
    azioneCorrettiva: '',
    responsabile: 'Maurizio Mameli'
  });

  // ============================================
  // EFFETTI
  // ============================================
  
  useEffect(() => {
    caricaDashboard();
  }, []);

  // ============================================
  // ✨ POPUP AUTOMATICO MARTEDÌ ORE 9:00
  // ============================================
  useEffect(() => {
    const checkAutoPopup = () => {
      const ora = new Date();
      const giornoSettimana = ora.getDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mer, 4=Gio, 5=Ven, 6=Sab
      const ore = ora.getHours();
      const minuti = ora.getMinutes();
      
      console.log(`🕐 [HACCP Auto] Controllo automatico: ${["Domenica","Lunedi","Martedi","Mercoledi","Giovedi","Venerdi","Sabato"][giornoSettimana]} ore ${ore}:${minuti.toString().padStart(2,'0')}`);
      
      // ✅ Verifica: Martedì (2) e ore 9:00-9:59
      if (giornoSettimana === 2 && ore === 9) {
        console.log('✅ [HACCP Auto] È Martedì ore 9! Verifico se già mostrato oggi...');
        
        // Verifica se già aperto oggi (per evitare loop)
        const ultimoShow = localStorage.getItem('haccp_last_popup_show');
        const oggi = new Date().toISOString().split('T')[0];
        
        if (ultimoShow === oggi) {
          console.log('ℹ️ [HACCP Auto] Popup già mostrato oggi, skip');
          return;
        }
        
        console.log('🌡️ [HACCP Auto] Apro popup automaticamente!');
        
        // Salva data show per evitare duplicati
        localStorage.setItem('haccp_last_popup_show', oggi);
        
        // Apri popup
        setTestHACCPPopupOpen(true);
      } else {
        console.log(`ℹ️ [HACCP Auto] Condizioni non soddisfatte (Giorno: ${giornoSettimana}, Ora: ${ore})`);
      }
    };
    
    // Check immediato all'avvio del componente
    checkAutoPopup();
    
    // Check ogni 5 minuti (per sicurezza se la pagina resta aperta)
    const interval = setInterval(checkAutoPopup, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []); // Esegui solo al mount del componente - TEMPERATURE MARTEDÌ

  // ============================================
  // ✨ POPUP AUTOMATICO PULIZIE
  // Giornaliero: Lun-Sab ore 18:00
  // Settimanale: Domenica ore 10:00
  // ============================================
  useEffect(() => {
    const checkAutoPuliziaPopup = () => {
      const ora = new Date();
      const giornoSettimana = ora.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
      const ore = ora.getHours();
      const minuti = ora.getMinutes();
      
      console.log(`🧹 [Pulizia Auto] Controllo automatico: ${["Domenica","Lunedi","Martedi","Mercoledi","Giovedi","Venerdi","Sabato"][giornoSettimana]} ore ${ore}:${minuti.toString().padStart(2,'0')}`);
      
      let shouldShow = false;
      let tipoPulizia = 'giornaliera';
      
      // ✅ PULIZIE SETTIMANALI: Domenica ore 10:00-10:59
      if (giornoSettimana === 0 && ore === 10) {
        console.log('✅ [Pulizia Auto] È Domenica ore 10! Pulizie SETTIMANALI');
        shouldShow = true;
        tipoPulizia = 'settimanale';
      }
      // ✅ PULIZIE GIORNALIERE: Lun-Sab ore 18:00-18:59
      else if (giornoSettimana >= 1 && giornoSettimana <= 6 && ore === 18) {
        console.log('✅ [Pulizia Auto] Ore 18 giorni lavorativi! Pulizie GIORNALIERE');
        shouldShow = true;
        tipoPulizia = 'giornaliera';
      }
      
      if (!shouldShow) {
        console.log(`ℹ️ [Pulizia Auto] Condizioni non soddisfatte (Giorno: ${giornoSettimana}, Ora: ${ore})`);
        return;
      }
      
      // Verifica se già aperto oggi
      const storageKey = `pulizia_last_popup_${tipoPulizia}`;
      const ultimoShow = localStorage.getItem(storageKey);
      const oggi = new Date().toISOString().split('T')[0];
      
      if (ultimoShow === oggi) {
        console.log(`ℹ️ [Pulizia Auto] Popup ${tipoPulizia} già mostrato oggi, skip`);
        return;
      }
      
      console.log(`🧹 [Pulizia Auto] Apro popup pulizie ${tipoPulizia.toUpperCase()}!`);
      
      // Salva data show per evitare duplicati
      localStorage.setItem(storageKey, oggi);
      
      // Apri popup
      setTestPuliziaPopupOpen(true);
    };
    
    // Check immediato all'avvio del componente
    checkAutoPuliziaPopup();
    
    // Check ogni 5 minuti (per sicurezza se la pagina resta aperta)
    const interval = setInterval(checkAutoPuliziaPopup, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []); // Esegui solo al mount del componente - PULIZIE


  // ============================================
  // API CALLS
  // ============================================
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { 'Authorization': `Bearer ${token}` }
    };
  };

  const caricaDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/haccp/dashboard`, getAuthHeaders());
      const rawData = response.data.data || response.data.dashboard || null;
      
      console.log('📊 [HACCP] Dashboard raw data:', rawData);
      
      // ✅ Mappa i dati del backend nella struttura attesa dal frontend
      if (rawData) {
        const mappedDashboard = {
          riepilogo: {
            totaleRegistrazioni: rawData.registrazioni?.totale || 0,
            conformi: rawData.registrazioni?.conformi || 0,
            nonConformi: rawData.registrazioni?.nonConformi || 0,
            richiedonoAttenzione: rawData.registrazioni?.daVerificare || 0
          },
          statisticheMensili: {
            totale: rawData.registrazioni?.totale || 0,
            conformi: rawData.registrazioni?.conformi || 0,
            nonConformi: rawData.registrazioni?.nonConformi || 0
          },
          temperatureAttuali: rawData.temperatureAttuali || {},
          nonConformita: rawData.nonConformita || [],
          // Mantieni anche i dati raw per retrocompatibilità
          ...rawData
        };
        setDashboard(mappedDashboard);
      } else {
        setDashboard(null);
      }
      
      // Carica anche registrazioni recenti
      try {
        const regResponse = await axios.get(`${API_URL}/haccp/registrazioni?limit=1000`, getAuthHeaders());
        setRegistrazioni(regResponse.data.registrazioni || []);
      } catch (e) {
        console.log('Registrazioni non disponibili');
      }
      
    } catch (error) {
      console.error('Errore caricamento dashboard HACCP:', error);
      showSnackbar('Errore caricamento dati', 'error');
    } finally {
      setLoading(false);
    }
  };

  const registraTemperatura = async () => {
    try {
      const dispositivo = DISPOSITIVI_TEMPERATURA.find(d => d.id === formTemperatura.dispositivo);
      
      await axios.post(`${API_URL}/haccp/temperatura`, {
        dispositivo: dispositivo.nome,
        temperatura: parseFloat(formTemperatura.temperatura),
        tipo: dispositivo.tipo,
        note: formTemperatura.note
      }, getAuthHeaders());
      
      showSnackbar('✅ Temperatura registrata con successo!', 'success');
      setDialogTemperatura(false);
      setFormTemperatura({ dispositivo: 'frigo1', temperatura: '', note: '' });
      caricaDashboard();
    } catch (error) {
      console.error('Errore registrazione temperatura:', error);
      showSnackbar('❌ Errore registrazione temperatura', 'error');
    }
  };

  const registraPulizia = async () => {
    try {
      const areeSelezionate = Object.entries(formPulizia.aree)
        .filter(([_, val]) => val)
        .map(([area, _]) => ({
          nome: area,
          conforme: true
        }));
      
      // ✅ FIX: Usa endpoint /registrazione con payload corretto
      await axios.post(`${API_URL}/haccp/registrazione`, {
        tipo: 'sanificazione',
        controlloIgienico: {
          area: 'Controllo giornaliero',
          elementi: areeSelezionate,
          azioneCorrettiva: null
        },
        operatore: formPulizia.operatore,
        note: formPulizia.note,
        conforme: true,
        dataOra: new Date().toISOString()
      }, getAuthHeaders());
      
      showSnackbar('✅ Pulizia registrata con successo!', 'success');
      setDialogPulizia(false);
      setFormPulizia({ aree: {}, operatore: 'Maurizio Mameli', note: '' });
      caricaDashboard();
    } catch (error) {
      console.error('Errore registrazione pulizia:', error);
      showSnackbar('❌ Errore registrazione pulizia', 'error');
    }
  };


  const registraAbbattimento = async () => {
    try {
      await axios.post(`${API_URL}/haccp/abbattimento`, {
        prodotto: formAbbattimento.prodotto,
        lotto: formAbbattimento.lotto,
        oraInizio: formAbbattimento.oraInizio,
        oraFine: formAbbattimento.oraFine,
        temperaturaIniziale: parseFloat(formAbbattimento.tempIniziale),
        temperaturaFinale: parseFloat(formAbbattimento.tempFinale),
        note: formAbbattimento.note
      }, getAuthHeaders());
      
      showSnackbar('✅ Abbattimento registrato con successo!', 'success');
      setDialogAbbattimento(false);
      setFormAbbattimento({ prodotto: '', lotto: '', oraInizio: '', oraFine: '', tempIniziale: '', tempFinale: '', note: '' });
      caricaDashboard();
    } catch (error) {
      console.error('Errore registrazione abbattimento:', error);
      showSnackbar('❌ Errore registrazione abbattimento', 'error');
    }
  };

  const registraMateriePrime = async () => {
    try {
      await axios.post(`${API_URL}/haccp/materie-prime`, {
        fornitore: formMateriePrime.fornitore,
        prodotto: formMateriePrime.prodotto,
        lotto: formMateriePrime.lotto,
        dataScadenza: formMateriePrime.dataScadenza,
        temperatura: parseFloat(formMateriePrime.temperatura),
        conforme: formMateriePrime.conforme,
        note: formMateriePrime.note
      }, getAuthHeaders());
      
      showSnackbar('✅ Controllo materie prime registrato!', 'success');
      setDialogMateriePrime(false);
      setFormMateriePrime({ fornitore: '', prodotto: '', lotto: '', dataScadenza: '', temperatura: '', conforme: true, note: '' });
      caricaDashboard();
    } catch (error) {
      console.error('Errore registrazione materie prime:', error);
      showSnackbar('❌ Errore registrazione', 'error');
    }
  };

  const registraNonConformita = async () => {
    try {
      await axios.post(`${API_URL}/haccp/non-conformita`, {
        tipo: formNonConformita.tipo,
        descrizione: formNonConformita.descrizione,
        azioneCorrettiva: formNonConformita.azioneCorrettiva,
        responsabile: formNonConformita.responsabile
      }, getAuthHeaders());
      
      showSnackbar('✅ Non conformità registrata!', 'success');
      setDialogNonConformita(false);
      setFormNonConformita({ tipo: '', descrizione: '', azioneCorrettiva: '', responsabile: 'Maurizio Mameli' });
      caricaDashboard();
    } catch (error) {
      console.error('Errore registrazione non conformità:', error);
      showSnackbar('❌ Errore registrazione', 'error');
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getTemperaturaStatus = (temp, tipo) => {
    if (tipo === 'temperatura_frigo') {
      if (temp <= 4) return { color: 'success', icon: '✅', text: 'Conforme' };
      if (temp <= 8) return { color: 'warning', icon: '⚠️', text: 'Attenzione' };
      return { color: 'error', icon: '❌', text: 'Non conforme' };
    }
    if (tipo === 'temperatura_congelatore') {
      if (temp <= -18) return { color: 'success', icon: '✅', text: 'Conforme' };
      return { color: 'error', icon: '❌', text: 'Non conforme' };
    }
    return { color: 'default', icon: '❓', text: 'N/D' };
  };

  // ============================================
  // RENDER LOADING
  // ============================================
  
  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4, p: 3 }}>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2, color: 'text.secondary' }}>
          Caricamento sistema HACCP...
        </Typography>
      </Box>
    );
  }

  // ============================================
  // RENDER PRINCIPALE
  // ============================================
  
  return (
    <Box sx={{ p: 3, bgcolor: '#FDF8F0', minHeight: '100vh' }}>
      {/* HEADER */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1B5200 0%, #2E7B00 100%)', color: 'white', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              🌡️ Sistema HACCP
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Pastificio Nonna Claudia - Via Carmine 20/B, Assemini
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={caricaDashboard}
              sx={{ mr: 1, color: 'primary.main' }}
            >
              Aggiorna
            </Button>
            {/* ✅ NUOVO: Stampa registro HACCP stile tabella A4 */}
            <StampaHACCP />
          </Box>
        </Box>
      </Paper>

      {/* STATISTICHE RAPIDE */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'white', borderLeft: '4px solid #2E7B00', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Registrazioni (7gg)
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {dashboard?.riepilogo?.totaleRegistrazioni || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'white', borderLeft: '4px solid #4CAF50', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Conformi
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="success.main">
                {dashboard?.riepilogo?.conformi || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'white', borderLeft: '4px solid #CC2200', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Non Conformi
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="error.main">
                {dashboard?.riepilogo?.nonConformi || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'white', borderLeft: '4px solid #C8A830', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Da Verificare
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="warning.main">
                {dashboard?.riepilogo?.richiedonoAttenzione || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AZIONI RAPIDE */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📝 Registra Controllo
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => setDialogTemperatura(true)}
              sx={{ py: 2 }}
            >
              🌡️ Temperatura
            </Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              onClick={() => setDialogPulizia(true)}
              sx={{ py: 2 }}
            >
              🧹 Pulizia
            </Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="info"
              onClick={() => setDialogAbbattimento(true)}
              sx={{ py: 2 }}
            >
              ❄️ Abbattimento
            </Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => setTestHACCPPopupOpen(true)}
              sx={{ py: 2 }}
            >
              🌡️ REGISTRA ORA
            </Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              onClick={() => setDialogMateriePrime(true)}
              sx={{ py: 2 }}
            >
              📦 Materie Prime
            </Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={() => setDialogNonConformita(true)}
              sx={{ py: 2 }}
            >
              ⚠️ Non Conformità
            </Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => window.print()}
              sx={{ py: 2 }}
            >
              🖨️ Stampa Schede
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* TABS PRINCIPALI */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabCorrente} 
          onChange={(e, v) => setTabCorrente(v)}
          variant="fullWidth"
        >
          <Tab label="📊 Dashboard" />
          <Tab label="🌡️ Temperature" />
          <Tab label="🧹 Pulizia" />
          <Tab label="❄️ Abbattimento" />
          <Tab label="🍝 Allergeni" />
          <Tab label="📋 CCP" />
          <Tab label="🏢 Fornitori" />
          <Tab label="⚠️ Non Conformità" />
          <Tab label="🔍 Rintracciabilità" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* TAB 0: DASHBOARD */}
          {tabCorrente === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Riepilogo Controlli - Ultimi 7 Giorni
              </Typography>
              
              {/* Temperature attuali */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {DISPOSITIVI_TEMPERATURA.filter(d => d.tipo !== 'abbattitore').map((disp) => (
                  <Grid item xs={12} md={3} key={disp.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          {disp.nome}
                        </Typography>
                        <Typography variant="h4">
                          {dashboard?.temperatureAttuali?.[disp.id]?.valore || '--'}°C
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Limite: {disp.limiteMin}°C / {disp.limiteMax}°C
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Statistiche mensili */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Statistiche Mensili
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(46,123,0,0.08)', borderTop: '3px solid #2E7B00', borderRadius: 2 }}>
                    <Typography variant="h4">{dashboard?.statisticheMensili?.totale || 0}</Typography>
                    <Typography variant="body2">Totale Registrazioni</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(76,175,80,0.08)', borderTop: '3px solid #4CAF50', borderRadius: 2 }}>
                    <Typography variant="h4">{dashboard?.statisticheMensili?.conformi || 0}</Typography>
                    <Typography variant="body2">Conformi</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(204,34,0,0.07)', borderTop: '3px solid #CC2200', borderRadius: 2 }}>
                    <Typography variant="h4">{dashboard?.statisticheMensili?.nonConformi || 0}</Typography>
                    <Typography variant="body2">Non Conformi</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}


          {/* TAB 1: TEMPERATURE CON PAGINAZIONE ✨ */}
          {tabCorrente === 1 && (
            <Box>
              {/* Header con filtri data */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ flex: '1 1 auto' }}>
                  📋 Scheda Controllo Temperature Frigoriferi
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Da Data"
                    type="date"
                    value={filtroDaData}
                    onChange={(e) => {
                      setFiltroDaData(e.target.value);
                      setPaginaTemperature(0);
                    }}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={{ minWidth: 150 }}
                  />
                  <TextField
                    label="A Data"
                    type="date"
                    value={filtroAData}
                    onChange={(e) => {
                      setFiltroAData(e.target.value);
                      setPaginaTemperature(0);
                    }}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={{ minWidth: 150 }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogTemperatura(true)}
                  >
                    Registra Temperatura
                  </Button>
                </Box>
              </Box>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Frequenza controllo:</strong> Settimanale | <strong>Limite:</strong> ≤ 4°C (frigo) | ≤ -18°C (congelatore)
              </Alert>

              {/* Chip statistiche */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`Totale: ${registrazioni.filter(r => r.tipo?.includes('temperatura')).length}`} 
                  color="primary" 
                  variant="outlined"
                />
                {(filtroDaData || filtroAData) && (
                  <Chip 
                    label={`Filtrate: ${registrazioni
                      .filter(r => r.tipo?.includes('temperatura'))
                      .filter(r => {
                        if (!filtroDaData && !filtroAData) return true;
                        const dataReg = new Date(r.dataOra);
                        const da = filtroDaData ? new Date(filtroDaData) : new Date('2000-01-01');
                        const a = filtroAData ? new Date(filtroAData) : new Date('2099-12-31');
                        a.setHours(23, 59, 59, 999);
                        return dataReg >= da && dataReg <= a;
                      }).length}`}
                    color="secondary"
                    variant="outlined"
                  />
                )}
                <Chip 
                  label={`Pagina ${paginaTemperature + 1}`}
                  color="info"
                  variant="outlined"
                />
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#2E7B00' }}>
                      <TableCell sx={{ color: 'white' }}>Data/Ora</TableCell>
                      <TableCell sx={{ color: 'white' }}>Dispositivo</TableCell>
                      <TableCell sx={{ color: 'white' }}>Temperatura</TableCell>
                      <TableCell sx={{ color: 'white' }}>Stato</TableCell>
                      <TableCell sx={{ color: 'white' }}>Operatore</TableCell>
                      <TableCell sx={{ color: 'white' }}>Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registrazioni
                      .filter(r => r.tipo?.includes('temperatura'))
                      .filter(r => {
                        if (!filtroDaData && !filtroAData) return true;
                        const dataReg = new Date(r.dataOra);
                        const da = filtroDaData ? new Date(filtroDaData) : new Date('2000-01-01');
                        const a = filtroAData ? new Date(filtroAData) : new Date('2099-12-31');
                        a.setHours(23, 59, 59, 999);
                        return dataReg >= da && dataReg <= a;
                      })
                      .slice(paginaTemperature * righePerPagina, (paginaTemperature + 1) * righePerPagina)
                      .map((reg, idx) => {
                        const status = getTemperaturaStatus(reg.temperatura?.valore, reg.tipo);
                        return (
                          <TableRow key={reg._id || idx} hover>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(reg.dataOra).toLocaleDateString('it-IT')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(reg.dataOra).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </TableCell>
                            <TableCell>{reg.temperatura?.dispositivo || 'N/D'}</TableCell>
                            <TableCell>
                              <Typography fontWeight="bold" color={status.color === 'success' ? 'success.main' : 'error.main'}>
                                {Math.round(reg.temperatura?.valore)}°C
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={`${status.icon} ${status.text}`} 
                                color={status.color} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>{reg.operatore}</TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                {reg.note || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {registrazioni.filter(r => r.tipo?.includes('temperatura')).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            Nessuna registrazione. Clicca "Registra Temperatura" per iniziare.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* PAGINAZIONE */}
              {(() => {
                const registrazioniFiltrate = registrazioni
                  .filter(r => r.tipo?.includes('temperatura'))
                  .filter(r => {
                    if (!filtroDaData && !filtroAData) return true;
                    const dataReg = new Date(r.dataOra);
                    const da = filtroDaData ? new Date(filtroDaData) : new Date('2000-01-01');
                    const a = filtroAData ? new Date(filtroAData) : new Date('2099-12-31');
                    a.setHours(23, 59, 59, 999);
                    return dataReg >= da && dataReg <= a;
                  });
                
                const totalePagine = Math.ceil(registrazioniFiltrate.length / righePerPagina);
                
                if (registrazioniFiltrate.length === 0) return null;
                
                return (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Righe per pagina</InputLabel>
                      <Select
                        value={righePerPagina}
                        label="Righe per pagina"
                        onChange={(e) => {
                          setRighePerPagina(e.target.value);
                          setPaginaTemperature(0);
                        }}
                      >
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                        <MenuItem value={200}>200</MenuItem>
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        disabled={paginaTemperature === 0}
                        onClick={() => setPaginaTemperature(0)}
                      >
                        ⏮️ Prima
                      </Button>
                      <Button
                        disabled={paginaTemperature === 0}
                        onClick={() => setPaginaTemperature(p => p - 1)}
                      >
                        ← Precedente
                      </Button>
                      <Chip 
                        label={`${paginaTemperature + 1} / ${totalePagine}`}
                        color="primary"
                      />
                      <Button
                        disabled={paginaTemperature >= totalePagine - 1}
                        onClick={() => setPaginaTemperature(p => p + 1)}
                      >
                        Successiva →
                      </Button>
                      <Button
                        size="small"
                        disabled={paginaTemperature >= totalePagine - 1}
                        onClick={() => setPaginaTemperature(totalePagine - 1)}
                      >
                        ⏭️ Ultima
                      </Button>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      {Math.min(paginaTemperature * righePerPagina + 1, registrazioniFiltrate.length)}-
                      {Math.min((paginaTemperature + 1) * righePerPagina, registrazioniFiltrate.length)} di {registrazioniFiltrate.length}
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
          )}

          {/* TAB 2: PULIZIA */}
          {tabCorrente === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  📋 Scheda Pulizia e Sanificazione
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setDialogPulizia(true)}
                >
                  Registra Pulizia
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#C8A830' }}>
                      <TableCell sx={{ color: 'white' }}>Area/Attrezzatura</TableCell>
                      <TableCell sx={{ color: 'white' }}>Frequenza</TableCell>
                      <TableCell sx={{ color: 'white' }}>Prodotto</TableCell>
                      <TableCell sx={{ color: 'white' }}>Metodo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {AREE_PULIZIA.map((area, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{area.area}</TableCell>
                        <TableCell>
                          <Chip 
                            label={area.frequenza} 
                            size="small" 
                            color={area.frequenza === 'Giornaliera' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{area.prodotto}</TableCell>
                        <TableCell>Rimozione residui, lavaggio, risciacquo, sanificazione</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" gutterBottom>Registrazioni Recenti</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data/Ora</TableCell>
                      <TableCell>Aree Pulite</TableCell>
                      <TableCell>Operatore</TableCell>
                      <TableCell>Stato</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registrazioni
                      .filter(r => r.tipo === 'controllo_igienico')
                      .slice(0, 10)
                      .map((reg, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(reg.dataOra).toLocaleString('it-IT')}</TableCell>
                          <TableCell>
                            {reg.controlloIgienico?.elementi?.map(e => e.nome).join(', ') || 'N/D'}
                          </TableCell>
                          <TableCell>{reg.operatore}</TableCell>
                          <TableCell>
                            <Chip 
                              label={reg.conforme ? '✅ Conforme' : '❌ Non conforme'} 
                              color={reg.conforme ? 'success' : 'error'} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 3: ABBATTIMENTO */}
          {tabCorrente === 3 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  📋 Scheda Registrazione Abbattimento Temperatura
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setDialogAbbattimento(true)}
                >
                  Registra Abbattimento
                </Button>
              </Box>

              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>CCP4 - Limite critico:</strong> Da 60°C a 10°C in massimo 2 ore
              </Alert>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#1565C0' }}>
                      <TableCell sx={{ color: 'white' }}>Data</TableCell>
                      <TableCell sx={{ color: 'white' }}>Prodotto</TableCell>
                      <TableCell sx={{ color: 'white' }}>Lotto</TableCell>
                      <TableCell sx={{ color: 'white' }}>Ora Inizio</TableCell>
                      <TableCell sx={{ color: 'white' }}>Temp. Iniziale</TableCell>
                      <TableCell sx={{ color: 'white' }}>Ora Fine</TableCell>
                      <TableCell sx={{ color: 'white' }}>Temp. Finale</TableCell>
                      <TableCell sx={{ color: 'white' }}>Stato</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registrazioni
                      .filter(r => r.tipo === 'abbattimento')
                      .slice(0, 10)
                      .map((reg, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(reg.dataOra).toLocaleDateString('it-IT')}</TableCell>
                          <TableCell>{reg.abbattimento?.prodotto || 'N/D'}</TableCell>
                          <TableCell>{reg.abbattimento?.lotto || '-'}</TableCell>
                          <TableCell>{reg.abbattimento?.oraInizio || '-'}</TableCell>
                          <TableCell>{reg.abbattimento?.temperaturaIniziale}°C</TableCell>
                          <TableCell>{reg.abbattimento?.oraFine || '-'}</TableCell>
                          <TableCell>{reg.abbattimento?.temperaturaFinale}°C</TableCell>
                          <TableCell>
                            <Chip 
                              label={reg.conforme ? '✅ Conforme' : '❌ Non conforme'} 
                              color={reg.conforme ? 'success' : 'error'} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    {registrazioni.filter(r => r.tipo === 'abbattimento').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="text.secondary">
                            Nessun abbattimento registrato
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 4: ALLERGENI */}
          {tabCorrente === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                📋 Tabella Allergeni nei Prodotti
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Gli allergeni devono essere indicati in <strong>grassetto</strong> nelle etichette (Reg. UE 1169/2011)
              </Alert>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#C8A830' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Prodotto</TableCell>
                      <TableCell sx={{ color: 'white' }} align="center">Glutine</TableCell>
                      <TableCell sx={{ color: 'white' }} align="center">Uova</TableCell>
                      <TableCell sx={{ color: 'white' }} align="center">Latte</TableCell>
                      <TableCell sx={{ color: 'white' }} align="center">Frutta a guscio</TableCell>
                      <TableCell sx={{ color: 'white' }} align="center">Solfiti</TableCell>
                      <TableCell sx={{ color: 'white' }} align="center">Pesce</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PRODOTTI_ALLERGENI.map((prod, idx) => (
                      <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(200,168,48,0.06)' } }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{prod.nome}</TableCell>
                        <TableCell align="center">{prod.glutine ? '✓' : '✗'}</TableCell>
                        <TableCell align="center">{prod.uova ? '✓' : '✗'}</TableCell>
                        <TableCell align="center">{prod.latte ? '✓' : '✗'}</TableCell>
                        <TableCell align="center">{prod.fruttaGuscio ? '✓' : '✗'}</TableCell>
                        <TableCell align="center">{prod.solfiti ? '✓' : '✗'}</TableCell>
                        <TableCell align="center">{prod.pesce ? '✓' : '✗'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
                🍝 Temperature e Tempi di Cottura
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#2E7B00' }}>
                      <TableCell sx={{ color: 'white' }}>Prodotto</TableCell>
                      <TableCell sx={{ color: 'white' }}>Temperatura</TableCell>
                      <TableCell sx={{ color: 'white' }}>Tempo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {COTTURE_PRODOTTI.map((cott, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{cott.prodotto}</TableCell>
                        <TableCell>{cott.temperatura}°C</TableCell>
                        <TableCell>{cott.tempo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 5: CCP */}
          {tabCorrente === 5 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                📋 Punti Critici di Controllo (CCP)
              </Typography>
              <Alert severity="error" sx={{ mb: 2 }}>
                I CCP sono punti dove il controllo è essenziale per prevenire o eliminare un pericolo alimentare
              </Alert>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#CC2200' }}>
                      <TableCell sx={{ color: 'white' }}>CCP</TableCell>
                      <TableCell sx={{ color: 'white' }}>Fase</TableCell>
                      <TableCell sx={{ color: 'white' }}>Pericolo</TableCell>
                      <TableCell sx={{ color: 'white' }}>Limiti Critici</TableCell>
                      <TableCell sx={{ color: 'white' }}>Monitoraggio</TableCell>
                      <TableCell sx={{ color: 'white' }}>Azione Correttiva</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {CCP_LIST.map((ccp, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Chip label={ccp.id} color="error" size="small" />
                        </TableCell>
                        <TableCell>{ccp.fase}</TableCell>
                        <TableCell>{ccp.pericolo}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'error.main' }}>{ccp.limite}</TableCell>
                        <TableCell>{ccp.monitoraggio}</TableCell>
                        <TableCell>{ccp.azione}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 6: FORNITORI */}
          {tabCorrente === 6 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                📋 Lista Fornitori Qualificati
              </Typography>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#2E7B00' }}>
                      <TableCell sx={{ color: 'white' }}>Fornitore</TableCell>
                      <TableCell sx={{ color: 'white' }}>Prodotto Fornito</TableCell>
                      <TableCell sx={{ color: 'white' }}>Indirizzo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {FORNITORI.map((forn, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{forn.nome}</TableCell>
                        <TableCell>{forn.prodotto}</TableCell>
                        <TableCell>{forn.indirizzo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 7: NON CONFORMITÀ */}
          {tabCorrente === 7 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  📋 Registro Non Conformità
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<AddIcon />}
                  onClick={() => setDialogNonConformita(true)}
                >
                  Registra Non Conformità
                </Button>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                Registrare tutte le non conformità e le relative azioni correttive
              </Alert>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'error.main' }}>
                      <TableCell sx={{ color: 'white' }}>Data</TableCell>
                      <TableCell sx={{ color: 'white' }}>Tipo</TableCell>
                      <TableCell sx={{ color: 'white' }}>Descrizione</TableCell>
                      <TableCell sx={{ color: 'white' }}>Azione Correttiva</TableCell>
                      <TableCell sx={{ color: 'white' }}>Responsabile</TableCell>
                      <TableCell sx={{ color: 'white' }}>Stato</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard?.nonConformita?.map((nc, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{new Date(nc.dataOra).toLocaleDateString('it-IT')}</TableCell>
                        <TableCell>
                          <Chip label={nc.tipo} size="small" color="error" />
                        </TableCell>
                        <TableCell>{nc.descrizione || nc.note || 'N/D'}</TableCell>
                        <TableCell>{nc.azioneCorrettiva || '-'}</TableCell>
                        <TableCell>{nc.responsabile || nc.operatore}</TableCell>
                        <TableCell>
                          <Chip 
                            label={nc.risolto ? 'Risolto' : 'Aperto'} 
                            color={nc.risolto ? 'success' : 'warning'} 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!dashboard?.nonConformita || dashboard.nonConformita.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">
                            Nessuna non conformità registrata ✅
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 8: RINTRACCIABILITÀ ✅ NUOVO 07/02/2026 */}
          {tabCorrente === 8 && (
            <Rintracciabilita />
          )}
        </Box>
      </Paper>

      {/* ============================================ */}
      {/* DIALOGS */}
      {/* ============================================ */}

      {/* DIALOG TEMPERATURA */}
      <Dialog open={dialogTemperatura} onClose={() => setDialogTemperatura(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #1B5200 0%, #2E7B00 100%)', color: 'white' }}>
          🌡️ Registra Temperatura
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Dispositivo</InputLabel>
            <Select
              value={formTemperatura.dispositivo}
              onChange={(e) => setFormTemperatura({ ...formTemperatura, dispositivo: e.target.value })}
              label="Dispositivo"
            >
              {DISPOSITIVI_TEMPERATURA.map((disp) => (
                <MenuItem key={disp.id} value={disp.id}>
                  {disp.nome} (Limite: {disp.limiteMin}°C / {disp.limiteMax}°C)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Temperatura (°C)"
            type="number"
            value={formTemperatura.temperatura}
            onChange={(e) => setFormTemperatura({ ...formTemperatura, temperatura: e.target.value })}
            inputProps={{ step: 0.1 }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Note"
            multiline
            rows={2}
            value={formTemperatura.note}
            onChange={(e) => setFormTemperatura({ ...formTemperatura, note: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogTemperatura(false)}>Annulla</Button>
          <Button
            variant="contained"
            onClick={registraTemperatura}
            disabled={!formTemperatura.temperatura}
          >
            Registra
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG PULIZIA */}
      <Dialog open={dialogPulizia} onClose={() => setDialogPulizia(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#C8A830', color: 'white' }}>
          🧹 Registra Pulizia e Sanificazione
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>
            Seleziona le aree pulite:
          </Typography>
          <FormGroup>
            <Grid container>
              {AREE_PULIZIA.map((area) => (
                <Grid item xs={12} md={6} key={area.area}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formPulizia.aree[area.area] || false}
                        onChange={(e) => setFormPulizia({
                          ...formPulizia,
                          aree: { ...formPulizia.aree, [area.area]: e.target.checked }
                        })}
                      />
                    }
                    label={`${area.area} (${area.frequenza})`}
                  />
                </Grid>
              ))}
            </Grid>
          </FormGroup>

          <TextField
            fullWidth
            label="Operatore"
            value={formPulizia.operatore}
            onChange={(e) => setFormPulizia({ ...formPulizia, operatore: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />

          <TextField
            fullWidth
            label="Note"
            multiline
            rows={2}
            value={formPulizia.note}
            onChange={(e) => setFormPulizia({ ...formPulizia, note: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogPulizia(false)}>Annulla</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={registraPulizia}
            disabled={Object.values(formPulizia.aree).filter(Boolean).length === 0}
          >
            Registra Pulizia
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG ABBATTIMENTO */}
      <Dialog open={dialogAbbattimento} onClose={() => setDialogAbbattimento(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1565C0', color: 'white' }}>
          ❄️ Registra Abbattimento Temperatura
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2, mt: 1 }}>
            <strong>Limite CCP4:</strong> Da 60°C a 10°C in massimo 2 ore
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prodotto"
                value={formAbbattimento.prodotto}
                onChange={(e) => setFormAbbattimento({ ...formAbbattimento, prodotto: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lotto"
                value={formAbbattimento.lotto}
                onChange={(e) => setFormAbbattimento({ ...formAbbattimento, lotto: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ora Inizio"
                type="time"
                value={formAbbattimento.oraInizio}
                onChange={(e) => setFormAbbattimento({ ...formAbbattimento, oraInizio: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Temperatura Iniziale (°C)"
                type="number"
                value={formAbbattimento.tempIniziale}
                onChange={(e) => setFormAbbattimento({ ...formAbbattimento, tempIniziale: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ora Fine"
                type="time"
                value={formAbbattimento.oraFine}
                onChange={(e) => setFormAbbattimento({ ...formAbbattimento, oraFine: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Temperatura Finale (°C)"
                type="number"
                value={formAbbattimento.tempFinale}
                onChange={(e) => setFormAbbattimento({ ...formAbbattimento, tempFinale: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={2}
                value={formAbbattimento.note}
                onChange={(e) => setFormAbbattimento({ ...formAbbattimento, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAbbattimento(false)}>Annulla</Button>
          <Button
            variant="contained"
            color="info"
            onClick={registraAbbattimento}
            disabled={!formAbbattimento.prodotto || !formAbbattimento.tempFinale}
          >
            Registra Abbattimento
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG MATERIE PRIME */}
      <Dialog open={dialogMateriePrime} onClose={() => setDialogMateriePrime(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2E7B00', color: 'white' }}>
          📦 Controllo Materie Prime in Arrivo
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Fornitore</InputLabel>
                <Select
                  value={formMateriePrime.fornitore}
                  onChange={(e) => setFormMateriePrime({ ...formMateriePrime, fornitore: e.target.value })}
                  label="Fornitore"
                >
                  {FORNITORI.map((f) => (
                    <MenuItem key={f.nome} value={f.nome}>{f.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prodotto"
                value={formMateriePrime.prodotto}
                onChange={(e) => setFormMateriePrime({ ...formMateriePrime, prodotto: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Lotto"
                value={formMateriePrime.lotto}
                onChange={(e) => setFormMateriePrime({ ...formMateriePrime, lotto: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Data Scadenza"
                type="date"
                value={formMateriePrime.dataScadenza}
                onChange={(e) => setFormMateriePrime({ ...formMateriePrime, dataScadenza: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Temperatura (°C)"
                type="number"
                value={formMateriePrime.temperatura}
                onChange={(e) => setFormMateriePrime({ ...formMateriePrime, temperatura: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formMateriePrime.conforme}
                    onChange={(e) => setFormMateriePrime({ ...formMateriePrime, conforme: e.target.checked })}
                  />
                }
                label="Merce conforme (temperatura OK, confezioni integre)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={2}
                value={formMateriePrime.note}
                onChange={(e) => setFormMateriePrime({ ...formMateriePrime, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogMateriePrime(false)}>Annulla</Button>
          <Button
            variant="contained"
            color="success"
            onClick={registraMateriePrime}
            disabled={!formMateriePrime.fornitore || !formMateriePrime.prodotto}
          >
            Registra Controllo
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG NON CONFORMITÀ */}
      <Dialog open={dialogNonConformita} onClose={() => setDialogNonConformita(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#CC2200', color: 'white' }}>
          ⚠️ Registra Non Conformità
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo Non Conformità</InputLabel>
                <Select
                  value={formNonConformita.tipo}
                  onChange={(e) => setFormNonConformita({ ...formNonConformita, tipo: e.target.value })}
                  label="Tipo Non Conformità"
                >
                  <MenuItem value="temperatura">Temperatura fuori range</MenuItem>
                  <MenuItem value="materie_prime">Materie prime non conformi</MenuItem>
                  <MenuItem value="pulizia">Carenza igienica</MenuItem>
                  <MenuItem value="processo">Anomalia processo produttivo</MenuItem>
                  <MenuItem value="attrezzature">Malfunzionamento attrezzature</MenuItem>
                  <MenuItem value="personale">Non conformità personale</MenuItem>
                  <MenuItem value="altro">Altro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrizione del problema"
                multiline
                rows={3}
                value={formNonConformita.descrizione}
                onChange={(e) => setFormNonConformita({ ...formNonConformita, descrizione: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Azione correttiva intrapresa"
                multiline
                rows={3}
                value={formNonConformita.azioneCorrettiva}
                onChange={(e) => setFormNonConformita({ ...formNonConformita, azioneCorrettiva: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Responsabile"
                value={formNonConformita.responsabile}
                onChange={(e) => setFormNonConformita({ ...formNonConformita, responsabile: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogNonConformita(false)}>Annulla</Button>
          <Button
            variant="contained"
            color="error"
            onClick={registraNonConformita}
            disabled={!formNonConformita.tipo || !formNonConformita.descrizione}
          >
            Registra Non Conformità
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ✅ NUOVO 23/01/2026: Popup Test HACCP */}
      {testHACCPPopupOpen && (
        <HACCPAutoPopup 
          onClose={() => {
            setTestHACCPPopupOpen(false);
            caricaDashboard();
          }}
          forceShow={true}
        />
      )}

      {/* ✅ Popup Pulizie Automatico */}
      {testPuliziaPopupOpen && (
        <PuliziaAutoPopup 
          onClose={() => {
            setTestPuliziaPopupOpen(false);
            caricaDashboard();
          }}
          forceShow={true}
        />
      )}
    </Box>
  );
}