// components/GestioneZeppole.js - ✅ FIX 28/01/2026: Storico vendite, etichette corrette, layout compatto
import React, { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import {
  Dialog,
  DialogContent,
  DialogTitle,
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
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  LocalFireDepartment as FireIcon,
  History as HistoryIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '42b401f9d1043202d98a';
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

// ✅ FIX: Converti unità in Kg (Zeppole: 24 pz/Kg, €21/Kg)
const convertiInKg = (quantita, unita) => {
  const qty = parseFloat(quantita) || 0;
  const unit = (unita || 'Kg').toLowerCase();
  
  if (unit === 'kg') return qty;
  if (unit === 'g') return qty / 1000;
  if (unit === 'pz' || unit === 'pezzi') return qty / 24;
  if (unit === '€' || unit === 'euro') return qty / 21;
  
  return qty;
};

// ✅ Calcola totale ordinato dalla tabella
const calcolaTotaleOrdinato = (ordini) => {
  return ordini.reduce((totale, ordine) => {
    const quantitaKg = convertiInKg(ordine.quantita, ordine.unita);
    return totale + quantitaKg;
  }, 0);
};

const GestioneZeppole = ({ open, onClose }) => {
  // 🎯 STATE
  const [loading, setLoading] = useState(false);
  const [limiteData, setLimiteData] = useState(null);
  const [ordiniOggi, setOrdiniOggi] = useState([]);
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);
  const [quantitaPersonalizzata, setQuantitaPersonalizzata] = useState('');
  const [error, setError] = useState(null);
  
  // ✅ NUOVO: Storico vendite rapide (locale, si resetta alla chiusura)
  const [storicoVendite, setStoricoVendite] = useState([]);

  // 📊 CARICA DATI
  const caricaDati = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      // Carica limite
      const limiteUrl = `${API_URL}/limiti/prodotto/Zeppole?data=${dataSelezionata}`;
      const limiteRes = await fetch(limiteUrl, { headers });
      const limiteJson = await limiteRes.json();

      if (!limiteJson.success) {
        throw new Error(limiteJson.message || 'Errore caricamento limite');
      }

      setLimiteData(limiteJson.data);

      // Carica ordini
      const ordiniUrl = `${API_URL}/limiti/ordini-prodotto/Zeppole?data=${dataSelezionata}`;
      const ordiniRes = await fetch(ordiniUrl, { headers });
      const ordiniJson = await ordiniRes.json();

      if (ordiniJson.success) {
        setOrdiniOggi(ordiniJson.data || []);
      }

    } catch (err) {
      console.error('[ZEPPOLE] Errore caricamento:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Effect per caricare dati
  useEffect(() => {
    if (open) {
      caricaDati();
      // Reset storico quando si apre
      setStoricoVendite([]);
      
      // Polling ogni 10 secondi
      const intervalId = setInterval(caricaDati, 10000);
      
      // Pusher
      let pusher, channel;
      if (typeof window !== 'undefined') {
        try {
          pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, encrypted: true });
          channel = pusher.subscribe('zeppole-channel');
          
          channel.bind('nuovo-ordine', caricaDati);
          channel.bind('vendita-diretta', caricaDati);
          channel.bind('reset-disponibilita', () => {
            caricaDati();
            setStoricoVendite([]); // Reset storico su reset disponibilità
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
  }, [open, dataSelezionata]);

  // 📊 CALCOLI - Messi PRIMA di registraVendita per usare disponibileKg
  const limiteKg = limiteData?.limiteQuantita || 0;
  const ordinatoKg = limiteData?.totaleComplessivo || 0;
  const disponibileKg = limiteData?.disponibile || 0;
  const percentualeUtilizzo = limiteData?.percentualeUtilizzo || 0;
  const totaleOrdini = limiteData?.totaleOrdini || 0;
  const venditeDirette = limiteData?.quantitaOrdinata || 0;

  // 📝 REGISTRA VENDITA DIRETTA - ✅ FIX: Controllo rigoroso della quantità
  const registraVendita = async (quantitaGrammi) => {
    // ✅ FIX: Validazione rigorosa
    const grammi = Math.round(parseFloat(quantitaGrammi) || 0);
    if (grammi <= 0) {
      setError('Quantità non valida');
      return;
    }

    const quantitaKg = grammi / 1000;
    
    // ✅ FIX: Verifica disponibilità PRIMA di inviare
    if (quantitaKg > disponibileKg) {
      setError(`Disponibili solo ${disponibileKg.toFixed(2)} Kg`);
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

      console.log(`[ZEPPOLE] Invio vendita: ${grammi}g = ${quantitaKg}Kg`);

      const response = await fetch(`${API_URL}/limiti/vendita-diretta`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prodotto: 'Zeppole',
          quantitaKg: quantitaKg, // ✅ Invia il valore esatto calcolato
          data: dataSelezionata
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Errore registrazione vendita');
      }

      console.log('[ZEPPOLE] Vendita registrata:', result.data);
      
      // ✅ NUOVO: Aggiungi allo storico vendite
      setStoricoVendite(prev => [{
        id: Date.now(),
        grammi: grammi,
        ora: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      }, ...prev].slice(0, 10)); // Mantieni max 10 vendite
      
      // Ricarica dati
      await caricaDati();
      setQuantitaPersonalizzata('');

    } catch (err) {
      console.error('[ZEPPOLE] Errore vendita:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUOVO: Rimuovi dallo storico locale (NON dal server)
  const rimuoviDaStorico = (id) => {
    setStoricoVendite(prev => prev.filter(v => v.id !== id));
  };

  // 🔄 RESET DISPONIBILITÀ
  const resetDisponibilita = async () => {
    if (!confirm('⚠️ Vuoi resettare le vendite dirette a 0? (Gli ordini restano)')) {
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

      const response = await fetch(`${API_URL}/limiti/reset-prodotto`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prodotto: 'Zeppole',
          data: dataSelezionata
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Errore reset');
      }

      // Reset storico locale
      setStoricoVendite([]);
      await caricaDati();

    } catch (err) {
      console.error('[ZEPPOLE] Errore reset:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ⚙️ MODIFICA LIMITE
  const modificaLimite = async () => {
    const nuovoLimite = prompt('Inserisci nuovo limite giornaliero (Kg):', limiteData?.limiteQuantita || 27);
    
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
          data: dataSelezionata
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Errore modifica limite');
      }

      await caricaDati();

    } catch (err) {
      console.error('[ZEPPOLE] Errore modifica:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Colore barra
  const getColoreBarra = () => {
    if (percentualeUtilizzo >= 90) return '#f44336';
    if (percentualeUtilizzo >= 70) return '#ff9800';
    return '#4caf50';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#fff',
          borderRadius: 2,
          maxHeight: '95vh'
        }
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
          color: 'white',
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ fontSize: 28 }}>🍩</Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Gestione Zeppole
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Monitoraggio disponibilità giornaliera
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={caricaDati} disabled={loading} sx={{ color: 'white' }}>
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 2 }}>
        {/* ERRORE */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && !limiteData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* SELETTORE DATA - più compatto */}
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

            {/* CARDS PRINCIPALI - Layout a 3 colonne */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
              
              {/* DISPONIBILITÀ - COMPATTA */}
              <Paper
                elevation={2}
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

                {/* BARRA PROGRESSO */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">Ordinato: {ordinatoKg.toFixed(1)} Kg</Typography>
                    <Typography variant="caption">Limite: {limiteKg} Kg</Typography>
                  </Box>
                  <Box sx={{ height: 12, bgcolor: '#e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${Math.min(percentualeUtilizzo, 100)}%`,
                        bgcolor: getColoreBarra(),
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                    {percentualeUtilizzo.toFixed(1)}% utilizzato
                  </Typography>
                </Box>

                {/* DISPONIBILE */}
                <Box sx={{ textAlign: 'center', py: 1, bgcolor: disponibileKg > 0 ? '#e8f5e9' : '#ffebee', borderRadius: 1 }}>
                  <Typography variant="h4" fontWeight={700}>
                    {disponibileKg.toFixed(1)}
                  </Typography>
                  <Typography variant="caption">Kg Disponibili</Typography>
                </Box>
              </Paper>

              {/* VENDITA RAPIDA */}
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FireIcon sx={{ fontSize: 20, mr: 0.5, color: '#ff6b35' }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Vendita Rapida
                  </Typography>
                </Box>

                {/* BOTTONI RAPIDI - ✅ FIX: Etichette corrette, niente duplicati */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5, mb: 1 }}>
                  {[
                    { g: 100, label: '100 g' },
                    { g: 200, label: '200 g' },
                    { g: 500, label: '500 g' },
                    { g: 700, label: '700 g' }
                  ].map(({ g, label }) => (
                    <Button
                      key={g}
                      variant="contained"
                      color="primary"
                      onClick={() => registraVendita(g)}
                      disabled={loading || disponibileKg <= 0}
                      size="small"
                      sx={{ height: 36, fontSize: 13, fontWeight: 600 }}
                    >
                      + {label}
                    </Button>
                  ))}
                </Box>
                
                {/* BOTTONE 1 KG - Solo uno */}
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => registraVendita(1000)}
                  disabled={loading || disponibileKg <= 0}
                  fullWidth
                  size="small"
                  sx={{ height: 36, fontSize: 13, fontWeight: 600, mb: 1 }}
                >
                  + 1 Kg
                </Button>

                {/* VENDITA PERSONALIZZATA */}
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
                      if (g > 0) registraVendita(g);
                    }}
                    disabled={loading || !quantitaPersonalizzata || disponibileKg <= 0}
                  >
                    OK
                  </Button>
                </Box>

                {/* GESTIONE */}
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee', display: 'flex', gap: 0.5 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={resetDisponibilita}
                    disabled={loading}
                    size="small"
                    sx={{ flex: 1, fontSize: 11 }}
                  >
                    RESET
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={modificaLimite}
                    disabled={loading}
                    size="small"
                    sx={{ flex: 1, fontSize: 11 }}
                  >
                    MOD. LIMITE
                  </Button>
                </Box>
              </Paper>

              {/* ✅ NUOVO: STORICO VENDITE RAPIDE */}
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2, maxHeight: 220, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <HistoryIcon sx={{ fontSize: 20, mr: 0.5, color: '#1976d2' }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Ultime Vendite ({storicoVendite.length})
                  </Typography>
                </Box>

                {storicoVendite.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
                    Nessuna vendita registrata in questa sessione
                  </Typography>
                ) : (
                  <List dense sx={{ py: 0 }}>
                    {storicoVendite.map((vendita, idx) => (
                      <ListItem
                        key={vendita.id}
                        sx={{ 
                          py: 0.5, 
                          px: 1,
                          bgcolor: idx === 0 ? '#e3f2fd' : 'transparent',
                          borderRadius: 1,
                          mb: 0.5
                        }}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            size="small"
                            onClick={() => rimuoviDaStorico(vendita.id)}
                            sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                          >
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

                {/* Totale vendite rapide dal server */}
                {venditeDirette > 0 && (
                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Totale vendite dirette oggi: <strong>{venditeDirette.toFixed(2)} Kg</strong>
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* TABELLA ORDINI - Più spazio */}
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ fontSize: 20, mr: 1 }}>📋</Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Ordini Registrati
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`${ordiniOggi.length} ordini`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${calcolaTotaleOrdinato(ordiniOggi).toFixed(2)} Kg`}
                    color="secondary"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>

              {ordiniOggi.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Nessun ordine registrato per oggi
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
                      {ordiniOggi.map((ordine, idx) => (
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
                            <Chip
                              label={ordine.stato}
                              size="small"
                              color={ordine.stato === 'nuovo' ? 'primary' : 'default'}
                              sx={{ height: 22 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GestioneZeppole;