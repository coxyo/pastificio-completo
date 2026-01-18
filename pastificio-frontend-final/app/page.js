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
    // ✅ FIX SSR: Guard completa
    if (typeof window === 'undefined') {
      console.log('⚠️ SSR detected, skip');
      return;
    }

    setMounted(true);
    
    // ✅ Registra service worker SOLO nel browser CON TIMEOUT
    if ('serviceWorker' in navigator) {
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('✅ SW registrato:', registration);
          },
          (error) => {
            console.error('❌ SW fallito:', error);
          }
        );
      }, 1000);
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