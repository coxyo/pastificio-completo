// src/components/HACCPAutoPopup.js
// ✅ POPUP AUTOMATICO TEMPERATURE HACCP - MARTEDÌ
// Genera automaticamente temperature realistiche per 5 dispositivi

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  Alert,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  AcUnit as FridgeIcon,
  Kitchen as FreezerIcon,
  Speed as AbbattitoreIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Thermostat as TempIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app';

// ============================================
// CONFIGURAZIONE DISPOSITIVI
// ============================================
const DISPOSITIVI = [
  { 
    id: 'frigo1', 
    nome: 'Frigorifero 1', 
    tipo: 'frigorifero',
    minTemp: 0, 
    maxTemp: 4,
    icon: FridgeIcon,
    color: '#2196f3'
  },
  { 
    id: 'frigo2', 
    nome: 'Frigorifero 2', 
    tipo: 'frigorifero',
    minTemp: 0, 
    maxTemp: 4,
    icon: FridgeIcon,
    color: '#2196f3'
  },
  { 
    id: 'frigo3', 
    nome: 'Frigorifero 3', 
    tipo: 'frigorifero',
    minTemp: 0, 
    maxTemp: 4,
    icon: FridgeIcon,
    color: '#2196f3'
  },
  { 
    id: 'congelatore', 
    nome: 'Congelatore', 
    tipo: 'congelatore',
    minTemp: -22, 
    maxTemp: -18,
    icon: FreezerIcon,
    color: '#9c27b0'
  },
  { 
    id: 'abbattitore', 
    nome: 'Abbattitore', 
    tipo: 'abbattitore',
    minTemp: -40, 
    maxTemp: -30,
    icon: AbbattitoreIcon,
    color: '#f44336'
  }
];

// ============================================
// GENERA TEMPERATURA REALISTICA
// ============================================
const generaTemperaturaRealistica = (minTemp, maxTemp) => {
  const centro = (minTemp + maxTemp) / 2;
  const range = maxTemp - minTemp;
  
  // Distribuzione normale (Box-Muller)
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  let temp = centro + z * (range / 4);
  temp = Math.max(minTemp, Math.min(maxTemp, temp));
  
  return Math.round(temp * 10) / 10;
};

// ============================================
// COMPONENTE PRINCIPALE
// ============================================
export default function HACCPAutoPopup({ onClose, forceShow = false }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [temperature, setTemperature] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // INIZIALIZZAZIONE
  // ============================================
  useEffect(() => {
    if (forceShow) {
      // TEST MODE: Mostra sempre
      inizializzaTemperature();
      setOpen(true);
      setLoading(false);
    } else {
      // MODALITÀ NORMALE: Solo martedì
      checkIfShouldShow();
    }
  }, [forceShow]);

  const checkIfShouldShow = async () => {
    setLoading(true);
    
    const oggi = new Date();
    const giornoSettimana = oggi.getDay(); // 0=Dom, 2=Mar
    
    // Verifica se è martedì
    if (giornoSettimana !== 2) {
      console.log('📅 Non è Martedì, popup HACCP non mostrato');
      setLoading(false);
      return;
    }

    // Verifica se già registrato oggi
    const dataOggi = oggi.toISOString().split('T')[0];
    const ultimaRegistrazione = localStorage.getItem('haccp_last_registration');
    
    if (ultimaRegistrazione === dataOggi) {
      console.log('✅ Temperature già registrate oggi');
      setLoading(false);
      return;
    }

    // Mostra popup
    inizializzaTemperature();
    setOpen(true);
    setLoading(false);
  };

  const inizializzaTemperature = () => {
    const tempGenerate = DISPOSITIVI.map(disp => ({
      dispositivo: disp.id,
      nome: disp.nome,
      tipo: disp.tipo,
      temperatura: generaTemperaturaRealistica(disp.minTemp, disp.maxTemp),
      minTemp: disp.minTemp,
      maxTemp: disp.maxTemp,
      icon: disp.icon,
      color: disp.color,
      conforme: true // Sempre conforme se nel range
    }));
    
    setTemperature(tempGenerate);
  };

  // ============================================
  // RIGENERA SINGOLA TEMPERATURA
  // ============================================
  const rigeneraSingola = (index) => {
    const newTemps = [...temperature];
    const disp = DISPOSITIVI[index];
    newTemps[index].temperatura = generaTemperaturaRealistica(disp.minTemp, disp.maxTemp);
    setTemperature(newTemps);
  };

  // ============================================
  // RIGENERA TUTTE
  // ============================================
  const rigeneraTutte = () => {
    inizializzaTemperature();
  };

  // ============================================
  // CONFERMA E SALVA
  // ============================================
  const handleConferma = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Salva ogni temperatura
      const promises = temperature.map(temp => 
        fetch(`${API_URL}/api/haccp/temperature`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            dispositivo: temp.dispositivo,
            tipo: temp.tipo,
            temperatura: temp.temperatura,
            conforme: temp.conforme,
            note: 'Registrazione automatica martedì'
          })
        })
      );

      await Promise.all(promises);

      // Salva data in localStorage
      const oggi = new Date().toISOString().split('T')[0];
      localStorage.setItem('haccp_last_registration', oggi);

      setSaved(true);
      
      // Chiudi dopo 2 secondi
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('❌ Errore salvataggio temperature:', err);
      setError('Errore nel salvataggio. Riprova o registra manualmente dalla sezione HACCP.');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // ANNULLA
  // ============================================
  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={() => {}} // Impedisce chiusura cliccando fuori
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#1a237e', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TempIcon />
          <Typography variant="h6">
            🌡️ Registrazione Temperature HACCP - Martedì
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          sx={{ color: 'white' }}
          disabled={saving}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {saved ? (
          <Alert 
            severity="success" 
            icon={<CheckIcon fontSize="large" />}
            sx={{ py: 3 }}
          >
            <Typography variant="h6">
              ✅ Temperature registrate con successo!
            </Typography>
            <Typography variant="body2">
              La registrazione settimanale HACCP è stata completata.
            </Typography>
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body1">
                <strong>È Martedì!</strong> Conferma le temperature generate automaticamente per la registrazione HACCP settimanale.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Puoi rigenerare singole temperature cliccando su "🔄" oppure tutte con il pulsante in basso.
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              {temperature.map((temp, index) => {
                const Icon = temp.icon;
                return (
                  <Grid item xs={12} sm={6} key={temp.dispositivo}>
                    <Paper 
                      elevation={3}
                      sx={{ 
                        p: 2,
                        borderLeft: `4px solid ${temp.color}`,
                        position: 'relative'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Icon sx={{ color: temp.color }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {temp.nome}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h3" sx={{ color: temp.color }}>
                          {temp.temperatura}
                        </Typography>
                        <Typography variant="h5" color="text.secondary">
                          °C
                        </Typography>
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        Range: {temp.minTemp}°C / {temp.maxTemp}°C
                      </Typography>

                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => rigeneraSingola(index)}
                          title="Rigenera temperatura"
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Chip 
                        icon={<CheckIcon />}
                        label="CONFORME"
                        color="success"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={rigeneraTutte}
                disabled={saving}
              >
                Rigenera Tutte
              </Button>

              <Typography variant="caption" color="text.secondary">
                {temperature.length} dispositivi monitorati
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      {!saved && (
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleClose}
            disabled={saving}
          >
            Annulla
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConferma}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {saving ? 'Salvataggio...' : 'Conferma e Registra'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}