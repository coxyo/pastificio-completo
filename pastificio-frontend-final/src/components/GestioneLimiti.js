// src/components/GestioneLimiti.js - ✅ CON AUTENTICAZIONE
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
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

// ✅ HELPER: Ottieni token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export default function GestioneLimiti() {
  const [limiti, setLimiti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  // ✅ Carica limiti con autenticazione
  const caricaLimiti = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/limiti`, {
        method: 'GET',
        headers: getAuthHeaders() // ✅ CON TOKEN
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

  const mostraSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleNuovoLimite = () => {
    setEditingLimite(null);
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
    setDialogOpen(true);
  };

  const handleEditLimite = (limite) => {
    setEditingLimite(limite);
    setFormData({
      data: new Date(limite.data).toISOString().split('T')[0],
      prodotto: limite.prodotto || '',
      categoria: limite.categoria || '',
      limiteQuantita: limite.limiteQuantita,
      unitaMisura: limite.unitaMisura,
      attivo: limite.attivo,
      sogliAllerta: limite.sogliAllerta,
      note: limite.note || ''
    });
    setDialogOpen(true);
  };

  // ✅ Salva con autenticazione
  const handleSalvaLimite = async () => {
    try {
      if (!formData.limiteQuantita || formData.limiteQuantita <= 0) {
        mostraSnackbar('Inserisci una quantità valida', 'warning');
        return;
      }

      if (!formData.prodotto && !formData.categoria) {
        mostraSnackbar('Specifica un prodotto o una categoria', 'warning');
        return;
      }

      const url = editingLimite 
        ? `${API_URL}/limiti/${editingLimite._id}`
        : `${API_URL}/limiti`;
      
      const method = editingLimite ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(), // ✅ CON TOKEN
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        mostraSnackbar(
          editingLimite ? 'Limite aggiornato' : 'Limite creato',
          'success'
        );
        setDialogOpen(false);
        caricaLimiti();
      } else if (response.status === 401) {
        mostraSnackbar('Autenticazione necessaria', 'warning');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Errore salvataggio');
      }
    } catch (error) {
      console.error('Errore salvataggio limite:', error);
      mostraSnackbar(error.message || 'Errore salvataggio limite', 'error');
    }
  };

  // ✅ Elimina con autenticazione
  const handleEliminaLimite = async (id) => {
    if (!confirm('Confermi eliminazione limite?')) return;

    try {
      const response = await fetch(`${API_URL}/limiti/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders() // ✅ CON TOKEN
      });

      if (response.ok) {
        mostraSnackbar('Limite eliminato', 'success');
        caricaLimiti();
      } else if (response.status === 401) {
        mostraSnackbar('Autenticazione necessaria', 'warning');
      } else {
        throw new Error('Errore eliminazione');
      }
    } catch (error) {
      console.error('Errore eliminazione limite:', error);
      mostraSnackbar('Errore eliminazione limite', 'error');
    }
  };

  // ✅ Template con autenticazione
  const creaLimitiNatale = async () => {
    const limitiNatale = [
      {
        data: '2025-12-24',
        prodotto: 'Pardulas',
        limiteQuantita: 60,
        unitaMisura: 'Kg',
        attivo: true,
        sogliAllerta: 80,
        note: 'Natale 2025'
      },
      {
        data: '2025-12-24',
        prodotto: 'Ciambelle',
        limiteQuantita: 40,
        unitaMisura: 'Kg',
        attivo: true,
        sogliAllerta: 80,
        note: 'Natale 2025'
      },
      {
        data: '2025-12-24',
        categoria: 'Ravioli',
        limiteQuantita: 50,
        unitaMisura: 'Kg',
        attivo: true,
        sogliAllerta: 80,
        note: 'Natale 2025'
      }
    ];

    try {
      const response = await fetch(`${API_URL}/limiti/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(), // ✅ CON TOKEN
        body: JSON.stringify({ limiti: limitiNatale })
      });

      if (response.ok) {
        mostraSnackbar('Limiti Natale creati!', 'success');
        caricaLimiti();
      } else if (response.status === 401) {
        mostraSnackbar('Autenticazione necessaria', 'warning');
      } else {
        throw new Error('Errore creazione limiti bulk');
      }
    } catch (error) {
      console.error('Errore creazione limiti Natale:', error);
      mostraSnackbar('Errore creazione limiti', 'error');
    }
  };

  const calcolaPercentualeUtilizzo = (limite) => {
    if (!limite.limiteQuantita) return 0;
    return Math.min((limite.quantitaOrdinata / limite.limiteQuantita) * 100, 100);
  };

  const getColoreSoglia = (percentuale) => {
    if (percentuale >= 100) return 'error';
    if (percentuale >= 80) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">📊 Gestione Limiti Capacità Produttiva</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={caricaLimiti}
            disabled={loading}
          >
            Ricarica
          </Button>
          
          <Button
            variant="outlined"
            onClick={creaLimitiNatale}
          >
            🎄 Crea Limiti Natale
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNuovoLimite}
          >
            Nuovo Limite
          </Button>
        </Box>
      </Box>

      {/* Statistiche */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Limiti Attivi
              </Typography>
              <Typography variant="h4">
                {limiti.filter(l => l.attivo).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Limiti Superati
              </Typography>
              <Typography variant="h4" color="error">
                {limiti.filter(l => calcolaPercentualeUtilizzo(l) >= 100).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                In Allerta (>80%)
              </Typography>
              <Typography variant="h4" color="warning.main">
                {limiti.filter(l => {
                  const perc = calcolaPercentualeUtilizzo(l);
                  return perc >= 80 && perc < 100;
                }).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabella Limiti */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      ) : limiti.length === 0 ? (
        <Alert severity="info">
          Nessun limite configurato. Clicca "Nuovo Limite" per iniziare.
        </Alert>
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
                <TableCell>Utilizzo</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {limiti.map((limite) => {
                const percentuale = calcolaPercentualeUtilizzo(limite);
                const disponibile = Math.max(0, limite.limiteQuantita - limite.quantitaOrdinata);
                
                return (
                  <TableRow key={limite._id}>
                    <TableCell>
                      {new Date(limite.data).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell>
                      {limite.prodotto || `Categoria: ${limite.categoria}`}
                    </TableCell>
                    <TableCell align="right">
                      {limite.limiteQuantita} {limite.unitaMisura}
                    </TableCell>
                    <TableCell align="right">
                      {limite.quantitaOrdinata.toFixed(1)} {limite.unitaMisura}
                    </TableCell>
                    <TableCell align="right">
                      {disponibile.toFixed(1)} {limite.unitaMisura}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={percentuale}
                          color={getColoreSoglia(percentuale)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                          {percentuale.toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {limite.attivo ? (
                        percentuale >= 100 ? (
                          <Chip
                            icon={<ErrorIcon />}
                            label="SUPERATO"
                            color="error"
                            size="small"
                          />
                        ) : percentuale >= limite.sogliAllerta ? (
                          <Chip
                            icon={<WarningIcon />}
                            label="ALLERTA"
                            color="warning"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<CheckIcon />}
                            label="OK"
                            color="success"
                            size="small"
                          />
                        )
                      ) : (
                        <Chip label="Disattivo" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleEditLimite(limite)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleEliminaLimite(limite._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLimite ? 'Modifica Limite' : 'Nuovo Limite'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Prodotto (specifico)"
              value={formData.prodotto}
              onChange={(e) => setFormData({ ...formData, prodotto: e.target.value, categoria: '' })}
              fullWidth
              disabled={!!formData.categoria}
            />

            <Typography variant="caption" align="center">- OPPURE -</Typography>

            <FormControl fullWidth disabled={!!formData.prodotto}>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value, prodotto: '' })}
                label="Categoria"
              >
                <MenuItem value="">Nessuna</MenuItem>
                <MenuItem value="Ravioli">Ravioli</MenuItem>
                <MenuItem value="Dolci">Dolci</MenuItem>
                <MenuItem value="Pardulas">Pardulas</MenuItem>
                <MenuItem value="Panadas">Panadas</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Quantità Limite"
              type="number"
              value={formData.limiteQuantita}
              onChange={(e) => setFormData({ ...formData, limiteQuantita: parseFloat(e.target.value) })}
              fullWidth
            />

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

            <TextField
              label="Soglia Allerta (%)"
              type="number"
              value={formData.sogliAllerta}
              onChange={(e) => setFormData({ ...formData, sogliAllerta: parseInt(e.target.value) })}
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />

            <TextField
              label="Note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleSalvaLimite} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}