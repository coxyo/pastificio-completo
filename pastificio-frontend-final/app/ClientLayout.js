// app/ClientLayout.js - VERSIONE CORRETTA v2.0 - PUSHER TEMPORANEAMENTE DISABILITATO
// ✅ FIX: Popup si chiude correttamente al primo click
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

// ⚠️ TEMPORANEAMENTE DISABILITATO PER DEBUG
// import useIncomingCall from '@/hooks/useIncomingCall';
// import CallPopup from '@/components/CallPopup';

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
  const [pusherInitialized, setPusherInitialized] = useState(false);

  // ⚠️ TEMPORANEAMENTE DISABILITATO PER DEBUG
  // const { 
  //   chiamataCorrente, 
  //   isPopupOpen,
  //   handleClosePopup,
  //   handleAcceptCall,
  //   clearChiamata, 
  //   connected 
  // } = useIncomingCall();

  // Valori mock per far funzionare il resto
  const connected = false;
  const chiamataCorrente = null;
  const isPopupOpen = false;

  useEffect(() => {
    setMounted(true);
    
    // ⚠️ PUSHER INITIALIZATION TEMPORANEAMENTE DISABILITATA
    /*
    // Pusher initialization
    if (typeof window !== 'undefined' && !pusherInitialized) {
      console.log('🔧 [ClientLayout] Inizializzazione Pusher...');
      
      import('@/services/pusherService').then((module) => {
        const pusherService = module.default;
        
        console.log('✅ [ClientLayout] pusherService importato:', pusherService);

        const status = pusherService.getStatus();
        console.log('📊 [ClientLayout] Status iniziale:', status);

        if (!status.initialized) {
          console.log('🚀 [ClientLayout] Inizializzazione in corso...');
          
          pusherService.initialize()
            .then(() => {
              console.log('✅ [ClientLayout] Pusher inizializzato con successo!');
              setPusherInitialized(true);
              
              if (!window.pusherDebug) {
                window.pusherDebug = {
                  service: pusherService,
                  status: () => pusherService.getStatus()
                };
              }
            })
            .catch((error) => {
              console.error('❌ [ClientLayout] Errore inizializzazione:', error);
            });
        } else {
          console.log('✅ [ClientLayout] Pusher già inizializzato');
          setPusherInitialized(true);
        }
      }).catch((error) => {
        console.error('❌ [ClientLayout] Errore import pusherService:', error);
      });
    }
    */

    // Richiedi permessi notifiche browser
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 [ClientLayout] Permesso notifiche:', permission);
      });
    }
  }, [pusherInitialized]);

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

  // ⚠️ TEMPORANEAMENTE DISABILITATO PER DEBUG
  /*
  const handleAcceptAndNavigate = () => {
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
    
    handleAcceptCall();
    console.log('✅ Popup chiuso');
    
    router.push('/');
  };
  */

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

          {/* Indicatore Pusher Connection - TEMPORANEAMENTE DISABILITATO */}
          {mounted && process.env.NODE_ENV === 'development' && (
            <Box
              sx={{
                mr: 2,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: 'warning.main',
                color: 'white',
                fontSize: 12,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              📞 PUSHER DISABLED (DEBUG)
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

      {/* ⚠️ CALL POPUP TEMPORANEAMENTE DISABILITATO PER DEBUG */}
      {/* 
      {mounted && isPopupOpen && chiamataCorrente && (
        <CallPopup
          isOpen={isPopupOpen}
          callData={chiamataCorrente}
          onClose={handleClosePopup}
          onAccept={handleAcceptAndNavigate}
        />
      )}
      */}
    </Box>
  );
}
