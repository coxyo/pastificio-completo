// src/components/GestioneUtenti.js - ✅ COMPLETO: Pannello Admin Gestione Utenti
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Alert, Tooltip, CircularProgress, Divider, Switch,
  FormControlLabel, Snackbar
} from '@mui/material';
import {
  PersonAdd, Edit, LockReset, Block, CheckCircle, Lock, LockOpen,
  Logout as LogoutIcon, ContentCopy, Refresh, AdminPanelSettings,
  Visibility, VisibilityOff
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

// ✅ Colori e label per ruoli
const roleConfig = {
  admin: { color: '#dc2626', bg: '#fee2e2', label: '👑 Admin' },
  operatore: { color: '#2563eb', bg: '#dbeafe', label: '👷 Operatore' },
  visualizzatore: { color: '#6b7280', bg: '#f3f4f6', label: '👁️ Visualizzatore' }
};

export default function GestioneUtenti() {
  const { user, token, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog stati
  const [dialogNuovo, setDialogNuovo] = useState(false);
  const [dialogModifica, setDialogModifica] = useState(null);
  const [dialogResetPwd, setDialogResetPwd] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  
  // Form nuovo utente
  const [formNuovo, setFormNuovo] = useState({
    nome: '', username: '', email: '', password: '', role: 'operatore', telefono: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ✅ Carica utenti
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || 'Errore nel caricamento utenti');
      }
    } catch (e) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadUsers();
  }, [token, loadUsers]);

  // ✅ Controllo accesso
  if (!isAdmin()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Non hai i permessi per accedere a questa sezione. Solo gli amministratori possono gestire gli utenti.
        </Alert>
      </Box>
    );
  }

  // ✅ Crea nuovo utente
  const handleCrea = async () => {
    setFormErrors({});
    
    // Validazione
    const errors = {};
    if (!formNuovo.nome.trim()) errors.nome = 'Nome richiesto';
    if (!formNuovo.username.trim()) errors.username = 'Username richiesto';
    if (!formNuovo.email.trim()) errors.email = 'Email richiesta';
    if (!formNuovo.password) errors.password = 'Password richiesta';
    if (formNuovo.password && (formNuovo.password.length < 8 || !/\d/.test(formNuovo.password))) {
      errors.password = 'Minimo 8 caratteri con almeno un numero';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formNuovo)
      });
      const data = await res.json();
      
      if (data.success) {
        setDialogNuovo(false);
        setFormNuovo({ nome: '', username: '', email: '', password: '', role: 'operatore', telefono: '' });
        setSnackbar({ open: true, message: `✅ Utente ${formNuovo.nome} creato con successo`, severity: 'success' });
        loadUsers();
      } else {
        setFormErrors({ general: data.message });
      }
    } catch (e) {
      setFormErrors({ general: 'Errore di connessione' });
    }
  };

  // ✅ Modifica utente
  const handleModifica = async () => {
    if (!dialogModifica) return;
    
    try {
      const res = await fetch(`${API_URL}/users/${dialogModifica.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: dialogModifica.nome,
          role: dialogModifica.role,
          telefono: dialogModifica.telefono
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setDialogModifica(null);
        setSnackbar({ open: true, message: '✅ Utente aggiornato', severity: 'success' });
        loadUsers();
      } else {
        setSnackbar({ open: true, message: data.message, severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Errore di connessione', severity: 'error' });
    }
  };

  // ✅ Reset password
  const handleResetPassword = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setTempPassword(data.tempPassword);
        setDialogResetPwd(userId);
      } else {
        setSnackbar({ open: true, message: data.message, severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Errore di connessione', severity: 'error' });
    }
  };

  // ✅ Attiva/Disattiva utente
  const handleToggleActive = async (userId, currentActive) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentActive })
      });
      const data = await res.json();
      
      if (data.success) {
        setSnackbar({ 
          open: true, 
          message: `✅ Account ${!currentActive ? 'attivato' : 'disattivato'}`, 
          severity: 'success' 
        });
        loadUsers();
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Errore', severity: 'error' });
    }
  };

  // ✅ Sblocca account
  const handleUnlock = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/unlock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setSnackbar({ open: true, message: '✅ Account sbloccato', severity: 'success' });
        loadUsers();
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Errore', severity: 'error' });
    }
  };

  // ✅ Logout forzato
  const handleForceLogout = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/force-logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setSnackbar({ open: true, message: '✅ Sessioni terminate', severity: 'success' });
        loadUsers();
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Errore', severity: 'error' });
    }
  };

  // Formatta data
  const formatDate = (date) => {
    if (!date) return 'Mai';
    return new Date(date).toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1200 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            <AdminPanelSettings sx={{ mr: 1, verticalAlign: 'middle' }} />
            Gestione Utenti
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {users.length} utenti registrati
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={loadUsers} startIcon={<Refresh />}>
            Aggiorna
          </Button>
          <Button variant="contained" onClick={() => setDialogNuovo(true)} startIcon={<PersonAdd />}>
            Nuovo Utente
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ✅ Tabella Utenti */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Utente</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ruolo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Stato</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ultimo Accesso</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => {
              const rc = roleConfig[u.role] || roleConfig.operatore;
              const isSelf = u.id === user?.id;
              
              return (
                <TableRow key={u.id} sx={{ 
                  opacity: u.isActive ? 1 : 0.5,
                  backgroundColor: isSelf ? '#fffbeb' : 'inherit'
                }}>
                  {/* Utente */}
                  <TableCell>
                    <Box>
                      <Typography fontWeight="bold" fontSize="14px">
                        {u.nome} {isSelf && <Chip label="TU" size="small" sx={{ ml: 1, height: 18, fontSize: 10 }} />}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontSize="12px">
                        @{u.username} • {u.email}
                      </Typography>
                      {u.telefono && (
                        <Typography variant="body2" color="text.secondary" fontSize="11px">
                          📞 {u.telefono}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* Ruolo */}
                  <TableCell>
                    <Chip
                      label={rc.label}
                      size="small"
                      sx={{
                        backgroundColor: rc.bg,
                        color: rc.color,
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                    />
                  </TableCell>

                  {/* Stato */}
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip
                        icon={u.isActive ? <CheckCircle /> : <Block />}
                        label={u.isActive ? 'Attivo' : 'Disattivato'}
                        size="small"
                        color={u.isActive ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ fontSize: '11px' }}
                      />
                      {u.isLocked && (
                        <Chip
                          icon={<Lock />}
                          label="Bloccato"
                          size="small"
                          color="warning"
                          sx={{ fontSize: '11px' }}
                        />
                      )}
                      {u.passwordTemporanea && (
                        <Chip
                          label="Pwd temp."
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ fontSize: '10px' }}
                        />
                      )}
                    </Box>
                  </TableCell>

                  {/* Ultimo Accesso */}
                  <TableCell>
                    <Typography variant="body2" fontSize="12px">
                      {formatDate(u.lastLogin)}
                    </Typography>
                  </TableCell>

                  {/* Azioni */}
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Tooltip title="Modifica">
                        <IconButton size="small" onClick={() => setDialogModifica({...u})}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Reset Password">
                        <IconButton size="small" onClick={() => handleResetPassword(u.id)}>
                          <LockReset fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {u.isLocked && (
                        <Tooltip title="Sblocca Account">
                          <IconButton size="small" color="warning" onClick={() => handleUnlock(u.id)}>
                            <LockOpen fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {!isSelf && (
                        <>
                          <Tooltip title={u.isActive ? 'Disattiva' : 'Attiva'}>
                            <IconButton 
                              size="small" 
                              color={u.isActive ? 'error' : 'success'}
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                            >
                              {u.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Termina Sessioni">
                            <IconButton size="small" onClick={() => handleForceLogout(u.id)}>
                              <LogoutIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ═══════════════════════════════════════ */}
      {/* DIALOG: Nuovo Utente */}
      {/* ═══════════════════════════════════════ */}
      <Dialog open={dialogNuovo} onClose={() => setDialogNuovo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <PersonAdd sx={{ mr: 1, verticalAlign: 'middle' }} />
          Nuovo Utente
        </DialogTitle>
        <DialogContent>
          {formErrors.general && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formErrors.general}</Alert>
          )}
          
          <TextField
            label="Nome" fullWidth margin="dense" required
            value={formNuovo.nome}
            onChange={(e) => setFormNuovo({...formNuovo, nome: e.target.value})}
            error={!!formErrors.nome} helperText={formErrors.nome}
          />
          <TextField
            label="Username" fullWidth margin="dense" required
            value={formNuovo.username}
            onChange={(e) => setFormNuovo({...formNuovo, username: e.target.value.toLowerCase()})}
            error={!!formErrors.username} helperText={formErrors.username}
          />
          <TextField
            label="Email" fullWidth margin="dense" required type="email"
            value={formNuovo.email}
            onChange={(e) => setFormNuovo({...formNuovo, email: e.target.value})}
            error={!!formErrors.email} helperText={formErrors.email}
          />
          <TextField
            label="Password" fullWidth margin="dense" required
            type={showPassword ? 'text' : 'password'}
            value={formNuovo.password}
            onChange={(e) => setFormNuovo({...formNuovo, password: e.target.value})}
            error={!!formErrors.password} 
            helperText={formErrors.password || 'Minimo 8 caratteri con almeno un numero'}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
          <TextField
            label="Telefono" fullWidth margin="dense"
            value={formNuovo.telefono}
            onChange={(e) => setFormNuovo({...formNuovo, telefono: e.target.value})}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Ruolo</InputLabel>
            <Select
              value={formNuovo.role}
              label="Ruolo"
              onChange={(e) => setFormNuovo({...formNuovo, role: e.target.value})}
            >
              <MenuItem value="admin">👑 Admin - Accesso completo</MenuItem>
              <MenuItem value="operatore">👷 Operatore - Uso quotidiano</MenuItem>
              <MenuItem value="visualizzatore">👁️ Visualizzatore - Solo lettura</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogNuovo(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleCrea}>Crea Utente</Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════ */}
      {/* DIALOG: Modifica Utente */}
      {/* ═══════════════════════════════════════ */}
      <Dialog open={!!dialogModifica} onClose={() => setDialogModifica(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Edit sx={{ mr: 1, verticalAlign: 'middle' }} />
          Modifica Utente: {dialogModifica?.nome}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Nome" fullWidth margin="dense"
            value={dialogModifica?.nome || ''}
            onChange={(e) => setDialogModifica({...dialogModifica, nome: e.target.value})}
          />
          <TextField
            label="Telefono" fullWidth margin="dense"
            value={dialogModifica?.telefono || ''}
            onChange={(e) => setDialogModifica({...dialogModifica, telefono: e.target.value})}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Ruolo</InputLabel>
            <Select
              value={dialogModifica?.role || 'operatore'}
              label="Ruolo"
              onChange={(e) => setDialogModifica({...dialogModifica, role: e.target.value})}
              disabled={dialogModifica?.id === user?.id}
            >
              <MenuItem value="admin">👑 Admin</MenuItem>
              <MenuItem value="operatore">👷 Operatore</MenuItem>
              <MenuItem value="visualizzatore">👁️ Visualizzatore</MenuItem>
            </Select>
          </FormControl>
          {dialogModifica?.id === user?.id && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Non puoi modificare il tuo stesso ruolo
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogModifica(null)}>Annulla</Button>
          <Button variant="contained" onClick={handleModifica}>Salva</Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════ */}
      {/* DIALOG: Password Temporanea */}
      {/* ═══════════════════════════════════════ */}
      <Dialog open={!!dialogResetPwd} onClose={() => setDialogResetPwd(null)} maxWidth="sm">
        <DialogTitle>🔐 Password Resettata</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            La password è stata resettata con successo.
          </Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Comunica questa password temporanea all'utente:
          </Typography>
          <Paper sx={{ 
            p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#f0fdf4', border: '2px solid #22c55e'
          }}>
            <Typography variant="h6" fontFamily="monospace" fontWeight="bold">
              {tempPassword}
            </Typography>
            <Tooltip title="Copia">
              <IconButton onClick={() => {
                navigator.clipboard.writeText(tempPassword);
                setSnackbar({ open: true, message: '📋 Password copiata!', severity: 'info' });
              }}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </Paper>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            L'utente dovrà cambiare questa password al prossimo accesso.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setDialogResetPwd(null)}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({...snackbar, open: false})}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}