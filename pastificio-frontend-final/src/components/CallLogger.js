// src/components/CallLogger.js
// Componente per visualizzare lo storico delle chiamate in arrivo

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  CallReceived as IncomingIcon,
  CallMade as OutgoingIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

export default function CallLogger() {
  const [chiamate, setChiamate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totale: 0,
    oggi: 0,
    settimana: 0,
    conCliente: 0
  });

  // Carica chiamate al mount
  useEffect(() => {
    caricaChiamate();
  }, []);

  const caricaChiamate = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // ✅ FIX 12/12/2025: Usa API reale invece di dati mock
      const response = await fetch(`${API_URL}/chiamate?limit=100&sort=-timestamp`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Mappa i dati per compatibilità con il componente
        const chiamateMapped = result.data.map(c => ({
          _id: c._id,
          callId: c.callId,
          numero: c.numero || c.numeroOriginale,
          cliente: c.cliente,
          tipo: c.source === '3cx-extension' ? 'inbound' : 'outbound',
          stato: mapEsitoToStato(c.esito),
          timestamp: c.timestamp,
          durata: c.durata || 0
        }));
        
        setChiamate(chiamateMapped);
        calcolaStatistiche(chiamateMapped);
      } else {
        setChiamate([]);
        calcolaStatistiche([]);
      }

    } catch (err) {
      console.error('[CallLogger] Errore caricamento chiamate:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Mappa esito del backend a stato del frontend
  const mapEsitoToStato = (esito) => {
    const mapping = {
      'risposta': 'answered',
      'in_arrivo': 'ringing',
      'non_risposta': 'missed',
      'persa': 'missed',
      'occupato': 'busy',
      'completato': 'answered',
      'sconosciuto': 'unknown'
    };
    return mapping[esito] || 'unknown';
  };

  const calcolaStatistiche = (chiamate) => {
    const ora = new Date();
    const inizioGiorno = new Date(ora.getFullYear(), ora.getMonth(), ora.getDate());
    const inizioSettimana = new Date(ora);
    inizioSettimana.setDate(ora.getDate() - ora.getDay());

    setStats({
      totale: chiamate.length,
      oggi: chiamate.filter(c => new Date(c.timestamp) >= inizioGiorno).length,
      settimana: chiamate.filter(c => new Date(c.timestamp) >= inizioSettimana).length,
      conCliente: chiamate.filter(c => c.cliente).length
    });
  };

  const chiamateFiltrate = chiamate.filter(chiamata => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      chiamata.numero.includes(query) ||
      chiamata.cliente?.nome?.toLowerCase().includes(query) ||
      chiamata.cliente?.cognome?.toLowerCase().includes(query) ||
      chiamata.cliente?.codice?.toLowerCase().includes(query)
    );
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Errore caricamento chiamate: {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Statistiche */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PhoneIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totale}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chiamate Totali
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TimeIcon color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.oggi}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Oggi
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <IncomingIcon color="info" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.settimana}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Questa Settimana
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PersonIcon color="secondary" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.conCliente}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Con Cliente
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ricerca */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Cerca per numero, nome cliente o codice..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {/* Tabella Chiamate */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data/Ora</TableCell>
              <TableCell>Numero</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Durata</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chiamateFiltrate
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((chiamata) => (
                <TableRow key={chiamata._id} hover>
                  <TableCell>
                    {format(new Date(chiamata.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon fontSize="small" color="action" />
                      {chiamata.numero}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {chiamata.cliente ? (
                      <Box>
                        <Typography variant="body2">
                          {chiamata.cliente.nome} {chiamata.cliente.cognome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {chiamata.cliente.codice}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip label="Sconosciuto" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {chiamata.tipo === 'inbound' ? (
                      <Chip 
                        icon={<IncomingIcon />}
                        label="In arrivo" 
                        size="small" 
                        color="primary" 
                      />
                    ) : (
                      <Chip 
                        icon={<OutgoingIcon />}
                        label="In uscita" 
                        size="small" 
                        color="default" 
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        chiamata.stato === 'answered' ? 'Risposta' :
                        chiamata.stato === 'missed' ? 'Persa' :
                        chiamata.stato === 'busy' ? 'Occupato' : 'N/D'
                      }
                      size="small"
                      color={
                        chiamata.stato === 'answered' ? 'success' :
                        chiamata.stato === 'missed' ? 'error' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {chiamata.durata ? `${Math.floor(chiamata.durata / 60)}:${(chiamata.durata % 60).toString().padStart(2, '0')}` : '-'}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={chiamateFiltrate.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Righe per pagina:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
        />
      </TableContainer>

      {/* Messaggio se nessuna chiamata */}
      {chiamateFiltrate.length === 0 && (
        <Box textAlign="center" py={6}>
          <PhoneIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Nessuna chiamata trovata
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery ? 'Prova a modificare i filtri di ricerca' : 'Le chiamate in arrivo appariranno qui'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
