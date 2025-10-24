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
  PhoneInTalk as PhoneInTalkIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';

/**
 * CLICK-TO-CALL BUTTON (COPY TO CLIPBOARD)
 * 
 * Copia il numero negli appunti per incollarlo in 3CX
 * Soluzione universale che funziona sempre!
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

    setLoading(true);

    try {
      console.log('[INFO] Copiando numero per chiamata:', { 
        numero: numeroPulito, 
        clienteId, 
        clienteNome 
      });

      // Copia numero negli appunti
      await navigator.clipboard.writeText(numeroPulito);
      
      console.log('[INFO] Numero copiato negli appunti:', numeroPulito);

      // Mostra toast di successo con istruzioni
      showToast(
        `Numero ${numero} copiato! Apri 3CX e incolla (Ctrl+V) per chiamare`,
        'success'
      );

    } catch (error) {
      console.error('[ERROR] Errore copia numero:', error);
      showToast('Errore: impossibile copiare il numero', 'error');
    } finally {
      setLoading(false);
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
        <Tooltip title={`Copia ${numero} per chiamare con 3CX`} arrow>
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
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              fontSize: '0.95rem',
              fontWeight: 500
            }}
            icon={snackbar.severity === 'success' ? <CopyIcon /> : undefined}
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
          {loading ? 'Copiando...' : 'Copia per 3CX'}
        </Button>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              fontSize: '0.95rem',
              fontWeight: 500
            }}
            icon={snackbar.severity === 'success' ? <CopyIcon /> : undefined}
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
      <Tooltip title={`Copia ${numero} per chiamare con 3CX`} arrow>
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
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            fontSize: '0.95rem',
            fontWeight: 500
          }}
          icon={snackbar.severity === 'success' ? <CopyIcon /> : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default ClickToCallButton;