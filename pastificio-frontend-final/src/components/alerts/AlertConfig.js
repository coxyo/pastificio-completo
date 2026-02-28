// src/components/alerts/AlertConfig.js - Configurazione alert (admin)
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

// Metadati per ogni tipo di alert
const ALERT_META = {
  ordini_pochi: {
    categoria: 'ORDINI',
    label: 'Giornata con pochi ordini',
    descrizione: 'Avvisa quando oggi ci sono meno ordini del solito',
    icona: '📉',
    unitaLabel: '% della media'
  },
  ordini_eccezionali: {
    categoria: 'ORDINI',
    label: 'Giornata eccezionale',
    descrizione: 'Avvisa quando oggi ci sono molti più ordini del solito',
    icona: '🎉',
    unitaLabel: '% della media'
  },
  ordini_zero: {
    categoria: 'ORDINI',
    label: 'Zero ordini a mezzogiorno',
    descrizione: 'Avvisa se a mezzogiorno non ci sono ordini',
    icona: '🚫',
    unitaLabel: 'ora controllo',
    nascondeSoglia: true
  },
  cliente_sparito: {
    categoria: 'CLIENTI',
    label: 'Cliente abituale sparito',
    descrizione: 'Avvisa quando un cliente abituale non ordina da tempo',
    icona: '😴',
    unitaLabel: 'giorni'
  },
  cliente_nuovo_top: {
    categoria: 'CLIENTI',
    label: 'Nuovo cliente top',
    descrizione: 'Avvisa quando un nuovo cliente fa molti ordini',
    icona: '⭐',
    unitaLabel: 'ordini min.'
  },
  prodotto_non_venduto: {
    categoria: 'PRODOTTI',
    label: 'Prodotto non venduto',
    descrizione: 'Avvisa quando un prodotto disponibile non si vende',
    icona: '📦',
    unitaLabel: 'giorni'
  },
  prodotto_boom: {
    categoria: 'PRODOTTI',
    label: 'Prodotto boom',
    descrizione: 'Avvisa quando un prodotto ha vendite esplosive',
    icona: '🔥',
    unitaLabel: '% della media'
  },
  incasso_anomalo: {
    categoria: 'BUSINESS',
    label: 'Incasso anomalo',
    descrizione: 'Avvisa quando l\'incasso è molto diverso dalla media',
    icona: '💰',
    unitaLabel: '% range',
    haRange: true
  },
  trend_negativo: {
    categoria: 'BUSINESS',
    label: 'Trend negativo',
    descrizione: 'Avvisa dopo N settimane consecutive in calo',
    icona: '📊',
    unitaLabel: 'settimane'
  }
};

export default function AlertConfigPanel() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [testResult, setTestResult] = useState(null);

  const getToken = () => localStorage.getItem('token');

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/alerts/config`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch (error) {
      console.error('Errore caricamento config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleToggle = (tipo) => {
    setConfigs(prev => prev.map(c => 
      c.tipo === tipo ? { ...c, attivo: !c.attivo } : c
    ));
  };

  const handleSogliaChange = (tipo, valore, campo = 'soglia') => {
    setConfigs(prev => prev.map(c => 
      c.tipo === tipo ? { ...c, [campo]: parseFloat(valore) || 0 } : c
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/alerts/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ configs })
      });
      
      if (res.ok) {
        setSnack({ open: true, message: 'Configurazione salvata!', severity: 'success' });
      } else {
        throw new Error('Errore salvataggio');
      }
    } catch (error) {
      setSnack({ open: true, message: 'Errore nel salvataggio', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const res = await fetch(`${API_URL}/alerts/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ tipo: 'tutti' })
      });
      
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
        setSnack({ 
          open: true, 
          message: `Test completato: ${data.alertsGenerati} alert generati`, 
          severity: data.alertsGenerati > 0 ? 'info' : 'success' 
        });
      }
    } catch (error) {
      setSnack({ open: true, message: 'Errore nel test', severity: 'error' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Raggruppa per categoria
  const categorie = {};
  configs.forEach(config => {
    const meta = ALERT_META[config.tipo];
    if (!meta) return;
    const cat = meta.categoria;
    if (!categorie[cat]) categorie[cat] = [];
    categorie[cat].push({ ...config, meta });
  });

  return (
    <Paper sx={{ p: 3, maxWidth: 700 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Configurazione Alert
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={testing ? <CircularProgress size={16} /> : <PlayIcon />}
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? 'Test...' : 'Test Ora'}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvo...' : 'Salva'}
          </Button>
        </Box>
      </Box>

      {/* Risultato test */}
      {testResult && (
        <Alert 
          severity={testResult.alertsGenerati > 0 ? 'info' : 'success'} 
          sx={{ mb: 2 }}
          onClose={() => setTestResult(null)}
        >
          {testResult.alertsGenerati > 0 ? (
            <>
              <strong>{testResult.alertsGenerati} alert generati:</strong>
              {testResult.alerts?.map((a, i) => (
                <Typography key={i} variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  • {a.titolo} ({a.priorita})
                </Typography>
              ))}
            </>
          ) : (
            'Nessuna anomalia rilevata. Tutto nella norma!'
          )}
        </Alert>
      )}

      {/* Configurazioni per categoria */}
      {Object.entries(categorie).map(([categoria, items]) => (
        <Box key={categoria} sx={{ mb: 3 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 700, 
              color: '#666', 
              textTransform: 'uppercase', 
              fontSize: 12,
              mb: 1,
              letterSpacing: 1
            }}
          >
            {categoria}
          </Typography>
          
          {items.map(({ meta, ...config }) => (
            <Box
              key={config.tipo}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1.5,
                px: 1,
                borderBottom: '1px solid #f0f0f0',
                opacity: config.attivo ? 1 : 0.5,
                transition: 'opacity 0.2s'
              }}
            >
              <Switch
                checked={config.attivo}
                onChange={() => handleToggle(config.tipo)}
                size="small"
              />
              
              <Typography sx={{ fontSize: 18, width: 28, textAlign: 'center' }}>
                {meta.icona}
              </Typography>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                  {meta.label}
                </Typography>
                <Typography variant="caption" sx={{ color: '#999' }}>
                  {meta.descrizione}
                </Typography>
              </Box>
              
              {!meta.nascondeSoglia && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    type="number"
                    value={config.soglia}
                    onChange={(e) => handleSogliaChange(config.tipo, e.target.value)}
                    disabled={!config.attivo}
                    size="small"
                    sx={{ width: 80 }}
                    InputProps={{
                      sx: { fontSize: 13 },
                      endAdornment: meta.unitaLabel.includes('%') ? (
                        <InputAdornment position="end" sx={{ '& p': { fontSize: 11 } }}>%</InputAdornment>
                      ) : null
                    }}
                  />
                  
                  {meta.haRange && (
                    <>
                      <Typography variant="caption" sx={{ color: '#999' }}>-</Typography>
                      <TextField
                        type="number"
                        value={config.sogliaMax || ''}
                        onChange={(e) => handleSogliaChange(config.tipo, e.target.value, 'sogliaMax')}
                        disabled={!config.attivo}
                        size="small"
                        sx={{ width: 80 }}
                        InputProps={{
                          sx: { fontSize: 13 },
                          endAdornment: (
                            <InputAdornment position="end" sx={{ '& p': { fontSize: 11 } }}>%</InputAdornment>
                          )
                        }}
                      />
                    </>
                  )}
                  
                  {!meta.unitaLabel.includes('%') && !meta.haRange && (
                    <Typography variant="caption" sx={{ color: '#999', whiteSpace: 'nowrap', fontSize: 11 }}>
                      {meta.unitaLabel}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      ))}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}