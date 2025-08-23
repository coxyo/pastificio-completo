// components/common/NotificationsManager.js
import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Typography,
  Divider,
  Button,
  Box,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  ShoppingCart as CartIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  VisibilityOff as MarkReadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

import notificationService from '../../services/notificationService';

// Componente per la gestione delle notifiche
const NotificationsManager = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  
  const navigate = useNavigate();
  
  // Carica le notifiche all'avvio e sottoscrivi agli aggiornamenti
  useEffect(() => {
    // Imposta lo stato iniziale
    setUnreadCount(notificationService.getUnreadCount());
    setNotifications(notificationService.getAllNotifications());
    
    // Sottoscrivi agli aggiornamenti delle notifiche
    const unsubscribeUpdated = notificationService.onNotificationsUpdated((count) => {
      setUnreadCount(count);
      setNotifications(notificationService.getAllNotifications());
    });
    
    // Sottoscrivi al ricevimento di nuove notifiche
    const unsubscribeReceived = notificationService.onNotificationReceived(() => {
      setNotifications(notificationService.getAllNotifications());
    });
    
    // Cleanup
    return () => {
      unsubscribeUpdated();
      unsubscribeReceived();
    };
  }, []);
  
  // Gestisce l'apertura del menu
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Gestisce la chiusura del menu
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Gestisce il click su una notifica
  const handleNotificationClick = (notification) => {
    notificationService.handleNotificationClick(notification);
    handleMenuClose();
  };
  
  // Gestisce l'eliminazione di una notifica
  const handleDeleteNotification = (event, notificationId) => {
    event.stopPropagation();
    notificationService.deleteNotification(notificationId);
  };
  
  // Segna tutte le notifiche come lette
  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };
  
  // Elimina tutte le notifiche
  const handleClearAll = () => {
    notificationService.clearAllNotifications();
  };
  
  // Apre il dialog di tutte le notifiche
  const handleOpenAllNotifications = () => {
    handleMenuClose();
    setDialogOpen(true);
  };
  
  // Chiude il dialog di tutte le notifiche
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  // Ottiene l'icona appropriata per il tipo di notifica
  const getIconForType = (type) => {
    switch (type) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'success':
        return <SuccessIcon color="success" />;
      case 'low_stock':
        return <InventoryIcon color="warning" />;
      case 'order_received':
        return <CartIcon color="info" />;
      case 'order_update':
        return <AssignmentIcon color="primary" />;
      case 'user_activity':
        return <PersonIcon color="secondary" />;
      default:
        return <InfoIcon color="info" />;
    }
  };
  
  // Ottiene le notifiche da visualizzare in base al tab selezionato
  const getFilteredNotifications = () => {
    if (currentTab === 0) {
      return notifications;
    } else if (currentTab === 1) {
      return notifications.filter(n => !n.read);
    } else {
      return notifications.filter(n => n.read);
    }
  };
  
  // Calcola da quanto tempo è stata ricevuta la notifica
  const getTimeAgo = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: it });
    } catch (error) {
      return 'tempo sconosciuto';
    }
  };
  
  // Ottiene il titolo della sezione in base al tab selezionato
  const getTabTitle = () => {
    if (currentTab === 0) {
      return 'Tutte le notifiche';
    } else if (currentTab === 1) {
      return 'Notifiche non lette';
    } else {
      return 'Notifiche lette';
    }
  };
  
  return (
    <>
      <Tooltip title="Notifiche">
        <IconButton color="inherit" onClick={handleMenuOpen}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      {/* Menu popup delle notifiche */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 500,
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="subtitle1">
            Notifiche {unreadCount > 0 && `(${unreadCount})`}
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Segna tutte come lette
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Non ci sono notifiche
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {notifications.slice(0, 5).map((notification) => (
              <ListItem
                key={notification.id}
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  backgroundColor: notification.read ? 'transparent' : 'rgba(0, 0, 0, 0.04)'
                }}
              >
                <ListItemIcon>
                  {getIconForType(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <>
                      <Typography variant="body2" noWrap>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getTimeAgo(notification.timestamp)}
                      </Typography>
                    </>
                  }
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    color: notification.read ? 'text.primary' : 'primary'
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            
            {notifications.length > 5 && (
              <Divider />
            )}
          </List>
        )}
        
        <Divider />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
          <Button
            size="small"
            onClick={handleOpenAllNotifications}
            startIcon={<ViewIcon />}
          >
            Vedi tutte
          </Button>
          
          <Button
            size="small"
            onClick={handleClearAll}
            color="error"
            startIcon={<DeleteIcon />}
            disabled={notifications.length === 0}
          >
            Cancella tutte
          </Button>
        </Box>
      </Menu>
      
      {/* Dialog di tutte le notifiche */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {getTabTitle()}
            </Typography>
            {unreadCount > 0 && currentTab !== 2 && (
              <Button
                size="small"
                startIcon={<MarkReadIcon />}
                onClick={handleMarkAllAsRead}
              >
                Segna tutte come lette
              </Button>
            )}
          </Box>
        </DialogTitle>
        
        <Paper square>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Tutte" />
            <Tab
              label={
                <Badge badgeContent={unreadCount} color="error">
                  Non lette
                </Badge>
              }
            />
            <Tab label="Lette" />
          </Tabs>
        </Paper>
        
        <DialogContent dividers>
          <List>
            {getFilteredNotifications().length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  Nessuna notifica da visualizzare
                </Typography>
              </Box>
            ) : (
              getFilteredNotifications().map((notification) => (
                <ListItem
                  key={notification.id}
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
                    borderLeft: `4px solid ${
                      notification.type === 'error' ? '#f44336' :
                      notification.type === 'warning' ? '#ff9800' :
                      notification.type === 'success' ? '#4caf50' :
                      '#2196f3'
                    }`,
                    my: 1,
                    borderRadius: 1
                  }}
                >
                  <ListItemIcon>
                    {getIconForType(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography variant="body2">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getTimeAgo(notification.timestamp)}
                        </Typography>
                      </>
                    }
                    primaryTypographyProps={{
                      variant: 'subtitle2',
                      color: notification.read ? 'text.primary' : 'primary'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Chiudi</Button>
          <Button
            color="error"
            onClick={handleClearAll}
            disabled={getFilteredNotifications().length === 0}
            startIcon={<DeleteIcon />}
          >
            Elimina tutte
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationsManager;