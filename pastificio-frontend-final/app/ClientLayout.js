// app/ClientLayout.js - ✅ AGGIORNATO: Sessioni attive + sessionService ping
// ✅ FIX 04/03/2026: Rimossa dipendenza 'user' da useEffect sessionService (causava restart inutili)
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
  Tooltip,
  useTheme,
  useMediaQuery,
  Avatar
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
  Security as SecurityIcon,
  EventBusy as EventBusyIcon
} from '@mui/icons-material';
import Image from 'next/image';
import { alpha } from '@mui/material/styles';
import { BRAND } from '@/theme/theme';
import { Circle } from '@mui/icons-material';
import useIncomingCall from '@/hooks/useIncomingCall';
import CallPopup from '@/components/CallPopup';
import NotificaFatture from '@/components/NotificaFatture';
import dispositivoService from '@/services/dispositivoService';
import sessionService from '@/services/sessionService';
import CacheService from '@/services/cacheService';
import NotificationCenter from '@/components/alerts/NotificationCenter';
import PushPromptBanner from '@/components/PushPromptBanner';
import firebasePushService from '@/services/firebasePushService';

const DRAWER_WIDTH = 248;

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
  { id: 'sessioni', title: 'Sessioni Attive', icon: <SecurityIcon />, path: '/sessioni', roles: ['admin', 'operatore'] },
  { id: 'chiusure', title: 'Calendario Chiusure', icon: <EventBusyIcon />, path: '/chiusure', roles: ['admin', 'operatore', 'visualizzatore'] },
  { id: 'utenti', title: 'Gestione Utenti', icon: <AdminPanelSettings />, path: '/utenti', roles: ['admin'] },
  { id: 'impostazioni', title: 'Impostazioni', icon: <Settings />, path: '/impostazioni', roles: ['admin'] }
];

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

  // Pulizia automatica cache localStorage all'avvio
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    CacheService.inizializza();
  }, [mounted]);

  // ✅ FIX 04/03/2026: Rimossa dipendenza 'user' - causava stop/restart continui del sessionService
  // Il sessionService usa il token da localStorage, non ha bisogno dell'oggetto user
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    if (token) {
      sessionService.inizializza();
    }

    return () => {
      sessionService.ferma();
    };
  }, [mounted]); // ✅ Era [mounted, user] - 'user' causava re-init ad ogni render

  // INIZIALIZZAZIONE PUSHER
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

  // Inizializza Web Push Notifications
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    firebasePushService.inizializza().catch(err => {
      console.warn('[PUSH] Init warning:', err.message);
    });
  }, [mounted]);

  // Ascolta click su notifica push
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const handlePushClick = (event) => {
      const data = event.detail;
      if (!data) return;
      
      switch (data.action || data.tipo) {
        case 'chiamata':
          break;
        case 'ordine':
          if (data.ordineId) {
            router.push('/?ordine=' + data.ordineId);
          }
          break;
        case 'alert':
          router.push('/?action=alert');
          break;
      }
    };

    window.addEventListener('push-notification-click', handlePushClick);
    return () => window.removeEventListener('push-notification-click', handlePushClick);
  }, [mounted, router]);

  // Menu filtrato per ruolo utente
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
    sessionService.ferma();
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
      {/* ✅ RESTYLING: Header sidebar brand */}
      <Box sx={{
        px: 2, py: 1.5,
        background: `linear-gradient(160deg, ${BRAND.greenDark} 0%, ${BRAND.green} 100%)`,
        borderBottom: `2px solid ${BRAND.gold}`,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
            border: `3px solid ${BRAND.gold}`,
            boxShadow: `0 0 0 3px ${alpha(BRAND.gold, 0.25)}`,
            bgcolor: 'white', flexShrink: 0,
          }}>
            <Image
              src="/logo_pastificio_nonna_claudia.jpg"
              alt="Pastificio Nonna Claudia"
              width={72} height={72}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              priority
            />
          </Box>
        </Box>
        <Typography align="center" sx={{ color: 'white', fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.3 }}>
          Pastificio<br />Nonna Claudia
        </Typography>
        {user && (
          <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${alpha(BRAND.gold, 0.30)}`, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
            <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: roleInfo.bg, fontWeight: 700 }}>
              {user.nome?.[0]?.toUpperCase()}
            </Avatar>
            <Typography sx={{ color: 'rgba(255,255,255,0.90)', fontSize: '0.76rem', fontWeight: 600 }}>
              {user.nome}
            </Typography>
            <Chip label={roleInfo.label} size="small"
              sx={{ height: 18, fontSize: '0.60rem', fontWeight: 700, bgcolor: alpha('#fff', 0.15), color: 'white', border: `1px solid ${alpha('#fff', 0.25)}` }} />
          </Box>
        )}
      </Box>

      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            selected={isSelected(item.path)}
            sx={{
              color: isSelected(item.path) ? BRAND.goldLight : 'rgba(255,255,255,0.78)',
              bgcolor: isSelected(item.path) ? alpha(BRAND.gold, 0.22) : 'transparent',
              borderLeft: isSelected(item.path) ? `3px solid ${BRAND.gold}` : '3px solid transparent',
              borderRadius: 2,
              mx: 0.5,
              '&:hover': { bgcolor: alpha(BRAND.gold, 0.14), color: 'white' },
            }}
          >
            <ListItemIcon sx={{ color: isSelected(item.path) ? BRAND.goldLight : 'rgba(255,255,255,0.60)', minWidth: 36 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.title} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isSelected(item.path) ? 700 : 500 }} />
          </ListItemButton>
        ))}
      </List>

      <Divider />
      <List>
        <ListItemButton onClick={handleLogout}
          sx={{ borderRadius: 2, mx: 0.5, color: alpha(BRAND.redLight, 0.90), '&:hover': { bgcolor: alpha(BRAND.red, 0.15), color: BRAND.redLight } }}>
          <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Esci" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }} />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { sm: 'none' } }} aria-label="Apri menu">
            <MenuIcon />
          </IconButton>

          {/* Logo mini mobile */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', mr: 1 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${BRAND.gold}`, bgcolor: 'white' }}>
              <Image src="/logo_pastificio_nonna_claudia.jpg" alt="Logo" width={30} height={30}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            </Box>
          </Box>

          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700, fontSize: { xs: '1rem', sm: '1.1rem' }, textShadow: '0 1px 3px rgba(0,0,0,0.20)' }}>
            {menuItems.find(item => isSelected(item.path))?.title || 'Gestione Ordini'}
          </Typography>

          {mounted && (
            <Box sx={{
              display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5,
              px: 1.5, py: 0.5, borderRadius: 2,
              bgcolor: alpha(connected ? '#4CAF50' : '#F44336', 0.25),
              border: `1px solid ${alpha(connected ? '#4CAF50' : '#F44336', 0.50)}`,
              fontSize: '0.72rem', fontWeight: 700, color: 'white',
            }}>
              <Circle sx={{ fontSize: 8, color: connected ? '#4CAF50' : '#F44336' }} />
              {connected ? 'LIVE' : 'OFFLINE'}
            </Box>
          )}

          {user && (
            <Chip
              avatar={<Avatar sx={{ bgcolor: roleInfo.bg, width: 22, height: 22, fontSize: '0.65rem' }}>{user.nome?.[0]?.toUpperCase()}</Avatar>}
              label={user.nome}
              size="small"
              sx={{
                display: { xs: 'none', sm: 'flex' },
                bgcolor: alpha('#fff', 0.20), color: 'white', fontWeight: 600,
                fontSize: '0.8rem', border: `1px solid ${alpha('#fff', 0.30)}`,
              }}
            />
          )}

          <NotificationCenter pusherService={pusherService} />

          <Tooltip title="Esci">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: BRAND.brownDark }
          }}
        >
          {drawer}
        </Drawer>
        
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: BRAND.brownDark }
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
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          mt: { xs: '56px', sm: '64px' },
          pb: { xs: '60px', sm: 0 },
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>

      {mounted && chiamataCorrente && dispositivoService.isNotificaAbilitata('chiamate3cx') && (
        <CallPopup
          chiamata={chiamataCorrente}
          onClose={clearChiamata}
          onSaveNote={handleSaveNote}
        />
      )}

      {mounted && <NotificaFatture />}

      {mounted && <PushPromptBanner />}
    </Box>
  );
}