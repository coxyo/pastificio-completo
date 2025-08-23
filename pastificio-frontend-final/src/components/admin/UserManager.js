// src/components/Admin/UserManager.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Chip,
  Pagination,
  Grid,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  CheckCircle,
  Cancel,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nome: '',
    cognome: '',
    email: '',
    ruoloId: '',
    attivo: true
  });
  
  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Auth state
  const authToken = localStorage.getItem('token');
  const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Costruisci query string
      let query = `page=${page}&limit=10`;
      if (searchTerm) query += `&search=${searchTerm}`;
      if (filterActive) query += `&attivo=${filterActive}`;
      if (filterRole) query += `&ruolo=${filterRole}`;
      
      const response = await axios.get(
        `${API_URL}/api/users?${query}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      setUsers(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      console.error('Errore nel recupero utenti:', err);
      setError(err.response?.data?.error || 'Errore nel recupero degli utenti');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/users/role/all`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      setRoles(response.data.data);
    } catch (err) {
      console.error('Errore nel recupero ruoli:', err);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page, searchTerm, filterActive, filterRole]);
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    const val = name === 'attivo' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: val
    });
  };
  
  // Handle dialog open for new user
  const handleOpenNewDialog = () => {
    setFormData({
      username: '',
      password: '',
      nome: '',
      cognome: '',
      email: '',
      ruoloId: '',
      attivo: true
    });
    setEditMode(false);
    setOpenDialog(true);
  };
  
  // Handle dialog open for edit user
  const handleOpenEditDialog = (user) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      nome: user.nome,
      cognome: user.cognome,
      email: user.email,
      ruoloId: user.ruolo._id,
      attivo: user.attivo,
      password: ''
    });
    setEditMode(true);
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
  };
  
  // Handle form submit
  const handleSubmit = async () => {
    // Validazione base
    if (!formData.username || !formData.nome || !formData.cognome || !formData.email || !formData.ruoloId) {
      setError('Compila tutti i campi obbligatori');
      return;
    }
    
    if (!editMode && !formData.password) {
      setError('La password è obbligatoria per nuovi utenti');
      return;
    }
    
    try {
      if (editMode) {
        // Update existing user
        await axios.put(
          `${API_URL}/api/users/${currentUser._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
      } else {
        // Create new user
        await axios.post(
          `${API_URL}/api/users`,
          formData,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
      }
      
      // Close dialog and refresh data
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      console.error('Errore durante il salvataggio:', err);
      setError(err.response?.data?.error || 'Errore durante il salvataggio');
    }
  };
  
  // Handle delete user
  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(
        `${API_URL}/api/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      // Refresh data
      fetchUsers();
      setConfirmDelete(null);
    } catch (err) {
      console.error('Errore durante l\'eliminazione:', err);
      setError(err.response?.data?.error || 'Errore durante l\'eliminazione');
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'filterActive') setFilterActive(value);
    if (name === 'filterRole') setFilterRole(value);
    setPage(1); // Reset to first page
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterActive('');
    setFilterRole('');
    setPage(1);
  };
  
  // Get role name by ID
  const getRoleName = (roleId) => {
    const role = roles.find(r => r._id === roleId);
    return role ? role.nome : 'Non assegnato';
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Gestione Utenti
        </Typography>
        
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Cerca utente"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Stato</InputLabel>
              <Select
                name="filterActive"
                value={filterActive}
                onChange={handleFilterChange}
                label="Stato"
              >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="true">Attivi</MenuItem>
                <MenuItem value="false">Disattivati</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Ruolo</InputLabel>
              <Select
                name="filterRole"
                value={filterRole}
                onChange={handleFilterChange}
                label="Ruolo"
              >
                <MenuItem value="">Tutti</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role._id} value={role._id}>
                    {role.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined" 
              startIcon={<Refresh />}
              onClick={handleResetFilters}
              fullWidth
            >
              Resetta
            </Button>
          </Grid>
        </Grid>
        
        {/* Action buttons */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={handleOpenNewDialog}
          >
            Nuovo Utente
          </Button>
          
          <Box>
            {(searchTerm || filterActive || filterRole) && (
              <Chip 
                label={`${users.length} risultati`} 
                variant="outlined" 
                sx={{ mr: 1 }}
              />
            )}
          </Box>
        </Box>
        
        {/* Error display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Users table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Utente</strong></TableCell>
                <TableCell><strong>Nome</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Ruolo</strong></TableCell>
                <TableCell><strong>Stato</strong></TableCell>
                <TableCell align="right"><strong>Azioni</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={30} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nessun utente trovato
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{`${user.nome} ${user.cognome}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.ruolo.nome} 
                        color={user.ruolo.isAdmin ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.attivo ? (
                        <Chip 
                          icon={<CheckCircle fontSize="small" />} 
                          label="Attivo" 
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip 
                          icon={<Cancel fontSize="small" />} 
                          label="Disattivato" 
                          color="error"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Modifica">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenEditDialog(user)}
                          size="small"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {user._id !== currentUserData.id && (
                        <Tooltip title="Elimina">
                          <IconButton 
                            color="error" 
                            onClick={() => setConfirmDelete(user._id)}
                            size="small"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>
      
      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Modifica Utente' : 'Nuovo Utente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={editMode} // Non permettere di cambiare username in edit
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Ruolo</InputLabel>
                <Select
                  name="ruoloId"
                  value={formData.ruoloId}
                  onChange={handleInputChange}
                  label="Ruolo"
                  required
                >
                  {roles.map(role => (
                    <MenuItem key={role._id} value={role._id}>
                      {role.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cognome"
                name="cognome"
                value={formData.cognome}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={editMode ? 'Nuova Password (lascia vuoto per non cambiare)' : 'Password'}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Stato</InputLabel>
                <Select
                  name="attivo"
                  value={formData.attivo}
                  onChange={(e) => setFormData({
                    ...formData,
                    attivo: e.target.value === 'true'
                  })}
                  label="Stato"
                >
                  <MenuItem value="true">Attivo</MenuItem>
                  <MenuItem value="false">Disattivato</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? 'Salva Modifiche' : 'Crea Utente'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare questo utente? 
            Questa azione non può essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Annulla</Button>
          <Button 
            onClick={() => handleDeleteUser(confirmDelete)} 
            variant="contained" 
            color="error"
          >
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManager;