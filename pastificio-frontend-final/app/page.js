// app/page.js - ✅ FIX: RIMOSSA REGISTRAZIONE SERVICE WORKER
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
    if (typeof window === 'undefined') {
      return;
    }

    setMounted(true);
    
    // ❌ RIMOSSO: Service Worker registration
    // Era questo il problema - si ri-registrava ad ogni reload!
    
    // Richiedi permessi per notifiche (opzionale)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return <GestoreOrdini />;
}