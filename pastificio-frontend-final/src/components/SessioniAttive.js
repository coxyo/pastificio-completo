// src/components/SessioniAttive.js - ✅ NUOVO: Visualizzazione sessioni e logout remoto
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Computer as PCIcon,
  TabletMac as TabletIcon,
  PhoneIphone as MobileIcon,
  DeviceUnknown as UnknownIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  LogoutOutlined as LogoutAllIcon,
  Circle as CircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

// ═══════════════════════════════════════
// ICONE E COLORI
// ═══════════════════════════════════════
const deviceIcons = {
  PC: <PCIcon />,
  Tablet: <TabletIcon />,
  Mobile: <MobileIcon />,
  Sconosciuto: <UnknownIcon />
};

const statusConfig = {
  attivo: { color: '#16a34a', bg: '#dcfce7', label: 'Attivo ora', icon: '🟢' },
  inattivo: { color: '#ca8a04', bg: '#fef9c3', label: 'Inattivo', icon: '🟡' },
  scaduto: { color: '#dc2626', bg: '#fee2e2', label: 'Scaduto', icon: '🔴' },
  disconnesso: { color: '#374151', bg: '#f3f4f6', label: 'Disconnesso', icon: '⚫' }
};

// ═══════════════════════════════════════
// HELPER: Formattazione tempo relativo
// ═══════════════════════════════════════
function tempoRelativo(dateStr) {
  if (!dateStr) return 'N/D';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffOre = Math.floor(diffMin / 60);
  const diffGiorni = Math.floor(diffOre / 24);

  if (diffSec < 60) return 'adesso';
  if (diffMin < 60) return `${diffMin} min fa`;
  if (diffOre < 24) return `${diffOre} or${diffOre === 1 ? 'a' : 'e'} fa`;
  if (diffGiorni === 1) return 'ieri';
  return `${diffGiorni} giorni fa`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/D';
  const d = new Date(dateStr);
  const oggi = new Date();
  const isOggi = d.toDateString() === oggi.toDateString();
  const ieri = new Date(oggi);
  ieri.setDate(ieri.getDate() - 1);
  const isIeri = d.toDateString() === ieri.toDateString();

  const ora = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  
  if (isOggi) return `Oggi ${ora}`;
  if (isIeri) return `Ieri ${ora}`;
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) + ` ${ora}`;
}

// ═══════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════
export default function SessioniAttive() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, session: null, type: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const intervalRef = useRef(null);

  // ═══════════════════════════════════════
  // FETCH SESSIONI
  // ═══════════════════════════════════════
  const fetchSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Errore nel recupero sessioni');
      }

      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
        setError(null);
      }
    } catch (err) {
      console.error('[SESSIONI] Errore fetch:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica sessioni inizialmente e poi ogni 30 secondi
  useEffect(() => {
    fetchSessions();
    intervalRef.current = setInterval(fetchSessions, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchSessions]);

  // ═══════════════════════════════════════
  // DISCONNETTI SESSIONE SINGOLA
  // ═══════════════════════════════════════
  const handleDisconnetti = async (session) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/sessions/${session._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Sessione di ${session.username} disconnessa`);
        setSnackbar({ open: true, message: data.message, severity: 'success' });
        fetchSessions();
      } else {
        toast.error(data.message || 'Errore nella disconnessione');
      }
    } catch (err) {
      console.error('[SESSIONI] Errore disconnessione:', err);
      toast.error('Errore nella disconnessione');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, session: null, type: null });
    }
  };

  // ═══════════════════════════════════════
  // DISCONNETTI TUTTE LE ALTRE
  // ═══════════════════════════════════════
  const handleDisconnettiTutte = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/sessions/all/other`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setSnackbar({ open: true, message: data.message, severity: 'success' });
        fetchSessions();
      } else {
        toast.error(data.message || 'Errore');
      }
    } catch (err) {
      console.error('[SESSIONI] Errore disconnessione multipla:', err);
      toast.error('Errore nella disconnessione multipla');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, session: null, type: null });
    }
  };

  // ═══════════════════════════════════════
  // CONFERMA E AZIONI
  // ═══════════════════════════════════════
  const openConfirmSingle = (session) => {
    setConfirmDialog({ open: true, session, type: 'single' });
  };

  const openConfirmAll = () => {
    setConfirmDialog({ open: true, session: null, type: 'all' });
  };

  const handleConfirm = () => {
    if (confirmDialog.type === 'single' && confirmDialog.session) {
      handleDisconnetti(confirmDialog.session);
    } else if (confirmDialog.type === 'all') {
      handleDisconnettiTutte();
    }
  };

  // ═══════════════════════════════════════
  // CONTEGGI
  // ═══════════════════════════════════════
  const sessioniAttive = sessions.filter(s => s.stato === 'attiva');
  const altreSessioniAttive = sessioniAttive.filter(s => !s.isCurrentSession);

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            🔐 Sessioni Attive
          </Typography>
          <Chip
            label={`${sessioniAttive.length} attiv${sessioniAttive.length === 1 ? 'a' : 'e'}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Aggiorna">
            <IconButton onClick={fetchSessions} color="primary" size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          {altreSessioniAttive.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<LogoutAllIcon />}
              onClick={openConfirmAll}
              sx={{ textTransform: 'none', fontSize: '13px' }}
            >
              Disconnetti tutte le altre ({altreSessioniAttive.length})
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* LEGENDA */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: '12px' }}>{cfg.icon}</Typography>
            <Typography sx={{ fontSize: '12px', color: '#666' }}>{cfg.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* LISTA SESSIONI */}
      {sessions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Nessuna sessione trovata</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sessions.map((session) => {
            const status = statusConfig[session.statoVisuale] || statusConfig.disconnesso;
            const isActive = session.stato === 'attiva';

            return (
              <Paper
                key={session._id}
                elevation={session.isCurrentSession ? 3 : 1}
                sx={{
                  p: 2,
                  border: session.isCurrentSession ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  borderRadius: 2,
                  opacity: isActive ? 1 : 0.6,
                  position: 'relative',
                  transition: 'all 0.2s',
                  '&:hover': isActive ? { boxShadow: 3 } : {}
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                  {/* INFO SESSIONE */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
                    {/* Icona dispositivo */}
                    <Box sx={{ 
                      color: status.color, 
                      mt: 0.5,
                      '& .MuiSvgIcon-root': { fontSize: 28 }
                    }}>
                      {deviceIcons[session.dispositivo] || deviceIcons.Sconosciuto}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Nome utente + stato */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '15px' }}>
                          {session.username}
                        </Typography>
                        
                        <Chip
                          icon={<CircleIcon sx={{ fontSize: '10px !important', color: `${status.color} !important` }} />}
                          label={status.label}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '11px',
                            backgroundColor: status.bg,
                            color: status.color,
                            fontWeight: 600,
                            '& .MuiChip-icon': { ml: '4px' }
                          }}
                        />

                        {session.isCurrentSession && (
                          <Chip
                            label="Questa sessione"
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '11px',
                              backgroundColor: '#dbeafe',
                              color: '#2563eb',
                              fontWeight: 600
                            }}
                          />
                        )}
                      </Box>

                      {/* Dettagli */}
                      <Typography variant="body2" sx={{ color: '#666', mt: 0.5, fontSize: '13px' }}>
                        {session.dispositivo === 'PC' ? '💻' : session.dispositivo === 'Tablet' ? '📱' : session.dispositivo === 'Mobile' ? '📱' : '❓'}
                        {' '}{session.dispositivo} - {session.browser}
                        {session.ip && (
                          <span style={{ marginLeft: 8, color: '#999', fontSize: '12px' }}>
                            IP: {session.ip}
                          </span>
                        )}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ color: '#999', fontSize: '12px', mt: 0.3 }}>
                        Login: {formatDate(session.loginAt)}
                        {' | '}
                        Ultima attività: {tempoRelativo(session.ultimaAttivita)}
                      </Typography>

                      {/* Info disconnessione */}
                      {session.stato === 'disconnessa' && session.disconnessoDa && (
                        <Typography variant="body2" sx={{ color: '#dc2626', fontSize: '12px', mt: 0.3, fontStyle: 'italic' }}>
                          Disconnessa da: {session.disconnessoDa} ({formatDate(session.disconnessoAt)})
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* AZIONE DISCONNETTI */}
                  {isActive && !session.isCurrentSession && (
                    <Tooltip title={`Disconnetti ${session.username}`}>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<LogoutIcon />}
                        onClick={() => openConfirmSingle(session)}
                        sx={{ 
                          textTransform: 'none', 
                          fontSize: '12px',
                          minWidth: 'auto',
                          whiteSpace: 'nowrap',
                          // Su mobile, mostra solo icona
                          '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }
                        }}
                      >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                          Disconnetti
                        </Box>
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* INFO */}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <InfoIcon sx={{ fontSize: 16, color: '#999', mt: 0.2 }} />
        <Typography variant="body2" sx={{ color: '#999', fontSize: '12px' }}>
          Le sessioni scadono automaticamente dopo 12 ore di inattività. 
          Un utente disconnesso vedrà un messaggio al prossimo utilizzo e dovrà rifare il login.
          L'elenco si aggiorna automaticamente ogni 30 secondi.
        </Typography>
      </Box>

      {/* DIALOG CONFERMA */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => !actionLoading && setConfirmDialog({ open: false, session: null, type: null })}
      >
        <DialogTitle>
          {confirmDialog.type === 'all' ? '⚠️ Disconnetti tutte le sessioni?' : '🚪 Conferma disconnessione'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.type === 'all' ? (
              <>
                Sei sicuro di voler disconnettere <strong>tutte le altre sessioni</strong>?
                <br /><br />
                Tutti gli altri utenti (e i tuoi altri dispositivi) dovranno rifare il login.
                La tua sessione corrente non verrà toccata.
              </>
            ) : (
              <>
                Sei sicuro di voler disconnettere <strong>{confirmDialog.session?.username}</strong>?
                <br /><br />
                Dispositivo: {confirmDialog.session?.dispositivo} - {confirmDialog.session?.browser}
                <br />
                Al prossimo utilizzo, vedrà il messaggio: <em>"Sessione terminata da un amministratore"</em> e dovrà rifare il login.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, session: null, type: null })}
            disabled={actionLoading}
          >
            Annulla
          </Button>
          <Button 
            onClick={handleConfirm}
            color="error"
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <LogoutIcon />}
          >
            {actionLoading ? 'Disconnessione...' : 'Disconnetti'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}