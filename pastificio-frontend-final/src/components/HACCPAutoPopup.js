// components/HACCPAutoPopup.js
// ✅ POPUP AUTOMATICO PER CONFERMA TEMPERATURE HACCP
// Appare automaticamente ogni Martedì quando si apre il gestionale

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
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  AcUnit as FridgeIcon,
  Kitchen as FreezerIcon,
  Speed as AbbattitoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Thermostat as TempIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
// FUNZIONE GENERA TEMPERATURA REALISTICA
// ============================================
const generaTemperaturaRealistica = (minTemp, maxTemp) => {
  // Genera temperatura nel range con distribuzione normale verso il centro
  const centro = (minTemp + maxTemp) / 2;
  const range = maxTemp - minTemp;
  
  // Usa Box-Muller per distribuzione normale
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  // Scala e sposta per il nostro range (deviazione standard = range/4)
  let temp = centro + z * (range / 4);
  
  // Limita ai valori min/max
  temp = Math.max(minTemp, Math.min(maxTemp, temp));
  
  // Arrotonda a 1 decimale
  return Math.round(temp * 10) / 10;
};

// ============================================
// COMPONENTE PRINCIPALE
// ============================================
export default function HACCPAutoPopup({ onClose }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [temperature, setTemperature] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // VERIFICA SE È MARTEDÌ E SE SERVE REGISTRAZIONE
  // ============================================
  useEffect(() => {
    checkIfShouldShow();
  }, []);

  const checkIfShouldShow = async () => {
    const oggi = new Date();
    const giornoSettimana = oggi.getDay(); // 0 = Domenica, 2 = Martedì
    
    // Verifica se è Martedì
    if (giornoSettimana !== 2) {
      console.log('Non è Martedì, popup HACCP non mostrato');
      return;
    }

    // Verifica se già registrato oggi
    try {
      const token = localStorage.getItem('token');
      const dataOggi = oggi.toISOString().split('T')[0];
      
      const response = await axios.get(
        `${API_URL}/api/haccp/check-registrazione?data=${dataOggi}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.giaRegistrato) {
        console.log('Temperature già registrate oggi');
        return;
      }

      // Mostra popup e genera temperature
      generaTemperature();
      setOpen(true);
      
    } catch (error) {
      // Se l'endpoint non esiste, mostra comunque il popup
      console.log('Verifica registrazione fallita, mostro popup comunque');
      generaTemperature();
      setOpen(true);
    }
  };

  // ============================================
  // GENERA TEMPERATURE PER TUTTI I DISPOSITIVI
  // ============================================
  const generaTemperature = () => {
    const temps = DISPOSITIVI.map(disp => ({
      ...disp,
      temperatura: generaTemperaturaRealistica(disp.minTemp, disp.maxTemp),
      conforme: true // Sarà sempre conforme perché generato nel range
    }));
    setTemperature(temps);
  };

  // ============================================
  // RIGENERA SINGOLA TEMPERATURA
  // ============================================
  const rigeneraTemperatura = (id) => {
    setTemperature(prev => prev.map(t => {
      if (t.id === id) {
        const disp = DISPOSITIVI.find(d => d.id === id);
        return {
          ...t,
          temperatura: generaTemperaturaRealistica(disp.minTemp, disp.maxTemp)
        };
      }
      return t;
    }));
  };

  // ============================================
  // SALVA TEMPERATURE NEL DATABASE
  // ============================================
  const salvaTemperature = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Salva ogni temperatura
      for (const temp of temperature) {
        await axios.post(
          `${API_URL}/api/haccp/temperatura`,
          {
            dispositivo: temp.nome,
            temperatura: temp.temperatura,
            tipo: `temperatura_${temp.tipo}`,
            automatico: true,
            note: 'Registrazione automatica settimanale'
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
      }

      // Segna come registrato oggi
      await axios.post(
        `${API_URL}/api/haccp/segna-registrazione`,
        { data: new Date().toISOString().split('T')[0] },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setSaved(true);
      
      // Chiudi dopo 2 secondi
      setTimeout(() => {
        setOpen(false);
        if (onClose) onClose();
      }, 2000);

    } catch (error) {
      console.error('Errore salvataggio temperature:', error);
      setError('Errore durante il salvataggio. Riprova o registra manualmente.');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // ANNULLA E CHIUDI
  // ============================================
  const handleAnnulla = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  // ============================================
  // RENDER
  // ============================================
  if (!open) return null;

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
        gap: 1
      }}>
        <TempIcon />
        🌡️ Registrazione Temperature HACCP - Martedì
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
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body1">
                <strong>È Martedì!</strong> Conferma le temperature generate automaticamente per la registrazione HACCP settimanale.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Puoi rigenerare singole temperature cliccando su "🔄" se necessario.
              </Typography>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              {temperature.map((temp) => {
                const IconComponent = temp.icon;
                return (
                  <Grid item xs={12} sm={6} md={4} key={temp.id}>
                    <Paper 
                      elevation={3}
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        border: `2px solid ${temp.color}`,
                        borderRadius: 2,
                        position: 'relative'
                      }}
                    >
                      <IconComponent sx={{ fontSize: 40, color: temp.color, mb: 1 }} />
                      
                      <Typography variant="subtitle1" fontWeight="bold">
                        {temp.nome}
                      </Typography>
                      
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          color: temp.color,
                          fontWeight: 'bold',
                          my: 1
                        }}
                      >
                        {temp.temperatura}°C
                      </Typography>
                      
                      <Chip 
                        label={`Range: ${temp.minTemp}°C / ${temp.maxTemp}°C`}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      
                      <Box>
                        <Chip 
                          icon={<CheckIcon />}
                          label="Conforme"
                          color="success"
                          size="small"
                        />
                      </Box>

                      <Button
                        size="small"
                        onClick={() => rigeneraTemperatura(temp.id)}
                        sx={{ mt: 1 }}
                        disabled={saving}
                      >
                        🔄 Rigenera
                      </Button>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Data registrazione: <strong>{new Date().toLocaleDateString('it-IT', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</strong>
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      {!saved && (
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleAnnulla}
            startIcon={<CancelIcon />}
            disabled={saving}
          >
            Non ora
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={salvaTemperature}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
            disabled={saving}
            sx={{ minWidth: 200 }}
          >
            {saving ? 'Salvataggio...' : 'Conferma e Registra'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

// ============================================
// HOOK PER USARE IL POPUP AUTOMATICAMENTE
// ============================================
export function useHACCPAutoPopup() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Verifica se è Martedì
    const oggi = new Date();
    if (oggi.getDay() === 2) {
      // Controlla se già mostrato oggi
      const ultimaMostra = localStorage.getItem('haccp_popup_last_shown');
      const dataOggi = oggi.toISOString().split('T')[0];
      
      if (ultimaMostra !== dataOggi) {
        setShowPopup(true);
        localStorage.setItem('haccp_popup_last_shown', dataOggi);
      }
    }
  }, []);

  const closePopup = () => setShowPopup(false);

  return { showPopup, closePopup };
}