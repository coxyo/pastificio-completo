// components/ordini/StatisticheWidget.js
import React from 'react';
import { Box, Paper, Grid, Typography, LinearProgress } from '@mui/material';
import { TrendingUp, Euro, Schedule, CheckCircle } from '@mui/icons-material';

const StatisticheWidget = ({ ordini }) => {
  // Calcola statistiche
  const oggi = new Date().toDateString();
  const ordiniOggi = ordini.filter(o => new Date(o.dataRitiro).toDateString() === oggi);
  const totaleOggi = ordiniOggi.reduce((sum, o) => sum + (o.totale || 0), 0);
  const completati = ordiniOggi.filter(o => o.stato === 'completato').length;
  const percentualeCompletamento = ordiniOggi.length > 0 ? (completati / ordiniOggi.length) * 100 : 0;

  const stats = [
    {
      title: 'Ordini Oggi',
      value: ordiniOggi.length,
      icon: <Schedule />,
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Incasso Oggi',
      value: `€${totaleOggi.toFixed(2)}`,
      icon: <Euro />,
      color: '#84fab0',
      gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
    },
    {
      title: 'Completamento',
      value: `${percentualeCompletamento.toFixed(0)}%`,
      icon: <CheckCircle />,
      color: '#f093fb',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      progress: percentualeCompletamento
    },
    {
      title: 'Media Ordine',
      value: ordiniOggi.length > 0 ? `€${(totaleOggi / ordiniOggi.length).toFixed(2)}` : '€0',
      icon: <TrendingUp />,
      color: '#fa709a',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            sx={{
              p: 3,
              background: stat.gradient,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                  {stat.title}
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stat.value}
                </Typography>
                {stat.progress !== undefined && (
                  <LinearProgress
                    variant="determinate"
                    value={stat.progress}
                    sx={{
                      mt: 2,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'white',
                        borderRadius: 3
                      }
                    }}
                  />
                )}
              </Box>
              <Box
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  p: 1.5,
                  display: 'flex'
                }}
              >
                {React.cloneElement(stat.icon, { fontSize: 'large' })}
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatisticheWidget;