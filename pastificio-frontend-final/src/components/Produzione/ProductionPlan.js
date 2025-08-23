import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function ProductionPlan() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Piani di Produzione
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Gestione piani di produzione in sviluppo</Typography>
      </Paper>
    </Box>
  );
}