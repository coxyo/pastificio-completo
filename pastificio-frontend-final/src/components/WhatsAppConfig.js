// components/WhatsAppConfig.js
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress, Alert
} from '@mui/material';
import { WhatsApp as WhatsAppIcon, QrCode as QrIcon } from '@mui/icons-material';
import whatsappAPI from '../services/whatsappAPI';

export default function WhatsAppConfig({ open, onClose }) {
  const [status, setStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      checkStatus();
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [open]);

  const checkStatus = async () => {
    try {
      const statusData = await whatsappAPI.getStatus();
      setStatus(statusData);
      
      if (!statusData.connected) {
        const qrData = await whatsappAPI.getQRCode();
        setQrCode(qrData.qrCode);
      } else {
        setQrCode(null);
      }
    } catch (error) {
      console.error('Errore verifica stato:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    await whatsappAPI.restart();
    setTimeout(checkStatus, 2000);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsAppIcon color="success" />
          <Typography variant="h6">Configurazione WhatsApp</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Verifica connessione...</Typography>
          </Box>
        ) : (
          <>
            {status?.connected ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ WhatsApp connesso e funzionante!
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                ⚠️ WhatsApp non connesso - Scansiona il QR Code
              </Alert>
            )}

            {qrCode && (
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Scansiona questo QR Code con WhatsApp:
                </Typography>
                <img src={qrCode} alt="QR Code" style={{ maxWidth: '100%' }} />
                <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                  1. Apri WhatsApp sul telefono<br/>
                  2. Vai su Impostazioni → Dispositivi collegati<br/>
                  3. Tocca "Collega un dispositivo"<br/>
                  4. Scansiona questo QR Code
                </Typography>
              </Box>
            )}

            {status && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Stato: <strong>{status.status}</strong>
                </Typography>
                {status.info?.phoneNumber && (
                  <Typography variant="body2">
                    Numero: <strong>{status.info.phoneNumber}</strong>
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        {!loading && !status?.connected && (
          <Button onClick={handleRestart} color="warning">
            Riavvia WhatsApp
          </Button>
        )}
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
}