import React from 'react';
import {
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, IconButton, Typography, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProdottoOrdine } from '../../types';

interface CarrelloOrdineProps {
  carrello: ProdottoOrdine[];
  onRimuovi: (index: number) => void;
  onSvuota: () => void;
  totale: number;
}

const CarrelloOrdine: React.FC<CarrelloOrdineProps> = ({
  carrello,
  onRimuovi,
  onSvuota,
  totale
}) => {
  return (
    <>
      <Typography variant="h5" sx={{ mt: 4 }}>Carrello</Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Prodotto</TableCell>
              <TableCell align="right">Quantità</TableCell>
              <TableCell align="right">Prezzo</TableCell>
              <TableCell>Note</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {carrello.map((prodotto, index) => (
              <TableRow key={index}>
                <TableCell>{prodotto.prodotto}</TableCell>
                <TableCell align="right">{prodotto.quantita} {prodotto.unita}</TableCell>
                <TableCell align="right">{prodotto.prezzo.toFixed(2)} €</TableCell>
                <TableCell>{prodotto.note}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onRimuovi(index)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Totale Carrello: {totale.toFixed(2)} €
      </Typography>

      <Button 
        variant="outlined" 
        color="secondary" 
        onClick={onSvuota} 
        sx={{ mt: 2 }}
      >
        Svuota Carrello
      </Button>
    </>
  );
};

export default CarrelloOrdine;