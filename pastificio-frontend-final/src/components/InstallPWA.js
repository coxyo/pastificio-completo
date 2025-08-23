'use client';

import React, { useState, useEffect } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    console.log('InstallPWA montato');
    
    // Controlla se iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    console.log('iOS:', isIOS, 'Standalone:', isStandalone);

    if (isIOS && !isStandalone) {
      setShowIOSInstall(true);
    }

    // Intercetta evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt evento ricevuto!', e);
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Controlla se già installata
    window.addEventListener('appinstalled', () => {
      console.log('App installata!');
      setSnackbar({
        open: true,
        message: 'App installata con successo!',
        severity: 'success'
      });
      setShowInstallButton(false);
    });

    // Test manuale dopo 3 secondi
    setTimeout(() => {
      console.log('Test manuale - showInstallButton:', showInstallButton);
      if (!showInstallButton && !isStandalone) {
        console.log('Nessun evento beforeinstallprompt ricevuto dopo 3 secondi');
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('Click su installa');
    if (!installPrompt) {
      console.error('Nessun prompt di installazione disponibile');
      return;
    }

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log('Scelta utente:', outcome);

    if (outcome === 'accepted') {
      setSnackbar({
        open: true,
        message: 'Installazione in corso...',
        severity: 'info'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Installazione annullata',
        severity: 'warning'
      });
    }

    setInstallPrompt(null);
    setShowInstallButton(false);
  };

  // Aggiungi sempre un pulsante di test per debug
  return (
    <>
      {/* Pulsante di test sempre visibile per debug */}
      <Button
        variant="outlined"
        size="small"
        onClick={() => {
          console.log('Stato attuale:');
          console.log('- showInstallButton:', showInstallButton);
          console.log('- installPrompt:', installPrompt);
          console.log('- showIOSInstall:', showIOSInstall);
          console.log('- navigator.userAgent:', navigator.userAgent);
        }}
        sx={{ mr: 1 }}
      >
        Debug PWA
      </Button>

      {showIOSInstall && (
        <Alert severity="info" sx={{ m: 2 }}>
          Per installare su iOS: tocca il pulsante Condividi e poi "Aggiungi a Home"
        </Alert>
      )}

      {showInstallButton && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleInstallClick}
          sx={{ m: 2 }}
        >
          Installa App
        </Button>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InstallPWA;