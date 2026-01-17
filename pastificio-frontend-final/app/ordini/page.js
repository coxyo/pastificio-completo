// app/ordini/page.js - ✅ FIX SSR 17/01/2026
// File corretto con dynamic import + logica redirect
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Box, CircularProgress, Typography } from '@mui/material';

// ✅ DYNAMIC IMPORT: Disabilita SSR per GestoreOrdini
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
        minHeight: '100vh',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Caricamento gestione ordini...
        </Typography>
      </Box>
    )
  }
);

export default function OrdiniPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // ✅ Logica redirect intatta (solo client-side)
    if (pathname && pathname.includes('/report')) {
      router.push('/report');
    }
  }, [pathname, router]);
  
  // Se non ancora montato, mostra loading
  if (!mounted) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Se deve fare redirect, non mostrare nulla
  if (pathname && pathname.includes('/report')) {
    return null;
  }
  
  // Altrimenti mostra GestoreOrdini
  return <GestoreOrdini />;
}
