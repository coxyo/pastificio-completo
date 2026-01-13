// components/RegistroCorrespettivi.js
// ✅ VERSIONE COMPLETA - REGISTRO CORRISPETTIVI ELETTRONICO
// Pastificio Nonna Claudia di Mameli Maurizio

import React, { useState, useEffect, useMemo } from 'react';
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
  Tab,
  Tabs,
  LinearProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  CalendarMonth as CalendarIcon,
  Euro as EuroIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================
// DATI AZIENDALI PRECOMPILATI
// ============================================
const DATI_AZIENDA = {
  ragioneSociale: 'PASTIFICIO NONNA CLAUDIA DI MAMELI MAURIZIO',
  indirizzo: 'VIA CARMINE 20B',
  cap: '09032',
  citta: 'ASSEMINI (CA)',
  partitaIva: '', // Da compilare
  codiceFiscale: '', // Da compilare
  responsabile: 'Mameli Maurizio'
};

// Mesi italiani
const MESI = [
  { id: 0, nome: 'Gennaio', abbr: 'GEN.' },
  { id: 1, nome: 'Febbraio', abbr: 'FEB.' },
  { id: 2, nome: 'Marzo', abbr: 'MAR.' },
  { id: 3, nome: 'Aprile', abbr: 'APR.' },
  { id: 4, nome: 'Maggio', abbr: 'MAG.' },
  { id: 5, nome: 'Giugno', abbr: 'GIU.' },
  { id: 6, nome: 'Luglio', abbr: 'LUG.' },
  { id: 7, nome: 'Agosto', abbr: 'AGO.' },
  { id: 8, nome: 'Settembre', abbr: 'SET.' },
  { id: 9, nome: 'Ottobre', abbr: 'OTT.' },
  { id: 10, nome: 'Novembre', abbr: 'NOV.' },
  { id: 11, nome: 'Dicembre', abbr: 'DIC.' }
];

// Aliquote IVA
const ALIQUOTE_IVA = [
  { percentuale: 22, descrizione: 'Aliquota ordinaria' },
  { percentuale: 10, descrizione: 'Aliquota ridotta' },
  { percentuale: 4, descrizione: 'Aliquota super-ridotta (alimentari base)' }
];

// ============================================
// COMPONENTE PRINCIPALE
// ============================================

export default function RegistroCorrespettivi({ onBack }) {
  // State
  const [loading, setLoading] = useState(true);
  const [annoCorrente, setAnnoCorrente] = useState(new Date().getFullYear());
  const [meseCorrente, setMeseCorrente] = useState(new Date().getMonth());
  const [corrispettivi, setCorrispettivi] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Dialog
  const [dialogNuovo, setDialogNuovo] = useState(false);
  const [dialogChiusura, setDialogChiusura] = useState(false);
  
  // Form nuovo corrispettivo
  const [nuovoCorrispettivo, setNuovoCorrispettivo] = useState({
    giorno: new Date().getDate(),
    totale: '',
    iva22: '',
    iva10: '',
    iva4: '',
    esente: '',
    fatturaDa: '',
    fatturaA: '',
    note: ''
  });

  // ============================================
  // EFFETTI
  // ============================================
  
  useEffect(() => {
    caricaCorrispettivi();
  }, [annoCorrente, meseCorrente]);

  // ============================================
  // API
  // ============================================
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const caricaCorrispettivi = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/corrispettivi?anno=${annoCorrente}&mese=${meseCorrente + 1}`,
        getAuthHeaders()
      );
      setCorrispettivi(response.data.corrispettivi || []);
    } catch (error) {
      console.error('Errore caricamento corrispettivi:', error);
      // Inizializza array vuoto per il mese
      setCorrispettivi([]);
    } finally {
      setLoading(false);
    }
  };

  const salvaCorrispettivo = async () => {
    try {
      // Calcola totale se non inserito
      let totale = parseFloat(nuovoCorrispettivo.totale) || 0;
      const iva22 = parseFloat(nuovoCorrispettivo.iva22) || 0;
      const iva10 = parseFloat(nuovoCorrispettivo.iva10) || 0;
      const iva4 = parseFloat(nuovoCorrispettivo.iva4) || 0;
      const esente = parseFloat(nuovoCorrispettivo.esente) || 0;
      
      if (totale === 0) {
        totale = iva22 + iva10 + iva4 + esente;
      }

      await axios.post(`${API_URL}/corrispettivi`, {
        anno: annoCorrente,
        mese: meseCorrente + 1,
        giorno: nuovoCorrispettivo.giorno,
        totale,
        dettaglioIva: {
          iva22,
          iva10,
          iva4,
          esente
        },
        fatture: {
          da: nuovoCorrispettivo.fatturaDa || null,
          a: nuovoCorrispettivo.fatturaA || null
        },
        note: nuovoCorrispettivo.note
      }, getAuthHeaders());

      showSnackbar('✅ Corrispettivo registrato!', 'success');
      setDialogNuovo(false);
      resetForm();
      caricaCorrispettivi();
    } catch (error) {
      console.error('Errore salvataggio:', error);
      showSnackbar('❌ Errore salvataggio', 'error');
    }
  };

  const eliminaCorrispettivo = async (id) => {
    if (!window.confirm('Eliminare questo corrispettivo?')) return;
    
    try {
      await axios.delete(`${API_URL}/corrispettivi/${id}`, getAuthHeaders());
      showSnackbar('✅ Corrispettivo eliminato', 'success');
      caricaCorrispettivi();
    } catch (error) {
      showSnackbar('❌ Errore eliminazione', 'error');
    }
  };

  const chiudiMese = async () => {
    try {
      await axios.post(`${API_URL}/corrispettivi/chiusura-mensile`, {
        anno: annoCorrente,
        mese: meseCorrente + 1
      }, getAuthHeaders());

      showSnackbar('✅ Mese chiuso e report inviato!', 'success');
      setDialogChiusura(false);
    } catch (error) {
      showSnackbar('❌ Errore chiusura mese', 'error');
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setNuovoCorrispettivo({
      giorno: new Date().getDate(),
      totale: '',
      iva22: '',
      iva10: '',
      iva4: '',
      esente: '',
      fatturaDa: '',
      fatturaA: '',
      note: ''
    });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '€ 0,00';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const parseNumber = (str) => {
    if (!str) return 0;
    // Gestisce sia formato italiano (1.234,56) che americano (1234.56)
    const normalized = str.toString().replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  // Giorni nel mese corrente
  const giorniNelMese = useMemo(() => {
    return new Date(annoCorrente, meseCorrente + 1, 0).getDate();
  }, [annoCorrente, meseCorrente]);

  // Crea array di tutti i giorni del mese
  const giorniMese = useMemo(() => {
    const giorni = [];
    for (let g = 1; g <= giorniNelMese; g++) {
      const corr = corrispettivi.find(c => c.giorno === g);
      giorni.push({
        giorno: g,
        data: corr || null
      });
    }
    return giorni;
  }, [giorniNelMese, corrispettivi]);

  // Calcoli totali
  const totali = useMemo(() => {
    const result = {
      totaleGenerale: 0,
      totaleIva22: 0,
      totaleIva10: 0,
      totaleIva4: 0,
      totaleEsente: 0,
      giorniConIncasso: 0
    };

    corrispettivi.forEach(c => {
      result.totaleGenerale += c.totale || 0;
      result.totaleIva22 += c.dettaglioIva?.iva22 || 0;
      result.totaleIva10 += c.dettaglioIva?.iva10 || 0;
      result.totaleIva4 += c.dettaglioIva?.iva4 || 0;
      result.totaleEsente += c.dettaglioIva?.esente || 0;
      if (c.totale > 0) result.giorniConIncasso++;
    });

    return result;
  }, [corrispettivi]);

  // Calcolo IVA dovuta
  const calcoloIva = useMemo(() => {
    // Scorporo IVA dai totali per aliquota
    const ivaScorporata22 = totali.totaleIva22 - (totali.totaleIva22 / 1.22);
    const ivaScorporata10 = totali.totaleIva10 - (totali.totaleIva10 / 1.10);
    const ivaScorporata4 = totali.totaleIva4 - (totali.totaleIva4 / 1.04);

    return {
      iva22: ivaScorporata22,
      iva10: ivaScorporata10,
      iva4: ivaScorporata4,
      totaleIva: ivaScorporata22 + ivaScorporata10 + ivaScorporata4
    };
  }, [totali]);

  // ============================================
  // EXPORT PDF
  // ============================================
  
  const esportaPDF = () => {
    // TODO: Implementare export PDF
    showSnackbar('Export PDF in sviluppo', 'info');
  };

  const esportaExcel = () => {
    // Crea CSV
    let csv = 'Giorno;Mese;Totale Corrispettivi;IVA 22%;IVA 10%;IVA 4%;Esente;Note\n';
    
    giorniMese.forEach(g => {
      const corr = g.data;
      csv += `${g.giorno};${MESI[meseCorrente].abbr};`;
      if (corr) {
        csv += `${corr.totale || 0};${corr.dettaglioIva?.iva22 || 0};${corr.dettaglioIva?.iva10 || 0};${corr.dettaglioIva?.iva4 || 0};${corr.dettaglioIva?.esente || 0};${corr.note || ''}\n`;
      } else {
        csv += '0;0;0;0;0;\n';
      }
    });

    // Aggiungi totali
    csv += `\nTOTALE;;${totali.totaleGenerale};${totali.totaleIva22};${totali.totaleIva10};${totali.totaleIva4};${totali.totaleEsente};\n`;

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Corrispettivi_${MESI[meseCorrente].nome}_${annoCorrente}.csv`;
    link.click();

    showSnackbar('✅ File CSV esportato!', 'success');
  };

  // ============================================
  // RENDER LOADING
  // ============================================
  
  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4, p: 3 }}>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2 }}>
          Caricamento registro corrispettivi...
        </Typography>
      </Box>
    );
  }

  // ============================================
  // RENDER PRINCIPALE
  // ============================================
  
  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* HEADER */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          bgcolor: '#1a237e', 
          color: 'white',
          borderRadius: 2,
          backgroundImage: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            {onBack && (
              <Button 
                startIcon={<BackIcon />} 
                onClick={onBack}
                sx={{ color: 'white', mb: 1 }}
              >
                Torna al menu
              </Button>
            )}
            <Typography variant="h4" fontWeight="bold">
              💰 REGISTRO DEI CORRISPETTIVI
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              {DATI_AZIENDA.ragioneSociale}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {DATI_AZIENDA.indirizzo} - {DATI_AZIENDA.cap} {DATI_AZIENDA.citta}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Chip 
              label={`Anno ${annoCorrente}`}
              color="warning"
              sx={{ mb: 1, fontWeight: 'bold' }}
            />
            <Typography variant="h5" fontWeight="bold">
              {MESI[meseCorrente].nome}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* SELETTORI ANNO/MESE */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Anno</InputLabel>
              <Select
                value={annoCorrente}
                onChange={(e) => setAnnoCorrente(e.target.value)}
                label="Anno"
              >
                {[2022, 2023, 2024, 2025, 2026].map(anno => (
                  <MenuItem key={anno} value={anno}>{anno}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Mese</InputLabel>
              <Select
                value={meseCorrente}
                onChange={(e) => setMeseCorrente(e.target.value)}
                label="Mese"
              >
                {MESI.map(mese => (
                  <MenuItem key={mese.id} value={mese.id}>{mese.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setDialogNuovo(true)}
              >
                Nuovo
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={caricaCorrispettivi}
              >
                Aggiorna
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={esportaExcel}
              >
                Excel
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<EmailIcon />}
                onClick={() => setDialogChiusura(true)}
              >
                Chiudi Mese
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* RIEPILOGO MENSILE */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <Card sx={{ bgcolor: '#e8f5e9', borderTop: '4px solid #4caf50' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                TOTALE MESE
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="success.dark">
                {formatCurrency(totali.totaleGenerale)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                IVA 22%
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(totali.totaleIva22)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                IVA 10%
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(totali.totaleIva10)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                IVA 4%
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(totali.totaleIva4)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                ESENTE
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(totali.totaleEsente)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card sx={{ bgcolor: '#fff3e0', borderTop: '4px solid #ff9800' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                IVA DOVUTA
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="warning.dark">
                {formatCurrency(calcoloIva.totaleIva)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TABELLA CORRISPETTIVI */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, bgcolor: '#1a237e', color: 'white' }}>
          <Typography variant="h6">
            📋 Registro Giornaliero - {MESI[meseCorrente].nome} {annoCorrente}
          </Typography>
        </Box>
        
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold', width: 60 }}>
                  Giorno
                </TableCell>
                <TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold', width: 60 }}>
                  Mese
                </TableCell>
                <TableCell sx={{ bgcolor: '#e8f5e9', fontWeight: 'bold' }} align="right">
                  TOTALE CORRISPETTIVI
                </TableCell>
                <TableCell sx={{ bgcolor: '#fff8e1', fontWeight: 'bold' }} align="center" colSpan={3}>
                  OPERAZIONI GIORNALIERE PER ALIQUOTA IVA
                </TableCell>
                <TableCell sx={{ bgcolor: '#fce4ec', fontWeight: 'bold' }} align="right">
                  ESENTE
                </TableCell>
                <TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold' }} align="center" colSpan={2}>
                  FATTURE
                </TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: 100 }}>
                  Azioni
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ bgcolor: '#e3f2fd' }}></TableCell>
                <TableCell sx={{ bgcolor: '#e3f2fd' }}></TableCell>
                <TableCell sx={{ bgcolor: '#e8f5e9' }}></TableCell>
                <TableCell sx={{ bgcolor: '#fff8e1', fontWeight: 'bold' }} align="right">22%</TableCell>
                <TableCell sx={{ bgcolor: '#fff8e1', fontWeight: 'bold' }} align="right">10%</TableCell>
                <TableCell sx={{ bgcolor: '#fff8e1', fontWeight: 'bold' }} align="right">4%</TableCell>
                <TableCell sx={{ bgcolor: '#fce4ec' }}></TableCell>
                <TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold' }} align="center">Dal n.</TableCell>
                <TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold' }} align="center">Al n.</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5' }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Riga Riporto */}
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell colSpan={2} sx={{ fontStyle: 'italic' }}>Riporto</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>€ 0,00</TableCell>
                <TableCell colSpan={7}></TableCell>
              </TableRow>

              {/* Righe giornaliere */}
              {giorniMese.map((g) => {
                const corr = g.data;
                const hasData = corr && corr.totale > 0;
                
                return (
                  <TableRow 
                    key={g.giorno}
                    sx={{ 
                      bgcolor: hasData ? '#ffffff' : '#f9f9f9',
                      '&:hover': { bgcolor: '#e3f2fd' }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 'bold' }}>{g.giorno}</TableCell>
                    <TableCell>{MESI[meseCorrente].abbr}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: hasData ? 'bold' : 'normal', color: hasData ? 'success.main' : 'text.secondary' }}>
                      {formatCurrency(corr?.totale || 0)}
                    </TableCell>
                    <TableCell align="right">
                      {corr?.dettaglioIva?.iva22 ? formatCurrency(corr.dettaglioIva.iva22) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {corr?.dettaglioIva?.iva10 ? formatCurrency(corr.dettaglioIva.iva10) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {corr?.dettaglioIva?.iva4 ? formatCurrency(corr.dettaglioIva.iva4) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {corr?.dettaglioIva?.esente ? formatCurrency(corr.dettaglioIva.esente) : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {corr?.fatture?.da || '-'}
                    </TableCell>
                    <TableCell align="center">
                      {corr?.fatture?.a || '-'}
                    </TableCell>
                    <TableCell>
                      {corr && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Modifica">
                            <IconButton size="small" onClick={() => {
                              setNuovoCorrispettivo({
                                giorno: corr.giorno,
                                totale: corr.totale?.toString() || '',
                                iva22: corr.dettaglioIva?.iva22?.toString() || '',
                                iva10: corr.dettaglioIva?.iva10?.toString() || '',
                                iva4: corr.dettaglioIva?.iva4?.toString() || '',
                                esente: corr.dettaglioIva?.esente?.toString() || '',
                                fatturaDa: corr.fatture?.da || '',
                                fatturaA: corr.fatture?.a || '',
                                note: corr.note || ''
                              });
                              setDialogNuovo(true);
                            }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Elimina">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => eliminaCorrispettivo(corr._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Riga Totali */}
              <TableRow sx={{ bgcolor: '#1a237e' }}>
                <TableCell colSpan={2} sx={{ color: 'white', fontWeight: 'bold' }}>
                  TOTALE {MESI[meseCorrente].nome.toUpperCase()}
                </TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {formatCurrency(totali.totaleGenerale)}
                </TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatCurrency(totali.totaleIva22)}
                </TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatCurrency(totali.totaleIva10)}
                </TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatCurrency(totali.totaleIva4)}
                </TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatCurrency(totali.totaleEsente)}
                </TableCell>
                <TableCell colSpan={3} sx={{ color: 'white' }}>
                  {totali.giorniConIncasso} giorni con incasso
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* RIEPILOGO IVA */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Riepilogo IVA Mensile
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                    <TableCell>Aliquota</TableCell>
                    <TableCell align="right">Imponibile</TableCell>
                    <TableCell align="right">IVA</TableCell>
                    <TableCell align="right">Totale</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>22%</TableCell>
                    <TableCell align="right">{formatCurrency(totali.totaleIva22 / 1.22)}</TableCell>
                    <TableCell align="right">{formatCurrency(calcoloIva.iva22)}</TableCell>
                    <TableCell align="right">{formatCurrency(totali.totaleIva22)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>10%</TableCell>
                    <TableCell align="right">{formatCurrency(totali.totaleIva10 / 1.10)}</TableCell>
                    <TableCell align="right">{formatCurrency(calcoloIva.iva10)}</TableCell>
                    <TableCell align="right">{formatCurrency(totali.totaleIva10)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>4%</TableCell>
                    <TableCell align="right">{formatCurrency(totali.totaleIva4 / 1.04)}</TableCell>
                    <TableCell align="right">{formatCurrency(calcoloIva.iva4)}</TableCell>
                    <TableCell align="right">{formatCurrency(totali.totaleIva4)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: '#fff3e0' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>TOTALE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency((totali.totaleIva22 / 1.22) + (totali.totaleIva10 / 1.10) + (totali.totaleIva4 / 1.04))}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                      {formatCurrency(calcoloIva.totaleIva)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(totali.totaleGenerale)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Responsabile: {DATI_AZIENDA.responsabile}
              </Typography>
              <Typography variant="body2">
                Report mensile inviato automaticamente al commercialista il 2° o 3° giorno del mese successivo.
              </Typography>
            </Alert>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Stampa Registro
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ============================================ */}
      {/* DIALOGS */}
      {/* ============================================ */}

      {/* DIALOG NUOVO CORRISPETTIVO */}
      <Dialog open={dialogNuovo} onClose={() => setDialogNuovo(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
          💰 Registra Corrispettivo Giornaliero
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Giorno</InputLabel>
                <Select
                  value={nuovoCorrispettivo.giorno}
                  onChange={(e) => setNuovoCorrispettivo({ ...nuovoCorrispettivo, giorno: e.target.value })}
                  label="Giorno"
                >
                  {Array.from({ length: giorniNelMese }, (_, i) => i + 1).map(g => (
                    <MenuItem key={g} value={g}>{g} {MESI[meseCorrente].abbr}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="TOTALE CORRISPETTIVI"
                type="number"
                value={nuovoCorrispettivo.totale}
                onChange={(e) => setNuovoCorrispettivo({ ...nuovoCorrispettivo, totale: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
                helperText="Lascia vuoto per calcolare automaticamente dalla somma delle aliquote"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Dettaglio per Aliquota IVA" size="small" />
              </Divider>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="IVA 22%"
                type="number"
                value={nuovoCorrispettivo.iva22}
                onChange={(e) => setNuovoCorrispettivo({ ...nuovoCorrispettivo, iva22: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="IVA 10%"
                type="number"
                value={nuovoCorrispettivo.iva10}
                onChange={(e) => setNuovoCorrispettivo({ ...nuovoCorrispettivo, iva10: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="IVA 4%"
                type="number"
                value={nuovoCorrispettivo.iva4}
                onChange={(e) => setNuovoCorrispettivo({ ...nuovoCorrispettivo, iva4: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Esente"
                type="number"
                value={nuovoCorrispettivo.esente}
                onChange={(e) => setNuovoCorrispettivo({ ...nuovoCorrispettivo, esente: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Fatture Emesse" size="small" />
              </Divider>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Fattura dal n."
                value={nuovoCorrispettivo.fatturaDa}
                onChange={(e) => setNuovoCorrispettivo({ ...nuovoCorrispettivo, fatturaDa: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Fattura al n."
                value={nuovoCorrispettivo.fatturaA}
                onChange={(e) => setNuovoCorrispettivo({ ...nuovoCorrispettivo, fatturaA: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={2}
                value={nuovoCorrispettivo.note}
                onChange={(e) => setNuovoCorrispettivo({ ...nuovoCorrispettivo, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setDialogNuovo(false); resetForm(); }}>
            Annulla
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={salvaCorrispettivo}
          >
            Salva Corrispettivo
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG CHIUSURA MESE */}
      <Dialog open={dialogChiusura} onClose={() => setDialogChiusura(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#ff9800', color: 'white' }}>
          📧 Chiusura Mensile e Invio Report
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2, mt: 1 }}>
            Stai per chiudere il mese di <strong>{MESI[meseCorrente].nome} {annoCorrente}</strong>.
          </Alert>

          <Typography variant="body1" gutterBottom>
            Riepilogo che verrà inviato al commercialista:
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography><strong>Totale Corrispettivi:</strong> {formatCurrency(totali.totaleGenerale)}</Typography>
            <Typography><strong>IVA 22%:</strong> {formatCurrency(totali.totaleIva22)}</Typography>
            <Typography><strong>IVA 10%:</strong> {formatCurrency(totali.totaleIva10)}</Typography>
            <Typography><strong>IVA 4%:</strong> {formatCurrency(totali.totaleIva4)}</Typography>
            <Typography><strong>Esente:</strong> {formatCurrency(totali.totaleEsente)}</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography color="warning.main" fontWeight="bold">
              <strong>IVA Dovuta:</strong> {formatCurrency(calcoloIva.totaleIva)}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogChiusura(false)}>
            Annulla
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<EmailIcon />}
            onClick={chiudiMese}
          >
            Chiudi Mese e Invia Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}