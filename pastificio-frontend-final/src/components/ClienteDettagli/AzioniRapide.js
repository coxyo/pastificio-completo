// src/components/ClienteDettagli/AzioniRapide.js
'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';

import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Message as MessageIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as DeliveryIcon,
  EventNote as NoteIcon,
  Payment as PaymentIcon,
  Assessment as ReportIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Receipt as InvoiceIcon,
} from '@mui/icons-material';

const AzioniRapide = ({ cliente, onUpdate }) => {
  const [openDialog, setOpenDialog] = useState('');
  const [noteText, setNoteText] = useState('');
  const [orderData, setOrderData] = useState({
    prodotti: [],
    dataConsegna: '',
    note: '',
  });
  const [paymentData, setPaymentData] = useState({
    importo: '',
    metodo: 'contanti',
    data: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handlePhoneCall = () => {
    if (cliente.telefono) {
      window.location.href = `tel:${cliente.telefono}`;
    }
  };

  const handleEmail = () => {
    if (cliente.email) {
      window.location.href = `mailto:${cliente.email}`;
    }
  };

  const handleWhatsApp = () => {
    if (cliente.telefono) {
      const phoneNumber = cliente.telefono.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneNumber}`, '_blank');
    }
  };

  const handleQuickOrder = () => {
    setOpenDialog('order');
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      // Qui andrà la logica per salvare la nota
      const newNote = {
        id: Date.now(),
        text: noteText,
        data: new Date().toISOString(),
        utente: 'Utente Corrente', // Da sostituire con l'utente reale
      };
      
      // Simulazione salvataggio
      console.log('Nuova nota:', newNote);
      
      setNoteText('');
      setOpenDialog('');
      setSnackbar({
        open: true,
        message: 'Nota aggiunta con successo',
        severity: 'success',
      });
    }
  };

  const handlePaymentRegistration = () => {
    if (paymentData.importo && paymentData.importo > 0) {
      // Qui andrà la logica per registrare il pagamento
      console.log('Registrazione pagamento:', paymentData);
      
      setPaymentData({
        importo: '',
        metodo: 'contanti',
        data: new Date().toISOString().split('T')[0],
        note: '',
      });
      setOpenDialog('');
      setSnackbar({
        open: true,
        message: 'Pagamento registrato con successo',
        severity: 'success',
      });
    }
  };

  const handleOrderSubmit = () => {
    // Qui andrà la logica per creare l'ordine rapido
    console.log('Nuovo ordine rapido:', orderData);
    
    setOrderData({
      prodotti: [],
      dataConsegna: '',
      note: '',
    });
    setOpenDialog('');
    setSnackbar({
      open: true,
      message: 'Ordine creato con successo',
      severity: 'success',
    });
  };

  const quickActions = [
    {
      icon: <PhoneIcon />,
      label: 'Chiama',
      color: 'primary',
      onClick: handlePhoneCall,
      disabled: !cliente.telefono,
    },
    {
      icon: <EmailIcon />,
      label: 'Email',
      color: 'primary',
      onClick: handleEmail,
      disabled: !cliente.email,
    },
    {
      icon: <MessageIcon />,
      label: 'WhatsApp',
      color: 'success',
      onClick: handleWhatsApp,
      disabled: !cliente.telefono,
    },
    {
      icon: <OrderIcon />,
      label: 'Ordine Rapido',
      color: 'warning',
      onClick: handleQuickOrder,
    },
    {
      icon: <NoteIcon />,
      label: 'Aggiungi Nota',
      color: 'info',
      onClick: () => setOpenDialog('note'),
    },
    {
      icon: <PaymentIcon />,
      label: 'Registra Pagamento',
      color: 'success',
      onClick: () => setOpenDialog('payment'),
    },
  ];

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Azioni Rapide
          </Typography>
          
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={6} sm={4} md={2} key={index}>
                <Tooltip title={action.label}>
                  <Button
                    variant="outlined"
                    color={action.color}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    startIcon={action.icon}
                    fullWidth
                    sx={{ 
                      height: '60px',
                      flexDirection: 'column',
                      fontSize: '0.75rem',
                    }}
                  >
                    {action.label}
                  </Button>
                </Tooltip>
              </Grid>
            ))}
          </Grid>

          {/* Sezione Promemoria */}
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Promemoria Attivi
            </Typography>
            <List dense>
              {cliente.promemoria?.filter(p => !p.completato).map((promemoria) => (
                <ListItem key={promemoria.id}>
                  <ListItemIcon>
                    <ScheduleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={promemoria.titolo}
                    secondary={new Date(promemoria.data).toLocaleDateString('it-IT')}
                  />
                  <Chip
                    label={promemoria.tipo}
                    size="small"
                    color={promemoria.priorita === 'alta' ? 'error' : 'default'}
                  />
                </ListItem>
              ))}
              {(!cliente.promemoria || cliente.promemoria.filter(p => !p.completato).length === 0) && (
                <ListItem>
                  <ListItemText
                    primary="Nessun promemoria attivo"
                    secondary="Aggiungi un promemoria per questo cliente"
                  />
                </ListItem>
              )}
            </List>
          </Box>

          {/* Sezione Azioni Recenti */}
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Attività Recenti
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <OrderIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Ordine #1234"
                  secondary="2 giorni fa - €150.00"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Chiamata effettuata"
                  secondary="5 giorni fa - Durata: 5 min"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PaymentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Pagamento ricevuto"
                  secondary="1 settimana fa - €200.00"
                />
              </ListItem>
            </List>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog per aggiungere nota */}
      <Dialog open={openDialog === 'note'} onClose={() => setOpenDialog('')}>
        <DialogTitle>Aggiungi Nota</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nota"
            fullWidth
            multiline
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog('')}>Annulla</Button>
          <Button onClick={handleAddNote} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per registrare pagamento */}
      <Dialog open={openDialog === 'payment'} onClose={() => setOpenDialog('')}>
        <DialogTitle>Registra Pagamento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Importo"
                type="number"
                fullWidth
                value={paymentData.importo}
                onChange={(e) => setPaymentData({ ...paymentData, importo: e.target.value })}
                InputProps={{
                  startAdornment: '€',
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Metodo di Pagamento</InputLabel>
                <Select
                  value={paymentData.metodo}
                  onChange={(e) => setPaymentData({ ...paymentData, metodo: e.target.value })}
                  label="Metodo di Pagamento"
                >
                  <MenuItem value="contanti">Contanti</MenuItem>
                  <MenuItem value="carta">Carta</MenuItem>
                  <MenuItem value="bonifico">Bonifico</MenuItem>
                  <MenuItem value="assegno">Assegno</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Data"
                type="date"
                fullWidth
                value={paymentData.data}
                onChange={(e) => setPaymentData({ ...paymentData, data: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Note"
                fullWidth
                multiline
                rows={2}
                value={paymentData.note}
                onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog('')}>Annulla</Button>
          <Button onClick={handlePaymentRegistration} variant="contained">
            Registra
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AzioniRapide;