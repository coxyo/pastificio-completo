// components/GestioneZeppole.js - ✅ FIX 17/01/2026: Usa totaleComplessivo per calcolo corretto
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  LocalFireDepartment as FireIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app';

// ✅ FIX: Converti unità in Kg (Zeppole: 24 pz/Kg, €21/Kg)
const convertiInKg = (quantita, unita) => {
  const qty = parseFloat(quantita) || 0;
  const unit = (unita || 'Kg').toLowerCase();
  
  if (unit === 'kg') return qty;
  if (unit === 'g') return qty / 1000;
  if (unit === 'pz' || unit === 'pezzi') return qty / 24; // ✅ 24 pezzi = 1 Kg
  if (unit === '€' || unit === 'euro') return qty / 21;   // ✅ €21 = 1 Kg
  
  return qty;
};

// ✅ Calcola totale ordinato dalla tabella (solo per display)
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
  const [venditeRapide, setVenditeRapide] = useState({
    '100': false,
    '200': false,
    '500': false,
    '700': false,
    '1000': false
  });
  const [quantitaPersonalizzata, setQuantitaPersonalizzata] = useState('');
  const [error, setError] = useState(null);

  // 📊 CARICA DATI
  const caricaDati = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ FIX SSR: Verifica che sia nel browser
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      // ✅ Carica limite con filtro data
      const limiteUrl = `${API_URL}/api/limiti/prodotto/Zeppole?data=${dataSelezionata}`;
      console.log('[ZEPPOLE] Carico limite da:', limiteUrl);
      
      const limiteRes = await fetch(limiteUrl, { headers });
      const limiteJson = await limiteRes.json();

      if (!limiteJson.success) {
        throw new Error(limiteJson.message || 'Errore caricamento limite');
      }

      console.log('[ZEPPOLE] Limite ricevuto:', limiteJson.data);
      setLimiteData(limiteJson.data);

      // ✅ Carica ordini con filtro data
      const ordiniUrl = `${API_URL}/api/limiti/ordini-prodotto/Zeppole?data=${dataSelezionata}`;
      console.log('[ZEPPOLE] Carico ordini da:', ordiniUrl);
      
      const ordiniRes = await fetch(ordiniUrl, { headers });
      const ordiniJson = await ordiniRes.json();

      if (ordiniJson.success) {
        console.log('[ZEPPOLE] Ordini ricevuti:', ordiniJson.count, 'ordini');
        setOrdiniOggi(ordiniJson.data || []);
      }

    } catch (err) {
      console.error('[ZEPPOLE] Errore caricamento:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Effect per caricare dati quando cambia la data o si apre il dialog
  useEffect(() => {
    if (open) {
      caricaDati();
    }
  }, [open, dataSelezionata]);

  // 📝 REGISTRA VENDITA DIRETTA
  const registraVendita = async (quantitaGrammi) => {
    try {
      setLoading(true);
      setError(null);

      const quantitaKg = quantitaGrammi / 1000;
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch(`${API_URL}/api/limiti/vendita-diretta`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prodotto: 'Zeppole',
          quantitaKg,
          data: dataSelezionata
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Errore registrazione vendita');
      }

      console.log('[ZEPPOLE] Vendita registrata:', result.data);
      
      // ✅ Ricarica dati dopo vendita
      await caricaDati();

      // Reset quantità personalizzata
      setQuantitaPersonalizzata('');

    } catch (err) {
      console.error('[ZEPPOLE] Errore vendita:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 RESET DISPONIBILITÀ
  const resetDisponibilita = async () => {
    if (!confirm('⚠️ Vuoi resettare la disponibilità a 0 Kg? (Solo vendite dirette, ordini restano)')) {
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

      const response = await fetch(`${API_URL}/api/limiti/reset-prodotto`, {
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

      console.log('[ZEPPOLE] Reset completato');
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

      const response = await fetch(`${API_URL}/api/limiti/${limiteData._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          limiteQuantita: parseFloat(nuovoLimite)
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Errore modifica limite');
      }

      console.log('[ZEPPOLE] Limite modificato');
      await caricaDati();

    } catch (err) {
      console.error('[ZEPPOLE] Errore modifica:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 📊 CALCOLI
  // ✅ FIX 17/01/2026: Usa totaleComplessivo invece di quantitaOrdinata
  const limiteKg = limiteData?.limiteQuantita || 0;
  const ordinatoKg = limiteData?.totaleComplessivo || 0; // ✅ QUESTA È LA FIX!
  const disponibileKg = limiteKg - ordinatoKg;
  const percentualeUtilizzo = limiteKg > 0 ? (ordinatoKg / limiteKg) * 100 : 0;

  // Per display separato (opzionale)
  const totaleOrdini = limiteData?.totaleOrdini || 0;
  const venditeDirette = limiteData?.quantitaOrdinata || 0;

  // 🎨 Colore barra
  const getColoreBarra = () => {
    if (percentualeUtilizzo >= 90) return '#f44336'; // Rosso
    if (percentualeUtilizzo >= 70) return '#ff9800'; // Arancione
    return '#4caf50'; // Verde
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
          maxHeight: '90vh'
        }
      }}
    >
      {/* HEADER */}
      <DialogHeader
        sx={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
          color: 'white',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ fontSize: 32 }}>🍩</Box>
          <Box>
            <DialogTitle sx={{ p: 0, fontSize: 24, fontWeight: 700 }}>
              Gestione Zeppole
            </DialogTitle>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Monitoraggio disponibilità giornaliera
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={caricaDati}
            disabled={loading}
            sx={{ color: 'white' }}
          >
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogHeader>

      <DialogContent sx={{ p: 3 }}>
        {/* ERRORE */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* LOADING */}
        {loading && !limiteData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* SELETTORE DATA */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                onClick={() => {
                  const oggi = new Date(dataSelezionata);
                  oggi.setDate(oggi.getDate() - 1);
                  setDataSelezionata(oggi.toISOString().split('T')[0]);
                }}
              >
                ◀
              </Button>
              
              <TextField
                type="date"
                value={dataSelezionata}
                onChange={(e) => setDataSelezionata(e.target.value)}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
              />

              <Button
                onClick={() => {
                  const oggi = new Date(dataSelezionata);
                  oggi.setDate(oggi.getDate() + 1);
                  setDataSelezionata(oggi.toISOString().split('T')[0]);
                }}
              >
                ▶
              </Button>

              <Button
                variant="contained"
                onClick={() => setDataSelezionata(new Date().toISOString().split('T')[0])}
              >
                OGGI
              </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* DISPONIBILITÀ OGGI */}
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ fontSize: 28, mr: 1 }}>📊</Box>
                  <Typography variant="h6" fontWeight={600}>
                    Disponibilità Oggi
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                  {format(parseISO(dataSelezionata), 'EEEE dd MMMM yyyy', { locale: it })}
                </Typography>

                {/* BARRA PROGRESSO */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Ordinato: {ordinatoKg.toFixed(2)} Kg
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, fontSize: 11 }}>
                    📦 Ordini: {totaleOrdini.toFixed(2)} Kg | 🛒 Vendite dirette: {venditeDirette.toFixed(2)} Kg
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Limite: {limiteKg} Kg
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      height: 20,
                      bgcolor: 'rgba(255,255,255,0.3)',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        width: `${Math.min(percentualeUtilizzo, 100)}%`,
                        height: '100%',
                        bgcolor: getColoreBarra(),
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', fontWeight: 600 }}>
                    {percentualeUtilizzo.toFixed(1)}% utilizzato
                  </Typography>
                </Box>

                {/* DISPONIBILE */}
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    p: 2,
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h2" fontWeight={700}>
                    {disponibileKg.toFixed(1)}
                  </Typography>
                  <Typography variant="body1">
                    Kg Disponibili
                  </Typography>
                </Box>

                {/* ULTIMO AGGIORNAMENTO */}
                {limiteData?.updatedAt && (
                  <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center', opacity: 0.8 }}>
                    ⏰ Ultimo aggiornamento: {format(parseISO(limiteData.updatedAt), 'HH:mm:ss')}
                  </Typography>
                )}
              </Paper>

              {/* VENDITA RAPIDA */}
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FireIcon sx={{ fontSize: 28, mr: 1, color: '#ff6b35' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Vendita Rapida
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Registra vendite dirette (non da ordini)
                </Typography>

                {/* BOTTONI RAPIDI */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
                  {[100, 200, 500, 700, 1000].map((grammi) => (
                    <Button
                      key={grammi}
                      variant="contained"
                      color="primary"
                      onClick={() => registraVendita(grammi)}
                      disabled={loading || disponibileKg <= 0}
                      sx={{ height: 50, fontSize: 16, fontWeight: 600 }}
                    >
                      + {grammi}G
                    </Button>
                  ))}
                  
                  {/* BOTTONE 1 KG */}
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => registraVendita(1000)}
                    disabled={loading || disponibileKg <= 0}
                    sx={{ height: 50, fontSize: 16, fontWeight: 600, gridColumn: 'span 2' }}
                  >
                    + 1 KG
                  </Button>
                </Box>

                {/* VENDITA PERSONALIZZATA */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    VENDITA PERSONALIZZATA
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="Inserisci grammi..."
                      value={quantitaPersonalizzata}
                      onChange={(e) => setQuantitaPersonalizzata(e.target.value)}
                      disabled={loading}
                      inputProps={{ min: 1, step: 1 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        const grammi = parseInt(quantitaPersonalizzata);
                        if (grammi > 0) {
                          registraVendita(grammi);
                        }
                      }}
                      disabled={loading || !quantitaPersonalizzata || disponibileKg <= 0}
                    >
                      REGISTRA
                    </Button>
                  </Box>
                </Box>

                {/* GESTIONE */}
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    🔧 Gestione
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={resetDisponibilita}
                      disabled={loading}
                      fullWidth
                      startIcon={<RefreshIcon />}
                    >
                      RESET
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={modificaLimite}
                      disabled={loading}
                      fullWidth
                    >
                      MODIFICA LIMITE
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* TABELLA ORDINI */}
            <Paper elevation={3} sx={{ mt: 3, borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ fontSize: 24, mr: 1 }}>📋</Box>
                  <Typography variant="h6" fontWeight={600}>
                    Ordini Registrati Oggi
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip
                    icon={<Box>📦</Box>}
                    label={`${ordiniOggi.length} ordini`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Box>⚖️</Box>}
                    label={`${calcolaTotaleOrdinato(ordiniOggi).toFixed(2)} Kg totali`}
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
              </Box>

              {ordiniOggi.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Nessun ordine registrato per oggi
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Ora</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Cliente</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Codice</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }} align="right">Quantità</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Note</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Stato</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ordiniOggi.map((ordine, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Chip
                              label={ordine.oraRitiro}
                              size="small"
                              sx={{ fontWeight: 600, minWidth: 60 }}
                            />
                          </TableCell>
                          <TableCell>{ordine.cliente}</TableCell>
                          <TableCell>
                            <Chip
                              label={ordine.codiceCliente || '-'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <Typography variant="body2" fontWeight={600}>
                                {ordine.quantita} {ordine.unita}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ({convertiInKg(ordine.quantita, ordine.unita).toFixed(3)} Kg)
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{ordine.note || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={ordine.stato}
                              size="small"
                              color={ordine.stato === 'nuovo' ? 'primary' : 'default'}
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
