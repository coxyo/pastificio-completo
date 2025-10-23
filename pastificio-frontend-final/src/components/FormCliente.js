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

// ⭐ FIXATO: Props corrette (onSalva e onAnnulla invece di onSave e onCancel)
function FormCliente({ cliente, onSalva, onAnnulla }) {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    codiceCliente: '',
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

  const generateCodiceCliente = () => {
    const anno = new Date().getFullYear().toString().substr(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CL${anno}${random}`;
  };

  useEffect(() => {
    if (cliente) {
      setFormData({
        ...formData,
        ...cliente,
        indirizzo: cliente.indirizzo || formData.indirizzo
      });
      setIsNewCliente(false);
    } else {
      const nuovoCodice = generateCodiceCliente();
      setFormData(prev => ({
        ...prev,
        codiceCliente: nuovoCodice
      }));
      setIsNewCliente(true);
    }
  }, [cliente]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const validaForm = () => {
    const newErrors = {};

    if (formData.tipo === 'privato') {
      if (!formData.nome?.trim()) {
        newErrors.nome = 'Il nome è obbligatorio';
      }
      if (!formData.cognome?.trim()) {
        newErrors.cognome = 'Il cognome è obbligatorio';
      }
    } else {
      if (!formData.ragioneSociale?.trim()) {
        newErrors.ragioneSociale = 'La ragione sociale è obbligatoria';
      }
    }

    if (!formData.telefono?.trim()) {
      newErrors.telefono = 'Il telefono è obbligatorio';
    } else if (!/^[0-9\s\+\-\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Formato telefono non valido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }

    if (formData.partitaIva) {
      if (!/^\d{11}$/.test(formData.partitaIva.replace(/\s/g, ''))) {
        newErrors.partitaIva = 'Partita IVA non valida (11 cifre)';
      }
    }

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

      if (!isNewCliente && formData.codiceCliente) {
        dataToSend.codiceCliente = formData.codiceCliente;
      }
      
      console.log('Invio dati cliente:', dataToSend);
      // ⭐ FIXATO: Usa onSalva invece di onSave
      onSalva(dataToSend);
    }
  };

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
          {/* ⭐ FIXATO: Usa onAnnulla invece di onCancel */}
          <IconButton onClick={onAnnulla} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
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
          <Tab label="Dati Fiscali" />
          {!isNewCliente && <Tab label="Preferenze" />}
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo Cliente *</InputLabel>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  label="Tipo Cliente *"
                >
                  <MenuItem value="privato">
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" />
                      Privato
                    </Box>
                  </MenuItem>
                  <MenuItem value="azienda">
                    <Box display="flex" alignItems="center" gap={1}>
                      <BusinessIcon fontSize="small" />
                      Azienda
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.tipo === 'privato' ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nome *"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    error={!!errors.nome}
                    helperText={errors.nome}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cognome *"
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleChange}
                    error={!!errors.cognome}
                    helperText={errors.cognome}
                  />
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ragione Sociale *"
                  name="ragioneSociale"
                  value={formData.ragioneSociale}
                  onChange={handleChange}
                  error={!!errors.ragioneSociale}
                  helperText={errors.ragioneSociale}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefono *"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                error={!!errors.telefono}
                helperText={errors.telefono || "Es: 3331234567"}
                placeholder="Es: 3331234567"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefono Secondario"
                name="telefonoSecondario"
                value={formData.telefonoSecondario}
                onChange={handleChange}
                placeholder="Es: 340 820 8314"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Via"
                name="indirizzo.via"
                value={formData.indirizzo.via}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Città"
                name="indirizzo.citta"
                value={formData.indirizzo.citta}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="CAP"
                name="indirizzo.cap"
                value={formData.indirizzo.cap}
                onChange={handleChange}
                inputProps={{ maxLength: 5 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Provincia"
                name="indirizzo.provincia"
                value={formData.indirizzo.provincia}
                onChange={handleChange}
                inputProps={{ maxLength: 2 }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Partita IVA"
                name="partitaIva"
                value={formData.partitaIva}
                onChange={handleChange}
                error={!!errors.partitaIva}
                helperText={errors.partitaIva || "11 cifre"}
                inputProps={{ maxLength: 11 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Codice Fiscale"
                name="codiceFiscale"
                value={formData.codiceFiscale}
                onChange={handleChange}
                error={!!errors.codiceFiscale}
                helperText={errors.codiceFiscale}
                inputProps={{ maxLength: 16 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Note"
                name="note"
                value={formData.note}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.attivo}
                    onChange={handleChange}
                    name="attivo"
                    color="primary"
                  />
                }
                label="Cliente Attivo"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {!isNewCliente && (
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={2}>
              {cliente && (
                <>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2}>
                      <Chip
                        label={cliente.livelloFedelta || 'Bronzo'}
                        color="primary"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="textSecondary">
                        Livello Fedeltà
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h6">
                        {cliente.punti || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Punti Fedeltà
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h6">
                        {cliente.statistiche?.numeroOrdini || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Totale Ordini
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
        )}
      </DialogContent>
      <DialogActions>
        {/* ⭐ FIXATO: Usa onAnnulla invece di onCancel */}
        <Button onClick={onAnnulla}>Annulla</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {cliente ? 'Salva Modifiche' : 'Crea Cliente'}
        </Button>
      </DialogActions>
    </>
  );
}

export default FormCliente;