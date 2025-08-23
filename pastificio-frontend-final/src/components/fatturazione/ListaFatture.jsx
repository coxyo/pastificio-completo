// components/fatturazione/ListaFatture.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  Box, Button, IconButton, Chip, TextField, FormControl, 
  InputLabel, Select, MenuItem, Grid, Pagination,
  Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Paid as PaidIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { it } from 'date-fns/locale';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import { getFatture, eliminaFattura, generaPDF, inviaFatturaEmail } from '../../services/fattureService';
import RegistraPagamentoForm from './RegistraPagamentoForm';

const ListaFatture = () => {
  const navigate = useNavigate();
  const [fatture, setFatture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [openPagamento, setOpenPagamento] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [currentFattura, setCurrentFattura] = useState(null);
  const [emailData, setEmailData] = useState({
    destinatario: '',
    oggetto: '',
    messaggio: ''
  });
  
  // Filtri
  const [filtri, setFiltri] = useState({
    cliente: '',
    stato: '',
    tipo: '',
    anno: new Date().getFullYear().toString(),
    dataInizio: null,
    dataFine: null,
    search: ''
  });
  
  const fetchFatture = async () => {
    setLoading(true);
    try {
      // Preparo i parametri filtrando quelli vuoti
      const params = {
        page,
        limit,
        ...Object.entries(filtri).reduce((acc, [key, value]) => {
          if (value && key !== 'search') {
            // Formatto le date
            if (key === 'dataInizio' || key === 'dataFine') {
              if (value instanceof Date) {
                acc[key] = format(value, 'yyyy-MM-dd');
              }
            } else {
              acc[key] = value;
            }
          }
          return acc;
        }, {})
      };
      
      const response = await getFatture(params);
      if (response.success) {
        setFatture(response.data);
        setTotal(response.pagination?.total || 0);
      } else {
        toast.error(response.message || 'Errore nel recupero fatture');
      }
    } catch (error) {
      toast.error('Errore nel recupero fatture');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Carica le fatture all'avvio e quando cambiano i filtri o la paginazione
  useEffect(() => {
    fetchFatture();
  }, [page, limit, filtri.stato, filtri.tipo, filtri.anno]);
  
  // Reset paginazione quando cambiano i filtri
  useEffect(() => {
    setPage(1);
  }, [filtri]);
  
  // Gestione cambio pagina
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Gestione ricerca
  const handleSearch = () => {
    fetchFatture();
  };
  
  // Gestione filtri
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltri(prev => ({ ...prev, [name]: value }));
  };
  
  // Gestione date
  const handleDateChange = (name, date) => {
    setFiltri(prev => ({ ...prev, [name]: date }));
  };
  
  // Apertura form di creazione nuova fattura
  const handleCreateFattura = () => {
    navigate('/fatture/nuova');
  };
  
  // Apertura form di modifica fattura
  const handleEditFattura = (id) => {
    navigate(`/fatture/modifica/${id}`);
  };
  
  // Eliminazione fattura
  const handleDeleteFattura = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa fattura?')) {
      try {
        const response = await eliminaFattura(id);
        if (response.success) {
          toast.success('Fattura eliminata con successo');
          fetchFatture();
        } else {
          toast.error(response.message || 'Errore nell\'eliminazione fattura');
        }
      } catch (error) {
        toast.error('Errore nell\'eliminazione fattura');
        console.error(error);
      }
    }
  };
  
  // Generazione PDF
  const handleGeneraPDF = async (id) => {
    try {
      await generaPDF(id);
    } catch (error) {
      toast.error('Errore nella generazione PDF');
      console.error(error);
    }
  };
  
  // Registrazione pagamento
  const handleOpenPagamento = (fattura) => {
    setCurrentFattura(fattura);
    setOpenPagamento(true);
  };
  
  const handleClosePagamento = () => {
    setOpenPagamento(false);
    setCurrentFattura(null);
  };
  
  const handlePagamentoSuccess = () => {
    handleClosePagamento();
    fetchFatture();
    toast.success('Pagamento registrato con successo');
  };
  
  // Invio email
  const handleOpenEmail = (fattura) => {
    setCurrentFattura(fattura);
    
    // Preleva l'email del cliente se disponibile
    const emailCliente = fattura.cliente?.contatti?.email || '';
    
    setEmailData({
      destinatario: emailCliente,
      oggetto: `Fattura ${fattura.numero} - Pastificio`,
      messaggio: `Gentile Cliente,\n\nIn allegato la fattura ${fattura.numero} del ${format(new Date(fattura.data), 'dd/MM/yyyy')}.\n\nCordiali saluti,\nPastificio`
    });
    
    setOpenEmail(true);
  };
  
  const handleCloseEmail = () => {
    setOpenEmail(false);
    setCurrentFattura(null);
    setEmailData({
      destinatario: '',
      oggetto: '',
      messaggio: ''
    });
  };
  
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSendEmail = async () => {
    try {
      const response = await inviaFatturaEmail(currentFattura._id, emailData);
      if (response.success) {
        toast.success('Email inviata con successo');
        handleCloseEmail();
        fetchFatture();
      } else {
        toast.error(response.message || 'Errore nell\'invio email');
      }
    } catch (error) {
      toast.error('Errore nell\'invio email');
      console.error(error);
    }
  };
  
  // Formattazione importi
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  // Chip per lo stato fattura
  const getStatusChip = (stato) => {
    let color;
    switch (stato) {
      case 'Bozza':
        color = 'default';
        break;
      case 'Emessa':
        color = 'primary';
        break;
      case 'Parziale':
        color = 'warning';
        break;
      case 'Pagata':
        color = 'success';
        break;
      case 'Annullata':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={stato} color={color} size="small" />;
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Fatturazione
        </Typography>
        
        {/* Filtri */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Cerca"
                name="search"
                variant="outlined"
                size="small"
                value={filtri.search}
                onChange={handleFiltroChange}
                InputProps={{
                  endAdornment: (
                    <IconButton edge="end" onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Stato</InputLabel>
                <Select
                  label="Stato"
                  name="stato"
                  value={filtri.stato}
                  onChange={handleFiltroChange}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  <MenuItem value="Bozza">Bozza</MenuItem>
                  <MenuItem value="Emessa">Emessa</MenuItem>
                  <MenuItem value="Parziale">Parziale</MenuItem>
                  <MenuItem value="Pagata">Pagata</MenuItem>
                  <MenuItem value="Annullata">Annullata</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  label="Tipo"
                  name="tipo"
                  value={filtri.tipo}
                  onChange={handleFiltroChange}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  <MenuItem value="Fattura">Fattura</MenuItem>
                  <MenuItem value="Proforma">Proforma</MenuItem>
                  <MenuItem value="Nota di credito">Nota di credito</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Anno</InputLabel>
                <Select
                  label="Anno"
                  name="anno"
                  value={filtri.anno}
                  onChange={handleFiltroChange}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <MenuItem key={year} value={year.toString()}>{year}</MenuItem>;
                  })}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                <DatePicker
                  label="Data inizio"
                  value={filtri.dataInizio}
                  onChange={(date) => handleDateChange('dataInizio', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                <DatePicker
                  label="Data fine"
                  value={filtri.dataFine}
                  onChange={(date) => handleDateChange('dataFine', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                fullWidth
              >
                Filtra
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                color="success"
                onClick={handleCreateFattura}
                startIcon={<AddIcon />}
                fullWidth
              >
                Nuova Fattura
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Tabella Fatture */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Numero</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Totale</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Caricamento...</TableCell>
                </TableRow>
              ) : fatture.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Nessuna fattura trovata</TableCell>
                </TableRow>
              ) : (
                fatture.map((fattura) => (
                  <TableRow key={fattura._id}>
                    <TableCell>{fattura.numero}</TableCell>
                    <TableCell>{format(new Date(fattura.data), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {fattura.cliente?.ragioneSociale || 
                       `${fattura.cliente?.nome || ''} ${fattura.cliente?.cognome || ''}`}
                    </TableCell>
                    <TableCell>{formatCurrency(fattura.totale)}</TableCell>
                    <TableCell>{getStatusChip(fattura.stato)}</TableCell>
                    <TableCell>{fattura.tipo}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditFattura(fattura._id)}
                        title="Modifica"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        onClick={() => handleGeneraPDF(fattura._id)}
                        title="Genera PDF"
                      >
                        <PdfIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEmail(fattura)}
                        title="Invia email"
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        onClick={() => handleOpenPagamento(fattura)}
                        title="Registra pagamento"
                        disabled={fattura.stato === 'Pagata' || fattura.stato === 'Annullata'}
                      >
                        <PaidIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFattura(fattura._id)}
                        title="Elimina"
                        color="error"
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
        
        {/* Paginazione */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(total / limit)}
            page={page}
            onChange={handleChangePage}
            color="primary"
          />
        </Box>
      </Box>
      
      {/* Dialog per registrare un pagamento */}
      <Dialog open={openPagamento} onClose={handleClosePagamento}>
        <DialogTitle>Registra Pagamento</DialogTitle>
        <DialogContent>
          {currentFattura && (
            <RegistraPagamentoForm
              fattura={currentFattura}
              onSuccess={handlePagamentoSuccess}
              onCancel={handleClosePagamento}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog per invio email */}
      <Dialog open={openEmail} onClose={handleCloseEmail} maxWidth="md" fullWidth>
        <DialogTitle>Invia Fattura via Email</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Destinatario"
              name="destinatario"
              value={emailData.destinatario}
              onChange={handleEmailChange}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Oggetto"
              name="oggetto"
              value={emailData.oggetto}
              onChange={handleEmailChange}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Messaggio"
              name="messaggio"
              value={emailData.messaggio}
              onChange={handleEmailChange}
              margin="normal"
              multiline
              rows={6}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmail}>Annulla</Button>
          <Button 
            onClick={handleSendEmail} 
            variant="contained" 
            color="primary"
            disabled={!emailData.destinatario || !emailData.oggetto || !emailData.messaggio}
          >
            Invia
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ListaFatture;