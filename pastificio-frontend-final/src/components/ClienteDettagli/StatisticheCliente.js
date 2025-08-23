// src/components/ClienteDettagli/StatisticheCliente.js
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const StatisticheCliente = ({ statistiche = {} }) => {
  // Dati di esempio per i grafici
  const trendData = [
    { mese: 'Gen', ordini: 4, valore: 450 },
    { mese: 'Feb', ordini: 6, valore: 600 },
    { mese: 'Mar', ordini: 5, valore: 550 },
    { mese: 'Apr', ordini: 8, valore: 800 },
    { mese: 'Mag', ordini: 7, valore: 750 },
    { mese: 'Giu', ordini: 9, valore: 900 },
  ];

  const prodottiData = [
    { nome: 'Papassinas', valore: 300, percentuale: 30 },
    { nome: 'Gueffus', valore: 250, percentuale: 25 },
    { nome: 'Sfoglie per Lasagne', valore: 200, percentuale: 20 },
    { nome: 'Panada di anguille', valore: 150, percentuale: 15 },
    { nome: 'Cantucci', valore: 100, percentuale: 10 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUpIcon color="success" />;
    if (trend < 0) return <TrendingDownIcon color="error" />;
    return <RemoveIcon color="disabled" />;
  };

  return (
    <Grid container spacing={3}>
      {/* Card Statistiche Rapide */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Panoramica
            </Typography>
            
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">
                  Valore Totale
                </Typography>
                <Typography variant="h6">
                  €{statistiche.valoreTotale || '0.00'}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">
                  Ordini Totali
                </Typography>
                <Typography variant="h6">
                  {statistiche.ordiniTotali || 0}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">
                  Media €/Ordine
                </Typography>
                <Typography variant="h6">
                  €{statistiche.mediaOrdine || '0.00'}
                </Typography>
              </Box>
            </Box>

            <Box mb={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Frequenza Ordini
              </Typography>
              <Chip 
                label={statistiche.frequenza || 'Settimanale'}
                color="primary"
                size="small"
              />
            </Box>

            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Ultimo Ordine
              </Typography>
              <Typography variant="body2">
                {statistiche.ultimoOrdine || 'Mai'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Grafico Trend */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Trend Ordini
            </Typography>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mese" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ordini"
                  stroke="#8884d8"
                  name="N° Ordini"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="valore"
                  stroke="#82ca9d"
                  name="Valore (€)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Prodotti Preferiti */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Prodotti Preferiti
            </Typography>
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prodottiData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, percentuale }) => `${nome} (${percentuale}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valore"
                >
                  {prodottiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Analisi Dettagliata */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Analisi Dettagliata
            </Typography>
            
            <Grid container spacing={2}>
              {/* Metrica 1 */}
              <Grid item xs={6}>
                <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="h4" color="primary">
                    {statistiche.giorniCliente || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Giorni da Cliente
                  </Typography>
                </Box>
              </Grid>
              
              {/* Metrica 2 */}
              <Grid item xs={6}>
                <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="h4" color="secondary">
                    {statistiche.prodottiAcquistati || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Prodotti Diversi
                  </Typography>
                </Box>
              </Grid>
              
              {/* Metrica 3 */}
              <Grid item xs={6}>
                <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="h4" color="success.main">
                    {statistiche.tassoCrescita || 0}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Crescita YoY
                  </Typography>
                </Box>
              </Grid>
              
              {/* Metrica 4 */}
              <Grid item xs={6}>
                <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="h4" color="warning.main">
                    {statistiche.puntualitaPagamenti || 100}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Puntualità
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Livello Fedeltà */}
            <Box mt={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">
                  Livello Fedeltà
                </Typography>
                <Chip 
                  label={statistiche.livelloFedelta || 'Bronze'} 
                  color="primary"
                  size="small"
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={statistiche.progressoFedelta || 60} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="textSecondary">
                {statistiche.progressoFedelta || 60}% verso il prossimo livello
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StatisticheCliente;