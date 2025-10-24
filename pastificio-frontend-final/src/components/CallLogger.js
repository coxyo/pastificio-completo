// src/components/CallLogger.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
  Avatar
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PhoneIncoming as IncomingIcon,
  PhoneOutgoing as OutgoingIcon,
  PhoneMissed as MissedIcon,
  PhoneCallback as CallbackIcon,
  Notes as NotesIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

function CallLogger() {
  const [chiamate, setChiamate] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totale, setTotale] = useState(0);

  // Filtri
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStato, setFiltroStato] = useState('');
  const [filtroEsito, setFiltroEsito] = useState('');
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');

  // Statistiche
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Dialog note
  const [dialogNote, setDialogNote] = useState(null);
  const [notaEdit, setNotaEdit] = useState('');

  useEffect(() => {
    caricaChiamate();
    caricaStatistiche();
  }, [page, rowsPerPage, filtroTipo, filtroStato, filtroEsito, dataInizio, dataFine]);

  const caricaChiamate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        limit: rowsPerPage,
        skip: page * rowsPerPage
      });

      if (filtroTipo) params.append('tipo', filtroTipo);
      if (filtroStato) params.append('stato', filtroStato);
      if (filtroEsito) params.append('esito', filtroEsito);
      if (dataInizio) params.append('startDate', dataInizio);
      if (dataFine) params.append('endDate', dataFine);

      const response = await fetch(
        `${API_URL}/cx3/history?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChiamate(data.chiamate || []);
        setTotale(data.count || 0);
      }

    } catch (error) {
      console.error('[CALL LOGGER] Errore caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const caricaStatistiche = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (dataInizio) params.append('startDate', dataInizio);
      if (dataFine) params.append('endDate', dataFine);

      const response = await fetch(
        `${API_URL}/cx3/stats?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.statistiche);
      }

    } catch (error) {
      console.error('[CALL LOGGER] Errore statistiche:', error);
    }
  };

  const handleSaveNota = async () => {
    if (!dialogNote || !notaEdit.trim()) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_URL}/cx3/chiamate/${dialogNote._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ note: notaEdit })
        }
      );

      if (response.ok) {
        caricaChiamate();
        setDialogNote(null);
        setNotaEdit('');
      }

    } catch (error) {
      console.error('[CALL LOGGER] Errore salvataggio nota:', error);
    }
  };

  const getIconaTipo = (tipo) => {
    return tipo === 'inbound' 
      ? <IncomingIcon fontSize="small" color="primary" />
      : <OutgoingIcon fontSize="small" color="success" />;
  };

  const getChipStato = (chiamata) => {
    const { stato, esito } = chiamata;

    if (esito === 'persa') {
      return <Chip label="Persa" size="small" color="error" icon={<MissedIcon />} />;
    }

    if (esito === 'risposta') {
      return <Chip label="Risposta" size="small" color="success" />;
    }

    const statiConfig = {
      ringing: { label: 'Squilla', color: 'info' },
      answered: { label: 'Risposta', color: 'success' },
      ended: { label: 'Terminata', color: 'default' },
      missed: { label: 'Persa', color: 'error' },
      busy: { label: 'Occupato', color: 'warning' }
    };

    const config = statiConfig[stato] || { label: stato, color: 'default' };
    return <Chip label={config.label} size="small" color={config.color} />;
  };

  const formatDurata = (secondi) => {
    if (!secondi || secondi === 0) return '-';
    
    const minuti = Math.floor(secondi / 60);
    const sec = secondi % 60;
    
    if (minuti > 0) {
      return `${minuti}m ${sec}s`;
    }
    return `${sec}s`;
  };

  return (
    <Box>
      {/* Header con Statistiche */}
      {showStats && stats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {stats.totaleChiamate}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Totale Chiamate
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {stats.chiamateRisposte}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Risposte
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {stats.chiamatePerse}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Perse
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {stats.tassoRisposta}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasso Risposta
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Card Principale */}
      <Card>
        <CardContent>
          {/* Toolbar */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
              <PhoneIcon />
              Storico Chiamate
            </Typography>

            <Box display="flex" gap={1}>
              <Tooltip title="Mostra/Nascondi Statistiche">
                <IconButton
                  onClick={() => setShowStats(!showStats)}
                  color={showStats ? 'primary' : 'default'}
                >
                  <StatsIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Aggiorna">
                <IconButton onClick={caricaChiamate}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Filtri */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Tipo"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                size="small"
              >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="inbound">In Arrivo</MenuItem>
                <MenuItem value="outbound">In Uscita</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Esito"
                value={filtroEsito}
                onChange={(e) => setFiltroEsito(e.target.value)}
                size="small"
              >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="risposta">Risposta</MenuItem>
                <MenuItem value="persa">Persa</MenuItem>
                <MenuItem value="occupato">Occupato</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                type="date"
                fullWidth
                label="Da"
                value={dataInizio}
                onChange={(e) => setDataInizio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                type="date"
                fullWidth
                label="A"
                value={dataFine}
                onChange={(e) => setDataFine(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFiltroTipo('');
                  setFiltroStato('');
                  setFiltroEsito('');
                  setDataInizio('');
                  setDataFine('');
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>

          {/* Tabella */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Data/Ora</TableCell>
                  <TableCell>Numero</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell align="right">Durata</TableCell>
                  <TableCell align="center">Azioni</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Caricamento...
                    </TableCell>
                  </TableRow>
                ) : chiamate.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Nessuna chiamata trovata
                    </TableCell>
                  </TableRow>
                ) : (
                  chiamate.map((chiamata) => (
                    <TableRow key={chiamata._id} hover>
                      <TableCell>
                        {getIconaTipo(chiamata.tipo)}
                      </TableCell>

                      <TableCell>
                        {format(new Date(chiamata.dataOraInizio), 'dd/MM/yyyy HH:mm', { locale: it })}
                      </TableCell>

                      <TableCell>
                        {chiamata.tipo === 'inbound' 
                          ? chiamata.numeroChiamante 
                          : chiamata.numeroChiamato}
                      </TableCell>

                      <TableCell>
                        {chiamata.clienteNome || (
                          <Typography variant="body2" color="text.secondary">
                            Sconosciuto
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {getChipStato(chiamata)}
                      </TableCell>

                      <TableCell align="right">
                        {formatDurata(chiamata.durataChiamata)}
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Aggiungi Nota">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setDialogNote(chiamata);
                              setNotaEdit(chiamata.note || '');
                            }}
                          >
                            <NotesIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {chiamata.esito === 'persa' && (
                          <Tooltip title="Richiedi Callback">
                            <IconButton
                              size="small"
                              color="error"
                            >
                              <CallbackIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={totale}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Righe per pagina:"
          />
        </CardContent>
      </Card>

      {/* Dialog Note */}
      <Dialog open={!!dialogNote} onClose={() => setDialogNote(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Note Chiamata</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Note"
            value={notaEdit}
            onChange={(e) => setNotaEdit(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogNote(null)}>Annulla</Button>
          <Button onClick={handleSaveNota} variant="contained" color="primary">
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CallLogger;