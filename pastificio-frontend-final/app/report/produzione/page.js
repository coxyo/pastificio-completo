'use client';

import React from 'react';
import { Container } from '@mui/material';
import StatisticheFatturazione from '@/components/fatturazione/StatisticheFatturazione';

export default function ReportProduzionePage() {
  return (
    <Container maxWidth="xl">
      <StatisticheFatturazione />
    </Container>
  );
}