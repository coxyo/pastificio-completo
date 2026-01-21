// GraficiCorrispettivi.js
// 📊 GRAFICI ANALISI CORRISPETTIVI - Pastificio Nonna Claudia
// Versione: 1.0.0 - Ottimizzato per struttura dati esistente

import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid,
  Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Alert, Tabs, Tab, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Euro, CalendarToday, Assessment,
  ShowChart, PieChart as PieChartIcon
} from '@mui/icons-material';

// Colori grafici
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const GraficiCorrispettivi = () => {
  // STATI
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [datiAnnuali, setDatiAnnuali] = useState([]);
  const [metriche, setMetriche] = useState({
    totaleAnno: 0,
    mediaMensile: 0,
    ivaTotale: 0,
    mesiAttivi: 0
  });

  // CARICAMENTO DATI
  useEffect(() => {
    caricaDati();
  }, [anno]);

  const caricaDati = async () => {
    setLoading(true);
    setError(null);

    try {
      // Chiama API report annuale
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/corrispettivi/report/${anno}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Errore caricamento dati');
      }

      const data = await response.json();
      console.log('📊 Dati ricevuti:', data);

      setDatiAnnuali(data);
      calcolaMetriche(data);
      setLoading(false);

    } catch (err) {
      console.error('❌ Errore:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const calcolaMetriche = (dati) => {
    const totaleAnno = dati.reduce((sum, mese) => sum + (mese.totale || 0), 0);
    const mesiAttivi = dati.filter(m => m.totale > 0).length;
    const mediaMensile = mesiAttivi > 0 ? totaleAnno / mesiAttivi : 0;
    
    // Calcola IVA totale (somma IVA scorporate)
    const ivaTotale = dati.reduce((sum, mese) => {
      const iva22Scorp = (mese.iva22 || 0) - ((mese.iva22 || 0) / 1.22);
      const iva10Scorp = (mese.iva10 || 0) - ((mese.iva10 || 0) / 1.10);
      const iva4Scorp = (mese.iva4 || 0) - ((mese.iva4 || 0) / 1.04);
      return sum + iva22Scorp + iva10Scorp + iva4Scorp;
    }, 0);

    setMetriche({
      totaleAnno,
      mediaMensile,
      ivaTotale,
      mesiAttivi
    });
  };

  const preparaDatiGraficoMensile = () => {
    const nomiMesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    
    return nomiMesi.map((nomeMese, index) => {
      const meseNum = index + 1;
      const datiMese = datiAnnuali.find(m => m._id === meseNum) || {};
      
      const totale = datiMese.totale || 0;
      const iva22Scorp = totale > 0 ? (datiMese.iva22 || 0) - ((datiMese.iva22 || 0) / 1.22) : 0;
      const iva10Scorp = totale > 0 ? (datiMese.iva10 || 0) - ((datiMese.iva10 || 0) / 1.10) : 0;
      const iva4Scorp = totale > 0 ? (datiMese.iva4 || 0) - ((datiMese.iva4 || 0) / 1.04) : 0;
      const ivaTotale = iva22Scorp + iva10Scorp + iva4Scorp;
      const imponibile = totale - ivaTotale;
      
      return {
        mese: nomeMese,
        meseNum: meseNum,
        totale: parseFloat(totale.toFixed(2)),
        imponibile: parseFloat(imponibile.toFixed(2)),
        iva: parseFloat(ivaTotale.toFixed(2)),
        iva22: datiMese.iva22 || 0,
        iva10: datiMese.iva10 || 0,
        iva4: datiMese.iva4 || 0,
        esente: datiMese.esente || 0
      };
    });
  };

  const preparaDatiDistribuzioneIva = () => {
    const totali = datiAnnuali.reduce((acc, mese) => {
      acc.iva22 += mese.iva22 || 0;
      acc.iva10 += mese.iva10 || 0;
      acc.iva4 += mese.iva4 || 0;
      acc.esente += mese.esente || 0;
      return acc;
    }, { iva22: 0, iva10: 0, iva4: 0, esente: 0 });

    return [
      { nome: 'IVA 22%', valore: totali.iva22 },
      { nome: 'IVA 10%', valore: totali.iva10 },
      { nome: 'IVA 4%', valore: totali.iva4 },
      { nome: 'Esente', valore: totali.esente }
    ].filter(item => item.valore > 0);
  };

  // FORMATTATORI
  const formatEuro = (value) => `€${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // TOOLTIP PERSONALIZZATO
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {formatEuro(entry.value)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  // RENDER
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Errore nel caricamento dei dati: {error}
      </Alert>
    );
  }

  const datiGrafico = preparaDatiGraficoMensile();
  const distribuzioneIva = preparaDatiDistribuzioneIva();

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          📊 Grafici Corrispettivi
        </Typography>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Anno</InputLabel>
          <Select value={anno} onChange={(e) => setAnno(e.target.value)} label="Anno">
            <MenuItem value={2023}>2023</MenuItem>
            <MenuItem value={2024}>2024</MenuItem>
            <MenuItem value={2025}>2025</MenuItem>
            <MenuItem value={2026}>2026</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* KPI CARDS */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Euro color="primary" />
                <Typography variant="body2" color="textSecondary">
                  Totale Anno
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatEuro(metriche.totaleAnno)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f3e5f5', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUp color="secondary" />
                <Typography variant="body2" color="textSecondary">
                  Media Mensile
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatEuro(metriche.mediaMensile)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Assessment color="success" />
                <Typography variant="body2" color="textSecondary">
                  IVA Totale
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatEuro(metriche.ivaTotale)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarToday color="warning" />
                <Typography variant="body2" color="textSecondary">
                  Mesi Attivi
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {metriche.mesiAttivi}/12
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TABS */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} variant="scrollable">
          <Tab icon={<ShowChart />} label="Fatturato Mensile" />
          <Tab icon={<Assessment />} label="Imponibile vs IVA" />
          <Tab icon={<PieChartIcon />} label="Distribuzione IVA" />
          <Tab icon={<CalendarToday />} label="Tabella Dettaglio" />
        </Tabs>
      </Paper>

      {/* TAB 1: FATTURATO MENSILE */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp /> 💰 Fatturato Mensile {anno}
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={datiGrafico}>
                <defs>
                  <linearGradient id="colorTotale" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mese" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="totale" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorTotale)"
                  name="Fatturato Totale"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: IMPONIBILE VS IVA */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment /> 📊 Imponibile vs IVA
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={datiGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mese" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="imponibile" fill="#82ca9d" name="Imponibile" />
                <Bar dataKey="iva" fill="#ffc658" name="IVA Totale" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: DISTRIBUZIONE IVA */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🥧 Distribuzione per Aliquota IVA
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={distribuzioneIva}
                      dataKey="valore"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.nome}: ${formatEuro(entry.valore)}`}
                    >
                      {distribuzioneIva.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatEuro(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Dettagli Aliquote
                </Typography>
                <TableContainer sx={{ maxHeight: 350 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Aliquota</strong></TableCell>
                        <TableCell align="right"><strong>Totale Anno</strong></TableCell>
                        <TableCell align="right"><strong>%</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {distribuzioneIva.map((item, index) => {
                        const percentuale = (item.valore / metriche.totaleAnno * 100).toFixed(1);
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip 
                                label={item.nome} 
                                size="small" 
                                sx={{ bgcolor: COLORS[index % COLORS.length], color: 'white' }}
                              />
                            </TableCell>
                            <TableCell align="right">{formatEuro(item.valore)}</TableCell>
                            <TableCell align="right">{percentuale}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 4: TABELLA DETTAGLIO */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Dettaglio Mensile {anno}
            </Typography>
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Mese</strong></TableCell>
                    <TableCell align="right"><strong>Totale</strong></TableCell>
                    <TableCell align="right"><strong>Imponibile</strong></TableCell>
                    <TableCell align="right"><strong>IVA</strong></TableCell>
                    <TableCell align="right"><strong>IVA 22%</strong></TableCell>
                    <TableCell align="right"><strong>IVA 10%</strong></TableCell>
                    <TableCell align="right"><strong>IVA 4%</strong></TableCell>
                    <TableCell align="right"><strong>Esente</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datiGrafico.filter(m => m.totale > 0).map((mese, index) => (
                    <TableRow key={index} hover>
                      <TableCell><strong>{mese.mese}</strong></TableCell>
                      <TableCell align="right">{formatEuro(mese.totale)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.imponibile)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.iva)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.iva22)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.iva10)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.iva4)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.esente)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>TOTALE ANNO</strong></TableCell>
                    <TableCell align="right"><strong>{formatEuro(metriche.totaleAnno)}</strong></TableCell>
                    <TableCell align="right"><strong>{formatEuro(metriche.totaleAnno - metriche.ivaTotale)}</strong></TableCell>
                    <TableCell align="right"><strong>{formatEuro(metriche.ivaTotale)}</strong></TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GraficiCorrispettivi;