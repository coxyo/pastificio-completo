// src/components/StatisticheCliente.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  Restaurant as RestaurantIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function StatisticheCliente({ clienteId, statistiche }) {
  const [periodo, setPeriodo] = useState('6mesi');
  const [loading, setLoading] = useState(false);
  const [datiGrafici, setDatiGrafici] = useState({
    venditeNelTempo: [],
    prodottiPreferiti: [],
    distribuzioneCategorie: [],
    frequenzaOrdini: []
  });

  useEffect(() => {
    if (statistiche) {
      elaboraDatiGrafici();
    }
  }, [statistiche, periodo]);

  const elaboraDatiGrafici = () => {
    // Simula elaborazione dati per grafici
    // In produzione questi dati verrebbero dal backend
    
    // Vendite nel tempo
    const mesi = [];
    const oggi = new Date();
    const numeroMesi = periodo === '3mesi' ? 3 : periodo === '6mesi' ? 6 : 12;
    
    for (let i = numeroMesi - 1; i >= 0; i--) {
      const data = subMonths(oggi, i);
      mesi.push({
        mese: format(data, 'MMM', { locale: it }),
        ordini: Math.floor(Math.random() * 10) + 1,
        valore: Math.floor(Math.random() * 500) + 100
      });
    }

    // Prodotti preferiti
    const prodottiPreferiti = statistiche?.prodottiPreferiti?.slice(0, 5) || [];

    // Distribuzione categorie
    const categorie = [
      { nome: 'Pasta', valore: 45 },
      { nome: 'Dolci', valore: 30 },
      { nome: 'Panadas', valore: 25 }
    ];

    // Frequenza ordini
    const frequenza = [
      { giorno: 'Lun', ordini: 2 },
      { giorno: 'Mar', ordini: 3 },
      { giorno: 'Mer', ordini: 5 },
      { giorno: 'Gio', ordini: 4 },
      { giorno: 'Ven', ordini: 6 },
      { giorno: 'Sab', ordini: 8 },
      { giorno: 'Dom', ordini: 3 }
    ];

    setDatiGrafici({
      venditeNelTempo: mesi,
      prodottiPreferiti,
      distribuzioneCategorie: categorie,
      frequenzaOrdini: frequenza
    });
  };

  const calcolaVariazione = (attuale, precedente) => {
    if (!precedente || precedente === 0) return 0;
    return ((attuale - precedente) / precedente * 100).toFixed(1);
  };

  const getIconaVariazione = (variazione) => {
    const valore = parseFloat(variazione);
    if (valore > 0) {
      return <TrendingUpIcon color="success" />;
    } else if (valore < 0) {
      return <TrendingDownIcon color="error" />;
    } else {
      return null;
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Controlli */}
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Analisi Cliente
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Periodo</InputLabel>
            <Select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              label="Periodo"
            >
              <MenuItem value="3mesi">3 Mesi</MenuItem>
              <MenuItem value="6mesi">6 Mesi</MenuItem>
              <MenuItem value="anno">1 Anno</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Grid>

      {/* KPI Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Valore Medio Ordine
                </Typography>
                <Typography variant="h5">
                  €{(statistiche?.statistiche?.mediaValore || 0).toFixed(2)}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  {getIconaVariazione(5.2)}
                  <Typography variant="body2" color="success.main">
                    +5.2%
                  </Typography>
                </Box>
              </Box>
              <EuroIcon color="action" fontSize="large" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Frequenza Ordini
                </Typography>
                <Typography variant="h5">
                  {((statistiche?.statistiche?.totaleOrdini || 0) / 12).toFixed(1)}/mese
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ultimo: {statistiche?.cliente?.statistiche?.ultimoOrdine ? 
                    new Date(statistiche.cliente.statistiche.ultimoOrdine).toLocaleDateString() : 
                    'Mai'
                  }
                </Typography>
              </Box>
              <CalendarIcon color="action" fontSize="large" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Prodotti Ordinati
                </Typography>
                <Typography variant="h5">
                  {statistiche?.prodottiPreferiti?.length || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Categorie diverse
                </Typography>
              </Box>
              <RestaurantIcon color="action" fontSize="large" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Tasso Fedeltà
                </Typography>
                <Typography variant="h5">
                  85%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={85} 
                  sx={{ mt: 1 }}
                  color="success"
                />
              </Box>
              <PieChartIcon color="action" fontSize="large" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Grafico Vendite nel Tempo */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Andamento Ordini
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={datiGrafici.venditeNelTempo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mese" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="ordini" 
                stroke="#8884d8" 
                name="N° Ordini"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="valore" 
                stroke="#82ca9d" 
                name="Valore (€)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Distribuzione Categorie */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Preferenze Categorie
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datiGrafici.distribuzioneCategorie}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valore"
              >
                {datiGrafici.distribuzioneCategorie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Prodotti Preferiti */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top Prodotti Ordinati
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Prodotto</TableCell>
                  <TableCell align="right">Quantità Tot.</TableCell>
                  <TableCell align="right">N° Ordini</TableCell>
                  <TableCell align="right">% sul Totale</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statistiche?.prodottiPreferiti?.slice(0, 10).map((prodotto, index) => (
                  <TableRow key={index}>
                    <TableCell>{prodotto._id}</TableCell>
                    <TableCell align="right">{prodotto.quantitaTotale}</TableCell>
                    <TableCell align="right">{prodotto.ordiniConProdotto}</TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <Box width={60} mr={1}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(100, (prodotto.quantitaTotale / 100) * 100)}
                          />
                        </Box>
                        {((prodotto.quantitaTotale / 100) * 100).toFixed(0)}%
                      </Box>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nessun dato disponibile
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Frequenza Ordini per Giorno */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Distribuzione Ordini Settimanale
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datiGrafici.frequenzaOrdini}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="giorno" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ordini" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Note e Osservazioni */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Insights e Raccomandazioni
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="flex-start" gap={1}>
                <TrendingUpIcon color="success" />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Cliente in Crescita
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Il valore medio degli ordini è aumentato del 5.2% negli ultimi 3 mesi
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="flex-start" gap={1}>
                <RestaurantIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Prodotti Preferiti
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Forte preferenza per la categoria Pasta (45% degli ordini)
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="flex-start" gap={1}>
                <CalendarIcon color="warning" />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Pattern Ordini
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Picco di ordini nel weekend, considera offerte dedicate
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default StatisticheCliente;