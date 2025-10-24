// app/chiamate/page.js
'use client';

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import CallLogger from '@/components/CallLogger';

export default function ChiamatePage() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Registro Chiamate
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Storico completo delle chiamate in arrivo e in uscita con statistiche dettagliate
        </Typography>
      </Box>

      <CallLogger />
    </Container>
  );
}