import React from 'react';
import {
  TextField, FormControlLabel, Checkbox, Button,
  Box, Typography
} from '@mui/material';

interface DettagliOrdineProps {
  dataRitiro: string;
  onChangeData: (data: string) => void;
  oraRitiro: string;
  onChangeOra: (ora: string) => void;
  nomeCliente: string;
  onChangeNome: (nome: string) => void;
  daViaggio: boolean;
  onChangeViaggio: (viaggio: boolean) => void;
  telefono: string;
  onChangeTelefono: (telefono: string) => void;
  note: string;
  onChangeNote: (note: string) => void;
  onConferma: () => void;
}

const DettagliOrdine: React.FC<DettagliOrdineProps> = ({
  dataRitiro,
  onChangeData,
  oraRitiro,
  onChangeOra,
  nomeCliente,
  onChangeNome,
  daViaggio,
  onChangeViaggio,
  telefono,
  onChangeTelefono,
  note,
  onChangeNote,
  onConferma
}) => {
  return (
    <Box>
      <Typography variant="h5" sx={{ mt: 4 }}>Dettagli Ordine</Typography>
      <form onSubmit={(e) => { e.preventDefault(); onConferma(); }}>
        <TextField
          fullWidth
          margin="normal"
          label="Data Ritiro"
          type="date"
          value={dataRitiro}
          onChange={(e) => onChangeData(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Ora Ritiro"
          type="time"
          value={oraRitiro}
          onChange={(e) => onChangeOra(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ step: 300 }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Nome Cliente"
          value={nomeCliente}
          onChange={(e) => onChangeNome(e.target.value)}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={daViaggio}
              onChange={(e) => onChangeViaggio(e.target.checked)}
            />
          }
          label="Da Viaggio"
        />

        <TextField
          fullWidth
          margin="normal"
          label="Telefono"
          value={telefono}
          onChange={(e) => onChangeTelefono(e.target.value)}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Note"
          multiline
          rows={3}
          value={note}
          onChange={(e) => onChangeNote(e.target.value)}
        />

        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Conferma Ordine
        </Button>
      </form>
    </Box>
  );
};

export default DettagliOrdine;