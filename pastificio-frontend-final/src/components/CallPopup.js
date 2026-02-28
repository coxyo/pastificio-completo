// src/components/CallPopup.js - v3.1 FIX ORDINI ATTIVI + FIX DATI CLIENTE
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Grid,
  List,
  ListItem,
  ListItemText
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
import { formatDistanceToNow, format } from 'date-fns';
import { it } from 'date-fns/locale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

/**
 * POPUP CHIAMATA IN ARRIVO - v3.1 FIX
 * 
 * ✅ FIX 27/02/2026: Riceve e usa onNuovoOrdine prop (non più localStorage)
 * ✅ FIX 27/02/2026: Ordini attivi filtrati per data futura
 * ✅ FIX 27/02/2026: Mostra dettaglio ordini nel popup
 * ✅ FIX 27/02/2026: Pulizia dati tra chiamate diverse
 */
function CallPopup({ 
  chiamata, 
  onClose, 
  onNuovoOrdine,       // ✅ FIX 27/02: Callback per nuovo ordine
  onVediOrdini,        // ✅ FIX 27/02: Callback per vedere ordini attivi
  onSaveNote, 
  isOpen = true 
}) {
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
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [shouldShow, setShouldShow] = useState(true);

  // ✅ Hook SSR protection
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ FIX 21/01/2026: Controlla se dialog "Nuovo Ordine" è aperto
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    const checkDialogOpen = () => {
      const dialogTitle = document.querySelector('[role="dialog"] h2');
      const isNuovoOrdineOpen = dialogTitle && dialogTitle.textContent === 'Nuovo Ordine';
      
      if (isNuovoOrdineOpen) {
        setShouldShow(false);
      } else {
        setShouldShow(true);
      }
    };
    
    checkDialogOpen();
    const interval = setInterval(checkDialogOpen, 500);
    
    return () => clearInterval(interval);
  }, [mounted, chiamata]);

  // ✅ Timer auto-chiusura 45 secondi
  useEffect(() => {
    if (!mounted || !isOpen) return;
    
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
  }, [mounted, isOpen, onClose]);

  // ✅ FIX 27/02/2026: Reset stato quando cambia chiamata
  useEffect(() => {
    if (!mounted) return;
    
    console.log('📞 [CallPopup] Nuova chiamata ricevuta, reset stato');
    setOrdiniAttivi([]);
    setLoadingOrdini(false);
    setShowSalvaCliente(false);
    setNuovoCliente({ nome: '', cognome: '', telefono: '' });
  }, [chiamata?.callId, chiamata?.numero, mounted]);

  // ✅ FIX 27/02/2026: Carica ordini attivi con filtro data
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    if (!chiamata?.cliente?._id && !chiamata?.cliente?.id) return;
    
    caricaOrdiniAttivi();
  }, [chiamata?.cliente?._id, chiamata?.cliente?.id, mounted]);

  // ✅ FIX 28/02/2026: Query ordini e filtro per QUESTO cliente specifico
  const caricaOrdiniAttivi = async () => {
    if (typeof window === 'undefined') return;
    
    setLoadingOrdini(true);
    setOrdiniAttivi([]); // Reset prima di caricare
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[CallPopup] Token non trovato');
        return;
      }

      const clienteId = chiamata?.cliente?._id || chiamata?.cliente?.id;
      const clienteNome = (chiamata?.cliente?.nome || '').toLowerCase().trim();
      const clienteCognome = (chiamata?.cliente?.cognome || '').toLowerCase().trim();
      const clienteTelefono = (chiamata?.cliente?.telefono || chiamata?.cliente?.cellulare || chiamata?.numero || '').replace(/\D/g, '').slice(-10);
      
      if (!clienteId && !clienteTelefono) {
        console.warn('[CallPopup] Nessun identificativo cliente');
        return;
      }

      console.log('📦 [CallPopup] Carico ordini per cliente:', { clienteId, clienteNome, clienteCognome, clienteTelefono });

      const response = await fetch(
        `${API_URL}/ordini?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const oggiDate = new Date();
        oggiDate.setHours(0, 0, 0, 0);
        const tuttiOrdini = data.ordini || data.data || data || [];
        
        // ✅ FIX 28/02/2026: Filtra per QUESTO CLIENTE + data >= oggi + non completato
        const attivi = tuttiOrdini.filter(o => {
          // 1) Escludi annullati/completati/consegnati
          if (o.stato === 'completato' || o.stato === 'annullato' || o.stato === 'consegnato') {
            return false;
          }
          
          // 2) Solo ordini con data ritiro >= oggi
          if (o.dataRitiro) {
            const dataRitiro = new Date(o.dataRitiro);
            dataRitiro.setHours(0, 0, 0, 0);
            if (dataRitiro < oggiDate) return false;
          }
          
          // 3) ✅ CRITICO: Verifica che l'ordine sia DI QUESTO CLIENTE
          // Match per clienteId (ObjectId)
          const ordineClienteId = o.cliente?._id || o.cliente?.id || o.cliente;
          if (clienteId && ordineClienteId && String(ordineClienteId) === String(clienteId)) {
            return true;
          }
          
          // Match per telefono (ultime 10 cifre)
          if (clienteTelefono) {
            const ordineTelefono = (o.telefono || o.cliente?.telefono || '').replace(/\D/g, '').slice(-10);
            if (ordineTelefono && ordineTelefono === clienteTelefono) {
              return true;
            }
          }
          
          // Match per nome+cognome
          if (clienteNome && clienteCognome) {
            const ordineNome = (o.nomeCliente || `${o.cliente?.nome || ''} ${o.cliente?.cognome || ''}`).toLowerCase().trim();
            if (ordineNome.includes(clienteNome) && ordineNome.includes(clienteCognome)) {
              return true;
            }
          }
          
          return false; // Non è di questo cliente
        });

        // Ordina per data più vicina prima
        attivi.sort((a, b) => {
          const dateA = a.dataRitiro ? new Date(a.dataRitiro) : new Date('2099-12-31');
          const dateB = b.dataRitiro ? new Date(b.dataRitiro) : new Date('2099-12-31');
          return dateA - dateB;
        });

        console.log('📦 [CallPopup] Ordini attivi trovati:', attivi.length, 'su', tuttiOrdini.length, 'totali');
        setOrdiniAttivi(attivi.slice(0, 5)); // Max 5 ordini
      } else {
        console.warn('[CallPopup] Errore response ordini:', response.status);
      }
    } catch (error) {
      console.error('[CallPopup] Errore caricamento ordini:', error);
    } finally {
      setLoadingOrdini(false);
    }
  };

  // ✅ FIX 28/02/2026: AZIONE NUOVO ORDINE - senza useCallback per evitare stale refs
  const handleNuovoOrdine = () => {
    const cliente = chiamata?.cliente || null;
    const numero = chiamata?.numero || null;
    
    console.log('📝 [CallPopup] NUOVO ORDINE clicked');
    console.log('  - cliente:', cliente ? `${cliente.nome} ${cliente.cognome}` : 'sconosciuto');
    console.log('  - numero:', numero);
    console.log('  - onNuovoOrdine prop presente:', !!onNuovoOrdine);

    if (onNuovoOrdine) {
      // ✅ FIX: Usa la prop callback (flusso React pulito, no localStorage)
      console.log('✅ [CallPopup] Chiamo onNuovoOrdine via prop React');
      onNuovoOrdine(cliente, numero);
    } else {
      // ⚠️ Fallback: se prop non disponibile, usa localStorage (backward compat)
      console.warn('⚠️ [CallPopup] onNuovoOrdine prop non disponibile, fallback localStorage');
      
      if (typeof window !== 'undefined') {
        // Pulisci vecchi dati
        localStorage.removeItem('nuovoOrdine_clientePreselezionato');
        
        if (cliente && typeof cliente === 'object' && cliente._id) {
          localStorage.setItem('nuovoOrdine_clientePreselezionato', JSON.stringify({
            _id: cliente._id || cliente.id,
            nome: cliente.nome,
            cognome: cliente.cognome,
            telefono: cliente.telefono || cliente.cellulare || numero,
            email: cliente.email,
            codiceCliente: cliente.codiceCliente
          }));
        } else if (numero) {
          const numeroSenzaPrefisso = numero.replace(/^\+39/, '');
          localStorage.setItem('nuovoOrdine_clientePreselezionato', JSON.stringify({
            _id: null,
            nome: '',
            cognome: '',
            telefono: numeroSenzaPrefisso,
            email: '',
            codiceCliente: null
          }));
        }
        
        onClose();
        
        if (window.location.pathname === '/ordini') {
          window.dispatchEvent(new CustomEvent('open-nuovo-ordine'));
        } else {
          localStorage.setItem('_openNuovoOrdineOnLoad', 'true');
          window.location.href = '/ordini';
        }
      }
    }
  };

  // ✅ FIX 28/02/2026: VEDI ORDINI ATTIVI - cerca per telefono (più preciso)
  const handleVediOrdiniAttivi = () => {
    const cognome = chiamata?.cliente?.cognome || chiamata?.cliente?.nome || '';
    const telefono = chiamata?.cliente?.telefono || chiamata?.cliente?.cellulare || chiamata?.numero || '';
    // Pulisci prefisso +39 per matching
    const telefonoPulito = telefono.replace(/^\+39/, '');
    
    console.log('📦 [CallPopup] Vedi ordini attivi per:', cognome, telefonoPulito);
    
    if (onVediOrdini) {
      onVediOrdini(cognome, telefonoPulito);
    } else {
      // Fallback: redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/ordini?tab=lista';
      }
    }
    
    onClose();
  };

  // ✅ AZIONE 3: SALVA CLIENTE - MOSTRA FORM
  const handleMostraSalvaCliente = () => {
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
        
        if (chiamata && clienteCreato.cliente) {
          chiamata.cliente = clienteCreato.cliente;
        }
        
        alert(`✅ Cliente "${nuovoCliente.nome} ${nuovoCliente.cognome}" salvato!`);
        setShowSalvaCliente(false);
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

  // ✅ FIX 27/02/2026: Helper per formattare ordine nel popup
  const formatOrdinePreview = (ordine) => {
    try {
      const dataRitiro = ordine.dataRitiro ? format(new Date(ordine.dataRitiro), 'EEE dd/MM', { locale: it }) : '?';
      const oraRitiro = ordine.oraRitiro || '';
      
      // Composizione prodotti
      const prodotti = (ordine.prodotti || []).map(p => {
        const nome = p.nome || p.prodotto || '?';
        const qta = p.quantita || p.quantitaKg || '';
        const unita = p.unitaMisura || 'Kg';
        return `${nome} ${qta}${unita}`;
      }).join(', ');
      
      return {
        data: `${dataRitiro} ${oraRitiro}`.trim(),
        prodotti: prodotti || 'dettagli non disponibili'
      };
    } catch (e) {
      return { data: '?', prodotti: 'errore formattazione' };
    }
  };

  // ✅ RETURN CONDIZIONALE DOPO TUTTI GLI HOOKS
  if (!chiamata || !mounted || !isOpen || !shouldShow) {
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
          {/* Timer countdown */}
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

            {/* ✅ FIX 27/02/2026: Ordini Attivi con DETTAGLIO */}
            <Box mb={2}>
              {loadingOrdini ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Caricamento ordini...
                  </Typography>
                </Box>
              ) : ordiniAttivi.length > 0 ? (
                <Box>
                  <Alert 
                    severity="info" 
                    icon={<ShoppingCartIcon />}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      📦 {ordiniAttivi.length} ordine{ordiniAttivi.length !== 1 ? 'i' : ''} attivo{ordiniAttivi.length !== 1 ? 'i' : ''}
                    </Typography>
                  </Alert>
                  
                  {/* ✅ FIX 27/02/2026: Dettaglio ordini inline */}
                  <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1, py: 0 }}>
                    {ordiniAttivi.map((ordine, idx) => {
                      const preview = formatOrdinePreview(ordine);
                      return (
                        <ListItem key={ordine._id || idx} sx={{ py: 0.5, px: 1.5 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight="bold">
                                📅 {preview.data}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {preview.prodotti}
                              </Typography>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
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