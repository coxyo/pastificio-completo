// src/components/GestoreOrdini.js
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, Container, Grid, Paper, Typography, 
  Snackbar, Alert, CircularProgress, IconButton, Chip, Button,
  LinearProgress, Menu, MenuItem, Divider, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Fab, Tooltip
} from '@mui/material';
import { 
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  CleaningServices as CleanIcon,
  WhatsApp as WhatsAppIcon,
  FileDownload as ExportIcon,
  Print as PrintIcon,
  Analytics as AnalyticsIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  ListAlt as ListAltIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  CloudOff as CloudOffIcon,
  Sync as SyncIcon
} from '@mui/icons-material';

// Importa componenti
import NuovoOrdine from './NuovoOrdine';
import OrdiniList from './OrdiniList';
import InstallPWA from './InstallPWA';
import RiepilogoGiornaliero from './RiepilogoGiornaliero';
import StatisticheWidget from './widgets/StatisticheWidget';

// Configurazione API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend.onrender.com';

// Token di autenticazione demo
const DEMO_TOKEN = 'demo-token';

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
  // Stati principali
  const [ordini, setOrdini] = useState([]);
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);
  const [dialogoNuovoOrdineAperto, setDialogoNuovoOrdineAperto] = useState(false);
  const [ordineSelezionato, setOrdineSelezionato] = useState(null);
  const [caricamento, setCaricamento] = useState(false);
  const [ultimaSync, setUltimaSync] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [submitInCorso, setSubmitInCorso] = useState(false);
  const [riepilogoAperto, setRiepilogoAperto] = useState(false);
  const [whatsappHelperAperto, setWhatsappHelperAperto] = useState(false);
  const [menuExport, setMenuExport] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [performanceScore, setPerformanceScore] = useState(100);
  const [notifica, setNotifica] = useState({ aperta: false, messaggio: '', tipo: 'info' });
  
  const syncIntervalRef = useRef(null);
  
  // Funzione per sincronizzare con MongoDB
  const sincronizzaConMongoDB = useCallback(async () => {
    try {
      setSyncInProgress(true);
      
      const response = await fetch(`${API_URL}/api/ordini`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEMO_TOKEN}` // FIX: Aggiunto token
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const ordiniBackend = Array.isArray(data) ? data : (data.data || []);
        
        // Salva in localStorage per cache offline
        localStorage.setItem('ordini', JSON.stringify(ordiniBackend));
        setOrdini(ordiniBackend);
        
        setIsConnected(true);
        setUltimaSync(new Date());
        
        console.log(`✅ Sincronizzati ${ordiniBackend.length} ordini dal server`);
        
        // Invia ordini offline pendenti
        await inviaOrdiniOffline();
        
        return true;
      } else {
        throw new Error('Errore risposta server');
      }
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      setIsConnected(false);
      
      // Carica dalla cache locale se offline
      const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
      setOrdini(ordiniCache);
      
      mostraNotifica('Modalità offline - usando cache locale', 'warning');
      return false;
    } finally {
      setSyncInProgress(false);
    }
  }, []);
  
  // Invia ordini offline al server
  const inviaOrdiniOffline = async () => {
    const ordiniOffline = JSON.parse(localStorage.getItem('ordiniOffline') || '[]');
    
    if (ordiniOffline.length === 0) return;
    
    console.log(`📤 Invio ${ordiniOffline.length} ordini offline...`);
    
    for (const ordine of ordiniOffline) {
      try {
        const response = await fetch(`${API_URL}/api/ordini`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEMO_TOKEN}` // FIX: Aggiunto token
          },
          body: JSON.stringify(ordine)
        });
        
        if (response.ok) {
          console.log(`✅ Ordine offline sincronizzato:`, ordine.nomeCliente);
        }
      } catch (error) {
        console.error('Errore invio ordine offline:', error);
      }
    }
    
    // Pulisci ordini offline dopo invio
    localStorage.removeItem('ordiniOffline');
  };
  
  // Inizializzazione
  useEffect(() => {
    console.log('🚀 Inizializzazione GestoreOrdini con sincronizzazione');
    
    // Prima sincronizzazione
    sincronizzaConMongoDB();
  }, []);
  
  // Auto-sync ogni 10 secondi
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      sincronizzaConMongoDB();
    }, 10000); // Ogni 10 secondi
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [sincronizzaConMongoDB]);
  
  // Monitora connessione
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connessione ripristinata');
      mostraNotifica('Connessione ripristinata', 'success');
      sincronizzaConMongoDB();
    };
    
    const handleOffline = () => {
      console.log('🔴 Connessione persa');
      setIsConnected(false);
      mostraNotifica('Modalità offline attiva', 'warning');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sincronizzaConMongoDB]);
  
  // Crea ordine
  const creaOrdine = async (ordine) => {
    const nuovoOrdine = {
      ...ordine,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      // Prova a inviare al server
      const response = await fetch(`${API_URL}/api/ordini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEMO_TOKEN}` // FIX: Aggiunto token
        },
        body: JSON.stringify(nuovoOrdine)
      });
      
      if (response.ok) {
        const ordineCreato = await response.json();
        
        // Aggiorna lista locale
        setOrdini(prev => [ordineCreato, ...prev]);
        
        // Aggiorna cache
        const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
        ordiniCache.unshift(ordineCreato);
        localStorage.setItem('ordini', JSON.stringify(ordiniCache));
        
        mostraNotifica('Ordine salvato e sincronizzato', 'success');
      } else {
        throw new Error('Errore server');
      }
    } catch (error) {
      console.error('Errore creazione ordine:', error);
      
      // Salva offline
      const ordiniOffline = JSON.parse(localStorage.getItem('ordiniOffline') || '[]');
      ordiniOffline.push(nuovoOrdine);
      localStorage.setItem('ordiniOffline', JSON.stringify(ordiniOffline));
      
      // Aggiungi temporaneamente alla lista locale
      const tempId = 'temp_' + Date.now();
      setOrdini(prev => [{ ...nuovoOrdine, _id: tempId }, ...prev]);
      
      mostraNotifica('Ordine salvato localmente (verrà sincronizzato)', 'warning');
    }
  };
  
  // Aggiorna ordine
  const aggiornaOrdine = async (ordine) => {
    try {
      const response = await fetch(`${API_URL}/api/ordini/${ordine._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEMO_TOKEN}` // FIX: Aggiunto token
        },
        body: JSON.stringify(ordine)
      });
      
      if (response.ok) {
        // Aggiorna lista locale
        setOrdini(prev => prev.map(o => o._id === ordine._id ? ordine : o));
        
        // Aggiorna cache
        const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
        const index = ordiniCache.findIndex(o => o._id === ordine._id);
        if (index !== -1) {
          ordiniCache[index] = ordine;
          localStorage.setItem('ordini', JSON.stringify(ordiniCache));
        }
        
        mostraNotifica('Ordine aggiornato', 'success');
      }
    } catch (error) {
      console.error('Errore aggiornamento:', error);
      mostraNotifica('Errore aggiornamento', 'error');
    }
  };
  
  // Elimina ordine
  const eliminaOrdine = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/ordini/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEMO_TOKEN}` // FIX: Aggiunto token
        }
      });
      
      if (response.ok) {
        // Rimuovi dalla lista locale
        setOrdini(prev => prev.filter(o => o._id !== id));
        
        // Aggiorna cache
        const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
        const filtered = ordiniCache.filter(o => o._id !== id);
        localStorage.setItem('ordini', JSON.stringify(filtered));
        
        mostraNotifica('Ordine eliminato', 'success');
      }
    } catch (error) {
      console.error('Errore eliminazione:', error);
      mostraNotifica('Errore eliminazione', 'error');
    }
  };
  
  const salvaOrdine = async (nuovoOrdine) => {
    if (submitInCorso) return;
    
    setSubmitInCorso(true);
    
    try {
      if (ordineSelezionato) {
        await aggiornaOrdine({ ...nuovoOrdine, _id: ordineSelezionato._id });
      } else {
        await creaOrdine(nuovoOrdine);
      }
      
      setOrdineSelezionato(null);
      setDialogoNuovoOrdineAperto(false);
      
    } catch (error) {
      console.error('Errore salvataggio ordine:', error);
      mostraNotifica('Errore durante il salvataggio', 'error');
    } finally {
      setTimeout(() => setSubmitInCorso(false), 1000);
    }
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
        }
      });
      
      if (ordiniUnici.length !== prevOrdini.length) {
        localStorage.setItem('ordini', JSON.stringify(ordiniUnici));
        mostraNotifica(`Rimossi ${prevOrdini.length - ordiniUnici.length} ordini duplicati`, 'info');
      }
      
      return ordiniUnici;
    });
  };
  
  const mostraNotifica = (messaggio, tipo = 'info') => {
    setNotifica({ aperta: true, messaggio, tipo });
  };
  
  const chiudiNotifica = () => {
    setNotifica(prev => ({ ...prev, aperta: false }));
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
    
    let csv = '\uFEFF' + headers.join(',') + '\n';
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
  };
  
  const exportToPDF = (ordiniData) => {
    printOrdini(ordiniData);
  };
  
  const printOrdini = (ordiniData) => {
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
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
      totaleOggi,
      completati,
      inLavorazione,
      nuovi,
      percentualeCompletamento: ordiniOggi.length > 0 ? (completati / ordiniOggi.length * 100) : 0,
      mediaOrdine: ordiniOggi.length > 0 ? (totaleOggi / ordiniOggi.length) : 0
    };
  };
  
  const statistiche = calcolaStatistiche();
  
  // Monitora storage
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
  
  return (
    <Container maxWidth="xl">
      {/* Widget Statistiche */}
      <StatisticheWidget ordini={ordini} />
      
      {/* Header con indicatori di stato */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            Gestione Ordini
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <InstallPWA />
            
            {/* Bottone sync manuale */}
            <Tooltip title={isConnected ? "Sincronizza ora" : "Offline"}>
              <IconButton 
                onClick={sincronizzaConMongoDB} 
                disabled={syncInProgress}
                color={isConnected ? 'success' : 'warning'}
              >
                {syncInProgress ? <CircularProgress size={24} /> : 
                 isConnected ? <SyncIcon /> : <CloudOffIcon />}
              </IconButton>
            </Tooltip>
            
            {/* Bottone WhatsApp Helper */}
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={() => setWhatsappHelperAperto(true)}
            >
              WhatsApp
            </Button>
            
            {/* Bottone Riepilogo */}
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
              label={`${statistiche.totaleOrdini} ordini`}
              variant="outlined"
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
              Pulisci
            </Button>
            
            <IconButton onClick={sincronizzaConMongoDB} disabled={syncInProgress}>
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
        
        {/* Indicatore connessione */}
        <Paper 
          elevation={1}
          sx={{ 
            p: 2,
            bgcolor: isConnected ? 'success.light' : 'warning.light',
            color: isConnected ? 'success.contrastText' : 'warning.contrastText'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isConnected ? <WifiIcon /> : <WifiOffIcon />}
              <Typography variant="body2">
                {isConnected 
                  ? '✅ Sincronizzazione attiva - Ordini visibili su tutti i dispositivi' 
                  : '⚠️ Modalità Offline - I dati verranno sincronizzati al ripristino della connessione'}
              </Typography>
            </Box>
            {ultimaSync && (
              <Typography variant="caption">
                Ultima sync: {new Date(ultimaSync).toLocaleTimeString()}
              </Typography>
            )}
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
              onEdit={(ordine) => {
                setOrdineSelezionato(ordine);
                setDialogoNuovoOrdineAperto(true);
              }}
              onDateChange={setDataSelezionata}
              onNuovoOrdine={() => {
                setOrdineSelezionato(null);
                setDialogoNuovoOrdineAperto(true);
              }}
              dataSelezionata={dataSelezionata}
              isConnected={isConnected}
            />
          </Grid>
        </Grid>
      )}
      
      {/* FAB per nuovo ordine */}
      <Fab 
        color="primary" 
        aria-label="Nuovo ordine"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {
          setOrdineSelezionato(null);
          setDialogoNuovoOrdineAperto(true);
        }}
      >
        <AddIcon />
      </Fab>
      
      {/* Dialog per nuovo ordine */}
      {dialogoNuovoOrdineAperto && (
        <NuovoOrdine 
          open={dialogoNuovoOrdineAperto}
          onClose={() => {
            setDialogoNuovoOrdineAperto(false);
            setOrdineSelezionato(null);
          }}
          onSave={salvaOrdine}
          ordineIniziale={ordineSelezionato}
          isConnected={isConnected}
          prodotti={prodottiDisponibili}
          submitInCorso={submitInCorso}
        />
      )}
      
      {/* Dialog per Riepilogo */}
      <Dialog 
        open={riepilogoAperto} 
        onClose={() => setRiepilogoAperto(false)}
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Riepilogo Giornaliero</Typography>
            <IconButton onClick={() => setRiepilogoAperto(false)} size="small">
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <RiepilogoGiornaliero 
            ordini={ordini} 
            dataSelezionata={dataSelezionata}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRiepilogoAperto(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per WhatsApp Helper */}
      <Dialog 
        open={whatsappHelperAperto} 
        onClose={() => setWhatsappHelperAperto(false)}
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">WhatsApp Helper</Typography>
            <IconButton onClick={() => setWhatsappHelperAperto(false)} size="small">
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <WhatsAppHelperComponent ordini={ordini} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWhatsappHelperAperto(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifiche */}
      <Snackbar
        open={notifica.aperta}
        autoHideDuration={6000}
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
}

// WhatsApp Helper Component
function WhatsAppHelperComponent({ ordini }) {
  const [ordineSelezionato, setOrdineSelezionato] = useState(null);
  const [messaggio, setMessaggio] = useState('');
  
  const formatMessage = (ordine) => {
    if (!ordine) return '';
    
    const numeroOrdine = ordine.numeroOrdine || ordine._id?.substr(-6);
    const prodotti = (ordine.prodotti || [])
      .map(p => `• ${p.nome} x${p.quantita} ${p.unita || 'Kg'}`)
      .join('\n');
    
    return `🍝 *PASTIFICIO NONNA CLAUDIA*
📋 *Ordine #${numeroOrdine}*

👤 *Cliente:* ${ordine.nomeCliente}
📅 *Ritiro:* ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}
⏰ *Ora:* ${ordine.oraRitiro || 'Da definire'}

📦 *Prodotti:*
${prodotti}

💰 *Totale:* €${ordine.totale?.toFixed(2) || '0.00'}
${ordine.note ? `\n📌 *Note:* ${ordine.note}` : ''}

✅ Il suo ordine è confermato!
📍 Via Carmine 20/B, Assemini
📞 Per info: 3898879833

Grazie per averci scelto! 🙏`;
  };
  
  const handleSelectOrdine = (ordine) => {
    setOrdineSelezionato(ordine);
    setMessaggio(formatMessage(ordine));
  };
  
  const handleCopy = async () => {
    if (!messaggio) {
      alert('Seleziona prima un ordine');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(messaggio);
      alert('✅ Messaggio copiato! Incollalo su WhatsApp');
      window.open('https://web.whatsapp.com/', '_blank');
    } catch (error) {
      alert('❌ Errore nella copia del messaggio');
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>
              Seleziona un ordine
            </Typography>
            {ordini.map(ordine => (
              <Button
                key={ordine._id}
                fullWidth
                variant={ordineSelezionato?._id === ordine._id ? 'contained' : 'outlined'}
                sx={{ mb: 1, justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => handleSelectOrdine(ordine)}
              >
                <Box>
                  <Typography variant="body2">
                    {ordine.nomeCliente}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    €{ordine.totale?.toFixed(2) || '0'} - {ordine.dataRitiro}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Anteprima messaggio
            </Typography>
            <TextField
              multiline
              rows={15}
              fullWidth
              value={messaggio}
              onChange={(e) => setMessaggio(e.target.value)}
              variant="outlined"
              sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
            
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
                onClick={handleCopy}
                disabled={!messaggio}
                fullWidth
              >
                Copia e Apri WhatsApp
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}