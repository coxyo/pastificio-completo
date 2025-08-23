// components/fatturazione/DashboardFatturazione.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, 
  Card, CardContent, CardHeader, Divider, 
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'react-toastify';

import { getStatisticheFatturazione } from '../../services/fattureService';

// Colori per i grafici
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const DashboardFatturazione = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    fatturato: 0,
    fatturatoPeriodo: [],
    statistichePagamenti: [],
    scadute: { totale: 0, count: 0 }
  });
  
  // Filtri
  const [filtri, setFiltri] = useState({
    anno: new Date().getFullYear().toString(),
    mese: ''
  });
  
  // Carica statistiche
  const fetchStatistiche = async () => {
    setLoading(true);
    try {
      const response = await getStatisticheFatturazione(filtri);
      if (response.success) {
        setStats(response.data);
      } else {
        toast.error(response.message || 'Errore nel recupero statistiche');
      }
    } catch (error) {
      toast.error('Errore nel recupero statistiche');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Carica statistiche all'avvio e quando cambiano i filtri
  useEffect(() => {
    fetchStatistiche();
  }, [filtri]);
  
  // Gestione cambio filtri
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltri(prev => ({ ...prev, [name]: value }));
  };
  
  // Formattazione importi
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Formattazione dati per i grafici
  const getFatturatoPerPeriodo = () => {
    return stats.fatturatoPeriodo.map(item => ({
      name: `${item._id.mese}/${item._id.anno}`,
      Fatturato: item.totale,
      Ordini: item.count
    }));
  };
  
  const getStatistichePerStato = () => {
    return stats.statistichePagamenti.map(item => ({
      name: item._id,
      value: item.totale,
      count: item.count
    }));
  };
  
  // Customizza tooltip dei grafici
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="subtitle2">{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Fatturato' ? formatCurrency(entry.value) : entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard Fatturazione
        </Typography>
        
        {/* Filtri */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="anno-label">Anno</InputLabel>
                <Select
                  labelId="anno-label"
                  name="anno"
                  value={filtri.anno}
                  onChange={handleFiltroChange}
                  label="Anno"
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <MenuItem key={year} value={year.toString()}>{year}</MenuItem>;
                  })}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="mese-label">Mese</InputLabel>
                <Select
                  labelId="mese-label"
                  name="mese"
                  value={filtri.mese}
                  onChange={handleFiltroChange}
                  label="Mese"
                >
                  <MenuItem value="">Tutti i mesi</MenuItem>
                  {[...Array(12)].map((_, i) => {
                    const month = i + 1;
                    const monthName = format(new Date(2023, i, 1), 'MMMM', { locale: it });
                    return <MenuItem key={month} value={month.toString()}>{monthName}</MenuItem>;
                  })}
                </Select>
              </FormControl>
             </Grid>
          </Grid>
        </Paper>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Fatturato Totale
                    </Typography>
                    <Typography variant="h4" component="div">
                      {formatCurrency(stats.fatturato)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {filtri.mese 
                        ? `${format(new Date(2023, parseInt(filtri.mese) - 1, 1), 'MMMM', { locale: it })} ${filtri.anno}` 
                        : `Anno ${filtri.anno}`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Fatture Emesse
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.fatturatoPeriodo.reduce((sum, item) => sum + item.count, 0)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      N. documenti
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Fatture da Incassare
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.statistichePagamenti
                        .filter(item => item._id === 'Emessa' || item._id === 'Parziale')
                        .reduce((sum, item) => sum + item.count, 0)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {formatCurrency(stats.statistichePagamenti
                        .filter(item => item._id === 'Emessa' || item._id === 'Parziale')
                        .reduce((sum, item) => sum + item.totale, 0))}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: stats.scadute.count > 0 ? '#fff4e5' : 'white' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Fatture Scadute
                    </Typography>
                    <Typography variant="h4" component="div" color={stats.scadute.count > 0 ? 'error' : 'inherit'}>
                      {stats.scadute.count}
                    </Typography>
                    <Typography variant="body2" color={stats.scadute.count > 0 ? 'error' : 'textSecondary'}>
                      {formatCurrency(stats.scadute.totale)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Grafici */}
            <Grid container spacing={3}>
              {/* Grafico Fatturato per Periodo */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Andamento Fatturato
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {stats.fatturatoPeriodo.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                      <Typography color="textSecondary">
                        Nessun dato disponibile per il periodo selezionato
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart
                        data={getFatturatoPerPeriodo()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="Fatturato" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="Ordini" 
                          stroke="#82ca9d" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Grid>
              
              {/* Grafico Stato Pagamenti */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Stato Pagamenti
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {stats.statistichePagamenti.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                      <Typography color="textSecondary">
                        Nessun dato disponibile
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getStatistichePerStato()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {getStatistichePerStato().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatCurrency(value)}
                          labelFormatter={(name) => `Stato: ${name}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Stato</TableCell>
                            <TableCell align="right">Importo</TableCell>
                            <TableCell align="right">Numero</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stats.statistichePagamenti.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell 
                                sx={{ 
                                  color: COLORS[index % COLORS.length],
                                  fontWeight: 'medium'
                                }}
                              >
                                {item._id}
                              </TableCell>
                              <TableCell align="right">{formatCurrency(item.totale)}</TableCell>
                              <TableCell align="right">{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Fatture Scadute */}
              {stats.scadute.count > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="error">
                      Fatture Scadute
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="body1">
                      Ci sono {stats.scadute.count} fatture scadute per un totale di {formatCurrency(stats.scadute.totale)}.
                      È consigliabile contattare i clienti per sollecitare il pagamento.
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Box>
    </Container>
  );
};

export default DashboardFatturazione;