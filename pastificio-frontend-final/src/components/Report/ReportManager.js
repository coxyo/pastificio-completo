// components/Report/ReportManager.js
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  Label as LabelIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import itLocale from 'date-fns/locale/it';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ReportManager = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentReports, setRecentReports] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Stati per i form specifici
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [labelOptions, setLabelOptions] = useState({
    size: 'A4',
    cols: 3,
    rows: 8
  });

  useEffect(() => {
    loadTemplates();
    loadRecentReports();
  }, []);

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/report/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data.templates);
    } catch (err) {
      setError('Errore caricamento template');
      console.error(err);
    }
  };

  const loadRecentReports = () => {
    // Carica report recenti dal localStorage
    const recent = JSON.parse(localStorage.getItem('recentReports') || '[]');
    setRecentReports(recent.slice(0, 10)); // Ultimi 10 report
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let data = {};

      switch (selectedTemplate.id) {
        case 'daily':
          endpoint = '/report/daily';
          data = { data: selectedDate.toISOString().split('T')[0] };
          break;
        
        case 'weekly':
          endpoint = '/report/weekly';
          data = { settimana: selectedWeek, anno: selectedYear };
          break;
        
        case 'order':
          endpoint = `/report/order/${selectedOrder}`;
          break;
        
        case 'labels':
          endpoint = '/report/labels';
          data = { 
            prodotti: selectedProducts,
            options: labelOptions
          };
          break;
        
        default:
          throw new Error('Template non valido');
      }

      const response = await axios.post(
        `${API_URL}${endpoint}`,
        data,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      );

      // Crea URL per download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Salva nei report recenti
      const newReport = {
        id: Date.now(),
        template: selectedTemplate.nome,
        data: new Date().toISOString(),
        parametri: data
      };
      const updatedRecent = [newReport, ...recentReports].slice(0, 10);
      setRecentReports(updatedRecent);
      localStorage.setItem('recentReports', JSON.stringify(updatedRecent));

      setSuccess('Report generato con successo!');
      setDialogOpen(false);
    } catch (err) {
      setError('Errore generazione report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (templateId) => {
    switch (templateId) {
      case 'daily':
        return <CalendarIcon />;
      case 'weekly':
        return <ScheduleIcon />;
      case 'order':
        return <ReceiptIcon />;
      case 'labels':
        return <LabelIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  const renderTemplateForm = () => {
    if (!selectedTemplate) return null;

    switch (selectedTemplate.id) {
      case 'daily':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={itLocale}>
            <DatePicker
              label="Seleziona data"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        );
      
      case 'weekly':
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                type="number"
                label="Settimana"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                inputProps={{ min: 1, max: 53 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="number"
                label="Anno"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                inputProps={{ min: 2020, max: 2030 }}
                fullWidth
              />
            </Grid>
          </Grid>
        );
      
      case 'order':
        return (
          <TextField
            label="ID Ordine"
            value={selectedOrder}
            onChange={(e) => setSelectedOrder(e.target.value)}
            fullWidth
            helperText="Inserisci l'ID dell'ordine"
          />
        );
      
      case 'labels':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Opzioni etichette
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Formato</InputLabel>
                  <Select
                    value={labelOptions.size}
                    onChange={(e) => setLabelOptions({...labelOptions, size: e.target.value})}
                  >
                    <MenuItem value="A4">A4</MenuItem>
                    <MenuItem value="Letter">Letter</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  type="number"
                  label="Colonne"
                  value={labelOptions.cols}
                  onChange={(e) => setLabelOptions({...labelOptions, cols: parseInt(e.target.value)})}
                  inputProps={{ min: 1, max: 5 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  type="number"
                  label="Righe"
                  value={labelOptions.rows}
                  onChange={(e) => setLabelOptions({...labelOptions, rows: parseInt(e.target.value)})}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
            </Grid>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Seleziona i prodotti dalla lista ordini
            </Typography>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestione Report e Stampe
      </Typography>

      <Grid container spacing={3}>
        {/* Template disponibili */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Template Disponibili
            </Typography>
            <Grid container spacing={2}>
              {templates.map((template) => (
                <Grid item xs={12} sm={6} key={template.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getTemplateIcon(template.id)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {template.nome}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {template.descrizione}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<PrintIcon />}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setDialogOpen(true);
                        }}
                      >
                        Genera
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Report recenti */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Report Recenti
            </Typography>
            <List>
              {recentReports.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="Nessun report recente"
                    secondary="I report generati appariranno qui"
                  />
                </ListItem>
              ) : (
                recentReports.map((report, index) => (
                  <React.Fragment key={report.id}>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={report.template}
                        secondary={new Date(report.data).toLocaleString('it-IT')}
                      />
                      <Tooltip title="Rigenera">
                        <IconButton
                          size="small"
                          onClick={() => {
                            // Logica per rigenerare report
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItem>
                    {index < recentReports.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Azioni rapide */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Azioni Rapide
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={<CalendarIcon />}
                  onClick={() => {
                    setSelectedTemplate(templates.find(t => t.id === 'daily'));
                    setSelectedDate(new Date());
                    setDialogOpen(true);
                  }}
                >
                  Report Oggi
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={() => {
                    // Logica per inviare report via email
                  }}
                >
                  Invia Report Email
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => {
                    // Logica per programmare report automatici
                  }}
                >
                  Programma Report
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog generazione report */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate?.nome}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {renderTemplateForm()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Annulla
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerateReport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <PrintIcon />}
          >
            Genera Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per messaggi */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Helper function
function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

export default ReportManager;