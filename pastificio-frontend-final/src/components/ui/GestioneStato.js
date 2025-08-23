'use client'
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Typography, Chip, Select, MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';

export default function GestioneStato({ ordine, onUpdateStato, open, onClose }) {
  const [statoSelezionato, setStatoSelezionato] = React.useState(ordine.stato);

  const stati = [
    { value: 'da fare', label: 'Da Fare', color: 'error' },
    { value: 'in lavorazione', label: 'In Lavorazione', color: 'warning' },
    { value: 'completato', label: 'Completato', color: 'success' }
  ];

  const getColorChip = (stato) => {
    const statoTrovato = stati.find(s => s.value === stato);
    return statoTrovato ? statoTrovato.color : 'default';
  };

  const handleSalva = () => {
    onUpdateStato(ordine.id, statoSelezionato);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Gestione Stato Ordine</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          Ordine di: {ordine.nomeCliente}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Data ritiro: {ordine.dataRitiro} - {ordine.oraRitiro}
        </Typography>
        
        <List>
          {ordine.prodotti.map((prod, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`${prod.prodotto} - ${prod.quantita} ${prod.unita}`}
                secondary={prod.note}
              />
            </ListItem>
          ))}
        </List>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Stato attuale:
          <Chip
            label={stati.find(s => s.value === ordine.stato)?.label}
            color={getColorChip(ordine.stato)}
            sx={{ ml: 1 }}
          />
        </Typography>

        <Select
          fullWidth
          value={statoSelezionato}
          onChange={(e) => setStatoSelezionato(e.target.value)}
          sx={{ mt: 2 }}
        >
          {stati.map(stato => (
            <MenuItem key={stato.value} value={stato.value}>
              {stato.label}
            </MenuItem>
          ))}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button 
          variant="contained" 
          onClick={handleSalva}
          disabled={statoSelezionato === ordine.stato}
        >
          Salva
        </Button>
      </DialogActions>
    </Dialog>
  );
}