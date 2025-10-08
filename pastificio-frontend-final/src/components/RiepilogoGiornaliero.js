// components/RiepilogoGiornaliero.js - CON COLONNE MULTI E VIAGGIO
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';

export default function RiepilogoGiornaliero({ open, onClose, ordini }) {
  const [dataSelezionata, setDataSelezionata] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Filtra ordini per data selezionata
  const ordiniFiltrati = useMemo(() => {
    return ordini.filter(ordine => {
      const dataOrdine = ordine.dataRitiro || ordine.createdAt || '';
      return dataOrdine.startsWith(dataSelezionata);
    }).sort((a, b) => {
      const oraA = a.oraRitiro || '00:00';
      const oraB = b.oraRitiro || '00:00';
      return oraA.localeCompare(oraB);
    });
  }, [ordini, dataSelezionata]);

  // Raggruppa ordini per categoria prodotto
  const ordiniPerCategoria = useMemo(() => {
    const categorie = {
      'Ravioli': [],
      'Dolci': [],
      'Panadas': [],
      'Altro': []
    };

    ordiniFiltrati.forEach(ordine => {
      const prodottiPerCategoria = {};

      // Raggruppa prodotti dell'ordine per categoria
      ordine.prodotti?.forEach(prodotto => {
        // Normalizza categoria
        let categoria = 'Altro';
        const nomeProdotto = prodotto.nome?.toLowerCase() || '';
        
        if (nomeProdotto.includes('ravioli') || nomeProdotto.includes('culurgiones')) {
          categoria = 'Ravioli';
        } else if (nomeProdotto.includes('panada')) {
          categoria = 'Panadas';
        } else if (nomeProdotto.includes('pardulas') || nomeProdotto.includes('dolci') || 
                   nomeProdotto.includes('sebadas') || nomeProdotto.includes('amaretti') ||
                   nomeProdotto.includes('bianchini') || nomeProdotto.includes('gueffus') ||
                   nomeProdotto.includes('torta') || nomeProdotto.includes('zeppole')) {
          categoria = 'Dolci';
        }

        if (!prodottiPerCategoria[categoria]) {
          prodottiPerCategoria[categoria] = [];
        }
        prodottiPerCategoria[categoria].push(prodotto);
      });

      // Aggiungi ordine a ogni categoria in cui ha prodotti
      Object.entries(prodottiPerCategoria).forEach(([categoria, prodottiCategoria]) => {
        if (categorie[categoria]) {
          categorie[categoria].push({
            ...ordine,
            prodottiCategoria: prodottiCategoria,
            altreCategorie: Object.keys(prodottiPerCategoria).filter(c => c !== categoria)
          });
        }
      });
    });

    return categorie;
  }, [ordiniFiltrati]);

  // Calcola totali per categoria
  const calcolaTotaliCategoria = (ordiniCategoria) => {
    const totali = {};

    ordiniCategoria.forEach(ordine => {
      ordine.prodottiCategoria?.forEach(prodotto => {
        const chiave = prodotto.nome;
        if (!totali[chiave]) {
          totali[chiave] = {
            nome: prodotto.nome,
            quantitaTotale: 0,
            unita: prodotto.unita || 'Kg',
            kg: 0,
            pezzi: 0
          };
        }

        totali[chiave].quantitaTotale += prodotto.quantita || 0;
        
        if (prodotto.dettagliCalcolo) {
          totali[chiave].kg += prodotto.dettagliCalcolo.kg || 0;
          totali[chiave].pezzi += prodotto.dettagliCalcolo.pezzi || 0;
        }
      });
    });

    return Object.values(totali);
  };

  const stampa = () => {
    window.print();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      fullScreen
    >
      <DialogTitle className="no-print">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <CalendarIcon />
            <Typography variant="h6">Riepilogo Giornaliero Stampabile</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <TextField
              type="date"
              value={dataSelezionata}
              onChange={(e) => setDataSelezionata(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={stampa}
            >
              Stampa
            </Button>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box className="printable-content">
          {/* Riepilogo Generale - Prima Pagina */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, pageBreakAfter: 'always' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" gutterBottom>
                🍝 PASTIFICIO NONNA CLAUDIA
              </Typography>
              <Typography variant="h5" color="primary">
                Riepilogo Produzione Giornaliera
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {new Date(dataSelezionata).toLocaleDateString('it-IT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                  <Typography variant="h3">{ordiniFiltrati.length}</Typography>
                  <Typography variant="subtitle1">Ordini Totali</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                  <Typography variant="h3">
                    €{ordiniFiltrati.reduce((sum, o) => sum + (o.totale || 0), 0).toFixed(2)}
                  </Typography>
                  <Typography variant="subtitle1">Incasso Totale</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                  <Typography variant="h3">
                    {ordiniFiltrati.filter(o => o.daViaggio).length}
                  </Typography>
                  <Typography variant="subtitle1">Da Viaggio</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* Pagine per Categoria */}
          {Object.entries(ordiniPerCategoria).map(([categoria, ordiniCategoria]) => {
            if (ordiniCategoria.length === 0) return null;

            const totaliCategoria = calcolaTotaliCategoria(ordiniCategoria);

            return (
              <Paper 
                key={categoria} 
                elevation={0} 
                sx={{ p: 3, mb: 3, pageBreakAfter: 'always' }}
              >
                {/* Intestazione Pagina Categoria */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" gutterBottom>
                    📋 {categoria.toUpperCase()}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {new Date(dataSelezionata).toLocaleDateString('it-IT')} - {ordiniCategoria.length} ordini
                  </Typography>
                </Box>

                {/* Tabella Ordini Categoria */}
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.200' }}>
                        <TableCell><strong>ORA</strong></TableCell>
                        <TableCell><strong>CLIENTE</strong></TableCell>
                        <TableCell><strong>PRODOTTO</strong></TableCell>
                        <TableCell align="center"><strong>QUANTITÀ</strong></TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <strong>MULTI</strong>
                            <ArrowIcon fontSize="small" />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <strong>VIAGGIO</strong>
                            <CheckIcon fontSize="small" />
                          </Box>
                        </TableCell>
                        <TableCell><strong>NOTE</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ordiniCategoria.map((ordine, index) => {
                        const prodottiAltreCategorie = ordine.altreCategorie.length > 0;
                        
                        return ordine.prodottiCategoria?.map((prodotto, pIdx) => (
                          <TableRow 
                            key={`${ordine._id || ordine.id}-${pIdx}`}
                            sx={{ 
                              borderLeft: ordine.daViaggio ? '4px solid orange' : 'none',
                              bgcolor: pIdx === 0 && index % 2 === 0 ? 'grey.50' : 'white'
                            }}
                          >
                            {/* Ora - solo prima riga per ordine */}
                            {pIdx === 0 ? (
                              <TableCell rowSpan={ordine.prodottiCategoria.length}>
                                <Typography variant="h6">
                                  {ordine.oraRitiro || 'N/D'}
                                </Typography>
                              </TableCell>
                            ) : null}

                            {/* Cliente - solo prima riga per ordine */}
                            {pIdx === 0 ? (
                              <TableCell rowSpan={ordine.prodottiCategoria.length}>
                                <Typography variant="body1" fontWeight="bold">
                                  {ordine.nomeCliente}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {ordine.telefono}
                                </Typography>
                              </TableCell>
                            ) : null}

                            {/* Prodotto */}
                            <TableCell>
                              <Typography variant="body2">
                                {prodotto.nome}
                              </Typography>
                            </TableCell>

                            {/* Quantità */}
                            <TableCell align="center">
                              <Typography variant="body2">
                                {prodotto.dettagliCalcolo?.dettagli || 
                                 `${prodotto.quantita} ${prodotto.unita}`}
                              </Typography>
                            </TableCell>

                            {/* ✅ MULTI-PRODOTTO - solo prima riga */}
                            {pIdx === 0 ? (
                              <TableCell align="center" rowSpan={ordine.prodottiCategoria.length}>
                                {prodottiAltreCategorie && (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                    <ArrowIcon color="warning" sx={{ fontSize: 32, fontWeight: 'bold' }} />
                                    <Typography variant="caption" color="warning.main" fontWeight="bold">
                                      {ordine.altreCategorie.join(', ')}
                                    </Typography>
                                  </Box>
                                )}
                              </TableCell>
                            ) : null}

                            {/* ✅ DA VIAGGIO - solo prima riga */}
                            {pIdx === 0 ? (
                              <TableCell align="center" rowSpan={ordine.prodottiCategoria.length}>
                                {ordine.daViaggio && (
                                  <CheckIcon color="success" sx={{ fontSize: 32 }} />
                                )}
                              </TableCell>
                            ) : null}

                            {/* Note - solo prima riga */}
                            {pIdx === 0 ? (
                              <TableCell rowSpan={ordine.prodottiCategoria.length}>
                                <Typography variant="caption">
                                  {ordine.note || '-'}
                                </Typography>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        ));
                      })}

                      {/* Riga Totali Categoria */}
                      <TableRow sx={{ bgcolor: 'success.light', fontWeight: 'bold' }}>
                        <TableCell colSpan={2}>
                          <Typography variant="h6">TOTALI {categoria.toUpperCase()}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">PRODOTTO</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="bold">QUANTITÀ TOTALE</Typography>
                        </TableCell>
                        <TableCell colSpan={3}></TableCell>
                      </TableRow>
                      {totaliCategoria.map((totale, idx) => (
                        <TableRow key={idx} sx={{ bgcolor: 'success.50' }}>
                          <TableCell colSpan={2}></TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {totale.nome}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="bold">
                              {totale.kg > 0 && `${totale.kg.toFixed(2)} kg`}
                              {totale.kg > 0 && totale.pezzi > 0 && ' ≈ '}
                              {totale.pezzi > 0 && `${totale.pezzi} pz`}
                              {totale.kg === 0 && totale.pezzi === 0 && `${totale.quantitaTotale} ${totale.unita}`}
                            </Typography>
                          </TableCell>
                          <TableCell colSpan={3}></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            );
          })}

          {/* Messaggio se nessun ordine */}
          {ordiniFiltrati.length === 0 && (
            <Paper sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h5" color="text.secondary">
                Nessun ordine per {new Date(dataSelezionata).toLocaleDateString('it-IT')}
              </Typography>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions className="no-print">
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>

      {/* Stili per stampa */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
          
          .printable-content {
            width: 100%;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </Dialog>
  );
}