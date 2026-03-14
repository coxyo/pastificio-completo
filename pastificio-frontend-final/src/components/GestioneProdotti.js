// components/GestioneProdotti.js - GESTIONE COMPLETA PRODOTTI CON RICETTE E COSTI
// v3.3.1 - fix: bottone listino usa /api/listino/pdf
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Paper, Typography, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Select, MenuItem, FormControl, InputLabel, Switch,
  FormControlLabel, Alert, Snackbar, CircularProgress, Tabs, Tab,
  Tooltip, InputAdornment, Menu, Card, CardContent, Divider,
  Accordion, AccordionSummary, AccordionDetails, LinearProgress,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  ExpandMore as ExpandMoreIcon,
  Restaurant as RecipeIcon,
  Euro as EuroIcon,
  TrendingUp as TrendingUpIcon,
  List as ListIcon,
  TableChart as TableIcon,
  Settings as SettingsIcon,
  Calculate as CalcIcon,
  Save as SaveIcon,
  Lock as LockIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

const CATEGORIE = ['Ravioli', 'Dolci', 'Pardulas', 'Panadas', 'Pasta', 'Altro'];
const UNITA_MISURA = ['Kg', 'g', 'pz', 'dozzina', 'mezzo kg', '€'];
const UNITA_RICETTA = ['kg', 'g', 'l', 'ml', 'pz'];

// Utenti autorizzati ad accedere a questa pagina
const UTENTI_AUTORIZZATI = ['admin', 'maurizio', 'valentina'];

// ============================================================
// COMPONENTE PRINCIPALE
// ============================================================
export default function GestioneProdotti() {
  const [utente, setUtente] = useState(null);
  const [accessoNegato, setAccessoNegato] = useState(false);
  const [prodotti, setProdotti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ricettaDialogOpen, setRicettaDialogOpen] = useState(false);
  const [costiDialogOpen, setCostiDialogOpen] = useState(false);
  const [comparativaOpen, setComparativaOpen] = useState(false);
  const [prodottoSelezionato, setProdottoSelezionato] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroDisponibilita, setFiltroDisponibilita] = useState('tutti');
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [statistiche, setStatistiche] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [prodottoMenu, setProdottoMenu] = useState(null);
  const [viewMode, setViewMode] = useState('lista'); // lista | comparativa

  // Stato ricetta
  const [ricettaCorrente, setRicettaCorrente] = useState([]);
  const [ingredientiDisponibili, setIngredientiDisponibili] = useState([]);
  const [nuovaVoceRicetta, setNuovaVoceRicetta] = useState({
    ingredienteId: '', ingredienteNome: '', quantitaPerKg: '', unita: 'kg'
  });
  const [loadingRicetta, setLoadingRicetta] = useState(false);

  // Stato istruzioni ricetta
  const [istruzioni, setIstruzioni] = useState({ preparazione: '', cottura: '', consigli: '' });

  // Resa ricetta: quanti kg di prodotto finito escono dagli ingredienti inseriti
  const [resaRicetta, setResaRicetta] = useState(1);

  // Stato configurazione costi
  const [configCosti, setConfigCosti] = useState({
    overhead: { energia: 15, gas: 8, manodopera: 25, affitto: 5, tasse: 10, imballaggi: 3, varie: 5 },
    margineConsigliato: 70
  });

  // Stato comparativa
  const [datiComparativa, setDatiComparativa] = useState([]);
  const [ordinamentoComparativa, setOrdinamentoComparativa] = useState('profittoMese');
  const [loadingComparativa, setLoadingComparativa] = useState(false);

  // Form prodotto base
  const [formData, setFormData] = useState({
    nome: '', descrizione: '', categoria: 'Ravioli',
    prezzoKg: 0, prezzoPezzo: 0, pezziPerKg: null,
    unitaMisuraDisponibili: ['Kg'], disponibile: true, attivo: true,
    allergeni: [], ingredienti: [], note: '',
    includiInListino: false, ingredientiListino: ''
  });

  // ============================================================
  // CONTROLLO ACCESSO
  // ============================================================
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const u = JSON.parse(userData);
        setUtente(u);
        const username = (u.username || u.nome || '').toLowerCase();
        const ruolo = (u.ruolo || u.role || '').toLowerCase();
        const autorizzato = UTENTI_AUTORIZZATI.includes(username) || ruolo === 'admin';
        if (!autorizzato) setAccessoNegato(true);
      } else {
        setAccessoNegato(true);
      }
    } catch {
      setAccessoNegato(true);
    }
  }, []);

  useEffect(() => {
    if (!accessoNegato && utente) {
      caricaProdotti();
      caricaStatistiche();
      caricaIngredientiDisponibili();
      caricaConfigCosti();
    }
  }, [accessoNegato, utente]);

  // ============================================================
  // SCHERMATA ACCESSO NEGATO
  // ============================================================
  if (accessoNegato) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <LockIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
        <Typography variant="h5" gutterBottom>Accesso riservato</Typography>
        <Typography color="textSecondary">
          Questa sezione è accessibile solo ad Admin e Valentina.
        </Typography>
      </Container>
    );
  }

  // ============================================================
  // CARICAMENTO DATI
  // ============================================================
  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const caricaProdotti = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_URL}/prodotti`, { headers: getHeaders() });
      if (r.ok) {
        const d = await r.json();
        setProdotti(d.data || []);
      }
    } catch (e) {
      mostraNotifica('Errore caricamento prodotti', 'error');
    } finally {
      setLoading(false);
    }
  };

  const caricaStatistiche = async () => {
    try {
      const r = await fetch(`${API_URL}/prodotti/statistiche`, { headers: getHeaders() });
      if (r.ok) {
        const d = await r.json();
        setStatistiche(d.statistiche);
      }
    } catch {}
  };

  const caricaIngredientiDisponibili = async () => {
    try {
      const r = await fetch(`${API_URL}/prodotti/ingredienti-disponibili`, { headers: getHeaders() });
      if (r.ok) {
        const d = await r.json();
        setIngredientiDisponibili(d.data || []);
      }
    } catch {}
  };

  const caricaConfigCosti = async () => {
    try {
      const r = await fetch(`${API_URL}/prodotti/configurazione-costi`, { headers: getHeaders() });
      if (r.ok) {
        const d = await r.json();
        setConfigCosti(d.data);
      }
    } catch {}
  };

  const caricaComparativa = async () => {
    try {
      setLoadingComparativa(true);
      const r = await fetch(`${API_URL}/prodotti/comparativa?periodo=30`, { headers: getHeaders() });
      if (r.ok) {
        const d = await r.json();
        setDatiComparativa(d.data || []);
      }
    } catch {
      mostraNotifica('Errore caricamento comparativa', 'error');
    } finally {
      setLoadingComparativa(false);
    }
  };

  // ============================================================
  // OPERAZIONI PRODOTTO BASE
  // ============================================================
  const salvaProdotto = async () => {
    try {
      setLoading(true);
      const url = prodottoSelezionato
        ? `${API_URL}/prodotti/${prodottoSelezionato._id}`
        : `${API_URL}/prodotti`;
      const method = prodottoSelezionato ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(formData) });
      if (r.ok) {
        await caricaProdotti();
        await caricaStatistiche();
        setDialogOpen(false);
        resetForm();
        mostraNotifica(prodottoSelezionato ? 'Prodotto aggiornato' : 'Prodotto creato', 'success');
      } else {
        const e = await r.json();
        throw new Error(e.message || 'Errore salvataggio');
      }
    } catch (e) {
      mostraNotifica(e.message || 'Errore salvataggio prodotto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const eliminaProdotto = async (id) => {
    if (!confirm('Confermi disattivazione prodotto?')) return;
    try {
      const r = await fetch(`${API_URL}/prodotti/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (r.ok) {
        await caricaProdotti();
        mostraNotifica('Prodotto disattivato', 'success');
      }
    } catch {
      mostraNotifica('Errore eliminazione', 'error');
    }
  };

  const toggleDisponibilita = async (prodotto) => {
    try {
      const r = await fetch(`${API_URL}/prodotti/${prodotto._id}/disponibilita`, {
        method: 'PATCH', headers: getHeaders(),
        body: JSON.stringify({ disponibile: !prodotto.disponibile })
      });
      if (r.ok) await caricaProdotti();
    } catch {}
  };

  const scaricaListinoPDF = async (categoria = null) => {
    try {
      setLoading(true);
      const url = categoria
        ? `${API_URL}/prodotti/export/pdf/${categoria}`
        : `${API_URL}/prodotti/export/pdf?disponibiliOnly=true`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (r.ok) {
        const blob = await r.blob();
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = `listino-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        mostraNotifica('PDF scaricato!', 'success');
      }
    } catch {
      mostraNotifica('Errore generazione PDF', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Genera listino prezzi completo con layout grafico (allergeni, ingredienti, prezzi dal DB)
  const scaricaListinoCompleto = async () => {
    try {
      setLoading(true);
      mostraNotifica('Generazione listino in corso...', 'info');
      const r = await fetch(`${API_URL}/listino/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (r.ok) {
        const blob = await r.blob();
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = `listino-prezzi-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        mostraNotifica('Listino scaricato!', 'success');
      } else {
        throw new Error('Errore generazione');
      }
    } catch {
      mostraNotifica('Errore generazione listino', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // GESTIONE RICETTA
  // ============================================================
  const apriRicetta = async (prodotto) => {
    setProdottoSelezionato(prodotto);
    setLoadingRicetta(true);
    setRicettaDialogOpen(true);
    try {
      const r = await fetch(`${API_URL}/prodotti/${prodotto._id}/ricetta`, { headers: getHeaders() });
      if (r.ok) {
        const d = await r.json();
        setRicettaCorrente(d.data.ricetta || []);
        setIstruzioni(d.data.istruzioni || { preparazione: '', cottura: '', consigli: '' });
        setResaRicetta(d.data.resaRicetta || 1);
      }
    } catch {
      setRicettaCorrente([]);
    } finally {
      setLoadingRicetta(false);
    }
  };

  const salvaRicetta = async () => {
    try {
      setLoadingRicetta(true);
      const r = await fetch(`${API_URL}/prodotti/${prodottoSelezionato._id}/ricetta`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({
          ricetta: ricettaCorrente,
          istruzioni,
          resaRicetta: parseFloat(resaRicetta) || 1
        })
      });
      if (r.ok) {
        await caricaProdotti();
        setRicettaDialogOpen(false);
        mostraNotifica('Ricetta salvata e costi ricalcolati', 'success');
      } else {
        const e = await r.json();
        throw new Error(e.message);
      }
    } catch (e) {
      mostraNotifica(e.message || 'Errore salvataggio ricetta', 'error');
    } finally {
      setLoadingRicetta(false);
    }
  };

  const aggiungiVoceRicetta = () => {
    if (!nuovaVoceRicetta.ingredienteNome || !nuovaVoceRicetta.quantitaPerKg) {
      mostraNotifica('Inserisci ingrediente e quantità', 'warning');
      return;
    }
    const ingrediente = ingredientiDisponibili.find(i => i._id === nuovaVoceRicetta.ingredienteId);
    const prezzoSnap = ingrediente?.ultimoPrezzoAcquisto || ingrediente?.prezzoMedioAcquisto || 0;
    const qty = parseFloat(nuovaVoceRicetta.quantitaPerKg);
    setRicettaCorrente(prev => [...prev, {
      ingredienteId: nuovaVoceRicetta.ingredienteId || null,
      ingredienteNome: nuovaVoceRicetta.ingredienteNome,
      quantitaPerKg: qty,
      unita: nuovaVoceRicetta.unita,
      prezzoUnitarioSnapshot: prezzoSnap,
      costoCalcolato: prezzoSnap * qty
    }]);
    setNuovaVoceRicetta({ ingredienteId: '', ingredienteNome: '', quantitaPerKg: '', unita: 'kg' });
  };

  const rimuoviVoceRicetta = (idx) => {
    setRicettaCorrente(prev => prev.filter((_, i) => i !== idx));
  };

  const totaleIngredientiRicetta = ricettaCorrente.reduce((sum, v) => sum + (v.costoCalcolato || 0), 0);

  // Costo ingredienti per 1 kg di prodotto FINITO, tenendo conto della resa
  const resaEffettiva = parseFloat(resaRicetta) || 1;
  const costoIngredientiPerKgFinito = resaEffettiva > 0 ? totaleIngredientiRicetta / resaEffettiva : totaleIngredientiRicetta;

  const totaleOverhead = Object.values(configCosti.overhead || {}).reduce((s, v) => s + (v || 0), 0);
  const costoTotaleStimato = costoIngredientiPerKgFinito * (1 + totaleOverhead / 100);
  const prezzoVendita = prodottoSelezionato?.prezzoKg || 0;
  const prezzoVenditaNetto = prezzoVendita > 0 ? prezzoVendita / 1.10 : 0;
  const margineStimato = costoTotaleStimato > 0 && prezzoVenditaNetto > 0
    ? ((prezzoVenditaNetto - costoTotaleStimato) / costoTotaleStimato) * 100
    : null;

  // ============================================================
  // CONFIGURAZIONE COSTI GLOBALE
  // ============================================================
  const salvaConfigCosti = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_URL}/prodotti/configurazione-costi`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify(configCosti)
      });
      if (r.ok) {
        setCostiDialogOpen(false);
        await caricaProdotti();
        mostraNotifica('Configurazione salvata e prodotti ricalcolati', 'success');
      }
    } catch {
      mostraNotifica('Errore salvataggio configurazione', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORM HELPERS
  // ============================================================
  const apriDialogModifica = (prodotto) => {
    setProdottoSelezionato(prodotto);
    setFormData({
      nome: prodotto.nome, descrizione: prodotto.descrizione || '',
      categoria: prodotto.categoria, prezzoKg: prodotto.prezzoKg || 0,
      prezzoPezzo: prodotto.prezzoPezzo || 0, pezziPerKg: prodotto.pezziPerKg || null,
      unitaMisuraDisponibili: prodotto.unitaMisuraDisponibili || ['Kg'],
      disponibile: prodotto.disponibile, attivo: prodotto.attivo,
      allergeni: prodotto.allergeni || [], ingredienti: prodotto.ingredienti || [],
      note: prodotto.note || '',
      includiInListino: prodotto.includiInListino || false,
      ingredientiListino: prodotto.ingredientiListino || ''
    });
    setDialogOpen(true);
  };

  const apriDialogNuovo = () => {
    resetForm();
    setProdottoSelezionato(null);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '', descrizione: '', categoria: 'Ravioli',
      prezzoKg: 0, prezzoPezzo: 0, pezziPerKg: null,
      unitaMisuraDisponibili: ['Kg'], disponibile: true, attivo: true,
      allergeni: [], ingredienti: [], note: ''
    });
  };

  const mostraNotifica = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // ============================================================
  // FILTRAGGIO
  // ============================================================
  const prodottiFiltrati = prodotti.filter(p => {
    const matchSearch = !searchTerm ||
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descrizione && p.descrizione.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategoria = !filtroCategoria || p.categoria === filtroCategoria;
    const matchDisp = filtroDisponibilita === 'tutti' ||
      (filtroDisponibilita === 'disponibili' && p.disponibile) ||
      (filtroDisponibilita === 'non_disponibili' && !p.disponibile);
    return matchSearch && matchCategoria && matchDisp;
  });

  const prodottiPerCategoria = CATEGORIE.map(cat => ({
    categoria: cat,
    prodotti: prodottiFiltrati.filter(p => p.categoria === cat)
  }));

  // ============================================================
  // HELPERS UI
  // ============================================================
  const getMargineColor = (margine) => {
    if (!margine && margine !== 0) return '#9e9e9e';
    if (margine >= 150) return '#2E7B00';
    if (margine >= 80) return '#C8A830';
    return '#d32f2f';
  };

  const getMargineLabel = (margine) => {
    if (!margine && margine !== 0) return '—';
    if (margine >= 150) return `${margine.toFixed(0)}% ✓`;
    if (margine >= 80) return `${margine.toFixed(0)}% ⚠`;
    return `${margine.toFixed(0)}% ✗`;
  };

  // ============================================================
  // RENDER
  // ============================================================
  const prodottiListaCorrente = tabValue === 0
    ? prodottiFiltrati
    : prodottiPerCategoria[tabValue - 1]?.prodotti || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#3E2723' }}>
            🧀 Gestione Prodotti
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Configurazione costi fissi">
              <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setCostiDialogOpen(true)}>
                Costi
              </Button>
            </Tooltip>
            <Button variant="outlined" startIcon={<TableIcon />}
              onClick={() => { setViewMode('comparativa'); caricaComparativa(); }}>
              Comparativa
            </Button>
            <Button variant="contained" color="secondary" startIcon={<PdfIcon />}
              onClick={scaricaListinoCompleto} disabled={loading}
              sx={{ background: '#1A3D0F', '&:hover': { background: '#2E6B1A' } }}>
              🖨️ Listino Prezzi
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={apriDialogNuovo}>
              Nuovo
            </Button>
            <IconButton onClick={() => { caricaProdotti(); caricaStatistiche(); }} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Statistiche */}
        {statistiche && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Totali', value: statistiche.totale, color: '#3E2723' },
              { label: 'Disponibili', value: statistiche.disponibili, color: '#2E7B00' },
              { label: 'Non disponibili', value: statistiche.nonDisponibili, color: '#C8A830' },
              { label: 'Con ricetta', value: statistiche.conRicetta || 0, color: '#5D4037' }
            ].map(s => (
              <Grid item xs={6} sm={3} key={s.label}>
                <Card sx={{ borderTop: `4px solid ${s.color}`, borderRadius: 2 }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography color="textSecondary" variant="caption">{s.label}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Filtri */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" placeholder="Cerca prodotto..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select value={filtroCategoria} label="Categoria" onChange={e => setFiltroCategoria(e.target.value)}>
                  <MenuItem value="">Tutte</MenuItem>
                  {CATEGORIE.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Disponibilità</InputLabel>
                <Select value={filtroDisponibilita} label="Disponibilità" onChange={e => setFiltroDisponibilita(e.target.value)}>
                  <MenuItem value="tutti">Tutti</MenuItem>
                  <MenuItem value="disponibili">Disponibili</MenuItem>
                  <MenuItem value="non_disponibili">Non disponibili</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* ============================================================ */}
      {/* VISTA LISTA */}
      {/* ============================================================ */}
      {viewMode === 'lista' && (
        <Paper>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Tutti" />
            {CATEGORIE.map(cat => (
              <Tab key={cat} label={`${cat} (${prodottiFiltrati.filter(p => p.categoria === cat).length})`} />
            ))}
          </Tabs>

          <TableContainer>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: '#f5f5f5' }}>
                    <TableCell>Nome</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Prezzo</TableCell>
                    <TableCell>Costo Prod.</TableCell>
                    <TableCell>Margine</TableCell>
                    <TableCell>Ricetta</TableCell>
                    <TableCell>Disponibile</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prodottiListaCorrente.map(p => (
                    <TableRow key={p._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{p.nome}</Typography>
                        {p.descrizione && <Typography variant="caption" color="textSecondary">{p.descrizione}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip label={p.categoria} size="small" variant="outlined" sx={{ borderColor: '#2E7B00', color: '#2E7B00' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#2E7B00', fontWeight: 600 }}>
                          {p.prezzoKg > 0 ? `€${p.prezzoKg.toFixed(2)}/Kg` : p.prezzoPezzo > 0 ? `€${p.prezzoPezzo.toFixed(2)}/pz` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {p.costoTotaleProduzione > 0 ? (
                          <Typography variant="caption" color="textSecondary">
                            €{p.costoTotaleProduzione.toFixed(2)}/Kg
                          </Typography>
                        ) : <Typography variant="caption" color="textSecondary">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {p.margineAttuale !== undefined && p.margineAttuale !== 0 ? (
                          <Typography variant="caption" sx={{ color: getMargineColor(p.margineAttuale), fontWeight: 700 }}>
                            {getMargineLabel(p.margineAttuale)}
                          </Typography>
                        ) : <Typography variant="caption" color="textSecondary">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {p.ricetta && p.ricetta.length > 0
                          ? <Chip label={`${p.ricetta.length} ing.`} size="small" color="success" variant="outlined" />
                          : <Chip label="Nessuna" size="small" variant="outlined" />}
                      </TableCell>
                      <TableCell>
                        <Switch checked={p.disponibile} onChange={() => toggleDisponibilita(p)} size="small" color="success" />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Modifica ricetta e costi">
                          <IconButton size="small" onClick={() => apriRicetta(p)} sx={{ color: '#5D4037' }}>
                            <RecipeIcon />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => apriDialogModifica(p)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => eliminaProdotto(p._id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                        <IconButton size="small" onClick={e => { setMenuAnchor(e.currentTarget); setProdottoMenu(p); }}>
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {prodottiListaCorrente.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="textSecondary" sx={{ py: 3 }}>Nessun prodotto trovato</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Paper>
      )}

      {/* ============================================================ */}
      {/* VISTA COMPARATIVA */}
      {/* ============================================================ */}
      {viewMode === 'comparativa' && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              📊 Tabella Comparativa Prodotti (ultimi 30 giorni)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Ordina per</InputLabel>
                <Select value={ordinamentoComparativa} label="Ordina per"
                  onChange={e => setOrdinamentoComparativa(e.target.value)}>
                  <MenuItem value="profittoMese">Profitto mese</MenuItem>
                  <MenuItem value="marginePerc">Margine %</MenuItem>
                  <MenuItem value="venditeKg">Vendite Kg</MenuItem>
                  <MenuItem value="prezzoVendita">Prezzo vendita</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={() => setViewMode('lista')}>← Lista</Button>
              <IconButton onClick={caricaComparativa}><RefreshIcon /></IconButton>
            </Box>
          </Box>

          {loadingComparativa ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: '#3E2723' }}>
                      {['Prodotto', 'Categoria', 'Prezzo Vend.', 'Costo Prod.', 'Margine €', 'Margine %', 'Vendite Kg', 'Profitto Mese', 'Ricetta'].map(h => (
                        <TableCell key={h} sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...datiComparativa]
                      .sort((a, b) => parseFloat(b[ordinamentoComparativa]) - parseFloat(a[ordinamentoComparativa]))
                      .map((row, idx) => {
                        const margineN = parseFloat(row.marginePerc);
                        const bg = idx % 2 === 0 ? '#fafafa' : 'white';
                        return (
                          <TableRow key={row._id} sx={{ background: bg }}>
                            <TableCell sx={{ fontWeight: 600 }}>{row.nome}</TableCell>
                            <TableCell>
                              <Chip label={row.categoria} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                            </TableCell>
                            <TableCell sx={{ color: '#2E7B00', fontWeight: 600 }}>
                              {row.prezzoVendita > 0 ? `€${row.prezzoVendita.toFixed(2)}/Kg` : '—'}
                            </TableCell>
                            <TableCell>
                              {row.costoProduzione > 0 ? `€${row.costoProduzione.toFixed(2)}` : '—'}
                            </TableCell>
                            <TableCell>
                              {row.costoProduzione > 0 ? `€${row.margineEuro}` : '—'}
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ color: getMargineColor(margineN), fontWeight: 700 }}>
                                {row.costoProduzione > 0 ? getMargineLabel(margineN) : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>{row.venditeKg > 0 ? `${row.venditeKg.toFixed(1)} Kg` : '—'}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: parseFloat(row.profittoMese) > 0 ? '#2E7B00' : '#999' }}>
                              {parseFloat(row.profittoMese) > 0 ? `€${row.profittoMese}` : '—'}
                            </TableCell>
                            <TableCell>
                              {row.hasRicetta
                                ? <Chip label="✓" size="small" color="success" />
                                : <Chip label="—" size="small" variant="outlined" />}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Insights */}
              {datiComparativa.length > 0 && (() => {
                const conRicetta = datiComparativa.filter(d => d.hasRicetta && d.costoProduzione > 0);
                if (conRicetta.length === 0) return null;
                const maxProfitto = conRicetta.reduce((a, b) => parseFloat(a.profittoMese) > parseFloat(b.profittoMese) ? a : b);
                const maxMargine = conRicetta.reduce((a, b) => parseFloat(a.marginePerc) > parseFloat(b.marginePerc) ? a : b);
                const maxVendite = datiComparativa.reduce((a, b) => a.venditeKg > b.venditeKg ? a : b);
                return (
                  <Box sx={{ mt: 2, p: 2, background: '#f9f3e8', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>📈 Insights</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption">💰 Più redditizio: <strong>{maxProfitto.nome}</strong> (€{maxProfitto.profittoMese}/mese)</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption">📊 Margine più alto: <strong>{maxMargine.nome}</strong> ({maxMargine.marginePerc}%)</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption">🏆 Più venduto: <strong>{maxVendite.nome}</strong> ({maxVendite.venditeKg?.toFixed(1)} Kg)</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })()}
            </>
          )}
        </Paper>
      )}

      {/* ============================================================ */}
      {/* MENU CONTESTUALE */}
      {/* ============================================================ */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { if (prodottoMenu) scaricaListinoPDF(prodottoMenu.categoria); setMenuAnchor(null); }}>
          <PdfIcon sx={{ mr: 1 }} fontSize="small" /> Listino PDF categoria
        </MenuItem>
        <MenuItem onClick={() => { if (prodottoMenu) apriRicetta(prodottoMenu); setMenuAnchor(null); }}>
          <RecipeIcon sx={{ mr: 1 }} fontSize="small" /> Gestisci ricetta
        </MenuItem>
      </Menu>

      {/* ============================================================ */}
      {/* DIALOG PRODOTTO BASE */}
      {/* ============================================================ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #1B5200 0%, #2E7B00 100%)', color: 'white', fontWeight: 700 }}>
          {prodottoSelezionato ? '✏️ Modifica Prodotto' : '➕ Nuovo Prodotto'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nome Prodotto *" value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Descrizione" multiline rows={2} value={formData.descrizione}
                onChange={e => setFormData({ ...formData, descrizione: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria *</InputLabel>
                <Select value={formData.categoria} label="Categoria *"
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}>
                  {CATEGORIE.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Unità Misura</InputLabel>
                <Select multiple value={formData.unitaMisuraDisponibili} label="Unità Misura"
                  onChange={e => setFormData({ ...formData, unitaMisuraDisponibili: e.target.value })}
                  renderValue={s => s.join(', ')}>
                  {UNITA_MISURA.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Prezzo al Kg (€)" value={formData.prezzoKg}
                onChange={e => setFormData({ ...formData, prezzoKg: parseFloat(e.target.value) || 0 })}
                InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Prezzo al Pezzo (€)" value={formData.prezzoPezzo}
                onChange={e => setFormData({ ...formData, prezzoPezzo: parseFloat(e.target.value) || 0 })}
                InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Pezzi per Kg" value={formData.pezziPerKg || ''}
                onChange={e => setFormData({ ...formData, pezziPerKg: e.target.value ? parseInt(e.target.value) : null })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Note" multiline rows={2} value={formData.note}
                onChange={e => setFormData({ ...formData, note: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={<Switch checked={formData.disponibile}
                onChange={e => setFormData({ ...formData, disponibile: e.target.checked })} />} label="Disponibile" />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={<Switch checked={formData.attivo}
                onChange={e => setFormData({ ...formData, attivo: e.target.checked })} />} label="Attivo" />
            </Grid>

            {/* ── SEZIONE LISTINO PREZZI ── */}
            <Grid item xs={12}>
              <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 1.5, mt: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1A3D0F', display: 'block', mb: 1 }}>
                  🖨️ LISTINO PREZZI
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.includiInListino || false}
                    onChange={e => setFormData({ ...formData, includiInListino: e.target.checked })}
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Includi nel listino prezzi</Typography>
                    <Typography variant="caption" color="textSecondary">Se attivo, appare nel PDF del listino stampabile</Typography>
                  </Box>
                }
              />
            </Grid>
            {formData.includiInListino && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ingredienti per il listino"
                  placeholder="Es: Ricotta, zucchero, uova, farina 00, strutto, lievito, aromi"
                  value={formData.ingredientiListino || ''}
                  onChange={e => setFormData({ ...formData, ingredientiListino: e.target.value })}
                  helperText="Ingredienti leggibili che appariranno nel listino stampato (non i nomi commerciali)"
                  multiline
                  rows={2}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={salvaProdotto} disabled={!formData.nome || loading}>
            {prodottoSelezionato ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG RICETTA E COSTI */}
      {/* ============================================================ */}
      <Dialog open={ricettaDialogOpen} onClose={() => setRicettaDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)', color: 'white', fontWeight: 700 }}>
          🧾 Ricetta e Costi — {prodottoSelezionato?.nome}
        </DialogTitle>
        <DialogContent>
          {loadingRicetta ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* Riepilogo costi */}
              {(totaleIngredientiRicetta > 0) && (
                <Paper sx={{ p: 2, mb: 3, background: '#f9f3e8', border: '1px solid #C8A830' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="textSecondary">
                        Costo Ingredienti (ricetta)
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        €{totaleIngredientiRicetta.toFixed(2)}
                      </Typography>
                      {resaEffettiva !== 1 && (
                        <Typography variant="caption" color="textSecondary">
                          = €{costoIngredientiPerKgFinito.toFixed(2)}/kg finito
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="textSecondary">Overhead ({totaleOverhead}%)</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>€{(costoTotaleStimato - costoIngredientiPerKgFinito).toFixed(2)}/Kg</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="textSecondary">Costo Totale/Kg finito</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#3E2723' }}>€{costoTotaleStimato.toFixed(2)}/Kg</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="textSecondary">
                        Margine (vs €{prezzoVenditaNetto.toFixed(2)}/Kg netto IVA)
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: getMargineColor(margineStimato) }}>
                        {margineStimato !== null ? `${margineStimato.toFixed(0)}%` : '—'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Campo resa ricetta */}
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0c96e', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                      size="small"
                      type="number"
                      label="Resa ricetta (Kg prodotto finito)"
                      value={resaRicetta}
                      onChange={e => setResaRicetta(e.target.value)}
                      sx={{ width: 240 }}
                      inputProps={{ step: 0.1, min: 0.1 }}
                      InputProps={{ endAdornment: <InputAdornment position="end">Kg</InputAdornment> }}
                      helperText="Quanti Kg di prodotto finito escono da questa ricetta"
                    />
                    {resaEffettiva !== 1 && totaleIngredientiRicetta > 0 && (
                      <Typography variant="body2" sx={{ color: '#5D4037', fontWeight: 600 }}>
                        €{totaleIngredientiRicetta.toFixed(2)} ÷ {resaEffettiva} Kg = <strong>€{costoIngredientiPerKgFinito.toFixed(2)}/Kg finito</strong>
                      </Typography>
                    )}
                  </Box>
                </Paper>
              )}

              {/* Tabella ingredienti ricetta */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                📋 Ingredienti
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: '#f5f5f5' }}>
                      <TableCell>Ingrediente</TableCell>
                      <TableCell>Quantità</TableCell>
                      <TableCell>Unità</TableCell>
                      <TableCell>Prezzo/Kg (da fattura)</TableCell>
                      <TableCell>Costo</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ricettaCorrente.map((v, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{v.ingredienteNome}</TableCell>
                        <TableCell>
                          <TextField size="small" type="number" value={v.quantitaPerKg}
                            onChange={e => {
                              const qty = parseFloat(e.target.value) || 0;
                              setRicettaCorrente(prev => prev.map((x, i) => i === idx
                                ? { ...x, quantitaPerKg: qty, costoCalcolato: qty * x.prezzoUnitarioSnapshot }
                                : x));
                            }}
                            sx={{ width: 80 }} inputProps={{ step: 0.001, min: 0 }} />
                        </TableCell>
                        <TableCell>
                          <Select size="small" value={v.unita}
                            onChange={e => setRicettaCorrente(prev => prev.map((x, i) => i === idx ? { ...x, unita: e.target.value } : x))}>
                            {UNITA_RICETTA.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                          </Select>
                        </TableCell>
                        <TableCell sx={{ color: '#888' }}>
                          €{(v.prezzoUnitarioSnapshot || 0).toFixed(2)}/{v.unita || 'kg'}
                          {v.storicoPrezzi && v.storicoPrezzi.length > 1 && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              Media: €{(v.prezzoMedioIngrediente || 0).toFixed(2)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#2E7B00' }}>
                          €{(v.costoCalcolato || 0).toFixed(3)}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => rimuoviVoceRicetta(idx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {ricettaCorrente.length > 0 && (
                      <TableRow sx={{ background: '#f9f3e8' }}>
                        <TableCell colSpan={4} sx={{ fontWeight: 700 }}>TOTALE INGREDIENTI</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#3E2723' }}>
                          €{totaleIngredientiRicetta.toFixed(3)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                    {ricettaCorrente.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#999' }}>
                          Nessun ingrediente — usa il form sotto per aggiungere
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Form aggiunta ingrediente */}
              <Paper sx={{ p: 2, border: '1px dashed #ccc' }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
                  ➕ Aggiungi Ingrediente
                </Typography>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Ingrediente</InputLabel>
                      <Select value={nuovaVoceRicetta.ingredienteId} label="Ingrediente"
                        onChange={e => {
                          const ing = ingredientiDisponibili.find(i => i._id === e.target.value);
                          setNuovaVoceRicetta(prev => ({
                            ...prev,
                            ingredienteId: e.target.value,
                            ingredienteNome: ing?.nome || '',
                            unita: ing?.unitaMisura || 'kg'
                          }));
                        }}>
                        {ingredientiDisponibili.map(i => (
                          <MenuItem key={i._id} value={i._id}>
                            {i.nome}
                            {i.ultimoPrezzoAcquisto > 0 && (
                              <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                                €{i.ultimoPrezzoAcquisto.toFixed(2)}/{i.unitaMisura}
                              </Typography>
                            )}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {/* Oppure campo libero */}
                    <TextField size="small" fullWidth placeholder="o scrivi nome libero" sx={{ mt: 1 }}
                      value={nuovaVoceRicetta.ingredienteNome}
                      onChange={e => setNuovaVoceRicetta(prev => ({ ...prev, ingredienteNome: e.target.value, ingredienteId: '' }))} />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField size="small" fullWidth type="number" label="Quantità/Kg"
                      value={nuovaVoceRicetta.quantitaPerKg}
                      onChange={e => setNuovaVoceRicetta(prev => ({ ...prev, quantitaPerKg: e.target.value }))}
                      inputProps={{ step: 0.001, min: 0 }} />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Unità</InputLabel>
                      <Select value={nuovaVoceRicetta.unita} label="Unità"
                        onChange={e => setNuovaVoceRicetta(prev => ({ ...prev, unita: e.target.value }))}>
                        {UNITA_RICETTA.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    {nuovaVoceRicetta.ingredienteId && (() => {
                      const ing = ingredientiDisponibili.find(i => i._id === nuovaVoceRicetta.ingredienteId);
                      const qty = parseFloat(nuovaVoceRicetta.quantitaPerKg) || 0;
                      const prezzo = ing?.ultimoPrezzoAcquisto || ing?.prezzoMedioAcquisto || 0;
                      return (
                        <Typography variant="caption" color="textSecondary">
                          Prezzo: €{prezzo.toFixed(2)}/{ing?.unitaMisura || 'kg'}
                          {qty > 0 && ` → Costo: €${(prezzo * qty).toFixed(3)}`}
                        </Typography>
                      );
                    })()}
                    <Button variant="contained" fullWidth onClick={aggiungiVoceRicetta} sx={{ mt: nuovaVoceRicetta.ingredienteId ? 0.5 : 0 }}>
                      + Aggiungi
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* ── ISTRUZIONI DI PREPARAZIONE ── */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  📖 Istruzioni di Preparazione
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Preparazione"
                      placeholder="Es: Impastare farina, uova e acqua per 10 minuti. Lasciare riposare 30 minuti coperto."
                      value={istruzioni.preparazione}
                      onChange={e => setIstruzioni(prev => ({ ...prev, preparazione: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Cottura"
                      placeholder="Es: Cuocere in forno a 180°C per 25 minuti. Verificare doratura in superficie."
                      value={istruzioni.cottura}
                      onChange={e => setIstruzioni(prev => ({ ...prev, cottura: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Consigli"
                      placeholder="Es: Servire tiepido. Si conserva fino a 3 giorni a temperatura ambiente."
                      value={istruzioni.consigli}
                      onChange={e => setIstruzioni(prev => ({ ...prev, consigli: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRicettaDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={salvaRicetta} disabled={loadingRicetta}
            sx={{ background: '#3E2723', '&:hover': { background: '#5D4037' } }}>
            Salva Ricetta
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG CONFIGURAZIONE COSTI */}
      {/* ============================================================ */}
      <Dialog open={costiDialogOpen} onClose={() => setCostiDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)', color: 'white', fontWeight: 700 }}>
          ⚙️ Configurazione Costi Fissi
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            Questi valori vengono aggiunti come percentuale sopra il costo ingredienti per tutti i prodotti.
            Al salvataggio tutti i prodotti con ricetta vengono ricalcolati.
          </Alert>
          <Grid container spacing={2}>
            {[
              { key: 'energia',    label: 'Energia' },
              { key: 'gas',        label: 'Gas' },
              { key: 'manodopera', label: 'Manodopera' },
              { key: 'affitto',    label: 'Affitto' },
              { key: 'tasse',      label: 'Tasse' },
              { key: 'imballaggi', label: 'Imballaggi' },
              { key: 'iva',        label: 'IVA' },
              { key: 'varie',      label: 'Varie' }
            ].map(({ key, label }) => (
              <Grid item xs={6} key={key}>
                <TextField fullWidth size="small" type="number"
                  label={`${label} (%)`}
                  value={configCosti.overhead?.[key] ?? 0}
                  onChange={e => setConfigCosti(prev => ({
                    ...prev,
                    overhead: { ...prev.overhead, [key]: parseFloat(e.target.value) || 0 }
                  }))}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Divider />
              <Box sx={{ mt: 1, p: 1.5, background: '#f9f3e8', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  TOTALE OVERHEAD: {Object.values(configCosti.overhead || {}).reduce((s, v) => s + (v || 0), 0)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" type="number" label="Margine consigliato default (%)"
                value={configCosti.margineConsigliato || 70}
                onChange={e => setConfigCosti(prev => ({ ...prev, margineConsigliato: parseFloat(e.target.value) || 70 }))}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCostiDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={salvaConfigCosti} disabled={loading}>
            Salva e Ricalcola Tutto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}