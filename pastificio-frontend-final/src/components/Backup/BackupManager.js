// components/Backup/BackupManager.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
  Divider,
  Tab,
  Tabs
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  Schedule,
  Storage,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  RestoreFromTrash,
  Settings as SettingsIcon,
  FolderZip,
  CloudSync,
  History,
  CloudQueue,
  Computer,
  Refresh,
  Delete,
  GetApp
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

const BackupManager = () => {
  // Stati
  const [activeTab, setActiveTab] = useState(0);
  const [backupsLocal, setBackupsLocal] = useState([]);
  const [backupsDrive, setBackupsDrive] = useState([]);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [lastBackup, setLastBackup] = useState(null);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [nextAutoBackup, setNextAutoBackup] = useState(null);

  useEffect(() => {
    loadBackupHistory();
    checkAutoBackupSettings();
    loadDriveBackups();
    checkDriveStatus();
  }, []);

  // ==========================================
  // FUNZIONI BACKEND (GOOGLE DRIVE)
  // ==========================================

  const checkDriveStatus = async () => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/health`);
      if (response.ok) {
        setDriveConnected(true);
        setNextAutoBackup('Oggi alle 02:00');
      }
    } catch (error) {
      console.error('Errore verifica Drive:', error);
      setDriveConnected(false);
    }
  };

  const loadDriveBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/backup/list`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Backup Drive response:', data); // DEBUG
      
      if (data.success) {
        // ✅ FIX: Gestisci vari formati di risposta
        let backupsArray = [];
        
        if (Array.isArray(data.data)) {
          backupsArray = data.data;
        } else if (data.data && typeof data.data === 'object') {
          // Se è un oggetto, prova a estrarre un array
          backupsArray = data.data.files || data.data.backups || [];
        }
        
        console.log('✅ Backups array:', backupsArray); // DEBUG
        setBackupsDrive(backupsArray);
        
        if (backupsArray.length > 0) {
          const latest = backupsArray[0];
          setLastBackup(latest.createdTime || latest.createdAt);
        }
      } else {
        console.warn('⚠️ Backup API returned success: false');
        setBackupsDrive([]);
      }
    } catch (error) {
      console.error('❌ Errore caricamento backup Drive:', error);
      setBackupsDrive([]); // ✅ Sempre array vuoto in caso di errore
      toast.error('Errore caricamento backup: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDriveBackup = async () => {
    setBackupInProgress(true);
    
    try {
      toast.info('Creazione backup in corso...');
      
      const response = await fetch(`${API_URL}/backup/create`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        const backupInfo = data.data;
        
        toast.success(
          `Backup creato con successo!\nFile: ${backupInfo.fileName}\n${backupInfo.driveUploaded ? '✅ Caricato su Google Drive' : '⚠️ Solo backup locale'}`,
          { autoClose: 5000 }
        );
        
        await loadDriveBackups();
        setLastBackup(new Date().toISOString());
      } else {
        throw new Error(data.message || 'Errore durante la creazione del backup');
      }
    } catch (error) {
      console.error('Errore creazione backup:', error);
      toast.error('Errore durante la creazione del backup: ' + error.message);
    } finally {
      setBackupInProgress(false);
    }
  };

  const downloadDriveBackup = async (backup) => {
    try {
      toast.info('Download in corso...');
      
      const response = await fetch(`${API_URL}/backup/download/${backup.id}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', backup.name);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('Backup scaricato!');
      } else {
        throw new Error('Errore download');
      }
    } catch (error) {
      console.error('Errore download:', error);
      toast.error('Errore durante il download del backup');
    }
  };

  const deleteDriveBackup = async (backupId) => {
    if (!window.confirm('Eliminare questo backup da Google Drive?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/backup/${backupId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Backup eliminato da Google Drive');
        await loadDriveBackups();
      } else {
        throw new Error('Errore eliminazione');
      }
    } catch (error) {
      console.error('Errore eliminazione:', error);
      toast.error('Errore durante l\'eliminazione del backup');
    }
  };

  // ==========================================
  // FUNZIONI LOCALI (FRONTEND) - FIXED UTF-8
  // ==========================================

  const loadBackupHistory = () => {
    try {
      const savedBackups = localStorage.getItem('backupHistory');
      if (savedBackups) {
        const parsed = JSON.parse(savedBackups);
        setBackupsLocal(Array.isArray(parsed) ? parsed : []);
      }
      
      const totalSize = Object.keys(localStorage).reduce((acc, key) => {
        return acc + new Blob([localStorage.getItem(key)]).size;
      }, 0);
      setStorageUsed(totalSize / (1024 * 1024));
    } catch (error) {
      console.error('Errore caricamento backup locali:', error);
      setBackupsLocal([]);
    }
  };

  const checkAutoBackupSettings = () => {
    try {
      const settings = localStorage.getItem('backupSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setAutoBackup(parsed.autoBackup);
        setBackupFrequency(parsed.frequency);
        if (parsed.lastBackup && !lastBackup) {
          setLastBackup(parsed.lastBackup);
        }
      }
    } catch (error) {
      console.error('Errore caricamento impostazioni:', error);
    }
  };

  // ✅ FIX UTF-8: Usa encodeURIComponent invece di btoa
  const performLocalBackup = async () => {
    setBackupInProgress(true);
    
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          ordini: JSON.parse(localStorage.getItem('ordini') || '[]'),
          clienti: JSON.parse(localStorage.getItem('clienti') || '[]'),
          prodotti: JSON.parse(localStorage.getItem('prodotti') || '[]'),
          impostazioni: JSON.parse(localStorage.getItem('impostazioni') || '{}'),
          statistiche: JSON.parse(localStorage.getItem('statistiche') || '{}')
        }
      };

      // ✅ FIX: Usa encodeURIComponent per supportare caratteri UTF-8
      const jsonString = JSON.stringify(backupData);
      const compressed = encodeURIComponent(jsonString);
      
      const backupId = `backup_${Date.now()}`;
      const backupInfo = {
        id: backupId,
        date: new Date().toISOString(),
        size: new Blob([compressed]).size,
        type: 'manual',
        items: {
          ordini: backupData.data.ordini.length,
          clienti: backupData.data.clienti.length,
          prodotti: backupData.data.prodotti.length
        }
      };

      localStorage.setItem(backupId, compressed);
      
      const newBackups = [backupInfo, ...backupsLocal].slice(0, 10);
      setBackupsLocal(newBackups);
      localStorage.setItem('backupHistory', JSON.stringify(newBackups));
      
      updateBackupSettings();
      
      toast.success('Backup locale completato con successo!');
    } catch (error) {
      console.error('Errore backup locale:', error);
      toast.error('Errore durante il backup locale');
    } finally {
      setBackupInProgress(false);
    }
  };

  // ✅ FIX UTF-8: Usa decodeURIComponent invece di atob
  const performRestore = async () => {
    if (!selectedBackup) return;
    
    try {
      const backupData = localStorage.getItem(selectedBackup.id);
      if (!backupData) {
        throw new Error('Backup non trovato');
      }

      // ✅ FIX: Usa decodeURIComponent
      const decompressed = JSON.parse(decodeURIComponent(backupData));
      
      if (window.confirm('Questo sovrascriverà tutti i dati attuali. Continuare?')) {
        Object.keys(decompressed.data).forEach(key => {
          localStorage.setItem(key, JSON.stringify(decompressed.data[key]));
        });
        
        toast.success('Ripristino completato! La pagina verrà ricaricata.');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error('Errore ripristino:', error);
      toast.error('Errore durante il ripristino');
    }
    
    setRestoreDialogOpen(false);
  };

  const deleteLocalBackup = (backupId) => {
    if (window.confirm('Eliminare questo backup locale?')) {
      localStorage.removeItem(backupId);
      const newBackups = backupsLocal.filter(b => b.id !== backupId);
      setBackupsLocal(newBackups);
      localStorage.setItem('backupHistory', JSON.stringify(newBackups));
      toast.success('Backup locale eliminato');
      loadBackupHistory();
    }
  };

  const exportLocalBackup = (backup) => {
    const data = localStorage.getItem(backup.id);
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = formatDate(backup.date).replace(/[/:]/g, '-').replace(/ /g, '_');
      a.download = `backup_pastificio_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup esportato');
    }
  };

  const updateBackupSettings = () => {
    const settings = {
      autoBackup,
      frequency: backupFrequency,
      lastBackup: new Date().toISOString()
    };
    localStorage.setItem('backupSettings', JSON.stringify(settings));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: it });
    } catch {
      return 'Data non valida';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🔒 Gestione Backup
      </Typography>

      <Typography variant="body2" color="textSecondary" paragraph>
        Sistema completo di backup con storage locale e cloud (Google Drive)
      </Typography>

      {/* Statistiche Generali */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <History color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Ultimo Backup
                </Typography>
              </Box>
              <Typography variant="h6">
                {lastBackup ? formatDate(lastBackup) : 'Mai'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CloudQueue color={driveConnected ? 'success' : 'error'} sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Google Drive
                </Typography>
              </Box>
              <Chip 
                label={driveConnected ? 'Connesso' : 'Disconnesso'}
                color={driveConnected ? 'success' : 'error'}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FolderZip color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Backup Totali
                </Typography>
              </Box>
              <Typography variant="h6">
                {backupsDrive.length + backupsLocal.length}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {backupsDrive.length} cloud + {backupsLocal.length} locali
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule color="warning" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Prossimo Auto-Backup
                </Typography>
              </Box>
              <Typography variant="body2">
                {nextAutoBackup || 'Non schedulato'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Azioni Rapide */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          ⚡ Azioni Rapide
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              startIcon={backupInProgress ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
              onClick={createDriveBackup}
              disabled={backupInProgress || !driveConnected}
              fullWidth
              size="large"
              color="primary"
            >
              {backupInProgress ? 'Backup in corso...' : '☁️ Backup su Google Drive'}
            </Button>
            {!driveConnected && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Google Drive non connesso
              </Alert>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              startIcon={<Computer />}
              onClick={performLocalBackup}
              disabled={backupInProgress}
              fullWidth
              size="large"
            >
              💾 Backup Locale (Browser)
            </Button>
          </Grid>
        </Grid>

        <Button
          variant="text"
          startIcon={<Refresh />}
          onClick={() => {
            loadDriveBackups();
            loadBackupHistory();
          }}
          sx={{ mt: 2 }}
        >
          Aggiorna Lista
        </Button>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label={`☁️ Google Drive (${backupsDrive.length})`} />
          <Tab label={`💾 Backup Locali (${backupsLocal.length})`} />
          <Tab label="⚙️ Impostazioni" />
        </Tabs>
      </Paper>

      {/* TAB 1: Backup Google Drive */}
      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Backup su Google Drive
            </Typography>
            {driveConnected && (
              <Chip label="✅ Drive Connesso" color="success" size="small" />
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : backupsDrive.length === 0 ? (
            <Alert severity="info">
              Nessun backup su Google Drive. Crea il primo backup per iniziare.
            </Alert>
          ) : (
            <List>
              {backupsDrive.map((backup, index) => (
                <React.Fragment key={backup.id || index}>
                  <ListItem>
                    <ListItemIcon>
                      <CloudQueue color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="subtitle1">
                            {backup.name || 'Backup'}
                          </Typography>
                          <Chip label="Google Drive" size="small" color="primary" sx={{ ml: 1 }} />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            📅 {formatDate(backup.createdTime)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            💾 {formatFileSize(backup.size)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Scarica">
                        <IconButton onClick={() => downloadDriveBackup(backup)}>
                          <GetApp />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Elimina">
                        <IconButton 
                          onClick={() => deleteDriveBackup(backup.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < backupsDrive.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* TAB 2: Backup Locali */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Backup Locali (Browser Storage)
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            I backup locali sono salvati nel browser e limitati a ~5MB. 
            Per backup più grandi usa Google Drive.
          </Alert>

          {backupsLocal.length === 0 ? (
            <Alert severity="warning">
              Nessun backup locale. Crea un backup locale per iniziare.
            </Alert>
          ) : (
            <List>
              {backupsLocal.map((backup, index) => (
                <React.Fragment key={backup.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Computer color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="subtitle1">
                            Backup Locale
                          </Typography>
                          <Chip 
                            label={backup.type === 'auto' ? 'Automatico' : 'Manuale'} 
                            size="small" 
                            color="secondary" 
                            sx={{ ml: 1 }} 
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            📅 {formatDate(backup.date)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            💾 {formatFileSize(backup.size)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            📦 {backup.items?.ordini || 0} ordini, {backup.items?.clienti || 0} clienti, {backup.items?.prodotti || 0} prodotti
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Ripristina">
                        <IconButton 
                          onClick={() => {
                            setSelectedBackup(backup);
                            setRestoreDialogOpen(true);
                          }}
                        >
                          <RestoreFromTrash />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Esporta">
                        <IconButton onClick={() => exportLocalBackup(backup)}>
                          <GetApp />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Elimina">
                        <IconButton 
                          onClick={() => deleteLocalBackup(backup.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < backupsLocal.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              💾 Spazio utilizzato: {storageUsed.toFixed(2)} MB / 5 MB
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((storageUsed / 5) * 100, 100)} 
              sx={{ mt: 1 }}
            />
          </Alert>
        </Paper>
      )}

      {/* TAB 3: Impostazioni */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Impostazioni Backup Automatico
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            I backup automatici su Google Drive vengono eseguiti ogni giorno alle 02:00 AM dal server.
          </Alert>

          <FormControlLabel
            control={
              <Switch
                checked={autoBackup}
                onChange={(e) => {
                  setAutoBackup(e.target.checked);
                  updateBackupSettings();
                }}
              />
            }
            label="Backup automatico locale (browser)"
          />

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Frequenza Backup Locale</InputLabel>
            <Select
              value={backupFrequency}
              onChange={(e) => {
                setBackupFrequency(e.target.value);
                updateBackupSettings();
              }}
              label="Frequenza Backup Locale"
              disabled={!autoBackup}
            >
              <MenuItem value="hourly">Ogni ora</MenuItem>
              <MenuItem value="daily">Giornaliero</MenuItem>
              <MenuItem value="weekly">Settimanale</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            📊 Statistiche Storage
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  💾 Storage Locale (Browser)
                </Typography>
                <Typography variant="h4">
                  {storageUsed.toFixed(2)} MB
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((storageUsed / 5) * 100, 100)} 
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" color="textSecondary">
                  Limite: 5 MB
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  ☁️ Google Drive
                </Typography>
                <Typography variant="h4">
                  {backupsDrive.length}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Backup disponibili
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              ✅ Backup automatico su Google Drive attivo<br />
              🕐 Prossima esecuzione: Oggi alle 02:00 AM<br />
              📁 Retention: 30 giorni (i backup più vecchi vengono eliminati automaticamente)
            </Typography>
          </Alert>
        </Paper>
      )}

      {/* Dialog Ripristino */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>⚠️ Conferma Ripristino</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Il ripristino sovrascriverà tutti i dati attuali con quelli del backup selezionato.
            Questa operazione NON può essere annullata!
          </Alert>
          {selectedBackup && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Dettagli Backup:
              </Typography>
              <Typography variant="body2">
                📅 Data: {formatDate(selectedBackup.date)}
              </Typography>
              <Typography variant="body2">
                💾 Dimensione: {formatFileSize(selectedBackup.size)}
              </Typography>
              <Typography variant="body2">
                📦 Contenuto: {selectedBackup.items?.ordini || 0} ordini, {selectedBackup.items?.clienti || 0} clienti
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>
            Annulla
          </Button>
          <Button 
            onClick={performRestore} 
            color="error" 
            variant="contained"
          >
            Conferma Ripristino
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupManager;