'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Print,
  CheckCircle,
  LocalShipping,
  Receipt
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function OrdiniFornitorePage() {
  const [ordini, setOrdini] = useState([]);
  const [fornitori, setFornitori] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [ordineCorrente, setOrdineCorrente] = useState(null);
  const [prodottoTemp, setProdottoTemp] = useState({ articolo: '', quantita: 0, prezzo: 0 });

  const statiOrdine = ['bozza', 'inviato', 'confermato', 'in_consegna', 'ricevuto', 'completato'];

  useEffect(() => {
    const ordiniSalvati = JSON.parse(localStorage.getItem('ordiniFornitore') || '[]');
    const fornitoriSalvati = JSON.parse(localStorage.getItem('fornitori') || '[]');
    const inventarioSalvato = JSON.parse(localStorage.getItem('inventario') || '[]');
    setOrdini(ordiniSalvati);
    setFornitori(fornitoriSalvati);
    setInventario(inventarioSalvato);
  }, []);

  const salvaOrdini = (nuoviOrdini) => {
    setOrdini(nuoviOrdini);
    localStorage.setItem('ordiniFornitore', JSON.stringify(nuoviOrdini));
  };

  const handleOpenDialog = (ordine = null) => {
    setOrdineCorrente(ordine || {
      numeroOrdine: `ORD-${Date.now()}`,
      fornitore: '',
      dataOrdine: format(new Date(), 'yyyy-MM-dd'),
      dataConsegnaPrevista: '',
      prodotti: [],
      stato: 'bozza',
      note: '',
      totale: 0
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setOrdineCorrente(null);
    setProdottoTemp({ articolo: '', quantita: 0, prezzo: 0 });
  };

  const handleSaveOrdine = () => {
    const ordineConTotale = {
      ...ordineCorrente,
      totale: calcolaTotale(ordineCorrente.prodotti)
    };

    if (ordineCorrente.id) {
      const ordiniAggiornati = ordini.map(o => 
        o.id === ordineCorrente.id ? ordineConTotale : o
      );
      salvaOrdini(ordiniAggiornati);
    } else {
      const nuovoOrdine = {
        ...ordineConTotale,
        id: Date.now(),
        dataCreazione: new Date().toISOString()
      };
      salvaOrdini([...ordini, nuovoOrdine]);
    }
    handleCloseDialog();
  };

  const handleDeleteOrdine = (id) => {
    if (confirm('Confermi l\'eliminazione dell\'ordine?')) {
      salvaOrdini(ordini.filter(o => o.id !== id));
    }
  };

  const handleAddProdotto = () => {
    if (prodottoTemp.articolo && prodottoTemp.quantita > 0) {
      setOrdineCorrente({
        ...ordineCorrente,
        prodotti: [...(ordineCorrente.prodotti || []), prodottoTemp]
      });
      setProdottoTemp({ articolo: '', quantita: 0, prezzo: 0 });
    }
  };

  const handleRemoveProdotto = (index) => {
    const nuoviProdotti = ordineCorrente.prodotti.filter((_, i) => i !== index);
    setOrdineCorrente({ ...ordineCorrente, prodotti: nuoviProdotti });
  };

  const calcolaTotale = (prodotti) => {
    return prodotti.reduce((tot, p) => tot + (p.quantita * p.prezzo), 0);
  };

  const getStatoColor = (stato) => {
    const colors = {
      'bozza': 'default',
      'inviato': 'info',
      'confermato': 'primary',
      'in_consegna': 'warning',
      'ricevuto': 'secondary',
      'completato': 'success'
    };
    return colors[stato] || 'default';
  };

  const getStatoIcon = (stato) => {
    const icons = {
      'ricevuto': <Receipt />,
      'in_consegna': <LocalShipping />,
      'completato': <CheckCircle />
    };
    return icons[stato] || null;
  };

  const getActiveStep = (stato) => {
    return statiOrdine.indexOf(stato);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Ordini Fornitore
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nuovo Ordine
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Numero Ordine</TableCell>
              <TableCell>Fornitore</TableCell>
              <TableCell>Data Ordine</TableCell>
              <TableCell>Consegna Prevista</TableCell>
              <TableCell align="right">Totale</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordini.map((ordine) => (
              <TableRow key={ordine.id}>
                <TableCell>{ordine.numeroOrdine}</TableCell>
                <TableCell>{ordine.fornitore}</TableCell>
                <TableCell>
                  {format(new Date(ordine.dataOrdine), 'dd/MM/yyyy', { locale: it })}
                </TableCell>
                <TableCell>
                  {ordine.dataConsegnaPrevista 
                    ? format(new Date(ordine.dataConsegnaPrevista), 'dd/MM/yyyy', { locale: it })
                    : '-'
                  }
                </TableCell>
                <TableCell align="right">€ {ordine.totale.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    icon={getStatoIcon(ordine.stato)}
                    label={ordine.stato.replace('_', ' ')}
                    color={getStatoColor(ordine.stato)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleOpenDialog(ordine)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small">
                    <Print />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteOrdine(ordine.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {ordineCorrente?.id ? 'Modifica Ordine' : 'Nuovo Ordine Fornitore'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Stepper activeStep={getActiveStep(ordineCorrente?.stato || 'bozza')}>
                {statiOrdine.map((stato) => (
                  <Step key={stato}>
                    <StepLabel>{stato.replace('_', ' ')}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numero Ordine"
                value={ordineCorrente?.numeroOrdine || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Fornitore</InputLabel>
                <Select
                  value={ordineCorrente?.fornitore || ''}
                  label="Fornitore"
                  onChange={(e) => setOrdineCorrente({...ordineCorrente, fornitore: e.target.value})}
                >
                  {fornitori.map((f) => (
                    <MenuItem key={f.id} value={f.ragioneSociale}>
                      {f.ragioneSociale}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Data Ordine"
                value={ordineCorrente?.dataOrdine || ''}
                onChange={(e) => setOrdineCorrente({...ordineCorrente, dataOrdine: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Data Consegna Prevista"
                value={ordineCorrente?.dataConsegnaPrevista || ''}
                onChange={(e) => setOrdineCorrente({...ordineCorrente, dataConsegnaPrevista: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Prodotti
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Articolo</InputLabel>
                  <Select
                    value={prodottoTemp.articolo}
                    label="Articolo"
                    onChange={(e) => setProdottoTemp({...prodottoTemp, articolo: e.target.value})}
                  >
                    {inventario.map((item) => (
                      <MenuItem key={item.id} value={item.nome}>
                        {item.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  type="number"
                  label="Quantità"
                  value={prodottoTemp.quantita}
                  onChange={(e) => setProdottoTemp({...prodottoTemp, quantita: Number(e.target.value)})}
                />
                <TextField
                  type="number"
                  label="Prezzo"
                  value={prodottoTemp.prezzo}
                  onChange={(e) => setProdottoTemp({...prodottoTemp, prezzo: Number(e.target.value)})}
                />
                <Button variant="outlined" onClick={handleAddProdotto}>
                  Aggiungi
                </Button>
              </Box>
              <List dense>
                {ordineCorrente?.prodotti?.map((prod, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={prod.articolo}
                      secondary={`Qtà: ${prod.quantita} - Prezzo: €${prod.prezzo} - Totale: €${(prod.quantita * prod.prezzo).toFixed(2)}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleRemoveProdotto(index)}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Typography variant="h6" align="right" sx={{ mt: 2 }}>
                Totale: € {calcolaTotale(ordineCorrente?.prodotti || []).toFixed(2)}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Stato</InputLabel>
                <Select
                  value={ordineCorrente?.stato || 'bozza'}
                  label="Stato"
                  onChange={(e) => setOrdineCorrente({...ordineCorrente, stato: e.target.value})}
                >
                  {statiOrdine.map((stato) => (
                    <MenuItem key={stato} value={stato}>
                      {stato.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Note"
                value={ordineCorrente?.note || ''}
                onChange={(e) => setOrdineCorrente({...ordineCorrente, note: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button onClick={handleSaveOrdine} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}