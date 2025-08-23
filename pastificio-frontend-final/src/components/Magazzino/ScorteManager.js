// components/Magazzino/ScorteManager.js
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
  LinearProgress,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Warning as WarningIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import LoadingOverlay from '../common/LoadingOverlay';
import ErrorDisplay from '../common/ErrorDisplay';

// Componente per la gestione delle scorte di magazzino
const ScorteManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [movementType, setMovementType] = useState('carico');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [lot, setLot] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Carica gli ingredienti
  const fetchIngredients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/magazzino/ingredienti', {
        params: {
          limit: 100,
          attivo: true
        }
      });
      
      // Per ogni ingrediente, carica le scorte attuali
      const ingredientsWithStock = await Promise.all(
        response.data.data.map(async (ingredient) => {
          const stockResponse = await axios.get(`/api/magazzino/scorte/${ingredient._id}`);
          return {
            ...ingredient,
            scorteAttuali: stockResponse.data.data.scorteAttuali,
            ultimiMovimenti: stockResponse.data.data.ultimiMovimenti
          };
        })
      );
      
      setIngredients(ingredientsWithStock);
    } catch (err) {
      console.error('Errore nel caricamento degli ingredienti:', err);
      setError('Impossibile caricare gli ingredienti. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // Filtra gli ingredienti
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ingredient) => {
      // Filtra per termine di ricerca
      const matchesSearch = ingredient.nome.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtra per categoria
      const matchesCategory = !categoryFilter || ingredient.categoria === categoryFilter;
      
      // Filtra per livello scorte
      const matchesStock = 
        stockFilter === 'all' ||
        (stockFilter === 'low' && ingredient.scorteAttuali < ingredient.scorteMinime) ||
        (stockFilter === 'zero' && ingredient.scorteAttuali <= 0);
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [ingredients, searchTerm, categoryFilter, stockFilter]);

  // Gestione apertura dialog per movimento
  const handleOpenMovementDialog = (ingredient, type = 'carico') => {
    setSelectedIngredient(ingredient);
    setMovementType(type);
    setQuantity('');
    setNote('');
    setLot('');
    setExpiryDate('');
    setDialogOpen(true);
  };

  // Registra un movimento
  const handleRegisterMovement = async () => {
    if (!selectedIngredient || !quantity) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Adatta la quantità in base al tipo di movimento
      const adjustedQuantity = movementType === 'carico' 
        ? Math.abs(parseFloat(quantity)) 
        : -Math.abs(parseFloat(quantity));
      
      await axios.post('/api/magazzino/movimenti', {
        ingrediente: selectedIngredient._id,
        tipo: movementType,
        quantita: adjustedQuantity,
        dataMovimento: new Date(),
        lotto: lot || undefined,
        dataScadenza: expiryDate || undefined,
        notaMovimento: note || undefined
      });
      
      // Ricarica gli ingredienti per aggiornare le scorte
      await fetchIngredients();
      
      // Chiudi il dialog
      setDialogOpen(false);
    } catch (err) {
      console.error('Errore nella registrazione del movimento:', err);
      setError('Impossibile registrare il movimento. Riprova più tardi.');
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
      <Typography variant="h5" sx={{ mb: 3 }}>
        Gestione Scorte
      </Typography>
      
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
                <InputLabel>Livello scorte</InputLabel>
                <Select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  label="Livello scorte"
                >
                  <MenuItem value="all">Tutti</MenuItem>
                  <MenuItem value="low">Sotto soglia</MenuItem>
                  <MenuItem value="zero">Esauriti</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={fetchIngredients}
                startIcon={<RefreshIcon />}
              >
                Aggiorna
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Tabella scorte */}
      {loading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ingrediente</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Scorte</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Ultimo movimento</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIngredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
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
                      <Stack direction="column" spacing={1}>
                        <Typography variant="h6">
                          {ingredient.scorteAttuali} {ingredient.unitaMisura}
                        </Typography>
                        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min((ingredient.scorteAttuali / ingredient.scorteMinime) * 100, 100)} 
                            color={
                              ingredient.scorteAttuali <= 0 ? "error" :
                              ingredient.scorteAttuali < ingredient.scorteMinime ? "warning" : "success"
                            }
                            sx={{ height: 8, borderRadius: 5, flexGrow: 1, mr: 1 }}
                          />
                          <Typography variant="caption">
                            Min: {ingredient.scorteMinime}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {ingredient.scorteAttuali <= 0 ? (
                        <Chip
                          icon={<WarningIcon />}
                          label="Esaurito"
                          color="error"
                          size="small"
                        />
                      ) : ingredient.scorteAttuali < ingredient.scorteMinime ? (
                        <Chip
                          icon={<WarningIcon />}
                          label="Sotto soglia"
                          color="warning"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<CheckIcon />}
                          label="Ok"
                          color="success"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {ingredient.ultimiMovimenti && ingredient.ultimiMovimenti.length > 0 ? (
                        <Typography variant="body2">
                          {format(new Date(ingredient.ultimiMovimenti[0].dataMovimento), 'dd/MM/yyyy HH:mm')}
                          <br />
                          <span style={{ fontStyle: 'italic', color: 'text.secondary' }}>
                            {ingredient.ultimiMovimenti[0].tipo} ({ingredient.ultimiMovimenti[0].quantita} {ingredient.unitaMisura})
                          </span>
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Nessun movimento
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenMovementDialog(ingredient, 'carico')}
                        >
                          Carico
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<RemoveIcon />}
                          onClick={() => handleOpenMovementDialog(ingredient, 'scarico')}
                        >
                          Scarico
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Dialog per registrare movimento */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {movementType === 'carico' ? 'Registra carico' : 'Registra scarico'}: {selectedIngredient?.nome}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                {movementType === 'carico' 
                  ? 'Registra un carico di magazzino per aumentare le scorte disponibili.' 
                  : 'Registra uno scarico di magazzino per ridurre le scorte disponibili.'}
              </Alert>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`Quantità (${selectedIngredient?.unitaMisura})`}
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">{selectedIngredient?.unitaMisura}</InputAdornment>,
                }}
                required
              />
            </Grid>
            
            {movementType === 'carico' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lotto"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                />
              </Grid>
            )}
            
            {movementType === 'carico' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data scadenza"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  InputLabelProps={{
  shrink: true
}}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleRegisterMovement}
            disabled={!quantity}
          >
            Registra {movementType}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScorteManager;