import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function PrevisioneConsumi() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Previsione Consumi
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Analisi consumi in sviluppo</Typography>
      </Paper>
    </Box>
  );
}