// components/GestioneProdotti.js - GESTIONE COMPLETA PRODOTTI
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Select, MenuItem, FormControl, InputLabel, Switch,
  FormControlLabel, Alert, Snackbar, CircularProgress, Tabs, Tab,
  Tooltip, InputAdornment, Menu, Card, CardContent, CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Category as CategoryIcon,
  Euro as EuroIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

const CATEGORIE = ['Ravioli', 'Dolci', 'Pardulas', 'Panadas', 'Pasta', 'Altro'];
const UNITA_MISURA = ['Kg', 'g', 'pz', 'dozzina', 'mezzo kg', '€'];

export default function GestioneProdotti() {
  const [prodotti, setProdotti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prodottoSelezionato, setProdottoSelezionato] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroDisponibilita, setFiltroDisponibilita] = useState('tutti');
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [statistiche, setStatistiche] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [prodottoMenu, setProdottoMenu] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    categoria: 'Ravioli',
    prezzoKg: 0,
    prezzoPezzo: 0,
    pezziPerKg: null,
    unitaMisuraDisponibili: ['Kg'],
    disponibile: true,
    attivo: true,
    allergeni: [],
    ingredienti: [],
    note: ''
  });

  // Carica prodotti
  useEffect(() => {
    caricaProdotti();
    caricaStatistiche();
  }, []);

  const caricaProdotti = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/prodotti`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProdotti(data.data || []);
        mostraNotifica('Prodotti caricati', 'success');
      } else if (response.status === 401) {
        mostraNotifica('Sessione scaduta, effettua il login', 'error');
      } else {
        throw new Error('Errore caricamento prodotti');
      }
    } catch (error) {
      console.error('Errore:', error);
      mostraNotifica('Errore caricamento prodotti', 'error');
    } finally {
      setLoading(false);
    }
  };

  const caricaStatistiche = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/prodotti/statistiche`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistiche(data.statistiche);
      }
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
  };

  const salvaProdotto = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const url = prodottoSelezionato 
        ? `${API_URL}/prodotti/${prodottoSelezionato._id}`
        : `${API_URL}/prodotti`;
      
      const method = prodottoSelezionato ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await caricaProdotti();
        await caricaStatistiche();
        setDialogOpen(false);
        resetForm();
        mostraNotifica(
          prodottoSelezionato ? 'Prodotto aggiornato' : 'Prodotto creato',
          'success'
        );
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Errore salvataggio');
      }
    } catch (error) {
      console.error('Errore:', error);
      mostraNotifica(error.message || 'Errore salvataggio prodotto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const eliminaProdotto = async (id) => {
    if (!confirm('Confermi eliminazione prodotto?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/prodotti/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await caricaProdotti();
        await caricaStatistiche();
        mostraNotifica('Prodotto disattivato', 'success');
      } else {
        throw new Error('Errore eliminazione');
      }
    } catch (error) {
      console.error('Errore:', error);
      mostraNotifica('Errore eliminazione prodotto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleDisponibilita = async (prodotto) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/prodotti/${prodotto._id}/disponibilita`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ disponibile: !prodotto.disponibile })
      });

      if (response.ok) {
        await caricaProdotti();
        mostraNotifica('Disponibilità aggiornata', 'success');
      }
    } catch (error) {
      console.error('Errore:', error);
      mostraNotifica('Errore aggiornamento disponibilità', 'error');
    }
  };

  const scaricaListinoPDF = async (categoria = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const url = categoria 
        ? `${API_URL}/prodotti/export/pdf/${categoria}`
        : `${API_URL}/prodotti/export/pdf?disponibiliOnly=true&includiDescrizioni=false`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = categoria 
          ? `listino-${categoria.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
          : `listino-prezzi-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        
        mostraNotifica('PDF scaricato!', 'success');
      } else {
        throw new Error('Errore generazione PDF');
      }
    } catch (error) {
      console.error('Errore PDF:', error);
      mostraNotifica('Errore generazione PDF', 'error');
    } finally {
      setLoading(false);
    }
  };

  const apriDialogModifica = (prodotto) => {
    setProdottoSelezionato(prodotto);
    setFormData({
      nome: prodotto.nome,
      descrizione: prodotto.descrizione || '',
      categoria: prodotto.categoria,
      prezzoKg: prodotto.prezzoKg || 0,
      prezzoPezzo: prodotto.prezzoPezzo || 0,
      pezziPerKg: prodotto.pezziPerKg || null,
      unitaMisuraDisponibili: prodotto.unitaMisuraDisponibili || ['Kg'],
      disponibile: prodotto.disponibile,
      attivo: prodotto.attivo,
      allergeni: prodotto.allergeni || [],
      ingredienti: prodotto.ingredienti || [],
      note: prodotto.note || ''
    });
    setDialogOpen(true);
  };

  const apriDialogNuovo = () => {
    resetForm();
    setProdottoSelezionato(null);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descrizione: '',
      categoria: 'Ravioli',
      prezzoKg: 0,
      prezzoPezzo: 0,
      pezziPerKg: null,
      unitaMisuraDisponibili: ['Kg'],
      disponibile: true,
      attivo: true,
      allergeni: [],
      ingredienti: [],
      note: ''
    });
  };

  const mostraNotifica = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Filtraggio prodotti
  const prodottiFiltrati = prodotti.filter(p => {
    const matchSearch = !searchTerm || 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descrizione && p.descrizione.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchCategoria = !filtroCategoria || p.categoria === filtroCategoria;
    
    const matchDisponibilita = 
      filtroDisponibilita === 'tutti' ||
      (filtroDisponibilita === 'disponibili' && p.disponibile) ||
      (filtroDisponibilita === 'non_disponibili' && !p.disponibile);
    
    return matchSearch && matchCategoria && matchDisponibilita;
  });

  // Prodotti per categoria (per tab view)
  const prodottiPerCategoria = CATEGORIE.map(cat => ({
    categoria: cat,
    prodotti: prodottiFiltrati.filter(p => p.categoria === cat)
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header con statistiche */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Gestione Prodotti
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Scarica listino completo PDF">
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PdfIcon />}
                onClick={() => scaricaListinoPDF()}
                disabled={loading}
              >
                📄 LISTINO PDF
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={apriDialogNuovo}
            >
              Nuovo Prodotto
            </Button>
            <IconButton onClick={caricaProdotti} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Statistiche cards */}
        {statistiche && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Prodotti Totali
                  </Typography>
                  <Typography variant="h4">
                    {statistiche.totale}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Disponibili
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {statistiche.disponibili}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Non Disponibili
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {statistiche.nonDisponibili}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Categorie
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {Object.keys(statistiche.perCategoria || {}).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filtri */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Cerca prodotto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={filtroCategoria}
                  label="Categoria"
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  <MenuItem value="">Tutte</MenuItem>
                  {CATEGORIE.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Disponibilità</InputLabel>
                <Select
                  value={filtroDisponibilita}
                  label="Disponibilità"
                  onChange={(e) => setFiltroDisponibilita(e.target.value)}
                >
                  <MenuItem value="tutti">Tutti</MenuItem>
                  <MenuItem value="disponibili">Disponibili</MenuItem>
                  <MenuItem value="non_disponibili">Non disponibili</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Tabs per categorie */}
      <Paper>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Tutti" />
          {CATEGORIE.map(cat => (
            <Tab 
              key={cat} 
              label={`${cat} (${prodottiFiltrati.filter(p => p.categoria === cat).length})`}
            />
          ))}
        </Tabs>

        {/* Tabella prodotti */}
        <TableContainer>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Prezzo Kg</TableCell>
                  <TableCell>Prezzo Pezzo</TableCell>
                  <TableCell>Unità</TableCell>
                  <TableCell>Disponibilità</TableCell>
                  <TableCell align="right">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(tabValue === 0 
                  ? prodottiFiltrati 
                  : prodottiPerCategoria[tabValue - 1]?.prodotti || []
                ).map((prodotto) => (
                  <TableRow key={prodotto._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {prodotto.nome}
                      </Typography>
                      {prodotto.descrizione && (
                        <Typography variant="caption" color="textSecondary">
                          {prodotto.descrizione}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={prodotto.categoria} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {prodotto.prezzoKg > 0 ? (
                        <Typography variant="body2" color="success.main">
                          €{prodotto.prezzoKg.toFixed(2)}/Kg
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {prodotto.prezzoPezzo > 0 ? (
                        <Typography variant="body2" color="success.main">
                          €{prodotto.prezzoPezzo.toFixed(2)}/pz
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {(prodotto.unitaMisuraDisponibili || []).join(', ')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Cambia disponibilità">
                        <Switch
                          checked={prodotto.disponibile}
                          onChange={() => toggleDisponibilita(prodotto)}
                          size="small"
                          color={prodotto.disponibile ? "success" : "default"}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => apriDialogModifica(prodotto)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => eliminaProdotto(prodotto._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setProdottoMenu(prodotto);
                        }}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {prodottiFiltrati.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        Nessun prodotto trovato
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Paper>

      {/* Menu contestuale */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          if (prodottoMenu) {
            scaricaListinoPDF(prodottoMenu.categoria);
          }
          setMenuAnchor(null);
        }}>
          <PdfIcon sx={{ mr: 1 }} fontSize="small" />
          Listino PDF categoria
        </MenuItem>
      </Menu>

      {/* Dialog Nuovo/Modifica Prodotto */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {prodottoSelezionato ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Prodotto *"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrizione"
                multiline
                rows={2}
                value={formData.descrizione}
                onChange={(e) => setFormData({...formData, descrizione: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria *</InputLabel>
                <Select
                  value={formData.categoria}
                  label="Categoria *"
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                >
                  {CATEGORIE.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Unità Misura</InputLabel>
                <Select
                  multiple
                  value={formData.unitaMisuraDisponibili}
                  label="Unità Misura"
                  onChange={(e) => setFormData({...formData, unitaMisuraDisponibili: e.target.value})}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {UNITA_MISURA.map(unita => (
                    <MenuItem key={unita} value={unita}>{unita}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Prezzo al Kg (€)"
                value={formData.prezzoKg}
                onChange={(e) => setFormData({...formData, prezzoKg: parseFloat(e.target.value) || 0})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Prezzo al Pezzo (€)"
                value={formData.prezzoPezzo}
                onChange={(e) => setFormData({...formData, prezzoPezzo: parseFloat(e.target.value) || 0})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Pezzi per Kg"
                value={formData.pezziPerKg || ''}
                onChange={(e) => setFormData({...formData, pezziPerKg: e.target.value ? parseInt(e.target.value) : null})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={2}
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.disponibile}
                    onChange={(e) => setFormData({...formData, disponibile: e.target.checked})}
                  />
                }
                label="Disponibile"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.attivo}
                    onChange={(e) => setFormData({...formData, attivo: e.target.checked})}
                  />
                }
                label="Attivo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={salvaProdotto}
            disabled={!formData.nome || loading}
          >
            {prodottoSelezionato ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
