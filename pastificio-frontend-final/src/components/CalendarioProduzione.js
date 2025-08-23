// components/CalendarioProduzione.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, Grid, Button, 
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, Card, CardContent, Alert, Snackbar, CircularProgress,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  ToggleButton, ToggleButtonGroup, Divider, Badge
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,  // <-- Cambia Calendar in CalendarMonth
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as DeliveryIcon,
  CleaningServices as CleanIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  NavigateBefore,
  NavigateNext,
  Today as TodayIcon,
  ViewWeek as WeekIcon,
  ViewModule as MonthIcon
} from '@mui/icons-material';import { format, startOfWeek, endOfWeek, eachDayOfInterval, 
         addDays, isSameDay, startOfMonth, endOfMonth, 
         eachWeekOfInterval, isToday, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';

// Importa il servizio API
import * as api from '../services/api';

const CalendarioProduzione = ({ ordini = [] }) => {
  // Stati
  const [eventi, setEventi] = useState([]);
  const [vistaCorrente, setVistaCorrente] = useState('settimana');
  const [dataCorrente, setDataCorrente] = useState(new Date());
  const [eventoSelezionato, setEventoSelezionato] = useState(null);
  const [dialogoAperto, setDialogoAperto] = useState(false);
  const [caricamento, setCaricamento] = useState(false);
  const [notifica, setNotifica] = useState({ aperta: false, messaggio: '', tipo: 'info' });

  // Form stato per nuovo evento
  const [nuovoEvento, setNuovoEvento] = useState({
    tipo: 'produzione',
    titolo: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    ora: '08:00',
    durata: 2,
    note: '',
    completato: false
  });

  // Carica eventi al mount
  useEffect(() => {
    caricaEventi();
  }, []);

  // Carica eventi dal backend
  const caricaEventi = async () => {
    setCaricamento(true);
    try {
      // Per ora usiamo eventi locali, poi integreremo con il backend
      const eventiSalvati = localStorage.getItem('eventiCalendario');
      if (eventiSalvati) {
        setEventi(JSON.parse(eventiSalvati));
      }
      
      // Aggiungi ordini come eventi
      const eventiOrdini = ordini.map(ordine => ({
        id: `ordine-${ordine._id}`,
        tipo: 'consegna',
        titolo: `Ordine: ${ordine.nomeCliente}`,
        data: ordine.dataRitiro,
        ora: ordine.oraRitiro || '10:00',
        durata: 1,
        note: `Tel: ${ordine.telefono}`,
        completato: ordine.stato === 'completato',
        ordineId: ordine._id
      }));
      
      setEventi(prev => [...prev.filter(e => !e.ordineId), ...eventiOrdini]);
    } catch (error) {
      mostraNotifica('Errore nel caricamento eventi', 'error');
    } finally {
      setCaricamento(false);
    }
  };

  // Salva eventi
  const salvaEventi = (nuoviEventi) => {
    localStorage.setItem('eventiCalendario', JSON.stringify(nuoviEventi));
    setEventi(nuoviEventi);
  };

  // Mostra notifica
  const mostraNotifica = (messaggio, tipo = 'info') => {
    setNotifica({ aperta: true, messaggio, tipo });
  };

  // Gestione eventi
  const aggiungiEvento = () => {
    const evento = {
      ...nuovoEvento,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const nuoviEventi = [...eventi, evento];
    salvaEventi(nuoviEventi);
    
    setDialogoAperto(false);
    resetForm();
    mostraNotifica('Evento aggiunto con successo', 'success');
  };

  const modificaEvento = () => {
    const nuoviEventi = eventi.map(e => 
      e.id === eventoSelezionato.id ? { ...nuovoEvento, id: e.id } : e
    );
    salvaEventi(nuoviEventi);
    
    setDialogoAperto(false);
    setEventoSelezionato(null);
    resetForm();
    mostraNotifica('Evento modificato con successo', 'success');
  };

  const eliminaEvento = (eventoId) => {
    if (window.confirm('Confermi l\'eliminazione?')) {
      const nuoviEventi = eventi.filter(e => e.id !== eventoId);
      salvaEventi(nuoviEventi);
      mostraNotifica('Evento eliminato', 'info');
    }
  };

  const toggleCompletato = (eventoId) => {
    const nuoviEventi = eventi.map(e => 
      e.id === eventoId ? { ...e, completato: !e.completato } : e
    );
    salvaEventi(nuoviEventi);
  };

  const resetForm = () => {
    setNuovoEvento({
      tipo: 'produzione',
      titolo: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      ora: '08:00',
      durata: 2,
      note: '',
      completato: false
    });
  };

  // Helpers per il calendario
  const getEventiGiorno = (data) => {
    return eventi.filter(e => isSameDay(new Date(e.data), data));
  };

  const getColoreEvento = (tipo) => {
    const colori = {
      produzione: '#2196f3',
      consegna: '#4caf50',
      pulizia: '#ff9800',
      altro: '#9c27b0'
    };
    return colori[tipo] || '#757575';
  };

  const getIconaEvento = (tipo) => {
    const icone = {
      produzione: <OrderIcon />,
      consegna: <DeliveryIcon />,
      pulizia: <CleanIcon />,
      altro: <CalendarIcon />
    };
    return icone[tipo] || <CalendarIcon />;
  };

  // Calcola carico di lavoro
  const calcolaCaricoGiorno = (data) => {
    const eventiGiorno = getEventiGiorno(data);
    const oreTotali = eventiGiorno.reduce((tot, e) => tot + (e.durata || 0), 0);
    const maxOre = 8;
    return {
      ore: oreTotali,
      percentuale: Math.min((oreTotali / maxOre) * 100, 100),
      sovraccarico: oreTotali > maxOre
    };
  };

  // Renderizza viste calendario
  const renderVistaGiorno = () => {
    const eventiOggi = getEventiGiorno(dataCorrente);
    const carico = calcolaCaricoGiorno(dataCorrente);

    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {format(dataCorrente, 'EEEE d MMMM yyyy', { locale: it })}
          </Typography>
          <Chip 
            label={`${carico.ore}h / 8h`}
            color={carico.sovraccarico ? 'error' : 'primary'}
            icon={carico.sovraccarico ? <WarningIcon /> : <TimeIcon />}
          />
        </Box>

        {eventiOggi.length === 0 ? (
          <Alert severity="info">Nessun evento programmato per oggi</Alert>
        ) : (
          <List>
            {eventiOggi.sort((a, b) => a.ora.localeCompare(b.ora)).map(evento => (
              <Card key={evento.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: getColoreEvento(evento.tipo) }}>
                        {getIconaEvento(evento.tipo)}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          textDecoration: evento.completato ? 'line-through' : 'none' 
                        }}>
                          {evento.ora} - {evento.titolo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Durata: {evento.durata}h
                        </Typography>
                        {evento.note && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {evento.note}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box>
                      <IconButton 
                        size="small"
                        onClick={() => toggleCompletato(evento.id)}
                        color={evento.completato ? 'success' : 'default'}
                      >
                        <CheckIcon />
                      </IconButton>
                      {!evento.ordineId && (
                        <>
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setEventoSelezionato(evento);
                              setNuovoEvento(evento);
                              setDialogoAperto(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => eliminaEvento(evento.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </Paper>
    );
  };

  const renderVistaSettimana = () => {
    const inizioSettimana = startOfWeek(dataCorrente, { locale: it });
    const fineSettimana = endOfWeek(dataCorrente, { locale: it });
    const giorniSettimana = eachDayOfInterval({ start: inizioSettimana, end: fineSettimana });

    return (
      <Grid container spacing={1}>
        {giorniSettimana.map(giorno => {
          const eventiGiorno = getEventiGiorno(giorno);
          const carico = calcolaCaricoGiorno(giorno);
          const isOggi = isToday(giorno);

          return (
            <Grid item xs={12} sm={6} md={1.7} key={giorno.toISOString()}>
              <Paper 
                sx={{ 
                  p: 2, 
                  minHeight: 150,
                  bgcolor: isOggi ? 'primary.light' : 'background.paper',
                  border: isOggi ? 2 : 1,
                  borderColor: isOggi ? 'primary.main' : 'divider',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => {
                  setDataCorrente(giorno);
                  setVistaCorrente('giorno');
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {format(giorno, 'EEE d', { locale: it })}
                </Typography>
                
                {carico.ore > 0 && (
                  <Chip 
                    size="small"
                    label={`${carico.ore}h`}
                    color={carico.sovraccarico ? 'error' : 'default'}
                    sx={{ mt: 1, mb: 1 }}
                  />
                )}

                <Box sx={{ mt: 1 }}>
                  {eventiGiorno.slice(0, 3).map(evento => (
                    <Box 
                      key={evento.id}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        mb: 0.5
                      }}
                    >
                      <Box sx={{ 
                        width: 4, 
                        height: 4, 
                        borderRadius: '50%',
                        bgcolor: getColoreEvento(evento.tipo) 
                      }} />
                      <Typography variant="caption" noWrap>
                        {evento.ora} {evento.titolo}
                      </Typography>
                    </Box>
                  ))}
                  {eventiGiorno.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{eventiGiorno.length - 3} altri
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderVistaMese = () => {
    const inizioMese = startOfMonth(dataCorrente);
    const fineMese = endOfMonth(dataCorrente);
    const settimane = eachWeekOfInterval({ start: inizioMese, end: fineMese }, { locale: it });

    return (
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={1}>
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(giorno => (
            <Grid item xs={1.7} key={giorno}>
              <Typography variant="subtitle2" align="center" fontWeight="bold">
                {giorno}
              </Typography>
            </Grid>
          ))}
        </Grid>
        
        {settimane.map((settimana, i) => (
          <Grid container spacing={1} key={i} sx={{ mt: 1 }}>
            {eachDayOfInterval({ 
              start: settimana, 
              end: addDays(settimana, 6) 
            }).map(giorno => {
              const eventiGiorno = getEventiGiorno(giorno);
              const isOggi = isToday(giorno);
              const isMeseCorrente = giorno.getMonth() === dataCorrente.getMonth();

              return (
                <Grid item xs={1.7} key={giorno.toISOString()}>
                  <Paper
                    sx={{
                      p: 1,
                      minHeight: 80,
                      opacity: isMeseCorrente ? 1 : 0.5,
                      bgcolor: isOggi ? 'primary.light' : 'background.paper',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => {
                      setDataCorrente(giorno);
                      setVistaCorrente('giorno');
                    }}
                  >
                    <Typography variant="caption" fontWeight={isOggi ? 'bold' : 'normal'}>
                      {format(giorno, 'd')}
                    </Typography>
                    
                    {eventiGiorno.length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Badge badgeContent={eventiGiorno.length} color="primary">
                          <Box sx={{ width: 20, height: 20 }} />
                        </Badge>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        ))}
      </Paper>
    );
  };

  // Navigazione
  const navigaData = (direzione) => {
    const incremento = vistaCorrente === 'giorno' ? 1 : 
                      vistaCorrente === 'settimana' ? 7 : 30;
    
    setDataCorrente(prev => 
      direzione === 'avanti' 
        ? addDays(prev, incremento)
        : addDays(prev, -incremento)
    );
  };

  if (caricamento) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4">
            Calendario Produzione
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Selettore vista */}
            <ToggleButtonGroup
              value={vistaCorrente}
              exclusive
              onChange={(e, newVista) => newVista && setVistaCorrente(newVista)}
              size="small"
            >
              <ToggleButton value="giorno">
                <TodayIcon sx={{ mr: 1 }} />
                Giorno
              </ToggleButton>
              <ToggleButton value="settimana">
                <WeekIcon sx={{ mr: 1 }} />
                Settimana
              </ToggleButton>
              <ToggleButton value="mese">
                <MonthIcon sx={{ mr: 1 }} />
                Mese
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Navigazione data */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => navigaData('indietro')}>
                <NavigateBefore />
              </IconButton>
              
              <Button
                variant="outlined"
                onClick={() => setDataCorrente(new Date())}
              >
                Oggi
              </Button>
              
              <IconButton onClick={() => navigaData('avanti')}>
                <NavigateNext />
              </IconButton>
            </Box>

            {/* Nuovo evento */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setEventoSelezionato(null);
                setDialogoAperto(true);
              }}
            >
              Nuovo Evento
            </Button>
          </Box>
        </Box>

        {/* Data corrente */}
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          {vistaCorrente === 'giorno' && format(dataCorrente, 'EEEE d MMMM yyyy', { locale: it })}
          {vistaCorrente === 'settimana' && `Settimana del ${format(startOfWeek(dataCorrente, { locale: it }), 'd MMMM', { locale: it })}`}
          {vistaCorrente === 'mese' && format(dataCorrente, 'MMMM yyyy', { locale: it })}
        </Typography>
      </Paper>

      {/* Vista calendario */}
      <Box>
        {vistaCorrente === 'giorno' && renderVistaGiorno()}
        {vistaCorrente === 'settimana' && renderVistaSettimana()}
        {vistaCorrente === 'mese' && renderVistaMese()}
      </Box>

      {/* Dialog nuovo/modifica evento */}
      <Dialog 
        open={dialogoAperto} 
        onClose={() => setDialogoAperto(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {eventoSelezionato ? 'Modifica Evento' : 'Nuovo Evento'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo Evento</InputLabel>
              <Select
                value={nuovoEvento.tipo}
                onChange={(e) => setNuovoEvento({ ...nuovoEvento, tipo: e.target.value })}
                label="Tipo Evento"
              >
                <MenuItem value="produzione">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <OrderIcon sx={{ color: getColoreEvento('produzione') }} />
                    Produzione
                  </Box>
                </MenuItem>
                <MenuItem value="consegna">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DeliveryIcon sx={{ color: getColoreEvento('consegna') }} />
                    Consegna
                  </Box>
                </MenuItem>
                <MenuItem value="pulizia">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CleanIcon sx={{ color: getColoreEvento('pulizia') }} />
                    Pulizia
                  </Box>
                </MenuItem>
                <MenuItem value="altro">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ color: getColoreEvento('altro') }} />
                    Altro
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Titolo"
              value={nuovoEvento.titolo}
              onChange={(e) => setNuovoEvento({ ...nuovoEvento, titolo: e.target.value })}
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data"
                  value={nuovoEvento.data}
                  onChange={(e) => setNuovoEvento({ ...nuovoEvento, data: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Ora"
                  value={nuovoEvento.ora}
                  onChange={(e) => setNuovoEvento({ ...nuovoEvento, ora: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              type="number"
              label="Durata (ore)"
              value={nuovoEvento.durata}
              onChange={(e) => setNuovoEvento({ ...nuovoEvento, durata: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0.5, max: 24, step: 0.5 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Note"
              value={nuovoEvento.note}
              onChange={(e) => setNuovoEvento({ ...nuovoEvento, note: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAperto(false)}>
            Annulla
          </Button>
          <Button 
            variant="contained"
            onClick={eventoSelezionato ? modificaEvento : aggiungiEvento}
            disabled={!nuovoEvento.titolo || !nuovoEvento.data}
          >
            {eventoSelezionato ? 'Modifica' : 'Aggiungi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar notifiche */}
      <Snackbar
        open={notifica.aperta}
        autoHideDuration={6000}
        onClose={() => setNotifica({ ...notifica, aperta: false })}
      >
        <Alert 
          onClose={() => setNotifica({ ...notifica, aperta: false })} 
          severity={notifica.tipo}
        >
          {notifica.messaggio}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CalendarioProduzione;