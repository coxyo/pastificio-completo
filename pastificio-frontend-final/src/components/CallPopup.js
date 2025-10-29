// src/components/CallPopup.js
// Modal popup per chiamate in arrivo con dati cliente e ultimi ordini

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  CircularProgress,
  Paper,
  Grid
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as ShippingIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

export default function CallPopup({ open, onClose, callData }) {
  const [clienteDettagli, setClienteDettagli] = useState(null);
  const [ultomiOrdini, setUltomiOrdini] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Effetto per caricare dati cliente quando si apre il popup
  useEffect(() => {
    if (open && callData?.cliente?._id) {
      caricaDatiCliente(callData.cliente._id);
    }
  }, [open, callData]);

  // Auto-chiusura dopo 30 secondi
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        console.log('[CallPopup] Auto-chiusura dopo 30 secondi');
        onClose();
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  // Funzione per caricare dati dettagliati del cliente
  const caricaDatiCliente = async (clienteId) => {
    setLoading(true);
    setError(null);

    try {
      // Carica dettagli cliente
      const token = localStorage.getItem('token');
      const responseCliente = await fetch(`${API_URL}/clienti/${clienteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!responseCliente.ok) {
        throw new Error('Errore caricamento cliente');
      }

      const cliente = await responseCliente.json();
      setClienteDettagli(cliente);

      // Carica ultimi 5 ordini del cliente
      const responseOrdini = await fetch(
        `${API_URL}/ordini?cliente=${clienteId}&limit=5&sort=-createdAt`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (responseOrdini.ok) {
        const ordini = await responseOrdini.json();
        setUltomiOrdini(ordini.data || ordini || []);
      }

    } catch (err) {
      console.error('[CallPopup] Errore caricamento dati:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNuovoOrdine = () => {
    // Logica per aprire form nuovo ordine con dati cliente pre-compilati
    console.log('[CallPopup] Apertura form nuovo ordine per:', callData?.cliente);
    
    // Potresti usare un evento custom o state globale
    window.dispatchEvent(new CustomEvent('apri-nuovo-ordine', {
      detail: { cliente: clienteDettagli || callData?.cliente }
    }));
    
    onClose();
  };

  const handleVisualizzaCliente = () => {
    // Naviga alla pagina del cliente
    if (callData?.cliente?._id) {
      window.location.href = `/clienti/${callData.cliente._id}`;
    }
    onClose();
  };

  if (!callData) return null;

  const cliente = clienteDettagli || callData.cliente || {};
  const nomeCompleto = cliente.nome && cliente.cognome 
    ? `${cliente.nome} ${cliente.cognome}`
    : cliente.nome || 'Cliente Sconosciuto';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }
      }}
    >
      {/* Header con icona telefono animata */}
      <DialogTitle sx={{ pb: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <PhoneIcon sx={{ animation: 'ring 1s ease-in-out infinite' }} />
            <Typography variant="h6" fontWeight="bold">
              Chiamata in arrivo
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box textAlign="center" py={3}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            {/* Dati Cliente */}
            <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                  {nomeCompleto.charAt(0).toUpperCase()}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {nomeCompleto}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📞 {callData.numero}
                  </Typography>
                  {cliente.codice && (
                    <Chip 
                      label={cliente.codice} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
              </Box>

              {/* Statistiche Cliente */}
              {clienteDettagli && (
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="primary">
                        {clienteDettagli.punti || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Punti
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="success.main">
                        {ultomiOrdini.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ordini
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Chip 
                        label={clienteDettagli.livelloFedelta || 'Base'}
                        size="small"
                        color={
                          clienteDettagli.livelloFedelta === 'Platinum' ? 'secondary' :
                          clienteDettagli.livelloFedelta === 'Gold' ? 'warning' :
                          clienteDettagli.livelloFedelta === 'Silver' ? 'info' : 'default'
                        }
                      />
                      <Typography variant="caption" display="block" color="text.secondary">
                        Livello
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* Ultimi Ordini */}
            {ultomiOrdini.length > 0 && (
              <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  📦 Ultimi {ultomiOrdini.length} ordini
                </Typography>
                <Divider sx={{ my: 1 }} />
                <List dense>
                  {ultomiOrdini.map((ordine, index) => (
                    <React.Fragment key={ordine._id || index}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2">
                                {new Date(ordine.dataRitiro || ordine.createdAt).toLocaleDateString('it-IT')}
                              </Typography>
                              <Chip 
                                label={ordine.stato || 'Completato'}
                                size="small"
                                color={ordine.stato === 'Completato' ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {ordine.prodotti?.length || 0} prodotti • €{(ordine.totale || 0).toFixed(2)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < ultomiOrdini.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}

            {/* Messaggio se cliente nuovo */}
            {!clienteDettagli && !cliente._id && (
              <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                <Typography variant="body2" color="info.dark">
                  ℹ️ Questo numero non è ancora registrato nel sistema
                </Typography>
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
        >
          Ignora
        </Button>
        
        {cliente._id && (
          <Button
            onClick={handleVisualizzaCliente}
            variant="outlined"
            startIcon={<AccountIcon />}
          >
            Scheda Cliente
          </Button>
        )}
        
        <Button
          onClick={handleNuovoOrdine}
          variant="contained"
          color="primary"
          startIcon={<OrderIcon />}
        >
          Nuovo Ordine
        </Button>
      </DialogActions>

      {/* CSS per animazione telefono */}
      <style jsx global>{`
        @keyframes ring {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(-10deg); }
          20%, 40% { transform: rotate(10deg); }
          50% { transform: rotate(0deg); }
        }
      `}</style>
    </Dialog>
  );
}