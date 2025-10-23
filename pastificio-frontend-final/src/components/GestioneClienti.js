// src/components/GestioneClienti.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Box,
  Typography,
  Menu,
  MenuItem,
  Dialog,
  Tooltip,
  FormControl,
  Select,
  InputLabel,
  Grid,
  Fab,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import FormCliente from './FormCliente';
import ClickToCallButton from './ClickToCallButton'; // ⭐ NUOVO IMPORT

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

function GestioneClienti() {
  const router = useRouter();
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalClienti, setTotalClienti] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAttivo, setFiltroAttivo] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [clienteSelezionato, setClienteSelezionato] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCliente, setMenuCliente] = useState(null);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const showToast = (message, severity = 'info') => {
    console.log(`${severity}: ${message}`);
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Funzione per fare login automatico se necessario
  const ensureAuthenticated = async () => {
    let token = localStorage.getItem('token');
    
    if (!token) {
      console.log('Token non trovato, tentativo login...');
      try {
        const loginResponse = await fetch(`${API_URL.replace('/api', '')}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'admin',
            password: 'admin123'
          })
        });

        const loginData = await loginResponse.json();
        
        if (loginData.success && loginData.token) {
          localStorage.setItem('token', loginData.token);
          if (loginData.user) {
            localStorage.setItem('user', JSON.stringify(loginData.user));
          }
          console.log('Login automatico riuscito');
          return loginData.token;
        } else {
          console.error('Login fallito:', loginData);
          showToast('Sessione scaduta. Effettua il login.', 'error');
          router.push('/login');
          return null;
        }
      } catch (error) {
        console.error('Errore login:', error);
        showToast('Errore di connessione.', 'error');
        return null;
      }
    }
    
    return token;
  };

  // Funzione per caricare i clienti dal backend
  const caricaClienti = async () => {
    setLoading(true);
    try {
      const token = await ensureAuthenticated();
      if (!token) return;

      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        skip: (page * rowsPerPage).toString(),
        sort: '-createdAt'
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (filtroTipo) {
        params.append('tipo', filtroTipo);
      }
      if (filtroAttivo !== '') {
        params.append('attivo', filtroAttivo);
      }

      console.log('Caricamento clienti con parametri:', params.toString());

      const response = await fetch(`${API_URL}/clienti?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        await ensureAuthenticated();
        return caricaClienti();
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Risposta clienti:', data);

      if (data.success) {
        setClienti(data.clienti || []);
        setTotalClienti(data.total || 0);
      } else {
        throw new Error(data.message || 'Errore nel caricamento clienti');
      }
    } catch (error) {
      console.error('Errore nel caricamento clienti:', error);
      showToast('Errore nel caricamento clienti: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    caricaClienti();
  }, [page, rowsPerPage, filtroTipo, filtroAttivo]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 0) {
        caricaClienti();
      } else {
        setPage(0);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    caricaClienti();
    showToast('Lista clienti aggiornata', 'success');
  };

  const handleNuovoCliente = () => {
    setClienteSelezionato(null);
    setOpenDialog(true);
  };

  const handleMenuOpen = (event, cliente) => {
    setAnchorEl(event.currentTarget);
    setMenuCliente(cliente);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCliente(null);
  };

  const handleVisualizzaCliente = (cliente) => {
    console.log('Visualizza cliente:', cliente);
    setClienteSelezionato(cliente);
    handleMenuClose();
  };

  const handleModificaCliente = (cliente) => {
    console.log('Modifica cliente:', cliente);
    setClienteSelezionato(cliente);
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleEliminaCliente = async (cliente) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il cliente ${getNomeCompleto(cliente)}?`)) {
      return;
    }

    try {
      const token = await ensureAuthenticated();
      if (!token) return;

      const response = await fetch(`${API_URL}/clienti/${cliente._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        showToast('Cliente eliminato con successo', 'success');
        caricaClienti();
      } else {
        throw new Error(data.message || 'Errore eliminazione cliente');
      }
    } catch (error) {
      console.error('Errore eliminazione cliente:', error);
      showToast('Errore nell\'eliminazione del cliente', 'error');
    }
    handleMenuClose();
  };

  const handleSalvaCliente = async (datiCliente) => {
    try {
      const token = await ensureAuthenticated();
      if (!token) return;

      const url = clienteSelezionato 
        ? `${API_URL}/clienti/${clienteSelezionato._id}`
        : `${API_URL}/clienti`;
      
      const method = clienteSelezionato ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datiCliente)
      });

      const data = await response.json();

      if (data.success) {
        showToast(
          clienteSelezionato ? 'Cliente modificato con successo' : 'Cliente creato con successo',
          'success'
        );
        setOpenDialog(false);
        setClienteSelezionato(null);
        caricaClienti();
      } else {
        throw new Error(data.message || 'Errore salvataggio cliente');
      }
    } catch (error) {
      console.error('Errore salvataggio cliente:', error);
      showToast('Errore nel salvataggio del cliente: ' + error.message, 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      const token = await ensureAuthenticated();
      if (!token) return;

      showToast('Esportazione in corso...', 'info');

      const response = await fetch(`${API_URL}/clienti/export/excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Errore nell\'esportazione');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clienti_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Export completato con successo', 'success');
    } catch (error) {
      console.error('Errore export:', error);
      showToast('Errore nell\'esportazione: ' + error.message, 'error');
    }
  };

  const getLivelloChip = (livello) => {
    const colori = {
      bronzo: '#CD7F32',
      argento: '#C0C0C0',
      oro: '#FFD700',
      platino: '#E5E4E2'
    };

    return (
      <Chip
        label={livello || 'bronzo'}
        size="small"
        style={{
          backgroundColor: colori[livello] || colori.bronzo,
          color: livello === 'platino' || livello === 'argento' ? '#000' : '#fff'
        }}
        icon={<StarIcon style={{ fontSize: 16 }} />}
      />
    );
  };

  const getNomeCompleto = (cliente) => {
    if (cliente.tipo === 'azienda') {
      return cliente.ragioneSociale || '';
    }
    return `${cliente.nome || ''} ${cliente.cognome || ''}`.trim();
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Gestione Clienti
        </Typography>
        <Box>
          <IconButton
            onClick={handleRefresh}
            color="primary"
            sx={{ mr: 1 }}
            disabled={loading}
            title="Ricarica lista"
          >
            <RefreshIcon />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportExcel}
            sx={{ mr: 2 }}
          >
            Export Excel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleNuovoCliente}
          >
            Nuovo Cliente
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Cerca per nome, telefono, email..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo Cliente</InputLabel>
              <Select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                label="Tipo Cliente"
              >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="privato">Privato</MenuItem>
                <MenuItem value="azienda">Azienda</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Stato</InputLabel>
              <Select
                value={filtroAttivo}
                onChange={(e) => setFiltroAttivo(e.target.value)}
                label="Stato"
              >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="true">Attivi</MenuItem>
                <MenuItem value="false">Disattivati</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="textSecondary">
              Totale: {totalClienti} clienti
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Codice</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Nome/Ragione Sociale</TableCell>
              <TableCell>Contatti</TableCell>
              <TableCell>Livello</TableCell>
              <TableCell>Punti</TableCell>
              <TableCell>Ultimo Ordine</TableCell>
              <TableCell>Totale Speso</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : clienti.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body1" sx={{ py: 3 }}>
                    {searchTerm || filtroTipo || filtroAttivo ? 
                      'Nessun cliente trovato con i filtri selezionati.' : 
                      'Nessun cliente trovato. Clicca su "Nuovo Cliente" per aggiungere il primo!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clienti.map((cliente) => (
                <TableRow key={cliente._id} hover>
                  <TableCell>
                    <Typography variant="caption" color="primary" fontWeight="medium">
                      {cliente.codiceCliente || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={cliente.tipo}>
                      {cliente.tipo === 'azienda' ? 
                        <BusinessIcon color="action" /> : 
                        <PersonIcon color="action" />
                      }
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {getNomeCompleto(cliente)}
                    </Typography>
                    {cliente.tipo === 'azienda' && cliente.partitaIva && (
                      <Typography variant="caption" color="textSecondary">
                        P.IVA: {cliente.partitaIva}
                      </Typography>
                    )}
                  </TableCell>
                  
                  {/* ⭐ SEZIONE CONTATTI MODIFICATA CON CLICK-TO-CALL */}
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {cliente.telefono && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {/* ⭐ PULSANTE CLICK-TO-CALL */}
                          <ClickToCallButton
                            numero={cliente.telefono}
                            clienteId={cliente._id}
                            clienteNome={getNomeCompleto(cliente)}
                            size="small"
                            variant="ghost"
                          />
                          <Typography variant="caption">{cliente.telefono}</Typography>
                        </Box>
                      )}
                      {cliente.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="caption">{cliente.email}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>{getLivelloChip(cliente.livelloFedelta)}</TableCell>
                  <TableCell>{cliente.punti || 0}</TableCell>
                  <TableCell>
                    {cliente.statistiche?.ultimoOrdine ? 
                      new Date(cliente.statistiche.ultimoOrdine).toLocaleDateString() : 
                      '-'
                    }
                  </TableCell>
                  <TableCell>
                    €{(cliente.statistiche?.totaleSpeso || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cliente.attivo !== false ? 'Attivo' : 'Disattivato'}
                      size="small"
                      color={cliente.attivo !== false ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, cliente)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalClienti}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Righe per pagina:"
        />
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleVisualizzaCliente(menuCliente)}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          Visualizza
        </MenuItem>
        <MenuItem onClick={() => handleModificaCliente(menuCliente)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Modifica
        </MenuItem>
        <MenuItem 
          onClick={() => handleEliminaCliente(menuCliente)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Elimina
        </MenuItem>
      </Menu>

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setClienteSelezionato(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <FormCliente
          cliente={clienteSelezionato}
          onSalva={handleSalvaCliente}
          onAnnulla={() => {
            setOpenDialog(false);
            setClienteSelezionato(null);
          }}
        />
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default GestioneClienti;