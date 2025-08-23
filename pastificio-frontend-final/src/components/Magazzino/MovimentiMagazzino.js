// components/Magazzino/MovimentiMagazzino.js
import React, { useState, useEffect } from 'react';
import { resetChromeLoop, isChromeSafe } from '@/utils/chromeReset';
import webSocketService from '@/services/webSocketService';
import { useMagazzinoNotifications } from '../../hooks/useMagazzinoNotifications';
import notificationService from '../../services/notificationService';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tab,
  Tabs,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  InputAdornment,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ContentCopy as ContentCopyIcon,
  ContentPaste as ContentPasteIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Inventory as InventoryIcon,
  Sort as SortIcon,
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon
} from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Dati demo
const movimentiDemo = [
  {
    _id: 'demo1',
    tipo: 'carico',
    prodotto: { nome: 'Farina 00', categoria: 'Materie Prime' },
    quantita: 100,
    unita: 'kg',
    prezzoUnitario: 0.80,
    valoreMovimento: 80,
    fornitore: { nome: 'Molino Rossi' },
    documentoRiferimento: { numero: 'DDT/2024/001', tipo: 'DDT', data: new Date().toISOString() },
    dataMovimento: new Date().toISOString(),
    note: 'Carico settimanale'
  },
  {
    _id: 'demo2',
    tipo: 'scarico',
    prodotto: { nome: 'Farina 00', categoria: 'Materie Prime' },
    quantita: 20,
    unita: 'kg',
    prezzoUnitario: 0.80,
    valoreMovimento: 16,
    fornitore: { nome: 'Produzione' },
    documentoRiferimento: { numero: 'PROD/2024/001', tipo: 'Produzione', data: new Date().toISOString() },
    dataMovimento: new Date().toISOString(),
    note: 'Per produzione pardulas'
  }
];

const giacenzeDemo = [
  {
    _id: 'g1',
    prodotto: { nome: 'Farina 00', categoria: 'Materie Prime' },
    quantitaAttuale: 80,
    unita: 'kg',
    valoreMedio: 0.80,
    scorta: { minima: 50, ottimale: 150 },
    ultimoMovimento: {
      data: new Date().toISOString(),
      tipo: 'carico',
      quantita: 100
    }
  },
  {
    _id: 'g2',
    prodotto: { nome: 'Uova', categoria: 'Materie Prime' },
    quantitaAttuale: 200,
    unita: 'pz',
    valoreMedio: 0.25,
    scorta: { minima: 100, ottimale: 300 },
    ultimoMovimento: {
      data: new Date().toISOString(),
      tipo: 'carico',
      quantita: 300
    }
  }
];

const statsDemo = {
  valoreToTale: 114,
  perCategoria: {
    'Materie Prime': 114
  },
  prodottiSottoScorta: [],
  prodottiInScadenza: []
};

export default function MovimentiMagazzino() {
  // Stati
  const [isReady, setIsReady] = useState(false);
  const [tab, setTab] = useState(0);
  const [movimenti, setMovimenti] = useState([]);
  const [giacenze, setGiacenze] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [ordinamento, setOrdinamento] = useState({ campo: 'dataMovimento', direzione: 'desc' });

  // Attiva le notifiche del magazzino
  useMagazzinoNotifications();

  // Form nuovo movimento
  const [nuovoMovimento, setNuovoMovimento] = useState({
    tipo: 'carico',
    prodotto: {
      nome: '',
      categoria: ''
    },
    quantita: '',
    unita: 'kg',
    prezzoUnitario: '',
    fornitore: {
      nome: ''
    },
    documentoRiferimento: {
      tipo: '',
      numero: '',
      data: ''
    },
    lotto: '',
    dataScadenza: '',
    note: ''
  });

  // Lista prodotti suggeriti
  const prodottiSuggeriti = [
    'Farina 00',
    'Farina integrale',
    'Uova',
    'Burro',
    'Zucchero',
    'Sale',
    'Lievito',
    'Olio EVO',
    'Latte',
    'Ricotta',
    'Zafferano',
    'Mandorle',
    'Miele',
    'Cioccolato',
    'Nutella',
    'Marmellata'
  ];

  // Protezione Chrome MIGLIORATA
  useEffect(() => {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    
    if (isChrome && !isChromeSafe()) {
      resetChromeLoop();
      // Forza un refresh pulito una sola volta
      window.location.hash = '';
      window.location.reload();
      return;
    }
    
    // Se arriviamo qui, è sicuro procedere
    setIsReady(true);
  }, []);

  // Carica dati solo quando è sicuro
  useEffect(() => {
    if (isReady) {
      caricaDati();
      checkNotificationPermission();
      
      // Inizializza WebSocket
      initWebSocket();
    }
  }, [isReady]);

  // Monitora connessione WebSocket
  useEffect(() => {
    const handleConnectionChange = (connected) => {
      setConnectionStatus(connected ? 'connesso' : 'offline');
      console.log('🔌 Stato connessione magazzino:', connected ? 'connesso' : 'offline');
      
      // Se connesso, richiedi dati aggiornati
      if (connected) {
        webSocketService.emit('richiedi_inventario', {});
      }
    };

    webSocketService.addConnectionListener(handleConnectionChange);

    return () => {
      webSocketService.removeConnectionListener(handleConnectionChange);
    };
  }, []);

  // Cleanup listeners quando il componente si smonta
  useEffect(() => {
    return () => {
      console.log('🧹 Pulizia listener WebSocket magazzino');
      webSocketService.off('inventario_aggiornato');
      webSocketService.off('movimento_aggiunto');
      webSocketService.off('movimento_eliminato');
      webSocketService.off('movimenti_caricati');
    };
  }, []);

  // Inizializza WebSocket
  const initWebSocket = () => {
    console.log('🔌 Inizializzazione WebSocket per magazzino...');
    
    // Listener per aggiornamenti inventario
    webSocketService.on('inventario_aggiornato', (data) => {
      console.log('📦 Inventario aggiornato via WebSocket:', data);
      if (data.success && data.data) {
        // Trasforma i dati ricevuti nel formato giusto per giacenze
        const giacenzeAggiornate = data.data.map(item => ({
          _id: item.id || item._id || `ws_${Date.now()}_${Math.random()}`,
          prodotto: { 
            nome: item.prodotto || item.nome, 
            categoria: item.categoria || 'Non categorizzato'
          },
          quantitaAttuale: item.quantita || 0,
          unita: item.unita || 'kg',
          valoreMedio: item.valoreMedio || 0,
          scorta: { 
            minima: item.minimo || 10, 
            ottimale: (item.minimo || 10) * 3
          },
          ultimoMovimento: item.ultimoAggiornamento ? {
            data: item.ultimoAggiornamento,
            tipo: 'aggiornamento',
            quantita: item.quantita
          } : null
        }));
        
        setGiacenze(giacenzeAggiornate);
        localStorage.setItem('giacenzeMagazzino', JSON.stringify(giacenzeAggiornate));
        calcolaStatisticheLocali(giacenzeAggiornate);
        checkScorte(giacenzeAggiornate);
      }
    });

    // Listener per nuovi movimenti
    webSocketService.on('movimento_aggiunto', (movimento) => {
      console.log('➕ Nuovo movimento via WebSocket:', movimento);
      
      // Formatta il movimento ricevuto
      const movimentoFormattato = {
        _id: movimento.id || movimento._id || `ws_${Date.now()}`,
        tipo: movimento.tipo,
        prodotto: typeof movimento.prodotto === 'string' 
          ? { nome: movimento.prodotto, categoria: 'Non categorizzato' }
          : movimento.prodotto,
        quantita: movimento.quantita,
        unita: movimento.unita || 'kg',
        prezzoUnitario: movimento.prezzoUnitario || 0,
        valoreMovimento: movimento.valoreMovimento || (movimento.quantita * (movimento.prezzoUnitario || 0)),
        fornitore: movimento.fornitore || { nome: movimento.operatore || 'Sistema' },
        documentoRiferimento: movimento.documentoRiferimento || { numero: movimento.numeroDocumento },
        dataMovimento: movimento.dataMovimento || movimento.dataCreazione || new Date().toISOString(),
        note: movimento.note || ''
      };
      
      setMovimenti(prev => [movimentoFormattato, ...prev]);
      
      // Mostra notifica se abilitata
      if (notificationsEnabled) {
        notificationService.notifyStockMovement({
          tipo: movimentoFormattato.tipo,
          prodotto: movimentoFormattato.prodotto.nome,
          quantita: movimentoFormattato.quantita,
          unitaMisura: movimentoFormattato.unita
        });
      }
      
      // Aggiorna giacenze locali
      if (movimento.success) {
        aggiornaGiacenzeOffline(movimentoFormattato);
      }
    });

    // Listener per eliminazione movimenti
    webSocketService.on('movimento_eliminato', (data) => {
      console.log('🗑️ Movimento eliminato via WebSocket:', data);
      if (data.success && data.id) {
        setMovimenti(prev => prev.filter(m => m._id !== data.id));
        setSuccess('Movimento eliminato da altro dispositivo');
        setTimeout(() => setSuccess(''), 3000);
      }
    });

    // Listener per caricamento movimenti
    webSocketService.on('movimenti_caricati', (data) => {
      console.log('📋 Movimenti caricati via WebSocket:', data);
      if (data.success && data.data) {
        const movimentiFormattati = data.data.map(mov => ({
          _id: mov.id || mov._id || `ws_${Date.now()}_${Math.random()}`,
          tipo: mov.tipo,
          prodotto: typeof mov.prodotto === 'string' 
            ? { nome: mov.prodotto, categoria: 'Non categorizzato' }
            : mov.prodotto,
          quantita: mov.quantita,
          unita: mov.unita || 'kg',
          prezzoUnitario: mov.prezzoUnitario || 0,
          valoreMovimento: mov.valoreMovimento || (mov.quantita * (mov.prezzoUnitario || 0)),
          fornitore: mov.fornitore || { nome: mov.operatore || 'Sistema' },
          documentoRiferimento: mov.documentoRiferimento || { numero: mov.numeroDocumento },
          dataMovimento: mov.dataMovimento || new Date().toISOString(),
          note: mov.note || ''
        }));
        
        setMovimenti(movimentiFormattati);
        localStorage.setItem('movimentiMagazzino', JSON.stringify(movimentiFormattati));
      }
    });

    // Richiedi inventario iniziale
    setTimeout(() => {
      webSocketService.emit('richiedi_inventario', {});
      webSocketService.emit('get_movimenti', {});
    }, 500);
  };

  // Controlla permessi notifiche
  const checkNotificationPermission = async () => {
    const hasPermission = await notificationService.requestPermission();
    setNotificationsEnabled(hasPermission);
  };

  // Toggle notifiche
  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const hasPermission = await notificationService.requestPermission();
      setNotificationsEnabled(hasPermission);
      if (hasPermission) {
        notificationService.testNotification();
      }
    } else {
      setNotificationsEnabled(false);
      setSuccess('Notifiche disabilitate');
    }
  };

  // Se non è ancora pronto, mostra loading
  if (!isReady) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Inizializzazione...</Typography>
        </Box>
      </Container>
    );
  }

  const caricaDati = () => {
    setLoading(true);
    try {
      // Carica dati da localStorage o usa demo
      const movimentiCache = JSON.parse(localStorage.getItem('movimentiMagazzino') || '[]');
      const giacenzeCache = JSON.parse(localStorage.getItem('giacenzeMagazzino') || '[]');
      const statsCache = JSON.parse(localStorage.getItem('statsMagazzino') || 'null');

      if (movimentiCache.length === 0 && giacenzeCache.length === 0) {
        // Prima volta, usa dati demo
        setMovimenti(movimentiDemo);
        setGiacenze(giacenzeDemo);
        setStats(statsDemo);
        
        localStorage.setItem('movimentiMagazzino', JSON.stringify(movimentiDemo));
        localStorage.setItem('giacenzeMagazzino', JSON.stringify(giacenzeDemo));
        localStorage.setItem('statsMagazzino', JSON.stringify(statsDemo));
      } else {
        // Usa dati salvati
        setMovimenti(movimentiCache);
        setGiacenze(giacenzeCache);
        setStats(statsCache || statsDemo);
      }
      
      // Ricalcola statistiche e controlla scorte
      setTimeout(() => {
        calcolaStatisticheLocali(giacenzeCache.length > 0 ? giacenzeCache : giacenzeDemo);
        checkScorte(giacenzeCache.length > 0 ? giacenzeCache : giacenzeDemo);
      }, 100);
      
      // Se connesso, richiedi dati aggiornati dal server
      if (webSocketService.isConnected()) {
        webSocketService.emit('richiedi_inventario', {});
        webSocketService.emit('get_movimenti', {});
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      setError('Errore nel caricamento dati');
    } finally {
      setLoading(false);
    }
  };

  // Controlla scorte e invia notifiche
  const checkScorte = (giacenzeData) => {
    giacenzeData.forEach(g => {
      if (g.quantitaAttuale < (g.scorta?.minima || 0)) {
        notificationService.notifyLowStock({
          id: g._id,
          nome: g.prodotto?.nome || 'Sconosciuto',
          quantitaAttuale: g.quantitaAttuale,
          unitaMisura: g.unita,
          scortaMinima: g.scorta?.minima || 0
        });
      }
    });
  };

  const calcolaStatisticheLocali = (giacenzeData = giacenze) => {
    if (!giacenzeData || giacenzeData.length === 0) {
      setStats({
        valoreToTale: 0,
        perCategoria: {},
        prodottiSottoScorta: [],
        prodottiInScadenza: []
      });
      return;
    }

    const newStats = {
      valoreToTale: 0,
      perCategoria: {},
      prodottiSottoScorta: [],
      prodottiInScadenza: []
    };
    
    giacenzeData.forEach(g => {
      const valore = (g.quantitaAttuale || 0) * (g.valoreMedio || 0);
      newStats.valoreToTale += valore;
      
      const categoria = g.prodotto?.categoria || 'Non categorizzato';
      if (!newStats.perCategoria[categoria]) {
        newStats.perCategoria[categoria] = 0;
      }
      newStats.perCategoria[categoria] += valore;
      
      if (g.scorta && g.quantitaAttuale < g.scorta.minima) {
        newStats.prodottiSottoScorta.push({
          prodotto: g.prodotto?.nome || 'Sconosciuto',
          quantitaAttuale: g.quantitaAttuale,
          scortaMinima: g.scorta.minima,
          daOrdinare: g.scorta.ottimale - g.quantitaAttuale
        });
      }
    });
    
    setStats(newStats);
    localStorage.setItem('statsMagazzino', JSON.stringify(newStats));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validazione base
      if (!nuovoMovimento.prodotto.nome || !nuovoMovimento.quantita) {
        throw new Error('Prodotto e quantità sono obbligatori');
      }

      const quantita = parseFloat(nuovoMovimento.quantita);
      const prezzoUnitario = parseFloat(nuovoMovimento.prezzoUnitario) || 0;

      if (isNaN(quantita) || quantita <= 0) {
        throw new Error('La quantità deve essere un numero positivo');
      }

      const movimentoDaSalvare = {
        tipo: nuovoMovimento.tipo,
        prodotto: nuovoMovimento.prodotto,
        quantita: quantita,
        unita: nuovoMovimento.unita,
        prezzoUnitario: prezzoUnitario,
        valoreMovimento: quantita * prezzoUnitario,
        fornitore: nuovoMovimento.fornitore,
        documentoRiferimento: nuovoMovimento.documentoRiferimento,
        lotto: nuovoMovimento.lotto,
        dataScadenza: nuovoMovimento.dataScadenza,
        note: nuovoMovimento.note,
        dataMovimento: new Date().toISOString()
      };

      // Salva sempre offline
      salvaMovimentoOffline(movimentoDaSalvare);
      
      // Notifica movimento
      notificationService.notifyStockMovement({
        tipo: movimentoDaSalvare.tipo,
        prodotto: movimentoDaSalvare.prodotto.nome,
        quantita: movimentoDaSalvare.quantita,
        unitaMisura: movimentoDaSalvare.unita
      });
      
    } catch (error) {
      setError(error.message || 'Errore nel salvataggio');
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvaMovimentoOffline = (movimentoDaSalvare) => {
    try {
      const movimentoOffline = {
        ...movimentoDaSalvare,
        _id: editingId || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        _isOffline: true
      };
      
      let movimentiCache = JSON.parse(localStorage.getItem('movimentiMagazzino') || '[]');
      
      if (editingId) {
        movimentiCache = movimentiCache.map(m => m._id === editingId ? movimentoOffline : m);
      } else {
        movimentiCache.unshift(movimentoOffline);
      }
      
      localStorage.setItem('movimentiMagazzino', JSON.stringify(movimentiCache));
      setMovimenti(movimentiCache);
      
      // Aggiorna giacenze
      aggiornaGiacenzeOffline(movimentoOffline);
      
      // Invia anche via WebSocket se connesso
      // Invia anche via WebSocket se connesso (ma non duplicare)
if (webSocketService.isConnected() && !webSocketService.isMockMode()) {
  console.log('📤 Invio movimento via WebSocket...');
  webSocketService.emit('aggiungi_movimento', movimentoOffline);
  // In modalità mock, il movimento viene già aggiunto dal listener
}

      setSuccess('Movimento salvato con successo' + (webSocketService.isConnected() ? ' e sincronizzato' : ' (offline)'));
      setDialogOpen(false);
      resetForm();
      
      // Rimuovi messaggio dopo 3 secondi
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Errore salvataggio offline:', error);
      throw error;
    }
  };

  const aggiornaGiacenzeOffline = (movimento) => {
    try {
      let giacenzeCache = JSON.parse(localStorage.getItem('giacenzeMagazzino') || '[]');
      const index = giacenzeCache.findIndex(g => g.prodotto.nome === movimento.prodotto.nome);
      
      if (index !== -1) {
        const giacenza = giacenzeCache[index];
        const quantitaPrecedente = giacenza.quantitaAttuale;
        
        // Aggiorna quantità in base al tipo di movimento
        if (movimento.tipo === 'carico') {
          giacenza.quantitaAttuale += movimento.quantita;
        } else if (movimento.tipo === 'scarico') {
          giacenza.quantitaAttuale = Math.max(0, giacenza.quantitaAttuale - movimento.quantita);
        } else if (movimento.tipo === 'inventario') {
          giacenza.quantitaAttuale = movimento.quantita;
        }
        
        // Aggiorna valore medio per carichi
        if (movimento.tipo === 'carico' && movimento.prezzoUnitario > 0 && giacenza.quantitaAttuale > 0) {
          const valoreAttuale = (giacenza.quantitaAttuale - movimento.quantita) * (giacenza.valoreMedio || 0);
          const valoreNuovo = movimento.quantita * movimento.prezzoUnitario;
          giacenza.valoreMedio = (valoreAttuale + valoreNuovo) / giacenza.quantitaAttuale;
        }
        
        giacenza.ultimoMovimento = {
          data: movimento.dataMovimento,
          tipo: movimento.tipo,
          quantita: movimento.quantita
        };
        
        giacenzeCache[index] = giacenza;
        
        // Controlla se sotto scorta e notifica
        if (giacenza.quantitaAttuale < (giacenza.scorta?.minima || 0) && 
            quantitaPrecedente >= (giacenza.scorta?.minima || 0)) {
          notificationService.notifyLowStock({
            id: giacenza._id,
            nome: giacenza.prodotto?.nome || 'Sconosciuto',
            quantitaAttuale: giacenza.quantitaAttuale,
            unitaMisura: giacenza.unita,
            scortaMinima: giacenza.scorta?.minima || 0
          });
        }
      } else {
        // Crea nuova giacenza
        giacenzeCache.push({
          _id: `offline_g_${Date.now()}`,
          prodotto: movimento.prodotto,
          quantitaAttuale: movimento.tipo === 'carico' ? movimento.quantita : 0,
          unita: movimento.unita,
          valoreMedio: movimento.prezzoUnitario || 0,
          scorta: { minima: 10, ottimale: 50 },
          ultimoMovimento: {
            data: movimento.dataMovimento,
            tipo: movimento.tipo,
            quantita: movimento.quantita
          }
        });
      }
      
      localStorage.setItem('giacenzeMagazzino', JSON.stringify(giacenzeCache));
      setGiacenze(giacenzeCache);
      
      // Aggiorna statistiche
      calcolaStatisticheLocali(giacenzeCache);
    } catch (error) {
      console.error('Errore aggiornamento giacenze:', error);
    }
  };

  const handleEdit = (movimento) => {
    setNuovoMovimento({
      tipo: movimento.tipo,
      prodotto: movimento.prodotto || { nome: '', categoria: '' },
      quantita: movimento.quantita.toString(),
      unita: movimento.unita,
      prezzoUnitario: movimento.prezzoUnitario?.toString() || '',
      fornitore: movimento.fornitore || { nome: '' },
      documentoRiferimento: movimento.documentoRiferimento || { tipo: '', numero: '', data: '' },
      lotto: movimento.lotto || '',
      dataScadenza: movimento.dataScadenza || '',
      note: movimento.note || ''
    });
    setEditingId(movimento._id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo movimento?')) return;
    
    try {
      const movimentiCache = JSON.parse(localStorage.getItem('movimentiMagazzino') || '[]');
      const nuoviMovimenti = movimentiCache.filter(m => m._id !== id);
      localStorage.setItem('movimentiMagazzino', JSON.stringify(nuoviMovimenti));
      setMovimenti(nuoviMovimenti);
      
      // Invia eliminazione via WebSocket se connesso
      if (webSocketService.isConnected()) {
        webSocketService.emit('elimina_movimento', { id });
      }
      
      setSuccess('Movimento eliminato con successo');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Errore nell\'eliminazione');
    }
  };

  const handleSort = (campo) => {
    setOrdinamento(prev => ({
      campo,
      direzione: prev.campo === campo && prev.direzione === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportData = () => {
    try {
      const dataToExport = {
        movimenti: movimenti,
        giacenze: giacenze,
        statistiche: stats,
        dataExport: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `magazzino_export_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSuccess('Dati esportati con successo');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Errore durante l\'esportazione');
    }
  };

  // Funzioni per condivisione dati tra browser
  const exportToClipboard = async () => {
    try {
      const data = {
        movimenti: localStorage.getItem('movimentiMagazzino'),
        giacenze: localStorage.getItem('giacenzeMagazzino'),
        stats: localStorage.getItem('statsMagazzino')
      };
      
      await navigator.clipboard.writeText(JSON.stringify(data));
      setSuccess('Dati copiati negli appunti. Puoi incollarli nell\'altro browser.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Errore nella copia dei dati');
    }
  };

  const importFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      
      if (data.movimenti) localStorage.setItem('movimentiMagazzino', data.movimenti);
      if (data.giacenze) localStorage.setItem('giacenzeMagazzino', data.giacenze);
      if (data.stats) localStorage.setItem('statsMagazzino', data.stats);
      
      caricaDati();
      setSuccess('Dati importati con successo');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Errore nell\'importazione dei dati');
    }
  };

  const resetForm = () => {
    setNuovoMovimento({
      tipo: 'carico',
      prodotto: { nome: '', categoria: '' },
      quantita: '',
      unita: 'kg',
      prezzoUnitario: '',
      fornitore: { nome: '' },
      documentoRiferimento: { tipo: '', numero: '', data: '' },
      lotto: '',
      dataScadenza: '',
      note: ''
    });
    setEditingId(null);
  };

  const getColorByQuantita = (quantitaAttuale, scortaMinima) => {
    if (quantitaAttuale <= 0) return 'error';
    if (quantitaAttuale < scortaMinima) return 'warning';
    return 'success';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Ordina movimenti
  const movimentiOrdinati = [...movimenti].sort((a, b) => {
    let valoreA, valoreB;
    
    switch (ordinamento.campo) {
      case 'dataMovimento':
        valoreA = new Date(a.dataMovimento || a.createdAt);
        valoreB = new Date(b.dataMovimento || b.createdAt);
        break;
      case 'tipo':
        valoreA = a.tipo;
        valoreB = b.tipo;
        break;
      case 'prodotto':
        valoreA = a.prodotto?.nome || '';
        valoreB = b.prodotto?.nome || '';
        break;
      case 'quantita':
        valoreA = a.quantita;
        valoreB = b.quantita;
        break;
      case 'valore':
        valoreA = a.valoreMovimento || 0;
        valoreB = b.valoreMovimento || 0;
        break;
      default:
        valoreA = a[ordinamento.campo];
        valoreB = b[ordinamento.campo];
    }
    
    if (ordinamento.direzione === 'asc') {
      return valoreA < valoreB ? -1 : valoreA > valoreB ? 1 : 0;
    } else {
      return valoreA > valoreB ? -1 : valoreA < valoreB ? 1 : 0;
    }
  });

  const movimentiFiltrati = movimentiOrdinati.filter(m => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      m.prodotto?.nome?.toLowerCase().includes(search) ||
      m.fornitore?.nome?.toLowerCase().includes(search) ||
      m.documentoRiferimento?.numero?.toLowerCase().includes(search) ||
      m.note?.toLowerCase().includes(search) ||
      m.tipo?.toLowerCase().includes(search)
    );
  });

  // Funzioni helper
  const getNomeProdotto = (prodotto) => {
    if (!prodotto) return '-';
    if (typeof prodotto === 'string') return prodotto;
    if (typeof prodotto === 'object' && prodotto.nome) return prodotto.nome;
    return '-';
  };

  const getNomeFornitore = (fornitore) => {
    if (!fornitore) return '-';
    if (typeof fornitore === 'string') return fornitore;
    if (typeof fornitore === 'object' && fornitore.nome) return fornitore.nome;
    return '-';
  };

  const getNumeroDocumento = (movimento) => {
    if (movimento.documentoRiferimento?.numero) return movimento.documentoRiferimento.numero;
    if (movimento.numeroDocumento) return movimento.numeroDocumento;
    return '-';
  };

  const renderStatistiche = () => {
    const valoreTotale = stats?.valoreToTale || 0;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Valore Totale Magazzino
              </Typography>
              <Typography variant="h4" color="primary">
                € {valoreTotale.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Prodotti Sotto Scorta
              </Typography>
              <Typography variant="h4" color="warning.main">
                <Badge badgeContent={stats?.prodottiSottoScorta?.length || 0} color="warning">
                  <InventoryIcon fontSize="large" />
                </Badge>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Prodotti in Scadenza
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats?.prodottiInScadenza?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Movimenti Oggi
              </Typography>
              <Typography variant="h4">
                {movimenti.filter(m => {
                  const oggi = new Date().toDateString();
                  const dataMovimento = new Date(m.dataMovimento || m.createdAt).toDateString();
                  return oggi === dataMovimento;
                }).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestione Magazzino
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isChrome && (
            <Chip 
              label="Chrome: Modalità Offline"
              color="warning"
              size="small"
              icon={<WarningIcon />}
            />
          )}
          <Chip 
            label={`Modalità: ${connectionStatus}`}
            color={connectionStatus === 'connesso' ? 'success' : 'warning'}
            size="small"
            icon={connectionStatus === 'connesso' ? <SyncIcon /> : <SyncDisabledIcon />}
          />
          {webSocketService.isMockMode() && (
            <Chip 
              label="Mock Mode"
              color="info"
              size="small"
            />
          )}
          <Tooltip title={notificationsEnabled ? 'Disabilita notifiche' : 'Abilita notifiche'}>
            <IconButton onClick={toggleNotifications} color={notificationsEnabled ? 'primary' : 'default'}>
              {notificationsEnabled ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={exportToClipboard}
            size="small"
          >
            Copia Dati
          </Button>
          <Button
            variant="outlined"
            startIcon={<ContentPasteIcon />}
            onClick={importFromClipboard}
            size="small"
          >
            Incolla Dati
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportData}
          >
            Esporta
          </Button>
          <IconButton onClick={caricaDati} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { resetForm(); setDialogOpen(true); }}
          >
            Nuovo Movimento
          </Button>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Statistiche */}
      {renderStatistiche()}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Movimenti" />
          <Tab label="Giacenze" />
          <Tab label={
            <Badge badgeContent={stats?.prodottiSottoScorta?.length || 0} color="warning">
              <Typography>Sotto Scorta</Typography>
            </Badge>
          } />
        </Tabs>

        {/* Tab Movimenti */}
        <TabPanel value={tab} index={0}>
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Cerca movimenti..."
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Button 
                      variant="text" 
                      onClick={() => handleSort('dataMovimento')}
                      endIcon={<SortIcon />}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Data
                      {ordinamento.campo === 'dataMovimento' && (
                        <span>{ordinamento.direzione === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="text" 
                      onClick={() => handleSort('tipo')}
                      endIcon={<SortIcon />}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Tipo
                      {ordinamento.campo === 'tipo' && (
                        <span>{ordinamento.direzione === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="text" 
                      onClick={() => handleSort('prodotto')}
                      endIcon={<SortIcon />}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Prodotto
                      {ordinamento.campo === 'prodotto' && (
                        <span>{ordinamento.direzione === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="text" 
                      onClick={() => handleSort('quantita')}
                      endIcon={<SortIcon />}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Quantità
                      {ordinamento.campo === 'quantita' && (
                        <span>{ordinamento.direzione === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>Prezzo Unitario</TableCell>
                  <TableCell>
                    <Button 
                      variant="text" 
                      onClick={() => handleSort('valore')}
                      endIcon={<SortIcon />}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Valore
                      {ordinamento.campo === 'valore' && (
                        <span>{ordinamento.direzione === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>Fornitore</TableCell>
                  <TableCell>Documento</TableCell>
                  <TableCell>Note</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movimentiFiltrati.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Nessun movimento trovato
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  movimentiFiltrati.map((movimento) => (
                    <TableRow key={movimento._id}>
                      <TableCell>
                        {formatDate(movimento.dataMovimento || movimento.createdAt)}
                        {movimento._isOffline && (
                          <Chip 
                            label="Offline" 
                            size="small" 
                            color="warning" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movimento.tipo}
                          color={
                            movimento.tipo === 'carico' ? 'success' :
                            movimento.tipo === 'scarico' ? 'error' : 'default'
                          }
                          size="small"
                          icon={
                            movimento.tipo === 'carico' ? <TrendingUpIcon /> :
                            movimento.tipo === 'scarico' ? <TrendingDownIcon /> : null
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {getNomeProdotto(movimento.prodotto)}
                          </Typography>
                          {movimento.prodotto?.categoria && (
                            <Typography variant="caption" color="text.secondary">
                              {movimento.prodotto.categoria}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {movimento.quantita} {movimento.unita}
                      </TableCell>
                      <TableCell>
                        € {(movimento.prezzoUnitario || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          € {(movimento.valoreMovimento || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getNomeFornitore(movimento.fornitore)}
                      </TableCell>
                      <TableCell>
                        {getNumeroDocumento(movimento)}
                      </TableCell>
                     <TableCell>
                       <Typography variant="body2" sx={{ maxWidth: 150 }}>
                         {movimento.note || '-'}
                       </Typography>
                     </TableCell>
                     <TableCell>
                       <Box sx={{ display: 'flex', gap: 1 }}>
                         <IconButton
                           size="small"
                           onClick={() => handleEdit(movimento)}
                           color="primary"
                         >
                           <EditIcon />
                         </IconButton>
                         <IconButton
                           size="small"
                           onClick={() => handleDelete(movimento._id)}
                           color="error"
                         >
                           <DeleteIcon />
                         </IconButton>
                       </Box>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </TableContainer>
       </TabPanel>

       {/* Tab Giacenze */}
       <TabPanel value={tab} index={1}>
         <TableContainer component={Paper}>
           <Table>
             <TableHead>
               <TableRow>
                 <TableCell>Prodotto</TableCell>
                 <TableCell>Categoria</TableCell>
                 <TableCell>Quantità Attuale</TableCell>
                 <TableCell>Valore Medio</TableCell>
                 <TableCell>Valore Totale</TableCell>
                 <TableCell>Scorta Minima</TableCell>
                 <TableCell>Ultimo Movimento</TableCell>
                 <TableCell>Stato</TableCell>
               </TableRow>
             </TableHead>
             <TableBody>
               {giacenze.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={8} align="center">
                     <Typography variant="body2" color="text.secondary">
                       Nessuna giacenza disponibile
                     </Typography>
                   </TableCell>
                 </TableRow>
               ) : (
                 giacenze.map((giacenza) => (
                   <TableRow key={giacenza._id}>
                     <TableCell>
                       <Typography variant="body2" fontWeight="bold">
                         {giacenza.prodotto?.nome || '-'}
                       </Typography>
                     </TableCell>
                     <TableCell>
                       {giacenza.prodotto?.categoria || '-'}
                     </TableCell>
                     <TableCell>
                       {giacenza.quantitaAttuale} {giacenza.unita}
                     </TableCell>
                     <TableCell>
                       € {(giacenza.valoreMedio || 0).toFixed(2)}
                     </TableCell>
                     <TableCell>
                       <Typography variant="body2" fontWeight="bold">
                         € {(giacenza.quantitaAttuale * giacenza.valoreMedio || 0).toFixed(2)}
                       </Typography>
                     </TableCell>
                     <TableCell>
                       {giacenza.scorta?.minima || 0} {giacenza.unita}
                     </TableCell>
                     <TableCell>
                       {giacenza.ultimoMovimento ? (
                         <Box>
                           <Typography variant="caption">
                             {formatDate(giacenza.ultimoMovimento.data)}
                           </Typography>
                           <br />
                           <Chip 
                             label={giacenza.ultimoMovimento.tipo}
                             size="small"
                             variant="outlined"
                           />
                         </Box>
                       ) : '-'}
                     </TableCell>
                     <TableCell>
                       <Chip
                         label={
                           giacenza.quantitaAttuale <= 0 ? 'Esaurito' :
                           giacenza.quantitaAttuale < (giacenza.scorta?.minima || 0) ? 'Sotto scorta' :
                           'Disponibile'
                         }
                         color={getColorByQuantita(giacenza.quantitaAttuale, giacenza.scorta?.minima || 0)}
                         size="small"
                       />
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </TableContainer>
       </TabPanel>

       {/* Tab Sotto Scorta */}
       <TabPanel value={tab} index={2}>
         {stats?.prodottiSottoScorta?.length > 0 ? (
           <TableContainer component={Paper}>
             <Table>
               <TableHead>
                 <TableRow>
                   <TableCell>Prodotto</TableCell>
                   <TableCell>Quantità Attuale</TableCell>
                   <TableCell>Scorta Minima</TableCell>
                   <TableCell>Da Ordinare</TableCell>
                   <TableCell>Priorità</TableCell>
                   <TableCell>Azioni</TableCell>
                 </TableRow>
               </TableHead>
               <TableBody>
                 {stats.prodottiSottoScorta.map((prodotto, index) => (
                   <TableRow key={index}>
                     <TableCell>
                       <Typography variant="body2" fontWeight="bold">
                         {prodotto.prodotto}
                       </Typography>
                     </TableCell>
                     <TableCell>
                       <Typography color="error">
                         {prodotto.quantitaAttuale}
                       </Typography>
                     </TableCell>
                     <TableCell>
                       {prodotto.scortaMinima}
                     </TableCell>
                     <TableCell>
                       <Typography variant="body2" fontWeight="bold">
                         {Math.max(0, prodotto.daOrdinare)}
                       </Typography>
                     </TableCell>
                     <TableCell>
                       <Chip
                         label={
                           prodotto.quantitaAttuale <= 0 ? 'URGENTE' :
                           prodotto.quantitaAttuale < prodotto.scortaMinima * 0.5 ? 'ALTA' :
                           'MEDIA'
                         }
                         color={
                           prodotto.quantitaAttuale <= 0 ? 'error' :
                           prodotto.quantitaAttuale < prodotto.scortaMinima * 0.5 ? 'warning' :
                           'default'
                         }
                         size="small"
                         icon={<WarningIcon />}
                       />
                     </TableCell>
                     <TableCell>
                       <Button
                         variant="contained"
                         size="small"
                         onClick={() => {
                           setNuovoMovimento(prev => ({
                             ...prev,
                             tipo: 'carico',
                             prodotto: { nome: prodotto.prodotto, categoria: '' },
                             quantita: prodotto.daOrdinare.toString()
                           }));
                           setDialogOpen(true);
                         }}
                       >
                         Ordina
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </TableContainer>
         ) : (
           <Box sx={{ textAlign: 'center', py: 4 }}>
             <Typography variant="h6" color="text.secondary">
               Nessun prodotto sotto scorta
             </Typography>
             <Typography variant="body2" color="text.secondary">
               Tutti i prodotti hanno quantità sufficienti
             </Typography>
           </Box>
         )}
       </TabPanel>
     </Paper>

     {/* Dialog Nuovo/Modifica Movimento */}
     <Dialog 
       open={dialogOpen} 
       onClose={() => setDialogOpen(false)}
       maxWidth="md"
       fullWidth
     >
       <form onSubmit={handleSubmit}>
         <DialogTitle>
           {editingId ? 'Modifica Movimento' : 'Nuovo Movimento'}
         </DialogTitle>
         <DialogContent>
           <Grid container spacing={2} sx={{ mt: 1 }}>
             {/* Tipo Movimento */}
             <Grid item xs={12} md={4}>
               <FormControl fullWidth>
                 <InputLabel>Tipo Movimento</InputLabel>
                 <Select
                   value={nuovoMovimento.tipo}
                   onChange={(e) => setNuovoMovimento(prev => ({
                     ...prev,
                     tipo: e.target.value
                   }))}
                   label="Tipo Movimento"
                 >
                   <MenuItem value="carico">Carico</MenuItem>
                   <MenuItem value="scarico">Scarico</MenuItem>
                   <MenuItem value="inventario">Inventario</MenuItem>
                   <MenuItem value="rettifica">Rettifica</MenuItem>
                 </Select>
               </FormControl>
             </Grid>

             {/* Prodotto */}
             <Grid item xs={12} md={4}>
               <TextField
                 fullWidth
                 label="Nome Prodotto"
                 value={nuovoMovimento.prodotto.nome}
                 onChange={(e) => setNuovoMovimento(prev => ({
                   ...prev,
                   prodotto: { ...prev.prodotto, nome: e.target.value }
                 }))}
                 required
                 list="prodotti-suggeriti"
               />
               <datalist id="prodotti-suggeriti">
                 {prodottiSuggeriti.map((prodotto, index) => (
                   <option key={index} value={prodotto} />
                 ))}
               </datalist>
             </Grid>

             {/* Categoria */}
             <Grid item xs={12} md={4}>
               <FormControl fullWidth>
                 <InputLabel>Categoria</InputLabel>
                 <Select
                   value={nuovoMovimento.prodotto.categoria}
                   onChange={(e) => setNuovoMovimento(prev => ({
                     ...prev,
                     prodotto: { ...prev.prodotto, categoria: e.target.value }
                   }))}
                   label="Categoria"
                 >
                   <MenuItem value="Materie Prime">Materie Prime</MenuItem>
                   <MenuItem value="Ingredienti">Ingredienti</MenuItem>
                   <MenuItem value="Prodotti Finiti">Prodotti Finiti</MenuItem>
                   <MenuItem value="Imballaggi">Imballaggi</MenuItem>
                   <MenuItem value="Accessori">Accessori</MenuItem>
                 </Select>
               </FormControl>
             </Grid>

             {/* Quantità */}
             <Grid item xs={12} md={6}>
               <TextField
                 fullWidth
                 label="Quantità"
                 type="number"
                 value={nuovoMovimento.quantita}
                 onChange={(e) => setNuovoMovimento(prev => ({
                   ...prev,
                   quantita: e.target.value
                 }))}
                 required
                 inputProps={{ min: "0", step: "0.01" }}
               />
             </Grid>

             {/* Unità di Misura */}
             <Grid item xs={12} md={6}>
               <FormControl fullWidth>
                 <InputLabel>Unità di Misura</InputLabel>
                 <Select
                   value={nuovoMovimento.unita}
                   onChange={(e) => setNuovoMovimento(prev => ({
                     ...prev,
                     unita: e.target.value
                   }))}
                   label="Unità di Misura"
                 >
                   <MenuItem value="kg">Kg</MenuItem>
                   <MenuItem value="g">Grammi</MenuItem>
                   <MenuItem value="l">Litri</MenuItem>
                   <MenuItem value="ml">Millilitri</MenuItem>
                   <MenuItem value="pz">Pezzi</MenuItem>
                   <MenuItem value="conf">Confezioni</MenuItem>
                 </Select>
               </FormControl>
             </Grid>

             {/* Prezzo Unitario */}
             <Grid item xs={12} md={6}>
               <TextField
                 fullWidth
                 label="Prezzo Unitario"
                 type="number"
                 value={nuovoMovimento.prezzoUnitario}
                 onChange={(e) => setNuovoMovimento(prev => ({
                   ...prev,
                   prezzoUnitario: e.target.value
                 }))}
                 inputProps={{ min: "0", step: "0.01" }}
                 InputProps={{
                   startAdornment: <InputAdornment position="start">€</InputAdornment>,
                 }}
               />
             </Grid>

             {/* Fornitore */}
             <Grid item xs={12} md={6}>
               <TextField
                 fullWidth
                 label="Fornitore"
                 value={nuovoMovimento.fornitore.nome}
                 onChange={(e) => setNuovoMovimento(prev => ({
                   ...prev,
                   fornitore: { ...prev.fornitore, nome: e.target.value }
                 }))}
               />
             </Grid>

             {/* Documento di Riferimento */}
             <Grid item xs={12} md={6}>
               <TextField
                 fullWidth
                 label="Numero Documento"
                 value={nuovoMovimento.documentoRiferimento.numero}
                 onChange={(e) => setNuovoMovimento(prev => ({
                   ...prev,
                   documentoRiferimento: { 
                     ...prev.documentoRiferimento, 
                     numero: e.target.value 
                   }
                 }))}
               />
             </Grid>

             {/* Lotto */}
             <Grid item xs={12} md={6}>
               <TextField
                 fullWidth
                 label="Lotto"
                 value={nuovoMovimento.lotto}
                 onChange={(e) => setNuovoMovimento(prev => ({
                   ...prev,
                   lotto: e.target.value
                 }))}
               />
             </Grid>

             {/* Data Scadenza */}
             <Grid item xs={12} md={6}>
               <TextField
                 fullWidth
                 label="Data Scadenza"
                 type="date"
                 value={nuovoMovimento.dataScadenza}
                 onChange={(e) => setNuovoMovimento(prev => ({
                   ...prev,
                   dataScadenza: e.target.value
                 }))}
                 InputLabelProps={{
                   shrink: true,
                 }}
               />
             </Grid>

             {/* Note */}
             <Grid item xs={12}>
               <TextField
                 fullWidth
                 label="Note"
                 multiline
                 rows={3}
                 value={nuovoMovimento.note}
                 onChange={(e) => setNuovoMovimento(prev => ({
                   ...prev,
                   note: e.target.value
                 }))}
               />
             </Grid>

             {/* Riepilogo Valore */}
             {nuovoMovimento.quantita && nuovoMovimento.prezzoUnitario && (
               <Grid item xs={12}>
                 <Card variant="outlined">
                   <CardContent>
                     <Typography variant="h6">
                       Valore Totale Movimento: € {(
                         parseFloat(nuovoMovimento.quantita || 0) * 
                         parseFloat(nuovoMovimento.prezzoUnitario || 0)
                       ).toFixed(2)}
                     </Typography>
                   </CardContent>
                 </Card>
               </Grid>
             )}
           </Grid>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setDialogOpen(false)}>
             Annulla
           </Button>
           <Button 
             type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {editingId ? 'Aggiorna' : 'Salva'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  </Container>
);
}