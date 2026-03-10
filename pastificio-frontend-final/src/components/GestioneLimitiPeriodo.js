'use client';
// components/GestioneLimitiPeriodo.js
// NUOVO 10/03/2026 - Gestione limiti produzione multi-giorno con fasce orarie
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Grid, IconButton, LinearProgress,
  MenuItem, Select, TextField, Tooltip, Typography,
  Alert, Chip, FormControl, InputLabel, Checkbox, FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { format, addDays, parseISO, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ────────────────────────────────────────────────────────
// Prodotti disponibili (stessa lista di prodottiConfig.js)
// ────────────────────────────────────────────────────────
const PRODOTTI_DISPONIBILI = [
  'Zeppole', 'Zeppole sarde', 'Zeppole dolci', 'Zeppole salate',
  'Ravioli', 'Ravioli ricotta', 'Ravioli spinaci', 'Ravioli patate',
  'Pardulas', 'Pardulas ricotta', 'Pardulas miele',
  'Panadas', 'Panadine',
  'Sebadas',
  'Amaretti',
  'Dolci Misti'
];

// ────────────────────────────────────────────────────────
// Helper: colore barra progresso
// ────────────────────────────────────────────────────────
const coloreBarra = (percentuale) => {
  if (percentuale >= 100) return '#d32f2f';
  if (percentuale >= 80) return '#f57c00';
  if (percentuale >= 60) return '#fbc02d';
  return '#388e3c';
};

// ────────────────────────────────────────────────────────
// Componente: Barra progresso con etichetta
// ────────────────────────────────────────────────────────
const BarraProgresso = ({ valore, totale, label, unitaMisura = 'Kg', completo }) => {
  const perc = totale > 0 ? Math.min((valore / totale) * 100, 100) : 0;
  const colore = completo ? '#d32f2f' : coloreBarra(perc);

  return (
    <Box sx={{ mb: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: colore, fontWeight: 600, fontSize: '0.72rem' }}>
          {valore.toFixed(1)}/{totale} {unitaMisura}
          {completo && <CheckCircleIcon sx={{ fontSize: 12, ml: 0.5, verticalAlign: 'middle' }} />}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={perc}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': { backgroundColor: colore, borderRadius: 3 }
        }}
      />
    </Box>
  );
};

// ────────────────────────────────────────────────────────
// Componente: Card singolo periodo (dashboard)
// ────────────────────────────────────────────────────────
const CardPeriodo = ({ periodo, onModifica, onElimina, onAggiorna }) => {
  const [stato, setStato] = useState(null);
  const [caricamento, setCaricamento] = useState(true);

  const caricaStato = useCallback(async () => {
    try {
      setCaricamento(true);
      const res = await fetch(`${API_URL}/limiti-periodo/${periodo._id}/stato`);
      const json = await res.json();
      if (json.success) setStato(json.data);
    } catch (err) {
      console.error('Errore caricamento stato periodo:', err);
    } finally {
      setCaricamento(false);
    }
  }, [periodo._id]);

  useEffect(() => {
    caricaStato();
  }, [caricaStato, periodo]);

  const dataInizio = new Date(periodo.dataInizio);
  const dataFine = new Date(periodo.dataFine);

  return (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ pb: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{periodo.nome}</Typography>
            <Typography variant="body2" color="text.secondary">
              {format(dataInizio, 'dd/MM/yyyy', { locale: it })} → {format(dataFine, 'dd/MM/yyyy', { locale: it })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Chip
              label={periodo.prodotto}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            {!periodo.attivo && <Chip label="INATTIVO" size="small" color="default" />}
          </Box>
        </Box>

        {/* Barra totale periodo */}
        {caricamento ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : stato ? (
          <>
            <Box sx={{ mb: 1.5 }}>
              <BarraProgresso
                valore={stato.ordinatoTotale}
                totale={stato.limiteTotale}
                label={`TOTALE PERIODO — ${stato.percentualeTotale}%`}
                unitaMisura={stato.unitaMisura}
              />
            </Box>

            {/* Dettaglio fasce */}
            {stato.fasce.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Dettaglio fasce
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {stato.fasce.map((fascia, idx) => (
                    <BarraProgresso
                      key={idx}
                      valore={fascia.ordinato}
                      totale={fascia.limite}
                      label={`${format(new Date(fascia.data), 'EEE dd/MM', { locale: it })} ${fascia.fascia}`}
                      unitaMisura={stato.unitaMisura}
                      completo={fascia.completo}
                    />
                  ))}
                </Box>
              </>
            )}
          </>
        ) : (
          <Alert severity="warning" sx={{ py: 0.5 }}>Errore caricamento stato</Alert>
        )}

        {/* Azioni */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5, pt: 1, borderTop: '1px solid #eee' }}>
          <Tooltip title="Aggiorna dati">
            <IconButton size="small" onClick={caricaStato}><BarChartIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Modifica">
            <IconButton size="small" onClick={() => onModifica(periodo)}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Elimina">
            <IconButton size="small" color="error" onClick={() => onElimina(periodo)}><DeleteIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

// ────────────────────────────────────────────────────────
// Componente: Dialog creazione/modifica periodo
// ────────────────────────────────────────────────────────
const DialogPeriodo = ({ open, onClose, onSalva, periodoEsistente }) => {
  const isModifica = !!periodoEsistente;

  const statoIniziale = {
    nome: '',
    prodotto: 'Pardulas',
    dataInizio: format(new Date(), 'yyyy-MM-dd'),
    dataFine: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    limiteTotale: '',
    unitaMisura: 'Kg',
    sogliAllerta: 80,
    note: '',
    fasce: []  // [{data, fascia, limite, abilitata}]
  };

  const [form, setForm] = useState(statoIniziale);
  const [errore, setErrore] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Ricalcola griglia fasce quando cambiano le date
  useEffect(() => {
    if (!open) return;

    if (isModifica && periodoEsistente) {
      // Popola con dati esistenti
      const fascePopolate = generaGrigliaFasce(
        format(new Date(periodoEsistente.dataInizio), 'yyyy-MM-dd'),
        format(new Date(periodoEsistente.dataFine), 'yyyy-MM-dd'),
        periodoEsistente.fasce
      );
      setForm({
        nome: periodoEsistente.nome,
        prodotto: periodoEsistente.prodotto,
        dataInizio: format(new Date(periodoEsistente.dataInizio), 'yyyy-MM-dd'),
        dataFine: format(new Date(periodoEsistente.dataFine), 'yyyy-MM-dd'),
        limiteTotale: periodoEsistente.limiteTotale.toString(),
        unitaMisura: periodoEsistente.unitaMisura || 'Kg',
        sogliAllerta: periodoEsistente.sogliAllerta || 80,
        note: periodoEsistente.note || '',
        fasce: fascePopolate
      });
    } else {
      setForm({ ...statoIniziale });
    }
    setErrore('');
  }, [open, periodoEsistente]);

  // Rigenera griglia fasce quando cambiano le date (solo creazione)
  useEffect(() => {
    if (!open || isModifica) return;
    if (!form.dataInizio || !form.dataFine) return;
    if (new Date(form.dataFine) < new Date(form.dataInizio)) return;

    setForm(prev => ({
      ...prev,
      fasce: generaGrigliaFasce(prev.dataInizio, prev.dataFine, prev.fasce)
    }));
  }, [form.dataInizio, form.dataFine, open]);

  const generaGrigliaFasce = (dataInizioStr, dataFineStr, fasceEsistenti = []) => {
    try {
      const giorni = eachDayOfInterval({
        start: parseISO(dataInizioStr),
        end: parseISO(dataFineStr)
      });

      return giorni.flatMap(giorno => {
        const dataStr = format(giorno, 'yyyy-MM-dd');
        return ['mattina', 'sera'].map(fascia => {
          const esistente = fasceEsistenti.find(f => {
            const dF = format(new Date(f.data), 'yyyy-MM-dd');
            return dF === dataStr && f.fascia === fascia;
          });
          return {
            data: dataStr,
            fascia,
            limite: esistente ? esistente.limite.toString() : '',
            abilitata: !!esistente
          };
        });
      });
    } catch {
      return [];
    }
  };

  const sommeFasce = form.fasce.filter(f => f.abilitata && f.limite).reduce((sum, f) => sum + (parseFloat(f.limite) || 0), 0);
  const limiteTotaleNum = parseFloat(form.limiteTotale) || 0;
  const diffFasce = Math.abs(sommeFasce - limiteTotaleNum);
  const fasceOk = !form.fasce.some(f => f.abilitata) || diffFasce < 0.01;

  const handleSalva = async () => {
    setErrore('');

    if (!form.nome.trim()) return setErrore('Il nome del periodo è obbligatorio');
    if (!form.prodotto) return setErrore('Seleziona un prodotto');
    if (!form.dataInizio || !form.dataFine) return setErrore('Date obbligatorie');
    if (new Date(form.dataFine) < new Date(form.dataInizio)) return setErrore('La data fine deve essere >= data inizio');
    if (!form.limiteTotale || isNaN(parseFloat(form.limiteTotale))) return setErrore('Limite totale obbligatorio');
    if (!fasceOk) return setErrore(`La somma delle fasce (${sommeFasce} ${form.unitaMisura}) deve essere uguale al limite totale (${limiteTotaleNum} ${form.unitaMisura})`);

    const fasceAttive = form.fasce
      .filter(f => f.abilitata && f.limite)
      .map(f => ({
        data: f.data,
        fascia: f.fascia,
        limite: parseFloat(f.limite)
      }));

    const payload = {
      nome: form.nome.trim(),
      prodotto: form.prodotto,
      dataInizio: form.dataInizio,
      dataFine: form.dataFine,
      limiteTotale: parseFloat(form.limiteTotale),
      unitaMisura: form.unitaMisura,
      fasce: fasceAttive,
      sogliAllerta: parseInt(form.sogliAllerta) || 80,
      note: form.note
    };

    setSalvando(true);
    try {
      await onSalva(payload, periodoEsistente?._id);
      onClose();
    } catch (err) {
      setErrore(err.message || 'Errore durante il salvataggio');
    } finally {
      setSalvando(false);
    }
  };

  const aggiornaDatoFascia = (dataStr, fascia, campo, valore) => {
    setForm(prev => ({
      ...prev,
      fasce: prev.fasce.map(f =>
        f.data === dataStr && f.fascia === fascia
          ? { ...f, [campo]: valore }
          : f
      )
    }));
  };

  // Raggruppa fasce per giorno
  const giorni = [...new Set(form.fasce.map(f => f.data))];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isModifica ? `Modifica: ${periodoEsistente?.nome}` : 'Nuovo Limite Periodo'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Nome */}
          <Grid item xs={12} sm={8}>
            <TextField
              label="Nome periodo *"
              value={form.nome}
              onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
              fullWidth size="small"
              placeholder="es. Pasqua 2026"
            />
          </Grid>
          {/* Prodotto */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Prodotto *</InputLabel>
              <Select
                value={form.prodotto}
                label="Prodotto *"
                onChange={e => setForm(p => ({ ...p, prodotto: e.target.value }))}
              >
                {PRODOTTI_DISPONIBILI.map(p => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Date */}
          <Grid item xs={6} sm={3}>
            <TextField
              label="Data inizio *"
              type="date" size="small" fullWidth
              value={form.dataInizio}
              onChange={e => setForm(p => ({ ...p, dataInizio: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Data fine *"
              type="date" size="small" fullWidth
              value={form.dataFine}
              onChange={e => setForm(p => ({ ...p, dataFine: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          {/* Limite totale */}
          <Grid item xs={6} sm={3}>
            <TextField
              label="Limite totale *"
              type="number" size="small" fullWidth
              value={form.limiteTotale}
              onChange={e => setForm(p => ({ ...p, limiteTotale: e.target.value }))}
              inputProps={{ min: 0, step: 0.5 }}
            />
          </Grid>
          {/* Unità */}
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Unità</InputLabel>
              <Select
                value={form.unitaMisura}
                label="Unità"
                onChange={e => setForm(p => ({ ...p, unitaMisura: e.target.value }))}
              >
                {['Kg', 'Pezzi', 'g', 'Litri'].map(u => (
                  <MenuItem key={u} value={u}>{u}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Griglia fasce */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Distribuzione per fascia oraria
              </Typography>
              <Typography variant="caption" color={fasceOk ? 'success.main' : 'error.main'} fontWeight={600}>
                Somma fasce: {sommeFasce.toFixed(1)} {form.unitaMisura}
                {!fasceOk && limiteTotaleNum > 0 && ` (atteso: ${limiteTotaleNum})`}
                {fasceOk && form.fasce.some(f => f.abilitata) && ' ✓'}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Mattina: 06:00-13:59 · Sera: 14:00-23:59. Spunta le fasce che vuoi limitare.
            </Typography>

            {giorni.map(dataStr => {
              const fasceGiorno = form.fasce.filter(f => f.data === dataStr);
              const dataLabel = format(parseISO(dataStr), 'EEEE dd/MM', { locale: it });
              return (
                <Box key={dataStr} sx={{ display: 'flex', alignItems: 'center', mb: 0.75, gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ width: 120, fontWeight: 500, textTransform: 'capitalize', flexShrink: 0 }}>
                    {dataLabel}
                  </Typography>
                  {fasceGiorno.map(({ fascia, limite, abilitata }) => (
                    <Box key={fascia} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Checkbox
                        size="small"
                        checked={abilitata}
                        onChange={e => aggiornaDatoFascia(dataStr, fascia, 'abilitata', e.target.checked)}
                        sx={{ p: 0.25 }}
                      />
                      <Typography variant="caption" sx={{ width: 45, color: 'text.secondary' }}>{fascia}</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={limite}
                        disabled={!abilitata}
                        onChange={e => aggiornaDatoFascia(dataStr, fascia, 'limite', e.target.value)}
                        inputProps={{ min: 0, step: 0.5, style: { padding: '4px 6px', width: 60 } }}
                        sx={{ width: 80 }}
                        placeholder="Kg"
                      />
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Grid>

          {/* Note */}
          <Grid item xs={12} sm={8}>
            <TextField
              label="Note"
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              fullWidth size="small" multiline rows={2}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Soglia allerta %"
              type="number" size="small" fullWidth
              value={form.sogliAllerta}
              onChange={e => setForm(p => ({ ...p, sogliAllerta: e.target.value }))}
              inputProps={{ min: 50, max: 100 }}
              helperText="Default: 80%"
            />
          </Grid>
        </Grid>

        {errore && <Alert severity="error" sx={{ mt: 2 }}>{errore}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={salvando}>Annulla</Button>
        <Button
          variant="contained"
          onClick={handleSalva}
          disabled={salvando}
          startIcon={salvando ? <CircularProgress size={16} /> : null}
        >
          {salvando ? 'Salvataggio...' : isModifica ? 'Aggiorna' : 'Salva'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ────────────────────────────────────────────────────────
// Componente principale
// ────────────────────────────────────────────────────────
const GestioneLimitiPeriodo = () => {
  const [periodi, setPeriodi] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState('');
  const [dialogAperto, setDialogAperto] = useState(false);
  const [periodoModifica, setPeriodoModifica] = useState(null);
  const [filtroAttivi, setFiltroAttivi] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const caricaPeriodi = useCallback(async () => {
    setCaricamento(true);
    try {
      const params = new URLSearchParams();
      if (filtroAttivi) params.append('attivo', 'true');
      const res = await fetch(`${API_URL}/limiti-periodo?${params}`);
      const json = await res.json();
      if (json.success) {
        setPeriodi(json.data);
      } else {
        setErrore(json.message || 'Errore caricamento periodi');
      }
    } catch (err) {
      setErrore('Errore di rete: ' + err.message);
    } finally {
      setCaricamento(false);
    }
  }, [filtroAttivi]);

  useEffect(() => {
    caricaPeriodi();
  }, [caricaPeriodi]);

  const handleSalva = async (payload, idEsistente) => {
    const url = idEsistente ? `${API_URL}/limiti-periodo/${idEsistente}` : `${API_URL}/limiti-periodo`;
    const method = idEsistente ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (!json.success) throw new Error(json.message || 'Errore salvataggio');

    setFeedback({ tipo: 'success', testo: idEsistente ? 'Periodo aggiornato' : 'Periodo creato' });
    setTimeout(() => setFeedback(null), 3000);
    caricaPeriodi();
  };

  const handleElimina = async (periodo) => {
    if (!window.confirm(`Eliminare il periodo "${periodo.nome}"?\nQuesta azione non può essere annullata.`)) return;
    try {
      const res = await fetch(`${API_URL}/limiti-periodo/${periodo._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setFeedback({ tipo: 'success', testo: 'Periodo eliminato' });
        setTimeout(() => setFeedback(null), 3000);
        caricaPeriodi();
      } else {
        setFeedback({ tipo: 'error', testo: json.message });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      setFeedback({ tipo: 'error', testo: err.message });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleModifica = (periodo) => {
    setPeriodoModifica(periodo);
    setDialogAperto(true);
  };

  const handleNuovo = () => {
    setPeriodoModifica(null);
    setDialogAperto(true);
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Limiti Produzione Periodo
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filtroAttivi}
                onChange={e => setFiltroAttivi(e.target.checked)}
              />
            }
            label={<Typography variant="caption">Solo attivi</Typography>}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNuovo}
            size="small"
          >
            Nuovo Periodo
          </Button>
        </Box>
      </Box>

      {feedback && (
        <Alert severity={feedback.tipo} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.testo}
        </Alert>
      )}

      {errore && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrore('')}>{errore}</Alert>
      )}

      {caricamento ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : periodi.length === 0 ? (
        <Card variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="text.secondary">
            {filtroAttivi ? 'Nessun limite periodo attivo' : 'Nessun limite periodo configurato'}
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleNuovo} sx={{ mt: 2 }}>
            Crea il primo periodo
          </Button>
        </Card>
      ) : (
        periodi.map(periodo => (
          <CardPeriodo
            key={periodo._id}
            periodo={periodo}
            onModifica={handleModifica}
            onElimina={handleElimina}
            onAggiorna={caricaPeriodi}
          />
        ))
      )}

      <DialogPeriodo
        open={dialogAperto}
        onClose={() => setDialogAperto(false)}
        onSalva={handleSalva}
        periodoEsistente={periodoModifica}
      />
    </Box>
  );
};

export default GestioneLimitiPeriodo;