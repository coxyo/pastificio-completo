'use client';

import React from 'react';
import { Container } from '@mui/material';
import ConfigurazionePannello from '@/components/ConfigurazionePannello';

export default function ImpostazioniAziendaPage() {
  return (
    <Container maxWidth="xl">
      <ConfigurazionePannello defaultTab={0} />
    </Container>
  );
}