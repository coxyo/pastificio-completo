// components/ChipQuantita.jsx
// ✅ COMPONENTE RIUTILIZZABILE PER CHIP QUANTITÀ

import React from 'react';
import { Box, Chip, Typography } from '@mui/material';

const VALORI_RAPIDI = {
  Kg: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2, 1.3, 1.5, 1.7, 2, 2.5, 3],
  Pezzi: [2, 4, 6, 8, 10, 12, 15, 16, 20, 24, 30, 50],
  g: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
  '€': [5, 10, 15, 20, 25, 30]
};

/**
 * Componente per selezionare quantità tramite chip
 * 
 * @param {string} unita - Unità di misura (Kg, Pezzi, g, €)
 * @param {number|string} value - Valore corrente
 * @param {function} onChange - Callback quando cambia valore
 * @param {string} label - Label da mostrare sopra i chip (opzionale)
 */
export default function ChipQuantita({ unita = 'Kg', value, onChange, label }) {
  const valori = VALORI_RAPIDI[unita] || VALORI_RAPIDI.Kg;
  
  const chipStyle = {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    minWidth: '70px',
    height: '48px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': { transform: 'scale(1.05)' },
    '&:active': { transform: 'scale(0.95)' }
  };

  return (
    <Box>
      {label && (
        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
          {label}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {valori.map((val) => (
          <Chip
            key={val}
            label={`${val} ${unita}`}
            onClick={() => onChange(val)}
            color={parseFloat(value) === val ? 'primary' : 'default'}
            variant={parseFloat(value) === val ? 'filled' : 'outlined'}
            sx={{
              ...chipStyle,
              ...(parseFloat(value) === val ? {
                backgroundColor: '#1976d2',
                color: 'white'
              } : {})
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

// ✅ Valori piccoli per nr vassoi
export function ChipNumero({ value, onChange, label, max = 10 }) {
  const numeri = Array.from({ length: max }, (_, i) => i + 1);
  
  const chipStylePiccolo = {
    fontSize: '0.95rem',
    fontWeight: '500',
    minWidth: '40px',
    height: '36px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': { transform: 'scale(1.05)' },
    '&:active': { transform: 'scale(0.95)' }
  };

  return (
    <Box>
      {label && (
        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
          {label}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {numeri.map((num) => (
          <Chip
            key={num}
            label={num}
            onClick={() => onChange(num)}
            color={parseInt(value) === num ? 'primary' : 'default'}
            variant={parseInt(value) === num ? 'filled' : 'outlined'}
            sx={{
              ...chipStylePiccolo,
              ...(parseInt(value) === num ? {
                backgroundColor: '#1976d2',
                color: 'white'
              } : {})
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
