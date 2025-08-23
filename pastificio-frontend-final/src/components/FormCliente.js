// src/components/FormCliente.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Typography,
  Box,
  Divider,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function FormCliente({ cliente, onSave, onCancel }) {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    codiceCliente: '', // AGGIUNTO: Campo per il codice cliente
    tipo: 'privato',
    nome: '',
    cognome: '',
    ragioneSociale: '',
    email: '',
    telefono: '',
    telefonoSecondario: '',
    indirizzo: {
      via: '',
      citta: '',
      cap: '',
      provincia: ''
    },
    partitaIva: '',
    codiceFiscale: '',
    note: '',
    attivo: true
  });

  const [errors, setErrors] = useState({});
  const [isNewCliente, setIsNewCliente] = useState(true);

  // Funzione per generare il codice cliente
  const generateCodiceCliente = () => {
    const anno = new Date().getFullYear().toString().substr(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CL${anno}${random}`;
  };

  useEffect(() => {
    if (cliente) {
      // Modifica cliente esistente
      setFormData({
        ...formData,
        ...cliente,
        indirizzo: cliente.indirizzo || formData.indirizzo
      });
      setIsNewCliente(false);
    } else {
      // Nuovo cliente - genera codice temporaneo
      const nuovoCodice = generateCodiceCliente();
      setFormData(prev => ({
        ...prev,
        codiceCliente: nuovoCodice
      }));
      setIsNewCliente(true);
    }
  }, [cliente]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Rimuovi errore quando l'utente modifica il campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleIndirizzoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      indirizzo: {
        ...prev.indirizzo,
        [field]: value
      }
    }));
  };

  const validaForm = () => {
    const newErrors = {};

    // Validazione base
    if (formData.tipo === 'privato') {
      if (!formData.nome) newErrors.nome = 'Nome obbligatorio';
      if (!formData.cognome) newErrors.cognome = 'Cognome obbligatorio';
    } else {
      if (!formData.ragioneSociale) newErrors.ragioneSociale = 'Ragione sociale obbligatoria';
    }
    
    if (!formData.telefono) newErrors.telefono = 'Telefono obbligatorio';

    // Validazione email se presente
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }

    // Validazione partita IVA per aziende
    if (formData.tipo === 'azienda' && formData.partitaIva) {
      if (!/^\d{11}$/.test(formData.partitaIva.replace(/\s/g, ''))) {
        newErrors.partitaIva = 'Partita IVA non valida (11 cifre)';
      }
    }

    // Validazione codice fiscale se presente
    if (formData.codiceFiscale) {
      const cfRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i;
      if (!cfRegex.test(formData.codiceFiscale.replace(/\s/g, ''))) {
        newErrors.codiceFiscale = 'Codice fiscale non valido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validaForm()) {
      // Prepara i dati per l'invio
      const dataToSend = {
        tipo: formData.tipo,
        nome: formData.nome || '',
        cognome: formData.cognome || '',
        ragioneSociale: formData.ragioneSociale || '',
        email: formData.email || '',
        telefono: formData.telefono,
        telefonoSecondario: formData.telefonoSecondario || '',
        indirizzo: formData.indirizzo,
        partitaIva: formData.partitaIva || '',
        codiceFiscale: formData.codiceFiscale ? formData.codiceFiscale.toUpperCase() : '',
        note: formData.note || '',
        attivo: formData.attivo
      };

      // Aggiungi il codice cliente solo se stiamo modificando un cliente esistente
      // Per i nuovi clienti, lascia che il backend lo generi automaticamente
      if (!isNewCliente && formData.codiceCliente) {
        dataToSend.codiceCliente = formData.codiceCliente;
      }
      
      console.log('Invio dati cliente:', dataToSend);
      onSave(dataToSend);
    }
  };

  // Funzione per rigenerare il codice cliente
  const handleRegenerateCodice = () => {
    if (isNewCliente) {
      const nuovoCodice = generateCodiceCliente();
      setFormData(prev => ({
        ...prev,
        codiceCliente: nuovoCodice
      }));
    }
  };

  return (
    <>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {cliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
          </Typography>
          <IconButton onClick={onCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Mostra il codice cliente */}
        {formData.codiceCliente && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            action={
              isNewCliente ? (
                <Button 
                  size="small" 
                  onClick={handleRegenerateCodice}
                  startIcon={<QrCodeIcon />}
                >
                  Rigenera
                </Button>
              ) : null
            }
          >
            <Typography variant="body2">
              <strong>Codice Cliente: {formData.codiceCliente}</strong>
              {isNewCliente && (
                <Typography variant="caption" display="block">
                  Questo è un codice temporaneo. Il codice definitivo verrà generato al salvataggio.
                </Typography>
              )}
            </Typography>
          </Alert>
        )}

        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Dati Anagrafici" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Indirizzi" icon={<BusinessIcon />} iconPosition="start" />
          <Tab label="Dati Fiscali" icon={<BusinessIcon />} iconPosition="start" />
          <Tab label="Preferenze" icon={<PersonIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo Cliente</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value)}
                  label="Tipo Cliente"
                >
                  <MenuItem value="privato">Privato</MenuItem>
                  <MenuItem value="azienda">Azienda</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.tipo === 'privato' ? (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
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
                    onChange={(e) => handleChange('cognome', e.target.value)}
                    error={!!errors.cognome}
                    helperText={errors.cognome}
                    required
                  />
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ragione Sociale"
                  value={formData.ragioneSociale}
                  onChange={(e) => handleChange('ragioneSociale', e.target.value)}
                  error={!!errors.ragioneSociale}
                  helperText={errors.ragioneSociale}
                  required
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefono"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                error={!!errors.telefono}
                helperText={errors.telefono || 'Es: 3331234567'}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefono Secondario"
                value={formData.telefonoSecondario}
                onChange={(e) => handleChange('telefonoSecondario', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Note"
                value={formData.note}
                onChange={(e) => handleChange('note', e.target.value)}
                placeholder="Inserisci note sul cliente, preferenze, allergie, etc..."
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.attivo}
                    onChange={(e) => handleChange('attivo', e.target.checked)}
                    color="primary"
                  />
                }
                label="Cliente Attivo"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Indirizzo di Consegna
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Via/Piazza"
                value={formData.indirizzo.via}
                onChange={(e) => handleIndirizzoChange('via', e.target.value)}
                placeholder="Es: Via Roma 123"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Città"
                value={formData.indirizzo.citta}
                onChange={(e) => handleIndirizzoChange('citta', e.target.value)}
                placeholder="Es: Cagliari"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="CAP"
                value={formData.indirizzo.cap}
                onChange={(e) => handleIndirizzoChange('cap', e.target.value)}
                placeholder="Es: 09100"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Provincia"
                value={formData.indirizzo.provincia}
                onChange={(e) => handleIndirizzoChange('provincia', e.target.value)}
                placeholder="Es: CA"
                inputProps={{ maxLength: 2 }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            {formData.tipo === 'azienda' && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Inserisci i dati fiscali per la fatturazione
                </Alert>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Partita IVA"
                value={formData.partitaIva}
                onChange={(e) => handleChange('partitaIva', e.target.value)}
                error={!!errors.partitaIva}
                helperText={errors.partitaIva || 'Solo per aziende (11 cifre)'}
                placeholder="12345678901"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Codice Fiscale"
                value={formData.codiceFiscale}
                onChange={(e) => handleChange('codiceFiscale', e.target.value.toUpperCase())}
                error={!!errors.codiceFiscale}
                helperText={errors.codiceFiscale}
                placeholder="RSSMRA80A01H501R"
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Le preferenze del cliente verranno configurate automaticamente in base agli ordini.
              </Typography>
            </Grid>
            {cliente && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Statistiche Cliente
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Punti Fedeltà
                    </Typography>
                    <Typography variant="h6">
                      {cliente.punti || 0} punti
                    </Typography>
                    <Chip 
                      label={cliente.livelloFedelta || 'Bronzo'} 
                      size="small" 
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Totale Ordini
                    </Typography>
                    <Typography variant="h6">
                      {cliente.statistiche?.numeroOrdini || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Totale speso: €{(cliente.statistiche?.totaleSpeso || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Annulla</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {cliente ? 'Salva Modifiche' : 'Crea Cliente'}
        </Button>
      </DialogActions>
    </>
  );
}

export default FormCliente;