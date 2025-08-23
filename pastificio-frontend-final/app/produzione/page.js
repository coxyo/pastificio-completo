'use client';

import React from 'react';
import { Container } from '@mui/material';
import DashboardProduzione from '@/components/Produzione/DashboardProduzione';

export default function ProduzionePage() {
  return (
    <Container maxWidth="xl">
      <DashboardProduzione />
    </Container>
  );
}