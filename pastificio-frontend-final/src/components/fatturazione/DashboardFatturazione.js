import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import { Euro, TrendingUp } from '@mui/icons-material';

export default function DashboardFatturazione({ compact = false }) {
  const stats = {
    fatturatoMese: 15420.50,
    fattureEmesse: 23,
    fattureInSospeso: 5,
    totaleDaPagare: 3200.00
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Dashboard Fatturazione
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={compact ? 12 : 6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Euro color="success" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Fatturato Mese
              </Typography>
              <Typography variant="h6">
                €{stats.fatturatoMese.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        {!compact && (
          <>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Fatture Emesse
                </Typography>
                <Typography variant="h6">
                  {stats.fattureEmesse}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  In Sospeso
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {stats.fattureInSospeso}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Da Incassare
                </Typography>
                <Typography variant="h6" color="error.main">
                  €{stats.totaleDaPagare.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
}