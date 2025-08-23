// components/Produzione/index.js
import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { 
  AutoAwesome as RicetteIcon,
  CalendarMonth as CalendarIcon,
  PlaylistAddCheck as PianiIcon,
  ShoppingCart as ConsumiIcon,
  Factory as ProduzioneIcon
} from '@mui/icons-material';

import RecipeForm from './RecipeForm';
import ProductionPlan from './ProductionPlan';
import CalendarioProduzione from './CalendarioProduzione';
import PrevisioneConsumi from './PrevisioneConsumi';
import PianificazioneProduzione from './PianificazioneProduzione';

// Componente principale per il modulo Produzione
const Produzione = () => {
  // Stato per la tab attiva
  const [activeTab, setActiveTab] = useState(0);

  // Cambia tab attiva
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Callback per le notifiche
  const handleNotify = (message, severity) => {
    // Implementazione notifiche (puoi usare il tuo sistema di notifiche)
    console.log(`[${severity}] ${message}`);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          <Tab icon={<RicetteIcon />} label="Ricette" />
          <Tab icon={<PianiIcon />} label="Piani di Produzione" />
          <Tab icon={<CalendarIcon />} label="Calendario" />
          <Tab icon={<ConsumiIcon />} label="Previsione Consumi" />
          <Tab icon={<ProduzioneIcon />} label="Pianificazione Produzione" />
        </Tabs>
      </Box>

      {/* Contenuto delle tabs */}
      <TabPanel value={activeTab} index={0}>
        <RecipeForm />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <ProductionPlan />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <CalendarioProduzione />
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        <PrevisioneConsumi onNotify={handleNotify} />
      </TabPanel>
      <TabPanel value={activeTab} index={4}>
        <PianificazioneProduzione onNotify={handleNotify} />
      </TabPanel>
    </Box>
  );
};

// Componente TabPanel
const TabPanel = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`produzione-tabpanel-${index}`}
      aria-labelledby={`produzione-tab-${index}`}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

export default Produzione;