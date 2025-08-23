'use client';

import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Euro,
  People,
  Inventory,
  Warning,
  CheckCircle,
  Schedule,
  LocalShipping,
  ArrowForward,
  Refresh
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

const StatCard = ({ title, value, icon, color, trend, action }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 2, 
          bgcolor: `${color}.light`, 
          color: `${color}.main`,
          display: 'inline-flex'
        }}>
          {icon}
        </Box>
        {trend && (
          <Chip
            size="small"
            icon={trend > 0 ? <TrendingUp /> : <TrendingDown />}
            label={`${Math.abs(trend)}%`}
            color={trend > 0 ? 'success' : 'error'}
          />
        )}
      </Box>
      <Typography color="textSecondary" gutterBottom variant="body2">
        {title}
      </Typography>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
    </CardContent>
    {action && (
      <CardActions>
        <Button size="small" endIcon={<ArrowForward />} onClick={action.onClick}>
          {action.label}
        </Button>
      </CardActions>
    )}
  </Card>
);

export default function DashboardContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stats] = useState({
    ordiniOggi: 12,
    fatturatoOggi: 1250.50,
    clientiAttivi: 45,
    prodottiSottoScorta: 3,
    ordiniInAttesa: 5,
    ordiniCompletati: 7
  });

  const caricaStatistiche = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Tooltip title="Aggiorna dati">
          <IconButton onClick={caricaStatistiche} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ordini Oggi"
            value={stats.ordiniOggi}
            icon={<ShoppingCart />}
            color="primary"
            trend={15}
            action={{
              label: 'Vedi ordini',
              onClick: () => router.push('/ordini')
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fatturato Oggi"
            value={`€ ${stats.fatturatoOggi.toFixed(2)}`}
            icon={<Euro />}
            color="success"
            trend={8}
            action={{
              label: 'Report vendite',
              onClick: () => router.push('/report/vendite')
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Clienti Attivi"
            value={stats.clientiAttivi}
            icon={<People />}
            color="info"
            trend={-2}
            action={{
              label: 'Gestione clienti',
              onClick: () => router.push('/clienti')
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Prodotti Sotto Scorta"
            value={stats.prodottiSottoScorta}
            icon={<Warning />}
            color="warning"
            action={{
              label: 'Verifica magazzino',
              onClick: () => router.push('/magazzino')
            }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Stato Ordini
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Schedule sx={{ fontSize: 40, color: 'warning.main' }} />
                  <Typography variant="h5">{stats.ordiniInAttesa}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    In Attesa
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <LocalShipping sx={{ fontSize: 40, color: 'info.main' }} />
                  <Typography variant="h5">2</Typography>
                  <Typography variant="body2" color="textSecondary">
                    In Produzione
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                  <Typography variant="h5">{stats.ordiniCompletati}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completati
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Attività Recenti
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Nuovo ordine da Mario Rossi
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Consegna completata per ordine #1234
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Scorte basse per Farina 00
              </Typography>
              <Typography variant="body2">
                • Fattura emessa per Cliente XYZ
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Riepilogo Settimanale
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Qui puoi integrare i tuoi componenti esistenti come StatisticheOrdini, DashboardMagazzino, etc.
        </Typography>
      </Paper>
    </Container>
  );
}