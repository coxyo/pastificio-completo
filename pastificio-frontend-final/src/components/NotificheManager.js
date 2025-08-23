import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Typography,
  Divider,
  Box,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Chip,
  Button,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  FormGroup,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  ClearAll as ClearAllIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

import notificationService from '../services/notificationService';
import loggingService from '../services/loggingService';

// Componente icona di priorità
const PriorityIcon = ({ priority }) => {
  switch (priority) {
    case 'critica':
      return <ErrorIcon color="error" />;
    case 'alta':
      return <WarningIcon color="warning" />;
    case 'media':
      return <InfoIcon color="info" />;
    case 'bassa':
      return <InfoIcon color="disabled" />;
    default:
      return <InfoIcon color="action" />;
  }
};

// Componente badge di priorità
const PriorityBadge = ({ priority }) => {
  const colors = {
    critica: 'error',
    alta: 'warning',
    media: 'info',
    bassa: 'default'
  };
  
  return (
    <Chip 
      size="small" 
      color={colors[priority] || 'default'} 
      label={priority.charAt(0).toUpperCase() + priority.slice(1)} 
      icon={<PriorityIcon priority={priority} />}
    />
  );
};

// Componente per la singola notifica nella lista
const NotificationItem = ({ notification, onRead, onDelete }) => {
  const { _id, title, message, priority, read, createdAt, type, actionRequired, actionLink } = notification;
  
  const formattedDate = formatDistanceToNow(new Date(createdAt), { 
    addSuffix: true,
    locale: it
  });
  
  const typeLabels = {
    ordine: 'Ordine',
    magazzino: 'Magazzino',
    sistema: 'Sistema',
    pagamento: 'Pagamento',
    promemoria: 'Promemoria',
    altro: 'Altro'
  };
  
  const handleClick = () => {
    // Se c'è un link, apri in una nuova tab
    if (actionLink) {
      window.open(actionLink, '_blank');
    }
    
    // Marca come letta se non è già letta
    if (!read) {
      onRead(_id);
    }
  };
  
  return (
    <ListItem
      disablePadding
      secondaryAction={
        <IconButton edge="end" onClick={() => onDelete(_id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      }
      sx={{
        backgroundColor: read ? 'transparent' : 'action.hover',
        borderLeft: `4px solid ${
          priority === 'critica' ? 'error.main' :
          priority === 'alta' ? 'warning.main' :
          priority === 'media' ? 'info.main' : 'grey.300'
        }`,
      }}
    >
      <ListItemButton onClick={handleClick}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: read ? 'normal' : 'bold' }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formattedDate}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {message}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Chip 
              size="small" 
              label={typeLabels[type] || 'Altro'} 
              variant="outlined"
            />
            
            {actionRequired && (
              <Chip 
                size="small"
                color="primary"
                variant="outlined" 
                label="Azione richiesta" 
              />
            )}
          </Box>
        </Box>
      </ListItemButton>
    </ListItem>
  );
};

// Componente menu rapido notifiche
const NotificationsMenu = ({ 
  anchorEl, 
  open, 
  onClose, 
  notifications, 
  unreadCount, 
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onOpenDrawer,
  onOpenSettings
}) => {
  // Mostra al massimo 5 notifiche nel menu rapido
  const displayNotifications = notifications.slice(0, 5);
  
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{
        elevation: 4,
        sx: {
          maxHeight: '75vh',
          width: 350,
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Notifiche
          {unreadCount > 0 && (
            <Badge 
              badgeContent={unreadCount} 
              color="error" 
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        
        <Box>
          <Tooltip title="Impostazioni notifiche">
            <IconButton size="small" onClick={onOpenSettings}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {unreadCount > 0 && (
            <Tooltip title="Segna tutte come lette">
              <IconButton size="small" onClick={onMarkAllAsRead}>
                <CheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      <Divider />
      
      {displayNotifications.length === 0 ? (
        <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Nessuna notifica
          </Typography>
        </Box>
      ) : (
        <>
          {displayNotifications.map(notification => (
            <MenuItem 
              key={notification._id}
              onClick={() => {
                onMarkAsRead(notification._id);
                onClose();
              }}
              sx={{ 
                whiteSpace: 'normal',
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                borderLeft: `4px solid ${
                  notification.priority === 'critica' ? 'error.main' :
                  notification.priority === 'alta' ? 'warning.main' :
                  notification.priority === 'media' ? 'info.main' : 'grey.300'
                }`,
              }}
            >
              <ListItemIcon>
                <PriorityIcon priority={notification.priority} />
              </ListItemIcon>
              <ListItemText 
                primary={notification.title}
                secondary={
                  <Box component="span" sx={{ display: 'block', maxWidth: '100%' }}>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(notification.createdAt), { 
                        addSuffix: true,
                        locale: it
                      })}
                    </Typography>
                  </Box>
                }
                primaryTypographyProps={{
                  variant: 'subtitle2',
                  fontWeight: notification.read ? 'normal' : 'bold',
                }}
              />
            </MenuItem>
          ))}
          
          <Divider />
          
          <Box sx={{ py: 1, textAlign: 'center' }}>
            <Button 
              onClick={() => {
                onOpenDrawer();
                onClose();
              }}
              fullWidth
            >
              Visualizza tutte
            </Button>
          </Box>
        </>
      )}
    </Menu>
  );
};

// Componente drawer completo notifiche
const NotificationsDrawer = ({
  open,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onLoadMore,
  hasMore,
  currentPage
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState('all');
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };
  
  // Filtra le notifiche in base al tab e al filtro
  const filteredNotifications = notifications.filter(notification => {
    // Filtra per tab (lette/non lette)
    if (tabValue === 1 && !notification.read) return true;
    if (tabValue === 2 && notification.read) return true;
    if (tabValue === 0) {
      // Filtra per priorità/tipo
      if (filter === 'all') return true;
      if (filter.startsWith('priority-')) {
        return notification.priority === filter.replace('priority-', '');
      }
      if (filter.startsWith('type-')) {
        return notification.type === filter.replace('type-', '');
      }
    }
    return tabValue === 0;
  });
  
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 } },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notifiche
            {unreadCount > 0 && tabValue !== 2 && (
              <Badge 
                badgeContent={unreadCount} 
                color="error" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          
          <Box>
            {unreadCount > 0 && (
              <Tooltip title="Segna tutte come lette">
                <IconButton size="small" onClick={onMarkAllAsRead}>
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Chiudi">
              <IconButton size="small" onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Tutte" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Non lette</span>
                {unreadCount > 0 && (
                  <Badge 
                    badgeContent={unreadCount} 
                    color="error" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            } 
          />
          <Tab label="Lette" />
        </Tabs>
        
        {tabValue === 0 && (
          <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel id="notification-filter-label">Filtra</InputLabel>
              <Select
                labelId="notification-filter-label"
                value={filter}
                onChange={handleFilterChange}
                label="Filtra"
                startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">Tutte</MenuItem>
                <Divider />
                <MenuItem value="priority-critica">Priorità: Critica</MenuItem>
                <MenuItem value="priority-alta">Priorità: Alta</MenuItem>
                <MenuItem value="priority-media">Priorità: Media</MenuItem>
                <MenuItem value="priority-bassa">Priorità: Bassa</MenuItem>
                <Divider />
                <MenuItem value="type-ordine">Tipo: Ordini</MenuItem>
                <MenuItem value="type-magazzino">Tipo: Magazzino</MenuItem>
                <MenuItem value="type-sistema">Tipo: Sistema</MenuItem>
                <MenuItem value="type-pagamento">Tipo: Pagamenti</MenuItem>
                <MenuItem value="type-promemoria">Tipo: Promemoria</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
        
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Nessuna notifica da visualizzare
              </Typography>
            </Box>
          ) : (
            <>
              {filteredNotifications.map(notification => (
                <React.Fragment key={notification._id}>
                  <NotificationItem 
                    notification={notification}
                    onRead={onMarkAsRead}
                    onDelete={onDelete}
                  />
                  <Divider component="li" />
                </React.Fragment>
              ))}
              
              {hasMore && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Button 
                    onClick={() => onLoadMore(currentPage + 1)}
                    disabled={loading}
                  >
                    {loading ? 'Caricamento...' : 'Carica altre'}
                  </Button>
                </Box>
              )}
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );
};

// Componente dialog impostazioni notifiche
const NotificationSettings = ({ open, onClose, preferences, onSave }) => {
  const [localPreferences, setLocalPreferences] = useState(preferences);
  
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);
  
  const handleChange = (section, subsection, field, value) => {
    setLocalPreferences(prev => {
      const newPrefs = { ...prev };
      
      if (subsection) {
        newPrefs[section][subsection][field] = value;
      } else {
        newPrefs[section][field] = value;
      }
      
      return newPrefs;
    });
  };
  
  const handleSave = () => {
    onSave(localPreferences);
    onClose();
  };
  
  if (!localPreferences) return null;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Impostazioni Notifiche</DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="h6" gutterBottom>
          Canali di notifica
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch 
                checked={localPreferences.channels.email} 
                onChange={(e) => handleChange('channels', null, 'email', e.target.checked)}
              />
            }
            label="Email"
          />
          <FormControlLabel
            control={
              <Switch 
                checked={localPreferences.channels.sms} 
                onChange={(e) => handleChange('channels', null, 'sms', e.target.checked)}
              />
            }
            label="SMS"
          />
          <FormControlLabel
            control={
              <Switch 
                checked={localPreferences.channels.push} 
                onChange={(e) => handleChange('channels', null, 'push', e.target.checked)}
              />
            }
            label="Notifiche Push"
          />
          <FormControlLabel
            control={
              <Switch 
                checked={localPreferences.channels.inApp} 
                onChange={(e) => handleChange('channels', null, 'inApp', e.target.checked)}
              />
            }
            label="Notifiche in-app"
          />
        </FormGroup>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Preferenze per tipo
        </Typography>
        
        {Object.keys(localPreferences.types).map(type => (
          <Box key={type} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Typography>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={localPreferences.types[type].enabled} 
                  onChange={(e) => handleChange('types', type, 'enabled', e.target.checked)}
                />
              }
              label="Attivo"
            />
            
            {localPreferences.types[type].enabled && (
              <Box sx={{ pl: 4 }}>
                <Typography variant="body2" gutterBottom>
                  Canali:
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={localPreferences.types[type].channels.email} 
                        onChange={(e) => handleChange('types', type, 'channels', {
                          ...localPreferences.types[type].channels,
                          email: e.target.checked
                        })}
                        disabled={!localPreferences.channels.email}
                      />
                    }
                    label="Email"
                  />
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={localPreferences.types[type].channels.sms} 
                        onChange={(e) => handleChange('types', type, 'channels', {
                          ...localPreferences.types[type].channels,
                          sms: e.target.checked
                        })}
                        disabled={!localPreferences.channels.sms}
                      />
                    }
                    label="SMS"
                  />
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={localPreferences.types[type].channels.push} 
                        onChange={(e) => handleChange('types', type, 'channels', {
                          ...localPreferences.types[type].channels,
                          push: e.target.checked
                        })}
                        disabled={!localPreferences.channels.push}
                      />
                    }
                    label="Notifiche Push"
                  />
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={localPreferences.types[type].channels.inApp} 
                        onChange={(e) => handleChange('types', type, 'channels', {
                          ...localPreferences.types[type].channels,
                          inApp: e.target.checked
                        })}
                        disabled={!localPreferences.channels.inApp}
                      />
                    }
                    label="Notifiche in-app"
                  />
                </FormGroup>
              </Box>
            )}
          </Box>
        ))}
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Non disturbare
        </Typography>
        
        <FormControlLabel
          control={
            <Switch 
              checked={localPreferences.doNotDisturb.enabled} 
              onChange={(e) => handleChange('doNotDisturb', null, 'enabled', e.target.checked)}
            />
          }
          label="Attiva modalità non disturbare"
        />
        
        {localPreferences.doNotDisturb.enabled && (
          <Box sx={{ pl: 4 }}>
            <Typography variant="body2" gutterBottom>
              Orario non disturbare:
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Da"
                type="time"
                value={localPreferences.doNotDisturb.startTime}
                onChange={(e) => handleChange('doNotDisturb', null, 'startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                label="A"
                type="time"
                value={localPreferences.doNotDisturb.endTime}
                onChange={(e) => handleChange('doNotDisturb', null, 'endTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Eccezioni</InputLabel>
              <Select
                value={localPreferences.doNotDisturb.exceptPriority}
                onChange={(e) => handleChange('doNotDisturb', null, 'exceptPriority', e.target.value)}
                label="Eccezioni"
              >
                <MenuItem value="nessuna">Nessuna eccezione</MenuItem>
                <MenuItem value="alta">Mostra alta priorità e superiori</MenuItem>
                <MenuItem value="critica">Mostra solo priorità critica</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button onClick={handleSave} variant="contained">Salva</Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente principale NotificheManager
const NotificheManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [preferences, setPreferences] = useState(null);
  
  // Riferimento per determinare se il componente è montato
  const isMounted = useRef(true);
  
  // Inizializza il servizio notifiche
  useEffect(() => {
    const init = async () => {
      try {
        await notificationService.initialize();
        
        // Carica preferenze utente
        await loadUserPreferences();
      } catch (error) {
        loggingService.error('Errore nell\'inizializzazione delle notifiche', error);
      }
    };
    
    init();
    
    return () => {
      isMounted.current = false;
      notificationService.cleanup();
    };
  }, []);
  
  // Carica le preferenze utente
  const loadUserPreferences = async () => {
    try {
      // In un'implementazione reale, questa dovrebbe essere una chiamata API
      // Per ora usiamo dei valori predefiniti
      const defaultPreferences = {
        channels: {
          email: true,
          sms: false,
          push: true,
          inApp: true
        },
        types: {
          ordine: {
            enabled: true,
            channels: {
              email: true,
              sms: false,
              push: true,
              inApp: true
            }
          },
          magazzino: {
            enabled: true,
            channels: {
              email: true,
              sms: false,
              push: true,
              inApp: true
            }
          },
          sistema: {
            enabled: true,
            channels: {
              email: true,
              sms: false,
              push: true,
              inApp: true
            }
          },
          pagamento: {
            enabled: true,
            channels: {
              email: true,
              sms: false,
              push: true,
              inApp: true
            }
          },
          promemoria: {
            enabled: true,
            channels: {
              email: true,
              sms: false,
              push: true,
              inApp: true
            }
          }
        },
        priorities: {
          bassa: {
            enabled: true,
            channels: {
              email: false,
              sms: false,
              push: false,
              inApp: true
            }
          },
          media: {
            enabled: true,
            channels: {
              email: true,
              sms: false,
              push: true,
              inApp: true
            }
          },
          alta: {
            enabled: true,
            channels: {
              email: true,
              sms: true,
              push: true,
              inApp: true
            }
          },
          critica: {
            enabled: true,
            channels: {
              email: true,
              sms: true,
              push: true,
              inApp: true
            }
          }
        },
        doNotDisturb: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          exceptPriority: 'critica'
        }
      };
      
      setPreferences(defaultPreferences);
    } catch (error) {
      loggingService.error('Errore nel caricamento delle preferenze notifiche', error);
    }
  };
  
  // Ascolta gli eventi di notifica
  useEffect(() => {
    const notificationListener = (event, data) => {
      if (!isMounted.current) return;
      
      switch (event) {
        case 'new':
        case 'update':
          // Aggiorna le notifiche locali in caso di nuove notifiche o aggiornamenti
          fetchNotifications();
          break;
        case 'count':
          // Aggiorna il contatore non lette
          setUnreadCount(data);
          break;
        default:
          break;
      }
    };
    
    // Aggiungi il listener
    const unsubscribe = notificationService.addListener(notificationListener);
    
    // Carica le notifiche iniziali
    fetchNotifications();
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Carica le notifiche
  const fetchNotifications = useCallback(async (page = 1) => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const result = await notificationService.fetchNotifications(page);
      
      if (!isMounted.current) return;
      
      if (page === 1) {
        setNotifications(result.notifications);
      } else {
        setNotifications(prev => [...prev, ...result.notifications]);
      }
      
      setUnreadCount(notificationService.unreadCount);
      setCurrentPage(page);
      setHasMore(page < result.totalPages);
    } catch (error) {
      loggingService.error('Errore nel caricamento delle notifiche', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [loading]);
  
  // Carica più notifiche
  const handleLoadMore = (page) => {
    fetchNotifications(page);
  };
  
  // Apertura menu
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Chiusura menu
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Apertura drawer
  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };
  
  // Chiusura drawer
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };
  
  // Apertura impostazioni
  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };
  
  // Chiusura impostazioni
  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };
  
  // Marca come letta
  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      loggingService.error('Errore nel marcare la notifica come letta', error);
    }
  };
  
  // Marca tutte come lette
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      loggingService.error('Errore nel marcare tutte le notifiche come lette', error);
    }
  };
  
  // Eliminazione
  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
    } catch (error) {
      loggingService.error('Errore nell\'eliminazione della notifica', error);
    }
  };
  
  // Salvataggio preferenze
  const handleSavePreferences = async (newPreferences) => {
    try {
      await notificationService.updateNotificationPreferences(newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      loggingService.error('Errore nel salvataggio delle preferenze di notifica', error);
    }
  };
  
  return (
    <>
      <Tooltip title="Notifiche">
        <IconButton 
          color="inherit" 
          onClick={handleMenuOpen}
          size="large"
        >
          {unreadCount > 0 ? (
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsActiveIcon />
            </Badge>
          ) : (
            <NotificationsIcon />
          )}
        </IconButton>
      </Tooltip>
      
      <NotificationsMenu 
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
        onOpenDrawer={handleDrawerOpen}
        onOpenSettings={handleSettingsOpen}
      />
      
      <NotificationsDrawer 
        open={drawerOpen}
        onClose={handleDrawerClose}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        currentPage={currentPage}
      />
      
      {preferences && (
        <NotificationSettings 
          open={settingsOpen}
          onClose={handleSettingsClose}
          preferences={preferences}
          onSave={handleSavePreferences}
        />
      )}
    </>
  );
};

export default NotificheManager;