// components/GestoreOrdini.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useOrdini } from '@/contexts/OrdiniContext';
import { useSearchParams } from 'next/navigation';
import { 
  Box, Container, Grid, Paper, Typography, 
  Snackbar, Alert, CircularProgress, IconButton, Chip, Button,
  LinearProgress, Badge, Menu, MenuItem, Divider
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
  Speed as SpeedIcon
} from '@mui/icons-material';

// Importa i componenti esistenti
import NuovoOrdine from './NuovoOrdine';
import OrdiniList from './OrdiniList';
import InstallPWA from './InstallPWA';

// NUOVO: Importa il widget statistiche
import StatisticheWidget from './widgets/StatisticheWidget';

// Importa i servizi CORRETTI con named imports
import { loggingService } from '../services/loggingService';
import webSocketService from '../services/webSocketService';
import notificationService from '../services/notificationService';
import dashboardService from '../services/dashboardService';

// NUOVO: Importa gli stili moderni
import '../styles/modern-theme.css';

// Prodotti direttamente nel file per evitare errori di import
const prodottiDisponibili = {
  dolci: [
    { nome: "Pardulas", prezzo: 18.00, unita: "Kg", descrizione: "Dolci tradizionali sardi con ricotta e zafferano" },
    { nome: "Amaretti", prezzo: 20.00, unita: "Kg", descrizione: "Biscotti alle mandorle amare" },
    { nome: "Papassinas", prezzo: 20.00, unita: "Kg", descrizione: "Biscotti tradizionali sardi" },
    { nome: "Ciambelle con marmellata", prezzo: 16.00, unita: "Kg", descrizione: "Ciambelle dolci con marmellata" },
    { nome: "Ciambelle con Nutella", prezzo: 16.00, unita: "Kg", descrizione: "Ciambelle dolci con Nutella" },
    { nome: "Crostate", prezzo: 20.00, unita: "Kg", descrizione: "Crostate con marmellata" },
    { nome: "Cantucci", prezzo: 22.00, unita: "Kg", descrizione: "Biscotti secchi alle mandorle" },
    { nome: "Bianchini", prezzo: 15.00, unita: "Kg", descrizione: "Dolci tradizionali sardi" },
    { nome: "Gueffus", prezzo: 20.00, unita: "Kg", descrizione: "Dolci tradizionali sardi" },
    { nome: "Zeppole", prezzo: 20.00, unita: "Kg", descrizione: "Zeppole tradizionali" },
    { nome: "Pizzette sfoglia", prezzo: 15.00, unita: "Kg", descrizione: "Pizzette di pasta sfoglia" },
    { nome: "Torta di sapa", prezzo: 21.00, unita: "Kg", descrizione: "Torta tradizionale sarda con sapa" }
  ],
  panadas: [
    { nome: "Panada di anguille", prezzo: 25.00, unita: "Kg", descrizione: "Panada tradizionale con anguille" },
    { nome: "Panada di Agnello", prezzo: 30.00, unita: "Kg", descrizione: "Panada con carne di agnello" },
    { nome: "Panada di Maiale", prezzo: 20.00, unita: "Kg", descrizione: "Panada con carne di maiale" },
    { nome: "Panada di Vitella", prezzo: 22.00, unita: "Kg", descrizione: "Panada con carne di vitello" },
    { nome: "Panada di verdure", prezzo: 17.00, unita: "Kg", descrizione: "Panada vegetariana" },
    { nome: "Panadine carne o verdura", prezzo: 0.80, unita: "unità", descrizione: "Panadine singole" }
  ],
  pasta: [
    { nome: "Ravioli ricotta e zafferano", prezzo: 10.00, unita: "Kg", descrizione: "Ravioli con ricotta e zafferano" },
    { nome: "Ravioli ricotta spinaci e zafferano", prezzo: 10.00, unita: "Kg", descrizione: "Ravioli con ricotta, spinaci e zafferano" },
    { nome: "Ravioli ricotta spinaci", prezzo: 10.00, unita: "Kg", descrizione: "Ravioli con ricotta e spinaci" },
    { nome: "Ravioli ricotta dolci", prezzo: 10.00, unita: "Kg", descrizione: "Ravioli dolci con ricotta" },
    { nome: "Culurgiones", prezzo: 14.00, unita: "Kg", descrizione: "Culurgiones tradizionali sardi" },
    { nome: "Ravioli formaggio", prezzo: 15.00, unita: "Kg", descrizione: "Ravioli con formaggio" },
    { nome: "Sfoglie per Lasagne", prezzo: 5.00, unita: "Kg", descrizione: "Sfoglie fresche per lasagne" },
    { nome: "Pasta per panadas", prezzo: 4.50, unita: "Kg", descrizione: "Pasta fresca per panadas" },
    { nome: "Pasta per pizza", prezzo: 4.50, unita: "Kg", descrizione: "Pasta fresca per pizza" },
    { nome: "Fregola", prezzo: 10.00, unita: "Kg", descrizione: "Fregola sarda tradizionale" }
  ]
};

// Componente principale
export default function GestoreOrdini() {
  const { ordini, setOrdini, isConnected, setIsConnected } = useOrdini();
  const searchParams = useSearchParams();
  
  // Stati per la gestione degli ordini
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
  
  // NUOVO: Stati per funzionalità aggiuntive
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

  // AGGIUNTO: useEffect per gestire il parametro URL 'nuovo'
  useEffect(() => {
    if (searchParams.get('nuovo') === 'true') {
      setDialogoNuovoOrdineAperto(true);
      // Rimuovi il parametro dall'URL dopo aver aperto il dialog
      const url = new URL(window.location);
      url.searchParams.delete('nuovo');
      window.history.replaceState({}, '', url);
    }
  }, [searchParams]);

  // NUOVO: Calcola statistiche avanzate
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

  // NUOVO: Monitora storage locale
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
    const interval = setInterval(checkStorage, 30000); // Check ogni 30 secondi
    
    return () => clearInterval(interval);
  }, [ordini]);

  // NUOVO: Performance monitoring
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
  
  // useEffect per setup dashboard handlers
  useEffect(() => {
    const handleDashboardUpdate = (event) => {
      console.log('📊 Dashboard update event:', event.detail);
    };

    const handleDashboardRealtime = (event) => {
      console.log('📊 Dashboard realtime update:', event.detail);
    };

    window.addEventListener('dashboard:updated', handleDashboardUpdate);
    window.addEventListener('dashboard:realtime', handleDashboardRealtime);

    return () => {
      window.removeEventListener('dashboard:updated', handleDashboardUpdate);
      window.removeEventListener('dashboard:realtime', handleDashboardRealtime);
    };
  }, []);
  
  // CORRETTO: useEffect per inizializzare le notifiche
  useEffect(() => {
    const initNotifications = async () => {
      try {
        // Verifica se il servizio di notifiche è disponibile
        if (notificationService && notificationService.getPermissionStatus) {
          const status = notificationService.getPermissionStatus();
          setNotificationsEnabled(status === 'granted');
          
          if (status === 'default') {
            console.log('🔔 Notifiche disponibili ma non ancora autorizzate');
            // Non richiediamo automaticamente, aspettiamo azione utente
          }
        }
      } catch (error) {
        console.error('❌ Errore inizializzazione notifiche:', error);
      }
    };

    initNotifications();
  }, []);

  // NUOVO: Auto-sync periodico
  useEffect(() => {
    if (isConnected && hasToken) {
      syncIntervalRef.current = setInterval(() => {
        sincronizzaOrdini();
      }, 60000); // Sync ogni minuto
    }
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isConnected, hasToken]);
  
  // Effetto iniziale per setup - MODALITÀ OFFLINE
  useEffect(() => {
    console.log('🚀 Inizializzazione GestoreOrdini - MODALITÀ OFFLINE');
    
    // SEMPRE MODALITÀ OFFLINE
    setHasToken(false);
    setIsConnected(false);
    caricaOrdiniDaCache();
    mostraNotifica('Modalità offline attiva', 'info');
    
    // NON FARE LOGIN AUTOMATICO
    return;
  }, []);

  // NUOVO: Check WhatsApp status
  const checkWhatsAppStatus = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${backendUrl}/api/whatsapp/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWhatsappConnected(data.connected);
        console.log('📱 WhatsApp status:', data);
      }
    } catch (error) {
      console.error('❌ Errore check WhatsApp:', error);
      setWhatsappConnected(false);
    }
  };

  // NUOVO: Sincronizzazione manuale
  const sincronizzaOrdini = async () => {
    if (syncInProgress) return;
    
    setSyncInProgress(true);
    try {
      // Sincronizza ordini offline
      const ordiniOffline = ordini.filter(o => o._isOffline);
      
      for (const ordine of ordiniOffline) {
        try {
          await creaOrdine(ordine);
          console.log('✅ Sincronizzato ordine offline:', ordine.nomeCliente);
        } catch (error) {
          console.error('❌ Errore sync ordine:', error);
        }
      }
      
      // Ricarica ordini dal server
      await caricaOrdini();
      
      mostraNotifica(`Sincronizzazione completata: ${ordiniOffline.length} ordini sincronizzati`, 'success');
    } finally {
      setSyncInProgress(false);
    }
  };
  
  // Connessione WebSocket con notifiche browser e dashboard
  const connectWebSocket = async (token) => {
    try {
      console.log('🔌 Connessione WebSocket...');
      
      if (webSocketService.connect) {
        await webSocketService.connect(token);
        
        webSocketService.addConnectionListener((connected) => {
          setWsConnected(connected);
          console.log('📡 WebSocket connesso:', connected);
        });
        
        // Sottoscrivi agli aggiornamenti dashboard
        webSocketService.emit('dashboard:subscribe');
        
        // NUOVO: Handler per stato WhatsApp
        webSocketService.on('whatsapp:status', (data) => {
          console.log('📱 WhatsApp status update:', data);
          setWhatsappConnected(data.connected);
        });
        
        // Handler nuovo ordine con notifiche browser
        webSocketService.on('nuovo-ordine', (data) => {
          console.log('📨 Nuovo ordine via WebSocket:', data);
          
          setOrdini(prevOrdini => {
            const esistente = prevOrdini.find(o => 
              o._id === data.ordine._id ||
              (o.nomeCliente === data.ordine.nomeCliente && 
               o.telefono === data.ordine.telefono &&
               Math.abs(new Date(o.createdAt) - new Date(data.ordine.createdAt)) < 10000)
            );
            
            if (esistente) {
              console.log('⚠️ Ordine già presente (WebSocket), non aggiungo duplicato');
              return prevOrdini;
            }
            
            const nuoviOrdini = [data.ordine, ...prevOrdini];
            return nuoviOrdini;
          });
          
          if (audio && data.ordine.nomeCliente !== 'tfryht') {
            audio.play().catch(e => console.log('Audio non riprodotto:', e));
          }
          
          if (notificationsEnabled && notificationService.notifyOrderComplete) {
            notificationService.notifyOrderComplete({
              numeroOrdine: data.ordine._id?.slice(-6) || 'NUOVO'
            });
          }
          
          mostraNotifica(`🔔 NUOVO ORDINE: ${data.ordine.nomeCliente}`, 'success');
        });
        
        setWsConnected(true);
        console.log('✅ WebSocket connesso con successo');
      }
    } catch (error) {
      console.error('❌ Errore connessione WebSocket:', error);
      setWsConnected(false);
    }
  };
  
  // Cleanup WebSocket
  useEffect(() => {
    return () => {
      if (webSocketService && webSocketService.disconnect) {
        webSocketService.emit('dashboard:unsubscribe');
        webSocketService.disconnect();
      }
    };
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
    // In modalità offline, carica solo dalla cache
    caricaOrdiniDaCache();
  };

  // NUOVO: Export funzioni
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
    exportToCSV(ordiniData); // Per ora usa CSV
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

  // MODIFICATO: creaOrdine per modalità offline
  const creaOrdine = async (ordine) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Salva sempre offline
    const ordineConId = { 
      ...ordine, 
      _id: tempId,
      tempId,
      _isOffline: true,
      createdAt: new Date().toISOString()
    };
    
    setOrdini(prev => {
      const nuoviOrdini = [ordineConId, ...prev];
      // Salva in localStorage
      localStorage.setItem('ordini', JSON.stringify(nuoviOrdini));
      return nuoviOrdini;
    });
    
    console.log('💾 Ordine salvato localmente (offline)');
    mostraNotifica('Ordine salvato localmente', 'success');
  };
  
  const aggiornaOrdine = async (ordine) => {
    setOrdini(prev => {
      const nuoviOrdini = prev.map(o => o._id === ordine._id ? ordine : o);
      // Salva in localStorage
      localStorage.setItem('ordini', JSON.stringify(nuoviOrdini));
      return nuoviOrdini;
    });
    
    console.log('✅ Ordine aggiornato localmente');
    mostraNotifica('Ordine aggiornato con successo', 'success');
  };
  
  const eliminaOrdine = async (id) => {
    setOrdini(prev => {
      const nuoviOrdini = prev.filter(o => o._id !== id);
      // Salva in localStorage
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
      {/* NUOVO: Widget Statistiche */}
      <StatisticheWidget ordini={ordini} />
      
      {/* Header con indicatori di stato */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Gestione Ordini
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InstallPWA />
            
            {/* NUOVO: Menu Export */}
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
            {statistiche.ordiniOffline > 0 && (
              <Chip 
                label={`${statistiche.ordiniOffline} offline`}
                color="warning"
                size="small"
              />
            )}
            
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
        
        {/* NUOVO: Barra performance */}
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
}