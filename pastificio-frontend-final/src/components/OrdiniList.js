// components/OrdiniList.js - ✅ FIX 25/11/2025: AGGIORNAMENTO REAL-TIME IMMEDIATO
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Paper, Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, TextField, Chip, Menu, MenuItem, Divider,
  Tooltip, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

const API_URL = 'https://pastificio-completo-production.up.railway.app/api';

// ========== CONFIGURAZIONE CATEGORIE ==========
const CATEGORIE = {
  RAVIOLI: {
    nome: 'RAVIOLI',
    prodotti: ['Ravioli', 'Culurgiones'],
    colore: '#FF6B6B',
    coloreBg: 'rgba(255, 107, 107, 0.1)'
  },
  PARDULAS: {
    nome: 'PARDULAS',
    prodotti: ['Pardulas'],
    colore: '#4ECDC4',
    coloreBg: 'rgba(78, 205, 196, 0.1)'
  },
  DOLCI: {
    nome: 'DOLCI',
    prodotti: ['Amaretti', 'Bianchini', 'Papassinas', 'Gueffus', 'Ciambelle', 
               'Sebadas', 'Torta di saba', 'Vassoio', 'Dolci misti', 'Pabassine'],
    colore: '#FFE66D',
    coloreBg: 'rgba(255, 230, 109, 0.1)'
  },
  ALTRI: {
    nome: 'ALTRI',
    prodotti: ['Panada', 'Panadine', 'Fregula', 'Pizzette', 'Pasta', 'Sfoglia'],
    colore: '#95E1D3',
    coloreBg: 'rgba(149, 225, 211, 0.1)'
  }
};

const getCategoriaProdotto = (nomeProdotto) => {
  if (!nomeProdotto) return 'ALTRI';
  const nomeLC = nomeProdotto.toLowerCase();
  
  for (const [key, categoria] of Object.entries(CATEGORIE)) {
    if (categoria.prodotti.some(p => nomeLC.includes(p.toLowerCase()))) {
      return key;
    }
  }
  
  return 'ALTRI';
};

const GIORNI_SETTIMANA = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

const OrdiniList = ({ 
  ordini: ordiniProps, 
  onDelete, 
  onEdit, 
  onDateChange, 
  onNuovoOrdine,
}) => {
  // ✅ FIX: State LOCALE per aggiornamenti IMMEDIATI
  const [ordiniLocali, setOrdiniLocali] = useState(ordiniProps);
  
  // ✅ Sincronizza quando arrivano nuovi dati dal parent
  useEffect(() => {
    setOrdiniLocali(ordiniProps);
  }, [ordiniProps]);
  
  // USA ordiniLocali per il rendering (si aggiorna immediatamente!)
  const ordini = ordiniLocali;

  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [ordineSelezionato, setOrdineSelezionato] = useState(null);
  const [categorieEspanse, setCategorieEspanse] = useState({
    RAVIOLI: true,
    PARDULAS: true,
    DOLCI: true,
    ALTRI: true
  });
  const [categoriaSchermoIntero, setCategoriaSchermoIntero] = useState(null);
  
  // ✅ Snackbar per feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDataFiltro(newDate);
    onDateChange(newDate);
  };

  const handleGiornoPrecedente = () => {
    const data = new Date(dataFiltro);
    data.setDate(data.getDate() - 1);
    const nuovaData = data.toISOString().split('T')[0];
    setDataFiltro(nuovaData);
    onDateChange(nuovaData);
  };

  const handleGiornoSuccessivo = () => {
    const data = new Date(dataFiltro);
    data.setDate(data.getDate() + 1);
    const nuovaData = data.toISOString().split('T')[0];
    setDataFiltro(nuovaData);
    onDateChange(nuovaData);
  };

  const getNomeGiorno = (dataString) => {
    const data = new Date(dataString + 'T00:00:00');
    return GIORNI_SETTIMANA[data.getDay()];
  };

  const handleMenuOpen = (event, ordine) => {
    setAnchorEl(event.currentTarget);
    setOrdineSelezionato(ordine);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setOrdineSelezionato(null);
  };

  const toggleCategoria = (categoria) => {
    setCategorieEspanse(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  const apriSchermoIntero = (nomeCategoria) => {
    setCategoriaSchermoIntero(nomeCategoria);
  };

  const chiudiSchermoIntero = () => {
    setCategoriaSchermoIntero(null);
  };

  // ✅✅✅ FIX PRINCIPALE: AGGIORNAMENTO REAL-TIME IMMEDIATO ✅✅✅
  const aggiornaStatoProdotto = useCallback(async (ordineId, indiceProdotto, nuovoStato) => {
    console.log(`🔄 Aggiornamento IMMEDIATO: ordine=${ordineId}, prodotto=${indiceProdotto}, stato=${nuovoStato}`);
    
    // ✅ STEP 1: Aggiorna UI IMMEDIATAMENTE (optimistic update)
    setOrdiniLocali(prevOrdini => {
      return prevOrdini.map(o => {
        if (o._id === ordineId && o.prodotti[indiceProdotto]) {
          const nuoviProdotti = [...o.prodotti];
          nuoviProdotti[indiceProdotto] = {
            ...nuoviProdotti[indiceProdotto],
            statoProduzione: nuovoStato
          };
          return { ...o, prodotti: nuoviProdotti };
        }
        return o;
      });
    });
    
    // ✅ STEP 2: Aggiorna localStorage
    const ordiniLocal = JSON.parse(localStorage.getItem('ordini') || '[]');
    const ordiniAggiornatiLocal = ordiniLocal.map(o => {
      if (o._id === ordineId && o.prodotti[indiceProdotto]) {
        const nuoviProdotti = [...o.prodotti];
        nuoviProdotti[indiceProdotto] = {
          ...nuoviProdotti[indiceProdotto],
          statoProduzione: nuovoStato
        };
        return { ...o, prodotti: nuoviProdotti };
      }
      return o;
    });
    localStorage.setItem('ordini', JSON.stringify(ordiniAggiornatiLocal));
    
    // ✅ STEP 3: Chiama API in background
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/ordini/${ordineId}/prodotto/${indiceProdotto}/stato`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stato: nuovoStato })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Errore ${response.status}`);
      }

      console.log('✅ Stato salvato sul server');
      
    } catch (error) {
      console.error('❌ Errore API:', error.message);
      setSnackbar({ open: true, message: `Errore: ${error.message}`, severity: 'error' });
      // L'UI rimane aggiornata, ma mostra errore. La prossima sync correggerà se necessario.
    }
  }, []);

  const handleInLavorazione = useCallback((ordineId, indiceProdotto, isChecked) => {
    aggiornaStatoProdotto(ordineId, indiceProdotto, isChecked ? 'in_lavorazione' : 'nuovo');
  }, [aggiornaStatoProdotto]);

  const handleFatto = useCallback((ordineId, indiceProdotto, isChecked) => {
    aggiornaStatoProdotto(ordineId, indiceProdotto, isChecked ? 'completato' : 'in_lavorazione');
  }, [aggiornaStatoProdotto]);

  const handleConsegnato = useCallback((ordineId, indiceProdotto, isChecked) => {
    aggiornaStatoProdotto(ordineId, indiceProdotto, isChecked ? 'consegnato' : 'completato');
  }, [aggiornaStatoProdotto]);

  const inviaWhatsApp = (ordine, tipo = 'conferma') => {
    try {
      let messaggio = '';
      
      if (tipo === 'pronto') {
        messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

✅ *ORDINE PRONTO PER IL RITIRO*

Cliente: ${ordine.nomeCliente}
Data: ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}
Ora: ${ordine.oraRitiro}

📍 *DOVE:* Via Carmine 20/B, Assemini (CA)
📞 *INFO:* 389 887 9833

Vi aspettiamo!
Pastificio Nonna Claudia`;

      } else if (tipo === 'promemoria') {
        messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

🔔 *PROMEMORIA RITIRO*

Gentile ${ordine.nomeCliente},
le ricordiamo il suo ordine per domani alle ${ordine.oraRitiro}.

📍 *DOVE:* Via Carmine 20/B, Assemini (CA)
📞 *Per info:* 389 887 9833

Grazie e a presto!
Pastificio Nonna Claudia`;

      } else {
        const prodottiDettaglio = ordine.prodotti.map(p => {
          const dettagli = p.dettagliCalcolo?.dettagli || `${p.quantita} ${p.unitaMisura || p.unita || 'Kg'}`;
          return `• ${p.nome || p.prodotto}: ${dettagli} - €${(p.prezzo || 0).toFixed(2)}`;
        }).join('\n');

        messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

✅ *ORDINE CONFERMATO*

Gentile ${ordine.nomeCliente},
grazie per aver scelto i nostri prodotti artigianali!

📋 *RIEPILOGO ORDINE:*
${prodottiDettaglio}

💰 *TOTALE: €${calcolaTotale(ordine)}*

📅 *RITIRO:* ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
⏰ *ORA:* ${ordine.oraRitiro}

📍 *DOVE:* Via Carmine 20/B, Assemini (CA)
📞 *Per info:* 389 887 9833

Grazie per averci scelto!
Pastificio Nonna Claudia`;
      }

      const telefonoCliente = ordine.telefono || ordine.cliente?.telefono || '';
      const telefonoPulito = telefonoCliente.replace(/\D/g, '');
      const numeroWhatsApp = telefonoPulito.startsWith('39') ? telefonoPulito : `39${telefonoPulito}`;
      
      const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(messaggio)}`;
      window.open(url, '_blank');
      
    } catch (error) {
      console.error('Errore invio WhatsApp:', error);
    }
  };

  const segnaComePronto = async (ordineId) => {
    const ordine = ordini.find(o => o._id === ordineId);
    if (ordine) {
      for (let i = 0; i < ordine.prodotti.length; i++) {
        await aggiornaStatoProdotto(ordineId, i, 'completato');
      }
      inviaWhatsApp(ordine, 'pronto');
    }
    handleMenuClose();
  };

  const inviaPromemoria = (ordineId) => {
    const ordine = ordini.find(o => o._id === ordineId);
    if (ordine) {
      inviaWhatsApp(ordine, 'promemoria');
    }
    handleMenuClose();
  };

  const handleCreaFattura = () => {
    if (ordineSelezionato) {
      console.log('Crea fattura per ordine:', ordineSelezionato._id);
    }
    handleMenuClose();
  };

  const handleStampaOrdine = () => {
    if (ordineSelezionato) {
      console.log('Stampa ordine:', ordineSelezionato._id);
    }
    handleMenuClose();
  };

  const handleCambiaStato = (nuovoStato) => {
    if (ordineSelezionato) {
      if (nuovoStato === 'completato') {
        segnaComePronto(ordineSelezionato._id);
      }
    }
    handleMenuClose();
  };

  // ========== RAGGRUPPAMENTO ==========
  const ordiniPerCategoria = useMemo(() => {
    const result = {
      RAVIOLI: [],
      PARDULAS: [],
      DOLCI: [],
      ALTRI: []
    };

    const ordiniFiltrati = ordini.filter(ordine => {
      const dataOrdine = ordine.dataRitiro || ordine.createdAt || '';
      return dataOrdine.startsWith(dataFiltro);
    });

    const mappaRaggruppamento = new Map();

    ordiniFiltrati.forEach(ordine => {
      if (!ordine.prodotti || ordine.prodotti.length === 0) return;

      const categorieOrdine = new Set(
        ordine.prodotti.map(p => getCategoriaProdotto(p.nome || p.prodotto))
      );
      const haAltriProdotti = categorieOrdine.size > 1;

      ordine.prodotti.forEach((prodotto, indiceProdotto) => {
        const nomeProdotto = prodotto.nome || prodotto.prodotto || 'N/D';
        const categoria = getCategoriaProdotto(nomeProdotto);
        const quantita = prodotto.quantita || 0;
        const unita = prodotto.unitaMisura || prodotto.unita || 'Kg';
        const nomeCliente = ordine.nomeCliente || 'N/D';
        
        let chiave;
        if (nomeProdotto === 'Vassoio Dolci Misti' || unita === 'vassoio') {
          chiave = `${categoria}-${nomeCliente}-${nomeProdotto}-${prodotto.prezzo}-${ordine._id}-${indiceProdotto}`;
        } else {
          chiave = `${categoria}-${nomeCliente}-${nomeProdotto}-${quantita}-${unita}`;
        }

        if (mappaRaggruppamento.has(chiave)) {
          const gruppo = mappaRaggruppamento.get(chiave);
          gruppo.count += 1;
          gruppo.prezzoTotale += (parseFloat(prodotto.prezzo) || 0);
        } else {
          mappaRaggruppamento.set(chiave, {
            categoria,
            oraRitiro: ordine.oraRitiro || '',
            nomeCliente,
            daViaggio: ordine.daViaggio || false,
            haAltriProdotti,
            prodotto,
            ordine,
            indiceProdotto,
            count: 1,
            prezzoTotale: parseFloat(prodotto.prezzo) || 0
          });
        }
      });
    });

    mappaRaggruppamento.forEach((gruppo) => {
      result[gruppo.categoria].push(gruppo);
    });

    Object.keys(result).forEach(cat => {
      result[cat].sort((a, b) => {
        const oraA = a.oraRitiro || '';
        const oraB = b.oraRitiro || '';
        return oraA.localeCompare(oraB);
      });
    });

    return result;
  }, [ordini, dataFiltro]);

  const totaleRigheOggi = useMemo(() => {
    return Object.values(ordiniPerCategoria).reduce((acc, cat) => acc + cat.length, 0);
  }, [ordiniPerCategoria]);

  return (
    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent' }}>
      {/* ✅ Snackbar per feedback errori */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={handleGiornoPrecedente} 
            size="small"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '0.75rem', lineHeight: 1 }}>
              {getNomeGiorno(dataFiltro)}
            </Typography>
            <TextField
              type="date"
              size="small"
              value={dataFiltro}
              onChange={handleDateChange}
              sx={{ width: 150, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.9rem' } }}
            />
          </Box>
          
          <IconButton 
            onClick={handleGiornoSuccessivo} 
            size="small"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <ChevronRightIcon />
          </IconButton>
          
          <Typography variant="subtitle2" color="text.secondary" sx={{ ml: 1 }}>
            {totaleRigheOggi} prodotti
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onNuovoOrdine}
        >
          NUOVO
        </Button>
      </Box>

      {/* Tabelle per categoria */}
      {Object.entries(CATEGORIE).map(([chiaveCategoria, configCategoria]) => {
        const prodottiCategoria = ordiniPerCategoria[chiaveCategoria] || [];
        if (prodottiCategoria.length === 0) return null;

        return (
          <Box key={chiaveCategoria} sx={{ mb: 2 }}>
            <Box
              onClick={() => toggleCategoria(chiaveCategoria)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: configCategoria.colore,
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                '&:hover': { opacity: 0.9 }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    apriSchermoIntero(chiaveCategoria);
                  }}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.05)', textDecoration: 'underline' }
                  }}
                >
                  {configCategoria.nome} ({prodottiCategoria.length}) 🔍
                </Typography>
                
                <Tooltip title="Visualizza a schermo intero">
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      apriSchermoIntero(chiaveCategoria);
                    }}
                    sx={{ color: 'white' }}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {categorieEspanse[chiaveCategoria] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>

            <Collapse in={categorieEspanse[chiaveCategoria]}>
              <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '0 0 8px 8px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: configCategoria.coloreBg }}>
                      <TableCell sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '50px' }}>ORA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem' }}>CLIENTE</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem' }}>PRODOTTO</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '70px' }}>Q.TÀ</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '60px' }}>€</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '90px' }}>L/F/C</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '30px' }}>+</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem' }}>NOTE</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '90px' }}>AZIONI</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prodottiCategoria.map((gruppo, idx) => {
                      const { ordine, prodotto, daViaggio, haAltriProdotti, nomeCliente, indiceProdotto, count, prezzoTotale } = gruppo;
                      
                      const isInLavorazione = prodotto.statoProduzione === 'in_lavorazione';
                      const isFatto = prodotto.statoProduzione === 'completato';
                      const isConsegnato = prodotto.statoProduzione === 'consegnato';
                      
                      const quantita = prodotto.quantita || 0;
                      const unita = prodotto.unitaMisura || prodotto.unita || 'Kg';
                      const qtaDisplay = count > 1 
                        ? `${count} x ${quantita} ${unita}` 
                        : `${quantita} ${unita}`;

                      let composizioneDisplay = '';
                      if (prodotto.dettagliCalcolo?.composizione) {
                        composizioneDisplay = prodotto.dettagliCalcolo.composizione
                          .map(item => `${item.nome}: ${item.quantita}`)
                          .join(', ');
                      } else if (prodotto.dettagliCalcolo?.dettagli && 
                                 (prodotto.nome === 'Vassoio Dolci Misti' || unita === 'vassoio')) {
                        composizioneDisplay = prodotto.dettagliCalcolo.dettagli;
                      }

                      return (
                        <TableRow 
                          key={`${ordine._id}-${indiceProdotto}-${idx}`}
                          sx={{
                            '&:nth-of-type(odd)': { backgroundColor: isConsegnato ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)' },
                            '&:hover': { backgroundColor: isConsegnato ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
                            opacity: isConsegnato ? 0.6 : 1,
                            textDecoration: isConsegnato ? 'line-through' : 'none'
                          }}
                        >
                          <TableCell sx={{ p: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {ordine.oraRitiro || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.75rem' }}>
                              {nomeCliente}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {prodotto.nome || prodotto.prodotto}
                              {prodotto.variante && ` (${prodotto.variante})`}
                            </Typography>
                            {composizioneDisplay && (
                              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block' }}>
                                ({composizioneDisplay})
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ p: 0.5 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                            >
                              {qtaDisplay}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ p: 0.5 }}>
                            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                              €{(prezzoTotale || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          
                          {/* ✅ L/F/C con AGGIORNAMENTO IMMEDIATO */}
                          <TableCell align="center" sx={{ p: 0.5 }}>
                            <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                              <Tooltip title="In Lavorazione">
                                <Chip
                                  label="L"
                                  color={isInLavorazione ? 'warning' : 'default'}
                                  variant={isInLavorazione ? 'filled' : 'outlined'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInLavorazione(ordine._id, indiceProdotto, !isInLavorazione);
                                  }}
                                  sx={{ 
                                    cursor: 'pointer', 
                                    minWidth: '24px',
                                    fontSize: '0.6rem',
                                    height: '18px',
                                    '& .MuiChip-label': { px: 0.4 }
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="Fatto">
                                <Chip
                                  label="F"
                                  color={isFatto ? 'success' : 'default'}
                                  variant={isFatto ? 'filled' : 'outlined'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFatto(ordine._id, indiceProdotto, !isFatto);
                                  }}
                                  sx={{ 
                                    cursor: 'pointer', 
                                    minWidth: '24px',
                                    fontSize: '0.6rem',
                                    height: '18px',
                                    '& .MuiChip-label': { px: 0.4 }
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="Consegnato">
                                <Chip
                                  label="C"
                                  color={isConsegnato ? 'error' : 'default'}
                                  variant={isConsegnato ? 'filled' : 'outlined'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConsegnato(ordine._id, indiceProdotto, !isConsegnato);
                                  }}
                                  sx={{ 
                                    cursor: 'pointer', 
                                    minWidth: '24px',
                                    fontSize: '0.6rem',
                                    height: '18px',
                                    '& .MuiChip-label': { px: 0.4 }
                                  }}
                                />
                              </Tooltip>
                            </Box>
                          </TableCell>
                          
                          <TableCell align="center" sx={{ p: 0.5 }}>
                            {haAltriProdotti ? (
                              <Tooltip title="Ha altri prodotti in altre categorie">
                                <Chip label="+" size="small" color="info" sx={{ fontSize: '0.6rem', height: '18px', minWidth: '20px', '& .MuiChip-label': { px: 0.3 } }} />
                              </Tooltip>
                            ) : ''}
                          </TableCell>
                          
                          <TableCell sx={{ p: 0.5, minWidth: '180px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                              {daViaggio && (
                                <Chip label="V" size="small" color="warning" sx={{ fontSize: '0.6rem', height: '18px', flexShrink: 0 }} />
                              )}
                              <Typography 
                                variant="caption" 
                                sx={{ fontSize: '0.65rem', lineHeight: 1.3, wordBreak: 'break-word' }}
                              >
                                {prodotto.note || ordine.note || '-'}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell align="center" sx={{ p: 0.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <IconButton 
                                onClick={(e) => { e.stopPropagation(); onEdit(ordine); }} 
                                size="small" 
                                color="primary" 
                                title="Modifica" 
                                sx={{ p: 0.25 }}
                              >
                                <EditIcon sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                              <IconButton 
                                onClick={(e) => { e.stopPropagation(); onDelete(ordine._id); }} 
                                size="small" 
                                color="error" 
                                title="Elimina" 
                                sx={{ p: 0.25 }}
                              >
                                <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                              <IconButton 
                                onClick={(e) => handleMenuOpen(e, ordine)} 
                                size="small" 
                                title="Menu" 
                                sx={{ p: 0.25 }}
                              >
                                <MoreVertIcon sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </Box>
        );
      })}

      {totaleRigheOggi === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Nessun ordine per questa data
          </Typography>
        </Paper>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem 
          onClick={() => segnaComePronto(ordineSelezionato?._id)}
          sx={{ color: 'success.main' }}
        >
          <WhatsAppIcon sx={{ mr: 1 }} fontSize="small" />
          Segna come Pronto (invia WhatsApp)
        </MenuItem>
        
        <MenuItem onClick={() => inviaPromemoria(ordineSelezionato?._id)}>
          <NotificationsActiveIcon sx={{ mr: 1 }} fontSize="small" />
          Invia Promemoria WhatsApp
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleCreaFattura}>
          <ReceiptIcon sx={{ mr: 1 }} fontSize="small" />
          Crea Fattura
        </MenuItem>
        
        <MenuItem onClick={handleStampaOrdine}>
          <PrintIcon sx={{ mr: 1 }} fontSize="small" />
          Stampa Ordine
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => handleCambiaStato('completato')}
          sx={{ color: 'success.main' }}
        >
          Completato (invia WhatsApp)
        </MenuItem>
      </Menu>

    {/* Dialog zoom */}
    <Dialog
      open={!!categoriaSchermoIntero}
      onClose={chiudiSchermoIntero}
      maxWidth="xl"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          minHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: CATEGORIE[categoriaSchermoIntero]?.colore || '#000' }}>
            {CATEGORIE[categoriaSchermoIntero]?.nome} ({ordiniPerCategoria[categoriaSchermoIntero]?.length || 0})
          </Typography>
          <IconButton onClick={chiudiSchermoIntero} size="large">
            <CloseIcon fontSize="large" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {categoriaSchermoIntero && ordiniPerCategoria[categoriaSchermoIntero] && (
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: CATEGORIE[categoriaSchermoIntero]?.coloreBg || '#f0f0f0' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>ORA</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>CLIENTE</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>PRODOTTO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Q.TÀ</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>PREZZO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>L/F/C</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>NOTE</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>AZIONI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordiniPerCategoria[categoriaSchermoIntero].map((gruppo, idx) => {
                const { ordine, prodotto, nomeCliente, daViaggio, indiceProdotto, count, prezzoTotale } = gruppo;
                
                const isInLavorazione = prodotto.statoProduzione === 'in_lavorazione';
                const isFatto = prodotto.statoProduzione === 'completato';
                const isConsegnato = prodotto.statoProduzione === 'consegnato';
                
                const quantita = prodotto.quantita || 0;
                const unita = prodotto.unitaMisura || prodotto.unita || 'Kg';
                const qtaDisplay = count > 1 
                  ? `${count} x ${quantita} ${unita}` 
                  : `${quantita} ${unita}`;
                
                let composizioneDisplay = '';
                if (prodotto.dettagliCalcolo?.composizione) {
                  composizioneDisplay = prodotto.dettagliCalcolo.composizione
                    .map(item => `${item.nome}: ${item.quantita} ${item.unita}`)
                    .join(', ');
                } else if (prodotto.dettagliCalcolo?.dettagli) {
                  composizioneDisplay = prodotto.dettagliCalcolo.dettagli;
                }
                
                return (
                  <TableRow key={`zoom-${ordine._id}-${indiceProdotto}-${idx}`} sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: isConsegnato ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)' },
                    height: '60px',
                    opacity: isConsegnato ? 0.6 : 1,
                    textDecoration: isConsegnato ? 'line-through' : 'none'
                  }}>
                    <TableCell sx={{ fontSize: '1rem' }}>{ordine.oraRitiro || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '1rem', fontWeight: 'medium' }}>{nomeCliente}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                        {prodotto.nome || prodotto.prodotto}
                        {prodotto.variante && ` (${prodotto.variante})`}
                      </Typography>
                      {composizioneDisplay && (
                        <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                          {composizioneDisplay}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '1.1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {qtaDisplay}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'primary.main' }}>
                      €{(prezzoTotale || 0).toFixed(2)}
                    </TableCell>
                    
                    {/* L/F/C nel dialog */}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Chip
                          label="L"
                          color={isInLavorazione ? 'warning' : 'default'}
                          variant={isInLavorazione ? 'filled' : 'outlined'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInLavorazione(ordine._id, indiceProdotto, !isInLavorazione);
                          }}
                          sx={{ cursor: 'pointer', fontSize: '1rem', minWidth: '40px', height: '32px' }}
                        />
                        <Chip
                          label="F"
                          color={isFatto ? 'success' : 'default'}
                          variant={isFatto ? 'filled' : 'outlined'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFatto(ordine._id, indiceProdotto, !isFatto);
                          }}
                          sx={{ cursor: 'pointer', fontSize: '1rem', minWidth: '40px', height: '32px' }}
                        />
                        <Chip
                          label="C"
                          color={isConsegnato ? 'error' : 'default'}
                          variant={isConsegnato ? 'filled' : 'outlined'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConsegnato(ordine._id, indiceProdotto, !isConsegnato);
                          }}
                          sx={{ cursor: 'pointer', fontSize: '1rem', minWidth: '40px', height: '32px' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.9rem' }}>
                      {daViaggio && <Chip label="VIAGGIO" size="small" color="warning" sx={{ mr: 0.5 }} />}
                      {prodotto.note || ordine.note || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => { chiudiSchermoIntero(); onEdit(ordine); }} color="primary" size="large">
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>

    </Paper>
  );
};

const calcolaTotale = (ordine) => {
  if (ordine.totale !== undefined && ordine.totale !== null) {
    return parseFloat(ordine.totale).toFixed(2);
  }
  
  if (!ordine.prodotti || !Array.isArray(ordine.prodotti)) {
    return '0.00';
  }
  
  return ordine.prodotti.reduce((totale, prodotto) => {
    return totale + (parseFloat(prodotto.prezzo) || 0);
  }, 0).toFixed(2);
};

export default OrdiniList;
