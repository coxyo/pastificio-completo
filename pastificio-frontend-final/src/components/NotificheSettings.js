// src/components/NotificheSettings.js
// ✅ Pannello impostazioni notifiche push (Firebase FCM)
// Pastificio Nonna Claudia

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Switch, Button, Paper, Divider,
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
  Alert, CircularProgress, Chip, Snackbar
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import PhoneIcon from '@mui/icons-material/Phone';
import WarningIcon from '@mui/icons-material/Warning';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import DevicesIcon from '@mui/icons-material/Devices';
import firebasePushService from '@/services/firebasePushService';

export default function NotificheSettings() {
  const [stato, setStato] = useState(null);
  const [preferenze, setPreferenze] = useState({
    chiamate: true,
    alertCritici: true,
    nuoviOrdini: true,
    ordiniModificati: false
  });
  const [caricamento, setCar] = useState(true);
  const [attivando, setAttivando] = useState(false);
  const [testInvio, setTestInvio] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Carica stato iniziale
  const caricaStato = useCallback(async () => {
    setCar(true);
    const s = firebasePushService.getStato();
    setStato(s);

    // Carica preferenze dal backend se attivo
    if (s.tokenAttivo) {
      try {
        const token = localStorage.getItem('token');
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api'}/push/subscriptions`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await resp.json();
        if (data.success && data.data.length > 0) {
          setPreferenze(data.data[0].preferenze);
        }
      } catch (e) {
        console.warn('[PUSH] Errore caricamento preferenze:', e);
      }
    }
    setCar(false);
  }, []);

  useEffect(() => {
    caricaStato();
  }, [caricaStato]);

  // Toggle ON/OFF
  const handleToggle = async () => {
    setAttivando(true);
    try {
      if (stato?.tokenAttivo) {
        await firebasePushService.disattivaNotifiche();
        setSnackbar({ open: true, message: 'Notifiche disattivate', severity: 'info' });
      } else {
        const result = await firebasePushService.attivaNotifiche();
        if (result.success) {
          setSnackbar({ open: true, message: '✅ Notifiche attivate!', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: `Errore: ${result.motivo}`, severity: 'error' });
        }
      }
      await caricaStato();
    } catch (error) {
      setSnackbar({ open: true, message: 'Errore: ' + error.message, severity: 'error' });
    }
    setAttivando(false);
  };

  // Aggiorna singola preferenza
  const handlePreferenza = async (tipo) => {
    const nuove = { ...preferenze, [tipo]: !preferenze[tipo] };
    setPreferenze(nuove);

    const result = await firebasePushService.aggiornaPreferenze(nuove);
    if (result.success) {
      setSnackbar({ open: true, message: 'Preferenza aggiornata', severity: 'success' });
    }
  };

  // Test notifica
  const handleTest = async () => {
    setTestInvio(true);
    const result = await firebasePushService.inviaTest();
    if (result.success) {
      setSnackbar({ open: true, message: `Test inviato a ${result.inviati} dispositivi`, severity: 'success' });
    } else {
      setSnackbar({ open: true, message: result.message || 'Errore invio test', severity: 'error' });
    }
    setTestInvio(false);
  };

  if (caricamento) {
    return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  const isAttivo = stato?.tokenAttivo;
  const isIOS = stato?.isIOS;

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {isAttivo ? <NotificationsIcon color="primary" /> : <NotificationsOffIcon color="disabled" />}
        <Typography variant="h6">Notifiche Push</Typography>
        <Chip
          label={isAttivo ? 'ATTIVE' : 'DISATTIVE'}
          color={isAttivo ? 'success' : 'default'}
          size="small"
        />
      </Box>

      {/* iOS Warning */}
      {isIOS && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Le notifiche push non sono supportate su iPhone/iPad (limitazione Apple).
          Funzionano su PC, tablet Android e Mac.
        </Alert>
      )}

      {/* Permesso negato */}
      {stato?.permesso === 'denied' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Hai bloccato le notifiche per questo sito. Per riattivarle vai nelle impostazioni del browser
          → Siti → pastificio-frontend-final.vercel.app → Notifiche → Consenti.
        </Alert>
      )}

      {/* Toggle principale */}
      {!isIOS && stato?.permesso !== 'denied' && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="body1" fontWeight="bold">
                Ricevi notifiche anche a browser chiuso
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Powered by Firebase Cloud Messaging
              </Typography>
            </Box>
            <Switch
              checked={isAttivo}
              onChange={handleToggle}
              disabled={attivando}
              color="primary"
            />
          </Box>

          {attivando && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                {isAttivo ? 'Disattivazione...' : 'Attivazione...'}
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Preferenze per tipo */}
      {isAttivo && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            TIPI DI NOTIFICA
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon><PhoneIcon color="error" /></ListItemIcon>
              <ListItemText primary="Chiamate in arrivo" secondary="Notifica quando arriva una chiamata 3CX" />
              <ListItemSecondaryAction>
                <Switch edge="end" checked={preferenze.chiamate} onChange={() => handlePreferenza('chiamate')} />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
              <ListItemText primary="Alert critici" secondary="Anomalie ordini, clienti scomparsi, fatturato" />
              <ListItemSecondaryAction>
                <Switch edge="end" checked={preferenze.alertCritici} onChange={() => handlePreferenza('alertCritici')} />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon><ShoppingCartIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Nuovi ordini" secondary="Quando un altro operatore crea un ordine" />
              <ListItemSecondaryAction>
                <Switch edge="end" checked={preferenze.nuoviOrdini} onChange={() => handlePreferenza('nuoviOrdini')} />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon><EditIcon color="info" /></ListItemIcon>
              <ListItemText primary="Ordini modificati" secondary="Quando un altro operatore modifica un ordine" />
              <ListItemSecondaryAction>
                <Switch edge="end" checked={preferenze.ordiniModificati} onChange={() => handlePreferenza('ordiniModificati')} />
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Test */}
          <Button
            variant="outlined"
            startIcon={testInvio ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={handleTest}
            disabled={testInvio}
            fullWidth
          >
            {testInvio ? 'Invio in corso...' : 'Invia notifica test'}
          </Button>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Paper>
  );
}