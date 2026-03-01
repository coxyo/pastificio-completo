// src/components/NotificheSettings.js - ✅ NUOVO: Impostazioni notifiche push
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff,
  NotificationsActive,
  PhoneInTalk,
  Warning as WarningIcon,
  ShoppingCart,
  Edit as EditIcon,
  Send as SendIcon,
  CheckCircle,
  Error as ErrorIcon,
  Info as InfoIcon,
  Apple as AppleIcon
} from '@mui/icons-material';
import pushNotificationService from '@/services/pushNotificationService';

export default function NotificheSettings() {
  const [stato, setStato] = useState(null);
  const [preferenze, setPreferenze] = useState({
    chiamate: true,
    alertCritici: true,
    nuoviOrdini: false,
    ordiniModificati: false
  });
  const [loading, setLoading] = useState(true);
  const [attivando, setAttivando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [messaggio, setMessaggio] = useState(null);

  // Carica stato attuale
  const caricaStato = useCallback(async () => {
    try {
      setLoading(true);
      await pushNotificationService.inizializza();
      const statoAttuale = await pushNotificationService.getStato();
      setStato(statoAttuale);

      // Carica preferenze dal server se sottoscritto
      if (statoAttuale.isSubscribed) {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';
        const resp = await fetch(`${API_URL}/api/push/subscriptions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.subscriptions?.length > 0) {
            setPreferenze(data.subscriptions[0].preferenze || preferenze);
          }
        }
      }
    } catch (error) {
      console.error('[NOTIFICHE] Errore caricamento:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    caricaStato();
  }, [caricaStato]);

  // Attiva notifiche
  const handleAttiva = async () => {
    try {
      setAttivando(true);
      setMessaggio(null);
      
      await pushNotificationService.attivaNotifiche(preferenze);
      
      setMessaggio({ tipo: 'success', testo: '✅ Notifiche attivate!' });
      await caricaStato();
    } catch (error) {
      console.error('[NOTIFICHE] Errore attivazione:', error);
      setMessaggio({ 
        tipo: 'error', 
        testo: error.message || 'Errore attivazione notifiche'
      });
    } finally {
      setAttivando(false);
    }
  };

  // Disattiva notifiche
  const handleDisattiva = async () => {
    try {
      setAttivando(true);
      setMessaggio(null);
      
      await pushNotificationService.disattivaNotifiche();
      
      setMessaggio({ tipo: 'info', testo: '🔕 Notifiche disattivate' });
      await caricaStato();
    } catch (error) {
      console.error('[NOTIFICHE] Errore disattivazione:', error);
      setMessaggio({ tipo: 'error', testo: error.message });
    } finally {
      setAttivando(false);
    }
  };

  // Aggiorna preferenze
  const handleCambiaPreferenza = async (tipo, valore) => {
    const nuovePreferenze = { ...preferenze, [tipo]: valore };
    setPreferenze(nuovePreferenze);

    // Se è sottoscritto, aggiorna anche sul server
    if (stato?.isSubscribed) {
      try {
        await pushNotificationService.aggiornaPreferenze(nuovePreferenze);
      } catch (error) {
        console.error('[NOTIFICHE] Errore aggiornamento:', error);
      }
    }
  };

  // Test notifica
  const handleTest = async () => {
    try {
      setTestando(true);
      const result = await pushNotificationService.inviaTest();
      setMessaggio({ 
        tipo: result.success ? 'success' : 'error', 
        testo: result.success ? '🧪 Notifica test inviata!' : 'Errore invio test'
      });
    } catch (error) {
      setMessaggio({ tipo: 'error', testo: 'Errore test notifica' });
    } finally {
      setTestando(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // iOS non supportato
  if (stato?.ios) {
    return (
      <Paper sx={{ p: 3, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <AppleIcon sx={{ fontSize: 40, color: '#666' }} />
          <Box>
            <Typography variant="h6">Notifiche Push</Typography>
            <Typography variant="body2" color="text.secondary">
              Non disponibili su iPhone/iPad
            </Typography>
          </Box>
        </Stack>
        <Alert severity="info" sx={{ mt: 1 }}>
          Apple non supporta le notifiche Web Push su iOS. Le notifiche funzionano
          su PC (Chrome, Edge, Firefox) e tablet Android.
        </Alert>
      </Paper>
    );
  }

  // Browser non supportato
  if (!stato?.supported) {
    return (
      <Paper sx={{ p: 3, mb: 2 }}>
        <Alert severity="warning">
          Il tuo browser non supporta le notifiche push. Usa Chrome, Edge o Firefox.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        {stato?.isSubscribed ? (
          <NotificationsActive sx={{ fontSize: 40, color: '#4caf50' }} />
        ) : (
          <NotificationsOff sx={{ fontSize: 40, color: '#999' }} />
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">🔔 Notifiche Push</Typography>
          <Typography variant="body2" color="text.secondary">
            Ricevi avvisi anche quando il gestionale è chiuso
          </Typography>
        </Box>
        {stato?.isSubscribed && (
          <Chip 
            icon={<CheckCircle />} 
            label="Attive" 
            color="success" 
            size="small" 
          />
        )}
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Stato permesso negato */}
      {stato?.permission === 'denied' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Le notifiche sono state bloccate nel browser. Per riattivarle,
          clicca sull'icona del lucchetto nella barra degli indirizzi e consenti le notifiche.
        </Alert>
      )}

      {/* Messaggi feedback */}
      {messaggio && (
        <Alert 
          severity={messaggio.tipo} 
          onClose={() => setMessaggio(null)}
          sx={{ mb: 2 }}
        >
          {messaggio.testo}
        </Alert>
      )}

      {/* Bottone attiva/disattiva */}
      {!stato?.isSubscribed ? (
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={attivando ? <CircularProgress size={20} color="inherit" /> : <NotificationsIcon />}
          onClick={handleAttiva}
          disabled={attivando || stato?.permission === 'denied'}
          fullWidth
          sx={{ mb: 3, py: 1.5, fontSize: '16px' }}
        >
          {attivando ? 'Attivazione...' : '✅ Attiva notifiche su questo dispositivo'}
        </Button>
      ) : (
        <Box sx={{ mb: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Notifiche attive su questo dispositivo. Riceverai avvisi anche a gestionale chiuso.
          </Alert>
        </Box>
      )}

      {/* Preferenze */}
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Ricevi notifiche per:
      </Typography>

      <Box sx={{ pl: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={preferenze.chiamate}
              onChange={(e) => handleCambiaPreferenza('chiamate', e.target.checked)}
              color="primary"
            />
          }
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneInTalk sx={{ fontSize: 20, color: '#1976d2' }} />
              <span>Chiamate in arrivo</span>
            </Stack>
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={preferenze.alertCritici}
              onChange={(e) => handleCambiaPreferenza('alertCritici', e.target.checked)}
              color="warning"
            />
          }
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningIcon sx={{ fontSize: 20, color: '#ed6c02' }} />
              <span>Alert critici</span>
            </Stack>
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={preferenze.nuoviOrdini}
              onChange={(e) => handleCambiaPreferenza('nuoviOrdini', e.target.checked)}
              color="success"
            />
          }
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <ShoppingCart sx={{ fontSize: 20, color: '#2e7d32' }} />
              <span>Nuovi ordini (da altri utenti)</span>
            </Stack>
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={preferenze.ordiniModificati}
              onChange={(e) => handleCambiaPreferenza('ordiniModificati', e.target.checked)}
              color="info"
            />
          }
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <EditIcon sx={{ fontSize: 20, color: '#0288d1' }} />
              <span>Ordini modificati (da altri utenti)</span>
            </Stack>
          }
        />
      </Box>

      {/* Azioni */}
      {stato?.isSubscribed && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              size="small"
              startIcon={testando ? <CircularProgress size={16} /> : <SendIcon />}
              onClick={handleTest}
              disabled={testando}
            >
              Invia notifica test
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<NotificationsOff />}
              onClick={handleDisattiva}
              disabled={attivando}
            >
              Disattiva su questo dispositivo
            </Button>
          </Stack>
        </>
      )}

      {/* Info */}
      <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <InfoIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
          Le notifiche funzionano su Chrome, Edge e Firefox (PC e Android).
          Non supportate su iPhone/iPad (limitazione Apple).
        </Typography>
      </Box>
    </Paper>
  );
}