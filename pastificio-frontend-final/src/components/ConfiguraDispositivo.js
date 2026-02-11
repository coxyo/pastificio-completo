// components/ConfiguraDispositivo.js
// Componente per configurare le notifiche del dispositivo corrente
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Computer as ComputerIcon,
  PhoneAndroid as MobileIcon,
  Store as StoreIcon,
  Factory as FactoryIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import dispositivoService, { NOTIFICHE_DISPONIBILI, TIPI_DISPOSITIVO } from '@/services/dispositivoService';

// Icone per i tipi di dispositivo
const ICONE_DISPOSITIVO = {
  'ufficio': <ComputerIcon />,
  'laboratorio': <FactoryIcon />,
  'punto-vendita': <StoreIcon />,
  'mobile': <MobileIcon />,
  'personalizzato': <SettingsIcon />
};

export default function ConfiguraDispositivo() {
  const [config, setConfig] = useState(null);
  const [tipoSelezionato, setTipoSelezionato] = useState('');
  const [nomePersonalizzato, setNomePersonalizzato] = useState('');
  const [notifiche, setNotifiche] = useState({});
  const [salvato, setSalvato] = useState(false);
  const [modificato, setModificato] = useState(false);

  useEffect(() => {
    // Carica configurazione esistente
    const configSalvata = dispositivoService.getConfig();
    if (configSalvata) {
      setConfig(configSalvata);
      setTipoSelezionato(configSalvata.tipo || '');
      setNomePersonalizzato(configSalvata.nomePersonalizzato || '');
      setNotifiche(configSalvata.notifiche || {});
    }
  }, []);

  const handleTipoChange = (e) => {
    const nuovoTipo = e.target.value;
    setTipoSelezionato(nuovoTipo);
    setModificato(true);
    setSalvato(false);

    // Applica preset
    const preset = getPresetNotifiche(nuovoTipo);
    setNotifiche(preset);
    
    // Nome default
    const tipoInfo = TIPI_DISPOSITIVO.find(t => t.id === nuovoTipo);
    if (tipoInfo && !nomePersonalizzato) {
      setNomePersonalizzato(tipoInfo.nome);
    }
  };

  const handleNotificaChange = (notificaId, abilitata) => {
    setNotifiche(prev => ({
      ...prev,
      [notificaId]: abilitata
    }));
    setModificato(true);
    setSalvato(false);
    
    // Se modifica manuale, diventa personalizzato
    if (tipoSelezionato !== 'personalizzato') {
      const preset = getPresetNotifiche(tipoSelezionato);
      const isModificato = Object.keys({ ...preset, [notificaId]: abilitata }).some(
        key => (key === notificaId ? abilitata : notifiche[key]) !== preset[key]
      );
      if (isModificato) {
        setTipoSelezionato('personalizzato');
      }
    }
  };

  const getPresetNotifiche = (tipo) => {
    const presets = {
      'ufficio': {
        fatture: true,
        pulizie: true,
        chiamate3cx: true,
        ordiniScadenza: true,
        scorteBasse: true,
        backupReminder: true
      },
      'laboratorio': {
        fatture: false,
        pulizie: false,
        chiamate3cx: true,
        ordiniScadenza: false,
        scorteBasse: false,
        backupReminder: false
      },
      'punto-vendita': {
        fatture: false,
        pulizie: false,
        chiamate3cx: false,
        ordiniScadenza: false,
        scorteBasse: false,
        backupReminder: false
      },
      'mobile': {
        fatture: false,
        pulizie: false,
        chiamate3cx: false,
        ordiniScadenza: false,
        scorteBasse: false,
        backupReminder: false
      },
      'personalizzato': notifiche
    };
    return presets[tipo] || {};
  };

  const handleSalva = () => {
    const nuovaConfig = {
      tipo: tipoSelezionato,
      nomePersonalizzato: nomePersonalizzato || TIPI_DISPOSITIVO.find(t => t.id === tipoSelezionato)?.nome || 'Dispositivo',
      notifiche: notifiche,
      dataConfigurazione: new Date().toISOString(),
      deviceId: dispositivoService.getDeviceId()
    };

    dispositivoService.salvaConfig(nuovaConfig);
    setConfig(nuovaConfig);
    setSalvato(true);
    setModificato(false);

    // Ricarica la pagina per applicare le modifiche
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleReset = () => {
    if (confirm('Sei sicuro di voler resettare la configurazione del dispositivo?')) {
      dispositivoService.reset();
      setConfig(null);
      setTipoSelezionato('');
      setNomePersonalizzato('');
      setNotifiche({});
      setSalvato(false);
      setModificato(false);
    }
  };

  const countNotificheAttive = () => {
    return Object.values(notifiche).filter(v => v === true).length;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ComputerIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h5">
            Configura Dispositivo
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Scegli quali notifiche visualizzare su questo dispositivo
          </Typography>
        </Box>
      </Box>

      {/* Stato attuale */}
      {config && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Dispositivo attuale:</strong> {config.nomePersonalizzato || config.tipo} 
          {' • '}
          <strong>{countNotificheAttive()}</strong> notifiche attive
          {' • '}
          ID: <code>{config.deviceId?.slice(-8)}</code>
        </Alert>
      )}

      {!config && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ Dispositivo non ancora configurato. Seleziona un tipo di dispositivo per iniziare.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Selezione tipo dispositivo */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📱 Tipo Dispositivo
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Seleziona tipo</InputLabel>
                <Select
                  value={tipoSelezionato}
                  onChange={handleTipoChange}
                  label="Seleziona tipo"
                >
                  {TIPI_DISPOSITIVO.map(tipo => (
                    <MenuItem key={tipo.id} value={tipo.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {ICONE_DISPOSITIVO[tipo.id]}
                        <span>{tipo.nome}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Nome personalizzato (opzionale)"
                value={nomePersonalizzato}
                onChange={(e) => {
                  setNomePersonalizzato(e.target.value);
                  setModificato(true);
                  setSalvato(false);
                }}
                placeholder="Es: PC Maurizio, Tablet Banco..."
                helperText="Un nome per identificare questo dispositivo"
              />

              {/* Preset rapidi */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Preset rapidi:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {TIPI_DISPOSITIVO.filter(t => t.id !== 'personalizzato').map(tipo => (
                    <Chip
                      key={tipo.id}
                      label={tipo.nome}
                      icon={ICONE_DISPOSITIVO[tipo.id]}
                      onClick={() => handleTipoChange({ target: { value: tipo.id } })}
                      color={tipoSelezionato === tipo.id ? 'primary' : 'default'}
                      variant={tipoSelezionato === tipo.id ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Configurazione notifiche */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔔 Notifiche Abilitate
              </Typography>

              {!tipoSelezionato ? (
                <Alert severity="info">
                  Seleziona prima un tipo di dispositivo
                </Alert>
              ) : (
                <Box>
                  {NOTIFICHE_DISPONIBILI.map(notifica => (
                    <Box 
                      key={notifica.id}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" component="span">
                          {notifica.icona}
                        </Typography>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {notifica.nome}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {notifica.descrizione}
                          </Typography>
                        </Box>
                      </Box>
                      <Switch
                        checked={notifiche[notifica.id] || false}
                        onChange={(e) => handleNotificaChange(notifica.id, e.target.checked)}
                        color="primary"
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Azioni */}
      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<RefreshIcon />}
          onClick={handleReset}
          disabled={!config}
        >
          Reset Configurazione
        </Button>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {salvato && (
            <Alert severity="success" sx={{ py: 0 }}>
              ✅ Salvato! Ricarico pagina...
            </Alert>
          )}
          {modificato && !salvato && (
            <Typography variant="caption" color="warning.main">
              ⚠️ Modifiche non salvate
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSalva}
            disabled={!tipoSelezionato || (!modificato && config)}
            size="large"
          >
            Salva Configurazione
          </Button>
        </Box>
      </Box>

      {/* Info */}
      <Alert severity="info" sx={{ mt: 3 }} icon={<InfoIcon />}>
        <Typography variant="body2">
          <strong>Come funziona:</strong> La configurazione viene salvata in questo browser/dispositivo. 
          Ogni dispositivo può avere le proprie impostazioni. Se usi lo stesso browser su più dispositivi, 
          dovrai configurarli separatamente.
        </Typography>
      </Alert>
    </Paper>
  );
}