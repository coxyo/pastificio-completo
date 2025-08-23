import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function RecipeForm() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestione Ricette
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Form ricette in sviluppo</Typography>
      </Paper>
    </Box>
  );
}