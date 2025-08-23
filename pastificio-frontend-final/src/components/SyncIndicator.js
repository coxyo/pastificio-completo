// components/SyncIndicator.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert
} from '@mui/material';
import {
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  CloudQueue as CloudQueueIcon,
  Sync as SyncIcon,
  MoreVert as MoreVertIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  CalendarToday as CalendarIcon,
  Error as ErrorIcon,
  Check as CheckIcon
} from '@mui/icons-material';

import { useSync } from '../context/SyncContext';

/**
 * Componente per mostrare lo stato di sincronizzazione
 * e fornire opzioni di sincronizzazione, backup e ripristino
 */
const SyncIndicator = () => {
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
  const [backupDialog, setBackupDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [resultDialog, setResultDialog] = useState(false);
  const [operationResult, setOperationResult] = useState(null);
  
  const menuOpen = Boolean(menuAnchorEl);
  const { lastSync, pendingChanges, isSyncing, error } = syncState;
  
  // Funzione per formattare la data dell'ultima sincronizzazione
  const formatLastSync = () => {
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
  
  // Gestione apertura/chiusura menu
  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Sincronizzazione
  const handleSync = async () => {
    handleMenuClose();
    const result = await syncData();
    setOperationResult({
      title: 'Sincronizzazione',
      result
    });
    setResultDialog(true);
  };
  
  // Creazione backup
  const handleCreateBackup = async () => {
    setBackupDialog(false);
    const result = await backupData();
    setOperationResult({
      title: 'Backup',
      result
    });
    setResultDialog(true);
  };
  
  // Ripristino backup
  const handleRestoreBackup = async (timestamp) => {
    setRestoreDialog(false);
    const result = await restoreBackup(timestamp);
    setOperationResult({
      title: 'Ripristino',
      result
    });
    setResultDialog(true);
  };
  
  // Rendering dello stato
  const renderStatus = () => {
    if (isSyncing) {
      return <CircularProgress size={20} thickness={4} />;
    }
    
    if (error) {
      return <ErrorIcon color="error" />;
    }
    
    if (!isOnline) {
      return <CloudOffIcon color="disabled" />;
    }
    
    if (pendingChanges > 0) {
      return <CloudQueueIcon color="warning" />;
    }
    
    return <CloudDoneIcon color="success" />;
  };
  
  // Testo dello stato
  const getStatusText = () => {
    if (isSyncing) {
      return 'Sincronizzazione in corso...';
    }
    
    if (error) {
      return `Errore: ${error}`;
    }
    
    if (!isOnline) {
      return 'Offline - Le modifiche verranno sincronizzate quando sarai online';
    }
    
    if (pendingChanges > 0) {
      return `${pendingChanges} modifiche in attesa`;
    }
    
    return `Ultima sincronizzazione: ${formatLastSync()}`;
  };
  
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={getStatusText()}>
          <Badge
            badgeContent={pendingChanges > 0 ? pendingChanges : 0}
            color="warning"
            invisible={pendingChanges === 0}
            sx={{ mr: 1 }}
          >
            {renderStatus()}
          </Badge>
        </Tooltip>
        
        <IconButton
          onClick={handleMenuClick}
          size="small"
          aria-controls={menuOpen ? 'sync-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? 'true' : undefined}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>
      
      {/* Menu delle opzioni */}
      <Menu
        id="sync-menu"
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{ 'aria-labelledby': 'sync-button' }}
      >
        <MenuItem 
          onClick={handleSync}
          disabled={!isOnline || isSyncing}
        >
          <ListItemIcon>
            <SyncIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sincronizza</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          setBackupDialog(true);
        }}>
          <ListItemIcon>
            <BackupIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Backup dati</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          setRestoreDialog(true);
        }}>
          <ListItemIcon>
            <RestoreIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ripristina backup</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Dialog per backup */}
      <Dialog
        open={backupDialog}
        onClose={() => setBackupDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Backup dati</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Vuoi creare un backup dei dati attuali?
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            Il backup includerà tutti i dati locali, incluse le modifiche non ancora sincronizzate.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialog(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateBackup}
            startIcon={<BackupIcon />}
          >
            Crea backup
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per ripristino backup */}
      <Dialog
        open={restoreDialog}
        onClose={() => setRestoreDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ripristina backup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Il ripristino di un backup sovrascriverà tutti i dati attuali. Le modifiche non salvate andranno perse.
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            Seleziona un backup da ripristinare:
          </Typography>
          
          <List>
            {getBackups().length === 0 ? (
              <ListItem>
                <ListItemText primary="Nessun backup disponibile" />
              </ListItem>
            ) : (
              getBackups().map((backup) => (
                <ListItem 
                  key={backup.timestamp}
                  button
                  onClick={() => handleRestoreBackup(backup.timestamp)}
                >
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={new Date(backup.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog(false)}>Annulla</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per risultati operazione */}
      <Dialog
        open={resultDialog}
        onClose={() => setResultDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {operationResult?.title || 'Risultato'} completato
        </DialogTitle>
        <DialogContent>
          {operationResult?.result?.success ? (
            <Alert 
              severity="success" 
              icon={<CheckIcon fontSize="inherit" />}
            >
              {operationResult.result.message || 'Operazione completata con successo'}
            </Alert>
          ) : (
            <Alert 
              severity="error" 
              icon={<ErrorIcon fontSize="inherit" />}
            >
              {operationResult?.result?.message || 'Si è verificato un errore durante l\'operazione'}
            </Alert>
          )}
          
          {operationResult?.result?.error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              Dettaglio errore: {operationResult.result.error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialog(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SyncIndicator;