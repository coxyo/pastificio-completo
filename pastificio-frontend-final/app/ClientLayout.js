// app/ClientLayout.js - ✅ FIX SSR 17/01/2026
// ✅ CallPopup caricato dinamicamente
// ✅ useIncomingCall protetto con typeof window
// ✅ Rimossa voce Zeppole (si accede da dialog in Ordini)
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

// ✅ Menu senza Zeppole (si accede dal pulsante in Ordini)
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
  
  // ✅ FIX SSR: Stati per chiamate (inizializzati solo client-side)
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  // ✅ FIX SSR: Carica hook solo client-side
  useEffect(() => {
    setMounted(true);

    // Importa dinamicamente il hook solo nel browser
    if (typeof window !== 'undefined') {
      import('@/hooks/useIncomingCall').then((module) => {
        const useIncomingCall = module.default;
        
        // Inizializza il hook (solo nel browser)
        const hookResult = useIncomingCall();
        
        // Aggiorna stati con i dati del hook
        if (hookResult.chiamataCorrente) {
          setChiamataCorrente(hookResult.chiamataCorrente);
          setIsPopupOpen(hookResult.isPopupOpen);
          setConnected(hookResult.connected);
        }
      }).catch(err => {
        console.error('❌ Errore caricamento useIncomingCall:', err);
      });
    }

    // Richiedi permessi notifiche browser
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 [ClientLayout] Permesso notifiche:', permission);
      });
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

  // ✅ Handler accettazione chiamata
  const handleAcceptAndNavigate = () => {
    if (typeof window === 'undefined') return;
    
    console.log('📞 [ClientLayout] Accetta chiamata:', chiamataCorrente);
    
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
    
    window.dispatchEvent(new Event('nuova-chiamata'));
    console.log('📢 Evento nuova-chiamata dispatched');
    
    setIsPopupOpen(false);
    setChiamataCorrente(null);
    console.log('✅ Popup chiuso');
    
    router.push('/');
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setChiamataCorrente(null);
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

          {/* Indicatore Pusher Connection */}
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

      {/* ✅ CALL POPUP CARICATO DINAMICAMENTE */}
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
