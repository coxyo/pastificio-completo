// src/components/ThemeRegistry.js
// Necessario per Next.js App Router + MUI: gestisce emotion cache lato server
'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '@/theme/theme';

export default function ThemeRegistry({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}