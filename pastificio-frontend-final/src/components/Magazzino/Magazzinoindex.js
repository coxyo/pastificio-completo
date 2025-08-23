// components/Magazzino/MagazzinoIndex.js
import React, { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper,
  Divider,
  Breadcrumbs,
  Link,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Business as BusinessIcon,
  Storage as StorageIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

// Import dei componenti del magazzino
import MagazzinoDashboard from './MagazzinoDashboard';
import IngredientiManager from './IngredientiManager';
import FornitoriManager from './FornitoriManager';
import ScorteManager from './ScorteManager';
import OrdiniFornitoreManager from './OrdiniFornitoreManager';

// Componente principale per la gestione del magazzino
const MagazzinoIndex = () => {
  // Stato per gestire il tab attivo
  const [currentTab, setCurrentTab] = useState(0);
  
  // Stato per le notifiche
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Funzione per cambiare tab
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Funzione per mostrare notifiche
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Funzione per chiudere la notifica
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Componenti corrispondenti ai tab
  const tabComponents = [
    <MagazzinoDashboard key="dashboard" onNotify={showNotification} />,
    <IngredientiManager key="ingredienti" onNotify={showNotification} />,
    <FornitoriManager key="fornitori" onNotify={showNotification} />,
    <ScorteManager key="scorte" onNotify={showNotification} />,
    <OrdiniFornitoreManager key="ordini" onNotify={showNotification} />
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Breadcrumbs per la navigazione */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/dashboard">
          Home
        </Link>
        <Typography color="text.primary">Magazzino</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        Gestione Magazzino
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gestisci ingredienti, fornitori, scorte e ordini per il tuo pastificio.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="magazzino tabs"
        >
          <Tab icon={<DashboardIcon />} label="Dashboard" iconPosition="start" />
          <Tab icon={<InventoryIcon />} label="Ingredienti" iconPosition="start" />
          <Tab icon={<BusinessIcon />} label="Fornitori" iconPosition="start" />
          <Tab icon={<StorageIcon />} label="Scorte" iconPosition="start" />
          <Tab icon={<AssignmentIcon />} label="Ordini Fornitori" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Componente attivo */}
      <Box sx={{ py: 2 }}>
        {tabComponents[currentTab]}
      </Box>

      {/* Sistema di notifiche */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MagazzinoIndex;