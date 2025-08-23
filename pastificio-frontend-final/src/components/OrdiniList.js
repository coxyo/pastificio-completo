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
import { useRouter } from 'next/navigation';
import IntegrationService from '@/services/integrationService';

const OrdiniList = ({ 
  ordini, 
  onDelete, 
  onEdit, 
  onDateChange, 
  onNuovoOrdine,
}) => {
  const router = useRouter();
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [ordineSelezionato, setOrdineSelezionato] = useState(null);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDataFiltro(newDate);
    onDateChange(newDate);
  };

  // Menu azioni
  const handleMenuOpen = (event, ordine) => {
    setAnchorEl(event.currentTarget);
    setOrdineSelezionato(ordine);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setOrdineSelezionato(null);
  };

  // Segna ordine come pronto e invia WhatsApp
  const segnaComePronto = async (ordineId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/ordini/${ordineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          stato: 'completato',
          notificaPronto: false // Questo farà scattare l'invio WhatsApp nel backend
        })
      });
      
      if (response.ok) {
        // Aggiorna stato locale
        const ordiniAggiornati = ordini.map(o => 
          o._id === ordineId 
            ? { ...o, stato: 'completato' }
            : o
        );
        localStorage.setItem('ordini', JSON.stringify(ordiniAggiornati));
        
        alert('✅ Ordine segnato come pronto! WhatsApp inviato al cliente.');
        handleMenuClose();
        window.location.reload();
      } else {
        throw new Error('Errore nell\'aggiornamento');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('❌ Errore nel segnare l\'ordine come pronto');
    }
  };

  // Invia promemoria WhatsApp
  const inviaPromemoria = async (ordineId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/ordini/invio-promemoria/${ordineId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        alert('📱 Promemoria WhatsApp inviato con successo!');
        handleMenuClose();
      } else {
        throw new Error('Errore nell\'invio del promemoria');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('❌ Errore nell\'invio del promemoria WhatsApp');
    }
  };

  // Crea fattura da ordine
  const handleCreaFattura = async () => {
    if (!ordineSelezionato) return;
    
    try {
      const fattura = await IntegrationService.createInvoiceFromOrder(ordineSelezionato);
      
      // Aggiorna l'ordine localmente
      const ordiniAggiornati = ordini.map(o => 
        o._id === ordineSelezionato._id 
          ? { ...o, statoFatturazione: 'fatturato', fatturaId: fattura.id }
          : o
      );
      
      // Salva in localStorage
      localStorage.setItem('ordini', JSON.stringify(ordiniAggiornati));
      
      // Mostra messaggio di successo
      alert(`Fattura ${fattura.numero} creata con successo!`);
      
      handleMenuClose();
      
      // Opzionale: naviga alla fattura
      if (confirm('Vuoi visualizzare la fattura creata?')) {
        router.push(`/fatturazione/visualizza/${fattura.id}`);
      }
    } catch (error) {
      console.error('Errore creazione fattura:', error);
      alert('Errore nella creazione della fattura');
    }
  };

  // Cambia stato ordine
  const handleCambiaStato = (nuovoStato) => {
    if (!ordineSelezionato) return;
    
    // Se il nuovo stato è completato, usa la funzione speciale per inviare WhatsApp
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
    window.location.reload(); // Ricarica per aggiornare la lista
  };

  // Stampa ordine
  const handleStampaOrdine = () => {
    if (!ordineSelezionato) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Ordine ${ordineSelezionato.nomeCliente}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            h2 { color: #333; }
            .info { margin: 20px 0; }
            .info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #3498db; color: white; }
            .totale { font-weight: bold; font-size: 1.2em; background-color: #ecf0f1; }
            .note { margin-top: 20px; padding: 10px; background-color: #fff9e6; border-left: 4px solid #f39c12; }
            .viaggio { color: #e74c3c; font-weight: bold; margin-top: 10px; }
            .footer { margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>🍝 PASTIFICIO NONNA CLAUDIA</h1>
          <h2>Ordine - ${ordineSelezionato.nomeCliente}</h2>
          
          <div class="info">
            <p><strong>📅 Data ritiro:</strong> ${new Date(ordineSelezionato.dataRitiro).toLocaleDateString('it-IT')}</p>
            <p><strong>⏰ Ora:</strong> ${ordineSelezionato.oraRitiro}</p>
            <p><strong>📞 Telefono:</strong> ${ordineSelezionato.telefono}</p>
            <p><strong>📍 Indirizzo:</strong> Via Carmine 20/B, Assemini (CA)</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Prodotto</th>
                <th>Quantità</th>
                <th>Prezzo Unit.</th>
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
            <tfoot>
              <tr class="totale">
                <td colspan="3" align="right">TOTALE:</td>
                <td>€ ${calcolaTotale(ordineSelezionato)}</td>
              </tr>
            </tfoot>
          </table>
          
          ${ordineSelezionato.note ? `<div class="note"><strong>📝 Note:</strong> ${ordineSelezionato.note}</div>` : ''}
          ${ordineSelezionato.daViaggio ? '<p class="viaggio">⚠️ ORDINE DA VIAGGIO</p>' : ''}
          
          <div class="footer">
            <p>Grazie per aver scelto Pastificio Nonna Claudia!</p>
            <p>📞 389 887 9833 | 📍 Via Carmine 20/B, Assemini (CA)</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    handleMenuClose();
  };

  // Filtra ordini per data
  const ordiniDelGiorno = ordini.filter(ordine => 
    ordine.dataRitiro && ordine.dataRitiro.includes(dataFiltro)
  );

  // Calcola statistiche del giorno
  const totaleGiorno = ordiniDelGiorno.reduce((sum, ordine) => 
    sum + parseFloat(calcolaTotale(ordine)), 0
  ).toFixed(2);

  const ordiniCompletati = ordiniDelGiorno.filter(o => o.stato === 'completato').length;
  const ordiniFatturati = ordiniDelGiorno.filter(o => o.statoFatturazione === 'fatturato').length;

  // Determina colore stato
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
        {/* Header con statistiche */}
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

        {/* Tabella ordini */}
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

      {/* Menu azioni */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {/* SEZIONE WHATSAPP */}
        <MenuItem 
          onClick={() => {
            segnaComePronto(ordineSelezionato._id);
          }}
          disabled={ordineSelezionato?.stato === 'completato'}
          sx={{ color: 'success.main' }}
        >
          <WhatsAppIcon sx={{ mr: 1 }} fontSize="small" />
          {ordineSelezionato?.stato === 'completato' ? 'Già pronto' : '✅ Segna come Pronto (invia WhatsApp)'}
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            inviaPromemoria(ordineSelezionato._id);
          }}
        >
          <NotificationsActiveIcon sx={{ mr: 1 }} fontSize="small" />
          📱 Invia Promemoria WhatsApp
        </MenuItem>
        
        <Divider />
        
        {/* SEZIONE FATTURAZIONE */}
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
        
        {/* SEZIONE STATI */}
        <MenuItem 
          onClick={() => handleCambiaStato('in_lavorazione')}
          disabled={ordineSelezionato?.stato === 'in_lavorazione'}
        >
          ⚙️ In Lavorazione
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleCambiaStato('completato')}
          disabled={ordineSelezionato?.stato === 'completato'}
          sx={{ color: 'success.main' }}
        >
          ✅ Completato (invia WhatsApp)
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleCambiaStato('annullato')}
          disabled={ordineSelezionato?.stato === 'annullato'}
          sx={{ color: 'error.main' }}
        >
          ❌ Annulla Ordine
        </MenuItem>
      </Menu>
    </Paper>
  );
};

// Funzione per calcolare il totale dell'ordine
const calcolaTotale = (ordine) => {
  if (!ordine.prodotti || !Array.isArray(ordine.prodotti)) return '0.00';
  
  return ordine.prodotti.reduce((totale, prodotto) => {
    return totale + (prodotto.prezzo * prodotto.quantita);
  }, 0).toFixed(2);
};

export default OrdiniList;