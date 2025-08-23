'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  AccountBalance,
  Add,
  Payment,
  Warning
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function CreditiDebitiPage() {
  const [movimenti, setMovimenti] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [movimentoCorrente, setMovimentoCorrente] = useState(null);
  const [riepilogo, setRiepilogo] = useState({
    totaleCrediti: 0,
    totaleDebiti: 0,
    saldo: 0,
    clientiInsoluti: 0
  });

  useEffect(() => {
    const movimentiSalvati = JSON.parse(localStorage.getItem('movimentiClienti') || '[]');
    const clientiSalvati = JSON.parse(localStorage.getItem('clienti') || '[]');
    setMovimenti(movimentiSalvati);
    setClienti(clientiSalvati);
    calcolaRiepilogo(movimentiSalvati);
  }, []);

  const calcolaRiepilogo = (movimentiData) => {
    const crediti = movimentiData
      .filter(m => m.tipo === 'credito')
      .reduce((sum, m) => sum + m.importo, 0);
    
    const debiti = movimentiData
      .filter(m => m.tipo === 'debito')
      .reduce((sum, m) => sum + m.importo, 0);
    
    const clientiConSaldo = {};
    movimentiData.forEach(m => {
      if (!clientiConSaldo[m.cliente]) {
        clientiConSaldo[m.cliente] = 0;
      }
      clientiConSaldo[m.cliente] += m.tipo === 'credito' ? m.importo : -m.importo;
    });
    
    const insoluti = Object.values(clientiConSaldo).filter(saldo => saldo > 0).length;
    
    setRiepilogo({
      totaleCrediti: crediti,
      totaleDebiti: debiti,
      saldo: crediti - debiti,
      clientiInsoluti: insoluti
    });
  };

  const salvaMovimenti = (nuoviMovimenti) => {
    setMovimenti(nuoviMovimenti);
    localStorage.setItem('movimentiClienti', JSON.stringify(nuoviMovimenti));
    calcolaRiepilogo(nuoviMovimenti);
  };

  const handleOpenDialog = () => {
    setMovimentoCorrente({
      tipo: 'credito',
      cliente: '',
      importo: 0,
      causale: '',
      dataScadenza: '',
      note: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setMovimentoCorrente(null);
  };

  const handleSaveMovimento = () => {
    const nuovoMovimento = {
      ...movimentoCorrente,
      id: Date.now(),
      dataRegistrazione: new Date().toISOString(),
      stato: 'aperto'
    };
    
    salvaMovimenti([nuovoMovimento, ...movimenti]);
    handleCloseDialog();
  };

  const handleSalda = (movimentoId) => {
    const movimentiAggiornati = movimenti.map(m => 
      m.id === movimentoId ? { ...m, stato: 'saldato', dataSaldo: new Date().toISOString() } : m
    );
    salvaMovimenti(movimentiAggiornati);
  };

  const getSaldoCliente = (nomeCliente) => {
    const saldo = movimenti
      .filter(m => m.cliente === nomeCliente)
      .reduce((sum, m) => sum + (m.tipo === 'credito' ? m.importo : -m.importo), 0);
    return saldo;
  };

  const getScadenzaColor = (dataScadenza, stato) => {
    if (stato === 'saldato') return 'success';
    if (!dataScadenza) return 'default';
    
    const oggi = new Date();
    const scadenza = new Date(dataScadenza);
    const giorniAllaScadenza = Math.floor((scadenza - oggi) / (1000 * 60 * 60 * 24));
    
    if (giorniAllaScadenza < 0) return 'error';
    if (giorniAllaScadenza <= 7) return 'warning';
    return 'default';
  };

  const clientiUnici = [...new Set(movimenti.map(m => m.cliente))];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Crediti e Debiti
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Nuovo Movimento
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Totale Crediti
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    € {riepilogo.totaleCrediti.toFixed(2)}
                  </Typography>
                </Box>
                <TrendingUp color="success" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Totale Debiti
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    € {riepilogo.totaleDebiti.toFixed(2)}
                  </Typography>
                </Box>
                <TrendingDown color="error" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Saldo
                  </Typography>
                  <Typography variant="h5">
                    € {riepilogo.saldo.toFixed(2)}
                  </Typography>
                </Box>
                <AccountBalance fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Clienti Insoluti
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {riepilogo.clientiInsoluti}
                  </Typography>
                </Box>
                <Warning color="warning" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {riepilogo.clientiInsoluti > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Ci sono {riepilogo.clientiInsoluti} clienti con pagamenti in sospeso
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Riepilogo per Cliente
        </Typography>
        <Grid container spacing={2}>
          {clientiUnici.map(cliente => {
            const saldo = getSaldoCliente(cliente);
            return (
              <Grid item xs={12} md={4} key={cliente}>
                <Box sx={{ 
                  p: 2, 
                  border: 1, 
                  borderColor: saldo > 0 ? 'warning.main' : 'success.main',
                  borderRadius: 1,
                  bgcolor: saldo > 0 ? 'warning.lighter' : 'success.lighter'
                }}>
                  <Typography variant="subtitle1">{cliente}</Typography>
                  <Typography variant="h6" color={saldo > 0 ? 'warning.main' : 'success.main'}>
                    € {Math.abs(saldo).toFixed(2)} {saldo > 0 ? 'da incassare' : 'saldato'}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Causale</TableCell>
              <TableCell align="right">Importo</TableCell>
              <TableCell>Scadenza</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movimenti.map((movimento) => (
              <TableRow key={movimento.id}>
                <TableCell>
                  {format(new Date(movimento.dataRegistrazione), 'dd/MM/yyyy', { locale: it })}
                </TableCell>
                <TableCell>{movimento.cliente}</TableCell>
                <TableCell>
                  <Chip 
                    label={movimento.tipo}
                    color={movimento.tipo === 'credito' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{movimento.causale}</TableCell>
                <TableCell align="right">
                  € {movimento.importo.toFixed(2)}
                </TableCell>
                <TableCell>
                  {movimento.dataScadenza && (
                    <Chip
                      label={format(new Date(movimento.dataScadenza), 'dd/MM/yyyy', { locale: it })}
                      color={getScadenzaColor(movimento.dataScadenza, movimento.stato)}
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={movimento.stato}
                    color={movimento.stato === 'saldato' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {movimento.stato === 'aperto' && movimento.tipo === 'credito' && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Payment />}
                      onClick={() => handleSalda(movimento.id)}
                    >
                      Salda
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Nuovo Movimento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={movimentoCorrente?.tipo || 'credito'}
                  label="Tipo"
                  onChange={(e) => setMovimentoCorrente({...movimentoCorrente, tipo: e.target.value})}
                >
                  <MenuItem value="credito">Credito (da incassare)</MenuItem>
                  <MenuItem value="debito">Debito (pagato)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={movimentoCorrente?.cliente || ''}
                  label="Cliente"
                  onChange={(e) => setMovimentoCorrente({...movimentoCorrente, cliente: e.target.value})}
                >
                  {clienti.map(cliente => (
                    <MenuItem key={cliente.id} value={cliente.tipo === 'privato' ? `${cliente.nome} ${cliente.cognome}` : cliente.ragioneSociale}>
                      {cliente.tipo === 'privato' ? `${cliente.nome} ${cliente.cognome}` : cliente.ragioneSociale}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Importo"
                value={movimentoCorrente?.importo || ''}
                onChange={(e) => setMovimentoCorrente({...movimentoCorrente, importo: Number(e.target.value)})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Causale"
                value={movimentoCorrente?.causale || ''}
                onChange={(e) => setMovimentoCorrente({...movimentoCorrente, causale: e.target.value})}
              />
            </Grid>
            {movimentoCorrente?.tipo === 'credito' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data Scadenza"
                  value={movimentoCorrente?.dataScadenza || ''}
                  onChange={(e) => setMovimentoCorrente({...movimentoCorrente, dataScadenza: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Note"
                value={movimentoCorrente?.note || ''}
                onChange={(e) => setMovimentoCorrente({...movimentoCorrente, note: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button onClick={handleSaveMovimento} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}