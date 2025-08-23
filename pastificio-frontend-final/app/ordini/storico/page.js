'use client';

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Search, FilterList, Print, Download } from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function StoricoOrdiniPage() {
  const [ordini, setOrdini] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStato, setFilterStato] = useState('tutti');
  const [filterPeriodo, setFilterPeriodo] = useState('tutti');

  useEffect(() => {
    // Carica ordini dal localStorage o API
    const ordiniSalvati = JSON.parse(localStorage.getItem('ordini') || '[]');
    setOrdini(ordiniSalvati);
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatoColor = (stato) => {
    const colors = {
      'nuovo': 'info',
      'in_lavorazione': 'warning',
      'completato': 'success',
      'annullato': 'error'
    };
    return colors[stato] || 'default';
  };

  const getStatoLabel = (stato) => {
    const labels = {
      'nuovo': 'Nuovo',
      'in_lavorazione': 'In Lavorazione',
      'completato': 'Completato',
      'annullato': 'Annullato'
    };
    return labels[stato] || stato;
  };

  const filteredOrdini = ordini.filter(ordine => {
    const matchSearch = ordine.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       ordine.id?.toString().includes(searchTerm);
    const matchStato = filterStato === 'tutti' || ordine.stato === filterStato;
    
    let matchPeriodo = true;
    if (filterPeriodo !== 'tutti') {
      const dataOrdine = new Date(ordine.dataRitiro);
      const oggi = new Date();
      
      switch(filterPeriodo) {
        case 'oggi':
          matchPeriodo = format(dataOrdine, 'yyyy-MM-dd') === format(oggi, 'yyyy-MM-dd');
          break;
        case 'settimana':
          const inizioSettimana = new Date(oggi);
          inizioSettimana.setDate(oggi.getDate() - 7);
          matchPeriodo = dataOrdine >= inizioSettimana;
          break;
        case 'mese':
          matchPeriodo = dataOrdine.getMonth() === oggi.getMonth() && 
                        dataOrdine.getFullYear() === oggi.getFullYear();
          break;
      }
    }
    
    return matchSearch && matchStato && matchPeriodo;
  });

  const exportData = () => {
    const dataStr = JSON.stringify(filteredOrdini, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ordini_${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Storico Ordini
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Cerca per cliente o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Stato</InputLabel>
            <Select
              value={filterStato}
              label="Stato"
              onChange={(e) => setFilterStato(e.target.value)}
            >
              <MenuItem value="tutti">Tutti</MenuItem>
              <MenuItem value="nuovo">Nuovo</MenuItem>
              <MenuItem value="in_lavorazione">In Lavorazione</MenuItem>
              <MenuItem value="completato">Completato</MenuItem>
              <MenuItem value="annullato">Annullato</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Periodo</InputLabel>
            <Select
              value={filterPeriodo}
              label="Periodo"
              onChange={(e) => setFilterPeriodo(e.target.value)}
            >
              <MenuItem value="tutti">Tutti</MenuItem>
              <MenuItem value="oggi">Oggi</MenuItem>
              <MenuItem value="settimana">Ultima Settimana</MenuItem>
              <MenuItem value="mese">Questo Mese</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton onClick={() => window.print()} title="Stampa">
            <Print />
          </IconButton>
          <IconButton onClick={exportData} title="Esporta">
            <Download />
          </IconButton>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Data Ritiro</TableCell>
              <TableCell>Ora Ritiro</TableCell>
              <TableCell align="right">Totale</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrdini
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((ordine) => (
                <TableRow key={ordine.id} hover>
                  <TableCell>{ordine.id}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{ordine.cliente}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ordine.telefono}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {format(new Date(ordine.dataRitiro), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>{ordine.oraRitiro}</TableCell>
                  <TableCell align="right">
                    € {ordine.totale?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatoLabel(ordine.stato || 'nuovo')}
                      color={getStatoColor(ordine.stato || 'nuovo')}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ 
                      maxWidth: 200, 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block'
                    }}>
                      {ordine.note || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOrdini.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Righe per pagina:"
        />
      </TableContainer>
    </Box>
  );
}