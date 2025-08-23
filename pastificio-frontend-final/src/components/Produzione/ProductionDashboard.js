// components/Produzione/ProductionDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Typography, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Tab,
  Tabs,
  TextField,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Restaurant as RestaurantIcon,
  EventNote as EventNoteIcon,
  More as MoreIcon,
  Print as PrintIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  AddShoppingCart as AddShoppingCartIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { Chart } from 'react-chartjs-2';
import axios from 'axios';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, isWithinInterval } from 'date-fns';
import { it } from 'date-fns/locale';

import StatCard from '../common/StatCard';
import LoadingOverlay from '../common/LoadingOverlay';
import ErrorDisplay from '../common/ErrorDisplay';
import notificationService from '../../services/notificationService';

// Componente dashboard per la produzione
const ProductionDashboard = ({ onNotify }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    produzioni: { oggi: 0, settimana: 0, mese: 0 },
    ricette: { totale: 0, attive: 0, perCategoria: [] },
    ingredienti: { sottoSoglia: [] },
    pianiProduzione: { oggi: [], settimana: [] }
  });
  const [date, setDate] = useState(new Date());
  const [timeframeTab, setTimeframeTab] = useState(0);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Array per le opzioni di timeframe
  const timeframes = [
    { label: 'Oggi', value: 'day' },
    { label: 'Questa settimana', value: 'week' },
    { label: 'Questo mese', value: 'month' },
  ];

  useEffect(() => {
    fetchData();
  }, [timeframeTab, date]);

  // Funzione per caricare i dati con la timeframe corretta
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    // Calcola il range di date in base al timeframe selezionato
    const now = new Date();
    let startDate, endDate;
    
    switch (timeframes[timeframeTab].value) {
      case 'day':
        startDate = startOfDay(date);
        endDate = endOfDay(date);
        break;
      case 'week':
        startDate = startOfWeek(date, { locale: it });
        endDate = endOfWeek(date, { locale: it });
        break;
      case 'month':
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        break;
      default:
        startDate = startOfDay(date);
        endDate = endOfDay(date);
    }
    
    // Formatta le date per le API
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    try {
      // Fetch parallelo di tutte le statistiche
      const [produzioniRes, ricetteRes, ingredientiRes, pianiProduzioneRes] = await Promise.all([
        axios.get('/api/produzione/statistiche', {
          params: { startDate: startDateStr, endDate: endDateStr }
        }),
        axios.get('/api/produzione/ricette/statistiche'),
        axios.get('/api/magazzino/ingredienti/statistiche', {
          params: { sottoSogliaOnly: true }
        }),
        axios.get('/api/produzione/piani', {
          params: { startDate: startDateStr, endDate: endDateStr }
        })
      ]);
      
      const newStats = {
        produzioni: produzioniRes.data.data,
        ricette: ricetteRes.data.data,
        ingredienti: ingredientiRes.data.data,
        pianiProduzione: pianiProduzioneRes.data.data
      };
      
      setStats(newStats);
      
      // Crea notifiche per ingredienti sotto soglia se ce ne sono e sono necessari per le produzioni di oggi
      if (newStats.ingredienti.sottoSoglia.length > 0) {
        // Identifica produzioni pianificate per oggi
        const oggi = format(new Date(), 'yyyy-MM-dd');
        const produzioniOggi = newStats.pianiProduzione.filter(piano => 
          piano.data === oggi && piano.produzioni.some(p => p.stato !== 'completato')
        );
        
        // Se ci sono produzioni oggi, verifica se gli ingredienti sotto soglia sono necessari
        if (produzioniOggi.length > 0) {
          const ingredientiSottoSogliaIds = newStats.ingredienti.sottoSoglia.map(ing => ing._id);
          const produzioniConIngredientiCritici = produzioniOggi.filter(piano => 
            piano.produzioni.some(prod => 
              prod.ricetta?.ingredienti?.some(ing => ingredientiSottoSogliaIds.includes(ing.ingrediente))
            )
          );
          
          if (produzioniConIngredientiCritici.length > 0) {
            notificationService.createNotification(
              'production_warning',
              'Ingredienti critici per la produzione di oggi',
              `Ci sono ${newStats.ingredienti.sottoSoglia.length} ingredienti sotto soglia necessari per la produzione odierna.`,
              {
                count: newStats.ingredienti.sottoSoglia.length,
                produzioniIds: produzioniConIngredientiCritici.map(p => p._id)
              }
            );
          }
        }
      }
    } catch (err) {
      console.error('Errore nel caricamento delle statistiche:', err);
      setError('Impossibile caricare le statistiche della produzione. Riprova più tardi.');
      
      if (onNotify) {
        onNotify('Errore nel caricamento delle statistiche della produzione', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Gestisce l'apertura del menu delle azioni
  const handleOpenActionMenu = (event) => {
    setActionMenuAnchor(event.currentTarget);
  };

  // Gestisce la chiusura del menu delle azioni
  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
  };
  
  // Gestisce l'apertura del dialogo dei dettagli
  const handleOpenDetailsDialog = () => {
    setDetailsDialogOpen(true);
    handleCloseActionMenu();
  };
  
  // Gestisce la stampa del report di produzione
  const handleStampaReport = () => {
    handleCloseActionMenu();
    
    // Formatta la data corretta in base al timeframe
    let periodo;
    switch (timeframes[timeframeTab].value) {
      case 'day':
        periodo = format(date, 'EEEE d MMMM yyyy', { locale: it });
        break;
      case 'week':
        const startWeek = startOfWeek(date, { locale: it });
        const endWeek = endOfWeek(date, { locale: it });
        periodo = `${format(startWeek, 'd MMMM', { locale: it })} - ${format(endWeek, 'd MMMM yyyy', { locale: it })}`;
        break;
      case 'month':
        periodo = format(date, 'MMMM yyyy', { locale: it });
        break;
    }
    
    // Implementa la logica per stampare il report
    // Esempio: Apri una nuova finestra con il report formattato per la stampa
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
      <html>
        <head>
          <title>Report Produzione - ${periodo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #673ab7; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
            .warning { color: #f44336; }
            .success { color: #4caf50; }
            .footer { margin-top: 30px; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Report Produzione - ${periodo}</h1>
          
          <h2>Riepilogo Produzioni</h2>
          <table>
            <tr>
              <th>Metriche</th>
              <th>Quantità</th>
            </tr>
            <tr>
              <td>Produzioni completate</td>
              <td>${stats.produzioni.completate || 0}</td>
            </tr>
            <tr>
              <td>Produzioni in corso</td>
              <td>${stats.produzioni.inCorso || 0}</td>
            </tr>
            <tr>
              <td>Produzioni pianificate</td>
              <td>${stats.produzioni.pianificate || 0}</td>
            </tr>
            <tr>
              <td>Produzione totale (kg)</td>
              <td>${stats.produzioni.quantitaTotale?.toFixed(2) || 0}</td>
            </tr>
          </table>
          
          <h2>Piani di Produzione</h2>
          <table>
            <tr>
              <th>Data</th>
              <th>Ricetta</th>
              <th>Quantità</th>
              <th>Stato</th>
            </tr>
            ${stats.pianiProduzione.flatMap(piano => 
              piano.produzioni.map(prod => `
                <tr>
                  <td>${format(new Date(piano.data), 'dd/MM/yyyy')}</td>
                  <td>${prod.ricetta?.nome || 'N/D'}</td>
                  <td>${prod.quantitaPianificata} ${prod.ricetta?.resa?.unita || 'pz'}</td>
                  <td class="${prod.stato === 'completato' ? 'success' : prod.stato === 'in_corso' ? 'warning' : ''}">${prod.stato}</td>
                </tr>
              `)
            ).join('')}
          </table>
          
          <h2>Ingredienti sotto soglia (${stats.ingredienti.sottoSoglia?.length || 0})</h2>
          <table>
            <tr>
              <th>Ingrediente</th>
              <th>Categoria</th>
              <th>Scorte attuali</th>
              <th>Scorte minime</th>
              <th>Da ordinare</th>
            </tr>
            ${stats.ingredienti.sottoSoglia?.map(ing => `
              <tr>
                <td>${ing.nome}</td>
                <td>${ing.categoria}</td>
                <td>${ing.scorteAttuali} ${ing.unitaMisura}</td>
                <td>${ing.scorteMinime} ${ing.unitaMisura}</td>
                <td>${ing.scorteMinime - ing.scorteAttuali} ${ing.unitaMisura}</td>
              </tr>
            `).join('') || ''}
          </table>
          
          <div class="footer">
            Generato il ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Pastificio Gestionale
          </div>
        </body>
      </html>
    `);
    reportWindow.document.close();
    setTimeout(() => {
      reportWindow.print();
    }, 500);
  };
  
  // Funzione per formattare la categoria
  const formatCategoria = (categoria) => {
    return categoria.charAt(0).toUpperCase() + categoria.slice(1).replace('_', ' ');
  };
  
  // Funzione per ottenere il colore della categoria
  const getCategoriaColor = (categoria) => {
    switch (categoria.toLowerCase()) {
      case 'pasta':
      case 'pasta fresca':
        return 'primary';
      case 'pasta ripiena':
        return 'secondary';
      case 'dolci':
        return 'success';
      case 'panadas':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Filtra i piani di produzione in base alla timeframe
  const pianiFiltered = useMemo(() => {
    if (!stats.pianiProduzione || !Array.isArray(stats.pianiProduzione)) {
      return [];
    }
    
    // Ottieni l'intervallo di date
    let startDate, endDate;
    switch (timeframes[timeframeTab].value) {
      case 'day':
        startDate = startOfDay(date);
        endDate = endOfDay(date);
        break;
      case 'week':
        startDate = startOfWeek(date, { locale: it });
        endDate = endOfWeek(date, { locale: it });
        break;
      case 'month':
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        break;
      default:
        startDate = startOfDay(date);
        endDate = endOfDay(date);
    }
    
    // Filtra i piani in base all'intervallo
    return stats.pianiProduzione.filter(piano => {
      const pianoDate = new Date(piano.data);
      return isWithinInterval(pianoDate, { start: startDate, end: endDate });
    });
  }, [stats.pianiProduzione, timeframeTab, date]);
  
  // Funzione per determinare se c'è una situazione critica
  const hasAlertSituation = useMemo(() => {
    // Controlla se ci sono ingredienti sotto soglia necessari per le produzioni odierne
    const ingredientiSottoSoglia = stats.ingredienti.sottoSoglia || [];
    if (ingredientiSottoSoglia.length === 0) return false;
    
    // Identifica produzioni pianificate per oggi
    const oggi = format(new Date(), 'yyyy-MM-dd');
    const produzioniOggi = pianiFiltered.filter(piano => 
      piano.data === oggi && piano.produzioni.some(p => p.stato !== 'completato')
    );
    
    // Se non ci sono produzioni oggi, non c'è situazione critica
    if (produzioniOggi.length === 0) return false;
    
    // Controlla se gli ingredienti sotto soglia sono necessari per le produzioni odierne
    const ingredientiSottoSogliaIds = ingredientiSottoSoglia.map(ing => ing._id);
    const produzioniConIngredientiCritici = produzioniOggi.filter(piano => 
      piano.produzioni.some(prod => 
        prod.ricetta?.ingredienti?.some(ing => ingredientiSottoSogliaIds.includes(ing.ingrediente))
      )
    );
    
    return produzioniConIngredientiCritici.length > 0;
  }, [stats.ingredienti.sottoSoglia, pianiFiltered]);

  // Dati per il grafico di produzione per categoria
  const produzioneCategoriaData = useMemo(() => {
    if (!stats.produzioni.perCategoria || !Array.isArray(stats.produzioni.perCategoria)) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: []
        }]
      };
    }

    return {
      labels: stats.produzioni.perCategoria.map(c => formatCategoria(c._id)),
      datasets: [{
        data: stats.produzioni.perCategoria.map(c => c.quantita),
        backgroundColor: [
          'rgba(103, 58, 183, 0.6)', // Viola (primary)
          'rgba(244, 67, 54, 0.6)',  // Rosso
          'rgba(255, 152, 0, 0.6)',  // Arancione
          'rgba(0, 150, 136, 0.6)',  // Verde
          'rgba(63, 81, 181, 0.6)',  // Indaco
          'rgba(233, 30, 99, 0.6)',  // Rosa
          'rgba(156, 39, 176, 0.6)'  // Viola scuro
        ]
      }]
    };
  }, [stats.produzioni.perCategoria]);

  // Dati per il grafico di carico di lavoro giornaliero
  const caricoLavoroData = useMemo(() => {
    if (!stats.produzioni.perGiorno || !Array.isArray(stats.produzioni.perGiorno)) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    return {
      labels: stats.produzioni.perGiorno.map(d => format(new Date(d.data), 'dd/MM')),
      datasets: [{
        label: 'Carico di lavoro (kg)',
        data: stats.produzioni.perGiorno.map(d => d.quantita),
        backgroundColor: 'rgba(103, 58, 183, 0.2)',
        borderColor: 'rgba(103, 58, 183, 1)',
        borderWidth: 1,
        tension: 0.4,
        fill: true
      }]
    };
  }, [stats.produzioni.perGiorno]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Dashboard Produzione
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DatePicker
            label="Data"
            value={date}
            onChange={(newDate) => setDate(newDate)}
            renderInput={(params) => <TextField {...params} sx={{ mr: 2, width: 150 }} size="small" />}
          />
          
          <Tabs 
            value={timeframeTab}
            onChange={(e, newValue) => setTimeframeTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            sx={{ mr: 2 }}
            size="small"
          >
            {timeframes.map((timeframe, index) => (
              <Tab key={index} label={timeframe.label} />
            ))}
          </Tabs>
          
          <IconButton onClick={handleOpenActionMenu}>
            <MoreIcon />
          </IconButton>
          
          <Menu
            anchorEl={actionMenuAnchor}
            open={Boolean(actionMenuAnchor)}
            onClose={handleCloseActionMenu}
          >
            <MenuItem onClick={handleStampaReport}>
              <ListItemIcon>
                <PrintIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Stampa report</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleOpenDetailsDialog}>
              <ListItemIcon>
                <AssignmentIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Visualizza dettagli</ListItemText>
            </MenuItem>
            <MenuItem onClick={fetchData}>
              <ListItemIcon>
                <RefreshIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Aggiorna dati</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {/* Situazioni di alert */}
      {hasAlertSituation && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => window.location.href = "/magazzino/scorte"}
            >
              Gestisci scorte
            </Button>
          }
        >
          Ci sono ingredienti sotto soglia necessari per la produzione di oggi.
          Verifica le scorte e genera ordini se necessario.
        </Alert>
      )}
      
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Produzioni Completate" 
            value={stats.produzioni.completate || 0} 
            icon={<CheckCircleIcon />}
            subtitle={`Nel periodo selezionato`}
            color="success"
            onClick={() => window.location.href = "/produzione/piani"}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Produzioni in Corso" 
            value={stats.produzioni.inCorso || 0} 
            icon={<PlayArrowIcon />}
            subtitle={`Oggi: ${stats.produzioni.inCorsoOggi || 0}`}
            color="primary"
            onClick={() => window.location.href = "/produzione/piani"}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Ricette Attive" 
            value={stats.ricette.attive || 0} 
            icon={<RestaurantIcon />}
            subtitle={`Totale: ${stats.ricette.totale || 0}`}
            color="info"
            onClick={() => window.location.href = "/produzione"}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Prod. Settimanale" 
            value={`${stats.produzioni.quantitaTotale?.toFixed(2) || 0}`} 
            icon={<TrendingUpIcon />}
            subtitle="kg"
            color="secondary"
            onClick={() => window.location.href = "/produzione/calendario"}
          />
        </Grid>
      </Grid>
      
      {/* Piani di produzione */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EventNoteIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Piani di Produzione {timeframes[timeframeTab].label.toLowerCase()}
              </Typography>
            </Box>
          }
          action={
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => window.location.href = "/produzione/piani"}
            >
              Gestisci piani
            </Button>
          }
        />
        <CardContent>
          {pianiFiltered.length === 0 ? (
            <Alert severity="info">
              Nessun piano di produzione per il periodo selezionato.
            </Alert>
          ) : (
            <List>
              {pianiFiltered.slice(0, 5).map((piano) => (
                <ListItem key={piano._id} divider>
                  <ListItemText 
                    primary={format(new Date(piano.data), 'EEEE d MMMM', { locale: it })}
                    secondary={`${piano.produzioni.length} produzioni programmate`}
                  />
                  <Stack direction="row" spacing={1} alignItems="center">
                    {piano.produzioni.map((prod, idx) => (
                      <Chip 
                        key={idx}
                        label={prod.ricetta?.nome || 'N/D'} 
                        size="small" 
                        color={getCategoriaColor(prod.ricetta?.categoria || '')}
                        variant="outlined"
                        sx={{ mr: 0.5 }}
                      />
                    ))}
                    <Chip
                      label={
                        piano.produzioni.every(p => p.stato === 'completato') ? 'Completato' :
                        piano.produzioni.some(p => p.stato === 'in_corso') ? 'In corso' :
                        'Pianificato'
                      }
                      color={
                        piano.produzioni.every(p => p.stato === 'completato') ? 'success' :
                        piano.produzioni.some(p => p.stato === 'in_corso') ? 'primary' :
                        'default'
                      }
                      size="small"
                    />
                  </Stack>
                </ListItem>
              ))}
            </List>
          )}
          
          {pianiFiltered.length > 5 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button 
                variant="text" 
                onClick={() => window.location.href = "/produzione/piani"}
              >
                Vedi tutti ({pianiFiltered.length - 5} altri)
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Grafici */}
      <Grid container spacing={3}>
        {/* Grafico di produzione per categoria */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Produzione per Categoria" />
            <CardContent>
              {produzioneCategoriaData.labels.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <Chart 
                    type="pie"
                    data={produzioneCategoriaData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right'
                        }
                      }
                    }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nessun dato disponibile
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Grafico di carico di lavoro */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Carico di lavoro giornaliero" />
            <CardContent>
              {caricoLavoroData.labels.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <Chart 
                    type="line"
                    data={caricoLavoroData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nessun dato disponibile
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Ricette più prodotte */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Ricette più prodotte" />
            <CardContent>
              {stats.produzioni.perRicetta?.length > 0 ? (
                <List>
                  {stats.produzioni.perRicetta.slice(0, 5).map((item, index) => (
                    <ListItem key={index} divider={index < Math.min(stats.produzioni.perRicetta.length, 5) - 1}>
                      <ListItemIcon>
                        <Chip 
                          label={index + 1} 
                          color={index === 0 ? "primary" : index === 1 ? "secondary" : "default"} 
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.nome}
                        secondary={`${item.quantitaProdotta.toFixed(2)} ${item.unitaMisura} (${item.count} produzioni)`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nessun dato disponibile
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Ingredienti critici */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Ingredienti critici per la produzione" 
              action={
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => window.location.href = "/magazzino/scorte"}
                >
                  Gestisci scorte
                </Button>
              }
            />
            <CardContent>
              {stats.ingredienti.sottoSoglia?.length > 0 ? (
                <List>
                  {stats.ingredienti.sottoSoglia.slice(0, 5).map((ing, index) => (
                    <ListItem key={ing._id} divider={index < Math.min(stats.ingredienti.sottoSoglia.length, 5) - 1}>
                      <ListItemText 
                        primary={ing.nome}
                        secondary={`Categoria: ${ing.categoria}`}
                      />
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ width: 100 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(ing.scorteAttuali / ing.scorteMinime) * 100} 
                            color={ing.scorteAttuali < ing.scorteMinime / 2 ? "error" : "warning"}
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                        <Typography variant="body2">
                          {ing.scorteAttuali} / {ing.scorteMinime} {ing.unitaMisura}
                        </Typography>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="success">
                  Nessun ingrediente sotto soglia. Le scorte sono sufficienti per la produzione attuale.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Dialog per i dettagli di produzione */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Dettagli produzione per {timeframes[timeframeTab].label.toLowerCase()}</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <LoadingOverlay />
          ) : (
            <>
              <Typography variant="h6" gutterBottom>Metriche di produzione</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="textSecondary">Completate</Typography>
                    <Typography variant="h4">{stats.produzioni.completate || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="textSecondary">In corso</Typography>
                    <Typography variant="h4">{stats.produzioni.inCorso || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="textSecondary">Pianificate</Typography>
                    <Typography variant="h4">{stats.produzioni.pianificate || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="textSecondary">Prod. totale</Typography>
                    <Typography variant="h4">{stats.produzioni.quantitaTotale?.toFixed(2) || 0} kg</Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom>Piani di produzione dettagliati</Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Ricetta</TableCell>
                      <TableCell>Quantità</TableCell>
                      <TableCell>Operatore</TableCell>
                      <TableCell>Stato</TableCell>
                      <TableCell>Lotto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pianiFiltered.flatMap(piano => 
                      piano.produzioni.map((prod, prodIdx) => (
                        <TableRow key={`${piano._id}-${prodIdx}`}>
                          <TableCell>
                            {format(new Date(piano.data), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={prod.ricetta?.nome || 'N/D'} 
                              size="small" 
                              color={getCategoriaColor(prod.ricetta?.categoria || '')}
                              variant="outlined" 
                            />
                          </TableCell>
                          <TableCell>
                            {prod.quantitaProdotta > 0 && prod.stato === 'completato'
                              ? `${prod.quantitaProdotta} / ${prod.quantitaPianificata}`
                              : prod.quantitaPianificata
                            } {prod.ricetta?.resa?.unita || 'pz'}
                          </TableCell>
                          <TableCell>{prod.operatore?.username || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={prod.stato}
                              color={
                                prod.stato === 'completato' ? 'success' :
                                prod.stato === 'in_corso' ? 'primary' :
                                'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{prod.lottoProduzioneId || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                    {pianiFiltered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Nessun dato disponibile
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="h6" gutterBottom>Consumo ingredienti</Typography>
              {stats.produzioni.consumoIngredienti?.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ingrediente</TableCell>
                        <TableCell>Categoria</TableCell>
                        <TableCell align="right">Quantità utilizzata</TableCell>
                        <TableCell align="right">Costo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.produzioni.consumoIngredienti.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.nome}</TableCell>
                          <TableCell>{item.categoria}</TableCell>
                          <TableCell align="right">{item.quantita.toFixed(2)} {item.unitaMisura}</TableCell>
                          <TableCell align="right">€ {item.costo.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right"><strong>Costo totale ingredienti:</strong></TableCell>
                        <TableCell align="right"><strong>€ {stats.produzioni.costoTotale?.toFixed(2) || '0.00'}</strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  Nessun dato disponibile sul consumo ingredienti per il periodo selezionato.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Chiudi</Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handleStampaReport}
          >
            Stampa report
          </Button>
        </DialogActions>
      </Dialog>
      
      {loading && <LoadingOverlay />}
      {error && <ErrorDisplay message={error} />}
    </Box>
  );
};

export default ProductionDashboard;