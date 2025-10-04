// components/OrdiniList.js
import React, { useState } from 'react';
import { 
  Paper, Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, TextField, Chip, Menu, MenuItem, Divider
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

const API_URL = 'https://pastificio-backend-production.up.railway.app';

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

  // FUNZIONE WHATSAPP CON MESSAGGIO DETTAGLIATO
  const inviaWhatsApp = (ordine, tipo = 'conferma') => {
    try {
      // Prepara il messaggio dettagliato
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
        // Messaggio conferma ordine dettagliato
        const prodottiDettaglio = ordine.prodotti.map(p => 
          `• ${p.nome || p.prodotto}: ${p.quantita} ${p.unitaMisura || p.unita || 'Kg'} - €${((p.prezzo * p.quantita) || 0).toFixed(2)}`
        ).join('\n');

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

      // Numero di telefono
      const numeroCliente = ordine.telefono || ordine.cliente?.telefono || '3898879833';
      const numeroClean = numeroCliente.replace(/\D/g, '');
      const numeroWhatsApp = numeroClean.startsWith('39') ? numeroClean : '39' + numeroClean;
      
      // Apri WhatsApp Web
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
      // Aggiorna lo stato localmente
      const ordiniAggiornati = ordini.map(o => 
        o._id === ordineId 
          ? { ...o, stato: 'completato' }
          : o
      );
      localStorage.setItem('ordini', JSON.stringify(ordiniAggiornati));
      
      // Invia WhatsApp
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
                <th>Prezzo</th>
                <th>Totale</th>
              </tr>
            </thead>
            <tbody>
              ${ordineSelezionato.prodotti.map(p => `
                <tr>
                  <td>${p.nome || p.prodotto}</td>
                  <td>${p.quantita} ${p.unitaMisura || p.unita || ''}</td>
                  <td>€ ${p.prezzo.toFixed(2)}</td>
                  <td>€ ${(p.prezzo * p.quantita).toFixed(2)}</td>
                </tr>
              `).join('')}
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
              {ordiniCompletati} completati • {ordiniFatturati} fatturati
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
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ora</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Prodotti</TableCell>
                <TableCell align="right">Totale</TableCell>
                <TableCell align="center">Stato</TableCell>
                <TableCell align="center">Fattura</TableCell>
                <TableCell>Note</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordiniDelGiorno.length > 0 ? (
                ordiniDelGiorno.map((ordine) => (
                  <TableRow key={ordine._id} hover>
                    <TableCell>{ordine.oraRitiro || '-'}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{ordine.nomeCliente}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tel: {ordine.telefono}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {ordine.prodotti && ordine.prodotti.slice(0, 2).map((p, index) => (
                          <Typography key={index} variant="body2">
                            {p.nome || p.prodotto} ({p.quantita} {p.unitaMisura || p.unita || ''})
                          </Typography>
                        ))}
                        {ordine.prodotti && ordine.prodotti.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{ordine.prodotti.length - 2} altri prodotti
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        €{calcolaTotale(ordine)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={ordine.stato || 'nuovo'} 
                        size="small"
                        color={getStatoColor(ordine.stato)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {ordine.statoFatturazione === 'fatturato' ? (
                        <Chip 
                          icon={<CheckCircleIcon />}
                          label="Fatturato" 
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Non fatturato
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        {ordine.daViaggio && (
                          <Chip label="DA VIAGGIO" size="small" color="warning" sx={{ mb: 0.5 }} />
                        )}
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          {ordine.note || '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton onClick={() => onEdit(ordine)} size="small" color="primary" title="Modifica">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => onDelete(ordine._id)} size="small" color="error" title="Elimina">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={(e) => handleMenuOpen(e, ordine)} size="small" title="Altre azioni">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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

const calcolaTotale = (ordine) => {
  if (!ordine.prodotti || !Array.isArray(ordine.prodotti)) return '0.00';
  
  return ordine.prodotti.reduce((totale, prodotto) => {
    return totale + (prodotto.prezzo * prodotto.quantita);
  }, 0).toFixed(2);
};

export default OrdiniList;
