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
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Search, 
  Add, 
  Edit, 
  Delete,
  MoreVert,
  Phone,
  Email,
  LocationOn,
  Star
} from '@mui/icons-material';

export default function AnagraficaClientiPage() {
  const [clienti, setClienti] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [clienteSelezionato, setClienteSelezionato] = useState(null);

  useEffect(() => {
    const clientiSalvati = JSON.parse(localStorage.getItem('clienti') || '[]');
    setClienti(clientiSalvati);
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleMenuOpen = (event, cliente) => {
    setAnchorEl(event.currentTarget);
    setClienteSelezionato(cliente);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setClienteSelezionato(null);
  };

  const handleDeleteCliente = () => {
    if (clienteSelezionato && confirm('Confermi l\'eliminazione del cliente?')) {
      const clientiAggiornati = clienti.filter(c => c.id !== clienteSelezionato.id);
      setClienti(clientiAggiornati);
      localStorage.setItem('clienti', JSON.stringify(clientiAggiornati));
    }
    handleMenuClose();
  };

  const filteredClienti = clienti.filter(cliente =>
    cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cognome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.ragioneSociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono?.includes(searchTerm)
  );

  const clientiPrivati = filteredClienti.filter(c => c.tipo === 'privato');
  const clientiAziende = filteredClienti.filter(c => c.tipo === 'azienda');

  const getInitials = (cliente) => {
    if (cliente.tipo === 'privato') {
      return `${cliente.nome?.[0] || ''}${cliente.cognome?.[0] || ''}`.toUpperCase();
    }
    return cliente.ragioneSociale?.substring(0, 2).toUpperCase() || '';
  };

  const renderClientiTable = (clientiList) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Cliente</TableCell>
            <TableCell>Contatti</TableCell>
            <TableCell>Indirizzo</TableCell>
            <TableCell>Ordini</TableCell>
            <TableCell>Fidelity</TableCell>
            <TableCell align="center">Azioni</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clientiList.map((cliente) => (
            <TableRow key={cliente.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getInitials(cliente)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {cliente.tipo === 'privato' 
                        ? `${cliente.nome} ${cliente.cognome}`
                        : cliente.ragioneSociale
                      }
                    </Typography>
                    {cliente.tipo === 'azienda' && (
                      <Typography variant="caption" color="text.secondary">
                        P.IVA: {cliente.partitaIva}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone fontSize="small" />
                    <Typography variant="body2">{cliente.telefono}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Email fontSize="small" />
                    <Typography variant="body2">{cliente.email}</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'start', gap: 0.5 }}>
                  <LocationOn fontSize="small" />
                  <Typography variant="body2">
                    {cliente.indirizzo}, {cliente.citta}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {cliente.numeroOrdini || 0} ordini
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Totale: € {cliente.totaleSpeso?.toFixed(2) || '0.00'}
                </Typography>
              </TableCell>
              <TableCell>
                {cliente.isFidelity ? (
                  <Chip 
                    icon={<Star />} 
                    label="Gold" 
                    color="warning" 
                    size="small" 
                  />
                ) : (
                  <Chip label="Standard" size="small" />
                )}
              </TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, cliente)}
                >
                  <MoreVert />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Anagrafica Clienti
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => window.location.href = '/clienti/nuovo'}
        >
          Nuovo Cliente
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Cerca cliente per nome, email o telefono..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Tutti (${filteredClienti.length})`} />
          <Tab label={`Privati (${clientiPrivati.length})`} />
          <Tab label={`Aziende (${clientiAziende.length})`} />
        </Tabs>
      </Box>

      {tabValue === 0 && renderClientiTable(filteredClienti)}
      {tabValue === 1 && renderClientiTable(clientiPrivati)}
      {tabValue === 2 && renderClientiTable(clientiAziende)}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          window.location.href = `/clienti/modifica/${clienteSelezionato?.id}`;
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} /> Modifica
        </MenuItem>
        <MenuItem onClick={() => {
          window.location.href = `/clienti/${clienteSelezionato?.id}/ordini`;
          handleMenuClose();
        }}>
          Visualizza Ordini
        </MenuItem>
        <MenuItem onClick={handleDeleteCliente} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Elimina
        </MenuItem>
      </Menu>
    </Box>
  );
}