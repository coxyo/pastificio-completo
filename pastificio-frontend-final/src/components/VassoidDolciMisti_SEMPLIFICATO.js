// components/VassoidDolciMisti_SEMPLIFICATO.js
// 🎂 COMPOSITORE VASSOI DOLCI PERSONALIZZATI - VERSIONE SEMPLIFICATA
// ✅ Solo modalità "Aggiungi prodotti liberamente"
// 📅 Creato: 22 Gennaio 2026

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Card,
  CardContent,
  Chip,
  Alert,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  Grid,
  Tooltip,
  Collapse,
  Badge
} from '@mui/material';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  AlertCircle,
  Info,
  Package,
  Gift,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ==========================================
// 🎯 CONFIGURAZIONE PRODOTTI DOLCI (FALLBACK)
// ==========================================
const PRODOTTI_DOLCI_DEFAULT = {
  'Pardulas': { prezzoKg: 19, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 20 },
  'Amaretti': { prezzoKg: 22, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 40 },
  'Bianchini': { prezzoKg: 25, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 50 },
  'Gueffus': { prezzoKg: 28, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 30 },
  'Ciambelle': { prezzoKg: 18, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 15 },
  'Pabassine': { prezzoKg: 20, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 25 },
  'Papassinas': { prezzoKg: 20, categoria: 'Dolci', unitaMisuraDisponibili: ['Kg', 'Pezzi'], pezziPerKg: 25 }
};

// ✅ Import dinamico con fallback
let PRODOTTI_CONFIG_IMPORTED = null;
let getProdottoConfigImported = null;

try {
  const config = require('../config/prodottiConfig.js');
  PRODOTTI_CONFIG_IMPORTED = config.PRODOTTI_CONFIG;
  getProdottoConfigImported = config.getProdottoConfig;
} catch (e) {
  console.warn('⚠️ Impossibile importare prodottiConfig, uso configurazione default');
}

// ✅ Funzione sicura per ottenere config prodotto
const getProdottoConfigSafe = (nomeProdotto) => {
  if (!nomeProdotto) return null;
  
  if (getProdottoConfigImported) {
    try {
      const config = getProdottoConfigImported(nomeProdotto);
      if (config) return config;
    } catch (e) {
      console.warn('Errore getProdottoConfig:', e);
    }
  }
  
  if (PRODOTTI_DOLCI_DEFAULT[nomeProdotto]) {
    return PRODOTTI_DOLCI_DEFAULT[nomeProdotto];
  }
  
  return {
    prezzoKg: 20,
    categoria: 'Dolci',
    unitaMisuraDisponibili: ['Kg', 'Pezzi'],
    pezziPerKg: 20
  };
};

// ✅ FUNZIONE HELPER: Trova label variante da nome
const getVarianteLabel = (nomeProdotto, nomeVariante) => {
  if (!nomeVariante) return null;
  
  if (typeof nomeVariante === 'object') {
    nomeVariante = nomeVariante.nome || nomeVariante.label || JSON.stringify(nomeVariante);
  }
  
  const config = getProdottoConfigSafe(nomeProdotto);
  if (!config?.varianti || !Array.isArray(config.varianti)) return String(nomeVariante);
  
  const variante = config.varianti.find(v => 
    (typeof v === "string" && v === nomeVariante) ||
    (typeof v === "object" && v.nome === nomeVariante)
  );
  
  const result = variante?.label || nomeVariante;
  return typeof result === 'string' ? result : String(result);
};

// ==========================================
// 🎯 CONFIGURAZIONE DIMENSIONI VASSOIO
// ==========================================
const DIMENSIONI_VASSOIO = {
  2: { label: 'Nr 2 - Piccolo', pesoSuggerito: 0.2, range: '~200g' },
  4: { label: 'Nr 4 - Medio', pesoSuggerito: 0.45, range: '~400-500g' },
  6: { label: 'Nr 6 - Grande', pesoSuggerito: 0.85, range: '~700g-1kg' },
  8: { label: 'Nr 8 - XL', pesoSuggerito: 1.5, range: '~1-2kg' }
};

// ==========================================
// 🔧 HELPER FUNCTIONS
// ==========================================
// ✅ Normalizza input decimali (accetta sia virgola che punto)
const normalizzaDecimale = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return '';
  const normalized = String(value).replace(/,/g, '.');
  return normalized;
};

// ✅ VALORI RAPIDI PER COMPOSITORE VASSOIO
const VALORI_RAPIDI_VASSOIO = {
  Kg: [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2, 1.5, 2],
  Pezzi: [2, 4, 6, 8, 10, 12, 15, 20, 24, 30],
  g: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
  '€': [5, 10, 15, 20, 25, 30]
};

// ✅ STILE CHIP PER VASSOIO
const chipStyleVassoio = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  minWidth: '70px',
  height: '48px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover': { transform: 'scale(1.05)' },
  '&:active': { transform: 'scale(0.95)' }
};

// ==========================================
// 🎂 COMPONENTE PRINCIPALE
// ==========================================
const VassoidDolciMisti = ({ onAggiungiAlCarrello, onClose, prodottiDisponibili }) => {
  // ========== STATE ==========
  const [composizione, setComposizione] = useState([]);
  const [numeroVassoi, setNumeroVassoi] = useState('');
  const [numeroVassoioDimensione, setNumeroVassoioDimensione] = useState(4);
  const [packaging, setPackaging] = useState('vassoio_carta');
  const [opzioni, setOpzioni] = useState({
    daViaggio: false,
    etichettaIngredienti: false,
    confezionGift: false
  });
  const [note, setNote] = useState('');
  const [prodottiExpanded, setProdottiExpanded] = useState(true);
  const [errore, setErrore] = useState('');
  const [warning, setWarning] = useState('');

  // ========== PRODOTTI DOLCI ==========
  const prodottiDolci = useMemo(() => {
    if (prodottiDisponibili && Array.isArray(prodottiDisponibili)) {
      return prodottiDisponibili
        .filter(p => p.categoria === 'Dolci' || p.categoria === 'dolci')
        .map(p => ({
          nome: p.nome || p.name,
          ...p
        }));
    }
    
    return Object.entries(PRODOTTI_DOLCI_DEFAULT).map(([nome, config]) => ({
      nome,
      ...config
    }));
  }, [prodottiDisponibili]);

  // ========== CALCOLI DINAMICI ==========
  
  /**
   * ✅ Calcola prezzo singolo prodotto
   */
  const calcolaPrezzoProdotto = useCallback((prodotto, quantita, unita, varianteSelezionata = null) => {
    if (!prodotto || quantita === undefined || quantita === null) return 0;
    
    let config = getProdottoConfigSafe(prodotto);
    if (!config) return 0;

    // Gestione varianti
    if (varianteSelezionata && config.hasVarianti && config.varianti && Array.isArray(config.varianti)) {
      const variante = config.varianti.find(v => 
        (typeof v === 'string' && v === varianteSelezionata) ||
        (typeof v === 'object' && v.nome === varianteSelezionata)
      );
      
      if (variante && typeof variante === 'object') {
        if (unita === 'Pezzi' && variante.prezzoPezzo) {
          const qty = parseFloat(quantita) || 0;
          return qty * variante.prezzoPezzo;
        }
        if (variante.prezzoKg) {
          config = { ...config, prezzoKg: variante.prezzoKg };
        }
        if (variante.prezzoPezzo) {
          config = { ...config, prezzoPezzo: variante.prezzoPezzo };
        }
      }
    }

    try {
      const qty = parseFloat(quantita) || 0;
      
      if (unita === 'Kg') {
        return qty * (config.prezzoKg || 0);
      } else if (unita === 'Pezzi') {
        if (config.prezzoPezzo) {
          return qty * config.prezzoPezzo;
        } else if (config.prezzoKg && config.pezziPerKg) {
          return (qty / config.pezziPerKg) * config.prezzoKg;
        }
      } else if (unita === '€') {
        return qty;
      } else if (unita === 'g') {
        return (qty / 1000) * (config.prezzoKg || 0);
      }
      return 0;
    } catch (error) {
      console.error('Errore calcolo prezzo:', error);
      return 0;
    }
  }, []);

  /**
   * ✅ Totale vassoio corrente
   */
  const totaleVassoio = useMemo(() => {
    if (!composizione || !Array.isArray(composizione)) return 0;
    return composizione.reduce((acc, item) => acc + (parseFloat(item?.prezzo) || 0), 0);
  }, [composizione]);

  /**
   * ✅ Peso totale vassoio (in Kg)
   */
  const pesoTotaleVassoio = useMemo(() => {
    if (!composizione || !Array.isArray(composizione)) return 0;
    
    return composizione.reduce((acc, item) => {
      if (!item) return acc;
      const qty = parseFloat(item.quantita) || 0;
      
      if (item.unita === 'Kg') return acc + qty;
      if (item.unita === 'g') return acc + (qty / 1000);
      if (item.unita === 'Pezzi') {
        const config = getProdottoConfigSafe(item.prodotto);
        if (config?.pezziPerKg) {
          return acc + (qty / config.pezziPerKg);
        }
      }
      if (item.unita === '€') {
        const config = getProdottoConfigSafe(item.prodotto);
        const prezzoKg = item.prezzoUnitario || config?.prezzoKg || 20;
        return acc + (qty / prezzoKg);
      }
      return acc;
    }, 0);
  }, [composizione]);

  // ========== HANDLERS ==========

  /**
   * ✅ Aggiungi prodotto alla composizione
   */
  const aggiungiProdotto = useCallback((nomeProdotto) => {
    const config = getProdottoConfigSafe(nomeProdotto);
    if (!config) {
      setErrore(`Configurazione non trovata per ${nomeProdotto}`);
      return;
    }

    const nuovoProdotto = {
      id: Date.now(),
      prodotto: nomeProdotto,
      variante: config.hasVarianti && config.varianti?.[0] 
        ? (typeof config.varianti[0] === 'string' ? config.varianti[0] : config.varianti[0].nome)
        : null,
      quantita: '',
      unita: config.unitaMisuraDisponibili?.[0] || 'Kg',
      prezzo: 0,
      prezzoUnitario: config.prezzoKg || 0
    };

    setComposizione(prev => [...prev, nuovoProdotto]);
    setErrore('');
  }, []);

  /**
   * ✅ Aggiorna quantità prodotto
   */
  const aggiornaQuantita = useCallback((id, nuovaQuantita) => {
    const normalized = normalizzaDecimale(nuovaQuantita);
    
    setComposizione(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const nuovoPrezzo = calcolaPrezzoProdotto(
        item.prodotto,
        normalized,
        item.unita,
        item.variante
      );
      
      return {
        ...item,
        quantita: normalized,
        prezzo: nuovoPrezzo
      };
    }));
  }, [calcolaPrezzoProdotto]);

  /**
   * ✅ Aggiorna unità prodotto
   */
  const aggiornaUnita = useCallback((id, nuovaUnita) => {
    setComposizione(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const nuovoPrezzo = calcolaPrezzoProdotto(
        item.prodotto,
        item.quantita,
        nuovaUnita,
        item.variante
      );
      
      return {
        ...item,
        unita: nuovaUnita,
        prezzo: nuovoPrezzo
      };
    }));
  }, [calcolaPrezzoProdotto]);

  /**
   * ✅ Aggiorna variante prodotto
   */
  const aggiornaVariante = useCallback((id, nuovaVariante) => {
    setComposizione(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const nuovoPrezzo = calcolaPrezzoProdotto(
        item.prodotto,
        item.quantita,
        item.unita,
        nuovaVariante
      );
      
      return {
        ...item,
        variante: nuovaVariante,
        prezzo: nuovoPrezzo
      };
    }));
  }, [calcolaPrezzoProdotto]);

  /**
   * ✅ Rimuovi prodotto
   */
  const rimuoviProdotto = useCallback((id) => {
    setComposizione(prev => prev.filter(item => item.id !== id));
  }, []);

  /**
   * ✅ Aggiungi al carrello
   */
  const handleAggiungiAlCarrello = useCallback(() => {
    // Validazione
    if (!composizione || composizione.length === 0) {
      setErrore('Aggiungi almeno un prodotto al vassoio');
      return;
    }

    const prodottiInvalidi = composizione.filter(item => 
      !item.quantita || parseFloat(item.quantita) <= 0
    );

    if (prodottiInvalidi.length > 0) {
      setErrore('Inserisci quantità valide per tutti i prodotti');
      return;
    }

    const numVassoi = parseInt(numeroVassoi) || 1;

    // Crea oggetto ordine
    const ordineVassoio = {
      tipo: 'vassoio_dolci_misti',
      composizione: composizione.map(item => ({
        prodotto: item.prodotto,
        variante: item.variante,
        quantita: parseFloat(item.quantita),
        unita: item.unita,
        prezzo: item.prezzo
      })),
      numeroVassoi: numVassoi,
      dimensioneVassoio: numeroVassoioDimensione,
      packaging,
      opzioni,
      note,
      totaleVassoio: totaleVassoio,
      pesoTotale: pesoTotaleVassoio,
      prezzoFinale: totaleVassoio * numVassoi
    };

    if (onAggiungiAlCarrello) {
      onAggiungiAlCarrello(ordineVassoio);
    }

    // Reset
    setComposizione([]);
    setNumeroVassoi('');
    setNote('');
    setErrore('');
    
    if (onClose) {
      onClose();
    }
  }, [composizione, numeroVassoi, numeroVassoioDimensione, packaging, opzioni, note, totaleVassoio, pesoTotaleVassoio, onAggiungiAlCarrello, onClose]);

  // ========== RENDER ==========
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* HEADER */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          🎂 Componi il Tuo Vassoio
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crea vassoi personalizzati con i nostri dolci artigianali
        </Typography>
      </Box>

      {/* ========== SEZIONE 1: SELEZIONE PRODOTTI ========== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => setProdottiExpanded(!prodottiExpanded)}
        >
          <Typography variant="h6">
            🍪 Selezione Prodotti
          </Typography>
          <IconButton size="small">
            {prodottiExpanded ? <ChevronUp /> : <ChevronDown />}
          </IconButton>
        </Box>

        <Collapse in={prodottiExpanded}>
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {prodottiDolci.map((prodotto) => (
              <Chip
                key={prodotto.nome}
                label={prodotto.nome}
                onClick={() => aggiungiProdotto(prodotto.nome)}
                color="primary"
                variant="outlined"
                icon={<Plus size={16} />}
                sx={{ 
                  fontSize: '0.95rem',
                  height: '40px',
                  '&:hover': { bgcolor: 'primary.light', color: 'white' }
                }}
              />
            ))}
          </Box>
        </Collapse>
      </Paper>

      {/* ========== SEZIONE 2: COMPOSIZIONE VASSOIO ========== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🛒 Composizione Vassoio
        </Typography>

        {composizione.length === 0 ? (
          <Alert severity="info" icon={<Info />}>
            Nessun prodotto aggiunto. Inizia a comporre il tuo vassoio!
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {composizione.map((item) => {
              const config = getProdottoConfigSafe(item.prodotto);
              const valoriChip = VALORI_RAPIDI_VASSOIO[item.unita] || [];

              return (
                <Card key={item.id} sx={{ bgcolor: '#f5f5f5' }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      {/* Nome Prodotto */}
                      <Grid item xs={12} sm={3}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.prodotto}
                        </Typography>
                      </Grid>

                      {/* Variante (se disponibile) */}
                      {config?.hasVarianti && config.varianti && (
                        <Grid item xs={12} sm={3}>
                          <FormControl fullWidth size="small">
                            <Select
                              value={item.variante || ''}
                              onChange={(e) => aggiornaVariante(item.id, e.target.value)}
                            >
                              {config.varianti.map((v) => {
                                const nome = typeof v === 'string' ? v : v.nome;
                                const label = typeof v === 'string' ? v : (v.label || v.nome);
                                return (
                                  <MenuItem key={nome} value={nome}>
                                    {label}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}

                      {/* Chip Valori Rapidi */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {valoriChip.map((val) => (
                            <Chip
                              key={val}
                              label={`${val}${item.unita === '€' ? '€' : ''}`}
                              onClick={() => aggiornaQuantita(item.id, val)}
                              size="small"
                              color={parseFloat(item.quantita) === val ? 'primary' : 'default'}
                              sx={chipStyleVassoio}
                            />
                          ))}
                        </Box>
                      </Grid>

                      {/* Quantità */}
                      <Grid item xs={6} sm={2}>
                        <TextField
                          fullWidth
                          size="small"
                          type="text"
                          value={item.quantita}
                          onChange={(e) => aggiornaQuantita(item.id, e.target.value)}
                          label="Quantità"
                          InputProps={{
                            style: { fontSize: '1.2rem', height: '52px' }
                          }}
                        />
                      </Grid>

                      {/* Unità */}
                      <Grid item xs={4} sm={2}>
                        <FormControl fullWidth size="small">
                          <Select
                            value={item.unita}
                            onChange={(e) => aggiornaUnita(item.id, e.target.value)}
                            sx={{ height: '52px' }}
                          >
                            {(config?.unitaMisuraDisponibili || ['Kg']).map((u) => (
                              <MenuItem key={u} value={u}>{u}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Prezzo */}
                      <Grid item xs={4} sm={2}>
                        <Typography variant="h6" color="primary" textAlign="right">
                          €{item.prezzo.toFixed(2)}
                        </Typography>
                      </Grid>

                      {/* Rimuovi */}
                      <Grid item xs={2} sm={1}>
                        <IconButton 
                          color="error" 
                          onClick={() => rimuoviProdotto(item.id)}
                          size="small"
                        >
                          <Trash2 />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Totale Vassoio */}
        {composizione.length > 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#E3F2FD', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="h6">
                  Peso totale:
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {pesoTotaleVassoio.toFixed(2)} Kg
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="h6">
                  Totale Vassoio:
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  €{totaleVassoio.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* ========== SEZIONE 3: OPZIONI VASSOIO ========== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📦 Opzioni Vassoio
        </Typography>

        <Grid container spacing={2}>
          {/* Numero Vassoi */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Numero Vassoi"
              type="number"
              value={numeroVassoi}
              onChange={(e) => setNumeroVassoi(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">🎂</InputAdornment>
              }}
            />
          </Grid>

          {/* Dimensione Vassoio */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Select
                value={numeroVassoioDimensione}
                onChange={(e) => setNumeroVassoioDimensione(e.target.value)}
              >
                {Object.entries(DIMENSIONI_VASSOIO).map(([num, info]) => (
                  <MenuItem key={num} value={parseInt(num)}>
                    {info.label} - {info.range}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Note */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Note aggiuntive"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Es: Senza zucchero, extra glassa, ..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Errori */}
      {errore && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrore('')}>
          {errore}
        </Alert>
      )}

      {/* ========== AZIONI FINALI ========== */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onClose && (
          <Button
            variant="outlined"
            onClick={onClose}
            size="large"
          >
            Annulla
          </Button>
        )}
        
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<ShoppingCart />}
          onClick={handleAggiungiAlCarrello}
          disabled={composizione.length === 0}
        >
          Aggiungi al Carrello
        </Button>
      </Box>
    </Box>
  );
};

export default VassoidDolciMisti;