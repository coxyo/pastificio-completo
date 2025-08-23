// src/components/Report/ReportAvanzati.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportAvanzati = () => {
  const [tipoReport, setTipoReport] = useState('vendite');
  const [periodo, setPeriodo] = useState('mese');
  const [dataInizio, setDataInizio] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [dataFine, setDataFine] = useState(new Date());
  const [datiReport, setDatiReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Tipi di report disponibili
  const tipiReport = [
    { value: 'vendite', label: 'Report Vendite', icon: <TrendingUpIcon /> },
    { value: 'prodotti', label: 'Report Prodotti', icon: <AssessmentIcon /> },
    { value: 'clienti', label: 'Report Clienti', icon: <AssessmentIcon /> },
    { value: 'produzione', label: 'Report Produzione', icon: <AssessmentIcon /> },
    { value: 'magazzino', label: 'Report Magazzino', icon: <AssessmentIcon /> },
    { value: 'fatturato', label: 'Report Fatturato', icon: <TrendingUpIcon /> },
  ];

  useEffect(() => {
    caricaDatiReport();
  }, [tipoReport, periodo, dataInizio, dataFine]);

  const caricaDatiReport = async () => {
    setLoading(true);
    try {
      // Simula caricamento dati - sostituire con chiamata API reale
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dati di esempio basati sul tipo di report
      const dati = generaDatiEsempio(tipoReport);
      setDatiReport(dati);
    } catch (error) {
      console.error('Errore caricamento report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generaDatiEsempio = (tipo) => {
    switch (tipo) {
      case 'vendite':
        return {
          totale: 15420.50,
          numeroOrdini: 156,
          mediaOrdine: 98.85,
          trend: '+12.5%',
          grafico: [
            { mese: 'Gen', vendite: 12000, ordini: 120 },
            { mese: 'Feb', vendite: 13500, ordini: 135 },
            { mese: 'Mar', vendite: 15420, ordini: 156 },
          ],
          topProdotti: [
            { nome: 'Culurgiones', quantita: 450, valore: 4500 },
            { nome: 'Seadas', quantita: 380, valore: 3800 },
            { nome: 'Malloreddus', quantita: 320, valore: 3200 },
          ],
          dettagli: generaDettagliVendite(),
        };
      
      case 'clienti':
        return {
          totaleClienti: 89,
          nuoviClienti: 12,
          clientiAttivi: 67,
          tassoRitenzione: '75.3%',
          grafico: [
            { mese: 'Gen', nuovi: 8, attivi: 61 },
            { mese: 'Feb', nuovi: 10, attivi: 65 },
            { mese: 'Mar', nuovi: 12, attivi: 67 },
          ],
          topClienti: [
            { nome: 'Ristorante Da Mario', ordini: 24, valore: 2850 },
            { nome: 'Hotel Panorama', ordini: 18, valore: 2200 },
            { nome: 'Trattoria del Borgo', ordini: 15, valore: 1800 },
          ],
          dettagli: generaDettagliClienti(),
        };
      
      default:
        return null;
    }
  };

  const generaDettagliVendite = () => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: `ORD-${1000 + i}`,
      data: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      cliente: `Cliente ${i + 1}`,
      prodotti: Math.floor(Math.random() * 5) + 1,
      totale: Math.random() * 200 + 50,
      stato: ['Completato', 'In Preparazione', 'Consegnato'][Math.floor(Math.random() * 3)],
    }));
  };

  const generaDettagliClienti = () => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: `CLI-${100 + i}`,
      nome: `Cliente ${i + 1}`,
      telefono: `349${Math.floor(Math.random() * 10000000)}`,
      ordini: Math.floor(Math.random() * 20) + 1,
      valore: Math.random() * 3000 + 500,
      ultimoOrdine: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  };

  const esportaExcel = () => {
    if (!datiReport) return;

    const ws = XLSX.utils.json_to_sheet(datiReport.dettagli);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    
    // Aggiungi foglio riepilogo
    const riepilogo = [
      { Metrica: 'Totale', Valore: datiReport.totale || datiReport.totaleClienti },
      { Metrica: 'Trend', Valore: datiReport.trend || datiReport.tassoRitenzione },
    ];
    const wsRiepilogo = XLSX.utils.json_to_sheet(riepilogo);
    XLSX.utils.book_append_sheet(wb, wsRiepilogo, 'Riepilogo');
    
    XLSX.writeFile(wb, `report_${tipoReport}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const esportaPDF = () => {
    if (!datiReport) return;

    const doc = new jsPDF();
    
    // Titolo
    doc.setFontSize(20);
    doc.text(`Report ${tipoReport.charAt(0).toUpperCase() + tipoReport.slice(1)}`, 14, 22);
    
    // Data
    doc.setFontSize(10);
    doc.text(`Periodo: ${dataInizio.toLocaleDateString('it-IT')} - ${dataFine.toLocaleDateString('it-IT')}`, 14, 32);
    
    // Riepilogo
    doc.setFontSize(12);
    let y = 45;
    if (tipoReport === 'vendite') {
      doc.text(`Totale Vendite: €${datiReport.totale}`, 14, y);
      doc.text(`Numero Ordini: ${datiReport.numeroOrdini}`, 14, y + 10);
      doc.text(`Media Ordine: €${datiReport.mediaOrdine}`, 14, y + 20);
      doc.text(`Trend: ${datiReport.trend}`, 14, y + 30);
    }
    
    // Tabella dettagli
    if (datiReport.dettagli && datiReport.dettagli.length > 0) {
      const headers = Object.keys(datiReport.dettagli[0]);
      const data = datiReport.dettagli.map(row => Object.values(row));
      
      doc.autoTable({
        head: [headers],
        body: data.slice(0, 20), // Limita a 20 righe per la prima pagina
        startY: y + 40,
      });
    }
    
    doc.save(`report_${tipoReport}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const inviaEmail = () => {
    // Implementa invio email
    console.log('Invio report via email...');
    alert('Funzionalità di invio email in sviluppo');
  };

  const stampaReport = () => {
    window.print();
  };

  const scheduleReport = () => {
    // Implementa schedulazione
    console.log('Schedulazione report...');
    alert('Funzionalità di schedulazione in sviluppo');
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Report e Analisi
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {/* Selezione tipo report */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo Report</InputLabel>
                <Select
                  value={tipoReport}
                  onChange={(e) => setTipoReport(e.target.value)}
                  label="Tipo Report"
                >
                  {tipiReport.map(tipo => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {tipo.icon}
                        {tipo.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Selezione periodo */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Periodo</InputLabel>
                <Select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  label="Periodo"
                >
                  <MenuItem value="oggi">Oggi</MenuItem>
                  <MenuItem value="settimana">Questa Settimana</MenuItem>
                  <MenuItem value="mese">Questo Mese</MenuItem>
                  <MenuItem value="trimestre">Trimestre</MenuItem>
                  <MenuItem value="anno">Anno</MenuItem>
                  <MenuItem value="personalizzato">Personalizzato</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Date picker */}
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Data Inizio"
                value={dataInizio}
                onChange={setDataInizio}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Data Fine"
                value={dataFine}
                onChange={setDataFine}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
          </Grid>
          
          {/* Azioni */}
          <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={esportaExcel}
            >
              Esporta Excel
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DownloadIcon />}
              onClick={esportaPDF}
            >
              Esporta PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={inviaEmail}
            >
              Invia Email
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={stampaReport}
            >
              Stampa
            </Button>
            <Button
              variant="outlined"
              startIcon={<ScheduleIcon />}
              onClick={scheduleReport}
            >
              Schedula
            </Button>
          </Box>
        </Paper>

        {/* Contenuto Report */}
        {datiReport && (
          <>
            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {tipoReport === 'vendite' && (
                <>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Totale Vendite
                        </Typography>
                        <Typography variant="h4">
                          €{datiReport.totale?.toFixed(2)}
                        </Typography>
                        <Chip
                          label={datiReport.trend}
                          color="success"
                          size="small"
                          icon={<TrendingUpIcon />}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Numero Ordini
                        </Typography>
                        <Typography variant="h4">
                          {datiReport.numeroOrdini}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Media Ordine
                        </Typography>
                        <Typography variant="h4">
                          €{datiReport.mediaOrdine?.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Top Prodotto
                        </Typography>
                        <Typography variant="h6">
                          {datiReport.topProdotti?.[0]?.nome}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>

            {/* Grafici */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Grafico principale */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Andamento {tipoReport === 'vendite' ? 'Vendite' : 'Clienti'}
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={datiReport.grafico}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mese" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey={tipoReport === 'vendite' ? 'vendite' : 'attivi'} 
                        stroke="#8884d8" 
                        name={tipoReport === 'vendite' ? 'Vendite (€)' : 'Clienti Attivi'}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={tipoReport === 'vendite' ? 'ordini' : 'nuovi'} 
                        stroke="#82ca9d" 
                        name={tipoReport === 'vendite' ? 'N° Ordini' : 'Nuovi Clienti'}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Grafico torta */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Top {tipoReport === 'vendite' ? 'Prodotti' : 'Clienti'}
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tipoReport === 'vendite' ? datiReport.topProdotti : datiReport.topClienti}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valore"
                      >
                        {(tipoReport === 'vendite' ? datiReport.topProdotti : datiReport.topClienti)?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* Tabella dettagli */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Dettagli Report
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {datiReport.dettagli && datiReport.dettagli.length > 0 && 
                        Object.keys(datiReport.dettagli[0]).map(key => (
                          <TableCell key={key}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </TableCell>
                        ))
                      }
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datiReport.dettagli
                      ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value, i) => (
                            <TableCell key={i}>
                              {typeof value === 'number' 
                                ? value.toFixed(2) 
                                : value instanceof Date 
                                  ? value.toLocaleDateString('it-IT')
                                  : value}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={datiReport.dettagli?.length || 0}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage="Righe per pagina"
              />
            </Paper>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ReportAvanzati;