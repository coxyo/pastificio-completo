// app/dashboard/layout.js
'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { OrdiniProvider } from '@/contexts/OrdiniContext';

const MainLayout = dynamic(
  () => import('@/components/layout/MainLayout'),  // <-- Cambiato Layout in layout (minuscolo)
  { ssr: false }
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

export default function DashboardLayout({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OrdiniProvider>
        <MainLayout>
          {children}
        </MainLayout>
      </OrdiniProvider>
    </ThemeProvider>
  );
}