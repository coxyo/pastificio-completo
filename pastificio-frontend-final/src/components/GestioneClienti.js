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
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  FormControl,
  Select,
  InputLabel,
  Grid,
  Fab,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Checkbox,
  LinearProgress
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
  StarBorder as StarBorderIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  ShoppingCart as CartIcon,
  AttachMoney as MoneyIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import FormCliente from './FormCliente';
import ClickToCallButton from './ClickToCallButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

function GestioneClienti() {
  const router = useRouter();
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalClienti, setTotalClienti] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAttivo, setFiltroAttivo] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [clienteSelezionato, setClienteSelezionato] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCliente, setMenuCliente] = useState(null);
  
  // ⭐ Preferiti
  const [togglingPreferito, setTogglingPreferito] = useState(null);
  
  // ⭐ Suggerimento top clienti
  const [showSuggerimento, setShowSuggerimento] = useState(false);
  const [topClienti, setTopClienti] = useState([]);
  const [selectedTopClienti, setSelectedTopClienti] = useState([]);
  
  // ⭐ Statistiche dettagliate dialog
  const [statsDialog, setStatsDialog] = useState(false);
  const [statsCliente, setStatsCliente] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // ⭐ Ricalcolo contatori
  const [ricalcolando, setRicalcolando] = useState(false);
  
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

  const ensureAuthenticated = async () => {
    let token = localStorage.getItem('token');
    
    if (!token) {
      console.log('Token non trovato, tentativo login...');
      try {
        const loginResponse = await fetch(`${API_URL.replace('/api', '')}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin123' })
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

  // ⭐ Carica clienti con ordinamento preferiti
  const caricaClienti = async () => {
    setLoading(true);
    try {
      const token = await ensureAuthenticated();
      if (!token) return;

      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        skip: (page * rowsPerPage).toString(),
        orderBy: 'preferito' // ⭐ Forza ordinamento preferiti in cima
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
      const isSuccess = data.success || data.successs;

      if (isSuccess) {
        const clientiData = data.clienti || data.data || [];
        const totalData = data.total || data.pagination?.total || 0;
        
        setClienti(clientiData);
        setTotalClienti(totalData);
        
        // ⭐ Se nessun preferito, mostra suggerimento (solo prima volta)
        const haPreferiti = clientiData.some(c => c.preferito);
        if (!haPreferiti && clientiData.length > 5 && page === 0 && !searchTerm) {
          caricaTopClientiSuggerimento();
        }
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

  // ⭐ Carica top clienti per suggerimento
  const caricaTopClientiSuggerimento = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clienti/top?limit=5&orderBy=ordini`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data?.length > 0) {
        // Solo se ci sono clienti con almeno qualche ordine
        const conOrdini = data.data.filter(c => (c.statistiche?.numeroOrdini || 0) > 0);
        if (conOrdini.length > 0) {
          setTopClienti(conOrdini);
          setShowSuggerimento(true);
        }
      }
    } catch (error) {
      console.error('Errore caricamento top clienti:', error);
    }
  };

  // ⭐ Toggle preferito
  const handleTogglePreferito = async (cliente, e) => {
    if (e) e.stopPropagation();
    setTogglingPreferito(cliente._id);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clienti/${cliente._id}/preferito`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ utente: 'admin' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Aggiorna localmente
        setClienti(prev => prev.map(c => 
          c._id === cliente._id ? { ...c, preferito: data.preferito } : c
        ));
        showToast(
          data.preferito 
            ? `⭐ ${getNomeCompleto(cliente)} aggiunto ai preferiti` 
            : `${getNomeCompleto(cliente)} rimosso dai preferiti`,
          'success'
        );
      }
    } catch (error) {
      console.error('Errore toggle preferito:', error);
      showToast('Errore nel toggle preferito', 'error');
    } finally {
      setTogglingPreferito(null);
    }
  };

  // ⭐ Imposta preferiti bulk (dal suggerimento)
  const handleBulkPreferiti = async () => {
    if (selectedTopClienti.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clienti/preferiti/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ clienteIds: selectedTopClienti, utente: 'admin' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast(`⭐ ${data.aggiornati} clienti aggiunti ai preferiti!`, 'success');
        setShowSuggerimento(false);
        setSelectedTopClienti([]);
        caricaClienti(); // Ricarica per vedere ordinamento
      }
    } catch (error) {
      console.error('Errore bulk preferiti:', error);
      showToast('Errore', 'error');
    }
  };

  // ⭐ Apri statistiche dettagliate
  const handleApriStatistiche = async (cliente) => {
    setStatsCliente(cliente);
    setStatsDialog(true);
    setLoadingStats(true);
    setStatsData(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clienti/${cliente._id}/statistiche-dettagliate`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStatsData(data.data);
      }
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
      showToast('Errore caricamento statistiche', 'error');
    } finally {
      setLoadingStats(false);
    }
    handleMenuClose();
  };

  // ⭐ Ricalcola contatori
  const handleRicalcolaContatori = async () => {
    if (!window.confirm('Ricalcola le statistiche ordini per TUTTI i clienti?\nPotrebbe richiedere qualche secondo.')) return;
    
    setRicalcolando(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clienti/ricalcola-contatori`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        showToast(`✅ ${data.aggiornati} clienti aggiornati (${data.errori} errori)`, 'success');
        caricaClienti();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showToast('Errore ricalcolo: ' + error.message, 'error');
    } finally {
      setRicalcolando(false);
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

  const handleChangePage = (event, newPage) => { setPage(newPage); };
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
    setClienteSelezionato(cliente);
    handleMenuClose();
  };

  const handleModificaCliente = (cliente) => {
    setClienteSelezionato(cliente);
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleEliminaCliente = async (cliente) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il cliente ${getNomeCompleto(cliente)}?`)) return;
    try {
      const token = await ensureAuthenticated();
      if (!token) return;
      const response = await fetch(`${API_URL}/clienti/${cliente._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
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
      const url = clienteSelezionato ? `${API_URL}/clienti/${clienteSelezionato._id}` : `${API_URL}/clienti`;
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
        showToast(clienteSelezionato ? 'Cliente modificato con successo' : 'Cliente creato con successo', 'success');
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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Errore nell\'esportazione');
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
    if (cliente.tipo === 'azienda') return cliente.ragioneSociale || '';
    return `${cliente.nome || ''} ${cliente.cognome || ''}`.trim();
  };

  // ⭐ Helper: formatta data italiana
  const formatData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Separa preferiti e non preferiti per rendering
  const clientiPreferiti = clienti.filter(c => c.preferito);
  const clientiNonPreferiti = clienti.filter(c => !c.preferito);

  // ⭐ Riga tabella per un cliente
  const renderClienteRow = (cliente) => (
    <TableRow key={cliente._id} hover sx={cliente.preferito ? { bgcolor: '#FFFDE7' } : {}}>
      {/* ⭐ Stella preferito */}
      <TableCell sx={{ width: 48, p: 0.5 }}>
        <IconButton
          size="small"
          onClick={(e) => handleTogglePreferito(cliente, e)}
          disabled={togglingPreferito === cliente._id}
          sx={{ 
            color: cliente.preferito ? '#FFB300' : '#ccc',
            '&:hover': { color: '#FFB300' }
          }}
        >
          {cliente.preferito ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>
      </TableCell>
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
        {/* ⭐ Badge ordini inline */}
        {(cliente.statistiche?.numeroOrdini > 0) && (
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
            {cliente.statistiche.numeroOrdini} ordini
            {cliente.statistiche.ultimoOrdine && (
              <> &bull; ultimo: {formatData(cliente.statistiche.ultimoOrdine)}</>
            )}
          </Typography>
        )}
        {cliente.tipo === 'azienda' && cliente.partitaIva && (
          <Typography variant="caption" color="textSecondary">
            P.IVA: {cliente.partitaIva}
          </Typography>
        )}
      </TableCell>
      
      {/* Contatti con Click-to-Call */}
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {cliente.telefono && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" component="h1">
          Gestione Clienti
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* ⭐ Ricalcola contatori */}
          <Tooltip title="Ricalcola contatori ordini per tutti i clienti">
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CalculateIcon />}
              onClick={handleRicalcolaContatori}
              disabled={ricalcolando}
              size="small"
            >
              {ricalcolando ? 'Ricalcolo...' : 'Ricalcola'}
            </Button>
          </Tooltip>
          <IconButton
            onClick={handleRefresh}
            color="primary"
            disabled={loading}
            title="Ricarica lista"
          >
            <RefreshIcon />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportExcel}
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

      {/* ⭐ SUGGERIMENTO TOP CLIENTI */}
      {showSuggerimento && topClienti.length > 0 && (
        <Paper sx={{ mb: 2, p: 2, bgcolor: '#FFF3E0', border: '1px solid #FFB74D' }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            💡 Vuoi segnare i tuoi migliori clienti come preferiti?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Ecco i top {topClienti.length} per numero ordini:
          </Typography>
          {topClienti.map(cliente => (
            <Box key={cliente._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Checkbox
                size="small"
                checked={selectedTopClienti.includes(cliente._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTopClienti(prev => [...prev, cliente._id]);
                  } else {
                    setSelectedTopClienti(prev => prev.filter(id => id !== cliente._id));
                  }
                }}
              />
              <Typography variant="body2">
                {getNomeCompleto(cliente)} ({cliente.statistiche?.numeroOrdini || 0} ordini)
              </Typography>
            </Box>
          ))}
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              color="warning"
              onClick={handleBulkPreferiti}
              disabled={selectedTopClienti.length === 0}
            >
              ⭐ Aggiungi selezionati ai preferiti
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowSuggerimento(false)}
            >
              Ignora
            </Button>
          </Box>
        </Paper>
      )}

      {ricalcolando && <LinearProgress sx={{ mb: 1 }} />}

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
              {clientiPreferiti.length > 0 && (
                <> ({clientiPreferiti.length} ⭐)</>
              )}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48 }}>⭐</TableCell>
              <TableCell>Codice</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Nome/Ragione Sociale</TableCell>
              <TableCell>Contatti</TableCell>
              <TableCell>Livello</TableCell>
              <TableCell>Punti</TableCell>
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
              <>
                {/* ⭐ SEZIONE PREFERITI */}
                {clientiPreferiti.length > 0 && !searchTerm && (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ bgcolor: '#FFF8E1', py: 0.5, px: 2 }}>
                      <Typography variant="caption" fontWeight="bold" color="#F57F17">
                        ⭐ PREFERITI ({clientiPreferiti.length})
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!searchTerm && clientiPreferiti.map(renderClienteRow)}
                
                {/* Separatore se ci sono preferiti e non preferiti */}
                {clientiPreferiti.length > 0 && clientiNonPreferiti.length > 0 && !searchTerm && (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ bgcolor: '#F5F5F5', py: 0.5, px: 2 }}>
                      <Typography variant="caption" fontWeight="bold" color="textSecondary">
                        TUTTI I CLIENTI ({clientiNonPreferiti.length})
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!searchTerm && clientiNonPreferiti.map(renderClienteRow)}
                
                {/* Se c'è ricerca, mostra tutti mescolati (DB già ordinati) */}
                {searchTerm && clienti.map(renderClienteRow)}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalClienti}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Righe per pagina:"
        />
      </TableContainer>

      {/* Menu azioni */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleApriStatistiche(menuCliente)}>
          <TrendingUpIcon fontSize="small" sx={{ mr: 1 }} />
          Statistiche
        </MenuItem>
        <MenuItem onClick={() => handleVisualizzaCliente(menuCliente)}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          Visualizza
        </MenuItem>
        <MenuItem onClick={() => handleModificaCliente(menuCliente)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Modifica
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleEliminaCliente(menuCliente)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Elimina
        </MenuItem>
      </Menu>

      {/* ⭐ DIALOG STATISTICHE DETTAGLIATE */}
      <Dialog
        open={statsDialog}
        onClose={() => setStatsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {statsCliente?.preferito && <StarIcon sx={{ color: '#FFB300' }} />}
            <Typography variant="h6">
              {statsCliente ? getNomeCompleto(statsCliente) : ''}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loadingStats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : statsData ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Griglia KPI */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#E3F2FD' }}>
                    <CartIcon color="primary" />
                    <Typography variant="h5" fontWeight="bold">{statsData.numeroOrdini}</Typography>
                    <Typography variant="caption" color="textSecondary">Totale ordini</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#E8F5E9' }}>
                    <MoneyIcon color="success" />
                    <Typography variant="h5" fontWeight="bold">€{statsData.totaleSpeso?.toFixed(2)}</Typography>
                    <Typography variant="caption" color="textSecondary">Spesa totale</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#FFF3E0' }}>
                    <Typography variant="h6" fontWeight="bold">€{statsData.mediaOrdine?.toFixed(2)}</Typography>
                    <Typography variant="caption" color="textSecondary">Media ordine</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#F3E5F5' }}>
                    <Typography variant="h6" fontWeight="bold">
                      {statsData.frequenzaGiorni > 0 ? `ogni ~${statsData.frequenzaGiorni}gg` : '-'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Frequenza</Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {/* Date */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>📅 Date</Typography>
                <Typography variant="body2">Primo ordine: {formatData(statsData.primoOrdine)}</Typography>
                <Typography variant="body2">Ultimo ordine: {formatData(statsData.ultimoOrdine)}</Typography>
                <Typography variant="body2">Ordini ultimi 30gg: {statsData.ordiniUltimi30gg}</Typography>
                <Typography variant="body2">Giorno preferito: {statsData.giornoPreferito}</Typography>
              </Box>
              
              {/* Prodotti preferiti */}
              {statsData.prodottiPreferiti?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>🛒 Prodotti preferiti</Typography>
                  {statsData.prodottiPreferiti.map((p, i) => (
                    <Chip
                      key={i}
                      label={`${p.nome} (${p.count}x)`}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
              
              {/* Spesa per mese */}
              {statsData.spesaPerMese && Object.keys(statsData.spesaPerMese).length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>📊 Spesa ultimi mesi</Typography>
                  {Object.entries(statsData.spesaPerMese).sort().map(([mese, spesa]) => (
                    <Box key={mese} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{mese}</Typography>
                      <Typography variant="body2" fontWeight="bold">€{spesa.toFixed(2)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Typography color="textSecondary">Nessun dato disponibile</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialog(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Form Cliente */}
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