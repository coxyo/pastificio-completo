import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, Drawer, List, 
  ListItem, ListItemIcon, ListItemText, Box, Divider, 
  ListItemButton, Avatar, useMediaQuery, Tooltip,
  Menu, MenuItem, Badge, useTheme, CssBaseline
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Receipt as ReportIcon,
  Inventory as InventoryIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Bookmark as BookmarkIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationsPanel from '../notifications/NotificationsPanel';

/**
 * Layout principale dell'applicazione che include:
 * - AppBar in alto con logo, titolo e controlli utente
 * - Drawer laterale con menu di navigazione
 * - Container principale per il contenuto
 */
const AppLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  
  const drawerWidth = 240;
  
  // Menu items con relative rotte, icone e permessi richiesti
  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      roles: ['admin', 'manager', 'operatore', 'user']
    },
    { 
      text: 'Ordini', 
      icon: <OrdersIcon />, 
      path: '/ordini',
      roles: ['admin', 'manager', 'operatore', 'user']
    },
    { 
      text: 'Magazzino', 
      icon: <InventoryIcon />, 
      path: '/magazzino',
      roles: ['admin', 'manager', 'operatore']
    },
    { 
      text: 'Fornitori', 
      icon: <ShippingIcon />, 
      path: '/fornitori',
      roles: ['admin', 'manager']
    },
    { 
      text: 'Prodotti', 
      icon: <StoreIcon />, 
      path: '/prodotti',
      roles: ['admin', 'manager', 'operatore']
    },
    { 
      text: 'Report', 
      icon: <ReportIcon />, 
      path: '/report',
      roles: ['admin', 'manager']
    },
    { 
      text: 'Utenti', 
      icon: <UsersIcon />, 
      path: '/utenti',
      roles: ['admin']
    },
    { 
      text: 'Impostazioni', 
      icon: <SettingsIcon />, 
      path: '/impostazioni',
      roles: ['admin', 'manager']
    }
  ];
  
  // Filtra i menu items in base ai permessi dell'utente
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.ruolo || 'user')
  );
  
  // Verifica se un menu item è attivo
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Handlers per i menu utente
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };
  
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };
  
  const handleProfileClick = () => {
    handleUserMenuClose();
    navigate('/profilo');
  };
  
  // Drawer content
  const drawer = (
    <>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Pastificio App
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem 
            key={item.text} 
            disablePadding
            sx={{
              bgcolor: isActive(item.path) ? 'action.selected' : 'inherit'
            }}
          >
            <ListItemButton 
              onClick={() => navigate(item.path)}
              selected={isActive(item.path)}
            >
              <ListItemIcon 
                sx={{ 
                  color: isActive(item.path) ? 'primary.main' : 'inherit' 
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 'bold' : 'regular'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* AppBar */}
      <AppBar 
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          width: isMobile ? '100%' : `calc(100% - ${drawerOpen ? drawerWidth : 0}px)`,
          ml: isMobile ? 0 : drawerOpen ? `${drawerWidth}px` : 0,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => isActive(item.path))?.text || 'Pastificio App'}
          </Typography>
          
          {/* Notifications icon */}
          <Tooltip title="Notifiche">
            <IconButton 
              color="inherit"
              onClick={handleNotificationsOpen}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User menu */}
          <Tooltip title="Account">
            <IconButton
              onClick={handleUserMenuOpen}
              color="inherit"
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.nome?.charAt(0) || <PersonIcon />}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      {/* Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          ml: { sm: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          bgcolor: 'background.default',
          minHeight: '100vh',
          overflow: 'auto'
        }}
      >
        <Toolbar /> {/* Spacer per il fixed AppBar */}
        {children}
      </Box>
      
      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profilo
        </MenuItem>
        <MenuItem onClick={() => { handleUserMenuClose(); navigate('/impostazioni'); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Impostazioni
        </MenuItem>
        <MenuItem onClick={() => { handleUserMenuClose(); navigate('/preferiti'); }}>
          <ListItemIcon>
            <BookmarkIcon fontSize="small" />
          </ListItemIcon>
          Preferiti
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Notifications Panel */}
      <NotificationsPanel
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
      />
    </Box>
  );
};

export default AppLayout;