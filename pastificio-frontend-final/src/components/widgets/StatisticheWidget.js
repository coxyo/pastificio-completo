// components/ordini/StatisticheWidget.js
// ✅ FIX 12/02/2026 - Riquadri più piccoli + sezione a scomparsa
import React, { useState } from 'react';
import { Box, Paper, Grid, Typography, LinearProgress, IconButton, Collapse } from '@mui/material';
import { TrendingUp, Euro, Schedule, CheckCircle, ExpandMore, ExpandLess } from '@mui/icons-material';

const StatisticheWidget = ({ ordini, dataSelezionata }) => {
  const [aperto, setAperto] = useState(false);
  
  // ✅ Usa dataSelezionata prop oppure fallback su oggi
  const dataTarget = dataSelezionata || new Date().toISOString().split('T')[0];
  
  // Filtra ordini per la data selezionata
  const ordiniGiorno = ordini.filter(o => {
    const dataOrdine = (o.dataRitiro || o.createdAt || '').split('T')[0];
    return dataOrdine === dataTarget;
  });
  
  const totaleGiorno = ordiniGiorno.reduce((sum, o) => sum + (o.totale || 0), 0);
  const completati = ordiniGiorno.filter(o => o.stato === 'completato').length;
  const percentualeCompletamento = ordiniGiorno.length > 0 ? (completati / ordiniGiorno.length) * 100 : 0;

  const stats = [
    {
      title: 'Ordini',
      value: ordiniGiorno.length,
      icon: <Schedule sx={{ fontSize: 20 }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Incasso',
      value: `€${totaleGiorno.toFixed(2)}`,
      icon: <Euro sx={{ fontSize: 20 }} />,
      gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
    },
    {
      title: 'Completamento',
      value: `${percentualeCompletamento.toFixed(0)}%`,
      icon: <CheckCircle sx={{ fontSize: 20 }} />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      progress: percentualeCompletamento
    },
    {
      title: 'Media',
      value: ordiniGiorno.length > 0 ? `€${(totaleGiorno / ordiniGiorno.length).toFixed(2)}` : '€0',
      icon: <TrendingUp sx={{ fontSize: 20 }} />,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  return (
    <Box sx={{ mb: 2 }}>
      {/* Header cliccabile per aprire/chiudere */}
      <Box 
        onClick={() => setAperto(!aperto)}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          mb: aperto ? 1 : 0,
          p: 0.5,
          borderRadius: 1,
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.03)' }
        }}
      >
        <IconButton size="small" sx={{ mr: 0.5, p: 0.5 }}>
          {aperto ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#555' }}>
          💰 Incasso: €{totaleGiorno.toFixed(2)} — {ordiniGiorno.length} ordini — {percentualeCompletamento.toFixed(0)}% completati
        </Typography>
      </Box>

      {/* Contenuto a scomparsa */}
      <Collapse in={aperto}>
        <Grid container spacing={1.5}>
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Paper
                sx={{
                  p: 1.5,
                  background: stat.gradient,
                  color: 'white',
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                      {stat.value}
                    </Typography>
                    {stat.progress !== undefined && (
                      <LinearProgress
                        variant="determinate"
                        value={stat.progress}
                        sx={{
                          mt: 0.5,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: 'rgba(255,255,255,0.3)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: 'white',
                            borderRadius: 2
                          }
                        }}
                      />
                    )}
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      p: 0.8,
                      display: 'flex'
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Collapse>
    </Box>
  );
};

export default StatisticheWidget;