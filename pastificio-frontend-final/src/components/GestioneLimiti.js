// src/components/GestioneLimiti.js - ✅ VERSIONE COMPLETA CON SISTEMA PERIODO

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  LinearProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Divider,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  CalendarMonth as CalendarIcon,
  AutoAwesome as PresetIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

// ✅ HELPER: Ottieni token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// ✅ PRESET PERIODI
const PRESET_PERIODI = {
  natale: {
    nome: '🎄 Natale',
    dataInizio: '2025-12-20',
    dataFine: '2025-12-27',
    descrizione: 'Settimana di Natale (20-27 dicembre)'
  },
  pasqua: {
    nome: '🐣 Pasqua',
    dataInizio: '2025-04-17',
    dataFine: '2025-04-21',
    descrizione: 'Settimana di Pasqua (17-21 aprile 2025)'
  },
  ferragosto: {
    nome: '☀️ Ferragosto',
    dataInizio: '2025-08-10',
    dataFine: '2025-08-20',
    descrizione: 'Periodo Ferragosto (10-20 agosto)'
  },
  capodanno: {
    nome: '🎆 Capodanno',
    dataInizio: '2025-12-29',
    dataFine: '2026-01-02',
    descrizione: 'Fine anno (29 dic - 2 gen)'
  },
  custom: {
    nome: '📅 Personalizzato',
    dataInizio: '',
    dataFine: '',
    descrizione: 'Scegli date personalizzate'
  }
};

// ✅ PRODOTTI DISPONIBILI
const PRODOTTI_DISPONIBILI = [
  'Pardulas',
  'Ciambelle',
  'Amaretti',
  'Bianchini',
  'Gueffus',
  'Papassinas',
  'Ravioli ricotta',
  'Ravioli ricotta e spinaci',
  'Culurgiones',
  'Panada di Agnello',
  'Panada di Vitella',
  'Panada di Maiale',
  'Panadine'
];

// ✅ CATEGORIE DISPONIBILI
const CATEGORIE_DISPONIBILI = [
  'Dolci',
  'Ravioli',
  'Panadas',
  'Altro'
];

export default function GestioneLimiti() {
  const [limiti, setLimiti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPeriodoOpen, setDialogPeriodoOpen] = useState(false);
  const [editingLimite, setEditingLimite] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    prodotto: '',
    categoria: '',
    limiteQuantita: '',
    unitaMisura: 'Kg',
    attivo: true,
    sogliAllerta: 80,
    note: ''
  });

  // ✅ State per limiti periodo
  const [formPeriodo, setFormPeriodo] = useState({
    preset: 'natale',
    dataInizio: PRESET_PERIODI.natale.dataInizio,
    dataFine: PRESET_PERIODI.natale.dataFine,
    tipo: 'prodotto', // 'prodotto' o 'categoria'
    prodotto: 'Pardulas',
    categoria: '',
    limiteQuantita: 60,
    unitaMisura: 'Kg',
    sogliAllerta: 80,
    note: '',
    sovrascrivi: false // Se true, sovrascrive limiti esistenti
  });

  const [previewGiorni, setPreviewGiorni] = useState(0);

  // ✅ Carica limiti
  const caricaLimiti = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/limiti`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setLimiti(data.data || []);
        console.log(`✅ Caricati ${data.data?.length || 0} limiti`);
      } else if (response.status === 401) {
        mostraSnackbar('Autenticazione necessaria', 'warning');
      } else {
        throw new Error(`Errore ${response.status}`);
      }
    } catch (error) {
      console.error('Errore caricamento limiti:', error);
      mostraSnackbar('Errore caricamento limiti', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    caricaLimiti();
  }, []);

  // ✅ Mostra snackbar
  const mostraSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // ✅ Calcola preview giorni per periodo
  useEffect(() => {
    if (formPeriodo.dataInizio && formPeriodo.dataFine) {
      const inizio = new Date(formPeriodo.dataInizio);
      const fine = new Date(formPeriodo.dataFine);
      const diff = Math.ceil((fine - inizio) / (1000 * 60 * 60 * 24)) + 1;
      setPreviewGiorni(diff > 0 ? diff : 0);
    }
  }, [formPeriodo.dataInizio, formPeriodo.dataFine]);

  // ✅ Gestione cambio preset
  const handlePresetChange = (preset) => {
    const presetData = PRESET_PERIODI[preset];
    setFormPeriodo(prev => ({
      ...prev,
      preset,
      dataInizio: presetData.dataInizio || prev.dataInizio,
      dataFine: presetData.dataFine || prev.dataFine
    }));
  };

  // ✅ Crea singolo limite
  const creaLimite = async () => {
    try {
      const payload = {
        data: formData.data,
        limiteQuantita: parseFloat(formData.limiteQuantita),
        unitaMisura: formData.unitaMisura,
        attivo: formData.attivo,
        sogliAllerta: parseInt(formData.sogliAllerta),
        note: formData.note || ''
      };

      // Aggiungi prodotto O categoria
      if (formData.prodotto) {
        payload.prodotto = formData.prodotto;
      } else if (formData.categoria) {
        payload.categoria = formData.categoria;
      } else {
        mostraSnackbar('Seleziona un prodotto o una categoria', 'warning');
        return;
      }

      const response = await fetch(`${API_URL}/limiti`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        mostraSnackbar('Limite creato!', 'success');
        caricaLimiti();
        setDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Errore creazione');
      }
    } catch (error) {
      console.error('Errore creazione limite:', error);
      mostraSnackbar(error.message || 'Errore creazione limite', 'error');
    }
  };

  // ✅ NUOVO: Crea limiti per periodo
  const creaLimitiPeriodo = async () => {
    try {
      if (!formPeriodo.dataInizio || !formPeriodo.dataFine) {
        mostraSnackbar('Seleziona date valide', 'warning');
        return;
      }

      if (formPeriodo.tipo === 'prodotto' && !formPeriodo.prodotto) {
        mostraSnackbar('Seleziona un prodotto', 'warning');
        return;
      }

      if (formPeriodo.tipo === 'categoria' && !formPeriodo.categoria) {
        mostraSnackbar('Seleziona una categoria', 'warning');
        return;
      }

      const inizio = new Date(formPeriodo.dataInizio);
      const fine = new Date(formPeriodo.dataFine);

      if (fine < inizio) {
        mostraSnackbar('Data fine deve essere >= data inizio', 'warning');
        return;
      }

      // Genera array di limiti per ogni giorno
      const limiti = [];
      const current = new Date(inizio);

      while (current <= fine) {
        const payload = {
          data: current.toISOString().split('T')[0],
          limiteQuantita: parseFloat(formPeriodo.limiteQuantita),
          unitaMisura: formPeriodo.unitaMisura,
          attivo: true,
          sogliAllerta: parseInt(formPeriodo.sogliAllerta),
          note: formPeriodo.note || `Limite ${PRESET_PERIODI[formPeriodo.preset]?.nome || 'personalizzato'}`
        };

        // Aggiungi prodotto O categoria
        if (formPeriodo.tipo === 'prodotto') {
          payload.prodotto = formPeriodo.prodotto;
        } else {
          payload.categoria = formPeriodo.categoria;
        }

        limiti.push(payload);
        current.setDate(current.getDate() + 1);
      }

      console.log(`📅 Creazione ${limiti.length} limiti:`, limiti);

      // Invia richiesta bulk
      const response = await fetch(`${API_URL}/limiti/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          limiti,
          sovrascrivi: formPeriodo.sovrascrivi 
        })
      });

      if (response.ok) {
        const result = await response.json();
        mostraSnackbar(`✅ Creati ${result.count || limiti.length} limiti!`, 'success');
        caricaLimiti();
        setDialogPeriodoOpen(false);
        resetFormPeriodo();
      } else {
        const error = await response.json();
        
        // Se errore duplicati, suggerisci di abilitare "sovrascrivi"
        if (error.message?.includes('duplicate') || error.message?.includes('duplicato')) {
          mostraSnackbar('Alcuni limiti esistono già. Abilita "Sovrascrivi esistenti"', 'warning');
        } else {
          throw new Error(error.message || 'Errore creazione bulk');
        }
      }
    } catch (error) {
      console.error('Errore creazione limiti periodo:', error);
      mostraSnackbar(error.message || 'Errore creazione limiti', 'error');
    }
  };

  // ✅ Reset form
  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      prodotto: '',
      categoria: '',
      limiteQuantita: '',
      unitaMisura: 'Kg',
      attivo: true,
      sogliAllerta: 80,
      note: ''
    });
  };

  const resetFormPeriodo = () => {
    setFormPeriodo({
      preset: 'natale',
      dataInizio: PRESET_PERIODI.natale.dataInizio,
      dataFine: PRESET_PERIODI.natale.dataFine,
      tipo: 'prodotto',
      prodotto: 'Pardulas',
      categoria: '',
      limiteQuantita: 60,
      unitaMisura: 'Kg',
      sogliAllerta: 80,
      note: '',
      sovrascrivi: false
    });
  };

  // ✅ Elimina limite
  const eliminaLimite = async (id) => {
    if (!confirm('Vuoi eliminare questo limite?')) return;

    try {
      const response = await fetch(`${API_URL}/limiti/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        mostraSnackbar('Limite eliminato!', 'success');
        caricaLimiti();
      } else {
        throw new Error('Errore eliminazione');
      }
    } catch (error) {
      console.error('Errore eliminazione:', error);
      mostraSnackbar('Errore eliminazione limite', 'error');
    }
  };

  // ✅ Calcola percentuale utilizzo
  const calcolaPercentualeUtilizzo = (limite) => {
    if (!limite.limiteQuantita) return 0;
    return Math.min((limite.quantitaOrdinata / limite.limiteQuantita) * 100, 100);
  };

  // ✅ Formatta Kg correttamente
  const formattaQuantita = (quantita, unita) => {
    if (!quantita && quantita !== 0) return '-';
    const num = parseFloat(quantita);
    return `${num.toFixed(1)} ${unita}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          📊 Gestione Limiti Capacità Produttiva
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={caricaLimiti}
          >
            Ricarica
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<PresetIcon />}
            onClick={() => setDialogPeriodoOpen(true)}
          >
            🎄 Limiti per Periodo
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Nuovo Limite
          </Button>
        </Stack>
      </Box>

      {/* Statistiche */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Limiti Attivi</Typography>
              <Typography variant="h3">
                {limiti.filter(l => l.attivo).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Limiti Superati</Typography>
              <Typography variant="h3" color="error">
                {limiti.filter(l => l.quantitaOrdinata >= l.limiteQuantita).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">In Allerta (&gt;80%)</Typography>
              <Typography variant="h3" color="warning.main">
                {limiti.filter(l => {
                  const perc = calcolaPercentualeUtilizzo(l);
                  return perc >= l.sogliAllerta && perc < 100;
                }).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabella limiti */}
      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Prodotto/Categoria</TableCell>
                <TableCell align="right">Limite</TableCell>
                <TableCell align="right">Ordinato</TableCell>
                <TableCell align="right">Disponibile</TableCell>
                <TableCell align="center">Utilizzo</TableCell>
                <TableCell align="center">Stato</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {limiti.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">
                      Nessun limite configurato. Crea il primo limite!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                limiti.map((limite) => {
                  const percentuale = calcolaPercentualeUtilizzo(limite);
                  const disponibile = limite.limiteQuantita - limite.quantitaOrdinata;
                  
                  return (
                    <TableRow key={limite._id}>
                      <TableCell>
                        {new Date(limite.data).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell>
                        {limite.prodotto ? (
                          <Chip label={limite.prodotto} size="small" color="primary" />
                        ) : (
                          <Chip label={`Cat: ${limite.categoria}`} size="small" color="secondary" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <strong>{formattaQuantita(limite.limiteQuantita, limite.unitaMisura)}</strong>
                      </TableCell>
                      <TableCell align="right">
                        {formattaQuantita(limite.quantitaOrdinata, limite.unitaMisura)}
                      </TableCell>
                      <TableCell align="right">
                        {formattaQuantita(disponibile, limite.unitaMisura)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={percentuale}
                            sx={{ 
                              width: 100,
                              height: 8,
                              borderRadius: 1,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: percentuale >= 100 ? '#f44336' : 
                                               percentuale >= limite.sogliAllerta ? '#ff9800' : 
                                               '#4caf50'
                              }
                            }}
                          />
                          <Typography variant="body2">
                            {percentuale.toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {percentuale >= 100 ? (
                          <Chip icon={<ErrorIcon />} label="SUPERATO" color="error" size="small" />
                        ) : percentuale >= limite.sogliAllerta ? (
                          <Chip icon={<WarningIcon />} label="ALLERTA" color="warning" size="small" />
                        ) : (
                          <Chip icon={<CheckIcon />} label="OK" color="success" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => eliminaLimite(limite._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Nuovo Limite Singolo */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuovo Limite</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Data"
                type="date"
                fullWidth
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Seleziona Prodotto</InputLabel>
                <Select
                  value={formData.prodotto}
                  onChange={(e) => setFormData({ ...formData, prodotto: e.target.value, categoria: '' })}
                >
                  <MenuItem value="">-- Nessuno --</MenuItem>
                  {PRODOTTI_DISPONIBILI.map(p => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" align="center">
                OPPURE
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Seleziona Categoria</InputLabel>
                <Select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value, prodotto: '' })}
                >
                  <MenuItem value="">-- Nessuna --</MenuItem>
                  {CATEGORIE_DISPONIBILI.map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={8}>
              <TextField
                label="Limite Quantità"
                type="number"
                fullWidth
                value={formData.limiteQuantita}
                onChange={(e) => setFormData({ ...formData, limiteQuantita: e.target.value })}
              />
            </Grid>

            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Unità</InputLabel>
                <Select
                  value={formData.unitaMisura}
                  onChange={(e) => setFormData({ ...formData, unitaMisura: e.target.value })}
                >
                  <MenuItem value="Kg">Kg</MenuItem>
                  <MenuItem value="Pezzi">Pezzi</MenuItem>
                  <MenuItem value="g">g</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Soglia Allerta (%)"
                type="number"
                fullWidth
                value={formData.sogliAllerta}
                onChange={(e) => setFormData({ ...formData, sogliAllerta: e.target.value })}
                helperText="Alert quando superata questa % del limite"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Note"
                fullWidth
                multiline
                rows={2}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button onClick={creaLimite} variant="contained">Crea</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ NUOVO: Dialog Limiti per Periodo */}
      <Dialog open={dialogPeriodoOpen} onClose={() => setDialogPeriodoOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <PresetIcon />
            <span>Crea Limiti per Periodo</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Preset Periodi */}
            <Grid item xs={12}>
              <FormLabel>Seleziona Preset</FormLabel>
              <RadioGroup
                row
                value={formPeriodo.preset}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                {Object.entries(PRESET_PERIODI).map(([key, preset]) => (
                  <FormControlLabel
                    key={key}
                    value={key}
                    control={<Radio />}
                    label={preset.nome}
                  />
                ))}
              </RadioGroup>
              {PRESET_PERIODI[formPeriodo.preset]?.descrizione && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  {PRESET_PERIODI[formPeriodo.preset].descrizione}
                </Alert>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Date Periodo */}
            <Grid item xs={6}>
              <TextField
                label="Data Inizio"
                type="date"
                fullWidth
                value={formPeriodo.dataInizio}
                onChange={(e) => setFormPeriodo({ ...formPeriodo, dataInizio: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={formPeriodo.preset !== 'custom'}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Data Fine"
                type="date"
                fullWidth
                value={formPeriodo.dataFine}
                onChange={(e) => setFormPeriodo({ ...formPeriodo, dataFine: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={formPeriodo.preset !== 'custom'}
              />
            </Grid>

            {/* Preview giorni */}
            <Grid item xs={12}>
              <Alert severity="success">
                <strong>📅 Verranno creati {previewGiorni} limiti</strong> (uno per ogni giorno del periodo)
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Tipo: Prodotto o Categoria */}
            <Grid item xs={12}>
              <FormControl>
                <FormLabel>Tipo Limite</FormLabel>
                <RadioGroup
                  row
                  value={formPeriodo.tipo}
                  onChange={(e) => setFormPeriodo({ ...formPeriodo, tipo: e.target.value })}
                >
                  <FormControlLabel value="prodotto" control={<Radio />} label="Prodotto Specifico" />
                  <FormControlLabel value="categoria" control={<Radio />} label="Categoria" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {formPeriodo.tipo === 'prodotto' ? (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Seleziona Prodotto</InputLabel>
                  <Select
                    value={formPeriodo.prodotto}
                    onChange={(e) => setFormPeriodo({ ...formPeriodo, prodotto: e.target.value })}
                  >
                    {PRODOTTI_DISPONIBILI.map(p => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Seleziona Categoria</InputLabel>
                  <Select
                    value={formPeriodo.categoria}
                    onChange={(e) => setFormPeriodo({ ...formPeriodo, categoria: e.target.value })}
                  >
                    {CATEGORIE_DISPONIBILI.map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Quantità Limite */}
            <Grid item xs={8}>
              <TextField
                label="Limite Quantità (per giorno)"
                type="number"
                fullWidth
                value={formPeriodo.limiteQuantita}
                onChange={(e) => setFormPeriodo({ ...formPeriodo, limiteQuantita: e.target.value })}
              />
            </Grid>

            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Unità</InputLabel>
                <Select
                  value={formPeriodo.unitaMisura}
                  onChange={(e) => setFormPeriodo({ ...formPeriodo, unitaMisura: e.target.value })}
                >
                  <MenuItem value="Kg">Kg</MenuItem>
                  <MenuItem value="Pezzi">Pezzi</MenuItem>
                  <MenuItem value="g">g</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Soglia Allerta */}
            <Grid item xs={12}>
              <TextField
                label="Soglia Allerta (%)"
                type="number"
                fullWidth
                value={formPeriodo.sogliAllerta}
                onChange={(e) => setFormPeriodo({ ...formPeriodo, sogliAllerta: e.target.value })}
                helperText="Alert quando superata questa % del limite"
              />
            </Grid>

            {/* Note */}
            <Grid item xs={12}>
              <TextField
                label="Note"
                fullWidth
                multiline
                rows={2}
                value={formPeriodo.note}
                onChange={(e) => setFormPeriodo({ ...formPeriodo, note: e.target.value })}
                placeholder={`es. Limite ${PRESET_PERIODI[formPeriodo.preset]?.nome || ''}`}
              />
            </Grid>

            {/* Sovrascrivi esistenti */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <input
                    type="checkbox"
                    checked={formPeriodo.sovrascrivi}
                    onChange={(e) => setFormPeriodo({ ...formPeriodo, sovrascrivi: e.target.checked })}
                  />
                }
                label="Sovrascrivi limiti esistenti per queste date"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                ⚠️ Se già esistono limiti per alcune date, verranno aggiornati invece di creare duplicati
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogPeriodoOpen(false)}>Annulla</Button>
          <Button onClick={creaLimitiPeriodo} variant="contained" color="primary">
            Crea {previewGiorni} Limiti
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
