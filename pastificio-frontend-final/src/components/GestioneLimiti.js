// components/GestioneLimiti.js - NUOVO COMPONENTE
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

export default function GestioneLimiti() {
  const [limiti, setLimiti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [limiteCorrente, setLimiteCorrente] = useState(null);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    prodotto: '',
    categoria: '',
    limiteQuantita: '',
    unitaMisura: 'Kg',
    sogliAllerta: 80,
    attivo: true,
    note: ''
  });

  const CATEGORIE = ['Ravioli', 'Dolci', 'Pardulas', 'Panadas', 'Pasta', 'Pane', 'Altro'];
  
  const PRODOTTI_COMUNI = [
    'Pardulas',
    'Ciambelle',
    'Culurgiones ricotta',
    'Culurgiones patate',
    'Ravioli carne',
    'Papassini',
    'Amaretti',
    'Seadas'
  ];

  useEffect(() => {
    caricaLimiti();
  }, []);

  const caricaLimiti = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/limiti`);
      
      if (response.ok) {
        const data = await response.json();
        setLimiti(data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento limiti:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalva = async () => {
    try {
      // Validazione
      if (!formData.limiteQuantita || formData.limiteQuantita <= 0) {
        alert('Inserisci una quantità limite valida');
        return;
      }
      
      if (!formData.prodotto && !formData.categoria) {
        alert('Seleziona un prodotto O una categoria');
        return;
      }
      
      if (formData.prodotto && formData.categoria) {
        alert('Seleziona O un prodotto O una categoria, non entrambi');
        return;
      }
      
      const url = limiteCorrente 
        ? `${API_URL}/limiti/${limiteCorrente._id}`
        : `${API_URL}/limiti`;
      
      const method = limiteCorrente ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        await caricaLimiti();
        handleChiudiDialog();
        alert(limiteCorrente ? 'Limite aggiornato' : 'Limite creato');
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore salvataggio limite');
    }
  };

  const handleElimina = async (id) => {
    if (!confirm('Confermi eliminazione limite?')) return;
    
    try {
      const response = await fetch(`${API_URL}/limiti/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await caricaLimiti();
        alert('Limite eliminato');
      }
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('Errore eliminazione limite');
    }
  };

  const handleApriDialog = (limite = null) => {
    if (limite) {
      setLimiteCorrente(limite);
      setFormData({
        data: new Date(limite.data).toISOString().split('T')[0],
        prodotto: limite.prodotto || '',
        categoria: limite.categoria || '',
        limiteQuantita: limite.limiteQuantita,
        unitaMisura: limite.unitaMisura,
        sogliAllerta: limite.sogliAllerta,
        attivo: limite.attivo,
        note: limite.note || ''
      });
    } else {
      setLimiteCorrente(null);
      setFormData({
        data: new Date().toISOString().split('T')[0],
        prodotto: '',
        categoria: '',
        limiteQuantita: '',
        unitaMisura: 'Kg',
        sogliAllerta: 80,
        attivo: true,
        note: ''
      });
    }
    setDialogOpen(true);
  };

  const handleChiudiDialog = () => {
    setDialogOpen(false);
    setLimiteCorrente(null);
  };

  const getStatoChip = (limite) => {
    const stato = limite.statoCapacita;
    
    if (stato === 'esaurito') {
      return <Chip icon={<ErrorIcon />} label="ESAURITO" color="error" size="small" />;
    } else if (stato === 'in_esaurimento') {
      return <Chip icon={<WarningIcon />} label="IN ESAURIMENTO" color="warning" size="small" />;
    } else {
      return <Chip icon={<CheckIcon />} label="Disponibile" color="success" size="small" />;
    }
  };

  // ✅ FUNZIONE HELPER: Crea limiti Natale
  const creaLimitiNatale = async () => {
    const limitiNatale = [
      {
        data: '2025-12-24',
        prodotto: 'Pardulas',
        limiteQuantita: 60,
        unitaMisura: 'Kg',
        sogliAllerta: 80,
        attivo: true,
        note: 'Natale 2025'
      },
      {
        data: '2025-12-24',
        prodotto: 'Ciambelle',
        limiteQuantita: 40,
        unitaMisura: 'Kg',
        sogliAllerta: 80,
        attivo: true,
        note: 'Natale 2025'
      },
      {
        data: '2025-12-24',
        categoria: 'Ravioli',
        limiteQuantita: 50,
        unitaMisura: 'Kg',
        sogliAllerta: 80,
        attivo: true,
        note: 'Natale 2025 - Tutti i ravioli'
      }
    ];
    
    try {
      const response = await fetch(`${API_URL}/limiti/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limiti: limitiNatale })
      });
      
      if (response.ok) {
        await caricaLimiti();
        alert('Limiti Natale creati con successo!');
      }
    } catch (error) {
      console.error('Errore creazione limiti Natale:', error);
      alert('Errore creazione limiti');
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            📊 Limiti Capacità Produttiva
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={creaLimitiNatale}
            >
              🎄 Crea Limiti Natale
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleApriDialog()}
            >
              Nuovo Limite
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Configura i limiti di produzione giornalieri per prodotto o categoria. 
          Il sistema bloccherà automaticamente gli ordini che superano la capacità.
        </Alert>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Prodotto/Categoria</TableCell>
                <TableCell>Limite</TableCell>
                <TableCell>Ordinato</TableCell>
                <TableCell>Disponibile</TableCell>
                <TableCell>Utilizzo</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {limiti.map((limite) => (
                <TableRow key={limite._id}>
                  <TableCell>
                    {new Date(limite.data).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell>
                    <strong>{limite.prodotto || limite.categoria}</strong>
                    {limite.categoria && <Chip label="Categoria" size="small" sx={{ ml: 1 }} />}
                    {!limite.attivo && <Chip label="Disattivato" size="small" color="default" sx={{ ml: 1 }} />}
                  </TableCell>
                  <TableCell>
                    {limite.limiteQuantita} {limite.unitaMisura}
                  </TableCell>
                  <TableCell>
                    {limite.quantitaOrdinata.toFixed(1)} {limite.unitaMisura}
                  </TableCell>
                  <TableCell>
                    <strong>{limite.quantitaDisponibile.toFixed(1)} {limite.unitaMisura}</strong>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(limite.percentualeUtilizzo, 100)}
                        sx={{ width: 100, height: 8, borderRadius: 4 }}
                        color={
                          limite.percentualeUtilizzo >= 100 ? 'error' :
                          limite.percentualeUtilizzo >= limite.sogliAllerta ? 'warning' :
                          'success'
                        }
                      />
                      <Typography variant="caption">
                        {limite.percentualeUtilizzo}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getStatoChip(limite)}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleApriDialog(limite)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleElimina(limite._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              
              {limiti.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">
                      Nessun limite configurato. Clicca "Nuovo Limite" per iniziare.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Dialog Nuovo/Modifica Limite */}
      <Dialog open={dialogOpen} onClose={handleChiudiDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {limiteCorrente ? 'Modifica Limite' : 'Nuovo Limite'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Data"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Prodotto Specifico</InputLabel>
                <Select
                  value={formData.prodotto}
                  onChange={(e) => setFormData({ ...formData, prodotto: e.target.value, categoria: '' })}
                  label="Prodotto Specifico"
                >
                  <MenuItem value="">Nessuno</MenuItem>
                  {PRODOTTI_COMUNI.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>O Categoria</InputLabel>
                <Select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value, prodotto: '' })}
                  label="O Categoria"
                  disabled={!!formData.prodotto}
                >
                  <MenuItem value="">Nessuna</MenuItem>
                  {CATEGORIE.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantità Limite"
                value={formData.limiteQuantita}
                onChange={(e) => setFormData({ ...formData, limiteQuantita: e.target.value })}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Unità Misura</InputLabel>
                <Select
                  value={formData.unitaMisura}
                  onChange={(e) => setFormData({ ...formData, unitaMisura: e.target.value })}
                  label="Unità Misura"
                >
                  <MenuItem value="Kg">Kg</MenuItem>
                  <MenuItem value="Pezzi">Pezzi</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Soglia Alert (%)"
                value={formData.sogliAllerta}
                onChange={(e) => setFormData({ ...formData, sogliAllerta: e.target.value })}
                inputProps={{ min: 0, max: 100 }}
                helperText="Percentuale a cui ricevere alert (es: 80 = avviso all'80%)"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="es: Natale - alta domanda"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.attivo}
                    onChange={(e) => setFormData({ ...formData, attivo: e.target.checked })}
                  />
                }
                label="Limite Attivo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleChiudiDialog}>Annulla</Button>
          <Button variant="contained" onClick={handleSalva}>
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}