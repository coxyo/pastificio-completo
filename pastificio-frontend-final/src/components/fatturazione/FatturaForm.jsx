import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  TextField, Button, Typography, Box, Grid, Paper, Divider,
  IconButton, FormControl, InputLabel, Select, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, Dialog,
  DialogTitle, DialogContent, DialogActions, Autocomplete,
  InputAdornment, CircularProgress, Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Payment as PaymentIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import axios from 'axios';
import debounce from 'lodash/debounce';

/**
 * Componente per la creazione e modifica delle fatture
 */
const FatturaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  const isFromOrdine = location.search.includes('fromOrdine');
  const ordineId = new URLSearchParams(location.search).get('ordineId');
  
  // Stato della fattura
  const [fattura, setFattura] = useState({
    cliente: {
      nome: '',
      indirizzo: '',
      codiceFiscale: '',
      partitaIva: '',
      email: '',
      telefono: ''
    },
    righe: [],
    dataEmissione: format(new Date(), 'yyyy-MM-dd'),
    dataScadenza: format(new Date(new Date().setDate(new Date().getDate() + 30)), 'yyyy-MM-dd'),
    note: '',
    modalitaPagamento: 'Bonifico Bancario',
    coordinateBancarie: {
      iban: '',
      banca: '',
      intestatario: ''
    }
  });
  
  // Stato per la UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showClienteDialog, setShowClienteDialog] = useState(false);
  const [showProdottoDialog, setShowProdottoDialog] = useState(false);
  const [nuovoCliente, setNuovoCliente] = useState({
    nome: '',
    indirizzo: '',
    codiceFiscale: '',
    partitaIva: '',
    email: '',
    telefono: ''
  });
  const [nuovaRiga, setNuovaRiga] = useState({
    descrizione: '',
    quantita: 1,
    prezzoUnitario: 0,
    aliquotaIva: 10,
    sconto: 0
  });
  
  // Stato per le opzioni di ricerca
  const [clientiOptions, setClientiOptions] = useState([]);
  const [prodottiOptions, setProdottiOptions] = useState([]);
  const [searchingClienti, setSearchingClienti] = useState(false);
  const [searchingProdotti, setSearchingProdotti] = useState(false);
  
  // Opzioni per menu a discesa
  const metodiPagamento = [
    { value: 'Contanti', label: 'Contanti' },
    { value: 'Bonifico Bancario', label: 'Bonifico Bancario' },
    { value: 'Ricevuta Bancaria', label: 'Ricevuta Bancaria' },
    { value: 'Assegno', label: 'Assegno' },
    { value: 'Altro', label: 'Altro' }
  ];
  
  const aliquoteIva = [
    { value: 4, label: '4% (Beni di prima necessità)' },
    { value: 5, label: '5% (Prodotti sanitari)' },
    { value: 10, label: '10% (Prodotti alimentari)' },
    { value: 22, label: '22% (Aliquota ordinaria)' }
  ];

  /**
   * Carica i dati della fattura in modifica
   */
  const loadFattura = async () => {
    if (!isEdit) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/fatture/${id}`);
      setFattura(response.data.data);
    } catch (err) {
      console.error('Errore nel caricamento della fattura:', err);
      setError('Errore nel caricamento della fattura. Riprova più tardi.');
      toast.error('Errore nel caricamento della fattura');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carica i dati da un ordine
   */
  const loadOrdine = async () => {
    if (!isFromOrdine || !ordineId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/ordini/${ordineId}`);
      const ordine = response.data.data;
      
      // Prepara i dati per la fattura
      setFattura(prev => ({
        ...prev,
        cliente: {
          nome: ordine.nomeCliente || '',
          indirizzo: ordine.indirizzoCliente || '',
          telefono: ordine.telefono || '',
          email: ordine.email || '',
          codiceFiscale: '',
          partitaIva: ''
        },
        righe: ordine.prodotti.map(p => ({
          descrizione: p.nome,
          quantita: p.quantita,
          prezzoUnitario: p.prezzo,
          aliquotaIva: 10,
          sconto: 0,
          ordineId: ordine._id
        }))
      }));
    } catch (err) {
      console.error('Errore nel caricamento dell\'ordine:', err);
      setError('Errore nel caricamento dell\'ordine. Riprova più tardi.');
      toast.error('Errore nel caricamento dell\'ordine');
    } finally {
      setLoading(false);
    }
  };

  // Al montaggio, carica i dati necessari
  useEffect(() => {
    if (isEdit) {
      loadFattura();
    } else if (isFromOrdine && ordineId) {
      loadOrdine();
    }
  }, [id, isEdit, isFromOrdine, ordineId]);

  /**
   * Ricerca clienti (debounced)
   */
  const searchClienti = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setClientiOptions([]);
        setSearchingClienti(false);
        return;
      }
      
      try {
        setSearchingClienti(true);
        const response = await axios.get(`/api/clienti/search?q=${query}`);
        setClientiOptions(response.data.data);
      } catch (err) {
        console.error('Errore nella ricerca clienti:', err);
        setClientiOptions([]);
      } finally {
        setSearchingClienti(false);
      }
    }, 500),
    []
  );

  /**
   * Ricerca prodotti (debounced)
   */
  const searchProdotti = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setProdottiOptions([]);
        setSearchingProdotti(false);
        return;
      }
      
      try {
        setSearchingProdotti(true);
        const response = await axios.get(`/api/prodotti/search?q=${query}`);
        setProdottiOptions(response.data.data);
      } catch (err) {
        console.error('Errore nella ricerca prodotti:', err);
        setProdottiOptions([]);
      } finally {
        setSearchingProdotti(false);
      }
    }, 500),
    []
  );

  /**
   * Gestisce il cambio dei dati cliente
   */
  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setFattura(prev => ({
      ...prev,
      cliente: {
        ...prev.cliente,
        [name]: value
      }
    }));
  };

  /**
   * Gestisce l'aggiunta di una nuova riga
   */
  const handleAddRiga = () => {
    if (!nuovaRiga.descrizione || nuovaRiga.quantita <= 0 || nuovaRiga.prezzoUnitario <= 0) {
      toast.error('Inserisci descrizione, quantità e prezzo validi');
      return;
    }
    
    // Calcola importi
    const importoNetto = nuovaRiga.prezzoUnitario * nuovaRiga.quantita * (1 - nuovaRiga.sconto / 100);
    const importoIva = importoNetto * (nuovaRiga.aliquotaIva / 100);
    
    setFattura(prev => ({
      ...prev,
      righe: [
        ...prev.righe,
        {
          ...nuovaRiga,
          importoNetto,
          importoIva
        }
      ]
    }));
    
    // Reset nuova riga
    setNuovaRiga({
      descrizione: '',
      quantita: 1,
      prezzoUnitario: 0,
      aliquotaIva: 10,
      sconto: 0
    });
    
    setShowProdottoDialog(false);
  };

  /**
   * Gestisce la rimozione di una riga
   */
  const handleRemoveRiga = (index) => {
    setFattura(prev => ({
      ...prev,
      righe: prev.righe.filter((_, i) => i !== index)
    }));
  };

  /**
   * Gestisce l'aggiunta di un nuovo cliente
   */
  const handleAddCliente = () => {
    if (!nuovoCliente.nome || !nuovoCliente.indirizzo) {
      toast.error('Nome e indirizzo cliente sono obbligatori');
      return;
    }
    
    setFattura(prev => ({
      ...prev,
      cliente: nuovoCliente
    }));
    
    setNuovoCliente({
      nome: '',
      indirizzo: '',
      codiceFiscale: '',
      partitaIva: '',
      email: '',
      telefono: ''
    });
    
    setShowClienteDialog(false);
  };

  /**
   * Gestisce il cambio dei dati nel form nuovo cliente
   */
  const handleNuovoClienteChange = (e) => {
    const { name, value } = e.target;
    setNuovoCliente(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Gestisce il cambio dei dati nel form nuova riga
   */
  const handleNuovaRigaChange = (e) => {
    const { name, value } = e.target;
    setNuovaRiga(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Calcola i totali della fattura
   */
  const calcolaTotali = () => {
    // Calcola totale imponibile
    const totaleImponibile = fattura.righe.reduce((sum, riga) => {
      const importoNetto = riga.importoNetto || 
        (riga.prezzoUnitario * riga.quantita * (1 - (riga.sconto || 0) / 100));
      return sum + importoNetto;
    }, 0);
    
    // Calcola totale IVA
    const totaleIva = fattura.righe.reduce((sum, riga) => {
      const importoNetto = riga.importoNetto || 
        (riga.prezzoUnitario * riga.quantita * (1 - (riga.sconto || 0) / 100));
      const importoIva = riga.importoIva || 
        (importoNetto * (riga.aliquotaIva / 100));
      return sum + importoIva;
    }, 0);
    
    // Calcola totale fattura
    const totaleFattura = totaleImponibile + totaleIva;
    
    return {
      totaleImponibile,
      totaleIva,
      totaleFattura
    };
  };

  /**
   * Valida i dati della fattura
   */
  const validateFattura = () => {
    if (!fattura.cliente.nome || !fattura.cliente.indirizzo) {
      toast.error('Inserisci nome e indirizzo cliente');
      return false;
    }
    
    if (!fattura.righe.length) {
      toast.error('Aggiungi almeno una riga alla fattura');
      return false;
    }
    
    if (!fattura.dataEmissione || !fattura.dataScadenza) {
      toast.error('Inserisci date di emissione e scadenza valide');
      return false;
    }
    
    return true;
  };

  /**
   * Salva la fattura
   */
  const handleSave = async (emetti = false) => {
    if (!validateFattura()) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Prepara i dati
      const fatturaData = {
        ...fattura,
        stato: emetti ? 'Emessa' : 'Bozza'
      };
      
      let response;
      
      if (isEdit) {
        // Aggiorna fattura esistente
        response = await axios.put(`/api/fatture/${id}`, fatturaData);
        toast.success('Fattura aggiornata con successo');
      } else {
        // Crea nuova fattura
        response = await axios.post('/api/fatture', fatturaData);
        toast.success('Fattura creata con successo');
      }
      
      // Vai alla pagina di dettaglio
      navigate(`/fatture/${response.data.data._id}`);
    } catch (err) {
      console.error('Errore nel salvataggio della fattura:', err);
      setError(err.response?.data?.error || 'Errore nel salvataggio della fattura');
      toast.error('Errore nel salvataggio della fattura');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Formatta importi come valuta
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Calcola i totali
  const { totaleImponibile, totaleIva, totaleFattura } = calcolaTotali();

  return (
    <div>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Modifica Fattura' : 'Nuova Fattura'}
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/fatture')}
        >
          Torna alla lista
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {error && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          
          <form>
            <Grid container spacing={3}>
              {/* Sezione cliente */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Dati Cliente</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setShowClienteDialog(true)}
                    >
                      Nuovo Cliente
                    </Button>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Nome / Ragione Sociale"
                        name="nome"
                        value={fattura.cliente.nome}
                        onChange={handleClienteChange}
                        fullWidth
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Indirizzo"
                        name="indirizzo"
                        value={fattura.cliente.indirizzo}
                        onChange={handleClienteChange}
                        fullWidth
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Codice Fiscale"
                        name="codiceFiscale"
                        value={fattura.cliente.codiceFiscale}
                        onChange={handleClienteChange}
                        fullWidth
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Partita IVA"
                        name="partitaIva"
                        value={fattura.cliente.partitaIva}
                        onChange={handleClienteChange}
                        fullWidth
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={fattura.cliente.email}
                        onChange={handleClienteChange}
                        fullWidth
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Telefono"
                        name="telefono"
                        value={fattura.cliente.telefono}
                        onChange={handleClienteChange}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Sezione dati fattura */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Dati Fattura</Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Data Emissione"
                        type="date"
                        value={fattura.dataEmissione}
                        onChange={(e) => setFattura({ ...fattura, dataEmissione: e.target.value })}
                        fullWidth
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Data Scadenza"
                        type="date"
                        value={fattura.dataScadenza}
                        onChange={(e) => setFattura({ ...fattura, dataScadenza: e.target.value })}
                        fullWidth
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Modalità Pagamento</InputLabel>
                        <Select
                          value={fattura.modalitaPagamento}
                          onChange={(e) => setFattura({ ...fattura, modalitaPagamento: e.target.value })}
                          label="Modalità Pagamento"
                        >
                          {metodiPagamento.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {fattura.modalitaPagamento === 'Bonifico Bancario' && (
                      <>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="IBAN"
                            value={fattura.coordinateBancarie.iban || ''}
                            onChange={(e) => setFattura({
                              ...fattura,
                              coordinateBancarie: {
                                ...fattura.coordinateBancarie,
                                iban: e.target.value
                              }
                            })}
                            fullWidth
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Banca"
                            value={fattura.coordinateBancarie.banca || ''}
                            onChange={(e) => setFattura({
                              ...fattura,
                              coordinateBancarie: {
                                ...fattura.coordinateBancarie,
                                banca: e.target.value
                              }
                            })}
                            fullWidth
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Intestatario"
                            value={fattura.coordinateBancarie.intestatario || ''}
                            onChange={(e) => setFattura({
                              ...fattura,
                              coordinateBancarie: {
                                ...fattura.coordinateBancarie,
                                intestatario: e.target.value
                              }
                            })}
                            fullWidth
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Sezione righe fattura */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Righe Fattura</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setShowProdottoDialog(true)}
                    >
                      Aggiungi Prodotto
                    </Button>
                  </Box>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell width="35%">Descrizione</TableCell>
                          <TableCell align="right">Quantità</TableCell>
                          <TableCell align="right">Prezzo (€)</TableCell>
                          <TableCell align="right">IVA (%)</TableCell>
                          <TableCell align="right">Sconto (%)</TableCell>
                          <TableCell align="right">Importo (€)</TableCell>
                          <TableCell width="5%"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fattura.righe.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              Nessun prodotto aggiunto. Clicca su "Aggiungi Prodotto" per iniziare.
                            </TableCell>
                          </TableRow>
                        ) : (
                          fattura.righe.map((riga, index) => {
                            // Calcola importo netto se non presente
                            const importoNetto = riga.importoNetto || 
                              (riga.prezzoUnitario * riga.quantita * (1 - (riga.sconto || 0) / 100));
                            
                            return (
                              <TableRow key={index}>
                                <TableCell>{riga.descrizione}</TableCell>
                                <TableCell align="right">{riga.quantita}</TableCell>
                                <TableCell align="right">{formatCurrency(riga.prezzoUnitario)}</TableCell>
                                <TableCell align="right">{riga.aliquotaIva}%</TableCell>
                                <TableCell align="right">{riga.sconto || 0}%</TableCell>
                                <TableCell align="right">{formatCurrency(importoNetto)}</TableCell>
                                <TableCell>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleRemoveRiga(index)}
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
                  
                  {fattura.righe.length > 0 && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                          <TextField
                            label="Note"
                            value={fattura.note || ''}
                            onChange={(e) => setFattura({ ...fattura, note: e.target.value })}
                            fullWidth
                            multiline
                            rows={4}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Riepilogo</Typography>
                          <Divider sx={{ mb: 2 }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Totale Imponibile:</Typography>
                            <Typography>{formatCurrency(totaleImponibile)}</Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Totale IVA:</Typography>
                            <Typography>{formatCurrency(totaleIva)}</Typography>
                          </Box>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>TOTALE FATTURA:</Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{formatCurrency(totaleFattura)}</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              {/* Azioni */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/fatture')}
                  >
                    Annulla
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave(false)}
                    disabled={saving}
                  >
                    Salva come Bozza
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave(true)}
                    disabled={saving}
                  >
                    Emetti Fattura
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
          
          {/* Dialog Nuovo Cliente */}
          <Dialog open={showClienteDialog} onClose={() => setShowClienteDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>Aggiungi Nuovo Cliente</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nome / Ragione Sociale"
                    name="nome"
                    value={nuovoCliente.nome}
                    onChange={handleNuovoClienteChange}
                    fullWidth
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Indirizzo"
                    name="indirizzo"
                    value={nuovoCliente.indirizzo}
                    onChange={handleNuovoClienteChange}
                    fullWidth
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Codice Fiscale"
                    name="codiceFiscale"
                    value={nuovoCliente.codiceFiscale}
                    onChange={handleNuovoClienteChange}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Partita IVA"
                    name="partitaIva"
                    value={nuovoCliente.partitaIva}
                    onChange={handleNuovoClienteChange}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={nuovoCliente.email}
                    onChange={handleNuovoClienteChange}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Telefono"
                    name="telefono"
                    value={nuovoCliente.telefono}
                    onChange={handleNuovoClienteChange}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowClienteDialog(false)}>Annulla</Button>
              <Button onClick={handleAddCliente} color="primary">Aggiungi</Button>
            </DialogActions>
          </Dialog>
          
          {/* Dialog Nuovo Prodotto */}
          <Dialog open={showProdottoDialog} onClose={() => setShowProdottoDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>Aggiungi Prodotto</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Descrizione"
                    name="descrizione"
                    value={nuovaRiga.descrizione}
                    onChange={handleNuovaRigaChange}
                    fullWidth
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Quantità"
                    name="quantita"
                    type="number"
                    value={nuovaRiga.quantita}
                    onChange={handleNuovaRigaChange}
                    fullWidth
                    required
                    InputProps={{ 
                      inputProps: { min: 0.01, step: 0.01 }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Prezzo Unitario"
                    name="prezzoUnitario"
                    type="number"
                    value={nuovaRiga.prezzoUnitario}
                    onChange={handleNuovaRigaChange}
                    fullWidth
                    required
                    InputProps={{ 
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: <InputAdornment position="start">€</InputAdornment>
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Aliquota IVA</InputLabel>
                    <Select
                      name="aliquotaIva"
                      value={nuovaRiga.aliquotaIva}
                      onChange={handleNuovaRigaChange}
                      label="Aliquota IVA"
                    >
                      {aliquoteIva.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Sconto %"
                    name="sconto"
                    type="number"
                    value={nuovaRiga.sconto}
                    onChange={handleNuovaRigaChange}
                    fullWidth
                    InputProps={{ 
                      inputProps: { min: 0, max: 100, step: 1 },
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                  />
                </Grid>
                
                {nuovaRiga.prezzoUnitario > 0 && nuovaRiga.quantita > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mt: 1 }}>
                      <Typography variant="subtitle2">
                        Importo: {formatCurrency(nuovaRiga.prezzoUnitario * nuovaRiga.quantita * (1 - nuovaRiga.sconto / 100))}
                        {nuovaRiga.aliquotaIva > 0 && ` + IVA ${nuovaRiga.aliquotaIva}% (${formatCurrency(nuovaRiga.prezzoUnitario * nuovaRiga.quantita * (1 - nuovaRiga.sconto / 100) * nuovaRiga.aliquotaIva / 100)})`}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>
                        Totale: {formatCurrency(nuovaRiga.prezzoUnitario * nuovaRiga.quantita * (1 - nuovaRiga.sconto / 100) * (1 + nuovaRiga.aliquotaIva / 100))}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowProdottoDialog(false)}>Annulla</Button>
              <Button 
                onClick={handleAddRiga} 
                color="primary"
                disabled={!nuovaRiga.descrizione || nuovaRiga.quantita <= 0 || nuovaRiga.prezzoUnitario <= 0}
              >
                Aggiungi
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default FatturaForm;