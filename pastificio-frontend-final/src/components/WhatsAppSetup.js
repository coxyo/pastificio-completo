// src/components/WhatsAppSetup.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';

function WhatsAppSetup() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check ogni 5 secondi
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Errore verifica stato WhatsApp:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        Configurazione WhatsApp
      </Typography>
      
      {status?.isReady ? (
        <Alert severity="success">
          WhatsApp connesso e pronto all'uso!
        </Alert>
      ) : status?.qrCode ? (
        <Box>
          <Typography variant="body1" gutterBottom>
            Scannerizza questo QR code con WhatsApp
          </Typography>
          <img src={status.qrCode} alt="QR Code WhatsApp" style={{ maxWidth: '300px' }} />
          <Typography variant="caption" display="block" sx={{ mt: 2 }}>
            Apri WhatsApp → Menu → Dispositivi collegati → Collega un dispositivo
          </Typography>
        </Box>
      ) : (
        <Alert severity="info">
          In attesa di generazione QR code...
        </Alert>
      )}
    </Paper>
  );
}

export default WhatsAppSetup;