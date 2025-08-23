// components/Report/ReportPreview.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Grid,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const ReportPreview = ({ open, onClose, reportType, reportData }) => {
  const [loading, setLoading] = useState(false);

  const renderDailyReport = () => {
    if (!reportData) return null;

    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" align="center" gutterBottom>
          REPORT GIORNALIERO PRODUZIONE
        </Typography>
        
        <Typography variant="subtitle1" align="center" gutterBottom>
          {new Date(reportData.data).toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {reportData.totaleOrdini}
              </Typography>
              <Typography variant="body2">Ordini Totali</Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                €{reportData.valoreTotale}
              </Typography>
              <Typography variant="body2">Valore Totale</Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                €{reportData.ticketMedio || '0'}
              </Typography>
              <Typography variant="body2">Ticket Medio</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Dettaglio Ordini
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Ora</TableCell>
                <TableCell>Prodotti</TableCell>
                <TableCell align="right">Totale</TableCell>
                <TableCell>Stato</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.ordini?.map((ordine, index) => (
                <TableRow key={index}>
                  <TableCell>{ordine.nomeCliente}</TableCell>
                  <TableCell>{ordine.oraRitiro}</TableCell>
                  <TableCell>{ordine.numeroProdotti} prodotti</TableCell>
                  <TableCell align="right">€{ordine.totale}</TableCell>
                  <TableCell>
                    <Chip 
                      label={ordine.stato} 
                      size="small"
                      color={ordine.stato === 'completato' ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {reportData.riepilogoCategorie && (
          <>
            <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
              Riepilogo per Categoria
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(reportData.riepilogoCategorie).map(([categoria, dati]) => (
                <Grid item xs={12} sm={6} md={4} key={categoria}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="primary">
                      {categoria}
                    </Typography>
                    <Typography variant="body2">
                      Quantità: {dati.quantita}
                    </Typography>
                    <Typography variant="body2">
                      Valore: €{dati.valore}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>
    );
  };

  const renderOrderReceipt = () => {
    if (!reportData) return null;

    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" align="center" gutterBottom>
          RICEVUTA ORDINE
        </Typography>

        <Box sx={{ mt: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dati Cliente
          </Typography>
          <Typography>Nome: {reportData.nomeCliente}</Typography>
          <Typography>Telefono: {reportData.telefono}</Typography>
          <Typography>
            Data Ritiro: {new Date(reportData.dataRitiro).toLocaleDateString('it-IT')}
          </Typography>
          <Typography>Ora Ritiro: {reportData.oraRitiro}</Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Prodotti Ordinati
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Prodotto</TableCell>
                <TableCell align="center">Quantità</TableCell>
                <TableCell align="right">Prezzo</TableCell>
                <TableCell align="right">Subtotale</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.prodotti?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.prodotto}</TableCell>
                  <TableCell align="center">
                    {item.quantita} {item.unita}
                  </TableCell>
                  <TableCell align="right">
                    €{item.prezzo}/{item.unita}
                  </TableCell>
                  <TableCell align="right">
                    €{(item.quantita * item.prezzo).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="right">
                  <Typography variant="h6">Totale:</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="h6">
                    €{reportData.totale?.toFixed(2)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {reportData.note && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Note:
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {reportData.note}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" align="center" color="textSecondary">
            Firma per accettazione: _______________________
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderContent = () => {
    switch (reportType) {
      case 'daily':
        return renderDailyReport();
      case 'order':
        return renderOrderReceipt();
      default:
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">
              Anteprima non disponibile per questo tipo di report
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        Anteprima Report
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderContent()
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Chiudi
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
        >
          Stampa
        </Button>
        <Button 
          variant="contained" 
          startIcon={<DownloadIcon />}
          onClick={() => {
            // Logica per download PDF
          }}
        >
          Scarica PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportPreview;