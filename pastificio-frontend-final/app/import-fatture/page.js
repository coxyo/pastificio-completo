// app/import-fatture/page.js
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, CircularProgress } from '@mui/material';
import ImportFatture from '../../src/components/ImportFatture';

export default function ImportFatturePage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    setAuthenticated(true);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!authenticated) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <ImportFatture />
    </Container>
  );
}