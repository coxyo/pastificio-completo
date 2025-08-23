// components/Magazzino/FornitoriManagerSync.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
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
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Card,
  CardContent,
  Divider,
  Rating,
  InputAdornment,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  CloudOff as CloudOffIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

// Importiamo il servizio di sincronizzazione e il contesto
import { MagazzinoSyncService } from '../../services/magazzinoSyncService';
import { useSync } from '../../context/SyncContext';

// Componenti comuni
import LoadingOverlay from '../common/LoadingOverlay';
import ErrorDisplay from '../common/ErrorDisplay';

/**
 * Versione di FornitoriManager con supporto per sincronizzazione e funzionamento offline
 */
const FornitoriManagerSync = ({ onNotify }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fornitori, setFornitori] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('tutti');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedFornitore, setSelectedFornitore] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    ragioneSociale: '',
    indirizzo: {
      via: '',
      civico: '',
      cap: '',
      citta: '',
      provincia: ''
    },
    contatti: {
      telefono: '',
      email: '',
      sito: ''
    },
    partitaIva: '',
    categorieMerceologiche: [],
    tempoConsegnaGiorni: 7,
    note: '',
    attivo: true,
    valutazione: 3
  });
  
  // Hook per lo stato di sincronizzazione
  const { isOnline, syncState } = useSync();
  
  // Carica i fornitori usando MagazzinoSyncService per supporto offline
  const fetchFornitori = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Recupera i dati con supporto online/offline
      const data = await MagazzinoSyncService.fetchData(
        MagazzinoSyncService.ENTITY_TYPES.FORNITORE,
        {
          search: searchTerm || undefined,
          categoria: categoryFilter || undefined,
          attivo: statusFilter === 'tutti' ? undefined : statusFilter === 'attivi'
        }
      );
      
      setFornitori(data);
    } catch (err) {
      console.error('Errore nel caricamento dei fornitori:', err);
      setError('Impossibile caricare i fornitori. Riprova più tardi.');
      onNotify?.('Errore nel caricamento dei fornitori', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFornitori();
  }, [searchTerm, categoryFilter, statusFilter]);
  
  // Reset form
  const resetForm = () => {
    setFormData({
      ragioneSociale: '',
      indirizzo: {
        via: '',
        civico: '',
        cap: '',
        citta: '',
        provincia: ''
      },
      contatti: {
        telefono: '',
        email: '',
        sito: ''
      },
      partitaIva: '',
      categorieMerceologiche: [],
      tempoConsegnaGiorni: 7,
      note: '',
      attivo: true,
      valutazione: 3
    });
  };
  
  // Gestione apertura dialog
  const handleOpenDialog = (fornitore = null) => {
    if (fornitore) {
      setEditMode(true);
      setSelectedFornitore(fornitore);
      setFormData(fornitore);
    } else {
      setEditMode(false);
      setSelectedFornitore(null);
      resetForm();
    }
    setDialogOpen(true);
  };
  
  // Gestione chiusura dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };
  
  // Gestione apertura dialog conferma eliminazione
  const handleConfirmDelete = (fornitore) => {
    setConfirmDelete(fornitore);
  };
  
  // Gestione chiusura dialog conferma eliminazione
  const handleCloseConfirmDelete = () => {
    setConfirmDelete(null);
  };
  
  // Gestione cambio input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Gestione campi nidificati
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Gestione categorie merceologiche
  const handleCategoriaChange = (e) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      categorieMerceologiche: typeof value === 'string' ? value.split(',') : value
    });
  };
  
  // Gestione cambio valutazione
  const handleRatingChange = (event, newValue) => {
    setFormData({
      ...formData,
      valutazione: newValue
    });
  };
  
  // Salva fornitore con supporto online/offline
  const handleSaveFornitore = async () => {
    if (!formData.ragioneSociale) {
      setError('Il nome del fornitore è obbligatorio');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (editMode) {
        // Aggiornamento con supporto offline
        await MagazzinoSyncService.performOperation(
          MagazzinoSyncService.ENTITY_TYPES.FORNITORE,
          MagazzinoSyncService.OPERATION_TYPES.UPDATE,
          formData,
          selectedFornitore._id || selectedFornitore.id
        );
        onNotify?.('Fornitore aggiornato con successo', 'success');
      } else {
        // Creazione con supporto offline
        await MagazzinoSyncService.performOperation(
          MagazzinoSyncService.ENTITY_TYPES.FORNITORE,
          MagazzinoSyncService.OPERATION_TYPES.CREATE,
          formData
        );
        onNotify?.('Fornitore creato con successo', 'success');
      }
      
      setDialogOpen(false);
      fetchFornitori();
    } catch (err) {
      console.error('Errore nel salvataggio del fornitore:', err);
      setError(`Impossibile salvare il fornitore: ${err.message}`);
      onNotify?.('Errore nel salvataggio del fornitore', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Elimina fornitore con supporto online/offline
  const handleDeleteFornitore = async () => {
    if (!confirmDelete) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Eliminazione con supporto offline
      await MagazzinoSyncService.performOperation(
        MagazzinoSyncService.ENTITY_TYPES.FORNITORE,
        MagazzinoSyncService.OPERATION_TYPES.DELETE,
        null,
        confirmDelete._id || confirmDelete.id
      );
      
      setConfirmDelete(null);
      onNotify?.('Fornitore eliminato con successo', 'success');
      fetchFornitori();
    } catch (err) {
      console.error('Errore nell\'eliminazione del fornitore:', err);
      setError(`Impossibile eliminare il fornitore: ${err.message}`);
      onNotify?.('Errore nell\'eliminazione del fornitore', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Categorie merceologiche
  const categorieMerceologiche = [
    'farina', 'uova', 'latte', 'olio', 'sale', 'condimento', 'ripieno', 'imballaggio', 'altro'
  ];
  
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Gestione Fornitori
      </Typography>
      
      {/* Notifica offline */}
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Sei in modalità offline. Le modifiche verranno sincronizzate quando tornerai online.
        </Alert>
      )}
      
      {/* Filtri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Cerca fornitore"
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
                  {categorieMerceologiche.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Stato</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Stato"
                >
                  <MenuItem value="tutti">Tutti</MenuItem>
                  <MenuItem value="attivi">Attivi</MenuItem>
                  <MenuItem value="inattivi">Inattivi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6} sm={1}>
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={fetchFornitori}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                Aggiorna
              </Button>
            </Grid>
            
            <Grid item xs={6} sm={2}>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={() => handleOpenDialog()}
                startIcon={<AddIcon />}
                disabled={loading}
              >
                Nuovo
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Messaggio di errore */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Lista fornitori */}
      {loading ? (
        <LoadingOverlay />
      ) : error && !fornitori.length ? (
        <ErrorDisplay message={error} />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ragione Sociale</TableCell>
                <TableCell>Contatti</TableCell>
                <TableCell>Categorie</TableCell>
                <TableCell>Valutazione</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fornitori.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nessun fornitore trovato
                  </TableCell>
                </TableRow>
              ) : (
                fornitori.map((fornitore) => (
                  <TableRow key={fornitore._id || fornitore.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2">
                          {fornitore.ragioneSociale}
                        </Typography>
                        {fornitore._isOffline && (
                          <Tooltip title="Modifiche non sincronizzate">
                            <CloudOffIcon 
                              fontSize="small" 
                              color="action" 
                              sx={{ ml: 1 }} 
                            />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {fornitore.indirizzo?.citta}
                        {fornitore.indirizzo?.provincia ? ` (${fornitore.indirizzo.provincia})` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={1}>
                        {fornitore.contatti?.telefono && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{fornitore.contatti.telefono}</Typography>
                          </Box>
                        )}
                        {fornitore.contatti?.email && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <MailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{fornitore.contatti.email}</Typography>
                          </Box>
                        )}
                        {fornitore.contatti?.sito && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <LanguageIcon fontSize="small" color="action" />
                            <Typography variant="body2">{fornitore.contatti.sito}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {fornitore.categorieMerceologiche && fornitore.categorieMerceologiche.map((cat) => (
                          <Chip
                            key={cat}
                            label={cat}
                            size="small"
                            color={categoryFilter === cat ? "primary" : "default"}
                            variant="outlined"
                            onClick={() => setCategoryFilter(cat)}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Rating value={fornitore.valutazione} readOnly precision={0.5} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fornitore.attivo ? "Attivo" : "Inattivo"}
                        color={fornitore.attivo ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(fornitore)}
                        title="Modifica"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleConfirmDelete(fornitore)}
                        title="Elimina"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Dialog per creare/modificare fornitore */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? `Modifica Fornitore: ${selectedFornitore?.ragioneSociale}` : 'Nuovo Fornitore'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Dati Generali */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Dati Generali
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ragione Sociale"
                name="ragioneSociale"
                value={formData.ragioneSociale || ''}
                onChange={handleInputChange}
                required
                error={!formData.ragioneSociale}
                helperText={!formData.ragioneSociale ? 'Campo obbligatorio' : ''}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Partita IVA"
                name="partitaIva"
                value={formData.partitaIva || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categorie Merceologiche</InputLabel>
                <Select
                  multiple
                  value={formData.categorieMerceologiche || []}
                  onChange={handleCategoriaChange}
                  label="Categorie Merceologiche"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {categorieMerceologiche.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tempo di Consegna (giorni)"
                name="tempoConsegnaGiorni"
                type="number"
                value={formData.tempoConsegnaGiorni || 7}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography component="legend" sx={{ mr: 2 }}>Valutazione:</Typography>
                <Rating
                  name="valutazione"
                  value={formData.valutazione || 3}
                  onChange={handleRatingChange}
                  precision={0.5}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            {/* Contatti */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Contatti
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Telefono"
                name="contatti.telefono"
                value={formData.contatti?.telefono || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                name="contatti.email"
                value={formData.contatti?.email || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sito Web"
                name="contatti.sito"
                value={formData.contatti?.sito || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            {/* Indirizzo */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Indirizzo
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Via"
                name="indirizzo.via"
                value={formData.indirizzo?.via || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Civico"
                name="indirizzo.civico"
                value={formData.indirizzo?.civico || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CAP"
                name="indirizzo.cap"
                value={formData.indirizzo?.cap || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Città"
                name="indirizzo.citta"
                value={formData.indirizzo?.citta || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Provincia"
                name="indirizzo.provincia"
                value={formData.indirizzo?.provincia || ''}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            {/* Note e Stato */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                name="note"
                value={formData.note || ''}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography component="legend">Stato</Typography>
                <Select
                  name="attivo"
                  value={formData.attivo}
                  onChange={handleInputChange}
                >
                  <MenuItem value={true}>Attivo</MenuItem>
                  <MenuItem value={false}>Inattivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annulla
          </Button>
          <Button 
            onClick={handleSaveFornitore} 
            variant="contained"
            disabled={!formData.ragioneSociale || loading}
            startIcon={loading ? <CircularProgress size={20} /> : !isOnline ? <CloudOffIcon /> : <SaveIcon />}
          >
            {editMode ? 'Aggiorna' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per conferma eliminazione */}
      <Dialog
        open={!!confirmDelete}
        onClose={handleCloseConfirmDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Sei sicuro di voler eliminare il fornitore <strong>{confirmDelete?.ragioneSociale}</strong>?
          </Typography>
          <Typography variant="body2" color="error">
            Questa operazione non può essere annullata. Tutti i dati relativi a questo fornitore verranno rimossi.
          </Typography>
          
          {!isOnline && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Sei offline. L'eliminazione verrà registrata localmente e sincronizzata quando sarai online.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDelete}>
            Annulla
          </Button>
          <Button 
            onClick={handleDeleteFornitore} 
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FornitoriManagerSync;