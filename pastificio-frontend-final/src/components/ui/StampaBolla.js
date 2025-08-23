'use client'
import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Table, TableBody, TableCell, TableHead, TableRow, Paper, 
  Typography, Box 
} from '@mui/material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function StampaBolla({ ordine, open, onClose }) {
  const componentRef = React.useRef();

  const stampaBolla = () => {
    const contenuto = componentRef.current;
    const stampaPagina = window.open('', '_blank');
    stampaPagina.document.write(`
      <html>
        <head>
          <title>Bolla Ordine - ${ordine.nomeCliente}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            .header { margin-bottom: 30px; }
            .footer { margin-top: 30px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${contenuto.innerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    stampaPagina.document.close();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Bolla Ordine</DialogTitle>
      <DialogContent>
        <div ref={componentRef}>
          <Box className="header">
            <Typography variant="h5">Pastificio Nonna Claudia</Typography>
            <Typography variant="subtitle1">Bolla Ordine #{ordine.id}</Typography>
            <Typography variant="body2">
              Data: {format(new Date(ordine.dataRitiro), 'dd MMMM yyyy', { locale: it })}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Dettagli Cliente</Typography>
            <Typography>Nome: {ordine.nomeCliente}</Typography>
            <Typography>Telefono: {ordine.telefono}</Typography>
            <Typography>Ritiro: {ordine.oraRitiro}</Typography>
            {ordine.daViaggio && <Typography>Da Viaggio: Sì</Typography>}
          </Box>

          <Typography variant="h6">Prodotti</Typography>
          <Paper sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Prodotto</TableCell>
                  <TableCell align="right">Quantità</TableCell>
                  <TableCell align="right">Prezzo Unit.</TableCell>
                  <TableCell align="right">Totale</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordine.prodotti.map((prod, index) => (
                  <TableRow key={index}>
                    <TableCell>{prod.prodotto}</TableCell>
                    <TableCell align="right">
                      {prod.quantita} {prod.unita}
                    </TableCell>
                    <TableCell align="right">
                      €{(prod.prezzo / prod.quantita).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      €{prod.prezzo.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <strong>Totale</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>
                      €{ordine.prodotti.reduce((sum, p) => sum + p.prezzo, 0).toFixed(2)}
                    </strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          {ordine.note && (
            <Box className="footer">
              <Typography variant="h6">Note</Typography>
              <Typography>{ordine.note}</Typography>
            </Box>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
        <Button variant="contained" onClick={stampaBolla}>
          Stampa
        </Button>
      </DialogActions>
    </Dialog>
  );
}