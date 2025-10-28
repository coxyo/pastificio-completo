// components/CallPopup.js - VERSIONE MIGLIORATA con auto-close

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogActions, Button, Typography, Box, Avatar, Chip } from '@mui/material';
import { Phone, PhoneIncoming, Close, AccountCircle } from '@mui/icons-material';

const CallPopup = ({ open, onClose, callData }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Auto-close dopo 15 secondi
  useEffect(() => {
    if (open) {
      // Reset timer
      setTimeElapsed(0);
      
      // Timer countdown
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      
      // Auto-close dopo 15 secondi
      const autoCloseTimer = setTimeout(() => {
        console.log('[CallPopup] ⏰ Auto-close dopo 15 secondi');
        onClose();
      }, 15000);
      
      return () => {
        clearInterval(timer);
        clearTimeout(autoCloseTimer);
      };
    }
  }, [open, onClose]);
  
  if (!callData) return null;
  
  const { numero, cliente, timestamp } = callData;
  const nomeCompleto = cliente 
    ? `${cliente.nome || ''} ${cliente.cognome || ''}`.trim() 
    : 'Cliente Sconosciuto';
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24,
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <PhoneIncoming />
        Chiamata in Arrivo
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {/* Avatar Cliente */}
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.light' }}>
            {cliente?.nome ? cliente.nome.charAt(0).toUpperCase() : <AccountCircle sx={{ fontSize: 60 }} />}
          </Avatar>
          
          {/* Nome Cliente */}
          <Typography variant="h5" fontWeight="bold">
            {nomeCompleto}
          </Typography>
          
          {/* Numero Telefono */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Phone color="action" />
            <Typography variant="h6" color="text.secondary">
              {numero}
            </Typography>
          </Box>
          
          {/* Info Cliente */}
          {cliente && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              {cliente.codice && (
                <Chip 
                  label={`Codice: ${cliente.codice}`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              )}
              {cliente.livelloFedelta && (
                <Chip 
                  label={cliente.livelloFedelta} 
                  size="small" 
                  color="secondary"
                />
              )}
              {cliente.punti && (
                <Chip 
                  label={`${cliente.punti} punti`} 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
              )}
            </Box>
          )}
          
          {/* Timer Auto-close */}
          <Typography variant="caption" color="text.secondary">
            Chiusura automatica tra {15 - timeElapsed} secondi
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          startIcon={<Close />}
          fullWidth
        >
          Chiudi
        </Button>
        {cliente && (
          <Button 
            onClick={() => {
              // Apri scheda cliente
              window.location.href = `/clienti/${cliente._id}`;
            }}
            variant="contained" 
            startIcon={<AccountCircle />}
            fullWidth
          >
            Vedi Cliente
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CallPopup;