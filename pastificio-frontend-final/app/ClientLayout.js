// app/ClientLayout.js
// ✅ RESTYLING 04/03/2026: Brand identity + responsive sidebar + logo
// ✅ FIX 04/03/2026: Rimossa dipendenza 'user' da useEffect sessionService
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography,
  IconButton, ListItemButton, ListItemIcon, ListItemText,
  Badge, Chip, Divider, Tooltip, useMediaQuery, useTheme,
  Avatar, Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart, People, Inventory, Assessment,
  CalendarMonth, Receipt, Settings, Phone as PhoneIcon,
  HealthAndSafety, AccountBalance, TrendingUp, UploadFile,
  Label as LabelIcon, Logout as LogoutIcon, PersonOutline,
  AdminPanelSettings, Security as SecurityIcon,
  EventBusy as EventBusyIcon, ChevronLeft, Circle
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { BRAND } from '@/theme/theme';

import useIncomingCall from '@/hooks/useIncomingCall';
import CallPopup from '@/components/CallPopup';
import NotificaFatture from '@/components/NotificaFatture';
import dispositivoService from '@/services/dispositivoService';
import sessionService from '@/services/sessionService';
import CacheService from '@/services/cacheService';
import NotificationCenter from '@/components/alerts/NotificationCenter';
import PushPromptBanner from '@/components/PushPromptBanner';
import firebasePushService from '@/services/firebasePushService';

// ─── COSTANTI ─────────────────────────────────────────────────────────────────
const DRAWER_WIDTH = 248;

// ─── MENU ITEMS ──────────────────────────────────────────────────────────────
const allMenuItems = [
  { id: 'ordini',        title: 'Ordini',              icon: <ShoppingCart />,      path: '/',               roles: ['admin', 'operatore', 'visualizzatore'] },
  { id: 'dashboard',     title: 'Dashboard',           icon: <DashboardIcon />,     path: '/dashboard',      roles: ['admin', 'operatore', 'visualizzatore'] },
  { id: 'clienti',       title: 'Clienti',             icon: <People />,            path: '/clienti',        roles: ['admin', 'operatore', 'visualizzatore'] },
  { id: 'calendario',    title: 'Calendario',          icon: <CalendarMonth />,     path: '/calendario',     roles: ['admin', 'operatore', 'visualizzatore'] },
  { id: 'chiusure',      title: 'Chiusure',            icon: <EventBusyIcon />,     path: '/chiusure',       roles: ['admin', 'operatore', 'visualizzatore'] },
  { id: 'divider1' },
  { id: 'magazzino',     title: 'Magazzino',           icon: <Inventory />,         path: '/magazzino',      roles: ['admin', 'operatore'] },
  { id: 'etichette',     title: 'Etichette',           icon: <LabelIcon />,         path: '/etichette',      roles: ['admin', 'operatore'] },
  { id: 'report',        title: 'Report',              icon: <Assessment />,        path: '/report',         roles: ['admin', 'operatore'] },
  { id: 'chiamate',      title: 'Chiamate',            icon: <PhoneIcon />,         path: '/chiamate',       roles: ['admin', 'operatore'] },
  { id: 'divider2' },
  { id: 'haccp',         title: 'HACCP',               icon: <HealthAndSafety />,   path: '/haccp',          roles: ['admin', 'operatore'] },
  { id: 'corrispettivi', title: 'Corrispettivi',       icon: <AccountBalance />,    path: '/corrispettivi',  roles: ['admin'] },
  { id: 'grafici',       title: 'Grafici',             icon: <TrendingUp />,        path: '/grafici',        roles: ['admin'] },
  { id: 'fatturazione',  title: 'Fatturazione',        icon: <Receipt />,           path: '/fatturazione',   roles: ['admin'] },
  { id: 'import-fatture',title: 'Import Fatture',      icon: <UploadFile />,        path: '/import-fatture', roles: ['admin'] },
  { id: 'divider3' },
  { id: 'sessioni',      title: 'Sessioni',            icon: <SecurityIcon />,      path: '/sessioni',       roles: ['admin', 'operatore'] },
  { id: 'utenti',        title: 'Utenti',              icon: <AdminPanelSettings />,path: '/utenti',         roles: ['admin'] },
  { id: 'impostazioni',  title: 'Impostazioni',        icon: <Settings />,          path: '/impostazioni',   roles: ['admin'] },
];

// Voci per bottom navigation (mobile)
const bottomNavItems = [
  { id: 'ordini',     title: 'Ordini',     icon: <ShoppingCart />,  path: '/' },
  { id: 'clienti',    title: 'Clienti',    icon: <People />,        path: '/clienti' },
  { id: 'dashboard',  title: 'Dashboard',  icon: <DashboardIcon />, path: '/dashboard' },
  { id: 'haccp',      title: 'HACCP',      icon: <HealthAndSafety />, path: '/haccp' },
  { id: 'menu',       title: 'Menu',       icon: <MenuIcon />,      path: null },
];

const roleColors = {
  admin:          { bg: BRAND.red,   label: 'Admin' },
  operatore:      { bg: '#1565C0',   label: 'Operatore' },
  visualizzatore: { bg: '#546E7A',   label: 'Visualizzatore' },
};

// ─── SIDEBAR CONTENT ─────────────────────────────────────────────────────────
function SidebarContent({ menuItems, pathname, onNavigate, onLogout, user, connected }) {
  const roleInfo = roleColors[user?.role] || roleColors.operatore;

  const isSelected = (path) => {
    if (!path) return false;
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header sidebar: logo + nome ─────────────────────────── */}
      <Box
        sx={{
          px: 2, py: 1.5,
          background: `linear-gradient(160deg, ${BRAND.greenDark} 0%, ${BRAND.green} 100%)`,
          borderBottom: `2px solid ${BRAND.gold}`,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 80, height: 80,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${BRAND.gold}`,
              boxShadow: `0 0 0 3px ${alpha(BRAND.gold, 0.30)}`,
              bgcolor: 'white',
              flexShrink: 0,
            }}
          >
            <Image
              src="/logo_pastificio_nonna_claudia.jpg"
              alt="Pastificio Nonna Claudia"
              width={80}
              height={80}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              priority
            />
          </Box>
        </Box>

        {/* Nome */}
        <Typography
          variant="subtitle2"
          align="center"
          sx={{
            color: 'white',
            fontWeight: 700,
            fontSize: '0.78rem',
            letterSpacing: '0.03em',
            lineHeight: 1.3,
          }}
        >
          Pastificio<br />Nonna Claudia
        </Typography>

        {/* Utente + ruolo */}
        {user && (
          <Box
            sx={{
              mt: 1, pt: 1,
              borderTop: `1px solid ${alpha(BRAND.gold, 0.30)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              justifyContent: 'center',
            }}
          >
            <Avatar
              sx={{
                width: 24, height: 24,
                fontSize: '0.7rem',
                bgcolor: roleInfo.bg,
                fontWeight: 700,
              }}
            >
              {user.nome?.[0]?.toUpperCase()}
            </Avatar>
            <Typography sx={{ color: 'rgba(255,255,255,0.90)', fontSize: '0.78rem', fontWeight: 600 }}>
              {user.nome}
            </Typography>
            <Chip
              label={roleInfo.label}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.62rem',
                fontWeight: 700,
                bgcolor: alpha('#fff', 0.15),
                color: 'white',
                border: `1px solid ${alpha('#fff', 0.25)}`,
              }}
            />
          </Box>
        )}
      </Box>

      {/* ── Voci menu ───────────────────────────────────────────── */}
      <List
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 1,
          px: 0.5,
          // Scrollbar stilizzata
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(BRAND.gold, 0.30),
            borderRadius: 2,
          },
        }}
      >
        {menuItems.map((item) => {
          if (item.id?.startsWith('divider')) {
            return (
              <Divider
                key={item.id}
                sx={{ my: 0.5, mx: 1, borderColor: alpha(BRAND.gold, 0.18) }}
              />
            );
          }

          const selected = isSelected(item.path);

          return (
            <ListItemButton
              key={item.id}
              onClick={() => onNavigate(item.path)}
              selected={selected}
              sx={{
                // Override specifico per colori sidebar scura
                color: selected ? BRAND.goldLight : 'rgba(255,255,255,0.78)',
                bgcolor: selected
                  ? alpha(BRAND.gold, 0.22)
                  : 'transparent',
                borderLeft: selected ? `3px solid ${BRAND.gold}` : '3px solid transparent',
                '&:hover': {
                  bgcolor: alpha(BRAND.gold, 0.14),
                  color: 'white',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: selected ? BRAND.goldLight : 'rgba(255,255,255,0.60)',
                  minWidth: 36,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: selected ? 700 : 500 }}
              />
              {selected && (
                <Circle sx={{ fontSize: 8, color: BRAND.gold, ml: 0.5 }} />
              )}
            </ListItemButton>
          );
        })}
      </List>

      {/* ── Footer sidebar: stato + logout ──────────────────────── */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: `1px solid ${alpha(BRAND.gold, 0.20)}`,
          px: 1, py: 1,
        }}
      >
        {/* Indicatore connessione */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5, py: 0.75,
            borderRadius: 2,
            mb: 0.5,
            bgcolor: alpha(connected ? '#4CAF50' : '#F44336', 0.12),
          }}
        >
          <Circle sx={{ fontSize: 8, color: connected ? '#4CAF50' : '#F44336' }} />
          <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.70)', fontWeight: 500 }}>
            {connected ? 'Sistema connesso' : 'Sistema offline'}
          </Typography>
        </Box>

        <ListItemButton
          onClick={onLogout}
          sx={{
            borderRadius: 2,
            color: alpha(BRAND.redLight, 0.90),
            '&:hover': { bgcolor: alpha(BRAND.red, 0.15), color: BRAND.redLight },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Esci"
            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}

// ─── BOTTOM NAVIGATION (solo mobile < 600px) ─────────────────────────────────
function BottomNav({ pathname, onNavigate, onMenuOpen }) {
  const isSelected = (path) => {
    if (!path) return false;
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <Box
      component="nav"
      sx={{
        display: { xs: 'flex', sm: 'none' },
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 60,
        bgcolor: BRAND.brownDark,
        borderTop: `2px solid ${BRAND.gold}`,
        zIndex: 1200,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.25)',
        // Safe area per notch iOS
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {bottomNavItems.map((item) => {
        const sel = item.path ? isSelected(item.path) : false;
        return (
          <Box
            key={item.id}
            onClick={() => item.path ? onNavigate(item.path) : onMenuOpen()}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.25,
              cursor: 'pointer',
              color: sel ? BRAND.goldLight : 'rgba(255,255,255,0.60)',
              transition: 'all 0.15s ease',
              py: 0.5,
              position: 'relative',
              '&:active': { transform: 'scale(0.92)' },
              // Linea superiore sull'item attivo
              '&::before': sel ? {
                content: '""',
                position: 'absolute',
                top: 0, left: '20%', right: '20%',
                height: 3,
                borderRadius: '0 0 3px 3px',
                bgcolor: BRAND.gold,
              } : {},
            }}
          >
            <Box sx={{ fontSize: 22, display: 'flex', lineHeight: 1 }}>
              {item.icon}
            </Box>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: sel ? 700 : 500 }}>
              {item.title}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── MAIN LAYOUT ──────────────────────────────────────────────────────────────
export default function ClientLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const theme    = useTheme();
  const { user, logout, isAdmin } = useAuth();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));   // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg')); // 600-1200px

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted]       = useState(false);

  const { chiamataCorrente, clearChiamata, connected, pusherService } = useIncomingCall();

  // ── Mount ──────────────────────────────────────────────────────────────
  useEffect(() => { setMounted(true); }, []);

  // ── Cache cleanup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    CacheService.inizializza();
  }, [mounted]);

  // ── Session service ────────────────────────────────────────────────────
  // ✅ FIX: senza dipendenza 'user' per evitare restart continui
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (token) sessionService.inizializza();
    return () => sessionService.ferma();
  }, [mounted]);

  // ── Pusher init ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      if (pusherService) {
        const status = pusherService.getStatus();
        if (!status.connected && !status.initialized) {
          pusherService.initialize().catch(console.error);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [mounted, pusherService]);

  // ── Firebase Push ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    firebasePushService.inizializza().catch(err =>
      console.warn('[PUSH] Init warning:', err.message)
    );
  }, [mounted]);

  // ── Push click handler ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const handlePushClick = (event) => {
      const data = event.detail;
      if (!data) return;
      if (data.action === 'ordine' && data.ordineId) router.push('/?ordine=' + data.ordineId);
      if (data.action === 'alert') router.push('/?action=alert');
    };
    window.addEventListener('push-notification-click', handlePushClick);
    return () => window.removeEventListener('push-notification-click', handlePushClick);
  }, [mounted, router]);

  // ── Menu filtrato per ruolo ────────────────────────────────────────────
  const menuItems = useMemo(() => {
    if (!user) return [];
    return allMenuItems.filter(item =>
      item.id?.startsWith('divider') || item.roles?.includes(user.role)
    );
  }, [user]);

  const handleNavigate = (path) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    sessionService.ferma();
    logout();
  };

  const handleSaveNote = async (callId, note) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';
      const responseHistory = await fetch(`${API_URL}/chiamate/history?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (responseHistory.ok) {
        const data = await responseHistory.json();
        const chiamata = data.chiamate?.find(c => c.callId === callId);
        if (chiamata) {
          await fetch(`${API_URL}/chiamate/${chiamata._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ note })
          });
        }
      }
      clearChiamata();
    } catch (error) {
      console.error('[CLIENT LAYOUT] Errore salvataggio nota:', error);
    }
  };

  // Titolo pagina corrente
  const pageTitle = allMenuItems.find(item =>
    item.path && (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path))
  )?.title || 'Gestione Ordini';

  // ── Sidebar drawer content ─────────────────────────────────────────────
  const sidebarContent = (
    <SidebarContent
      menuItems={menuItems}
      pathname={pathname}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      user={user}
      connected={connected}
    />
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* ── AppBar ──────────────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml:    { sm: `${DRAWER_WIDTH}px` },
          // Override: garantisce che il gradient del theme venga applicato
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {/* Hamburger solo mobile */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { sm: 'none' } }}
            aria-label="Apri menu"
          >
            <MenuIcon />
          </IconButton>

          {/* Logo piccolo in AppBar (solo mobile/tablet dove sidebar è nascosta) */}
          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 32, height: 32,
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${BRAND.gold}`,
                bgcolor: 'white',
                flexShrink: 0,
              }}
            >
              <Image
                src="/logo_pastificio_nonna_claudia.jpg"
                alt="Logo"
                width={32}
                height={32}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            </Box>
          </Box>

          {/* Titolo pagina */}
          <Typography
            variant="h6"
            noWrap
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              textShadow: '0 1px 3px rgba(0,0,0,0.20)',
            }}
          >
            {pageTitle}
          </Typography>

          {/* Badge connessione (solo desktop) */}
          {mounted && (
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 0.5,
                px: 1.5, py: 0.5,
                borderRadius: 2,
                bgcolor: alpha(connected ? '#4CAF50' : '#F44336', 0.25),
                border: `1px solid ${alpha(connected ? '#4CAF50' : '#F44336', 0.50)}`,
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'white',
              }}
            >
              <Circle sx={{ fontSize: 8, color: connected ? '#4CAF50' : '#F44336' }} />
              {connected ? 'LIVE' : 'OFFLINE'}
            </Box>
          )}

          {/* Chip utente (nascosto su xs) */}
          {user && (
            <Chip
              avatar={
                <Avatar sx={{ bgcolor: roleColors[user.role]?.bg || '#1565C0', width: 24, height: 24, fontSize: '0.7rem' }}>
                  {user.nome?.[0]?.toUpperCase()}
                </Avatar>
              }
              label={user.nome}
              size="small"
              sx={{
                display: { xs: 'none', sm: 'flex' },
                bgcolor: alpha('#fff', 0.20),
                color: 'white',
                fontWeight: 600,
                fontSize: '0.8rem',
                border: `1px solid ${alpha('#fff', 0.30)}`,
              }}
            />
          )}

          {/* Notification Center */}
          <NotificationCenter pusherService={pusherService} />

          {/* Logout */}
          <Tooltip title="Esci">
            <IconButton color="inherit" onClick={handleLogout} aria-label="Logout">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar navigation ──────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
        aria-label="Menu navigazione"
      >
        {/* Mobile: drawer temporaneo */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              bgcolor: BRAND.brownDark,
            },
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* Desktop/tablet: drawer permanente */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              bgcolor: BRAND.brownDark,
            },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      {/* ── Main content ────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          mt: { xs: '56px', sm: '64px' },
          // Spazio bottom nav su mobile
          pb: { xs: '60px', sm: 0 },
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>

      {/* ── Bottom Navigation (solo mobile) ─────────────────────────── */}
      {mounted && (
        <BottomNav
          pathname={pathname}
          onNavigate={handleNavigate}
          onMenuOpen={() => setMobileOpen(true)}
        />
      )}

      {/* ── Popups ──────────────────────────────────────────────────── */}
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
```

---

## Istruzioni deploy

**1. Crea i file:**
```
src/theme/theme.js          ← File 1 (nuovo)
src/components/ThemeRegistry.js ← File 3 (nuovo)
app/layout.js               ← sostituisci
app/ClientLayout.js         ← sostituisci
```

**2. Metti il logo in:**
```
public/logo_pastificio_nonna_claudia.jpg