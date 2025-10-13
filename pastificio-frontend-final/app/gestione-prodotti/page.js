// app/gestione-prodotti/page.js
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, CircularProgress, Typography } from '@mui/material';

// Import dinamico per evitare errori SSR
const GestioneProdotti = dynamic(
  () => import('@/components/GestioneProdotti'),
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
        <Typography sx={{ mt: 2 }}>Caricamento gestione prodotti...</Typography>
      </Box>
    )
  }
);

export default function GestioneProdottiPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <GestioneProdotti />;
}