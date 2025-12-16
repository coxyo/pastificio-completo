// components/DaneaMonitor.js - DASHBOARD MONITOR DANEA
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function DaneaMonitor() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prodottiSconosciuti, setProdottiSconosciuti] = useState([]);

  // Carica stato monitor
  const caricaStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/danea/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Errore caricamento stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carica prodotti sconosciuti
  const caricaProdottiSconosciuti = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/danea/prodotti-sconosciuti`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProdottiSconosciuti(data.data);
      }
    } catch (error) {
      console.error('Errore caricamento prodotti sconosciuti:', error);
    }
  };

  // Avvia/Ferma monitor
  const toggleMonitor = async (azione) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/danea/${azione}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await caricaStats();
    } catch (error) {
      console.error(`Errore ${azione} monitor:`, error);
    }
  };

  useEffect(() => {
    caricaStats();
    caricaProdottiSconosciuti();
    
    // Refresh ogni 10 secondi
    const interval = setInterval(() => {
      caricaStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🏭 Monitor Danea EasyFatt
      </Typography>

      {/* Stato Monitor */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Stato Monitor
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={stats?.isRunning ? 'ATTIVO' : 'FERMO'}
                  color={stats?.isRunning ? 'success' : 'default'}
                  icon={stats?.isRunning ? <CheckIcon /> : <StopIcon />}
                />
                {stats?.isRunning ? (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => toggleMonitor('stop')}
                    startIcon={<StopIcon />}
                  >
                    Ferma
                  </Button>
                ) : (
                  <Button
                    size="small"
                    color="success"
                    onClick={() => toggleMonitor('start')}
                    startIcon={<PlayIcon />}
                  >
                    Avvia
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Fatture Processate
              </Typography>
              <Typography variant="h3" color="primary">
                {stats?.fattureProcessate || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Prodotti Caricati
              </Typography>
              <Typography variant="h3" color="success.main">
                {stats?.prodottiCaricati || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Non Riconosciuti
              </Typography>
              <Typography variant="h3" color="warning.main">
                {stats?.prodottiNonRiconosciuti || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info Cartella */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📂 Configurazione
          </Typography>
          <Typography variant="body2">
            <strong>Cartella monitorata:</strong> {stats?.cartella}
          </Typography>
          <Typography variant="body2">
            <strong>Cartella processati:</strong> {stats?.cartellaProcessati}
          </Typography>
          {stats?.ultimoProcessamento && (
            <Typography variant="body2">
              <strong>Ultimo processamento:</strong>{' '}
              {new Date(stats.ultimoProcessamento).toLocaleString('it-IT')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Prodotti Sconosciuti */}
      {prodottiSconosciuti.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              Prodotti Non Riconosciuti ({prodottiSconosciuti.length})
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Questi prodotti sono stati trovati nelle fatture ma non sono stati riconosciuti nel magazzino.
              Associali manualmente o configura il matching.
            </Alert>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Descrizione</TableCell>
                    <TableCell>Codice</TableCell>
                    <TableCell>Fornitore</TableCell>
                    <TableCell>Fattura</TableCell>
                    <TableCell>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prodottiSconosciuti.map((prodotto, index) => (
                    <TableRow key={index}>
                      <TableCell>{prodotto.descrizione}</TableCell>
                      <TableCell>{prodotto.codiceArticolo || '-'}</TableCell>
                      <TableCell>{prodotto.fornitore}</TableCell>
                      <TableCell>{prodotto.numeroFattura}</TableCell>
                      <TableCell>
                        {new Date(prodotto.dataFattura).toLocaleDateString('it-IT')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
