// src/components/alerts/NotificationCenter.js - Campanella + drawer notifiche
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Tooltip,
  Collapse,
  Alert as MuiAlert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Circle as CircleIcon,
  Phone as PhoneIcon,
  OpenInNew as OpenIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

// Colori per priorità
const PRIORITA_COLORS = {
  critico: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', badge: '#ef4444' },
  attenzione: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', badge: '#f59e0b' },
  informativo: { bg: '#f0fdf4', border: '#22c55e', text: '#166534', badge: '#22c55e' }
};

// Raggruppamento per data
const raggruppaPerData = (alerts) => {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  
  const ieri = new Date(oggi);
  ieri.setDate(ieri.getDate() - 1);
  
  const inizioSettimana = new Date(oggi);
  inizioSettimana.setDate(inizioSettimana.getDate() - 7);
  
  const gruppi = {
    oggi: [],
    ieri: [],
    questaSettimana: [],
    precedenti: []
  };
  
  alerts.forEach(alert => {
    const data = new Date(alert.createdAt);
    data.setHours(0, 0, 0, 0);
    
    if (data.getTime() === oggi.getTime()) {
      gruppi.oggi.push(alert);
    } else if (data.getTime() === ieri.getTime()) {
      gruppi.ieri.push(alert);
    } else if (data >= inizioSettimana) {
      gruppi.questaSettimana.push(alert);
    } else {
      gruppi.precedenti.push(alert);
    }
  });
  
  return gruppi;
};

export default function NotificationCenter({ pusherService }) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [nonLetti, setNonLetti] = useState(0);
  const [critici, setCritici] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({ 
    oggi: true, ieri: true, questaSettimana: false, precedenti: false 
  });
  const intervalRef = useRef(null);

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  };

  // Fetch conteggio non letti
  const fetchCount = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const res = await fetch(`${API_URL}/alerts/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setNonLetti(data.nonLetti || 0);
        setCritici(data.critici || 0);
      }
    } catch (error) {
      // Silenzioso - non bloccare UI per errori count
    }
  }, []);

  // Fetch lista alert
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;
      
      const res = await fetch(`${API_URL}/alerts?limit=50&giorni=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setNonLetti(data.nonLetti || 0);
      }
    } catch (error) {
      console.error('[NotificationCenter] Errore fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling conteggio ogni 2 minuti
  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 2 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCount]);

  // Pusher: ascolta nuovi alert
  useEffect(() => {
    if (!pusherService) return;
    
    try {
      const channel = pusherService.subscribe('alerts');
      
      channel.bind('nuovi-alert', (data) => {
        setNonLetti(data.nonLetti || 0);
        // Se drawer aperto, ricarica lista
        if (open) fetchAlerts();
      });
      
      return () => {
        try {
          channel.unbind_all();
          pusherService.unsubscribe('alerts');
        } catch (e) {}
      };
    } catch (e) {
      // Pusher non disponibile, usa solo polling
    }
  }, [pusherService, open, fetchAlerts]);

  // Carica alerts quando si apre il drawer
  useEffect(() => {
    if (open) fetchAlerts();
  }, [open, fetchAlerts]);

  // Segna come letto
  const handleSegnaLetto = async (alertId) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setNonLetti(data.nonLetti || 0);
        setAlerts(prev => prev.map(a => 
          a._id === alertId ? { ...a, letto: true } : a
        ));
      }
    } catch (error) {
      console.error('[NotificationCenter] Errore segna letto:', error);
    }
  };

  // Segna tutti come letti
  const handleSegnaLettiTutti = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/alerts/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setNonLetti(0);
        setAlerts(prev => prev.map(a => ({ ...a, letto: true })));
      }
    } catch (error) {
      console.error('[NotificationCenter] Errore segna tutti letti:', error);
    }
  };

  // Elimina alert
  const handleElimina = async (alertId) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/alerts/${alertId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a._id !== alertId));
        fetchCount();
      }
    } catch (error) {
      console.error('[NotificationCenter] Errore elimina:', error);
    }
  };

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const gruppi = raggruppaPerData(alerts);

  // Render singolo alert
  const renderAlert = (alert) => {
    const colors = PRIORITA_COLORS[alert.priorita] || PRIORITA_COLORS.attenzione;
    
    return (
      <ListItem
        key={alert._id}
        sx={{
          bgcolor: alert.letto ? 'transparent' : colors.bg,
          borderLeft: `4px solid ${colors.border}`,
          mb: 0.5,
          borderRadius: '0 8px 8px 0',
          px: 2,
          py: 1,
          transition: 'all 0.2s',
          '&:hover': { bgcolor: colors.bg }
        }}
      >
        <ListItemIcon sx={{ minWidth: 36, fontSize: 20 }}>
          {alert.icona || '⚠️'}
        </ListItemIcon>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {!alert.letto && (
                <CircleIcon sx={{ fontSize: 8, color: colors.badge }} />
              )}
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: alert.letto ? 400 : 700, 
                  color: colors.text,
                  fontSize: '13px'
                }}
              >
                {alert.titolo}
              </Typography>
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.25 }}>
                {alert.messaggio}
              </Typography>
              <Typography variant="caption" sx={{ color: '#999', fontSize: '11px' }}>
                {new Date(alert.createdAt).toLocaleString('it-IT', { 
                  hour: '2-digit', minute: '2-digit',
                  day: '2-digit', month: 'short'
                })}
              </Typography>
            </Box>
          }
        />
        
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          {/* Azione telefono se disponibile */}
          {alert.azione?.tipo === 'telefono' && (
            <Tooltip title={`Chiama ${alert.azione.valore}`}>
              <IconButton 
                size="small" 
                onClick={() => window.open(`tel:${alert.azione.valore}`)}
                sx={{ color: '#22c55e' }}
              >
                <PhoneIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          
          {!alert.letto && (
            <Tooltip title="Segna come letto">
              <IconButton 
                size="small" 
                onClick={() => handleSegnaLetto(alert._id)}
              >
                <DoneAllIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Elimina">
            <IconButton 
              size="small" 
              onClick={() => handleElimina(alert._id)}
              sx={{ color: '#999' }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItem>
    );
  };

  // Render gruppo
  const renderGruppo = (nome, titolo, items) => {
    if (items.length === 0) return null;
    
    return (
      <Box key={nome}>
        <Box
          onClick={() => toggleGroup(nome)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 0.75,
            cursor: 'pointer',
            bgcolor: '#f8f9fa',
            '&:hover': { bgcolor: '#f0f1f3' }
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#666', textTransform: 'uppercase', fontSize: '11px' }}>
            {titolo} ({items.length})
          </Typography>
          {expandedGroups[nome] ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
        </Box>
        
        <Collapse in={expandedGroups[nome]}>
          <List dense sx={{ py: 0 }}>
            {items.map(renderAlert)}
          </List>
        </Collapse>
      </Box>
    );
  };

  return (
    <>
      {/* ══════ CAMPANELLA ══════ */}
      <Tooltip title={nonLetti > 0 ? `${nonLetti} notifiche non lette` : 'Notifiche'}>
        <IconButton 
          color="inherit" 
          onClick={() => setOpen(true)}
          sx={{ mr: 0.5 }}
        >
          <Badge 
            badgeContent={nonLetti} 
            color={critici > 0 ? 'error' : 'warning'}
            max={99}
          >
            <NotificationsIcon 
              sx={{ 
                animation: nonLetti > 0 ? 'bellShake 2s ease-in-out infinite' : 'none',
                '@keyframes bellShake': {
                  '0%, 100%': { transform: 'rotate(0deg)' },
                  '10%': { transform: 'rotate(12deg)' },
                  '20%': { transform: 'rotate(-10deg)' },
                  '30%': { transform: 'rotate(8deg)' },
                  '40%': { transform: 'rotate(-6deg)' },
                  '50%, 100%': { transform: 'rotate(0deg)' }
                }
              }}
            />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* ══════ DRAWER NOTIFICHE ══════ */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 }, maxWidth: '100vw' }
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #e5e7eb',
          bgcolor: '#f8fafc'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
              🔔 Notifiche
            </Typography>
            {nonLetti > 0 && (
              <Chip 
                label={nonLetti} 
                size="small" 
                color="error"
                sx={{ height: 22, fontSize: 12 }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {nonLetti > 0 && (
              <Tooltip title="Segna tutte come lette">
                <IconButton size="small" onClick={handleSegnaLettiTutti}>
                  <DoneAllIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Ricarica">
              <IconButton size="small" onClick={fetchAlerts}>
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Contenuto */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : alerts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: '#999' }}>
              <NotificationsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
              <Typography variant="body2">Nessuna notifica</Typography>
              <Typography variant="caption" sx={{ color: '#bbb' }}>
                Il sistema ti avviserà in caso di anomalie
              </Typography>
            </Box>
          ) : (
            <>
              {renderGruppo('oggi', 'Oggi', gruppi.oggi)}
              {renderGruppo('ieri', 'Ieri', gruppi.ieri)}
              {renderGruppo('questaSettimana', 'Questa settimana', gruppi.questaSettimana)}
              {renderGruppo('precedenti', 'Precedenti', gruppi.precedenti)}
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
}