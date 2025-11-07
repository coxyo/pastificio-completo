// components/StoricoChiamate.js - Widget Storico Chiamate nel CallPopup
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Phone as PhoneIcon,
  ShoppingCart as CartIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

export default function StoricoChiamate({ clienteId, numero }) {
  const [chiamate, setChiamate] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (clienteId || numero) {
      caricaStorico();
      caricaStatistiche();
    }
  }, [clienteId, numero]);

  const caricaStorico = async () => {
    try {
      setLoading(true);
      
      const query = new URLSearchParams();
      if (clienteId) query.append('clienteId', clienteId);
      if (numero) query.append('numero', numero);
      query.append('limit', '5');
      
      const response = await fetch(`${API_URL}/cx3/history?${query.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setChiamate(data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento storico:', error);
    } finally {
      setLoading(false);
    }
  };

  const caricaStatistiche = async () => {
    if (!clienteId) return;
    
    try {
      const response = await fetch(`${API_URL}/cx3/stats?clienteId=${clienteId}`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
  };

  const getStatoIcon = (stato) => {
    switch (stato) {
      case 'risposta':
        return <CheckIcon color="success" />;
      case 'persa':
        return <CancelIcon color="error" />;
      default:
        return <PhoneIcon color="action" />;
    }
  };

  const getEsitoChip = (esito) => {
    const config = {
      ordine_creato: { label: 'Ordine Creato', color: 'success' },
      richiesta_info: { label: 'Info', color: 'info' },
      richiamata: { label: 'Richiamata', color: 'warning' },
      nessun_ordine: { label: 'Nessun Ordine', color: 'default' },
      altro: { label: 'Altro', color: 'default' }
    };
    
    const conf = config[esito] || config.altro;
    return <Chip label={conf.label} color={conf.color} size="small" />;
  };

  const formatDurata = (secondi) => {
    if (!secondi) return 'N/D';
    const minuti = Math.floor(secondi / 60);
    const sec = secondi % 60;
    return `${minuti}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!chiamate || chiamate.length === 0) {
    return (
      <Alert severity="info" icon={<InfoIcon />}>
        Nessuna chiamata precedente trovata
      </Alert>
    );
  }

  return (
    <Box>
      {/* Statistiche */}
      {stats && (
        <Box sx={{ 
          mb: 2, 
          p: 2, 
          bgcolor: 'primary.light', 
          borderRadius: 1,
          color: 'primary.contrastText'
        }}>
          <Typography variant="subtitle2" gutterBottom>
            📊 Statistiche Chiamate
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              icon={<PhoneIcon />}
              label={`${stats.totaleChiamate} chiamate`}
              size="small"
              sx={{ bgcolor: 'white' }}
            />
            <Chip 
              icon={<CartIcon />}
              label={`${stats.chiamateConOrdine} con ordine`}
              size="small"
              sx={{ bgcolor: 'white' }}
            />
            {stats.durataMedia > 0 && (
              <Chip 
                icon={<ScheduleIcon />}
                label={`Media: ${formatDurata(Math.floor(stats.durataMedia))}`}
                size="small"
                sx={{ bgcolor: 'white' }}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Lista chiamate */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
            📞 Ultime {chiamate.length} chiamate
          </Typography>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <List dense>
            {chiamate.map((chiamata, index) => (
              <React.Fragment key={chiamata._id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>
                    {getStatoIcon(chiamata.stato)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {new Date(chiamata.dataOraChiamata).toLocaleDateString('it-IT')}
                          {' '}
                          {new Date(chiamata.dataOraChiamata).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                        {chiamata.esitoChiamata && getEsitoChip(chiamata.esitoChiamata)}
                      </Box>
                    }
                    secondary={
                      <>
                        {chiamata.durata > 0 && (
                          <Typography variant="caption" display="block">
                            Durata: {formatDurata(chiamata.durata)}
                          </Typography>
                        )}
                        {chiamata.ordineCollegato && (
                          <Typography variant="caption" display="block" color="success.main">
                            ✓ Ordine collegato (€{chiamata.ordineCollegato.totale?.toFixed(2)})
                          </Typography>
                        )}
                        {chiamata.note && (
                          <Typography variant="caption" display="block" fontStyle="italic">
                            Note: {chiamata.note}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Collapse>
      </Box>
    </Box>
  );
}
