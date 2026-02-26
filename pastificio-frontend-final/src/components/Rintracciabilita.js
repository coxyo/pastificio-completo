// components/Rintracciabilita.js - TABELLA RINTRACCIABILITÀ HACCP
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon,
  RestaurantMenu as RestaurantMenuIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

const Rintracciabilita = () => {
  // Stati principali
  const [tabella, setTabella] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ totale: 0, limit: 50, skip: 0 });
  
  // Filtri
  const [filtri, setFiltri] = useState({
    dataInizio: '',
    dataFine: '',
    fornitore: '',
    categoria: '',
    ingrediente: '',
    lotto: '',
    soloInScadenza: false,
    soloScaduti: false
  });
  const [filtriVisibili, setFiltriVisibili] = useState(false);
  
  // Tab attiva
  const [tabAttiva, setTabAttiva] = useState(0);
  
  // Scadenze
  const [lottiInScadenza, setLottiInScadenza] = useState([]);
  
  // Dettaglio lotto
  const [lottoSelezionato, setLottoSelezionato] = useState(null);
  const [dialogDettaglio, setDialogDettaglio] = useState(false);
  const [dettaglioLotto, setDettaglioLotto] = useState(null);
  
  // Riga espansa
  const [rigaEspansa, setRigaEspansa] = useState(null);
  
  // Tab Ordini
  const [ordini, setOrdini] = useState([]);
  const [loadingOrdini, setLoadingOrdini] = useState(false);


  // Carica dati
  const caricaDati = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filtri.dataInizio) params.append('dataInizio', filtri.dataInizio);
      if (filtri.dataFine) params.append('dataFine', filtri.dataFine);
      if (filtri.fornitore) params.append('fornitore', filtri.fornitore);
      if (filtri.categoria) params.append('categoria', filtri.categoria);
      if (filtri.ingrediente) params.append('ingrediente', filtri.ingrediente);
      if (filtri.lotto) params.append('lotto', filtri.lotto);
      if (filtri.soloInScadenza) params.append('soloInScadenza', 'true');
      if (filtri.soloScaduti) params.append('soloScaduti', 'true');
      params.append('limit', pagination.limit);
      params.append('skip', pagination.skip);
      
      const response = await axios.get(`${API_URL}/rintracciabilita?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTabella(response.data.data);
        setStats(response.data.stats);
        setPagination(prev => ({ ...prev, totale: response.data.pagination.totale }));
      }
    } catch (error) {
      console.error('Errore caricamento rintracciabilità:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  }, [filtri, pagination.limit, pagination.skip]);

  // Carica scadenze
  const caricaScadenze = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/rintracciabilita/scadenze?giorni=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setLottiInScadenza(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento scadenze:', error);
    }
  }, []);

  // Carica dettaglio lotto
  const caricaDettaglioLotto = async (codiceLotto) => {

  // Carica ordini con scarico
  const caricaOrdini = useCallback(async () => {
    setLoadingOrdini(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/ordini?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const ordiniConScarico = response.data.ordini.filter(o => o.ingredientiScaricati);
        setOrdini(ordiniConScarico);
      }
    } catch (error) {
      console.error('Errore caricamento ordini:', error);
    } finally {
      setLoadingOrdini(false);
    }
  }, []);

  // Effect per caricare ordini quando tab attivo
  useEffect(() => {
    if (tabAttiva === 2) caricaOrdini();
  }, [tabAttiva, caricaOrdini]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/rintracciabilita/lotto/${encodeURIComponent(codiceLotto)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDettaglioLotto(response.data.data);
        setDialogDettaglio(true);
      }
    } catch (error) {
      console.error('Errore caricamento dettaglio:', error);
      toast.error('Errore nel caricamento del dettaglio');
    }
  };

  // Export CSV
  const esportaCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('formato', 'csv');
      if (filtri.dataInizio) params.append('dataInizio', filtri.dataInizio);
      if (filtri.dataFine) params.append('dataFine', filtri.dataFine);
      
      const response = await axios.get(`${API_URL}/rintracciabilita/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rintracciabilita_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Export completato!');
    } catch (error) {
      console.error('Errore export:', error);
      toast.error('Errore nell\'export');
    }
  };

  // Effetti
  useEffect(() => {
    if (tabAttiva === 0) {
      caricaDati();
    } else if (tabAttiva === 1) {
      caricaScadenze();
    }
  }, [tabAttiva, caricaDati, caricaScadenze]);

  // Gestori paginazione
  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, skip: newPage * prev.limit }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({ ...prev, limit: parseInt(event.target.value, 10), skip: 0 }));
  };

  // Reset filtri
  const resetFiltri = () => {
    setFiltri({
      dataInizio: '',
      dataFine: '',
      fornitore: '',
      categoria: '',
      ingrediente: '',
      lotto: '',
      soloInScadenza: false,
      soloScaduti: false
    });
  };

  // Helper per chip stato
  const getChipStato = (stato) => {
    const config = {
      'disponibile': { color: 'success', label: 'Disponibile', icon: <CheckCircleIcon /> },
      'in_uso': { color: 'info', label: 'In Uso', icon: <InfoIcon /> },
      'esaurito': { color: 'default', label: 'Esaurito', icon: <InventoryIcon /> },
      'scaduto': { color: 'error', label: 'Scaduto', icon: <ErrorIcon /> },
      'richiamato': { color: 'error', label: 'Richiamato', icon: <WarningIcon /> },
      'quarantena': { color: 'warning', label: 'Quarantena', icon: <WarningIcon /> }
    };
    const c = config[stato] || config['disponibile'];
    return <Chip size="small" color={c.color} label={c.label} icon={c.icon} />;
  };

  // Helper per alert scadenza
  const getAlertScadenza = (giorni) => {
    if (giorni === null) return null;
    if (giorni <= 0) return <Chip size="small" color="error" label="SCADUTO" />;
    if (giorni <= 3) return <Chip size="small" color="error" label={`${giorni}gg`} />;
    if (giorni <= 7) return <Chip size="small" color="warning" label={`${giorni}gg`} />;
    if (giorni <= 30) return <Chip size="small" color="info" label={`${giorni}gg`} />;
    return <Chip size="small" color="success" label={`${giorni}gg`} />;
  };

  // Formatta data
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('it-IT');
  };

  // Formatta valuta
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon color="primary" />
          Rintracciabilità HACCP
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFiltriVisibili(!filtriVisibili)}
          >
            Filtri
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={esportaCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => tabAttiva === 0 ? caricaDati() : caricaScadenze()}
          >
            Aggiorna
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">{stats.totaleLotti || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Totale Lotti</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: stats.lottiScaduti > 0 ? 'error.light' : 'inherit' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color={stats.lottiScaduti > 0 ? 'error.dark' : 'inherit'}>
                {stats.lottiScaduti || 0}
              </Typography>
              <Typography variant="body2">Lotti Scaduti</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: stats.lottiInScadenza > 0 ? 'warning.light' : 'inherit' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color={stats.lottiInScadenza > 0 ? 'warning.dark' : 'inherit'}>
                {stats.lottiInScadenza || 0}
              </Typography>
              <Typography variant="body2">In Scadenza (30gg)</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {formatCurrency(stats.valoreTotale)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Valore Totale</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtri */}
      <Collapse in={filtriVisibili}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Data Inizio"
                type="date"
                value={filtri.dataInizio}
                onChange={(e) => setFiltri(prev => ({ ...prev, dataInizio: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Data Fine"
                type="date"
                value={filtri.dataFine}
                onChange={(e) => setFiltri(prev => ({ ...prev, dataFine: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Fornitore"
                value={filtri.fornitore}
                onChange={(e) => setFiltri(prev => ({ ...prev, fornitore: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LocalShippingIcon fontSize="small" /></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={filtri.categoria}
                  label="Categoria"
                  onChange={(e) => setFiltri(prev => ({ ...prev, categoria: e.target.value }))}
                >
                  <MenuItem value="">Tutte</MenuItem>
                  <MenuItem value="farine">Farine</MenuItem>
                  <MenuItem value="latticini">Latticini</MenuItem>
                  <MenuItem value="uova">Uova</MenuItem>
                  <MenuItem value="zuccheri">Zuccheri</MenuItem>
                  <MenuItem value="grassi">Grassi</MenuItem>
                  <MenuItem value="spezie">Spezie</MenuItem>
                  <MenuItem value="lieviti">Lieviti</MenuItem>
                  <MenuItem value="frutta">Frutta</MenuItem>
                  <MenuItem value="confezionamento">Confezionamento</MenuItem>
                  <MenuItem value="altro">Altro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Ingrediente"
                value={filtri.ingrediente}
                onChange={(e) => setFiltri(prev => ({ ...prev, ingrediente: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Codice Lotto"
                value={filtri.lotto}
                onChange={(e) => setFiltri(prev => ({ ...prev, lotto: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant={filtri.soloInScadenza ? 'contained' : 'outlined'}
                  color="warning"
                  size="small"
                  onClick={() => setFiltri(prev => ({ ...prev, soloInScadenza: !prev.soloInScadenza, soloScaduti: false }))}
                >
                  Solo In Scadenza
                </Button>
                <Button
                  variant={filtri.soloScaduti ? 'contained' : 'outlined'}
                  color="error"
                  size="small"
                  onClick={() => setFiltri(prev => ({ ...prev, soloScaduti: !prev.soloScaduti, soloInScadenza: false }))}
                >
                  Solo Scaduti
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  startIcon={<ClearIcon />}
                  onClick={resetFiltri}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={caricaDati}
                >
                  Cerca
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabAttiva} onChange={(e, v) => setTabAttiva(v)}>
          <Tab label="Tabella Rintracciabilità" icon={<InventoryIcon />} iconPosition="start" />
          <Tab 
            label={
              <Badge badgeContent={lottiInScadenza.length} color="warning">
                Alert Scadenze
              </Badge>
            } 
            icon={<WarningIcon />} 
            iconPosition="start" 
          />
        </Tabs>
      </Paper>

      {/* Tab 0: Tabella principale */}
      {tabAttiva === 0 && (
        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}></TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Prodotto</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Categoria</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Codice Lotto</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data Arrivo</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Scadenza</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Qtà Attuale</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fornitore</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>N. Fattura</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stato</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tabella.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          Nessun dato trovato. Importa delle fatture per popolare la rintracciabilità.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tabella.map((riga) => (
                      <React.Fragment key={riga._id}>
                        <TableRow 
                          hover
                          sx={{ 
                            bgcolor: riga.alertScadenza === 'scaduto' ? 'error.lighter' : 
                                    riga.alertScadenza === 'urgente' ? 'warning.lighter' : 'inherit'
                          }}
                        >
                          <TableCell>
                            <IconButton 
                              size="small"
                              onClick={() => setRigaEspansa(rigaEspansa === riga._id ? null : riga._id)}
                            >
                              {rigaEspansa === riga._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{riga.ingrediente}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={riga.categoria} variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {riga.codiceLotto || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDate(riga.dataArrivo)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {formatDate(riga.dataScadenza)}
                              {getAlertScadenza(riga.giorniAllaScadenza)}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="medium">
                              {riga.quantitaAttuale} {riga.unitaMisura}
                            </Typography>
                          </TableCell>
                          <TableCell>{riga.fornitore}</TableCell>
                          <TableCell>
                            {riga.documentoOrigine?.numero || '-'}
                          </TableCell>
                          <TableCell>{getChipStato(riga.stato)}</TableCell>
                          <TableCell>
                            <Tooltip title="Dettagli completi">
                              <IconButton 
                                size="small"
                                onClick={() => caricaDettaglioLotto(riga.codiceLotto)}
                              >
                                <InfoIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                        
                        {/* Riga espansa con dettagli */}
                        <TableRow>
                          <TableCell colSpan={11} sx={{ py: 0 }}>
                            <Collapse in={rigaEspansa === riga._id}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                      <ReceiptIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                      Documento Origine
                                    </Typography>
                                    <Typography variant="body2">
                                      Tipo: {riga.documentoOrigine?.tipo || 'Fattura'}<br />
                                      Numero: {riga.documentoOrigine?.numero || '-'}<br />
                                      Data: {formatDate(riga.documentoOrigine?.data)}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                      <LocalShippingIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                      Fornitore
                                    </Typography>
                                    <Typography variant="body2">
                                      {riga.fornitore}<br />
                                      P.IVA: {riga.partitaIvaFornitore || '-'}<br />
                                      Lotto Fornitore: {riga.lottoFornitore || '-'}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                      <InventoryIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                      Quantità e Valore
                                    </Typography>
                                    <Typography variant="body2">
                                      Iniziale: {riga.quantitaIniziale} {riga.unitaMisura}<br />
                                      Attuale: {riga.quantitaAttuale} {riga.unitaMisura}<br />
                                      Prezzo: {formatCurrency(riga.prezzoUnitario)}/{riga.unitaMisura}<br />
                                      Valore: {formatCurrency(riga.valoreTotale)}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={pagination.totale}
                page={Math.floor(pagination.skip / pagination.limit)}
                onPageChange={handleChangePage}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[25, 50, 100]}
                labelRowsPerPage="Righe per pagina:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
              />
            </>
          )}
        </TableContainer>
      )}

      {/* Tab 1: Alert Scadenze */}
      {tabAttiva === 1 && (
        <Paper>
          {lottiInScadenza.length === 0 ? (
            <Alert severity="success" sx={{ m: 2 }}>
              <Typography>Nessun lotto in scadenza nei prossimi 30 giorni! 🎉</Typography>
            </Alert>
          ) : (
            <List>
              {lottiInScadenza.map((lotto, index) => (
                <React.Fragment key={`${lotto.codiceLotto}-${index}`}>
                  <ListItem
                    sx={{
                      bgcolor: lotto.urgenza === 'scaduto' ? 'error.lighter' :
                              lotto.urgenza === 'critico' ? 'error.light' :
                              lotto.urgenza === 'urgente' ? 'warning.light' : 'inherit'
                    }}
                    secondaryAction={
                      <Button
                        size="small"
                        onClick={() => caricaDettaglioLotto(lotto.codiceLotto)}
                      >
                        Dettagli
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {lotto.urgenza === 'scaduto' && <ErrorIcon color="error" />}
                          {lotto.urgenza === 'critico' && <WarningIcon color="error" />}
                          {lotto.urgenza === 'urgente' && <WarningIcon color="warning" />}
                          <Typography fontWeight="bold">{lotto.ingrediente}</Typography>
                          <Chip 
                            size="small" 
                            label={lotto.codiceLotto}
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2">
                          Scadenza: {formatDate(lotto.dataScadenza)} 
                          {lotto.giorniRimanenti <= 0 
                            ? ` (SCADUTO da ${Math.abs(lotto.giorniRimanenti)} giorni)`
                            : ` (${lotto.giorniRimanenti} giorni)`
                          }
                          {' • '}
                          Qtà: {lotto.quantitaRimanente} {lotto.unitaMisura}
                          {' • '}
                          Fornitore: {lotto.fornitore}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < lottiInScadenza.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Dialog Dettaglio Lotto */}
      <Dialog open={dialogDettaglio} onClose={() => setDialogDettaglio(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Dettaglio Lotto: {dettaglioLotto?.lotto?.codiceLotto}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {dettaglioLotto && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Ingrediente</Typography>
                <Typography><strong>Nome:</strong> {dettaglioLotto.ingrediente.nome}</Typography>
                <Typography><strong>Categoria:</strong> {dettaglioLotto.ingrediente.categoria}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Quantità</Typography>
                <Typography><strong>Iniziale:</strong> {dettaglioLotto.lotto.quantitaIniziale} {dettaglioLotto.lotto.unitaMisura}</Typography>
                <Typography><strong>Attuale:</strong> {dettaglioLotto.lotto.quantitaAttuale} {dettaglioLotto.lotto.unitaMisura}</Typography>
                <Typography><strong>Utilizzato:</strong> {dettaglioLotto.lotto.percentualeUtilizzata}%</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Date</Typography>
                <Typography><strong>Arrivo:</strong> {formatDate(dettaglioLotto.lotto.dataArrivo)}</Typography>
                <Typography><strong>Scadenza:</strong> {formatDate(dettaglioLotto.lotto.dataScadenza)}</Typography>
                <Typography>
                  <strong>Giorni rimanenti:</strong> {dettaglioLotto.lotto.giorniAllaScadenza}
                  {dettaglioLotto.lotto.giorniAllaScadenza <= 0 && 
                    <Chip size="small" color="error" label="SCADUTO" sx={{ ml: 1 }} />
                  }
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Fornitore</Typography>
                <Typography><strong>Nome:</strong> {dettaglioLotto.rintracciabilitaCompleta.fornitore?.ragioneSociale || 'N/D'}</Typography>
                <Typography><strong>P.IVA:</strong> {dettaglioLotto.rintracciabilitaCompleta.fornitore?.partitaIVA || 'N/D'}</Typography>
                <Typography><strong>Lotto Fornitore:</strong> {dettaglioLotto.rintracciabilitaCompleta.lottoFornitore || 'N/D'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Documento Origine</Typography>
                <Typography>
                  <strong>Tipo:</strong> {dettaglioLotto.rintracciabilitaCompleta.documentoOrigine?.tipo || 'Fattura'} | 
                  <strong> Numero:</strong> {dettaglioLotto.rintracciabilitaCompleta.documentoOrigine?.numero || 'N/D'} | 
                  <strong> Data:</strong> {formatDate(dettaglioLotto.rintracciabilitaCompleta.documentoOrigine?.data)}
                </Typography>
              </Grid>
              {dettaglioLotto.movimenti && dettaglioLotto.movimenti.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Movimenti Collegati</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Data</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Quantità</TableCell>
                          <TableCell>Note</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dettaglioLotto.movimenti.map((mov, i) => (
                          <TableRow key={i}>
                            <TableCell>{formatDate(mov.dataMovimento)}</TableCell>
                            <TableCell>
                              <Chip 
                                size="small" 
                                color={mov.tipo === 'carico' ? 'success' : 'error'}
                                label={mov.tipo}
                              />
                            </TableCell>
                            <TableCell>{mov.quantita} {mov.unita}</TableCell>
                            <TableCell>{mov.note}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDettaglio(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Tab 2: Ordini con Rintracciabilità */}
      {tabAttiva === 2 && (
        <TableContainer component={Paper}>
          {loadingOrdini ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : ordini.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Nessun ordine con scarico trovato
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Ordine</strong></TableCell>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Data Ritiro</strong></TableCell>
                  <TableCell><strong>Data Scarico</strong></TableCell>
                  <TableCell><strong>Prodotti</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordini.map((ordine) => (
                  <TableRow key={ordine._id}>
                    <TableCell>
                      {ordine.numeroOrdine || ordine._id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      {ordine.nomeCliente} {ordine.cognomeCliente}
                    </TableCell>
                    <TableCell>
                      {new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell>
                      {ordine.dataScarico ? (
                        <Chip 
                          size="small" 
                          color="success" 
                          label={new Date(ordine.dataScarico).toLocaleDateString('it-IT')} 
                        />
                      ) : (
                        <Chip size="small" color="default" label="Non scaricato" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={`${ordine.prodotti?.length || 0} prodotti`} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}

    </Box>
  );
};

export default Rintracciabilita;