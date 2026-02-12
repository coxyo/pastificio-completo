// components/GestioneZeppole.js - ✅ AGGIORNAMENTO 12/02/2026: Divisione MATTINA / SERA
import React, { useState, useEffect, useCallback } from 'react';
import Pusher from 'pusher-js';
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  LocalFireDepartment as FireIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  WbSunny as MorningIcon,
  NightsStay as EveningIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '42b401f9d1043202d98a';
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

// Ora di cambio fascia
const ORA_CAMBIO = '14:00';

// ✅ Converti unità in Kg (Zeppole: 24 pz/Kg, €21/Kg)
const convertiInKg = (quantita, unita) => {
  const qty = parseFloat(quantita) || 0;
  const unit = (unita || 'Kg').toLowerCase();
  if (unit === 'kg') return qty;
  if (unit === 'g') return qty / 1000;
  if (unit === 'pz' || unit === 'pezzi') return qty / 24;
  if (unit === '€' || unit === 'euro') return qty / 21;
  return qty;
};

const calcolaTotaleOrdinato = (ordini) => {
  return ordini.reduce((totale, ordine) => {
    return totale + convertiInKg(ordine.quantita, ordine.unita);
  }, 0);
};

// ✅ Determina fascia corrente in base all'ora
const getFasciaCorrente = () => {
  const ora = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false });
  return ora < ORA_CAMBIO ? 'mattina' : 'sera';
};

// ============================================================
// COMPONENTE PANNELLO FASCIA (riutilizzato per mattina e sera)
// ============================================================
const PannelloFascia = ({
  fascia,
  limiteData,
  ordini,
  loading,
  disponibileKg,
  onRegistraVendita,
  onReset,
  onModificaLimite,
  storicoVendite,
  onRimuoviDaStorico,
  isAttiva
}) => {
  const [quantitaPersonalizzata, setQuantitaPersonalizzata] = useState('');

  const limiteKg = limiteData?.limiteQuantita || 0;
  const ordinatoKg = limiteData?.totaleComplessivo || 0;
  const percentualeUtilizzo = limiteData?.percentualeUtilizzo || 0;
  const venditeDirette = limiteData?.quantitaOrdinata || 0;

  const getColoreBarra = () => {
    if (percentualeUtilizzo >= 90) return '#f44336';
    if (percentualeUtilizzo >= 70) return '#ff9800';
    return '#4caf50';
  };

  const isMattina = fascia === 'mattina';
  const coloreHeader = isMattina 
    ? 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)' 
    : 'linear-gradient(135deg, #5C6BC0 0%, #7986CB 100%)';
  const icona = isMattina ? '☀️' : '🌙';
  const label = isMattina ? 'MATTINA (fino alle 14:00)' : 'SERA (dalle 14:00)';

  return (
    <Paper 
      elevation={isAttiva ? 4 : 1} 
      sx={{ 
        borderRadius: 2, 
        overflow: 'hidden',
        opacity: isAttiva ? 1 : 0.7,
        border: isAttiva ? '2px solid #1976d2' : '1px solid #e0e0e0',
        transition: 'all 0.3s ease'
      }}
    >
      {/* HEADER FASCIA */}
      <Box sx={{ 
        background: coloreHeader, 
        color: 'white', 
        p: 1.5, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">{icona}</Typography>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{label}</Typography>
            {isAttiva && (
              <Chip label="ATTIVA ORA" size="small" sx={{ 
                bgcolor: 'rgba(255,255,255,0.3)', 
                color: 'white', 
                fontWeight: 700, 
                fontSize: 10,
                height: 20 
              }} />
            )}
          </Box>
        </Box>
        <Typography variant="h5" fontWeight={700}>
          {disponibileKg.toFixed(1)} Kg
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* CARDS: Disponibilità + Vendita Rapida + Storico */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
          
          {/* DISPONIBILITÀ */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${getColoreBarra()}22 0%, ${getColoreBarra()}11 100%)`,
              border: `2px solid ${getColoreBarra()}`
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              📊 Disponibilità
            </Typography>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption">Ordinato: {ordinatoKg.toFixed(1)} Kg</Typography>
                <Typography variant="caption">Limite: {limiteKg} Kg</Typography>
              </Box>
              <Box sx={{ height: 12, bgcolor: '#e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{
                  height: '100%',
                  width: `${Math.min(percentualeUtilizzo, 100)}%`,
                  bgcolor: getColoreBarra(),
                  transition: 'width 0.5s ease'
                }} />
              </Box>
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                {percentualeUtilizzo.toFixed(1)}% utilizzato
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', py: 1, bgcolor: disponibileKg > 0 ? '#e8f5e9' : '#ffebee', borderRadius: 1 }}>
              <Typography variant="h4" fontWeight={700}>
                {disponibileKg.toFixed(1)}
              </Typography>
              <Typography variant="caption">Kg Disponibili</Typography>
            </Box>
          </Paper>

          {/* VENDITA RAPIDA */}
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FireIcon sx={{ fontSize: 20, mr: 0.5, color: '#ff6b35' }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Vendita Rapida
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5, mb: 1 }}>
              {[
                { g: 100, label: '+ 100 g' },
                { g: 200, label: '+ 200 g' },
                { g: 500, label: '+ 500 g' },
                { g: 700, label: '+ 700 g' }
              ].map(({ g, label: lbl }) => (
                <Button
                  key={g}
                  variant="contained"
                  color="primary"
                  onClick={() => onRegistraVendita(g, fascia)}
                  disabled={loading || disponibileKg <= 0}
                  size="small"
                  sx={{ height: 36, fontSize: 13, fontWeight: 600 }}
                >
                  {lbl}
                </Button>
              ))}
            </Box>
            <Button
              variant="contained"
              color="success"
              onClick={() => onRegistraVendita(1000, fascia)}
              disabled={loading || disponibileKg <= 0}
              fullWidth
              size="small"
              sx={{ height: 36, fontSize: 13, fontWeight: 600, mb: 1 }}
            >
              + 1 Kg
            </Button>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <TextField
                size="small"
                type="number"
                placeholder="Grammi..."
                value={quantitaPersonalizzata}
                onChange={(e) => setQuantitaPersonalizzata(e.target.value)}
                disabled={loading}
                inputProps={{ min: 1, step: 1 }}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  const g = parseInt(quantitaPersonalizzata);
                  if (g > 0) {
                    onRegistraVendita(g, fascia);
                    setQuantitaPersonalizzata('');
                  }
                }}
                disabled={loading || !quantitaPersonalizzata || disponibileKg <= 0}
              >
                OK
              </Button>
            </Box>
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee', display: 'flex', gap: 0.5 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={() => onReset(fascia)}
                disabled={loading}
                size="small"
                sx={{ flex: 1, fontSize: 11 }}
              >
                RESET
              </Button>
              <Button
                variant="outlined"
                onClick={() => onModificaLimite(fascia)}
                disabled={loading}
                size="small"
                sx={{ flex: 1, fontSize: 11 }}
              >
                MOD. LIMITE
              </Button>
            </Box>
          </Paper>

          {/* STORICO VENDITE */}
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, maxHeight: 250, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <HistoryIcon sx={{ fontSize: 20, mr: 0.5, color: '#1976d2' }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Ultime Vendite ({storicoVendite.length})
              </Typography>
            </Box>
            {storicoVendite.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
                Nessuna vendita in questa sessione
              </Typography>
            ) : (
              <List dense sx={{ py: 0 }}>
                {storicoVendite.map((vendita, idx) => (
                  <ListItem
                    key={vendita.id}
                    sx={{
                      py: 0.5, px: 1,
                      bgcolor: idx === 0 ? '#e3f2fd' : 'transparent',
                      borderRadius: 1, mb: 0.5
                    }}
                    secondaryAction={
                      <IconButton edge="end" size="small" onClick={() => onRimuoviDaStorico(vendita.id)}
                        sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={idx === 0 ? 600 : 400}>
                          {vendita.grammi >= 1000
                            ? `${(vendita.grammi / 1000).toFixed(1)} Kg`
                            : `${vendita.grammi} g`}
                          {idx === 0 && <Chip label="ULTIMO" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: 10 }} />}
                        </Typography>
                      }
                      secondary={`🕐 ${vendita.ora}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            {venditeDirette > 0 && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Vendite dirette {fascia}: <strong>{venditeDirette.toFixed(2)} Kg</strong>
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* TABELLA ORDINI */}
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ fontSize: 20, mr: 1 }}>📋</Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Ordini {isMattina ? 'Mattina' : 'Sera'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={`${ordini.length} ordini`} color="primary" size="small" variant="outlined" />
              <Chip label={`${calcolaTotaleOrdinato(ordini).toFixed(2)} Kg`} color="secondary" size="small" variant="outlined" />
            </Box>
          </Box>
          {ordini.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Nessun ordine per {isMattina ? 'la mattina' : 'la sera'}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', py: 1 }}>Ora</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', py: 1 }}>Cliente</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', py: 1 }} align="right">Quantità</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', py: 1 }}>Stato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordini.map((ordine, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ py: 0.5 }}>
                        <Chip label={ordine.oraRitiro} size="small" sx={{ fontWeight: 600, minWidth: 50, height: 24 }} />
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>{ordine.cliente}</TableCell>
                      <TableCell align="right" sx={{ py: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {ordine.quantita} {ordine.unita}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({convertiInKg(ordine.quantita, ordine.unita).toFixed(3)} Kg)
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Chip label={ordine.stato} size="small"
                          color={ordine.stato === 'nuovo' ? 'primary' : 'default'}
                          sx={{ height: 22 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Paper>
  );
};

// ============================================================
// COMPONENTE PRINCIPALE
// ============================================================
const GestioneZeppole = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);

  // Dati MATTINA
  const [limiteMattina, setLimiteMattina] = useState(null);
  const [ordiniMattina, setOrdiniMattina] = useState([]);
  const [storicoMattina, setStoricoMattina] = useState([]);

  // Dati SERA
  const [limiteSera, setLimiteSera] = useState(null);
  const [ordiniSera, setOrdiniSera] = useState([]);
  const [storicoSera, setStoricoSera] = useState([]);

  // Tab attiva (auto-seleziona in base all'ora)
  const [tabAttiva, setTabAttiva] = useState(getFasciaCorrente() === 'mattina' ? 0 : 1);

  // Fascia attiva corrente (si aggiorna ogni minuto)
  const [fasciaCorrente, setFasciaCorrente] = useState(getFasciaCorrente());

  // Aggiorna fascia corrente ogni minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setFasciaCorrente(getFasciaCorrente());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 📊 CARICA DATI PER UNA FASCIA
  const caricaDatiFascia = useCallback(async (fascia) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    // Carica limite per fascia
    const limiteUrl = `${API_URL}/limiti/prodotto/Zeppole?data=${dataSelezionata}&fascia=${fascia}`;
    const limiteRes = await fetch(limiteUrl, { headers });
    const limiteJson = await limiteRes.json();

    if (!limiteJson.success) {
      throw new Error(limiteJson.message || `Errore caricamento limite ${fascia}`);
    }

    // Carica ordini per fascia
    const ordiniUrl = `${API_URL}/limiti/ordini-prodotto/Zeppole?data=${dataSelezionata}&fascia=${fascia}`;
    const ordiniRes = await fetch(ordiniUrl, { headers });
    const ordiniJson = await ordiniRes.json();

    return {
      limite: limiteJson.data,
      ordini: ordiniJson.success ? (ordiniJson.data || []) : []
    };
  }, [dataSelezionata]);

  // 📊 CARICA TUTTI I DATI
  const caricaDati = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [mattinaData, seraData] = await Promise.all([
        caricaDatiFascia('mattina'),
        caricaDatiFascia('sera')
      ]);

      setLimiteMattina(mattinaData.limite);
      setOrdiniMattina(mattinaData.ordini);
      setLimiteSera(seraData.limite);
      setOrdiniSera(seraData.ordini);

    } catch (err) {
      console.error('[ZEPPOLE] Errore caricamento:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caricaDatiFascia]);

  // ✅ Effect principale
  useEffect(() => {
    if (open) {
      caricaDati();
      setStoricoMattina([]);
      setStoricoSera([]);

      const intervalId = setInterval(caricaDati, 10000);

      let pusher, channel;
      if (typeof window !== 'undefined') {
        try {
          pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, encrypted: true });
          channel = pusher.subscribe('zeppole-channel');
          channel.bind('nuovo-ordine', caricaDati);
          channel.bind('vendita-diretta', caricaDati);
          channel.bind('reset-disponibilita', () => {
            caricaDati();
            setStoricoMattina([]);
            setStoricoSera([]);
          });
          channel.bind('limite-aggiornato', caricaDati);
        } catch (err) {
          console.warn('[ZEPPOLE] Pusher non disponibile:', err);
        }
      }

      return () => {
        clearInterval(intervalId);
        if (channel) { channel.unbind_all(); channel.unsubscribe(); }
        if (pusher) { pusher.disconnect(); }
      };
    }
  }, [open, dataSelezionata, caricaDati]);

  // Calcoli disponibilità
  const disponibileMattina = limiteMattina?.disponibile || 0;
  const disponibileSera = limiteSera?.disponibile || 0;

  // 📝 REGISTRA VENDITA DIRETTA
  const registraVendita = async (quantitaGrammi, fascia) => {
    const grammi = Math.round(parseFloat(quantitaGrammi) || 0);
    if (grammi <= 0) {
      setError('Quantità non valida');
      return;
    }

    const quantitaKg = grammi / 1000;
    const disponibile = fascia === 'mattina' ? disponibileMattina : disponibileSera;

    if (quantitaKg > disponibile) {
      setError(`[${fascia.toUpperCase()}] Disponibili solo ${disponibile.toFixed(2)} Kg`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch(`${API_URL}/limiti/vendita-diretta`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prodotto: 'Zeppole',
          quantitaKg,
          data: dataSelezionata,
          fascia
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Errore registrazione vendita');
      }

      // Aggiungi allo storico della fascia giusta
      const nuovaVendita = {
        id: Date.now(),
        grammi,
        ora: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };

      if (fascia === 'mattina') {
        setStoricoMattina(prev => [nuovaVendita, ...prev].slice(0, 10));
      } else {
        setStoricoSera(prev => [nuovaVendita, ...prev].slice(0, 10));
      }

      await caricaDati();
    } catch (err) {
      console.error('[ZEPPOLE] Errore vendita:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Rimuovi da storico locale
  const rimuoviDaStorico = (id, fascia) => {
    if (fascia === 'mattina') {
      setStoricoMattina(prev => prev.filter(v => v.id !== id));
    } else {
      setStoricoSera(prev => prev.filter(v => v.id !== id));
    }
  };

  // 🔄 RESET
  const resetDisponibilita = async (fascia) => {
    if (!confirm(`⚠️ Vuoi resettare le vendite dirette ${fascia.toUpperCase()} a 0?`)) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch(`${API_URL}/limiti/reset-prodotto`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prodotto: 'Zeppole', data: dataSelezionata, fascia })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Errore reset');

      if (fascia === 'mattina') setStoricoMattina([]);
      else setStoricoSera([]);

      await caricaDati();
    } catch (err) {
      console.error('[ZEPPOLE] Errore reset:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ⚙️ MODIFICA LIMITE
  const modificaLimite = async (fascia) => {
    const limiteCorrente = fascia === 'mattina' ? limiteMattina : limiteSera;
    const nuovoLimite = prompt(
      `Inserisci nuovo limite ${fascia.toUpperCase()} (Kg):`,
      limiteCorrente?.limiteQuantita || 30
    );
    if (!nuovoLimite || isNaN(nuovoLimite)) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch(`${API_URL}/limiti/prodotto/Zeppole`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          limiteQuantita: parseFloat(nuovoLimite),
          data: dataSelezionata,
          fascia
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Errore modifica limite');

      await caricaDati();
    } catch (err) {
      console.error('[ZEPPOLE] Errore modifica:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Totali complessivi giornalieri
  const totaleLimite = (limiteMattina?.limiteQuantita || 0) + (limiteSera?.limiteQuantita || 0);
  const totaleOrdinato = (limiteMattina?.totaleComplessivo || 0) + (limiteSera?.totaleComplessivo || 0);
  const totaleDisponibile = disponibileMattina + disponibileSera;

  return (
    <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ sx: { bgcolor: '#f5f5f5' } }}>
      {/* HEADER */}
      <Box sx={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
        color: 'white',
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ fontSize: 28 }}>🍩</Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Gestione Zeppole
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Mattina / Sera — Cambio alle {ORA_CAMBIO}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* RIEPILOGO GIORNALIERO */}
          <Box sx={{ textAlign: 'right', mr: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Totale Giorno</Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              {totaleOrdinato.toFixed(1)} / {totaleLimite} Kg
            </Typography>
          </Box>
          <IconButton onClick={caricaDati} disabled={loading} sx={{ color: 'white' }}>
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && !limiteMattina && !limiteSera ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* SELETTORE DATA */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button size="small" onClick={() => {
                const d = new Date(dataSelezionata);
                d.setDate(d.getDate() - 1);
                setDataSelezionata(d.toISOString().split('T')[0]);
              }}>◀</Button>
              <TextField
                type="date"
                value={dataSelezionata}
                onChange={(e) => setDataSelezionata(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <Button size="small" onClick={() => {
                const d = new Date(dataSelezionata);
                d.setDate(d.getDate() + 1);
                setDataSelezionata(d.toISOString().split('T')[0]);
              }}>▶</Button>
              <Button variant="outlined" size="small" onClick={() => setDataSelezionata(new Date().toISOString().split('T')[0])}>
                OGGI
              </Button>
            </Box>

            {/* RIEPILOGO RAPIDO */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
              <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fff3e0', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">☀️ Mattina</Typography>
                <Typography variant="h6" fontWeight={700} color="#e65100">
                  {disponibileMattina.toFixed(1)} Kg
                </Typography>
              </Paper>
              <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e8eaf6', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">🌙 Sera</Typography>
                <Typography variant="h6" fontWeight={700} color="#283593">
                  {disponibileSera.toFixed(1)} Kg
                </Typography>
              </Paper>
              <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e8f5e9', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">📊 Totale Giorno</Typography>
                <Typography variant="h6" fontWeight={700} color="#2e7d32">
                  {totaleDisponibile.toFixed(1)} Kg
                </Typography>
              </Paper>
            </Box>

            {/* TABS MATTINA / SERA */}
            <Tabs
              value={tabAttiva}
              onChange={(e, v) => setTabAttiva(v)}
              variant="fullWidth"
              sx={{
                mb: 2,
                bgcolor: 'white',
                borderRadius: 2,
                '& .MuiTab-root': { fontWeight: 700, fontSize: 14 }
              }}
            >
              <Tab
                icon={<MorningIcon />}
                iconPosition="start"
                label={`MATTINA (${disponibileMattina.toFixed(1)} Kg)`}
                sx={{ color: fasciaCorrente === 'mattina' ? '#e65100' : undefined }}
              />
              <Tab
                icon={<EveningIcon />}
                iconPosition="start"
                label={`SERA (${disponibileSera.toFixed(1)} Kg)`}
                sx={{ color: fasciaCorrente === 'sera' ? '#283593' : undefined }}
              />
            </Tabs>

            {/* PANNELLO MATTINA */}
            {tabAttiva === 0 && (
              <PannelloFascia
                fascia="mattina"
                limiteData={limiteMattina}
                ordini={ordiniMattina}
                loading={loading}
                disponibileKg={disponibileMattina}
                onRegistraVendita={registraVendita}
                onReset={resetDisponibilita}
                onModificaLimite={modificaLimite}
                storicoVendite={storicoMattina}
                onRimuoviDaStorico={(id) => rimuoviDaStorico(id, 'mattina')}
                isAttiva={fasciaCorrente === 'mattina'}
              />
            )}

            {/* PANNELLO SERA */}
            {tabAttiva === 1 && (
              <PannelloFascia
                fascia="sera"
                limiteData={limiteSera}
                ordini={ordiniSera}
                loading={loading}
                disponibileKg={disponibileSera}
                onRegistraVendita={registraVendita}
                onReset={resetDisponibilita}
                onModificaLimite={modificaLimite}
                storicoVendite={storicoSera}
                onRimuoviDaStorico={(id) => rimuoviDaStorico(id, 'sera')}
                isAttiva={fasciaCorrente === 'sera'}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GestioneZeppole;