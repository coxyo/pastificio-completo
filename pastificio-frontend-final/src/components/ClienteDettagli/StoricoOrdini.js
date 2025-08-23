// src/components/ClienteDettagli/StoricoOrdini.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Visibility,
  Download,
  Search,
  FilterList,
  MoreVert,
  LocalShipping,
  CheckCircle,
  Cancel,
  Schedule,
  Euro,
  CalendarToday,
  Receipt
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function StoricoOrdini({ clienteId, nomeCliente }) {
  const router = useRouter();
  const [ordini, setOrdini] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrdini, setTotalOrdini] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStato, setFiltroStato] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [ordineSelezionato, setOrdineSelezionato] = useState(null);
  
  // Statistiche riepilogative
  const [riepilogo, setRiepilogo] = useState({
    totaleOrdini: 0,
    totaleSpeso: 0,
    ordiniCompletati: 0,
    ordiniInCorso: 0,
    mediaOrdine: 0
  });

  useEffect(() => {
    caricaOrdini();
  }, [clienteId, page, rowsPerPage, searchTerm, filtroStato]);

  const caricaOrdini = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Costruisci query params
      const params = new URLSearchParams({
        limit: rowsPerPage,
        skip: page * rowsPerPage,
        sort: '-dataRitiro'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filtroStato) params.append('stato', filtroStato);

      const response = await fetch(
        `${API_URL}/clienti/${clienteId}/ordini?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        // Se l'endpoint non esiste, prova con ordini generici filtrati per telefono
        const clienteResponse = await fetch(`${API_URL}/clienti/${clienteId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (clienteResponse.ok) {
          const clienteData = await clienteResponse.json();
          const cliente = clienteData.data;
          
          // Cerca ordini per telefono o nome
          const ordiniResponse = await fetch(
            `${API_URL}/ordini?telefono=${cliente.telefono}&limit=${rowsPerPage}&skip=${page * rowsPerPage}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          
          if (ordiniResponse.ok) {
            const ordiniData = await ordiniResponse.json();
            setOrdini(ordiniData.data || []);
            setTotalOrdini(ordiniData.pagination?.total || 0);
            calcolaRiepilogo(ordiniData.data || []);
          }
        }
      } else {
        const data = await response.json();
        setOrdini(data.data || []);
        setTotalOrdini(data.pagination?.total || data.data?.length || 0);
        calcolaRiepilogo(data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento ordini:', error);
      setError('Errore nel caricamento degli ordini');
      setOrdini([]);
    } finally {
      setLoading(false);
    }
  };

  const calcolaRiepilogo = (ordiniData) => {
    const totaleSpeso = ordiniData.reduce((sum, ord) => sum + (ord.totale || 0), 0);
    const ordiniCompletati = ordiniData.filter(ord => 
      ord.stato === 'completato' || ord.stato === 'ritirato'
    ).length;
    const ordiniInCorso = ordiniData.filter(ord => 
      ord.stato === 'in_lavorazione' || ord.stato === 'confermato'
    ).length;
    
    setRiepilogo({
      totaleOrdini: ordiniData.length,
      totaleSpeso,
      ordiniCompletati,
      ordiniInCorso,
      mediaOrdine: ordiniData.length > 0 ? totaleSpeso / ordiniData.length : 0
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewOrdine = (ordine) => {
    router.push(`/ordini/${ordine._id}`);
  };

  const handleMenuOpen = (event, ordine) => {
    setAnchorEl(event.currentTarget);
    setOrdineSelezionato(ordine);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setOrdineSelezionato(null);
  };

  const handleDuplicaOrdine = () => {
    if (ordineSelezionato) {
      router.push(`/ordini/nuovo?duplica=${ordineSelezionato._id}`);
    }
    handleMenuClose();
  };

  const handleStampaOrdine = () => {
    if (ordineSelezionato) {
      window.open(`/ordini/${ordineSelezionato._id}/stampa`, '_blank');
    }
    handleMenuClose();
  };

  const getStatoChip = (stato) => {
    const config = {
      'confermato': { color: 'info', icon: <Schedule /> },
      'in_lavorazione': { color: 'warning', icon: <Schedule /> },
      'completato': { color: 'success', icon: <CheckCircle /> },
      'ritirato': { color: 'success', icon: <LocalShipping /> },
      'cancellato': { color: 'error', icon: <Cancel /> }
    };
    
    const cfg = config[stato] || { color: 'default', icon: null };
    
    return (
      <Chip
        size="small"
        label={stato?.replace('_', ' ') || 'N/D'}
        color={cfg.color}
        icon={cfg.icon}
      />
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && ordini.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Cards Riepilogo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="caption">
                    Totale Ordini
                  </Typography>
                  <Typography variant="h4">
                    {totalOrdini}
                  </Typography>
                </Box>
                <Receipt color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="caption">
                    Totale Speso
                  </Typography>
                  <Typography variant="h4">
                    €{riepilogo.totaleSpeso.toFixed(2)}
                  </Typography>
                </Box>
                <Euro color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="caption">
                    Media Ordine
                  </Typography>
                  <Typography variant="h4">
                    €{riepilogo.mediaOrdine.toFixed(2)}
                  </Typography>
                </Box>
                <Euro color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="caption">
                    Completati
                  </Typography>
                  <Typography variant="h4">
                    {riepilogo.ordiniCompletati}
                  </Typography>
                </Box>
                <CheckCircle color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtri */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Cerca per numero ordine, prodotti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Stato"
              value={filtroStato}
              onChange={(e) => setFiltroStato(e.target.value)}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="confermato">Confermato</MenuItem>
              <MenuItem value="in_lavorazione">In Lavorazione</MenuItem>
              <MenuItem value="completato">Completato</MenuItem>
              <MenuItem value="ritirato">Ritirato</MenuItem>
              <MenuItem value="cancellato">Cancellato</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download />}
              onClick={() => window.open(`/api/clienti/${clienteId}/ordini/export`, '_blank')}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabella Ordini */}
      {ordini.length === 0 ? (
        <Alert severity="info">
          Nessun ordine trovato per {nomeCliente}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>N° Ordine</TableCell>
                <TableCell>Data Ritiro</TableCell>
                <TableCell>Prodotti</TableCell>
                <TableCell>Totale</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Note</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordini.map((ordine) => (
                <TableRow key={ordine._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #{ordine.numeroOrdine || ordine._id.slice(-6)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(ordine.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2">
                          {formatDate(ordine.dataRitiro)}
                        </Typography>
                        {ordine.oraRitiro && (
                          <Typography variant="caption" color="textSecondary">
                            Ore {ordine.oraRitiro}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ 
                      maxWidth: 200, 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {ordine.prodotti?.map(p => 
                        `${p.prodotto || p.nome} (${p.quantita})`
                      ).join(', ') || '-'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {ordine.prodotti?.length || 0} prodotti
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      €{(ordine.totale || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatoChip(ordine.stato)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={ordine.note || ''}>
                      <Typography variant="body2" sx={{ 
                        maxWidth: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {ordine.note || '-'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewOrdine(ordine)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, ordine)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalOrdini}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Ordini per pagina:"
          />
        </TableContainer>
      )}

      {/* Menu Azioni */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDuplicaOrdine}>
          Duplica Ordine
        </MenuItem>
        <MenuItem onClick={handleStampaOrdine}>
          Stampa
        </MenuItem>
      </Menu>
    </Box>
  );
}