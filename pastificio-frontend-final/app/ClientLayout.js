// app/ClientLayout.js - VERSIONE FINALE CON CALLPOPUP + PUSHER
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
  Phone as PhoneIcon
} from '@mui/icons-material';
import useIncomingCall from '@/hooks/useIncomingCall';
import CallPopup from '@/components/CallPopup';

// ✅ PUSHER: Import ed inizializza qui (client component)
import pusherService from '@/services/pusherService';

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
  { id: 'impostazioni', title: 'Impostazioni', icon: <Settings />, path: '/impostazioni' }
];

export default function ClientLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount] = useState(3);
  const [mounted, setMounted] = useState(false);

  // Hook per gestire chiamate in arrivo
  const { chiamataCorrente, clearChiamata, connected } = useIncomingCall();

  useEffect(() => {
    setMounted(true);
    
    // ✅ PUSHER: Inizializza quando component è montato
    if (typeof window !== 'undefined') {
      console.log('🔧 Inizializzazione Pusher da ClientLayout');
      
      // Verifica se pusherService esiste
      if (pusherService) {
        console.log('✅ pusherService disponibile:', pusherService);
        
        // Inizializza se non già fatto
        if (pusherService.initialize && !pusherService.pusher) {
          pusherService.initialize();
        }
        
        // Setup debug
        if (!window.pusherDebug) {
          window.pusherDebug = {
            status: () => {
              if (!pusherService.getStatus) {
                console.error('❌ pusherService.getStatus non disponibile');
                return null;
              }
              const status = pusherService.getStatus();
              console.log('=== Pusher Status ===');
              console.log('Initialized:', status.initialized);
              console.log('Connected:', status.connected);
              console.log('Socket ID:', status.socketId);
              console.log('Channels:', status.channels);
              console.log('Cluster:', status.cluster);
              console.log('====================');
              return status;
            },
            service: pusherService
          };
          console.log('💡 Pusher debug disponibile: window.pusherDebug.status()');
        }
      } else {
        console.error('❌ pusherService NON disponibile!');
      }
    }
  }, []);

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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

      const responseHistory = await fetch(
        `${API_URL}/cx3/history?limit=100`,
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
          await fetch(
            `${API_URL}/cx3/chiamate/${chiamata._id}`,
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

          {mounted && process.env.NODE_ENV === 'development' && (
            <Box
              sx={{
                mr: 2,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: connected ? 'success.main' : 'error.main',
                color: 'white',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            >
              📞 {connected ? 'ON' : 'OFF'}
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