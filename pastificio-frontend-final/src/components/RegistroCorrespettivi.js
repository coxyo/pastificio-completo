// components/RegistroCorrespettivi.js
// COMPONENTE FRONTEND COMPLETO PER REGISTRO CORRISPETTIVI
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Euro as EuroIcon,
  CalendarMonth as CalendarIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PASSWORD_CORRISPETTIVI = 'corrispettivi2025';

/**
 * COMPONENTE PRINCIPALE REGISTRO CORRISPETTIVI
 */
export default function RegistroCorrespettivi() {
  // Stati
  const [passwordVerificata, setPasswordVerificata] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Dati
  const [corrispettivi, setCorrespettivi] = useState([]);
  const [annoSelezionato, setAnnoSelezionato] = useState(new Date().getFullYear());
  const [meseSelezionato, setMeseSelezionato] = useState(new Date().getMonth() + 1);
  const [statisticheMese, setStatisticheMese] = useState(null);
  const [statisticheAnno, setStatisticheAnno] = useState(null);
  
  // Dialog
  const [dialogNuovo, setDialogNuovo] = useState(false);
  const [dialogPassword, setDialogPassword] = useState(true);
  const [dialogModifica, setDialogModifica] = useState(false);
  const [corrispettivoCorrente, setCorrespettivoCorrente] = useState(null);
  
  // Form nuova registrazione
  const [nuovoCorresp, setNuovoCorresp] = useState({
    data: new Date().toISOString().split('T')[0],
    totaleCorrispettivi: '',
    note: ''
  });
  
  // Tab corrente
  const [tabCorrente, setTabCorrente] = useState(0);

  /**
   * VERIFICA PASSWORD
   */
  const verificaPassword = () => {
    if (passwordInput === PASSWORD_CORRISPETTIVI) {
      setPasswordVerificata(true);
      setDialogPassword(false);
      sessionStorage.setItem('corrispettivi_password', PASSWORD_CORRISPETTIVI);
      caricaDati();
    } else {
      setSnackbar({
        open: true,
        message: '❌ Password errata!',
        severity: 'error'
      });
    }
  };

  /**
   * CARICA DATI
   */
  const caricaDati = async () => {
    try {
      setLoading(true);
      const password = sessionStorage.getItem('corrispettivi_password');
      
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'x-corrispettivi-password': password
      };

      // Carica mese corrente
      const resMese = await axios.get(
        `${API_URL}/api/corrispettivi/mese/${annoSelezionato}/${meseSelezionato}`,
        { headers }
      );
      
      setCorrespettivi(resMese.data.corrispettivi || []);
      setStatisticheMese({
        totaleCorrispettivi: resMese.data.totaleCorrispettivi,
        imponibile10: resMese.data.imponibile10,
        iva10: resMese.data.iva10,
        giorni: resMese.data.giorni
      });

      // Carica statistiche anno
      const resAnno = await axios.get(
        `${API_URL}/api/corrispettivi/anno/${annoSelezionato}`,
        { headers }
      );
      
      setStatisticheAnno(resAnno.data.data);

    } catch (error) {
      console.error('Errore caricamento dati:', error);
      setSnackbar({
        open: true,
        message: '❌ Errore caricamento dati',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * REGISTRA NUOVO CORRISPETTIVO
   */
  const registraCorresp = async () => {
    try {
      setLoading(true);
      const password = sessionStorage.getItem('corrispettivi_password');
      
      await axios.post(
        `${API_URL}/api/corrispettivi/registra`,
        nuovoCorresp,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-corrispettivi-password': password
          }
        }
      );

      setSnackbar({
        open: true,
        message: '✅ Corrispettivo registrato con successo!',
        severity: 'success'
      });

      setDialogNuovo(false);
      setNuovoCorresp({
        data: new Date().toISOString().split('T')[0],
        totaleCorrispettivi: '',
        note: ''
      });
      
      caricaDati();

    } catch (error) {
      console.error('Errore registrazione:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || '❌ Errore registrazione',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * CHIUSURA MENSILE
   */
  const inviaChiusuraMensile = async () => {
    if (!window.confirm(`Inviare chiusura mensile di ${getMeseNome(meseSelezionato)} ${annoSelezionato}?`)) {
      return;
    }

    try {
      setLoading(true);
      const password = sessionStorage.getItem('corrispettivi_password');
      
      await axios.post(
        `${API_URL}/api/corrispettivi/chiusura-mensile/${annoSelezionato}/${meseSelezionato}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-corrispettivi-password': password
          }
        }
      );

      setSnackbar({
        open: true,
        message: '✅ Chiusura mensile inviata con successo!',
        severity: 'success'
      });

    } catch (error) {
      console.error('Errore chiusura mensile:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || '❌ Errore invio chiusura',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * ESPORTA CSV
   */
  const esportaCSV = () => {
    if (!corrispettivi.length) return;

    let csv = 'Data,Giorno,Mese,Totale Corrispettivi,Imponibile 10%,IVA 10%,Note\n';
    
    corrispettivi.forEach(c => {
      const data = new Date(c.data).toLocaleDateString('it-IT');
      csv += `${data},${c.giorno},${c.mese},${c.totaleCorrispettivi.toFixed(2)},${c.imponibile10.toFixed(2)},${c.iva10.toFixed(2)},"${c.note || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrispettivi_${annoSelezionato}_${String(meseSelezionato).padStart(2, '0')}.csv`;
    a.click();
  };

  /**
   * UTILITY
   */
  const getMeseNome = (mese) => {
    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    return mesi[mese - 1];
  };

  // Effect: verifica password salvata
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('corrispettivi_password');
    if (savedPassword === PASSWORD_CORRISPETTIVI) {
      setPasswordVerificata(true);
      setDialogPassword(false);
    }
  }, []);

  // Effect: carica dati quando cambiano anno/mese
  useEffect(() => {
    if (passwordVerificata) {
      caricaDati();
    }
  }, [annoSelezionato, meseSelezionato, passwordVerificata]);

  /**
   * RENDER: DIALOG PASSWORD
   */
  if (!passwordVerificata) {
    return (
      <Dialog open={dialogPassword} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon />
            <Typography variant="h6">🔒 Registro Corrispettivi</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Inserisci la password per accedere al registro corrispettivi
          </Alert>
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && verificaPassword()}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={verificaPassword} variant="contained" disabled={!passwordInput}>
            Accedi
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  /**
   * RENDER: INTERFACCIA PRINCIPALE
   */
  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          💰 Registro Corrispettivi
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogNuovo(true)}
          >
            Nuovo Corrispettivo
          </Button>
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={inviaChiusuraMensile}
            disabled={!corrispettivi.length}
          >
            Invia Chiusura
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={esportaCSV}
            disabled={!corrispettivi.length}
          >
            Esporta CSV
          </Button>
        </Box>
      </Box>

      {/* SELEZIONE ANNO/MESE */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Anno</InputLabel>
                <Select
                  value={annoSelezionato}
                  label="Anno"
                  onChange={(e) => setAnnoSelezionato(e.target.value)}
                >
                  {[2022, 2023, 2024, 2025, 2026].map(anno => (
                    <MenuItem key={anno} value={anno}>{anno}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Mese</InputLabel>
                <Select
                  value={meseSelezionato}
                  label="Mese"
                  onChange={(e) => setMeseSelezionato(e.target.value)}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(mese => (
                    <MenuItem key={mese} value={mese}>{getMeseNome(mese)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* TOTALI MESE */}
            {statisticheMese && (
              <>
                <Grid item xs={12} md={2}>
                  <Typography variant="subtitle2" color="text.secondary">Giorni apertura</Typography>
                  <Typography variant="h6">{statisticheMese.giorni}</Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="subtitle2" color="text.secondary">Totale Mese</Typography>
                  <Typography variant="h6">€{statisticheMese.totaleCorrispettivi?.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="subtitle2" color="text.secondary">IVA 10%</Typography>
                  <Typography variant="h6">€{statisticheMese.iva10?.toFixed(2)}</Typography>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* TABS */}
      <Card>
        <Tabs value={tabCorrente} onChange={(e, v) => setTabCorrente(v)}>
          <Tab label="📊 Registro Mensile" />
          <Tab label="📈 Statistiche Anno" />
        </Tabs>

        <CardContent>
          {/* TAB 0: REGISTRO MENSILE */}
          {tabCorrente === 0 && (
            <>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : corrispettivi.length === 0 ? (
                <Alert severity="info">
                  Nessun corrispettivo registrato per {getMeseNome(meseSelezionato)} {annoSelezionato}
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Giorno</TableCell>
                        <TableCell>Mese</TableCell>
                        <TableCell align="right">Totale Corrispettivi</TableCell>
                        <TableCell align="right">Imponibile 10%</TableCell>
                        <TableCell align="right">IVA 10%</TableCell>
                        <TableCell>Note</TableCell>
                        <TableCell>Azioni</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {corrispettivi.map((c) => (
                        <TableRow key={c._id}>
                          <TableCell>{new Date(c.data).toLocaleDateString('it-IT')}</TableCell>
                          <TableCell>{c.giorno}</TableCell>
                          <TableCell><Chip label={c.mese} size="small" /></TableCell>
                          <TableCell align="right">€{c.totaleCorrispettivi.toFixed(2)}</TableCell>
                          <TableCell align="right">€{c.imponibile10.toFixed(2)}</TableCell>
                          <TableCell align="right">€{c.iva10.toFixed(2)}</TableCell>
                          <TableCell>{c.note || '-'}</TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => {
                              setCorrespettivoCorrente(c);
                              setDialogModifica(true);
                            }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {/* TAB 1: STATISTICHE ANNO */}
          {tabCorrente === 1 && statisticheAnno && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">Totale Anno</Typography>
                  <Typography variant="h4">€{statisticheAnno.totaleAnno?.totaleCorrispettivi?.toFixed(2)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">Imponibile</Typography>
                  <Typography variant="h4">€{statisticheAnno.totaleAnno?.imponibile10?.toFixed(2)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">Giorni Apertura</Typography>
                  <Typography variant="h4">{statisticheAnno.giorniAperti}</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* DIALOG NUOVO CORRISPETTIVO */}
      <Dialog open={dialogNuovo} onClose={() => setDialogNuovo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>💰 Registra Corrispettivo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              type="date"
              label="Data"
              value={nuovoCorresp.data}
              onChange={(e) => setNuovoCorresp({ ...nuovoCorresp, data: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="number"
              label="Totale Corrispettivi"
              value={nuovoCorresp.totaleCorrispettivi}
              onChange={(e) => setNuovoCorresp({ ...nuovoCorresp, totaleCorrispettivi: e.target.value })}
              InputProps={{
                startAdornment: <EuroIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
            {nuovoCorresp.totaleCorrispettivi && (
              <Alert severity="info">
                <strong>Imponibile:</strong> €{(parseFloat(nuovoCorresp.totaleCorrispettivi) / 1.10).toFixed(2)}<br />
                <strong>IVA 10%:</strong> €{((parseFloat(nuovoCorresp.totaleCorrispettivi) / 1.10) * 0.10).toFixed(2)}
              </Alert>
            )}
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Note (opzionale)"
              value={nuovoCorresp.note}
              onChange={(e) => setNuovoCorresp({ ...nuovoCorresp, note: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogNuovo(false)}>Annulla</Button>
          <Button
            variant="contained"
            onClick={registraCorresp}
            disabled={!nuovoCorresp.data || !nuovoCorresp.totaleCorrispettivi || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Registra'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}