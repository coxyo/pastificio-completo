// frontend/src/components/Report/ReportViewer.js
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
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
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const ReportViewer = ({ data = {}, template }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Funzioni di utilità per formattazione
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('it-IT').format(value || 0);
  };

  // Dati di default se non forniti
  const defaultData = {
    totaleOrdini: data.totaleOrdini || 0,
    totaleValore: data.totaleValore || 0,
    clientiAttivi: data.clientiAttivi || 0,
    ticketMedio: data.totaleOrdini > 0 ? (data.totaleValore / data.totaleOrdini) : 0,
    periodo: data.periodo || { inizio: format(new Date(), 'dd/MM/yyyy'), fine: format(new Date(), 'dd/MM/yyyy') },
    trendGiornaliero: data.trendGiornaliero || [],
    distribuzioneProdotti: data.distribuzioneProdotti || [],
    topProdotti: data.topProdotti || [],
    topClienti: data.topClienti || [],
    statisticheConsegne: data.statisticheConsegne || {
      daViaggio: 0,
      ritiroNegozio: 0,
      completati: 0,
      inCorso: 0
    }
  };

  return (
    <Box className="report-viewer" sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header Report */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom color="primary">
          Report {data.tipo || 'Generale'}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Periodo: {defaultData.periodo.inizio} - {defaultData.periodo.fine}
        </Typography>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Totale Ordini
              </Typography>
              <Typography variant="h4" color="primary">
                {formatNumber(defaultData.totaleOrdini)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Nel periodo selezionato
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Valore Totale
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatCurrency(defaultData.totaleValore)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Fatturato periodo
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Clienti Attivi
              </Typography>
              <Typography variant="h4" color="info.main">
                {formatNumber(defaultData.clientiAttivi)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Clienti unici
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Ticket Medio
              </Typography>
              <Typography variant="h4" color="warning.main">
                {formatCurrency(defaultData.ticketMedio)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Valore medio ordine
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Grafici */}
      <Grid container spacing={3}>
        {/* Trend Giornaliero */}
        {defaultData.trendGiornaliero.length > 0 && (
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }} elevation={2}>
              <Typography variant="h6" gutterBottom>
                Trend Giornaliero
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={defaultData.trendGiornaliero}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="data" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Valore (€)') return formatCurrency(value);
                      return formatNumber(value);
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ordini" 
                    stroke="#8884d8" 
                    name="N° Ordini"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valore" 
                    stroke="#82ca9d" 
                    name="Valore (€)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Distribuzione Prodotti */}
        {defaultData.distribuzioneProdotti.length > 0 && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }} elevation={2}>
              <Typography variant="h6" gutterBottom>
                Distribuzione per Categoria
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={defaultData.distribuzioneProdotti}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {defaultData.distribuzioneProdotti.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Se non ci sono grafici, mostra un messaggio */}
      {defaultData.trendGiornaliero.length === 0 && defaultData.distribuzioneProdotti.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', my: 3 }}>
          <Typography color="text.secondary">
            Nessun dato disponibile per i grafici nel periodo selezionato
          </Typography>
        </Paper>
      )}

      <Divider sx={{ my: 4 }} />

      {/* Tabelle */}
      <Grid container spacing={3}>
        {/* Top Prodotti */}
        {defaultData.topProdotti.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }} elevation={2}>
              <Typography variant="h6" gutterBottom>
                Top 10 Prodotti
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Prodotto</TableCell>
                      <TableCell align="right">Quantità</TableCell>
                      <TableCell align="right">Valore</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {defaultData.topProdotti.slice(0, 10).map((prodotto, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{prodotto.nome}</TableCell>
                        <TableCell align="right">{formatNumber(prodotto.quantita)}</TableCell>
                        <TableCell align="right">{formatCurrency(prodotto.valore)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* Top Clienti */}
        {defaultData.topClienti.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }} elevation={2}>
              <Typography variant="h6" gutterBottom>
                Top 10 Clienti
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="right">N° Ordini</TableCell>
                      <TableCell align="right">Valore Totale</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {defaultData.topClienti.slice(0, 10).map((cliente, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{cliente.nome}</TableCell>
                        <TableCell align="right">{formatNumber(cliente.ordini)}</TableCell>
                        <TableCell align="right">{formatCurrency(cliente.valore)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Se non ci sono tabelle, mostra un messaggio */}
      {defaultData.topProdotti.length === 0 && defaultData.topClienti.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', my: 3 }}>
          <Typography color="text.secondary">
            Nessun dato disponibile per le classifiche nel periodo selezionato
          </Typography>
        </Paper>
      )}

      {/* Statistiche Consegne */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" gutterBottom>
            Statistiche Consegne
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {formatNumber(defaultData.statisticheConsegne.daViaggio)}
                </Typography>
                <Chip label="Da Viaggio" color="primary" size="small" sx={{ mt: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {formatNumber(defaultData.statisticheConsegne.ritiroNegozio)}
                </Typography>
                <Chip label="Ritiro in Negozio" color="secondary" size="small" sx={{ mt: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {formatNumber(defaultData.statisticheConsegne.completati)}
                </Typography>
                <Chip label="Completati" color="success" size="small" sx={{ mt: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {formatNumber(defaultData.statisticheConsegne.inCorso)}
                </Typography>
                <Chip label="In Corso" color="warning" size="small" sx={{ mt: 1 }} />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Footer con data generazione */}
      <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary', py: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="caption">
          Report generato il {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}
        </Typography>
        <Typography variant="caption" display="block">
          © {new Date().getFullYear()} Pastificio Nonna Claudia
        </Typography>
      </Box>
    </Box>
  );
};

export default ReportViewer;