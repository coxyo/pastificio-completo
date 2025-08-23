'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Badge,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart,
  Factory,
  Inventory,
  People,
  Receipt,
  CalendarMonth,
  Assessment,
  Settings,
  ExpandLess,
  ExpandMore,
  Notifications,
  AccountCircle,
  NotificationsActive as NotificationsActiveIcon,
  Backup as BackupIcon  // AGGIUNTO
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-toastify';
import webSocketService from '@/services/webSocketService';

const drawerWidth = 240;

export default function Layout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Connetti WebSocket
      webSocketService.connect(token);

      // Listener per notifiche magazzino
      webSocketService.on('notifica-magazzino', (data) => {
        toast.warning(data.messaggio, {
          autoClose: 5000,
          onClick: () => {
            router.push('/magazzino');
          }
        });
        setNotificationCount(prev => prev + 1);
        setNotifications(prev => [{
          id: Date.now(),
          message: data.messaggio,
          type: 'magazzino',
          timestamp: new Date()
        }, ...prev].slice(0, 10));
      });

      // Listener per alert scorte
      webSocketService.on('alert-scorte', (data) => {
        toast.error(`⚠️ ATTENZIONE: ${data.prodotto} sta per finire! Solo ${data.quantita} ${data.unita} rimanenti`, {
          autoClose: false,
          position: "top-center"
        });
        setNotificationCount(prev => prev + 1);
        setNotifications(prev => [{
          id: Date.now(),
          message: `${data.prodotto}: ${data.quantita} ${data.unita}`,
          type: 'alert',
          timestamp: new Date()
        }, ...prev].slice(0, 10));
      });

      // Listener per nuovi ordini
      webSocketService.on('nuovo-ordine', (data) => {
        toast.info(`Nuovo ordine ricevuto!`, {
          autoClose: 3000
        });
        setNotificationCount(prev => prev + 1);
      });

      // Cleanup
      return () => {
        webSocketService.off('notifica-magazzino');
        webSocketService.off('alert-scorte');
        webSocketService.off('nuovo-ordine');
      };
    }
  }, [router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleNavigation = (path) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = () => {
    setNotificationCount(0);
    // Naviga alla pagina notifiche invece di aprire un drawer
    router.push('/notifiche');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard'
    },
    {
      text: 'Ordini',
      icon: <ShoppingCart />,
      subItems: [
        { text: 'Gestione Ordini', path: '/ordini' },
        { text: 'Nuovo Ordine', path: '/ordini/nuovo' },
        { text: 'Storico Ordini', path: '/ordini/storico' }
      ]
    },
    {
      text: 'Produzione',
      icon: <Factory />,
      subItems: [
        { text: 'Dashboard Produzione', path: '/produzione' },
        { text: 'Calendario', path: '/produzione/calendario' },
        { text: 'Piani Produzione', path: '/produzione/piani' },
        { text: 'Ricette', path: '/produzione/ricette' },
        { text: 'Consumi', path: '/produzione/consumi' }
      ]
    },
    {
      text: 'Magazzino',
      icon: <Inventory />,
      subItems: [
        { text: 'Dashboard Magazzino', path: '/magazzino' },
        { text: 'Inventario', path: '/magazzino/inventario' },
        { text: 'Movimenti', path: '/magazzino/movimenti' },
        { text: 'Fornitori', path: '/magazzino/fornitori' },
        { text: 'Ordini Fornitore', path: '/magazzino/ordini' }
      ]
    },
    {
      text: 'Clienti',
      icon: <People />,
      subItems: [
        { text: 'Anagrafica', path: '/clienti/anagrafica' },
        { text: 'Nuovo Cliente', path: '/clienti/nuovo' },
        { text: 'Crediti/Debiti', path: '/clienti/crediti' }
      ]
    },
    {
      text: 'Fatturazione',
      icon: <Receipt />,
      path: '/fatturazione'
    },
    {
      text: 'Calendario',
      icon: <CalendarMonth />,
      path: '/calendario'
    },
    {
      text: 'Report',
      icon: <Assessment />,
      path: '/report'
    },
    {
      text: 'Backup',  // AGGIUNTO
      icon: <BackupIcon />,
      path: '/backup'
    },
    {
      text: 'Notifiche',
      icon: <NotificationsActiveIcon />,
      path: '/notifiche'
    },
    {
      text: 'Impostazioni',
      icon: <Settings />,
      path: '/impostazioni'
    }
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Pastificio Nonna Claudia
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem 
              onClick={() => item.subItems ? handleMenuClick(item.text) : handleNavigation(item.path)}
              selected={pathname === item.path}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon>
                {item.text === 'Notifiche' && notificationCount > 0 ? (
                  <Badge badgeContent={notificationCount} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
              {item.subItems && (openMenus[item.text] ? <ExpandLess /> : <ExpandMore />)}
            </ListItem>
            {item.subItems && (
              <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItem
                      key={subItem.text}
                      sx={{ pl: 4, cursor: 'pointer' }}
                      onClick={() => handleNavigation(subItem.path)}
                      selected={pathname === subItem.path}
                    >
                      <ListItemText primary={subItem.text} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === pathname)?.text || 
             menuItems.find(item => item.subItems?.some(sub => sub.path === pathname))?.subItems.find(sub => sub.path === pathname)?.text || 
             'Dashboard'}
          </Typography>
          
          <IconButton
            size="large"
            color="inherit"
            onClick={handleNotificationClick}
          >
            <Badge badgeContent={notificationCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton
            size="large"
            edge="end"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={() => {
              handleNavigation('/profilo');
              handleProfileMenuClose();
            }}>
              Profilo
            </MenuItem>
            <MenuItem onClick={() => {
              // Pulisci localStorage al logout
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              webSocketService.disconnect();
              handleNavigation('/login');
              handleProfileMenuClose();
            }}>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        {children}
      </Box>
    </Box>
  );
}