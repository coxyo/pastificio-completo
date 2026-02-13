// app/etichette/page.js
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, CircularProgress, Typography } from '@mui/material';

const EtichetteManager = dynamic(
  () => import('@/components/etichette/EtichetteManager'),
  {
    ssr: false,
    loading: () => (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Caricamento gestione etichette...</Typography>
      </Box>
    )
  }
);

export default function EtichettePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <EtichetteManager />;
}