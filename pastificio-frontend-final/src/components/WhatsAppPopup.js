// src/components/WhatsAppPopup.js - v2.0 SUGGERISCI E INVIA
// ✅ Mostra risposta AI suggerita (generata dal VPS prima del Pusher)
// ✅ L'operatore può modificare la risposta nel textarea
// ✅ Bottone "Invia" → POST /api/invia-messaggio al VPS
// ✅ Bottone "Ignora" → chiude senza inviare
// ✅ Auto-close 30s con countdown visibile
// ✅ Ricerca cliente e ordini attivi
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  LinearProgress,
  TextField,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Block as BlockIcon,
  ShoppingCart as ShoppingCartIcon,
  Edit as EditIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';
const AUTO_CLOSE_SECONDS = 30;

/**
 * POPUP WHATSAPP - SUGGERISCI E INVIA - v2.0
 *
 * Props:
 * - messaggio: { nome, telefono, testo, rispostaSuggerita, timestamp }
 * - onClose: callback chiusura
 */
function WhatsAppPopup({ messaggio, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECONDS);
  const [clienteTrovato, setClienteTrovato] = useState(null);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [ordiniAttivi, setOrdiniAttivi] = useState([]);

  // Gestione risposta
  const [testoRisposta, setTestoRisposta] = useState('');


  const timerRef = useRef(null);

  // SSR protection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Quando arriva un nuovo messaggio, inizializza la risposta suggerita
  useEffect(() => {
    if (!messaggio) return;
    setTestoRisposta(messaggio.rispostaSuggerita || '');
  }, [messaggio?.timestamp]);

  // Timer auto-close 30s
  useEffect(() => {
    if (!mounted) return;
    setSecondsLeft(AUTO_CLOSE_SECONDS);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          console.log('[WhatsAppPopup] Timer scaduto, chiudo');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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

      const telefonoNorm = (messaggio.telefono || '').replace(/\D/g, '').slice(-10);
      if (!telefonoNorm) return;

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
          setClienteTrovato(trovato);
          await cercaOrdiniCliente(trovato, token);
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

  // Apre WhatsApp Web con il testo pre-compilato (bozza) — l'operatore preme Invio manualmente
  const handleApriWhatsApp = useCallback(() => {
    const tel = (messaggio?.telefono || '').replace(/\D/g, '');
    const telCompleto = tel.startsWith('39') ? tel : `39${tel}`;
    const testo = testoRisposta.trim();
    const url = `https://wa.me/${telCompleto}` + (testo ? `?text=${encodeURIComponent(testo)}` : '');
    window.open(url, '_blank');
    // Chiudi il popup dopo aver aperto WhatsApp
    setTimeout(() => onClose(), 500);
  }, [testoRisposta, messaggio?.telefono, onClose]);

  if (!mounted || !messaggio) return null;

  const { nome, telefono, testo, rispostaSuggerita, timestamp } = messaggio;
  const progress = (secondsLeft / AUTO_CLOSE_SECONDS) * 100;
  const isUrgent = secondsLeft <= 10;
  const haRispostaSuggerita = !!rispostaSuggerita;

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
          width: { xs: 'calc(100% - 32px)', sm: 420 },
          maxWidth: 460,
          zIndex: 9999,
          borderRadius: 3,
          overflow: 'hidden',
          border: isUrgent ? '2px solid #FF5722' : '2px solid #25D366',
          animation: isUrgent ? 'waPulse 1s ease-in-out infinite' : 'none',
        }}
      >
        {/* Barra progresso */}
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
        <Box sx={{
          bgcolor: '#25D366',
          color: 'white',
          px: 2,
          py: 1.2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              Messaggio WhatsApp
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              {`${secondsLeft}s — ${isUrgent ? 'Urgente!' : 'Suggerisci e invia'}`}
            </Typography>
          </Box>

          <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ px: 2, py: 1.5 }}>

          {/* Info mittente */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: clienteTrovato ? '#1565C0' : '#78909C' }}>
              <PersonIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {loadingCliente ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <CircularProgress size={12} />
                    <span style={{ fontSize: '0.82rem' }}>Ricerca...</span>
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
                sx={{ bgcolor: 'rgba(21,101,192,0.1)', color: '#1565C0', fontWeight: 600, fontSize: '0.68rem', height: 22 }}
              />
            )}
          </Box>

          {/* Messaggio del cliente */}
          <Box sx={{
            bgcolor: '#DCF8C6',
            borderRadius: '12px 12px 12px 4px',
            px: 1.8, py: 1,
            mb: 1.2,
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="body2" sx={{
              color: '#303030',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 80,
              overflow: 'hidden',
              fontSize: '0.87rem',
              lineHeight: 1.4
            }}>
              {testo || '(messaggio vuoto)'}
            </Typography>
            {timestamp && (
              <Typography variant="caption" sx={{
                display: 'block', textAlign: 'right',
                color: 'rgba(0,0,0,0.4)', mt: 0.3, fontSize: '0.66rem'
              }}>
                {new Date(timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
          </Box>

          {/* Ordini attivi */}
          {clienteTrovato && ordiniAttivi.length > 0 && (
            <Box sx={{
              bgcolor: 'rgba(21,101,192,0.05)',
              borderRadius: 1,
              px: 1.5, py: 0.8,
              mb: 1.2,
              border: '1px solid rgba(21,101,192,0.15)'
            }}>
              <Typography variant="caption" fontWeight={700} color="primary">
                <ShoppingCartIcon sx={{ fontSize: 13, verticalAlign: 'middle', mr: 0.5 }} />
                {ordiniAttivi.length} ordine{ordiniAttivi.length !== 1 ? 'i' : ''} attivo{ordiniAttivi.length !== 1 ? 'i' : ''}
              </Typography>
              {ordiniAttivi.map((o, i) => (
                <Typography key={o._id || i} variant="caption" display="block" color="text.secondary" sx={{ ml: 2.5, fontSize: '0.72rem' }}>
                  {o.dataRitiro ? new Date(o.dataRitiro).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '?'} —{' '}
                  {(o.prodotti || []).slice(0, 2).map(p => p.nome || p.prodotto || '?').join(', ')}
                  {(o.prodotti || []).length > 2 ? ` +${o.prodotti.length - 2}` : ''}
                </Typography>
              ))}
            </Box>
          )}

          <Divider sx={{ mb: 1.2 }} />

          {/* Area risposta suggerita */}
          <Box>
              {/* Label con badge AI */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                <AIIcon sx={{ fontSize: 16, color: haRispostaSuggerita ? '#7C4DFF' : '#90A4AE' }} />
                <Typography variant="caption" fontWeight={700} color={haRispostaSuggerita ? '#7C4DFF' : 'text.secondary'}>
                  {haRispostaSuggerita ? 'Risposta suggerita dall\'AI' : 'Nessuna risposta suggerita (messaggio non pertinente)'}
                </Typography>
                {haRispostaSuggerita && (
                  <Chip
                    label="Modifica libera"
                    size="small"
                    icon={<EditIcon sx={{ fontSize: '11px !important' }} />}
                    sx={{ height: 18, fontSize: '0.62rem', ml: 'auto', bgcolor: 'rgba(124,77,255,0.08)', color: '#7C4DFF', border: '1px solid rgba(124,77,255,0.25)' }}
                  />
                )}
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={5}
                value={testoRisposta}
                onChange={(e) => setTestoRisposta(e.target.value)}
                placeholder={haRispostaSuggerita
                  ? 'Modifica la risposta se necessario...'
                  : 'Scrivi una risposta manuale...'
                }
                variant="outlined"
                size="small"
                sx={{
                  mb: 0.8,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.85rem',
                    borderRadius: 2,
                    bgcolor: haRispostaSuggerita ? 'rgba(124,77,255,0.03)' : 'transparent',
                    '& fieldset': {
                      borderColor: haRispostaSuggerita ? 'rgba(124,77,255,0.35)' : undefined,
                    },
                    '&:hover fieldset': {
                      borderColor: haRispostaSuggerita ? '#7C4DFF' : undefined,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#25D366',
                    },
                  }
                }}
              />

              {/* Contatore caratteri */}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mb: 0.5, fontSize: '0.68rem' }}>
                {testoRisposta.length} caratteri
              </Typography>


          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<BlockIcon sx={{ fontSize: '16px !important' }} />}
            sx={{
              flex: 1,
              textTransform: 'none',
              fontSize: '0.80rem',
              borderColor: 'rgba(0,0,0,0.2)',
              color: 'text.secondary'
            }}
          >
            Ignora
          </Button>
          <Button
            onClick={handleApriWhatsApp}
            variant="contained"
            size="small"
            disabled={!testoRisposta.trim()}
            startIcon={<SendIcon sx={{ fontSize: '16px !important' }} />}
            sx={{
              flex: 2,
              textTransform: 'none',
              fontSize: '0.82rem',
              bgcolor: '#25D366',
              '&:hover': { bgcolor: '#1DA851' },
              '&.Mui-disabled': { bgcolor: 'rgba(37,211,102,0.4)', color: 'rgba(255,255,255,0.7)' }
            }}
          >
            Apri in WhatsApp
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