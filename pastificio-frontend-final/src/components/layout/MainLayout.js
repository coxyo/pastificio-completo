// src/components/Layout/MainLayout.js
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, Typography, List, 
  ListItemIcon, ListItemText, IconButton, Collapse, ListItemButton,
  Badge // AGGIUNTO
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Factory as ProductionIcon,
  Inventory as WarehouseIcon,
  People as ClientsIcon,
  Receipt as InvoiceIcon,
  CalendarMonth as CalendarIcon,
  Assessment as ReportIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const drawerWidth = 240;

const menuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard'
  },
  {
    id: 'ordini',
    title: 'Ordini',
    icon: <OrdersIcon />,
    path: '/ordini',
    subItems: [
      { title: 'Gestione Ordini', path: '/ordini' },
      { title: 'Nuovo Ordine', path: '/ordini?nuovo=true' },
      { title: 'Storico Ordini', path: '/ordini/storico' }
    ]
  },
  {
    id: 'produzione',
    title: 'Produzione',
    icon: <ProductionIcon />,
    path: '/produzione',
    subItems: [
      { title: 'Piano Produzione', path: '/produzione' },
      { title: 'Ricette', path: '/produzione/ricette' },
      { title: 'Lotti', path: '/produzione/lotti' }
    ]
  },
  {
    id: 'magazzino',
    title: 'Magazzino',
    icon: <WarehouseIcon />,
    path: '/magazzino',
    subItems: [
      { title: 'Inventario', path: '/magazzino' },
      { title: 'Fornitori', path: '/magazzino/fornitori' },
      { title: 'Movimenti', path: '/magazzino/movimenti' }
    ]
  },
  {
    id: 'clienti',
    title: 'Clienti',
    icon: <ClientsIcon />,
    path: '/clienti'
  },
  {
    id: 'fatturazione',
    title: 'Fatturazione',
    icon: <InvoiceIcon />,
    path: '/fatturazione'
  },
  {
    id: 'calendario',
    title: 'Calendario',
    icon: <CalendarIcon />,
    path: '/calendario'
  },
  {
    id: 'report',
    title: 'Report',
    icon: <ReportIcon />,
    path: '/report',
    subItems: [
      { title: 'Report Vendite', path: '/report?tipo=vendite' },
      { title: 'Report Prodotti', path: '/report?tipo=prodotti' },
      { title: 'Report Clienti', path: '/report?tipo=clienti' }
    ]
  },
  {
    id: 'notifiche',
    title: 'Notifiche',
    icon: <NotificationsIcon />,
    path: '/notifiche'
  },
  {
    id: 'impostazioni',
    title: 'Impostazioni',
    icon: <SettingsIcon />,
    path: '/impostazioni'
  }
];

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [notificationCount, setNotificationCount] = useState(0); // AGGIUNTO

  // AGGIUNTO: Effect per contare le notifiche non lette
  useEffect(() => {
    const checkNotifications = () => {
      try {
        // Controlla se ci sono notifiche salvate in localStorage
        const savedNotifications = localStorage.getItem('unreadNotifications');
        if (savedNotifications) {
          const count = parseInt(savedNotifications, 10) || 0;
          setNotificationCount(count);
        }

        // Controlla anche le preferenze per vedere se ci sono alert attivi
        const savedPreferences = localStorage.getItem('notificationPreferences');
        if (savedPreferences) {
          const prefs = JSON.parse(savedPreferences);
          // Se ci sono canali attivi, mostra un indicatore
          if (prefs?.email?.abilitato || prefs?.push?.abilitato || prefs?.sms?.abilitato) {
            // Non sovrascrivere il count se già presente
            if (!savedNotifications) {
              setNotificationCount(0); // Sistema attivo ma nessuna notifica
            }
          }
        }
      } catch (error) {
        console.error('Errore nel controllo notifiche:', error);
      }
    };

    // Controlla al mount
    checkNotifications();

    // Controlla periodicamente (ogni 30 secondi)
    const interval = setInterval(checkNotifications, 30000);

    // Ascolta eventi custom per aggiornamenti notifiche
    const handleNotificationUpdate = (event) => {
      if (event.detail && typeof event.detail.count !== 'undefined') {
        setNotificationCount(event.detail.count);
      }
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (menuId) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const handleNavigate = (path) => {
    router.push(path);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const handleNotificationClick = () => {
    // Reset counter quando si clicca sulle notifiche
    setNotificationCount(0);
    localStorage.setItem('unreadNotifications', '0');
    router.push('/notifiche');
  };

  const isSelected = (path) => {
    const cleanPath = path.split('?')[0];
    const cleanPathname = pathname.split('?')[0];
    return cleanPathname === cleanPath || cleanPathname.startsWith(cleanPath + '/');
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" noWrap component="div">
          Pastificio Nonna Claudia
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.id}>
            <ListItemButton
              component={item.subItems ? 'div' : Link}
              href={item.subItems ? undefined : item.path}
              onClick={() => {
                if (item.subItems) {
                  handleMenuClick(item.id);
                } else if (mobileOpen) {
                  setMobileOpen(false);
                }
              }}
              selected={isSelected(item.path)}
            >
              <ListItemIcon sx={{ color: isSelected(item.path) ? 'primary.main' : 'inherit' }}>
                {item.id === 'notifiche' ? (
                  <Badge badgeContent={notificationCount} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.title} />
              {item.subItems && (
                openMenus[item.id] ? <ExpandLess /> : <ExpandMore />
              )}
            </ListItemButton>
            
            {item.subItems && (
              <Collapse in={openMenus[item.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItemButton
                      key={subItem.path}
                      component={Link}
                      href={subItem.path}
                      sx={{ pl: 4 }}
                      selected={isSelected(subItem.path)}
                      onClick={() => {
                        if (mobileOpen) {
                          setMobileOpen(false);
                        }
                      }}
                    >
                      <ListItemText primary={subItem.title} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
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
            {menuItems.find(item => isSelected(item.path))?.title || 'Dashboard'}
          </Typography>

          {/* AGGIUNTO: Icona notifiche nell'header */}
          <IconButton color="inherit" onClick={handleNotificationClick}>
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
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