// src/components/chiusure/GestioneChiusure.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Switch, RadioGroup, Radio,
  FormLabel, FormGroup, Checkbox, Alert, Tooltip,
  CircularProgress, List, ListItem, ListItemText, ListItemSecondaryAction,
  Accordion, AccordionSummary, AccordionDetails, Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  EventBusy as EventBusyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

const NOMI_FESTIVITA = {
  capodanno:    '1 Gennaio – Capodanno',
  epifania:     '6 Gennaio – Epifania',
  pasquetta:    'Pasquetta (calcolata automaticamente)',
  liberazione:  '25 Aprile – Festa della Liberazione',
  santEfisio:   '28 Aprile – Sant\'Efisio (Sardegna)',
  lavoratori:   '1 Maggio – Festa dei Lavoratori',
  repubblica:   '2 Giugno – Festa della Repubblica',
  ferragosto:   '15 Agosto – Ferragosto',
  ognissanti:   '1 Novembre – Ognissanti',
  immacolata:   '8 Dicembre – Immacolata Concezione',
  natale:       '25 Dicembre – Natale',
  santoStefano: '26 Dicembre – Santo Stefano'
};

const NOMI_GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

const FORM_DEFAULT = {
  tipo: 'personalizzata',
  tipoData: 'singolo',
  dataInizio: '',
  dataFine: '',
  motivo: '',
  ripetiOgniAnno: false
};

export default function GestioneChiusure({ isAdmin = false }) {
  const [chiusure, setChiusure] = useState([]);
  const [config, setConfig] = useState({
    festivitaAttive: {},
    giorniChiusuraSettimanale: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog aggiungi/modifica
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(FORM_DEFAULT);
  const [formError, setFormError] = useState('');

  // Config locale (prima di salvare)
  const [configLocale, setConfigLocale] = useState({
    festivitaAttive: {},
    giorniChiusuraSettimanale: []
  });
  const [configModificata, setConfigModificata] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // ── Caricamento dati ──────────────────────────────────────────────────────

  const caricaDati = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chiusure`, { headers });
      const data = await res.json();
      if (data.success) {
        setChiusure(data.chiusure || []);
        setConfig(data.config || {});
        setConfigLocale(data.config || {});
        setConfigModificata(false);
      }
    } catch (err) {
      toast.error('Errore caricamento chiusure');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { caricaDati(); }, [caricaDati]);

  // ── Gestione config festività ─────────────────────────────────────────────

  const toggleFestivita = (key) => {
    setConfigLocale(prev => ({
      ...prev,
      festivitaAttive: {
        ...prev.festivitaAttive,
        [key]: !prev.festivitaAttive[key]
      }
    }));
    setConfigModificata(true);
  };

  const toggleGiornoSettimana = (dow) => {
    setConfigLocale(prev => {
      const correnti = prev.giorniChiusuraSettimanale || [];
      const nuovi = correnti.includes(dow)
        ? correnti.filter(g => g !== dow)
        : [...correnti, dow];
      return { ...prev, giorniChiusuraSettimanale: nuovi };
    });
    setConfigModificata(true);
  };

  const salvaConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/chiusure/config`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(configLocale)
      });
      const data = await res.json();
      if (data.success) {
        setConfig(configLocale);
        setConfigModificata(false);
        toast.success('Configurazione salvata!');
      } else {
        toast.error(data.message || 'Errore salvataggio');
      }
    } catch (err) {
      toast.error('Errore di rete');
    } finally {
      setSaving(false);
    }
  };

  // ── Dialog form chiusura personalizzata ──────────────────────────────────

  const apriDialogNuova = () => {
    setForm(FORM_DEFAULT);
    setEditingId(null);
    setFormError('');
    setDialogOpen(true);
  };

  const apriDialogModifica = (chiusura) => {
    const dInizio = chiusura.dataInizio ? new Date(chiusura.dataInizio).toISOString().split('T')[0] : '';
    const dFine   = chiusura.dataFine   ? new Date(chiusura.dataFine).toISOString().split('T')[0]   : '';
    setForm({
      tipo: chiusura.tipo,
      tipoData: dInizio === dFine ? 'singolo' : 'periodo',
      dataInizio: dInizio,
      dataFine: dFine,
      motivo: chiusura.motivo,
      ripetiOgniAnno: chiusura.ripetiOgniAnno || false
    });
    setEditingId(chiusura._id);
    setFormError('');
    setDialogOpen(true);
  };

  const salvaChiusura = async () => {
    // Validazione
    if (!form.motivo.trim()) { setFormError('Il motivo è obbligatorio'); return; }
    if (!form.dataInizio) { setFormError('La data di inizio è obbligatoria'); return; }
    const dataFineEffettiva = form.tipoData === 'singolo' ? form.dataInizio : form.dataFine;
    if (!dataFineEffettiva) { setFormError('La data di fine è obbligatoria per un periodo'); return; }
    if (dataFineEffettiva < form.dataInizio) { setFormError('La data di fine non può essere prima della data di inizio'); return; }

    setSaving(true);
    setFormError('');
    try {
      const body = {
        tipo: 'personalizzata',
        dataInizio: form.dataInizio,
        dataFine: dataFineEffettiva,
        motivo: form.motivo.trim(),
        ripetiOgniAnno: form.ripetiOgniAnno
      };

      const url    = editingId ? `${API_URL}/chiusure/${editingId}` : `${API_URL}/chiusure`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();

      if (data.success) {
        toast.success(editingId ? 'Chiusura aggiornata!' : 'Chiusura aggiunta!');
        setDialogOpen(false);
        caricaDati();
      } else {
        setFormError(data.message || 'Errore salvataggio');
      }
    } catch (err) {
      setFormError('Errore di rete');
    } finally {
      setSaving(false);
    }
  };

  const eliminaChiusura = async (id, motivo) => {
    if (!confirm(`Eliminare la chiusura "${motivo}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/chiusure/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.success) {
        toast.success('Chiusura eliminata');
        caricaDati();
      } else {
        toast.error(data.message || 'Errore eliminazione');
      }
    } catch (err) {
      toast.error('Errore di rete');
    }
  };

  // ── Helpers UI ────────────────────────────────────────────────────────────

  const formattaDataChiusura = (c) => {
    if (!c.dataInizio) return '';
    const dI = new Date(c.dataInizio + 'T12:00:00').toLocaleDateString('it-IT');
    const dF = new Date(c.dataFine   + 'T12:00:00').toLocaleDateString('it-IT');
    return dI === dF ? dI : `${dI} → ${dF}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          📅 Calendario Chiusure
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Ricarica">
            <IconButton onClick={caricaDati} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={apriDialogNuova}>
              Aggiungi Chiusura
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Festività Fisse ── */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventBusyIcon color="error" />
            <Typography fontWeight="bold">🔴 Festività Fisse Nazionali/Locali</Typography>
            <Chip
              label={`${Object.values(configLocale.festivitaAttive || {}).filter(Boolean).length} attive`}
              size="small"
              color="error"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Le festività attive blocchono automaticamente la creazione di ordini per quella data ogni anno.
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(NOMI_FESTIVITA).map(([key, label]) => (
              <Grid item xs={12} sm={6} key={key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={configLocale.festivitaAttive?.[key] !== false}
                      onChange={() => isAdmin && toggleFestivita(key)}
                      disabled={!isAdmin}
                      color="error"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {key === 'pasquetta' ? '🐣 ' : '🔴 '}
                      {label}
                    </Typography>
                  }
                />
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* ── Chiusura Settimanale ── */}
      <Accordion sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventBusyIcon color="primary" />
            <Typography fontWeight="bold">🔵 Chiusura Settimanale Ricorrente</Typography>
            {(configLocale.giorniChiusuraSettimanale?.length || 0) > 0 && (
              <Chip
                label={configLocale.giorniChiusuraSettimanale.map(d => NOMI_GIORNI[d]).join(', ')}
                size="small"
                color="primary"
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            I giorni selezionati verranno considerati chiusi ogni settimana.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {NOMI_GIORNI.map((nome, dow) => {
              const attivo = configLocale.giorniChiusuraSettimanale?.includes(dow);
              return (
                <Chip
                  key={dow}
                  label={nome}
                  onClick={() => isAdmin && toggleGiornoSettimana(dow)}
                  color={attivo ? 'primary' : 'default'}
                  variant={attivo ? 'filled' : 'outlined'}
                  sx={{ cursor: isAdmin ? 'pointer' : 'default' }}
                />
              );
            })}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* ── Salva config ── */}
      {isAdmin && configModificata && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={salvaConfig}
            disabled={saving}
          >
            Salva Configurazione
          </Button>
        </Box>
      )}

      {/* ── Chiusure Personalizzate ── */}
      <Paper sx={{ mt: 2, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventBusyIcon sx={{ color: '#f59e0b' }} />
            <Typography fontWeight="bold">🟡 Chiusure Personalizzate</Typography>
            <Chip label={chiusure.filter(c => c.tipo === 'personalizzata').length} size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e' }} />
          </Box>
          {isAdmin && (
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={apriDialogNuova}>
              Aggiungi
            </Button>
          )}
        </Box>

        {chiusure.filter(c => c.tipo === 'personalizzata').length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
            Nessuna chiusura personalizzata configurata.
          </Typography>
        ) : (
          <List dense disablePadding>
            {chiusure.filter(c => c.tipo === 'personalizzata').map((c) => (
              <ListItem
                key={c._id}
                divider
                sx={{ px: 1, py: 0.5 }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">{c.motivo}</Typography>
                      {c.ripetiOgniAnno && (
                        <Chip label="Annuale" size="small" color="warning" sx={{ height: 18, fontSize: 10 }} />
                      )}
                    </Box>
                  }
                  secondary={formattaDataChiusura(c)}
                />
                {isAdmin && (
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => apriDialogModifica(c)} sx={{ mr: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => eliminaChiusura(c._id, c.motivo)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* ── Dialog aggiungi/modifica ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? '✏️ Modifica Chiusura' : '➕ Nuova Chiusura'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Tipo: giorno singolo o periodo */}
            <Box>
              <FormLabel>Tipo chiusura</FormLabel>
              <RadioGroup
                row
                value={form.tipoData}
                onChange={(e) => setForm({ ...form, tipoData: e.target.value })}
              >
                <FormControlLabel value="singolo" control={<Radio />} label="Giorno singolo" />
                <FormControlLabel value="periodo" control={<Radio />} label="Periodo (più giorni)" />
              </RadioGroup>
            </Box>

            {/* Date */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={form.tipoData === 'singolo' ? 'Data' : 'Data inizio'}
                type="date"
                value={form.dataInizio}
                onChange={(e) => setForm({ ...form, dataInizio: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
              {form.tipoData === 'periodo' && (
                <TextField
                  label="Data fine"
                  type="date"
                  value={form.dataFine}
                  onChange={(e) => setForm({ ...form, dataFine: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: form.dataInizio }}
                  fullWidth
                  required
                />
              )}
            </Box>

            {/* Motivo */}
            <TextField
              label="Motivo / Descrizione"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              placeholder="es. Ferie estive, Chiusura straordinaria..."
              fullWidth
              required
            />

            {/* Ripeti ogni anno */}
            <FormControlLabel
              control={
                <Switch
                  checked={form.ripetiOgniAnno}
                  onChange={(e) => setForm({ ...form, ripetiOgniAnno: e.target.checked })}
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Ripeti ogni anno</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Attiva per chiusure ricorrenti (es. ferie sempre ad agosto)
                  </Typography>
                </Box>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button
            variant="contained"
            onClick={salvaChiusura}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          >
            {editingId ? 'Aggiorna' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}