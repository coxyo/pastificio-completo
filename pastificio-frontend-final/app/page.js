'use client';

import dynamic from 'next/dynamic';
import { OrdiniProvider } from '@/contexts/OrdiniContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography, CircularProgress } from '@mui/material';

// Import dinamico per evitare errori SSR
const GestoreOrdini = dynamic(
  () => import('@/components/GestoreOrdini'),
  { 
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Caricamento...</Typography>
      </Box>
    )
  }
);

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default function Home() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OrdiniProvider>
        <GestoreOrdini />
      </OrdiniProvider>
    </ThemeProvider>
  );
}