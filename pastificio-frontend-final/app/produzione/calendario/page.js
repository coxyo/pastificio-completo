'use client';

import React from 'react';
import { Container } from '@mui/material';
import CalendarioProduzione from '@/components/CalendarioProduzione';

export default function CalendarioPage() {
  return (
    <Container maxWidth="xl">
      <CalendarioProduzione />
    </Container>
  );
}