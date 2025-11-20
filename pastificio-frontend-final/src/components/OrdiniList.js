// components/OrdiniList.js - ✅ AGGIORNATO 20/11/2025: Raggruppamento per cliente+prodotto+quantità
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

${ordine.note ? `📝 *Note:* ${ordine.note}\n\n` : ''}📞 *INFO:* 389 887 9833
💬 *WhatsApp:* 389 887 9833

Grazie e a presto!
Pastificio Nonna Claudia`;
      }

      const numeroCliente = ordine.telefono || ordine.cliente?.telefono || '3898879833';
      const numeroClean = numeroCliente.replace(/\D/g, '');
      const numeroWhatsApp = numeroClean.startsWith('39') ? numeroClean : '39' + numeroClean;
      
      const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(messaggio)}`;
      window.open(url, '_blank');
      
    } catch (error) {
      console.error('Errore WhatsApp:', error);
      alert('Errore nell\'invio del messaggio WhatsApp');
    }
  };

  const segnaComePronto = async (ordineId) => {
    try {
      const ordiniAggiornati = ordini.map(o => 
        o._id === ordineId 
          ? { ...o, stato: 'completato' }
          : o
      );
      localStorage.setItem('ordini', JSON.stringify(ordiniAggiornati));
      
      const ordine = ordini.find(o => o._id === ordineId);
      if (ordine) {
        inviaWhatsApp(ordine, 'pronto');
      }
      
      handleMenuClose();
      window.location.reload();
    } catch (error) {
      console.error('Errore:', error);
      alert(`Errore: ${error.message}`);
    }
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
      console.log('Crea fattura per:', ordineSelezionato);
    }
    handleMenuClose();
  };

  const handleStampaOrdine = () => {
    if (ordineSelezionato) {
      console.log('Stampa ordine:', ordineSelezionato);
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            type="date"
            size="small"
            value={dataFiltro}
            onChange={handleDateChange}
            sx={{ width: 150 }}
          />
          <Typography variant="subtitle2" color="text.secondary">
            {totaleRigheOggi} prodotti
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onNuovoOrdine}
          size="small"
        >
          Nuovo
        </Button>
      </Box>

      {/* ========== SEZIONI PER CATEGORIA ========== */}
      {Object.entries(CATEGORIE).map(([catKey, catConfig]) => {
        const itemsCategoria = ordiniPerCategoria[catKey];
        if (!itemsCategoria || itemsCategoria.length === 0) return null;

        return (
          <Box key={catKey} sx={{ mb: 2 }}>
            {/* Header categoria cliccabile */}
            <Box 
              onClick={() => toggleCategoria(catKey)}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backgroundColor: catConfig.colore, 
                color: catKey === 'DOLCI' ? '#333' : 'white',
                px: 2, 
                py: 1, 
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                '&:hover': { opacity: 0.9 }
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {catConfig.nome} ({itemsCategoria.length})
              </Typography>
              {categorieEspanse[catKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>

            {/* Tabella categoria */}
            <Collapse in={categorieEspanse[catKey]}>
              <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '0 0 8px 8px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ p: 0.5, width: '45px', fontWeight: 'bold', fontSize: '0.7rem' }}>ORA</TableCell>
                      <TableCell sx={{ p: 0.5, width: '90px', fontWeight: 'bold', fontSize: '0.7rem' }}>CLIENTE</TableCell>
                      <TableCell sx={{ p: 0.5, fontWeight: 'bold', fontSize: '0.7rem' }}>PRODOTTO</TableCell>
                      <TableCell align="right" sx={{ p: 0.5, width: '70px', fontWeight: 'bold', fontSize: '0.7rem' }}>Q.TÀ</TableCell>
                      <TableCell align="right" sx={{ p: 0.5, width: '55px', fontWeight: 'bold', fontSize: '0.7rem' }}>€</TableCell>
                      <TableCell align="center" sx={{ p: 0.5, width: '50px', fontWeight: 'bold', fontSize: '0.7rem' }}>L/F</TableCell>
                      <TableCell align="center" sx={{ p: 0.5, width: '25px', fontWeight: 'bold', fontSize: '0.7rem' }}>+</TableCell>
                      <TableCell sx={{ p: 0.5, minWidth: '120px', fontWeight: 'bold', fontSize: '0.7rem' }}>NOTE</TableCell>
                      <TableCell align="center" sx={{ p: 0.5, width: '65px', fontWeight: 'bold', fontSize: '0.7rem' }}>AZIONI</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itemsCategoria.map((gruppo, idx) => {
                      const { ordine, prodotto, nomeCliente, count, prezzoTotale, daViaggio, haAltriProdotti } = gruppo;
                      const isInLavorazione = ordine.stato === 'in_lavorazione';
                      const isFatto = ordine.stato === 'completato';

                      // Formatta nome prodotto
                      let nomeProdottoDisplay;
                      let composizioneDisplay = null;
                      
                      if (prodotto.nome === 'Vassoio Dolci Misti') {
                        // ✅ Mostra prezzo del vassoio
                        nomeProdottoDisplay = `🎂 Vassoio €${(prodotto.prezzo || 0).toFixed(0)}`;
                        // ✅ NUOVO: Mostra composizione
                        if (prodotto.dettagliCalcolo?.composizione) {
                          composizioneDisplay = prodotto.dettagliCalcolo.composizione.map(comp => {
                            const abbr = comp.nome.charAt(0);
                            const qta = comp.quantita;
                            const u = comp.unita === 'Kg' ? 'kg' : comp.unita === 'Pezzi' ? 'pz' : comp.unita;
                            return `${abbr}:${qta}${u}`;
                          }).join(', ');
                        }
                      } else {
                        nomeProdottoDisplay = prodotto.nome || prodotto.prodotto;
                      }

                      // ✅ Formatta quantità con moltiplicatore
                      const qta = prodotto.quantita || 0;
                      const unita = prodotto.unitaMisura || prodotto.unita || 'Kg';
                      let qtaDisplay;
                      
                      if (prodotto.nome === 'Vassoio Dolci Misti' || unita === 'vassoio') {
                        qtaDisplay = count > 1 ? `${count} x 1 vass` : '1 vass';
                      } else if (unita.toLowerCase() === 'pezzi' || unita.toLowerCase() === 'pz') {
                        qtaDisplay = count > 1 ? `${count} x ${Math.round(qta)} pz` : `${Math.round(qta)} pz`;
                      } else if (unita === '€' || unita.toLowerCase() === 'euro') {
                        qtaDisplay = count > 1 ? `${count} x €${qta}` : `€${qta}`;
                      } else {
                        // ✅ Formato: "3 x 1 Kg" oppure "0.5 Kg"
                        qtaDisplay = count > 1 ? `${count} x ${qta} ${unita}` : `${qta} ${unita}`;
                      }

                      return (
                        <TableRow 
                          key={idx}
                          hover
                          sx={{
                            backgroundColor: isFatto ? 'rgba(76, 175, 80, 0.1)' : 
                                            isInLavorazione ? 'rgba(255, 152, 0, 0.1)' : 
                                            count > 1 ? 'rgba(33, 150, 243, 0.08)' : 'inherit'
                          }}
                        >
                          <TableCell sx={{ p: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.75rem' }}>
                              {ordine.oraRitiro || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              {nomeCliente}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {nomeProdottoDisplay}
                            </Typography>
                            {/* ✅ NUOVO: Mostra composizione vassoio */}
                            {composizioneDisplay && (
                              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block' }}>
                                ({composizioneDisplay})
                              </Typography>
                            )}
                          </TableCell>
                          {/* ✅ COLONNA QUANTITÀ CON MOLTIPLICATORE */}
                          <TableCell align="right" sx={{ p: 0.5 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: '0.75rem', 
                                fontFamily: 'monospace',
                                fontWeight: count > 1 ? 'bold' : 'normal',
                                color: count > 1 ? 'primary.main' : 'inherit'
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
