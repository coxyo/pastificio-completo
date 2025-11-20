// components/OrdiniList.js - ✅ AGGIORNATO 20/11/2025: Checkbox Fatto e In Lavorazione
import React, { useState } from 'react';
import { 
  Paper, Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, TextField, Chip, Menu, MenuItem, Divider,
  Collapse, Checkbox, FormControlLabel, Tooltip
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
import BuildIcon from '@mui/icons-material/Build';
import DoneAllIcon from '@mui/icons-material/DoneAll';

const API_URL = 'https://pastificio-backend-production.up.railway.app/api';

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
  const [expandedRows, setExpandedRows] = useState(new Set());

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

  const toggleRowExpand = (ordineId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ordineId)) {
        newSet.delete(ordineId);
      } else {
        newSet.add(ordineId);
      }
      return newSet;
    });
  };

  // ✅ NUOVO: Aggiorna stato lavorazione sul backend
  const aggiornaStatoLavorazione = async (ordineId, nuovoStato) => {
    try {
      const token = localStorage.getItem('token');
      
      // Aggiorna sul backend
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

      // Aggiorna localStorage
      const ordiniLocal = JSON.parse(localStorage.getItem('ordini') || '[]');
      const ordiniAggiornati = ordiniLocal.map(o => 
        o._id === ordineId ? { ...o, stato: nuovoStato } : o
      );
      localStorage.setItem('ordini', JSON.stringify(ordiniAggiornati));

      // Refresh per vedere le modifiche
      window.location.reload();
      
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
      
      // Fallback: aggiorna solo localStorage
      const ordiniLocal = JSON.parse(localStorage.getItem('ordini') || '[]');
      const ordiniAggiornati = ordiniLocal.map(o => 
        o._id === ordineId ? { ...o, stato: nuovoStato } : o
      );
      localStorage.setItem('ordini', JSON.stringify(ordiniAggiornati));
      window.location.reload();
    }
  };

  // ✅ NUOVO: Handler per checkbox In Lavorazione
  const handleInLavorazione = (ordineId, isChecked) => {
    if (isChecked) {
      aggiornaStatoLavorazione(ordineId, 'in_lavorazione');
    } else {
      aggiornaStatoLavorazione(ordineId, 'nuovo');
    }
  };

  // ✅ NUOVO: Handler per checkbox Fatto
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
        // ✅ FIX: USA prodotto.prezzo DIRETTAMENTE
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
      
      console.log('WhatsApp aperto con successo');
      
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

  const inviaPromemoria = async (ordineId) => {
    try {
      const ordine = ordini.find(o => o._id === ordineId);
      if (ordine) {
        inviaWhatsApp(ordine, 'promemoria');
      }
      handleMenuClose();
    } catch (error) {
      console.error('Errore:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const handleCreaFattura = async () => {
    if (!ordineSelezionato) return;
    alert('Funzione fatturazione in sviluppo');
    handleMenuClose();
  };

  const handleCambiaStato = (nuovoStato) => {
    if (!ordineSelezionato) return;
    
    if (nuovoStato === 'completato') {
      segnaComePronto(ordineSelezionato._id);
      return;
    }
    
    const ordiniAggiornati = ordini.map(o => 
      o._id === ordineSelezionato._id 
        ? { ...o, stato: nuovoStato }
        : o
    );
    
    localStorage.setItem('ordini', JSON.stringify(ordiniAggiornati));
    handleMenuClose();
    window.location.reload();
  };

  const handleStampaOrdine = () => {
    if (!ordineSelezionato) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Ordine ${ordineSelezionato.nomeCliente}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #3498db; color: white; }
            .info { margin: 10px 0; }
            .totale { font-size: 1.2em; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>PASTIFICIO NONNA CLAUDIA</h1>
          <div class="info">Via Carmine 20/B, Assemini (CA) - Tel: 389 887 9833</div>
          <hr>
          <h2>Ordine - ${ordineSelezionato.nomeCliente}</h2>
          <div class="info">
            <p><strong>Data ritiro:</strong> ${new Date(ordineSelezionato.dataRitiro).toLocaleDateString('it-IT')}</p>
            <p><strong>Ora:</strong> ${ordineSelezionato.oraRitiro}</p>
            <p><strong>Telefono:</strong> ${ordineSelezionato.telefono}</p>
            ${ordineSelezionato.note ? `<p><strong>Note:</strong> ${ordineSelezionato.note}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Prodotto</th>
                <th>Quantità</th>
                <th>Prezzo Unitario</th>
                <th>Totale</th>
              </tr>
            </thead>
            <tbody>
              ${ordineSelezionato.prodotti.map(p => {
                const dettagli = p.dettagliCalcolo?.dettagli || `${p.quantita} ${p.unitaMisura || p.unita || ''}`;
                const prezzoUnitario = p.quantita > 0 ? (p.prezzo / p.quantita) : p.prezzo;
                
                return `
                  <tr>
                    <td>${p.nome || p.prodotto}</td>
                    <td>${dettagli}</td>
                    <td>€ ${prezzoUnitario.toFixed(2)}</td>
                    <td>€ ${p.prezzo.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="totale">Totale: € ${calcolaTotale(ordineSelezionato)}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    handleMenuClose();
  };

  const ordiniDelGiorno = ordini.filter(ordine => 
    ordine.dataRitiro && ordine.dataRitiro.includes(dataFiltro)
  );

  const totaleGiorno = ordiniDelGiorno.reduce((sum, ordine) => 
    sum + parseFloat(calcolaTotale(ordine)), 0
  ).toFixed(2);

  const ordiniCompletati = ordiniDelGiorno.filter(o => o.stato === 'completato').length;
  const ordiniInLavorazione = ordiniDelGiorno.filter(o => o.stato === 'in_lavorazione').length;
  const ordiniFatturati = ordiniDelGiorno.filter(o => o.statoFatturazione === 'fatturato').length;

  const getStatoColor = (stato) => {
    switch (stato) {
      case 'completato': return 'success';
      case 'in_lavorazione': return 'warning';
      case 'annullato': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper elevation={3}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6">Ordini del giorno</Typography>
            <Typography variant="body2" color="text.secondary">
              {ordiniDelGiorno.length} ordini • €{totaleGiorno} totale • 
              {ordiniCompletati} completati • {ordiniInLavorazione} in lavorazione • {ordiniFatturati} fatturati
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              type="date"
              value={dataFiltro}
              onChange={handleDateChange}
              variant="outlined"
              size="small"
            />
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={onNuovoOrdine}
            >
              Nuovo Ordine
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="40px"></TableCell>
                <TableCell width="60px">Ora</TableCell>
                <TableCell width="120px">Cliente</TableCell>
                <TableCell>Prodotti</TableCell>
                <TableCell align="right" width="70px">Totale</TableCell>
                <TableCell align="center" width="140px">Lavorazione</TableCell>
                <TableCell align="center" width="80px">Fattura</TableCell>
                <TableCell width="120px">Note</TableCell>
                <TableCell align="center" width="100px">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordiniDelGiorno.length > 0 ? (
                ordiniDelGiorno.map((ordine) => {
                  const isExpanded = expandedRows.has(ordine._id);
                  const numeroProdotti = ordine.prodotti?.length || 0;
                  const prodottiDaMostrare = isExpanded ? ordine.prodotti : ordine.prodotti?.slice(0, 3);
                  
                  // ✅ NUOVO: Stato checkbox
                  const isInLavorazione = ordine.stato === 'in_lavorazione';
                  const isFatto = ordine.stato === 'completato';
                  
                  return (
                    <React.Fragment key={ordine._id}>
                      <TableRow 
                        hover
                        sx={{
                          backgroundColor: isFatto ? 'rgba(76, 175, 80, 0.1)' : 
                                          isInLavorazione ? 'rgba(255, 152, 0, 0.1)' : 'inherit'
                        }}
                      >
                        <TableCell>
                          {numeroProdotti > 3 && (
                            <IconButton 
                              size="small" 
                              onClick={() => toggleRowExpand(ordine._id)}
                            >
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {ordine.oraRitiro || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">{ordine.nomeCliente}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ordine.telefono}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {/* ✅ FIX: GESTIONE VASSOI E PRODOTTI NORMALI */}
                            {prodottiDaMostrare && prodottiDaMostrare.map((p, index) => {
                              // Se è un vassoio dolci misti
                              if (p.nome === 'Vassoio Dolci Misti' && p.dettagliCalcolo?.composizione) {
                                return (
                                  <Box key={index} sx={{ mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                                      🎂 Vassoio (€{p.prezzo.toFixed(2)})
                                    </Typography>
                                    {isExpanded && p.dettagliCalcolo.composizione.map((item, idx) => (
                                      <Typography 
                                        key={idx} 
                                        variant="caption" 
                                        sx={{ display: 'block', pl: 1, color: 'text.secondary', fontSize: '0.7rem' }}
                                      >
                                        • {item.nome}: {item.quantita.toFixed(1)} {item.unita}
                                      </Typography>
                                    ))}
                                  </Box>
                                );
                              }
                              
                              // Prodotti normali
                              const dettagli = p.dettagliCalcolo?.dettagli || `${p.quantita} ${p.unitaMisura || p.unita || ''}`;
                              return (
                                <Typography key={index} variant="body2" sx={{ fontSize: '0.8rem' }}>
                                  {p.nome || p.prodotto} ({dettagli})
                                </Typography>
                              );
                            })}
                            {!isExpanded && numeroProdotti > 3 && (
                              <Typography 
                                variant="caption" 
                                color="primary" 
                                sx={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}
                                onClick={() => toggleRowExpand(ordine._id)}
                              >
                                +{numeroProdotti - 3} altri...
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            €{calcolaTotale(ordine)}
                          </Typography>
                        </TableCell>
                        
                        {/* ✅ NUOVO: Colonna Lavorazione con Checkbox */}
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title="In Lavorazione">
                              <Chip
                                icon={<BuildIcon sx={{ fontSize: '0.9rem' }} />}
                                label="Lav"
                                size="small"
                                color={isInLavorazione ? 'warning' : 'default'}
                                variant={isInLavorazione ? 'filled' : 'outlined'}
                                onClick={() => handleInLavorazione(ordine._id, !isInLavorazione)}
                                sx={{ 
                                  cursor: 'pointer', 
                                  minWidth: '60px',
                                  fontSize: '0.7rem',
                                  height: '24px'
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="Fatto / Completato">
                              <Chip
                                icon={<DoneAllIcon sx={{ fontSize: '0.9rem' }} />}
                                label="Fatto"
                                size="small"
                                color={isFatto ? 'success' : 'default'}
                                variant={isFatto ? 'filled' : 'outlined'}
                                onClick={() => handleFatto(ordine._id, !isFatto)}
                                sx={{ 
                                  cursor: 'pointer', 
                                  minWidth: '60px',
                                  fontSize: '0.7rem',
                                  height: '24px'
                                }}
                              />
                            </Tooltip>
                          </Box>
                        </TableCell>
                        
                        <TableCell align="center">
                          {ordine.statoFatturazione === 'fatturato' ? (
                            <Chip 
                              icon={<CheckCircleIcon />}
                              label="Fatt" 
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: '24px' }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              No
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box>
                            {ordine.daViaggio && (
                              <Chip label="VIAGGIO" size="small" color="warning" sx={{ mb: 0.5, fontSize: '0.6rem', height: '20px' }} />
                            )}
                            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem' }}>
                              {ordine.note || '-'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton onClick={() => onEdit(ordine)} size="small" color="primary" title="Modifica">
                              <EditIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                            <IconButton onClick={() => onDelete(ordine._id)} size="small" color="error" title="Elimina">
                              <DeleteIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                            <IconButton onClick={(e) => handleMenuOpen(e, ordine)} size="small" title="Altre azioni">
                              <MoreVertIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Nessun ordine per questa data
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

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
