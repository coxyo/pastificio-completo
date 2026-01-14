// src/components/GestioneZeppole.js
// ✅ VERSIONE FIXED 14/01/2026 - Route Railway corrette
// Cache bust: 2026-01-14T09:45:00Z

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
  Warning as WarningIcon
} from '@mui/icons-material';

// ✅ API URL senza fallback - usa SOLO variabile ambiente Vercel
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PRODOTTO_NOME = 'Zeppole';

// ✅ Validazione API URL all'avvio
if (!API_URL) {
  console.error('❌ NEXT_PUBLIC_API_URL non configurato!');
}

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

  // ✅ FIX: Pusher useEffect SENZA dipendenze che causano loop
  useEffect(() => {
    console.log('🔌 [Zeppole] Inizializzazione Pusher...');
    
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu'
    });

    const channel = pusher.subscribe('zeppole-channel');

    channel.bind('vendita-diretta', (data) => {
      console.log('📡 [Zeppole] Pusher: vendita-diretta', data);
      if (data.prodotto === PRODOTTO_NOME) {
        // Usa callback per non dipendere da 'limite' nelle dipendenze
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
  }, []); // ✅ ARRAY VUOTO - Esegue SOLO all'avvio

  // Carica dati iniziali
  useEffect(() => {
    console.log('📥 [Zeppole] Caricamento dati iniziale...');
    console.log('🔗 [Zeppole] API URL:', API_URL);
    caricaDati();
    
    // Refresh automatico ogni minuto
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
      const url = `${API_URL}/api/limiti/prodotto/${PRODOTTO_NOME}`;
      console.log('📡 [Zeppole] GET', url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      const limiteData = response.data.data;
      setLimite(limiteData);
      setNuovoLimite(limiteData.limiteQuantita);
      
      console.log('✅ [Zeppole] Limite caricato:', limiteData);
    } catch (error) {
      console.error('❌ [Zeppole] Errore caricamento limite:', error);
      console.error('URL:', `${API_URL}/api/limiti/prodotto/${PRODOTTO_NOME}`);
      throw error;
    }
  };

  const caricaOrdini = async () => {
    try {
      const url = `${API_URL}/api/limiti/ordini-prodotto/${PRODOTTO_NOME}`;
      console.log('📡 [Zeppole] GET', url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      setOrdini(response.data.data || []);
      console.log(`✅ [Zeppole] Ordini caricati: ${response.data.count}`);
    } catch (error) {
      console.error('❌ [Zeppole] Errore caricamento ordini:', error);
      console.error('URL:', `${API_URL}/api/limiti/ordini-prodotto/${PRODOTTO_NOME}`);
      throw error;
    }
  };

  const salvaLimite = async () => {
    try {
      if (!limite) return;

      console.log('📡 [Zeppole] PUT /api/limiti/' + limite._id);
      const response = await axios.put(
        `${API_URL}/api/limiti/${limite._id}`,
        { limiteQuantita: nuovoLimite },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      setLimite(response.data.data);
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
      console.log('📡 [Zeppole] POST /api/limiti/reset-prodotto');
      await axios.post(
        `${API_URL}/api/limiti/reset-prodotto`,
        { prodotto: PRODOTTO_NOME },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      showSnackbar('Disponibilità resettata', 'success');
      setDialogReset(false);
      await caricaDati();
      console.log('✅ [Zeppole] Reset completato');
      
    } catch (error) {
      console.error('❌ [Zeppole] Errore reset disponibilità:', error);
      showSnackbar('Errore nel reset', 'error');
    }
  };

  const venditaDiretta = async (quantitaKg) => {
    try {
      console.log(`📡 [Zeppole] POST /api/limiti/vendita-diretta (${quantitaKg} Kg)`);
      await axios.post(
        `${API_URL}/api/limiti/vendita-diretta`,
        { 
          prodotto: PRODOTTO_NOME,
          quantitaKg: quantitaKg 
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      showSnackbar(`Venduti ${quantitaKg} Kg`, 'success');
      await caricaDati();
      console.log('✅ [Zeppole] Vendita diretta registrata');
      
    } catch (error) {
      console.error('❌ [Zeppole] Errore vendita diretta:', error);
      const messaggio = error.response?.data?.message || 'Errore nella vendita';
      showSnackbar(messaggio, 'error');
    }
  };

  const venditaPersonalizzata = async () => {
    const quantita = parseFloat(quantitaPersonalizzata);
    
    if (isNaN(quantita) || quantita <= 0) {
      showSnackbar('Quantità non valida', 'error');
      return;
    }
    
    await venditaDiretta(quantita);
    setDialogVendita(false);
    setQuantitaPersonalizzata('');
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatOra = (oraString) => {
    if (!oraString) return '-';
    return oraString.substring(0, 5);
  };

  const getProgressColor = () => {
    if (!limite) return 'primary';
    const percentuale = (limite.quantitaOrdinata / limite.limiteQuantita) * 100;
    if (percentuale >= 90) return 'error';
    if (percentuale >= 70) return 'warning';
    return 'success';
  };

  const getStatusColor = (stato) => {
    switch (stato) {
      case 'completato': return 'success';
      case 'in_corso': return 'warning';
      case 'annullato': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        <Typography>Caricamento dati Zeppole...</Typography>
      </Box>
    );
  }

  if (!limite) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Limite giornaliero non configurato per le Zeppole. 
          Il sistema lo creerà automaticamente con limite di default 20 Kg.
        </Alert>
        <Button 
          variant="contained" 
          onClick={caricaDati}
          sx={{ mt: 2 }}
        >
          Ricarica
        </Button>
      </Box>
    );
  }

  const disponibile = limite.limiteQuantita - limite.quantitaOrdinata;
  const percentualeVenduto = (limite.quantitaOrdinata / limite.limiteQuantita) * 100;
  const totaleOrdiniKg = ordini.reduce((sum, ord) => sum + ord.quantitaKg, 0);
  const isAlertaSoglia = percentualeVenduto >= (limite.sogliAllerta || 80);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ZeppoleIcon sx={{ fontSize: 48, color: 'warning.main' }} />
          <Box>
            <Typography variant="h4" component="h1">
              🎂 Gestione Zeppole
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date().toLocaleDateString('it-IT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Aggiorna dati">
            <IconButton onClick={caricaDati} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" color="text.secondary">
            Ultimo agg: {ultimoAggiornamento.toLocaleTimeString('it-IT')}
          </Typography>
        </Box>
      </Box>

      {/* Alert soglia superata */}
      {isAlertaSoglia && (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
        >
          <strong>Attenzione!</strong> Raggiunta soglia {limite.sogliAllerta}% del limite giornaliero
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Card Statistiche Principali */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  📊 Stato Disponibilità
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setDialogEditLimite(true)}
                >
                  Modifica Limite
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {/* Metriche principali */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: disponibile > 0 ? 'success.light' : 'error.light',
                      color: disponibile > 0 ? 'success.contrastText' : 'error.contrastText',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="subtitle2">Disponibile</Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {disponibile.toFixed(2)}
                    </Typography>
                    <Typography variant="caption">Kg</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'error.light',
                      color: 'error.contrastText',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="subtitle2">Ordinato</Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {limite.quantitaOrdinata.toFixed(2)}
                    </Typography>
                    <Typography variant="caption">
                      Kg ({percentualeVenduto.toFixed(0)}%)
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="subtitle2">Limite</Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {limite.limiteQuantita.toFixed(0)}
                    </Typography>
                    <Typography variant="caption">Kg</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Barra progresso */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progresso vendite giornaliere
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color={getProgressColor()}>
                    {percentualeVenduto.toFixed(1)}%
                  </Typography>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={Math.min(percentualeVenduto, 100)}
                  color={getProgressColor()}
                  sx={{ 
                    height: 15, 
                    borderRadius: 2,
                    bgcolor: 'action.hover'
                  }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    0 Kg
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {limite.limiteQuantita} Kg
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card Azioni Rapide */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚡ Azioni Rapide
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                startIcon={<ResetIcon />}
                onClick={() => setDialogReset(true)}
                sx={{ mb: 1 }}
              >
                Reset Disponibilità
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={caricaDati}
              >
                Ricarica Dati
              </Button>
            </CardContent>
          </Card>

          {/* Card Info */}
          <Card elevation={3} sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Statistiche
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Ordini registrati:</Typography>
                  <Chip label={ordini.length} size="small" color="primary" />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Totale ordini:</Typography>
                  <Chip 
                    label={`${totaleOrdiniKg.toFixed(2)} Kg`} 
                    size="small" 
                    color="secondary" 
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Vendite dirette:</Typography>
                  <Chip 
                    label={`${(limite.quantitaOrdinata - totaleOrdiniKg).toFixed(2)} Kg`} 
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card Vendita Diretta */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔘 Vendita Diretta (senza registrare ordine)
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <ButtonGroup 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    disabled={disponibile <= 0}
                  >
                    <Button 
                      onClick={() => venditaDiretta(0.1)} 
                      disabled={disponibile < 0.1}
                      sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                    >
                      100g
                    </Button>
                    <Button 
                      onClick={() => venditaDiretta(0.2)} 
                      disabled={disponibile < 0.2}
                      sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                    >
                      200g
                    </Button>
                    <Button 
                      onClick={() => venditaDiretta(0.5)} 
                      disabled={disponibile < 0.5}
                      sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                    >
                      500g
                    </Button>
                    <Button 
                      onClick={() => venditaDiretta(1)} 
                      disabled={disponibile < 1}
                      sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                    >
                      1 Kg
                    </Button>
                  </ButtonGroup>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogVendita(true)}
                    disabled={disponibile <= 0}
                  >
                    Quantità Personalizzata
                  </Button>
                </Grid>
              </Grid>

              {disponibile <= 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <strong>Esaurito!</strong> Nessuna disponibilità rimasta per oggi.
                </Alert>
              )}
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