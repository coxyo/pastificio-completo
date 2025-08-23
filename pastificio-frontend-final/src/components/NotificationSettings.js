'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Vibration as VibrationIcon,
  Visibility as VisibilityIcon,
  Science as TestIcon
} from '@mui/icons-material';

// Import dinamico per evitare problemi SSR
let notificationService;

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    sound: false,
    vibration: false,
    showPreview: false,
    orderSound: false,
    updateSound: false,
    deleteSound: false
  });
  const [stats, setStats] = useState({
    isSupported: false,
    permission: 'default',
    canShow: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    // Importa il servizio solo lato client
    const loadService = async () => {
      if (typeof window !== 'undefined') {
        const module = await import('../services/notificationService');
        notificationService = module.default;
        setSettings(notificationService.getSettings());
        setStats(notificationService.getStats());
      }
    };
    
    loadService();
  }, []);

  useEffect(() => {
    if (!notificationService) return;
    
    // Aggiorna statistiche periodicamente
    const interval = setInterval(() => {
      setStats(notificationService.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handlePermissionRequest = async () => {
    if (!notificationService) return;
    
    setLoading(true);
    try {
      const granted = await notificationService.requestPermission();
      if (granted) {
        showMessage('Permesso notifiche concesso!', 'success');
        setStats(notificationService.getStats());
      } else {
        showMessage('Permesso notifiche negato. Puoi attivarlo dalle impostazioni del browser.', 'warning');
      }
    } catch (error) {
      showMessage('Errore durante la richiesta del permesso: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    if (!notificationService) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationService.updateSettings(newSettings);
    showMessage(`Impostazione "${key}" aggiornata`, 'success');
  };

  const handleTestNotification = async () => {
    if (!notificationService) return;
    
    try {
      await notificationService.testNotification();
      showMessage('Notifica di test inviata!', 'success');
    } catch (error) {
      showMessage('Errore invio notifica di test: ' + error.message, 'error');
    }
  };

  const getPermissionColor = () => {
    switch (stats.permission) {
      case 'granted': return 'success';
      case 'denied': return 'error';
      default: return 'warning';
    }
  };

  const getPermissionText = () => {
    switch (stats.permission) {
      case 'granted': return 'Consentito';
      case 'denied': return 'Negato';
      default: return 'Non richiesto';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Impostazioni Notifiche
      </Typography>
      
      {/* Stato attuale */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Stato Notifiche
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={stats.isSupported ? <NotificationsIcon /> : <NotificationsOffIcon />}
            label={stats.isSupported ? 'Supportate' : 'Non Supportate'}
            color={stats.isSupported ? 'success' : 'error'}
          />
          <Chip
            label={`Permesso: ${getPermissionText()}`}
            color={getPermissionColor()}
          />
          <Chip
            icon={stats.canShow ? <NotificationsIcon /> : <NotificationsOffIcon />}
            label={stats.canShow ? 'Attive' : 'Disattive'}
            color={stats.canShow ? 'success' : 'default'}
          />
        </Box>

        {!stats.isSupported && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Le notifiche browser non sono supportate da questo dispositivo/browser.
          </Alert>
        )}

        {stats.isSupported && stats.permission !== 'granted' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Le notifiche non sono autorizzate. Clicca il pulsante per richiedere il permesso.
          </Alert>
        )}

        {stats.permission === 'granted' && !settings.enabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Le notifiche sono autorizzate ma disattivate. Attivale dalle impostazioni sotto.
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          {stats.permission !== 'granted' && (
            <Button
              variant="contained"
              onClick={handlePermissionRequest}
              disabled={loading || !stats.isSupported}
              startIcon={<NotificationsIcon />}
            >
              {loading ? 'Richiesta in corso...' : 'Richiedi Permesso'}
            </Button>
          )}
          
          {stats.permission === 'granted' && (
            <Button
              variant="outlined"
              onClick={handleTestNotification}
              startIcon={<TestIcon />}
            >
              Test Notifica
            </Button>
          )}
        </Box>
      </Paper>

      {/* Impostazioni dettagliate */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configurazione
        </Typography>

        <List>
          <ListItem>
            <ListItemText
              primary="Abilita Notifiche"
              secondary="Attiva/disattiva tutte le notifiche browser"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                disabled={stats.permission !== 'granted'}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemText
              primary="Suoni Notifiche"
              secondary="Riproduci suoni per le notifiche"
            />
            <ListItemSecondaryAction>
              <IconButton color={settings.sound ? 'primary' : 'default'}>
                {settings.sound ? <VolumeUpIcon /> : <VolumeOffIcon />}
              </IconButton>
              <Switch
                checked={settings.sound}
                onChange={(e) => handleSettingChange('sound', e.target.checked)}
                disabled={!settings.enabled}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText
              primary="Vibrazione"
              secondary="Vibra su dispositivi mobili (se supportato)"
            />
            <ListItemSecondaryAction>
              <IconButton color={settings.vibration ? 'primary' : 'default'}>
                <VibrationIcon />
              </IconButton>
              <Switch
                checked={settings.vibration}
                onChange={(e) => handleSettingChange('vibration', e.target.checked)}
                disabled={!settings.enabled}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText
              primary="Mostra Anteprima"
              secondary="Mostra dettagli ordine nelle notifiche"
            />
            <ListItemSecondaryAction>
              <IconButton color={settings.showPreview ? 'primary' : 'default'}>
                <VisibilityIcon />
              </IconButton>
              <Switch
                checked={settings.showPreview}
                onChange={(e) => handleSettingChange('showPreview', e.target.checked)}
                disabled={!settings.enabled}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, px: 2 }}>
            Tipi di Notifiche
          </Typography>

          <ListItem>
            <ListItemText
              primary="Nuovi Ordini"
              secondary="Notifica quando arriva un nuovo ordine"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.orderSound}
                onChange={(e) => handleSettingChange('orderSound', e.target.checked)}
                disabled={!settings.enabled}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText
              primary="Ordini Aggiornati"
              secondary="Notifica quando un ordine viene modificato"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.updateSound}
                onChange={(e) => handleSettingChange('updateSound', e.target.checked)}
                disabled={!settings.enabled}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText
              primary="Ordini Eliminati"
              secondary="Notifica quando un ordine viene eliminato"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.deleteSound}
                onChange={(e) => handleSettingChange('deleteSound', e.target.checked)}
                disabled={!settings.enabled}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      {/* Messaggio di feedback */}
      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mt: 2 }}
          onClose={() => setMessage({ text: '', type: '' })}
        >
          {message.text}
        </Alert>
      )}
    </Box>
  );
};

export default NotificationSettings;