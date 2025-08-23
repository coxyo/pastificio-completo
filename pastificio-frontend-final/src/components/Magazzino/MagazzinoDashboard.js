// components/Magazzino/MagazzinoDashboard.js con miglioramenti
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
  Tabs
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  Business as BusinessIcon,
  LocalShipping as ShippingIcon,
  More as MoreIcon,
  AutoGraph as AutoGraphIcon,
  Print as PrintIcon,
  AddShoppingCart as AddShoppingCartIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { Chart } from 'react-chartjs-2';
import axios from 'axios';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

import StatCard from '../common/StatCard';
import LoadingOverlay from '../common/LoadingOverlay';
import ErrorDisplay from '../common/ErrorDisplay';
import notificationService from '../../services/notificationService';

// Componente dashboard migliorato per il magazzino
const MagazzinoDashboard = ({ onNotify }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    ingredienti: { totale: 0, perCategoria: [], sottoSoglia: [] },
    movimenti: { perTipo: [], perMese: [] },
    fornitori: { totale: 0, perCategoria: [] },
    ordini: { perStato: [], perMese: [] }
  });
  const [timeframeTab, setTimeframeTab] = useState(0);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [ordiniDialogOpen, setOrdiniDialogOpen] = useState(false);
  const [ordiniTab, setOrdiniTab] = useState(0);
  
  // Array per le opzioni di timeframe
  const timeframes = [
    { label: 'Ultima settimana', value: 'week' },
    { label: 'Ultimo mese', value: 'month' },
    { label: 'Ultimo trimestre', value: 'quarter' },
    { label: 'Anno corrente', value: 'year' }
  ];

  useEffect(() => {
    fetchData();
  }, [timeframeTab]);

  // Funzione per caricare i dati con la timeframe corretta
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    // Calcola il range di date in base al timeframe selezionato
    const now = new Date();
    let startDate, endDate;
    
    switch (timeframes[timeframeTab].value) {
      case 'week':
        startDate = subDays(now, 7);
        endDate = now;
        break;
      case 'month':
        startDate = subDays(now, 30);
        endDate = now;
        break;
      case 'quarter':
        startDate = subDays(now, 90);
        endDate = now;
        break;
      case 'year':
        startDate = startOfMonth(new Date(now.getFullYear(), 0, 1)); // 1 gennaio dell'anno corrente
        endDate = endOfMonth(new Date(now.getFullYear(), 11, 31)); // 31 dicembre dell'anno corrente
        break;
      default:
        startDate = subDays(now, 30);
        endDate = now;
    }
    
    // Formatta le date per le API
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    try {
      // Fetch parallelo di tutte le statistiche
      const [ingredientiRes, movimentiRes, fornitoriRes, ordiniRes] = await Promise.all([
        axios.get('/api/magazzino/ingredienti/statistiche'),
        axios.get('/api/magazzino/movimenti/statistiche', {
          params: { startDate: startDateStr, endDate: endDateStr }
        }),
        axios.get('/api/magazzino/fornitori/statistiche'),
        axios.get('/api/magazzino/ordini/statistiche', {
          params: { startDate: startDateStr, endDate: endDateStr }
        })
      ]);
      
      const newStats = {
        ingredienti: ingredientiRes.data.data,
        movimenti: movimentiRes.data.data,
        fornitori: fornitoriRes.data.data,
        ordini: ordiniRes.data.data
      };
      
      setStats(newStats);
      
      // Crea notifiche per ingredienti sotto soglia se ce ne sono
      if (newStats.ingredienti.sottoSoglia.length > 0) {
        notificationService.createNotification(
          'low_stock',
          'Ingredienti sotto soglia',
          `Ci sono ${newStats.ingredienti.sottoSoglia.length} ingredienti sotto la soglia minima.`,
          {
            count: newStats.ingredienti.sottoSoglia.length,
            showToast: false // Non mostrare toast se è la prima volta che si carica la dashboard
          }
        );
      }
    } catch (err) {
      console.error('Errore nel caricamento delle statistiche:', err);
      setError('Impossibile caricare le statistiche del magazzino. Riprova più tardi.');
      
      if (onNotify) {
        onNotify('Errore nel caricamento delle statistiche del magazzino', 'error');
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
  
  // Genera automaticamente ordini per ingredienti sotto soglia
  const handleGeneraOrdiniAutomatici = async () => {
    handleCloseActionMenu();
    setLoading(true);
    
    try {
      if (stats.ingredienti.sottoSoglia.length === 0) {
        if (onNotify) {
          onNotify('Non ci sono ingredienti sotto soglia da ordinare', 'info');
        }
        return;
      }
      
      // Raggruppa gli ingredienti per fornitore
      const ingredientiPerFornitore = {};
      
      for (const ingrediente of stats.ingredienti.sottoSoglia) {
        if (!ingrediente.fornitoriPrimari || ingrediente.fornitoriPrimari.length === 0) continue;
        
        const fornitoreId = ingrediente.fornitoriPrimari[0];
        
        if (!ingredientiPerFornitore[fornitoreId]) {
          ingredientiPerFornitore[fornitoreId] = [];
        }
        
        const quantitaDaOrdinare = ingrediente.scorteMinime - ingrediente.scorteAttuali;
        
        ingredientiPerFornitore[fornitoreId].push({
          ingrediente: ingrediente._id,
          quantita: quantitaDaOrdinare,
          prezzoUnitario: ingrediente.prezzoUnitario,
          totale: quantitaDaOrdinare * ingrediente.prezzoUnitario
        });
      }
      
      // Crea un ordine per ogni fornitore
      let ordiniCreati = 0;
      
      for (const [fornitoreId, ingredienti] of Object.entries(ingredientiPerFornitore)) {
        if (ingredienti.length === 0) continue;
        
        const ordine = {
          fornitore: fornitoreId,
          dataOrdine: new Date().toISOString().split('T')[0],
          dataConsegnaPrevista: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
          stato: 'bozza',
          righeOrdine: ingredienti,
          note: 'Ordine generato automaticamente per ripristino scorte',
          totale: ingredienti.reduce((acc, curr) => acc + curr.totale, 0)
        };
        
        await axios.post('/api/magazzino/ordini-fornitori', ordine);
        ordiniCreati++;
      }
      
      if (onNotify) {
        onNotify(`Creati ${ordiniCreati} ordini automatici per gli ingredienti sotto soglia`, 'success');
      }
      
      // Aggiorna i dati dopo la creazione degli ordini
      await fetchData();
      
      // Apri il dialog degli ordini
      setOrdiniDialogOpen(true);
      
    } catch (err) {
      console.error('Errore nella creazione degli ordini automatici:', err);
      
      if (onNotify) {
        onNotify('Errore nella creazione degli ordini automatici', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce la stampa del report di magazzino
  const handleStampaReport = () => {
    handleCloseActionMenu();
    
    // Implementa la logica per stampare il report
    // Esempio: Apri una nuova finestra con il report formattato per la stampa
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
      <html>
        <head>
          <title>Report Magazzino - ${format(new Date(), 'dd/MM/yyyy')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2196f3; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
            .warning { color: #f44336; }
            .footer { margin-top: 30px; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Report Magazzino - ${format(new Date(), 'dd/MM/yyyy')}</h1>
          
          <h2>Ingredienti sotto soglia (${stats.ingredienti.sottoSoglia.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Categoria</th>
                <th>Scorte attuali</th>
                <th>Scorte minime</th>
                <th>Da ordinare</th>
              </tr>
            </thead>
            <tbody>
              ${stats.ingredienti.sottoSoglia.map(ing => `
                <tr>
                  <td>${ing.nome}</td>
                  <td>${ing.categoria}</td>
                  <td>${ing.scorteAttuali} ${ing.unitaMisura}</td>
                  <td>${ing.scorteMinime} ${ing.unitaMisura}</td>
                  <td>${ing.scorteMinime - ing.scorteAttuali} ${ing.unitaMisura}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Ordini in corso (${stats.ordini.perStato?.filter(s => ['inviato', 'confermato'].includes(s._id)).reduce((acc, curr) => acc + curr.count, 0) || 0})</h2>
          <table>
            <thead>
              <tr>
                <th>Stato</th>
                <th>Numero ordini</th>
                <th>Valore totale</th>
              </tr>
            </thead>
            <tbody>
              ${stats.ordini.perStato?.map(stato => `
                <tr>
                  <td>${stato._id}</td>
                  <td>${stato.count}</td>
                  <td>€ ${stato.valore?.toFixed(2) || '0.00'}</td>
                </tr>
              `).join('')}
            </tbody>
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
  
  // Funzione per determinare se c'è una situazione critica
  const hasAlertSituation = useMemo(() => {
    return stats.ingredienti.sottoSoglia?.length > 0;
  }, [stats.ingredienti.sottoSoglia]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Dashboard Magazzino
        </Typography>
        
        <Box>
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
            <MenuItem onClick={handleGeneraOrdiniAutomatici} disabled={!stats.ingredienti.sottoSoglia?.length}>
              <ListItemIcon>
                <AddShoppingCartIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Genera ordini automatici</ListItemText>
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
              onClick={handleGeneraOrdiniAutomatici}
            >
              Genera ordini
            </Button>
          }
        >
          Ci sono {stats.ingredienti.sottoSoglia.length} ingredienti sotto la soglia minima. 
          Verifica le scorte e genera ordini automatici se necessario.
        </Alert>
      )}
      
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Ingredienti" 
            value={stats.ingredienti.totale} 
            icon={<InventoryIcon />}
            subtitle={`${stats.ingredienti.sottoSoglia?.length || 0} sotto soglia`}
            color={stats.ingredienti.sottoSoglia?.length > 0 ? 'warning' : 'primary'}
            onClick={() => window.location.href = "/magazzino/ingredienti"}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Fornitori Attivi" 
            value={stats.fornitori.perStato?.find(s => s._id === true)?.count || 0} 
            icon={<BusinessIcon />}
            subtitle={`${stats.fornitori.totale} totali`}
            color="info"
            onClick={() => window.location.href = "/magazzino/fornitori"}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Ordini in corso" 
            value={
              (stats.ordini.perStato?.find(s => s._id === 'inviato')?.count || 0) +
              (stats.ordini.perStato?.find(s => s._id === 'confermato')?.count || 0)
            } 
            icon={<ShippingIcon />}
            subtitle={`${stats.ordini.perStato?.find(s => s._id === 'completato')?.count || 0} completati`}
            color="success"
            onClick={() => setOrdiniDialogOpen(true)}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Movimenti Mensili" 
            value={stats.movimenti.perMese?.reduce((acc, curr) => acc + curr.count, 0) || 0} 
            icon={<TrendingUpIcon />}
            subtitle="Nel periodo selezionato"
            color="secondary"
            onClick={() => window.location.href = "/magazzino/scorte"}
          />
        </Grid>
      </Grid>
      
      {/* Ingredienti sotto soglia */}
      {stats.ingredienti.sottoSoglia?.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Ingredienti sotto soglia minima
                </Typography>
              </Box>
            }
            action={
              <Button 
                variant="outlined" 
                size="small"
                color="primary"
                onClick={handleGeneraOrdiniAutomatici}
              >
                Genera ordini
              </Button>
            }
          />
          <CardContent>
            <List>
              {stats.ingredienti.sottoSoglia.slice(0, 5).map((ing) => (
                <ListItem key={ing._id} divider>
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
            
            {stats.ingredienti.sottoSoglia.length > 5 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  variant="text" 
                  onClick={() => window.location.href = "/magazzino/scorte"}
                >
                  Vedi tutti ({stats.ingredienti.sottoSoglia.length - 5} altri)
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Grafici */}
      <Grid container spacing={3}>
        {/* Grafico categorie ingredienti */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Ingredienti per Categoria" />
            <CardContent>
              {stats.ingredienti.perCategoria?.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <Chart 
                    type="pie"
                    data={{
                      labels: stats.ingredienti.perCategoria.map(c => c._id),
                      datasets: [{
                        data: stats.ingredienti.perCategoria.map(c => c.count),
                        backgroundColor: [
                          'rgba(54, 162, 235, 0.6)',
                          'rgba(255, 99, 132, 0.6)',
                          'rgba(255, 206, 86, 0.6)',
                          'rgba(75, 192, 192, 0.6)',
                          'rgba(153, 102, 255, 0.6)',
                          'rgba(255, 159, 64, 0.6)',
                          'rgba(199, 199, 199, 0.6)'
                        ]
                      }]
                    }}
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
        
        {/* Grafico movimenti mensili */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Movimenti per periodo" />
            <CardContent>
              {stats.movimenti.perMese?.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <Chart 
                    type="bar"
                    data={{
                      labels: stats.movimenti.perMese.map(m => 
                        `${m.mese}/${m.anno}`
                      ),
                      datasets: [{
                        label: 'Carico',
                        data: stats.movimenti.perMese.map(m => m.carico || 0),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)'
                      }, {
                        label: 'Scarico',
                        data: stats.movimenti.perMese.map(m => m.scarico || 0),
                        backgroundColor: 'rgba(255, 99, 132, 0.6)'
                      }]
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true
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
        
        {/* Grafico stato ordini */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Ordini per Stato" />
            <CardContent>
              {stats.ordini.perStato?.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <Chart 
                    type="doughnut"
                    data={{
                      labels: stats.ordini.perStato.map(s => s._id),
                      datasets: [{
                        data: stats.ordini.perStato.map(s => s.count),
                        backgroundColor: [
                          'rgba(153, 102, 255, 0.6)', // bozza
                          'rgba(54, 162, 235, 0.6)',  // inviato
                          'rgba(255, 206, 86, 0.6)',  // confermato
                          'rgba(75, 192, 192, 0.6)',  // parziale
                          'rgba(255, 99, 132, 0.6)',  // completato
                          'rgba(199, 199, 199, 0.6)'  // annullato
                        ]
                      }]
                    }}
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
        
        {/* Top fornitori */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Top Fornitori" />
            <CardContent>
              {stats.fornitori.topFornitori?.length > 0 ? (
                <List>
                  {stats.fornitori.topFornitori.map((fornitore, index) => (
                    <ListItem key={fornitore._id} divider={index < stats.fornitori.topFornitori.length - 1}>
                      <ListItemIcon>
                        <Chip 
                          label={index + 1} 
                          color={index === 0 ? "primary" : index === 1 ? "secondary" : "default"} 
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={fornitore.ragioneSociale}
                        secondary={`${fornitore.countOrdini} ordini - €${fornitore.totaleSpeso.toFixed(2)}`}
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
      </Grid>
      
      {/* Dialog per visualizzare tutti gli ordini */}
      <Dialog
        open={ordiniDialogOpen}
        onClose={() => setOrdiniDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Dettaglio Ordini Fornitori</Typography>
            <Tabs
              value={ordiniTab}
              onChange={(e, newValue) => setOrdiniTab(newValue)}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="In corso" />
              <Tab label="Completati" />
              <Tab label="Tutti" />
            </Tabs>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <LoadingOverlay />
          ) : (
            <Paper elevation={0}>
              {/* Implementare qui una tabella dettagliata degli ordini in base al tab selezionato */}
              <Typography variant="body1">
                Qui verrebbe visualizzata una tabella dettagliata degli ordini filtrati in base al tab selezionato.
              </Typography>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={() => window.location.href = "/magazzino/ordini-fornitori"}
                >
                  Vai alla gestione ordini
                </Button>
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrdiniDialogOpen(false)}>Chiudi</Button>
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

export default MagazzinoDashboard;