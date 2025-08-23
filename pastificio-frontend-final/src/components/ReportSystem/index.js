// src/components/ReportSystem/index.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, IconButton, Tooltip, CircularProgress, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import { 
  PictureAsPdf as PdfIcon,
  Description as ExcelIcon,
  Label as LabelIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import reportService from '../../services/reportService';

export default function ReportSystem({ ordini = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedReport, setSelectedReport] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('giorno');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedCliente, setSelectedCliente] = useState('');
  const [previewDialog, setPreviewDialog] = useState(false);
  const [templates, setTemplates] = useState([]);

  // Carica template disponibili
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await reportService.fetchTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Errore caricamento template:', error);
    }
  };

  // Lista clienti unici
  const clientiUnici = [...new Set(ordini.map(o => o.nomeCliente))].sort();

  // Tipi di report disponibili
  const reportTypes = [
    {
      id: 'riepilogo-giornaliero',
      nome: 'Riepilogo Giornaliero',
      icon: <ReceiptIcon />,
      descrizione: 'Report completo degli ordini del giorno',
      formati: ['pdf', 'excel'],
      parametri: ['data']
    },
    {
      id: 'riepilogo-settimanale',
      nome: 'Riepilogo Settimanale',
      icon: <CalendarIcon />,
      descrizione: 'Report settimanale con statistiche',
      formati: ['pdf', 'excel'],
      parametri: ['data']
    },
    {
      id: 'riepilogo-mensile',
      nome: 'Riepilogo Mensile',
      icon: <CalendarIcon />,
      descrizione: 'Report mensile dettagliato',
      formati: ['pdf', 'excel'],
      parametri: ['data']
    },
    {
      id: 'report-cliente',
      nome: 'Report Cliente',
      icon: <PersonIcon />,
      descrizione: 'Storico ordini per cliente specifico',
      formati: ['pdf', 'excel', 'csv'],
      parametri: ['cliente', 'dateRange']
    },
    {
      id: 'bolla-consegna',
      nome: 'Bolla di Consegna',
      icon: <PdfIcon />,
      descrizione: 'Documento di consegna per ordine',
      formati: ['pdf'],
      parametri: ['ordine']
    },
    {
      id: 'etichette-prodotti',
      nome: 'Etichette Prodotti',
      icon: <LabelIcon />,
      descrizione: 'Etichette adesive per confezioni',
      formati: ['pdf'],
      parametri: ['ordine']
    },
    {
      id: 'statistiche',
      nome: 'Report Statistiche',
      icon: <StatsIcon />,
      descrizione: 'Analisi vendite e top prodotti/clienti',
      formati: ['pdf', 'excel'],
      parametri: ['dateRange']
    }
  ];

  // Genera report
  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let url = '';
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      switch (selectedReport) {
        case 'riepilogo-giornaliero':
          url = `${backendUrl}/api/reports/ordini?periodo=giorno&formato=${selectedFormat}&data=${selectedDate}`;
          break;
        case 'riepilogo-settimanale':
          url = `${backendUrl}/api/reports/ordini?periodo=settimana&formato=${selectedFormat}&data=${selectedDate}`;
          break;
        case 'riepilogo-mensile':
          url = `${backendUrl}/api/reports/ordini?periodo=mese&formato=${selectedFormat}&data=${selectedDate}`;
          break;
        case 'report-cliente':
          url = `${backendUrl}/api/reports/cliente/${selectedCliente}?formato=${selectedFormat}&dataInizio=${dateRange.start}&dataFine=${dateRange.end}`;
          break;
        case 'statistiche':
          url = `${backendUrl}/api/reports/statistiche?dataInizio=${dateRange.start}&dataFine=${dateRange.end}`;
          break;
        default:
          throw new Error('Tipo di report non valido');
      }

      // Scarica il file
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Errore nella generazione del report');
      }

      // Crea blob e scarica
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Nome file
      const filename = `report_${selectedReport}_${format(new Date(), 'yyyyMMdd_HHmmss')}.${selectedFormat}`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess('Report generato e scaricato con successo!');
    } catch (error) {
      console.error('Errore generazione report:', error);
      setError(error.message || 'Errore nella generazione del report');
    } finally {
      setLoading(false);
    }
  };

  // Genera documento per ordine specifico
  const generateOrderDocument = async (ordineId, tipo) => {
    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      let url = '';
      if (tipo === 'consegna') {
        url = `${backendUrl}/api/reports/consegna/${ordineId}`;
      } else if (tipo === 'etichette') {
        url = `${backendUrl}/api/reports/etichette/${ordineId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Errore nella generazione del documento');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${tipo}_${ordineId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess('Documento generato con successo!');
    } catch (error) {
      console.error('Errore:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Ottieni parametri richiesti per il report selezionato
  const getReportParameters = () => {
    const report = reportTypes.find(r => r.id === selectedReport);
    return report ? report.parametri : [];
  };

  // Verifica se il report può essere generato
  const canGenerateReport = () => {
    if (!selectedReport) return false;
    
    const params = getReportParameters();
    
    if (params.includes('cliente') && !selectedCliente) return false;
    if (params.includes('ordine') && !selectedCliente) return false; // Qui selectedCliente rappresenta l'ordine
    
    return true;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Sistema Report e Stampe
      </Typography>

      {/* Messaggi di stato */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Selezione tipo report */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Seleziona Tipo di Report
        </Typography>
        
        <Grid container spacing={2}>
          {reportTypes.map(report => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: selectedReport === report.id ? 2 : 0,
                  borderColor: 'primary.main',
                  '&:hover': { boxShadow: 3 }
                }}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    {report.icon}
                    <Typography variant="h6" ml={1}>
                      {report.nome}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {report.descrizione}
                  </Typography>
                  <Box mt={1}>
                    {report.formati.map(formato => (
                      <Chip 
                        key={formato}
                        label={formato.toUpperCase()}
                        size="small"
                        sx={{ mr: 0.5 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Parametri report */}
      {selectedReport && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Parametri Report
          </Typography>
          
          <Grid container spacing={2}>
            {/* Formato output */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Formato</InputLabel>
                <Select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  label="Formato"
                >
                  {reportTypes.find(r => r.id === selectedReport)?.formati.map(formato => (
                    <MenuItem key={formato} value={formato}>
                      {formato.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Data (per report giornalieri/settimanali/mensili) */}
            {getReportParameters().includes('data') && (
              <Grid item xs={12} md={4}>
                <TextField
                  label="Data"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            {/* Range date */}
            {getReportParameters().includes('dateRange') && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Data Inizio"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Data Fine"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            {/* Cliente */}
            {getReportParameters().includes('cliente') && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Cliente</InputLabel>
                  <Select
                    value={selectedCliente}
                    onChange={(e) => setSelectedCliente(e.target.value)}
                    label="Cliente"
                  >
                    <MenuItem value="">
                      <em>Seleziona cliente</em>
                    </MenuItem>
                    {clientiUnici.map(cliente => (
                      <MenuItem key={cliente} value={cliente}>
                        {cliente}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>

          {/* Pulsanti azione */}
          <Box mt={3} display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={generateReport}
              disabled={!canGenerateReport() || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
            >
              Genera Report
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setPreviewDialog(true)}
              disabled={!canGenerateReport()}
              startIcon={<PreviewIcon />}
            >
              Anteprima
            </Button>
          </Box>
        </Paper>
      )}

      {/* Lista ordini recenti per documenti */}
      {(selectedReport === 'bolla-consegna' || selectedReport === 'etichette-prodotti') && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ordini Recenti
          </Typography>
          
          <List>
            {ordini.slice(0, 10).map(ordine => (
              <ListItem key={ordine._id} divider>
                <ListItemText
                  primary={`${ordine.nomeCliente} - ${format(new Date(ordine.dataRitiro), 'dd/MM/yyyy', { locale: it })}`}
                  secondary={`${ordine.prodotti.length} prodotti - Tel: ${ordine.telefono || 'N/D'}`}
                />
                <ListItemSecondaryAction>
                  {selectedReport === 'bolla-consegna' && (
                    <Tooltip title="Genera Bolla di Consegna">
                      <IconButton
                        edge="end"
                        onClick={() => generateOrderDocument(ordine._id, 'consegna')}
                        disabled={loading}
                      >
                        <PdfIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {selectedReport === 'etichette-prodotti' && (
                    <Tooltip title="Genera Etichette">
                      <IconButton
                        edge="end"
                        onClick={() => generateOrderDocument(ordine._id, 'etichette')}
                        disabled={loading}
                      >
                        <LabelIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Dialog anteprima (placeholder) */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Anteprima Report</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            L'anteprima del report sarà disponibile nella prossima versione.
            Per ora, puoi generare direttamente il report completo.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}