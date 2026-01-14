// src/components/GestioneZeppole.js
// ✅ VERSIONE FIX 14/01/2026 - Risolto doppio /api nell'URL

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
  Settings as SettingsIcon
} from '@mui/icons-material';

// ✅ FIX: API_URL include già /api, quindi nelle chiamate NON aggiungiamo /api
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';
const PRODOTTO_NOME = 'Zeppole';

const GestioneZeppole = () => {
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

  // ✅ FIX: Pusher useEffect SENZA dipendenze che causano loop
  useEffect(() => {
    console.log('🔌 [Zeppole] Inizializzazione Pusher...');
    
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!pusherKey) {
      console.warn('⚠️ [Zeppole] PUSHER_KEY non configurata');
      return;
    }
    
    const pusher = new Pusher(pusherKey, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu'
    });

    const channel = pusher.subscribe('zeppole-channel');

    channel.bind('vendita-diretta', (data) => {
      console.log('📡 [Zeppole] Pusher: vendita-diretta', data);
      if (data.prodotto === PRODOTTO_NOME) {
        setLimite(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            quantitaOrdinata: data.ordinatoKg
          };
        });
        setUltimoAggiornamento(new Date());
        showSnackbar(`Venduti ${data.quantitaKg} Kg`, 'success');
      }
    });

    channel.bind('reset-disponibilita', (data) => {
      console.log('📡 [Zeppole] Pusher: reset-disponibilita', data);
      if (data.prodotto === PRODOTTO_NOME) {
        caricaDati();
        showSnackbar('Disponibilità resettata', 'info');
      }
    });

    const ordiniChannel = pusher.subscribe('ordini-channel');
    
    ordiniChannel.bind('ordine-creato', (data) => {
      console.log('📡 [Zeppole] Pusher: ordine-creato', data);
      if (data.ordine?.prodotti?.some(p => 
        p.nome?.toLowerCase().includes(PRODOTTO_NOME.toLowerCase())
      )) {
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

  // Carica dati iniziali
  useEffect(() => {
    console.log('📥 [Zeppole] Caricamento dati iniziale...');
    console.log('🔗 [Zeppole] API URL:', API_URL);
    caricaDati();
    
    const interval = setInterval(() => {
      console.log('🔄 [Zeppole] Refresh automatico...');
      caricaDati();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const caricaDati = useCallback(async () => {
    try {
      console.log('📡 [Zeppole] Chiamata API caricaDati...');
      await Promise.all([caricaLimite(), caricaOrdini()]);
      setUltimoAggiornamento(new Date());
      setLoading(false);
      console.log('✅ [Zeppole] Dati caricati');
    } catch (error) {
      console.error('❌ [Zeppole] Errore caricamento dati:', error);
      showSnackbar('Errore nel caricamento dati', 'error');
      setLoading(false);
    }
  }, []);

  const caricaLimite = async () => {
    try {
      // ✅ FIX: NON aggiungere /api perché API_URL già lo include
      const url = `${API_URL}/limiti/prodotto/${PRODOTTO_NOME}`;
      console.log('📡 [Zeppole] GET', url);
      
      const data = await fetchWithAuth(url);
      
      const limiteData = data.data;
      setLimite(limiteData);
      setNuovoLimite(limiteData.limiteQuantita);
      
      console.log('✅ [Zeppole] Limite caricato:', limiteData);
    } catch (error) {
      console.error('❌ [Zeppole] Errore caricamento limite:', error);
      throw error;
    }
  };

  const caricaOrdini = async () => {
    try {
      // ✅ FIX: NON aggiungere /api perché API_URL già lo include
      const url = `${API_URL}/limiti/ordini-prodotto/${PRODOTTO_NOME}`;
      console.log('📡 [Zeppole] GET', url);
      
      const data = await fetchWithAuth(url);
      
      setOrdini(data.data || []);
      console.log(`✅ [Zeppole] Ordini caricati: ${data.count}`);
    } catch (error) {
      console.error('❌ [Zeppole] Errore caricamento ordini:', error);
      throw error;
    }
  };

  const salvaLimite = async () => {
    try {
      if (!limite) return;

      console.log('📡 [Zeppole] PUT /limiti/' + limite._id);
      
      // ✅ FIX: NON aggiungere /api
      const data = await fetchWithAuth(
        `${API_URL}/limiti/${limite._id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ limiteQuantita: nuovoLimite })
        }
      );
      
      setLimite(data.data);
      setDialogEditLimite(false);
      showSnackbar('Limite aggiornato', 'success');
      console.log('✅ [Zeppole] Limite salvato');
      
    } catch (error) {
      console.error('❌ [Zeppole] Errore salvataggio limite:', error);
      showSnackbar('Errore nel salvataggio limite', 'error');
    }
  };

  const resetDisponibilita = async () => {
    try {
      console.log('📡 [Zeppole] POST /limiti/reset-prodotto');
      
      // ✅ FIX: NON aggiungere /api
      await fetchWithAuth(
        `${API_URL}/limiti/reset-prodotto`,
        {
          method: 'POST',
          body: JSON.stringify({ prodotto: PRODOTTO_NOME })
        }
      );
      
      setDialogReset(false);
      showSnackbar('Disponibilità resettata', 'success');
      caricaDati();
      
    } catch (error) {
      console.error('❌ [Zeppole] Errore reset:', error);
      showSnackbar('Errore nel reset', 'error');
    }
  };

  const registraVendita = async (quantitaKg) => {
    try {
      console.log(`📡 [Zeppole] POST /limiti/vendita-diretta: ${quantitaKg} Kg`);
      
      // ✅ FIX: NON aggiungere /api
      const data = await fetchWithAuth(
        `${API_URL}/limiti/vendita-diretta`,
        {
          method: 'POST',
          body: JSON.stringify({ 
            prodotto: PRODOTTO_NOME, 
            quantitaKg 
          })
        }
      );
      
      showSnackbar(`Vendita registrata: ${quantitaKg} Kg`, 'success');
      caricaDati();
      return data;
      
    } catch (error) {
      console.error('❌ [Zeppole] Errore vendita:', error);
      showSnackbar(error.message || 'Errore nella vendita', 'error');
      throw error;
    }
  };

  const venditaRapida = async (kg) => {
    await registraVendita(kg);
  };

  const venditaPersonalizzata = async () => {
    const kg = parseFloat(quantitaPersonalizzata);
    if (isNaN(kg) || kg <= 0) {
      showSnackbar('Inserisci una quantità valida', 'warning');
      return;
    }
    await registraVendita(kg);
    setDialogVendita(false);
    setQuantitaPersonalizzata('');
  };

  // Calcoli
  const disponibile = limite ? Math.max(0, limite.limiteQuantita - limite.quantitaOrdinata) : 0;
  const percentualeUsata = limite ? (limite.quantitaOrdinata / limite.limiteQuantita) * 100 : 0;
  const totaleOrdiniKg = ordini.reduce((sum, o) => sum + (o.quantitaKg || 0), 0);
  
  // Colore progress bar
  const getProgressColor = (perc) => {
    if (perc >= 90) return 'error';
    if (perc >= 70) return 'warning';
    return 'success';
  };

  // Formatta ora
  const formatOra = (ora) => {
    if (!ora) return '--:--';
    if (ora.includes(':')) return ora.substring(0, 5);
    return ora;
  };

  // Colore stato ordine
  const getStatusColor = (stato) => {
    switch (stato?.toLowerCase()) {
      case 'completato': return 'success';
      case 'in_preparazione': return 'warning';
      case 'pronto': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }} align="center">
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

      <Grid container spacing={3}>
        {/* Card Disponibilità */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Disponibilità Oggi
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

              {/* Alert se scorte basse */}
              {disponibile <= 5 && disponibile > 0 && (
                <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                  Scorte basse! Rimangono solo {disponibile.toFixed(2)} Kg
                </Alert>
              )}
              
              {disponibile === 0 && (
                <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
                  Esaurite! Nessuna disponibilità rimasta
                </Alert>
              )}

              {/* Ultimo aggiornamento */}
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                Ultimo aggiornamento: {ultimoAggiornamento.toLocaleTimeString('it-IT')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card Azioni Rapide */}
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
                {[0.5, 1, 2, 3, 5].map((kg) => (
                  <Grid item key={kg}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => venditaRapida(kg)}
                      disabled={disponibile < kg}
                      startIcon={<AddIcon />}
                    >
                      {kg} Kg
                    </Button>
                  </Grid>
                ))}
              </Grid>

              {/* Pulsante vendita personalizzata */}
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => setDialogVendita(true)}
                disabled={disponibile <= 0}
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

        {/* Tabella Ordini */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                flexWrap: 'wrap',
                gap: 1
              }}>
                <Typography variant="h6">
                  📦 Ordini Registrati Oggi
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={`${ordini.length} ordini`}
                    color="primary"
                    icon={<CartIcon />}
                  />
                  <Chip
                    label={`${totaleOrdiniKg.toFixed(2)} Kg totali`}
                    color="secondary"
                    icon={<TrendingIcon />}
                  />
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {ordini.length === 0 ? (
                <Alert severity="info">
                  Nessun ordine di Zeppole registrato oggi
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Ora</strong></TableCell>
                        <TableCell><strong>Cliente</strong></TableCell>
                        <TableCell><strong>Codice</strong></TableCell>
                        <TableCell align="right"><strong>Quantità</strong></TableCell>
                        <TableCell><strong>Note</strong></TableCell>
                        <TableCell align="center"><strong>Stato</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ordini.map((ordine, idx) => (
                        <TableRow key={ordine.ordineId || idx} hover>
                          <TableCell>
                            <Chip
                              label={formatOra(ordine.oraRitiro)}
                              size="small"
                              color="primary"
                              variant="outlined"
                              icon={<TimeIcon />}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {ordine.cliente}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {ordine.codiceCliente || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {ordine.quantitaKg.toFixed(2)} Kg
                              </Typography>
                              {ordine.unita !== 'Kg' && (
                                <Typography variant="caption" color="text.secondary">
                                  ({ordine.quantita} {ordine.unita})
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {ordine.note || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={ordine.stato}
                              size="small"
                              color={getStatusColor(ordine.stato)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Riga totale */}
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={3} align="right">
                          <Typography variant="body1" fontWeight="bold">
                            TOTALE ORDINI:
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            {totaleOrdiniKg.toFixed(2)} Kg
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={2} />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog Modifica Limite */}
      <Dialog 
        open={dialogEditLimite} 
        onClose={() => setDialogEditLimite(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modifica Limite Giornaliero</DialogTitle>
        <DialogContent>
          <TextField
            label="Nuovo Limite (Kg)"
            type="number"
            value={nuovoLimite}
            onChange={(e) => setNuovoLimite(parseFloat(e.target.value))}
            fullWidth
            margin="normal"
            inputProps={{ min: 0, step: 1 }}
            autoFocus
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            Limite attuale: <strong>{limite.limiteQuantita} Kg</strong>
            <br />
            Già ordinato: <strong>{limite.quantitaOrdinata.toFixed(2)} Kg</strong>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEditLimite(false)}>Annulla</Button>
          <Button onClick={salvaLimite} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Reset Disponibilità */}
      <Dialog open={dialogReset} onClose={() => setDialogReset(false)}>
        <DialogTitle>⚠️ Conferma Reset</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Sei sicuro di voler resettare la disponibilità a <strong>{limite.limiteQuantita} Kg</strong>?
          </Typography>
          <Alert severity="warning">
            Questa azione azzererà il contatore delle vendite registrate oggi.
            Attualmente hai ordinato: <strong>{limite.quantitaOrdinata.toFixed(2)} Kg</strong>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogReset(false)}>Annulla</Button>
          <Button 
            onClick={resetDisponibilita} 
            variant="contained" 
            color="warning"
          >
            Conferma Reset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Vendita Personalizzata */}
      <Dialog 
        open={dialogVendita} 
        onClose={() => setDialogVendita(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Vendita Personalizzata</DialogTitle>
        <DialogContent>
          <TextField
            label="Quantità (Kg)"
            type="number"
            value={quantitaPersonalizzata}
            onChange={(e) => setQuantitaPersonalizzata(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ min: 0, step: 0.1, max: disponibile }}
            autoFocus
            helperText={`Disponibilità: ${disponibile.toFixed(2)} Kg`}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            Disponibilità attuale: <strong>{disponibile.toFixed(2)} Kg</strong>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogVendita(false)}>Annulla</Button>
          <Button 
            onClick={venditaPersonalizzata} 
            variant="contained"
            disabled={!quantitaPersonalizzata || parseFloat(quantitaPersonalizzata) <= 0}
          >
            Conferma Vendita
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestioneZeppole;