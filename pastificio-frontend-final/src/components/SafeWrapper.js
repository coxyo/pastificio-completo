// src/components/SafeWrapper.js
'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';

export default function SafeWrapper({ children }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Protezione anti-loop per Chrome
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const isChrome = /Chrome/.test(navigator.userAgent);
      
      if (isChrome) {
        const reloadKey = 'chromeLastReload';
        const now = Date.now();
        const lastReload = parseInt(sessionStorage.getItem(reloadKey) || '0');
        
        if (now - lastReload < 3000) {
          console.warn('⚠️ Chrome: Reload loop rilevato e bloccato');
          setIsBlocked(true);
          return;
        }
        
        sessionStorage.setItem(reloadKey, now.toString());
      }

      // Intercetta errori di rete per evitare reload
      const handleError = (e) => {
        if (e.message && e.message.includes('Failed to fetch')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      window.addEventListener('error', handleError, true);
      window.addEventListener('unhandledrejection', handleError, true);

      return () => {
        window.removeEventListener('error', handleError, true);
        window.removeEventListener('unhandledrejection', handleError, true);
      };
    }
  }, []);

  // Non renderizzare nulla finché non siamo montati sul client
  if (!mounted) {
    return children;
  }

  if (isBlocked) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Loop di reload rilevato. Per favore ricarica manualmente la pagina con F5.
        </Alert>
      </Box>
    );
  }

  return children;
}