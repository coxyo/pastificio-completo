// components/Magazzino/IngredientiManager.js
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
  Switch,
  FormControlLabel,
  InputAdornment,
  Tooltip,
  FormGroup,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import axios from 'axios';

import LoadingOverlay from '../common/LoadingOverlay';
import ErrorDisplay from '../common/ErrorDisplay';

// Array delle categorie disponibili
const CATEGORIE_INGREDIENTI = [
  'farina', 'uova', 'latte', 'olio', 'sale', 'condimento', 'ripieno', 'altro'
];

// Array delle unità di misura disponibili
const UNITA_MISURA = [
  'kg', 'g', 'l', 'ml', 'pz', 'q'
];

// Array degli allergeni comuni
const ALLERGENI = [
  'glutine', 'crostacei', 'uova', 'pesce', 'arachidi', 'soia', 'latte', 
  'frutta a guscio', 'sedano', 'senape', 'sesamo', 'anidride solforosa', 
  'lupini', 'molluschi', 'nessuno'
];

// Componente per la gestione degli ingredienti
const IngredientiManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [fornitori, setFornitori] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState({
    nome: '',
    descrizione: '',
    categoria: 'altro',
    unitaMisura: 'kg',
    prezzoUnitario: '',
    allergeni: [],
    scorteMinime: 0,
    scadenzaGiorni: null,
    tempoConsegnaGiorni: 7,
    attivo: true,
    fornitoriPrimari: [],
    note: ''
  });
  
  // Carica gli ingredienti
  const fetchIngredients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/magazzino/ingredienti', {
        params: {
          limit: 100
        }
      });
      
      setIngredients(response.data.data);
    } catch (err) {
      console.error('Errore nel caricamento degli ingredienti:', err);
      setError('Impossibile caricare gli ingredienti. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Carica i fornitori
  const fetchFornitori = async () => {
    try {
      const response = await axios.get('/api/magazzino/fornitori', {
        params: {
          attivo: true,
          limit: 100
        }
      });
      
      setFornitori(response.data.data);
    } catch (err) {
      console.error('Errore nel caricamento dei fornitori:', err);
    }
  };
  
  useEffect(() => {
    fetchIngredients();
    fetchFornitori();
  }, []);
  
  // Filtra gli ingredienti
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ingredient) => {
      // Filtra per termine di ricerca
      const matchesSearch = ingredient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (ingredient.descrizione && ingredient.descrizione.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtra per categoria
      const matchesCategory = !categoryFilter || ingredient.categoria === categoryFilter;
      
      // Filtra per stato attivo/inattivo
      const matchesActive = 
        activeFilter === 'all' ||
        (activeFilter === 'active' && ingredient.attivo) ||
        (activeFilter === 'inactive' && !ingredient.attivo);
      
      return matchesSearch && matchesCategory && matchesActive;
    });
  }, [ingredients, searchTerm, categoryFilter, activeFilter]);
  
  // Gestione apertura dialog
  const handleOpenDialog = (ingredient = null) => {
    if (ingredient) {
      setCurrentIngredient(ingredient);
      setIsEditing(true);
    } else {
      setCurrentIngredient({
        nome: '',
        descrizione: '',
        categoria: 'altro',
        unitaMisura: 'kg',
        prezzoUnitario: '',
        allergeni: [],
        scorteMinime: 0,
        scadenzaGiorni: null,
        tempoConsegnaGiorni: 7,
        attivo: true,
        fornitoriPrimari: [],
        note: ''
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };
  
  // Gestione cambio campo
  const handleFieldChange = (field, value) => {
    setCurrentIngredient(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Gestione salvataggio
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (isEditing) {
        await axios.put(`/api/magazzino/ingredienti/${currentIngredient._id}`, currentIngredient);
      } else {
        await axios.post('/api/magazzino/ingredienti', currentIngredient);
      }
      
      // Ricarica gli ingredienti
      await fetchIngredients();
      
      // Chiudi il dialog
      setDialogOpen(false);
    } catch (err) {
      console.error('Errore nel salvataggio dell\'ingrediente:', err);
      setError(`Impossibile salvare l'ingrediente. ${err.response?.data?.error || 'Riprova più tardi.'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Ottieni le categorie uniche
  const uniqueCategories = useMemo(() => {
    const categories = ingredients.map(ingredient => ingredient.categoria);
    return [...new Set(categories)];
  }, [ingredients]);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Gestione Ingredienti
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuovo Ingrediente
        </Button>
      </Box>
      
      {/* Filtri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Cerca ingrediente"
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
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Categoria"
                >
                  <MenuItem value="">Tutte</MenuItem>
                  {uniqueCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Stato</InputLabel>
                <Select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  label="Stato"
                >
                  <MenuItem value="all">Tutti</MenuItem>
                  <MenuItem value="active">Attivi</MenuItem>
                  <MenuItem value="inactive">Inattivi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={fetchIngredients}
                startIcon={<FilterIcon />}
              >
                Filtra
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Tabella ingredienti */}
      {loading && !dialogOpen ? (
        <LoadingOverlay />
      ) : error && !dialogOpen ? (
        <ErrorDisplay message={error} />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Prezzo</TableCell>
                <TableCell>Unità</TableCell>
                <TableCell>Scorte minime</TableCell>
                <TableCell>Allergeni</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIngredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Nessun ingrediente trovato
                  </TableCell>
                </TableRow>
              ) : (
                filteredIngredients.map((ingredient) => (
                  <TableRow key={ingredient._id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {ingredient.nome}
                      </Typography>
                      {ingredient.descrizione && (
                        <Typography variant="body2" color="text.secondary">
                          {ingredient.descrizione}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ingredient.categoria} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                        <MoneyIcon fontSize="small" sx={{ mr: 0.5, color: 'success.main' }} />
                        {ingredient.prezzoUnitario.toFixed(2)} €/{ingredient.unitaMisura}
                      </Typography>
                    </TableCell>
                    <TableCell>{ingredient.unitaMisura}</TableCell>
                    <TableCell>{ingredient.scorteMinime} {ingredient.unitaMisura}</TableCell>
                    <TableCell>
                      {ingredient.allergeni && ingredient.allergeni.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {ingredient.allergeni.map(allergene => (
                            <Chip 
                              key={allergene} 
                              label={allergene} 
                              size="small" 
                              color="warning" 
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Nessuno
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ingredient.attivo ? 'Attivo' : 'Inattivo'} 
                        color={ingredient.attivo ? 'success' : 'default'} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Modifica">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenDialog(ingredient)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Dialog per creazione/modifica */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {isEditing ? `Modifica ingrediente: ${currentIngredient.nome}` : 'Nuovo ingrediente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                value={currentIngredient.nome}
                onChange={(e) => handleFieldChange('nome', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={currentIngredient.categoria}
                  onChange={(e) => handleFieldChange('categoria', e.target.value)}
                  label="Categoria"
                  required
                >
                  {CATEGORIE_INGREDIENTI.map((cat) => (
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
                value={currentIngredient.descrizione || ''}
                onChange={(e) => handleFieldChange('descrizione', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prezzo unitario"
                type="number"
                value={currentIngredient.prezzoUnitario}
                onChange={(e) => handleFieldChange('prezzoUnitario', parseFloat(e.target.value))}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Unità di misura</InputLabel>
                <Select
                  value={currentIngredient.unitaMisura}
                  onChange={(e) => handleFieldChange('unitaMisura', e.target.value)}
                  label="Unità di misura"
                  required
                >
                  {UNITA_MISURA.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Scorte minime"
                type="number"
                value={currentIngredient.scorteMinime}
                onChange={(e) => handleFieldChange('scorteMinime', parseInt(e.target.value))}
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">{currentIngredient.unitaMisura}</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tempo di consegna (giorni)"
                type="number"
                value={currentIngredient.tempoConsegnaGiorni}
                onChange={(e) => handleFieldChange('tempoConsegnaGiorni', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">giorni</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Scadenza (giorni)"
                type="number"
                value={currentIngredient.scadenzaGiorni || ''}
                onChange={(e) => handleFieldChange('scadenzaGiorni', e.target.value ? parseInt(e.target.value) : null)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">giorni</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentIngredient.attivo}
                    onChange={(e) => handleFieldChange('attivo', e.target.checked)}
                    color="success"
                  />
                }
                label="Ingrediente attivo"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={ALLERGENI}
                value={currentIngredient.allergeni || []}
                onChange={(e, newValue) => handleFieldChange('allergeni', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Allergeni"
                    placeholder="Seleziona allergeni"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={fornitori}
                getOptionLabel={(option) => option.ragioneSociale}
                value={fornitori.filter(f => 
                  currentIngredient.fornitoriPrimari && 
                  currentIngredient.fornitoriPrimari.includes(f._id)
                )}
                onChange={(e, newValue) => 
                  handleFieldChange('fornitoriPrimari', newValue.map(f => f._id))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Fornitori primari"
                    placeholder="Seleziona fornitori"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                value={currentIngredient.note || ''}
                onChange={(e) => handleFieldChange('note', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={!currentIngredient.nome || !currentIngredient.prezzoUnitario}
          >
            {isEditing ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IngredientiManager;