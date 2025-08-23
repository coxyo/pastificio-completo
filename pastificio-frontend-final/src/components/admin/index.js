// src/components/Admin/index.js
import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Tabs, 
  Tab, 
  Box 
} from '@mui/material';
import { 
  SupervisorAccount, 
  Group, 
  Security, 
  History 
} from '@mui/icons-material';
import UserManager from './UserManager';
import RoleManager from './RoleManager';

// Componente TabPanel
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AdminPanel = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab icon={<Group />} label="Utenti" />
            <Tab icon={<Security />} label="Ruoli e Permessi" />
            <Tab icon={<History />} label="Log Attività" disabled />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <UserManager />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <RoleManager />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" align="center">
            Log Attività (In Sviluppo)
          </Typography>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminPanel;