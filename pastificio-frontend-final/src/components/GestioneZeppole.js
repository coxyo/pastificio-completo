// src/components/GestioneZeppole.js
// ✅ VERSIONE 15/01/2026 - Aggiunto selettore data per navigare tra i giorni

import React, { useState, useEffect, useCallback } from 'react';
import Pusher from 'pusher-js';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  TextField,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  RestartAlt as ResetIcon,
  Add as AddIcon,
  ShoppingCart as CartIcon,
  LocalPizza as ZeppoleIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon
} from '@mui/icons-material';

// ✅ FIX: API_URL include già /api, quindi nelle chiamate NON aggiungiamo /api
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';
const PRODOTTO_NOME = 'Zeppole';

// Helper per formattare la data
const formatDateForAPI = (date) => {
  return date.toISOString().split('T')[0];
};

const formatDateDisplay = (date) => {
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('it-IT', options);
};

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const GestioneZeppole = () => {
  // ✅ NUOVO: State per la data selezionata
  const [dataSelezionata, setDataSelezionata] = useState(new Date());
  
  const [limite, setLimite] = useState(null);
  const [ordini, setOrdini] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuovoLimite, setNuovoLimite] = useState(20);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [dialogReset, setDialogReset] = useState(false);
  const [dialogVendita, setDialogVendita] = useState(false);
  const [dialogEditLimite, setDialogEditLimite] = useState(false);
  const [quantitaPersonalizzata, setQuantitaPersonalizzata] = useState('');
  const [ultimoAggiornamento, setUltimoAggiornamento] = useState(new Date());

  const getToken = () => localStorage.getItem('token');
  
  // Helper per fetch con auth (token opzionale)
  const fetchWithAuth = async (url, options = {}) => {
    const token = getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // ✅ NUOVO: Funzioni per navigare tra le date
  const goToPreviousDay = () => {
    const newDate = new Date(dataSelezionata);
    newDate.setDate(newDate.getDate() - 1);
    setDataSelezionata(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(dataSelezionata);
    newDate.setDate(newDate.getDate() + 1);
    setDataSelezionata(newDate);
  };

  const goToToday = () => {
    setDataSelezionata(new Date());
  };

  // ✅ FIX: Pusher useEffect SENZA dipendenze che causano loop
  useEffect(() => {
    console.log('🔌 [Zeppole] Inizializzazione Pusher...');
    
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!pusherKey) {
      console.warn('⚠️ [Zeppole] PUSHER_KEY non configurata');
      return;
    }

    const pusher = new Pusher(pusherKey, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
      encrypted: true
    });

    const channel = pusher.subscribe('limiti-channel');
    const ordiniChannel = pusher.subscribe('ordini-channel');

    channel.bind('limite-aggiornato', (data) => {
      console.log('📡 [Zeppole] Pusher: limite-aggiornato', data);
      if (data.prodotto === PRODOTTO_NOME) {
        caricaDati();
      }
    });

    ordiniChannel.bind('nuovo-ordine', (data) => {
      console.log('📡 [Zeppole] Pusher: nuovo-ordine', data);
      if (data.prodotti?.some(p => p.nome === PRODOTTO_NOME)) {
        caricaDati();
      }
    });

    ordiniChannel.bind('ordine-aggiornato', () => {
      console.log('📡 [Zeppole] Pusher: ordine-aggiornato');
      caricaDati();
    });

    console.log('✅ [Zeppole] Pusher connesso');

    return () => {
      console.log('🔌 [Zeppole] Disconnessione Pusher...');
      channel.unbind_all();
      channel.unsubscribe();
      ordiniChannel.unbind_all();
      ordiniChannel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  // ✅ MODIFICATO: Carica dati quando cambia la data selezionata
  useEffect(() => {
    console.log('📥 [Zeppole] Caricamento dati per data:', formatDateForAPI(dataSelezionata));
    console.log('🔗 [Zeppole] API URL:', API_URL);
    caricaDati();
  }, [dataSelezionata]);

  // Auto-refresh solo per oggi
  useEffect(() => {
    if (!isToday(dataSelezionata)) return;
    
    const interval = setInterval(() => {
      console.log('🔄 [Zeppole] Refresh automatico...');
      caricaDati();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [dataSelezionata]);

  const caricaDati = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 [Zeppole] Chiamata API caricaDati per data:', formatDateForAPI(dataSelezionata));
      await Promise.all([caricaLimite(), caricaOrdini()]);
      setUltimoAggiornamento(new Date());
      setLoading(false);
      console.log('✅ [Zeppole] Dati caricati');
    } catch (error) {
      console.error('❌ [Zeppole] Errore caricamento dati:', error);
      showSnackbar('Errore nel caricamento dati', 'error');
      setLoading(false);
    }
  }, [dataSelezionata]);

  const caricaLimite = async () => {
    try {
      // ✅ MODIFICATO: Aggiungi data come query parameter
      const dataParam = formatDateForAPI(dataSelezionata);
      const url = `${API_URL}/limiti/prodotto/${PRODOTTO_NOME}?data=${dataParam}`;
      console.log('📡 [Zeppole] GET', url);
      
      const data = await fetchWithAuth(url);
      
      const limiteData = data.data;
      setLimite(limiteData);
      setNuovoLimite(limiteData.limiteQuantita);
      
      console.log('✅ [Zeppole] Limite caricato:', limiteData);
    } catch (error) {
      console.error('❌ [Zeppole] Errore caricamento limite:', error);
      // Se non esiste limite per quella data, crea uno di default
      setLimite({
        limiteQuantita: 50,
        quantitaOrdinata: 0,
        unitaMisura: 'Kg'
      });
    }
  };

  const caricaOrdini = async () => {
    try {
      // ✅ MODIFICATO: Aggiungi data come query parameter
      const dataParam = formatDateForAPI(dataSelezionata);
      const url = `${API_URL}/limiti/ordini-prodotto/${PRODOTTO_NOME}?data=${dataParam}`;
      console.log('📡 [Zeppole] GET', url);
      
      const data = await fetchWithAuth(url);
      
      setOrdini(data.data || []);
      console.log(`✅ [Zeppole] Ordini caricati: ${data.count}`);
    } catch (error) {
      console.error('❌ [Zeppole] Errore caricamento ordini:', error);
      setOrdini([]);
    }
  };

  const salvaLimite = async () => {
    try {
      if (!limite?._id) {
        showSnackbar('Limite non trovato', 'error');
        return;
      }
      
      const url = `${API_URL}/limiti/${limite._id}`;
      console.log('📡 [Zeppole] PUT', url);
      
      await fetchWithAuth(url, {
        method: 'PUT',
        body: JSON.stringify({ limiteQuantita: nuovoLimite })
      });

      showSnackbar(`Limite aggiornato a ${nuovoLimite} Kg`, 'success');
      setDialogEditLimite(false);
      await caricaDati();
    } catch (error) {
      console.error('❌ [Zeppole] Errore salvataggio limite:', error);
      showSnackbar('Errore nel salvataggio', 'error');
    }
  };

  const resetDisponibilita = async () => {
    try {
      const dataParam = formatDateForAPI(dataSelezionata);
      const url = `${API_URL}/limiti/reset-prodotto`;
      console.log('📡 [Zeppole] POST', url);
      
      await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify({ prodotto: PRODOTTO_NOME, data: dataParam })
      });

      showSnackbar('Disponibilità resettata!', 'success');
      setDialogReset(false);
      await caricaDati();
    } catch (error) {
      console.error('❌ [Zeppole] Errore reset:', error);
      showSnackbar('Errore nel reset', 'error');
    }
  };

  const venditaRapida = async (quantitaKg) => {
    try {
      const url = `${API_URL}/limiti/vendita-diretta`;
      console.log('📡 [Zeppole] POST', url, { prodotto: PRODOTTO_NOME, quantitaKg });
      
      await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify({ 
          prodotto: PRODOTTO_NOME, 
          quantitaKg,
          data: formatDateForAPI(dataSelezionata)
        })
      });

      showSnackbar(`Vendita di ${quantitaKg} Kg registrata!`, 'success');
      await caricaDati();
    } catch (error) {
      console.error('❌ [Zeppole] Errore vendita:', error);
      showSnackbar(error.message || 'Errore nella vendita', 'error');
    }
  };

  const venditaPersonalizzata = async () => {
    const quantita = parseFloat(quantitaPersonalizzata);
    if (isNaN(quantita) || quantita <= 0) {
      showSnackbar('Inserisci una quantità valida', 'warning');
      return;
    }
    
    setDialogVendita(false);
    await venditaRapida(quantita);
    setQuantitaPersonalizzata('');
  };

  // Calcoli
  const disponibile = limite ? Math.max(0, limite.limiteQuantita - limite.quantitaOrdinata) : 0;
  const percentualeUsata = limite ? (limite.quantitaOrdinata / limite.limiteQuantita) * 100 : 0;
  const totaleOrdini = ordini.reduce((acc, o) => acc + (o.quantitaKg || 0), 0);

  const getProgressColor = (percent) => {
    if (percent >= 90) return 'error';
    if (percent >= 70) return 'warning';
    return 'success';
  };

  if (loading && !limite) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <LinearProgress sx={{ width: '100%' }} />
        <Typography variant="body2" color="text.secondary">
          Caricamento dati Zeppole...
        </Typography>
      </Box>
    );
  }

  if (!limite) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Impossibile caricare i dati. Riprova più tardi.
          <Button onClick={caricaDati} sx={{ ml: 2 }}>
            Riprova
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 3, 
          background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ZeppoleIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                🎂 Gestione Zeppole
              </Typography>
              <Typography variant="body2">
                Monitoraggio disponibilità giornaliera
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Aggiorna dati">
              <IconButton onClick={caricaDati} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* ✅ NUOVO: Selettore Data */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Tooltip title="Giorno precedente">
            <IconButton onClick={goToPreviousDay} color="primary" size="large">
              <PrevIcon />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            minWidth: 300
          }}>
            <TextField
              type="date"
              value={formatDateForAPI(dataSelezionata)}
              onChange={(e) => setDataSelezionata(new Date(e.target.value + 'T00:00:00'))}
              size="small"
              sx={{ width: 160 }}
            />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: isToday(dataSelezionata) ? 'bold' : 'normal',
                color: isToday(dataSelezionata) ? 'primary.main' : 'text.primary',
                textTransform: 'capitalize'
              }}
            >
              {formatDateDisplay(dataSelezionata)}
            </Typography>
          </Box>

          <Tooltip title="Giorno successivo">
            <IconButton onClick={goToNextDay} color="primary" size="large">
              <NextIcon />
            </IconButton>
          </Tooltip>

          {!isToday(dataSelezionata) && (
            <Tooltip title="Vai a oggi">
              <Button 
                variant="outlined" 
                startIcon={<TodayIcon />}
                onClick={goToToday}
                size="small"
              >
                Oggi
              </Button>
            </Tooltip>
          )}

          {isToday(dataSelezionata) && (
            <Chip 
              label="📍 OGGI" 
              color="primary" 
              size="small"
            />
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Card Disponibilità */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Disponibilità {isToday(dataSelezionata) ? 'Oggi' : formatDateDisplay(dataSelezionata).split(',')[0]}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Ordinato: {limite.quantitaOrdinata.toFixed(2)} Kg
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Limite: {limite.limiteQuantita} Kg
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(percentualeUsata, 100)} 
                  color={getProgressColor(percentualeUsata)}
                  sx={{ height: 20, borderRadius: 2 }}
                />
                <Typography 
                  variant="body2" 
                  align="center" 
                  sx={{ mt: 1, fontWeight: 'bold' }}
                >
                  {percentualeUsata.toFixed(1)}% utilizzato
                </Typography>
              </Box>

              {/* Disponibilità grande */}
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: disponibile > 5 ? 'success.light' : disponibile > 0 ? 'warning.light' : 'error.light',
                borderRadius: 2,
                mb: 2
              }}>
                <Typography variant="h2" fontWeight="bold" color="white">
                  {disponibile.toFixed(1)}
                </Typography>
                <Typography variant="h6" color="white">
                  Kg Disponibili
                </Typography>
              </Box>

              {/* Ultimo aggiornamento */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Ultimo aggiornamento: {ultimoAggiornamento.toLocaleTimeString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card Vendita Rapida */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚡ Vendita Rapida
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Registra vendite dirette (non da ordini)
              </Typography>

              {/* Pulsanti vendita rapida */}
              <Grid container spacing={1} sx={{ mb: 3 }}>
                {[
                  { kg: 0.1, label: '100G' },
                  { kg: 0.2, label: '200G' },
                  { kg: 0.5, label: '500G' },
                  { kg: 0.7, label: '700G' },
                  { kg: 1, label: '1 KG' }
                ].map((item) => (
                  <Grid item key={item.kg}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => venditaRapida(item.kg)}
                      disabled={disponibile < item.kg || !isToday(dataSelezionata)}
                      startIcon={<AddIcon />}
                    >
                      {item.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              {/* Avviso se non è oggi */}
              {!isToday(dataSelezionata) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Le vendite rapide sono disponibili solo per la data odierna
                </Alert>
              )}

              {/* Pulsante vendita personalizzata */}
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => setDialogVendita(true)}
                disabled={disponibile <= 0 || !isToday(dataSelezionata)}
                sx={{ mb: 2 }}
              >
                Vendita Personalizzata
              </Button>

              <Divider sx={{ my: 2 }} />

              {/* Azioni amministrative */}
              <Typography variant="subtitle2" gutterBottom>
                🛠️ Gestione
              </Typography>
              
              <ButtonGroup fullWidth sx={{ mb: 1 }}>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => setDialogReset(true)}
                  startIcon={<ResetIcon />}
                  disabled={!isToday(dataSelezionata)}
                >
                  Reset
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => setDialogEditLimite(true)}
                  startIcon={<SettingsIcon />}
                >
                  Modifica Limite
                </Button>
              </ButtonGroup>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabella Ordini */}
      <Paper elevation={3} sx={{ mt: 3 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            🛒 Ordini Registrati {isToday(dataSelezionata) ? 'Oggi' : formatDateDisplay(dataSelezionata).split(',')[0]}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              icon={<CartIcon />} 
              label={`${ordini.length} ordini`}
              color="primary"
              variant="filled"
            />
            <Chip 
              icon={<TrendingIcon />} 
              label={`${totaleOrdini.toFixed(2)} Kg totali`}
              color="secondary"
              variant="filled"
            />
          </Box>
        </Box>
        
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ora</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Codice</TableCell>
                <TableCell align="right">Quantità</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Stato</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordini.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      Nessun ordine con Zeppole per {isToday(dataSelezionata) ? 'oggi' : 'questa data'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                ordini.map((ordine, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Chip 
                        icon={<TimeIcon />} 
                        label={ordine.oraRitiro || '--:--'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{ordine.cliente}</TableCell>
                    <TableCell>{ordine.codiceCliente || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">
                        {ordine.quantita} {ordine.unita}
                      </Typography>
                    </TableCell>
                    <TableCell>{ordine.note || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={ordine.stato || 'nuovo'}
                        size="small"
                        color={ordine.stato === 'completato' ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {ordini.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'grey.100', display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              TOTALE ORDINI: <span style={{ color: '#1976d2' }}>{totaleOrdini.toFixed(2)} Kg</span>
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Dialog Reset */}
      <Dialog open={dialogReset} onClose={() => setDialogReset(false)}>
        <DialogTitle>⚠️ Conferma Reset</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler resettare la disponibilità di oggi?
            Questa azione azzererà il contatore delle vendite.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogReset(false)}>Annulla</Button>
          <Button onClick={resetDisponibilita} color="warning" variant="contained">
            Conferma Reset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Vendita Personalizzata */}
      <Dialog open={dialogVendita} onClose={() => setDialogVendita(false)}>
        <DialogTitle>💰 Vendita Personalizzata</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Inserisci la quantità in Kg da registrare come vendita diretta.
          </Typography>
          <TextField
            autoFocus
            label="Quantità (Kg)"
            type="number"
            fullWidth
            value={quantitaPersonalizzata}
            onChange={(e) => setQuantitaPersonalizzata(e.target.value)}
            inputProps={{ step: 0.1, min: 0.1 }}
            helperText={`Disponibile: ${disponibile.toFixed(2)} Kg`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogVendita(false)}>Annulla</Button>
          <Button onClick={venditaPersonalizzata} color="primary" variant="contained">
            Registra Vendita
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Modifica Limite */}
      <Dialog open={dialogEditLimite} onClose={() => setDialogEditLimite(false)}>
        <DialogTitle>⚙️ Modifica Limite Giornaliero</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Imposta il limite massimo di Zeppole vendibili per {isToday(dataSelezionata) ? 'oggi' : 'questa data'}.
          </Typography>
          <TextField
            autoFocus
            label="Limite (Kg)"
            type="number"
            fullWidth
            value={nuovoLimite}
            onChange={(e) => setNuovoLimite(Number(e.target.value))}
            inputProps={{ step: 1, min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEditLimite(false)}>Annulla</Button>
          <Button onClick={salvaLimite} color="primary" variant="contained">
            Salva Limite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestioneZeppole;