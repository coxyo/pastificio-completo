// components/Produzione/PianificazioneProduzione.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Chip,
  IconButton,
  Stack,
  Divider,
  InputAdornment,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  SwapHoriz as SwapHorizIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format, addDays, startOfDay, isWithinInterval, parseISO, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

import LoadingOverlay from '../common/LoadingOverlay';
import ErrorDisplay from '../common/ErrorDisplay';
import notificationService from '../../services/notificationService';

// Componente per la pianificazione della produzione
const PianificazioneProduzione = ({ onNotify }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  // Stati per la pianificazione
  const [dataProduzione, setDataProduzione] = useState(new Date());
  const [ricette, setRicette] = useState([]);
  const [risorseDisponibili, setRisorseDisponibili] = useState({
    personale: 0,
    macchinari: [],
    tipoGiornata: 'normale' // normale, ridotta, straordinaria
  });
  const [pianoProduzione, setPianoProduzione] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    note: '',
    produzioni: [],
    totaleOre: 0,
    stato: 'pianificato'
  });
  
  // Stati per verifiche e notifiche
  const [verificaScorte, setVerificaScorte] = useState({
    completata: false,
    ingredientiMancanti: []
  });
  const [caricoProduttivo, setCaricoProduttivo] = useState({
    percentuale: 0,
    livello: 'basso' // basso, medio, alto, sovraccarico
  });
  
  // Filtri e ricerca
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialogs
  const [aggiungiProduzioneDialog, setAggiungiProduzioneDialog] = useState(false);
  const [nuovaProduzione, setNuovaProduzione] = useState({
    ricetta: '',
    quantitaPianificata: 1,
    note: '',
    oreStimate: 0,
    priorita: 'normale', // bassa, normale, alta
    stato: 'pianificato'
  });
  
  // Impostazioni produzione
  const [impostazioniProduzione, setImpostazioniProduzione] = useState({
    oreDisponibili: 8,
    operatoriDisponibili: 2,
    fornoDisponibile: true,
    impastatriceDisponibile: true
  });
  
  // Caricamento iniziale
  useEffect(() => {
    Promise.all([
      fetchRicette(),
      fetchRisorseDisponibili(dataProduzione),
      fetchPianoProduzione(dataProduzione)
    ]).catch(err => {
      console.error('Errore nel caricamento iniziale:', err);
      setError('Errore nel caricamento dei dati. Riprova più tardi.');
    });
  }, [dataProduzione]);
  
  // Carica le ricette disponibili
  const fetchRicette = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/produzione/ricette', {
        params: {
          attivo: true
        }
      });
      setRicette(response.data.data);
      return response.data.data;
    } catch (err) {
      console.error('Errore nel caricamento delle ricette:', err);
      setError('Impossibile caricare le ricette. Riprova più tardi.');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Carica le risorse disponibili per una data
  const fetchRisorseDisponibili = async (data) => {
    try {
      setLoading(true);
      const dataStr = format(data, 'yyyy-MM-dd');
      const response = await axios.get('/api/produzione/risorse', {
        params: {
          data: dataStr
        }
      });
      
      // Gestione del formato di risposta
      const risorse = response.data.data;
      setRisorseDisponibili({
        personale: risorse.personaleDisponibile || 2,
        macchinari: risorse.macchinariDisponibili || ['forno', 'impastatrice'],
        tipoGiornata: risorse.tipoGiornata || 'normale'
      });
      
      // Aggiorna impostazioni produzione in base alle risorse
      setImpostazioniProduzione(prev => ({
        ...prev,
        oreDisponibili: risorse.tipoGiornata === 'ridotta' ? 4 : 
                        risorse.tipoGiornata === 'straordinaria' ? 10 : 8,
        operatoriDisponibili: risorse.personaleDisponibile || 2,
        fornoDisponibile: risorse.macchinariDisponibili?.includes('forno') || true,
        impastatriceDisponibile: risorse.macchinariDisponibili?.includes('impastatrice') || true
      }));
      
      return risorse;
    } catch (err) {
      console.error('Errore nel caricamento delle risorse disponibili:', err);
      // Se non ci sono dati specifici, usa valori predefiniti
      setRisorseDisponibili({
        personale: 2,
        macchinari: ['forno', 'impastatrice'],
        tipoGiornata: 'normale'
      });
      return {
        personale: 2,
        macchinari: ['forno', 'impastatrice'],
        tipoGiornata: 'normale'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Carica il piano di produzione per una data
  const fetchPianoProduzione = async (data) => {
    try {
      setLoading(true);
      const dataStr = format(data, 'yyyy-MM-dd');
      const response = await axios.get('/api/produzione/piani', {
        params: {
          data: dataStr
        }
      });
      
      if (response.data.data && response.data.data.length > 0) {
        const piano = response.data.data[0]; // Prendi il primo piano per questa data
        setPianoProduzione(piano);
        
        // Calcola il carico produttivo
        calcolaCaricoProduttivo(piano.produzioni, impostazioniProduzione.oreDisponibili);
        
        // Verifica se ci sono scorte sufficienti
        verificaScortePerPiano(piano.produzioni);
        
        return piano;
      } else {
        // Crea un nuovo piano vuoto
        const nuovoPiano = {
          data: dataStr,
          note: '',
          produzioni: [],
          totaleOre: 0,
          stato: 'pianificato'
        };
        setPianoProduzione(nuovoPiano);
        
        // Reset carico e verifiche
        setCaricoProduttivo({
          percentuale: 0,
          livello: 'basso'
        });
        setVerificaScorte({
          completata: true,
          ingredientiMancanti: []
        });
        
        return nuovoPiano;
      }
    } catch (err) {
      console.error('Errore nel caricamento del piano di produzione:', err);
      setError('Impossibile caricare il piano di produzione. Riprova più tardi.');
      // Crea un piano vuoto
      const nuovoPiano = {
        data: format(data, 'yyyy-MM-dd'),
        note: '',
        produzioni: [],
        totaleOre: 0,
        stato: 'pianificato'
      };
      setPianoProduzione(nuovoPiano);
      return nuovoPiano;
    } finally {
      setLoading(false);
    }
  };
  
  // Calcola il carico produttivo
  const calcolaCaricoProduttivo = (produzioni, oreDisponibili) => {
    const totaleOre = produzioni.reduce((acc, prod) => acc + (prod.oreStimate || 0), 0);
    const percentuale = Math.min(100, Math.round((totaleOre / oreDisponibili) * 100));
    
    let livello = 'basso';
    if (percentuale >= 90) {
      livello = 'sovraccarico';
    } else if (percentuale >= 75) {
      livello = 'alto';
    } else if (percentuale >= 50) {
      livello = 'medio';
    }
    
    setCaricoProduttivo({
      percentuale,
      livello
    });
    
    return {
      percentuale,
      livello,
      totaleOre
    };
  };
  
  // Verifica se ci sono scorte sufficienti per le produzioni
  const verificaScortePerPiano = async (produzioni) => {
    try {
      setLoading(true);
      // Per ogni produzione, verifica le scorte degli ingredienti necessari
      const verifiche = await Promise.all(produzioni.map(async (produzione) => {
        // Ottieni i dettagli della ricetta
        const ricettaId = produzione.ricetta?._id || produzione.ricetta;
        if (!ricettaId) return { success: true, ingredientiMancanti: [] };
        
        const response = await axios.post('/api/magazzino/verifica-scorte', {
          ricettaId,
          quantita: produzione.quantitaPianificata
        });
        
        return response.data;
      }));
      
      // Combina i risultati
      const ingredientiMancanti = verifiche.flatMap(v => v.ingredientiMancanti || []);
      const tutteScorteOk = verifiche.every(v => v.success);
      
      setVerificaScorte({
        completata: true,
        success: tutteScorteOk,
        ingredientiMancanti: ingredientiMancanti
      });
      
      // Notifica se ci sono ingredienti mancanti
      if (ingredientiMancanti.length > 0) {
        notificationService.createNotification(
          'production_warning',
          'Ingredienti insufficienti per piano produzione',
          `Ci sono ${ingredientiMancanti.length} ingredienti con scorte insufficienti.`,
          {
            count: ingredientiMancanti.length,
            showToast: true
          }
        );
      }
      
      return {
        success: tutteScorteOk,
        ingredientiMancanti
      };
    } catch (err) {
      console.error('Errore nella verifica delle scorte:', err);
      setVerificaScorte({
        completata: false,
        success: false,
        ingredientiMancanti: []
      });
      return {
        success: false,
        ingredientiMancanti: []
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Salva il piano di produzione
  const salvaPianoProduzione = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calcola il totale delle ore
      const carico = calcolaCaricoProduttivo(
        pianoProduzione.produzioni, 
        impostazioniProduzione.oreDisponibili
      );
      
      const pianoAggiornato = {
        ...pianoProduzione,
        totaleOre: carico.totaleOre
      };
      
      // Salva o aggiorna il piano
      let response;
      if (pianoProduzione._id) {
        response = await axios.put(`/api/produzione/piani/${pianoProduzione._id}`, pianoAggiornato);
      } else {
        response = await axios.post('/api/produzione/piani', pianoAggiornato);
      }
      
      // Aggiorna lo stato locale
      setPianoProduzione(response.data.data);
      
      // Verifica le scorte per il piano aggiornato
      await verificaScortePerPiano(response.data.data.produzioni);
      
      setSuccess('Piano di produzione salvato con successo.');
      
      // Notifica
      if (onNotify) {
        onNotify('Piano di produzione salvato con successo', 'success');
      }
      
      return response.data.data;
    } catch (err) {
      console.error('Errore nel salvataggio del piano di produzione:', err);
      setError('Impossibile salvare il piano di produzione. Riprova più tardi.');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Aggiungi una produzione al piano
  const aggiungiProduzione = () => {
    // Verifica se la ricetta esiste
    const ricettaSelezionata = ricette.find(r => r._id === nuovaProduzione.ricetta);
    if (!ricettaSelezionata) {
      setError('Seleziona una ricetta valida');
      return;
    }
    
    // Calcola ore stimate in base alla ricetta e quantità
    const oreStimate = (ricettaSelezionata.tempoPreparazione || 1) * nuovaProduzione.quantitaPianificata / 60;
    
    // Crea l'oggetto produzione
    const produzione = {
      ...nuovaProduzione,
      ricetta: {
        _id: ricettaSelezionata._id,
        nome: ricettaSelezionata.nome,
        categoria: ricettaSelezionata.categoria
      },
      oreStimate
    };
    
    // Aggiorna il piano
    const produzioniAggiornate = [...pianoProduzione.produzioni, produzione];
    setPianoProduzione({
      ...pianoProduzione,
      produzioni: produzioniAggiornate
    });
    
    // Aggiorna il carico produttivo
    calcolaCaricoProduttivo(produzioniAggiornate, impostazioniProduzione.oreDisponibili);
    
    // Resetta il form e chiudi il dialog
    setNuovaProduzione({
      ricetta: '',
      quantitaPianificata: 1,
      note: '',
      oreStimate: 0,
      priorita: 'normale',
      stato: 'pianificato'
    });
    setAggiungiProduzioneDialog(false);
  };
  
  // Rimuovi una produzione dal piano
  const rimuoviProduzione = (index) => {
    const produzioniAggiornate = [...pianoProduzione.produzioni];
    produzioniAggiornate.splice(index, 1);
    
    setPianoProduzione({
      ...pianoProduzione,
      produzioni: produzioniAggiornate
    });
    
    // Aggiorna il carico produttivo
    calcolaCaricoProduttivo(produzioniAggiornate, impostazioniProduzione.oreDisponibili);
  };
  
  // Ricette filtrate per categoria e termine di ricerca
  const ricetteFiltrate = useMemo(() => {
    return ricette.filter(ricetta => {
      const matchCategoria = !filtroCategoria || ricetta.categoria === filtroCategoria;
      const matchSearch = !searchTerm || 
        ricetta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ricetta.categoria.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchCategoria && matchSearch;
    });
  }, [ricette, filtroCategoria, searchTerm]);
  
  // Ottieni le categorie uniche dalle ricette
  const categorieUniche = useMemo(() => {
    const categorie = ricette.map(r => r.categoria);
    return [...new Set(categorie)];
  }, [ricette]);
  
  // Stampa il piano di produzione
  const stampaPianoProduzione = () => {
    if (!pianoProduzione) return;
    
    // Genera il report
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
      <html>
        <head>
          <title>Piano di Produzione - ${format(parseISO(pianoProduzione.data), 'dd/MM/yyyy')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #673ab7; }
            h2 { color: #9c27b0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
            .warning { color: #f44336; }
            .ok { color: #4caf50; }
            .alta { color: #f44336; }
            .normale { color: #2196f3; }
            .bassa { color: #4caf50; }
            .footer { margin-top: 30px; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Piano di Produzione - ${format(parseISO(pianoProduzione.data), 'dd/MM/yyyy')}</h1>
          
          <div>
            <strong>Stato:</strong> ${pianoProduzione.stato}<br>
            <strong>Ore totali:</strong> ${pianoProduzione.totaleOre.toFixed(1)}<br>
            <strong>Carico produttivo:</strong> ${caricoProduttivo.percentuale}% (${caricoProduttivo.livello})<br>
            ${pianoProduzione.note ? `<strong>Note:</strong> ${pianoProduzione.note}<br>` : ''}
          </div>
          
          <h2>Produzioni pianificate</h2>
          ${pianoProduzione.produzioni.length > 0 ? `
            <table>
              <tr>
                <th>Ricetta</th>
                <th>Categoria</th>
                <th>Quantità</th>
                <th>Ore stimate</th>
                <th>Priorità</th>
                <th>Note</th>
              </tr>
              ${pianoProduzione.produzioni.map(prod => `
                <tr>
                  <td>${prod.ricetta.nome}</td>
                  <td>${prod.ricetta.categoria}</td>
                  <td>${prod.quantitaPianificata}</td>
                  <td>${prod.oreStimate?.toFixed(1) || '0.0'}</td>
                  <td class="${prod.priorita}">${prod.priorita}</td>
                  <td>${prod.note || ''}</td>
                </tr>
              `).join('')}
            </table>
          ` : `
            <p>Nessuna produzione pianificata per questa data.</p>
          `}
          
          ${verificaScorte.ingredientiMancanti.length > 0 ? `
            <h2>Avvisi</h2>
            <div class="warning">
              <strong>Ingredienti mancanti:</strong>
              <ul>
                ${verificaScorte.ingredientiMancanti.map(ing => `
                  <li>${ing.nome}: necessari ${ing.quantitaNecessaria} ${ing.unitaMisura}, disponibili ${ing.scorteAttuali} ${ing.unitaMisura}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Piano generato il ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Gestionale Pastificio</p>
          </div>
        </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.print();
  };
  
  return (
    <Box sx={{ position: 'relative' }}>
      {loading && <LoadingOverlay />}
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Pianificazione Produzione</Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Data produzione"
                value={dataProduzione}
                onChange={(newValue) => setDataProduzione(newValue)}
                format="dd/MM/yyyy"
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => fetchPianoProduzione(dataProduzione)}
                  startIcon={<RefreshIcon />}
                >
                  Aggiorna
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={stampaPianoProduzione}
                  startIcon={<PrintIcon />}
                  disabled={!pianoProduzione || pianoProduzione.produzioni.length === 0}
                >
                  Stampa
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained" 
                color="success" 
                onClick={salvaPianoProduzione}
                startIcon={<SaveIcon />}
                fullWidth
              >
                Salva Piano
              </Button>
            </Grid>
          </Grid>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Colonna sinistra: Risorse e Carico */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardHeader 
                  title="Risorse disponibili" 
                  titleTypographyProps={{ variant: 'h6' }}
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  <Typography variant="subtitle2">Tipo giornata</Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <Select
                      value={risorseDisponibili.tipoGiornata}
                      onChange={(e) => {
                        setRisorseDisponibili(prev => ({
                          ...prev,
                          tipoGiornata: e.target.value
                        }));
                        setImpostazioniProduzione(prev => ({
                          ...prev,
                          oreDisponibili: e.target.value === 'ridotta' ? 4 : 
                                          e.target.value === 'straordinaria' ? 10 : 8,
                        }));
                      }}
                    >
                      <MenuItem value="normale">Normale (8 ore)</MenuItem>
                      <MenuItem value="ridotta">Ridotta (4 ore)</MenuItem>
                      <MenuItem value="straordinaria">Straordinaria (10 ore)</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <TextField
                      label="Operatori"
                      type="number"
                      value={impostazioniProduzione.operatoriDisponibili}
                      onChange={(e) => setImpostazioniProduzione(prev => ({
                        ...prev,
                        operatoriDisponibili: parseInt(e.target.value) || 0
                      }))}
                      InputProps={{ inputProps: { min: 0, max: 10 } }}
                      size="small"
                      sx={{ width: '50%' }}
                    />
                    
                    <TextField
                      label="Ore disponibili"
                      type="number"
                      value={impostazioniProduzione.oreDisponibili}
                      onChange={(e) => setImpostazioniProduzione(prev => ({
                        ...prev,
                        oreDisponibili: parseInt(e.target.value) || 0
                      }))}
                      InputProps={{ inputProps: { min: 0, max: 24 } }}
                      size="small"
                      sx={{ width: '50%' }}
                    />
                  </Stack>
                  
                  <Typography variant="subtitle2" gutterBottom>Macchinari disponibili</Typography>
                  <Stack direction="row" spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        multiple
                        value={risorseDisponibili.macchinari}
                        onChange={(e) => setRisorseDisponibili(prev => ({
                          ...prev,
                          macchinari: e.target.value
                        }))}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="forno">Forno</MenuItem>
                        <MenuItem value="impastatrice">Impastatrice</MenuItem>
                        <MenuItem value="friggitrice">Friggitrice</MenuItem>
                        <MenuItem value="laminatore">Laminatore</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardHeader 
                  title="Carico produttivo" 
                  titleTypographyProps={{ variant: 'h6' }}
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    Ore pianificate: {pianoProduzione.totaleOre.toFixed(1)} / {impostazioniProduzione.oreDisponibili}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={caricoProduttivo.percentuale}
                    color={
                      caricoProduttivo.livello === 'sovraccarico' ? 'error' :
                      caricoProduttivo.livello === 'alto' ? 'warning' :
                      caricoProduttivo.livello === 'medio' ? 'info' : 'success'
                    }
                    sx={{ height: 10, borderRadius: 5, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Livello di carico: 
                    <Typography 
                      component="span" 
                      color={
                        caricoProduttivo.livello === 'sovraccarico' ? 'error' :
                        caricoProduttivo.livello === 'alto' ? 'warning.main' :
                        caricoProduttivo.livello === 'medio' ? 'info.main' : 'success.main'
                      }
                      sx={{ ml: 1, fontWeight: 'bold' }}
                    >
                      {caricoProduttivo.livello.toUpperCase()} ({caricoProduttivo.percentuale}%)
                    </Typography>
                  </Typography>
                  
                  {verificaScorte.ingredientiMancanti.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Ingredienti insufficienti</Typography>
                      <Typography variant="body2">
                        Ci sono {verificaScorte.ingredientiMancanti.length} ingredienti con scorte insufficienti.
                      </Typography>
                      <Button
                        size="small"
                        color="warning"
                        sx={{ mt: 1 }}
                        onClick={() => setDetailsDialogOpen(true)}
                      >
                        Vedi dettagli
                      </Button>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Colonna destra: Piano di produzione */}
            <Grid item xs={12} md={8}>
              <Card variant="outlined">
                <CardHeader 
                  title="Piano di produzione" 
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      size="small"
                      onClick={() => setAggiungiProduzioneDialog(true)}
                    >
                      Aggiungi
                    </Button>
                  }
                />
                <CardContent>
                  <TextField
                    label="Note piano produzione"
                    value={pianoProduzione.note}
                    onChange={(e) => setPianoProduzione({
                      ...pianoProduzione,
                      note: e.target.value
                    })}
                    fullWidth
                    size="small"
                    margin="normal"
                    multiline
                    rows={2}
                  />
                  
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Stato piano</InputLabel>
                    <Select
                      value={pianoProduzione.stato}
                      label="Stato piano"
                      onChange={(e) => setPianoProduzione({
                        ...pianoProduzione,
                        stato: e.target.value
                      })}
                    >
                      <MenuItem value="pianificato">Pianificato</MenuItem>
                      <MenuItem value="in_corso">In corso</MenuItem>
                      <MenuItem value="completato">Completato</MenuItem>
                      <MenuItem value="annullato">Annullato</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Produzioni pianificate
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ricetta</TableCell>
                          <TableCell>Categoria</TableCell>
                          <TableCell align="right">Quantità</TableCell>
                          <TableCell align="right">Ore stimate</TableCell>
                          <TableCell>Priorità</TableCell>
                          <TableCell>Azioni</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pianoProduzione.produzioni.length > 0 ? (
                          pianoProduzione.produzioni.map((produzione, index) => (
                            <TableRow key={index} 
                              sx={{ 
                                bgcolor: 
                                  produzione.priorita === 'alta' ? '#fff8e1' : 
                                  produzione.priorita === 'bassa' ? '#f1f8e9' : 
                                  'inherit'
                              }}
                            >
                              <TableCell>{produzione.ricetta.nome}</TableCell>
                              <TableCell>{produzione.ricetta.categoria}</TableCell>
                              <TableCell align="right">{produzione.quantitaPianificata}</TableCell>
                              <TableCell align="right">{produzione.oreStimate?.toFixed(1) || '0.0'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={produzione.priorita}
                                  color={
                                    produzione.priorita === 'alta' ? 'error' :
                                    produzione.priorita === 'normale' ? 'primary' :
                                    'success'
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => rimuoviProduzione(index)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              Nessuna produzione pianificata per questa data
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Dialog per aggiungere produzione */}
      <Dialog
        open={aggiungiProduzioneDialog}
        onClose={() => setAggiungiProduzioneDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Aggiungi produzione</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={filtroCategoria}
                  label="Categoria"
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  <MenuItem value="">Tutte le categorie</MenuItem>
                  {categorieUniche.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cerca ricetta"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Ricetta</InputLabel>
                <Select
                  value={nuovaProduzione.ricetta}
                  label="Ricetta *"
                  onChange={(e) => setNuovaProduzione({
                    ...nuovaProduzione,
                    ricetta: e.target.value
                  })}
                >
                  {ricetteFiltrate.map(ricetta => (
                    <MenuItem key={ricetta._id} value={ricetta._id}>
                      {ricetta.nome} ({ricetta.categoria})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Quantità"
                value={nuovaProduzione.quantitaPianificata}
                onChange={(e) => setNuovaProduzione({
                  ...nuovaProduzione,
                  quantitaPianificata: parseInt(e.target.value) || 0
                })}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priorità</InputLabel>
                <Select
                  value={nuovaProduzione.priorita}
                  label="Priorità"
                  onChange={(e) => setNuovaProduzione({
                    ...nuovaProduzione,
                    priorita: e.target.value
                  })}
                >
                  <MenuItem value="bassa">Bassa</MenuItem>
                  <MenuItem value="normale">Normale</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                value={nuovaProduzione.note}
                onChange={(e) => setNuovaProduzione({
                  ...nuovaProduzione,
                  note: e.target.value
                })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAggiungiProduzioneDialog(false)}>Annulla</Button>
          <Button 
            onClick={aggiungiProduzione}
            variant="contained"
            disabled={!nuovaProduzione.ricetta || nuovaProduzione.quantitaPianificata <= 0}
          >
            Aggiungi
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per mostrare dettagli ingredienti mancanti */}
      <Dialog
        open={verificaScorte.ingredientiMancanti.length > 0 && verificaScorte.detailsDialogOpen}
        onClose={() => setVerificaScorte(prev => ({ ...prev, detailsDialogOpen: false }))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ingredienti con scorte insufficienti</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ingrediente</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell align="right">Scorte attuali</TableCell>
                  <TableCell align="right">Quantità necessaria</TableCell>
                  <TableCell align="right">Deficit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {verificaScorte.ingredientiMancanti.map((ingrediente, index) => (
                  <TableRow key={index} sx={{ bgcolor: '#ffebee' }}>
                    <TableCell>{ingrediente.nome}</TableCell>
                    <TableCell>{ingrediente.categoria}</TableCell>
                    <TableCell align="right">{ingrediente.scorteAttuali} {ingrediente.unitaMisura}</TableCell>
                    <TableCell align="right">{ingrediente.quantitaNecessaria} {ingrediente.unitaMisura}</TableCell>
                    <TableCell align="right">
                      <Typography color="error">
                        {(ingrediente.quantitaNecessaria - ingrediente.scorteAttuali).toFixed(2)} {ingrediente.unitaMisura}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Questi ingredienti hanno scorte insufficienti per eseguire il piano di produzione. È possibile:
            </Typography>
            <ul>
              <li>Ridurre le quantità pianificate</li>
              <li>Ordinare gli ingredienti mancanti</li>
              <li>Riprogrammare la produzione per un'altra data</li>
            </ul>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificaScorte(prev => ({ ...prev, detailsDialogOpen: false }))}>
            Chiudi
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              // Reindirizza alla gestione ordini fornitori
              window.location.href = '/magazzino/ordini-fornitori';
            }}
          >
            Ordina ingredienti
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PianificazioneProduzione;