'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function NuovoClientePage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [tipoCliente, setTipoCliente] = useState('privato');
  const [formData, setFormData] = useState({
    tipo: 'privato',
    nome: '',
    cognome: '',
    ragioneSociale: '',
    partitaIva: '',
    codiceFiscale: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    telefono: '',
    email: '',
    indirizzoSpedizione: '',
    cittaSpedizione: '',
    capSpedizione: '',
    provinciaSpedizione: '',
    isFidelity: false,
    consensoMarketing: false,
    note: ''
  });
  const [errors, setErrors] = useState({});

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        if (tipoCliente === 'privato') {
          if (!formData.nome) newErrors.nome = 'Nome richiesto';
          if (!formData.cognome) newErrors.cognome = 'Cognome richiesto';
        } else {
          if (!formData.ragioneSociale) newErrors.ragioneSociale = 'Ragione sociale richiesta';
          if (!formData.partitaIva) newErrors.partitaIva = 'Partita IVA richiesta';
        }
        break;
      case 1:
        if (!formData.telefono) newErrors.telefono = 'Telefono richiesto';
        if (!formData.email) newErrors.email = 'Email richiesta';
        break;
      case 2:
        if (!formData.indirizzo) newErrors.indirizzo = 'Indirizzo richiesto';
        if (!formData.citta) newErrors.citta = 'Città richiesta';
        if (!formData.cap) newErrors.cap = 'CAP richiesto';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateStep(activeStep)) {
      const clienti = JSON.parse(localStorage.getItem('clienti') || '[]');
      const nuovoCliente = {
        ...formData,
        id: Date.now(),
        tipo: tipoCliente,
        dataCreazione: new Date().toISOString(),
        numeroOrdini: 0,
        totaleSpeso: 0
      };
      
      clienti.push(nuovoCliente);
      localStorage.setItem('clienti', JSON.stringify(clienti));
      
      router.push('/clienti/anagrafica');
    }
  };

  const steps = [
    {
      label: 'Dati Anagrafici',
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Tipo Cliente</FormLabel>
              <RadioGroup
                row
                value={tipoCliente}
                onChange={(e) => {
                  setTipoCliente(e.target.value);
                  setFormData({ ...formData, tipo: e.target.value });
                }}
              >
                <FormControlLabel value="privato" control={<Radio />} label="Privato" />
                <FormControlLabel value="azienda" control={<Radio />} label="Azienda" />
              </RadioGroup>
            </FormControl>
          </Grid>
          
          {tipoCliente === 'privato' ? (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={formData.nome}
                  onChange={handleChange('nome')}
                  error={!!errors.nome}
                  helperText={errors.nome}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cognome"
                  value={formData.cognome}
                  onChange={handleChange('cognome')}
                  error={!!errors.cognome}
                  helperText={errors.cognome}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Codice Fiscale"
                  value={formData.codiceFiscale}
                  onChange={handleChange('codiceFiscale')}
                />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ragione Sociale"
                  value={formData.ragioneSociale}
                  onChange={handleChange('ragioneSociale')}
                  error={!!errors.ragioneSociale}
                  helperText={errors.ragioneSociale}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Partita IVA"
                  value={formData.partitaIva}
                  onChange={handleChange('partitaIva')}
                  error={!!errors.partitaIva}
                  helperText={errors.partitaIva}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Codice Fiscale"
                  value={formData.codiceFiscale}
                  onChange={handleChange('codiceFiscale')}
                />
              </Grid>
            </>
          )}
        </Grid>
      )
    },
    {
      label: 'Contatti',
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefono"
              value={formData.telefono}
              onChange={handleChange('telefono')}
              error={!!errors.telefono}
              helperText={errors.telefono}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.consensoMarketing}
                  onChange={handleChange('consensoMarketing')}
                />
              }
              label="Consenso invio comunicazioni marketing"
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Indirizzi',
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Indirizzo di Fatturazione
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Indirizzo"
              value={formData.indirizzo}
              onChange={handleChange('indirizzo')}
              error={!!errors.indirizzo}
              helperText={errors.indirizzo}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Città"
              value={formData.citta}
              onChange={handleChange('citta')}
              error={!!errors.citta}
              helperText={errors.citta}
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="CAP"
              value={formData.cap}
              onChange={handleChange('cap')}
              error={!!errors.cap}
              helperText={errors.cap}
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Provincia"
              value={formData.provincia}
              onChange={handleChange('provincia')}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Indirizzo di Spedizione (se diverso)
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Indirizzo Spedizione"
              value={formData.indirizzoSpedizione}
              onChange={handleChange('indirizzoSpedizione')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Città Spedizione"
              value={formData.cittaSpedizione}
              onChange={handleChange('cittaSpedizione')}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="CAP Spedizione"
              value={formData.capSpedizione}
              onChange={handleChange('capSpedizione')}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Provincia Spedizione"
              value={formData.provinciaSpedizione}
              onChange={handleChange('provinciaSpedizione')}
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Preferenze',
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isFidelity}
                  onChange={handleChange('isFidelity')}
                />
              }
              label="Iscrivi al programma fedeltà"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Note"
              value={formData.note}
              onChange={handleChange('note')}
              placeholder="Note aggiuntive sul cliente..."
            />
          </Grid>
          <Grid item xs={12}>
            <Alert severity="info">
              Il cliente sarà salvato nell'anagrafica e potrà essere utilizzato per nuovi ordini.
            </Alert>
          </Grid>
        </Grid>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Nuovo Cliente
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {step.content}
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {index === steps.length - 1 ? 'Salva Cliente' : 'Continua'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Indietro
                  </Button>
                  <Button
                    onClick={() => router.push('/clienti/anagrafica')}
                    sx={{ mt: 1 }}
                  >
                    Annulla
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
}