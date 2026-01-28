// src/components/BarraDisponibilita.js
import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  Schedule as ClockIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon 
} from '@mui/icons-material';

/**
 * Barra compatta che mostra disponibilità orari per una data
 * Aggiornata automaticamente quando cambia la data o arrivano nuovi ordini
 */
const BarraDisponibilita = ({ conteggioOrari, dataSelezionata, loading }) => {
  
  // Se loading o nessun dato, non mostrare nulla
  if (loading || !conteggioOrari) {
    return null;
  }

  const { 
    totaleOrdini, 
    orarioPicco, 
    ordiniPicco, 
    fasceLibere 
  } = conteggioOrari;

  // Formatta data in formato leggibile (es: "Sab 25/01")
  const formattaData = (dataStr) => {
    if (!dataStr) return '';
    const data = new Date(dataStr + 'T12:00:00'); // Fix timezone
    const giorni = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const giorno = giorni[data.getDay()];
    const dd = String(data.getDate()).padStart(2, '0');
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    return `${giorno} ${dd}/${mm}`;
  };

  // Formatta fasceLibere in range (es: "13:00-15:00")
  const formattaFasceLibere = () => {
    if (!fasceLibere || fasceLibere.length === 0) {
      return 'Nessuna';
    }

    // Se ci sono molte fasce libere, mostra solo le prime 3
    if (fasceLibere.length > 3) {
      const prime3 = fasceLibere.slice(0, 3).join(', ');
      return `${prime3}, ...`;
    }

    // Altrimenti mostra tutte
    return fasceLibere.join(', ');
  };

  // Determina il colore della barra in base al carico
  const getColoreBarra = () => {
    if (totaleOrdini === 0) return '#4caf50'; // Verde
    if (totaleOrdini <= 5) return '#4caf50';  // Verde
    if (totaleOrdini <= 10) return '#ff9800'; // Arancione
    return '#f44336'; // Rosso
  };

  // Nessun ordine per questa data
  if (totaleOrdini === 0) {
    return (
      <Box
        sx={{
          backgroundColor: '#e8f5e9',
          border: '2px solid #4caf50',
          borderRadius: 2,
          padding: 2,
          marginBottom: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <CheckIcon sx={{ color: '#4caf50', fontSize: 32 }} />
        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2e7d32' }}>
          📅 {formattaData(dataSelezionata)}: Nessun ordine - Giornata libera! 🎉
        </Typography>
      </Box>
    );
  }

  // Barra con ordini
  return (
    <Box
      sx={{
        backgroundColor: '#f5f5f5',
        border: `2px solid ${getColoreBarra()}`,
        borderRadius: 2,
        padding: 2,
        marginBottom: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}
    >
      {/* Sezione Sinistra: Data e Totale */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CalendarIcon sx={{ color: getColoreBarra(), fontSize: 28 }} />
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          📅 {formattaData(dataSelezionata)}:
        </Typography>
        <Chip
          label={`${totaleOrdini} ordini`}
          color={totaleOrdini <= 5 ? 'success' : totaleOrdini <= 10 ? 'warning' : 'error'}
          size="medium"
          sx={{ fontWeight: 600, fontSize: '0.95rem' }}
        />
      </Box>

      {/* Sezione Centro: Orario Picco */}
      {orarioPicco && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ClockIcon sx={{ color: '#ff9800', fontSize: 24 }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            ⏰ Picco: <strong>{orarioPicco}</strong> ({ordiniPicco})
          </Typography>
          {ordiniPicco >= 5 && (
            <WarningIcon sx={{ color: '#f44336', fontSize: 20 }} />
          )}
        </Box>
      )}

      {/* Sezione Destra: Fasce Libere */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckIcon sx={{ color: '#4caf50', fontSize: 24 }} />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          🟢 Libero: {formattaFasceLibere()}
        </Typography>
      </Box>
    </Box>
  );
};

export default BarraDisponibilita;