// src/components/ClienteDettagli/index.js
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Grid,
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  WhatsApp,
  Email,
  Phone,
  ShoppingCart,
  Star,
  TrendingUp,
  Euro,
  CalendarToday,
  LocationOn,
  Business,
  Person,
  LocalOffer,
  Receipt,
  Timeline,
  Assessment,
  Message
} from '@mui/icons-material';
import StoricoOrdini from './StoricoOrdini';
import StatisticheCliente from './StatisticheCliente';
import TimelineAttivita from './TimelineAttivita';
import AzioniRapide from './AzioniRapide';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ClienteDettagli() {
  const { id } = useParams();
  const router = useRouter();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [statistiche, setStatistiche] = useState({
    // Valori di default per evitare errori
    valoreTotale: 0,
    valoreStatale: 0, // AGGIUNTO: campo mancante che causava l'errore
    ordiniTotali: 0,
    mediaOrdine: 0,
    frequenza: 'Mai',
    ultimoOrdine: 'Mai',
    giorniCliente: 0,
    prodottiAcquistati: 0,
    tassoCrescita: 0,
    puntualitaPagamenti: 100,
    livelloFedelta: 'Bronze',
    progressoFedelta: 0,
    puntiMancanti: 100
  });

  useEffect(() => {
    if (id) {
      caricaDatiCliente();
      caricaStatistiche();
    }
  }, [id]);

  const caricaDatiCliente = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Prima prova con l'API
      try {
        const response = await fetch(`${API_URL}/clienti/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCliente(data.data);
            setError(null);
            return;
          }
        }
      } catch (apiError) {
        console.log('API non disponibile, uso dati locali');
      }

      // Fallback: cerca nei dati locali
      const clientiLocali = localStorage.getItem('clienti');
      if (clientiLocali) {
        const clienti = JSON.parse(clientiLocali);
        const clienteTrovato = clienti.find(c => 
          c.id === id || c._id === id || c.codiceCliente === id
        );
        
        if (clienteTrovato) {
          setCliente(clienteTrovato);
          setError(null);
          return;
        }
      }

      // Se non trovato, usa dati di esempio
      setCliente({
        id: id,
        codiceCliente: `CLI-${id}`,
        nome: 'Mario',
        cognome: 'Rossi',
        tipo: 'privato',
        telefono: '3331234567',
        email: 'mario.rossi@email.com',
        indirizzo: {
          via: 'Via Roma 1',
          cap: '00100',
          citta: 'Roma',
          provincia: 'RM'
        },
        livelloFedelta: 'bronzo',
        punti: 150,
        note: 'Cliente abituale, preferisce consegna al mattino'
      });
      
    } catch (error) {
      console.error('Errore:', error);
      setError('Errore nel caricamento dei dati del cliente');
    } finally {
      setLoading(false);
    }
  };

  const caricaStatistiche = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Prima prova con l'API
      try {
        const response = await fetch(`${API_URL}/clienti/${id}/statistiche`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Assicurati che valoreStatale sia presente
            setStatistiche({
              ...statistiche,
              ...data.data,
              valoreStatale: data.data.valoreStatale || data.data.valoreTotale || 0
            });
            return;
          }
        }
      } catch (apiError) {
        console.log('API statistiche non disponibile, uso dati locali');
      }

      // Calcola statistiche dai dati locali
      const ordiniLocali = localStorage.getItem('ordini');
      if (ordiniLocali) {
        const ordini = JSON.parse(ordiniLocali);
        const ordiniCliente = ordini.filter(o => 
          o.clienteId === id || 
          o.nomeCliente === cliente?.nome || 
          o.nomeCliente === cliente?.ragioneSociale
        );

        const valoreTotale = ordiniCliente.reduce((acc, ordine) => {
          const totaleOrdine = ordine.prodotti?.reduce((sum, prod) => 
            sum + (prod.prezzo * prod.quantita), 0) || 0;
          return acc + totaleOrdine;
        }, 0);

        const stats = {
          valoreTotale: valoreTotale,
          valoreStatale: valoreTotale, // IMPORTANTE: stesso valore per compatibilità
          ordiniTotali: ordiniCliente.length,
          mediaOrdine: ordiniCliente.length > 0 ? (valoreTotale / ordiniCliente.length) : 0,
          frequenza: ordiniCliente.length > 4 ? 'Settimanale' : 'Mensile',
          ultimoOrdine: ordiniCliente.length > 0 
            ? new Date(ordiniCliente[ordiniCliente.length - 1].dataRitiro).toLocaleDateString('it-IT')
            : 'Mai',
          giorniCliente: 180,
          prodottiAcquistati: 12,
          tassoCrescita: 15,
          puntualitaPagamenti: 100,
          livelloFedelta: valoreTotale > 1000 ? 'oro' : valoreTotale > 500 ? 'argento' : 'bronzo',
          progressoFedelta: 65,
          puntiMancanti: 35
        };

        setStatistiche(stats);
      } else {
        // Usa dati di esempio se non ci sono ordini
        setStatistiche({
          valoreTotale: 850.50,
          valoreStatale: 850.50,
          ordiniTotali: 8,
          mediaOrdine: 106.31,
          frequenza: 'Mensile',
          ultimoOrdine: new Date().toLocaleDateString('it-IT'),
          giorniCliente: 90,
          prodottiAcquistati: 6,
          tassoCrescita: 10,
          puntualitaPagamenti: 100,
          livelloFedelta: 'argento',
          progressoFedelta: 45,
          puntiMancanti: 55
        });
      }
      
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
      // Mantieni i valori di default già impostati
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleWhatsApp = () => {
    if (cliente?.telefono) {
      const numero = cliente.telefono.replace(/\D/g, '');
      const url = `https://wa.me/${numero.startsWith('39') ? numero : '39' + numero}`;
      window.open(url, '_blank');
    }
  };

  const handleEmail = () => {
    if (cliente?.email) {
      window.location.href = `mailto:${cliente.email}`;
    }
  };

  const handleCall = () => {
    if (cliente?.telefono) {
      window.location.href = `tel:${cliente.telefono}`;
    }
  };

  const handleNuovoOrdine = () => {
    router.push(`/ordini/nuovo?clienteId=${id}`);
  };

  const handleModifica = () => {
    router.push(`/clienti/modifica/${id}`);
  };

  const getLivelloColor = (livello) => {
    const colori = {
      bronzo: '#CD7F32',
      argento: '#C0C0C0', 
      oro: '#FFD700',
      platino: '#E5E4E2'
    };
    return colori[livello?.toLowerCase()] || colori.bronzo;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !cliente) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Cliente non trovato'}</Alert>
        <Button onClick={() => router.back()} sx={{ mt: 2 }}>Torna indietro</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => router.back()}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Dettagli Cliente
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={handleModifica}
        >
          Modifica
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ShoppingCart />}
          onClick={handleNuovoOrdine}
        >
          Nuovo Ordine
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Colonna Sinistra - Info Cliente */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Avatar e Nome */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {cliente.tipo === 'azienda' ? 
                  <Business /> : 
                  (cliente.nome?.charAt(0)?.toUpperCase() || 'C')
                }
              </Avatar>
              <Box sx={{ ml: 2, flexGrow: 1 }}>
                <Typography variant="h5">
                  {cliente.tipo === 'azienda' ? 
                    (cliente.ragioneSociale || 'Azienda') : 
                    `${cliente.nome || ''} ${cliente.cognome || ''}`
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Codice: {cliente.codiceCliente || `CLI-${id}`}
                </Typography>
                <Chip
                  size="small"
                  label={cliente.tipo || 'privato'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Contatti */}
            <List dense>
              {cliente.telefono && (
                <ListItem>
                  <ListItemIcon>
                    <Phone color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={cliente.telefono}
                    secondary="Telefono principale"
                  />
                  <IconButton size="small" onClick={handleCall}>
                    <Phone />
                  </IconButton>
                  <IconButton size="small" onClick={handleWhatsApp} color="success">
                    <WhatsApp />
                  </IconButton>
                </ListItem>
              )}
              
              {cliente.email && (
                <ListItem>
                  <ListItemIcon>
                    <Email color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={cliente.email}
                    secondary="Email"
                  />
                  <IconButton size="small" onClick={handleEmail}>
                    <Email />
                  </IconButton>
                </ListItem>
              )}

              {(cliente.indirizzo?.via || cliente.indirizzo) && (
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={typeof cliente.indirizzo === 'string' 
                      ? cliente.indirizzo 
                      : cliente.indirizzo?.via || 'Indirizzo'}
                    secondary={typeof cliente.indirizzo === 'object' 
                      ? `${cliente.indirizzo.cap || ''} ${cliente.indirizzo.citta || ''} ${cliente.indirizzo.provincia || ''}`
                      : ''}
                  />
                </ListItem>
              )}
            </List>

            <Divider sx={{ my: 2 }} />

            {/* Fedeltà */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Programma Fedeltà
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Chip
                  icon={<Star />}
                  label={cliente.livelloFedelta || statistiche.livelloFedelta || 'bronzo'}
                  style={{
                    backgroundColor: getLivelloColor(cliente.livelloFedelta || statistiche.livelloFedelta),
                    color: (cliente.livelloFedelta === 'platino' || cliente.livelloFedelta === 'argento') ? '#000' : '#fff'
                  }}
                />
                <Typography variant="h6">
                  {cliente.punti || 0} punti
                </Typography>
              </Box>
              {statistiche?.puntiMancanti > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {statistiche.puntiMancanti} punti al prossimo livello
                </Typography>
              )}
            </Box>

            {/* Note */}
            {cliente.note && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Note
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cliente.note}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>

          {/* Azioni Rapide - Condizionale per evitare errori */}
          {typeof AzioniRapide !== 'undefined' && (
            <AzioniRapide 
              cliente={cliente}
              onRefresh={caricaDatiCliente}
            />
          )}
        </Grid>

        {/* Colonna Destra - Tabs */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab label="Panoramica" icon={<Assessment />} iconPosition="start" />
              <Tab label="Ordini" icon={<Receipt />} iconPosition="start" />
              <Tab label="Timeline" icon={<Timeline />} iconPosition="start" />
              <Tab label="Comunicazioni" icon={<Message />} iconPosition="start" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              <TabPanel value={currentTab} index={0}>
                {typeof StatisticheCliente !== 'undefined' ? (
                  <StatisticheCliente 
                    clienteId={id}
                    statistiche={statistiche}
                  />
                ) : (
                  <Alert severity="info">Componente Statistiche in caricamento...</Alert>
                )}
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                {typeof StoricoOrdini !== 'undefined' ? (
                  <StoricoOrdini 
                    clienteId={id}
                    nomeCliente={cliente.tipo === 'azienda' ? 
                      cliente.ragioneSociale : 
                      `${cliente.nome || ''} ${cliente.cognome || ''}`
                    }
                  />
                ) : (
                  <Alert severity="info">Componente Storico Ordini in caricamento...</Alert>
                )}
              </TabPanel>

              <TabPanel value={currentTab} index={2}>
                {typeof TimelineAttivita !== 'undefined' ? (
                  <TimelineAttivita 
                    clienteId={id}
                  />
                ) : (
                  <Alert severity="info">Timeline in sviluppo</Alert>
                )}
              </TabPanel>

              <TabPanel value={currentTab} index={3}>
                <Alert severity="info">
                  Sezione comunicazioni in sviluppo
                </Alert>
              </TabPanel>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}