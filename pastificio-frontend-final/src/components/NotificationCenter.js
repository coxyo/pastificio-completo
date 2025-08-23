// components/NotificationCenter.js
import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
  Chip,
  Paper
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import notificationService from '../services/notificationService';

const NotificationCenter = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const handleUpdate = (notifs) => {
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    };
    
    notificationService.subscribe('update', handleUpdate);
    
    return () => {
      notificationService.unsubscribe('update', handleUpdate);
    };
  }, []);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;
  
  const getIcon = (type) => {
    const iconProps = { fontSize: 'small' };
    switch (type) {
      case 'warning': 
        return <WarningIcon sx={{ color: 'warning.main' }} {...iconProps} />;
      case 'error': 
        return <ErrorIcon sx={{ color: 'error.main' }} {...iconProps} />;
      case 'success': 
        return <CheckCircleIcon sx={{ color: 'success.main' }} {...iconProps} />;
      default: 
        return <InfoIcon sx={{ color: 'info.main' }} {...iconProps} />;
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'default';
    }
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Ora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m fa`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h fa`;
    return date.toLocaleDateString('it-IT');
  };
  
  return (
    <>
      <IconButton
        aria-describedby={id}
        color="inherit"
        onClick={handleClick}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 400, maxHeight: 600 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifiche</Typography>
          {notifications.length > 0 && (
            <Button
              size="small"
              onClick={() => notificationService.clearAll()}
              startIcon={<DeleteIcon />}
            >
              Cancella tutto
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nessuna notifica
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 500, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: !notification.read ? 'action.hover' : 'inherit',
                    '&:hover': { backgroundColor: 'action.selected' }
                  }}
                >
                  <ListItemIcon>
                    {getIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">
                          {notification.title}
                        </Typography>
                        {notification.priority && (
                          <Chip 
                            label={notification.priority} 
                            size="small"
                            color={getPriorityColor(notification.priority)}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(notification.timestamp)}
                        </Typography>
                        {notification.actions && (
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            {notification.actions.map((action, idx) => (
                              <Button
                                key={idx}
                                size="small"
                                variant="contained"
                                onClick={() => {
                                  action.action();
                                  handleClose();
                                }}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </Box>
                        )}
                      </>
                    }
                  />
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => notificationService.dismissNotification(notification.id)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationCenter;