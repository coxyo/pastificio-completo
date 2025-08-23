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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function GestioneClienti() {
  const router = useRouter();
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalClienti, setTotalClienti] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAttivo, setFiltroAttivo] = useState(''); // Vuoto di default per mostrare tutti
  const [openDialog, setOpenDialog] = useState(false);
  const [clienteSelezionato, setClienteSelezionato] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCliente, setMenuCliente] = useState(null);
  
  // Stati per le notifiche
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Funzione per mostrare notifiche
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

  // Funzione per caricare i clienti dal backend
  const caricaClienti = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('⚠️ Token non trovato, tentativo login automatico...');
        // Tentativo di login automatico
        try {
          const loginResponse = await fetch(`${API_URL.replace('/api', '')}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: 'admin@pastificio.com',
              password: 'admin123'
            })
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            if (loginData.success && loginData.token) {
              localStorage.setItem('token', loginData.token);
              console.log('✅ Login automatico riuscito');
            } else {
              showToast('Sessione scaduta. Effettua nuovamente il login.', 'error');
              router.push('/login');
              return;
            }
          } else {
            showToast('Sessione scaduta. Effettua nuovamente il login.', 'error');
            router.push('/login');
            return;
          }
        } catch (loginError) {
          console.error('Errore login automatico:', loginError);
          showToast('Errore di connessione. Riprova più tardi.', 'error');
          return;
        }
      }

      // Costruisci i parametri della query
      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        skip: (page * rowsPerPage).toString(),
        sort: '-createdAt'
      });

      // Aggiungi parametri opzionali solo se hanno un valore
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (filtroTipo) {
        params.append('tipo', filtroTipo);
      }
      // IMPORTANTE: Non inviare il parametro attivo se è vuoto
      if (filtroAttivo !== '') {
        params.append('attivo', filtroAttivo);
      }

      const url = `${API_URL}/clienti?${params}`;
      console.log('🔍 Calling API:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          showToast('Sessione scaduta. Effettua nuovamente il login.', 'error');
          router.push('/login');
          return;
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Errore sconosciuto' }));
        throw new Error(errorData.error || `Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Data received:', data);
      
      // Il backend restituisce { success: true, data: [...], pagination: {...} }
      if (data.success && Array.isArray(data.data)) {
        setClienti(data.data);
        setTotalClienti(data.pagination?.total || data.data.length);
        console.log(`✅ Caricati ${data.data.length} clienti`);
        
        // Se non ci sono clienti e siamo alla prima pagina senza filtri
        if (data.data.length === 0 && page === 0 && !searchTerm && !filtroTipo && !filtroAttivo) {
          showToast('Nessun cliente trovato. Aggiungi il primo cliente!', 'info');
        }
      } else {
        console.warn('⚠️ Formato risposta non atteso:', data);
        setClienti([]);
        setTotalClienti(0);
        showToast('Formato risposta non valido', 'warning');
      }
      
    } catch (error) {
      console.error('❌ Errore caricamento clienti:', error);
      showToast(`Errore nel caricamento dei clienti: ${error.message}`, 'error');
      setClienti([]);
      setTotalClienti(0);
    } finally {
      setLoading(false);
    }
  };

  // UseEffect per caricare i clienti
  useEffect(() => {
    caricaClienti();
  }, [page, rowsPerPage, searchTerm, filtroTipo, filtroAttivo]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleMenuOpen = (event, cliente) => {
    setAnchorEl(event.currentTarget);
    setMenuCliente(cliente);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCliente(null);
  };

  const handleNuovoCliente = () => {
    setClienteSelezionato(null);
    setOpenDialog(true);
  };

  const handleModificaCliente = (cliente) => {
    setClienteSelezionato(cliente);
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleVisualizzaCliente = (cliente) => {
    router.push(`/clienti/${cliente._id}`);
    handleMenuClose();
  };

  const handleEliminaCliente = async (cliente) => {
    const nomeCompleto = cliente.tipo === 'azienda' ? 
      cliente.ragioneSociale : 
      `${cliente.nome} ${cliente.cognome}`;
      
    if (!window.confirm(`Sei sicuro di voler disattivare il cliente ${nomeCompleto}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clienti/${cliente._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante l\'eliminazione');
      }

      showToast('Cliente disattivato con successo', 'success');
      // Ricarica la lista
      caricaClienti();
    } catch (error) {
      console.error('Errore eliminazione cliente:', error);
      showToast(`Errore durante l'eliminazione: ${error.message}`, 'error');
    }
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setClienteSelezionato(null);
  };

  const handleSaveCliente = async (clienteData) => {
    try {
      console.log('💾 Inizio salvataggio cliente:', clienteData);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        showToast('Sessione scaduta. Effettua nuovamente il login.', 'error');
        router.push('/login');
        return;
      }
      
      const method = clienteSelezionato ? 'PUT' : 'POST';
      const url = clienteSelezionato 
        ? `${API_URL}/clienti/${clienteSelezionato._id}`
        : `${API_URL}/clienti`;

      console.log('📡 Invio richiesta a:', url);
      console.log('📦 Dati inviati:', JSON.stringify(clienteData, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clienteData)
      });

      console.log('📨 Response status:', response.status);
      
      const responseText = await response.text();
      console.log('📄 Response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Errore parsing JSON:', parseError);
        throw new Error('Risposta del server non valida');
      }

      // Se lo status è 200 o 201, consideriamo il salvataggio riuscito
      if (response.status === 200 || response.status === 201 || result.success === true) {
        console.log('✅ Cliente salvato con successo');
        
        // Mostra notifica di successo
        if (clienteSelezionato) {
          showToast('Cliente aggiornato con successo', 'success');
        } else {
          showToast('Cliente creato con successo', 'success');
        }
        
        // Chiudi il dialog
        handleCloseDialog();
        
        // Ricarica la lista clienti
        setTimeout(() => {
          console.log('🔄 Ricaricamento lista clienti...');
          caricaClienti();
        }, 500);
        
      } else {
        throw new Error(result.error || result.message || 'Errore durante il salvataggio');
      }
      
    } catch (error) {
      console.error('❌ Errore durante il salvataggio:', error);
      showToast(error.message || 'Errore durante il salvataggio', 'error');
    }
  };

  // Funzione per ricaricare manualmente
  const handleRefresh = () => {
    console.log('🔄 Refresh manuale...');
    caricaClienti();
  };

  // Funzione per export Excel
  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        showToast('Sessione scaduta. Effettua nuovamente il login.', 'error');
        return;
      }
      
      showToast('Preparazione export in corso...', 'info');
      
      const response = await fetch(`${API_URL}/clienti/export/excel`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Errore export' }));
        throw new Error(errorData.error || 'Errore durante l\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `clienti_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast('Export completato con successo', 'success');
    } catch (error) {
      console.error('Errore export Excel:', error);
      showToast(`Errore durante l'export: ${error.message}`, 'error');
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
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {cliente.telefono && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon fontSize="small" color="action" />
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
          Disattiva
        </MenuItem>
      </Menu>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <FormCliente
          cliente={clienteSelezionato}
          onSave={handleSaveCliente}
          onCancel={handleCloseDialog}
        />
      </Dialog>

      <Fab
        color="primary"
        aria-label="nuovo cliente"
        onClick={handleNuovoCliente}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar per le notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default GestioneClienti;