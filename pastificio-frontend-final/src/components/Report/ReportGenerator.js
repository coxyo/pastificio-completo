// src/components/Report/ReportGenerator.js
import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Divider,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Stack,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { it } from 'date-fns/locale';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// Clienti di esempio
const clientiEsempio = [
  { id: 1, nome: 'Mario Rossi', telefono: '123456789' },
  { id: 2, nome: 'Ristorante Da Luigi', telefono: '987654321' },
  { id: 3, nome: 'Pizzeria Napoli', telefono: '456123789' },
  { id: 4, nome: 'Hotel Bellavista', telefono: '789456123' },
  { id: 5, nome: 'Catering Eventi Deluxe', telefono: '321654987' }
];

// Ordini di esempio
const ordiniEsempio = [
  { id: 1, cliente: 'Mario Rossi', dataRitiro: '2025-03-15', totale: 45.50 },
  { id: 2, cliente: 'Ristorante Da Luigi', dataRitiro: '2025-03-15', totale: 120.00 },
  { id: 3, cliente: 'Pizzeria Napoli', dataRitiro: '2025-03-16', totale: 75.80 }
];

// Template disponibili
const templatesDisponibili = [
  { id: 1, nome: 'Template Standard Report', tipo: 'report' },
  { id: 2, nome: 'Documento di Consegna', tipo: 'consegna' },
  { id: 3, nome: 'Fattura Semplice', tipo: 'fattura' },
  { id: 4, nome: 'Report Dettagliato', tipo: 'report' }
];

const ReportGenerator = ({ onGenerateReport }) => {
  const [reportType, setReportType] = useState('giorno');
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [cliente, setCliente] = useState(null);
  const [templateId, setTemplateId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeTotals, setIncludeTotals] = useState(true);
  const [outputFormat, setOutputFormat] = useState('pdf');

  // Aggiorna le date in base al tipo di report
  const handleReportTypeChange = (newType) => {
    setReportType(newType);
    
    const today = new Date();
    
    switch (newType) {
      case 'settimana':
        setDateFrom(startOfWeek(today, { weekStartsOn: 1 }));
        setDateTo(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case 'mese':
        setDateFrom(startOfMonth(today));
        setDateTo(endOfMonth(today));
        break;
      default:
        setDateFrom(today);
        setDateTo(today);
        break;
    }
    
    // Imposta il template predefinito in base al tipo
    const defaultTemplate = templatesDisponibili.find(t => 
      (newType === 'consegna' && t.tipo === 'consegna') || 
      (newType !== 'consegna' && t.tipo === 'report')
    );
    
    if (defaultTemplate) {
      setTemplateId(defaultTemplate.id);
    }
  };

  // Gestisce la generazione del report
  const handleGenerate = () => {
    // Controlli di validazione base
    if (!templateId) {
      alert('Seleziona un template');
      return;
    }
    
    if (reportType === 'cliente' && !cliente) {
      alert('Seleziona un cliente');
      return;
    }
    
    if (reportType === 'consegna' && !selectedOrder) {
      alert('Seleziona un ordine');
      return;
    }
    
    // Raccogli i parametri
    const params = {
      tipo: reportType,
      template: templateId,
      dataInizio: format(dateFrom, 'yyyy-MM-dd'),
      dataFine: format(dateTo, 'yyyy-MM-dd'),
      clienteId: cliente?.id,
      ordineId: selectedOrder?.id,
      opzioni: {
        includeHeaders,
        includeDetails,
        includeTotals,
        outputFormat
      }
    };
    
    console.log('Parametri report:', params);
    
    // Notifica al componente padre
    if (onGenerateReport) {
      onGenerateReport(reportType);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generazione Report
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo Report</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => handleReportTypeChange(e.target.value)}
                label="Tipo Report"
              >
                <MenuItem value="giorno">Report Giornaliero</MenuItem>
                <MenuItem value="settimana">Report Settimanale</MenuItem>
                <MenuItem value="mese">Report Mensile</MenuItem>
                <MenuItem value="cliente">Report per Cliente</MenuItem>
                <MenuItem value="consegna">Documento di Consegna</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                label="Template"
              >
                {templatesDisponibili
                  .filter(t => 
                    reportType === 'consegna' ? t.tipo === 'consegna' : t.tipo === 'report'
                  )
                  .map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.nome}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>

          {/* Campi data in base al tipo di report */}
          {reportType === 'giorno' && (
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Data"
                value={dateFrom}
                onChange={(newValue) => setDateFrom(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
          )}

          {(reportType === 'settimana' || reportType === 'mese') && (
            <>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Data Inizio"
                  value={dateFrom}
                  onChange={(newValue) => setDateFrom(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Data Fine"
                  value={dateTo}
                  onChange={(newValue) => setDateTo(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </>
          )}

          {/* Selezione cliente per report cliente */}
          {reportType === 'cliente' && (
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={clientiEsempio}
                getOptionLabel={(option) => option.nome}
                value={cliente}
                onChange={(event, newValue) => {
                  setCliente(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente"
                    fullWidth
                  />
                )}
              />
            </Grid>
          )}

          {/* Selezione ordine per documento di consegna */}
          {reportType === 'consegna' && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Seleziona Ordine
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  {ordiniEsempio.map((ordine) => (
                    <Box
                      key={ordine.id}
                      sx={{
                        p: 2,
                        mb: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: selectedOrder?.id === ordine.id ? 'primary.main' : 'divider',
                        bgcolor: selectedOrder?.id === ordine.id ? 'action.selected' : 'background.paper',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedOrder(ordine)}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            Ordine #{ordine.id} - {ordine.cliente}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Data: {new Date(ordine.dataRitiro).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          € {ordine.totale.toFixed(2)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Box display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showAdvanced}
                    onChange={() => setShowAdvanced(!showAdvanced)}
                  />
                }
                label="Opzioni avanzate"
              />
            </Box>
          </Grid>

          {showAdvanced && (
            <>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Formato Output</InputLabel>
                  <Select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    label="Formato Output"
                  >
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="excel">Excel</MenuItem>
                    <MenuItem value="html">HTML</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <Stack direction="row" spacing={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeHeaders}
                        onChange={(e) => setIncludeHeaders(e.target.checked)}
                      />
                    }
                    label="Includi intestazioni"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeDetails}
                        onChange={(e) => setIncludeDetails(e.target.checked)}
                      />
                    }
                    label="Includi dettagli"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeTotals}
                        onChange={(e) => setIncludeTotals(e.target.checked)}
                      />
                    }
                    label="Includi totali"
                  />
                </Stack>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Divider sx={{ mb: 2, mt: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerate}
                size="large"
                sx={{ minWidth: 150 }}
              >
                Genera Report
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </LocalizationProvider>
  );
};

export default ReportGenerator;