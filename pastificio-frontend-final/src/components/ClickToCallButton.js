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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

/**
 * 📞 CLICK-TO-CALL BUTTON
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
      // Ottieni token
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Sessione scaduta. Effettua il login.', 'error');
        setLoading(false);
        // Redirect a login dopo 2 secondi
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      console.log('📞 Iniziando chiamata:', { numero: numeroPulito, clienteId, clienteNome });

      // Chiama API backend
      const response = await fetch(`${API_URL}/cx3/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          numero: numeroPulito,
          clienteId,
          clienteNome
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Chiamata avviata:', data);
        showToast(`Chiamata in corso verso ${numero}...`, 'success');
        
        // Opzionale: Apri 3CX in un popup
        // window.open(`3cx://call/${numeroPulito}`, '_blank');
        
      } else {
        console.error('❌ Errore chiamata:', data);
        
        // Gestisci errori specifici
        if (response.status === 401) {
          showToast('Sessione scaduta. Verrai reindirizzato al login...', 'warning');
          // Pulisci storage e redirect dopo 2 secondi
          setTimeout(() => {
            localStorage.clear();
            window.location.href = '/';
          }, 2000);
        } else if (data.status === 'configured-but-offline') {
          showToast('Sistema telefonico non disponibile al momento', 'warning');
        } else {
          showToast(data.message || 'Errore durante la chiamata', 'error');
        }
      }

    } catch (error) {
      console.error('❌ Errore chiamata:', error);
      showToast('Errore di connessione. Riprova.', 'error');
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
        <Tooltip title={`Chiama ${numero}`} arrow>
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
          {loading ? 'Chiamando...' : 'Chiama'}
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
      <Tooltip title={`Chiama ${numero}`} arrow>
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