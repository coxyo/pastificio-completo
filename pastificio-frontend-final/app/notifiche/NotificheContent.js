'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notifiche-tabpanel-${index}`}
      aria-labelledby={`notifiche-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function NotificheContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    channel: 'email'
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [stats, setStats] = useState({
    totali: 0,
    successo: 0,
    percentualeSuccesso: 0
  });
  const [notificheRecenti, setNotificheRecenti] = useState([]);
  const [canaliAttivi, setCanaliAttivi] = useState({
    email: true,
    sms: false,
    browser: true
  });

  useEffect(() => {
    // Carica statistiche e notifiche recenti
    caricaDati();
  }, []);

  const caricaDati = async () => {
    // Simulazione caricamento dati
    // In produzione, qui chiameresti le API
    setStats({
      totali: 156,
      successo: 148,
      percentualeSuccesso: 94.9
    });

    setNotificheRecenti([
      {
        id: 1,
        titolo: 'Nuovo ordine ricevuto',
        messaggio: 'Ordine #1234 da Mario Rossi',
        tipo: 'info',
        canale: 'email',
        timestamp: new Date().toISOString(),
        stato: 'inviata'
      },
      {
        id: 2,
        titolo: 'Scorte in esaurimento',
        messaggio: 'Farina 00 sotto la soglia minima',
        tipo: 'warning',
        canale: 'browser',
        timestamp: new Date().toISOString(),
        stato: 'inviata'
      }
    ]);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/notifiche/sendAlert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSnackbar({
          open: true,
          message: 'Notifica inviata con successo!',
          severity: 'success'
        });
        
        // Reset form
        setFormData({
          title: '',
          message: '',
          type: 'info',
          channel: 'email'
        });

        // Ricarica dati
        caricaDati();
      } else {
        throw new Error(data.error || 'Errore invio notifica');
      }
    } catch (error) {
      console.error('Errore:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Errore durante l\'invio della notifica',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getIconByType = (type) => {
    switch (type) {
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'success':
        return <CheckCircleIcon color="success" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getIconByChannel = (channel) => {
    switch (channel) {
      case 'email':
        return <EmailIcon />;
      case 'sms':
        return <SmsIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sistema Notifiche
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Dashboard" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="Preferenze" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Storico" icon={<HistoryIcon />} iconPosition="start" />
          <Tab label="Invia Alert" icon={<SendIcon />} iconPosition="start" />
        </Tabs>

        {/* Dashboard Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Stato Canali di Notifica
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon color={canaliAttivi.email ? "primary" : "disabled"} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Email" 
                        secondary={canaliAttivi.email ? "Attivo" : "Disattivato"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <SmsIcon color={canaliAttivi.sms ? "primary" : "disabled"} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="SMS" 
                        secondary={canaliAttivi.sms ? "Attivo" : "Disattivato"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <NotificationsIcon color={canaliAttivi.browser ? "primary" : "disabled"} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Browser" 
                        secondary={canaliAttivi.browser ? "Attivo" : "Disattivato"}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Statistiche
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Notifiche Totali
                    </Typography>
                    <Typography variant="h4">
                      {stats.totali}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Tasso di Successo
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.percentualeSuccesso}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Notifiche Recenti
                  </Typography>
                  {notificheRecenti.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="textSecondary">
                        Nessuna notifica recente
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {notificheRecenti.slice(0, 3).map((notifica) => (
                        <ListItem key={notifica.id}>
                          <ListItemIcon>
                            {getIconByType(notifica.tipo)}
                          </ListItemIcon>
                          <ListItemText
                            primary={notifica.titolo}
                            secondary={notifica.messaggio}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Prossimi Eventi Programmati
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Report Giornaliero"
                        secondary="Ogni giorno alle 07:00"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Controllo Scorte"
                        secondary="Ogni ora"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Controllo Scadenze"
                        secondary="Ogni giorno alle 08:00"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Preferenze Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Configurazione Canali di Notifica
          </Typography>
          <Typography color="textSecondary">
            Funzionalità in sviluppo...
          </Typography>
        </TabPanel>

        {/* Storico Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Storico Notifiche
          </Typography>
          {notificheRecenti.map((notifica) => (
            <Card key={notifica.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getIconByType(notifica.tipo)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {notifica.titolo}
                  </Typography>
                  <Box sx={{ ml: 'auto' }}>
                    <Chip
                      size="small"
                      icon={getIconByChannel(notifica.canale)}
                      label={notifica.canale}
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      size="small"
                      label={notifica.stato}
                      color="success"
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {notifica.messaggio}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  {new Date(notifica.timestamp).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </TabPanel>

        {/* Invia Alert Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <SendIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Invia Alert
                </Typography>
                {!canaliAttivi.email && !canaliAttivi.sms && !canaliAttivi.browser && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <ErrorIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Route non trovata
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Titolo"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Messaggio"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  multiline
                  rows={4}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    label="Tipo"
                  >
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="success">Successo</MenuItem>
                    <MenuItem value="warning">Avviso</MenuItem>
                    <MenuItem value="error">Errore</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Canale di invio</InputLabel>
                  <Select
                    name="channel"
                    value={formData.channel}
                    onChange={handleInputChange}
                    label="Canale di invio"
                  >
                    <MenuItem value="email" disabled={!canaliAttivi.email}>
                      Email
                    </MenuItem>
                    <MenuItem value="sms" disabled={!canaliAttivi.sms}>
                      SMS
                    </MenuItem>
                    <MenuItem value="browser" disabled={!canaliAttivi.browser}>
                      Browser
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<SendIcon />}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Invio in corso...' : 'Invia Alert'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}