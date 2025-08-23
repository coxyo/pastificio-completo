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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import { Add, Edit, Delete, CheckCircle, Schedule } from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function PianiProduzionePage() {
  const [piani, setPiani] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [pianoCorrente, setPianoCorrente] = useState(null);

  useEffect(() => {
    // Carica piani salvati
    const pianiSalvati = JSON.parse(localStorage.getItem('pianiProduzione') || '[]');
    setPiani(pianiSalvati);
  }, []);

  const salvaPiani = (nuoviPiani) => {
    setPiani(nuoviPiani);
    localStorage.setItem('pianiProduzione', JSON.stringify(nuoviPiani));
  };

  const handleOpenDialog = (piano = null) => {
    setPianoCorrente(piano || {
      nome: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      prodotti: [],
      stato: 'pianificato',
      note: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setPianoCorrente(null);
  };

  const handleSavePiano = () => {
    if (pianoCorrente.id) {
      // Modifica
      const pianiAggiornati = piani.map(p => 
        p.id === pianoCorrente.id ? pianoCorrente : p
      );
      salvaPiani(pianiAggiornati);
    } else {
      // Nuovo
      const nuovoPiano = {
        ...pianoCorrente,
        id: Date.now(),
        dataCreazione: new Date().toISOString()
      };
      salvaPiani([...piani, nuovoPiano]);
    }
    handleCloseDialog();
  };

  const handleDeletePiano = (id) => {
    if (confirm('Confermi l\'eliminazione del piano?')) {
      salvaPiani(piani.filter(p => p.id !== id));
    }
  };

  const getStatoColor = (stato) => {
    const colors = {
      'pianificato': 'info',
      'in_corso': 'warning',
      'completato': 'success'
    };
    return colors[stato] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Piani di Produzione
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nuovo Piano
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome Piano</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Prodotti</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Note</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {piani.map((piano) => (
              <TableRow key={piano.id}>
                <TableCell>{piano.nome}</TableCell>
                <TableCell>
                  {format(new Date(piano.data), 'dd MMM yyyy', { locale: it })}
                </TableCell>
                <TableCell>{piano.prodotti?.length || 0} prodotti</TableCell>
                <TableCell>
                  <Chip 
                    label={piano.stato}
                    color={getStatoColor(piano.stato)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{piano.note || '-'}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(piano)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeletePiano(piano.id)}
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
          {pianoCorrente?.id ? 'Modifica Piano' : 'Nuovo Piano di Produzione'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Piano"
                value={pianoCorrente?.nome || ''}
                onChange={(e) => setPianoCorrente({...pianoCorrente, nome: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Data"
                value={pianoCorrente?.data || ''}
                onChange={(e) => setPianoCorrente({...pianoCorrente, data: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Stato</InputLabel>
                <Select
                  value={pianoCorrente?.stato || 'pianificato'}
                  label="Stato"
                  onChange={(e) => setPianoCorrente({...pianoCorrente, stato: e.target.value})}
                >
                  <MenuItem value="pianificato">Pianificato</MenuItem>
                  <MenuItem value="in_corso">In Corso</MenuItem>
                  <MenuItem value="completato">Completato</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Note"
                value={pianoCorrente?.note || ''}
                onChange={(e) => setPianoCorrente({...pianoCorrente, note: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button onClick={handleSavePiano} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}