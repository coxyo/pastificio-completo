// components/VassoidDolciMisti_FINALE.js
// 🎂 COMPOSITORE VASSOI DOLCI PERSONALIZZATI - VERSIONE COMPLETA
// Implementa 3 modalità di composizione + opzioni packaging avanzate

import React, { useState, useEffect, useMemo } from 'react';
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
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  Grid,
  Tooltip,
  LinearProgress,
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
  Calculator,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PRODOTTI_CONFIG, getProdottoConfig } from '../config/prodottiConfig.js';

// ==========================================
// 🎯 CONFIGURAZIONE MIX PREDEFINITO
// ==========================================
const MIX_DOLCI_COMPLETO_DEFAULT = {
  'Pardulas': { peso: 0.500, percentuale: 50 },
  'Ciambelle': { peso: 0.230, percentuale: 25 },
  'Amaretti': { peso: 0.140, percentuale: 15 },
  'Bianchini': { peso: 0.040, percentuale: 5 },
  'Gueffus': { peso: 0.040, percentuale: 5 }
  // Pabassine: peso tracce (gestito dinamicamente)
};

const PESO_TOTALE_MIX_DEFAULT = 1.0; // 1 Kg

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
// 🎯 MODALITÀ COMPOSIZIONE
// ==========================================
const MODALITA = {
  LIBERA: 'libera',
  TOTALE_PRIMA: 'totale_prima',
  MIX_COMPLETO: 'mix_completo'
};

// ==========================================
// 🎂 COMPONENTE PRINCIPALE
// ==========================================
const VassoidDolciMisti = ({ onAggiungiAlCarrello, onClose }) => {
  // ========== STATE ==========
  const [modalita, setModalita] = useState(MODALITA.LIBERA);
  
  // Modalità "Totale Prima"
  const [totaleTarget, setTotaleTarget] = useState({
    valore: 1.0,
    unita: 'Kg' // 'Kg', 'Pezzi', '€'
  });
  
  // Composizione corrente
  const [composizione, setComposizione] = useState([]);
  
  // Modalità "Mix Completo"
  const [esclusioni, setEsclusioni] = useState([]);
  
  // Opzioni vassoio
  const [numeroVassoi, setNumeroVassoi] = useState(1);
  const [numeroVassoioDimensione, setNumeroVassoioDimensione] = useState(4);
  const [packaging, setPackaging] = useState('vassoio_carta');
  
  // Opzioni extra
  const [opzioni, setOpzioni] = useState({
    daViaggio: false,
    etichettaIngredienti: false,
    confezionGift: false
  });
  
  const [note, setNote] = useState('');
  
  // UI State
  const [prodottiExpanded, setProdottiExpanded] = useState(true);
  const [errore, setErrore] = useState('');
  const [warning, setWarning] = useState('');

  // ========== PRODOTTI DOLCI ==========
  const prodottiDolci = useMemo(() => {
    return Object.entries(PRODOTTI_CONFIG)
      .filter(([nome, config]) => config.categoria === 'Dolci')
      .map(([nome, config]) => ({
        nome,
        ...config
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, []);

  // ========== CALCOLI DINAMICI ==========
  
  /**
   * Calcola prezzo singolo prodotto
   */
  const calcolaPrezzoProdotto = (prodotto, quantita, unita) => {
    const config = getProdottoConfig(prodotto);
    if (!config) return 0;

    try {
      if (unita === 'Kg') {
        return quantita * (config.prezzoKg || 0);
      } else if (unita === 'Pezzi') {
        if (config.prezzoPezzo) {
          return quantita * config.prezzoPezzo;
        } else if (config.prezzoKg && config.pezziPerKg) {
          return (quantita / config.pezziPerKg) * config.prezzoKg;
        }
      } else if (unita === '€') {
        return quantita;
      }
      return 0;
    } catch (error) {
      console.error('Errore calcolo prezzo:', error);
      return 0;
    }
  };

  /**
   * Totale vassoio corrente
   */
  const totaleVassoio = useMemo(() => {
    return composizione.reduce((acc, item) => acc + (item.prezzo || 0), 0);
  }, [composizione]);

  /**
   * Peso totale vassoio (in Kg)
   */
  const pesoTotaleVassoio = useMemo(() => {
    return composizione.reduce((acc, item) => {
      if (item.unita === 'Kg') return acc + item.quantita;
      if (item.unita === 'g') return acc + (item.quantita / 1000);
      if (item.unita === 'Pezzi') {
        const config = getProdottoConfig(item.prodotto);
        if (config?.pezziPerKg) {
          return acc + (item.quantita / config.pezziPerKg);
        }
      }
      return acc;
    }, 0);
  }, [composizione]);

  /**
   * Totale raggiunto vs target (per modalità TOTALE_PRIMA)
   */
  const progressoTarget = useMemo(() => {
    if (modalita !== MODALITA.TOTALE_PRIMA) return 0;
    
    let raggiuntoValore = 0;
    
    if (totaleTarget.unita === 'Kg') {
      raggiuntoValore = pesoTotaleVassoio;
    } else if (totaleTarget.unita === 'Pezzi') {
      raggiuntoValore = composizione.reduce((acc, item) => {
        return item.unita === 'Pezzi' ? acc + item.quantita : acc;
      }, 0);
    } else if (totaleTarget.unita === '€') {
      raggiuntoValore = totaleVassoio;
    }
    
    return (raggiuntoValore / totaleTarget.valore) * 100;
  }, [modalita, totaleTarget, pesoTotaleVassoio, totaleVassoio, composizione]);

  // ✅ CALCOLO AUTOMATICO QUANTITÀ IN MODALITÀ TOTALE_PRIMA
  useEffect(() => {
    if (modalita !== MODALITA.TOTALE_PRIMA) return;
    if (composizione.length === 0) return;
    if (totaleTarget.valore <= 0) return;

    // Conta solo prodotti con flag autoCalc
    const prodottiDaCalcolare = composizione.filter(item => item.autoCalc);
    if (prodottiDaCalcolare.length === 0) return;

    // ✅ CALCOLO BASATO SU UNITÀ TARGET
    if (totaleTarget.unita === 'Kg') {
      // Calcola Kg per prodotto
      const kgPerProdotto = totaleTarget.valore / composizione.length;

      setComposizione(prev => prev.map(item => {
        if (!item.autoCalc) return item;

        const nuovoPrezzo = calcolaPrezzoProdotto(item.prodotto, kgPerProdotto, 'Kg');

        return {
          ...item,
          quantita: kgPerProdotto,
          unita: 'Kg',
          prezzo: nuovoPrezzo
        };
      }));

    } else if (totaleTarget.unita === 'Pezzi') {
      // Calcola Pezzi per prodotto
      const pezziPerProdotto = Math.floor(totaleTarget.valore / composizione.length);

      setComposizione(prev => prev.map(item => {
        if (!item.autoCalc) return item;

        const nuovoPrezzo = calcolaPrezzoProdotto(item.prodotto, pezziPerProdotto, 'Pezzi');

        return {
          ...item,
          quantita: pezziPerProdotto,
          unita: 'Pezzi',
          prezzo: nuovoPrezzo
        };
      }));

    } else if (totaleTarget.unita === '€') {
      // Calcola prezzo target per prodotto
      const prezzoTargetPerProdotto = totaleTarget.valore / composizione.length;

      setComposizione(prev => prev.map(item => {
        if (!item.autoCalc) return item;

        const config = getProdottoConfig(item.prodotto);
        if (!config) return item;

        // Calcola Kg necessari per raggiungere il prezzo target
        const kgNecessari = prezzoTargetPerProdotto / (config.prezzoKg || 19);

        return {
          ...item,
          quantita: kgNecessari,
          unita: 'Kg',
          prezzo: prezzoTargetPerProdotto
        };
      }));
    }
  }, [modalita, composizione.length, totaleTarget.valore, totaleTarget.unita]);

  // ========== VALIDAZIONI ==========
  
  /**
   * Verifica limiti peso vassoio
   */
  useEffect(() => {
    setErrore('');
    setWarning('');
    
      
    // Suggerimento dimensione vassoio
    const dimensioneSuggerita = Object.entries(DIMENSIONI_VASSOIO).find(([num, info]) => 
      pesoTotaleVassoio <= info.pesoSuggerito * 1.1
    );
    
   
  }, [pesoTotaleVassoio, numeroVassoioDimensione]);

  // ========== HANDLERS ==========
  
  /**
   * Cambio modalità composizione
   */
  const handleModalitaChange = (nuovaModalita) => {
    setModalita(nuovaModalita);
    setComposizione([]);
    setEsclusioni([]);
    setErrore('');
    setWarning('');
    
    // Inizializza Mix Completo
    if (nuovaModalita === MODALITA.MIX_COMPLETO) {
      inizializzaMixCompleto();
    }
  };

  /**
   * Inizializza Mix Dolci Completo
   */
  const inizializzaMixCompleto = () => {
    const nuovaComposizione = Object.entries(MIX_DOLCI_COMPLETO_DEFAULT).map(([nome, info]) => {
      const prezzo = calcolaPrezzoProdotto(nome, info.peso, 'Kg');
      return {
        id: Date.now() + Math.random(),
        prodotto: nome,
        quantita: info.peso,
        unita: 'Kg',
        prezzo: prezzo,
        percentuale: info.percentuale
      };
    });
    
    setComposizione(nuovaComposizione);
  };

  /**
   * Toggle esclusione prodotto (Mix Completo)
   */
  const toggleEsclusione = (nomeProdotto) => {
    setEsclusioni(prev => {
      const nuove = prev.includes(nomeProdotto)
        ? prev.filter(p => p !== nomeProdotto)
        : [...prev, nomeProdotto];
      
      // Ricalcola composizione
      ricalcolaMixConEsclusioni(nuove);
      return nuove;
    });
  };

  /**
   * Ricalcola Mix con esclusioni
   */
  const ricalcolaMixConEsclusioni = (esclusioni) => {
    const prodottiInclusi = Object.entries(MIX_DOLCI_COMPLETO_DEFAULT)
      .filter(([nome]) => !esclusioni.includes(nome));
    
    const sommaPercentuali = prodottiInclusi.reduce((acc, [_, info]) => acc + info.percentuale, 0);
    
    const nuovaComposizione = prodottiInclusi.map(([nome, info]) => {
      const pesoRicalcolato = (info.percentuale / sommaPercentuali) * PESO_TOTALE_MIX_DEFAULT;
      const prezzo = calcolaPrezzoProdotto(nome, pesoRicalcolato, 'Kg');
      
      return {
        id: Date.now() + Math.random(),
        prodotto: nome,
        quantita: pesoRicalcolato,
        unita: 'Kg',
        prezzo: prezzo,
        percentuale: (info.percentuale / sommaPercentuali) * 100
      };
    });
    
    setComposizione(nuovaComposizione);
  };

  /**
   * Aggiungi prodotto alla composizione
   */
  const aggiungiProdotto = (nomeProdotto) => {
    const config = getProdottoConfig(nomeProdotto);
    if (!config) return;

    // ✅ MODALITÀ TOTALE_PRIMA: Aggiungi solo prodotto, calcolo automatico dopo
    if (modalita === MODALITA.TOTALE_PRIMA) {
      const nuovoItem = {
        id: Date.now() + Math.random(),
        prodotto: nomeProdotto,
        quantita: 0, // Verrà calcolato automaticamente
        unita: 'Kg',
        prezzo: 0,
        autoCalc: true // Flag per indicare calcolo automatico
      };

      setComposizione(prev => [...prev, nuovoItem]);
      return;
    }

    // ✅ MODALITÀ LIBERA: Aggiungi con quantità default
    const quantitaDefault = config.modalitaVendita === 'solo_kg' ? 0.5 : 1;
    const unitaDefault = config.unitaMisuraDisponibili?.[0] || 'Kg';
    const prezzo = calcolaPrezzoProdotto(nomeProdotto, quantitaDefault, unitaDefault);

    const nuovoItem = {
      id: Date.now() + Math.random(),
      prodotto: nomeProdotto,
      quantita: quantitaDefault,
      unita: unitaDefault,
      prezzo: prezzo
    };

    setComposizione(prev => [...prev, nuovoItem]);
  };

  /**
   * Aggiorna quantità prodotto
   */
  const aggiornaQuantita = (id, nuovaQuantita) => {
    setComposizione(prev => prev.map(item => {
      if (item.id === id) {
        const quantita = parseFloat(nuovaQuantita) || 0;
        const prezzo = calcolaPrezzoProdotto(item.prodotto, quantita, item.unita);
        return { ...item, quantita, prezzo };
      }
      return item;
    }));
  };

  /**
   * Cambia unità di misura
   */
  const cambiaUnita = (id, nuovaUnita) => {
    setComposizione(prev => prev.map(item => {
      if (item.id === id) {
        const prezzo = calcolaPrezzoProdotto(item.prodotto, item.quantita, nuovaUnita);
        return { ...item, unita: nuovaUnita, prezzo };
      }
      return item;
    }));
  };

  /**
   * Incrementa/Decrementa quantità
   */
  const incrementaQuantita = (id, delta) => {
    setComposizione(prev => prev.map(item => {
      if (item.id === id) {
        const step = item.unita === 'Kg' ? 0.1 : 1;
        const nuovaQuantita = Math.max(0, item.quantita + (delta * step));
        const prezzo = calcolaPrezzoProdotto(item.prodotto, nuovaQuantita, item.unita);
        return { ...item, quantita: nuovaQuantita, prezzo };
      }
      return item;
    }));
  };

  /**
   * Rimuovi prodotto
   */
  const rimuoviProdotto = (id) => {
    setComposizione(prev => prev.filter(item => item.id !== id));
  };

  /**
   * Aggiungi al carrello
   */
  const handleAggiungiAlCarrello = () => {
    if (composizione.length === 0) {
      setErrore('⚠️ Aggiungi almeno un prodotto al vassoio');
      return;
    }

   
    // Prepara dati vassoio
    const dettagliComposizione = composizione.map(item => ({
      nome: item.prodotto,
      quantita: item.quantita,
      unita: item.unita,
      prezzo: item.prezzo
    }));

    const dettagliStringa = composizione
      .map(item => `${item.prodotto}: ${item.quantita} ${item.unita}`)
      .join(', ');

    // Note complete
    const noteComplete = [
      note,
      opzioni.etichettaIngredienti ? '⚠️ RICORDATI DI ATTACCARE ETICHETTA INGREDIENTI' : '',
      opzioni.daViaggio ? '✈️ Da viaggio (sottovuoto)' : '',
      opzioni.confezionGift ? '🎁 Confezione regalo' : '',
      `📦 Packaging: ${packaging === 'vassoio_carta' ? 'Vassoio Carta' : packaging === 'scatola' ? 'Scatola' : 'Busta Carta'}`,
      `📏 Dimensione: Nr ${numeroVassoioDimensione} (${DIMENSIONI_VASSOIO[numeroVassoioDimensione].range})`,
      esclusioni.length > 0 ? `🚫 Esclusi: ${esclusioni.join(', ')}` : ''
    ].filter(Boolean).join(' | ');

    const vassoioData = {
      nome: 'Vassoio Dolci Misti',
      quantita: numeroVassoi,
      unita: 'vassoio',
      prezzo: totaleVassoio * numeroVassoi,
      categoria: 'Dolci',
      note: noteComplete,
      dettagliCalcolo: {
        dettagli: dettagliStringa,
        composizione: dettagliComposizione,
        pesoTotale: pesoTotaleVassoio,
        modalita: modalita,
        numeroVassoioDimensione: numeroVassoioDimensione,
        packaging: packaging,
        opzioni: opzioni
      }
    };

    console.log('🎂 Vassoio creato:', vassoioData);

    if (onAggiungiAlCarrello) {
      onAggiungiAlCarrello(vassoioData);
    }

    // Reset
    setComposizione([]);
    setNote('');
    setNumeroVassoi(1);
    setEsclusioni([]);
    
    if (onClose) {
      onClose();
    }
  };

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

      {/* ========== SEZIONE 1: MODALITÀ COMPOSIZIONE ========== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📦 Come vuoi comporre il vassoio?
        </Typography>
        
        <RadioGroup 
          value={modalita} 
          onChange={(e) => handleModalitaChange(e.target.value)}
        >
          <FormControlLabel
            value={MODALITA.LIBERA}
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">
                  🆓 Aggiungi prodotti liberamente
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Componi il vassoio aggiungendo i prodotti che vuoi
                </Typography>
              </Box>
            }
          />
          
          <FormControlLabel
            value={MODALITA.TOTALE_PRIMA}
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">
                  🎯 Imposta totale prima (poi componi)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Definisci peso/pezzi/euro target e componi fino a raggiungerlo
                </Typography>
              </Box>
            }
          />
          
          <FormControlLabel
            value={MODALITA.MIX_COMPLETO}
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">
                  ✨ Dolci Misti Completo (escludi qualcosa)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Mix equilibrato da 1 Kg, puoi escludere prodotti
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </Paper>

      {/* ========== SEZIONE 2: TOTALE TARGET (se modalità = totale_prima) ========== */}
      {modalita === MODALITA.TOTALE_PRIMA && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#E3F2FD', borderLeft: '4px solid #2196F3' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1565C0' }}>
            ⚖️ Totale Vassoio Target
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <FormLabel>Ordina per:</FormLabel>
                <RadioGroup
                  row
                  value={totaleTarget.unita}
                  onChange={(e) => setTotaleTarget(prev => ({ ...prev, unita: e.target.value }))}
                >
                  <FormControlLabel value="Kg" control={<Radio />} label="Peso (Kg)" />
                  <FormControlLabel value="Pezzi" control={<Radio />} label="Pezzi" />
                  <FormControlLabel value="€" control={<Radio />} label="Euro (€)" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantità Target"
                value={totaleTarget.valore}
                onChange={(e) => setTotaleTarget(prev => ({ 
                  ...prev, 
                  valore: parseFloat(e.target.value) || 0 
                }))}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Progresso:
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(progressoTarget, 100)}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2">
                  {progressoTarget >= 100 ? (
                    <Chip label="✅ Raggiunto!" color="success" size="small" />
                  ) : (
                    `${progressoTarget.toFixed(1)}% raggiunto`
                  )}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* ✅ ALERT ESPLICATIVO MODALITÀ TOTALE_PRIMA */}
          <Alert severity="info" sx={{ mt: 2, bgcolor: '#E3F2FD' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              🎯 Modalità "Totale Prima" - Come funziona:
            </Typography>
            <Typography variant="body2" component="div">
              1. Hai impostato un target di <strong>{totaleTarget.valore} {totaleTarget.unita}</strong><br/>
              2. Seleziona i prodotti che vuoi includere nel vassoio<br/>
              3. Le quantità verranno <strong>calcolate automaticamente</strong> in modo equo<br/>
              4. Non devi impostare quantità manualmente!
            </Typography>
          </Alert>
        </Paper>
      )}

      {/* ========== SEZIONE 3: ESCLUSIONI (se modalità = mix_completo) ========== */}
      {modalita === MODALITA.MIX_COMPLETO && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🚫 Escludi Prodotti dal Mix
          </Typography>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Il mix predefinito contiene: Pardulas (50%), Ciambelle (25%), Amaretti (15%), Bianchini (5%), Gueffus (5%)
          </Typography>
          
          <FormGroup row sx={{ mt: 2 }}>
            {Object.keys(MIX_DOLCI_COMPLETO_DEFAULT).map(nome => (
              <FormControlLabel
                key={nome}
                control={
                  <Checkbox
                    checked={esclusioni.includes(nome)}
                    onChange={() => toggleEsclusione(nome)}
                  />
                }
                label={nome}
              />
            ))}
          </FormGroup>
        </Paper>
      )}

      {/* ========== SEZIONE 4: LISTA PRODOTTI ========== */}
      {modalita !== MODALITA.MIX_COMPLETO && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              cursor: 'pointer',
              mb: 2
            }}
            onClick={() => setProdottiExpanded(!prodottiExpanded)}
          >
            <Typography variant="h6">
              📋 Prodotti Disponibili ({prodottiDolci.length})
            </Typography>
            <IconButton size="small">
              {prodottiExpanded ? <ChevronUp /> : <ChevronDown />}
            </IconButton>
          </Box>
          
          <Collapse in={prodottiExpanded}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {prodottiDolci.map(prodotto => (
                <Chip
                  key={prodotto.nome}
                  label={prodotto.nome}
                  onClick={() => aggiungiProdotto(prodotto.nome)}
                  icon={<Plus size={16} />}
                  color="primary"
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* ========== SEZIONE 5: COMPOSIZIONE VASSOIO ========== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🛒 Composizione Vassoio
          {composizione.length > 0 && (
            <Chip 
              label={`${composizione.length} prodotti`} 
              size="small" 
              color="primary"
              sx={{ ml: 2 }}
            />
          )}
        </Typography>

        {composizione.length === 0 ? (
          <Alert severity="info">
            Nessun prodotto aggiunto. Inizia a comporre il tuo vassoio!
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {composizione.map((item) => {
              const config = getProdottoConfig(item.prodotto);
              
              return (
                <Card key={item.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      {/* Nome Prodotto */}
                      <Typography variant="subtitle1" sx={{ minWidth: 150, fontWeight: 'bold' }}>
                        {item.prodotto}
                      </Typography>

                      {/* ✅ MODALITÀ TOTALE_PRIMA: Mostra solo quantità calcolata */}
                      {modalita === MODALITA.TOTALE_PRIMA && item.autoCalc ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          bgcolor: '#E8F5E9',
                          px: 2,
                          py: 1,
                          borderRadius: 1
                        }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {item.unita === 'Pezzi' 
                              ? `${Math.floor(item.quantita)} ${item.unita}`
                              : `${item.quantita.toFixed(2)} ${item.unita}`
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (calcolato automaticamente)
                          </Typography>
                        </Box>
                      ) : (
                        /* ✅ MODALITÀ LIBERA: Controlli quantità normali */
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => incrementaQuantita(item.id, -1)}
                          >
                            <Minus size={16} />
                          </IconButton>

                          <TextField
                            type="number"
                            value={item.quantita}
                            onChange={(e) => aggiornaQuantita(item.id, e.target.value)}
                            size="small"
                            sx={{ width: 80 }}
                            inputProps={{ min: 0, step: item.unita === 'Kg' ? 0.1 : 1 }}
                          />

                          <IconButton 
                            size="small" 
                            onClick={() => incrementaQuantita(item.id, 1)}
                          >
                            <Plus size={16} />
                          </IconButton>
                        </Box>
                      )}

                      {/* Unità di Misura - Solo in modalità LIBERA */}
                      {modalita !== MODALITA.TOTALE_PRIMA && (
                        <RadioGroup
                          row
                          value={item.unita}
                          onChange={(e) => cambiaUnita(item.id, e.target.value)}
                        >
                        {config?.unitaMisuraDisponibili?.map(unita => (
                          <FormControlLabel
                            key={unita}
                            value={unita}
                            control={<Radio size="small" />}
                            label={unita}
                          />
                        ))}
                      </RadioGroup>
                      )}

                      {/* Prezzo */}
                      <Typography 
                        variant="h6" 
                        color="primary"
                        sx={{ ml: 'auto', minWidth: 80, textAlign: 'right' }}
                      >
                        €{item.prezzo.toFixed(2)}
                      </Typography>

                      {/* Rimuovi */}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => rimuoviProdotto(item.id)}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>

                    {/* Info Percentuale (solo per Mix Completo) */}
                    {item.percentuale && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {item.percentuale.toFixed(0)}% del mix
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Totali */}
        {composizione.length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Peso Totale:
                </Typography>
                <Typography variant="h6">
                  {pesoTotaleVassoio.toFixed(2)} Kg
                </Typography>
              </Grid>
              
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Prezzo Totale:
                </Typography>
                <Typography variant="h6" color="primary">
                  €{totaleVassoio.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* ========== SEZIONE 6: OPZIONI VASSOIO ========== */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📦 Opzioni Vassoio
        </Typography>

        <Grid container spacing={3}>
          {/* Numero Vassoi */}
          <Grid item xs={12} md={6}>
            <Typography variant="body2" gutterBottom>
              Numero Vassoi (uguali)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={() => setNumeroVassoi(Math.max(1, numeroVassoi - 1))}
                disabled={numeroVassoi <= 1}
              >
                <Minus />
              </IconButton>
              
              <TextField
                type="number"
                value={numeroVassoi}
                onChange={(e) => setNumeroVassoi(Math.max(1, parseInt(e.target.value) || 1))}
                size="small"
                sx={{ width: 80 }}
                inputProps={{ min: 1, max: 50 }}
              />
              
              <IconButton onClick={() => setNumeroVassoi(numeroVassoi + 1)}>
                <Plus />
              </IconButton>
              
              <Typography variant="caption" color="text.secondary">
                Totale: €{(totaleVassoio * numeroVassoi).toFixed(2)}
              </Typography>
            </Box>
          </Grid>

          {/* Dimensione Vassoio */}
          <Grid item xs={12} md={6}>
            <Typography variant="body2" gutterBottom>
              Dimensione Vassoio
            </Typography>
            <Select
              value={numeroVassoioDimensione}
              onChange={(e) => setNumeroVassoioDimensione(e.target.value)}
              size="small"
              fullWidth
            >
              {Object.entries(DIMENSIONI_VASSOIO).map(([num, info]) => (
                <MenuItem key={num} value={parseInt(num)}>
                  {info.label} - {info.range}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          {/* Packaging */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" gutterBottom>
              Tipo Packaging
            </Typography>
            <RadioGroup
              row
              value={packaging}
              onChange={(e) => setPackaging(e.target.value)}
            >
              <FormControlLabel
                value="vassoio_carta"
                control={<Radio />}
                label="📦 Vassoio Carta"
              />
              <FormControlLabel
                value="scatola"
                control={<Radio />}
                label="📦 Scatola Rigida"
              />
              <FormControlLabel
                value="busta_carta"
                control={<Radio />}
                label="🛍️ Busta Carta"
              />
            </RadioGroup>
          </Grid>

          {/* Opzioni Extra */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" gutterBottom>
              Opzioni Extra
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={opzioni.daViaggio}
                    onChange={(e) => setOpzioni({ ...opzioni, daViaggio: e.target.checked })}
                  />
                }
                label="✈️ Da Viaggio (sottovuoto)"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={opzioni.etichettaIngredienti}
                    onChange={(e) => setOpzioni({ ...opzioni, etichettaIngredienti: e.target.checked })}
                  />
                }
                label={
                  <Tooltip title="Promemoria per attaccare l'etichetta ingredienti stampata">
                    <span>🏷️ Ricorda Etichetta Ingredienti</span>
                  </Tooltip>
                }
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={opzioni.confezionGift}
                    onChange={(e) => setOpzioni({ ...opzioni, confezionGift: e.target.checked })}
                  />
                }
                label="🎁 Confezione Regalo"
              />
            </FormGroup>
          </Grid>

          {/* Note */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="📝 Note Aggiuntive"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Es: Confezionare insieme, niente glassa, etc."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ========== ALERT ERRORI/WARNING ========== */}
      {errore && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errore}
        </Alert>
      )}
      
      {warning && !errore && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {warning}
        </Alert>
      )}

      {/* ========== RIEPILOGO FINALE ========== */}
      {composizione.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light' }}>
          <Typography variant="h6" gutterBottom>
            💰 Riepilogo Finale
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">Peso per vassoio:</Typography>
              <Typography variant="h6">{pesoTotaleVassoio.toFixed(2)} Kg</Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2">Prezzo per vassoio:</Typography>
              <Typography variant="h6">€{totaleVassoio.toFixed(2)}</Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2">Numero vassoi:</Typography>
              <Typography variant="h6">{numeroVassoi}x</Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="primary">TOTALE:</Typography>
              <Typography variant="h4" color="primary">
                €{(totaleVassoio * numeroVassoi).toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* ========== AZIONI ========== */}
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
          size="large"
          onClick={handleAggiungiAlCarrello}
          disabled={composizione.length === 0 || !!errore}
          startIcon={<ShoppingCart />}
        >
          Aggiungi al Carrello
        </Button>
      </Box>
    </Box>
  );
};

export default VassoidDolciMisti;
