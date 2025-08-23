// components/Magazzino/OrdiniManager.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Stack,
  Tabs,
  Tab,
  Tooltip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowForward as ArrowForwardIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import LoadingOverlay from '../common/LoadingOverlay';
import ErrorDisplay from '../common/ErrorDisplay';

// Componente per la gestione degli ordini ai fornitori
const OrdiniManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ordini, setOrdini] = useState([]);
  const [fornitori, setFornitori] = useState([]);
  const [ingredienti, setIngredienti] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [fornitoreFilter, setFornitoreFilter] = useState('');
  const [statoFilter, setStatoFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    from: '',
    to: ''
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [consegnaDialogOpen, setConsegnaDialogOpen] = useState(false);
  const [currentOrdine, setCurrentOrdine] = useState(null);
  
  const [nuovoOrdine, setNuovoOrdine] = useState({
    fornitore: '',
    dataOrdine: format(new Date(), 'yyyy-MM-dd'),
    dataConsegnaPrevista: '',
    stato: 'bozza',
    prodotti: [],
    modalitaPagamento: 'bonifico',
    note: ''
  });
  
  const [consegnaData, setConsegnaData] = useState({
    dataConsegna: format(new Date(), 'yyyy-MM-dd'),
    prodottiConsegnati: []
  });
  
  const [currentProdotto, setCurrentProdotto] = useState({
    ingrediente: '',
    quantita: '',
    prezzoUnitario: '',
    note: ''
  });
  
  const [activeStep, setActiveStep] = useState(0);
  
  // Carica gli ordini
  const fetchOrdini = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {};
      
      if (fornitoreFilter) {
        params.fornitore = fornitoreFilter;
      }
      
      if (statoFilter) {
        params.stato = statoFilter;
      }
      
      if (dateRangeFilter.from) {
        params.dataInizio = dateRangeFilter.from;
      }
      
      if (dateRangeFilter.to) {
        params.dataFine = dateRangeFilter.to;
      }
      
      const response = await axios.get('/api/magazzino/ordini', {
        params: {
          ...params,
          limit: 100,
          sort: '-dataOrdine'
        }
      });
      
      setOrdini(response.data.data);
    } catch (err) {
      console.error('Errore nel caricamento degli ordini:', err);
      setError('Impossibile caricare gli ordini. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Carica fornitori e ingredienti
  const fetchFornitoriEIngredienti = async () => {
    try {
      // Carica i fornitori
      const fornitoriResponse = await axios.get('/api/magazzino/fornitori', {
        params: {
          attivo: true,
          limit: 100
        }
      });
      
      setFornitori(fornitoriResponse.data.data);
      
      // Carica gli ingredienti
      const ingredientiResponse = await axios.get('/api/magazzino/ingredienti', {
        params: {
          attivo: true,
          limit: 100
        }
      });
      
      setIngredienti(ingredientiResponse.data.data);
    } catch (err) {
      console.error('Errore nel caricamento dei dati di supporto:', err);
    }
  };
  
  useEffect(() => {
    fetchOrdini();
    fetchFornitoriEIngredienti();
  }, []);
  
  // Filtra gli ordini
  const filteredOrdini = useMemo(() => {
    return ordini.filter((ordine) => {
      // Filtra per termine di ricerca (numero ordine)
      const matchesSearch = ordine.numeroOrdine.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [ordini, searchTerm]);
  
  // Gestione apertura dialog nuovo ordine
  const handleOpenNewOrderDialog = () => {
    setNuovoOrdine({
      fornitore: '',
      dataOrdine: format(new Date(), 'yyyy-MM-dd'),
      dataConsegnaPrevista: '',
      stato: 'bozza',
      prodotti: [],
      modalitaPagamento: 'bonifico',
      note: ''
    });
    setActiveStep(0);
    setDialogOpen(true);
  };
  
  // Gestione apertura dialog dettaglio ordine
  const handleOpenOrderDetailDialog = async (ordineId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/magazzino/ordini/${ordineId}`);
      setCurrentOrdine(response.data.data);
      setDialogOpen(true);
    } catch (err) {
      console.error('Errore nel recupero dei dettagli dell\'ordine:', err);
      setError('Impossibile recuperare i dettagli dell\'ordine. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione apertura dialog registrazione consegna
  const handleOpenConsegnaDialog = (ordine) => {
    setCurrentOrdine(ordine);
    
    // Prepara i dati per la consegna
    const prodottiDaConsegnare = ordine.prodotti
      .filter(p => p.quantitaConsegnata < p.quantita)
      .map(p => ({
        ingrediente: p.ingrediente._id || p.ingrediente,
        lotto: '',
        dataScadenza: '',
        quantita: p.quantita - p.quantitaConsegnata,
        note: ''
      }));
    
    setConsegnaData({
      dataConsegna: format(new Date(), 'yyyy-MM-dd'),
      prodottiConsegnati: prodottiDaConsegnare
    });
    
    setConsegnaDialogOpen(true);
  };
  
  // Gestione cambio passo nel wizard
  const handleNextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBackStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Gestione cambio campo in nuovo ordine
  const handleOrderFieldChange = (field, value) => {
    setNuovoOrdine(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Se viene selezionato il fornitore, calcola la data di consegna prevista
    if (field === 'fornitore' && value) {
      const fornitore = fornitori.find(f => f._id === value);
      if (fornitore) {
        const dataOrdine = new Date(nuovoOrdine.dataOrdine);
        const dataConsegna = new Date(dataOrdine);
        dataConsegna.setDate(dataConsegna.getDate() + (fornitore.tempoConsegnaGiorni || 7));
        
        setNuovoOrdine(prev => ({
          ...prev,
          dataConsegnaPrevista: format(dataConsegna, 'yyyy-MM-dd')
        }));
      }
    }
  };
  
  // Gestione prodotto per nuovo ordine
  const handleAddProdotto = () => {
    if (!currentProdotto.ingrediente || !currentProdotto.quantita || !currentProdotto.prezzoUnitario) {
      return;
    }
    
    // Calcola importo
    const importo = currentProdotto.quantita * currentProdotto.prezzoUnitario;
    
    const ingredienteObj = ingredienti.find(i => i._id === currentProdotto.ingrediente);
    
    setNuovoOrdine(prev => ({
      ...prev,
      prodotti: [
        ...prev.prodotti,
        {
          ...currentProdotto,
          importo,
          nome: ingredienteObj ? ingredienteObj.nome : '',
          unitaMisura: ingredienteObj ? ingredienteObj.unitaMisura : 'kg',
          quantitaConsegnata: 0
        }
      ]
    }));
    
    // Reset form prodotto
    setCurrentProdotto({
      ingrediente: '',
      quantita: '',
      prezzoUnitario: '',
      note: ''
    });
  };
  
  // Gestione rimozione prodotto
  const handleRemoveProdotto = (index) => {
    setNuovoOrdine(prev => ({
      ...prev,
      prodotti: prev.prodotti.filter((_, i) => i !== index)
    }));
  };
  
  // Calcola totali per l'ordine
  const calcolaTotali = useMemo(() => {
    const totaleImponibile = nuovoOrdine.prodotti.reduce((acc, prod) => acc + prod.importo, 0);
    const iva = totaleImponibile * 0.22; // IVA al 22%
    const totale = totaleImponibile + iva;
    
    return {
      totaleImponibile,
      iva,
      totale
    };
  }, [nuovoOrdine.prodotti]);
  
  // Gestione cambio campo in consegna
  const handleConsegnaFieldChange = (field, value) => {
    setConsegnaData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Gestione cambio prodotto consegnato
  const handleConsegnaProdottoChange = (index, field, value) => {
    setConsegnaData(prev => {
      const newProdotti = [...prev.prodottiConsegnati];
      newProdotti[index] = {
        ...newProdotti[index],
        [field]: value
      };
      return {
        ...prev,
        prodottiConsegnati: newProdotti
      };
    });
  };
  
  // Crea nuovo ordine
  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const orderData = {
        ...nuovoOrdine,
        totaleImponibile: calcolaTotali.totaleImponibile,
        iva: calcolaTotali.iva,
        totale: calcolaTotali.totale,
        prodotti: nuovoOrdine.prodotti.map(prod => ({
          ingrediente: prod.ingrediente,
          quantita: prod.quantita,
          prezzoUnitario: prod.prezzoUnitario,
          importo: prod.importo,
          quantitaConsegnata: 0,
          note: prod.note
        }))
      };
      
      await axios.post('/api/magazzino/ordini', orderData);
      
      // Ricarica gli ordini
      await fetchOrdini();
      
      // Chiudi il dialog
      setDialogOpen(false);
      setActiveStep(0);
    } catch (err) {
      console.error('Errore nella creazione dell\'ordine:', err);
      setError(`Impossibile creare l'ordine: ${err.response?.data?.error || 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Aggiorna stato ordine
  const handleUpdateOrderStatus = async (ordineId, nuovoStato) => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.put(`/api/magazzino/ordini/${ordineId}/stato`, {
        stato: nuovoStato
      });
      
      // Ricarica gli ordini
      await fetchOrdini();
      
      // Se è aperto il dialog dei dettagli, aggiorna l'ordine corrente
      if (currentOrdine && currentOrdine._id === ordineId) {
        setCurrentOrdine({
          ...currentOrdine,
          stato: nuovoStato
        });
      }
    } catch (err) {
      console.error('Errore nell\'aggiornamento dello stato dell\'ordine:', err);
      setError(`Impossibile aggiornare lo stato dell'ordine: ${err.response?.data?.error || 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Registra consegna
  const handleRegistraConsegna = async () => {
    if (!currentOrdine || !consegnaData.prodottiConsegnati.length) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.post(`/api/magazzino/ordini/${currentOrdine._id}/consegna`, {
        dataConsegna: new Date(consegnaData.dataConsegna),
        prodottiConsegnati: consegnaData.prodottiConsegnati
      });
      
      // Ricarica gli ordini
      await fetchOrdini();
      
      // Chiudi il dialog
      setConsegnaDialogOpen(false);
    } catch (err) {
      console.error('Errore nella registrazione della consegna:', err);
      setError(`Impossibile registrare la consegna: ${err.response?.data?.error || 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Determina il colore della chip di stato
  const getStatusColor = (stato) => {
    switch (stato) {
      case 'bozza':
        return 'default';
      case 'inviato':
        return 'info';
      case 'confermato':
        return 'primary';
      case 'parziale':
        return 'warning';
      case 'completato':
        return 'success';
      case 'annullato':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Ottieni label stato
  const getStatusLabel = (stato) => {
    const labels = {
      'bozza': 'Bozza',
      'inviato': 'Inviato',
      'confermato': 'Confermato',
      'parziale': 'Parzialmente consegnato',
      'completato': 'Completato',
      'annullato': 'Annullato'
    };
    
    return labels[stato] || stato;
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Gestione Ordini Fornitori
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenNewOrderDialog}
        >
          Nuovo Ordine
        </Button>
      </Box>
      
      {/* Filtri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Cerca numero ordine"
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
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Fornitore</InputLabel>
                <Select
                  value={fornitoreFilter}
                  onChange={(e) => setFornitoreFilter(e.target.value)}
                  label="Fornitore"
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {fornitori.map((fornitore) => (
                    <MenuItem key={fornitore._id} value={fornitore._id}>
                      {fornitore.ragioneSociale}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Stato</InputLabel>
                <Select
                  value={statoFilter}
                  onChange={(e) => setStatoFilter(e.target.value)}
                  label="Stato"
                >
                  <MenuItem value="">Tutti</MenuItem>
                  <MenuItem value="bozza">Bozza</MenuItem>
                  <MenuItem value="inviato">Inviato</MenuItem>
                  <MenuItem value="confermato">Confermato</MenuItem>
                  <MenuItem value="parziale">Parziale</MenuItem>
                  <MenuItem value="completato">Completato</MenuItem>
                  <MenuItem value="annullato">Annullato</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Da data"
                type="date"
                value={dateRangeFilter.from}
                onChange={(e) => setDateRangeFilter({...dateRangeFilter, from: e.target.value})}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={fetchOrdini}
                startIcon={<FilterIcon />}
              >
                Filtra
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Tabella ordini */}
      {loading && !dialogOpen && !consegnaDialogOpen ? (
        <LoadingOverlay />
      ) : error && !dialogOpen && !consegnaDialogOpen ? (
        <ErrorDisplay message={error} />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Numero Ordine</TableCell>
                <TableCell>Fornitore</TableCell>
                <TableCell>Data Ordine</TableCell>
                <TableCell>Consegna Prevista</TableCell>
                <TableCell>Totale</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrdini.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Nessun ordine trovato
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrdini.map((ordine) => (
                  <TableRow key={ordine._id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {ordine.numeroOrdine}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {ordine.fornitore.ragioneSociale || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(ordine.dataOrdine), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(ordine.dataConsegnaPrevista), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        €{ordine.totale.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ordine.prodotti?.length || 0} prodotti
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(ordine.stato)} 
                        color={getStatusColor(ordine.stato)} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Dettagli">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenOrderDetailDialog(ordine._id)}
                          >
                            <EventNoteIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {(ordine.stato === 'inviato' || ordine.stato === 'confermato' || ordine.stato === 'parziale') && (
                          <Tooltip title="Registra consegna">
                            <IconButton 
                              color="success" 
                              onClick={() => handleOpenConsegnaDialog(ordine)}
                            >
                              <ShippingIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Dialog per nuovo ordine */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {currentOrdine ? `Dettagli Ordine: ${currentOrdine.numeroOrdine}` : 'Nuovo Ordine'}
        </DialogTitle>
        <DialogContent>
          {currentOrdine ? (
            // Visualizzazione dettagli ordine esistente
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Fornitore</Typography>
                  <Typography variant="body1">{currentOrdine.fornitore.ragioneSociale}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Numero Ordine</Typography>
                  <Typography variant="body1">{currentOrdine.numeroOrdine}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">Data Ordine</Typography>
                  <Typography variant="body1">
                    {format(new Date(currentOrdine.dataOrdine), 'dd/MM/yyyy')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">Consegna Prevista</Typography>
                  <Typography variant="body1">
                    {format(new Date(currentOrdine.dataConsegnaPrevista), 'dd/MM/yyyy')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">Stato</Typography>
                  <Chip 
                    label={getStatusLabel(currentOrdine.stato)} 
                    color={getStatusColor(currentOrdine.stato)} 
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6">Prodotti</Typography>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Prodotto</TableCell>
                          <TableCell align="right">Quantità</TableCell>
                          <TableCell align="right">Prezzo</TableCell>
                          <TableCell align="right">Importo</TableCell>
                          <TableCell align="right">Consegnato</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentOrdine.prodotti.map((prodotto, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {prodotto.ingrediente.nome || 'N/A'}
                            </TableCell>
                            <TableCell align="right">
                              {prodotto.quantita} {prodotto.ingrediente.unitaMisura || ''}
                            </TableCell>
                            <TableCell align="right">
                              €{prodotto.prezzoUnitario.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              €{prodotto.importo.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              {prodotto.quantitaConsegnata} / {prodotto.quantita}
                              {prodotto.quantitaConsegnata === prodotto.quantita ? (
                                <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                              ) : (
                                <Chip 
                                  size="small" 
                                  label={`${((prodotto.quantitaConsegnata / prodotto.quantita) * 100).toFixed(0)}%`} 
                                  color={prodotto.quantitaConsegnata > 0 ? "warning" : "default"}
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">Totale Imponibile</Typography>
                  <Typography variant="body1">€{currentOrdine.totaleImponibile.toFixed(2)}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">IVA</Typography>
                  <Typography variant="body1">€{currentOrdine.iva.toFixed(2)}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">Totale</Typography>
                  <Typography variant="body1" fontWeight="bold">€{currentOrdine.totale.toFixed(2)}</Typography>
                </Grid>
                
                {currentOrdine.note && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Note</Typography>
                    <Typography variant="body2">{currentOrdine.note}</Typography>
                  </Grid>
                )}
                
                {currentOrdine.modalitaPagamento && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Modalità Pagamento</Typography>
                    <Typography variant="body2">{currentOrdine.modalitaPagamento}</Typography>
                  </Grid>
                )}
                
                {currentOrdine.dataConsegnaEffettiva && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Data Consegna Effettiva</Typography>
                    <Typography variant="body2">
                      {format(new Date(currentOrdine.dataConsegnaEffettiva), 'dd/MM/yyyy')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              {/* Azioni per l'ordine */}
              {currentOrdine.stato === 'bozza' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleUpdateOrderStatus(currentOrdine._id, 'inviato')}
                  startIcon={<ArrowForwardIcon />}
                  sx={{ mr: 1 }}
                >
                  Invia Ordine
                </Button>
              )}
              
              {currentOrdine.stato === 'inviato' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleUpdateOrderStatus(currentOrdine._id, 'confermato')}
                  startIcon={<CheckIcon />}
                  sx={{ mr: 1 }}
                >
                  Conferma Ordine
                </Button>
              )}
              
              {['bozza', 'inviato'].includes(currentOrdine.stato) && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleUpdateOrderStatus(currentOrdine._id, 'annullato')}
                  startIcon={<CancelIcon />}
                >
                  Annulla Ordine
                </Button>
              )}
              
              {(currentOrdine.stato === 'inviato' || currentOrdine.stato === 'confermato' || currentOrdine.stato === 'parziale') && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleOpenConsegnaDialog(currentOrdine)}
                  startIcon={<ShippingIcon />}
                  sx={{ mr: 1 }}
                >
                  Registra Consegna
                </Button>
              )}
            </Box>
          ) : (
            // Form per nuovo ordine
            <Box>
              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                <Step>
                  <StepLabel>Dati Ordine</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Prodotti</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Riepilogo</StepLabel>
                </Step>
              </Stepper>
              
              {/* Step 1: Dati Ordine */}
              {activeStep === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Fornitore</InputLabel>
                      <Select
                        value={nuovoOrdine.fornitore}
                        onChange={(e) => handleOrderFieldChange('fornitore', e.target.value)}
                        label="Fornitore"
                      >
                        {fornitori.map((fornitore) => (
                          <MenuItem key={fornitore._id} value={fornitore._id}>
                            {fornitore.ragioneSociale}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Data Ordine"
                      type="date"
                      value={nuovoOrdine.dataOrdine}
                      onChange={(e) => handleOrderFieldChange('dataOrdine', e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Data Consegna Prevista"
                      type="date"
                      value={nuovoOrdine.dataConsegnaPrevista}
                      onChange={(e) => handleOrderFieldChange('dataConsegnaPrevista', e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Modalità Pagamento</InputLabel>
                      <Select
                        value={nuovoOrdine.modalitaPagamento}
                        onChange={(e) => handleOrderFieldChange('modalitaPagamento', e.target.value)}
                        label="Modalità Pagamento"
                      >
                        <MenuItem value="bonifico">Bonifico</MenuItem>
                        <MenuItem value="rimessa diretta">Rimessa Diretta</MenuItem>
                        <MenuItem value="assegno">Assegno</MenuItem>
                        <MenuItem value="ricevuta bancaria">Ricevuta Bancaria</MenuItem>
                        <MenuItem value="contanti">Contanti</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Note"
                      multiline
                      rows={2}
                      value={nuovoOrdine.note}
                      onChange={(e) => handleOrderFieldChange('note', e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}
              
              {/* Step 2: Prodotti */}
              {activeStep === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Aggiungi Prodotti
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Ingrediente</InputLabel>
                          <Select
                            value={currentProdotto.ingrediente}
                            onChange={(e) => {
                              const ingredienteSelezionato = ingredienti.find(i => i._id === e.target.value);
                              setCurrentProdotto({
                                ...currentProdotto,
                                ingrediente: e.target.value,
                                prezzoUnitario: ingredienteSelezionato ? ingredienteSelezionato.prezzoUnitario : ''
                              });
                            }}
                            label="Ingrediente"
                          >
                            {ingredienti.map((ingrediente) => (
                              <MenuItem key={ingrediente._id} value={ingrediente._id}>
                                {ingrediente.nome} ({ingrediente.unitaMisura})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Quantità"
                          type="number"
                          value={currentProdotto.quantita}
                          onChange={(e) => setCurrentProdotto({...currentProdotto, quantita: parseFloat(e.target.value)})}
                          required
                          InputProps={{
                            endAdornment: currentProdotto.ingrediente && (
                              <InputAdornment position="end">
                                {ingredienti.find(i => i._id === currentProdotto.ingrediente)?.unitaMisura || ''}
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Prezzo Unitario"
                          type="number"
                          value={currentProdotto.prezzoUnitario}
                          onChange={(e) => setCurrentProdotto({...currentProdotto, prezzoUnitario: parseFloat(e.target.value)})}
                          required
                          InputProps={{
                            startAdornment: <InputAdornment position="start">€</InputAdornment>,
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Note"
                          value={currentProdotto.note}
                          onChange={(e) => setCurrentProdotto({...currentProdotto, note: e.target.value})}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          onClick={handleAddProdotto}
                          disabled={!currentProdotto.ingrediente || !currentProdotto.quantita || !currentProdotto.prezzoUnitario}
                          startIcon={<AddIcon />}
                        >
                          Aggiungi Prodotto
                        </Button>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="h6" gutterBottom>
                      Prodotti nell'ordine
                    </Typography>
                    
                    {nuovoOrdine.prodotti.length === 0 ? (
                      <Alert severity="info">
                        Nessun prodotto aggiunto. Aggiungi almeno un prodotto per procedere.
                      </Alert>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Prodotto</TableCell>
                              <TableCell align="right">Quantità</TableCell>
                              <TableCell align="right">Prezzo</TableCell>
                              <TableCell align="right">Importo</TableCell>
                              <TableCell align="right">Azioni</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {nuovoOrdine.prodotti.map((prodotto, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {prodotto.nome || ingredienti.find(i => i._id === prodotto.ingrediente)?.nome || 'N/A'}
                                </TableCell>
                                <TableCell align="right">
                                  {prodotto.quantita} {prodotto.unitaMisura || ingredienti.find(i => i._id === prodotto.ingrediente)?.unitaMisura || ''}
                                </TableCell>
                                <TableCell align="right">
                                  €{prodotto.prezzoUnitario.toFixed(2)}
                                </TableCell>
                                <TableCell align="right">
                                  €{prodotto.importo.toFixed(2)}
                                </TableCell>
                                <TableCell align="right">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleRemoveProdotto(index)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                                Totale:
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                €{calcolaTotali.totaleImponibile.toFixed(2)}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Grid>
                </Grid>
              )}
              
              {/* Step 3: Riepilogo */}
              {activeStep === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Riepilogo Ordine
                    </Typography>
                    
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">Fornitore</Typography>
                          <Typography variant="body1">
                            {fornitori.find(f => f._id === nuovoOrdine.fornitore)?.ragioneSociale || 'N/A'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">Modalità Pagamento</Typography>
                          <Typography variant="body1">{nuovoOrdine.modalitaPagamento}</Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">Data Ordine</Typography>
                          <Typography variant="body1">
                            {format(new Date(nuovoOrdine.dataOrdine), 'dd/MM/yyyy')}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">Data Consegna Prevista</Typography>
                          <Typography variant="body1">
                            {format(new Date(nuovoOrdine.dataConsegnaPrevista), 'dd/MM/yyyy')}
                          </Typography>
                        </Grid>
                        
                        {nuovoOrdine.note && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2">Note</Typography>
                            <Typography variant="body2">{nuovoOrdine.note}</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                    
                    <Typography variant="h6" gutterBottom>
                      Prodotti ({nuovoOrdine.prodotti.length})
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Prodotto</TableCell>
                            <TableCell align="right">Quantità</TableCell>
                            <TableCell align="right">Prezzo</TableCell>
                            <TableCell align="right">Importo</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {nuovoOrdine.prodotti.map((prodotto, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {prodotto.nome || ingredienti.find(i => i._id === prodotto.ingrediente)?.nome || 'N/A'}
                              </TableCell>
                             <TableCell align="right">
                                {prodotto.quantita} {prodotto.unitaMisura || ingredienti.find(i => i._id === prodotto.ingrediente)?.unitaMisura || ''}
                              </TableCell>
                              <TableCell align="right">
                                €{prodotto.prezzoUnitario.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                €{prodotto.importo.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="subtitle2">Totale Imponibile</Typography>
                          <Typography variant="body1">€{calcolaTotali.totaleImponibile.toFixed(2)}</Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <Typography variant="subtitle2">IVA (22%)</Typography>
                          <Typography variant="body1">€{calcolaTotali.iva.toFixed(2)}</Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <Typography variant="subtitle2">Totale</Typography>
                          <Typography variant="body1" fontWeight="bold">€{calcolaTotali.totale.toFixed(2)}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                    
                    {error && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                      </Alert>
                    )}
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {currentOrdine ? 'Chiudi' : 'Annulla'}
          </Button>
          
          {!currentOrdine && (
            <>
              {activeStep > 0 && (
                <Button onClick={handleBackStep}>
                  Indietro
                </Button>
              )}
              
              {activeStep < 2 && (
                <Button 
                  variant="contained"
                  onClick={handleNextStep}
                  disabled={
                    (activeStep === 0 && (!nuovoOrdine.fornitore || !nuovoOrdine.dataOrdine || !nuovoOrdine.dataConsegnaPrevista)) ||
                    (activeStep === 1 && nuovoOrdine.prodotti.length === 0)
                  }
                >
                  Avanti
                </Button>
              )}
              
              {activeStep === 2 && (
                <Button 
                  variant="contained"
                  color="primary"
                  onClick={handleCreateOrder}
                  disabled={loading}
                >
                  {loading ? 'Creazione in corso...' : 'Crea Ordine'}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Dialog per registrazione consegna */}
      <Dialog 
        open={consegnaDialogOpen} 
        onClose={() => setConsegnaDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Registra Consegna: {currentOrdine?.numeroOrdine}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Registra la consegna dei prodotti ordinati. Puoi registrare una consegna parziale o completa.
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Data Consegna"
                type="date"
                value={consegnaData.dataConsegna}
                onChange={(e) => handleConsegnaFieldChange('dataConsegna', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Prodotti da consegnare
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Prodotto</TableCell>
                      <TableCell align="right">Quantità Ordinata</TableCell>
                      <TableCell align="right">Già Consegnato</TableCell>
                      <TableCell align="right">Da Consegnare</TableCell>
                      <TableCell>Lotto</TableCell>
                      <TableCell>Scadenza</TableCell>
                      <TableCell>Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consegnaData.prodottiConsegnati.map((prodotto, index) => {
                      const ingredienteObj = currentOrdine.prodotti.find(p => 
                        p.ingrediente._id === prodotto.ingrediente || p.ingrediente === prodotto.ingrediente
                      );
                      const ingredienteInfo = ingredienti.find(i => i._id === prodotto.ingrediente);
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {ingredienteObj?.ingrediente.nome || ingredienteInfo?.nome || 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            {ingredienteObj?.quantita || 'N/A'} {ingredienteObj?.ingrediente.unitaMisura || ingredienteInfo?.unitaMisura || ''}
                          </TableCell>
                          <TableCell align="right">
                            {ingredienteObj?.quantitaConsegnata || 0} {ingredienteObj?.ingrediente.unitaMisura || ingredienteInfo?.unitaMisura || ''}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={prodotto.quantita}
                              onChange={(e) => handleConsegnaProdottoChange(index, 'quantita', parseFloat(e.target.value))}
                              inputProps={{
                                min: 0,
                                max: ingredienteObj ? ingredienteObj.quantita - ingredienteObj.quantitaConsegnata : 999999,
                                step: 0.01
                              }}
                              sx={{ width: '100px' }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={prodotto.lotto || ''}
                              onChange={(e) => handleConsegnaProdottoChange(index, 'lotto', e.target.value)}
                              sx={{ width: '100px' }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="date"
                              value={prodotto.dataScadenza || ''}
                              onChange={(e) => handleConsegnaProdottoChange(index, 'dataScadenza', e.target.value)}
                              InputLabelProps={{
                                shrink: true,
                              }}
                              sx={{ width: '140px' }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={prodotto.note || ''}
                              onChange={(e) => handleConsegnaProdottoChange(index, 'note', e.target.value)}
                              sx={{ width: '120px' }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {error}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConsegnaDialogOpen(false)}>Annulla</Button>
          <Button 
            variant="contained"
            color="primary"
            onClick={handleRegistraConsegna}
            disabled={loading || consegnaData.prodottiConsegnati.every(p => p.quantita <= 0)}
          >
            {loading ? 'Registrazione in corso...' : 'Registra Consegna'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdiniManager;