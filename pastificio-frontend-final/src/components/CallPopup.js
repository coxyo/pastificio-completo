// src/components/CallPopup.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Alert
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  ShoppingCart as OrderIcon,
  Star as StarIcon,
  History as HistoryIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

/**
 * POPUP CHIAMATA IN ARRIVO
 * 
 * Si apre automaticamente quando arriva una chiamata
 * Mostra info cliente, ultimi ordini, note
 */
function CallPopup({ chiamata, onClose, onSaveNote }) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [ultimiOrdini, setUltimiOrdini] = useState([]);
  const [loadingOrdini, setLoadingOrdini] = useState(false);

  const { cliente, numero, callId, timestamp } = chiamata;

  // Carica ultimi ordini del cliente
  useEffect(() => {
    if (cliente?.id) {
      caricaUltimiOrdini();
    }
  }, [cliente]);

  const caricaUltimiOrdini = async () => {
    setLoadingOrdini(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/ordini?clienteId=${cliente.id}&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUltimiOrdini(data.ordini || []);
      }
    } catch (error) {
      console.error('[POPUP] Errore caricamento ordini:', error);
    } finally {
      setLoadingOrdini(false);
    }
  };

  const handleSaveNote = async () => {
    if (!note.trim()) return;

    setLoading(true);
    try {
      await onSaveNote(callId, note);
      setNote('');
    } catch (error) {
      console.error('[POPUP] Errore salvataggio nota:', error);
    } finally {
      setLoading(false);
    }
  };

  // Colore badge fedeltà
  const getLivelloColor = (livello) => {
    const colors = {
      bronzo: '#CD7F32',
      argento: '#C0C0C0',
      oro: '#FFD700',
      platino: '#E5E4E2'
    };
    return colors[livello] || '#999';
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <PhoneIcon sx={{ animation: 'pulse 1.5s infinite' }} />
          <Typography variant="h6" fontWeight="bold">
            Chiamata in Arrivo
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Info Cliente */}
        {cliente ? (
          <Box>
            {/* Avatar e Nome */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem'
                }}
              >
                {cliente.nome[0]}{cliente.cognome[0]}
              </Avatar>

              <Box flex={1}>
                <Typography variant="h5" fontWeight="bold">
                  {cliente.nome} {cliente.cognome}
                </Typography>

                <Box display="flex" gap={1} mt={0.5}>
                  <Chip
                    label={cliente.codiceCliente}
                    size="small"
                    icon={<PersonIcon />}
                  />

                  {cliente.livelloFedelta && (
                    <Chip
                      label={cliente.livelloFedelta.toUpperCase()}
                      size="small"
                      icon={<StarIcon />}
                      sx={{
                        bgcolor: getLivelloColor(cliente.livelloFedelta),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Contatti */}
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Telefono: <strong>{cliente.telefono}</strong>
              </Typography>
              {cliente.email && (
                <Typography variant="body2" color="text.secondary">
                  Email: <strong>{cliente.email}</strong>
                </Typography>
              )}
              {cliente.punti > 0 && (
                <Typography variant="body2" color="primary" fontWeight="bold">
                  Punti Fedeltà: {cliente.punti}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Ultimi Ordini */}
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                display="flex"
                alignItems="center"
                gap={1}
                mb={1}
              >
                <HistoryIcon fontSize="small" />
                Ultimi Ordini
              </Typography>

              {loadingOrdini ? (
                <Typography variant="body2" color="text.secondary">
                  Caricamento...
                </Typography>
              ) : ultimiOrdini.length > 0 ? (
                <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                  {ultimiOrdini.slice(0, 3).map((ordine) => (
                    <ListItem key={ordine._id} divider>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="bold">
                            {new Date(ordine.dataConsegna).toLocaleDateString('it-IT')}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption">
                            {ordine.prodotti?.length || 0} prodotti - €{ordine.totale?.toFixed(2) || '0.00'}
                          </Typography>
                        }
                      />
                      <Chip
                        label={ordine.stato}
                        size="small"
                        color={ordine.stato === 'completato' ? 'success' : 'default'}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nessun ordine precedente
                </Typography>
              )}
            </Box>

          </Box>
        ) : (
          /* Numero Sconosciuto */
          <Box textAlign="center" py={2}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'grey.400',
                margin: '0 auto',
                mb: 2
              }}
            >
              <PhoneIcon sx={{ fontSize: 32 }} />
            </Avatar>

            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Numero Sconosciuto
            </Typography>

            <Typography variant="h5" color="primary" fontWeight="bold" mb={1}>
              {numero}
            </Typography>

            <Alert severity="info" sx={{ mt: 2 }}>
              Questo numero non è associato a nessun cliente. Puoi creare un nuovo cliente dopo la chiamata.
            </Alert>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Note Chiamata */}
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            display="flex"
            alignItems="center"
            gap={1}
            mb={1}
          >
            <NotesIcon fontSize="small" />
            Note Chiamata
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Aggiungi note sulla chiamata..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>

        {/* Info Timestamp */}
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          textAlign="center"
          mt={2}
        >
          Chiamata ricevuta {formatDistanceToNow(new Date(timestamp), { 
            addSuffix: true,
            locale: it 
          })}
        </Typography>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
        >
          Chiudi
        </Button>

        {note.trim() && (
          <Button
            onClick={handleSaveNote}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={<NotesIcon />}
          >
            {loading ? 'Salvataggio...' : 'Salva Nota'}
          </Button>
        )}
      </DialogActions>

      {/* CSS per animazione pulse - inline nel componente */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </Dialog>
  );
}

export default CallPopup;