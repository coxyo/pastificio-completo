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
  Alert,
  InputAdornment
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Warning, 
  CheckCircle,
  Search,
  FileDownload 
} from '@mui/icons-material';

export default function InventarioPage() {
  const [inventario, setInventario] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [itemCorrente, setItemCorrente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const inventarioSalvato = JSON.parse(localStorage.getItem('inventario') || '[]');
    setInventario(inventarioSalvato);
  }, []);

  const salvaInventario = (nuovoInventario) => {
    setInventario(nuovoInventario);
    localStorage.setItem('inventario', JSON.stringify(nuovoInventario));
  };

  const handleOpenDialog = (item = null) => {
    setItemCorrente(item || {
      nome: '',
      categoria: '',
      quantita: 0,
      unitaMisura: '',
      livelloMinimo: 0,
      livelloRiordino: 0,
      fornitore: '',
      costoUnitario: 0,
      ubicazione: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setItemCorrente(null);
  };

  const handleSaveItem = () => {
    if (itemCorrente.id) {
      const inventarioAggiornato = inventario.map(item => 
        item.id === itemCorrente.id ? itemCorrente : item
      );
      salvaInventario(inventarioAggiornato);
    } else {
      const nuovoItem = {
        ...itemCorrente,
        id: Date.now(),
        dataAggiornamento: new Date().toISOString()
      };
      salvaInventario([...inventario, nuovoItem]);
    }
    handleCloseDialog();
  };

  const handleDeleteItem = (id) => {
    if (confirm('Confermi l\'eliminazione dell\'articolo?')) {
      salvaInventario(inventario.filter(item => item.id !== id));
    }
  };

  const getStatoScorta = (item) => {
    if (item.quantita <= item.livelloMinimo) {
      return { label: 'Critico', color: 'error', icon: <Warning /> };
    } else if (item.quantita <= item.livelloRiordino) {
      return { label: 'Da riordinare', color: 'warning', icon: <Warning /> };
    }
    return { label: 'OK', color: 'success', icon: <CheckCircle /> };
  };

  const inventarioFiltrato = inventario.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const esportaInventario = () => {
    const dataStr = JSON.stringify(inventarioFiltrato, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `inventario_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const itemSottoScorta = inventario.filter(item => item.quantita <= item.livelloRiordino).length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inventario Magazzino
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={esportaInventario}
          >
            Esporta
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Nuovo Articolo
          </Button>
        </Box>
      </Box>

      {itemSottoScorta > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Ci sono {itemSottoScorta} articoli sotto scorta che necessitano riordino
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Cerca per nome o categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell align="right">Quantità</TableCell>
              <TableCell>Unità</TableCell>
              <TableCell align="right">Costo Unit.</TableCell>
              <TableCell align="right">Valore</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Ubicazione</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventarioFiltrato.map((item) => {
              const stato = getStatoScorta(item);
              return (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.categoria}</TableCell>
                  <TableCell align="right">{item.quantita}</TableCell>
                  <TableCell>{item.unitaMisura}</TableCell>
                  <TableCell align="right">€ {item.costoUnitario.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    € {(item.quantita * item.costoUnitario).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={stato.icon}
                      label={stato.label}
                      color={stato.color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{item.ubicazione}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(item)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {itemCorrente?.id ? 'Modifica Articolo' : 'Nuovo Articolo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nome Articolo"
                value={itemCorrente?.nome || ''}
                onChange={(e) => setItemCorrente({...itemCorrente, nome: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Categoria"
                value={itemCorrente?.categoria || ''}
                onChange={(e) => setItemCorrente({...itemCorrente, categoria: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantità"
                value={itemCorrente?.quantita || ''}
                onChange={(e) => setItemCorrente({...itemCorrente, quantita: Number(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unità di Misura"
                value={itemCorrente?.unitaMisura || ''}
                onChange={(e) => setItemCorrente({...itemCorrente, unitaMisura: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Costo Unitario"
                value={itemCorrente?.costoUnitario || ''}
                onChange={(e) => setItemCorrente({...itemCorrente, costoUnitario: Number(e.target.value)})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Livello Minimo"
                value={itemCorrente?.livelloMinimo || ''}
                onChange={(e) => setItemCorrente({...itemCorrente, livelloMinimo: Number(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Livello Riordino"
                value={itemCorrente?.livelloRiordino || ''}
                onChange={(e) => setItemCorrente({...itemCorrente, livelloRiordino: Number(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ubicazione"
                value={itemCorrente?.ubicazione || ''}
                onChange={(e) => setItemCorrente({...itemCorrente, ubicazione: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fornitore"
                value={itemCorrente?.fornitore || ''}
                onChange={(e) => setItemCorrente({...itemCorrente, fornitore: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button onClick={handleSaveItem} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}