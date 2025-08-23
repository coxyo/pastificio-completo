// src/components/Admin/RoleManager.js
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
  FormControlLabel,
  Checkbox,
  IconButton,
  Box,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  FormGroup,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  Security
} from '@mui/icons-material';
import axios from 'axios';

const RoleManager = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [userCount, setUserCount] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    isAdmin: false,
    permessi: {
      ordini: {
        visualizza: false,
        crea: false,
        modifica: false,
        elimina: false
      },
      magazzino: {
        visualizza: false,
        crea: false,
        modifica: false,
        elimina: false
      },
      report: {
        visualizza: false,
        genera: false
      },
      utenti: {
        visualizza: false,
        crea: false,
        modifica: false,
        elimina: false
      },
      dashboard: {
        visualizza: false
      }
    }
  });
  
  // Auth state
  const authToken = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Fetch roles
  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API_URL}/api/users/role/all`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      setRoles(response.data.data);
      
      // Count users per role
      const usersResponse = await axios.get(
        `${API_URL}/api/users?limit=1000`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      const users = usersResponse.data.data;
      const count = {};
      users.forEach(user => {
        if (user.ruolo && user.ruolo._id) {
          count[user.ruolo._id] = (count[user.ruolo._id] || 0) + 1;
        }
      });
      
      setUserCount(count);
    } catch (err) {
      console.error('Errore nel recupero ruoli:', err);
      setError(err.response?.data?.error || 'Errore nel recupero dei ruoli');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchRoles();
  }, []);
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    const val = name === 'isAdmin' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: val
    });
  };
  
  // Handle permission change
  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    const [module, action] = name.split('.');
    
    setFormData({
      ...formData,
      permessi: {
        ...formData.permessi,
        [module]: {
          ...formData.permessi[module],
          [action]: checked
        }
      }
    });
  };
  
  // Set all permissions in a module
  const setAllModulePermissions = (module, value) => {
    const modulePermissions = { ...formData.permessi[module] };
    
    Object.keys(modulePermissions).forEach(action => {
      modulePermissions[action] = value;
    });
    
    setFormData({
      ...formData,
      permessi: {
        ...formData.permessi,
        [module]: modulePermissions
      }
    });
  };
  
  // Handle dialog open for new role
  const handleOpenNewDialog = () => {
    setFormData({
      nome: '',
      descrizione: '',
      isAdmin: false,
      permessi: {
        ordini: {
          visualizza: false,
          crea: false,
          modifica: false,
          elimina: false
        },
        magazzino: {
          visualizza: false,
          crea: false,
          modifica: false,
          elimina: false
        },
        report: {
          visualizza: false,
          genera: false
        },
        utenti: {
          visualizza: false,
          crea: false,
          modifica: false,
          elimina: false
        },
        dashboard: {
          visualizza: false
        }
      }
    });
    setEditMode(false);
    setOpenDialog(true);
  };
  
  // Handle dialog open for edit role
  const handleOpenEditDialog = (role) => {
    setCurrentRole(role);
    setFormData({
      nome: role.nome,
      descrizione: role.descrizione || '',
      isAdmin: role.isAdmin,
      permessi: role.permessi
    });
    setEditMode(true);
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRole(null);
    setError(null);
  };
  
  // Handle form submit
  const handleSubmit = async () => {
    // Validazione base
    if (!formData.nome) {
      setError('Il nome del ruolo è obbligatorio');
      return;
    }
    
    try {
      if (editMode) {
        // Update existing role
        await axios.put(
          `${API_URL}/api/users/role/${currentRole._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
      } else {
        // Create new role
        await axios.post(
          `${API_URL}/api/users/role`,
          formData,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
      }
      
      // Close dialog and refresh data
      handleCloseDialog();
      fetchRoles();
    } catch (err) {
      console.error('Errore durante il salvataggio:', err);
      setError(err.response?.data?.error || 'Errore durante il salvataggio');
    }
  };
  
  // Handle delete role
  const handleDeleteRole = async (roleId) => {
    try {
      await axios.delete(
        `${API_URL}/api/users/role/${roleId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      // Refresh data
      fetchRoles();
      setConfirmDelete(null);
    } catch (err) {
      console.error('Errore durante l\'eliminazione:', err);
      setError(err.response?.data?.error || 'Errore durante l\'eliminazione');
      setConfirmDelete(null);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Gestione Ruoli
        </Typography>
        
        {/* Action buttons */}
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={handleOpenNewDialog}
          >
            Nuovo Ruolo
          </Button>
        </Box>
        
        {/* Error display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Roles table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Nome</strong></TableCell>
                <TableCell><strong>Descrizione</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Utenti</strong></TableCell>
                <TableCell align="right"><strong>Azioni</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={30} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nessun ruolo trovato
                  </TableCell>
                </TableRow>
              ) : (
                roles.map(role => (
                  <TableRow key={role._id} hover>
                    <TableCell>{role.nome}</TableCell>
                    <TableCell>{role.descrizione || '-'}</TableCell>
                    <TableCell>
                      {role.isAdmin ? (
                        <Chip 
                          icon={<Security fontSize="small" />} 
                          label="Amministratore" 
                          color="primary"
                          size="small"
                        />
                      ) : (
                        <Chip 
                          label="Standard" 
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {userCount[role._id] || 0}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Modifica">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenEditDialog(role)}
                          size="small"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {(userCount[role._id] || 0) === 0 && (
                        <Tooltip title="Elimina">
                          <IconButton 
                            color="error" 
                            onClick={() => setConfirmDelete(role._id)}
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
      </Paper>
      
      {/* Add/Edit Role Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Modifica Ruolo' : 'Nuovo Ruolo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Ruolo"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={formData.isAdmin}
                    onChange={handleInputChange}
                    name="isAdmin"
                  />
                }
                label="Amministratore (tutti i permessi)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrizione"
                name="descrizione"
                value={formData.descrizione}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            
          <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Permessi
              </Typography>
              
              {/* Permessi Ordini */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Ordini</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => setAllModulePermissions('ordini', true)}
                      sx={{ mr: 1 }}
                    >
                      Seleziona Tutti
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => setAllModulePermissions('ordini', false)}
                    >
                      Deseleziona Tutti
                    </Button>
                  </Box>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.ordini.visualizza}
                          onChange={handlePermissionChange}
                          name="ordini.visualizza"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Visualizza ordini"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.ordini.crea}
                          onChange={handlePermissionChange}
                          name="ordini.crea"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Crea ordini"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.ordini.modifica}
                          onChange={handlePermissionChange}
                          name="ordini.modifica"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Modifica ordini"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.ordini.elimina}
                          onChange={handlePermissionChange}
                          name="ordini.elimina"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Elimina ordini"
                    />
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
              
              {/* Permessi Magazzino */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Magazzino</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => setAllModulePermissions('magazzino', true)}
                      sx={{ mr: 1 }}
                    >
                      Seleziona Tutti
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => setAllModulePermissions('magazzino', false)}
                    >
                      Deseleziona Tutti
                    </Button>
                  </Box>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.magazzino.visualizza}
                          onChange={handlePermissionChange}
                          name="magazzino.visualizza"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Visualizza magazzino"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.magazzino.crea}
                          onChange={handlePermissionChange}
                          name="magazzino.crea"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Crea articoli"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.magazzino.modifica}
                          onChange={handlePermissionChange}
                          name="magazzino.modifica"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Modifica articoli"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.magazzino.elimina}
                          onChange={handlePermissionChange}
                          name="magazzino.elimina"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Elimina articoli"
                    />
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
              
              {/* Permessi Report */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Report</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => setAllModulePermissions('report', true)}
                      sx={{ mr: 1 }}
                    >
                      Seleziona Tutti
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => setAllModulePermissions('report', false)}
                    >
                      Deseleziona Tutti
                    </Button>
                  </Box>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.report.visualizza}
                          onChange={handlePermissionChange}
                          name="report.visualizza"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Visualizza report"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.report.genera}
                          onChange={handlePermissionChange}
                          name="report.genera"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Genera report"
                    />
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
              
              {/* Permessi Utenti */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Utenti</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => setAllModulePermissions('utenti', true)}
                      sx={{ mr: 1 }}
                    >
                      Seleziona Tutti
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => setAllModulePermissions('utenti', false)}
                    >
                      Deseleziona Tutti
                    </Button>
                  </Box>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.utenti.visualizza}
                          onChange={handlePermissionChange}
                          name="utenti.visualizza"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Visualizza utenti"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.utenti.crea}
                          onChange={handlePermissionChange}
                          name="utenti.crea"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Crea utenti"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.utenti.modifica}
                          onChange={handlePermissionChange}
                          name="utenti.modifica"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Modifica utenti"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.utenti.elimina}
                          onChange={handlePermissionChange}
                          name="utenti.elimina"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Elimina utenti"
                    />
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
              
              {/* Permessi Dashboard */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Dashboard</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={formData.permessi.dashboard.visualizza}
                          onChange={handlePermissionChange}
                          name="dashboard.visualizza"
                          disabled={formData.isAdmin}
                        />
                      }
                      label="Visualizza dashboard"
                    />
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
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
            {editMode ? 'Salva Modifiche' : 'Crea Ruolo'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare questo ruolo? 
            Questa azione non può essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Annulla</Button>
          <Button 
            onClick={() => handleDeleteRole(confirmDelete)} 
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

export default RoleManager;