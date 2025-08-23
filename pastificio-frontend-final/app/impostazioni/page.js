// app/impostazioni/page.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Grid, TextField,
  Button, Tabs, Tab, Alert, Divider, Switch,
  FormControlLabel, InputAdornment
} from '@mui/material';
import { Save, Business, Receipt, Email } from '@mui/icons-material';

export default function ImpostazioniPage() {
  const [tabValue, setTabValue] = useState(0);
  const [saved, setSaved] = useState(false);
  const [impostazioni, setImpostazioni] = useState({
    // Dati Azienda
    ragioneSociale: '',
    partitaIva: '',
    codiceFiscale: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    telefono: '',
    email: '',
    pec: '',
    
    // Fatturazione
    proximoNumeroFattura: 1,
    annoFatturazione: new Date().getFullYear(),
    prefissoFattura: 'FT',
    aliquotaIva: 22,
    
    // Email
    emailNotifiche: true,
    emailOrdini: '',
    emailFatture: '',
    
    // Backup
    backupAutomatico: true,
    intervalloBackup: 'giornaliero'
  });

  useEffect(() => {
    const saved = localStorage.getItem('impostazioniAzienda');
    if (saved) {
      setImpostazioni(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('impostazioniAzienda', JSON.stringify(impostazioni));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setImpostazioni({ ...impostazioni, [field]: value });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Impostazioni
        </Typography>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Impostazioni salvate con successo!
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<Business />} label="Dati Azienda" />
          <Tab icon={<Receipt />} label="Fatturazione" />
          <Tab icon={<Email />} label="Notifiche" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dati Azienda
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ragione Sociale"
                value={impostazioni.ragioneSociale}
                onChange={handleChange('ragioneSociale')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Partita IVA"
                value={impostazioni.partitaIva}
                onChange={handleChange('partitaIva')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Codice Fiscale"
                value={impostazioni.codiceFiscale}
                onChange={handleChange('codiceFiscale')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Indirizzo"
                value={impostazioni.indirizzo}
                onChange={handleChange('indirizzo')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Città"
                value={impostazioni.citta}
                onChange={handleChange('citta')}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="CAP"
                value={impostazioni.cap}
                onChange={handleChange('cap')}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Provincia"
                value={impostazioni.provincia}
                onChange={handleChange('provincia')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Telefono"
                value={impostazioni.telefono}
                onChange={handleChange('telefono')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={impostazioni.email}
                onChange={handleChange('email')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="PEC"
                type="email"
                value={impostazioni.pec}
                onChange={handleChange('pec')}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Impostazioni Fatturazione
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prefisso Fatture"
                value={impostazioni.prefissoFattura}
                onChange={handleChange('prefissoFattura')}
                helperText="Es: FT, FATT, ecc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Anno Fatturazione"
                type="number"
                value={impostazioni.annoFatturazione}
                onChange={handleChange('annoFatturazione')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prossimo Numero Fattura"
                type="number"
                value={impostazioni.proximoNumeroFattura}
                onChange={handleChange('proximoNumeroFattura')}
                helperText="Il prossimo numero che verrà assegnato"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Aliquota IVA Standard"
                type="number"
                value={impostazioni.aliquotaIva}
                onChange={handleChange('aliquotaIva')}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notifiche Email
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={impostazioni.emailNotifiche}
                    onChange={handleChange('emailNotifiche')}
                  />
                }
                label="Abilita notifiche email"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email per Notifiche Ordini"
                type="email"
                value={impostazioni.emailOrdini}
                onChange={handleChange('emailOrdini')}
                disabled={!impostazioni.emailNotifiche}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email per Copie Fatture"
                type="email"
                value={impostazioni.emailFatture}
                onChange={handleChange('emailFatture')}
                disabled={!impostazioni.emailNotifiche}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Save />}
          onClick={handleSave}
        >
          Salva Impostazioni
        </Button>
      </Box>
    </Container>
  );
}