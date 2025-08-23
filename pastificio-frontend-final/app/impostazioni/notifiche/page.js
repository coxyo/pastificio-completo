'use client';

import React from 'react';
import { Container } from '@mui/material';
import NotificationSettings from '@/components/NotificationSettings';

export default function ImpostazioniNotifichePage() {
  return (
    <Container maxWidth="xl">
      <NotificationSettings />
    </Container>
  );
}