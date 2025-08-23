'use client'
import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Table, TableBody, TableCell, TableHead, TableRow, Paper, 
  Typography, Box 
} from '@mui/material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function StampaRiepilogo({ ordini, data, open, onClose }) {
  const componentRef = React.useRef();

  const stampaRiepilogo = () => {
    const contenuto = componentRef.current;
    const stampaPagina = window.open('', '_blank');
    stampaPagina.document.write(`
      <html>
        <head>
          <title>Riepilogo Ordini - ${format(new Date(data), 'dd MMMM yyyy', { locale: it })}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            .header { margin-bottom: 30px; }
            .categoria { margin-top: 30px; }
            @media print {
              button { display: none; }
              .page-break { page-break-before: always; }
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

  // Raggruppa gli ordini per categoria
  const ordiniPerCategoria = ordini.reduce((acc, ordine) => {
    ordine.prodotti.forEach(prod => {
      const categoria = prod.categoria || 'Altro';
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      if (!acc[categoria].includes(ordine)) {
        acc[categoria].push(ordine);
      }
    });
    return acc;
  }, {});

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Riepilogo Ordini Giornaliero</DialogTitle>
      <DialogContent>
        <div ref={componentRef}>
          <Box className="header">
            <Typography variant="h5">Pastificio Nonna Claudia</Typography>
            <Typography variant="subtitle1">
              Riepilogo Ordini del {format(new Date(data), 'dd MMMM yyyy', { locale: it })}
            </Typography>
          </Box>

          {Object.entries(ordiniPerCategoria).map(([categoria, ordini], index) => (
            <Box key={categoria} className={index > 0 ? 'categoria page-break' : 'categoria'}>
              <Typography variant="h6" gutterBottom>{categoria}</Typography>
              <Paper>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ora</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Prodotti</TableCell>
                      <TableCell>Note</TableCell>
                      <TableCell align="right">Quantità</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ordini
                      .sort((a, b) => a.oraRitiro.localeCompare(b.oraRitiro))
                      .map((ordine, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{ordine.oraRitiro}</TableCell>
                          <TableCell>
                            {ordine.nomeCliente}
                            <br />
                            {ordine.telefono}
                            {ordine.daViaggio && (
                              <Typography variant="caption" color="error">
                                <br />DA VIAGGIO
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {ordine.prodotti
                              .filter(p => (!p.categoria && categoria === 'Altro') || p.categoria === categoria)
                              .map((p, i) => (
                                <div key={i}>
                                  {p.prodotto}: {p.quantita} {p.unita}
                                </div>
                              ))}
                          </TableCell>
                          <TableCell>{ordine.note}</TableCell>
                          <TableCell align="right">
                            {ordine.prodotti
                              .filter(p => (!p.categoria && categoria === 'Altro') || p.categoria === categoria)
                              .reduce((sum, p) => sum + p.quantita, 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          ))}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
        <Button variant="contained" onClick={stampaRiepilogo}>
          Stampa
        </Button>
      </DialogActions>
    </Dialog>
  );
}