// components/NuovoOrdine.js - ✅ CON FORCE OVERRIDE LIMITI
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Autocomplete,
  FormControlLabel,
  Switch,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Luggage as LuggageIcon,
  ExpandMore as ExpandMoreIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Cake as CakeIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { calcolaPrezzoOrdine, formattaPrezzo } from '../utils/calcoliPrezzi';
import VassoidDolciMisti from './VassoidDolciMisti';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

// ✅ CACHE GLOBALE CLIENTI
let clientiCache = null;
let clientiCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

// ✅ CACHE GLOBALE PRODOTTI
let prodottiCache = null;
let prodottiCacheTime = null;

// ✅ VALORI PREIMPOSTATI PER GRIGLIA RAPIDA
const VALORI_RAPIDI = {
  Kg: [0.5, 0.7, 1, 1.5, 2, 2.5, 3],
  Pezzi: [4, 6, 8, 12, 16, 24, 50],
  '€': [5, 10, 15, 20, 25, 30]
};

export default function NuovoOrdine({ 
  open, 
  onClose, 
  onSave, 
  ordineIniziale = null,
  isConnected = true
}) {
  const [clienti, setClienti] = useState([]);
  const [loadingClienti, setLoadingClienti] = useState(false);
  
  const [prodottiDB, setProdottiDB] = useState([]);
  const [loadingProdotti, setLoadingProdotti] = useState(false);

  const [tabValue, setTabValue] = useState(0);

  // ✅ State per limiti
  const [limiti, setLimiti] = useState([]);
  const [loadingLimiti, setLoadingLimiti] = useState(false);
  const [alertLimiti, setAlertLimiti] = useState([]);

  const [formData, setFormData] = useState({
    cliente: null,
    nomeCliente: '',
    telefono: '',
    dataRitiro: new Date().toISOString().split('T')[0],
    oraRitiro: '',
    prodotti: [],
    note: '',
    daViaggio: false
  });

  const [prodottoCorrente, setProdottoCorrente] = useState({
    nome: '',
    variante: '',
    quantita: '',
    unita: 'Kg',
    prezzo: 0
  });

  // ✅ CARICA PRODOTTI DA DATABASE
  useEffect(() => {
    if (isConnected) {
      caricaProdotti();
    }
  }, [isConnected]);

  const caricaProdotti = async () => {
    const now = Date.now();
    if (prodottiCache && prodottiCacheTime && (now - prodottiCacheTime) < CACHE_DURATION) {
      console.log('✅ Prodotti caricati dalla cache');
      setProdottiDB(prodottiCache);
      return;
    }

    try {
      setLoadingProdotti(true);
      console.log('🔄 Caricamento prodotti da API...');
      
      const response = await fetch(`${API_URL}/prodotti/disponibili`);

      if (response.ok) {
        const data = await response.json();
        const prodottiData = data.data || data || [];
        
        prodottiCache = prodottiData;
        prodottiCacheTime = Date.now();
        
        setProdottiDB(prodottiData);
        console.log(`✅ ${prodottiData.length} prodotti caricati e cachati`);
      } else {
        console.error('Errore caricamento prodotti:', response.status);
      }
    } catch (error) {
      console.error('Errore caricamento prodotti:', error);
      if (prodottiCache) {
        setProdottiDB(prodottiCache);
        console.log('⚠️ Usando cache prodotti (scaduta)');
      }
    } finally {
      setLoadingProdotti(false);
    }
  };

  // ✅ Carica limiti quando cambia data
  useEffect(() => {
    if (formData.dataRitiro && isConnected) {
      caricaLimiti(formData.dataRitiro);
    }
  }, [formData.dataRitiro, isConnected]);

  // ✅ Funzione per caricare limiti
  const caricaLimiti = async (data) => {
    try {
      setLoadingLimiti(true);
      console.log('🔄 Caricamento limiti per data:', data);
      
      const response = await fetch(`${API_URL}/limiti?data=${data}`);
      
      if (response.ok) {
        const result = await response.json();
        const limitiData = result.data || [];
        setLimiti(limitiData);
        console.log(`✅ ${limitiData.length} limiti caricati per ${data}`);
      } else {
        console.error('Errore caricamento limiti:', response.status);
        setLimiti([]);
      }
    } catch (error) {
      console.error('Errore caricamento limiti:', error);
      setLimiti([]);
    } finally {
      setLoadingLimiti(false);
    }
  };

  // ✅ Verifica limiti ogni volta che cambiano prodotti
  useEffect(() => {
    if (formData.prodotti.length > 0 && limiti.length > 0) {
      verificaLimiti();
    } else {
      setAlertLimiti([]);
    }
  }, [formData.prodotti, limiti]);

  // ✅ Funzione verifica limiti lato client
  const verificaLimiti = () => {
    if (limiti.length === 0) {
      setAlertLimiti([]);
      return;
    }

    const alerts = [];

    // Raggruppa prodotti per nome e categoria
    const prodottiRaggruppati = {};
    const categorieRaggruppate = {};

    formData.prodotti.forEach(p => {
      // Skip vassoi (già espansi)
      if (p.unita === 'vassoio' || p.nome === 'Vassoio Dolci Misti') {
        return;
      }

      const nome = p.nome;
      const categoria = p.categoria || 'Altro';
      const quantita = parseFloat(p.quantita) || 0;
      const unita = p.unita || 'Kg';

      // Converti in Kg se necessario
      let quantitaKg = quantita;
      if (unita === 'g') {
        quantitaKg = quantita / 1000;
      }

      // Raggruppa per prodotto
      if (!prodottiRaggruppati[nome]) {
        prodottiRaggruppati[nome] = 0;
      }
      prodottiRaggruppati[nome] += quantitaKg;

      // Raggruppa per categoria
      if (!categorieRaggruppate[categoria]) {
        categorieRaggruppate[categoria] = 0;
      }
      categorieRaggruppate[categoria] += quantitaKg;
    });

    // Verifica ogni limite
    limiti.forEach(limite => {
      // Limite per prodotto specifico
      if (limite.prodotto) {
        const quantitaOrdine = prodottiRaggruppati[limite.prodotto] || 0;
        const quantitaTotale = limite.quantitaOrdinata + quantitaOrdine;
        const quantitaDisponibile = limite.limiteQuantita - limite.quantitaOrdinata;

        if (quantitaTotale > limite.limiteQuantita) {
          alerts.push({
            tipo: 'error',
            prodotto: limite.prodotto,
            messaggio: `LIMITE SUPERATO: ${limite.prodotto}`,
            dettaglio: `Richiesti ${quantitaOrdine.toFixed(1)} ${limite.unitaMisura}, disponibili ${quantitaDisponibile.toFixed(1)} ${limite.unitaMisura}`,
            percentuale: (quantitaTotale / limite.limiteQuantita) * 100
          });
        } else if (quantitaTotale >= limite.limiteQuantita * (limite.sogliAllerta / 100)) {
          alerts.push({
            tipo: 'warning',
            prodotto: limite.prodotto,
            messaggio: `ATTENZIONE: ${limite.prodotto}`,
            dettaglio: `Richiesti ${quantitaOrdine.toFixed(1)} ${limite.unitaMisura}, disponibili ${quantitaDisponibile.toFixed(1)} ${limite.unitaMisura}`,
            percentuale: (quantitaTotale / limite.limiteQuantita) * 100
          });
        }
      }

      // Limite per categoria
      if (limite.categoria) {
        const quantitaOrdine = categorieRaggruppate[limite.categoria] || 0;
        const quantitaTotale = limite.quantitaOrdinata + quantitaOrdine;
        const quantitaDisponibile = limite.limiteQuantita - limite.quantitaOrdinata;

        if (quantitaTotale > limite.limiteQuantita) {
          alerts.push({
            tipo: 'error',
            categoria: limite.categoria,
            messaggio: `LIMITE SUPERATO: Categoria ${limite.categoria}`,
            dettaglio: `Richiesti ${quantitaOrdine.toFixed(1)} ${limite.unitaMisura}, disponibili ${quantitaDisponibile.toFixed(1)} ${limite.unitaMisura}`,
            percentuale: (quantitaTotale / limite.limiteQuantita) * 100
          });
        } else if (quantitaTotale >= limite.limiteQuantita * (limite.sogliAllerta / 100)) {
          alerts.push({
            tipo: 'warning',
            categoria: limite.categoria,
            messaggio: `ATTENZIONE: Categoria ${limite.categoria}`,
            dettaglio: `Richiesti ${quantitaOrdine.toFixed(1)} ${limite.unitaMisura}, disponibili ${quantitaDisponibile.toFixed(1)} ${limite.unitaMisura}`,
            percentuale: (quantitaTotale / limite.limiteQuantita) * 100
          });
        }
      }
    });

    setAlertLimiti(alerts);
  };

  // ✅ RAGGRUPPA PRODOTTI PER CATEGORIA (INCLUDI PARDULAS NEI DOLCI)
  const prodottiPerCategoria = useMemo(() => {
    const categorie = {
      Ravioli: [],
      Dolci: [],
      Panadas: [],
      Pasta: []
    };

    prodottiDB.forEach(prodotto => {
      const categoria = prodotto.categoria || 'Altro';
      
      // ✅ FIX: Pardulas vanno nei Dolci
      if (categoria === 'Pardulas') {
        categorie.Dolci.push(prodotto);
      } else if (categorie[categoria]) {
        categorie[categoria].push(prodotto);
      }
    });

    return categorie;
  }, [prodottiDB]);

  useEffect(() => {
    if (ordineIniziale) {
      setFormData({
        cliente: ordineIniziale.cliente || null,
        nomeCliente: ordineIniziale.nomeCliente || '',
        telefono: ordineIniziale.telefono || '',
        dataRitiro: ordineIniziale.dataRitiro?.split('T')[0] || new Date().toISOString().split('T')[0],
        oraRitiro: ordineIniziale.oraRitiro || '',
        prodotti: ordineIniziale.prodotti || [],
        note: ordineIniziale.note || '',
        daViaggio: ordineIniziale.daViaggio || false
      });
    } else {
      setFormData({
        cliente: null,
        nomeCliente: '',
        telefono: '',
        dataRitiro: new Date().toISOString().split('T')[0],
        oraRitiro: '',
        prodotti: [],
        note: '',
        daViaggio: false
      });
    }
  }, [ordineIniziale, open]);

  // ✅ CARICA CLIENTI
  useEffect(() => {
    if (isConnected) {
      caricaClienti();
    }
  }, [isConnected]);

  const caricaClienti = async () => {
    const now = Date.now();
    if (clientiCache && clientiCacheTime && (now - clientiCacheTime) < CACHE_DURATION) {
      console.log('✅ Clienti caricati dalla cache');
      setClienti(clientiCache);
      return;
    }

    try {
      setLoadingClienti(true);
      console.log('🔄 Caricamento clienti da API...');
      
      const response = await fetch(`${API_URL}/clienti?attivo=true`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const clientiData = data.data || data.clienti || data || [];
        
        clientiCache = clientiData;
        clientiCacheTime = Date.now();
        
        setClienti(clientiData);
        console.log(`✅ ${clientiData.length} clienti caricati e cachati`);
      }
    } catch (error) {
      console.error('Errore caricamento clienti:', error);
      if (clientiCache) {
        setClienti(clientiCache);
        console.log('⚠️ Usando cache clienti (scaduta)');
      }
    } finally {
      setLoadingClienti(false);
    }
  };

  const handleClienteChange = (event, cliente) => {
    if (cliente) {
      setFormData({
        ...formData,
        cliente: cliente,
        nomeCliente: `${cliente.nome} ${cliente.cognome || ''}`.trim(),
        telefono: cliente.telefono || ''
      });
    } else {
      setFormData({
        ...formData,
        cliente: null,
        nomeCliente: '',
        telefono: ''
      });
    }
  };

  const getProdottoConfigDB = (nomeProdotto) => {
    return prodottiDB.find(p => p.nome === nomeProdotto) || null;
  };

  const prodottoConfig = useMemo(() => {
    if (!prodottoCorrente.nome) return null;
    return getProdottoConfigDB(prodottoCorrente.nome);
  }, [prodottoCorrente.nome, prodottiDB]);

  const hasVarianti = prodottoConfig?.hasVarianti || false;
  const varianti = prodottoConfig?.varianti || [];

  const handleProdottoSelect = (prodotto) => {
    setProdottoCorrente({
      nome: prodotto.nome,
      variante: '',
      quantita: '',
      unita: prodotto.unitaMisuraDisponibili?.[0] || 'Kg',
      prezzo: 0
    });
  };

  const handleVarianteChange = (event) => {
    setProdottoCorrente({
      ...prodottoCorrente,
      variante: event.target.value
    });
  };

  const handleValoreRapido = (valore) => {
    setProdottoCorrente({
      ...prodottoCorrente,
      quantita: valore
    });
  };

  useEffect(() => {
    if (!prodottoCorrente.nome || !prodottoCorrente.quantita || prodottoCorrente.quantita <= 0) {
      setProdottoCorrente(prev => ({ ...prev, prezzo: 0 }));
      return;
    }

    try {
      const prodotto = getProdottoConfigDB(prodottoCorrente.nome);
      if (!prodotto) return;

      let prezzo = 0;
      
      if (prodotto.hasVarianti && prodottoCorrente.variante) {
        const variante = prodotto.varianti.find(v => v.nome === prodottoCorrente.variante);
        if (variante) {
          if (prodottoCorrente.unita === 'Kg') {
            prezzo = variante.prezzoKg * prodottoCorrente.quantita;
          } else if (prodottoCorrente.unita === 'Pezzi' || prodottoCorrente.unita === 'Unità') {
            prezzo = variante.prezzoPezzo * prodottoCorrente.quantita;
          }
        }
      } else {
        if (prodottoCorrente.unita === 'Kg') {
          prezzo = prodotto.prezzoKg * prodottoCorrente.quantita;
        } else if (prodottoCorrente.unita === 'Pezzi' || prodottoCorrente.unita === 'Unità') {
          prezzo = prodotto.prezzoPezzo * prodottoCorrente.quantita;
        }
      }

      setProdottoCorrente(prev => ({
        ...prev,
        prezzo: Math.round(prezzo * 100) / 100
      }));
    } catch (error) {
      console.error('Errore calcolo prezzo:', error);
      setProdottoCorrente(prev => ({ ...prev, prezzo: 0 }));
    }
  }, [prodottoCorrente.nome, prodottoCorrente.variante, prodottoCorrente.quantita, prodottoCorrente.unita, prodottiDB]);

  const handleAggiungiProdotto = () => {
    if (!prodottoCorrente.nome || !prodottoCorrente.quantita || prodottoCorrente.quantita <= 0) {
      alert('Seleziona un prodotto e inserisci una quantità valida');
      return;
    }

    if (hasVarianti && !prodottoCorrente.variante) {
      alert('Seleziona una variante');
      return;
    }

    let nomeProdottoCompleto = prodottoCorrente.nome;
    if (prodottoCorrente.variante) {
      const variante = varianti.find(v => v.nome === prodottoCorrente.variante);
      nomeProdottoCompleto = variante?.label || `${prodottoCorrente.nome} ${prodottoCorrente.variante}`;
    }

    const nuovoProdotto = {
      nome: nomeProdottoCompleto,
      quantita: prodottoCorrente.quantita,
      unita: prodottoCorrente.unita,
      unitaMisura: prodottoCorrente.unita,
      prezzo: prodottoCorrente.prezzo,
      categoria: prodottoConfig?.categoria || 'Altro'
    };

    setFormData({
      ...formData,
      prodotti: [...formData.prodotti, nuovoProdotto]
    });

    // Reset
    setProdottoCorrente({
      nome: '',
      variante: '',
      quantita: '',
      unita: 'Kg',
      prezzo: 0
    });
  };

  const handleRimuoviProdotto = (index) => {
    setFormData({
      ...formData,
      prodotti: formData.prodotti.filter((_, i) => i !== index)
    });
  };

  const aggiungiVassoioAlCarrello = (vassoio) => {
    console.log('🎂 Aggiunto vassoio al carrello:', vassoio);
    
    setFormData({
      ...formData,
      prodotti: [...formData.prodotti, vassoio]
    });
    
    setTabValue(0);
  };

  const calcolaTotale = () => {
    return formData.prodotti.reduce((sum, p) => sum + (p.prezzo || 0), 0);
  };

  // ✅ NUOVO: Verifica limiti PRIMA di salvare CON FORCE OVERRIDE
  const handleSalva = async () => {
    if (!formData.nomeCliente || !formData.dataRitiro || !formData.oraRitiro || formData.prodotti.length === 0) {
      alert('Compila tutti i campi obbligatori: cliente, data ritiro, ora ritiro e almeno un prodotto');
      return;
    }

    // ✅ Se ci sono errori di limiti, chiedi conferma
    const erroriCritici = alertLimiti.filter(a => a.tipo === 'error');
    let forceOverride = false;
    
    if (erroriCritici.length > 0) {
      const conferma = window.confirm(
        `⚠️ ATTENZIONE!\n\n` +
        `L'ordine supera i limiti di capacità produttiva:\n\n` +
        erroriCritici.map(e => `• ${e.messaggio}\n  ${e.dettaglio}`).join('\n\n') +
        `\n\nVuoi procedere comunque?`
      );
      
      if (!conferma) {
        return;
      }
      
      // ✅ NUOVO: Segnala che l'utente ha forzato l'override
      forceOverride = true;
      console.log('⚠️ Utente ha confermato override limiti');
    }

    const ordineData = {
      ...formData,
      cliente: formData.cliente?._id || null,
      totale: calcolaTotale(),
      daViaggio: formData.daViaggio,
      forceOverride // ✅ AGGIUNGI QUESTO FLAG
    };

    console.log('📤 Invio ordine con forceOverride:', forceOverride);
    onSave(ordineData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {ordineIniziale ? 'Modifica Ordine' : 'Nuovo Ordine'}
      </DialogTitle>

      <DialogContent>
        {/* ✅ Alert Limiti in alto */}
        {alertLimiti.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {alertLimiti.map((alert, index) => (
              <Alert 
                key={index}
                severity={alert.tipo} 
                icon={alert.tipo === 'error' ? <ErrorIcon /> : <WarningIcon />}
                sx={{ mb: 1 }}
              >
                <AlertTitle>{alert.messaggio}</AlertTitle>
                {alert.dettaglio}
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(alert.percentuale, 100)}
                  color={alert.tipo === 'error' ? 'error' : 'warning'}
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Capacità utilizzata: {alert.percentuale.toFixed(0)}%
                </Typography>
              </Alert>
            ))}
          </Box>
        )}

        {/* ✅ Info Limiti per data selezionata */}
        {limiti.length > 0 && (
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'info.light' }}>
            <Typography variant="caption" display="flex" alignItems="center" gap={1}>
              <CheckIcon fontSize="small" />
              Limiti configurati per {new Date(formData.dataRitiro).toLocaleDateString('it-IT')}: {limiti.length}
              {loadingLimiti && <CircularProgress size={14} />}
            </Typography>
          </Paper>
        )}

        {/* TABS: Prodotti Singoli vs Vassoio Misti */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab 
              label="🛒 Prodotti Singoli" 
              icon={<CartIcon />}
              iconPosition="start"
            />
            <Tab 
              label="🎂 Vassoio Dolci Misti" 
              icon={<CakeIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* TAB 0: PRODOTTI SINGOLI */}
        {tabValue === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
            
            {/* SEZIONE PRODOTTI */}
            <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CartIcon /> Seleziona Prodotti
                {loadingProdotti && <CircularProgress size={20} />}
              </Typography>

              {Object.entries(prodottiPerCategoria).map(([categoria, prodotti]) => (
                prodotti.length > 0 && (
                  <Accordion key={categoria} defaultExpanded={categoria === 'Ravioli'}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {categoria} ({prodotti.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1}>
                        {prodotti.map((p) => (
                          <Grid item xs={6} sm={4} md={3} key={p._id || p.nome}>
                            <Button
                              fullWidth
                              variant={prodottoCorrente.nome === p.nome ? "contained" : "outlined"}
                              onClick={() => handleProdottoSelect(p)}
                              sx={{ 
                                justifyContent: 'flex-start', 
                                textAlign: 'left',
                                height: '100%',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                p: 1.5
                              }}
                            >
                              <Typography variant="body2" fontWeight="bold">
                                {p.nome}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {p.prezzoKg ? `€${p.prezzoKg}/Kg` : p.prezzoPezzo ? `€${p.prezzoPezzo}/pz` : ''}
                              </Typography>
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )
              ))}

              <Divider sx={{ my: 2 }} />

              {/* Form Aggiunta Prodotto */}
              {prodottoCorrente.nome && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#CFD8DC', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Configura: <strong>{prodottoCorrente.nome}</strong>
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {hasVarianti && (
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Variante *</InputLabel>
                          <Select
                            value={prodottoCorrente.variante}
                            onChange={handleVarianteChange}
                            label="Variante *"
                          >
                            {varianti.map((v) => (
                              <MenuItem key={v.nome} value={v.nome}>
                                {v.label} - €{v.prezzoKg}/Kg
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantità"
                        placeholder="0"
                        value={prodottoCorrente.quantita}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setProdottoCorrente({ ...prodottoCorrente, quantita: '' });
                            return;
                          }
                          const parsedValue = prodottoCorrente.unita === 'Kg' 
                            ? parseFloat(value) || 0
                            : parseInt(value) || 0;
                          setProdottoCorrente({ ...prodottoCorrente, quantita: parsedValue });
                        }}
                        inputProps={{ 
                          min: prodottoCorrente.unita === 'Kg' ? 0.1 : 1,
                          step: prodottoCorrente.unita === 'Kg' ? 0.1 : 1,
                          style: { MozAppearance: 'textfield' }
                        }}
                        sx={{
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0
                          }
                        }}
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Unità</InputLabel>
                        <Select
                          value={prodottoCorrente.unita}
                          onChange={(e) => setProdottoCorrente({ 
                            ...prodottoCorrente, 
                            unita: e.target.value,
                            quantita: ''
                          })}
                          label="Unità"
                        >
                          {(prodottoConfig?.unitaMisuraDisponibili || ['Kg']).map((u) => (
                            <MenuItem key={u} value={u}>{u}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Griglia Valori Rapidi */}
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        ⚡ Valori rapidi:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {VALORI_RAPIDI[prodottoCorrente.unita]?.map((valore) => (
                          <Chip
                            key={valore}
                            label={`${valore} ${prodottoCorrente.unita}`}
                            onClick={() => handleValoreRapido(valore)}
                            color={prodottoCorrente.quantita === valore ? "primary" : "default"}
                            variant={prodottoCorrente.quantita === valore ? "filled" : "outlined"}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    </Grid>

                    <Grid item xs={8} sm={hasVarianti ? 8 : 4}>
                      <TextField
                        fullWidth
                        label="Prezzo Totale"
                        value={`€${prodottoCorrente.prezzo.toFixed(2)}`}
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>

                    <Grid item xs={4} sm={hasVarianti ? 4 : 2}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={<AddIcon />}
                        onClick={handleAggiungiProdotto}
                        sx={{ height: '40px' }}
                      >
                        Aggiungi
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>

            {/* Lista Prodotti Aggiunti */}
            {formData.prodotti.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>📦 Prodotti nel Carrello</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Prodotto</TableCell>
                      <TableCell align="center">Quantità</TableCell>
                      <TableCell align="right">Prezzo</TableCell>
                      <TableCell align="center">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.prodotti.map((p, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {p.nome}
                            </Typography>
                            {p.dettagliCalcolo?.dettagli && (
                              <Typography variant="caption" color="text.secondary">
                                {p.dettagliCalcolo.dettagli}
                              </Typography>
                            )}
                            {p.note && (
                              <Typography variant="caption" color="warning.main" display="block">
                                📝 {p.note}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {p.quantita} {p.unita}
                        </TableCell>
                        <TableCell align="right">€{p.prezzo.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => handleRimuoviProdotto(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2}><strong>TOTALE</strong></TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary">
                          €{calcolaTotale().toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        )}

        {/* TAB 1: VASSOIO DOLCI MISTI */}
        {tabValue === 1 && (
          <VassoidDolciMisti onAggiungiAlCarrello={aggiungiVassoioAlCarrello} />
        )}

        {/* SEZIONI COMUNI */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          
          {/* SEZIONE CLIENTE */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon /> Dati Cliente
            </Typography>
            
            <Autocomplete
              options={clienti}
              getOptionLabel={(option) => 
                `${option.nome} ${option.cognome || ''} - ${option.telefono}`.trim()
              }
              value={formData.cliente}
              onChange={handleClienteChange}
              loading={loadingClienti}
              loadingText="Caricamento clienti..."
              noOptionsText={loadingClienti ? "Caricamento..." : "Nessun cliente trovato"}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente *"
                  placeholder="Cerca cliente esistente"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingClienti ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {!formData.cliente && (
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  label="Nome Cliente *"
                  value={formData.nomeCliente}
                  onChange={(e) => setFormData({ ...formData, nomeCliente: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </Box>
            )}
          </Paper>

          {/* Data e Ora */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>📅 Data e Ora Ritiro</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Data Ritiro *"
                value={formData.dataRitiro}
                onChange={(e) => setFormData({ ...formData, dataRitiro: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="time"
                label="Ora Ritiro *"
                value={formData.oraRitiro}
                onChange={(e) => setFormData({ ...formData, oraRitiro: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Paper>

          {/* Note */}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Note"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />

          {/* Switch Da Viaggio */}
          <Paper sx={{ p: 2, bgcolor: formData.daViaggio ? 'warning.light' : 'grey.100' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.daViaggio}
                  onChange={(e) => setFormData({ ...formData, daViaggio: e.target.checked })}
                  color="warning"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LuggageIcon />
                  <Typography variant="body1" fontWeight="bold">
                    Ordine Da Viaggio (sottovuoto)
                  </Typography>
                </Box>
              }
            />
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button 
          variant="contained" 
          onClick={handleSalva} 
          size="large"
          color={alertLimiti.some(a => a.tipo === 'error') ? 'warning' : 'primary'}
        >
          {alertLimiti.some(a => a.tipo === 'error') ? '⚠️ Salva (Supera Limiti)' : 'Salva Ordine'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}