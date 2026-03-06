'use client';
// src/components/WhatsAppBotMonitor.js
// Pannello monitor FAQ Bot WhatsApp nel gestionale

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Badge, IconButton,
  TextField, Button, Divider, List, ListItem, ListItemText,
  ListItemIcon, CircularProgress, Alert, Tooltip, Paper,
  Table, TableBody, TableCell, TableHead, TableRow, Switch,
  FormControlLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, LinearProgress,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  QuestionAnswer as ChatIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendIcon,
  EscalatorWarning as EscalationIcon,
  Preview as PreviewIcon,
  PlayArrow as TestIcon,
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const TIPO_COLORI = {
  prezzi: '#2196f3',
  grammature: '#9c27b0',
  orari: '#ff9800',
  prodotti_disponibili: '#4caf50',
  ingredienti_allergeni: '#f44336',
  ordine: '#e91e63',
  saluto: '#00bcd4',
  non_riconosciuto: '#9e9e9e',
  errore: '#f44336',
};

const TIPO_LABEL = {
  prezzi: 'Prezzi',
  grammature: 'Grammature',
  orari: 'Orari',
  prodotti_disponibili: 'Prodotti',
  ingredienti_allergeni: 'Allergeni',
  ordine: 'Ordine',
  saluto: 'Saluto',
  non_riconosciuto: 'Non riconosciuto',
  errore: 'Errore bot',
};

function TimestampChip({ ts }) {
  const d = new Date(ts);
  const ora = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const data = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  return (
    <Typography variant="caption" color="text.secondary">
      {data} {ora}
    </Typography>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principale
// ─────────────────────────────────────────────────────────────────────────────

export default function WhatsAppBotMonitor() {
  const [stats, setStats] = useState(null);
  const [ultimiMessaggi, setUltimiMessaggi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);
  const [botAbilitato, setBotAbilitato] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Test panel
  const [testoTest, setTestoTest] = useState('');
  const [nomeTest, setNomeTest] = useState('');
  const [risultatoTest, setRisultatoTest] = useState(null);
  const [testando, setTestando] = useState(false);
  const [dialogTest, setDialogTest] = useState(false);

  const tokenRef = useRef(null);

  // Recupera token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      tokenRef.current = localStorage.getItem('token');
    }
  }, []);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenRef.current}`,
  }), []);

  // ── Carica statistiche ──
  const caricaStats = useCallback(async () => {
    try {
      setErrore(null);
      const res = await fetch(`${API_URL}/whatsapp-bot/stats?limit=20`, { headers: headers() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setUltimiMessaggi(data.ultimiMessaggi || []);
        setBotAbilitato(data.stats.botAbilitato);
      }
    } catch (err) {
      setErrore('Errore caricamento statistiche bot');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    caricaStats();
    const interval = setInterval(caricaStats, 30000); // Aggiorna ogni 30s
    return () => clearInterval(interval);
  }, [caricaStats]);

  // ── Toggle bot ──
  const handleToggleBot = async () => {
    setToggling(true);
    try {
      const nuovoStato = !botAbilitato;
      const res = await fetch(`${API_URL}/whatsapp-bot/toggle`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ abilitato: nuovoStato }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.success) {
        setBotAbilitato(data.botAbilitato);
      }
    } catch {
      setErrore('Errore cambio stato bot');
    } finally {
      setToggling(false);
    }
  };

  // ── Test risposta ──
  const handleTestRisposta = async () => {
    if (!testoTest.trim()) return;
    setTestando(true);
    setRisultatoTest(null);
    try {
      const res = await fetch(`${API_URL}/whatsapp-bot/test-risposta`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ testo: testoTest.trim(), nomeCliente: nomeTest.trim() || null }),
      });
      const data = await res.json();
      setRisultatoTest(data);
      setDialogTest(true);
    } catch (err) {
      setErrore('Errore test risposta');
    } finally {
      setTestando(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BotIcon sx={{ fontSize: 32, color: '#25d366' }} />
          <Typography variant="h5" fontWeight={700}>
            WhatsApp FAQ Bot
          </Typography>
          <Chip
            label={botAbilitato ? 'ATTIVO' : 'DISABILITATO'}
            color={botAbilitato ? 'success' : 'default'}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={botAbilitato}
                onChange={handleToggleBot}
                disabled={toggling}
                color="success"
              />
            }
            label={toggling ? 'Aggiornamento...' : (botAbilitato ? 'Bot ON' : 'Bot OFF')}
          />
          <Tooltip title="Aggiorna">
            <IconButton onClick={caricaStats} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {errore && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrore(null)}>
          {errore}
        </Alert>
      )}

      {/* KPI Cards */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 3 }}>
          <KpiCard
            label="Messaggi totali"
            valore={stats.totaleMessaggi}
            icona={<ChatIcon />}
            colore="#2196f3"
          />
          <KpiCard
            label="FAQ automatiche"
            valore={stats.faqAutomatiche}
            sottoTitolo={`${stats.faqRate} del totale`}
            icona={<CheckIcon />}
            colore="#4caf50"
          />
          <KpiCard
            label="Escalation"
            valore={stats.escalation}
            sottoTitolo={`${stats.escalationRate} del totale`}
            icona={<EscalationIcon />}
            colore="#ff9800"
          />
          <KpiCard
            label="Tipi diversi"
            valore={Object.keys(stats.perTipo).length}
            icona={<TrendIcon />}
            colore="#9c27b0"
          />
        </Box>
      )}

      {/* Distribuzione tipi */}
      {stats && Object.keys(stats.perTipo).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
              Distribuzione per tipo
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(stats.perTipo)
                .sort(([, a], [, b]) => b - a)
                .map(([tipo, count]) => (
                  <Chip
                    key={tipo}
                    label={`${TIPO_LABEL[tipo] || tipo}: ${count}`}
                    size="small"
                    sx={{
                      backgroundColor: TIPO_COLORI[tipo] || '#9e9e9e',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {/* Ultimi messaggi */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Ultimi messaggi ricevuti
            </Typography>
            {ultimiMessaggi.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nessun messaggio ricevuto ancora
              </Typography>
            ) : (
              <List dense disablePadding>
                {ultimiMessaggi.slice(0, 15).map((m, i) => (
                  <React.Fragment key={i}>
                    <ListItem
                      sx={{
                        px: 1,
                        borderRadius: 1,
                        backgroundColor: m.escalation ? 'rgba(255,152,0,0.07)' : 'transparent',
                        alignItems: 'flex-start',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                        {m.escalation ? (
                          <EscalationIcon sx={{ fontSize: 18, color: '#ff9800' }} />
                        ) : (
                          <CheckIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={TIPO_LABEL[m.intent?.tipo] || m.intent?.tipo || '?'}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                backgroundColor: TIPO_COLORI[m.intent?.tipo] || '#9e9e9e',
                                color: 'white',
                              }}
                            />
                            {m.nomeCliente && (
                              <Typography variant="caption" color="primary" fontWeight={600}>
                                {m.nomeCliente}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.primary' }}>
                              "{m.testo?.substring(0, 60)}{m.testo?.length > 60 ? '…' : ''}"
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                {m.numero}
                              </Typography>
                              <TimestampChip ts={m.timestamp} />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < ultimiMessaggi.slice(0, 15).length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Panel test */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              🧪 Test risposta bot
            </Typography>
            <TextField
              fullWidth
              label="Messaggio da testare"
              placeholder='Es: "quanto costano i ravioli?"'
              value={testoTest}
              onChange={e => setTestoTest(e.target.value)}
              multiline
              rows={3}
              size="small"
              sx={{ mb: 1.5 }}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.ctrlKey) handleTestRisposta();
              }}
            />
            <TextField
              fullWidth
              label="Nome cliente (opzionale)"
              placeholder="Es: Maria"
              value={nomeTest}
              onChange={e => setNomeTest(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={testando ? <CircularProgress size={16} color="inherit" /> : <TestIcon />}
              onClick={handleTestRisposta}
              disabled={!testoTest.trim() || testando}
            >
              {testando ? 'Elaborazione...' : 'Testa risposta'}
            </Button>

            {/* Legenda tipi */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Tipi di intent gestiti:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(TIPO_LABEL).map(([tipo, label]) => (
                <Chip
                  key={tipo}
                  label={label}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.6rem',
                    backgroundColor: TIPO_COLORI[tipo] || '#9e9e9e',
                    color: 'white',
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Dialog risultato test */}
      <Dialog
        open={dialogTest}
        onClose={() => setDialogTest(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PreviewIcon />
          Risultato test bot
        </DialogTitle>
        <DialogContent dividers>
          {risultatoTest && (
            <Box>
              {/* Intent */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Testo testato:</Typography>
                <Paper sx={{ p: 1.5, mt: 0.5, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body2">"{risultatoTest.testo}"</Typography>
                </Paper>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Intent classificato:</Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={TIPO_LABEL[risultatoTest.intent?.tipo] || risultatoTest.intent?.tipo}
                      sx={{
                        backgroundColor: TIPO_COLORI[risultatoTest.intent?.tipo] || '#9e9e9e',
                        color: 'white',
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Prodotto:</Typography>
                  <Box mt={0.5}>
                    <Chip label={risultatoTest.intent?.prodotto || 'nessuno'} variant="outlined" />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Confidenza:</Typography>
                  <Box mt={0.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(risultatoTest.intent?.confidenza || 0) * 100}
                      sx={{ width: 80, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2">
                      {Math.round((risultatoTest.intent?.confidenza || 0) * 100)}%
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Escalation:</Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={risultatoTest.escalation ? `Sì (${risultatoTest.motivo})` : 'No'}
                      color={risultatoTest.escalation ? 'warning' : 'success'}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>

              {/* Anteprima risposta */}
              <Typography variant="caption" color="text.secondary">Risposta che verrà inviata su WhatsApp:</Typography>
              {risultatoTest.risposta ? (
                <Paper
                  sx={{
                    p: 2,
                    mt: 0.5,
                    backgroundColor: '#dcf8c6',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    borderRadius: 2,
                    maxHeight: 400,
                    overflowY: 'auto',
                  }}
                >
                  {risultatoTest.risposta}
                </Paper>
              ) : (
                <Alert severity="info" sx={{ mt: 0.5 }}>
                  Nessuna risposta automatica (gestione manuale richiesta)
                </Alert>
              )}

              {risultatoTest.durataMs && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ⏱ Elaborazione: {risultatoTest.durataMs}ms
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogTest(false)}>Chiudi</Button>
          <Button
            variant="outlined"
            onClick={() => {
              setDialogTest(false);
              setTestoTest('');
              setNomeTest('');
              setRisultatoTest(null);
            }}
          >
            Nuovo test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KpiCard
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({ label, valore, sottoTitolo, icona, colore }) {
  return (
    <Card>
      <CardContent sx={{ pb: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: colore }}>
              {valore}
            </Typography>
            {sottoTitolo && (
              <Typography variant="caption" color="text.secondary">
                {sottoTitolo}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: colore, opacity: 0.7, mt: 0.5 }}>
            {React.cloneElement(icona, { sx: { fontSize: 28 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}