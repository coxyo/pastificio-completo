// src/components/GestoreOrdini.js - ✅ VERSIONE FINALE CON DB PRODOTTI
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
  Sync as SyncIcon,
  LocalShipping as ShippingIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

// Import nuovi moduli di calcolo prezzi
import { PRODOTTI_CONFIG, getProdottoConfig, LISTA_PRODOTTI } from '../config/prodottiConfig';
import { 
  calcolaPrezzoOrdine, 
  formattaPrezzo,
  getUnitaMisuraDisponibili 
} from '../utils/calcoliPrezzi';

import NuovoOrdine from './NuovoOrdine';
import OrdiniList from './OrdiniList';
import InstallPWA from './InstallPWA';
import StatisticheWidget from './widgets/StatisticheWidget';
import RiepilogoGiornaliero from './RiepilogoGiornaliero';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
  API_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '');

// Componente Riepilogo Semplice
function RiepilogoSemplice({ ordini, dataSelezionata }) {
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
          
          <Box sx={{ mt: 1, pl: 2 }}>
            {(ordine.prodotti || []).map((p, idx) => {
              const risultatoCalcolo = p.dettagliCalcolo || {};
              return (
                <Typography key={idx} variant="caption" display="block" color="text.secondary">
                  • {p.nome}: {risultatoCalcolo.dettagli || `${p.quantita} ${p.unita}`} - {formattaPrezzo(p.prezzo || 0)}
                </Typography>
              );
            })}
          </Box>
        </Paper>
      ))}
    </Box>
  );
}

// WhatsApp Helper Component
function WhatsAppHelperComponent({ ordini }) {
  const [ordineSelezionato, setOrdineSelezionato] = useState(null);
  const [messaggio, setMessaggio] = useState('');
  
  const formatMessage = (ordine) => {
    if (!ordine) return '';
    
    const numeroOrdine = ordine.numeroOrdine || ordine._id?.substr(-6) || 'N/A';
    const prodotti = (ordine.prodotti || [])
      .map(p => {
        const dettagli = p.dettagliCalcolo?.dettagli || `${p.quantita} ${p.unita || 'Kg'}`;
        return `• ${p.nome}: ${dettagli}`;
      })
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

// COMPONENTE PRINCIPALE
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
  const [riepilogoStampabileAperto, setRiepilogoStampabileAperto] = useState(false);
  const [whatsappHelperAperto, setWhatsappHelperAperto] = useState(false);
  const [menuExport, setMenuExport] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [performanceScore, setPerformanceScore] = useState(100);
  const [notifica, setNotifica] = useState({ aperta: false, messaggio: '', tipo: 'info' });
  
  // ✅ NUOVO: State per prodotti dal DB
  const [prodottiDisponibili, setProdottiDisponibili] = useState({
    pasta: [],
    dolci: [],
    panadas: [],
    altro: []
  });
  const [prodottiCaricati, setProdottiCaricati] = useState(false);
  
  const wsRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  // ✅ NUOVO: Carica prodotti dal database
  useEffect(() => {
    const caricaProdottiDB = async () => {
      try {
        console.log('📦 Caricamento prodotti dal database...');
        
        const response = await fetch(`${API_URL}/prodotti/disponibili`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const prodottiDB = data.data || [];
          
          console.log(`✅ Ricevuti ${prodottiDB.length} prodotti dal server`);
          
          // Raggruppa per categoria
          const raggruppati = {
            pasta: prodottiDB
              .filter(p => p.categoria === 'Ravioli')
              .map(p => ({
                nome: p.nome,
                prezzo: p.prezzoKg || p.prezzoPezzo || 0,
                unita: p.unitaMisuraDisponibili[0] || 'Kg',
                descrizione: p.descrizione || '',
                pezziPerKg: p.pezziPerKg,
                config: p
              })),
            
            dolci: prodottiDB
              .filter(p => p.categoria === 'Dolci' || p.categoria === 'Pardulas')
              .map(p => ({
                nome: p.nome,
                prezzo: p.prezzoKg || p.prezzoPezzo || 0,
                unita: p.unitaMisuraDisponibili[0] || 'Kg',
                descrizione: p.descrizione || '',
                pezziPerKg: p.pezziPerKg,
                config: p
              })),
            
            panadas: prodottiDB
              .filter(p => p.categoria === 'Panadas')
              .map(p => ({
                nome: p.nome,
                prezzo: p.prezzoKg || p.prezzoPezzo || 0,
                unita: p.unitaMisuraDisponibili[0] || 'Kg',
                descrizione: p.descrizione || '',
                pezziPerKg: p.pezziPerKg,
                config: p
              })),
            
            altro: prodottiDB
              .filter(p => p.categoria === 'Altro')
              .map(p => ({
                nome: p.nome,
                prezzo: p.prezzoKg || p.prezzoPezzo || 0,
                unita: p.unitaMisuraDisponibili[0] || 'Kg',
                descrizione: p.descrizione || '',
                pezziPerKg: p.pezziPerKg,
                config: p
              }))
          };
          
          setProdottiDisponibili(raggruppati);
          setProdottiCaricati(true);
          
          console.log('✅ Prodotti raggruppati per categoria:');
          console.log(`   - Pasta: ${raggruppati.pasta.length}`);
          console.log(`   - Dolci: ${raggruppati.dolci.length}`);
          console.log(`   - Panadas: ${raggruppati.panadas.length}`);
          console.log(`   - Altro: ${raggruppati.altro.length}`);
          
          mostraNotifica(`Caricati ${prodottiDB.length} prodotti dal database`, 'success');
          
        } else {
          throw new Error(`Errore ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Errore caricamento prodotti:', error);
        mostraNotifica('Usando prodotti di default', 'warning');
        
        // ✅ FALLBACK: Usa prodotti hardcoded se il caricamento fallisce
        console.warn('⚠️ Usando prodotti hardcoded come fallback');
        
        const fallbackProdotti = {
          pasta: LISTA_PRODOTTI.filter(p => {
            const config = getProdottoConfig(p);
            return config?.categoria === 'Ravioli' || p.includes('Culurgiones');
          }).map(p => {
            const config = getProdottoConfig(p);
            return {
              nome: p,
              prezzo: config.prezzoKg || config.prezzoPezzo || 0,
              unita: config.unitaMisuraDisponibili[0] || 'Kg',
              descrizione: config.descrizione || '',
              pezziPerKg: config.pezziPerKg,
              config: config
            };
          }),
          
          dolci: LISTA_PRODOTTI.filter(p => {
            const config = getProdottoConfig(p);
            return config?.categoria === 'Dolci' || config?.categoria === 'Pardulas';
          }).map(p => {
            const config = getProdottoConfig(p);
            return {
              nome: p,
              prezzo: config.prezzoKg || config.prezzoPezzo || 0,
              unita: config.unitaMisuraDisponibili[0] || 'Kg',
              descrizione: config.descrizione || '',
              pezziPerKg: config.pezziPerKg,
              config: config
            };
          }),
          
          panadas: LISTA_PRODOTTI.filter(p => {
            const config = getProdottoConfig(p);
            return config?.categoria === 'Panadas';
          }).map(p => {
            const config = getProdottoConfig(p);
            return {
              nome: p,
              prezzo: config.prezzoKg || config.prezzoPezzo || 0,
              unita: config.unitaMisuraDisponibili[0] || 'Kg',
              descrizione: config.descrizione || '',
              pezziPerKg: config.pezziPerKg,
              config: config
            };
          }),
          
          altro: LISTA_PRODOTTI.filter(p => {
            const config = getProdottoConfig(p);
            return config?.categoria === 'Altro';
          }).map(p => {
            const config = getProdottoConfig(p);
            return {
              nome: p,
              prezzo: config.prezzoKg || config.prezzoPezzo || 0,
              unita: config.unitaMisuraDisponibili[0] || 'Kg',
              descrizione: config.descrizione || '',
              pezziPerKg: config.pezziPerKg,
              config: config
            };
          })
        };
        
        setProdottiDisponibili(fallbackProdotti);
        setProdottiCaricati(true);
      }
    };
    
    caricaProdottiDB();
  }, []); // Esegui solo al mount
  
  // Keep-alive per mantenere il backend Railway attivo
  useEffect(() => {
    const keepAlive = setInterval(async () => {
      try {
        await fetch(`${API_URL.replace('/api', '')}/health`, { 
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
  
  // Connessione WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      console.log('Tentativo connessione WebSocket...', WS_URL);
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
            case 'alert-scorte':
              // Mostra notifica giacenze
              mostraNotifica(`⚠️ Scorta bassa: ${data.prodotto} (${data.quantita} ${data.unita})`, 'warning');
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
  
  // Sincronizzazione con MongoDB
  const sincronizzaConMongoDB = useCallback(async (retry = 0) => {
    if (syncInProgress) return;
    
    try {
      setSyncInProgress(true);
      console.log(`🔄 Sincronizzazione in corso... (tentativo ${retry + 1}/3)`);
      
      const response = await fetch(`${API_URL}/ordini`, {
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
        
        console.log(`✅ Sincronizzati ${ordiniBackend.length} ordini dal server`);
        
        const ordiniFinali = ordiniBackend;
        
        ordiniFinali.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.dataRitiro);
          const dateB = new Date(b.createdAt || b.dataRitiro);
          return dateB - dateA;
        });
        
        localStorage.setItem('ordini', JSON.stringify(ordiniFinali));
        setOrdini(ordiniFinali);
        
        setIsConnected(true);
        setUltimaSync(new Date());
        
        console.log('✅ Ordini sincronizzati ESATTAMENTE come sul server');
        
        return true;
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      
      if (retry < 2 && navigator.onLine) {
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
  
  // Invio ordini salvati offline quando torna la connessione
  const inviaOrdiniOffline = async () => {
    const ordiniOffline = JSON.parse(localStorage.getItem('ordiniOffline') || '[]');
    
    if (ordiniOffline.length === 0) return;
    
    console.log(`Invio ${ordiniOffline.length} ordini offline...`);
    let successCount = 0;
    
    for (const ordine of ordiniOffline) {
      try {
        const response = await fetch(`${API_URL}/ordini`, {
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
  
  // Inizializzazione al mount
  useEffect(() => {
    console.log('Inizializzazione GestoreOrdini...');
    
    const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
    if (ordiniCache.length > 0) {
      setOrdini(ordiniCache);
      console.log(`Caricati ${ordiniCache.length} ordini dalla cache`);
    }
    
    const wakeUpServer = async () => {
      try {
        await fetch(`${API_URL.replace('/api', '')}/health`, { 
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
  
  // Gestione eventi online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connessione ripristinata');
      mostraNotifica('Connessione ripristinata', 'success');
      setIsConnected(true);
      sincronizzaConMongoDB();
      inviaOrdiniOffline();
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
  
  // Creazione nuovo ordine
  const creaOrdine = async (ordine) => {
    let totaleOrdine = 0;
    const prodottiConCalcolo = (ordine.prodotti || []).map(p => {
      const risultato = calcolaPrezzoOrdine(p.nome, p.quantita, p.unita);
      totaleOrdine += risultato.prezzoTotale;
      
      return {
        ...p,
        prezzo: risultato.prezzoTotale,
        dettagliCalcolo: risultato
      };
    });
    
    let clienteId = null;
    if (typeof ordine.cliente === 'string') {
      clienteId = ordine.cliente;
    } else if (ordine.cliente && ordine.cliente._id) {
      clienteId = ordine.cliente._id;
    }
    
    const nuovoOrdine = {
      ...ordine,
      cliente: clienteId || ordine.cliente,
      prodotti: prodottiConCalcolo,
      totale: totaleOrdine,
      _id: undefined,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stato: ordine.stato || 'nuovo'
    };
    
    console.log('📤 Invio ordine al backend:', nuovoOrdine);
    
    try {
      if (!navigator.onLine) {
        throw new Error('Offline mode');
      }
      
      const response = await fetch(`${API_URL}/ordini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuovoOrdine)
      });
      
      if (response.ok) {
        const ordineCreato = await response.json();
        console.log('✅ Ordine creato con successo:', ordineCreato);
        
        await sincronizzaConMongoDB();
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ordine_creato',
            ordine: ordineCreato
          }));
        }
        
        mostraNotifica('Ordine salvato e giacenze aggiornate', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Errore backend:', response.status, errorData);
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Errore creazione ordine:', error);
      
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
  
  // Aggiornamento ordine esistente
  const aggiornaOrdine = async (ordine) => {
    let totaleOrdine = 0;
    const prodottiConCalcolo = (ordine.prodotti || []).map(p => {
      const risultato = calcolaPrezzoOrdine(p.nome, p.quantita, p.unita);
      totaleOrdine += risultato.prezzoTotale;
      
      return {
        ...p,
        prezzo: risultato.prezzoTotale,
        dettagliCalcolo: risultato
      };
    });
    
    let clienteId = null;
    if (typeof ordine.cliente === 'string') {
      clienteId = ordine.cliente;
    } else if (ordine.cliente && ordine.cliente._id) {
      clienteId = ordine.cliente._id;
    }
    
    const ordineAggiornato = {
      ...ordine,
      cliente: clienteId || ordine.cliente,
      prodotti: prodottiConCalcolo,
      totale: totaleOrdine,
      updatedAt: new Date().toISOString()
    };
    
    try {
      if (!navigator.onLine) {
        throw new Error('Offline mode');
      }
      
      const response = await fetch(`${API_URL}/ordini/${ordine._id || ordine.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ordineAggiornato)
      });
      
      if (response.ok) {
        await sincronizzaConMongoDB();
        mostraNotifica('Ordine aggiornato', 'success');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Errore aggiornamento:', error);
      
      setOrdini(prev => prev.map(o => 
        (o._id || o.id) === (ordineAggiornato._id || ordineAggiornato.id) 
          ? { ...ordineAggiornato, _syncPending: true }
          : o
      ));
      
      mostraNotifica('Ordine aggiornato localmente', 'warning');
    }
  };
  
  // Eliminazione ordine
  const eliminaOrdine = async (id) => {
    if (!confirm('Confermi eliminazione ordine?')) return;
    
    try {
      if (!navigator.onLine) {
        throw new Error('Offline mode');
      }
      
      const response = await fetch(`${API_URL}/ordini/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await sincronizzaConMongoDB();
        mostraNotifica('Ordine eliminato', 'success');
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Errore eliminazione:', error);
      mostraNotifica('Errore eliminazione', 'error');
    }
  };
  
  // Salva ordine (nuovo o aggiornamento)
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
  
  // Rimozione duplicati
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
  
  // Notifiche
  const mostraNotifica = (messaggio, tipo = 'info') => {
    setNotifica({ aperta: true, messaggio, tipo });
  };
  
  const chiudiNotifica = () => {
    setNotifica(prev => ({ ...prev, aperta: false }));
  };

  // Export functions (resto del codice invariato)
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
      (o.prodotti || []).map(p => {
        const dettagli = p.dettagliCalcolo?.dettagli || `${p.quantita} ${p.unita}`;
        return `${p.nome} (${dettagli})`;
      }).join('; '),
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
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; }
          .totale { text-align: right; font-weight: bold; margin-top: 20px; }
          .dettaglio-prodotto { font-size: 10px; color: #666; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>Pastificio Nonna Claudia - Ordini del ${new Date(dataSelezionata).toLocaleDateString('it-IT')}</h1>
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
                <td>
                  ${(o.prodotti || []).map(p => {
                    const dettagli = p.dettagliCalcolo?.dettagli || `${p.quantita} ${p.unita}`;
                    return `${p.nome}<br><span class="dettaglio-prodotto">${dettagli} - €${(p.prezzo || 0).toFixed(2)}</span>`;
                  }).join('<br>')}
                </td>
                <td>€${(o.totale || 0).toFixed(2)}</td>
                <td>${o.stato || 'nuovo'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totale">
          Totale Giornata: €${ordiniData.reduce((sum, o) => sum + (o.totale || 0), 0).toFixed(2)}
        </div>
        <div class="totale">
          Numero Ordini: ${ordiniData.length}
        </div>
        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Stampa
        </button>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };
  
  // Calcolo statistiche
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
  
  // Monitoraggio storage
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
  
  // RENDER (resto del codice UI invariato - troppo lungo per includerlo tutto)
  return (
    <>
      <style jsx global>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotating {
          animation: rotate 1s linear infinite;
        }
      `}</style>
      
      <Container maxWidth="xl">
        <StatisticheWidget ordini={ordini} />
        
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1">
              Gestione Ordini {prodottiCaricati && `✅ (${Object.values(prodottiDisponibili).flat().length} prodotti caricati)`}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <InstallPWA />
              
              <Tooltip title={syncInProgress ? "Sincronizzazione in corso..." : "Sincronizza"}>
                <span>
                  <IconButton onClick={() => sincronizzaConMongoDB()} disabled={syncInProgress}>
                    <SyncIcon className={syncInProgress ? 'rotating' : ''} />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Button
                variant="contained"
                size="small"
                color="secondary"
                startIcon={<AssessmentIcon />}
                onClick={() => setRiepilogoStampabileAperto(true)}
              >
                Riepilogo Stampabile
              </Button>
              
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
              
              <IconButton onClick={() => sincronizzaConMongoDB()} disabled={syncInProgress}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
          
          {/* Progress Bars */}
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
          
          {/* Connection Status */}
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
                    ? '✅ Prodotti dal DB - Giacenze automatiche attive - Sincronizzazione OK' 
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
        
        {/* Main Content */}
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
        
        {/* FAB Nuovo Ordine */}
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
        
        {/* Dialog Nuovo/Modifica Ordine */}
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
        
        {/* Dialog Riepilogo Semplice */}
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
            <RiepilogoSemplice 
              ordini={ordini} 
              dataSelezionata={dataSelezionata}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRiepilogoAperto(false)}>Chiudi</Button>
          </DialogActions>
        </Dialog>
        
        {/* Riepilogo Stampabile */}
        <RiepilogoGiornaliero 
          open={riepilogoStampabileAperto} 
          onClose={() => setRiepilogoStampabileAperto(false)}
          ordini={ordini}
        />
        
        {/* Dialog WhatsApp Helper */}
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
        
        {/* Snackbar Notifiche */}
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
    </>
  );
}