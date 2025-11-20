// components/OrdiniList.js - ✅ AGGIORNATO 20/11/2025: Navigazione date + whiteSpace nowrap
import React, { useState, useMemo } from 'react';
import { 
  Paper, Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, TextField, Chip, Menu, MenuItem, Divider,
  Tooltip, Collapse
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

const API_URL = 'https://pastificio-backend-production.up.railway.app/api';

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

// Determina categoria di un prodotto
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

// ✅ NUOVO: Nomi giorni in italiano
const GIORNI_SETTIMANA = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

const OrdiniList = ({ 
  ordini, 
  onDelete, 
  onEdit, 
  onDateChange, 
  onNuovoOrdine,
}) => {
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [ordineSelezionato, setOrdineSelezionato] = useState(null);
  const [categorieEspanse, setCategorieEspanse] = useState({
    RAVIOLI: true,
    PARDULAS: true,
    DOLCI: true,
    ALTRI: true
  });

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDataFiltro(newDate);
    onDateChange(newDate);
  };

  // ✅ NUOVO: Naviga al giorno precedente
  const handleGiornoPrecedente = () => {
    const data = new Date(dataFiltro);
    data.setDate(data.getDate() - 1);
    const nuovaData = data.toISOString().split('T')[0];
    setDataFiltro(nuovaData);
    onDateChange(nuovaData);
  };

  // ✅ NUOVO: Naviga al giorno successivo
  const handleGiornoSuccessivo = () => {
    const data = new Date(dataFiltro);
    data.setDate(data.getDate() + 1);
    const nuovaData = data.toISOString().split('T')[0];
    setDataFiltro(nuovaData);
    onDateChange(nuovaData);
  };

  // ✅ NUOVO: Ottieni nome giorno dalla data
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

  // ✅ Aggiorna stato lavorazione sul backend
  const aggiornaStatoLavorazione = async (ordineId, nuovoStato) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/ordini/${ordineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stato: nuovoStato })
      });

      if (!response.ok) {
        throw new Error('Errore aggiornamento stato');
      }

      const ordiniLocal = JSON.parse(localStorage.getItem('ordini') || '[]');
      const ordiniAggiornati = ordiniLocal.map(o => 
        o._id === ordineId ? { ...o, stato: nuovoStato } : o
      );
      localStorage.setItem('ordini', JSON.stringify(ordiniAggiornati));
      window.location.reload();
      
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
      
      const ordiniLocal = JSON.parse(localStorage.getItem('ordini') || '[]');
      const ordiniAggiornati = ordiniLocal.map(o => 
        o._id === ordineId ? { ...o, stato: nuovoStato } : o
      );
      localStorage.setItem('ordini', JSON.stringify(ordiniAggiornati));
      window.location.reload();
    }
  };

  const handleInLavorazione = (ordineId, isChecked) => {
    if (isChecked) {
      aggiornaStatoLavorazione(ordineId, 'in_lavorazione');
    } else {
      aggiornaStatoLavorazione(ordineId, 'nuovo');
    }
  };

  const handleFatto = (ordineId, isChecked) => {
    if (isChecked) {
      aggiornaStatoLavorazione(ordineId, 'completato');
    } else {
      aggiornaStatoLavorazione(ordineId, 'in_lavorazione');
    }
  };

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
💬 *WhatsApp:* 389 887 9833

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
💬 *WhatsApp:* 389 887 9833

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
      await aggiornaStatoLavorazione(ordineId, 'completato');
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
      } else {
        aggiornaStatoLavorazione(ordineSelezionato._id, nuovoStato);
      }
    }
    handleMenuClose();
  };

  // ========== RAGGRUPPAMENTO PER CLIENTE + PRODOTTO + QUANTITÀ ==========
  const ordiniPerCategoria = useMemo(() => {
    const result = {
      RAVIOLI: [],
      PARDULAS: [],
      DOLCI: [],
      ALTRI: []
    };

    // Filtra ordini per data
    const ordiniFiltrati = ordini.filter(ordine => {
      const dataOrdine = ordine.dataRitiro || ordine.createdAt || '';
      return dataOrdine.startsWith(dataFiltro);
    });

    // Mappa per raggruppamento: cliente + prodotto + quantità + unità
    const mappaRaggruppamento = new Map();

    ordiniFiltrati.forEach(ordine => {
      if (!ordine.prodotti || ordine.prodotti.length === 0) return;

      // Determina se l'ordine ha prodotti in categorie diverse
      const categorieOrdine = new Set(
        ordine.prodotti.map(p => getCategoriaProdotto(p.nome || p.prodotto))
      );
      const haAltriProdotti = categorieOrdine.size > 1;

      ordine.prodotti.forEach(prodotto => {
        const nomeProdotto = prodotto.nome || prodotto.prodotto || 'N/D';
        const categoria = getCategoriaProdotto(nomeProdotto);
        const quantita = prodotto.quantita || 0;
        const unita = prodotto.unitaMisura || prodotto.unita || 'Kg';
        const nomeCliente = ordine.nomeCliente || 'N/D';
        
        // ✅ Chiave: CLIENTE + PRODOTTO + QUANTITÀ + UNITÀ
        // Vassoi sono unici (non raggruppabili per prezzo diverso)
        let chiave;
        if (nomeProdotto === 'Vassoio Dolci Misti' || unita === 'vassoio') {
          // Vassoio: raggruppa per cliente + prezzo (ogni prezzo è un vassoio diverso)
          chiave = `${categoria}-${nomeCliente}-${nomeProdotto}-${prodotto.prezzo}`;
        } else {
          chiave = `${categoria}-${nomeCliente}-${nomeProdotto}-${quantita}-${unita}`;
        }

        if (mappaRaggruppamento.has(chiave)) {
          // Aggiungi a gruppo esistente
          const gruppo = mappaRaggruppamento.get(chiave);
          gruppo.count += 1;
          gruppo.ordiniIds.push(ordine._id);
          gruppo.prezzoTotale += (prodotto.prezzo || 0);
          // Mantieni info viaggio e altri prodotti
          if (ordine.daViaggio) gruppo.daViaggio = true;
          if (haAltriProdotti) gruppo.haAltriProdotti = true;
        } else {
          // Crea nuovo gruppo
          mappaRaggruppamento.set(chiave, {
            categoria,
            nomeCliente,
            prodotto,
            ordine, // Primo ordine per riferimento
            count: 1,
            ordiniIds: [ordine._id],
            prezzoTotale: prodotto.prezzo || 0,
            daViaggio: ordine.daViaggio || false,
            haAltriProdotti
          });
        }
      });
    });

    // Converti mappa in array per categoria
    mappaRaggruppamento.forEach((gruppo) => {
      result[gruppo.categoria].push(gruppo);
    });

    // Ordina ogni categoria per ora del primo ordine
    Object.keys(result).forEach(cat => {
      result[cat].sort((a, b) => {
        const oraA = a.ordine.oraRitiro || '';
        const oraB = b.ordine.oraRitiro || '';
        return oraA.localeCompare(oraB);
      });
    });

    return result;
  }, [ordini, dataFiltro]);

  // Conta totale righe per oggi
  const totaleRigheOggi = useMemo(() => {
    return Object.values(ordiniPerCategoria).reduce((acc, cat) => acc + cat.length, 0);
  }, [ordiniPerCategoria]);

  return (
    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        {/* ✅ NUOVO: Navigazione date con frecce e nome giorno */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={handleGiornoPrecedente} 
            size="small"
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 'bold', 
                color: 'primary.main',
                fontSize: '0.75rem',
                lineHeight: 1
              }}
            >
              {getNomeGiorno(dataFiltro)}
            </Typography>
            <TextField
              type="date"
              size="small"
              value={dataFiltro}
              onChange={handleDateChange}
              sx={{ 
                width: 150,
                '& .MuiInputBase-input': {
                  py: 0.5,
                  fontSize: '0.9rem'
                }
              }}
            />
          </Box>
          
          <IconButton 
            onClick={handleGiornoSuccessivo} 
            size="small"
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
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
            {/* Header categoria con expand/collapse */}
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
              <Typography variant="subtitle1" fontWeight="bold">
                {configCategoria.nome} ({prodottiCategoria.length})
              </Typography>
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
                      <TableCell align="center" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '70px' }}>L/F</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '30px' }}>+</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem' }}>NOTE</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '90px' }}>AZIONI</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prodottiCategoria.map((gruppo, idx) => {
                      const { ordine, prodotto, count, prezzoTotale, daViaggio, haAltriProdotti, nomeCliente } = gruppo;
                      
                      const isInLavorazione = ordine.stato === 'in_lavorazione';
                      const isFatto = ordine.stato === 'completato';
                      
                      // Formatta quantità
                      const quantita = prodotto.quantita || 0;
                      const unita = prodotto.unitaMisura || prodotto.unita || 'Kg';
                      
                      // ✅ Mostra moltiplicatore se count > 1
                      let qtaDisplay;
                      if (count > 1) {
                        qtaDisplay = `${count} x ${quantita} ${unita}`;
                      } else {
                        qtaDisplay = `${quantita} ${unita}`;
                      }

                      // Estrai composizione vassoio se presente
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
                          key={`${ordine._id}-${idx}`}
                          sx={{
                            '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
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
                            {/* ✅ NUOVO: Mostra composizione vassoio */}
                            {composizioneDisplay && (
                              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block' }}>
                                ({composizioneDisplay})
                              </Typography>
                            )}
                          </TableCell>
                          {/* ✅ COLONNA QUANTITÀ CON MOLTIPLICATORE + NOWRAP */}
                          <TableCell align="right" sx={{ p: 0.5 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: '0.75rem', 
                                fontFamily: 'monospace',
                                fontWeight: count > 1 ? 'bold' : 'normal',
                                color: count > 1 ? 'primary.main' : 'inherit',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {qtaDisplay}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ p: 0.5 }}>
                            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                              €{prezzoTotale.toFixed(2)}
                            </Typography>
                          </TableCell>
                          
                          <TableCell align="center" sx={{ p: 0.5 }}>
                            <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                              <Tooltip title="In Lavorazione">
                                <Chip
                                  label="L"
                                  size="small"
                                  color={isInLavorazione ? 'warning' : 'default'}
                                  variant={isInLavorazione ? 'filled' : 'outlined'}
                                  onClick={() => handleInLavorazione(ordine._id, !isInLavorazione)}
                                  sx={{ 
                                    cursor: 'pointer', 
                                    minWidth: '28px',
                                    fontSize: '0.65rem',
                                    height: '20px',
                                    '& .MuiChip-label': { px: 0.5 }
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="Fatto">
                                <Chip
                                  label="F"
                                  size="small"
                                  color={isFatto ? 'success' : 'default'}
                                  variant={isFatto ? 'filled' : 'outlined'}
                                  onClick={() => handleFatto(ordine._id, !isFatto)}
                                  sx={{ 
                                    cursor: 'pointer', 
                                    minWidth: '28px',
                                    fontSize: '0.65rem',
                                    height: '20px',
                                    '& .MuiChip-label': { px: 0.5 }
                                  }}
                                />
                              </Tooltip>
                            </Box>
                          </TableCell>
                          
                          <TableCell align="center" sx={{ p: 0.5 }}>
                            {haAltriProdotti ? (
                              <Tooltip title="Ha altri prodotti in altre categorie">
                                <Chip 
                                  label="+" 
                                  size="small" 
                                  color="info" 
                                  sx={{ 
                                    fontSize: '0.6rem', 
                                    height: '18px',
                                    minWidth: '20px',
                                    '& .MuiChip-label': { px: 0.3 }
                                  }} 
                                />
                              </Tooltip>
                            ) : ''}
                          </TableCell>
                          
                          <TableCell sx={{ p: 0.5 }}>
                            {daViaggio && (
                              <Chip label="V" size="small" color="warning" sx={{ fontSize: '0.6rem', height: '18px', mr: 0.5 }} />
                            )}
                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                              {prodotto.note || ordine.note 
                                ? ((prodotto.note || ordine.note).length > 25 
                                    ? (prodotto.note || ordine.note).substring(0, 25) + '...' 
                                    : (prodotto.note || ordine.note)) 
                                : '-'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell align="center" sx={{ p: 0.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <IconButton onClick={() => onEdit(ordine)} size="small" color="primary" title="Modifica" sx={{ p: 0.25 }}>
                                <EditIcon sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                              <IconButton onClick={() => onDelete(ordine._id)} size="small" color="error" title="Elimina" sx={{ p: 0.25 }}>
                                <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                              <IconButton onClick={(e) => handleMenuOpen(e, ordine)} size="small" title="Menu" sx={{ p: 0.25 }}>
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

      {/* Messaggio se nessun ordine */}
      {totaleRigheOggi === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Nessun ordine per questa data
          </Typography>
        </Paper>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => segnaComePronto(ordineSelezionato?._id)}
          disabled={ordineSelezionato?.stato === 'completato'}
          sx={{ color: 'success.main' }}
        >
          <WhatsAppIcon sx={{ mr: 1 }} fontSize="small" />
          {ordineSelezionato?.stato === 'completato' ? 'Già pronto' : 'Segna come Pronto (invia WhatsApp)'}
        </MenuItem>
        
        <MenuItem 
          onClick={() => inviaPromemoria(ordineSelezionato?._id)}
        >
          <NotificationsActiveIcon sx={{ mr: 1 }} fontSize="small" />
          Invia Promemoria WhatsApp
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleCreaFattura}
          disabled={ordineSelezionato?.statoFatturazione === 'fatturato'}
        >
          <ReceiptIcon sx={{ mr: 1 }} fontSize="small" />
          {ordineSelezionato?.statoFatturazione === 'fatturato' ? 'Già fatturato' : 'Crea Fattura'}
        </MenuItem>
        
        <MenuItem onClick={handleStampaOrdine}>
          <PrintIcon sx={{ mr: 1 }} fontSize="small" />
          Stampa Ordine
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => handleCambiaStato('in_lavorazione')}
          disabled={ordineSelezionato?.stato === 'in_lavorazione'}
        >
          In Lavorazione
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleCambiaStato('completato')}
          disabled={ordineSelezionato?.stato === 'completato'}
          sx={{ color: 'success.main' }}
        >
          Completato (invia WhatsApp)
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleCambiaStato('annullato')}
          disabled={ordineSelezionato?.stato === 'annullato'}
          sx={{ color: 'error.main' }}
        >
          Annulla Ordine
        </MenuItem>
      </Menu>
    </Paper>
  );
};

// ✅ USA ordine.totale dal backend
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
