'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip
} from '@mui/material';
import { Search, TrendingUp, TrendingDown, Remove } from '@mui/icons-material';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ConsumiPage() {
  const [consumi, setConsumi] = useState([]);
  const [periodo, setPeriodo] = useState('settimana');
  const [searchTerm, setSearchTerm] = useState('');
  const [statistiche, setStatistiche] = useState({
    totaleConsumi: 0,
    ingredientePiuUsato: '',
    costoTotale: 0
  });

  useEffect(() => {
    // Simula il caricamento dei consumi
    const consumiSimulati = [
      { id: 1, ingrediente: 'Farina 00', quantita: 50, unita: 'kg', costo: 35, data: new Date() },
      { id: 2, ingrediente: 'Uova', quantita: 200, unita: 'pz', costo: 40, data: new Date() },
      { id: 3, ingrediente: 'Burro', quantita: 10, unita: 'kg', costo: 80, data: new Date() },
      { id: 4, ingrediente: 'Zucchero', quantita: 20, unita: 'kg', costo: 25, data: new Date() },
      { id: 5, ingrediente: 'Lievito', quantita: 2, unita: 'kg', costo: 15, data: new Date() }
    ];
    setConsumi(consumiSimulati);
    calcolaStatistiche(consumiSimulati);
  }, [periodo]);

  const calcolaStatistiche = (datiConsumi) => {
    const totale = datiConsumi.reduce((acc, c) => acc + c.costo, 0);
    const ingredientiCount = {};
    
    datiConsumi.forEach(c => {
      ingredientiCount[c.ingrediente] = (ingredientiCount[c.ingrediente] || 0) + c.quantita;
    });
    
    const piuUsato = Object.entries(ingredientiCount).sort((a, b) => b[1] - a[1])[0];
    
    setStatistiche({
      totaleConsumi: datiConsumi.length,
      ingredientePiuUsato: piuUsato ? piuUsato[0] : '',
      costoTotale: totale
    });
  };

  const consumiFiltrati = consumi.filter(consumo =>
    consumo.ingrediente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTrend = (quantita) => {
    // Simula un trend
    const random = Math.random();
    if (random > 0.6) return { icon: <TrendingUp />, color: 'error' };
    if (random < 0.3) return { icon: <TrendingDown />, color: 'success' };
    return { icon: <Remove />, color: 'default' };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Consumi Produzione
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Totale Consumi
              </Typography>
              <Typography variant="h4">
                {statistiche.totaleConsumi}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Questo {periodo}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Ingrediente più usato
              </Typography>
              <Typography variant="h5">
                {statistiche.ingredientePiuUsato || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Maggior consumo
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Costo Totale
              </Typography>
              <Typography variant="h4">
                € {statistiche.costoTotale.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Valore consumi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Cerca ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Periodo</InputLabel>
              <Select
                value={periodo}
                label="Periodo"
                onChange={(e) => setPeriodo(e.target.value)}
              >
                <MenuItem value="oggi">Oggi</MenuItem>
                <MenuItem value="settimana">Questa Settimana</MenuItem>
                <MenuItem value="mese">Questo Mese</MenuItem>
                <MenuItem value="anno">Quest'Anno</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ingrediente</TableCell>
              <TableCell align="right">Quantità</TableCell>
              <TableCell>Unità</TableCell>
              <TableCell align="right">Costo Unitario</TableCell>
              <TableCell align="right">Costo Totale</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="center">Trend</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {consumiFiltrati.map((consumo) => {
              const trend = getTrend(consumo.quantita);
              return (
                <TableRow key={consumo.id}>
                  <TableCell>{consumo.ingrediente}</TableCell>
                  <TableCell align="right">{consumo.quantita}</TableCell>
                  <TableCell>{consumo.unita}</TableCell>
                  <TableCell align="right">
                    € {(consumo.costo / consumo.quantita).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">€ {consumo.costo.toFixed(2)}</TableCell>
                  <TableCell>
                    {format(consumo.data, 'dd/MM/yyyy', { locale: it })}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={trend.icon}
                      color={trend.color}
                      size="small"
                      label=""
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}