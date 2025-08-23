// src/components/ComunicazioniCliente.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Paper,
  Tab,
  Tabs
} from '@mui/material';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  Send as SendIcon,
  Group as GroupIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ComunicazioniCliente({ clientiSelezionati = [], onClose }) {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    tipo: 'email',
    template: '',
    oggetto: '',
    messaggio: '',
    filtri: {
      livelloFedelta: '',
      puntiMinimi: '',
      tipo: '',
      attivo: true
    }
  });
  const [risultati, setRisultati] = useState(null);

  useEffect(() => {
    caricaTemplates();
  }, []);

  const caricaTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/comunicazioni/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Errore caricamento templates:', error);
    }
  };

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        template: templateId,
        oggetto: template.oggetto || '',
        messaggio: template.contenuto || ''
      });
    }
  };

  const handleInvia = async () => {
    setLoading(true);
    setRisultati(null);

    try {
      const token = localStorage.getItem('token');
      const endpoint = formData.tipo === 'email' ? 'email' : 'sms';
      
      const body = {
        clientiIds: clientiSelezionati.map(c => c._id),
        oggetto: formData.oggetto,
        messaggio: formData.messaggio,
        template: formData.template
      };

      // Se non ci sono clienti selezionati, usa i filtri
      if (clientiSelezionati.length === 0) {
        body.filtri = formData.filtri;
      }

      const response = await fetch(`${API_URL}/comunicazioni/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        setRisultati(data);
      }
    } catch (error) {
      console.error('Errore invio comunicazione:', error);
    }

    setLoading(false);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Invia Comunicazione
        {clientiSelezionati.length > 0 && (
          <Chip
            label={`${clientiSelezionati.length} clienti selezionati`}
            size="small"
            sx={{ ml: 2 }}
            icon={<GroupIcon />}
          />
        )}
      </DialogTitle>
      
      <DialogContent>
        {risultati ? (
          <Box>
            <Alert severity={risultati.errori > 0 ? "warning" : "success"} sx={{ mb: 2 }}>
              Invio completato: {risultati.inviati} successi, {risultati.errori} errori
            </Alert>
            
            <List>
              {risultati.risultati.map((r, i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    {formData.tipo === 'email' ? <EmailIcon /> : <SmsIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={r.nome}
                    secondary={r.email || r.telefono}
                  />
                  <Chip
                    label={r.stato}
                    size="small"
                    color={r.stato === 'inviato' ? 'success' : 'error'}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : (
          <>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Email" icon={<EmailIcon />} />
              <Tab label="SMS" icon={<SmsIcon />} />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Template</InputLabel>
                <Select
                  value={formData.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  label="Template"
                >
                  <MenuItem value="">Nessuno</MenuItem>
                  {templates
                    .filter(t => t.tipo === 'email')
                    .map(t => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.nome}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Oggetto"
                value={formData.oggetto}
                onChange={(e) => setFormData({ ...formData, oggetto: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={6}
                label="Messaggio"
                value={formData.messaggio}
                onChange={(e) => setFormData({ ...formData, messaggio: e.target.value })}
                helperText="Puoi usare: {nome}, {cognome}, {nomeCompleto}, {punti}, {livello}"
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Template</InputLabel>
                <Select
                  value={formData.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  label="Template"
                >
                  <MenuItem value="">Nessuno</MenuItem>
                  {templates
                    .filter(t => t.tipo === 'sms')
                    .map(t => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.nome}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Messaggio"
                value={formData.messaggio}
                onChange={(e) => setFormData({ ...formData, messaggio: e.target.value })}
                helperText="Puoi usare: {nome}, {cognome}, {nomeCompleto}, {punti}, {livello}"
                inputProps={{ maxLength: 160 }}
              />
              
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                Caratteri: {formData.messaggio.length}/160
              </Typography>
            </TabPanel>

            {clientiSelezionati.length === 0 && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Filtri destinatari
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Livello Fedeltà</InputLabel>
                      <Select
                        value={formData.filtri.livelloFedelta}
                        onChange={(e) => setFormData({
                          ...formData,
                          filtri: { ...formData.filtri, livelloFedelta: e.target.value }
                        })}
                        label="Livello Fedeltà"
                      >
                        <MenuItem value="">Tutti</MenuItem>
                        <MenuItem value="bronzo">Bronzo</MenuItem>
                        <MenuItem value="argento">Argento</MenuItem>
                        <MenuItem value="oro">Oro</MenuItem>
                        <MenuItem value="platino">Platino</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Punti minimi"
                      value={formData.filtri.puntiMinimi}
                      onChange={(e) => setFormData({
                        ...formData,
                        filtri: { ...formData.filtri, puntiMinimi: e.target.value }
                      })}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {risultati ? 'Chiudi' : 'Annulla'}
        </Button>
        {!risultati && (
          <Button
            onClick={handleInvia}
            variant="contained"
            disabled={loading || !formData.messaggio}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Invia {tabValue === 0 ? 'Email' : 'SMS'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}