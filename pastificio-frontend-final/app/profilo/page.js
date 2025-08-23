'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Box, Paper, Typography, Grid, TextField,
  Button, Avatar, Divider, Alert, Tab, Tabs
} from '@mui/material';
import { 
  Save, Edit, Lock, AccountCircle, Email, 
  Phone, Badge, CalendarMonth 
} from '@mui/icons-material';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProfiloPage() {
  const [tab, setTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    nome: '',
    cognome: '',
    telefono: '',
    ruolo: '',
    dataCreazione: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Carica dati utente dal localStorage o API
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData({
      username: user.username || 'admin',
      email: user.email || 'admin@pastificio.it',
      nome: user.nome || 'Mario',
      cognome: user.cognome || 'Rossi',
      telefono: user.telefono || '+39 123 456 7890',
      ruolo: user.ruolo || 'Amministratore',
      dataCreazione: user.dataCreazione || '01/01/2024'
    });
  }, []);

  const handleSaveProfile = () => {
    // Salva le modifiche
    localStorage.setItem('user', JSON.stringify(userData));
    setEditMode(false);
    setSuccessMessage('Profilo aggiornato con successo!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Le password non coincidono!');
      return;
    }
    // Logica per cambiare password
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setSuccessMessage('Password aggiornata con successo!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1">
          Profilo Utente
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            <Tab label="Informazioni Personali" />
            <Tab label="Sicurezza" />
          </Tabs>
        </Box>

        <TabPanel value={tab} index={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{ width: 100, height: 100, mr: 3 }}
            >
              {userData.nome.charAt(0)}{userData.cognome.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5">
                {userData.nome} {userData.cognome}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userData.ruolo} • Membro dal {userData.dataCreazione}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome"
                value={userData.nome}
                onChange={(e) => setUserData({ ...userData, nome: e.target.value })}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <AccountCircle sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cognome"
                value={userData.cognome}
                onChange={(e) => setUserData({ ...userData, cognome: e.target.value })}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                value={userData.username}
                disabled
                InputProps={{
                  startAdornment: <Badge sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefono"
                value={userData.telefono}
                onChange={(e) => setUserData({ ...userData, telefono: e.target.value })}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ruolo"
                value={userData.ruolo}
                disabled
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setEditMode(true)}
              >
                Modifica
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(false)}
                >
                  Annulla
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                >
                  Salva
                </Button>
              </>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Typography variant="h6" gutterBottom>
            Cambia Password
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Password Attuale"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Nuova Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Conferma Nuova Password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleChangePassword}
              disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              Aggiorna Password
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
}