'use client';

import React from 'react';
import { Container } from '@mui/material';
import RegistroFatture from '@/components/fatturazione/RegistroFatture';

export default function RegistroFatturePage() {
  return (
    <Container maxWidth="xl">
      <RegistroFatture />
    </Container>
  );
}