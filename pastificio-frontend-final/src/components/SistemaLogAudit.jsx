import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  IconButton,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import GetAppIcon from '@mui/icons-material/GetApp';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

// Demo data
const demoLogs = [
  { id: 1, timestamp: '2024-03-05 14:32:15', user: 'admin', action: 'Login effettuato', level: 'info', category: 'auth' },
  { id: 2, timestamp: '2024-03-05 14:35:22', user: 'admin', action: 'Creazione nuovo ordine #1245', level: 'info', category: 'ordini' },
  { id: 3, timestamp: '2024-03-05 15:12:45', user: 'operatore1', action: 'Modifica ordine #1242', level: 'info', category: 'ordini' },
  { id: 4, timestamp: '2024-03-05 15:48:33', user: 'system', action: 'Backup automatico completato', level: 'info', category: 'sistema' },
  { id: 5, timestamp: '2024-03-05 16:05:12', user: 'operatore2', action: 'Tentativo di accesso non autorizzato a /admin', level: 'warning', category: 'auth' },
  { id: 6, timestamp: '2024-03-05 16:22:56', user: 'system', action: 'Errore connessione database', level: 'error', category: 'sistema' },
  { id: 7, timestamp: '2024-03-05 16:45:10', user: 'admin', action: 'Aggiunta nuovo prodotto al magazzino', level: 'info', category: 'magazzino' },
  { id: 8, timestamp: '2024-03-05 17:12:30', user: 'operatore1', action: 'Modifica dati utente', level: 'info', category: 'utenti' },
  { id: 9, timestamp: '2024-03-05 17:30:15', user: 'system', action: 'Spazio disco insufficiente', level: 'warning', category: 'sistema' },
  { id: 10, timestamp: '2024-03-05 18:05:45', user: 'admin', action: 'Aggiornamento configurazione completato', level: 'info', category: 'sistema' }
];

const SistemaLogAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  
  // Categories and users for filters
  const categories = ['auth', 'ordini', 'magazzino', 'sistema', 'utenti'];
  const users = ['admin', 'operatore1', 'operatore2', 'system'];
  
  useEffect(() => {
    // Simulate API call to fetch logs
    setTimeout(() => {
      setLogs(demoLogs);
      setLoading(false);
    }, 1000);
  }, []);
  
  // Filtered logs based on search term and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesUser = userFilter === 'all' || log.user === userFilter;
    
    return matchesSearch && matchesLevel && matchesCategory && matchesUser;
  });
  
  const exportToCSV = () => {
    const headers = ['ID', 'Timestamp', 'Utente', 'Azione', 'Livello', 'Categoria'];
    const csvData = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.id,
        log.timestamp,
        log.user,
        `"${log.action.replace(/"/g, '""')}"`, // Escape quotes in action text
        log.level,
        log.category
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `log_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Function to render level icon
  const renderLevelIcon = (level) => {
    switch(level) {
      case 'info':
        return <InfoIcon style={{ color: '#2196f3' }} />;
      case 'warning':
        return <WarningIcon style={{ color: '#ff9800' }} />;
      case 'error':
        return <ErrorIcon style={{ color: '#f44336' }} />;
      default:
        return <InfoIcon style={{ color: '#2196f3' }} />;
    }
  };
  
  // Function to render level chip
  const renderLevelChip = (level) => {
    let color;
    switch(level) {
      case 'info':
        color = 'primary';
        break;
      case 'warning':
        color = 'warning';
        break;
      case 'error':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip
        label={level.charAt(0).toUpperCase() + level.slice(1)}
        color={color}
        size="small"
        variant="outlined"
      />
    );
  };
  
  return (
    <div className="p-6">
      <Typography variant="h4" component="h1" gutterBottom>
        Sistema di Log e Audit
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Monitoraggio delle attività e degli eventi di sistema
      </Typography>
      
      {/* Filters and search */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Cerca"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon position="start" sx={{ mr: 1, color: 'action.active' }} />,
          }}
          sx={{ minWidth: 200 }}
        />
        
        <TextField
          select
          label="Livello"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">Tutti</MenuItem>
          <MenuItem value="info">Info</MenuItem>
          <MenuItem value="warning">Warning</MenuItem>
          <MenuItem value="error">Error</MenuItem>
        </TextField>
        
        <TextField
          select
          label="Categoria"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">Tutte</MenuItem>
          {categories.map(category => (
            <MenuItem key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </MenuItem>
          ))}
        </TextField>
        
        <TextField
          select
          label="Utente"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">Tutti</MenuItem>
          {users.map(user => (
            <MenuItem key={user} value={user}>{user}</MenuItem>
          ))}
        </TextField>
        
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => {
            setLevelFilter('all');
            setCategoryFilter('all');
            setUserFilter('all');
            setSearchTerm('');
          }}
        >
          Reset
        </Button>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button
          variant="contained"
          startIcon={<GetAppIcon />}
          onClick={exportToCSV}
          disabled={filteredLogs.length === 0}
        >
          Esporta CSV
        </Button>
      </Box>
      
      {/* Logs table */}
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="tabella log">
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell width={180}>Timestamp</TableCell>
              <TableCell width={120}>Utente</TableCell>
              <TableCell>Azione</TableCell>
              <TableCell width={120}>Livello</TableCell>
              <TableCell width={120}>Categoria</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  Caricamento log in corso...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  Nessun log trovato con i filtri selezionati
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {renderLevelChip(log.level)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.category}
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Typography variant="body2" color="textSecondary">
          Visualizzazione di {filteredLogs.length} record su {logs.length} totali
        </Typography>
      </Box>
    </div>
  );
};

export default SistemaLogAudit;