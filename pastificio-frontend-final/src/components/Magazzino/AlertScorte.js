// src/components/Magazzino/AlertScorte.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  Warning,
  Error,
  CheckCircle,
  NotificationsActive,
  Close
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function AlertScorte() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    checkScorte();
    // Controlla ogni 5 minuti
    const interval = setInterval(checkScorte, 300000);
    return () => clearInterval(interval);
  }, []);

  const checkScorte = async () => {
    try {
      const response = await axios.get('/api/magazzino/prodotti-sotto-scorta', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success && response.data.data.length > 0) {
        setAlerts(response.data.data);
        
        // Mostra notifica toast per prodotti critici
        response.data.data.forEach(item => {
          if (item.quantitaAttuale <= 0) {
            toast.error(`⚠️ ${item.prodotto} ESAURITO!`, {
              autoClose: false,
              closeOnClick: false
            });
          } else if (item.quantitaAttuale < 5) {
            toast.warning(`${item.prodotto}: Solo ${item.quantitaAttuale} ${item.unita} rimanenti`);
          }
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Errore controllo scorte:', error);
      setLoading(false);
    }
  };

  const getPriorityColor = (quantita) => {
    if (quantita <= 0) return 'error';
    if (quantita < 5) return 'warning';
    return 'info';
  };

  const getPriorityIcon = (quantita) => {
    if (quantita <= 0) return <Error color="error" />;
    if (quantita < 5) return <Warning color="warning" />;
    return <NotificationsActive color="info" />;
  };

  if (loading) return null;
  if (alerts.length === 0) return null;

  return (
    <>
      <Paper sx={{ p: 2, mb: 2, border: '2px solid', borderColor: 'warning.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Warning sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="h6">
            Alert Scorte Basse
          </Typography>
          <Chip 
            label={`${alerts.length} prodotti`} 
            color="warning" 
            size="small" 
            sx={{ ml: 2 }}
          />
        </Box>

        <List dense>
          {alerts.map((alert, index) => (
            <ListItem 
              key={index}
              sx={{ 
                bgcolor: alert.quantitaAttuale <= 0 ? 'error.light' : 'warning.light',
                mb: 1,
                borderRadius: 1
              }}
            >
              <ListItemIcon>
                {getPriorityIcon(alert.quantitaAttuale)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="bold">
                    {alert.prodotto}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="body2">
                      Quantità: {alert.quantitaAttuale} / Min: {alert.scortaMinima} {alert.unita}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      Da ordinare: {alert.daOrdinare} {alert.unita}
                    </Typography>
                  </Box>
                }
              />
              <Button 
                variant="contained" 
                size="small"
                onClick={() => {
                  // Qui puoi aggiungere la logica per creare un ordine
                  toast.info(`Creazione ordine per ${alert.prodotto}...`);
                }}
              >
                Ordina
              </Button>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={null}
        onClose={() => setShowSnackbar(false)}
        message="Attenzione: Prodotti in esaurimento!"
        action={
          <IconButton size="small" color="inherit" onClick={() => setShowSnackbar(false)}>
            <Close />
          </IconButton>
        }
      />
    </>
  );
}