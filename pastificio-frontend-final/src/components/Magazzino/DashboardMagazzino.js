// src/components/Magazzino/DashboardMagazzino.js
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip
} from '@mui/material';
import { Warning, Inventory, TrendingDown } from '@mui/icons-material';
import axios from 'axios';

export default function DashboardMagazzino({ compact = false, stats = null }) {
  const [data, setData] = useState({
    prodottiSottoScorta: [],
    valoreTotal: 0,
    movimentiRecenti: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!compact && !stats) {
      caricaDati();
    } else if (stats) {
      setData({
        prodottiSottoScorta: stats.prodottiSottoScorta || [],
        valoreTotal: stats.valoreToTale || 0,
        movimentiRecenti: [],
        loading: false,
        error: null
      });
    }
  }, [compact, stats]);

  const caricaDati = async () => {
    try {
      console.log('Caricamento dati dashboard...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setData(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Token non trovato' 
        }));
        return;
      }

      const response = await axios.get('/api/magazzino/dashboard', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Risposta ricevuta:', response.data);
      
      // Gestisci la risposta dal backend
      if (response.data.success) {
        setData({
          prodottiSottoScorta: response.data.prodottiSottoScorta || [],
          valoreTotal: response.data.valoreTotal || 0,
          movimentiRecenti: response.data.movimentiRecenti || [],
          loading: false,
          error: null
        });
      } else {
        // Se success è false
        setData({
          prodottiSottoScorta: response.data.prodottiSottoScorta || [],
          valoreTotal: response.data.valoreTotal || 0,
          movimentiRecenti: response.data.movimentiRecenti || [],
          loading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.response?.data?.error || 'Errore nel caricamento dei dati' 
      }));
    }
  };

  if (data.loading && !compact) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (data.error && !compact) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {data.error}
      </Alert>
    );
  }

  // Mostra sempre il contenuto, anche se non ci sono prodotti sotto scorta
  const hasProdottiSottoScorta = data.prodottiSottoScorta && data.prodottiSottoScorta.length > 0;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Riepilogo Magazzino
      </Typography>
      
      {hasProdottiSottoScorta ? (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          {data.prodottiSottoScorta.length} prodotti sotto scorta minima
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 2 }}>
          Tutti i prodotti hanno scorte sufficienti
        </Alert>
      )}
      
      {!compact && (
        <Grid container spacing={2}>
          {/* Valore Totale */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Valore Magazzino
                </Typography>
                <Typography variant="h5">
                  € {data.valoreTotal?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Stato Scorte */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Stato Scorte
                </Typography>
                {hasProdottiSottoScorta ? (
                  <List dense>
                    {data.prodottiSottoScorta.slice(0, 3).map((prodotto, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={prodotto.prodotto}
                          secondary={
                            <Box>
                              <Typography variant="caption" color="error">
                                {prodotto.quantitaAttuale} / {prodotto.scortaMinima} {prodotto.unita}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min((prodotto.quantitaAttuale / prodotto.scortaMinima) * 100, 100)}
                                color="error"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" color="success.main">
                    ✓ Tutte le scorte sono sopra il livello minimo
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Versione compatta per dashboard principale */}
      {compact && (
        <Box>
          {hasProdottiSottoScorta ? (
            <List dense>
              {data.prodottiSottoScorta.slice(0, 2).map((prodotto, index) => (
                <ListItem key={index}>
                  <Warning color="warning" sx={{ mr: 1 }} />
                  <ListItemText
                    primary={prodotto.prodotto}
                    secondary={`${prodotto.quantitaAttuale} / ${prodotto.scortaMinima} ${prodotto.unita}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="success.main">
              ✓ Scorte OK
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}