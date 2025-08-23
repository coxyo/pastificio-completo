// frontend/src/components/Report/index.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Grid,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  TextField,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Alert
} from '@mui/material';
import { 
  Print, 
  GetApp, 
  Assessment, 
  Description,
  CalendarToday,
  TrendingUp,
  Receipt,
  Label
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import { format, getWeek, getYear } from 'date-fns';
import reportService from '../../services/reportService';
import { api } from '../../services/api';
import { toast } from 'react-toastify';

const ReportManager = ({ initialReportType }) => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState(initialReportType || 'daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [ordiniGiorno, setOrdiniGiorno] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [printOptions, setPrintOptions] = useState({
    pageBreak: true,
    showPrices: true,
    showNotes: true
  });

  useEffect(() => {
    if (reportType === 'daily') {
      loadOrdiniGiorno();
    }
  }, [selectedDate, reportType]);

  const loadOrdiniGiorno = async () => {
    try {
      const ordini = await api.caricaOrdini();
      const ordiniFiltered = ordini.filter(ordine => {
        const dataOrdine = new Date(ordine.dataRitiro);
        return dataOrdine.toDateString() === selectedDate.toDateString();
      });
      setOrdiniGiorno(ordiniFiltered);
    } catch (error) {
      console.error('Errore caricamento ordini:', error);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let url;
      const token = localStorage.getItem('token');
      
      switch(reportType) {
        case 'daily':
          const response = await fetch('/api/report/daily', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ data: selectedDate })
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_giornaliero_${format(selectedDate, 'yyyy-MM-dd')}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Report giornaliero generato');
          }
          break;
          
        case 'weekly':
          const week = getWeek(selectedDate, { locale: it });
          const year = getYear(selectedDate);
          
          const weekResponse = await fetch('/api/report/weekly', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ settimana: week, anno: year })
          });
          
          if (weekResponse.ok) {
            const blob = await weekResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_settimanale_${week}_${year}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Report settimanale generato');
          }
          break;
          
        case 'print':
          if (selectedOrders.length === 0) {
            toast.warning('Seleziona almeno un ordine da stampare');
            return;
          }
          reportService.generatePrintDocument(selectedOrders, printOptions);
          toast.success('Documento di stampa generato');
          break;
          
        case 'csv':
          if (ordiniGiorno.length === 0) {
            toast.warning('Nessun ordine da esportare');
            return;
          }
          reportService.exportToCSV(ordiniGiorno);
          toast.success('File CSV esportato');
          break;
      }
    } catch (error) {
      console.error('Errore generazione report:', error);
      toast.error('Errore nella generazione del report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSingleOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/report/order/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ricevuta_ordine_${orderId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Ricevuta ordine generata');
      }
    } catch (error) {
      console.error('Errore stampa ordine:', error);
      toast.error('Errore nella stampa dell\'ordine');
    }
  };

  const reportTypes = [
    {
      value: 'daily',
      label: 'Report Giornaliero',
      icon: <CalendarToday />,
      description: 'Riepilogo completo degli ordini del giorno'
    },
    {
      value: 'weekly',
      label: 'Report Settimanale',
      icon: <TrendingUp />,
      description: 'Analisi settimanale con trend e statistiche'
    },
    {
      value: 'print',
      label: 'Stampa Ordini',
      icon: <Print />,
      description: 'Stampa ordini selezionati'
    },
    {
      value: 'csv',
      label: 'Esporta CSV',
      icon: <GetApp />,
      description: 'Esporta ordini in formato CSV'
    }
  ];

  const getWeekNumber = (date) => {
    return getWeek(date, { locale: it });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestione Report e Stampe
        </Typography>
        
        <Grid container spacing={3}>
          {/* Selezione tipo report */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Seleziona Tipo Report
            </Typography>
            <Grid container spacing={2}>
              {reportTypes.map(type => (
                <Grid item xs={12} sm={6} md={3} key={type.value}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: reportType === type.value ? 2 : 1,
                      borderColor: reportType === type.value ? 'primary.main' : 'grey.300',
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                    onClick={() => setReportType(type.value)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {type.icon}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {type.label}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {type.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Configurazione report */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Configurazione Report
              </Typography>
              
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Seleziona Data"
                    value={selectedDate}
                    onChange={(newDate) => setSelectedDate(newDate)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                
                {reportType === 'weekly' && (
                  <Grid item xs={12} md={4}>
                    <Chip 
                      label={`Settimana ${getWeekNumber(selectedDate)} del ${getYear(selectedDate)}`}
                      color="primary"
                      sx={{ height: 40, fontSize: '1rem' }}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Assessment />}
                    onClick={handleGenerateReport}
                    disabled={loading}
                    sx={{ height: '56px' }}
                  >
                    {loading ? 'Generazione...' : 'Genera Report'}
                  </Button>
                </Grid>
              </Grid>

              {/* Opzioni di stampa */}
              {reportType === 'print' && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Opzioni di Stampa
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Interruzione Pagina</InputLabel>
                        <Select
                          value={printOptions.pageBreak}
                          onChange={(e) => setPrintOptions({...printOptions, pageBreak: e.target.value})}
                        >
                          <MenuItem value={true}>Ogni Ordine</MenuItem>
                          <MenuItem value={false}>Continuo</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Mostra Prezzi</InputLabel>
                        <Select
                          value={printOptions.showPrices}
                          onChange={(e) => setPrintOptions({...printOptions, showPrices: e.target.value})}
                        >
                          <MenuItem value={true}>Sì</MenuItem>
                          <MenuItem value={false}>No</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Mostra Note</InputLabel>
                        <Select
                          value={printOptions.showNotes}
                          onChange={(e) => setPrintOptions({...printOptions, showNotes: e.target.value})}
                        >
                          <MenuItem value={true}>Sì</MenuItem>
                          <MenuItem value={false}>No</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Lista ordini per stampa/export */}
          {(reportType === 'print' || reportType === 'csv') && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Ordini del {format(selectedDate, 'dd/MM/yyyy')} ({ordiniGiorno.length} ordini)
                </Typography>
                
                {ordiniGiorno.length === 0 ? (
                  <Alert severity="info">
                    Nessun ordine trovato per questa data
                  </Alert>
                ) : (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Button
                        size="small"
                        onClick={() => setSelectedOrders(ordiniGiorno)}
                      >
                        Seleziona Tutti
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setSelectedOrders([])}
                        sx={{ ml: 1 }}
                      >
                        Deseleziona Tutti
                      </Button>
                    </Box>
                    
                    <Grid container spacing={2}>
                      {ordiniGiorno.map(ordine => (
                        <Grid item xs={12} sm={6} md={4} key={ordine._id}>
                          <Card 
                            sx={{ 
                              cursor: 'pointer',
                              bgcolor: selectedOrders.find(o => o._id === ordine._id) ? 'action.selected' : 'background.paper'
                            }}
                            onClick={() => {
                              const isSelected = selectedOrders.find(o => o._id === ordine._id);
                              if (isSelected) {
                                setSelectedOrders(selectedOrders.filter(o => o._id !== ordine._id));
                              } else {
                                setSelectedOrders([...selectedOrders, ordine]);
                              }
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {ordine.nomeCliente}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Ore {ordine.oraRitiro} - {ordine.prodotti.length} prodotti
                                  </Typography>
                                  <Typography variant="body2" color="primary">
                                    € {ordine.totale?.toFixed(2) || '0.00'}
                                  </Typography>
                                </Box>
                                <Tooltip title="Stampa ricevuta">
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrintSingleOrder(ordine._id);
                                    }}
                                  >
                                    <Receipt />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportManager;