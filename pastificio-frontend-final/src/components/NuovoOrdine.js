// components/NuovoOrdine.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  Autocomplete,
  CircularProgress,
  Chip,
  InputAdornment,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Email as EmailIcon,
  CardMembership as CardIcon,
  Stars as StarsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export default function NuovoOrdine({ 
  open, 
  onClose, 
  onSave, 
  ordineIniziale, 
  prodotti = {},
  submitInCorso = false 
}) {
  // Calcola data minima (domani)
  const getDataMinima = () => {
    const domani = new Date();
    domani.setDate(domani.getDate() + 1);
    return domani.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    nomeCliente: ordineIniziale?.nomeCliente || '',
    codiceCliente: ordineIniziale?.codiceCliente || '',
    telefono: ordineIniziale?.telefono || '',
    email: ordineIniziale?.email || '',
    indirizzo: ordineIniziale?.indirizzo || '',
    dataRitiro: ordineIniziale?.dataRitiro || getDataMinima(),
    oraRitiro: ordineIniziale?.oraRitiro || '10:00',
    noteOrdine: ordineIniziale?.noteOrdine || ordineIniziale?.note || '',
    daViaggio: ordineIniziale?.daViaggio || ordineIniziale?.deveViaggiare || false,
    prodotti: ordineIniziale?.prodotti || [],
    clienteId: ordineIniziale?.clienteId || null
  });

  const [modalitaInserimento, setModalitaInserimento] = useState('guidato');
  const [categoriaSelezionata, setCategoriaSelezionata] = useState(0);
  
  // Stati per autocomplete clienti
  const [clienti, setClienti] = useState([]);
  const [loadingClienti, setLoadingClienti] = useState(false);
  const [clienteSelezionato, setClienteSelezionato] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [errorCaricamento, setErrorCaricamento] = useState(null);
  
  const [nuovoProdotto, setNuovoProdotto] = useState({
    categoria: '',
    prodotto: '',
    quantita: 1,
    prezzo: 0,
    unita: 'Kg',
    noteProdotto: ''
  });

  const [prodottoManuale, setProdottoManuale] = useState({
    prodotto: '',
    quantita: 1,
    prezzo: 0,
    unita: 'Kg',
    noteProdotto: ''
  });

  // Debug: Log stato clienti
  useEffect(() => {
    console.log('🔍 Stato clienti aggiornato:', {
      numeroClienti: clienti.length,
      primiTre: clienti.slice(0, 3),
      isArray: Array.isArray(clienti)
    });
  }, [clienti]);

  // Carica clienti all'apertura
  useEffect(() => {
    if (open) {
      console.log('📂 Dialog aperto, carico clienti...');
      caricaClienti();
      
      // Reset form se non c'è ordine iniziale
      if (!ordineIniziale) {
        setFormData({
          nomeCliente: '',
          codiceCliente: '',
          telefono: '',
          email: '',
          indirizzo: '',
          dataRitiro: getDataMinima(),
          oraRitiro: '10:00',
          noteOrdine: '',
          daViaggio: false,
          prodotti: [],
          clienteId: null
        });
        setClienteSelezionato(null);
        setInputValue('');
      }
    }
  }, [open]);

  const caricaClienti = async () => {
    setLoadingClienti(true);
    setErrorCaricamento(null);
    
    try {
      console.log('🔄 Inizio caricamento clienti...');
      
      // Tentativo 1: API Backend
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        console.log('📡 Tentativo connessione backend:', backendUrl);
        
        const response = await fetch(
          `${backendUrl}/api/clienti?limit=500&sort=-statistiche.ultimoOrdine`,
          {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Dati ricevuti dal backend:', data);
          
          // Gestisci diversi formati di risposta
          let clientiArray = [];
          if (Array.isArray(data)) {
            clientiArray = data;
          } else if (data.data && Array.isArray(data.data)) {
            clientiArray = data.data;
          } else if (data.clienti && Array.isArray(data.clienti)) {
            clientiArray = data.clienti;
          }
          
          if (clientiArray.length > 0) {
            console.log(`✅ Caricati ${clientiArray.length} clienti dal backend`);
            setClienti(clientiArray);
            localStorage.setItem('clienti_cache', JSON.stringify(clientiArray));
            localStorage.setItem('clienti_cache_time', Date.now().toString());
            return;
          }
        }
      } catch (backendError) {
        console.warn('⚠️ Backend non disponibile:', backendError.message);
      }
      
      // Tentativo 2: Cache localStorage
      const clientiCache = localStorage.getItem('clienti_cache');
      const cacheTime = localStorage.getItem('clienti_cache_time');
      const cacheAge = cacheTime ? Date.now() - parseInt(cacheTime) : Infinity;
      
      // Usa cache se esiste ed è recente (meno di 1 ora)
      if (clientiCache && cacheAge < 3600000) {
        try {
          const clientiArray = JSON.parse(clientiCache);
          if (Array.isArray(clientiArray) && clientiArray.length > 0) {
            console.log(`📦 Caricati ${clientiArray.length} clienti dalla cache`);
            setClienti(clientiArray);
            return;
          }
        } catch (e) {
          console.error('❌ Errore parsing cache:', e);
        }
      }
      
      // Tentativo 3: Estrai dai dati ordini esistenti
      console.log('🔍 Estrazione clienti dagli ordini esistenti...');
      const ordiniSalvati = JSON.parse(localStorage.getItem('ordini') || '[]');
      const clientiMap = new Map();
      let codiceCounter = 1;
      const anno = new Date().getFullYear().toString().substr(-2);
      
      if (Array.isArray(ordiniSalvati) && ordiniSalvati.length > 0) {
        ordiniSalvati.forEach(ordine => {
          if (ordine.nomeCliente) {
            const key = ordine.telefono || ordine.nomeCliente;
            
            if (!clientiMap.has(key)) {
              const nuovoCliente = {
                _id: `local_${Date.now()}_${codiceCounter}`,
                codiceCliente: ordine.codiceCliente || `CL${anno}${codiceCounter.toString().padStart(4, '0')}`,
                nome: ordine.nomeCliente.split(' ')[0] || '',
                cognome: ordine.nomeCliente.split(' ').slice(1).join(' ') || '',
                nomeCompleto: ordine.nomeCliente,
                ragioneSociale: '',
                telefono: ordine.telefono || '',
                email: ordine.email || '',
                indirizzo: ordine.indirizzo || '',
                punti: 0,
                livelloFedelta: 'bronzo',
                tipo: 'privato',
                statistiche: {
                  ultimoOrdine: ordine.dataRitiro,
                  numeroOrdini: 1,
                  totaleSpeso: ordine.totale || 0
                }
              };
              
              clientiMap.set(key, nuovoCliente);
              codiceCounter++;
            } else {
              const cliente = clientiMap.get(key);
              cliente.statistiche.numeroOrdini++;
              cliente.statistiche.totaleSpeso += ordine.totale || 0;
              
              // Aggiorna ultimo ordine
              if (new Date(ordine.dataRitiro) > new Date(cliente.statistiche.ultimoOrdine)) {
                cliente.statistiche.ultimoOrdine = ordine.dataRitiro;
              }
              
              // Aggiorna dati se più recenti
              if (ordine.telefono) cliente.telefono = ordine.telefono;
              if (ordine.email) cliente.email = ordine.email;
              if (ordine.indirizzo) cliente.indirizzo = ordine.indirizzo;
            }
          }
        });
        
        // Calcola punti e livelli
        clientiMap.forEach(cliente => {
          cliente.punti = Math.floor(cliente.statistiche.totaleSpeso);
          
          if (cliente.punti >= 1000) {
            cliente.livelloFedelta = 'platino';
          } else if (cliente.punti >= 500) {
            cliente.livelloFedelta = 'oro';
          } else if (cliente.punti >= 200) {
            cliente.livelloFedelta = 'argento';
          } else {
            cliente.livelloFedelta = 'bronzo';
          }
        });
      }
      
      const clientiArray = Array.from(clientiMap.values())
        .sort((a, b) => b.statistiche.numeroOrdini - a.statistiche.numeroOrdini);
      
      if (clientiArray.length > 0) {
        console.log(`📊 Estratti ${clientiArray.length} clienti dagli ordini`);
        setClienti(clientiArray);
        // Salva in cache per uso futuro
        localStorage.setItem('clienti_cache', JSON.stringify(clientiArray));
        localStorage.setItem('clienti_cache_time', Date.now().toString());
      } else {
        console.log('ℹ️ Nessun cliente trovato, inizializzazione vuota');
        setClienti([]);
      }
      
    } catch (error) {
      console.error('❌ Errore generale nel caricamento clienti:', error);
      setErrorCaricamento('Errore nel caricamento dei clienti');
      setClienti([]);
    } finally {
      setLoadingClienti(false);
    }
  };

  // Funzione per ricaricare i clienti manualmente
  const ricaricaClienti = () => {
    console.log('🔄 Ricaricamento manuale clienti...');
    localStorage.removeItem('clienti_cache_time'); // Forza refresh
    caricaClienti();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nomeCliente || !formData.telefono) {
      alert('Inserisci nome cliente e telefono');
      return;
    }

    if (formData.prodotti.length === 0) {
      alert('Aggiungi almeno un prodotto');
      return;
    }

    // Prepara i prodotti nel formato corretto
    const prodottiFormattati = formData.prodotti.map(p => ({
      nome: p.prodotto || p.nome,
      quantita: parseFloat(p.quantita) || 1,
      prezzo: parseFloat(p.prezzo) || 0,
      unitaMisura: p.unita || p.unitaMisura || 'Kg',
      categoria: p.categoria || 'altro',
      note: p.noteProdotto || p.note || ''
    })).filter(p => p.nome && p.quantita > 0);

    // Formatta il telefono
    const telefonoFormattato = formData.telefono.replace(/\D/g, '');

    // Calcola il totale
    const totale = prodottiFormattati.reduce((acc, p) => {
      if (p.unitaMisura === '€') {
        return acc + p.quantita;
      }
      return acc + (p.quantita * p.prezzo);
    }, 0);

    const ordineCompleto = {
      nomeCliente: formData.nomeCliente.trim(),
      codiceCliente: formData.codiceCliente,
      telefono: telefonoFormattato,
      email: formData.email,
      indirizzo: formData.indirizzo,
      dataRitiro: formData.dataRitiro,
      oraRitiro: formData.oraRitiro,
      prodotti: prodottiFormattati,
      deveViaggiare: formData.daViaggio,
      note: formData.noteOrdine || '',
      totale: totale,
      stato: 'nuovo',
      pagato: false,
      clienteId: formData.clienteId
    };

    console.log('📤 Invio ordine:', ordineCompleto);
    onSave(ordineCompleto);
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProdottoChange = (event) => {
    const nomeP = event.target.value;
    const categoria = categorie[categoriaSelezionata];
    const prodottoSelezionato = prodotti[categoria]?.find(p => p.nome === nomeP);
    
    if (prodottoSelezionato) {
      setNuovoProdotto({
        ...nuovoProdotto,
        categoria: categoria,
        prodotto: nomeP,
        prezzo: prodottoSelezionato.prezzo,
        unita: prodottoSelezionato.unita
      });
    }
  };

  const aggiungiProdotto = () => {
    const prodottoDaAggiungere = modalitaInserimento === 'guidato' ? nuovoProdotto : prodottoManuale;
    
    if (prodottoDaAggiungere.prodotto && prodottoDaAggiungere.quantita > 0) {
      setFormData(prev => ({
        ...prev,
        prodotti: [...prev.prodotti, { ...prodottoDaAggiungere }]
      }));
      
      // Reset
      if (modalitaInserimento === 'guidato') {
        setNuovoProdotto({
          categoria: '',
          prodotto: '',
          quantita: 1,
          prezzo: 0,
          unita: 'Kg',
          noteProdotto: ''
        });
      } else {
        setProdottoManuale({
          prodotto: '',
          quantita: 1,
          prezzo: 0,
          unita: 'Kg',
          noteProdotto: ''
        });
      }
    }
  };

  const rimuoviProdotto = (index) => {
    setFormData(prev => ({
      ...prev,
      prodotti: prev.prodotti.filter((_, i) => i !== index)
    }));
  };

  const calcolaTotale = () => {
    return formData.prodotti.reduce((acc, prod) => {
      if (prod.unita === '€') {
        return acc + prod.quantita;
      }
      return acc + (prod.prezzo * prod.quantita);
    }, 0).toFixed(2);
  };

  const categorie = Object.keys(prodotti);

  // Genera codice cliente per nuovo cliente
  const generaCodiceCliente = () => {
    const anno = new Date().getFullYear().toString().substr(-2);
    const clientiArray = Array.isArray(clienti) ? clienti : [];
    const maxNum = clientiArray.reduce((max, c) => {
      if (c?.codiceCliente && c.codiceCliente.startsWith(`CL${anno}`)) {
        const num = parseInt(c.codiceCliente.substring(4)) || 0;
        return Math.max(max, num);
      }
      return max;
    }, 0);
    return `CL${anno}${(maxNum + 1).toString().padStart(4, '0')}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {ordineIniziale ? 'Modifica Ordine' : 'Nuovo Ordine'}
            </Typography>
            <IconButton 
              onClick={ricaricaClienti} 
              size="small"
              title="Ricarica lista clienti"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* SEZIONE CLIENTE */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Dati Cliente
              </Typography>
              
              {/* Messaggio di stato caricamento */}
              {errorCaricamento && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {errorCaricamento} - Puoi comunque inserire un nuovo cliente
                </Alert>
              )}
              
              {!loadingClienti && clienti.length === 0 && !errorCaricamento && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Nessun cliente salvato - Inizia creando il primo cliente
                </Alert>
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                value={clienteSelezionato}
                onChange={(event, newValue) => {
                  console.log('Selezione cliente:', newValue);
                  
                  if (!newValue) {
                    // Reset quando cancelli
                    setClienteSelezionato(null);
                    setFormData(prev => ({
                      ...prev,
                      nomeCliente: '',
                      codiceCliente: '',
                      telefono: '',
                      email: '',
                      indirizzo: '',
                      clienteId: null
                    }));
                  } else if (typeof newValue === 'string') {
                    // Testo libero - nuovo cliente
                    const nuovoCodice = generaCodiceCliente();
                    setClienteSelezionato({
                      nome: newValue,
                      nomeCompleto: newValue,
                      codiceCliente: nuovoCodice,
                      nuovo: true
                    });
                    setFormData(prev => ({
                      ...prev,
                      nomeCliente: newValue,
                      codiceCliente: nuovoCodice,
                      telefono: '',
                      email: '',
                      indirizzo: '',
                      clienteId: null
                    }));
                  } else {
                    // Cliente esistente
                    setClienteSelezionato(newValue);
                    const nomeCompleto = newValue.nomeCompleto || 
                                       newValue.ragioneSociale ||
                                       `${newValue.nome || ''} ${newValue.cognome || ''}`.trim();
                    
                    setFormData(prev => ({
                      ...prev,
                      nomeCliente: nomeCompleto,
                      codiceCliente: newValue.codiceCliente || '',
                      telefono: newValue.telefono || '',
                      email: newValue.email || '',
                      indirizzo: typeof newValue.indirizzo === 'string' 
                        ? newValue.indirizzo 
                        : newValue.indirizzo?.via 
                          ? `${newValue.indirizzo.via}, ${newValue.indirizzo.citta || ''} ${newValue.indirizzo.cap || ''}`.trim()
                          : '',
                      clienteId: newValue._id
                    }));
                  }
                }}
                inputValue={inputValue}
                onInputChange={(event, newInputValue) => {
                  setInputValue(newInputValue);
                }}
                filterOptions={(options, params) => {
                  const { inputValue } = params;
                  
                  if (!Array.isArray(options)) {
                    return [];
                  }
                  
                  if (!inputValue) {
                    return options;
                  }
                  
                  const searchValue = inputValue.toLowerCase();
                  
                  const filtered = options.filter(option => {
                    if (!option) return false;
                    
                    const nomeCompleto = (option.nomeCompleto || 
                                         option.ragioneSociale ||
                                         `${option.nome || ''} ${option.cognome || ''}`.trim()).toLowerCase();
                    const codice = (option.codiceCliente || '').toLowerCase();
                    const telefono = (option.telefono || '');
                    
                    return nomeCompleto.includes(searchValue) || 
                           codice.includes(searchValue) || 
                           telefono.includes(inputValue);
                  });

                  // Suggerisci nuovo cliente se non ci sono risultati
                  if (inputValue !== '' && filtered.length === 0) {
                    filtered.push({
                      inputValue: inputValue,
                      nome: inputValue,
                      nomeCompleto: inputValue,
                      nuovo: true,
                      codiceCliente: generaCodiceCliente()
                    });
                  }

                  return filtered;
                }}
                selectOnFocus
                clearOnBlur={false}
                handleHomeEndKeys
                freeSolo
                options={clienti}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') {
                    return option;
                  }
                  
                  const nome = option.nomeCompleto || 
                              option.ragioneSociale ||
                              `${option.nome || ''} ${option.cognome || ''}`.trim();
                  
                  if (option.codiceCliente && !option.nuovo) {
                    return `${option.codiceCliente} - ${nome}`;
                  }
                  
                  return nome;
                }}
                renderOption={(props, option) => {
                  const uniqueKey = `option-${option._id || option.codiceCliente || option.inputValue || Math.random()}`;
                  
                  if (option.nuovo) {
                    return (
                      <li {...props} key={uniqueKey}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <AddIcon sx={{ mr: 1, color: 'success.main' }} />
                          <Box>
                            <Typography color="success.main">
                              Aggiungi nuovo cliente: "{option.nome}"
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Codice: {option.codiceCliente}
                            </Typography>
                          </Box>
                        </Box>
                      </li>
                    );
                  }
                  
                  const nomeCompleto = option.nomeCompleto || 
                                      option.ragioneSociale ||
                                      `${option.nome || ''} ${option.cognome || ''}`.trim();
                  
                  return (
                    <li {...props} key={uniqueKey}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          {option.codiceCliente && (
                            <Chip 
                              label={option.codiceCliente} 
                              size="small" 
                              color="primary"
                              sx={{ mr: 1, fontWeight: 'bold', minWidth: 80 }}
                            />
                          )}
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {nomeCompleto}
                          </Typography>
                          {option.livelloFedelta && option.livelloFedelta !== 'bronzo' && (
                            <Chip 
                              icon={<StarsIcon />}
                              label={option.livelloFedelta.toUpperCase()} 
                              size="small" 
                              sx={{ ml: 'auto' }}
                              color={
                                option.livelloFedelta === 'platino' ? 'primary' :
                                option.livelloFedelta === 'oro' ? 'warning' :
                                'default'
                              }
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                          {option.telefono && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ mr: 0.5, fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {option.telefono}
                              </Typography>
                            </Box>
                          )}
                          {option.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <EmailIcon sx={{ mr: 0.5, fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {option.email}
                              </Typography>
                            </Box>
                          )}
                          {option.punti > 0 && (
                            <Chip 
                              label={`${option.punti} punti`} 
                              size="small" 
                              variant="outlined"
                              color="success"
                            />
                          )}
                        </Box>
                        {option.statistiche && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1, display: 'block', mt: 0.5 }}>
                            {option.statistiche.numeroOrdini || 0} ordini • 
                            €{(option.statistiche.totaleSpeso || 0).toFixed(2)} totale
                            {option.statistiche.ultimoOrdine && 
                              ` • Ultimo: ${new Date(option.statistiche.ultimoOrdine).toLocaleDateString('it-IT')}`
                            }
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
                loading={loadingClienti}
                loadingText="Caricamento clienti..."
                noOptionsText="Nessun cliente trovato - Digita per aggiungere nuovo"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente (codice o nome)"
                    placeholder="Cerca cliente o digita per nuovo..."
                    required
                    error={!formData.nomeCliente && submitInCorso}
                    helperText={
                      loadingClienti 
                        ? 'Caricamento clienti...'
                        : clienteSelezionato?.codiceCliente 
                          ? `Codice: ${clienteSelezionato.codiceCliente}` 
                          : clienti.length > 0
                            ? `${clienti.length} clienti disponibili`
                            : 'Digita per aggiungere un nuovo cliente'
                    }
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <CardIcon />
                        </InputAdornment>
                      ),
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
            </Grid>
            
            {/* Info cliente selezionato */}
            {clienteSelezionato && !clienteSelezionato.nuovo && (
              <Grid item xs={12} sm={6}>
                <Alert 
                  severity="info" 
                  icon={<StarsIcon />}
                  sx={{ height: '56px', display: 'flex', alignItems: 'center' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      Fidelity:
                    </Typography>
                    <Chip 
                      label={clienteSelezionato.codiceCliente} 
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                    {clienteSelezionato.punti > 0 && (
                      <Chip 
                        label={`${clienteSelezionato.punti} PUNTI`} 
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>
                </Alert>
              </Grid>
            )}
            
            {/* Nuovo cliente */}
            {clienteSelezionato?.nuovo && (
              <Grid item xs={12} sm={6}>
                <Alert 
                  severity="success" 
                  sx={{ height: '56px', display: 'flex', alignItems: 'center' }}
                >
                  <Typography variant="body2">
                    Nuovo cliente - Codice: <strong>{clienteSelezionato.codiceCliente}</strong>
                  </Typography>
                </Alert>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefono"
                value={formData.telefono}
                onChange={handleChange('telefono')}
                required
                placeholder="3331234567"
                error={!formData.telefono && submitInCorso}
                helperText={
                  !formData.telefono && submitInCorso 
                    ? 'Campo obbligatorio' 
                    : 'Solo numeri'
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email (opzionale)"
                value={formData.email}
                onChange={handleChange('email')}
                type="email"
                placeholder="cliente@email.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Indirizzo (opzionale)"
                value={formData.indirizzo}
                onChange={handleChange('indirizzo')}
                placeholder="Via Roma 1, Assemini"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* DATA E ORA RITIRO */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Data e Ora Ritiro
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Data Ritiro"
                value={formData.dataRitiro}
                onChange={handleChange('dataRitiro')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: getDataMinima() }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Ora Ritiro"
                value={formData.oraRitiro}
                onChange={handleChange('oraRitiro')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            {/* SEZIONE PRODOTTI */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Prodotti
                </Typography>
                <ToggleButtonGroup
                  value={modalitaInserimento}
                  exclusive
                  onChange={(e, newMode) => newMode && setModalitaInserimento(newMode)}
                  size="small"
                >
                  <ToggleButton value="guidato">Guidato</ToggleButton>
                  <ToggleButton value="manuale">Manuale</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              {modalitaInserimento === 'guidato' ? (
                <>
                  <Tabs value={categoriaSelezionata} onChange={(e, v) => setCategoriaSelezionata(v)}>
                    {categorie.map((cat) => (
                      <Tab key={`tab-${cat}`} label={cat.charAt(0).toUpperCase() + cat.slice(1)} />
                    ))}
                  </Tabs>
                  
                  <Paper sx={{ p: 2, mt: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Prodotto</InputLabel>
                          <Select
                            value={nuovoProdotto.prodotto}
                            onChange={handleProdottoChange}
                            label="Prodotto"
                          >
                            {prodotti[categorie[categoriaSelezionata]]?.map(prod => (
                              <MenuItem key={`menu-${prod.nome}`} value={prod.nome}>
                                {prod.nome} - €{prod.prezzo}/{prod.unita}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={6} sm={2}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Quantità"
                          value={nuovoProdotto.quantita}
                          onChange={(e) => setNuovoProdotto({
                            ...nuovoProdotto,
                            quantita: parseFloat(e.target.value) || 0
                          })}
                          inputProps={{ min: 0, step: 0.1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={6} sm={2}>
                        <FormControl fullWidth>
                          <InputLabel>Unità</InputLabel>
                          <Select
                            value={nuovoProdotto.unita}
                            onChange={(e) => setNuovoProdotto({...nuovoProdotto, unita: e.target.value})}
                            label="Unità"
                          >
                            <MenuItem value="Kg">Kg</MenuItem>
                            <MenuItem value="unità">Unità</MenuItem>
                            <MenuItem value="€">€</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={6} sm={2}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Prezzo"
                          value={nuovoProdotto.prezzo}
                          onChange={(e) => setNuovoProdotto({
                            ...nuovoProdotto,
                            prezzo: parseFloat(e.target.value) || 0
                          })}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Grid>
                      
                      <Grid item xs={6} sm={1}>
                        <Typography align="center">
                          €{nuovoProdotto.unita === '€' 
                            ? nuovoProdotto.quantita.toFixed(2)
                            : (nuovoProdotto.prezzo * nuovoProdotto.quantita).toFixed(2)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={1}>
                        <IconButton 
                          onClick={aggiungiProdotto}
                          disabled={!nuovoProdotto.prodotto || nuovoProdotto.quantita <= 0}
                          color="primary"
                        >
                          <AddIcon />
                        </IconButton>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Note prodotto"
                          value={nuovoProdotto.noteProdotto}
                          onChange={(e) => setNuovoProdotto({
                            ...nuovoProdotto,
                            noteProdotto: e.target.value
                          })}
                          placeholder="Note specifiche per questo prodotto"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </>
              ) : (
                /* Modalità Manuale */
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Nome Prodotto"
                        value={prodottoManuale.prodotto}
                        onChange={(e) => setProdottoManuale({
                          ...prodottoManuale,
                          prodotto: e.target.value
                        })}
                      />
                    </Grid>
                    
                    <Grid item xs={6} sm={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantità"
                        value={prodottoManuale.quantita}
                        onChange={(e) => setProdottoManuale({
                          ...prodottoManuale,
                          quantita: parseFloat(e.target.value) || 0
                        })}
                        inputProps={{ min: 0, step: 0.1 }}
                      />
                    </Grid>
                    
                    <Grid item xs={6} sm={2}>
                      <FormControl fullWidth>
                        <InputLabel>Unità</InputLabel>
                        <Select
                          value={prodottoManuale.unita}
                          onChange={(e) => setProdottoManuale({...prodottoManuale, unita: e.target.value})}
                          label="Unità"
                        >
                          <MenuItem value="Kg">Kg</MenuItem>
                          <MenuItem value="unità">Unità</MenuItem>
                          <MenuItem value="€">€</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={6} sm={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Prezzo"
                        value={prodottoManuale.prezzo}
                        onChange={(e) => setProdottoManuale({
                          ...prodottoManuale,
                          prezzo: parseFloat(e.target.value) || 0
                        })}
                        inputProps={{ min: 0, step: 0.01 }}
                        disabled={prodottoManuale.unita === '€'}
                      />
                    </Grid>
                    
                    <Grid item xs={6} sm={1}>
                      <Typography align="center">
                        €{prodottoManuale.unita === '€' 
                          ? prodottoManuale.quantita.toFixed(2)
                          : (prodottoManuale.prezzo * prodottoManuale.quantita).toFixed(2)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={1}>
                      <IconButton 
                        onClick={aggiungiProdotto}
                        disabled={!prodottoManuale.prodotto || prodottoManuale.quantita <= 0}
                        color="primary"
                      >
                        <AddIcon />
                      </IconButton>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Note prodotto"
                        value={prodottoManuale.noteProdotto}
                        onChange={(e) => setProdottoManuale({
                          ...prodottoManuale,
                          noteProdotto: e.target.value
                        })}
                        placeholder="Note specifiche per questo prodotto"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              )}
              
              {/* Lista prodotti aggiunti */}
              {formData.prodotti.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Prodotti nell'ordine:
                  </Typography>
                  {formData.prodotti.map((prod, index) => (
                    <Paper key={`prodotto-${prod.prodotto}-${index}-${prod.quantita}`} sx={{ p: 2, mb: 1 }}>
                      <Grid container alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">
                            {prod.prodotto} ({prod.quantita} {prod.unita})
                          </Typography>
                          {prod.noteProdotto && (
                            <Typography variant="caption" color="text.secondary">
                              Note: {prod.noteProdotto}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <Typography variant="body2">
                            €{prod.prezzo}/{prod.unita === '€' ? 'importo' : prod.unita}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography align="right" variant="subtitle2">
                            €{prod.unita === '€' 
                              ? prod.quantita.toFixed(2)
                              : (prod.prezzo * prod.quantita).toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={1}>
                          <IconButton 
                            size="small" 
                            onClick={() => rimuoviProdotto(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                    <Typography variant="h6" align="right">
                      Totale: €{calcolaTotale()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Note Ordine"
                value={formData.noteOrdine}
                onChange={handleChange('noteOrdine')}
                placeholder="Note generali per l'ordine"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.daViaggio}
                    onChange={handleChange('daViaggio')}
                  />
                }
                label="Da Viaggio"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={submitInCorso}>
            Annulla
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={submitInCorso || formData.prodotti.length === 0}
          >
            {submitInCorso ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}