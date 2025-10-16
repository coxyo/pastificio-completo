// components/VassoidDolciMisti.js - ✅ COMPOSITORE VASSOIO DOLCI
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingBasket as BasketIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

// ✅ Valori rapidi per input veloce
const VALORI_RAPIDI = {
  Kg: [0.25, 0.5, 0.75, 1],
  g: [250, 500, 750, 1000],
  Pezzi: [2, 4, 6, 8, 10, 12],
  '€': [5, 10, 15, 20]
};

export default function VassoidDolciMisti({ onAggiungiAlCarrello }) {
  const [prodottiDisponibili, setProdottiDisponibili] = useState([]);
  const [loading, setLoading] = useState(false);
  const [composizione, setComposizione] = useState([]);
  const [noteVassoio, setNoteVassoio] = useState('Confezionare insieme');

  // Carica prodotti dolci dal database
  useEffect(() => {
    caricaProdottiDolci();
  }, []);

  const caricaProdottiDolci = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/prodotti/disponibili`);
      
      if (response.ok) {
        const data = await response.json();
        const prodottiDB = data.data || [];
        
        // Filtra solo dolci (Dolci, Pardulas)
        const dolci = prodottiDB.filter(p => 
          ['Dolci', 'Pardulas'].includes(p.categoria) && 
          p.disponibile && 
          p.attivo
        );
        
        setProdottiDisponibili(dolci);
        console.log(`✅ Caricati ${dolci.length} prodotti dolci`);
      }
    } catch (error) {
      console.error('Errore caricamento prodotti:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggiungi prodotto alla composizione
  const aggiungiProdotto = (prodotto) => {
    const nuovoItem = {
      id: Date.now(),
      prodotto: prodotto,
      nome: prodotto.nome,
      variante: null,
      quantita: '',
      unita: prodotto.unitaMisuraDisponibili?.[0] || 'Kg',
      prezzo: 0,
      categoria: prodotto.categoria
    };
    
    setComposizione([...composizione, nuovoItem]);
  };

  // Rimuovi prodotto dalla composizione
  const rimuoviProdotto = (id) => {
    setComposizione(composizione.filter(item => item.id !== id));
  };

  // Aggiorna quantità prodotto
  const aggiornaQuantita = (id, nuovaQuantita) => {
    setComposizione(composizione.map(item => {
      if (item.id === id) {
        const qty = parseFloat(nuovaQuantita) || 0;
        const prezzo = calcolaPrezzoProdotto(item.prodotto, qty, item.unita, item.variante);
        
        return {
          ...item,
          quantita: nuovaQuantita,
          prezzo: prezzo
        };
      }
      return item;
    }));
  };

  // Aggiorna unità misura
  const aggiornaUnita = (id, nuovaUnita) => {
    setComposizione(composizione.map(item => {
      if (item.id === id) {
        const prezzo = calcolaPrezzoProdotto(item.prodotto, item.quantita, nuovaUnita, item.variante);
        
        return {
          ...item,
          unita: nuovaUnita,
          quantita: '', // Reset quantità quando cambi unità
          prezzo: 0
        };
      }
      return item;
    }));
  };

  // Aggiorna variante (per prodotti con varianti)
  const aggiornaVariante = (id, nomeVariante) => {
    setComposizione(composizione.map(item => {
      if (item.id === id) {
        const variante = item.prodotto.varianti?.find(v => v.nome === nomeVariante);
        const prezzo = calcolaPrezzoProdotto(item.prodotto, item.quantita, item.unita, variante);
        
        return {
          ...item,
          variante: variante,
          prezzo: prezzo
        };
      }
      return item;
    }));
  };

  // Calcola prezzo di un singolo prodotto
  const calcolaPrezzoProdotto = (prodotto, quantita, unita, variante = null) => {
    if (!quantita || quantita <= 0) return 0;

    const qty = parseFloat(quantita);
    let prezzoBase = 0;

    // Se ha variante, usa i prezzi della variante
    if (variante) {
      if (unita === 'Kg' || unita === 'g') {
        const kg = unita === 'g' ? qty / 1000 : qty;
        prezzoBase = (variante.prezzoKg || prodotto.prezzoKg) * kg;
      } else if (unita === 'Pezzi' || unita === 'pz') {
        if (variante.prezzoPezzo > 0) {
          prezzoBase = variante.prezzoPezzo * qty;
        } else if (prodotto.pezziPerKg) {
          const kg = qty / prodotto.pezziPerKg;
          prezzoBase = (variante.prezzoKg || prodotto.prezzoKg) * kg;
        }
      } else if (unita === '€') {
        return qty; // L'importo è già il prezzo
      }
    } else {
      // Nessuna variante, usa prezzi base
      if (unita === 'Kg' || unita === 'g') {
        const kg = unita === 'g' ? qty / 1000 : qty;
        prezzoBase = prodotto.prezzoKg * kg;
      } else if (unita === 'Pezzi' || unita === 'pz') {
        if (prodotto.prezzoPezzo > 0) {
          prezzoBase = prodotto.prezzoPezzo * qty;
        } else if (prodotto.pezziPerKg) {
          const kg = qty / prodotto.pezziPerKg;
          prezzoBase = prodotto.prezzoKg * kg;
        }
      } else if (unita === '€') {
        return qty;
      }
    }

    return Math.round(prezzoBase * 100) / 100;
  };

  // Calcola totale vassoio
  const totaleVassoio = useMemo(() => {
    return composizione.reduce((sum, item) => sum + (item.prezzo || 0), 0);
  }, [composizione]);

  // Genera descrizione composizione per l'ordine
  const generaDescrizioneComposizione = () => {
    return composizione.map(item => {
      let desc = `${item.nome}`;
      
      if (item.variante) {
        desc += ` (${item.variante.nome})`;
      }
      
      desc += `: ${item.quantita} ${item.unita}`;
      
      return desc;
    }).join(', ');
  };

  // Conferma e aggiungi al carrello
  const confermaVassoio = () => {
    if (composizione.length === 0) {
      alert('Aggiungi almeno un prodotto al vassoio');
      return;
    }

    if (composizione.some(item => !item.quantita || item.quantita <= 0)) {
      alert('Inserisci quantità per tutti i prodotti');
      return;
    }

    // Crea prodotto "Vassoio Misti"
    const vassoidMisti = {
      nome: 'Vassoio Dolci Misti',
      quantita: 1,
      unita: 'vassoio',
      prezzo: totaleVassoio,
      dettagliCalcolo: {
        dettagli: generaDescrizioneComposizione(),
        composizione: composizione.map(item => ({
          nome: item.nome,
          variante: item.variante?.nome || null,
          quantita: item.quantita,
          unita: item.unita,
          prezzo: item.prezzo
        }))
      },
      categoria: 'Dolci',
      note: noteVassoio
    };

    onAggiungiAlCarrello(vassoidMisti);

    // Reset
    setComposizione([]);
    setNoteVassoio('Confezionare insieme');
  };

  // Raggruppa prodotti per categoria
  const prodottiPerCategoria = useMemo(() => {
    const grouped = {};
    prodottiDisponibili.forEach(p => {
      if (!grouped[p.categoria]) {
        grouped[p.categoria] = [];
      }
      grouped[p.categoria].push(p);
    });
    return grouped;
  }, [prodottiDisponibili]);

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3, bgcolor: '#fff8e1' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <BasketIcon sx={{ fontSize: 40, color: '#f57c00' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              🎂 Componi Vassoio Dolci Misti
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aggiungi i prodotti che desideri nel vassoio personalizzato
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Colonna Sinistra: Lista Prodotti */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, maxHeight: 500, overflow: 'auto', bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom>
                Prodotti Disponibili
              </Typography>

              {loading ? (
                <Typography>Caricamento...</Typography>
              ) : (
                Object.entries(prodottiPerCategoria).map(([categoria, prodotti]) => (
                  <Accordion key={categoria} defaultExpanded={categoria === 'Dolci'}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {categoria} ({prodotti.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {prodotti.map((prodotto) => (
                          <Button
                            key={prodotto._id}
                            variant="outlined"
                            size="small"
                            onClick={() => aggiungiProdotto(prodotto)}
                            sx={{ 
                              justifyContent: 'flex-start', 
                              textAlign: 'left',
                              textTransform: 'none'
                            }}
                          >
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="body2" fontWeight="bold">
                                {prodotto.nome}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {prodotto.prezzoKg > 0 && `€${prodotto.prezzoKg}/Kg`}
                                {prodotto.prezzoKg > 0 && prodotto.prezzoPezzo > 0 && ' - '}
                                {prodotto.prezzoPezzo > 0 && `€${prodotto.prezzoPezzo}/pz`}
                              </Typography>
                            </Box>
                          </Button>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </Paper>
          </Grid>

          {/* Colonna Destra: Composizione Vassoio */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
              <Typography variant="h6" gutterBottom>
                Composizione Vassoio ({composizione.length} prodotti)
              </Typography>

              {composizione.length === 0 ? (
                <Alert severity="info">
                  Seleziona i prodotti dalla lista a sinistra per iniziare a comporre il vassoio
                </Alert>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Prodotto</TableCell>
                        <TableCell>Qtà</TableCell>
                        <TableCell>Unità</TableCell>
                        <TableCell>Prezzo</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {composizione.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.nome}
                            </Typography>
                            
                            {/* Varianti se disponibili */}
                            {item.prodotto.varianti && item.prodotto.varianti.length > 0 && (
                              <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                                <Select
                                  value={item.variante?.nome || ''}
                                  onChange={(e) => aggiornaVariante(item.id, e.target.value)}
                                  displayEmpty
                                >
                                  <MenuItem value="">
                                    <em>Seleziona variante</em>
                                  </MenuItem>
                                  {item.prodotto.varianti.map((v) => (
                                    <MenuItem key={v.nome} value={v.nome}>
                                      {v.nome}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </TableCell>

                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantita}
                              onChange={(e) => aggiornaQuantita(item.id, e.target.value)}
                              sx={{ width: 80 }}
                              inputProps={{ 
                                min: 0,
                                step: item.unita === 'Kg' ? 0.1 : 1
                              }}
                            />
                            
                            {/* Valori rapidi */}
                            {VALORI_RAPIDI[item.unita] && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                {VALORI_RAPIDI[item.unita].map((val) => (
                                  <Chip
                                    key={val}
                                    label={val}
                                    size="small"
                                    onClick={() => aggiornaQuantita(item.id, val)}
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                  />
                                ))}
                              </Box>
                            )}
                          </TableCell>

                          <TableCell>
                            <FormControl size="small">
                              <Select
                                value={item.unita}
                                onChange={(e) => aggiornaUnita(item.id, e.target.value)}
                              >
                                {(item.prodotto.unitaMisuraDisponibili || ['Kg']).map((u) => (
                                  <MenuItem key={u} value={u}>{u}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              €{item.prezzo.toFixed(2)}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => rimuoviProdotto(item.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Totale */}
                      <TableRow sx={{ bgcolor: '#c8e6c9' }}>
                        <TableCell colSpan={3}>
                          <Typography variant="h6" fontWeight="bold">
                            TOTALE VASSOIO
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={2}>
                          <Typography variant="h5" fontWeight="bold" color="success.dark">
                            €{totaleVassoio.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              )}

              {/* Note Vassoio */}
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Note per il vassoio"
                  value={noteVassoio}
                  onChange={(e) => setNoteVassoio(e.target.value)}
                  multiline
                  rows={2}
                  placeholder="es. Confezionare insieme, carta regalo, biglietto..."
                />
              </Box>

              {/* Bottone Conferma */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="large"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={confermaVassoio}
                  disabled={composizione.length === 0}
                >
                  Aggiungi Vassoio all'Ordine
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}