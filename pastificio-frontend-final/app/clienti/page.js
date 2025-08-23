// app/clienti/page.js
'use client';

import React, { useState } from 'react';
import GestioneClienti from '@/components/GestioneClienti';
import ImportClienti from '@/components/Clienti/ImportClienti';
import { Button, Box, Snackbar, Alert } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';

export default function ClientiPage() {
  const [openImport, setOpenImport] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleImportComplete = (results) => {
    console.log('Import completato:', results);
    setOpenImport(false);
    
    // Mostra notifica con i risultati
    setSnackbar({
      open: true,
      message: `Importati ${results.successo} clienti con successo! ${results.duplicati > 0 ? `(${results.duplicati} duplicati saltati)` : ''}`,
      severity: results.errori > 0 ? 'warning' : 'success'
    });

    // Qui potresti voler ricaricare la lista clienti
    // Per ora facciamo un refresh della pagina dopo 2 secondi
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => setOpenImport(true)}
        >
          Importa da Excel
        </Button>
      </Box>

      <GestioneClienti />

      <ImportClienti
        open={openImport}
        onClose={() => setOpenImport(false)}
        onImportComplete={handleImportComplete}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}