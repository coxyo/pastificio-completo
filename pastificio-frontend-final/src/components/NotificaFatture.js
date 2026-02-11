// components/NotificaFatture.js
// Componente per notifica giornaliera promemoria fatture
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
  IconButton,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  FolderOpen as FolderIcon,
  CloudUpload as ImportIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import dispositivoService from '@/services/dispositivoService';

// Configurazione - PATH CARTELLA FATTURE
const CARTELLA_FATTURE = 'C:\\Users\\Maurizio Mameli\\pastificio-completo\\Fatture';

export default function NotificaFatture() {
  const [open, setOpen] = useState(false);
  const [nonMostrareOggi, setNonMostrareOggi] = useState(false);
  const router = useRouter();

  useEffect(() => {
    verificaNotifica();
  }, []);

  const verificaNotifica = () => {
    // ============ CONTROLLO DISPOSITIVO ============
    // Verifica se la notifica fatture è abilitata per questo dispositivo
    if (!dispositivoService.isNotificaAbilitata('fatture')) {
      console.log('[NotificaFatture] Notifica disabilitata per questo dispositivo');
      return;
    }
    
    // Controlla se già mostrata oggi
    const oggi = new Date().toDateString();
    const ultimaNotifica = localStorage.getItem('ultimaNotificaFatture');
    const nascondiOggi = localStorage.getItem('nascondiNotificaFattureOggi');
    
    // Se già nascosta per oggi, non mostrare
    if (nascondiOggi === oggi) {
      return;
    }
    
    // Mostra notifica se:
    // 1. Non è mai stata mostrata oggi
    // 2. È un giorno lavorativo (Lun-Sab)
    // 3. È tra le 8:00 e le 18:00
    const ora = new Date().getHours();
    const giorno = new Date().getDay(); // 0 = Dom, 6 = Sab
    
    const isGiornoLavorativo = giorno >= 1 && giorno <= 6; // Lun-Sab
    const isOraLavorativa = ora >= 8 && ora <= 18;
    const nonMostrataOggi = ultimaNotifica !== oggi;
    
    if (isGiornoLavorativo && isOraLavorativa && nonMostrataOggi) {
      // Mostra dopo 3 secondi dal caricamento
      setTimeout(() => {
        setOpen(true);
        localStorage.setItem('ultimaNotificaFatture', oggi);
      }, 3000);
    }
  };

  const handleClose = () => {
    if (nonMostrareOggi) {
      const oggi = new Date().toDateString();
      localStorage.setItem('nascondiNotificaFattureOggi', oggi);
    }
    setOpen(false);
  };

  const handleApriCartella = () => {
    // Copia il path negli appunti
    navigator.clipboard.writeText(CARTELLA_FATTURE).then(() => {
      alert('📋 Path copiato negli appunti:\n' + CARTELLA_FATTURE + '\n\nIncollalo in Esplora File per aprire la cartella.');
    }).catch(() => {
      alert('📂 Apri questa cartella:\n' + CARTELLA_FATTURE);
    });
  };

  const handleVaiImport = () => {
    setOpen(false);
    router.push('/import-fatture');
  };

  const handleApriDanea = () => {
    alert(
      '📋 Per scaricare le fatture:\n\n' +
      '1. Apri Danea EasyFatt\n' +
      '2. Vai su "Fatture Ricevute"\n' +
      '3. Clicca "Scarica Nuove"\n' +
      '4. Seleziona le fatture e clicca "Esporta XML"\n' +
      '5. Salva in: ' + CARTELLA_FATTURE + '\n\n' +
      '6. Poi clicca "Importa nel Gestionale" qui!'
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '3px solid',
          borderColor: 'primary.main'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <NotificationIcon />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          🔔 Promemoria Fatture
        </Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <ReceiptIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Hai controllato le fatture oggi?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Ricordati di scaricare le nuove fatture da Danea e importarle nel gestionale.
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2
        }}>
          <Typography variant="subtitle2" color="textSecondary">
            ⚡ Azioni Rapide:
          </Typography>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<FolderIcon />}
            onClick={handleApriDanea}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            1️⃣ Scarica fatture da Danea
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<FolderIcon />}
            onClick={handleApriCartella}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            2️⃣ Apri cartella fatture XML
          </Button>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<ImportIcon />}
            onClick={handleVaiImport}
            fullWidth
            color="success"
            sx={{ justifyContent: 'flex-start' }}
          >
            3️⃣ Importa nel Gestionale
          </Button>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <FormControlLabel
          control={
            <Checkbox 
              checked={nonMostrareOggi}
              onChange={(e) => setNonMostrareOggi(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="caption">Non mostrare più oggi</Typography>}
        />
        <Button onClick={handleClose} color="inherit">
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}