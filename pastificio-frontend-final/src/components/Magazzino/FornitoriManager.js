// components/Magazzino/FornitoriManager.js
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Chip, Rating, Tab, Tabs,
  InputAdornment, Alert, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Divider, Avatar, List,
  ListItem, ListItemText, ListItemAvatar, Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Euro as EuroIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function FornitoriManager() {
  const [fornitori, setFornitori] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fornitoreSelezionato, setFornitoreSelezionato] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState(0);
  const [categoriaFilter, setCategoriaFilter] = useState('');
  
  const [nuovoFornitore, setNuovoFornitore] = useState({
    ragioneSociale: '',
    partitaIVA: '',
    codiceFiscale: '',
    indirizzo: { 
      via: '', 
      cap: '', 
      citta: '', 
      provincia: '' 
    },
    contatti: { 
      telefono: '', 
      email: '',
      pec: '',
      referente: ''
    },
    categoriaForniture: [],
    condizioniPagamento: { 
      tipo: 'bonifico', 
      giorni: 30 
    },
    valutazione: 3,
    note: '',
    attivo: true
  });

  // Stati per statistiche
  const [stats, setStats] = useState({
    totale: 0,
    attivi: 0,
    inattivi: 0,
    perCategoria: {}
  });

  useEffect(() => {
    caricaFornitori();
  }, []);

  useEffect(() => {
    calcolaStatistiche();
  }, [fornitori]);

  const caricaFornitori = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/fornitori`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFornitori(data.data || []);
      } else {
        // Se l'API non esiste, usa dati demo
        setFornitori(getDemoFornitori());
        toast.info('Modalità demo - dati fornitori locali');
      }
    } catch (error) {
      console.error('Errore caricamento fornitori:', error);
      // Usa dati demo in caso di errore
      setFornitori(getDemoFornitori());
      toast.warning('Usando dati demo fornitori');
    } finally {
      setLoading(false);
    }
  };

  const getDemoFornitori = () => [
    {
      _id: '1',
      ragioneSociale: 'Molino Rossi SpA',
      partitaIVA: '12345678901',
      indirizzo: {
        via: 'Via Roma 1',
        citta: 'Milano',
        cap: '20100',
        provincia: 'MI'
      },
      contatti: {
        telefono: '02-1234567',
        email: 'info@molinorossi.it',
        referente: 'Mario Rossi'
      },
      categoriaForniture: ['farina'],
      condizioniPagamento: { tipo: 'bonifico', giorni: 30 },
      valutazione: 5,
      attivo: true
    },
    {
      _id: '2',
      ragioneSociale: 'Latteria Bianchi Srl',
      partitaIVA: '98765432101',
      indirizzo: {
        via: 'Via Verdi 15',
        citta: 'Torino',
        cap: '10100',
        provincia: 'TO'
      },
      contatti: {
        telefono: '011-9876543',
        email: 'ordini@latteriabianchi.it',
        referente: 'Giuseppe Bianchi'
      },
      categoriaForniture: ['latticini', 'uova'],
      condizioniPagamento: { tipo: 'bonifico', giorni: 60 },
      valutazione: 4,
      attivo: true
    },
    {
      _id: '3',
      ragioneSociale: 'Packaging Solutions',
      partitaIVA: '55544433322',
      indirizzo: {
        via: 'Via Industria 8',
        citta: 'Bologna',
        cap: '40100',
        provincia: 'BO'
      },
      contatti: {
        telefono: '051-5555555',
        email: 'vendite@packaging.it',
        referente: 'Laura Verdi'
      },
      categoriaForniture: ['confezionamento'],
      condizioniPagamento: { tipo: 'riba', giorni: 90 },
      valutazione: 4,
      attivo: true
    }
  ];

  const calcolaStatistiche = () => {
    const totale = fornitori.length;
    const attivi = fornitori.filter(f => f.attivo).length;
    const inattivi = totale - attivi;
    
    const perCategoria = {};
    fornitori.forEach(f => {
      f.categoriaForniture?.forEach(cat => {
        perCategoria[cat] = (perCategoria[cat] || 0) + 1;
      });
    });

    setStats({ totale, attivi, inattivi, perCategoria });
  };

  const salvaFornitore = async () => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      const url = fornitoreSelezionato 
        ? `${backendUrl}/api/fornitori/${fornitoreSelezionato._id}`
        : `${backendUrl}/api/fornitori`;
      
      const method = fornitoreSelezionato ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuovoFornitore)
      });

      if (response.ok) {
        toast.success(`Fornitore ${fornitoreSelezionato ? 'aggiornato' : 'creato'} con successo`);
        setDialogOpen(false);
        resetForm();
        caricaFornitori();
      } else {
        throw new Error('Errore nel salvataggio');
      }
    } catch (error) {
      // Salva in locale
      if (fornitoreSelezionato) {
        setFornitori(prev => prev.map(f => 
          f._id === fornitoreSelezionato._id 
            ? { ...nuovoFornitore, _id: fornitoreSelezionato._id }
            : f
        ));
      } else {
        const newFornitore = {
          ...nuovoFornitore,
          _id: `local_${Date.now()}`
        };
        setFornitori(prev => [...prev, newFornitore]);
      }
      
      toast.success('Fornitore salvato localmente');
      setDialogOpen(false);
      resetForm();
    }
  };

  const eliminaFornitore = async (id) => {
    if (!confirm('Sicuro di voler eliminare questo fornitore?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      await fetch(`${backendUrl}/api/fornitori/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      setFornitori(prev => prev.filter(f => f._id !== id));
      toast.success('Fornitore eliminato');
    } catch (error) {
      // Elimina localmente
      setFornitori(prev => prev.filter(f => f._id !== id));
      toast.success('Fornitore eliminato localmente');
    }
  };

  const resetForm = () => {
    setNuovoFornitore({
      ragioneSociale: '',
      partitaIVA: '',
      codiceFiscale: '',
      indirizzo: { via: '', cap: '', citta: '', provincia: '' },
      contatti: { telefono: '', email: '', pec: '', referente: '' },
      categoriaForniture: [],
      condizioniPagamento: { tipo: 'bonifico', giorni: 30 },
      valutazione: 3,
      note: '',
      attivo: true
    });
    setFornitoreSelezionato(null);
  };

  const handleEditFornitore = (fornitore) => {
    setFornitoreSelezionato(fornitore);
    setNuovoFornitore(fornitore);
    setDialogOpen(true);
  };

  const fornitoriFiltered = fornitori.filter(f => {
    const matchSearch = f.ragioneSociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       f.contatti?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       f.contatti?.referente?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategoria = !categoriaFilter || f.categoriaForniture?.includes(categoriaFilter);
    
    return matchSearch && matchCategoria;
  });

  const categorie = ['farina', 'uova', 'latticini', 'spezie', 'confezionamento', 'altro'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gestione Fornitori
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Nuovo Fornitore
        </Button>
      </Box>

      {/* Statistiche */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Totale Fornitori
              </Typography>
              <Typography variant="h4">
                {stats.totale}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Fornitori Attivi
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.attivi}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rating Medio
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ mr: 1 }}>
                  {fornitori.length > 0 
                    ? (fornitori.reduce((acc, f) => acc + (f.valutazione || 0), 0) / fornitori.length).toFixed(1)
                    : '0'}
                </Typography>
                <StarIcon color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Categorie Coperte
              </Typography>
              <Typography variant="h4">
                {Object.keys(stats.perCategoria).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtri */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Cerca fornitore..."
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
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                label="Categoria"
              >
                <MenuItem value="">Tutte</MenuItem>
                {categorie.map(cat => (
                  <MenuItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              {fornitoriFiltered.length} fornitori trovati
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`Lista (${fornitoriFiltered.length})`} />
          <Tab label="Per Categoria" />
          <Tab label="Valutazioni" />
          <Tab label="Condizioni Pagamento" />
        </Tabs>

        {/* Tab Lista */}
        <TabPanel value={tab} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ragione Sociale</TableCell>
                  <TableCell>Contatti</TableCell>
                  <TableCell>Categorie</TableCell>
                  <TableCell>Pagamento</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fornitoriFiltered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Nessun fornitore trovato
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  fornitoriFiltered.map((fornitore) => (
                    <TableRow key={fornitore._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {fornitore.ragioneSociale}
                          </Typography>
                          {fornitore.partitaIVA && (
                            <Typography variant="caption" color="text.secondary">
                              P.IVA: {fornitore.partitaIVA}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {fornitore.contatti?.telefono && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {fornitore.contatti.telefono}
                              </Typography>
                            </Box>
                          )}
                          {fornitore.contatti?.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                {fornitore.contatti.email}
                              </Typography>
                            </Box>
                          )}
                          {fornitore.contatti?.referente && (
                            <Typography variant="caption" color="text.secondary">
                              Ref: {fornitore.contatti.referente}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {fornitore.categoriaForniture?.map((cat, idx) => (
                            <Chip
                              key={idx}
                              label={cat}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {fornitore.condizioniPagamento?.tipo || 'N/D'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fornitore.condizioniPagamento?.giorni || 0} gg
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Rating
                          value={fornitore.valutazione || 0}
                          readOnly
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fornitore.attivo ? 'Attivo' : 'Inattivo'}
                          color={fornitore.attivo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditFornitore(fornitore)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => eliminaFornitore(fornitore._id)}
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

        {/* Tab Per Categoria */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            {categorie.map((categoria) => {
              const fornitoriCategoria = fornitoriFiltered.filter(f => 
                f.categoriaForniture?.includes(categoria)
              );
              
              return (
                <Grid item xs={12} md={6} key={categoria}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                          {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                        </Typography>
                        <Badge badgeContent={fornitoriCategoria.length} color="primary">
                          <ShoppingCartIcon />
                        </Badge>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      {fornitoriCategoria.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Nessun fornitore per questa categoria
                        </Typography>
                      ) : (
                        <List dense>
                          {fornitoriCategoria.map(f => (
                            <ListItem key={f._id}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  {f.ragioneSociale.charAt(0)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={f.ragioneSociale}
                                secondary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Rating value={f.valutazione || 0} readOnly size="small" />
                                    <Typography variant="caption">
                                      {f.condizioniPagamento?.tipo} - {f.condizioniPagamento?.giorni}gg
                                    </Typography>
                                  </Box>
                                }
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleEditFornitore(f)}
                              >
                                <EditIcon />
                              </IconButton>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>

        {/* Tab Valutazioni */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            {fornitoriFiltered
              .sort((a, b) => (b.valutazione || 0) - (a.valutazione || 0))
              .map((fornitore) => (
                <Grid item xs={12} md={6} lg={4} key={fornitore._id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                          {fornitore.ragioneSociale}
                        </Typography>
                        {fornitore.valutazione >= 4 ? (
                          <CheckCircleIcon color="success" />
                        ) : fornitore.valutazione <= 2 ? (
                          <WarningIcon color="warning" />
                        ) : null}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Rating 
                          value={fornitore.valutazione || 0} 
                          onChange={(e, newValue) => {
                            const updatedFornitore = { ...fornitore, valutazione: newValue };
                            setFornitori(prev => prev.map(f => 
                              f._id === fornitore._id ? updatedFornitore : f
                            ));
                            // Salva anche su backend se disponibile
                          }}
                          size="large"
                        />
                        <Typography variant="h6" sx={{ ml: 2 }}>
                          {fornitore.valutazione || 0}/5
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {fornitore.categoriaForniture?.map((cat, idx) => (
                          <Chip key={idx} label={cat} size="small" />
                        ))}
                      </Box>
                      {fornitore.note && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Note: {fornitore.note}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </TabPanel>

        {/* Tab Condizioni Pagamento */}
        <TabPanel value={tab} index={3}>
          <Grid container spacing={2}>
            {['contanti', 'bonifico', 'riba', 'rid'].map((tipo) => {
              const fornitoriTipo = fornitoriFiltered.filter(f => 
                f.condizioniPagamento?.tipo === tipo
              );
              
              return (
                <Grid item xs={12} md={6} key={tipo}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PaymentIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        </Typography>
                        <Chip 
                          label={fornitoriTipo.length} 
                          size="small" 
                          color="primary"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      {fornitoriTipo.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Nessun fornitore con questo metodo di pagamento
                        </Typography>
                      ) : (
                        <List dense>
                          {fornitoriTipo.map(f => (
                            <ListItem key={f._id}>
                              <ListItemText
                                primary={f.ragioneSociale}
                                secondary={`${f.condizioniPagamento?.giorni || 0} giorni`}
                              />
                              <Rating value={f.valutazione || 0} readOnly size="small" />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Dialog per nuovo/modifica fornitore */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => { setDialogOpen(false); resetForm(); }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {fornitoreSelezionato ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Dati principali */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Dati Principali
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ragione Sociale"
                value={nuovoFornitore.ragioneSociale}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  ragioneSociale: e.target.value
                })}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Partita IVA"
                value={nuovoFornitore.partitaIVA}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  partitaIVA: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Codice Fiscale"
                value={nuovoFornitore.codiceFiscale}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  codiceFiscale: e.target.value
                })}
              />
            </Grid>

            {/* Indirizzo */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Indirizzo
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Via/Piazza"
                value={nuovoFornitore.indirizzo?.via}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  indirizzo: { ...nuovoFornitore.indirizzo, via: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="CAP"
                value={nuovoFornitore.indirizzo?.cap}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  indirizzo: { ...nuovoFornitore.indirizzo, cap: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Città"
                value={nuovoFornitore.indirizzo?.citta}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  indirizzo: { ...nuovoFornitore.indirizzo, citta: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <TextField
                fullWidth
                label="Prov"
                value={nuovoFornitore.indirizzo?.provincia}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  indirizzo: { ...nuovoFornitore.indirizzo, provincia: e.target.value }
                })}
              />
            </Grid>

            {/* Contatti */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Contatti
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Telefono"
                value={nuovoFornitore.contatti?.telefono}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  contatti: { ...nuovoFornitore.contatti, telefono: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={nuovoFornitore.contatti?.email}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  contatti: { ...nuovoFornitore.contatti, email: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="PEC"
                type="email"
                value={nuovoFornitore.contatti?.pec}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  contatti: { ...nuovoFornitore.contatti, pec: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Referente"
                value={nuovoFornitore.contatti?.referente}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  contatti: { ...nuovoFornitore.contatti, referente: e.target.value }
                })}
              />
            </Grid>

            {/* Forniture e Pagamenti */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Forniture e Condizioni
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Categorie Forniture</InputLabel>
                <Select
                  multiple
                  value={nuovoFornitore.categoriaForniture || []}
                  onChange={(e) => setNuovoFornitore({
                    ...nuovoFornitore,
                    categoriaForniture: e.target.value
                  })}
                  label="Categorie Forniture"
                >
                  {categorie.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo Pagamento</InputLabel>
                <Select
                  value={nuovoFornitore.condizioniPagamento?.tipo || 'bonifico'}
                  onChange={(e) => setNuovoFornitore({
                    ...nuovoFornitore,
                    condizioniPagamento: { 
                      ...nuovoFornitore.condizioniPagamento, 
                      tipo: e.target.value 
                    }
                  })}
                  label="Tipo Pagamento"
                >
                  <MenuItem value="contanti">Contanti</MenuItem>
                  <MenuItem value="bonifico">Bonifico</MenuItem>
                  <MenuItem value="riba">RiBa</MenuItem>
                  <MenuItem value="rid">RID</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Giorni Pagamento"
                type="number"
                value={nuovoFornitore.condizioniPagamento?.giorni || 30}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  condizioniPagamento: { 
                    ...nuovoFornitore.condizioniPagamento, 
                    giorni: parseInt(e.target.value) || 0
                  }
                })}
              />
            </Grid>

            {/* Valutazione e Note */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Valutazione e Note
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography gutterBottom>Valutazione</Typography>
                <Rating
                  value={nuovoFornitore.valutazione || 3}
                  onChange={(e, newValue) => setNuovoFornitore({
                    ...nuovoFornitore,
                    valutazione: newValue
                  })}
                  size="large"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={2}
                value={nuovoFornitore.note}
                onChange={(e) => setNuovoFornitore({
                  ...nuovoFornitore,
                  note: e.target.value
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); resetForm(); }}>
            Annulla
          </Button>
          <Button 
            variant="contained" 
            onClick={salvaFornitore}
            disabled={!nuovoFornitore.ragioneSociale}
          >
            {fornitoreSelezionato ? 'Aggiorna' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}