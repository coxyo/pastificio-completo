'use client';

import React from 'react';
import { Container } from '@mui/material';
import CalendarioProduzione from '@/components/CalendarioProduzione';

export default function CalendarioPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CalendarioProduzione />
    </Container>
  );
}