'use client';

import React from 'react';
import { Container } from '@mui/material';
import InvoiceForm from '@/components/fatturazione/InvoiceForm';

export default function NuovaFatturaPage() {
  return (
    <Container maxWidth="xl">
      <InvoiceForm />
    </Container>
  );
}