// components/Backup/BackupManager.js
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  Schedule,
  Storage,
  CheckCircle,
  Error,
  Warning,
  RestoreFromTrash,
  Settings,
  FolderZip,
  CloudSync,
  History
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'react-toastify';

const BackupManager = () => {
  const [backups, setBackups] = useState([]);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [lastBackup, setLastBackup] = useState(null);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);

  useEffect(() => {
    loadBackupHistory();
    checkAutoBackupSettings();
  }, []);

  const loadBackupHistory = () => {
    const savedBackups = localStorage.getItem('backupHistory');
    if (savedBackups) {
      setBackups(JSON.parse(savedBackups));
    }
    
    // Calcola spazio utilizzato
    const totalSize = Object.keys(localStorage).reduce((acc, key) => {
      return acc + new Blob([localStorage.getItem(key)]).size;
    }, 0);
    setStorageUsed(totalSize / (1024 * 1024)); // Convert to MB
  };

  const checkAutoBackupSettings = () => {
    const settings = localStorage.getItem('backupSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setAutoBackup(parsed.autoBackup);
      setBackupFrequency(parsed.frequency);
      setLastBackup(parsed.lastBackup);
    }
  };

  const performBackup = async () => {
    setBackupInProgress(true);
    
    try {
      // Raccogli tutti i dati da backuppare
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

      // Comprimi i dati
      const compressed = btoa(JSON.stringify(backupData));
      
      // Salva backup
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

      // Salva in localStorage (in produzione useresti un server)
      localStorage.setItem(backupId, compressed);
      
      // Aggiorna storia backup
      const newBackups = [backupInfo, ...backups].slice(0, 10); // Mantieni solo ultimi 10
      setBackups(newBackups);
      localStorage.setItem('backupHistory', JSON.stringify(newBackups));
      
      // Aggiorna ultimo backup
      setLastBackup(new Date().toISOString());
      updateBackupSettings();
      
      toast.success('Backup completato con successo!');
    } catch (error) {
      console.error('Errore backup:', error);
      toast.error('Errore durante il backup');
    } finally {
      setBackupInProgress(false);
    }
  };

  const performRestore = async () => {
    if (!selectedBackup) return;
    
    try {
      const backupData = localStorage.getItem(selectedBackup.id);
      if (!backupData) {
        throw new Error('Backup non trovato');
      }

      // Decomprimi e ripristina
      const decompressed = JSON.parse(atob(backupData));
      
      // Conferma prima di sovrascrivere
      if (window.confirm('Questo sovrascriverà tutti i dati attuali. Continuare?')) {
        // Ripristina ogni categoria
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

  const deleteBackup = (backupId) => {
    if (window.confirm('Eliminare questo backup?')) {
      localStorage.removeItem(backupId);
      const newBackups = backups.filter(b => b.id !== backupId);
      setBackups(newBackups);
      localStorage.setItem('backupHistory', JSON.stringify(newBackups));
      toast.success('Backup eliminato');
    }
  };

  const exportBackup = (backup) => {
    const data = localStorage.getItem(backup.id);
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_pastificio_${format(new Date(backup.date), 'yyyy-MM-dd_HH-mm')}.json`;
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

  const scheduleAutoBackup = () => {
    if (!autoBackup) return;
    
    // In produzione, questo sarebbe gestito dal backend
    const intervals = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000
    };
    
    const interval = intervals[backupFrequency] || intervals.daily;
    
    // Simula auto-backup
    setTimeout(() => {
      performBackup();
      scheduleAutoBackup(); // Rischedula
    }, interval);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestione Backup
      </Typography>

      {/* Statistiche */}
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
                {lastBackup 
                  ? format(new Date(lastBackup), 'dd/MM HH:mm', { locale: it })
                  : 'Mai'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Storage color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Spazio Utilizzato
                </Typography>
              </Box>
              <Typography variant="h6">
                {storageUsed.toFixed(2)} MB
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(storageUsed / 5) * 100} 
                sx={{ mt: 1 }}
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
                  Backup Salvati
                </Typography>
              </Box>
              <Typography variant="h6">
                {backups.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CloudSync color="warning" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Auto-Backup
                </Typography>
              </Box>
              <Chip 
                label={autoBackup ? 'Attivo' : 'Disattivo'}
                color={autoBackup ? 'success' : 'default'}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Azioni principali */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Backup Manuale
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Crea un backup immediato di tutti i dati del sistema
            </Typography>
            <Button
              variant="contained"
              startIcon={backupInProgress ? <CircularProgress size={20} /> : <CloudUpload />}
              onClick={performBackup}
              disabled={backupInProgress}
              fullWidth
            >
              {backupInProgress ? 'Backup in corso...' : 'Esegui Backup Ora'}
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Impostazioni Auto-Backup
            </Typography>
            
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
              label="Backup automatico"
            />

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Frequenza</InputLabel>
              <Select
                value={backupFrequency}
                onChange={(e) => {
                  setBackupFrequency(e.target.value);
                  updateBackupSettings();
                }}
                label="Frequenza"
                disabled={!autoBackup}
              >
                <MenuItem value="hourly">Ogni ora</MenuItem>
                <MenuItem value="daily">Giornaliero</MenuItem>
                <MenuItem value="weekly">Settimanale</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista Backup */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Cronologia Backup
        </Typography>
        
        {backups.length === 0 ? (
          <Alert severity="info">
            Nessun backup disponibile. Esegui il primo backup per iniziare.
          </Alert>
        ) : (
          <List>
            {backups.map((backup) => (
              <ListItem
                key={backup.id}
                secondaryAction={
                  <Box>
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
                      <IconButton onClick={() => exportBackup(backup)}>
                        <CloudDownload />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                      <IconButton 
                        onClick={() => deleteBackup(backup.id)}
                        color="error"
                      >
                        <Error />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={format(new Date(backup.date), 'dd/MM/yyyy HH:mm', { locale: it })}
                  secondary={
                    <Box>
                      <Typography variant="caption">
                        {backup.items.ordini} ordini, {backup.items.clienti} clienti, {backup.items.prodotti} prodotti
                      </Typography>
                      <br />
                      <Typography variant="caption">
                        Dimensione: {formatFileSize(backup.size)} • Tipo: {backup.type === 'auto' ? 'Automatico' : 'Manuale'}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Dialog Ripristino */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Conferma Ripristino</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Il ripristino sovrascriverà tutti i dati attuali con quelli del backup selezionato.
          </Alert>
          {selectedBackup && (
            <Typography>
              Backup del: {format(new Date(selectedBackup.date), 'dd/MM/yyyy HH:mm', { locale: it })}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>
            Annulla
          </Button>
          <Button 
            onClick={performRestore} 
            color="primary" 
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