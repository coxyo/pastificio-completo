// app/ClientLayout.js
'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart,
  People,
  Inventory,
  Assessment,
  CalendarMonth,
  Receipt,
  Settings,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { id: 'dashboard', title: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { id: 'ordini', title: 'Ordini', icon: <ShoppingCart />, path: '/' },
  { id: 'clienti', title: 'Clienti', icon: <People />, path: '/clienti' },
  { id: 'magazzino', title: 'Magazzino', icon: <Inventory />, path: '/magazzino' },
  { id: 'report', title: 'Report', icon: <Assessment />, path: '/report' },
  { id: 'calendario', title: 'Calendario', icon: <CalendarMonth />, path: '/calendario' },
  { id: 'fatturazione', title: 'Fatturazione', icon: <Receipt />, path: '/fatturazione' },
  { id: 'impostazioni', title: 'Impostazioni', icon: <Settings />, path: '/impostazioni' }
];

export default function ClientLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount] = useState(3);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    router.push(path);
    setMobileOpen(false);
  };

  const isSelected = (path) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" noWrap>
          Pastificio Nonna Claudia
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            selected={isSelected(item.path)}
          >
            <ListItemIcon sx={{ color: isSelected(item.path) ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.title} />
          </ListItemButton>
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
          ml: { sm: `${drawerWidth}px` }
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {menuItems.find(item => isSelected(item.path))?.title || 'Gestione Ordini'}
          </Typography>

          <IconButton color="inherit">
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
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
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
          p: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        {children}
      </Box>
    </Box>
  );
}