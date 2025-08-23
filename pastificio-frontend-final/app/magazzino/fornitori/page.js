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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Rating
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Phone,
  Email,
  LocationOn,
  Business
} from '@mui/icons-material';

export default function FornitoriPage() {
  const [fornitori, setFornitori] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [fornitoreCorrente, setFornitoreCorrente] = useState(null);
  const [vistaDettaglio, setVistaDettaglio] = useState(null);

  useEffect(() => {
    const fornitoriSalvati = JSON.parse(localStorage.getItem('fornitori') || '[]');
    setFornitori(fornitoriSalvati);
  }, []);

  const salvaFornitori = (nuoviFornitori) => {
    setFornitori(nuoviFornitori);
    localStorage.setItem('fornitori', JSON.stringify(nuoviFornitori));
  };

  const handleOpenDialog = (fornitore = null) => {
    setFornitoreCorrente(fornitore || {
      ragioneSociale: '',
      partitaIva: '',
      codiceFiscale: '',
      indirizzo: '',
      citta: '',
      cap: '',
      provincia: '',
      telefono: '',
      email: '',
      referente: '',
      categorie: [],
      note: '',
      valutazione: 3,
      terminiPagamento: '',
      scontoApplicato: 0
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFornitoreCorrente(null);
  };

  const handleSaveFornitore = () => {
    if (fornitoreCorrente.id) {
      const fornitoriAggiornati = fornitori.map(f => 
        f.id === fornitoreCorrente.id ? fornitoreCorrente : f
      );
      salvaFornitori(fornitoriAggiornati);
    } else {
      const nuovoFornitore = {
        ...fornitoreCorrente,
        id: Date.now(),
        dataCreazione: new Date().toISOString()
      };
      salvaFornitori([...fornitori, nuovoFornitore]);
    }
    handleCloseDialog();
  };

  const handleDeleteFornitore = (id) => {
    if (confirm('Confermi l\'eliminazione del fornitore?')) {
      salvaFornitori(fornitori.filter(f => f.id !== id));
    }
  };

  const handleViewDettaglio = (fornitore) => {
    setVistaDettaglio(fornitore);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Fornitori
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nuovo Fornitore
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={vistaDettaglio ? 8 : 12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ragione Sociale</TableCell>
                  <TableCell>Contatti</TableCell>
                  <TableCell>Città</TableCell>
                  <TableCell>Categorie</TableCell>
                  <TableCell align="center">Valutazione</TableCell>
                  <TableCell align="center">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fornitori.map((fornitore) => (
                  <TableRow 
                    key={fornitore.id}
                    hover
                    onClick={() => handleViewDettaglio(fornitore)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{fornitore.ragioneSociale}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{fornitore.telefono}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fornitore.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{fornitore.citta}</TableCell>
                    <TableCell>
                      {fornitore.categorie?.map((cat, idx) => (
                        <Chip key={idx} label={cat} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell align="center">
                      <Rating value={fornitore.valutazione} readOnly size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(fornitore);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFornitore(fornitore.id);
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {vistaDettaglio && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h6">
                    {vistaDettaglio.ragioneSociale}
                  </Typography>
                  <IconButton size="small" onClick={() => setVistaDettaglio(null)}>
                    ×
                  </IconButton>
                </Box>
                
                <List dense>
                  <ListItem>
                    <Business sx={{ mr: 2 }} />
                    <ListItemText 
                      primary="Partita IVA"
                      secondary={vistaDettaglio.partitaIva}
                    />
                  </ListItem>
                  <ListItem>
                    <LocationOn sx={{ mr: 2 }} />
                    <ListItemText 
                      primary="Indirizzo"
                      secondary={`${vistaDettaglio.indirizzo}, ${vistaDettaglio.cap} ${vistaDettaglio.citta} (${vistaDettaglio.provincia})`}
                    />
                  </ListItem>
                  <ListItem>
                    <Phone sx={{ mr: 2 }} />
                    <ListItemText 
                      primary="Telefono"
                      secondary={vistaDettaglio.telefono}
                    />
                  </ListItem>
                  <ListItem>
                    <Email sx={{ mr: 2 }} />
                    <ListItemText 
                      primary="Email"
                      secondary={vistaDettaglio.email}
                    />
                  </ListItem>
                </List>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Referente: {vistaDettaglio.referente}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Termini pagamento: {vistaDettaglio.terminiPagamento}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sconto: {vistaDettaglio.scontoApplicato}%
                  </Typography>
                </Box>

                {vistaDettaglio.note && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Note: {vistaDettaglio.note}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {fornitoreCorrente?.id ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Ragione Sociale"
                value={fornitoreCorrente?.ragioneSociale || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, ragioneSociale: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Partita IVA"
                value={fornitoreCorrente?.partitaIva || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, partitaIva: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Indirizzo"
                value={fornitoreCorrente?.indirizzo || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, indirizzo: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Città"
                value={fornitoreCorrente?.citta || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, citta: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="CAP"
                value={fornitoreCorrente?.cap || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, cap: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Provincia"
                value={fornitoreCorrente?.provincia || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, provincia: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefono"
                value={fornitoreCorrente?.telefono || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, telefono: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={fornitoreCorrente?.email || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Referente"
                value={fornitoreCorrente?.referente || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, referente: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Termini Pagamento"
                value={fornitoreCorrente?.terminiPagamento || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, terminiPagamento: e.target.value})}
                placeholder="es. 30 gg D.F."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Sconto Applicato (%)"
                value={fornitoreCorrente?.scontoApplicato || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, scontoApplicato: Number(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography component="legend">Valutazione</Typography>
                <Rating
                  value={fornitoreCorrente?.valutazione || 3}
                  onChange={(e, newValue) => {
                    setFornitoreCorrente({...fornitoreCorrente, valutazione: newValue});
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Note"
                value={fornitoreCorrente?.note || ''}
                onChange={(e) => setFornitoreCorrente({...fornitoreCorrente, note: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button onClick={handleSaveFornitore} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}