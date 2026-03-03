// src/components/PushPromptBanner.js
// ✅ Banner prompt per attivare notifiche push (Firebase FCM)
// Pastificio Nonna Claudia

'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Paper, Slide } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import firebasePushService from '@/services/firebasePushService';

export default function PushPromptBanner() {
  const [mostra, setMostra] = useState(false);
  const [attivando, setAttivando] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Non mostrare se:
    // 1. Già chiuso dall'utente
    // 2. Permesso già dato e token attivo
    // 3. Permesso negato (non possiamo chiedere di nuovo)
    // 4. iOS (non supportato)
    const timer = setTimeout(() => {
      const giaDismesso = localStorage.getItem('push_prompt_dismissed');
      const stato = firebasePushService.getStato();

      if (giaDismesso || stato.isIOS || stato.permesso === 'denied') return;
      if (stato.permesso === 'granted' && localStorage.getItem('fcm_token')) return;

      setMostra(true);
    }, 5000); // Mostra dopo 5 secondi

    return () => clearTimeout(timer);
  }, []);

  const handleAttiva = async () => {
    setAttivando(true);
    try {
      const result = await firebasePushService.attivaNotifiche();
      if (result.success) {
        setMostra(false);
      } else if (result.motivo === 'permesso_negato') {
        localStorage.setItem('push_prompt_dismissed', 'denied');
        setMostra(false);
      }
    } catch (error) {
      console.error('[PUSH] Errore attivazione:', error);
    }
    setAttivando(false);
  };

  const handleChiudi = () => {
    localStorage.setItem('push_prompt_dismissed', 'true');
    setMostra(false);
  };

  if (!mostra) return null;

  return (
    <Slide direction="up" in={mostra} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: '95%', sm: '500px' },
          zIndex: 9999,
          borderRadius: 3,
          overflow: 'hidden',
          border: '2px solid #1976d2'
        }}
      >
        <Box sx={{ bgcolor: '#1976d2', color: 'white', px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsActiveIcon />
            <Typography variant="subtitle1" fontWeight="bold">Vuoi ricevere notifiche?</Typography>
          </Box>
          <IconButton size="small" onClick={handleChiudi} sx={{ color: 'white' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ricevi avvisi anche quando il browser è chiuso:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2, pl: 1 }}>
            <Typography variant="body2">📞 Chiamate in arrivo</Typography>
            <Typography variant="body2">⚠️ Alert critici del sistema</Typography>
            <Typography variant="body2">📦 Nuovi ordini dagli operatori</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="outlined" size="small" onClick={handleChiudi}>
              Non ora
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleAttiva}
              disabled={attivando}
              startIcon={<NotificationsActiveIcon />}
            >
              {attivando ? 'Attivazione...' : 'Attiva notifiche'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
}