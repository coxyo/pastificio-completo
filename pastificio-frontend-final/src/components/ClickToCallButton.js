// src/components/ClickToCallButton.js
'use client';

import React, { useState } from 'react';
import {
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PhoneInTalk as PhoneInTalkIcon
} from '@mui/icons-material';

/**
 * CLICK-TO-CALL BUTTON (3CX PROTOCOL HANDLER)
 * 
 * Usa 3cx://call/NUMERO per aprire 3CX Desktop Client
 * NON richiede API Key, funziona subito!
 * 
 * @param {string} numero - Numero di telefono da chiamare
 * @param {string} clienteId - ID cliente (opzionale)
 * @param {string} clienteNome - Nome cliente (opzionale)
 * @param {string} size - Dimensione button: 'small' | 'medium' | 'large'
 * @param {string} variant - Variante: 'icon' | 'button' | 'ghost'
 * @param {boolean} disabled - Disabilita pulsante
 */
function ClickToCallButton({ 
  numero, 
  clienteId = null, 
  clienteNome = null,
  size = 'medium',
  variant = 'icon',
  disabled = false
}) {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Pulisci numero (rimuovi spazi e caratteri speciali)
  const numeroPulito = numero?.replace(/\s+/g, '').replace(/[^\d+]/g, '') || '';

  // Validazione numero
  const isValidNumber = numeroPulito && /^[\d+]{6,}$/.test(numeroPulito);

  const handleCall = async () => {
    if (!isValidNumber) {
      showToast('Numero di telefono non valido', 'error');
      return;
    }

    try {
      console.log('[INFO] Iniziando chiamata 3CX:', { 
        numero: numeroPulito, 
        clienteId, 
        clienteNome 
      });

      // Costruisci URL 3CX protocol handler
      const cx3Url = `3cx://call/${numeroPulito}`;
      
      console.log('[INFO] Apertura 3CX Client:', cx3Url);

      // Apri 3CX Desktop Client (se installato)
      const popup = window.open(cx3Url, '_blank');

      // Se popup bloccato o 3CX non installato
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.warn('[WARN] Popup bloccato o 3CX non installato');
        
        // Fallback: mostra alert con link
        const userConfirmed = window.confirm(
          `Impossibile aprire 3CX automaticamente.\n\n` +
          `Vuoi provare a chiamare ${numero} manualmente?\n\n` +
          `Clicca OK per copiare il numero negli appunti.`
        );

        if (userConfirmed) {
          // Copia numero negli appunti
          await navigator.clipboard.writeText(numeroPulito);
          showToast(`Numero ${numero} copiato! Incolla in 3CX`, 'info');
        }
      } else {
        // Successo
        showToast(`Apertura 3CX per chiamare ${numero}...`, 'success');
      }

    } catch (error) {
      console.error('[ERROR] Errore chiamata:', error);
      
      // Fallback: copia numero
      try {
        await navigator.clipboard.writeText(numeroPulito);
        showToast(`Errore: numero ${numero} copiato negli appunti`, 'warning');
      } catch (clipboardError) {
        showToast('Errore: impossibile avviare chiamata', 'error');
      }
    }
  };

  const showToast = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Se numero non valido, non mostrare il pulsante
  if (!isValidNumber) {
    return null;
  }

  // Variante ICON (solo icona)
  if (variant === 'icon') {
    return (
      <>
        <Tooltip title={`Chiama ${numero} con 3CX`} arrow>
          <span>
            <IconButton
              onClick={handleCall}
              disabled={disabled || loading}
              size={size}
              color="primary"
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <PhoneIcon fontSize={size} />
              )}
            </IconButton>
          </span>
        </Tooltip>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
            icon={snackbar.severity === 'success' ? <PhoneInTalkIcon /> : undefined}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // Variante BUTTON (pulsante completo)
  if (variant === 'button') {
    return (
      <>
        <Button
          onClick={handleCall}
          disabled={disabled || loading}
          variant="contained"
          color="primary"
          size={size}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PhoneIcon />}
        >
          {loading ? 'Chiamando...' : 'Chiama con 3CX'}
        </Button>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
            icon={snackbar.severity === 'success' ? <PhoneInTalkIcon /> : undefined}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // Variante GHOST (icona minimale, per tabelle)
  return (
    <>
      <Tooltip title={`Chiama ${numero} con 3CX`} arrow>
        <IconButton
          onClick={handleCall}
          disabled={disabled || loading}
          size="small"
          sx={{
            p: 0.5,
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'transparent',
              color: 'primary.dark'
            }
          }}
        >
          {loading ? (
            <CircularProgress size={16} />
          ) : (
            <PhoneIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          icon={snackbar.severity === 'success' ? <PhoneInTalkIcon /> : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default ClickToCallButton;