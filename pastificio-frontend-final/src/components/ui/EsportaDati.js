'use client'
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  TextField
} from '@mui/material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function EsportaDati({ ordini, onClose, open }) {
  const [formatoEsportazione, setFormatoEsportazione] = React.useState('csv');
  const [dataInizio, setDataInizio] = React.useState(
    format(new Date().setDate(1), 'yyyy-MM-dd')
  );
  const [dataFine, setDataFine] = React.useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  const esportaCSV = (ordini) => {
    const headers = [
      'Data Ritiro',
      'Ora Ritiro',
      'Cliente',
      'Telefono',
      'Prodotti',
      'Totale',
      'Da Viaggio',
      'Note'
    ].join(',');

    const rows = ordini.map(ordine => {
      const prodotti = ordine.prodotti
        .map(p => `${p.prodotto} (${p.quantita} ${p.unita})`)
        .join('; ');
      
      const totale = ordine.prodotti
        .reduce((sum, p) => sum + p.prezzo, 0)
        .toFixed(2);

      return [
        ordine.dataRitiro,
        ordine.oraRitiro,
        ordine.nomeCliente.replace(/,/g, ' '),
        ordine.telefono,
        prodotti.replace(/,/g, ' '),
        totale,
        ordine.daViaggio ? 'Sì' : 'No',
        ordine.note.replace(/,/g, ' ')
      ].join(',');
    });

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ordini_${dataInizio}_${dataFine}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const esportaExcel = (ordini) => {
    // Implementare l'esportazione Excel
    console.log('Esportazione Excel non ancora implementata');
  };

  const handleEsporta = () => {
    const ordiniFiltrati = ordini.filter(ordine => 
      ordine.dataRitiro >= dataInizio && ordine.dataRitiro <= dataFine
    );

    if (formatoEsportazione === 'csv') {
      esportaCSV(ordiniFiltrati);
    } else if (formatoEsportazione === 'excel') {
      esportaExcel(ordiniFiltrati);
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Esporta Dati</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>Formato</InputLabel>
          <Select
            value={formatoEsportazione}
            onChange={(e) => setFormatoEsportazione(e.target.value)}
          >
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="excel">Excel</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Data Inizio"
          type="date"
          value={dataInizio}
          onChange={(e) => setDataInizio(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Data Fine"
          type="date"
          value={dataFine}
          onChange={(e) => setDataFine(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button variant="contained" onClick={handleEsporta}>
          Esporta
        </Button>
      </DialogActions>
    </Dialog>
  );
}