// GraficiCorrispettivi.js
// 📊 GRAFICI ANALISI CORRISPETTIVI AVANZATA - Pastificio Nonna Claudia
// Versione: 2.0.0 - Confronto anni, analisi AI, grafici avanzati
// Fix: usa "totaleMese" dal backend

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Grid,
  Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Alert, Tabs, Tab, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Divider, Switch,
  FormControlLabel, Tooltip as MuiTooltip, IconButton,
  LinearProgress, Skeleton
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  TrendingUp, TrendingDown, Euro, CalendarToday, Assessment,
  ShowChart, PieChart as PieChartIcon, CompareArrows,
  Insights, SmartToy, Refresh, BarChart as BarChartIcon
} from '@mui/icons-material';

// ═══════════════════════════════════════
// COSTANTI E CONFIGURAZIONE
// ═══════════════════════════════════════
const NOMI_MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const NOMI_MESI_COMPLETI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const COLORI = {
  primario: '#1976d2',
  secondario: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  viola: '#7b1fa2',
  teal: '#00897b',
  anno1: '#1976d2',
  anno2: '#ff9800',
  anno3: '#4caf50',
  anno4: '#9c27b0',
  iva22: '#0088FE',
  iva10: '#00C49F',
  iva4: '#FFBB28',
  esente: '#FF8042',
};

// ═══════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════
const GraficiCorrispettivi = () => {
  const annoCorrente = new Date().getFullYear();
  const [annoPrimario, setAnnoPrimario] = useState(annoCorrente);
  const [anniConfronto, setAnniConfronto] = useState([annoCorrente - 1]);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [datiPerAnno, setDatiPerAnno] = useState({});
  const [confrontoAttivo, setConfrontoAttivo] = useState(false);
  const [commentoAI, setCommentoAI] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ═══════════════════════════════════════
  // CARICAMENTO DATI
  // ═══════════════════════════════════════
  useEffect(() => {
    caricaDatiAnno(annoPrimario);
  }, [annoPrimario]);

  useEffect(() => {
    if (confrontoAttivo) {
      anniConfronto.forEach(anno => {
        if (!datiPerAnno[anno]) {
          caricaDatiAnno(anno);
        }
      });
    }
  }, [confrontoAttivo, anniConfronto]);

  const caricaDatiAnno = async (anno) => {
    try {
      const response = await fetch(
        `${API_URL}/corrispettivi/report/${anno}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (!response.ok) throw new Error(`Errore caricamento dati ${anno}`);
      const data = await response.json();
      console.log(`📊 Dati ${anno}:`, data);
      setDatiPerAnno(prev => ({ ...prev, [anno]: data }));
      setLoading(false);
    } catch (err) {
      console.error('❌ Errore:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════
  // ELABORAZIONE DATI
  // ═══════════════════════════════════════
  const elaboraDatiAnno = (datiRaw) => {
    if (!datiRaw || !Array.isArray(datiRaw)) return [];
    return NOMI_MESI.map((nomeMese, index) => {
      const meseNum = index + 1;
      const datiMese = datiRaw.find(m => m._id === meseNum) || {};
      const totale = datiMese.totaleMese || 0;
      const iva22 = datiMese.iva22 || 0;
      const iva10 = datiMese.iva10 || 0;
      const iva4 = datiMese.iva4 || 0;
      const esente = datiMese.esente || 0;
      const iva22Scorp = iva22 > 0 ? iva22 - (iva22 / 1.22) : 0;
      const iva10Scorp = iva10 > 0 ? iva10 - (iva10 / 1.10) : 0;
      const iva4Scorp = iva4 > 0 ? iva4 - (iva4 / 1.04) : 0;
      const ivaTotale = iva22Scorp + iva10Scorp + iva4Scorp;
      const imponibile = totale - ivaTotale;
      return {
        mese: nomeMese,
        meseCompleto: NOMI_MESI_COMPLETI[index],
        meseNum,
        totale: parseFloat(totale.toFixed(2)),
        imponibile: parseFloat(imponibile.toFixed(2)),
        iva: parseFloat(ivaTotale.toFixed(2)),
        iva22, iva10, iva4, esente,
        giorniRegistrati: datiMese.giorniRegistrati || 0,
        mediaGiornaliera: datiMese.giorniRegistrati > 0
          ? parseFloat((totale / datiMese.giorniRegistrati).toFixed(2))
          : 0
      };
    });
  };

  const datiPrimario = useMemo(() =>
    elaboraDatiAnno(datiPerAnno[annoPrimario]),
    [datiPerAnno, annoPrimario]
  );

  const metriche = useMemo(() => {
    const totaleAnno = datiPrimario.reduce((s, m) => s + m.totale, 0);
    const mesiAttivi = datiPrimario.filter(m => m.totale > 0).length;
    const mediaMensile = mesiAttivi > 0 ? totaleAnno / mesiAttivi : 0;
    const ivaTotale = datiPrimario.reduce((s, m) => s + m.iva, 0);
    const meseMigliore = [...datiPrimario].sort((a, b) => b.totale - a.totale)[0];
    const mesePeggiore = [...datiPrimario].filter(m => m.totale > 0).sort((a, b) => a.totale - b.totale)[0];
    const giorniTotali = datiPrimario.reduce((s, m) => s + m.giorniRegistrati, 0);
    const mediaGiorn = giorniTotali > 0 ? totaleAnno / giorniTotali : 0;
    return {
      totaleAnno, mesiAttivi, mediaMensile, ivaTotale,
      meseMigliore, mesePeggiore, mediaGiornaliera: mediaGiorn,
      imponibileTotale: totaleAnno - ivaTotale, giorniTotali
    };
  }, [datiPrimario]);

  const metricheConfronto = useMemo(() => {
    if (!confrontoAttivo || anniConfronto.length === 0) return null;
    const annoPrec = anniConfronto[0];
    const datiPrec = elaboraDatiAnno(datiPerAnno[annoPrec]);
    const totPrec = datiPrec.reduce((s, m) => s + m.totale, 0);
    if (totPrec === 0) return null;
    const variazione = ((metriche.totaleAnno - totPrec) / totPrec * 100);
    const mesiPrecAttivi = datiPrec.filter(m => m.totale > 0).length;
    const mediaPrecMensile = mesiPrecAttivi > 0 ? totPrec / mesiPrecAttivi : 0;
    const varMedia = mediaPrecMensile > 0 ? ((metriche.mediaMensile - mediaPrecMensile) / mediaPrecMensile * 100) : 0;
    return {
      totalePrec: totPrec,
      varTotale: parseFloat(variazione.toFixed(1)),
      varMedia: parseFloat(varMedia.toFixed(1)),
      mesiPrecAttivi
    };
  }, [confrontoAttivo, anniConfronto, datiPerAnno, metriche]);

  // ═══════════════════════════════════════
  // DATI PER CONFRONTO MULTI-ANNO
  // ═══════════════════════════════════════
  const datiConfrontoMensile = useMemo(() => {
    const anniDaMostrare = [annoPrimario, ...(confrontoAttivo ? anniConfronto : [])];
    return NOMI_MESI.map((nomeMese, index) => {
      const meseNum = index + 1;
      const punto = { mese: nomeMese, meseNum };
      anniDaMostrare.forEach(anno => {
        const datiAnno = datiPerAnno[anno] || [];
        const datiMese = datiAnno.find(m => m._id === meseNum) || {};
        punto[`tot_${anno}`] = datiMese.totaleMese || 0;
      });
      return punto;
    });
  }, [datiPerAnno, annoPrimario, anniConfronto, confrontoAttivo]);

  // ═══════════════════════════════════════
  // ANALISI AI
  // ═══════════════════════════════════════
  const generaCommentoAI = () => {
    setLoadingAI(true);
    setTimeout(() => {
      const commento = analizzaDati();
      setCommentoAI(commento);
      setLoadingAI(false);
    }, 800);
  };

  const analizzaDati = () => {
    const mesiConDati = datiPrimario.filter(m => m.totale > 0);
    if (mesiConDati.length === 0) return '📊 Nessun dato disponibile per l\'analisi.';

    let analisi = [];

    analisi.push(`📊 **ANALISI ${annoPrimario}**`);
    analisi.push(`Fatturato totale: €${metriche.totaleAnno.toLocaleString('it-IT', { minimumFractionDigits: 2 })} in ${metriche.mesiAttivi} mesi attivi.`);
    analisi.push(`Media mensile: €${metriche.mediaMensile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}.`);

    if (metriche.meseMigliore && metriche.meseMigliore.totale > 0) {
      analisi.push(`\n🏆 **Mese migliore:** ${metriche.meseMigliore.meseCompleto} con €${metriche.meseMigliore.totale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}.`);
    }
    if (metriche.mesePeggiore && metriche.mesePeggiore.totale > 0) {
      analisi.push(`📉 **Mese più debole:** ${metriche.mesePeggiore.meseCompleto} con €${metriche.mesePeggiore.totale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}.`);
    }

    if (mesiConDati.length >= 3) {
      const primiTre = mesiConDati.slice(0, 3).reduce((s, m) => s + m.totale, 0) / 3;
      const ultimiTre = mesiConDati.slice(-3).reduce((s, m) => s + m.totale, 0) / 3;
      const trendPercent = primiTre > 0 ? ((ultimiTre - primiTre) / primiTre * 100).toFixed(1) : 0;
      if (trendPercent > 5) {
        analisi.push(`\n📈 **Trend positivo:** La media degli ultimi 3 mesi è superiore del ${trendPercent}% rispetto ai primi 3 mesi. L'attività è in crescita.`);
      } else if (trendPercent < -5) {
        analisi.push(`\n📉 **Trend negativo:** La media degli ultimi 3 mesi è inferiore del ${Math.abs(trendPercent)}% rispetto ai primi 3 mesi. Valutare strategie di rilancio.`);
      } else {
        analisi.push(`\n➡️ **Trend stabile:** La media è rimasta costante nel corso dell'anno.`);
      }
    }

    const mesiEstivi = datiPrimario.filter(m => [6, 7, 8].includes(m.meseNum) && m.totale > 0);
    const mesiInvernali = datiPrimario.filter(m => [11, 12, 1, 2].includes(m.meseNum) && m.totale > 0);
    if (mesiEstivi.length > 0 && mesiInvernali.length > 0) {
      const mediaEstiva = mesiEstivi.reduce((s, m) => s + m.totale, 0) / mesiEstivi.length;
      const mediaInvernale = mesiInvernali.reduce((s, m) => s + m.totale, 0) / mesiInvernali.length;
      if (mediaInvernale > mediaEstiva * 1.15) {
        analisi.push(`\n🎄 **Stagionalità:** I mesi invernali/festivi generano in media il ${((mediaInvernale / mediaEstiva - 1) * 100).toFixed(0)}% in più rispetto all'estate. Le festività (Natale, Carnevale, Pasqua) sono il periodo di punta.`);
      } else if (mediaEstiva > mediaInvernale * 1.15) {
        analisi.push(`\n☀️ **Stagionalità:** I mesi estivi superano quelli invernali del ${((mediaEstiva / mediaInvernale - 1) * 100).toFixed(0)}%.`);
      }
    }

    if (metriche.giorniTotali > 0) {
      analisi.push(`\n💰 **Media giornaliera:** €${metriche.mediaGiornaliera.toLocaleString('it-IT', { minimumFractionDigits: 2 })} su ${metriche.giorniTotali} giorni lavorativi.`);
      const mesiOrd = [...mesiConDati].sort((a, b) => b.mediaGiornaliera - a.mediaGiornaliera);
      if (mesiOrd[0]) {
        analisi.push(`Il mese con la migliore media giornaliera è ${mesiOrd[0].meseCompleto}: €${mesiOrd[0].mediaGiornaliera.toLocaleString('it-IT', { minimumFractionDigits: 2 })}/giorno.`);
      }
    }

    if (confrontoAttivo && metricheConfronto) {
      const { varTotale, totalePrec } = metricheConfronto;
      analisi.push(`\n🔄 **Confronto con ${anniConfronto[0]}:**`);
      analisi.push(`Anno precedente: €${totalePrec.toLocaleString('it-IT', { minimumFractionDigits: 2 })}.`);
      if (varTotale > 0) {
        analisi.push(`📈 Crescita del ${varTotale}%. Ottimo andamento!`);
      } else if (varTotale < 0) {
        analisi.push(`📉 Calo del ${Math.abs(varTotale)}%. Analizzare le cause e valutare azioni correttive.`);
      } else {
        analisi.push(`➡️ Andamento stabile rispetto all'anno precedente.`);
      }
      const datiPrec = elaboraDatiAnno(datiPerAnno[anniConfronto[0]]);
      let mesiInCrescita = 0;
      const mesiConfrontabili = datiPrimario.filter((m, i) => m.totale > 0 && datiPrec[i].totale > 0).length;
      datiPrimario.forEach((m, i) => {
        if (m.totale > 0 && datiPrec[i].totale > 0 && m.totale > datiPrec[i].totale) mesiInCrescita++;
      });
      if (mesiConfrontabili > 0) {
        analisi.push(`${mesiInCrescita}/${mesiConfrontabili} mesi in crescita rispetto al ${anniConfronto[0]}.`);
      }
    }

    const percIva = metriche.totaleAnno > 0 ? (metriche.ivaTotale / metriche.totaleAnno * 100).toFixed(1) : 0;
    analisi.push(`\n🧾 **IVA:** L'incidenza IVA è del ${percIva}% sul fatturato (€${metriche.ivaTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}).`);

    analisi.push(`\n💡 **Suggerimenti:**`);
    const meseCorrente = new Date().getMonth();
    if (annoPrimario === annoCorrente && metriche.mesiAttivi < 12 && metriche.mediaMensile > 0) {
      const mesiRimanenti = 12 - metriche.mesiAttivi;
      const previsioneFineAnno = metriche.totaleAnno + (metriche.mediaMensile * mesiRimanenti);
      analisi.push(`Se la media si mantiene, il fatturato a fine anno sarà circa €${previsioneFineAnno.toLocaleString('it-IT', { minimumFractionDigits: 2 })}.`);
    }
    if (metriche.mesePeggiore && metriche.meseMigliore) {
      const gap = metriche.meseMigliore.totale - metriche.mesePeggiore.totale;
      if (gap > metriche.mediaMensile * 0.5) {
        analisi.push(`C'è una differenza significativa (€${gap.toLocaleString('it-IT', { minimumFractionDigits: 2 })}) tra il mese migliore e peggiore. Valutare promozioni nei mesi deboli.`);
      }
    }

    return analisi.join('\n');
  };

  // ═══════════════════════════════════════
  // FORMATTATORI
  // ═══════════════════════════════════════
  const formatEuro = (value) => {
    if (value === undefined || value === null) return '€0,00';
    return `€${Number(value).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatPercent = (value) => {
    if (!isFinite(value)) return '0%';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{label}</Typography>
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

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  if (loading && !datiPerAnno[annoPrimario]) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={50} />
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ mt: 3, borderRadius: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Errore nel caricamento dei dati: {error}
        <Box sx={{ mt: 1 }}>
          <IconButton onClick={() => { setError(null); setLoading(true); caricaDatiAnno(annoPrimario); }}>
            <Refresh /> Riprova
          </IconButton>
        </Box>
      </Alert>
    );
  }

  const anniDisponibili = [2023, 2024, 2025, 2026];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>

      {/* ═══ HEADER ═══ */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          📊 Grafici Corrispettivi
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControlLabel
            control={<Switch checked={confrontoAttivo} onChange={(e) => setConfrontoAttivo(e.target.checked)} color="primary" />}
            label={<Typography variant="body2">Confronta anni</Typography>}
          />
          {confrontoAttivo && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Confronta con</InputLabel>
              <Select value={anniConfronto[0]} onChange={(e) => setAnniConfronto([e.target.value])} label="Confronta con">
                {anniDisponibili.filter(a => a !== annoPrimario).map(a => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Anno</InputLabel>
            <Select value={annoPrimario} onChange={(e) => setAnnoPrimario(e.target.value)} label="Anno">
              {anniDisponibili.map(a => (<MenuItem key={a} value={a}>{a}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* ═══ KPI CARDS ═══ */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Euro sx={{ color: COLORI.primario, fontSize: 20 }} />
                <Typography variant="body2" color="textSecondary">Totale Anno</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatEuro(metriche.totaleAnno)}</Typography>
              {confrontoAttivo && metricheConfronto && (
                <Chip size="small" icon={metricheConfronto.varTotale >= 0 ? <TrendingUp /> : <TrendingDown />}
                  label={formatPercent(metricheConfronto.varTotale)}
                  color={metricheConfronto.varTotale >= 0 ? 'success' : 'error'} sx={{ mt: 0.5, fontSize: 11 }} />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <TrendingUp sx={{ color: COLORI.secondario, fontSize: 20 }} />
                <Typography variant="body2" color="textSecondary">Media Mensile</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatEuro(metriche.mediaMensile)}</Typography>
              {confrontoAttivo && metricheConfronto && (
                <Chip size="small" icon={metricheConfronto.varMedia >= 0 ? <TrendingUp /> : <TrendingDown />}
                  label={formatPercent(metricheConfronto.varMedia)}
                  color={metricheConfronto.varMedia >= 0 ? 'success' : 'error'} sx={{ mt: 0.5, fontSize: 11 }} />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Assessment sx={{ color: COLORI.warning, fontSize: 20 }} />
                <Typography variant="body2" color="textSecondary">IVA Totale</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatEuro(metriche.ivaTotale)}</Typography>
              <Typography variant="caption" color="textSecondary">
                {metriche.totaleAnno > 0 ? (metriche.ivaTotale / metriche.totaleAnno * 100).toFixed(1) : 0}% del fatturato
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: '#fce4ec', height: '100%' }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CalendarToday sx={{ color: COLORI.error, fontSize: 20 }} />
                <Typography variant="body2" color="textSecondary">Mesi Attivi</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{metriche.mesiAttivi}/12</Typography>
              {metriche.meseMigliore && metriche.meseMigliore.totale > 0 && (
                <Typography variant="caption" color="textSecondary">
                  🏆 {metriche.meseMigliore.mese}: {formatEuro(metriche.meseMigliore.totale)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ═══ TABS ═══ */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<ShowChart />} label="Fatturato" />
          <Tab icon={<BarChartIcon />} label="Imponibile vs IVA" />
          <Tab icon={<CompareArrows />} label="Confronto Mesi" />
          <Tab icon={<PieChartIcon />} label="Distribuzione IVA" />
          <Tab icon={<CalendarToday />} label="Tabella Dettaglio" />
          <Tab icon={<SmartToy />} label="Analisi AI" />
        </Tabs>
      </Paper>

      {/* ═══ TAB 0: FATTURATO MENSILE ═══ */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              💰 Fatturato Mensile {confrontoAttivo ? `${annoPrimario} vs ${anniConfronto[0]}` : annoPrimario}
            </Typography>
            <ResponsiveContainer width="100%" height={420}>
              {confrontoAttivo ? (
                <ComposedChart data={datiConfrontoMensile}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mese" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey={`tot_${annoPrimario}`} stroke={COLORI.anno1} fill={COLORI.anno1}
                    fillOpacity={0.15} strokeWidth={2} name={`${annoPrimario}`} />
                  <Line type="monotone" dataKey={`tot_${anniConfronto[0]}`} stroke={COLORI.anno2}
                    strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name={`${anniConfronto[0]}`} />
                </ComposedChart>
              ) : (
                <AreaChart data={datiPrimario}>
                  <defs>
                    <linearGradient id="gradFatturato" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORI.primario} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORI.primario} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mese" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="totale" stroke={COLORI.primario} fillOpacity={1}
                    fill="url(#gradFatturato)" strokeWidth={2} name="Fatturato Totale" dot={{ r: 4, fill: COLORI.primario }} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB 1: IMPONIBILE VS IVA ═══ */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📊 Imponibile vs IVA - {annoPrimario}
            </Typography>
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={datiPrimario}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mese" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="imponibile" fill={COLORI.secondario} name="Imponibile" radius={[4, 4, 0, 0]} />
                <Bar dataKey="iva" fill={COLORI.warning} name="IVA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB 2: CONFRONTO MESI ═══ */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📅 Confronto Mese per Mese {confrontoAttivo ? `(${annoPrimario} vs ${anniConfronto[0]})` : annoPrimario}
                </Typography>
                {!confrontoAttivo && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Attiva "Confronta anni" in alto per vedere il confronto tra due anni.
                  </Alert>
                )}
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Mese</strong></TableCell>
                        <TableCell align="right"><strong>{annoPrimario}</strong></TableCell>
                        {confrontoAttivo && (
                          <>
                            <TableCell align="right"><strong>{anniConfronto[0]}</strong></TableCell>
                            <TableCell align="right"><strong>Variazione</strong></TableCell>
                            <TableCell align="center" sx={{ width: 150 }}><strong>Trend</strong></TableCell>
                          </>
                        )}
                        <TableCell align="right"><strong>€/Giorno</strong></TableCell>
                        <TableCell align="right"><strong>Giorni</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {datiPrimario.map((mese, i) => {
                        const datiPrec = confrontoAttivo && datiPerAnno[anniConfronto[0]]
                          ? (datiPerAnno[anniConfronto[0]].find(m => m._id === mese.meseNum) || {})
                          : {};
                        const totPrec = datiPrec.totaleMese || 0;
                        const variazione = totPrec > 0 ? ((mese.totale - totPrec) / totPrec * 100) : null;
                        const maxTotale = Math.max(...datiPrimario.map(m => m.totale), 1);
                        const barWidth = mese.totale > 0 ? (mese.totale / maxTotale * 100) : 0;
                        return (
                          <TableRow key={i} hover sx={{ bgcolor: mese.totale === 0 ? '#fafafa' : 'inherit' }}>
                            <TableCell><strong>{mese.meseCompleto}</strong></TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontWeight: mese.totale > 0 ? 600 : 400, color: mese.totale === 0 ? '#bbb' : 'inherit' }}>
                                {formatEuro(mese.totale)}
                              </Typography>
                            </TableCell>
                            {confrontoAttivo && (
                              <>
                                <TableCell align="right">
                                  <Typography sx={{ color: totPrec === 0 ? '#bbb' : 'inherit' }}>{formatEuro(totPrec)}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  {variazione !== null ? (
                                    <Chip size="small" label={formatPercent(variazione)}
                                      color={variazione >= 0 ? 'success' : 'error'} variant="outlined" sx={{ fontSize: 11 }} />
                                  ) : <Typography variant="caption" color="textSecondary">—</Typography>}
                                </TableCell>
                                <TableCell>
                                  <LinearProgress variant="determinate" value={barWidth}
                                    sx={{ height: 8, borderRadius: 4, bgcolor: '#e0e0e0',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: variazione !== null && variazione >= 0 ? COLORI.secondario : COLORI.primario,
                                        borderRadius: 4 }}} />
                                </TableCell>
                              </>
                            )}
                            <TableCell align="right">{mese.mediaGiornaliera > 0 ? formatEuro(mese.mediaGiornaliera) : '—'}</TableCell>
                            <TableCell align="right">{mese.giorniRegistrati || '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {metriche.mesiAttivi >= 4 && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>🎯 Profilo Stagionale</Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={datiPrimario}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="mese" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis />
                      <Radar name={`${annoPrimario}`} dataKey="totale" stroke={COLORI.anno1} fill={COLORI.anno1} fillOpacity={0.3} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid item xs={12} md={metriche.mesiAttivi >= 4 ? 6 : 12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>🏆 Classifica Mesi {annoPrimario}</Typography>
                {[...datiPrimario].filter(m => m.totale > 0).sort((a, b) => b.totale - a.totale)
                  .map((mese, i) => {
                    const maxVal = datiPrimario.reduce((max, m) => Math.max(max, m.totale), 0);
                    return (
                      <Box key={i} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                          <Typography variant="body2" sx={{ fontWeight: i < 3 ? 700 : 400 }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {mese.meseCompleto}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatEuro(mese.totale)}</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={maxVal > 0 ? (mese.totale / maxVal * 100) : 0}
                          sx={{ height: 10, borderRadius: 5, bgcolor: '#e8eaf6',
                            '& .MuiLinearProgress-bar': { borderRadius: 5,
                              bgcolor: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : COLORI.primario }}} />
                      </Box>
                    );
                  })}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ═══ TAB 3: DISTRIBUZIONE IVA ═══ */}
      {tabValue === 3 && (() => {
        const distribuzioneIva = (() => {
          const totali = (datiPerAnno[annoPrimario] || []).reduce((acc, mese) => {
            acc.iva22 += mese.iva22 || 0;
            acc.iva10 += mese.iva10 || 0;
            acc.iva4 += mese.iva4 || 0;
            acc.esente += mese.esente || 0;
            return acc;
          }, { iva22: 0, iva10: 0, iva4: 0, esente: 0 });
          return [
            { nome: 'IVA 22%', valore: totali.iva22, colore: COLORI.iva22 },
            { nome: 'IVA 10%', valore: totali.iva10, colore: COLORI.iva10 },
            { nome: 'IVA 4%', valore: totali.iva4, colore: COLORI.iva4 },
            { nome: 'Esente', valore: totali.esente, colore: COLORI.esente }
          ].filter(item => item.valore > 0);
        })();
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>🥧 Distribuzione per Aliquota IVA</Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie data={distribuzioneIva} dataKey="valore" nameKey="nome" cx="50%" cy="50%"
                        outerRadius={110} innerRadius={50}
                        label={(entry) => `${entry.nome}: ${formatEuro(entry.valore)}`}>
                        {distribuzioneIva.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.colore} />
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
                  <Typography variant="h6" gutterBottom>📊 Dettagli Aliquote</Typography>
                  <TableContainer>
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
                          const percentuale = metriche.totaleAnno > 0
                            ? (item.valore / metriche.totaleAnno * 100).toFixed(1) : '0.0';
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Chip label={item.nome} size="small" sx={{ bgcolor: item.colore, color: 'white' }} />
                              </TableCell>
                              <TableCell align="right">{formatEuro(item.valore)}</TableCell>
                              <TableCell align="right">{percentuale}%</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell><strong>TOTALE</strong></TableCell>
                          <TableCell align="right"><strong>{formatEuro(metriche.totaleAnno)}</strong></TableCell>
                          <TableCell align="right"><strong>100%</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      })()}

      {/* ═══ TAB 4: TABELLA DETTAGLIO ═══ */}
      {tabValue === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>📋 Dettaglio Mensile {annoPrimario}</Typography>
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
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
                    <TableCell align="right"><strong>Giorni</strong></TableCell>
                    <TableCell align="right"><strong>€/Giorno</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datiPrimario.filter(m => m.totale > 0).map((mese, index) => (
                    <TableRow key={index} hover>
                      <TableCell><strong>{mese.meseCompleto}</strong></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatEuro(mese.totale)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.imponibile)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.iva)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.iva22)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.iva10)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.iva4)}</TableCell>
                      <TableCell align="right">{formatEuro(mese.esente)}</TableCell>
                      <TableCell align="right">{mese.giorniRegistrati}</TableCell>
                      <TableCell align="right">{formatEuro(mese.mediaGiornaliera)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                    <TableCell><strong>TOTALE ANNO</strong></TableCell>
                    <TableCell align="right"><strong>{formatEuro(metriche.totaleAnno)}</strong></TableCell>
                    <TableCell align="right"><strong>{formatEuro(metriche.imponibileTotale)}</strong></TableCell>
                    <TableCell align="right"><strong>{formatEuro(metriche.ivaTotale)}</strong></TableCell>
                    <TableCell align="right" colSpan={4}>—</TableCell>
                    <TableCell align="right"><strong>{metriche.giorniTotali}</strong></TableCell>
                    <TableCell align="right"><strong>{formatEuro(metriche.mediaGiornaliera)}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB 5: ANALISI AI ═══ */}
      {tabValue === 5 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToy color="primary" /> 🤖 Analisi Intelligente
              </Typography>
              <IconButton onClick={generaCommentoAI} color="primary" disabled={loadingAI}>
                <Refresh />
              </IconButton>
            </Box>
            {loadingAI && <LinearProgress sx={{ mb: 2 }} />}
            {!commentoAI && !loadingAI && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <SmartToy sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Analisi AI dei corrispettivi
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Clicca per generare un'analisi dettagliata dei dati {annoPrimario}
                  {confrontoAttivo ? ` con confronto ${anniConfronto[0]}` : ''}.
                </Typography>
                <Chip label="🔍 Genera Analisi" onClick={generaCommentoAI} color="primary"
                  sx={{ fontSize: 16, py: 2.5, px: 3, cursor: 'pointer' }} />
              </Box>
            )}
            {commentoAI && (
              <Paper sx={{ p: 3, bgcolor: '#f8f9fa', borderLeft: `4px solid ${COLORI.primario}`,
                whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14 }}>
                {commentoAI.split('\n').map((riga, i) => {
                  if (riga.match(/^\S+ \*\*/)) {
                    const clean = riga.replace(/\*\*/g, '');
                    return <Typography key={i} sx={{ fontWeight: 700, mt: i > 0 ? 1.5 : 0, fontSize: 15 }}>{clean}</Typography>;
                  }
                  if (riga === '') return <Box key={i} sx={{ height: 8 }} />;
                  return <Typography key={i} variant="body2" sx={{ ml: 1, lineHeight: 1.8 }}>{riga}</Typography>;
                })}
              </Paper>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GraficiCorrispettivi;