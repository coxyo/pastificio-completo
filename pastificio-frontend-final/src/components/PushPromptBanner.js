// src/components/PushPromptBanner.js - ✅ NUOVO: Banner richiesta attivazione notifiche
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
  Slide
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  PhoneInTalk,
  Warning as WarningIcon,
  ShoppingCart
} from '@mui/icons-material';
import pushNotificationService from '@/services/pushNotificationService';

export default function PushPromptBanner() {
  const [visible, setVisible] = useState(false);
  const [attivando, setAttivando] = useState(false);

  useEffect(() => {
    // Ritarda il check per non disturbare subito
    const timer = setTimeout(async () => {
      try {
        await pushNotificationService.inizializza();
        if (pushNotificationService.shouldShowPrompt()) {
          setVisible(true);
        }
      } catch (e) {
        // Ignora errori
      }
    }, 5000); // Mostra dopo 5 secondi

    return () => clearTimeout(timer);
  }, []);

  const handleAttiva = async () => {
    try {
      setAttivando(true);
      await pushNotificationService.attivaNotifiche();
      setVisible(false);
    } catch (error) {
      console.error('[PUSH PROMPT] Errore:', error);
      // Se l'utente nega, non mostrare più
      if (error.message.includes('negato')) {
        pushNotificationService.dismissPrompt();
      }
      setVisible(false);
    } finally {
      setAttivando(false);
    }
  };

  const handleChiudi = () => {
    pushNotificationService.dismissPrompt();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          maxWidth: 420,
          width: 'calc(100% - 32px)',
          borderRadius: 3,
          overflow: 'hidden',
          border: '2px solid #1976d2'
        }}
      >
        {/* Header colorato */}
        <Box sx={{ 
          bgcolor: '#1976d2', 
          color: 'white', 
          px: 2, 
          py: 1.5, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <NotificationsIcon />
            <Typography variant="subtitle1" fontWeight="bold">
              🔔 Vuoi ricevere notifiche?
            </Typography>
          </Stack>
          <IconButton size="small" onClick={handleChiudi} sx={{ color: 'white' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Contenuto */}
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Riceverai avvisi per:
          </Typography>

          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneInTalk sx={{ fontSize: 18, color: '#1976d2' }} />
              <Typography variant="body2">Chiamate in arrivo</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningIcon sx={{ fontSize: 18, color: '#ed6c02' }} />
              <Typography variant="body2">Alert importanti</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <ShoppingCart sx={{ fontSize: 18, color: '#2e7d32' }} />
              <Typography variant="body2">Nuovi ordini</Typography>
            </Stack>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Anche quando il gestionale è chiuso!
          </Typography>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button 
              variant="text" 
              size="small" 
              onClick={handleChiudi}
              sx={{ color: '#666' }}
            >
              No, grazie
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<NotificationsIcon />}
              onClick={handleAttiva}
              disabled={attivando}
              sx={{ px: 2 }}
            >
              {attivando ? 'Attivazione...' : '✅ Attiva notifiche'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Slide>
  );
}