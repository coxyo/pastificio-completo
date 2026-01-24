// src/components/CallPopup.js - v3.0 AZIONI RAPIDE 1-CLICK
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Grid
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Add as AddIcon,
  ShoppingCart as ShoppingCartIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

/**
 * POPUP CHIAMATA IN ARRIVO - v3.0 AZIONI RAPIDE
 * 
 * ✅ Hooks order compliant
 * ✅ Nuovo Ordine (1-click) → Vai a /ordini con cliente pre-selezionato
 * ✅ Ordini Attivi (1-click) → Mostra badge + click per vedere lista
 * ✅ Salva Cliente (1-click) → Form rapido nome/cognome/telefono
 */
function CallPopup({ chiamata, onClose, onSaveNote, isOpen = true }) {
  // ✅ TUTTI GLI HOOKS PRIMA
  const [loading, setLoading] = useState(false);
  const [ordiniAttivi, setOrdiniAttivi] = useState([]);
  const [loadingOrdini, setLoadingOrdini] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSalvaCliente, setShowSalvaCliente] = useState(false);
  const [nuovoCliente, setNuovoCliente] = useState({
    nome: '',
    cognome: '',
    telefono: ''
  });
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(45); // ✅ NUOVO: Timer 45 secondi

  // ✅ Hook SSR protection
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ NUOVO: Timer auto-chiusura 45 secondi
  useEffect(() => {
    if (!mounted) return;
    
    // Reset timer quando popup si apre
    setSecondsLeft(45);
    
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          console.log('⏱️ Timer scaduto, chiudo popup automaticamente');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [mounted, onClose]);

  // ✅ Hook caricamento ordini attivi
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    if (!chiamata?.cliente?._id && !chiamata?.cliente?.id) return;
    
    caricaOrdiniAttivi();
  }, [chiamata?.cliente, mounted]);

  // Carica ordini attivi (non completati/annullati)
  const caricaOrdiniAttivi = async () => {
    if (typeof window === 'undefined') return;
    
    setLoadingOrdini(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const clienteId = chiamata?.cliente?._id || chiamata?.cliente?.id;
      if (!clienteId) return;

      const response = await fetch(
        `${API_URL}/ordini?clienteId=${clienteId}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filtra solo ordini attivi (non completati/annullati)
        const attivi = (data.ordini || []).filter(o => 
          o.stato && 
          o.stato !== 'completato' && 
          o.stato !== 'annullato'
        );
        setOrdiniAttivi(attivi);
      }
    } catch (error) {
      console.error('[POPUP] Errore caricamento ordini:', error);
    } finally {
      setLoadingOrdini(false);
    }
  };

  // ✅ AZIONE 1: NUOVO ORDINE (1-CLICK)
  const handleNuovoOrdine = () => {
    console.log('🆕 Nuovo Ordine - chiamata completa:', chiamata);
    console.log('  - cliente:', chiamata?.cliente);
    console.log('  - numero:', chiamata?.numero);
    
    if (typeof window === 'undefined') return;
    
    // ✅ NUOVO: Pulisci PRIMA i vecchi dati
    localStorage.removeItem('nuovoOrdine_clientePreselezionato');
    console.log('🧹 localStorage pulito prima di salvare nuovi dati');
    
    // Salva cliente in localStorage per pre-compilazione
    if (chiamata?.cliente && typeof chiamata.cliente === 'object' && chiamata.cliente._id) {
      console.log('✅ CASO 1: Cliente registrato trovato');
      localStorage.setItem('nuovoOrdine_clientePreselezionato', JSON.stringify({
        _id: chiamata.cliente._id || chiamata.cliente.id,
        nome: chiamata.cliente.nome,
        cognome: chiamata.cliente.cognome,
        telefono: chiamata.cliente.telefono || chiamata.cliente.cellulare || chiamata.numero,
        email: chiamata.cliente.email,
        codiceCliente: chiamata.cliente.codiceCliente
      }));
      console.log('✅ Cliente salvato in localStorage per pre-compilazione');
    } else if (chiamata?.numero) {
      // ✅ Numero sconosciuto (o cliente è stringa 'sconosciuto')
      console.log('✅ CASO 2: Numero sconosciuto');
      const numeroSenzaPrefisso = chiamata.numero.replace(/^\+39/, '');
      const datiDaSalvare = {
        _id: null,
        nome: '',
        cognome: '',
        telefono: numeroSenzaPrefisso,
        email: '',
        codiceCliente: null
      };
      console.log('  Dati da salvare:', datiDaSalvare);
      localStorage.setItem('nuovoOrdine_clientePreselezionato', JSON.stringify(datiDaSalvare));
      console.log('✅ Numero sconosciuto salvato per pre-compilazione:', chiamata.numero);
    } else {
      console.warn('⚠️ CASO 3: Nessun cliente e nessun numero trovato!');
    }
    
    // Verifica cosa è stato salvato
    const verificaSalvataggio = localStorage.getItem('nuovoOrdine_clientePreselezionato');
    console.log('🔍 Verifica localStorage dopo salvataggio:', verificaSalvataggio);
    
    // Chiudi popup
    onClose();
    
    // OPZIONE A: Vai a /ordini e triggera evento custom
    console.log('📍 Navigazione a /ordini + trigger nuovo ordine...');
    
    // Se siamo già in /ordini, triggera evento
    if (window.location.pathname === '/ordini') {
      console.log('✅ Già in /ordini, triggerando evento apertura form...');
      window.dispatchEvent(new CustomEvent('open-nuovo-ordine'));
    } else {
      // Vai a /ordini e salva flag per aprire form
      localStorage.setItem('_openNuovoOrdineOnLoad', 'true');
      window.location.href = '/ordini';
    }
  };

  // ✅ AZIONE 2: VEDI ORDINI ATTIVI (1-CLICK)
  const handleVediOrdiniAttivi = () => {
    console.log('📦 Vedi ordini attivi:', ordiniAttivi);
    
    if (typeof window === 'undefined') return;
    
    // Salva filtro cliente per la pagina ordini
    if (chiamata?.cliente) {
      localStorage.setItem('ordini_filtroCliente', JSON.stringify({
        _id: chiamata.cliente._id || chiamata.cliente.id,
        nome: chiamata.cliente.nome,
        cognome: chiamata.cliente.cognome
      }));
      console.log('✅ Filtro cliente salvato in localStorage');
    }
    
    // Chiudi popup
    onClose();
    
    // Vai alla pagina ordini con filtro attivo
    console.log('📍 Navigazione a /ordini?tab=lista...');
    window.location.href = '/ordini?tab=lista';
  };

  // ✅ AZIONE 3: SALVA CLIENTE (1-CLICK) - MOSTRA FORM
  const handleMostraSalvaCliente = () => {
    console.log('👤 Mostra form salva cliente');
    
    // Pre-compila telefono
    setNuovoCliente({
      nome: '',
      cognome: '',
      telefono: chiamata?.numero?.replace(/^\+39/, '') || ''
    });
    
    setShowSalvaCliente(true);
  };

  // Salva nuovo cliente
  const handleSalvaClienteDB = async () => {
    if (!nuovoCliente.nome || !nuovoCliente.telefono) {
      alert('Nome e Telefono sono obbligatori');
      return;
    }

    setSalvandoCliente(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Token non trovato');
        return;
      }

      const response = await fetch(`${API_URL}/clienti`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: nuovoCliente.nome,
          cognome: nuovoCliente.cognome,
          telefono: nuovoCliente.telefono,
          cellulare: nuovoCliente.telefono,
          attivo: true
        })
      });

      if (response.ok) {
        const clienteCreato = await response.json();
        console.log('✅ Cliente salvato:', clienteCreato);
        
        // Aggiorna chiamata con nuovo cliente
        if (chiamata && clienteCreato.cliente) {
          chiamata.cliente = clienteCreato.cliente;
        }
        
        alert(`✅ Cliente "${nuovoCliente.nome} ${nuovoCliente.cognome}" salvato!`);
        setShowSalvaCliente(false);
        
        // Ricarica popup con nuovo cliente
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`❌ Errore: ${error.message || 'Impossibile salvare cliente'}`);
      }
    } catch (error) {
      console.error('Errore salvataggio cliente:', error);
      alert('❌ Errore di rete');
    } finally {
      setSalvandoCliente(false);
    }
  };

  // Colore badge fedeltà
  const getLivelloColor = (livello) => {
    const colors = {
      bronzo: '#CD7F32',
      argento: '#C0C0C0',
      oro: '#FFD700',
      platino: '#E5E4E2'
    };
    return colors[livello?.toLowerCase()] || '#999';
  };

  // ✅ RETURN CONDIZIONALE DOPO TUTTI GLI HOOKS
  if (!chiamata || !mounted || !isOpen) {
    return null;
  }

  const { cliente, numero, callId, timestamp } = chiamata;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <PhoneIcon sx={{ animation: 'pulse 1.5s infinite' }} />
          <Typography variant="h6" fontWeight="bold">
            Chiamata in Arrivo
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          {/* ✅ NUOVO: Timer countdown */}
          <Chip
            label={`${secondsLeft}s`}
            size="small"
            sx={{
              bgcolor: secondsLeft <= 10 ? 'error.main' : 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 'bold',
              animation: secondsLeft <= 10 ? 'pulse 0.5s infinite' : 'none'
            }}
          />
          
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* CLIENTE REGISTRATO */}
        {cliente ? (
          <Box>
            {/* Avatar e Nome */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem'
                }}
              >
                {(cliente.nome?.[0] || '?')}{(cliente.cognome?.[0] || '')}
              </Avatar>

              <Box flex={1}>
                <Typography variant="h5" fontWeight="bold">
                  {cliente.nome || ''} {cliente.cognome || ''}
                </Typography>

                <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                  {cliente.codiceCliente && (
                    <Chip
                      label={cliente.codiceCliente}
                      size="small"
                      icon={<PersonIcon />}
                    />
                  )}

                  {cliente.livelloFedelta && (
                    <Chip
                      label={cliente.livelloFedelta.toUpperCase()}
                      size="small"
                      icon={<StarIcon />}
                      sx={{
                        bgcolor: getLivelloColor(cliente.livelloFedelta),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Contatti */}
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                📞 {cliente.telefono || cliente.cellulare || numero}
              </Typography>
              {cliente.email && (
                <Typography variant="body2" color="text.secondary">
                  📧 {cliente.email}
                </Typography>
              )}
              {(cliente.punti > 0) && (
                <Typography variant="body2" color="primary" fontWeight="bold">
                  ⭐ Punti Fedeltà: {cliente.punti}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Ordini Attivi Badge */}
            <Box mb={2}>
              {loadingOrdini ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Caricamento ordini...
                  </Typography>
                </Box>
              ) : ordiniAttivi.length > 0 ? (
                <Alert 
                  severity="info" 
                  icon={<ShoppingCartIcon />}
                  sx={{ cursor: 'pointer' }}
                  onClick={handleVediOrdiniAttivi}
                >
                  <Typography variant="body2" fontWeight="bold">
                    🛒 {ordiniAttivi.length} ordine{ordiniAttivi.length !== 1 ? 'i' : ''} attivo{ordiniAttivi.length !== 1 ? 'i' : ''}
                  </Typography>
                  <Typography variant="caption">
                    Click per vedere dettagli
                  </Typography>
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  ✅ Nessun ordine attivo
                </Typography>
              )}
            </Box>

            {/* Info Timestamp */}
            {timestamp && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                mb={2}
              >
                📅 {formatDistanceToNow(new Date(timestamp), { 
                  addSuffix: true,
                  locale: it 
                })}
              </Typography>
            )}
          </Box>
        ) : (
          /* NUMERO SCONOSCIUTO */
          <Box>
            <Box textAlign="center" py={2} mb={2}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'grey.400',
                  margin: '0 auto',
                  mb: 2
                }}
              >
                <PhoneIcon sx={{ fontSize: 32 }} />
              </Avatar>

              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Numero Sconosciuto
              </Typography>

              <Typography variant="h5" color="primary" fontWeight="bold" mb={2}>
                {numero || 'Numero non disponibile'}
              </Typography>
            </Box>

            {/* Form Salva Cliente (se attivato) */}
            {showSalvaCliente ? (
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" mb={2}>
                  👤 Salva Nuovo Cliente
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nome *"
                      value={nuovoCliente.nome}
                      onChange={(e) => setNuovoCliente({...nuovoCliente, nome: e.target.value})}
                      autoFocus
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Cognome"
                      value={nuovoCliente.cognome}
                      onChange={(e) => setNuovoCliente({...nuovoCliente, cognome: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Telefono *"
                      value={nuovoCliente.telefono}
                      onChange={(e) => setNuovoCliente({...nuovoCliente, telefono: e.target.value})}
                    />
                  </Grid>
                </Grid>

                <Box display="flex" gap={1} mt={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowSalvaCliente(false)}
                    disabled={salvandoCliente}
                  >
                    Annulla
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSalvaClienteDB}
                    disabled={salvandoCliente || !nuovoCliente.nome || !nuovoCliente.telefono}
                    startIcon={salvandoCliente ? <CircularProgress size={16} /> : <PersonAddIcon />}
                  >
                    {salvandoCliente ? 'Salvataggio...' : 'Salva'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Alert severity="warning">
                Questo numero non è associato a nessun cliente. 
                Usa il bottone "Salva Cliente" per registrarlo.
              </Alert>
            )}

            {/* Info Timestamp */}
            {timestamp && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                mt={2}
              >
                📅 {formatDistanceToNow(new Date(timestamp), { 
                  addSuffix: true,
                  locale: it 
                })}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      {/* ✅ ACTIONS - PULSANTI RAPIDI 1-CLICK */}
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        {/* Bottone CHIUDI (sempre visibile) */}
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ minWidth: '100px' }}
        >
          Chiudi
        </Button>

        {cliente ? (
          <>
            {/* Cliente Registrato: Nuovo Ordine + Ordini Attivi */}
            <Button
              onClick={handleNuovoOrdine}
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ minWidth: '140px' }}
            >
              Nuovo Ordine
            </Button>

            {ordiniAttivi.length > 0 && (
              <Button
                onClick={handleVediOrdiniAttivi}
                variant="outlined"
                color="info"
                startIcon={<ShoppingCartIcon />}
                sx={{ minWidth: '140px' }}
              >
                Ordini Attivi ({ordiniAttivi.length})
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Numero Sconosciuto: Nuovo Ordine + Salva Cliente */}
            <Button
              onClick={handleNuovoOrdine}
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ minWidth: '140px' }}
            >
              Nuovo Ordine
            </Button>
            
            {!showSalvaCliente && (
              <Button
                onClick={handleMostraSalvaCliente}
                variant="contained"
                color="success"
                startIcon={<PersonAddIcon />}
                sx={{ minWidth: '140px' }}
              >
                Salva Cliente
              </Button>
            )}
          </>
        )}
      </DialogActions>

      {/* CSS per animazione pulse */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </Dialog>
  );
}

export default CallPopup;