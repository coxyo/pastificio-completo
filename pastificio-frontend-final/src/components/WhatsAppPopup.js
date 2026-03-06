// src/components/WhatsAppPopup.js - v1.0
// ✅ Popup messaggio WhatsApp in arrivo (stile CallPopup)
// ✅ Auto-close 30s (stesso tempo di risposta del bot)
// ✅ Bottone "Rispondi su WhatsApp Web"
// ✅ Cerca cliente nel gestionale per telefono
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Slide,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Reply as ReplyIcon,
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';
const AUTO_CLOSE_SECONDS = 30;

/**
 * POPUP WHATSAPP MESSAGGIO IN ARRIVO - v1.0
 * 
 * Props:
 * - messaggio: { nome, telefono, testo, timestamp }
 * - onClose: callback chiusura
 */
function WhatsAppPopup({ messaggio, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECONDS);
  const [clienteTrovato, setClienteTrovato] = useState(null);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [ordiniAttivi, setOrdiniAttivi] = useState([]);

  // SSR protection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Timer auto-close 30s
  useEffect(() => {
    if (!mounted) return;

    setSecondsLeft(AUTO_CLOSE_SECONDS);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          console.log('⏱️ [WhatsAppPopup] Timer scaduto, chiudo');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mounted, messaggio?.timestamp, onClose]);

  // Cerca cliente per telefono
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    if (!messaggio?.telefono) return;

    cercaCliente();
  }, [mounted, messaggio?.telefono]);

  const cercaCliente = async () => {
    setLoadingCliente(true);
    setClienteTrovato(null);
    setOrdiniAttivi([]);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Normalizza telefono (ultime 10 cifre)
      const telefonoNorm = (messaggio.telefono || '').replace(/\D/g, '').slice(-10);
      if (!telefonoNorm) return;

      // Cerca tra i clienti
      const res = await fetch(`${API_URL}/clienti`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const clienti = data.clienti || data.data || data || [];

        const trovato = clienti.find(c => {
          const cTel = (c.telefono || c.cellulare || '').replace(/\D/g, '').slice(-10);
          return cTel && cTel === telefonoNorm;
        });

        if (trovato) {
          console.log('👤 [WhatsAppPopup] Cliente trovato:', trovato.nome, trovato.cognome);
          setClienteTrovato(trovato);

          // Carica ordini attivi del cliente
          await cercaOrdiniCliente(trovato, token);
        } else {
          console.log('👤 [WhatsAppPopup] Cliente non trovato per telefono:', telefonoNorm);
        }
      }
    } catch (error) {
      console.error('[WhatsAppPopup] Errore ricerca cliente:', error);
    } finally {
      setLoadingCliente(false);
    }
  };

  const cercaOrdiniCliente = async (cliente, token) => {
    try {
      const clienteId = cliente._id || cliente.id;
      const clienteTelefono = (cliente.telefono || cliente.cellulare || '').replace(/\D/g, '').slice(-10);

      const res = await fetch(`${API_URL}/ordini?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const tutti = data.ordini || data.data || data || [];
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        const attivi = tutti.filter(o => {
          if (o.stato === 'completato' || o.stato === 'annullato' || o.stato === 'consegnato') return false;
          if (o.dataRitiro) {
            const dr = new Date(o.dataRitiro);
            dr.setHours(0, 0, 0, 0);
            if (dr < oggi) return false;
          }

          const oClienteId = o.cliente?._id || o.cliente?.id || o.cliente;
          if (clienteId && String(oClienteId) === String(clienteId)) return true;

          if (clienteTelefono) {
            const oTel = (o.telefono || o.cliente?.telefono || '').replace(/\D/g, '').slice(-10);
            if (oTel && oTel === clienteTelefono) return true;
          }

          return false;
        });

        attivi.sort((a, b) => new Date(a.dataRitiro || '2099-12-31') - new Date(b.dataRitiro || '2099-12-31'));
        setOrdiniAttivi(attivi.slice(0, 3));
      }
    } catch (error) {
      console.error('[WhatsAppPopup] Errore ordini:', error);
    }
  };

  // Apri WhatsApp Web
  const handleRispondi = useCallback(() => {
    const tel = (messaggio?.telefono || '').replace(/\D/g, '');
    // Aggiungi 39 se non presente (Italia)
    const telCompleto = tel.startsWith('39') ? tel : `39${tel}`;
    const url = `https://wa.me/${telCompleto}`;
    window.open(url, '_blank');
  }, [messaggio?.telefono]);

  if (!mounted || !messaggio) return null;

  const { nome, telefono, testo, timestamp } = messaggio;
  const progress = (secondsLeft / AUTO_CLOSE_SECONDS) * 100;
  const isUrgent = secondsLeft <= 10;

  const nomeVisualizzato = clienteTrovato
    ? `${clienteTrovato.nome || ''} ${clienteTrovato.cognome || ''}`.trim()
    : nome || 'Sconosciuto';

  return (
    <Slide direction="up" in={true} mountOnEnter unmountOnExit>
      <Paper
        elevation={12}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: { xs: 'calc(100% - 32px)', sm: 380 },
          maxWidth: 420,
          zIndex: 9999,
          borderRadius: 3,
          overflow: 'hidden',
          border: '2px solid #25D366',
          animation: isUrgent ? 'waPulse 1s ease-in-out infinite' : 'none',
        }}
      >
        {/* Barra progresso auto-close */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3,
            bgcolor: 'rgba(37,211,102,0.15)',
            '& .MuiLinearProgress-bar': {
              bgcolor: isUrgent ? '#FF5722' : '#25D366',
              transition: 'transform 1s linear'
            }
          }}
        />

        {/* Header verde WhatsApp */}
        <Box
          sx={{
            bgcolor: '#25D366',
            color: 'white',
            px: 2,
            py: 1.2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {/* Icona WhatsApp SVG inline */}
          <Box sx={{
            width: 36, height: 36, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              Messaggio WhatsApp
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              {secondsLeft}s — {isUrgent ? 'Il bot risponderà tra poco!' : 'Rispondi prima del bot'}
            </Typography>
          </Box>

          <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ px: 2, py: 1.5 }}>
          {/* Info mittente */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Avatar sx={{
              width: 44, height: 44,
              bgcolor: clienteTrovato ? '#1565C0' : '#78909C'
            }}>
              <PersonIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {loadingCliente ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} />
                    <span>Ricerca...</span>
                  </Box>
                ) : nomeVisualizzato}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {telefono || 'Numero non disponibile'}
              </Typography>
            </Box>
            {clienteTrovato && (
              <Chip
                label="Cliente"
                size="small"
                sx={{
                  bgcolor: 'rgba(21,101,192,0.1)',
                  color: '#1565C0',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24
                }}
              />
            )}
          </Box>

          {/* Messaggio */}
          <Box sx={{
            bgcolor: '#DCF8C6',
            borderRadius: '12px 12px 12px 4px',
            px: 2,
            py: 1.2,
            mb: 1.5,
            position: 'relative',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="body2" sx={{
              color: '#303030',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 100,
              overflow: 'hidden',
              fontSize: '0.88rem',
              lineHeight: 1.45
            }}>
              {testo || '(messaggio vuoto)'}
            </Typography>
            {timestamp && (
              <Typography variant="caption" sx={{
                display: 'block',
                textAlign: 'right',
                color: 'rgba(0,0,0,0.4)',
                mt: 0.5,
                fontSize: '0.68rem'
              }}>
                {new Date(timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
          </Box>

          {/* Ordini attivi (se cliente trovato) */}
          {clienteTrovato && ordiniAttivi.length > 0 && (
            <Box sx={{
              bgcolor: 'rgba(21,101,192,0.05)',
              borderRadius: 1,
              px: 1.5,
              py: 1,
              mb: 1,
              border: '1px solid rgba(21,101,192,0.15)'
            }}>
              <Typography variant="caption" fontWeight={700} color="primary">
                <ShoppingCartIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                {ordiniAttivi.length} ordine{ordiniAttivi.length !== 1 ? 'i' : ''} attivo{ordiniAttivi.length !== 1 ? 'i' : ''}
              </Typography>
              {ordiniAttivi.map((o, i) => (
                <Typography key={o._id || i} variant="caption" display="block" color="text.secondary" sx={{ ml: 2.5 }}>
                  {o.dataRitiro ? new Date(o.dataRitiro).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '?'} — {
                    (o.prodotti || []).slice(0, 2).map(p => p.nome || p.prodotto || '?').join(', ')
                  }{(o.prodotti || []).length > 2 ? ` +${o.prodotti.length - 2}` : ''}
                </Typography>
              ))}
            </Box>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{
          px: 2,
          pb: 1.5,
          display: 'flex',
          gap: 1
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            color="inherit"
            size="small"
            sx={{ flex: 1, textTransform: 'none', fontSize: '0.82rem' }}
          >
            Chiudi
          </Button>
          <Button
            onClick={handleRispondi}
            variant="contained"
            size="small"
            startIcon={<ReplyIcon />}
            endIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
            sx={{
              flex: 2,
              textTransform: 'none',
              fontSize: '0.82rem',
              bgcolor: '#25D366',
              '&:hover': { bgcolor: '#1DA851' }
            }}
          >
            Rispondi su WhatsApp
          </Button>
        </Box>

        {/* CSS animazione pulse */}
        <style jsx global>{`
          @keyframes waPulse {
            0%, 100% { box-shadow: 0 4px 20px rgba(37,211,102,0.3); }
            50% { box-shadow: 0 4px 30px rgba(37,211,102,0.6); }
          }
        `}</style>
      </Paper>
    </Slide>
  );
}

export default WhatsAppPopup;