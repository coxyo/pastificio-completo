// components/TabellaRintracciabilita.jsx
// Dashboard HACCP - Rintracciabilità Lotti e Scadenze
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Grid,
  Button,
  Alert,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Description as FileIcon,
  LocalShipping as ShippingIcon,
  Restaurant as RestaurantIcon,
  History as HistoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export default function TabellaRintracciabilita() {
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [lotti, setLotti] = useState([]);
  const [ordini, setOrdini] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLotto, setSearchLotto] = useState('');
  const [searchOrdine, setSearchOrdine] = useState('');
  const [dettaglioDialog, setDettaglioDialog] = useState(null);

  // ==================== CARICAMENTO DATI ====================

  useEffect(() => {
    caricaDati();
  }, []);

  const caricaDati = async () => {
    setLoading(true);
    try {
      await Promise.all([
        caricaLotti(),
        caricaOrdini(),
        caricaMovimenti()
      ]);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      toast.error('Errore caricamento dati rintracciabilità');
    } finally {
      setLoading(false);
    }
  };

  const caricaLotti = async () => {
    try {
      const response = await fetch(`${API_URL}/ingredienti/lotti`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setLotti(data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento lotti:', error);
    }
  };

  const caricaOrdini = async () => {
    try {
      const response = await fetch(`${API_URL}/ordini?limit=100&ingredientiScaricati=true`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setOrdini(data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento ordini:', error);
    }
  };

  const caricaMovimenti = async () => {
    try {
      const response = await fetch(`${API_URL}/magazzino?tipo=scarico&limit=200`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setMovimenti(data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento movimenti:', error);
    }
  };

  // ==================== RICERCA ====================

  const lottiFilrati = lotti.filter(lotto => {
    if (!searchLotto) return true;
    const search = searchLotto.toLowerCase();
    return (
      lotto.codiceLotto?.toLowerCase().includes(search) ||
      lotto.ingrediente?.nome?.toLowerCase().includes(search) ||
      lotto.lottoFornitore?.toLowerCase().includes(search)
    );
  });

  const ordiniFilrati = ordini.filter(ordine => {
    if (!searchOrdine) return true;
    const search = searchOrdine.toLowerCase();
    return (
      ordine.numeroOrdine?.toLowerCase().includes(search) ||
      ordine.nomeCliente?.toLowerCase().includes(search) ||
      ordine.cliente?.nomeCompleto?.toLowerCase().includes(search)
    );
  });

  // ==================== DETTAGLI ====================

  const mostraDettaglioLotto = async (lotto) => {
    try {
      // Carica movimenti collegati al lotto
      const response = await fetch(
        `${API_URL}/magazzino?ingredienteId=${lotto.ingrediente._id}&lottoId=${lotto._id}`,
        {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }
      );
      const data = await response.json();

      setDettaglioDialog({
        tipo: 'lotto',
        lotto,
        movimenti: data.success ? data.data : []
      });
    } catch (error) {
      console.error('Errore dettaglio lotto:', error);
      toast.error('Errore caricamento dettagli');
    }
  };

  const mostraDettaglioOrdine = (ordine) => {
    setDettaglioDialog({
      tipo: 'ordine',
      ordine
    });
  };

  // ==================== RENDER ====================

  const renderScadenza = (dataScadenza) => {
    if (!dataScadenza) return <Chip label="N/D" size="small" />;
    
    const scadenza = new Date(dataScadenza);
    const oggi = new Date();
    const giorniRimasti = Math.ceil((scadenza - oggi) / (1000 * 60 * 60 * 24));

    if (giorniRimasti < 0) {
      return (
        <Chip 
          icon={<WarningIcon />}
          label={`Scaduto (${Math.abs(giorniRimasti)}gg fa)`}
          color="error"
          size="small"
        />
      );
    } else if (giorniRimasti <= 7) {
      return (
        <Chip 
          icon={<WarningIcon />}
          label={`${giorniRimasti}gg`}
          color="warning"
          size="small"
        />
      );
    } else if (giorniRimasti <= 30) {
      return (
        <Chip 
          label={`${giorniRimasti}gg`}
          color="info"
          size="small"
        />
      );
    } else {
      return (
        <Chip 
          icon={<CheckIcon />}
          label={scadenza.toLocaleDateString('it-IT')}
          color="success"
          size="small"
        />
      );
    }
  };

  const renderGiacenza = (giacenza) => {
    if (!giacenza || giacenza === 0) {
      return <Chip label="Esaurito" color="error" size="small" />;
    } else if (giacenza < 5) {
      return <Chip label={`${giacenza} Kg`} color="warning" size="small" />;
    } else {
      return <Chip label={`${giacenza} Kg`} color="success" size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        📋 Rintracciabilità HACCP
      </Typography>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<FileIcon />} label="Lotti Ingredienti" />
        <Tab icon={<RestaurantIcon />} label="Ordini con Rintracciabilità" />
        <Tab icon={<ShippingIcon />} label="Movimenti Magazzino" />
      </Tabs>

      {/* TAB 1: LOTTI INGREDIENTI */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                label="Cerca lotto, ingrediente, lotto fornitore..."
                value={searchLotto}
                onChange={(e) => setSearchLotto(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <Button 
                variant="contained" 
                onClick={caricaDati}
                startIcon={<HistoryIcon />}
              >
                Aggiorna
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Lotto</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Ingrediente</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Lotto Fornitore</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Fattura</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Giacenza</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Scadenza</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lottiFilrati.map((lotto) => (
                    <TableRow key={lotto._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {lotto.codiceLotto}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {lotto.ingrediente?.nome || 'N/D'}
                      </TableCell>
                      <TableCell>
                        {lotto.lottoFornitore || '-'}
                      </TableCell>
                      <TableCell>
                        {lotto.importazione ? (
                          <Tooltip title={`Fattura ${lotto.importazione.numeroFattura}`}>
                            <Chip
                              icon={<FileIcon />}
                              label={lotto.importazione.numeroFattura}
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {renderGiacenza(lotto.giacenza)}
                      </TableCell>
                      <TableCell>
                        {renderScadenza(lotto.dataScadenza)}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Vedi dettagli">
                          <IconButton
                            size="small"
                            onClick={() => mostraDettaglioLotto(lotto)}
                            color="primary"
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {lottiFilrati.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          Nessun lotto trovato
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: ORDINI CON RINTRACCIABILITÀ */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                label="Cerca ordine, cliente..."
                value={searchOrdine}
                onChange={(e) => setSearchOrdine(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <Button 
                variant="contained" 
                onClick={caricaDati}
                startIcon={<HistoryIcon />}
              >
                Aggiorna
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Ordine</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Cliente</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Data Ritiro</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Data Scarico</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Prodotti</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordiniFilrati.map((ordine) => (
                    <TableRow key={ordine._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {ordine.numeroOrdine}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {ordine.nomeCliente || ordine.cliente?.nomeCompleto || 'N/D'}
                      </TableCell>
                      <TableCell>
                        {ordine.dataRitiro ? new Date(ordine.dataRitiro).toLocaleDateString('it-IT') : '-'}
                      </TableCell>
                      <TableCell>
                        {ordine.dataScarico ? (
                          <Chip
                            icon={<CheckIcon />}
                            label={new Date(ordine.dataScarico).toLocaleDateString('it-IT')}
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip label="Non scaricato" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${ordine.prodotti?.length || 0} prodotti`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Vedi dettagli">
                          <IconButton
                            size="small"
                            onClick={() => mostraDettaglioOrdine(ordine)}
                            color="primary"
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ordiniFilrati.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          Nessun ordine con rintracciabilità trovato
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: MOVIMENTI MAGAZZINO */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                onClick={caricaDati}
                startIcon={<HistoryIcon />}
              >
                Aggiorna
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Data</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tipo</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Ingrediente</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Lotto</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Quantità</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Riferimento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimenti.map((movimento) => (
                    <TableRow key={movimento._id} hover>
                      <TableCell>
                        {new Date(movimento.createdAt).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movimento.tipo}
                          color={movimento.tipo === 'carico' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {movimento.ingrediente?.nome || 'N/D'}
                      </TableCell>
                      <TableCell>
                        {movimento.lotto?.codiceLotto || '-'}
                      </TableCell>
                      <TableCell>
                        {movimento.quantita} {movimento.unita}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {movimento.note || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {movimenti.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          Nessun movimento trovato
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* DIALOG DETTAGLI */}
      <Dialog
        open={dettaglioDialog !== null}
        onClose={() => setDettaglioDialog(null)}
        maxWidth="md"
        fullWidth
      >
        {dettaglioDialog?.tipo === 'lotto' && (
          <>
            <DialogTitle>
              📦 Dettaglio Lotto: {dettaglioDialog.lotto.codiceLotto}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Ingrediente:</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {dettaglioDialog.lotto.ingrediente?.nome}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Lotto Fornitore:</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {dettaglioDialog.lotto.lottoFornitore || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Giacenza Attuale:</Typography>
                  {renderGiacenza(dettaglioDialog.lotto.giacenza)}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Scadenza:</Typography>
                  {renderScadenza(dettaglioDialog.lotto.dataScadenza)}
                </Grid>
                {dettaglioDialog.lotto.importazione && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Fattura di Provenienza:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Numero:</strong> {dettaglioDialog.lotto.importazione.numeroFattura}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Fornitore:</strong> {dettaglioDialog.lotto.importazione.fornitore}
                      </Typography>
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Movimenti Collegati:
                  </Typography>
                  <List dense>
                    {dettaglioDialog.movimenti?.map((mov, idx) => (
                      <ListItem key={idx} divider>
                        <ListItemText
                          primary={`${mov.tipo.toUpperCase()}: ${mov.quantita} ${mov.unita}`}
                          secondary={`${new Date(mov.createdAt).toLocaleDateString('it-IT')} - ${mov.note || ''}`}
                        />
                      </ListItem>
                    ))}
                    {(!dettaglioDialog.movimenti || dettaglioDialog.movimenti.length === 0) && (
                      <Typography variant="body2" color="text.secondary">
                        Nessun movimento registrato
                      </Typography>
                    )}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDettaglioDialog(null)}>Chiudi</Button>
            </DialogActions>
          </>
        )}

        {dettaglioDialog?.tipo === 'ordine' && (
          <>
            <DialogTitle>
              🛒 Dettaglio Ordine: {dettaglioDialog.ordine.numeroOrdine}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Cliente:</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {dettaglioDialog.ordine.nomeCliente || dettaglioDialog.ordine.cliente?.nomeCompleto}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Data Ritiro:</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {dettaglioDialog.ordine.dataRitiro ? 
                      new Date(dettaglioDialog.ordine.dataRitiro).toLocaleDateString('it-IT') : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Data Scarico Ingredienti:</Typography>
                  {dettaglioDialog.ordine.dataScarico ? (
                    <Chip
                      icon={<CheckIcon />}
                      label={new Date(dettaglioDialog.ordine.dataScarico).toLocaleDateString('it-IT')}
                      color="success"
                    />
                  ) : (
                    <Chip label="Non ancora scaricato" />
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Prodotti nell'ordine:
                  </Typography>
                  <List dense>
                    {dettaglioDialog.ordine.prodotti?.map((prod, idx) => (
                      <ListItem key={idx} divider>
                        <ListItemText
                          primary={prod.nome}
                          secondary={`${prod.quantita} ${prod.unita} - €${prod.prezzo?.toFixed(2) || '0.00'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                {dettaglioDialog.ordine.movimentiCollegati && dettaglioDialog.ordine.movimentiCollegati.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Alert severity="success">
                      Scarico ingredienti completato: {dettaglioDialog.ordine.movimentiCollegati.length} movimenti registrati
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDettaglioDialog(null)}>Chiudi</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}