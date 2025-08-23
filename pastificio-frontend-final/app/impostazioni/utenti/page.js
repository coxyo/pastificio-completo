'use client';

import React from 'react';
import { Container } from '@mui/material';
import GestioneUtenti from '@/components/GestioneUtenti';

export default function ImpostazioniUtentiPage() {
  return (
    <Container maxWidth="xl">
      <GestioneUtenti />
    </Container>
  );
}