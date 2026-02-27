// app/utenti/page.js - ✅ Pagina Gestione Utenti
'use client';

import dynamic from 'next/dynamic';
import { Box, CircularProgress, Typography } from '@mui/material';

const GestioneUtenti = dynamic(
  () => import('@/components/GestioneUtenti'),
  { 
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Caricamento gestione utenti...</Typography>
      </Box>
    )
  }
);

export default function UtentiPage() {
  return <GestioneUtenti />;
}