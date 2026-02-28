// src/components/alerts/AlertBanner.js - Banner alert critici per dashboard/GestoreOrdini
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

export default function AlertBanner({ onViewDetails }) {
  const [alerts, setAlerts] = useState([]);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const fetchCritici = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      
      const res = await fetch(`${API_URL}/alerts?letto=false&giorni=7&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Mostra solo critici e attenzione non letti
        const importanti = (data.alerts || []).filter(
          a => a.priorita === 'critico' || a.priorita === 'attenzione'
        );
        setAlerts(importanti);
        setVisible(importanti.length > 0);
        setDismissed(false);
      }
    } catch (error) {
      // Silenzioso
    }
  }, []);

  useEffect(() => {
    fetchCritici();
    // Refresh ogni 5 minuti
    const interval = setInterval(fetchCritici, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCritici]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  if (dismissed || alerts.length === 0) return null;

  return (
    <Collapse in={visible}>
      <Box
        sx={{
          mx: 2,
          mt: 1,
          mb: 1,
          p: 1.5,
          borderRadius: 2,
          bgcolor: alerts.some(a => a.priorita === 'critico') ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${alerts.some(a => a.priorita === 'critico') ? '#fecaca' : '#fde68a'}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1
        }}
      >
        <WarningIcon 
          sx={{ 
            color: alerts.some(a => a.priorita === 'critico') ? '#ef4444' : '#f59e0b',
            fontSize: 20,
            mt: 0.25
          }} 
        />
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
            {alerts.length === 1 
              ? '1 situazione richiede attenzione'
              : `${alerts.length} situazioni richiedono attenzione`
            }
          </Typography>
          
          {alerts.slice(0, 3).map((alert, i) => (
            <Typography 
              key={alert._id} 
              variant="caption" 
              sx={{ display: 'block', color: '#666', mt: 0.25, fontSize: 12 }}
            >
              {alert.icona} {alert.titolo}
            </Typography>
          ))}
          
          {alerts.length > 3 && (
            <Typography variant="caption" sx={{ color: '#999', mt: 0.5 }}>
              ... e {alerts.length - 3} {alerts.length - 3 === 1 ? 'altro' : 'altri'}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {onViewDetails && (
            <Button 
              size="small" 
              variant="text"
              onClick={onViewDetails}
              sx={{ fontSize: 11, minWidth: 'auto', textTransform: 'none' }}
            >
              Dettagli
            </Button>
          )}
          <IconButton size="small" onClick={handleDismiss}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>
    </Collapse>
  );
}