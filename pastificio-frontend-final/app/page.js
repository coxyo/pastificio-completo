'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, CircularProgress, Typography } from '@mui/material';

// Import dinamico per evitare errori SSR con localStorage
const GestoreOrdini = dynamic(
  () => import('@/components/GestoreOrdini'),
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
        <Typography sx={{ mt: 2 }}>Caricamento sistema ordini...</Typography>
      </Box>
    )
  }
);

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Registra service worker per PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('Service Worker registrato:', registration);
        },
        (error) => {
          console.error('Service Worker registrazione fallita:', error);
        }
      );
    }

    // Richiedi permessi per notifiche
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return <GestoreOrdini />;
}

