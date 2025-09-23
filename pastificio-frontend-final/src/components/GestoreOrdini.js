// components/GestoreOrdini.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useOrdini } from '@/contexts/OrdiniContext';
import { useSearchParams } from 'next/navigation';
import { 
  Box, Container, Grid, Paper, Typography, 
  Snackbar, Alert, CircularProgress, IconButton, Chip, Button,
  LinearProgress, Badge, Menu, MenuItem, Divider, Dialog, DialogTitle, 
  DialogContent, DialogActions
} from '@mui/material';
import { 
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  CleaningServices as CleanIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Download as DownloadIcon,
  WhatsApp as WhatsAppIcon,
  TrendingUp as TrendingUpIcon,
  Euro as EuroIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  FileDownload as ExportIcon,
  Print as PrintIcon,
  Analytics as AnalyticsIcon,
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  ListAlt as ListAltIcon
} from '@mui/icons-material';

// Importa i componenti esistenti
import NuovoOrdine from './NuovoOrdine';
import OrdiniList from './OrdiniList';
import InstallPWA from './InstallPWA';
import RiepilogoGiornaliero from './RiepilogoGiornaliero';
import WhatsAppHelper from './WhatsAppHelper'; // NUOVO IMPORT

// Importa il widget statistiche
import StatisticheWidget from './widgets/StatisticheWidget';

// Importa i servizi
import { loggingService } from '../services/loggingService';
import webSocketService from '../services/webSocketService';
import notificationService from '../services/notificationService';
import dashboardService from '../services/dashboardService';

// Importa gli stili
import '../styles/modern-theme.css';

// Prodotti disponibili
const prodottiDisponibili = {
  dolci: [
    { nome: "Pardulas", prezzo: 19.00, unita: "Kg", descrizione: "Ricotta, zucchero, uova, aromi vari, farina 00, strutto, lievito" },
    { nome: "Amaretti", prezzo: 22.00, unita: "Kg", descrizione: "Mandorle, zucchero, uova, aromi vari" },
    { nome: "Papassinas", prezzo: 22.00, unita: "Kg", descrizione: "Farina, mandorle, uva sultanina, noci, sapa, zucchero, strutto, aromi vari, lievito" },
    { nome: "Ciambelle con marmellata", prezzo: 16.00, unita: "Kg", descrizione: "Farina 00, zucchero, strutto, margarina vegetale, uova, passata di albicocche" },
    { nome: "Ciambelle con Nutella", prezzo: 16.00, unita: "Kg", descrizione: "Farina, zucchero, strutto, margarina vegetale, uova, cacao, aromi vari" },
    { nome: "Cantucci", prezzo: 23.00, unita: "Kg", descrizione: "Mandorle, farina 00, zucchero, uova, aromi vari" },
    { nome: "Bianchini", prezzo: 15.00, unita: "Kg", descrizione: "Zucchero, uova" },
    { nome: "Gueffus", prezzo: 22.00, unita: "Kg", descrizione: "Mandorle, zucchero, aromi vari" },
    { nome: "Dolci misti (Pardulas, ciambelle, papassinas, amaretti, gueffus, bianchini)", prezzo: 19.00, unita: "Kg", descrizione: "Mix di dolci tradizionali" },
    { nome: "Dolci misti (Pardulas, ciambelle)", prezzo: 17.00, unita: "Kg", descrizione: "Mix pardulas e ciambelle" },
    { nome: "Zeppole", prezzo: 21.00, unita: "Kg", descrizione: "Farina, latte, uova, ricotta, patate, aromi vari, lievito" },
    { nome: "Pizzette sfoglia", prezzo: 16.00, unita: "Kg", descrizione: "Farina, passata di pomodoro, strutto, capperi, lievito" },
    { nome: "Torta di sapa", prezzo: 23.00, unita: "Kg", descrizione: "Farina, sapa, zucchero, uova, noci, mandorle, uva sultanina" }
  ],
  panadas: [
    { nome: "Panada di anguille", prezzo: 30.00, unita: "Kg", descrizione: "Con patate o piselli (prodotto congelato)" },
    { nome: "Panada di Agnello", prezzo: 25.00, unita: "Kg", descrizione: "Con patate o piselli (prodotto congelato)" },
    { nome: "Panada di Maiale", prezzo: 21.00, unita: "Kg", descrizione: "Con patate o piselli (prodotto congelato)" },
    { nome: "Panada di Vitella", prezzo: 23.00, unita: "Kg", descrizione: "Con patate o piselli (prodotto congelato)" },
    { nome: "Panada di verdure", prezzo: 17.00, unita: "Kg", descrizione: "Melanzane, patate e piselli (prodotto congelato)" },
    { nome: "Panadine carne o verdura", prezzo: 0.80, unita: "unità", descrizione: "Prodotto congelato" }
  ],
  pasta: [
    { nome: "Ravioli ricotta e zafferano", prezzo: 11.00, unita: "Kg", descrizione: "Ricotta, zafferano, uova, sale, semola, farina" },
    { nome: "Ravioli ricotta spinaci e zafferano", prezzo: 11.00, unita: "Kg", descrizione: "Ricotta, spinaci, zafferano, uova, sale, semola, farina" },
    { nome: "Ravioli ricotta spinaci", prezzo: 11.00, unita: "Kg", descrizione: "Ricotta, spinaci, uova, sale, semola, farina" },
    { nome: "Ravioli ricotta dolci", prezzo: 11.00, unita: "Kg", descrizione: "Ricotta, zafferano, uova, zucchero, semola, farina" },
    { nome: "Culurgiones", prezzo: 16.00, unita: "Kg", descrizione: "Patate, formaggio, aglio, menta, olio extra vergine, sale, semola, farina" },
    { nome: "Ravioli formaggio", prezzo: 16.00, unita: "Kg", descrizione: "Formaggio pecorino, spinaci, uova, sale, semola, farina" },
    { nome: "Sfoglie per Lasagne", prezzo: 5.00, unita: "Kg", descrizione: "Semola, farina, uova, sale" },
    { nome: "Pasta per panadas", prezzo: 5.00, unita: "Kg", descrizione: "Semola, farina, strutto naturale, sale" },
    { nome: "Pasta per pizza", prezzo: 5.00, unita: "Kg", descrizione: "Farina, latte, olio, lievito, sale" },
    { nome: "Fregola", prezzo: 10.00, unita: "Kg", descrizione: "Semola, zafferano, sale" }
  ]
};

export default function GestoreOrdini() {
  const { ordini, setOrdini, isConnected, setIsConnected } = useOrdini();
  const searchParams = useSearchParams();
  
  // Stati
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);
  const [dialogoNuovoOrdineAperto, setDialogoNuovoOrdineAperto] = useState(false);
  const [ordineSelezionato, setOrdineSelezionato] = useState(null);
  const [caricamento, setCaricamento] = useState(false);
  const [ultimaSync, setUltimaSync] = useState(null);
  const [hasToken, setHasToken] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [submitInCorso, setSubmitInCorso] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [riepilogoAperto, setRiepilogoAperto] = useState(false);
  const [whatsappHelperAperto, setWhatsappHelperAperto] = useState(false); // NUOVO STATO
  const [menuExport, setMenuExport] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [performanceScore, setPerformanceScore] = useState(100);
  const syncIntervalRef = useRef(null);
  
  // Audio per notifiche
  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCh2Gy/DagTMGHW/A7OWeTRAMUazt8KtgGAg5k9r0wHkoCyZ+zPLSizoIHWq57OihUBELTKXh8bllHgg2kNb0x3wqCh1hy+7hnjUKFiuUw+DFgjwKHq7t559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCh2Gy/DagTMGHW/A7OWeTRAMUazt8KtgGAg5k9r0wHkoCyZ+zPLSizoIHWq57OihUBELTKXh8bllHgg2kNb0x3wqCh1hy+7hnjUKFiuUw+DFgjwKHq3t559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCh2Gy/DagTMGHW/A7OWeTRAMUazt8KtgGAg5k9r0wHkoCyZ+zPLSizoIHWq57OihUBELTKXh8bllHgg2kNb0x3wqCh1hy+7hnjUKFl+z558e';
      const audio = new Audio(audioData);
      audio.volume = 0.5;
      return audio;
    }
    return null;
  });
  
  // Notifiche
  const [notifica, setNotifica] = useState({
    aperta: false,
    messaggio: '',
    tipo: 'info'
  });

  // Gestione parametro URL 'nuovo'
  useEffect(() => {
    if (searchParams.get('nuovo') === 'true') {
      setDialogoNuovoOrdineAperto(true);
      const url = new URL(window.location);
      url.searchParams.delete('nuovo');
      window.history.replaceState({}, '', url);
    }
  }, [searchParams]);

  // Calcola statistiche
  const calcolaStatistiche = () => {
    const oggi = new Date().toDateString();
    const ordiniOggi = ordini.filter(o => {
      const dataOrdine = new Date(o.dataRitiro || o.createdAt).toDateString();
      return dataOrdine === oggi;
    });

    const totaleOggi = ordiniOggi.reduce((sum, o) => sum + (o.totale || 0), 0);
    const completati = ordiniOggi.filter(o => o.stato === 'completato').length;
    const inLavorazione = ordiniOggi.filter(o => o.stato === 'in_lavorazione').length;
    const nuovi = ordiniOggi.filter(o => o.stato === 'nuovo').length;

    return {
      totaleOrdini: ordini.length,
      ordiniOggi: ordiniOggi.length,
      ordiniOffline: ordini.filter(o => o._isOffline).length,
      totaleOggi,
      completati,
      inLavorazione,
      nuovi,
      percentualeCompletamento: ordiniOggi.length > 0 ? (completati / ordiniOggi.length * 100) : 0,
      mediaOrdine: ordiniOggi.length > 0 ? (totaleOggi / ordiniOggi.length) : 0
    };
  };

  const statistiche = calcolaStatistiche();

  // Monitora storage locale
  useEffect(() => {
    const checkStorage = () => {
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(estimate => {
          const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
          setStorageUsed(parseFloat(usedMB));
        });
      }
    };
    
    checkStorage();
    const interval = setInterval(checkStorage, 30000);
    return () => clearInterval(interval);
  }, [ordini]);

  // Performance monitoring
  useEffect(() => {
    const measurePerformance = () => {
      if (window.performance && window.performance.memory) {
        const memoryUsage = (window.performance.memory.usedJSHeapSize / window.performance.memory.jsHeapSizeLimit) * 100;
        setPerformanceScore(Math.max(0, 100 - memoryUsage));
      }
    };
    
    measurePerformance();
    const interval = setInterval(measurePerformance, 5000);
    return () => clearInterval(interval);
  }, []);

  // Inizializzazione - MODALITÀ OFFLINE
  useEffect(() => {
    console.log('🚀 Inizializzazione GestoreOrdini - MODALITÀ OFFLINE');
    setHasToken(false);
    setIsConnected(false);
    caricaOrdiniDaCache();
    mostraNotifica('Modalità offline attiva', 'info');
  }, []);

  const caricaOrdiniDaCache = () => {
    try {
      const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
      if (ordiniCache.length > 0) {
        setOrdini(ordiniCache);
        console.log(`📂 Caricati ${ordiniCache.length} ordini dalla cache`);
        mostraNotifica(`Caricati ${ordiniCache.length} ordini dalla cache`, 'info');
      }
    } catch (error) {
      console.error('Errore caricamento cache:', error);
    }
  };

  const caricaOrdini = async () => {
    caricaOrdiniDaCache();
  };

  // Export functions
  const handleExport = async (formato) => {
    setMenuExport(null);
    
    try {
      const ordiniExport = ordini.filter(o => {
        const dataOrdine = o.dataRitiro || o.createdAt;
        return dataOrdine && dataOrdine.startsWith(dataSelezionata);
      });

      if (ordiniExport.length === 0) {
        mostraNotifica('Nessun ordine da esportare per questa data', 'warning');
        return;
      }

      switch (formato) {
        case 'csv':
          exportToCSV(ordiniExport);
          break;
        case 'excel':
          exportToExcel(ordiniExport);
          break;
        case 'pdf':
          exportToPDF(ordiniExport);
          break;
        case 'print':
          printOrdini(ordiniExport);
          break;
      }
      
      mostraNotifica(`Export ${formato.toUpperCase()} completato`, 'success');
    } catch (error) {
      console.error('Errore export:', error);
      mostraNotifica('Errore durante l\'export', 'error');
    }
  };

  const exportToCSV = (ordiniData) => {
    const headers = ['Cliente', 'Telefono', 'Data Ritiro', 'Ora', 'Prodotti', 'Totale', 'Stato', 'Note'];
    const rows = ordiniData.map(o => [
      o.nomeCliente,
      o.telefono,
      o.dataRitiro,
      o.oraRitiro || '',
      (o.prodotti || []).map(p => `${p.nome} x${p.quantita}`).join('; '),
      o.totale || 0,
      o.stato || 'nuovo',
      o.note || ''
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ordini_${dataSelezionata}.csv`;
    link.click();
  };

  const exportToExcel = (ordiniData) => {
    exportToCSV(ordiniData);
    mostraNotifica('Export Excel: usando formato CSV', 'info');
  };

  const exportToPDF = (ordiniData) => {
    printOrdini(ordiniData);
    mostraNotifica('Export PDF: usando stampa browser', 'info');
  };

  const printOrdini = (ordiniData) => {
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ordini ${dataSelezionata}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .totale { text-align: right; font-weight: bold; margin-top: 20px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>Pastificio Nonna Claudia - Ordini del ${dataSelezionata}</h1>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Telefono</th>
              <th>Ora Ritiro</th>
              <th>Prodotti</th>
              <th>Totale</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            ${ordiniData.map(o => `
              <tr>
                <td>${o.nomeCliente}</td>
                <td>${o.telefono}</td>
                <td>${o.oraRitiro || ''}</td>
                <td>${(o.prodotti || []).map(p => `${p.nome} x${p.quantita}`).join(', ')}</td>
                <td>€${o.totale || 0}</td>
                <td>${o.stato || 'nuovo'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totale">
          Totale: €${ordiniData.reduce((sum, o) => sum + (o.totale || 0), 0).toFixed(2)}
        </div>
        <button onclick="window.print()">Stampa</button>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const salvaOrdine = async (nuovoOrdine) => {
    if (submitInCorso) {
      console.log('⚠️ Submit già in corso, ignoro...');
      return;
    }

    setSubmitInCorso(true);
    
    try {
      console.log('💾 Salvataggio ordine:', nuovoOrdine);
      
      if (ordineSelezionato) {
        await aggiornaOrdine({ ...nuovoOrdine, _id: ordineSelezionato._id });
      } else {
        await creaOrdine(nuovoOrdine);
      }
      
      setOrdineSelezionato(null);
      setDialogoNuovoOrdineAperto(false);
      mostraNotifica('Ordine salvato con successo', 'success');
      
    } catch (error) {
      console.error('❌ Errore salvataggio ordine:', error);
      mostraNotifica('Errore durante il salvataggio', 'error');
    } finally {
      setTimeout(() => {
        setSubmitInCorso(false);
      }, 1000);
    }
  };

  const creaOrdine = async (ordine) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const ordineConId = { 
      ...ordine, 
      _id: tempId,
      tempId,
      _isOffline: true,
      createdAt: new Date().toISOString()
    };
    
    setOrdini(prev => {
      const nuoviOrdini = [ordineConId, ...prev];
      localStorage.setItem('ordini', JSON.stringify(nuoviOrdini));
      return nuoviOrdini;
    });
    
    console.log('💾 Ordine salvato localmente (offline)');
    mostraNotifica('Ordine salvato localmente', 'success');
  };
  
  const aggiornaOrdine = async (ordine) => {
    setOrdini(prev => {
      const nuoviOrdini = prev.map(o => o._id === ordine._id ? ordine : o);
      localStorage.setItem('ordini', JSON.stringify(nuoviOrdini));
      return nuoviOrdini;
    });
    
    console.log('✅ Ordine aggiornato localmente');
    mostraNotifica('Ordine aggiornato con successo', 'success');
  };
  
  const eliminaOrdine = async (id) => {
    setOrdini(prev => {
      const nuoviOrdini = prev.filter(o => o._id !== id);
      localStorage.setItem('ordini', JSON.stringify(nuoviOrdini));
      return nuoviOrdini;
    });
    
    console.log('🗑️ Ordine eliminato localmente');
    mostraNotifica('Ordine eliminato con successo', 'success');
  };

  const rimuoviDuplicati = () => {
    setOrdini(prevOrdini => {
      const ordiniUnici = [];
      const visti = new Set();
      
      prevOrdini.forEach(ordine => {
        const chiave = `${ordine.nomeCliente}-${ordine.telefono}-${ordine.dataRitiro}`;
        
        if (!visti.has(chiave)) {
          visti.add(chiave);
          ordiniUnici.push(ordine);
        } else {
          console.log('🗑️ Rimosso ordine duplicato:', ordine.nomeCliente);
        }
      });
      
      if (ordiniUnici.length !== prevOrdini.length) {
        mostraNotifica(`Rimossi ${prevOrdini.length - ordiniUnici.length} ordini duplicati`, 'info');
      }
      
      return ordiniUnici;
    });
  };
  
  const mostraNotifica = (messaggio, tipo = 'info') => {
    setNotifica({
      aperta: true,
      messaggio,
      tipo
    });
    console.log(`📢 Notifica [${tipo}]: ${messaggio}`);
  };
  
  const chiudiNotifica = () => {
    setNotifica(prev => ({ ...prev, aperta: false }));
  };

  const apriDialogoNuovoOrdine = () => {
    setOrdineSelezionato(null);
    setDialogoNuovoOrdineAperto(true);
  };

  const chiudiDialogoNuovoOrdine = () => {
    setDialogoNuovoOrdineAperto(false);
    setOrdineSelezionato(null);
  };

  const modificaOrdine = (ordine) => {
    setOrdineSelezionato(ordine);
    setDialogoNuovoOrdineAperto(true);
  };

  return (
    <Container maxWidth="xl">
      {/* Widget Statistiche */}
      <StatisticheWidget ordini={ordini} />
      
      {/* Header con indicatori di stato */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Gestione Ordini
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InstallPWA />
            
            {/* NUOVO: Bottone WhatsApp Helper */}
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={() => setWhatsappHelperAperto(true)}
            >
              WhatsApp Helper
            </Button>
            
            {/* Bottone Riepilogo Giornaliero */}
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<ListAltIcon />}
              onClick={() => setRiepilogoAperto(true)}
            >
              Riepilogo
            </Button>
            
            {/* Menu Export */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExportIcon />}
              onClick={(e) => setMenuExport(e.currentTarget)}
            >
              Export
            </Button>
            <Menu
              anchorEl={menuExport}
              open={Boolean(menuExport)}
              onClose={() => setMenuExport(null)}
            >
              <MenuItem onClick={() => handleExport('csv')}>
                <ExportIcon sx={{ mr: 1 }} /> CSV
              </MenuItem>
              <MenuItem onClick={() => handleExport('excel')}>
                <ExportIcon sx={{ mr: 1 }} /> Excel
              </MenuItem>
              <MenuItem onClick={() => handleExport('pdf')}>
                <ExportIcon sx={{ mr: 1 }} /> PDF
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleExport('print')}>
                <PrintIcon sx={{ mr: 1 }} /> Stampa
              </MenuItem>
            </Menu>
            
            {/* Statistiche rapide */}
            <Chip 
              label={`${statistiche.totaleOrdini} ordini totali`}
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`${statistiche.ordiniOggi} oggi`}
              color="primary"
              size="small"
            />
            
            {/* Controlli */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<CleanIcon />}
              onClick={rimuoviDuplicati}
              disabled={caricamento}
            >
              Rimuovi Duplicati
            </Button>
            
            <IconButton onClick={caricaOrdini} disabled={caricamento}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Barra performance */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon fontSize="small" />
                <Typography variant="caption">Storage: {storageUsed} MB</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(storageUsed * 10, 100)} 
                  sx={{ flexGrow: 1, ml: 1 }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon fontSize="small" />
                <Typography variant="caption">Performance: {performanceScore.toFixed(0)}%</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={performanceScore} 
                  color={performanceScore > 80 ? 'success' : performanceScore > 50 ? 'warning' : 'error'}
                  sx={{ flexGrow: 1, ml: 1 }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon fontSize="small" />
                <Typography variant="caption">
                  Completamento: {statistiche.percentualeCompletamento.toFixed(0)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={statistiche.percentualeCompletamento} 
                  color="success"
                  sx={{ flexGrow: 1, ml: 1 }}
                />
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        {/* Indicatore connessione - SEMPRE OFFLINE */}
        <Paper 
          elevation={1}
          sx={{ 
            p: 2,
            bgcolor: 'warning.light',
            color: 'warning.contrastText'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WifiOffIcon />
              <Typography variant="body2">
                Modalità Offline - I dati sono salvati localmente
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
      
      {/* Contenuto principale */}
      {caricamento ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={60} />
          <Typography sx={{ ml: 2, alignSelf: 'center' }}>
            Caricamento ordini...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <OrdiniList 
              ordini={ordini}
              onDelete={eliminaOrdine}
              onEdit={modificaOrdine}
              onDateChange={setDataSelezionata}
              onNuovoOrdine={apriDialogoNuovoOrdine}
              dataSelezionata={dataSelezionata}
              isConnected={false}
            />
          </Grid>
        </Grid>
      )}
      
      {/* Dialog per nuovo ordine o modifica */}
      {dialogoNuovoOrdineAperto && (
        <NuovoOrdine 
          open={dialogoNuovoOrdineAperto}
          onClose={chiudiDialogoNuovoOrdine}
          onSave={salvaOrdine}
          ordineIniziale={ordineSelezionato}
          isConnected={false}
          prodotti={prodottiDisponibili}
          submitInCorso={submitInCorso}
        />
      )}
      
      {/* Dialog per Riepilogo Giornaliero */}
      <Dialog 
        open={riepilogoAperto} 
        onClose={() => setRiepilogoAperto(false)}
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Riepilogo Giornaliero Ordini</Typography>
            <IconButton onClick={() => setRiepilogoAperto(false)} size="small">
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <RiepilogoGiornaliero />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRiepilogoAperto(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
      
      {/* NUOVO: Dialog per WhatsApp Helper */}
      <Dialog 
        open={whatsappHelperAperto} 
        onClose={() => setWhatsappHelperAperto(false)}
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">WhatsApp Helper - Invio Facilitato</Typography>
            <IconButton onClick={() => setWhatsappHelperAperto(false)} size="small">
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <WhatsAppHelper ordini={ordini} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWhatsappHelperAperto(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifiche */}
      <Snackbar
        open={notifica.aperta}
        autoHideDuration={10000}
        onClose={chiudiNotifica}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={chiudiNotifica} 
          severity={notifica.tipo} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {notifica.messaggio}
        </Alert>
      </Snackbar>
    </Container>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> d62a9b18eb32db96b141b851886398197b0d6578
