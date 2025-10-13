// components/GestioneProdotti.js - ✅ INTERFACCIA ADMIN PRODOTTI
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Typography,
  Alert,
  Tabs,
  Tab,
  Grid,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

export default function GestioneProdotti() {
  const [prodotti, setProdotti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProdotto, setCurrentProdotto] = useState(null);
  
  const [categoriaFiltro, setCategoriaFiltro] = useState(0); // 0 = Tutti
  
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'Dolci',
    descrizione: '',
    prezzoKg: '',
    prezzoPezzo: '',
    modalitaVendita: 'mista',
    pezziPerKg: '',
    unitaMisuraDisponibili: ['Kg', 'Pezzi', '€'],
    hasVarianti: false,
    varianti: [],
    disponibile: true,
    attivo: true,
    ordine: 0,
    note: ''
  });
  
  const [varianteForm, setVarianteForm] = useState({
    nome: '',
    label: '',
    prezzoKg: '',
    prezzoPezzo: '',
    pezziPerKg: ''
  });

  const categorie = ['Tutti', 'Ravioli', 'Dolci', 'Panadas', 'Pasta'];

  useEffect(() => {
    caricaProdotti();
  }, []);

  const caricaProdotti = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/prodotti?attivo=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProdotti(data.data || []);
      } else if (response.status === 401) {
        setError('Sessione scaduta. Effettua nuovamente il login.');
      } else {
        throw new Error('Errore nel caricamento dei prodotti');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (prodotto = null) => {
    if (prodotto) {
      setEditMode(true);
      setCurrentProdotto(prodotto);
      setFormData({
        nome: prodotto.nome,
        categoria: prodotto.categoria,
        descrizione: prodotto.descrizione || '',
        prezzoKg: prodotto.prezzoKg || '',
        prezzoPezzo: prodotto.prezzoPezzo || '',
        modalitaVendita: prodotto.modalitaVendita,
        pezziPerKg: prodotto.pezziPerKg || '',
        unitaMisuraDisponibili: prodotto.unitaMisuraDisponibili || ['Kg'],
        hasVarianti: prodotto.hasVarianti || false,
        varianti: prodotto.varianti || [],
        disponibile: prodotto.disponibile,
        attivo: prodotto.attivo,
        ordine: prodotto.ordine || 0,
        note: prodotto.note || ''
      });
    } else {
      setEditMode(false);
      setCurrentProdotto(null);
      setFormData({
        nome: '',
        categoria: 'Dolci',
        descrizione: '',
        prezzoKg: '',
        prezzoPezzo: '',
        modalitaVendita: 'mista',
        pezziPerKg: '',
        unitaMisuraDisponibili: ['Kg', 'Pezzi', '€'],
        hasVarianti: false,
        varianti: [],
        disponibile: true,
        attivo: true,
        ordine: 0,
        note: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentProdotto(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const url = editMode 
        ? `${API_URL}/prodotti/${currentProdotto._id}`
        : `${API_URL}/prodotti`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setSuccess(editMode ? 'Prodotto aggiornato!' : 'Prodotto creato!');
        handleCloseDialog();
        caricaProdotti();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Errore nel salvataggio');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler disattivare questo prodotto?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/prodotti/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setSuccess('Prodotto disattivato!');
        caricaProdotti();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleDisponibilita = async (prodotto) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/prodotti/${prodotto._id}/disponibilita`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ disponibile: !prodotto.disponibile })
      });
      
      if (response.ok) {
        caricaProdotti();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAggiungiVariante = () => {
    if (!varianteForm.nome || !varianteForm.label) {
      alert('Inserisci almeno nome e label della variante');
      return;
    }
    
    setFormData({
      ...formData,
      varianti: [...formData.varianti, { ...varianteForm }]
    });
    
    setVarianteForm({
      nome: '',
      label: '',
      prezzoKg: '',
      prezzoPezzo: '',
      pezziPerKg: ''
    });
  };

  const handleRimuoviVariante = (index) => {
    setFormData({
      ...formData,
      varianti: formData.varianti.filter((_, i) => i !== index)
    });
  };

  const prodottiFiltrati = prodotti.filter(p => {
    if (categoriaFiltro === 0) return true; // Tutti
    return p.categoria === categorie[categoriaFiltro];
  });

  const handleGeneraPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/prodotti/export/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `listino-prezzi-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
      }
    } catch (err) {
      setError('Errore nella generazione del PDF');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">🛒 Gestione Prodotti</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={handleGeneraPDF}
          >
            PDF Listino
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={caricaProdotti}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Ricarica'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuovo Prodotto
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs Categorie */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={categoriaFiltro} onChange={(e, v) => setCategoriaFiltro(v)}>
          {categorie.map((cat, index) => (
            <Tab key={cat} label={cat} value={index} />
          ))}
        </Tabs>
      </Paper>

      {/* Tabella Prodotti */}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Nome</strong></TableCell>
              <TableCell><strong>Categoria</strong></TableCell>
              <TableCell align="center"><strong>€/Kg</strong></TableCell>
              <TableCell align="center"><strong>€/Pezzo</strong></TableCell>
              <TableCell align="center"><strong>Pz/Kg</strong></TableCell>
              <TableCell align="center"><strong>Varianti</strong></TableCell>
              <TableCell align="center"><strong>Disponibile</strong></TableCell>
              <TableCell align="center"><strong>Azioni</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prodottiFiltrati.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Nessun prodotto trovato
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {prodottiFiltrati.map((prodotto) => (
              <TableRow key={prodotto._id}>
                <TableCell>{prodotto.nome}</TableCell>
                <TableCell>
                  <Chip label={prodotto.categoria} size="small" color="primary" />
                </TableCell>
                <TableCell align="center">
                  {prodotto.prezzoKg ? `€${prodotto.prezzoKg.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell align="center">
                  {prodotto.prezzoPezzo ? `€${prodotto.prezzoPezzo.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell align="center">
                  {prodotto.pezziPerKg || '-'}
                </TableCell>
                <TableCell align="center">
                  {prodotto.hasVarianti ? (
                    <Chip 
                      label={`${prodotto.varianti?.length || 0} varianti`} 
                      color="success" 
                      size="small" 
                    />
                  ) : '-'}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleToggleDisponibilita(prodotto)}
                    color={prodotto.disponibile ? 'success' : 'error'}
                  >
                    {prodotto.disponibile ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </IconButton>
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleOpenDialog(prodotto)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(prodotto._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog Nuovo/Modifica Prodotto */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{editMode ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</span>
            <IconButton size="small" onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Nome e Categoria */}
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Nome Prodotto *"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Categoria *</InputLabel>
                <Select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  label="Categoria *"
                >
                  <MenuItem value="Ravioli">Ravioli</MenuItem>
                  <MenuItem value="Dolci">Dolci</MenuItem>
                  <MenuItem value="Panadas">Panadas</MenuItem>
                  <MenuItem value="Pasta">Pasta</MenuItem>
                  <MenuItem value="Altro">Altro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Descrizione */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descrizione"
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
              />
            </Grid>

            {/* Prezzi */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Prezzo/Kg (€)"
                value={formData.prezzoKg}
                onChange={(e) => setFormData({ ...formData, prezzoKg: e.target.value })}
                inputProps={{ step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Prezzo/Pezzo (€)"
                value={formData.prezzoPezzo}
                onChange={(e) => setFormData({ ...formData, prezzoPezzo: e.target.value })}
                inputProps={{ step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Pezzi per Kg"
                value={formData.pezziPerKg}
                onChange={(e) => setFormData({ ...formData, pezziPerKg: e.target.value })}
              />
            </Grid>

            {/* Modalità Vendita */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Modalità Vendita</InputLabel>
                <Select
                  value={formData.modalitaVendita}
                  onChange={(e) => setFormData({ ...formData, modalitaVendita: e.target.value })}
                  label="Modalità Vendita"
                >
                  <MenuItem value="solo_kg">Solo Kg</MenuItem>
                  <MenuItem value="solo_pezzo">Solo Pezzo</MenuItem>
                  <MenuItem value="mista">Mista</MenuItem>
                  <MenuItem value="peso_variabile">Peso Variabile</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Switch */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasVarianti}
                    onChange={(e) => setFormData({ ...formData, hasVarianti: e.target.checked })}
                  />
                }
                label="Ha Varianti"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.disponibile}
                    onChange={(e) => setFormData({ ...formData, disponibile: e.target.checked })}
                  />
                }
                label="Disponibile"
              />
            </Grid>

            {/* Gestione Varianti */}
            {formData.hasVarianti && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Chip label="Varianti" color="primary" />
                  </Divider>
                </Grid>
                
                {/* Lista Varianti */}
                {formData.varianti.map((v, index) => (
                  <Grid item xs={12} key={index}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.100', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>
                        <strong>{v.label}</strong> - €{v.prezzoKg}/Kg
                      </Typography>
                      <IconButton size="small" onClick={() => handleRimuoviVariante(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}

                {/* Form Nuova Variante */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nome Variante"
                    value={varianteForm.nome}
                    onChange={(e) => setVarianteForm({ ...varianteForm, nome: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Label Variante"
                    value={varianteForm.label}
                    onChange={(e) => setVarianteForm({ ...varianteForm, label: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Prezzo/Kg"
                    value={varianteForm.prezzoKg}
                    onChange={(e) => setVarianteForm({ ...varianteForm, prezzoKg: e.target.value })}
                    inputProps={{ step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Prezzo/Pezzo"
                    value={varianteForm.prezzoPezzo}
                    onChange={(e) => setVarianteForm({ ...varianteForm, prezzoPezzo: e.target.value })}
                    inputProps={{ step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAggiungiVariante}
                    sx={{ height: '40px' }}
                  >
                    Aggiungi Variante
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}