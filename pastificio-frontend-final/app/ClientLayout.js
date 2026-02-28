// app/ClientLayout.js - ✅ AGGIORNATO: Sessioni attive + sessionService ping
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
  Badge,
  Button,
  Chip,
  Divider,
  Tooltip
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
  TrendingUp,
  UploadFile,
  Label as LabelIcon,
  Logout as LogoutIcon,
  PersonOutline,
  AdminPanelSettings,
  Security as SecurityIcon  // ✅ NUOVO: Icona per sessioni
} from '@mui/icons-material';
import useIncomingCall from '@/hooks/useIncomingCall';
import CallPopup from '@/components/CallPopup';
import NotificaFatture from '@/components/NotificaFatture';
import dispositivoService from '@/services/dispositivoService';
import sessionService from '@/services/sessionService';  // ✅ NUOVO
import CacheService from '@/services/cacheService';  // ✅ NUOVO: Pulizia cache automatica
import NotificationCenter from '@/components/alerts/NotificationCenter';  // ✅ NUOVO: Alert automatici

const drawerWidth = 240;

// ✅ Menu items con permessi per ruolo - AGGIUNTA VOCE SESSIONI
const allMenuItems = [
  { id: 'dashboard', title: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'operatore', 'visualizzatore'] },
  { id: 'ordini', title: 'Ordini', icon: <ShoppingCart />, path: '/', roles: ['admin', 'operatore', 'visualizzatore'] },
  { id: 'clienti', title: 'Clienti', icon: <People />, path: '/clienti', roles: ['admin', 'operatore', 'visualizzatore'] },
  { id: 'magazzino', title: 'Magazzino', icon: <Inventory />, path: '/magazzino', roles: ['admin', 'operatore'] },
  { id: 'etichette', title: 'Etichette', icon: <LabelIcon />, path: '/etichette', roles: ['admin', 'operatore'] },
  { id: 'report', title: 'Report', icon: <Assessment />, path: '/report', roles: ['admin', 'operatore'] },
  { id: 'calendario', title: 'Calendario', icon: <CalendarMonth />, path: '/calendario', roles: ['admin', 'operatore', 'visualizzatore'] },
  { id: 'chiamate', title: 'Chiamate', icon: <PhoneIcon />, path: '/chiamate', roles: ['admin', 'operatore'] },
  { id: 'fatturazione', title: 'Fatturazione', icon: <Receipt />, path: '/fatturazione', roles: ['admin'] },
  { id: 'import-fatture', title: 'Import Fatture', icon: <UploadFile />, path: '/import-fatture', roles: ['admin'] },
  { id: 'haccp', title: 'HACCP', icon: <HealthAndSafety />, path: '/haccp', roles: ['admin', 'operatore'] },
  { id: 'corrispettivi', title: 'Corrispettivi', icon: <AccountBalance />, path: '/corrispettivi', roles: ['admin'] },
  { id: 'grafici', title: 'Grafici Corrispettivi', icon: <TrendingUp />, path: '/grafici', roles: ['admin'] },
  { id: 'sessioni', title: 'Sessioni Attive', icon: <SecurityIcon />, path: '/sessioni', roles: ['admin', 'operatore'] },  // ✅ NUOVO
  { id: 'utenti', title: 'Gestione Utenti', icon: <AdminPanelSettings />, path: '/utenti', roles: ['admin'] },
  { id: 'impostazioni', title: 'Impostazioni', icon: <Settings />, path: '/impostazioni', roles: ['admin'] }
];

// ✅ Colori per ruolo
const roleColors = {
  admin: { bg: '#dc2626', text: 'white', label: 'Admin' },
  operatore: { bg: '#2563eb', text: 'white', label: 'Operatore' },
  visualizzatore: { bg: '#6b7280', text: 'white', label: 'Visualizzatore' }
};

export default function ClientLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { chiamataCorrente, clearChiamata, connected, pusherService } = useIncomingCall();

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ NUOVO: Pulizia automatica cache localStorage all'avvio
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    CacheService.inizializza();
  }, [mounted]);

  // ✅ NUOVO: Inizializza session service (ping + intercettore logout remoto)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    if (token) {
      sessionService.inizializza();
    }

    return () => {
      sessionService.ferma();
    };
  }, [mounted, user]);

  // ✅ INIZIALIZZAZIONE PUSHER
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      if (pusherService) {
        const status = pusherService.getStatus();
        if (!status.connected && !status.initialized) {
          pusherService.initialize().catch(err => {
            console.error('[CLIENT LAYOUT] Errore init Pusher:', err);
          });
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [mounted, pusherService]);

  // ✅ Menu filtrato per ruolo utente
  const menuItems = useMemo(() => {
    if (!user) return [];
    return allMenuItems.filter(item => item.roles.includes(user.role));
  }, [user]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleNavigation = (path) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    sessionService.ferma();  // ✅ NUOVO: Ferma ping prima del logout
    logout();
  };

  const isSelected = (path) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleSaveNote = async (callId, note) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

      const responseHistory = await fetch(
        `${API_URL}/chiamate/history?limit=100`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (responseHistory.ok) {
        const data = await responseHistory.json();
        const chiamata = data.chiamate?.find(c => c.callId === callId);

        if (chiamata) {
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
        }
      }
      clearChiamata();
    } catch (error) {
      console.error('[CLIENT LAYOUT] Errore salvataggio nota:', error);
    }
  };

  const roleInfo = roleColors[user?.role] || roleColors.operatore;

  const drawer = (
    <Box>
      {/* Header sidebar con nome utente e ruolo */}
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" noWrap sx={{ fontSize: '16px', fontWeight: 'bold' }}>
          Pastificio Nonna Claudia
        </Typography>
        {user && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonOutline sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontSize: '13px' }}>
              {user.nome}
            </Typography>
            <Chip
              label={roleInfo.label}
              size="small"
              sx={{
                height: 20,
                fontSize: '10px',
                fontWeight: 'bold',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white'
              }}
            />
          </Box>
        )}
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

      {/* Logout in fondo alla sidebar */}
      <Divider />
      <List>
        <ListItemButton onClick={handleLogout} sx={{ color: '#dc2626' }}>
          <ListItemIcon sx={{ color: '#dc2626' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Esci" />
        </ListItemButton>
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

          {/* Indicatore Pusher */}
          {mounted && (
            <Box
              sx={{
                mr: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: connected ? 'success.main' : 'error.main',
                color: 'white',
                fontSize: 11,
                fontWeight: 'bold',
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 0.5
              }}
              title={connected ? 'Sistema chiamate connesso' : 'Sistema chiamate disconnesso'}
            >
              📞 {connected ? 'ONLINE' : 'OFFLINE'}
            </Box>
          )}

          {/* NOME UTENTE + RUOLO nell'header */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
              <Chip
                icon={<PersonOutline sx={{ fontSize: 16, color: 'white !important' }} />}
                label={`${user.nome}`}
                size="small"
                sx={{
                  backgroundColor: roleInfo.bg,
                  color: roleInfo.text,
                  fontWeight: 'bold',
                  fontSize: '12px',
                  height: 28,
                  display: { xs: 'none', sm: 'flex' }
                }}
              />
            </Box>
          )}

          {/* ✅ NUOVO: Centro Notifiche Alert Automatici */}
          <NotificationCenter pusherService={pusherService} />

          {/* Bottone Logout nell'header */}
          <Tooltip title="Esci">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
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

      {/* Popup Chiamata */}
      {mounted && chiamataCorrente && dispositivoService.isNotificaAbilitata('chiamate3cx') && (
        <CallPopup
          chiamata={chiamataCorrente}
          onClose={clearChiamata}
          onSaveNote={handleSaveNote}
        />
      )}

      {/* Notifica Fatture */}
      {mounted && <NotificaFatture />}
    </Box>
  );
}