// src/components/SelectOrarioIntelligente.js
import React from 'react';
import { 
  TextField, 
  MenuItem, 
  Box, 
  Typography,
  CircularProgress 
} from '@mui/material';

/**
 * Select orario con conteggio ordini e semaforo colorato
 * Mostra quanti ordini ci sono per ogni orario della giornata
 */
const SelectOrarioIntelligente = ({ 
  value, 
  onChange, 
  conteggioOrari, 
  loading,
  disabled 
}) => {
  
  // Genera tutti gli orari possibili (08:00 - 20:00, ogni 30 min)
  const generaOrari = () => {
    const orari = [];
    for (let h = 8; h <= 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        const ora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        orari.push(ora);
        if (h === 20 && m === 0) break; // Stop a 20:00
      }
    }
    return orari;
  };

  const orari = generaOrari();

  // Ottieni conteggio per un orario specifico
  const getConteggioPerOrario = (ora) => {
    if (!conteggioOrari || !conteggioOrari.conteggioPerOra) {
      return 0;
    }
    return conteggioOrari.conteggioPerOra[ora] || 0;
  };

  // Determina colore semaforo in base al conteggio
  const getColore = (conteggio) => {
    if (conteggio === 0 || conteggio <= 2) return '🟢'; // Verde
    if (conteggio <= 4) return '🟡'; // Giallo
    return '🔴'; // Rosso
  };

  // Determina se mostrare warning (5+ ordini)
  const mostraWarning = (conteggio) => {
    return conteggio >= 5;
  };

  return (
    <TextField
      select
      fullWidth
      label="Ora Ritiro *"
      value={value}
      onChange={onChange}
      disabled={disabled || loading}
      required
      sx={{
        '& .MuiSelect-select': {
          paddingTop: 2,
          paddingBottom: 2
        }
      }}
      InputProps={{
        endAdornment: loading ? (
          <CircularProgress size={20} sx={{ marginRight: 2 }} />
        ) : null
      }}
    >
      {/* Placeholder quando non c'è selezione */}
      <MenuItem value="" disabled>
        <em>Seleziona orario</em>
      </MenuItem>

      {/* Lista orari con conteggio e semaforo */}
      {orari.map((ora) => {
        const conteggio = getConteggioPerOrario(ora);
        const colore = getColore(conteggio);
        const warning = mostraWarning(conteggio);

        return (
          <MenuItem 
            key={ora} 
            value={ora}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              minHeight: '48px', // Touch-friendly
              '&:hover': {
                backgroundColor: '#f5f5f5'
              },
              // Evidenzia orari critici (5+ ordini)
              backgroundColor: warning ? 'rgba(244, 67, 54, 0.08)' : 'transparent'
            }}
          >
            {/* Parte sinistra: Orario */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: value === ora ? 600 : 400,
                  fontSize: '1rem'
                }}
              >
                {ora}
              </Typography>
            </Box>

            {/* Parte destra: Semaforo, Conteggio, Warning */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Semaforo */}
              <Typography sx={{ fontSize: '1.2rem' }}>
                {colore}
              </Typography>

              {/* Conteggio ordini */}
              <Typography 
                variant="body2" 
                sx={{ 
                  color: warning ? '#f44336' : '#666',
                  fontWeight: warning ? 600 : 400,
                  fontSize: '0.9rem'
                }}
              >
                ({conteggio})
              </Typography>

              {/* Warning icon se >= 5 ordini */}
              {warning && (
                <Typography sx={{ fontSize: '1rem' }}>
                  ⚠️
                </Typography>
              )}
            </Box>
          </MenuItem>
        );
      })}
    </TextField>
  );
};

export default SelectOrarioIntelligente;