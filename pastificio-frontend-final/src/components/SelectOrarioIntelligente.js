// src/components/SelectOrarioIntelligente.js - ✅ MODIFICATO 29/01/2026
// ✅ NUOVO: Mostra capacità produttiva SOLO per prodotto selezionato
import React from 'react';
import { 
  TextField, 
  MenuItem, 
  Box, 
  Typography,
  CircularProgress,
  Chip 
} from '@mui/material';
import { Restaurant as RestaurantIcon, Cake as CakeIcon } from '@mui/icons-material';

/**
 * Select orario con capacità produttiva dinamica
 * Mostra Kg ordinati/disponibili SOLO per il prodotto che stai aggiungendo
 */
const SelectOrarioIntelligente = ({ 
  value, 
  onChange, 
  conteggioOrari, 
  loading,
  disabled,
  prodottoSelezionato = null // ✅ NUOVO: 'ravioli', 'zeppole', o null
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

  // ✅ NUOVO: Ottieni capacità per prodotto selezionato
  const getCapacitaPerOrario = (ora) => {
    if (!conteggioOrari || !conteggioOrari.capacitaPerOra) {
      return null;
    }
    
    const capacitaOra = conteggioOrari.capacitaPerOra[ora];
    if (!capacitaOra) return null;
    
    // Se non c'è prodotto selezionato, non mostrare capacità
    if (!prodottoSelezionato) return null;
    
    // Ritorna SOLO la capacità del prodotto selezionato
    return capacitaOra[prodottoSelezionato] || null;
  };

  // Determina colore chip in base allo stato
  const getColoreChip = (stato) => {
    if (stato === 'ok') return 'success';
    if (stato === 'attenzione') return 'warning';
    if (stato === 'pieno') return 'error';
    return 'default';
  };

  // Determina icona prodotto
  const getIconaProdotto = (tipo) => {
    if (tipo === 'ravioli') return <RestaurantIcon fontSize="small" />;
    if (tipo === 'zeppole') return <CakeIcon fontSize="small" />;
    return null;
  };

  // Formatta label chip
  const getLabelChip = (capacita) => {
    return `${capacita.ordinatoKg}/${capacita.capacitaKg}Kg`;
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

      {/* Lista orari con capacità filtrata per prodotto */}
      {orari.map((ora) => {
        const capacita = getCapacitaPerOrario(ora);

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
              // Evidenzia orari critici
              backgroundColor: capacita?.stato === 'pieno' ? 'rgba(244, 67, 54, 0.08)' : 
                               capacita?.stato === 'attenzione' ? 'rgba(255, 152, 0, 0.08)' : 
                               'transparent'
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

            {/* Parte destra: Chip capacità (SOLO se prodotto critico selezionato) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {capacita && (
                <Chip
                  size="small"
                  icon={getIconaProdotto(prodottoSelezionato)}
                  label={getLabelChip(capacita)}
                  color={getColoreChip(capacita.stato)}
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    height: '28px'
                  }}
                />
              )}
            </Box>
          </MenuItem>
        );
      })}
    </TextField>
  );
};

export default SelectOrarioIntelligente;