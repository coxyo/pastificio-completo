import React, { useState, useEffect } from 'react';
import {
  Popover, Typography, List, ListItem, ListItemText, 
  ListItemIcon, ListItemAvatar, Avatar, Divider, Box,
  CircularProgress, Button, IconButton, Badge, Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Delete as DeleteIcon,
  ShoppingCart as OrderIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Componente per la visualizzazione delle notifiche in un pannello popover
 */
const NotificationsPanel = ({ anchorEl, open, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ottieni le notifiche
  useEffect(() => {
    if (open) {
      // Simula una chiamata API per ottenere le notifiche
      // In una implementazione reale, dovresti fare una chiamata API
      setTimeout(() => {
        setNotifications([
          {
            id: 1,
            type: 'ordine',
            severity: 'info',
            title: 'Nuovo ordine ricevuto',
            message: 'Ordine #12345 ricevuto da Cliente Demo',
            time: new Date(Date.now() - 15 * 60 * 1000), // 15 minuti fa
            read: false,
            link: '/ordini/12345'
          },
          {
            id: 2,
            type: 'magazzino',
            severity: 'warning',
            title: 'Ingrediente sotto soglia',
            message: 'Farina 00 è sotto la soglia minima (2kg rimanenti)',
            time: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 ore fa
            read: false,
            link: '/magazzino/ingredienti/farina-00'
          },
          {
            id: 3,
            type: 'ordine',
            severity: 'success',
            title: 'Ordine completato',
            message: 'Ordine #12340 è stato completato e consegnato',
            time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 giorno fa
            read: true,
            link: '/ordini/12340'
          }
        ]);
        setLoading(false);
      }, 500);
    }
  }, [open]);
  
  // Segna una notifica come letta
  const markAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };
  
  // Elimina una notifica
  const deleteNotification = (id, event) => {
    event.stopPropagation();
    setNotifications(notifications.filter(notif => notif.id !== id));
  };
  
  // Gestione clic su notifica
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    onClose();
    if (notification.link) {
      navigate(notification.link);
    }
  };
  
  // Segna tutte come lette
  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };
  
  // Ottieni icona in base al tipo e severità
  const getNotificationIcon = (notification) => {
    const { type, severity } = notification;
    
    if (type === 'ordine') {
      return <OrderIcon color={severity} />;
    } else if (type === 'magazzino') {
      return <InventoryIcon color={severity} />;
    }
    
    // Default icons based on severity
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'success':
        return <SuccessIcon color="success" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: { 
          width: 360, 
          maxHeight: 500,
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'primary.main',
        color: 'primary.contrastText'
      }}>
        <Box display="flex" alignItems="center">
          <NotificationsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Notifiche
            {unreadCount > 0 && (
              <Badge 
                color="error" 
                badgeContent={unreadCount} 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        
        {unreadCount > 0 && (
          <Button 
            size="small" 
            color="inherit" 
            onClick={markAllAsRead}
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Segna tutte come lette
          </Button>
        )}
      </Box>
      
      <Divider />
      
      {/* Content */}
      <Box sx={{ overflow: 'auto', maxHeight: 'calc(500px - 56px)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <InfoIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">
              Non ci sono notifiche
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    bgcolor: notification.read ? 'inherit' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    }
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  secondaryAction={
                    <Tooltip title="Elimina">
                      <IconButton 
                        edge="end" 
                        size="small"
                        onClick={(e) => deleteNotification(notification.id, e)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${notification.severity}.light`,
                        color: `${notification.severity}.main`
                      }}
                    >
                      {getNotificationIcon(notification)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle2"
                        sx={{ 
                          fontWeight: notification.read ? 'normal' : 'bold',
                          display: 'block'
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          {formatDistanceToNow(notification.time, { 
                            addSuffix: true,
                            locale: it
                          })}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
      
      {/* Footer */}
      <Box sx={{ 
        p: 1, 
        display: 'flex', 
        justifyContent: 'center',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Button 
          size="small" 
          onClick={() => {
            onClose();
            navigate('/notifiche');
          }}
        >
          Vedi tutte le notifiche
        </Button>
      </Box>
    </Popover>
  );
};

export default NotificationsPanel;