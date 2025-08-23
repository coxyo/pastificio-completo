// src/components/RubricaClienti.js
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, Button, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, InputAdornment,
  Snackbar, Alert, CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Search as SearchIcon,
  HistoryEdu as HistoryIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import loggingService from '../services/loggingService';

const RubricaClienti = ({ onSelezionaCliente, viewMode = false }) => {
  // Stati per la gestione della rubrica
  const [clienti, setClienti] = useState([]);
  const [clienteSelezionato, setClienteSelezionato] = useState(null);
  const [dialogoAperto, setDialogoAperto] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [caricamento, setCaricamento] = useState(true);
  
  // Stati per la paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Stato per il nuovo cliente
  const [nuovoCliente, setNuovoCliente] = useState({
    nome: '',
    telefono: '',
    email: '',
    indirizzo: '',
    note: '',
    ordiniFrequenti: []
  });
  
  // Stato per notifiche
  const [notifica, setNotifica] = useState({
    aperta: false,
    messaggio: '',
    tipo: 'info'
  });
  
  // Carica clienti dal localStorage all'avvio
  useEffect(() => {
    try {
      setCaricamento(true);
      const clientiSalvati = localStorage.getItem('pastificio_clienti');
      if (clientiSalvati) {
        setClienti(JSON.parse(clientiSalvati));
      }
      LoggingService.info('Rubrica clienti caricata');
    } catch (error) {
      LoggingService.error('Errore caricamento rubrica clienti', error);
      mostraNotifica('Errore nel caricamento della rubrica clienti', 'error');
    } finally {
      setCaricamento(false);
    }
  }, []);
  
  // Filtra i clienti in base al testo di ricerca
  const clientiFiltrati = clienti.filter(cliente => 
    cliente.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    cliente.telefono.includes(filtro) ||
    (cliente.email && cliente.email.toLowerCase().includes(filtro.toLowerCase()))
  );
  
  // Funzioni per la gestione della paginazione
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Apre il dialogo per nuovo cliente
  const apriDialogoNuovoCliente = () => {
    setClienteSelezionato(null);
    setNuovoCliente({
      nome: '',
      telefono: '',
      email: '',
      indirizzo: '',
      note: '',
      ordiniFrequenti: []
    });
    setDialogoAperto(true);
  };
  
  // Apre il dialogo per modificare un cliente esistente
  const apriDialogoModificaCliente = (cliente) => {
    setClienteSelezionato(cliente);
    setNuovoCliente({ ...cliente });
    setDialogoAperto(true);
  };
  
  // Chiude il dialogo
  const chiudiDialogo = () => {
    setDialogoAperto(false);
  };
  
  // Salva un nuovo cliente o modifica uno esistente
  const salvaCliente = () => {
    try {
      if (!nuovoCliente.nome) {
        mostraNotifica('Il nome del cliente è obbligatorio', 'warning');
        return;
      }
      
      let nuoviClienti = [];
      
      if (clienteSelezionato) {
        // Aggiorna cliente esistente
        nuoviClienti = clienti.map(c => 
          c.id === clienteSelezionato.id ? { ...nuovoCliente } : c
        );
        LoggingService.info('Cliente aggiornato', { id: clienteSelezionato.id });
        mostraNotifica('Cliente aggiornato con successo', 'success');
      } else {
        // Crea nuovo cliente
        const nuovoId = `client_${Date.now()}`;
        nuoviClienti = [...clienti, { ...nuovoCliente, id: nuovoId }];
        LoggingService.info('Nuovo cliente creato', { id: nuovoId });
        mostraNotifica('Cliente aggiunto con successo', 'success');
      }
      
      setClienti(nuoviClienti);
      localStorage.setItem('pastificio_clienti', JSON.stringify(nuoviClienti));
      chiudiDialogo();
    } catch (error) {
      LoggingService.error('Errore salvataggio cliente', error);
      mostraNotifica('Errore durante il salvataggio del cliente', 'error');
    }
  };
  
  // Elimina un cliente
  const eliminaCliente = (id) => {
    try {
      const nuoviClienti = clienti.filter(c => c.id !== id);
      setClienti(nuoviClienti);
      localStorage.setItem('pastificio_clienti', JSON.stringify(nuoviClienti));
      LoggingService.info('Cliente eliminato', { id });
      mostraNotifica('Cliente eliminato con successo', 'success');
    } catch (error) {
      LoggingService.error('Errore eliminazione cliente', error);
      mostraNotifica('Errore durante l\'eliminazione del cliente', 'error');
    }
  };
  
  // Gestione delle modifiche ai campi del form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuovoCliente({
      ...nuovoCliente,
      [name]: value
    });
  };
  
  // Mostra notifica
  const mostraNotifica = (messaggio, tipo = 'info') => {
    setNotifica({
      aperta: true,
      messaggio,
      tipo
    });
  };
  
  // Chiudi notifica
  const chiudiNotifica = () => {
    setNotifica({
      ...notifica,
      aperta: false
    });
  };
  
  // Seleziona cliente (per uso in modalità selezione)
  const handleSelezionaCliente = (cliente) => {
    if (onSelezionaCliente && typeof onSelezionaCliente === 'function') {
      onSelezionaCliente(cliente);
    }
  };
  
  return (
    <Container maxWidth={viewMode ? 'lg' : 'xl'}>
      {!viewMode && (
        <Typography variant="h4" gutterBottom>
          Rubrica Clienti
        </Typography>
      )}
      
      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={12} md={6}>
            <TextField
              fullWidth
              placeholder="Cerca per nome, telefono o email..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={apriDialogoNuovoCliente}
            >
              Nuovo Cliente
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={3}>
        {caricamento ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Telefono</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Indirizzo</TableCell>
                    <TableCell>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientiFiltrati.length > 0 ? (
                    clientiFiltrati
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((cliente) => (
                        <TableRow key={cliente.id} hover>
                          <TableCell>{cliente.nome}</TableCell>
                          <TableCell>{cliente.telefono}</TableCell>
                          <TableCell>{cliente.email}</TableCell>
                          <TableCell>{cliente.indirizzo}</TableCell>
                          <TableCell>
                            <IconButton 
                              color="primary" 
                              onClick={() => apriDialogoModificaCliente(cliente)}
                              title="Modifica cliente"
                            >
                              <EditIcon />
                            </IconButton>
                            
                            <IconButton 
                              color="error" 
                              onClick={() => eliminaCliente(cliente.id)}
                              title="Elimina cliente"
                            >
                              <DeleteIcon />
                            </IconButton>
                            
                            {viewMode && (
                              <IconButton 
                                color="success" 
                                onClick={() => handleSelezionaCliente(cliente)}
                                title="Seleziona cliente"
                              >
                                <CopyIcon />
                              </IconButton>
                            )}
                            
                            {!viewMode && (
                              <IconButton 
                                color="info" 
                                title="Storico ordini"
                              >
                                <HistoryIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {filtro ? 'Nessun cliente trovato' : 'Nessun cliente nella rubrica'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={clientiFiltrati.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Righe per pagina:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} di ${count}`}
            />
          </>
        )}
      </Paper>
      
      {/* Dialog per aggiunta/modifica cliente */}
      <Dialog 
        open={dialogoAperto} 
        onClose={chiudiDialogo}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {clienteSelezionato ? 'Modifica Cliente' : 'Nuovo Cliente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="nome"
                label="Nome Cliente"
                fullWidth
                required
                value={nuovoCliente.nome}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="telefono"
                label="Telefono"
                fullWidth
                value={nuovoCliente.telefono}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                fullWidth
                value={nuovoCliente.email || ''}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="indirizzo"
                label="Indirizzo"
                fullWidth
                value={nuovoCliente.indirizzo || ''}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="note"
                label="Note"
                multiline
                rows={3}
                fullWidth
                value={nuovoCliente.note || ''}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={chiudiDialogo}>Annulla</Button>
          <Button 
            onClick={salvaCliente} 
            variant="contained" 
            color="primary"
            disabled={!nuovoCliente.nome}
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifiche */}
      <Snackbar
        open={notifica.aperta}
        autoHideDuration={6000}
        onClose={chiudiNotifica}
      >
        <Alert 
          onClose={chiudiNotifica} 
          severity={notifica.tipo} 
          sx={{ width: '100%' }}
        >
          {notifica.messaggio}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RubricaClienti;