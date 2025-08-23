'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip
} from '@mui/material';
import { Add, Edit, Delete, FileCopy, Print } from '@mui/icons-material';

export default function RicettePage() {
  const [ricette, setRicette] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [ricettaCorrente, setRicettaCorrente] = useState(null);
  const [ingredienteTemp, setIngredienteTemp] = useState({ nome: '', quantita: '', unita: '' });

  useEffect(() => {
    const ricetteSalvate = JSON.parse(localStorage.getItem('ricette') || '[]');
    setRicette(ricetteSalvate);
  }, []);

  const salvaRicette = (nuoveRicette) => {
    setRicette(nuoveRicette);
    localStorage.setItem('ricette', JSON.stringify(nuoveRicette));
  };

  const handleOpenDialog = (ricetta = null) => {
    setRicettaCorrente(ricetta || {
      nome: '',
      categoria: '',
      ingredienti: [],
      procedimento: '',
      tempoPreparazione: '',
      porzioni: '',
      note: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setRicettaCorrente(null);
    setIngredienteTemp({ nome: '', quantita: '', unita: '' });
  };

  const handleSaveRicetta = () => {
    if (ricettaCorrente.id) {
      const ricetteAggiornate = ricette.map(r => 
        r.id === ricettaCorrente.id ? ricettaCorrente : r
      );
      salvaRicette(ricetteAggiornate);
    } else {
      const nuovaRicetta = {
        ...ricettaCorrente,
        id: Date.now(),
        dataCreazione: new Date().toISOString()
      };
      salvaRicette([...ricette, nuovaRicetta]);
    }
    handleCloseDialog();
  };

  const handleDeleteRicetta = (id) => {
    if (confirm('Confermi l\'eliminazione della ricetta?')) {
      salvaRicette(ricette.filter(r => r.id !== id));
    }
  };

  const handleAddIngrediente = () => {
    if (ingredienteTemp.nome && ingredienteTemp.quantita) {
      setRicettaCorrente({
        ...ricettaCorrente,
        ingredienti: [...(ricettaCorrente.ingredienti || []), ingredienteTemp]
      });
      setIngredienteTemp({ nome: '', quantita: '', unita: '' });
    }
  };

  const handleRemoveIngrediente = (index) => {
    const nuoviIngredienti = ricettaCorrente.ingredienti.filter((_, i) => i !== index);
    setRicettaCorrente({ ...ricettaCorrente, ingredienti: nuoviIngredienti });
  };

  const handleDuplicaRicetta = (ricetta) => {
    const nuovaRicetta = {
      ...ricetta,
      nome: `${ricetta.nome} (Copia)`,
      id: Date.now(),
      dataCreazione: new Date().toISOString()
    };
    salvaRicette([...ricette, nuovaRicetta]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Ricette
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nuova Ricetta
        </Button>
      </Box>

      <Grid container spacing={3}>
        {ricette.map((ricetta) => (
          <Grid item xs={12} md={6} lg={4} key={ricetta.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ricetta.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {ricetta.categoria}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  <strong>Tempo:</strong> {ricetta.tempoPreparazione || '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Porzioni:</strong> {ricetta.porzioni || '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Ingredienti:</strong> {ricetta.ingredienti?.length || 0}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton size="small" onClick={() => handleOpenDialog(ricetta)}>
                  <Edit />
                </IconButton>
                <IconButton size="small" onClick={() => handleDuplicaRicetta(ricetta)}>
                  <FileCopy />
                </IconButton>
                <IconButton size="small" onClick={() => window.print()}>
                  <Print />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleDeleteRicetta(ricetta.id)}
                >
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {ricettaCorrente?.id ? 'Modifica Ricetta' : 'Nuova Ricetta'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nome Ricetta"
                value={ricettaCorrente?.nome || ''}
                onChange={(e) => setRicettaCorrente({...ricettaCorrente, nome: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Categoria"
                value={ricettaCorrente?.categoria || ''}
                onChange={(e) => setRicettaCorrente({...ricettaCorrente, categoria: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tempo Preparazione"
                value={ricettaCorrente?.tempoPreparazione || ''}
                onChange={(e) => setRicettaCorrente({...ricettaCorrente, tempoPreparazione: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Porzioni"
                value={ricettaCorrente?.porzioni || ''}
                onChange={(e) => setRicettaCorrente({...ricettaCorrente, porzioni: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Ingredienti
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  label="Ingrediente"
                  value={ingredienteTemp.nome}
                  onChange={(e) => setIngredienteTemp({...ingredienteTemp, nome: e.target.value})}
                />
                <TextField
                  size="small"
                  label="Quantità"
                  value={ingredienteTemp.quantita}
                  onChange={(e) => setIngredienteTemp({...ingredienteTemp, quantita: e.target.value})}
                />
                <TextField
                  size="small"
                  label="Unità"
                  value={ingredienteTemp.unita}
                  onChange={(e) => setIngredienteTemp({...ingredienteTemp, unita: e.target.value})}
                />
                <Button variant="outlined" onClick={handleAddIngrediente}>
                  Aggiungi
                </Button>
              </Box>
              <List dense>
                {ricettaCorrente?.ingredienti?.map((ing, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${ing.nome} - ${ing.quantita} ${ing.unita}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleRemoveIngrediente(index)}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Procedimento"
                value={ricettaCorrente?.procedimento || ''}
                onChange={(e) => setRicettaCorrente({...ricettaCorrente, procedimento: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Note"
                value={ricettaCorrente?.note || ''}
                onChange={(e) => setRicettaCorrente({...ricettaCorrente, note: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button onClick={handleSaveRicetta} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}