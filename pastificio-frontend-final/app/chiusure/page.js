// app/chiusure/page.js
'use client';

import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

const GestioneChiusure = dynamic(
  () => import('@/components/chiusure/GestioneChiusure'),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
);

export default function ChiusurePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: 'auto' }}>
      <GestioneChiusure isAdmin={isAdmin} />
    </Box>
  );
}