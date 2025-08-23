// src/components/DettaglioCliente.js
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Phone,
  Email,
  LocationOn,
  Star,
  ShoppingCart,
  CardGiftcard,
  History,
  TrendingUp,
  Receipt,
  LocalOffer
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function DettaglioCliente() {
  const { id } = useParams();
  const router = useRouter();
  const [cliente, setCliente] = useState(null);
  const [ordini, setOrdini] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openPuntiDialog, setOpenPuntiDialog] = useState(false);
  const [puntiDaAggiungere, setPuntiDaAggiungere] = useState('');
  const [motivoPunti, setMotivoPunti] = useState('');

  useEffect(() => {
    caricaCliente();
    caricaOrdiniCliente();
  }, [id]);

  const caricaCliente = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clienti/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCliente(data.cliente);
      }
    } catch (error) {
      console.error('Errore caricamento cliente:', error);
    }
    setLoading(false);
  };

  const caricaOrdiniCliente = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clienti/${id}/ordini`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrdini(data.ordini || []);
      }
    } catch (error) {
      console.error('Errore caricamento ordini:', error);
    }
  };

  const handleAggiungiPunti = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clienti/${id}/punti`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          punti: parseInt(puntiDaAggiungere),
          motivo: motivoPunti
        })
      });

      if (response.ok) {
        setOpenPuntiDialog(false);
        setPuntiDaAggiungere('');
        setMotivoPunti('');
        caricaCliente();
      }
    } catch (error) {
      console.error('Errore aggiunta punti:', error);
    }
  };

  const getLivelloProgressBar = () => {
    if (!cliente) return 0;
    
    const livelli = {
      bronzo: { min: 0, max: 199 },
      argento: { min: 200, max: 499 },
      oro: { min: 500, max: 999 },
      platino: { min: 1000, max: 9999 }
    };

    const livello = livelli[cliente.livelloFedelta];
    if (!livello) return 0;

    const progress = ((cliente.punti - livello.min) / (livello.max - livello.min)) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return <Typography>Caricamento...</Typography>;
  }

  if (!cliente) {
    return <Typography>Cliente non trovato</Typography>;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/clienti')}
        >
          Torna alla lista
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Info Cliente */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">
                  {cliente.tipo === 'azienda' ? cliente.ragioneSociale : `${cliente.nome} ${cliente.cognome}`}
                </Typography>
                <IconButton onClick={() => router.push(`/clienti/modifica/${id}`)}>
                  <Edit />
                </IconButton>
              </Box>

              <List>
                {cliente.telefono && (
                  <ListItem>
                    <Phone sx={{ mr: 2 }} />
                    <ListItemText primary={cliente.telefono} />
                  </ListItem>
                )}
                {cliente.email && (
                  <ListItem>
                    <Email sx={{ mr: 2 }} />
                    <ListItemText primary={cliente.email} />
                  </ListItem>
                )}
                {cliente.indirizzo?.via && (
                  <ListItem>
                    <LocationOn sx={{ mr: 2 }} />
                    <ListItemText 
                      primary={cliente.indirizzo.via}
                      secondary={`${cliente.indirizzo.cap} ${cliente.indirizzo.citta}`}
                    />
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 2 }} />

              {/* Programma Fedeltà */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Programma Fedeltà
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <Star color="primary" />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {cliente.punti} punti
                  </Typography>
                  <Chip 
                    label={cliente.livelloFedelta} 
                    size="small" 
                    sx={{ ml: 'auto' }}
                    color="primary"
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={getLivelloProgressBar()} 
                  sx={{ mb: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setOpenPuntiDialog(true)}
                  fullWidth
                >
                  Aggiungi Punti
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistiche */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <ShoppingCart color="primary" />
                    <Box ml={2}>
                      <Typography variant="h4">
                        {cliente.statistiche?.numeroOrdini || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Ordini Totali
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Receipt color="primary" />
                    <Box ml={2}>
                      <Typography variant="h4">
                        €{(cliente.statistiche?.totaleSpeso || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Totale Speso
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <TrendingUp color="primary" />
                    <Box ml={2}>
                      <Typography variant="h4">
                        €{(cliente.statistiche?.mediaOrdine || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Media Ordine
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ mt: 3 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Ordini Recenti" />
              <Tab label="Prodotti Preferiti" />
              <Tab label="Note" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Ordine</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Totale</TableCell>
                      <TableCell>Stato</TableCell>
                      <TableCell>Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ordini.map((ordine) => (
                      <TableRow key={ordine._id}>
                        <TableCell>{ordine.numeroOrdine}</TableCell>
                        <TableCell>
                          {new Date(ordine.dataRitiro).toLocaleDateString()}
                        </TableCell>
                        <TableCell>€{ordine.totale.toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            label={ordine.stato}
                            size="small"
                            color={ordine.stato === 'consegnato' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => router.push(`/ordini/${ordine._id}`)}
                          >
                            Dettagli
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography>Funzionalità in sviluppo</Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography>{cliente.note || 'Nessuna nota'}</Typography>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog Aggiungi Punti */}
      <Dialog open={openPuntiDialog} onClose={() => setOpenPuntiDialog(false)}>
        <DialogTitle>Aggiungi Punti Fedeltà</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Punti da aggiungere"
            value={puntiDaAggiungere}
            onChange={(e) => setPuntiDaAggiungere(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Motivo"
            value={motivoPunti}
            onChange={(e) => setMotivoPunti(e.target.value)}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPuntiDialog(false)}>Annulla</Button>
          <Button onClick={handleAggiungiPunti} variant="contained">
            Aggiungi
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DettaglioCliente;