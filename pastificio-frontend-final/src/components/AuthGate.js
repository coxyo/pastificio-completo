// src/components/AuthGate.js - ✅ NUOVO: Gate autenticazione
'use client';

import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import ClientLayout from '../../app/ClientLayout';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AuthGate({ children }) {
  const { isAuthenticated, loading, initialized } = useAuth();

  // Attendi inizializzazione
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

  // Non autenticato → mostra Login
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