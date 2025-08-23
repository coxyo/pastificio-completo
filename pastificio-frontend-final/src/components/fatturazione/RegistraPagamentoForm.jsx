// components/fatturazione/RegistraPagamentoForm.jsx
import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem,
  Grid
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { it } from 'date-fns/locale';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

import { registraPagamento } from '../../services/fattureService';

const RegistraPagamentoForm = ({ fattura, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    data: new Date(),
    importo: fattura.residuo || (fattura.totale - fattura.pagamenti?.reduce((sum, p) => sum + p.importo, 0) || 0),
    metodo: 'Bonifico',
    note: '',
    riferimento: ''
  });
  
  // Formattazione importi
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  // Calcolo residuo
  const residuo = fattura.totale - (fattura.pagamenti?.reduce((sum, p) => sum + p.importo, 0) || 0);
  
  // Gestione input form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'importo' ? parseFloat(value) || 0 : value
    }));
  };
  
  // Gestione data
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      data: date
    }));
  };
  
  // Invio form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazione
    if (!formData.data) {
      toast.error('Inserisci una data valida');
      return;
    }
    
    if (formData.importo <= 0) {
      toast.error('L\'importo deve essere maggiore di zero');
      return;
    }
    
    if (formData.importo > residuo) {
      toast.error(`L'importo non può essere maggiore del residuo (${formatCurrency(residuo)})`);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await registraPagamento(fattura._id, formData);
      
      if (response.success) {
        toast.success('Pagamento registrato con successo');
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || 'Errore nella registrazione del pagamento');
      }
    } catch (error) {
      toast.error('Errore nella registrazione del pagamento');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Fattura: {fattura.numero} del {format(new Date(fattura.data), 'dd/MM/yyyy')}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        Cliente: {fattura.cliente?.ragioneSociale || 
                  `${fattura.cliente?.nome || ''} ${fattura.cliente?.cognome || ''}`}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        Totale Fattura: {formatCurrency(fattura.totale)}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        Residuo da Pagare: {formatCurrency(residuo)}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
              <DatePicker
                label="Data Pagamento"
                value={formData.data}
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Importo"
              name="importo"
              type="number"
              inputProps={{ min: 0.01, step: 0.01, max: residuo }}
              value={formData.importo}
              onChange={handleInputChange}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel id="metodo-label">Metodo di Pagamento</InputLabel>
              <Select
                labelId="metodo-label"
                name="metodo"
                value={formData.metodo}
                onChange={handleInputChange}
                label="Metodo di Pagamento"
              >
                <MenuItem value="Contanti">Contanti</MenuItem>
                <MenuItem value="Bonifico">Bonifico</MenuItem>
                <MenuItem value="Assegno">Assegno</MenuItem>
                <MenuItem value="Carta">Carta di Credito</MenuItem>
                <MenuItem value="Altro">Altro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Riferimento"
              name="riferimento"
              value={formData.riferimento}
              onChange={handleInputChange}
              placeholder="Es. ID transazione, numero assegno..."
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Note"
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={onCancel}
                disabled={loading}
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
              >
                {loading ? 'Registrazione...' : 'Registra Pagamento'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default RegistraPagamentoForm;