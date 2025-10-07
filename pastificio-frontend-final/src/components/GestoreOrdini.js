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

import NuovoOrdine from './NuovoOrdine';
import OrdiniList from './OrdiniList';
import InstallPWA from './InstallPWA';
import StatisticheWidget from './widgets/StatisticheWidget';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
  API_URL.replace('https://', 'wss://').replace('http://', 'ws://');

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

function RiepilogoGiornaliero({ ordini, dataSelezionata }) {
  const ordiniFiltrati = ordini.filter(o => {
    const dataOrdine = o.dataRitiro || o.createdAt || '';
    return dataOrdine.startsWith(dataSelezionata);
  });

  const totale = ordiniFiltrati.reduce((sum, o) => sum + (o.totale || 0), 0);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Riepilogo del {new Date(dataSelezionata).toLocaleDateString('it-IT')}
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Ordini Totali</Typography>
            <Typography variant="h4">{ordiniFiltrati.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Incasso Totale</Typography>
            <Typography variant="h4">€{totale.toFixed(2)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
        Dettaglio Ordini:
      </Typography>
      
      {ordiniFiltrati.map((ordine, index) => (
        <Paper key={ordine._id || index} sx={{ p: 2, mb: 1 }}>
          <Grid container alignItems="center">
            <Grid item xs={6}>
              <Typography>{ordine.nomeCliente}</Typography>
              <Typography variant="caption">{ordine.telefono}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>{ordine.oraRitiro || 'N/D'}</Typography>
            </Grid>
            <Grid item xs={3} sx={{ textAlign: 'right' }}>
              <Typography variant="h6">€{(ordine.totale || 0).toFixed(2)}</Typography>
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Box>
  );
}

function WhatsAppHelperComponent({ ordini }) {
  const [ordineSelezionato, setOrdineSelezionato] = useState(null);
  const [messaggio, setMessaggio] = useState('');
  
  const formatMessage = (ordine) => {
    if (!ordine) return '';
    
    const numeroOrdine = ordine.numeroOrdine || ordine._id?.substr(-6) || 'N/A';
    const prodotti = (ordine.prodotti || [])
      .map(p => `• ${p.nome} x${p.quantita} ${p.unita || 'Kg'}`)
      .join('\n');
    
    return `🍝 PASTIFICIO NONNA CLAUDIA
📋 Ordine #${numeroOrdine}

👤 Cliente: ${ordine.nomeCliente}
📅 Ritiro: ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}
⏰ Ora: ${ordine.oraRitiro || 'Da definire'}

📦 Prodotti:
${prodotti}

💰 Totale: €${ordine.totale?.toFixed(2) || '0.00'}
${ordine.note ? `\n📝 Note: ${ordine.note}` : ''}

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
      alert('Messaggio copiato! Incollalo su WhatsApp');
      window.open('https://web.whatsapp.com/', '_blank');
    } catch (error) {
      alert('Errore nella copia del messaggio');
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
                key={ordine._id || ordine.id}
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

export default function GestoreOrdini() {
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
  
  const wsRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  useEffect(() => {
    const keepAlive = setInterval(async () => {
      try {
        await fetch(`${API_URL}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        console.log('Keep-alive ping inviato');
      } catch (error) {
        console.log('Keep-alive fallito:', error.message);
      }
    }, 4 * 60 * 1000);

    return () => clearInterval(keepAlive);
  }, []);
  
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      console.log('Tentativo connessione WebSocket...');
      wsRef.current = new WebSocket(WS_URL);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connesso');
        setIsConnected(true);
        mostraNotifica('Connesso in tempo reale', 'success');
        sincronizzaConMongoDB();
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket messaggio:', data);
          
          switch(data.type) {
            case 'ordine_aggiornato':
            case 'ordine_creato':
            case 'ordine_eliminato':
              sincronizzaConMongoDB();
              break;
            case 'ping':
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'pong' }));
              }
              break;
          }
        } catch (error) {
          console.error('Errore parsing messaggio WebSocket:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket errore:', error);
        setIsConnected(false);
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnesso');
        setIsConnected(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    } catch (error) {
      console.error('Errore creazione WebSocket:', error);
      setIsConnected(false);
    }
  }, []);
  
  const sincronizzaConMongoDB = useCallback(async (retry = 0) => {
    if (syncInProgress) return;
    
    try {
      setSyncInProgress(true);
      console.log(`Sincronizzazione in corso... (tentativo ${retry + 1}/3)`);
      
      const response = await fetch(`${API_URL}/api/ordini`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(30000)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        let ordiniBackend = [];
        if (Array.isArray(data)) {
          ordiniBackend = data;
        } else if (data.data && Array.isArray(data.data)) {
          ordiniBackend = data.data;
        } else if (data.ordini && Array.isArray(data.ordini)) {
          ordiniBackend = data.ordini;
        }
        
        console.log(`Sincronizzati ${ordiniBackend.length} ordini dal server`);
        
        const ordiniOffline = JSON.parse(localStorage.getItem('ordiniOffline') || '[]');
        const ordiniMap = new Map();
        
        ordiniBackend.forEach(ordine => {
          const key = ordine._id || ordine.id;
          if (key) ordiniMap.set(key, ordine);
        });
        
        ordiniOffline.forEach(ordine => {
          const key = ordine._id || ordine.id || `temp_${ordine.nomeCliente}_${ordine.dataRitiro}`;
          if (!ordiniMap.has(key)) {
            ordiniMap.set(key, { ...ordine, _syncPending: true });
          }
        });
        
        const ordiniFinali = Array.from(ordiniMap.values());
        
        ordiniFinali.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.dataRitiro);
          const dateB = new Date(b.createdAt || b.dataRitiro);
          return dateB - dateA;
        });
        
        localStorage.setItem('ordini', JSON.stringify(ordiniFinali));
        setOrdini(ordiniFinali);
        
        setIsConnected(true);
        setUltimaSync(new Date());
        
        if (ordiniOffline.length > 0) {
          await inviaOrdiniOffline();
        }
        
        return true;
      } else if (response.status === 404) {
        console.log('Endpoint non trovato, usando dati locali');
        throw new Error('Endpoint not found');
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      
      if (retry < 2 && navigator.onLine) {
        console.log(`Riprovo tra 3 secondi... (tentativo ${retry + 2}/3)`);
        setTimeout(() => {
          sincronizzaConMongoDB(retry + 1);
        }, 3000);
        return;
      }
      
      setIsConnected(false);
      
      const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
      setOrdini(ordiniCache);
      
      if (ordiniCache.length === 0) {
        mostraNotifica('Nessun ordine in cache locale', 'info');
      } else {
        mostraNotifica(`Modalità offline - ${ordiniCache.length} ordini in cache`, 'warning');
      }
      
      return false;
    } finally {
      setSyncInProgress(false);
    }
  }, [syncInProgress]);
  
  const inviaOrdiniOffline = async () => {
    const ordiniOffline = JSON.parse(localStorage.getItem('ordiniOffline') || '[]');
    
    if (ordiniOffline.length === 0) return;
    
    console.log(`Invio ${ordiniOffline.length} ordini offline...`);
    let successCount = 0;
    
    for (const ordine of ordiniOffline) {
      try {
        const response = await fetch(`${API_URL}/api/ordini`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ordine)
        });
        
        if (response.ok) {
          successCount++;
          console.log(`Ordine sincronizzato: ${ordine.nomeCliente}`);
        }
      } catch (error) {
        console.error('Errore invio ordine offline:', error);
      }
    }
    
    if (successCount > 0) {
      localStorage.removeItem('ordiniOffline');
      mostraNotifica(`Sincronizzati ${successCount} ordini offline`, 'success');
      await sincronizzaConMongoDB();
    }
  };
  
  useEffect(() => {
    console.log('Inizializzazione GestoreOrdini...');
    
    const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
    if (ordiniCache.length > 0) {
      setOrdini(ordiniCache);
      console.log(`Caricati ${ordiniCache.length} ordini dalla cache`);
    }
    
    const wakeUpServer = async () => {
      try {
        await fetch(`${API_URL}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        console.log('Server svegliato');
      } catch (error) {
        console.log('Wake up server fallito:', error.message);
      }
      
      setTimeout(() => {
        sincronizzaConMongoDB();
      }, 1000);
    };
    
    wakeUpServer();
    connectWebSocket();
    
    syncIntervalRef.current = setInterval(() => {
      sincronizzaConMongoDB();
    }, 30000);
    
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);
  
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connessione ripristinata');
      mostraNotifica('Connessione ripristinata', 'success');
      setIsConnected(true);
      sincronizzaConMongoDB();
      connectWebSocket();
    };
    
    const handleOffline = () => {
      console.log('Connessione persa');
      setIsConnected(false);
      mostraNotifica('Modalità offline attiva', 'warning');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsConnected(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sincronizzaConMongoDB, connectWebSocket]);
  
  const creaOrdine = async (ordine) => {
    const nuovoOrdine = {
      ...ordine,
      _id: undefined,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totale: ordine.totale || 0,
      stato: ordine.stato || 'nuovo'
    };
    
    try {
      if (!navigator.onLine)  {
        throw new Error('Offline mode');
      }
      
      const response = await fetch(`${API_URL}/api/ordini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuovoOrdine)
      });
      
      if (response.ok) {
        const ordineCreato = await response.json();
        
        setOrdini(prev => [ordineCreato, ...prev]);
        
        const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
        ordiniCache.unshift(ordineCreato);
        localStorage.setItem('ordini', JSON.stringify(ordiniCache));
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ordine_creato',
            ordine: ordineCreato
          }));
        }
        
        mostraNotifica('Ordine salvato e sincronizzato', 'success');
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Errore creazione ordine:', error);
      
      const ordiniOffline = JSON.parse(localStorage.getItem('ordiniOffline') || '[]');
      ordiniOffline.push(nuovoOrdine);
      localStorage.setItem('ordiniOffline', JSON.stringify(ordiniOffline));
      
      const ordineConFlag = { ...nuovoOrdine, _syncPending: true };
      setOrdini(prev => [ordineConFlag, ...prev]);
      
      const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
      ordiniCache.unshift(ordineConFlag);
      localStorage.setItem('ordini', JSON.stringify(ordiniCache));
      
      mostraNotifica('Ordine salvato localmente (verrà sincronizzato)', 'warning');
    }
  };
  
  const aggiornaOrdine = async (ordine) => {
    const ordineAggiornato = {
      ...ordine,
      updatedAt: new Date().toISOString()
    };
    
    try {
      if (!navigator.onLine)  {
        throw new Error('Offline mode');
      }
      
      const response = await fetch(`${API_URL}/api/ordini/${ordine._id || ordine.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ordineAggiornato)
      });
      
      if (response.ok) {
        const ordineRisposta = await response.json();
        
        setOrdini(prev => prev.map(o => 
          (o._id === ordine._id || o.id === ordine.id) ? ordineRisposta : o
        ));
        
        const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
        const index = ordiniCache.findIndex(o => o._id === ordine._id || o.id === ordine.id);
        if (index !== -1) {
          ordiniCache[index] = ordineRisposta;
          localStorage.setItem('ordini', JSON.stringify(ordiniCache));
        }
        
        mostraNotifica('Ordine aggiornato', 'success');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Errore aggiornamento:', error);
      
      const ordineConFlag = { ...ordineAggiornato, _syncPending: true };
      
      setOrdini(prev => prev.map(o => 
        (o._id === ordine._id || o.id === ordine.id) ? ordineConFlag : o
      ));
      
      const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
      const index = ordiniCache.findIndex(o => o._id === ordine._id || o.id === ordine.id);
      if (index !== -1) {
        ordiniCache[index] = ordineConFlag;
        localStorage.setItem('ordini', JSON.stringify(ordiniCache));
      }
      
      const ordiniOffline = JSON.parse(localStorage.getItem('ordiniOffline') || '[]');
      const offlineIndex = ordiniOffline.findIndex(o => o._id === ordine._id || o.id === ordine.id);
      if (offlineIndex !== -1) {
        ordiniOffline[offlineIndex] = ordineConFlag;
      } else {
        ordiniOffline.push(ordineConFlag);
      }
      localStorage.setItem('ordiniOffline', JSON.stringify(ordiniOffline));
      
      mostraNotifica('Ordine aggiornato localmente', 'warning');
    }
  };
  
  const eliminaOrdine = async (id) => {
    if (!confirm('Confermi eliminazione ordine?')) return;
    
    try {
      if (!navigator.onLine)  {
        throw new Error('Offline mode');
      }
      
      const response = await fetch(`${API_URL}/api/ordini/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setOrdini(prev => prev.filter(o => o._id !== id && o.id !== id));
        
        const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
        const filtered = ordiniCache.filter(o => o._id !== id && o.id !== id);
        localStorage.setItem('ordini', JSON.stringify(filtered));
        
        mostraNotifica('Ordine eliminato', 'success');
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Errore eliminazione:', error);
      
      setOrdini(prev => prev.filter(o => o._id !== id && o.id !== id));
      
      const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
      const filtered = ordiniCache.filter(o => o._id !== id && o.id !== id);
      localStorage.setItem('ordini', JSON.stringify(filtered));
      
      const ordiniOffline = JSON.parse(localStorage.getItem('ordiniOffline') || '[]');
      const filteredOffline = ordiniOffline.filter(o => o._id !== id && o.id !== id);
      localStorage.setItem('ordiniOffline', JSON.stringify(filteredOffline));
      
      mostraNotifica('Ordine eliminato localmente', 'warning');
    }
  };
  
  const salvaOrdine = async (nuovoOrdine) => {
    if (submitInCorso) return;
    
    setSubmitInCorso(true);
    
    try {
      if (ordineSelezionato) {
        await aggiornaOrdine({ ...ordineSelezionato, ...nuovoOrdine });
      } else {
        await creaOrdine(nuovoOrdine);
      }
      
      setOrdineSelezionato(null);
      setDialogoNuovoOrdineAperto(false);
      
    } catch (error) {
      console.error('Errore salvataggio:', error);
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
        const chiave = ordine._id || ordine.id || 
          `${ordine.nomeCliente}-${ordine.telefono}-${ordine.dataRitiro}-${ordine.totale}`;
        
        if (!visti.has(chiave)) {
          visti.add(chiave);
          ordiniUnici.push(ordine);
        }
      });
      
      if (ordiniUnici.length !== prevOrdini.length) {
        localStorage.setItem('ordini', JSON.stringify(ordiniUnici));
        mostraNotifica(`Rimossi ${prevOrdini.length - ordiniUnici.length} ordini duplicati`, 'info');
      } else {
        mostraNotifica('Nessun duplicato trovato', 'info');
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
      <StatisticheWidget ordini={ordini} />
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            Gestione Ordini
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <InstallPWA />
            
            <Tooltip title={syncInProgress ? "Sincronizzazione in corso..." : "Sincronizza"}>
  <span> {/* Wrappa in span */}
    <IconButton disabled={syncInProgress}>
      <SyncIcon />
    </IconButton>
  </span>
</Tooltip>
            
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={() => setWhatsappHelperAperto(true)}
            >
              WhatsApp
            </Button>
            
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<ListAltIcon />}
              onClick={() => setRiepilogoAperto(true)}
            >
              Riepilogo
            </Button>
            
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
            
            <Chip 
              label={`${statistiche.totaleOrdini} ordini`}
              variant="outlined"
              size="small"
            />
            
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
                  ? 'Sincronizzazione attiva - Ordini visibili su tutti i dispositivi' 
                  : 'Modalità Offline - I dati verranno sincronizzati al ripristino della connessione'}
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