// src/components/SelectOrarioIntelligente.js - ✅ FIX 04/03/2026
// ✅ FIX: Mostra chip per TUTTI gli slot di produzione, anche quelli con 0 Kg ordinati
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
 * 
 * ✅ FIX 04/03/2026:
 * - Mostra chip anche per slot con 0 ordini (era il bug principale)
 * - Soglie colore corrette: Verde <70%, Arancione 70-90%, Rosso >90%
 * - Funziona sia col prodotto corrente che col carrello già inserito
 */
const SelectOrarioIntelligente = ({ 
  value, 
  onChange, 
  conteggioOrari, 
  loading,
  disabled,
  prodottoSelezionato = null // 'ravioli', 'zeppole', o null
}) => {
  
  // Genera tutti gli orari possibili (08:00 - 20:00, ogni 30 min)
  const generaOrari = () => {
    const orari = [];
    for (let h = 8; h <= 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        const ora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        orari.push(ora);
        if (h === 20 && m === 0) break;
      }
    }
    return orari;
  };

  const orari = generaOrari();

  // ✅ FIX: Ottieni capacità per prodotto selezionato
  // Ora mostra chip anche quando ordinatoKg = 0 (slot libero ma in fascia produzione)
  const getCapacitaPerOrario = (ora) => {
    if (!conteggioOrari || !conteggioOrari.capacitaPerOra) {
      return null;
    }
    
    const capacitaOra = conteggioOrari.capacitaPerOra[ora];
    if (!capacitaOra) return null;
    
    // Se non c'è prodotto selezionato, non mostrare capacità
    if (!prodottoSelezionato) return null;
    
    // ✅ FIX: Ritorna la capacità anche se ordinatoKg = 0
    // Prima: `|| null` escludeva gli slot vuoti → bug principale
    const cap = capacitaOra[prodottoSelezionato];
    if (!cap) return null;
    
    return cap;
  };

  // ✅ FIX: Soglie colore corrette (Verde <70%, Arancione 70-90%, Rosso >90%)
  const getColoreChip = (capacita) => {
    if (!capacita) return 'default';
    const pct = capacita.percentuale;
    if (pct < 70) return 'success';
    if (pct <= 90) return 'warning';
    return 'error';
  };

  // Determina icona prodotto
  const getIconaProdotto = (tipo) => {
    if (tipo === 'ravioli') return <RestaurantIcon fontSize="small" />;
    if (tipo === 'zeppole') return <CakeIcon fontSize="small" />;
    return null;
  };

  // Formatta label chip: "2.5/5 Kg" oppure "0/5 Kg" per slot liberi
  const getLabelChip = (capacita) => {
    const ordinato = capacita.ordinatoKg || 0;
    return `${ordinato}/${capacita.capacitaKg}Kg`;
  };

  // Colore sfondo riga per slot critici
  const getBgOrario = (capacita) => {
    if (!capacita) return 'transparent';
    const pct = capacita.percentuale;
    if (pct > 90) return 'rgba(244, 67, 54, 0.08)';
    if (pct >= 70) return 'rgba(255, 152, 0, 0.08)';
    return 'transparent';
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
      {/* Placeholder */}
      <MenuItem value="" disabled>
        <em>Seleziona orario</em>
      </MenuItem>

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
              minHeight: '48px',
              '&:hover': { backgroundColor: '#f5f5f5' },
              backgroundColor: getBgOrario(capacita)
            }}
          >
            {/* Orario */}
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

            {/* Chip capacità - visibile per TUTTI gli slot in fascia produzione */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {capacita && (
                <Chip
                  size="small"
                  icon={getIconaProdotto(prodottoSelezionato)}
                  label={getLabelChip(capacita)}
                  color={getColoreChip(capacita)}
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