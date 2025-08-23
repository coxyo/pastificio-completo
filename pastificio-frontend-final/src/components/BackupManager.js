// components/BackupManager.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Divider,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

export default function BackupManager() {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState({ local: [], drive: [] });
  const [selectedTab, setSelectedTab] = useState(0);
  const [restoreDialog, setRestoreDialog] = useState({ open: false, backup: null });
  const [lastBackup, setLastBackup] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

  useEffect(() => {
    loadBackups();
    checkLastBackup();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/backup/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackups(data.data || { local: [], drive: [] });
      } else {
        throw new Error('Errore caricamento backup');
      }
    } catch (error) {
      console.error('Errore:', error);
      showAlert('Errore nel caricamento dei backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkLastBackup = () => {
    const lastBackupTime = localStorage.getItem('lastBackupTime');
    if (lastBackupTime) {
      setLastBackup(new Date(lastBackupTime));
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setBackupStatus('creating');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/backup/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const now = new Date();
        setLastBackup(now);
        localStorage.setItem('lastBackupTime', now.toISOString());
        
        showAlert(
          `Backup creato con successo! ${data.data?.driveUploaded ? '☁️ Caricato su Google Drive' : '💾 Solo locale'}`,
          'success'
        );
        
        await loadBackups();
        setBackupStatus('success');
        setTimeout(() => setBackupStatus(null), 3000);
      } else {
        throw new Error('Errore creazione backup');
      }
    } catch (error) {
      console.error('Errore:', error);
      showAlert('Errore nella creazione del backup', 'error');
      setBackupStatus('error');
      setTimeout(() => setBackupStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async () => {
    if (!restoreDialog.backup) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/backup/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: restoreDialog.backup.name,
          fromDrive: restoreDialog.backup.location === 'drive'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        showAlert(
          `Backup ripristinato! Ordini: ${data.data?.stats?.ordini || 0}, Clienti: ${data.data?.stats?.clienti || 0}`,
          'success'
        );
        setRestoreDialog({ open: false, backup: null });
      } else {
        throw new Error('Errore ripristino backup');
      }
    } catch (error) {
      console.error('Errore:', error);
      showAlert('Errore nel ripristino del backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity) => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT') + ' ' + date.toLocaleTimeString('it-IT');
  };

  const currentBackups = selectedTab === 0 ? backups.local : backups.drive;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Gestione Backup
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadBackups}
              disabled={loading}
            >
              Aggiorna
            </Button>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={createBackup}
              disabled={loading}
              color={backupStatus === 'success' ? 'success' : backupStatus === 'error' ? 'error' : 'primary'}
            >
              {loading && backupStatus === 'creating' ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Creazione...
                </>
              ) : (
                'Crea Backup'
              )}
            </Button>
          </Box>
        </Box>

        {/* Status Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" gutterBottom>
                    Ultimo Backup
                  </Typography>
                </Box>
                <Typography variant="h6">
                  {lastBackup ? formatDate(lastBackup) : 'Mai eseguito'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StorageIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" gutterBottom>
                    Backup Locali
                  </Typography>
                </Box>
                <Typography variant="h6">
                  {backups.local.length} file
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CloudIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" gutterBottom>
                    Backup su Drive
                  </Typography>
                </Box>
                <Typography variant="h6">
                  {backups.drive.length} file
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {alert.show && (
          <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert({ show: false })}>
            {alert.message}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} sx={{ mb: 2 }}>
          <Tab label="Backup Locali" icon={<StorageIcon />} iconPosition="start" />
          <Tab label="Google Drive" icon={<CloudIcon />} iconPosition="start" />
        </Tabs>

        {/* Backup List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : currentBackups.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="textSecondary">
              Nessun backup {selectedTab === 0 ? 'locale' : 'su Google Drive'}
            </Typography>
          </Box>
        ) : (
          <List>
            {currentBackups.map((backup, index) => (
              <React.Fragment key={backup.name || index}>
                <ListItem>
                  <ListItemText
                    primary={backup.name}
                    secondary={`${formatDate(backup.createdAt || backup.createdTime)} • ${formatFileSize(backup.size)}`}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Ripristina">
                      <IconButton
                        edge="end"
                        onClick={() => setRestoreDialog({ open: true, backup })}
                        color="primary"
                      >
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < currentBackups.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Restore Dialog */}
      <Dialog open={restoreDialog.open} onClose={() => setRestoreDialog({ open: false, backup: null })}>
        <DialogTitle>Conferma Ripristino</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler ripristinare il backup?
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>
            {restoreDialog.backup?.name}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Questa azione sovrascriverà tutti i dati attuali!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog({ open: false, backup: null })}>
            Annulla
          </Button>
          <Button onClick={restoreBackup} variant="contained" color="warning" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Ripristina'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}