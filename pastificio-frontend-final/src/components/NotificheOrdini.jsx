import React, { useState, useEffect } from 'react';
import {
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Badge, 
  Button, 
  Tabs, 
  Tab,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  MenuItem,
  Grid,
  Chip
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';

// Demo notification data
const demoNotifications = [
  {
    id: 1,
    type: 'ordine',
    title: 'Nuovo ordine ricevuto',
    message: 'Ordine #1245 da Mario Rossi, ritiro previsto per domani',
    timestamp: '2024-03-05 14:32:15',
    read: false,
    priority: 'high'
  },
  {
    id: 2,
    type: 'magazzino',
    title: 'Ingrediente sotto scorta',
    message: 'La farina 00 è sotto la soglia minima (2.5kg rimanenti)',
    timestamp: '2024-03-05 10:15:22',
    read: false,
    priority: 'medium'
  },
  {
    id: 3,
    type: 'sistema',
    title: 'Backup completato',
    message: 'Il backup giornaliero è stato completato con successo',
    timestamp: '2024-03-05 08:00:01',
    read: true,
    priority: 'low'
  },
  {
    id: 4,
    type: 'ordine',
    title: 'Ordine modificato',
    message: 'Ordine #1242 è stato modificato da Laura Verdi',
    timestamp: '2024-03-04 16:45:30',
    read: true,
    priority: 'medium'
  },
  {
    id: 5,
    type: 'magazzino',
    title: 'Ingrediente in esaurimento',
    message: 'Le uova sono quasi terminate (5 rimaste)',
    timestamp: '2024-03-04 14:22:10',
    read: true,
    priority: 'high'
  },
  {
    id: 6,
    type: 'sistema',
    title: 'Aggiornamento disponibile',
    message: 'È disponibile un aggiornamento del sistema alla versione 2.1.0',
    timestamp: '2024-03-04 09:15:45',
    read: true,
    priority: 'medium'
  }
];

const NotificheOrdini = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    nuoviOrdini: true,
    modificheOrdini: true,
    alertsMagazzino: true,
    alertsSistema: true
  });
  
  useEffect(() => {
    // Simulate API call to fetch notifications
    setTimeout(() => {
      setNotifications(demoNotifications);
      setLoading(false);
    }, 1000);
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const getFilteredNotifications = () => {
    switch(tabValue) {
      case 0: // Tutte
        return notifications;
      case 1: // Non lette
        return notifications.filter(n => !n.read);
      case 2: // Ordini
        return notifications.filter(n => n.type === 'ordine');
      case 3: // Magazzino
        return notifications.filter(n => n.type === 'magazzino');
      case 4: // Sistema
        return notifications.filter(n => n.type === 'sistema');
      default:
        return notifications;
    }
  };
  
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };
  
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'ordine':
        return <ShoppingCartIcon />;
      case 'magazzino':
        return <WarningIcon style={{ color: '#ff9800' }} />;
      case 'sistema':
        return <InfoIcon style={{ color: '#2196f3' }} />;
      default:
        return <NotificationsIcon />;
    }
  };
  
  const getNotificationColor = (priority) => {
    switch(priority) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#2196f3';
      default:
        return '#757575';
    }
  };
  
  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="p-6">
      <Typography variant="h4" component="h1" gutterBottom>
        Centro Notifiche
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Gestione delle notifiche del sistema
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="notification tabs">
              <Tab label="Tutte" />
              <Tab 
                label={
                  unreadCount > 0 
                    ? <Badge color="error" badgeContent={unreadCount}>Non lette</Badge>
                    : "Non lette"
                }
              />
              <Tab label="Ordini" />
              <Tab label="Magazzino" />
              <Tab label="Sistema" />
            </Tabs>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {tabValue === 0 ? 'Tutte le Notifiche' : 
               tabValue === 1 ? 'Notifiche Non Lette' : 
               tabValue === 2 ? 'Notifiche Ordini' : 
               tabValue === 3 ? 'Notifiche Magazzino' : 
               'Notifiche Sistema'}
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<MarkEmailReadIcon />}
              onClick={markAllAsRead}
              disabled={filteredNotifications.filter(n => !n.read).length === 0}
            >
              Segna tutte come lette
            </Button>
          </Box>
          
          <Paper sx={{ mb: 3 }}>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography>Caricamento notifiche...</Typography>
              </Box>
            ) : filteredNotifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography>Nessuna notifica disponibile</Typography>
              </Box>
            ) : (
              <List>
                {filteredNotifications.map((notification) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        backgroundColor: notification.read ? 'inherit' : 'rgba(33, 150, 243, 0.05)',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          backgroundColor: getNotificationColor(notification.priority)
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'background.paper' }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography component="span" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                              {notification.title}
                            </Typography>
                            
                            {!notification.read && (
                              <Chip
                                label="Nuova"
                                size="small"
                                color="primary"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              {notification.message}
                            </Typography>
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              {notification.timestamp}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {!notification.read && (
                          <IconButton 
                            size="small" 
                            onClick={() => markAsRead(notification.id)}
                            sx={{ mr: 1 }}
                          >
                            <MarkEmailReadIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Impostazioni Notifiche
            </Typography>
            
            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 3, mb: 1 }}>
              Canali di notifica
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.email}
                  onChange={(e) => setNotificationSettings({...notificationSettings, email: e.target.checked})}
                />
              }
              label="Email"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.push}
                  onChange={(e) => setNotificationSettings({...notificationSettings, push: e.target.checked})}
                />
              }
              label="Notifiche Push"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.sms}
                  onChange={(e) => setNotificationSettings({...notificationSettings, sms: e.target.checked})}
                />
              }
              label="SMS"
            />
            
            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 3, mb: 1 }}>
              Tipi di notifica
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.nuoviOrdini}
                  onChange={(e) => setNotificationSettings({...notificationSettings, nuoviOrdini: e.target.checked})}
                />
              }
              label="Nuovi Ordini"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.modificheOrdini}
                  onChange={(e) => setNotificationSettings({...notificationSettings, modificheOrdini: e.target.checked})}
                />
              }
              label="Modifiche agli Ordini"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.alertsMagazzino}
                  onChange={(e) => setNotificationSettings({...notificationSettings, alertsMagazzino: e.target.checked})}
                />
              }
              label="Alert Magazzino"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.alertsSistema}
                  onChange={(e) => setNotificationSettings({...notificationSettings, alertsSistema: e.target.checked})}
                />
              }
              label="Alert Sistema"
            />
            
            <Box sx={{ mt: 3 }}>
              <TextField
                select
                fullWidth
                label="Priorità minima per notifiche"
                defaultValue="low"
                margin="normal"
              >
                <MenuItem value="high">Solo alta</MenuItem>
                <MenuItem value="medium">Media e alta</MenuItem>
                <MenuItem value="low">Tutte le priorità</MenuItem>
              </TextField>
            </Box>
            
            <Button
              fullWidth
              variant="contained"
              startIcon={<SettingsIcon />}
              sx={{ mt: 3 }}
            >
              Salva Impostazioni
            </Button>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Riepilogo Notifiche
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">Totale notifiche:</Typography>
              <Typography variant="body1" fontWeight="bold">{notifications.length}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">Non lette:</Typography>
              <Typography variant="body1" fontWeight="bold">{unreadCount}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">Alta priorità:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {notifications.filter(n => n.priority === 'high').length}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Per tipologia:
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Ordini:</Typography>
              <Typography variant="body1">
                {notifications.filter(n => n.type === 'ordine').length}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Magazzino:</Typography>
              <Typography variant="body1">
                {notifications.filter(n => n.type === 'magazzino').length}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Sistema:</Typography>
              <Typography variant="body1">
                {notifications.filter(n => n.type === 'sistema').length}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default NotificheOrdini;