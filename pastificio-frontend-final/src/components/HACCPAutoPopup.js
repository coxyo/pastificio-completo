// src/components/HACCPAutoPopup.js
// ✅ POPUP AUTOMATICO TEMPERATURE HACCP - VERSIONE CORRETTA
// Fix: Salvataggio con formato corretto per il controller

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
  CircularProgress,
  TextField
} from '@mui/material';
import {
  AcUnit as FridgeIcon,
  Kitchen as FreezerIcon,
  Speed as AbbattitoreIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Thermostat as TempIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app';

// ============================================
// CONFIGURAZIONE DISPOSITIVI
// ============================================
// ✅ FIX: Rimossi Congelatore e Abbattitore (mantenuti 3 frigo + Freezer Samsung)
const DISPOSITIVI = [
  { 
    id: 'frigo1_isa', 
    nome: 'Frigo 1 Isa', 
    tipo: 'frigorifero',
    minTemp: 0, 
    maxTemp: 4,
    icon: FridgeIcon,
    color: '#2196f3'
  },
  { 
    id: 'frigo2_icecool', 
    nome: 'Frigo 2 Icecool', 
    tipo: 'frigorifero',
    minTemp: 0, 
    maxTemp: 4,
    icon: FridgeIcon,
    color: '#2196f3'
  },
  { 
    id: 'frigo3_samsung', 
    nome: 'Frigo 3 Samsung', 
    tipo: 'frigorifero',
    minTemp: 0, 
    maxTemp: 4,
    icon: FridgeIcon,
    color: '#2196f3'
  },
  { 
    id: 'freezer_samsung', 
    nome: 'Freezer Samsung', 
    tipo: 'congelatore',
    minTemp: -22, 
    maxTemp: -18,
    icon: FreezerIcon,
    color: '#9c27b0'
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
  
  return Math.round(temp);  // ✅ FIX: Solo numeri interi
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
      console.log('🧪 [HACCP] TEST MODE - Popup forzato');
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
    
    console.log(`📅 [HACCP] Oggi è ${['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'][giornoSettimana]}`);
    
    // Verifica se è martedì
    if (giornoSettimana !== 2) {
      console.log('📅 [HACCP] Non è Martedì, popup NON mostrato');
      setLoading(false);
      return;
    }

    console.log('✅ [HACCP] È Martedì! Verifico se già registrato...');

    // Verifica se già registrato oggi
    const dataOggi = oggi.toISOString().split('T')[0];
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/haccp/check-registrazione?data=${dataOggi}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.data?.registrato) {
          console.log('✅ [HACCP] Temperature già registrate oggi');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('⚠️ [HACCP] Errore check registrazione, procedo comunque:', err);
    }

    // Mostra popup
    console.log('🌡️ [HACCP] Mostro popup registrazione temperature');
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
    
    console.log('🌡️ [HACCP] Temperature generate:', tempGenerate);
    setTemperature(tempGenerate);
  };

  // ============================================
  // MODIFICA MANUALE TEMPERATURA
  // ============================================
  const handleChangeTemp = (index, nuovoValore) => {
    const newTemps = [...temperature];
    const temp = parseFloat(nuovoValore);
    
    if (isNaN(temp)) return;
    
    newTemps[index].temperatura = temp;
    
    // Verifica conformità
    const { minTemp, maxTemp } = newTemps[index];
    newTemps[index].conforme = temp >= minTemp && temp <= maxTemp;
    
    setTemperature(newTemps);
  };

  // ============================================
  // RIGENERA SINGOLA TEMPERATURA
  // ============================================
  const rigeneraSingola = (index) => {
    const newTemps = [...temperature];
    const disp = DISPOSITIVI[index];
    newTemps[index].temperatura = generaTemperaturaRealistica(disp.minTemp, disp.maxTemp);
    newTemps[index].conforme = true;
    setTemperature(newTemps);
  };

  // ============================================
  // RIGENERA TUTTE
  // ============================================
  const rigeneraTutte = () => {
    inizializzaTemperature();
  };

  // ============================================
  // CONFERMA E SALVA (✅ VERSIONE CORRETTA)
  // ============================================
  const handleConferma = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      console.log('💾 [HACCP] ========================================');
      console.log('💾 [HACCP] INIZIO SALVATAGGIO TEMPERATURE');
      console.log('💾 [HACCP] ========================================');
      console.log('📊 [HACCP] Temperature da salvare:', temperature.length);

      // ✅ FORMATO CORRETTO: Array di temperature
      const payload = {
        temperature: temperature.map(temp => ({
          dispositivo: temp.nome, // Nome completo (es: "Frigo 1 Isa")
          temperatura: temp.temperatura,
          conforme: temp.conforme,
          note: null
        })),
        data: new Date().toISOString(),
        operatore: 'Maurizio Mameli',
        note: 'Registrazione settimanale automatica'
      };

      console.log('📤 [HACCP] Payload da inviare:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_URL}/api/haccp/temperature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 [HACCP] Response status:', response.status);
      console.log('📡 [HACCP] Response statusText:', response.statusText);

      const responseText = await response.text();
      console.log('📡 [HACCP] Response body (raw):', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [HACCP] Errore parsing JSON:', parseError);
        throw new Error('Risposta del server non valida');
      }

      console.log('📡 [HACCP] Response parsed:', result);

      if (!response.ok) {
        console.error('❌ [HACCP] Response non OK:', result);
        throw new Error(result.message || `Errore HTTP ${response.status}`);
      }

      if (!result.success) {
        console.error('❌ [HACCP] Success = false:', result);
        throw new Error(result.message || 'Salvataggio fallito');
      }

      console.log('✅ [HACCP] ========================================');
      console.log('✅ [HACCP] SALVATAGGIO COMPLETATO CON SUCCESSO!');
      console.log('✅ [HACCP] ========================================');
      console.log('📊 [HACCP] Risultato:', result.data);

      // Salva data in localStorage come backup
      const oggi = new Date().toISOString().split('T')[0];
      localStorage.setItem('haccp_last_registration', oggi);

      setSaved(true);
      
      // Chiudi dopo 2 secondi
      setTimeout(() => {
        handleClose();
        // Ricarica pagina per aggiornare dashboard
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 2000);

    } catch (err) {
      console.error('💥 [HACCP] ========================================');
      console.error('💥 [HACCP] ERRORE SALVATAGGIO');
      console.error('💥 [HACCP] ========================================');
      console.error('💥 [HACCP] Message:', err.message);
      console.error('💥 [HACCP] Stack:', err.stack);
      
      setError(`Errore nel salvataggio: ${err.message}. Riprova o registra manualmente dalla sezione HACCP.`);
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
                Puoi modificare manualmente ogni valore, rigenerare singole temperature cliccando "🔄" oppure tutte con il pulsante in basso.
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              {temperature.map((temp, index) => {
                const Icon = temp.icon;
                const isConforme = temp.conforme;
                
                return (
                  <Grid item xs={12} sm={6} key={temp.dispositivo}>
                    <Paper 
                      elevation={3}
                      sx={{ 
                        p: 2,
                        borderLeft: `4px solid ${isConforme ? temp.color : '#ff9800'}`,
                        position: 'relative',
                        bgcolor: isConforme ? 'background.paper' : 'rgba(255, 152, 0, 0.05)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Icon sx={{ color: temp.color }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {temp.nome}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <TextField
                          type="number"
                          value={temp.temperatura}
                          onChange={(e) => handleChangeTemp(index, e.target.value)}
                          inputProps={{
                            step: 0.1,
                            style: { 
                              fontSize: 28, 
                              fontWeight: 'bold',
                              color: temp.color,
                              textAlign: 'center'
                            }
                          }}
                          sx={{ width: 100 }}
                          size="small"
                        />
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
                        icon={isConforme ? <CheckIcon /> : <WarningIcon />}
                        label={isConforme ? "CONFORME" : "FUORI RANGE"}
                        color={isConforme ? "success" : "warning"}
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