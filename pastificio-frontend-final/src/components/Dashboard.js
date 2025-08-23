'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Euro as EuroIcon,
  Today as TodayIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

const Dashboard = ({ ordini = [], isConnected = false, dataSelezionata }) => {
  // Funzioni helper definite prima del loro utilizzo
  const calcolaTotale = (ordine) => {
    if (ordine.totale) return parseFloat(ordine.totale);
    if (ordine.prodotti && Array.isArray(ordine.prodotti)) {
      return ordine.prodotti.reduce((sum, prod) => {
        const prezzo = parseFloat(prod.prezzo) || 0;
        const quantita = parseFloat(prod.quantita) || 0;
        return sum + (prezzo * quantita);
      }, 0);
    }
    return 0;
  };

  const calcolaTopProdotti = (ordiniDaAnalizzare) => {
    const prodotti = {};
    ordiniDaAnalizzare.forEach(ordine => {
      if (ordine.prodotti && Array.isArray(ordine.prodotti)) {
        ordine.prodotti.forEach(prod => {
          const nome = prod.prodotto || prod.nome;
          if (nome) {
            prodotti[nome] = (prodotti[nome] || 0) + (parseFloat(prod.quantita) || 0);
          }
        });
      }
    });
    
    return Object.entries(prodotti)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  // Calcola le statistiche
  const statistiche = useMemo(() => {
    console.log('🔍 Debug Dashboard - Ordini ricevuti:', ordini);
    
    const oggi = new Date().toISOString().split('T')[0];
    const dataFiltro = dataSelezionata || oggi;
    
    console.log('📅 Data filtro:', dataFiltro);
    
    // Ordini di oggi - filtro più flessibile
    const ordiniOggi = ordini.filter(ordine => {
      const dataOrdine = ordine.dataRitiro || ordine.createdAt;
      console.log('📋 Ordine:', ordine.nomeCliente, 'Data:', dataOrdine);
      
      if (!dataOrdine) return false;
      
      // Controlla sia dataRitiro che createdAt
      const dataCheck = dataOrdine.startsWith(dataFiltro);
      console.log('✅ Data match:', dataCheck);
      
      return dataCheck;
    });
    
    console.log('📊 Ordini oggi filtrati:', ordiniOggi.length);
    
    // Se non ci sono ordini oggi, mostra quelli di tutte le date per debug
    if (ordiniOggi.length === 0 && ordini.length > 0) {
      console.log('⚠️ Nessun ordine oggi, mostro tutti gli ordini per debug');
      // Ritorna tutti gli ordini per debug
      return {
        oggi: {
          totaleOrdini: ordini.length,
          valore: ordini.reduce((sum, ordine) => sum + calcolaTotale(ordine), 0),
          ticketMedio: ordini.length > 0 ? ordini.reduce((sum, ordine) => sum + calcolaTotale(ordine), 0) / ordini.length : 0,
          inLavorazione: ordini.filter(o => !o.completato && !o.consegnato).length,
          completati: ordini.filter(o => o.completato || o.consegnato).length
        },
        totale: {
          totaleOrdini: ordini.length,
          valore: ordini.reduce((sum, ordine) => sum + calcolaTotale(ordine), 0),
          ticketMedio: ordini.length > 0 ? ordini.reduce((sum, ordine) => sum + calcolaTotale(ordine), 0) / ordini.length : 0
        },
        topProdotti: calcolaTopProdotti(ordini)
      };
    }
    
    // Calcola totali
    const totaleOrdiniOggi = ordiniOggi.length;
    const totaleOrdini = ordini.length;
    
    // Calcola valori
    const valoreOggi = ordiniOggi.reduce((sum, ordine) => sum + calcolaTotale(ordine), 0);
    const valoreTotale = ordini.reduce((sum, ordine) => sum + calcolaTotale(ordine), 0);
    
    // Ticket medio
    const ticketMedioOggi = totaleOrdiniOggi > 0 ? valoreOggi / totaleOrdiniOggi : 0;
    const ticketMedioTotale = totaleOrdini > 0 ? valoreTotale / totaleOrdini : 0;
    
    // Ordini per stato
    const ordiniInLavorazione = ordiniOggi.filter(o => !o.completato && !o.consegnato).length;
    const ordiniCompletati = ordiniOggi.filter(o => o.completato || o.consegnato).length;
    
    return {
      oggi: {
        totaleOrdini: totaleOrdiniOggi,
        valore: valoreOggi,
        ticketMedio: ticketMedioOggi,
        inLavorazione: ordiniInLavorazione,
        completati: ordiniCompletati
      },
      totale: {
        totaleOrdini,
        valore: valoreTotale,
        ticketMedio: ticketMedioTotale
      },
      topProdotti: calcolaTopProdotti(ordiniOggi)
    };
  }, [ordini, dataSelezionata]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: `${color}.main`, mr: 1 }}>
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            icon={<TodayIcon />}
            label={`Data: ${dataSelezionata || 'Oggi'}`}
            color="primary"
          />
          <Chip 
            label={isConnected ? 'Online' : 'Offline'}
            color={isConnected ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Statistiche principali */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Ordini Oggi"
            value={statistiche.oggi.totaleOrdini}
            icon={<ShoppingCartIcon />}
            color="primary"
            subtitle={`Totale: ${statistiche.totale.totaleOrdini}`}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Valore Oggi"
            value={formatCurrency(statistiche.oggi.valore)}
            icon={<EuroIcon />}
            color="success"
            subtitle={`Totale: ${formatCurrency(statistiche.totale.valore)}`}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Ticket Medio"
            value={formatCurrency(statistiche.oggi.ticketMedio)}
            icon={<TrendingUpIcon />}
            color="info"
            subtitle={`Generale: ${formatCurrency(statistiche.totale.ticketMedio)}`}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="In Lavorazione"
            value={statistiche.oggi.inLavorazione}
            icon={<AssessmentIcon />}
            color="warning"
            subtitle={`Completati: ${statistiche.oggi.completati}`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Prodotti più venduti */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Prodotti Più Venduti Oggi
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {statistiche.topProdotti.length > 0 ? (
              <List>
                {statistiche.topProdotti.map(([prodotto, quantita], index) => (
                  <ListItem key={prodotto} divider={index < statistiche.topProdotti.length - 1}>
                    <ListItemText
                      primary={prodotto}
                      secondary={`${quantita} ${quantita === 1 ? 'unità' : 'unità'}`}
                    />
                    <Chip
                      label={`#${index + 1}`}
                      color="primary"
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                Nessun prodotto venduto oggi
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Ultimi ordini */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Ultimi Ordini
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {ordini.length > 0 ? (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List>
                  {ordini.slice(0, 10).map((ordine, index) => (
                    <ListItem key={ordine._id || index} divider={index < ordini.length - 1}>
                      <ListItemText 
                        primary={ordine.nomeCliente}
                        secondary={
                          <React.Fragment>
                            <Typography variant="caption" display="block">
                              {new Date(ordine.createdAt || ordine.dataRitiro).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="primary">
                              {formatCurrency(
                                ordine.totale || 
                                (ordine.prodotti?.reduce((sum, p) => sum + (p.prezzo * p.quantita), 0) || 0)
                              )}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                      <Chip
                        label={ordine.completato || ordine.consegnato ? 'Completato' : 'In lavorazione'}
                        color={ordine.completato || ordine.consegnato ? 'success' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                Nessun ordine disponibile
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;