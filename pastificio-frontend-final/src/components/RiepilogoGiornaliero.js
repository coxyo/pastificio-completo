// components/RiepilogoGiornaliero.js - MINIMAL COMPATTO FINALE
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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon
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

        categorie[categoria].push({
          prodotto: prodotto.nome,
          quantita: prodotto.quantita,
          unita: prodotto.unita || 'Kg',
          dettagli: prodotto.dettagliCalcolo?.dettagli || `${prodotto.quantita} ${prodotto.unita || 'Kg'}`,
          dettagliCalcolo: prodotto.dettagliCalcolo,
          prezzo: prodotto.prezzo || 0,
          orario: ordine.oraRitiro || 'N/D',
          cliente: ordine.nomeCliente,
          telefono: ordine.telefono,
          daViaggio: ordine.daViaggio || false,
          note: ordine.note || ''
        });
      });
    });

    return categorie;
  }, [ordiniFiltrati]);

  // Calcola totali per categoria
  const calcolaTotaliCategoria = (righeCategoria) => {
    const totali = {};
    let totaleEuroCategoria = 0;

    righeCategoria.forEach(riga => {
      const chiave = riga.prodotto;
      
      // Somma euro
      totaleEuroCategoria += riga.prezzo || 0;
      
      if (!totali[chiave]) {
        totali[chiave] = {
          nome: riga.prodotto,
          kg: 0,
          pezzi: 0,
          unita: riga.unita
        };
      }
      
      // Se il dettaglio calcolo ha kg e pezzi separati, usali
      if (riga.dettagliCalcolo && riga.dettagliCalcolo.kg !== undefined) {
        totali[chiave].kg += riga.dettagliCalcolo.kg || 0;
        totali[chiave].pezzi += riga.dettagliCalcolo.pezzi || 0;
      } else {
        // Altrimenti usa la quantità standard
        if (riga.unita === 'Kg') {
          totali[chiave].kg += riga.quantita || 0;
        } else {
          totali[chiave].pezzi += riga.quantita || 0;
        }
      }
    });

    return {
      prodotti: Object.values(totali),
      totaleEuro: totaleEuroCategoria
    };
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
          {/* Intestazione Generale */}
          <Box sx={{ textAlign: 'center', mb: 2, pageBreakAfter: 'avoid' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              🍝 PASTIFICIO NONNA CLAUDIA
            </Typography>
            <Typography variant="h6">
              Riepilogo Produzione {new Date(dataSelezionata).toLocaleDateString('it-IT', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {ordiniFiltrati.length} ordini totali
            </Typography>
            <Typography variant="h6" sx={{ mt: 1, color: 'success.main', fontWeight: 'bold' }}>
              Incasso Totale: €{ordiniFiltrati.reduce((sum, o) => sum + (o.totale || 0), 0).toFixed(2)}
            </Typography>
          </Box>

          {/* Tabelle per Categoria */}
          {Object.entries(ordiniPerCategoria).map(([categoria, righeCategoria]) => {
            if (righeCategoria.length === 0) return null;

            const totaliCategoria = calcolaTotaliCategoria(righeCategoria);

            return (
              <Box key={categoria} sx={{ mb: 4, pageBreakInside: 'avoid' }}>
                {/* Titolo Categoria */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white', 
                    p: 1, 
                    mb: 1,
                    fontWeight: 'bold'
                  }}
                >
                  {categoria.toUpperCase()}
                </Typography>

                {/* Tabella Compatta */}
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small" sx={{ fontSize: '0.75rem' }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.200' }}>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.5 }}>Prodotto</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.5 }} align="center">Q.tà</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.5 }} align="right">Prezzo</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.5 }} align="center">Orario</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.5 }}>Nome Cliente</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.5 }}>Telefono</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.5 }} align="center">Viaggio</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {righeCategoria.map((riga, index) => (
                        <TableRow 
                          key={index}
                          sx={{ 
                            '&:nth-of-type(odd)': { bgcolor: 'grey.50' },
                            borderLeft: riga.daViaggio ? '3px solid orange' : 'none'
                          }}
                        >
                          <TableCell sx={{ fontSize: '0.7rem', py: 0.3 }}>{riga.prodotto}</TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', py: 0.3 }} align="center">{riga.dettagli}</TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', py: 0.3 }} align="right">
                            €{(riga.prezzo || 0).toFixed(2)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', py: 0.3, fontWeight: 'bold' }} align="center">
                            {riga.orario}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', py: 0.3 }}>{riga.cliente}</TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', py: 0.3 }}>{riga.telefono}</TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', py: 0.3 }} align="center">
                            {riga.daViaggio ? '✓' : ''}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Riga Totali */}
                      <TableRow sx={{ bgcolor: 'success.light', fontWeight: 'bold' }}>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.5, fontWeight: 'bold' }}>
                          TOTALI {categoria.toUpperCase()}
                        </TableCell>
                        <TableCell colSpan={4} sx={{ fontSize: '0.7rem', py: 0.5 }}>
                          {totaliCategoria.prodotti.map((totale, idx) => {
                            let displayText = '';
                            
                            if (totale.kg > 0 && totale.pezzi > 0) {
                              // Entrambi presenti
                              displayText = `${totale.kg.toFixed(2)} kg ≈ ${totale.pezzi} pz`;
                            } else if (totale.kg > 0) {
                              // Solo kg
                              displayText = `${totale.kg.toFixed(2)} kg`;
                            } else if (totale.pezzi > 0) {
                              // Solo pezzi
                              displayText = `${totale.pezzi} pz`;
                            }
                            
                            return (
                              <span key={idx} style={{ marginRight: '15px' }}>
                                <strong>{totale.nome}:</strong> {displayText}
                              </span>
                            );
                          })}
                        </TableCell>
                        <TableCell colSpan={2} align="right" sx={{ fontSize: '0.75rem', py: 0.5, fontWeight: 'bold' }}>
                          Totale €: {totaliCategoria.totaleEuro.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}

          {/* Messaggio se nessun ordine */}
          {ordiniFiltrati.length === 0 && (
            <Paper sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
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
            margin: 10mm;
          }
          
          body {
            font-size: 9pt;
          }
          
          .printable-content {
            width: 100%;
          }
          
          table {
            page-break-inside: avoid;
            font-size: 8pt !important;
          }
          
          tr {
            page-break-inside: avoid;
          }
          
          th, td {
            padding: 2px 4px !important;
            font-size: 8pt !important;
          }
        }
        
        /* Stili schermo */
        @media screen {
          table {
            font-size: 0.75rem;
          }
          
          th, td {
            padding: 4px 8px;
          }
        }
      `}</style>
    </Dialog>
  );
}