// src/components/notifiche/NotificheManager.js
import React, { useState, useEffect } from 'react';
import { Container, Paper, Tabs, Tab, Box, Snackbar, Alert } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import DashboardNotifiche from './DashboardNotifiche';
import PreferenzeNotifiche from './PreferenzeNotifiche';
import StoricoNotifiche from './StoricoNotifiche';
import SendAlert from './SendAlert';
import theme from '../../theme/muiTheme';
import loggingService from '../../services/loggingService';

function TabPanel({ children, value, index }) {
  return (
    <div 
      hidden={value !== index}
      style={{ display: value === index ? 'block' : 'none' }}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function NotificheManager() {
  const [currentTab, setCurrentTab] = useState(0);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [isReady, setIsReady] = useState(false);
  const [preferenzeNotifiche, setPreferenzeNotifiche] = useState(null);

  useEffect(() => {
    // Inizializza il componente
    initializeComponent();
  }, []);

  const initializeComponent = async () => {
    try {
      // Carica le preferenze
      await caricaPreferenze();
      
      // Simula un piccolo delay per assicurarsi che tutto sia caricato
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Imposta il componente come pronto
      setIsReady(true);
    } catch (error) {
      console.error('Errore inizializzazione:', error);
      setIsReady(true); // Mostra comunque il componente
    }
  };

  const caricaPreferenze = async () => {
    try {
      const savedPreferences = localStorage.getItem('notificationPreferences');
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setPreferenzeNotifiche(parsed);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Errore nel caricamento delle preferenze:', error);
      showAlert('Errore nel caricamento delle preferenze', 'error');
      return null;
    }
  };

  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  const handleSavePreferenze = async (preferenze) => {
    try {
      // Salva le preferenze nel state locale
      setPreferenzeNotifiche(preferenze);
      
      // Log dell'azione
      loggingService.log('info', 'Preferenze notifiche salvate dal manager', { preferenze });
      
      // Qui puoi aggiungere la chiamata API per salvare sul server
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/notifiche/preferences`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(preferenze)
          });
          
          if (!response.ok) {
            console.warn('Impossibile salvare le preferenze sul server');
          }
        } catch (error) {
          console.warn('Errore salvataggio preferenze sul server:', error);
        }
      }
      
      showAlert('Preferenze salvate con successo', 'success');
      
      // Ricarica le preferenze per sincronizzare tutti i componenti
      await caricaPreferenze();
    } catch (error) {
      console.error('Errore nel salvataggio delle preferenze:', error);
      showAlert('Errore nel salvataggio delle preferenze', 'error');
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    
    // Log cambio tab
    const tabNames = ['Dashboard', 'Preferenze', 'Storico', 'Invia Alert'];
    loggingService.log('info', `Tab notifiche cambiato a: ${tabNames[newValue]}`);
  };

  const handleAlertSent = (alertData) => {
    // Callback quando viene inviato un alert
    if (alertData && alertData.success) {
      showAlert('Alert inviato con successo', 'success');
      
      // Se siamo nella tab dello storico, aggiorna la lista
      if (currentTab === 2) {
        // Forza il refresh del componente storico
        window.dispatchEvent(new CustomEvent('refreshStoricoNotifiche'));
      }
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  // Loading state
  if (!isReady) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="xl">
          <Paper sx={{ mt: 3, mb: 3, p: 4 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '400px',
              flexDirection: 'column'
            }}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p style={{ color: '#666', marginTop: '16px' }}>Caricamento sistema notifiche...</p>
            </div>
          </Paper>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl" className="MuiContainer-root">
        <Paper sx={{ mt: 3, mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Dashboard" />
            <Tab label="Preferenze" />
            <Tab label="Storico" />
            <Tab label="Invia Alert" />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            <DashboardNotifiche 
              showAlert={showAlert}
              preferenze={preferenzeNotifiche}
            />
          </TabPanel>
          
          <TabPanel value={currentTab} index={1}>
            <PreferenzeNotifiche 
              showAlert={showAlert}
              onSave={handleSavePreferenze}
              preferenzeIniziali={preferenzeNotifiche}
            />
          </TabPanel>
          
          <TabPanel value={currentTab} index={2}>
            <StoricoNotifiche 
              showAlert={showAlert}
              onRefresh={caricaPreferenze}
            />
          </TabPanel>
          
          <TabPanel value={currentTab} index={3}>
            <SendAlert 
              showAlert={showAlert}
              onAlertSent={handleAlertSent}
              preferenze={preferenzeNotifiche}
            />
          </TabPanel>
        </Paper>

        <Snackbar 
          open={alert.open} 
          autoHideDuration={6000} 
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity={alert.severity} 
            onClose={handleCloseAlert}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}