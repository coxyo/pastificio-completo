import React, { useState, useEffect } from 'react';
import {
  Box, 
  Typography, 
  Paper, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  LinearProgress,
  Stack,
  Alert
} from '@mui/material';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  CloudUpload as CloudUploadIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon
} from '@mui/icons-material';

// Demo backup data
const demoBackups = [
  { id: 1, name: 'Backup Completo', date: '2024-03-05 08:00:00', size: '24.5 MB', type: 'auto', status: 'success' },
  { id: 2, name: 'Backup Manuale', date: '2024-03-04 15:32:45', size: '24.3 MB', type: 'manual', status: 'success' },
  { id: 3, name: 'Backup Database', date: '2024-03-03 08:00:00', size: '12.1 MB', type: 'auto', status: 'success' },
  { id: 4, name: 'Backup Manuale', date: '2024-03-02 11:45:22', size: '24.2 MB', type: 'manual', status: 'success' },
  { id: 5, name: 'Backup Completo', date: '2024-03-01 08:00:00', size: '24.0 MB', type: 'auto', status: 'success' },
  { id: 6, name: 'Backup Completo', date: '2024-02-28 08:00:00', size: '23.8 MB', type: 'auto', status: 'warning' }
];

const BackupRestore = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupType, setBackupType] = useState('full');
  const [backupSettings, setBackupSettings] = useState({
    schedule: 'daily',
    time: '08:00',
    keepCount: 30,
    includeFiles: true,
    includeDatabase: true,
    compression: 'high',
    cloudSync: true
  });
  
  useEffect(() => {
    // Simulate API call to fetch backups
    setTimeout(() => {
      setBackups(demoBackups);
      setLoading(false);
    }, 1000);
  }, []);
  
  const handleCreateBackup = () => {
    setBackupInProgress(true);
    
    // Simulate backup progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setBackupProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Add new backup to the list
        const newBackup = {
          id: Math.max(...backups.map(b => b.id)) + 1,
          name: backupType === 'full' ? 'Backup Completo' : 'Backup Database',
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          size: backupType === 'full' ? '24.6 MB' : '12.2 MB',
          type: 'manual',
          status: 'success'
        };
        
        setBackups([newBackup, ...backups]);
        setBackupInProgress(false);
        setBackupProgress(0);
      }
    }, 200);
  };
  
  const handleRestoreClick = (backup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };
  
  const handleDeleteClick = (backup) => {
    setSelectedBackup(backup);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmRestore = () => {
    // In a real app, this would trigger the restore process
    alert(`Ripristino dal backup del ${selectedBackup.date} non implementato in questa demo`);
    setRestoreDialogOpen(false);
  };
  
  const handleConfirmDelete = () => {
    setBackups(backups.filter(b => b.id !== selectedBackup.id));
    setDeleteDialogOpen(false);
  };
  
  const handleOpenSettings = () => {
    setSettingsDialogOpen(true);
  };
  
  const handleSaveSettings = () => {
    // In a real app, this would save settings to the server
    setSettingsDialogOpen(false);
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };
  
  return (
    <div className="p-6">
      <Typography variant="h4" component="h1" gutterBottom>
        Backup e Restore
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Gestione dei backup del sistema e funzionalità di ripristino
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Backup Disponibili
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={handleOpenSettings}
                  sx={{ mr: 2 }}
                >
                  Impostazioni
                </Button>
                <Button
                  variant="contained"
                  startIcon={<BackupIcon />}
                  onClick={handleCreateBackup}
                  disabled={backupInProgress}
                >
                  Nuovo Backup
                </Button>
              </Box>
            </Box>
            
            {backupInProgress && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Backup in corso...
                </Typography>
                <LinearProgress variant="determinate" value={backupProgress} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption">Creazione backup...</Typography>
                  <Typography variant="caption">{backupProgress}%</Typography>
                </Box>
              </Box>
            )}
            
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography>Caricamento backup...</Typography>
              </Box>
            ) : backups.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography>Nessun backup disponibile</Typography>
              </Box>
            ) : (
              <List>
                {backups.map((backup) => (
                  <React.Fragment key={backup.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {backup.name}
                            <Chip
                              label={backup.type === 'auto' ? 'Auto' : 'Manuale'}
                              size="small"
                              color={backup.type === 'auto' ? 'primary' : 'secondary'}
                              sx={{ ml: 1 }}
                            />
                            <Chip
                              label={backup.status}
                              size="small"
                              color={getStatusColor(backup.status)}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={`Data: ${backup.date} | Dimensione: ${backup.size}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="download"
                          sx={{ mr: 1 }}
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="restore"
                          onClick={() => handleRestoreClick(backup)}
                          sx={{ mr: 1 }}
                        >
                          <RestoreIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteClick(backup)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Crea Nuovo Backup
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="backup-type-label">Tipo di Backup</InputLabel>
              <Select
                labelId="backup-type-label"
                id="backup-type"
                value={backupType}
                label="Tipo di Backup"
                onChange={(e) => setBackupType(e.target.value)}
                disabled={backupInProgress}
              >
                <MenuItem value="full">Backup Completo</MenuItem>
                <MenuItem value="db">Solo Database</MenuItem>
                <MenuItem value="files">Solo File</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Informazioni sul backup selezionato:
              </Typography>
              <Box sx={{ pl: 2, borderLeft: '3px solid #2196f3' }}>
                {backupType === 'full' && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Il backup completo include tutti i dati del database e i file caricati nel sistema.
                  </Typography>
                )}
                {backupType === 'db' && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Il backup del database include solo i dati strutturati, senza i file caricati.
                  </Typography>
                )}
                {backupType === 'files' && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Il backup dei file include solo i documenti e le immagini caricate, senza i dati del database.
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Button
              fullWidth
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={handleCreateBackup}
              disabled={backupInProgress}
            >
              {backupInProgress ? 'Backup in corso...' : 'Avvia Backup'}
            </Button>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistiche Backup
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Ultimo backup:
              </Typography>
              <Typography variant="subtitle1">
                {backups[0]?.date || 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Dimensione totale backups:
              </Typography>
              <Typography variant="subtitle1">
                {backups.length ? 
                  (backups.reduce((total, b) => total + parseFloat(b.size), 0) / 1024).toFixed(2) + ' GB' 
                  : 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Prossimo backup automatico:
              </Typography>
              <Typography variant="subtitle1">
                Domani alle 08:00
              </Typography>
            </Box>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              Backup su Cloud
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<HistoryIcon />}
            >
              Cronologia Completa
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Restore confirmation dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
      >
        <DialogTitle>Conferma Ripristino</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler ripristinare il sistema al backup del {selectedBackup?.date}?
            Questa operazione sovrascriverà tutti i dati attuali con quelli del backup.
            <br /><br />
            <Alert severity="warning">
              Questa operazione non può essere annullata. Consigliamo di effettuare 
              un backup dello stato attuale prima di procedere.
            </Alert>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleConfirmRestore} color="error">
            Ripristina
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler eliminare il backup del {selectedBackup?.date}?
            Questa operazione non può essere annullata.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Settings dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configurazione Backup</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Pianificazione Backup Automatici
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="schedule-label">Frequenza</InputLabel>
                <Select
                  labelId="schedule-label"
                  value={backupSettings.schedule}
                  label="Frequenza"
                  onChange={(e) => setBackupSettings({...backupSettings, schedule: e.target.value})}
                >
                  <MenuItem value="daily">Giornaliera</MenuItem>
                  <MenuItem value="weekly">Settimanale</MenuItem>
                  <MenuItem value="monthly">Mensile</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Orario"
                type="time"
                value={backupSettings.time}
                onChange={(e) => setBackupSettings({...backupSettings, time: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Opzioni di Backup
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numero di backup da conservare"
                type="number"
                value={backupSettings.keepCount}
                onChange={(e) => setBackupSettings({...backupSettings, keepCount: e.target.value})}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="compression-label">Compressione</InputLabel>
                <Select
                  labelId="compression-label"
                  value={backupSettings.compression}
                  label="Compressione"
                  onChange={(e) => setBackupSettings({...backupSettings, compression: e.target.value})}
                >
                  <MenuItem value="none">Nessuna</MenuItem>
                  <MenuItem value="low">Bassa</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={backupSettings.includeDatabase}
                      onChange={(e) => setBackupSettings({...backupSettings, includeDatabase: e.target.checked})}
                    />
                  }
                  label="Include Database"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={backupSettings.includeFiles}
                      onChange={(e) => setBackupSettings({...backupSettings, includeFiles: e.target.checked})}
                    />
                  }
                  label="Include File"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={backupSettings.cloudSync}
                      onChange={(e) => setBackupSettings({...backupSettings, cloudSync: e.target.checked})}
                    />
                  }
                  label="Sincronizza su Cloud"
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleSaveSettings} color="primary">
            Salva Impostazioni
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BackupRestore;