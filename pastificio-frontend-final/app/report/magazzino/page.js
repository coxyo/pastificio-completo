'use client';

import React from 'react';
import { Container } from '@mui/material';
import StatisticheMagazzino from '@/components/Magazzino/StatisticheMagazzino';

export default function ReportMagazzinoPage() {
  return (
    <Container maxWidth="xl">
      <StatisticheMagazzino />
    </Container>
  );
}