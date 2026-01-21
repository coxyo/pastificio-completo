// app/ClientLayout.js - VERSIONE AGGIORNATA CON GRAFICI CORRISPETTIVI
'use client';

import { useState, useEffect } from 'react';
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
  Notifications as NotificationsIcon,
  Phone as PhoneIcon,
  HealthAndSafety,
  AccountBalance,
  TrendingUp  // ✅ NUOVO: Icona Grafici
} from '@mui/icons-material';
import useIncomingCall from '@/hooks/useIncomingCall';
import CallPopup from '@/components/CallPopup';

const drawerWidth = 240;

const menuItems = [
  { id: 'dashboard', title: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { id: 'ordini', title: 'Ordini', icon: <ShoppingCart />, path: '/' },
  { id: 'clienti', title: 'Clienti', icon: <People />, path: '/clienti' },
  { id: 'magazzino', title: 'Magazzino', icon: <Inventory />, path: '/magazzino' },
  { id: 'report', title: 'Report', icon: <Assessment />, path: '/report' },
  { id: 'calendario', title: 'Calendario', icon: <CalendarMonth />, path: '/calendario' },
  { id: 'chiamate', title: 'Chiamate', icon: <PhoneIcon />, path: '/chiamate' },
  { id: 'fatturazione', title: 'Fatturazione', icon: <Receipt />, path: '/fatturazione' },
  { id: 'haccp', title: 'HACCP', icon: <HealthAndSafety />, path: '/haccp' },
  { id: 'corrispettivi', title: 'Corrispettivi', icon: <AccountBalance />, path: '/corrispettivi' },
  { id: 'grafici', title: 'Grafici Corrispettivi', icon: <TrendingUp />, path: '/grafici' },  // ✅ NUOVO
  { id: 'impostazioni', title: 'Impostazioni', icon: <Settings />, path: '/impostazioni' }
];

export default function ClientLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount] = useState(3);
  const [mounted, setMounted] = useState(false);

  // ✅ Hook per gestire chiamate in arrivo
  const { chiamataCorrente, clearChiamata, connected, pusherService } = useIncomingCall();

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ INIZIALIZZAZIONE ESPLICITA PUSHER
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    console.log('[CLIENT LAYOUT] Mounted, verifico Pusher...');

    // Delay per evitare race condition
    const timer = setTimeout(() => {
      if (pusherService) {
        const status = pusherService.getStatus();
        console.log('[CLIENT LAYOUT] Pusher status:', status);

        // Se non connesso, forza inizializzazione
        if (!status.connected && !status.initialized) {
          console.log('[CLIENT LAYOUT] Pusher non inizializzato, forzo init...');
          pusherService.initialize().catch(err => {
            console.error('[CLIENT LAYOUT] Errore init Pusher:', err);
          });
        }
      } else {
        console.warn('[CLIENT LAYOUT] pusherService non disponibile');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [mounted, pusherService]);

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

  const handleSaveNote = async (callId, note) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

      // Trova chiamata per callId
      const responseHistory = await fetch(
        `${API_URL}/chiamate/history?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (responseHistory.ok) {
        const data = await responseHistory.json();
        const chiamata = data.chiamate?.find(c => c.callId === callId);

        if (chiamata) {
          // Aggiorna nota
          await fetch(
            `${API_URL}/chiamate/${chiamata._id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ note })
            }
          );

          console.log('[CLIENT LAYOUT] Nota salvata per chiamata:', callId);
        }
      }

      clearChiamata();

    } catch (error) {
      console.error('[CLIENT LAYOUT] Errore salvataggio nota:', error);
    }
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

          {/* ✅ Indicatore Pusher WebSocket */}
          {mounted && (
            <Box
              sx={{
                mr: 2,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: connected ? 'success.main' : 'error.main',
                color: 'white',
                fontSize: 11,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
              title={connected ? 'Sistema chiamate connesso' : 'Sistema chiamate disconnesso'}
            >
              📞 {connected ? 'ONLINE' : 'OFFLINE'}
            </Box>
          )}

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

      {/* ✅ Popup Chiamata in Arrivo */}
      {mounted && chiamataCorrente && (
        <CallPopup
          chiamata={chiamataCorrente}
          onClose={clearChiamata}
          onSaveNote={handleSaveNote}
        />
      )}
    </Box>
  );
}