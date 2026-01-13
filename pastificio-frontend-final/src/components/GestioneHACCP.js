// components/GestioneHACCP.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  LinearProgress,
  IconButton
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Icone emoji per compatibilità
const FridgeIcon = () => <span style={{fontSize: '1.2rem'}}>❄️</span>;
const ThermometerIcon = () => <span style={{fontSize: '1.2rem'}}>🌡️</span>;
const CleanIcon = () => <span style={{fontSize: '1.2rem'}}>🧹</span>;
const ReportIcon = () => <span style={{fontSize: '1.2rem'}}>📊</span>;
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * COMPONENTE GESTIONE HACCP
 * Dashboard completa per gestione manuale HACCP
 */
export default function GestioneHACCP() {
  const [tabCorrente, setTabCorrente] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog registrazione temperatura
  const [dialogTemp, setDialogTemp] = useState(false);
  const [nuovaTemp, setNuovaTemp] = useState({
    dispositivo: 'Frigo 1',
    temperatura: '',
    tipo: 'temperatura_frigo'
  });

  // Dialog controllo igienico
  const [dialogIgienico, setDialogIgienico] = useState(false);
  const [controlloIgienico, setControlloIgienico] = useState({
    area: '',
    elementi: []
  });

  // Carica dashboard
  useEffect(() => {
    caricaDashboard();
  }, []);

  const caricaDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/haccp/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error('Errore caricamento dashboard HACCP:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * REGISTRA TEMPERATURA
   */
  const registraTemperatura = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/haccp/temperatura`, nuovaTemp, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setDialogTemp(false);
      setNuovaTemp({ dispositivo: 'Frigo 1', temperatura: '', tipo: 'temperatura_frigo' });
      caricaDashboard();
      alert('✅ Temperatura registrata con successo!');
    } catch (error) {
      console.error('Errore registrazione temperatura:', error);
      alert('❌ Errore registrazione temperatura');
    }
  };

  /**
   * REGISTRA CONTROLLO IGIENICO
   */
  const registraControlloIgien = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/haccp/controllo-igienico`, controlloIgienico, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setDialogIgienico(false);
      setControlloIgienico({ area: '', elementi: [] });
      caricaDashboard();
      alert('✅ Controllo igienico registrato!');
    } catch (error) {
      console.error('Errore registrazione controllo:', error);
      alert('❌ Errore registrazione controllo');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2 }}>
          Caricamento dashboard HACCP...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          🌡️ Gestione HACCP
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={caricaDashboard}
            sx={{ mr: 1 }}
          >
            Aggiorna
          </Button>
          <Button
            variant="contained"
            startIcon={<ReportIcon />}
            color="primary"
          >
            Report PDF
          </Button>
        </Box>
      </Box>

      {/* STATISTICHE RAPIDE */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Registrazioni (7gg)
              </Typography>
              <Typography variant="h3">
                {dashboard?.riepilogo.totaleRegistrazioni || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ✅ Conformi
              </Typography>
              <Typography variant="h3">
                {dashboard?.riepilogo.conformi || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'error.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ❌ Non Conformi
              </Typography>
              <Typography variant="h3">
                {dashboard?.riepilogo.nonConformi || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚠️ Richiedono Attenzione
              </Typography>
              <Typography variant="h3">
                {dashboard?.riepilogo.richiedonoAttenzione || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TEMPERATURE ATTUALI */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            🌡️ Temperature Attuali
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <FridgeIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Frigo Principale
                  </Typography>
                  <Typography variant="h4">
                    {dashboard?.temperatureAttuali.frigo?.valore || '--'}°C
                  </Typography>
                  <Typography variant="caption">
                    Range: 0-4°C
                  </Typography>
                </Box>
                {dashboard?.temperatureAttuali.frigo?.conforme ? (
                  <CheckIcon sx={{ ml: 'auto', color: 'success.main' }} />
                ) : (
                  <WarningIcon sx={{ ml: 'auto', color: 'error.main' }} />
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <AcUnit sx={{ fontSize: 40, mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Congelatore Principale
                  </Typography>
                  <Typography variant="h4">
                    {dashboard?.temperatureAttuali.congelatore?.valore || '--'}°C
                  </Typography>
                  <Typography variant="caption">
                    Range: -18/-25°C
                  </Typography>
                </Box>
                {dashboard?.temperatureAttuali.congelatore?.conforme ? (
                  <CheckIcon sx={{ ml: 'auto', color: 'success.main' }} />
                ) : (
                  <WarningIcon sx={{ ml: 'auto', color: 'error.main' }} />
                )}
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<ThermometerIcon />}
              onClick={() => setDialogTemp(true)}
              fullWidth
            >
              Registra Nuova Temperatura
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* TABS */}
      <Card>
        <Tabs value={tabCorrente} onChange={(e, v) => setTabCorrente(v)}>
          <Tab label="📊 Dashboard" />
          <Tab label="❌ Non Conformità" />
          <Tab label="⚠️ Da Verificare" />
          <Tab label="📋 Controlli" />
        </Tabs>

        <CardContent>
          {/* TAB 0: DASHBOARD */}
          {tabCorrente === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Statistiche Mensili
              </Typography>
              {dashboard?.statisticheMensili && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2">Totale</Typography>
                      <Typography variant="h4">{dashboard.statisticheMensili.totale}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                      <Typography variant="subtitle2">Conformi</Typography>
                      <Typography variant="h4">{dashboard.statisticheMensili.conformi}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                      <Typography variant="subtitle2">Non Conformi</Typography>
                      <Typography variant="h4">{dashboard.statisticheMensili.nonConformi}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          {/* TAB 1: NON CONFORMITÀ */}
          {tabCorrente === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Non Conformità Recenti
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data/Ora</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Dettagli</TableCell>
                      <TableCell>Azione</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard?.nonConformita?.map((nc, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {new Date(nc.dataOra).toLocaleString('it-IT')}
                        </TableCell>
                        <TableCell>
                          <Chip label={nc.tipo} size="small" color="error" />
                        </TableCell>
                        <TableCell>{nc.note || 'N/A'}</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            Risolvi
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 2: DA VERIFICARE */}
          {tabCorrente === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Richiedono Attenzione
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data/Ora</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Dettagli</TableCell>
                      <TableCell>Stato</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard?.richiedonoAttenzione?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {new Date(item.dataOra).toLocaleString('it-IT')}
                        </TableCell>
                        <TableCell>
                          <Chip label={item.tipo} size="small" color="warning" />
                        </TableCell>
                        <TableCell>{item.note || 'N/A'}</TableCell>
                        <TableCell>
                          {item.conforme ? (
                            <Chip label="Conforme" color="success" size="small" />
                          ) : (
                            <Chip label="Non Conforme" color="error" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 3: CONTROLLI */}
          {tabCorrente === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Registra Nuovi Controlli
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ThermometerIcon />}
                    onClick={() => setDialogTemp(true)}
                  >
                    Temperatura
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<CleanIcon />}
                    onClick={() => setDialogIgienico(true)}
                  >
                    Controllo Igienico
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* DIALOG REGISTRAZIONE TEMPERATURA */}
      <Dialog open={dialogTemp} onClose={() => setDialogTemp(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🌡️ Registra Temperatura</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Dispositivo"
            value={nuovaTemp.dispositivo}
            onChange={(e) => setNuovaTemp({ ...nuovaTemp, dispositivo: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            SelectProps={{ native: true }}
          >
            <option value="Frigo 1">Frigo 1 (principale)</option>
            <option value="Congelatore principale">Congelatore principale</option>
          </TextField>

          <TextField
            select
            fullWidth
            label="Tipo"
            value={nuovaTemp.tipo}
            onChange={(e) => setNuovaTemp({ ...nuovaTemp, tipo: e.target.value })}
            sx={{ mb: 2 }}
            SelectProps={{ native: true }}
          >
            <option value="temperatura_frigo">Frigorifero (0-4°C)</option>
            <option value="temperatura_congelatore">Congelatore (-18/-25°C)</option>
          </TextField>

          <TextField
            fullWidth
            label="Temperatura (°C)"
            type="number"
            value={nuovaTemp.temperatura}
            onChange={(e) => setNuovaTemp({ ...nuovaTemp, temperatura: parseFloat(e.target.value) })}
            inputProps={{ step: 0.1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogTemp(false)}>Annulla</Button>
          <Button
            variant="contained"
            onClick={registraTemperatura}
            disabled={!nuovaTemp.temperatura}
          >
            Registra
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG CONTROLLO IGIENICO */}
      <Dialog open={dialogIgienico} onClose={() => setDialogIgienico(false)} maxWidth="md" fullWidth>
        <DialogTitle>🧹 Controllo Igienico</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Area"
            value={controlloIgienico.area}
            onChange={(e) => setControlloIgienico({ ...controlloIgienico, area: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            placeholder="es: Laboratorio produzione"
          />
          {/* TODO: Aggiungere elementi da controllare dinamicamente */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogIgienico(false)}>Annulla</Button>
          <Button
            variant="contained"
            onClick={registraControlloIgien}
            disabled={!controlloIgienico.area}
          >
            Registra
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}