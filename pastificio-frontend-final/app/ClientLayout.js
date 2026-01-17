// app/ClientLayout.js - ✅ FIX SSR DEFINITIVO 17/01/2026
// ✅ TUTTO il codice client-side protetto con 'use client' + typeof window
// ✅ CallPopup, useIncomingCall, localStorage: SOLO nel browser
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
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

// ✅ FIX SSR: Dynamic import per CallPopup (usa localStorage)
const CallPopup = dynamic(
  () => import('@/components/CallPopup'),
  { 
    ssr: false,
    loading: () => null
  }
);

const drawerWidth = 240;

// ✅ Menu completo
const menuItems = [
  { id: 'dashboard', title: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { id: 'ordini', title: 'Ordini', icon: <ShoppingCart />, path: '/' },
  { id: 'clienti', title: 'Clienti', icon: <People />, path: '/clienti' },
  { id: 'magazzino', title: 'Magazzino', icon: <Inventory />, path: '/magazzino' },
  { id: 'corrispettivi', title: '💰 Corrispettivi', icon: <Receipt />, path: '/corrispettivi' },
  { id: 'haccp', title: '🌡️ HACCP', icon: <Assessment />, path: '/haccp' },
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
  
  // ✅ Stati per chiamate (inizializzati null per SSR)
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  // ✅ FIX SSR: TUTTO il codice client-side qui
  useEffect(() => {
    // Verifica che siamo nel browser
    if (typeof window === 'undefined') {
      console.log('⚠️ SSR detected, skipping client-side code');
      return;
    }

    console.log('✅ Browser detected, initializing client-side code');
    setMounted(true);

    // ✅ Richiedi permessi notifiche (solo browser)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Permesso notifiche:', permission);
      });
    }

    // ✅ Carica hook chiamate (solo browser)
    let cleanup = null;
    
    import('@/hooks/useIncomingCall')
      .then((module) => {
        const useIncomingCall = module.default;
        
        // Crea un mini-component per usare il hook
        const IncomingCallHandler = () => {
          const hookData = useIncomingCall();
          
          // Aggiorna stati quando cambiano
          useEffect(() => {
            if (hookData.chiamataCorrente) {
              console.log('📞 Nuova chiamata rilevata:', hookData.chiamataCorrente);
              setChiamataCorrente(hookData.chiamataCorrente);
              setIsPopupOpen(hookData.isPopupOpen);
            }
            setConnected(hookData.connected);
          }, [hookData.chiamataCorrente, hookData.isPopupOpen, hookData.connected]);

          return null;
        };

        // Inizializza il handler
        const handler = IncomingCallHandler();
        cleanup = () => {
          console.log('🧹 Cleanup chiamate');
        };
      })
      .catch(err => {
        console.error('❌ Errore caricamento useIncomingCall:', err);
      });

    // Cleanup al unmount
    return () => {
      if (cleanup) cleanup();
    };
  }, []); // ✅ Esegui solo una volta al mount

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

  // ✅ Handler accettazione chiamata (protetto con typeof window)
  const handleAcceptAndNavigate = () => {
    if (typeof window === 'undefined') {
      console.warn('⚠️ handleAcceptAndNavigate chiamato su SSR, ignoro');
      return;
    }
    
    console.log('📞 Accetta chiamata:', chiamataCorrente);
    
    try {
      // Salva dati cliente in localStorage
      if (chiamataCorrente?.cliente) {
        localStorage.setItem('chiamataCliente', JSON.stringify({
          clienteId: chiamataCorrente.cliente._id,
          nome: chiamataCorrente.cliente.nome,
          cognome: chiamataCorrente.cliente.cognome || '',
          telefono: chiamataCorrente.numero,
          email: chiamataCorrente.cliente.email || '',
          timestamp: new Date().toISOString()
        }));
        console.log('✅ Dati cliente salvati:', chiamataCorrente.cliente.nome);
      } else if (chiamataCorrente?.numero) {
        localStorage.setItem('chiamataCliente', JSON.stringify({
          clienteId: null,
          nome: '',
          cognome: '',
          telefono: chiamataCorrente.numero,
          email: '',
          timestamp: new Date().toISOString()
        }));
        console.log('✅ Numero sconosciuto salvato:', chiamataCorrente.numero);
      }
      
      // Dispatch evento per GestoreOrdini
      window.dispatchEvent(new Event('nuova-chiamata'));
      console.log('📢 Evento nuova-chiamata dispatched');
      
      // Chiudi popup
      setIsPopupOpen(false);
      setChiamataCorrente(null);
      console.log('✅ Popup chiuso, navigazione a /');
      
      // Vai a pagina ordini
      router.push('/');
    } catch (err) {
      console.error('❌ Errore handleAcceptAndNavigate:', err);
    }
  };

  const handleClosePopup = () => {
    console.log('❌ Chiamata rifiutata/chiusa');
    setIsPopupOpen(false);
    setChiamataCorrente(null);
  };

  // ✅ Drawer menu
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

          {/* ✅ Indicatore connessione (solo se mounted) */}
          {mounted && (
            <Box
              sx={{
                mr: 2,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: connected ? 'success.main' : 'error.main',
                color: 'white',
                fontSize: 12,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              📞 {connected ? 'CONNECTED' : 'OFFLINE'}
            </Box>
          )}

          <IconButton color="inherit">
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* ✅ Sidebar */}
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
      
      {/* ✅ Main content */}
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

      {/* ✅ CALL POPUP - Caricato SOLO nel browser quando mounted */}
      {mounted && isPopupOpen && chiamataCorrente && (
        <CallPopup
          isOpen={isPopupOpen}
          callData={chiamataCorrente}
          onClose={handleClosePopup}
          onAccept={handleAcceptAndNavigate}
        />
      )}
    </Box>
  );
}
