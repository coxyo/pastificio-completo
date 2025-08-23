'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Print as PrintIcon,
  Visibility as PreviewIcon,
  DateRange as DateRangeIcon,
  Assessment as ReportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Today as TodayIcon
} from '@mui/icons-material';

// Importa le utilità per l'export
import { generaPDF, generaExcel, generaCSV } from '../utils/reportUtils';

const Report = ({ ordini = [], isConnected = false }) => {
  // Stati per i filtri - AGGIORNATO per includere date future
  const [filtri, setFiltri] = useState({
    dataInizio: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 mesi fa
    dataFine: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 anno nel futuro
    tipoReport: 'vendite',
    categoria: 'tutte',
    cliente: '',
    stato: 'tutti'
  });

  // Stati per l'interfaccia
  const [reportSelezionato, setReportSelezionato] = useState(null);
  const [dialogAnteprima, setDialogAnteprima] = useState(false);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState('');

  // Log per debug MIGLIORATO
  useEffect(() => {
    console.log('📊 Report component inizializzato');
    console.log('Ordini ricevuti:', ordini.length);
    console.log('Filtri attuali:', filtri);
    
    if (ordini.length > 0) {
      console.log('Primo ordine:', ordini[0]);
      console.log('Date ordini:', ordini.map(o => ({
        cliente: o.nomeCliente,
        dataRitiro: o.dataRitiro,
        createdAt: o.createdAt
      })));
    }
  }, [ordini, filtri]);

  // Template di report disponibili
  const templateReport = [
    {
      id: 'vendite',
      nome: 'Report Vendite',
      descrizione: 'Analisi dettagliata delle vendite per periodo',
      icona: <ReportIcon />,
      colore: 'primary'
    },
    {
      id: 'prodotti',
      nome: 'Report Prodotti',
      descrizione: 'Statistiche per categoria di prodotti',
      icona: <ExcelIcon />,
      colore: 'secondary'
    },
    {
      id: 'clienti',
      nome: 'Report Clienti',
      descrizione: 'Analisi clienti e ordini ricorrenti',
      icona: <PeopleIcon />,
      colore: 'success'
    },
    {
      id: 'giornaliero',
      nome: 'Riepilogo Giornaliero',
      descrizione: 'Riepilogo completo per giornata',
      icona: <TodayIcon />,
      colore: 'warning'
    }
  ];

  // AGGIORNATO: Dati filtrati con debug migliorato
  const datiFiltrati = useMemo(() => {
    console.log('🔍 Inizio filtraggio ordini');
    console.log('Totale ordini da filtrare:', ordini.length);
    console.log('Periodo filtro:', filtri.dataInizio, '->', filtri.dataFine);
    
    let datiReport = ordini.filter(ordine => {
      // Estrai la data (usa dataRitiro se presente, altrimenti createdAt)
      const dataOrdineStr = (ordine.dataRitiro || ordine.createdAt || '').split('T')[0];
      
      console.log(`Ordine ${ordine.nomeCliente}:`, {
        dataRitiro: ordine.dataRitiro,
        createdAt: ordine.createdAt,
        dataUsata: dataOrdineStr
      });
      
      // Se non c'è data, includi l'ordine
      if (!dataOrdineStr) {
        console.log('⚠️ Ordine senza data:', ordine.nomeCliente);
        return true;
      }
      
      // Confronta direttamente le stringhe delle date
      const inRange = dataOrdineStr >= filtri.dataInizio && dataOrdineStr <= filtri.dataFine;
      
      if (!inRange) {
        console.log(`❌ Ordine fuori range: ${ordine.nomeCliente} - ${dataOrdineStr}`);
        return false;
      }

      // Filtro cliente
      if (filtri.cliente && !ordine.nomeCliente.toLowerCase().includes(filtri.cliente.toLowerCase())) {
        return false;
      }

      // Filtro stato
      if (filtri.stato !== 'tutti') {
        if (filtri.stato === 'completati' && !(ordine.completato || ordine.consegnato)) return false;
        if (filtri.stato === 'inLavorazione' && (ordine.completato || ordine.consegnato)) return false;
      }

      console.log(`✅ Ordine incluso: ${ordine.nomeCliente}`);
      return true;
    });

    console.log('📊 Risultato filtraggio:', datiReport.length, 'ordini');
    return datiReport;
  }, [ordini, filtri]);

  // Genera i dati del report in base al tipo
  const generaDatiReport = () => {
    const dati = {
      filtri: { ...filtri },
      periodo: `${formatDate(filtri.dataInizio)} - ${formatDate(filtri.dataFine)}`,
      generato: new Date().toLocaleString('it-IT'),
      totaleOrdini: datiFiltrati.length
    };

    switch (filtri.tipoReport) {
      case 'vendite':
        return generaReportVendite(dati);
      case 'prodotti':
        return generaReportProdotti(dati);
      case 'clienti':
        return generaReportClienti(dati);
      case 'giornaliero':
        return generaReportGiornaliero(dati);
      default:
        return dati;
    }
  };

  const generaReportVendite = (datiBase) => {
    const totaleValore = datiFiltrati.reduce((sum, ordine) => {
      return sum + calcolaTotaleOrdine(ordine);
    }, 0);

    const ticketMedio = datiFiltrati.length > 0 ? totaleValore / datiFiltrati.length : 0;

    // Vendite per giorno
    const venditePerGiorno = {};
    datiFiltrati.forEach(ordine => {
      const data = (ordine.dataRitiro || ordine.createdAt || '').split('T')[0];
      if (!data) return;
      
      if (!venditePerGiorno[data]) {
        venditePerGiorno[data] = { ordini: 0, valore: 0 };
      }
      venditePerGiorno[data].ordini++;
      venditePerGiorno[data].valore += calcolaTotaleOrdine(ordine);
    });

    return {
      ...datiBase,
      tipo: 'vendite',
      totaleValore,
      ticketMedio,
      venditePerGiorno: Object.entries(venditePerGiorno).map(([data, stats]) => ({
        data,
        ...stats
      })).sort((a, b) => new Date(a.data) - new Date(b.data))
    };
  };

  const generaReportProdotti = (datiBase) => {
    const prodotti = {};
    datiFiltrati.forEach(ordine => {
      if (ordine.prodotti && Array.isArray(ordine.prodotti)) {
        ordine.prodotti.forEach(prod => {
          const nome = prod.prodotto || prod.nome;
          if (nome) {
            if (!prodotti[nome]) {
              prodotti[nome] = { quantita: 0, valore: 0, ordini: 0 };
            }
            prodotti[nome].quantita += parseFloat(prod.quantita) || 0;
            prodotti[nome].valore += (parseFloat(prod.prezzo) || 0) * (parseFloat(prod.quantita) || 0);
            prodotti[nome].ordini++;
          }
        });
      }
    });

    const prodottiOrdinati = Object.entries(prodotti)
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.valore - a.valore);

    return {
      ...datiBase,
      tipo: 'prodotti',
      prodotti: prodottiOrdinati,
      totaleProdotti: prodottiOrdinati.length
    };
  };

  const generaReportClienti = (datiBase) => {
    const clienti = {};
    datiFiltrati.forEach(ordine => {
      const nome = ordine.nomeCliente;
      if (!clienti[nome]) {
        clienti[nome] = { ordini: 0, valore: 0, telefono: ordine.telefono };
      }
      clienti[nome].ordini++;
      clienti[nome].valore += calcolaTotaleOrdine(ordine);
    });

    const clientiOrdinati = Object.entries(clienti)
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.valore - a.valore);

    return {
      ...datiBase,
      tipo: 'clienti',
      clienti: clientiOrdinati,
      totaleClienti: clientiOrdinati.length
    };
  };

  const generaReportGiornaliero = (datiBase) => {
    // Usa la data selezionata o oggi
    const dataReport = filtri.dataFine || new Date().toISOString().split('T')[0];
    const ordiniGiorno = datiFiltrati.filter(ordine => 
      (ordine.dataRitiro || ordine.createdAt || '').startsWith(dataReport)
    );

    return {
      ...datiBase,
      tipo: 'giornaliero',
      data: dataReport,
      ordiniOggi: ordiniGiorno,
      totaleOggi: ordiniGiorno.reduce((sum, ordine) => sum + calcolaTotaleOrdine(ordine), 0)
    };
  };

  // AGGIORNATO: Funzione per calcolare il totale con più controlli
  const calcolaTotaleOrdine = (ordine) => {
    // Controlli multipli per il totale
    if (ordine.totale !== undefined && ordine.totale !== null) {
      return parseFloat(ordine.totale);
    }
    
    if (ordine.totaleOrdine !== undefined && ordine.totaleOrdine !== null) {
      return parseFloat(ordine.totaleOrdine);
    }
    
    // Calcola dai prodotti
    if (ordine.prodotti && Array.isArray(ordine.prodotti)) {
      const totale = ordine.prodotti.reduce((sum, prod) => {
        const prezzo = parseFloat(prod.prezzo) || 0;
        const quantita = parseFloat(prod.quantita) || 0;
        return sum + (prezzo * quantita);
      }, 0);
      
      console.log(`Totale calcolato per ${ordine.nomeCliente}:`, totale);
      return totale;
    }
    
    console.warn(`⚠️ Impossibile calcolare totale per ordine di ${ordine.nomeCliente}`);
    return 0;
  };

  const esportaPDF = async () => {
    setCaricamento(true);
    setErrore('');
    try {
      const datiReport = generaDatiReport();
      await generaPDF(datiReport);
    } catch (error) {
      setErrore('Errore durante l\'export PDF: ' + error.message);
    } finally {
      setCaricamento(false);
    }
  };

  const esportaExcel = async () => {
    setCaricamento(true);
    setErrore('');
    try {
      const datiReport = generaDatiReport();
      await generaExcel(datiReport);
    } catch (error) {
      setErrore('Errore durante l\'export Excel: ' + error.message);
    } finally {
      setCaricamento(false);
    }
  };

  const esportaCSV = async () => {
    setCaricamento(true);
    setErrore('');
    try {
      const datiReport = generaDatiReport();
      await generaCSV(datiReport);
    } catch (error) {
      setErrore('Errore durante l\'export CSV: ' + error.message);
    } finally {
      setCaricamento(false);
    }
  };

  const stampaReport = () => {
    const datiReport = generaDatiReport();
    setReportSelezionato(datiReport);
    setDialogAnteprima(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const handleFiltroChange = (campo, valore) => {
    console.log(`Cambio filtro ${campo}:`, valore);
    setFiltri(prev => ({
      ...prev,
      [campo]: valore
    }));
  };

  // NUOVO: Formatta la data per la visualizzazione
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr.split('T')[0];
    }
  };

  // Pulsante reset filtri
  const resetFiltri = () => {
    setFiltri({
      dataInizio: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dataFine: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tipoReport: 'vendite',
      categoria: 'tutte',
      cliente: '',
      stato: 'tutti'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sistema Report
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Genera e esporta report dettagliati sulle vendite, prodotti e clienti
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {ordini.length} ordini totali disponibili
        </Typography>
      </Box>

      {/* Debug info (rimuovere in produzione) */}
      {process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Debug: {ordini.length} ordini totali, {datiFiltrati.length} dopo filtro
        </Alert>
      )}

      {/* Filtri */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Filtri Report</Typography>
          <Button size="small" onClick={resetFiltri}>Reset Filtri</Button>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Data Inizio"
              type="date"
              value={filtri.dataInizio}
              onChange={(e) => handleFiltroChange('dataInizio', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Data Fine"
              type="date"
              value={filtri.dataFine}
              onChange={(e) => handleFiltroChange('dataFine', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo Report</InputLabel>
              <Select
                value={filtri.tipoReport}
                label="Tipo Report"
                onChange={(e) => handleFiltroChange('tipoReport', e.target.value)}
              >
                <MenuItem value="vendite">Report Vendite</MenuItem>
                <MenuItem value="prodotti">Report Prodotti</MenuItem>
                <MenuItem value="clienti">Report Clienti</MenuItem>
                <MenuItem value="giornaliero">Riepilogo Giornaliero</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Stato Ordini</InputLabel>
              <Select
                value={filtri.stato}
                label="Stato Ordini"
                onChange={(e) => handleFiltroChange('stato', e.target.value)}
              >
                <MenuItem value="tutti">Tutti</MenuItem>
                <MenuItem value="completati">Completati</MenuItem>
                <MenuItem value="inLavorazione">In Lavorazione</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Cerca Cliente"
              value={filtri.cliente}
              onChange={(e) => handleFiltroChange('cliente', e.target.value)}
              placeholder="Digita il nome del cliente..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Statistiche rapide */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ordini nel Periodo
              </Typography>
              <Typography variant="h4">
                {datiFiltrati.length}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                su {ordini.length} totali
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Valore Totale
              </Typography>
              <Typography variant="h4">
                {formatCurrency(datiFiltrati.reduce((sum, ordine) => 
                  sum + calcolaTotaleOrdine(ordine), 0
                ))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ticket Medio
              </Typography>
              <Typography variant="h4">
                {formatCurrency(datiFiltrati.length > 0 ? 
                  datiFiltrati.reduce((sum, ordine) => sum + calcolaTotaleOrdine(ordine), 0) / datiFiltrati.length : 0
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Clienti Unici
              </Typography>
              <Typography variant="h4">
                {new Set(datiFiltrati.map(o => o.nomeCliente)).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Azioni Report */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Genera Report
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<PreviewIcon />}
            onClick={stampaReport}
            disabled={caricamento || datiFiltrati.length === 0}
          >
            Anteprima ({datiFiltrati.length})
          </Button>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={esportaPDF}
            disabled={caricamento || datiFiltrati.length === 0}
          >
            Esporta PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExcelIcon />}
            onClick={esportaExcel}
            disabled={caricamento || datiFiltrati.length === 0}
          >
            Esporta Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={esportaCSV}
            disabled={caricamento || datiFiltrati.length === 0}
          >
            Esporta CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            disabled={caricamento}
          >
            Stampa
          </Button>
        </Box>
        {caricamento && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Generazione report in corso...</Typography>
          </Box>
        )}
        {datiFiltrati.length === 0 && ordini.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Nessun ordine trovato con i filtri selezionati. Prova ad ampliare il periodo di ricerca o resetta i filtri.
          </Alert>
        )}
      </Paper>

      {/* Tabella dati filtrati */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dati nel Periodo Selezionato
        </Typography>
        {datiFiltrati.length === 0 ? (
          <Alert severity="info">
            Nessun ordine trovato nel periodo selezionato
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Prodotti</TableCell>
                    <TableCell align="right">Totale</TableCell>
                    <TableCell>Stato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datiFiltrati.slice(0, 10).map((ordine, index) => (
                    <TableRow key={ordine._id || ordine.id || index}>
                      <TableCell>
                        {formatDate(ordine.dataRitiro || ordine.createdAt)}
                      </TableCell>
                      <TableCell>{ordine.nomeCliente}</TableCell>
                      <TableCell>
                        {ordine.prodotti ? 
                          ordine.prodotti.map(p => `${p.prodotto || p.nome} (${p.quantita})`).join(', ').substring(0, 50) + 
                          (ordine.prodotti.map(p => `${p.prodotto || p.nome} (${p.quantita})`).join(', ').length > 50 ? '...' : '') :
                          'N/A'
                        }
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(calcolaTotaleOrdine(ordine))}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ordine.completato || ordine.consegnato ? 'Completato' : 'In Lavorazione'}
                          color={ordine.completato || ordine.consegnato ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {datiFiltrati.length > 10 && (
              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
                Mostrati i primi 10 risultati di {datiFiltrati.length} totali
              </Typography>
            )}
          </>
        )}
      </Paper>

      {/* Dialog Anteprima */}
      <Dialog 
        open={dialogAnteprima} 
        onClose={() => setDialogAnteprima(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Anteprima Report
            <IconButton onClick={() => setDialogAnteprima(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {reportSelezionato && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Report {reportSelezionato.tipo}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Periodo: {reportSelezionato.periodo} | Generato: {reportSelezionato.generato}
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {/* Contenuto specifico per tipo di report */}
              {reportSelezionato.tipo === 'vendite' && (
                <Box>
                  <Typography variant="h6">Riepilogo Vendite</Typography>
                  <Typography>Totale Ordini: {reportSelezionato.totaleOrdini}</Typography>
                  <Typography>Valore Totale: {formatCurrency(reportSelezionato.totaleValore)}</Typography>
                  <Typography>Ticket Medio: {formatCurrency(reportSelezionato.ticketMedio)}</Typography>
                  
                  {reportSelezionato.venditePerGiorno && reportSelezionato.venditePerGiorno.length > 0 && (
                    <>
                      <Typography variant="h6" sx={{ mt: 2 }}>Vendite per Giorno</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Data</TableCell>
                              <TableCell align="right">Ordini</TableCell>
                              <TableCell align="right">Valore</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {reportSelezionato.venditePerGiorno.map((giorno) => (
                              <TableRow key={giorno.data}>
                                <TableCell>{formatDate(giorno.data)}</TableCell>
                                <TableCell align="right">{giorno.ordini}</TableCell>
                                <TableCell align="right">{formatCurrency(giorno.valore)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </Box>
              )}
              
              {reportSelezionato.tipo === 'prodotti' && (
                <Box>
                  <Typography variant="h6">Top Prodotti per Valore</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Prodotto</TableCell>
                          <TableCell align="right">Quantità</TableCell>
                          <TableCell align="right">Ordini</TableCell>
                          <TableCell align="right">Valore</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(reportSelezionato.prodotti || []).slice(0, 15).map((prodotto) => (
                          <TableRow key={prodotto.nome}>
                            <TableCell>{prodotto.nome}</TableCell>
                            <TableCell align="right">{prodotto.quantita}</TableCell>
                            <TableCell align="right">{prodotto.ordini}</TableCell>
                            <TableCell align="right">{formatCurrency(prodotto.valore)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              
              {reportSelezionato.tipo === 'clienti' && (
                <Box>
                  <Typography variant="h6">Top Clienti per Valore</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Cliente</TableCell>
                          <TableCell>Telefono</TableCell>
                          <TableCell align="right">Ordini</TableCell>
                        <TableCell align="right">Valore Totale</TableCell>
                       </TableRow>
                     </TableHead>
                     <TableBody>
                       {(reportSelezionato.clienti || []).slice(0, 20).map((cliente) => (
                         <TableRow key={cliente.nome}>
                           <TableCell>{cliente.nome}</TableCell>
                           <TableCell>{cliente.telefono || 'N/A'}</TableCell>
                           <TableCell align="right">{cliente.ordini}</TableCell>
                           <TableCell align="right">{formatCurrency(cliente.valore)}</TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </TableContainer>
               </Box>
             )}
             
             {reportSelezionato.tipo === 'giornaliero' && (
               <Box>
                 <Typography variant="h6">Riepilogo del {formatDate(reportSelezionato.data)}</Typography>
                 <Typography>Ordini: {reportSelezionato.ordiniOggi?.length || 0}</Typography>
                 <Typography>Valore Totale: {formatCurrency(reportSelezionato.totaleOggi)}</Typography>
                 
                 {reportSelezionato.ordiniOggi && reportSelezionato.ordiniOggi.length > 0 && (
                   <>
                     <Typography variant="h6" sx={{ mt: 2 }}>Dettaglio Ordini</Typography>
                     <TableContainer>
                       <Table size="small">
                         <TableHead>
                           <TableRow>
                             <TableCell>Cliente</TableCell>
                             <TableCell>Telefono</TableCell>
                             <TableCell>Prodotti</TableCell>
                             <TableCell align="right">Totale</TableCell>
                           </TableRow>
                         </TableHead>
                         <TableBody>
                           {reportSelezionato.ordiniOggi.map((ordine, index) => (
                             <TableRow key={ordine._id || index}>
                               <TableCell>{ordine.nomeCliente}</TableCell>
                               <TableCell>{ordine.telefono || 'N/A'}</TableCell>
                               <TableCell>
                                 {ordine.prodotti ? 
                                   ordine.prodotti.map(p => `${p.prodotto || p.nome} (${p.quantita})`).join(', ') :
                                   'N/A'
                                 }
                               </TableCell>
                               <TableCell align="right">
                                 {formatCurrency(calcolaTotaleOrdine(ordine))}
                               </TableCell>
                             </TableRow>
                           ))}
                         </TableBody>
                       </Table>
                     </TableContainer>
                   </>
                 )}
               </Box>
             )}
           </Box>
         )}
       </DialogContent>
       <DialogActions>
         <Button onClick={() => setDialogAnteprima(false)}>Chiudi</Button>
         <Button variant="contained" onClick={() => window.print()}>
           Stampa
         </Button>
       </DialogActions>
     </Dialog>

     {/* Errori */}
     {errore && (
       <Alert severity="error" sx={{ mt: 2 }} onClose={() => setErrore('')}>
         {errore}
       </Alert>
     )}
   </Box>
 );
};

export default Report;