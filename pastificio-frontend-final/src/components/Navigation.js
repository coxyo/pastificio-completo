// components/Navigation.js - Menu navigazione con Gestione Prodotti
'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, IconButton, Collapse
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  Dashboard as DashboardIcon,
  People as ClientsIcon,
  Inventory as InventoryIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Category as ProductIcon, // ✅ NUOVA ICONA
  LocalShipping as DeliveryIcon,
  AccountBalance as AccountingIcon,
  CalendarToday as CalendarIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';

const drawerWidth = 260;

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/dashboard' 
  },
  { 
    text: 'Ordini', 
    icon: <OrderIcon />, 
    path: '/' 
  },
  { 
    text: 'Clienti', 
    icon: <ClientsIcon />, 
    path: '/gestione-clienti' 
  },
  { 
    text: 'Gestione Prodotti', // ✅ NUOVA VOCE
    icon: <ProductIcon />, 
    path: '/gestione-prodotti',
    badge: 'NEW'
  },
  { 
    text: 'Magazzino', 
    icon: <InventoryIcon />, 
    path: '/magazzino' 
  },
  { 
    text: 'Calendario Produzione', 
    icon: <CalendarIcon />, 
    path: '/calendario-produzione' 
  },
  { 
    text: 'Consegne', 
    icon: <DeliveryIcon />, 
    path: '/consegne' 
  },
  { 
    text: 'Report', 
    icon: <ReportIcon />, 
    path: '/report',
    submenu: [
      { text: 'Report Vendite', path: '/report/vendite' },
      { text: 'Report Produzione', path: '/report/produzione' },
      { text: 'Report Clienti', path: '/report/clienti' }
    ]
  },
  { 
    text: 'Fatturazione', 
    icon: <AccountingIcon />, 
    path: '/fatturazione' 
  },
  { 
    text: 'Impostazioni', 
    icon: <SettingsIcon />, 
    path: '/impostazioni' 
  }
];

export default function Navigation({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (path) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleSubmenuToggle = (text) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [text]: !prev[text]
    }));
  };

  const drawer = (
    <Box>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Typography variant="h6" noWrap component="div">
          🍝 Nonna Claudia
        </Typography>
        <IconButton 
          color="inherit" 
          onClick={handleDrawerToggle}
          sx={{ display: { sm: 'none' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                selected={pathname === item.path}
                onClick={() => {
                  if (item.submenu) {
                    handleSubmenuToggle(item.text);
                  } else {
                    handleNavigate(item.path);
                  }
                }}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.main',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: pathname === item.path ? 'primary.contrastText' : 'inherit' 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
                {item.badge && (
                  <Box 
                    sx={{ 
                      bgcolor: 'error.main', 
                      color: 'white', 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {item.badge}
                  </Box>
                )}
                {item.submenu && (
                  openSubmenus[item.text] ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>

            {/* Submenu */}
            {item.submenu && (
              <Collapse in={openSubmenus[item.text]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      sx={{ pl: 4 }}
                      selected={pathname === subItem.path}
                      onClick={() => handleNavigate(subItem.path)}
                    >
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

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Mobile menu button */}
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{ 
          position: 'fixed', 
          top: 16, 
          left: 16, 
          zIndex: 1300,
          display: { sm: 'none' },
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': {
            bgcolor: 'primary.dark'
          }
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth 
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth 
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}