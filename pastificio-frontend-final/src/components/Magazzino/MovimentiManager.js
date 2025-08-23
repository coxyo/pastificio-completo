// pastificio-frontend/src/components/Magazzino/MovimentiManager.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import itLocale from 'date-fns/locale/it';
import { format } from 'date-fns';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MovimentiManager = () => {
  const [movimenti, setMovimenti] = useState([]);
  const [articoli, setArticoli] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    tipo: 'carico',
    data: new Date(),
    articolo: '',
    quantita: '',
    causale: '',
    documento: '',
    note: ''
  });

  // Carica articoli
  const loadArticoli = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/magazzino/articoli`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticoli(response.data.data || []);
    } catch (err) {
      console.error('Errore caricamento articoli:', err);
      setError('Errore nel caricamento degli articoli');
    }
  }, []);

  // Carica movimenti
  const loadMovimenti = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/magazzino/movimenti`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMovimenti(response.data.data || []);
    } catch (err) {
      console.error('Errore caricamento movimenti:', err);
      setError('Errore nel caricamento dei movimenti');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticoli();
    loadMovimenti();
  }, [loadArticoli, loadMovimenti]);

  // Gestione form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      data: date
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Converti la quantità in numero
      const dataToSend = {
        ...formData,
        quantita: parseFloat(formData.quantita) || 0
      };
      
      await axios.post(
        `${API_URL}/magazzino/movimenti`,
        dataToSend,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setOpenDialog(false);
      setFormData({
        tipo: 'carico',
        data: new Date(),
        articolo: '',
        quantita: '',
        causale: '',
        documento: '',
        note: ''
      });
      loadMovimenti();
      loadArticoli(); // Ricarica anche gli articoli per aggiornare le giacenze
    } catch (err) {
      console.error('Errore salvataggio movimento:', err);
      setError(err.response?.data?.error || 'Errore nel salvataggio del movimento');
    }
  };

  const getTipoChip = (tipo) => {
    const config = {
      carico: { color: 'success', label: 'Carico' },
      scarico: { color: 'error', label: 'Scarico' },
      rettifica: { color: 'warning', label: 'Rettifica' }
    };
    return config[tipo] || { color: 'default', label: tipo };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={itLocale}>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Movimenti Magazzino</Typography>
          <Box>
            <IconButton onClick={loadMovimenti} color="primary">
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Nuovo Movimento
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Articolo</TableCell>
                <TableCell align="right">Quantità</TableCell>
                <TableCell>Causale</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimenti.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Nessun movimento registrato
                  </TableCell>
                </TableRow>
              ) : (
                movimenti.map((movimento) => {
                  const tipoConfig = getTipoChip(movimento.tipo);
                  return (
                    <TableRow key={movimento._id}>
                      <TableCell>
                        {format(new Date(movimento.data), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tipoConfig.label}
                          color={tipoConfig.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {movimento.articolo?.nome || 'N/D'}
                      </TableCell>
                      <TableCell align="right">
                        {movimento.quantita} {movimento.articolo?.unitaMisura || ''}
                      </TableCell>
                      <TableCell>{movimento.causale}</TableCell>
                      <TableCell>{movimento.documento || '-'}</TableCell>
                      <TableCell>{movimento.note || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog nuovo movimento */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Nuovo Movimento Magazzino</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo Movimento</InputLabel>
                  <Select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    label="Tipo Movimento"
                  >
                    <MenuItem value="carico">Carico</MenuItem>
                    <MenuItem value="scarico">Scarico</MenuItem>
                    <MenuItem value="rettifica">Rettifica</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <DatePicker
                  label="Data"
                  value={formData.data}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Articolo</InputLabel>
                  <Select
                    name="articolo"
                    value={formData.articolo}
                    onChange={handleInputChange}
                    label="Articolo"
                  >
                    {articoli.map((art) => (
                      <MenuItem key={art._id} value={art._id}>
                        {art.nome} (Disponibili: {art.giacenza} {art.unitaMisura})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="quantita"
                  label="Quantità"
                  type="number"
                  value={formData.quantita}
                  onChange={handleInputChange}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="causale"
                  label="Causale"
                  value={formData.causale}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="documento"
                  label="Documento"
                  value={formData.documento}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="note"
                  label="Note"
                  value={formData.note}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
            <Button onClick={handleSubmit} variant="contained">
              Registra Movimento
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default MovimentiManager;