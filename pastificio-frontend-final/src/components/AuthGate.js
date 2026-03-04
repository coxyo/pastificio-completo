// src/components/AuthGate.js - ✅ FIX 04/03/2026: Eliminato flash cerchietto viola
// Il problema: quando AuthProvider si rimontava (navigazione Next.js, errore, etc.)
// loading ripartiva da true → cerchietto viola 1s → remount di TUTTA l'app → form perso
// La fix: se c'è un token in localStorage, mostra subito l'app senza attendere AuthContext
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import ClientLayout from '../../app/ClientLayout';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AuthGate({ children }) {
  const { isAuthenticated, loading, initialized } = useAuth();
  
  // 🆕 04/03/2026: Check veloce localStorage per evitare flash di loading
  // Se token esiste in localStorage, mostra subito l'app (AuthContext si inizializza in background)
  const [hasLocalToken, setHasLocalToken] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      setHasLocalToken(!!token && !!user);
      setChecked(true);
    }
  }, []);

  // Prima del check localStorage, non mostrare nulla (evita flash)
  if (!checked) {
    return null;
  }

  // Se AuthContext sta ancora caricando MA c'è un token locale → mostra l'app subito
  // Questo evita il cerchietto viola che rimontava tutto e distruggeva il form
  if ((!initialized || loading) && hasLocalToken) {
    // Mostra l'app normalmente - AuthContext si inizializzerà in background
    return (
      <ClientLayout>
        {children}
      </ClientLayout>
    );
  }

  // Se AuthContext sta caricando e NON c'è token locale → mostra loading (solo al primo accesso/login)
  if (!initialized || loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <CircularProgress size={60} sx={{ color: 'white' }} />
        <Typography sx={{ mt: 2, color: 'white' }}>Caricamento...</Typography>
      </Box>
    );
  }

  // Non autenticato (token scaduto o mai loggato) → mostra Login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Autenticato → mostra layout con contenuto
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}