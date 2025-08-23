// src/components/ClientLayout.js
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, 
  Drawer, 
  List, 
  ListItemIcon, 
  ListItemText,
  ListItemButton,
  Typography,
  AppBar,
  Toolbar,
  Collapse,
  Badge,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Factory as ProductionIcon,
  Inventory as InventoryIcon,
  People as ClientsIcon,
  Receipt as InvoiceIcon,
  CalendarMonth as CalendarIcon,
  Assessment as ReportIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Backup as BackupIcon,  // AGGIUNTO
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  History as HistoryIcon,
  ListAlt as ListIcon
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const drawerWidth = 240;

const menuItems = [
  { 
    id: 'dashboard',
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/dashboard' 
  },
  { 
    id: 'ordini',
    text: 'Ordini', 
    icon: <OrdersIcon />, 
    path: '/ordini',
    subItems: [
      { text: 'Gestione Ordini', icon: <ListIcon />, path: '/ordini' },
      { text: 'Nuovo Ordine', icon: <AddIcon />, path: '/ordini?nuovo=true' },
      { text: 'Storico Ordini', icon: <HistoryIcon />, path: '/ordini/storico' }
    ]
  },
  { 
    id: 'produzione',
    text: 'Produzione', 
    icon: <ProductionIcon />, 
    path: '/produzione',
    subItems: [
      { text: 'Piano Produzione', path: '/produzione' },
      { text: 'Ricette', path: '/produzione/ricette' },
      { text: 'Lotti', path: '/produzione/lotti' }
    ]
  },
  { 
    id: 'magazzino',
    text: 'Magazzino', 
    icon: <InventoryIcon />, 
    path: '/magazzino',
    subItems: [
      { text: 'Inventario', path: '/magazzino' },
      { text: 'Fornitori', path: '/magazzino/fornitori' },
      { text: 'Movimenti', path: '/magazzino/movimenti' }
    ]
  },
  { 
    id: 'clienti',
    text: 'Clienti', 
    icon: <ClientsIcon />, 
    path: '/clienti' 
  },
  { 
    id: 'fatturazione',
    text: 'Fatturazione', 
    icon: <InvoiceIcon />, 
    path: '/fatturazione',
    subItems: [
      { text: 'Fatture', path: '/fatturazione' },
      { text: 'Preventivi', path: '/fatturazione/preventivi' },
      { text: 'Scadenzario', path: '/fatturazione/scadenzario' }
    ]
  },
  { 
    id: 'calendario',
    text: 'Calendario', 
    icon: <CalendarIcon />, 
    path: '/calendario' 
  },
  { 
    id: 'report',
    text: 'Report', 
    icon: <ReportIcon />, 
    path: '/report',
    subItems: [
      { text: 'Report Vendite', path: '/report?tipo=vendite' },
      { text: 'Report Prodotti', path: '/report?tipo=prodotti' },
      { text: 'Report Clienti', path: '/report?tipo=clienti' }
    ]
  },
  { 
    id: 'backup',  // AGGIUNTO
    text: 'Backup', 
    icon: <BackupIcon />, 
    path: '/backup' 
  },
  { 
    id: 'notifiche',
    text: 'Notifiche', 
    icon: <NotificationsIcon />, 
    path: '/notifiche',
    badge: 3
  },
  { 
    id: 'impostazioni',
    text: 'Impostazioni', 
    icon: <SettingsIcon />, 
    path: '/impostazioni' 
  },
];

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Previeni errori di idratazione
  useEffect(() => {
    setMounted(true);
  }, []);

  // Inizializza i menu aperti per i percorsi correnti
  useEffect(() => {
    if (!mounted) return;
    
    const newOpenMenus = {};
    menuItems.forEach(item => {
      if (item.subItems) {
        const isInSubpath = item.subItems.some(subItem => 
          pathname.startsWith(subItem.path.split('?')[0])
        );
        if (isInSubpath || pathname.startsWith(item.path)) {
          newOpenMenus[item.id] = true;
        }
      }
    });
    setOpenMenus(newOpenMenus);
  }, [pathname, mounted]);

  const handleMenuClick = (menuId) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const isSelected = (path) => {
    const cleanPath = path.split('?')[0];
    const cleanPathname = pathname.split('?')[0];
    return cleanPathname === cleanPath || cleanPathname.startsWith(cleanPath + '/');
  };

  const getCurrentPageTitle = () => {
    for (const item of menuItems) {
      if (isSelected(item.path)) {
        if (item.subItems) {
          const subItem = item.subItems.find(sub => isSelected(sub.path));
          if (subItem) return `${item.text} - ${subItem.text}`;
        }
        return item.text;
      }
    }
    return 'Dashboard';
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white', textAlign: 'center' }}>
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
              selected={!item.subItems && isSelected(item.path)}
              sx={{
                backgroundColor: item.subItems && openMenus[item.id] ? 'action.hover' : 'inherit',
              }}
            >
              <ListItemIcon sx={{ color: isSelected(item.path) ? 'primary.main' : 'inherit' }}>
                {item.badge && mounted ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
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
                      {subItem.icon && (
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {subItem.icon}
                        </ListItemIcon>
                      )}
                      <ListItemText primary={subItem.text} />
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

  if (!mounted) {
    return null; // o un loading spinner
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* AppBar */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              {getCurrentPageTitle()}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            {drawer}
          </Box>
        </Drawer>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            p: 3,
            marginTop: '64px',
            width: `calc(100% - ${drawerWidth}px)`,
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}