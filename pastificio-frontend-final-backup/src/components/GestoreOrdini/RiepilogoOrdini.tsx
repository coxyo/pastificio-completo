import React from 'react';
import {
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Typography, Box, Button
} from '@mui/material';
import { Ordine } from '../../types';

interface RiepilogoOrdiniProps {
  ordini: Ordine[];
  onStampaRiepilogo: () => void;
}

const RiepilogoOrdini: React.FC<RiepilogoOrdiniProps> = ({
  ordini,
  onStampaRiepilogo
}) => {
  return (
    <Box>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Riepilogo Ordini</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Data Ritiro</TableCell>
              <TableCell>Ora Ritiro</TableCell>
              <TableCell>Prodotti</TableCell>
              <TableCell align="right">Totale</TableCell>
              <TableCell>Da Viaggio</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Stato</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordini.map((ordine) => (
              <TableRow key={ordine.id}>
                <TableCell>{ordine.nomeCliente}</TableCell>
                <TableCell>{ordine.dataRitiro}</TableCell>
                <TableCell>{ordine.oraRitiro}</TableCell>
                <TableCell>
                  {ordine.prodotti.map(p => 
                    `${p.prodotto} (${p.quantita} ${p.unita})${p.note ? ` - ${p.note}` : ''}`
                  ).join(', ')}
                </TableCell>
                <TableCell align="right">
                  {ordine.prodotti.reduce((sum, p) => sum + p.prezzo, 0).toFixed(2)} €
                </TableCell>
                <TableCell>{ordine.daViaggio ? 'SI' : '-'}</TableCell>
                <TableCell>{ordine.note}</TableCell>
                <TableCell>{ordine.stato}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2 }}>
        <Button 
          variant="contained" 
          onClick={onStampaRiepilogo}
          sx={{ mr: 2 }}
        >
          Stampa Riepilogo Giornaliero
        </Button>
      </Box>
    </Box>
  );
};

export default RiepilogoOrdini;