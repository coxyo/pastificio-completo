// components/SyncStatus.js
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Badge, 
  Tooltip, 
  IconButton, 
  Menu, 
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Sync as SyncIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  CloudQueue as CloudQueueIcon,
  MoreVert as MoreVertIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  CalendarToday as CalendarIcon,
  Error as ErrorIcon,
  Check as CheckIcon
} from '@mui/icons-material';

import { useSync } from '../context/SyncContext';
import { formatDate, formatTimestamp } from '../utils/helpers';

/**
 * Componente per visualizzare e gestire lo stato di sincronizzazione
 */
const SyncStatus = () => {
  const { 
    isOnline, 
    syncState, 
    syncData, 
    backupData, 
    restoreBackup, 
    getBackups,
    hasPendingChanges
  } = useSync();
  
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [syncResultDialogOpen, setSyncResultDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  
  const menuOpen = Boolean(menuAnchorEl);
  const { lastSync, pendingChanges, isSyncing, error } = syncState;
  
  // Calcola quanto tempo è passato dall'ultima sincronizzazione
  const getSyncTimeAgo = () => {
    if (!lastSync) return 'Mai sincronizzato';
    
    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const diffMs = now - lastSyncDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Appena sincronizzato';
    if (diffMins < 60) return `${diffMins} minuti fa`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ore fa`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} giorni fa`;
  };
  
  // Gestione apertura menu
  const handleOpenMenu = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Gestione chiusura menu
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };
  
  // Gestione sincronizzazione
  const handleSync = async () => {
    handleCloseMenu();
    setCurrentAction('sync');
    
    const result = await syncData();
    setActionResult(result);
    setSyncResultDialogOpen(true);
  };
  
  // Gestione backup
  const handleBackup = async () => {
    handleCloseMenu();
    setCurrentAction('backup');
    setBackupDialogOpen(false);
    
    const result = await backupData();
    setActionResult(result);
    setSyncResultDialogOpen(true);
  };
  
  // Gestione ripristino backup
  const handleRestore = async (timestamp) => {
    setRestoreDialogOpen(false);
    setCurrentAction('restore');
    
    const result = await restoreBackup(timestamp);
    setActionResult(result);
    setSyncResultDialogOpen(true);
  };
  
  // Render del tooltip di stato
  const renderStatusTooltip = () => {
    if (isSyncing) {
      return 'Sincronizzazione in corso...';
    }
    
    if (error) {
      return `Errore di sincronizzazione: ${error}`;
    }
    
    if (!isOnline) {
      return 'Offline - Le modifiche verranno sincronizzate quando sarai di nuovo online';
    }
    
    if (pendingChanges) {
      return `${pendingChanges} modifiche in attesa di sincronizzazione`;
    }
    
    return `Ultima sincronizzazione: ${getSyncTimeAgo()}`;
  };
  
  // Render dell'icona di stato
  const renderStatusIcon = () => {
    if (isSyncing) {
      return <CircularProgress size={20} thickness={4} />;
    }
    
    if (error) {
      return <ErrorIcon color="error" />;
    }
    
    if (!isOnline) {
      return <CloudOffIcon color="disabled" />;
    }
    
    if (pendingChanges) {
      return <CloudQueueIcon color="warning" />;
    }
    
    return <CloudDoneIcon color="success" />;
  };
  
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={renderStatusTooltip()}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            {renderStatusIcon()}
            
            {pendingChanges > 0 && (
              <Badge
                badgeContent={pendingChanges}
                color="warning"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </Tooltip>
        
        <Box>
          <IconButton
            aria-label="Opzioni di sincronizzazione"
            aria-controls="sync-menu"
            aria-haspopup="true"
            onClick={handleOpenMenu}
            size="small"
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Menu delle azioni */}
      <Menu
        id="sync-menu"
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem 
          onClick={handleSync}
          disabled={isSyncing || (!isOnline && !hasPendingChanges())}
        >
          <ListItemIcon>
            <SyncIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sincronizza ora" />
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            handleCloseMenu();
            setBackupDialogOpen(true);
          }}
        >
          <ListItemIcon>
            <BackupIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Backup dati" />
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            handleCloseMenu();
            setRestoreDialogOpen(true);
          }}
        >
          <ListItemIcon>
            <RestoreIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Ripristina backup" />
        </MenuItem>
      </Menu>
      
      {/* Dialog di backup */}
      <Dialog
        open={backupDialogOpen}
        onClose={() => setBackupDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Backup dati</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Vuoi creare un backup dei dati attuali? Questo ti permetterà di ripristinare
            i dati in caso di problemi.
          </Typography>
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            Il backup includerà tutti i dati locali. Le modifiche non sincronizzate
            saranno incluse nel backup.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleBackup} 
            startIcon={<BackupIcon />}
          >
            Crea backup
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog di ripristino */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ripristina backup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Il ripristino sovrascriverà tutti i dati attuali con quelli del backup selezionato.
            Le modifiche non salvate andranno perse.
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            Seleziona un backup da ripristinare:
          </Typography>
          
          <List>
            {getBackups().map((backup) => (
              <ListItem 
                key={backup.timestamp}
                button
                onClick={() => handleRestore(backup.timestamp)}
              >
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={formatTimestamp(backup.timestamp)} 
                  secondary={`${backup.items} elementi`} 
                />
                <Chip 
                  label={`${backup.size} KB`} 
                  size="small" 
                  variant="outlined" 
                />
              </ListItem>
            ))}
            
            {getBackups().length === 0 && (
              <ListItem>
                <ListItemText primary="Nessun backup disponibile" />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog risultato operazione */}
      <Dialog
        open={syncResultDialogOpen}
        onClose={() => setSyncResultDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentAction === 'sync' && 'Sincronizzazione completata'}
          {currentAction === 'backup' && 'Backup completato'}
          {currentAction === 'restore' && 'Ripristino completato'}
        </DialogTitle>
        <DialogContent>
          {actionResult?.success ? (
            <Alert 
              severity="success" 
              icon={<CheckIcon fontSize="inherit" />}
              sx={{ mb: 2 }}
            >
              {currentAction === 'sync' && 'Sincronizzazione completata con successo'}
              {currentAction === 'backup' && 'Backup completato con successo'}
              {currentAction === 'restore' && 'Ripristino completato con successo'}
            </Alert>
          ) : (
            <Alert 
              severity="error" 
              icon={<ErrorIcon fontSize="inherit" />}
              sx={{ mb: 2 }}
            >
              {actionResult?.error || 'Si è verificato un errore durante l\'operazione'}
            </Alert>
          )}
          
          {actionResult?.details && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                {JSON.stringify(actionResult.details, null, 2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncResultDialogOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SyncStatus;