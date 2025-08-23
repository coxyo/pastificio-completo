// components/Magazzino/RicetteManager.js
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
  InputAdornment,
  Tabs,
  Tab,
  Autocomplete,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Calculate as CalculateIcon,
  Restaurant as RestaurantIcon,
  ShoppingCart as CartIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';

import LoadingOverlay from '../common/LoadingOverlay';
import ErrorDisplay from '../common/ErrorDisplay';

// Componente per la gestione delle ricette
const RicetteManager = ({ onNotify }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ricette, setRicette] = useState([]);
  const [ingredienti, setIngredienti] = useState([]);
  const [categorieProdotto, setCategorieProdotto] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRicetta, setCurrentRicetta] = useState({
    nome: '',
    categoria: '',
    descrizione: '',
    ingredienti: [],
    tempoPreparazione: 0,
    porzioni: 1,
    prezzoVendita: 0,
    costoTotale: 0,
    margineProfitto: 0,
    attiva: true,
    note: ''
  });
  
  // Dialog per calcolo consumo
  const [consumoDialogOpen, setConsumoDialogOpen] = useState(false);
  const [quantitaProduzione, setQuantitaProduzione] = useState(1);
  const [ricettaSelezionata, setRicettaSelezionata] = useState(null);
  const [consumoCalcolato, setConsumoCalcolato] = useState([]);
  
  // Tab del form ricetta
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  // Carica le ricette
  const fetchRicette = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/pastificio/ricette', {
        params: {
          limit: 100
        }
      });
      
      setRicette(response.data.data);
    } catch (err) {
      console.error('Errore nel caricamento delle ricette:', err);
      setError('Impossibile caricare le ricette. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Carica gli ingredienti
  const fetchIngredienti = async () => {
    try {
      const response = await axios.get('/api/magazzino/ingredienti', {
        params: {
          attivo: true,
          limit: 100
        }
      });
      
      setIngredienti(response.data.data);
    } catch (err) {
      console.error('Errore nel caricamento degli ingredienti:', err);
    }
  };
  
  // Carica le categorie di prodotto
  const fetchCategorieProdotto = async () => {
    try {
      const response = await axios.get('/api/pastificio/categorie-prodotto');
      setCategorieProdotto(response.data.data);
    } catch (err) {
      console.error('Errore nel caricamento delle categorie:', err);
      setCategorieProdotto(['pasta fresca', 'pasta ripiena', 'pasta secca', 'dolci', 'pane', 'altro']);
    }
  };
  
  useEffect(() => {
    fetchRicette();
    fetchIngredienti();
    fetchCategorieProdotto();
  }, []);
  
  // Filtra le ricette
  const filteredRicette = useMemo(() => {
    return ricette.filter((ricetta) => {
      // Filtra per termine di ricerca
      const matchesSearch = 
        ricetta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ricetta.descrizione?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtra per categoria
      const matchesCategory = !categoryFilter || ricetta.categoria === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [ricette, searchTerm, categoryFilter]);
  
  // Gestione apertura dialog
  const handleOpenDialog = (ricetta = null) => {
    if (ricetta) {
      setCurrentRicetta({
        ...ricetta,
        // Aggiungi eventuali proprietà mancanti
        ingredienti: ricetta.ingredienti || []
      });
      setIsEditing(true);
    } else {
      setCurrentRicetta({
        nome: '',
        categoria: categorieProdotto.length > 0 ? categorieProdotto[0] : '',
        descrizione: '',
        ingredienti: [],
        tempoPreparazione: 0,
        porzioni: 1,
        prezzoVendita: 0,
        costoTotale: 0,
        margineProfitto: 0,
        attiva: true,
        note: ''
      });
      setIsEditing(false);
    }
    setActiveTabIndex(0);
    setDialogOpen(true);
  };
  
  // Apertura dialog calcolo consumo
  const handleOpenConsumoDialog = (ricetta) => {
    setRicettaSelezionata(ricetta);
    setQuantitaProduzione(1);
    calcolaConsumo(ricetta, 1);
    setConsumoDialogOpen(true);
  };
  
  // Calcola il consumo degli ingredienti
  const calcolaConsumo = (ricetta, quantita) => {
    const consumo = ricetta.ingredienti.map(ingredienteRicetta => {
      const ingrediente = ingredienti.find(i => i._id === ingredienteRicetta.ingrediente);
      
      return {
        ingrediente: ingrediente,
        quantitaUnitaria: ingredienteRicetta.quantita,
        quantitaTotale: ingredienteRicetta.quantita * quantita,
        unitaMisura: ingrediente?.unitaMisura || 'N/A',
        costo: (ingredienteRicetta.quantita * quantita * (ingrediente?.prezzoUnitario || 0)).toFixed(2)
      };
    });
    
    setConsumoCalcolato(consumo);
    return consumo;
  };
  
  // Crea ordine automatico basato sul consumo
  const creaOrdineAutomatico = async () => {
    if (!ricettaSelezionata || consumoCalcolato.length === 0) return;
    
    setLoading(true);
    
    try {
      // Crea un oggetto con gli ingredienti necessari, raggruppati per fornitore
      const ingredientiPerFornitore = {};
      
      // Popoliamo gli ingredienti necessari con quelli che sono sotto scorta
      for (const item of consumoCalcolato) {
        const ing = item.ingrediente;
        if (!ing || !ing.fornitoriPrimari || ing.fornitoriPrimari.length === 0) continue;
        
        // Ottieni scorte attuali
        const scorteResponse = await axios.get(`/api/magazzino/scorte/${ing._id}`);
        const scorteAttuali = scorteResponse.data.data.scorteAttuali;
        
        // Se le scorte sono sufficienti, salta
        if (scorteAttuali >= item.quantitaTotale) continue;
        
        // Altrimenti, calcola quanto ordinare
        const quantitaDaOrdinare = Math.max(
          item.quantitaTotale - scorteAttuali,
          ing.scorteMinime - scorteAttuali
        );
        
        // Prendiamo il primo fornitore primario
        const fornitoreId = ing.fornitoriPrimari[0];
        
        if (!ingredientiPerFornitore[fornitoreId]) {
          ingredientiPerFornitore[fornitoreId] = [];
        }
        
        ingredientiPerFornitore[fornitoreId].push({
          ingrediente: ing._id,
          nome: ing.nome,
          quantita: quantitaDaOrdinare,
          prezzoUnitario: ing.prezzoUnitario,
          totale: quantitaDaOrdinare * ing.prezzoUnitario
        });
      }
      
      // Ora creiamo un ordine per ogni fornitore
      for (const [fornitoreId, ingredienti] of Object.entries(ingredientiPerFornitore)) {
        if (ingredienti.length === 0) continue;
        
        // Crea l'ordine per questo fornitore
        const ordine = {
          fornitore: fornitoreId,
          dataOrdine: new Date().toISOString().split('T')[0],
          dataConsegnaPrevista: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          stato: 'bozza',
          righeOrdine: ingredienti.map(ing => ({
            ingrediente: ing.ingrediente,
            quantita: ing.quantita,
            prezzoUnitario: ing.prezzoUnitario,
            totale: ing.totale
          })),
          note: `Ordine generato automaticamente per ricetta "${ricettaSelezionata.nome}"`,
          totale: ingredienti.reduce((acc, curr) => acc + curr.totale, 0)
        };
        
        // Invia la richiesta per creare l'ordine
        await axios.post('/api/magazzino/ordini-fornitori', ordine);
      }
      
      onNotify('Ordini generati con successo per gli ingredienti necessari', 'success');
      setConsumoDialogOpen(false);
    } catch (err) {
      console.error('Errore nella creazione degli ordini automatici:', err);
      onNotify('Impossibile creare gli ordini automatici', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Calcola il costo totale della ricetta
  const calcolaCostoTotale = (ingredientiRicetta) => {
    return ingredientiRicetta.reduce((totale, item) => {
      const ingrediente = ingredienti.find(i => i._id === item.ingrediente);
      if (!ingrediente) return totale;
      
      return totale + (item.quantita * ingrediente.prezzoUnitario);
    }, 0);
  };
  
  // Gestione cambio campo
  const handleFieldChange = (field, value) => {
    setCurrentRicetta(prev => {
      const updated = { ...prev, [field]: value };
      
      // Se è cambiato il prezzo di vendita o gli ingredienti, ricalcola il margine
      if (field === 'prezzoVendita' || field === 'ingredienti') {
        const costoTotale = calcolaCostoTotale(updated.ingredienti);
        updated.costoTotale = costoTotale;
        
        if (updated.prezzoVendita > 0 && costoTotale > 0) {
          updated.margineProfitto = ((updated.prezzoVendita - costoTotale) / updated.prezzoVendita * 100).toFixed(2);
        } else {
          updated.margineProfitto = 0;
        }
      }
      
      return updated;
    });
  };
  
  // Gestione aggiunta ingrediente alla ricetta
  const handleAddIngrediente = (ingredienteId, quantita) => {
    if (!ingredienteId || !quantita || quantita <= 0) return;
    
    const ingrediente = ingredienti.find(ing => ing._id === ingredienteId);
    if (!ingrediente) return;
    
    // Aggiungi l'ingrediente
    setCurrentRicetta(prev => {
      // Verifica se l'ingrediente è già presente
      const esistente = prev.ingredienti.findIndex(i => i.ingrediente === ingredienteId);
      
      let nuoviIngredienti;
      if (esistente >= 0) {
        // Aggiorna la quantità esistente
        nuoviIngredienti = [...prev.ingredienti];
        nuoviIngredienti[esistente] = {
          ...nuoviIngredienti[esistente],
          quantita: parseFloat(nuoviIngredienti[esistente].quantita) + parseFloat(quantita)
        };
      } else {
        // Aggiungi nuovo ingrediente
        nuoviIngredienti = [
          ...prev.ingredienti,
          {
            ingrediente: ingredienteId,
            nome: ingrediente.nome,
            quantita: parseFloat(quantita),
            unitaMisura: ingrediente.unitaMisura
          }
        ];
      }
      
      // Calcola il nuovo costo totale
      const costoTotale = calcolaCostoTotale(nuoviIngredienti);
      
      // Calcola il nuovo margine
      let margineProfitto = 0;
      if (prev.prezzoVendita > 0 && costoTotale > 0) {
        margineProfitto = ((prev.prezzoVendita - costoTotale) / prev.prezzoVendita * 100).toFixed(2);
      }
      
      return {
        ...prev,
        ingredienti: nuoviIngredienti,
        costoTotale,
        margineProfitto
      };
    });
  };
  
  // Gestione rimozione ingrediente
  const handleRemoveIngrediente = (index) => {
    setCurrentRicetta(prev => {
      const nuoviIngredienti = prev.ingredienti.filter((_, i) => i !== index);
      
      // Calcola il nuovo costo totale
      const costoTotale = calcolaCostoTotale(nuoviIngredienti);
      
      // Calcola il nuovo margine
      let margineProfitto = 0;
      if (prev.prezzoVendita > 0 && costoTotale > 0) {
        margineProfitto = ((prev.prezzoVendita - costoTotale) / prev.prezzoVendita * 100).toFixed(2);
      }
      
      return {
        ...prev,
        ingredienti: nuoviIngredienti,
        costoTotale,
        margineProfitto
      };
    });
  };
  
  // Gestione salvataggio
  const handleSave = async () => {
    if (!currentRicetta.nome || !currentRicetta.categoria || currentRicetta.ingredienti.length === 0) {
      onNotify('Compila tutti i campi obbligatori e aggiungi almeno un ingrediente', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isEditing) {
        await axios.put(`/api/pastificio/ricette/${currentRicetta._id}`, currentRicetta);
        onNotify('Ricetta aggiornata con successo', 'success');
      } else {
        await axios.post('/api/pastificio/ricette', currentRicetta);
        onNotify('Ricetta creata con successo', 'success');
      }
      
      // Ricarica le ricette
      await fetchRicette();
      
      // Chiudi il dialog
      setDialogOpen(false);
    } catch (err) {
      console.error('Errore nel salvataggio della ricetta:', err);
      setError(`Impossibile salvare la ricetta. ${err.response?.data?.error || 'Riprova più tardi.'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Componente per la gestione degli ingredienti della ricetta
  const IngredientiRicettaManager = () => {
    const [ingredienteSelezionato, setIngredienteSelezionato] = useState('');
    const [quantita, setQuantita] = useState('');
    
    // Reset del form dopo l'aggiunta
    const resetForm = () => {
      setIngredienteSelezionato('');
      setQuantita('');
    };
    
    // Gestione aggiunta ingrediente
    const handleAddIngredienteForm = () => {
      handleAddIngrediente(ingredienteSelezionato, quantita);
      resetForm();
    };
    
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Aggiungi ingrediente
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Ingrediente</InputLabel>
              <Select
                value={ingredienteSelezionato}
                onChange={(e) => setIngredienteSelezionato(e.target.value)}
                label="Ingrediente"
              >
                <MenuItem value="">- Seleziona -</MenuItem>
                {ingredienti.map((ing) => (
                  <MenuItem key={ing._id} value={ing._id}>
                    {ing.nome} ({ing.unitaMisura}) - €{ing.prezzoUnitario}/
                    {ing.unitaMisura}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Quantità"
              type="number"
              value={quantita}
              onChange={(e) => setQuantita(e.target.value)}
              disabled={!ingredienteSelezionato}
              InputProps={{
                endAdornment: ingredienteSelezionato ? (
                  <InputAdornment position="end">
                    {ingredienti.find(i => i._id === ingredienteSelezionato)?.unitaMisura || ''}
                  </InputAdornment>
                ) : null
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAddIngredienteForm}
              disabled={!ingredienteSelezionato || !quantita || quantita <= 0}
              startIcon={<AddIcon />}
              sx={{ height: '56px' }}
            >
              Aggiungi
            </Button>
          </Grid>
        </Grid>
        
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Ingredienti nella ricetta
        </Typography>
        
        {currentRicetta.ingredienti.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Non ci sono ingredienti in questa ricetta. Aggiungi ingredienti usando il form sopra.
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ingrediente</TableCell>
                  <TableCell align="right">Quantità</TableCell>
                  <TableCell align="right">Costo unitario</TableCell>
                  <TableCell align="right">Costo totale</TableCell>
                  <TableCell align="center">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentRicetta.ingredienti.map((item, index) => {
                  const ingrediente = ingredienti.find(i => i._id === item.ingrediente);
                  const costoUnitario = ingrediente?.prezzoUnitario || 0;
                  const costoTotale = item.quantita * costoUnitario;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{ingrediente?.nome || 'Ingrediente sconosciuto'}</TableCell>
                      <TableCell align="right">
                        {item.quantita} {ingrediente?.unitaMisura}
                      </TableCell>
                      <TableCell align="right">€ {costoUnitario.toFixed(2)}</TableCell>
                      <TableCell align="right">€ {costoTotale.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveIngrediente(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                    Costo totale ingredienti:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    € {currentRicetta.costoTotale.toFixed(2)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Prezzo di vendita"
              type="number"
              value={currentRicetta.prezzoVendita}
              onChange={(e) => handleFieldChange('prezzoVendita', parseFloat(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Costo totale"
              type="number"
              value={currentRicetta.costoTotale.toFixed(2)}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Margine di profitto"
              type="text"
              value={`${currentRicetta.margineProfitto}%`}
              InputProps={{
                readOnly: true
              }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Gestione Ricette
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuova Ricetta
        </Button>
      </Box>
      
      {/* Filtri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Cerca ricetta"
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
            
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Categoria"
                >
                  <MenuItem value="">Tutte</MenuItem>
                  {categorieProdotto.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={fetchRicette}
                startIcon={<FilterIcon />}
              >
                Filtra
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Tabella ricette */}
      {loading && !dialogOpen && !consumoDialogOpen ? (
        <LoadingOverlay />
      ) : error && !dialogOpen && !consumoDialogOpen ? (
        <ErrorDisplay message={error} />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome ricetta</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Ingredienti</TableCell>
                <TableCell align="right">Costo</TableCell>
                <TableCell align="right">Prezzo</TableCell>
                <TableCell align="right">Margine</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRicette.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Nessuna ricetta trovata
                  </TableCell>
                </TableRow>
              ) : (
                filteredRicette.map((ricetta) => (
                  <TableRow key={ricetta._id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {ricetta.nome}
                      </Typography>
                      {ricetta.porzioni > 1 && (
                        <Typography variant="caption" color="text.secondary">
                          {ricetta.porzioni} porzioni
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ricetta.categoria} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      {ricetta.ingredienti?.length || 0} ingredienti
                    </TableCell>
                    <TableCell align="right">
                      € {ricetta.costoTotale?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell align="right">
                      € {ricetta.prezzoVendita?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell align="right">
                      {ricetta.margineProfitto?.toFixed(2) || '0.00'}%
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ricetta.attiva ? 'Attiva' : 'Inattiva'} 
                        color={ricetta.attiva ? 'success' : 'default'} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Modifica ricetta">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog(ricetta)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Calcola consumo ingredienti">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleOpenConsumoDialog(ricetta)}
                          >
                            <CalculateIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Dialog creazione/modifica ricetta */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {isEditing ? `Modifica ricetta: ${currentRicetta.nome}` : 'Nuova ricetta'}
        </DialogTitle>
        <DialogContent>
          <Tabs
            value={activeTabIndex}
            onChange={(e, newValue) => setActiveTabIndex(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Dettagli ricetta" />
            <Tab label="Ingredienti" />
          </Tabs>
          
          {/* Tab Dettagli */}
          {activeTabIndex === 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome ricetta"
                  value={currentRicetta.nome}
                  onChange={(e) => handleFieldChange('nome', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={currentRicetta.categoria}
                    onChange={(e) => handleFieldChange('categoria', e.target.value)}
                    label="Categoria"
                    required
                  >
                    {categorieProdotto.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrizione"
                  value={currentRicetta.descrizione || ''}
                  onChange={(e) => handleFieldChange('descrizione', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Tempo di preparazione (minuti)"
                  type="number"
                  value={currentRicetta.tempoPreparazione}
                  onChange={(e) => handleFieldChange('tempoPreparazione', parseInt(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">min</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Porzioni"
                  type="number"
                  value={currentRicetta.porzioni}
                  onChange={(e) => handleFieldChange('porzioni', parseInt(e.target.value))}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Stato</InputLabel>
                  <Select
                    value={currentRicetta.attiva}
                    onChange={(e) => handleFieldChange('attiva', e.target.value)}
                    label="Stato"
                  >
                    <MenuItem value={true}>Attiva</MenuItem>
                    <MenuItem value={false}>Inattiva</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Note"
                  value={currentRicetta.note || ''}
                  onChange={(e) => handleFieldChange('note', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          )}
          
          {/* Tab Ingredienti */}
          {activeTabIndex === 1 && <IngredientiRicettaManager />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={!currentRicetta.nome || !currentRicetta.categoria || currentRicetta.ingredienti.length === 0}
            startIcon={<SaveIcon />}
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog calcolo consumo */}
      <Dialog
        open={consumoDialogOpen}
        onClose={() => setConsumoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Calcolo consumo ingredienti: {ricettaSelezionata?.nome}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Calcola il consumo di ingredienti per la produzione di questa ricetta. Puoi anche generare ordini automatici per gli ingredienti mancanti.
          </Alert>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Quantità da produrre"
                type="number"
                value={quantitaProduzione}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setQuantitaProduzione(val);
                  calcolaConsumo(ricettaSelezionata, val);
                }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">unità</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => calcolaConsumo(ricettaSelezionata, quantitaProduzione)}
                startIcon={<CalculateIcon />}
                sx={{ height: '56px' }}
              >
                Ricalcola
              </Button>
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" gutterBottom>
            Consumo ingredienti per {quantitaProduzione} unità di "{ricettaSelezionata?.nome}"
          </Typography>
          
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ingrediente</TableCell>
                  <TableCell align="right">Quantità unitaria</TableCell>
                  <TableCell align="right">Quantità totale</TableCell>
                  <TableCell align="right">Costo totale</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consumoCalcolato.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nessun ingrediente in questa ricetta
                    </TableCell>
                  </TableRow>
                ) : (
                  consumoCalcolato.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.ingrediente?.nome || 'Ingrediente sconosciuto'}</TableCell>
                      <TableCell align="right">
                        {item.quantitaUnitaria} {item.unitaMisura}
                      </TableCell>
                      <TableCell align="right">
                        {item.quantitaTotale} {item.unitaMisura}
                      </TableCell>
                      <TableCell align="right">
                        € {item.costo}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow>
                  <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                    Costo totale produzione:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    € {consumoCalcolato.reduce((acc, curr) => acc + parseFloat(curr.costo), 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            Se procedi con la creazione di ordini automatici, il sistema verificherà le scorte attuali e creerà ordini solo per gli ingredienti insufficienti.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConsumoDialogOpen(false)}>Chiudi</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={creaOrdineAutomatico}
            disabled={consumoCalcolato.length === 0}
            startIcon={<CartIcon />}
          >
            Crea ordini automatici
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RicetteManager;